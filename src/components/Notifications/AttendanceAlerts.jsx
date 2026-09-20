import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AttachFileRounded,
  CheckCircleRounded,
  EventBusyRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import {
  fetchNotifications,
  markNotificationRead,
} from "@/APIs/school/notifications";

import {
  fetchPendingLateReason,
  submitLateReason,
} from "@/APIs/school/teacherAttendance";

import {
  fetchPendingExcuses,
  submitAbsenceExcuse,
  uploadExcuseAttachment,
} from "@/APIs/school/absenceExcuses";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

import {
  getAuthToken,
  getStoredRole,
  getStoredUser,
} from "@/shared/auth/session";

/*
 * The two things nobody should have to go looking for.
 *
 * A notice in a bell is read when somebody opens the bell, and both of these
 * are worthless read late. A teacher asked at noon why they were late at seven
 * has forgotten. A parent who learns on Thursday that their child missed
 * Sunday learns it too late to do anything about it.
 *
 * So they interrupt — but not all in the same way, because they are not the
 * same kind of message:
 *
 *   teacher   a dialog. Something is being asked of them, and the school is
 *             waiting on the answer.
 *   student   a dialog. The parent signs in as their child and may open the
 *             site once a week; a badge would be missed.
 *   admin     a toast. They are being informed, not asked, and on a bad
 *             morning there are six of these — a modal each would be an
 *             obstacle course between them and their work.
 *
 * Mounted once in App, above the router, so it survives navigation and there
 * is exactly one poller rather than one per screen.
 */

/**
 * Fired by whoever records a check-in that came in late, so the dialog opens
 * on the spot instead of on the next poll — a minute after the teacher has put
 * the phone away.
 */
export const LATE_REASON_EVENT = "nasaq:late-reason-check";

const POLL_MS = 60_000;
const SEEN_PREFIX = "nasaq:attendance-alert-seen:";
const SEEN_LIMIT = 200;

/** Interrupts the admin as a toast. */
const ADMIN_ALERT_TYPES = ["teacher_late", "late_reason_submitted"];

const ADMIN_ROLES = [ROLES.OWNER, ROLES.MANAGER, ROLES.SUPERVISOR];

const idOf = (value) => String(value?._id || value?.id || "").trim();

const loadSeen = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
};

const saveSeen = (key, seen) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(Array.from(seen).slice(-SEEN_LIMIT))
    );
  } catch {
    // Best-effort. Losing it costs one repeated toast, not a missed notice.
  }
};

const AttendanceAlerts = () => {
  const role = normalizeRole(getStoredRole());
  const user = getStoredUser();
  const signedIn = Boolean(getAuthToken());

  const isTeacher = signedIn && role === ROLES.TEACHER;
  const isStudent = signedIn && role === ROLES.STUDENT;
  const isAdmin = signedIn && ADMIN_ROLES.includes(role);

  const seenKey = useMemo(
    () => `${SEEN_PREFIX}${idOf(user) || role || "anon"}`,
    [user, role]
  );

  // The lateness this teacher has not explained yet.
  const [lateness, setLateness] = useState(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [reasonError, setReasonError] = useState("");

  // The absence a parent has not been shown yet.
  const [absence, setAbsence] = useState(null);

  // The family's answer, written in the same dialog that asks for it.
  //
  // Asking on one screen and answering on another is how a question goes
  // unanswered: the parent reads the notice on the way to work, and the form
  // they were meant to find later is never found.
  const [excuse, setExcuse] = useState("");
  const [excuseError, setExcuseError] = useState("");
  const [attachment, setAttachment] = useState(null); // { name, path }
  const [uploading, setUploading] = useState(false);
  const [sendingExcuse, setSendingExcuse] = useState(false);

  // Cleared only on a fresh mount, so a dismissed dialog stays dismissed for
  // this visit without being written down as answered.
  const dismissed = useRef(new Set());

  const checkTeacher = useCallback(async () => {
    const response = await fetchPendingLateReason();
    const data = response?.data;

    if (response?.status === false || !data?.pending) {
      setLateness(null);
      return;
    }

    if (dismissed.current.has(data.attendanceId)) return;
    setLateness(data);
  }, []);

  /**
   * Absences the school is still waiting on, straight from the server.
   *
   * The notification alone cannot carry this. A parent who taps «لاحقًا» once
   * would never be asked again — the notice is read, and a read notice is
   * gone. The record, on the other hand, keeps saying no answer arrived.
   */
  const checkOwedExcuses = useCallback(async () => {
    const response = await fetchPendingExcuses();
    const data = response?.data;
    if (response?.status === false || !data?.pending) return null;

    const owed = (data.items ?? []).find(
      (item) => !dismissed.current.has(item.attendanceId)
    );
    if (!owed) return null;

    // Shaped like a notice so the dialog needs no second code path.
    return {
      _id: `owed-${owed.attendanceId}`,
      title: "غياب بانتظار العذر",
      body:
        "نأمل إيضاح سبب غياب ابنكم/ابنتكم عن المدرسة، " +
        "مع إرفاق العذر الطبي في حال وجوده.\n\nشاكرين لكم تعاونكم 🌷",
      data: {
        attendanceId: owed.attendanceId,
        date: owed.date,
        className: owed.className,
      },
    };
  }, []);

  const checkNotices = useCallback(async () => {
    const response = await fetchNotifications({ unreadOnly: true, limit: 20 });
    if (response?.status === false) return;

    const items = response?.data?.items ?? [];
    if (items.length === 0) return;

    const seen = loadSeen(seenKey);
    let changed = false;

    if (isStudent) {
      // The newest unseen absence only. A student back after a week away
      // should not have to close five dialogs to reach their timetable; the
      // rest are waiting in the bell.
      const pending = items.find(
        (item) => item.type === "student_absent" && !seen.has(idOf(item))
      );
      if (pending && !dismissed.current.has(pending?.data?.attendanceId)) {
        setAbsence(pending);
        return;
      }

      // Nothing unread, which does not mean nothing is owed: yesterday's
      // notice was read and its absence is still unexplained.
      const owed = await checkOwedExcuses();
      if (owed) setAbsence(owed);
      return;
    }

    items
      .filter(
        (item) =>
          ADMIN_ALERT_TYPES.includes(item.type) && !seen.has(idOf(item))
      )
      // Oldest first, so the newest toast ends up on top of the stack.
      .reverse()
      .forEach((item) => {
        toast.info(
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#4a5560", mt: 0.3 }}>
              {item.body}
            </Typography>
          </Box>,
          { autoClose: 8000 }
        );

        seen.add(idOf(item));
        changed = true;
      });

    // Deliberately not marked read: the admin has been shown it, and it still
    // belongs in the bell for when they come back to it.
    if (changed) saveSeen(seenKey, seen);
  }, [isStudent, seenKey, checkOwedExcuses]);

  useEffect(() => {
    if (!signedIn) return undefined;

    const run = () => {
      if (isTeacher) checkTeacher();
      else if (isStudent || isAdmin) checkNotices();
    };

    run();
    const timer = setInterval(run, POLL_MS);

    // A teacher who just checked in late is asked immediately, and asking
    // again clears an earlier "لاحقًا" — they are back on the subject.
    const onCheckIn = () => {
      dismissed.current.clear();
      if (isTeacher) checkTeacher();
    };
    window.addEventListener(LATE_REASON_EVENT, onCheckIn);

    return () => {
      clearInterval(timer);
      window.removeEventListener(LATE_REASON_EVENT, onCheckIn);
    };
  }, [signedIn, isTeacher, isStudent, isAdmin, checkTeacher, checkNotices]);

  const sendReason = async () => {
    const text = reason.trim();

    if (text.length < 3) {
      setReasonError("يُرجى كتابة سبب التأخير");
      return;
    }

    setSending(true);
    setReasonError("");

    const response = await submitLateReason({
      reason: text,
      date: lateness?.date,
    });

    setSending(false);

    if (response?.status === false) {
      setReasonError(response?.message || "تعذر إرسال سبب التأخير");
      return;
    }

    toast.success("تم إرسال سبب التأخير إلى إدارة المدرسة");
    setLateness(null);
    setReason("");
  };

  const postponeReason = () => {
    // Asked again on the next poll of a later visit, never silently dropped —
    // the school is still waiting on an answer.
    if (lateness?.attendanceId) dismissed.current.add(lateness.attendanceId);
    setLateness(null);
  };

  const clearAbsenceForm = () => {
    setAbsence(null);
    setExcuse("");
    setExcuseError("");
    setAttachment(null);
  };

  /**
   * «لاحقًا» — put the question down without answering it.
   *
   * Nothing is written. Marking it read here is what silenced the question
   * for good: the notice would be gone and the absence would stay unexplained
   * with no way left to explain it. The record is asked again on the next
   * visit, exactly as the teacher's lateness is.
   */
  const postponeAbsence = () => {
    const pendingId = absence?.data?.attendanceId;
    if (pendingId) dismissed.current.add(pendingId);
    clearAbsenceForm();
  };

  /**
   * Close a notice there is nothing to answer — an older one, sent before
   * excuses existed. That one is filed away for good.
   */
  const closeAbsence = async () => {
    const id = idOf(absence);
    const seen = loadSeen(seenKey);
    seen.add(id);
    saveSeen(seenKey, seen);
    clearAbsenceForm();

    // Read here means seen here. Without it the same dialog returns on the
    // next device the parent signs in from.
    if (id) await markNotificationRead(id);
  };

  /** The absence this notice is about, or null for an older notice. */
  const absenceId = absence?.data?.attendanceId ?? null;

  const pickAttachment = async (event) => {
    const file = event.target.files?.[0];
    // Clear the input either way, or picking the same file twice is silent.
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const result = await uploadExcuseAttachment(file);
    setUploading(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    setAttachment({ name: file.name, path: result.data?.attachment });
  };

  const sendExcuse = async () => {
    const text = excuse.trim();

    if (text.length < 3) {
      setExcuseError("اكتب سبب الغياب");
      return;
    }

    setSendingExcuse(true);
    const result = await submitAbsenceExcuse({
      attendanceId: absenceId,
      reason: text,
      attachment: attachment?.path,
    });
    setSendingExcuse(false);

    if (!result.status) {
      // A conflict means somebody in the family already answered. Nothing is
      // wrong, and a red error would suggest otherwise.
      toast.info(result.message);
      const id = idOf(absence);
      if (id && !String(id).startsWith("owed-")) {
        const seen = loadSeen(seenKey);
        seen.add(id);
        saveSeen(seenKey, seen);
        await markNotificationRead(id);
      }
      clearAbsenceForm();
      return;
    }

    toast.success(result.message);

    // Answered, so the notice is finished with — unlike «لاحقًا».
    const id = idOf(absence);
    if (id && !String(id).startsWith("owed-")) {
      const seen = loadSeen(seenKey);
      seen.add(id);
      saveSeen(seenKey, seen);
      await markNotificationRead(id);
    }
    clearAbsenceForm();
  };

  return (
    <>
      <Dialog
        open={Boolean(lateness)}
        onClose={postponeReason}
        dir="rtl"
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#fff3d8",
                color: "#c89224",
              }}
            >
              <ScheduleRounded />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              سبب التأخير
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: "#4a5560", lineHeight: 1.9 }}>
            سُجّل تأخيرك اليوم{" "}
            <strong>{lateness?.lateMinutes ?? 0} دقيقة</strong>. يُرجى بيان
            السبب ليصل إلى إدارة المدرسة مرفقًا بسجل الحضور.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="مثال: ازدحام مروري على طريق المدرسة"
            inputProps={{ maxLength: 500 }}
            error={Boolean(reasonError)}
            helperText={reasonError || "يُرسل مرة واحدة ولا يمكن تعديله بعد ذلك."}
            sx={{ mt: 1.6 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={postponeReason} disabled={sending} sx={{ fontWeight: 800 }}>
            لاحقًا
          </Button>
          <Button
            variant="contained"
            onClick={sendReason}
            disabled={sending}
            sx={{ fontWeight: 900 }}
          >
            {sending ? "جارٍ الإرسال..." : "إرسال"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(absence)}
        onClose={absenceId ? postponeAbsence : closeAbsence}
        dir="rtl"
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#fdeaea",
                color: "#c0392b",
              }}
            >
              <EventBusyRounded />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              {absence?.title || "تم تسجيل غياب اليوم"}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ fontSize: 13.5, whiteSpace: "pre-line" }}>
            {absence?.body}
          </Alert>

          {absence?.data?.date ? (
            <Typography
              sx={{ fontSize: 12.5, color: "#6b7785", mt: 1.2 }}
            >
              تاريخ الغياب: {absence.data.date}
              {absence.data.className ? ` · ${absence.data.className}` : ""}
            </Typography>
          ) : null}

          {absenceId ? (
            <>
              <TextField
                fullWidth
                multiline
                minRows={3}
                value={excuse}
                onChange={(event) => {
                  setExcuse(event.target.value);
                  if (excuseError) setExcuseError("");
                }}
                placeholder="مثال: وعكة صحية، ومرفق التقرير الطبي"
                inputProps={{ maxLength: 1000 }}
                error={Boolean(excuseError)}
                helperText={
                  excuseError || "يُرسل مرة واحدة ولا يمكن تعديله بعد ذلك."
                }
                sx={{ mt: 1.6 }}
              />

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 0.5 }}
              >
                <Button
                  component="label"
                  size="small"
                  startIcon={
                    attachment ? <CheckCircleRounded /> : <AttachFileRounded />
                  }
                  color={attachment ? "success" : "primary"}
                  disabled={uploading || sendingExcuse}
                  sx={{ fontWeight: 800 }}
                >
                  {uploading
                    ? "جارٍ الرفع..."
                    : attachment
                      ? "تم إرفاق الملف"
                      : "إرفاق العذر الطبي"}
                  <input
                    hidden
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={pickAttachment}
                  />
                </Button>

                {attachment ? (
                  <Typography
                    noWrap
                    sx={{ fontSize: 11.5, color: "#6b7785", maxWidth: 160 }}
                  >
                    {attachment.name}
                  </Typography>
                ) : null}
              </Stack>
            </>
          ) : (
            // An older notice, sent before excuses existed, carries no record
            // to attach an answer to.
            <Typography
              sx={{ fontSize: 12.5, color: "#6b7785", mt: 1.4, lineHeight: 1.9 }}
            >
              في حال وجود عذر، يُرجى التواصل مع إدارة المدرسة.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button
            onClick={absenceId ? postponeAbsence : closeAbsence}
            disabled={sendingExcuse}
            sx={{ fontWeight: 800 }}
          >
            {absenceId ? "لاحقًا" : "حسنًا"}
          </Button>

          {absenceId ? (
            <Button
              variant="contained"
              onClick={sendExcuse}
              disabled={sendingExcuse || uploading}
              sx={{ fontWeight: 900 }}
            >
              {sendingExcuse ? "جارٍ الإرسال..." : "إرسال العذر"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AttendanceAlerts;
