import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CheckCircleRounded,
  EditNoteRounded,
  NotificationsRounded,
} from "@mui/icons-material";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/APIs/school/notifications";
import { fetchPreparations } from "@/APIs/school/preparation";

/**
 * Where a notice takes you when you tap it.
 *
 * A bell that only marks things read is a list of sentences: the manager
 * reads "عذر غياب: سارة" and then has to remember which screen holds it and
 * go find it. The notice knows; it should carry you there.
 *
 * Per role, because the same event is two different errands. A lateness sent
 * to a manager belongs in the review queue; the ruling sent back to the
 * teacher belongs on their own attendance page, and sending them to an admin
 * route would only earn them a 403.
 */
const DESTINATIONS = {
  SCHOOL_ADMIN: {
    teacher_late: "/school/late-reasons",
    late_reason_submitted: "/school/late-reasons",
    absence_excuse_submitted: "/school/absence-excuses",
    lesson_observation_explained: "/school/lesson-observations",
    student_absent: "/school/attendance",
    cover_assigned: "/school/duty",
    cover_removed: "/school/duty",
    duty_assigned: "/school/duty",
    duty_removed: "/school/duty",
    leave_approved: "/school/duty",
    leave_rejected: "/school/duty",
  },
  TEACHER: {
    late_reason_required: "/teacher/check-in",
    late_reason_reviewed: "/teacher/attendance",
    lesson_observation_recorded: "/teacher/observations",
    lesson_observation_reviewed: "/teacher/observations",
    cover_assigned: "/teacher/duty",
    cover_removed: "/teacher/duty",
    duty_assigned: "/teacher/duty",
    duty_removed: "/teacher/duty",
    leave_approved: "/teacher/duty",
    leave_rejected: "/teacher/duty",
  },
  STUDENT: {
    student_absent: "/student-dashboard/attendance",
    absence_excuse_reviewed: "/student-dashboard/attendance",
  },
};

/** Null when this notice has nowhere useful to send this person. */
const destinationFor = (type, role) => {
  if (role === "STUDENT") return DESTINATIONS.STUDENT[type] ?? null;
  if (role === "TEACHER") return DESTINATIONS.TEACHER[type] ?? null;
  return DESTINATIONS.SCHOOL_ADMIN[type] ?? null;
};

const POLL_MS = 60_000;
const REVIEW_READ_PREFIX = "nasaq:preparation-review-read:";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const getAuthEntity = (state) =>
  state?.user || state?.admin || state?.data?.user || state?.data?.admin || state || {};

const resolveTeacherId = (state) => {
  const user = getAuthEntity(state);
  return [
    state?.teacherId,
    user?.teacherId,
    user?.teacher,
    user?.profile,
    user?._id,
    user?.id,
  ]
    .map(normalizeId)
    .find(Boolean) || "";
};

const extractList = (response) => {
  let current = response;
  for (let index = 0; index < 5; index += 1) {
    if (!current || Array.isArray(current) || typeof current !== "object" || !("data" in current)) {
      break;
    }
    current = current.data;
  }
  if (Array.isArray(current)) return current;
  if (!current || typeof current !== "object") return [];
  for (const key of ["items", "docs", "results", "records", "preparations"]) {
    if (Array.isArray(current?.[key])) return current[key];
  }
  return [];
};

const reviewStatusOf = (preparation) => {
  const status = String(preparation?.reviewStatus || preparation?.status || "")
    .trim()
    .toLowerCase();
  return status === "needs_revision" || status === "approved" ? status : "";
};

const reviewTimestamp = (preparation) =>
  preparation?.reviewedAt || preparation?.updatedAt || preparation?.createdAt || "";

const lessonTitleOf = (preparation) =>
  String(
    preparation?.lessonTitle ||
      preparation?.lesson?.name ||
      preparation?.lesson?.title ||
      "التحضير"
  ).trim();

const loadReadKeys = (storageKey) => {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
};

const saveReadKeys = (storageKey, keys) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(keys).slice(-300)));
  } catch {
    // localStorage is best-effort only.
  }
};

const NotificationBell = ({
  sx,
  variant = "icon",
  anchorOrigin = {
    vertical: "bottom",
    horizontal: "left",
  },
  transformOrigin = {
    vertical: "top",
    horizontal: "left",
  },
}) => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};
  const user = getAuthEntity(authState);
  const role = normalizeRole(user?.role || authState?.role || localStorage.getItem("role"));
  const teacherId = resolveTeacherId(authState);
  const reviewStorageKey = useMemo(
    () => `${REVIEW_READ_PREFIX}${teacherId || "teacher"}`,
    [teacherId]
  );

  const [anchor, setAnchor] = useState(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPreparationReviewNotifications = useCallback(async () => {
    if (role !== "TEACHER") return [];

    const response = await fetchPreparations({
      ...(teacherId ? { teacherId } : {}),
      page: 1,
      limit: 100,
    });

    if (!response?.status) return [];

    const readKeys = loadReadKeys(reviewStorageKey);
    return extractList(response)
      .filter((preparation) => {
        if (!reviewStatusOf(preparation) || !preparation?.reviewedAt) return false;
        const reviewedTime = new Date(preparation.reviewedAt).getTime();
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return Number.isFinite(reviewedTime) && reviewedTime >= cutoff;
      })
      .map((preparation) => {
        const preparationId = normalizeId(preparation);
        const status = reviewStatusOf(preparation);
        const reviewedAt = reviewTimestamp(preparation);
        const key = `preparation-review:${preparationId}:${status}:${reviewedAt}`;
        const needsRevision = status === "needs_revision";
        const reviewNote = String(preparation?.reviewNote || "").trim();
        const reviewer = String(preparation?.reviewedByName || "").trim();

        return {
          _id: key,
          source: "preparation_review",
          preparationId,
          read: readKeys.has(key),
          title: needsRevision ? "التحضير يحتاج تعديل" : "تم اعتماد التحضير",
          body: needsRevision
            ? `${lessonTitleOf(preparation)}${reviewNote ? ` — ${reviewNote}` : " — افتح التحضير لمعرفة المطلوب"}`
            : `${lessonTitleOf(preparation)}${reviewer ? ` — اعتمده ${reviewer}` : ""}`,
          createdAt: reviewedAt,
          href: `/teacher/preparations/${preparationId}`,
          status,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 25);
  }, [role, teacherId, reviewStorageKey]);

  const refreshCount = useCallback(async () => {
    const [backendResponse, reviewItems] = await Promise.all([
      fetchUnreadCount(),
      fetchPreparationReviewNotifications(),
    ]);

    const backendUnread = backendResponse?.status
      ? Number(backendResponse.data?.unread ?? 0)
      : 0;
    const reviewUnread = reviewItems.filter((item) => !item.read).length;
    setUnread(backendUnread + reviewUnread);
  }, [fetchPreparationReviewNotifications]);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  const open = async (event) => {
    setAnchor(event.currentTarget);
    setLoading(true);

    const [backendResponse, reviewItems] = await Promise.all([
      fetchNotifications({ limit: 30 }),
      fetchPreparationReviewNotifications(),
    ]);

    const backendItems = backendResponse?.status
      ? backendResponse.data?.items ?? []
      : [];

    const merged = [...reviewItems, ...backendItems].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });

    setItems(merged);
    const backendUnread = backendResponse?.status
      ? Number(backendResponse.data?.unread ?? 0)
      : 0;
    setUnread(backendUnread + reviewItems.filter((item) => !item.read).length);
    setLoading(false);
  };

  const markLocalReviewRead = (item) => {
    const keys = loadReadKeys(reviewStorageKey);
    keys.add(item._id);
    saveReadKeys(reviewStorageKey, keys);
  };

  const readOne = async (item) => {
    const wasUnread = !item.read;

    setItems((previous) =>
      previous.map((row) =>
        row._id === item._id ? { ...row, read: true } : row
      )
    );
    if (wasUnread) setUnread((previous) => Math.max(0, previous - 1));

    if (item.source === "preparation_review") {
      markLocalReviewRead(item);
      setAnchor(null);
      if (item.href) navigate(item.href);
      return;
    }

    if (wasUnread) {
      const response = await markNotificationRead(item._id);
      if (!response?.status) refreshCount();
    }

    // Marking it read is not, on its own, something the user can see happen.
    // Where the notice points is.
    const destination = destinationFor(item.type, role);
    if (destination) {
      setAnchor(null);
      navigate(destination);
    }
  };

  const readAll = async () => {
    const reviewKeys = loadReadKeys(reviewStorageKey);
    items
      .filter((item) => item.source === "preparation_review")
      .forEach((item) => reviewKeys.add(item._id));
    saveReadKeys(reviewStorageKey, reviewKeys);

    setItems((previous) => previous.map((row) => ({ ...row, read: true })));
    setUnread(0);

    const response = await markAllNotificationsRead();
    if (!response?.status) refreshCount();
  };

  const sidebarTrigger = variant === "sidebar";

  return (
    <>
      {sidebarTrigger ? (
        <Box
          component="button"
          type="button"
          onClick={open}
          aria-label="الإشعارات"
          sx={{
            width: "100%",
            minHeight: 48,
            px: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "var(--color-text)",
            backgroundColor: "rgba(255,255,255,0.68)",
            border: "1px solid rgba(36,74,112,0.06)",
            borderRadius: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "right",
            transition: "color .2s ease, background-color .2s ease, border-color .2s ease, transform .2s ease",
            "&:hover": {
              color: "var(--color-navy-deep)",
              backgroundColor: "var(--color-gold-soft)",
              borderColor: "rgba(211,164,79,0.22)",
              transform: "translateX(-2px)",
            },
            ...sx,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "var(--color-navy)",
              backgroundColor: "var(--color-white)",
              border: "1px solid rgba(36,74,112,0.08)",
              borderRadius: "11px",
            }}
          >
            <Badge badgeContent={unread} color="error" max={99}>
              <NotificationsRounded sx={{ fontSize: 19 }} />
            </Badge>
          </Box>

          <Typography
            component="span"
            sx={{ fontSize: 12.5, fontWeight: 700 }}
          >
            الإشعارات
          </Typography>
        </Box>
      ) : (
        <Tooltip title="الإشعارات">
          <IconButton
            onClick={open}
            aria-label="الإشعارات"
            sx={{ width: 40, height: 40, color: "#244a70", ...sx }}
          >
            <Badge badgeContent={unread} color="error" max={99}>
              <NotificationsRounded />
            </Badge>
          </IconButton>
        </Tooltip>
      )}

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{ paper: { sx: { width: 380, maxWidth: "calc(100vw - 24px)", maxHeight: 500, borderRadius: 2.5 } } }}
      >
        <Box dir="rtl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                الإشعارات
              </Typography>
              {role === "TEACHER" ? (
                <Typography variant="caption" color="text.secondary">
                  تشمل قرارات مراجعة التحضير
                </Typography>
              ) : null}
            </Box>
            {unread > 0 && (
              <Button size="small" onClick={readAll} sx={{ fontWeight: 800 }}>
                تعليم الكل كمقروء
              </Button>
            )}
          </Stack>
          <Divider />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 4, textAlign: "center" }}
            >
             لا يوجدإشعارات.
            </Typography>
          ) : (
            <List dense disablePadding>
              {items.map((item) => {
                const reviewNotification = item.source === "preparation_review";
                return (
                  <ListItemButton
                    key={item._id}
                    onClick={() => readOne(item)}
                    sx={{
                      alignItems: "flex-start",
                      gap: 0.8,
                      py: 1.15,
                      bgcolor: item.read ? "transparent" : "rgba(36,74,112,0.06)",
                    }}
                  >
                    {reviewNotification ? (
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          display: "grid",
                          placeItems: "center",
                          mt: 0.25,
                          flexShrink: 0,
                          bgcolor: item.status === "needs_revision" ? "#fff3d8" : "#eaf7f1",
                          color: item.status === "needs_revision" ? "#c89224" : "#18865d",
                        }}
                      >
                        {item.status === "needs_revision" ? (
                          <EditNoteRounded sx={{ fontSize: 18 }} />
                        ) : (
                          <CheckCircleRounded sx={{ fontSize: 18 }} />
                        )}
                      </Box>
                    ) : null}
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={item.read ? 500 : 800}>
                          {item.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {item.body}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
