import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EventBusyRounded,
  RefreshRounded,
} from "@mui/icons-material";

import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import usePermissions from "@/utils/hooks/usePermissions";
import {
  createStaffLeaveRequest,
  deleteStaffLeaveRequest,
  fetchStaffDirectory,
  fetchStaffLeaveRequests,
  reviewStaffLeaveRequest,
} from "@/APIs/school/staffAttendance";

const STATUS_LABELS = {
  pending: "في انتظار الرد",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") return String(value._id || value.id || "").trim();
  return String(value || "").trim();
};

const staffOptionId = (item) =>
  normalizeId(
    item?.staffId ||
      item?.staff ||
      item?.adminId ||
      item?.admin ||
      item?.userId ||
      item?._id ||
      item?.id ||
      ""
  );

const todayKey = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const extractRows = (response) => {
  if (!response || response?.status === false) return [];
  let payload = response?.data ?? response;
  for (let index = 0; index < 4; index += 1) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    for (const key of [
      "items",
      "docs",
      "results",
      "requests",
      "staffMembers",
      "staff",
      "admins",
      "members",
      "users",
      "data",
    ]) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }
    if (payload?.data && typeof payload.data === "object") {
      payload = payload.data;
      continue;
    }
    break;
  }
  return [];
};

const displayStaffName = (row) => {
  const staff = row?.staffId || row?.staff || row?.adminId || row?.admin || row?.userId || {};
  if (typeof staff === "string") return row?.staffName || "إداري / مشرف";
  return (
    row?.staffName ||
    row?.name ||
    row?.fullName ||
    row?.username ||
    row?.email ||
    staff?.name ||
    staff?.fullName ||
    staff?.username ||
    staff?.email ||
    "إداري / مشرف"
  );
};

const displayStaffRole = (row) => {
  const role = String(
    row?.role ||
      row?.staffId?.role ||
      row?.staff?.role ||
      row?.adminId?.role ||
      row?.admin?.role ||
      row?.userId?.role ||
      ""
  ).toUpperCase();
  if (role === "SUPERVISOR") return "مشرف";
  if (role === "MANAGER") return "مدير / إداري";
  return "إداري / مشرف";
};

const StaffLeaveRequests = ({ personal = false }) => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};
  const user = authState?.user || authState?.admin || authState || {};
  const role = String(user?.role || authState?.role || "").trim().toUpperCase();
  const currentUserId = normalizeId(user?.userId || user?._id || user?.id || user?.sub);

  const permissions = usePermissions("staffAttendance");
  const canReview = !personal && Boolean(permissions.edit) && role !== "SUPERVISOR";
  const canDeleteAny = !personal && Boolean(permissions.delete);
  const canCreateForOthers = !personal && ["OWNER", "MANAGER"].includes(role);
  const ownOnly = personal || role === "SUPERVISOR";

  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [staffId, setStaffId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: todayKey(),
    leaveAt: "",
    reason: "",
    staffId: "",
  });

  const [decision, setDecision] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (ownOnly) return undefined;
    let active = true;
    fetchStaffDirectory().then((response) => {
      if (!active) return;
      if (response?.status === false) {
        setStaff([]);
        toast.error(response?.message || "تعذر تحميل قائمة الإداريين والمشرفين");
        return;
      }
      setStaff(extractRows(response));
    });
    return () => {
      active = false;
    };
  }, [ownOnly]);

  const load = useCallback(async () => {
    if (personal && role === "MANAGER" && !currentUserId) {
      setRows([]);
      setLoading(false);
      toast.error("تعذر تحديد حساب الموظف الحالي");
      return;
    }

    if (from && to && from > to) {
      toast.error("تاريخ البداية يجب أن يكون قبل أو مساويًا لتاريخ النهاية");
      return;
    }

    setLoading(true);
    const response = await fetchStaffLeaveRequests({
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      staffId: ownOnly ? currentUserId || undefined : staffId || undefined,
    });

    if (response?.status === false) {
      setRows([]);
      toast.error(response?.message || "تعذر تحميل طلبات الاستئذان");
    } else {
      setRows(extractRows(response));
    }
    setLoading(false);
  }, [status, from, to, ownOnly, currentUserId, staffId, personal, role]);

  useEffect(() => {
    load();
  }, [load]);

  const staffOptions = useMemo(
    () =>
      staff
        .map((item) => ({ id: staffOptionId(item), name: displayStaffName(item) }))
        .filter((item) => item.id)
        .sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [staff]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row?.status === "pending").length,
      approved: rows.filter((row) => row?.status === "approved").length,
      rejected: rows.filter((row) => row?.status === "rejected").length,
    }),
    [rows]
  );

  const openCreate = () => {
    setCreateForm({
      date: todayKey(),
      leaveAt: "",
      reason: "",
      staffId: canCreateForOthers ? "" : currentUserId,
    });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createForm.date || !createForm.leaveAt) {
      toast.error("التاريخ ووقت الاستئذان مطلوبان");
      return;
    }
    if (canCreateForOthers && !createForm.staffId) {
      toast.error("اختر الإداري / المشرف");
      return;
    }

    setBusy(true);
    const response = await createStaffLeaveRequest({
      date: createForm.date,
      leaveAt: createForm.leaveAt,
      reason: createForm.reason,
      ...(canCreateForOthers && createForm.staffId
        ? { staffId: createForm.staffId }
        : {}),
    });
    setBusy(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر إرسال طلب الاستئذان");
      return;
    }

    toast.success(response?.message || "تم حفظ طلب الاستئذان");
    setCreateOpen(false);
    load();
  };

  const submitDecision = async () => {
    if (!decision) return;
    if (decision.status === "rejected" && !reviewNote.trim()) {
      toast.error("سبب الرفض مطلوب");
      return;
    }

    setBusy(true);
    const response = await reviewStaffLeaveRequest(normalizeId(decision.row), {
      status: decision.status,
      reviewNote,
    });
    setBusy(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حفظ القرار");
      return;
    }

    toast.success(response?.message || "تم حفظ القرار");
    setDecision(null);
    setReviewNote("");
    load();
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const response = await deleteStaffLeaveRequest(normalizeId(deleteTarget));
    setBusy(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر سحب الطلب");
      return;
    }

    toast.success(response?.message || "تم سحب الطلب");
    setDeleteTarget(null);
    load();
  };

  return (
    <Container>
      <Stack spacing={1.5} sx={{ py: 2 }} dir="rtl">
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            border: "1px solid rgba(36,74,112,.09)",
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.45))",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.2}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <EventBusyRounded sx={{ color: "#B78430" }} />
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#122F4D" }}>
                  {personal ? "استئذاناتي" : "استئذانات الإداريين والمشرفين"}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.35, fontSize: 11, color: "#708198" }}>
                {personal
                  ? "قدّم طلب خروج مبكر وتابع قرار الإدارة."
                  : "راجع طلبات الخروج المبكر أو سجّل طلبًا نيابةً عن موظف."}
              </Typography>
            </Box>

            <Stack direction="row" gap={0.8}>
              <Button startIcon={<RefreshRounded />} onClick={load} disabled={loading}>
                تحديث
              </Button>
              <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>
                {canCreateForOthers ? "طلب لموظف" : "طلب استئذان"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1,
          }}
        >
          {[
            ["الإجمالي", stats.total],
            ["بانتظار الرد", stats.pending],
            ["موافق عليها", stats.approved],
            ["مرفوضة", stats.rejected],
          ].map(([label, value]) => (
            <Paper key={label} variant="outlined" sx={{ p: 1.2, borderRadius: "14px" }}>
              <Typography sx={{ fontSize: 10, color: "#708198", fontWeight: 800 }}>{label}</Typography>
              <Typography sx={{ fontSize: 21, color: "#122F4D", fontWeight: 900 }}>{value}</Typography>
            </Paper>
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: 1.4, borderRadius: "14px" }}>
          <Stack direction={{ xs: "column", lg: "row" }} gap={1} alignItems={{ lg: "center" }}>
            <TextField
              select
              size="small"
              label="الحالة"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">كل الحالات</MenuItem>
              <MenuItem value="pending">في انتظار الرد</MenuItem>
              <MenuItem value="approved">موافق عليه</MenuItem>
              <MenuItem value="rejected">مرفوض</MenuItem>
            </TextField>

            {!ownOnly ? (
              <TextField
                select
                size="small"
                label="الإداري / المشرف"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">الكل</MenuItem>
                {staffOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>
            ) : null}

            <TextField
              type="date"
              size="small"
              label="من"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              label="إلى"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Paper>

        {loading ? (
          <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: "14px" }}>
            <Typography color="text.secondary">لا توجد طلبات استئذان مطابقة.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {rows.map((row, index) => {
              const id = normalizeId(row) || `${row?.date}-${index}`;
              const isOwn = normalizeId(row?.staffId || row?.staff) === currentUserId;
              const pending = row?.status === "pending";
              const canRemove = pending && (
                (personal && Boolean(permissions.delete)) ||
                (!personal && (role === "SUPERVISOR" || canDeleteAny))
              );
              const showReview = canReview && pending && !isOwn;

              return (
                <Paper key={id} variant="outlined" sx={{ p: 1.5, borderRadius: "14px" }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" gap={0.8} flexWrap="wrap">
                      {!personal ? (
                        <Typography sx={{ fontWeight: 900, color: "#122F4D" }}>
                          {displayStaffName(row)}
                        </Typography>
                      ) : null}
                      {!personal ? <Chip size="small" label={displayStaffRole(row)} /> : null}
                      <Chip size="small" label={row?.date || "—"} />
                      <Chip size="small" label={`الانصراف ${String(row?.leaveAt || "—").slice(0, 5)}`} />
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        size="small"
                        color={STATUS_COLORS[row?.status] || "default"}
                        label={STATUS_LABELS[row?.status] || row?.status || "—"}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>

                    {row?.reason ? (
                      <Typography sx={{ fontSize: 13.5 }}>{row.reason}</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>بدون سبب مضاف.</Typography>
                    )}

                    {row?.reviewNote ? (
                      <Alert severity={row?.status === "rejected" ? "error" : "info"} sx={{ fontSize: 12 }}>
                        ملاحظة المراجعة: {row.reviewNote}
                      </Alert>
                    ) : null}

                    {(showReview || canRemove) ? (
                      <Stack direction="row" gap={0.8} flexWrap="wrap">
                        {showReview ? (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="contained"
                              startIcon={<CheckCircleRounded />}
                              onClick={() => {
                                setDecision({ row, status: "approved" });
                                setReviewNote("");
                              }}
                            >
                              موافقة
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<CloseRounded />}
                              onClick={() => {
                                setDecision({ row, status: "rejected" });
                                setReviewNote("");
                              }}
                            >
                              رفض
                            </Button>
                          </>
                        ) : null}

                        {canRemove ? (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineRounded />}
                            onClick={() => setDeleteTarget(row)}
                          >
                            سحب الطلب
                          </Button>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Dialog open={createOpen} onClose={() => !busy && setCreateOpen(false)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {canCreateForOthers ? "تسجيل استئذان لموظف" : "طلب استئذان"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.3} sx={{ pt: 0.5 }}>
            {canCreateForOthers ? (
              <TextField
                select
                label="الإداري / المشرف"
                value={createForm.staffId}
                onChange={(event) => setCreateForm((current) => ({ ...current, staffId: event.target.value }))}
                fullWidth
                size="small"
              >
                <MenuItem value="">اختر الموظف</MenuItem>
                {staffOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>
            ) : null}

            <TextField
              type="date"
              label="التاريخ"
              value={createForm.date}
              onChange={(event) => setCreateForm((current) => ({ ...current, date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              type="time"
              label="وقت الاستئذان"
              value={createForm.leaveAt}
              onChange={(event) => setCreateForm((current) => ({ ...current, leaveAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              multiline
              minRows={3}
              label="السبب (اختياري)"
              value={createForm.reason}
              onChange={(event) => setCreateForm((current) => ({ ...current, reason: event.target.value }))}
              fullWidth
              size="small"
            />
            <Alert severity="info" sx={{ fontSize: 12 }}>
              إذا كان هناك طلب آخر لنفس اليوم ولم يُحسم بعد، سيتم تحديثه بدل إنشاء طلب ثانٍ.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={busy}>إلغاء</Button>
          <Button variant="contained" onClick={submitCreate} disabled={busy}>
            {busy ? "جارٍ الحفظ…" : "حفظ الطلب"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(decision)} onClose={() => !busy && setDecision(null)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {decision?.status === "rejected" ? "رفض الاستئذان" : "الموافقة على الاستئذان"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {displayStaffName(decision?.row)} · {decision?.row?.date} · {String(decision?.row?.leaveAt || "").slice(0, 5)}
            </Typography>
            <TextField
              multiline
              minRows={3}
              label={decision?.status === "rejected" ? "سبب الرفض (مطلوب)" : "ملاحظة (اختيارية)"}
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              error={decision?.status === "rejected" && !reviewNote.trim()}
              helperText={decision?.status === "rejected" && !reviewNote.trim() ? "الرفض يحتاج سببًا واضحًا" : " "}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDecision(null)} disabled={busy}>إلغاء</Button>
          <Button
            variant="contained"
            color={decision?.status === "rejected" ? "error" : "success"}
            onClick={submitDecision}
            disabled={busy || (decision?.status === "rejected" && !reviewNote.trim())}
          >
            {busy ? "جارٍ الحفظ…" : "تأكيد"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !busy && setDeleteTarget(null)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>سحب طلب الاستئذان</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            يمكن سحب الطلب فقط وهو في حالة الانتظار. الطلبات التي تم اعتمادها أو رفضها لا تُحذف.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={busy}>إلغاء</Button>
          <Button color="error" variant="contained" onClick={submitDelete} disabled={busy}>
            {busy ? "جارٍ السحب…" : "سحب الطلب"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffLeaveRequests;
