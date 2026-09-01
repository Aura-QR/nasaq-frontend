import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  CheckRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EventAvailableRounded,
  HourglassBottomRounded,
  RefreshRounded,
  RestartAltRounded,
  TaskAltRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import AppContainer from "@/components/Container/Container";

import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequests,
  LEAVE_STATUS_LABELS,
  reviewLeaveRequest,
  toDateInput,
} from "@/APIs/school/duty";
import { getSchoolTeachersList } from "@/APIs/school/teachers";

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const EMPTY_CREATE_FORM = {
  teacherId: "",
  date: toDateInput(),
  leaveAt: "",
  fromSlot: "",
  reason: "",
};

/**
 * مراجعة الاستئذانات.
 *
 * الموافقة مش مجاملة: هي اللي بتخلي الانصراف المبكر يتسجّل كمسموح بدل مخالفة،
 * وهي اللي بتقول للوحة الاحتياطي أنهي حصص محتاجة بديل.
 */
const LeaveRequests = () => {
  const [status, setStatus] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [from, setFrom] = useState(() => toDateInput());
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    const response = await fetchLeaveRequests({
      status: status || undefined,
      teacherId: teacherId || undefined,
      from: from || undefined,
      to: to || undefined,
    });

    if (response.status) {
      setRows(Array.isArray(response.data) ? response.data : []);
    } else {
      setRows([]);
      toast.error(response.message);
    }

    setLoading(false);
  }, [status, teacherId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;

    const loadTeachers = async () => {
      setTeachersLoading(true);
      const response = await getSchoolTeachersList();

      if (!active) return;

      if (response?.status) {
        const teacherRows = Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? [];

        setTeachers(
          teacherRows
            .map((teacher) => ({
              id: String(teacher.id || teacher._id || "").trim(),
              name: String(teacher.fullName || teacher.name || "").trim(),
            }))
            .filter((teacher) => teacher.id && teacher.name)
        );
      } else {
        setTeachers([]);
        toast.error(response?.message || "تعذر تحميل قائمة المعلمين");
      }

      setTeachersLoading(false);
    };

    loadTeachers();

    return () => {
      active = false;
    };
  }, []);

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [teachers]
  );

  const submitDecision = async () => {
    if (!decision) return;

    setBusy(true);
    const response = await reviewLeaveRequest(decision.row._id, {
      status: decision.status,
      reviewNote: note,
    });
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setDecision(null);
      setNote("");
      load();
    } else {
      toast.error(response.message);
    }
  };

  const submitCreate = async () => {
    if (!createForm.teacherId || !createForm.date || !createForm.leaveAt) {
      toast.error("المعلم والتاريخ ووقت الانصراف مطلوبين");
      return;
    }

    setBusy(true);
    const response = await createLeaveRequest(createForm);
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setCreateOpen(false);
      setCreateForm({ ...EMPTY_CREATE_FORM, date: toDateInput() });
      load();
    } else {
      toast.error(response.message);
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget?._id) return;

    setBusy(true);
    const response = await cancelLeaveRequest(cancelTarget._id);
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setCancelTarget(null);
      load();
    } else {
      toast.error(response.message);
    }
  };

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((row) => row.status === "pending").length,
    approved: rows.filter((row) => row.status === "approved").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
  }), [rows]);

  const activeFiltersCount = [status, teacherId, from, to].filter(Boolean).length;

  const resetFilters = () => {
    setStatus("");
    setTeacherId("");
    setFrom(toDateInput());
    setTo("");
  };

  return (
    <AppContainer>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
          pb: 4,
          color: "var(--color-text)",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 2.4 },
            py: 1.6,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow: "0 10px 24px rgba(18,47,77,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "21px", md: "25px" },
                    fontWeight: 800,
                  }}
                >
                  طلبات الاستئذان
                </Typography>
                <Chip
                  label={stats.total}
                  size="small"
                  sx={{
                    color: "var(--color-gold-dark)",
                    bgcolor: "var(--color-gold-soft)",
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 0.45, color: "var(--color-muted)", fontSize: "11px" }}>
                راجع الطلبات، وافق أو ارفض، وحدد من أي حصة يبدأ الاستئذان.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setCreateOpen(true)}
              disabled={teachersLoading}
              sx={{ minHeight: 42, borderRadius: "12px", fontWeight: 800, px: 2 }}
            >
              استئذان لمعلم
            </Button>
          </Stack>
        </Paper>

        {/* Stats */}
        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
            gap: 1,
          }}
        >
          {[
            { label: "إجمالي الطلبات", value: stats.total, icon: <EventAvailableRounded /> },
            { label: "في انتظار الرد", value: stats.pending, icon: <HourglassBottomRounded /> },
            { label: "موافق عليها", value: stats.approved, icon: <TaskAltRounded /> },
            { label: "مرفوضة", value: stats.rejected, icon: <CloseRounded /> },
          ].map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={{
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                bgcolor: "var(--color-cream)",
              }}
            >
              <Box>
                <Typography sx={{ color: "var(--color-muted)", fontSize: "10px", fontWeight: 700 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ mt: 0.35, color: "var(--color-navy-deep)", fontSize: "21px", fontWeight: 800 }}>
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40, height: 40, display: "grid", placeItems: "center",
                  color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", borderRadius: "12px",
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            p: 1.6,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            bgcolor: "var(--color-cream)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.2 }}
          >
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "15px", fontWeight: 800 }}>
                البحث والتصفية
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "9.5px" }}>
                فلتر بالمعلم أو الحالة أو الفترة الزمنية.
              </Typography>
            </Box>
            <Stack direction="row" gap={0.8}>
              <Button
                type="button"
                startIcon={<RestartAltRounded />}
                onClick={resetFilters}
                disabled={!activeFiltersCount}
                sx={{ fontWeight: 800 }}
              >
                مسح الفلاتر
              </Button>
              <Button
                startIcon={<RefreshRounded />}
                onClick={load}
                disabled={loading}
                sx={{ fontWeight: 800 }}
              >
                تحديث
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1.2fr 1fr 1fr 1fr" },
              gap: 1,
            }}
          >
            <TextField
              select
              size="small"
              label="المعلم"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              disabled={teachersLoading}
            >
              <MenuItem value="">كل المعلمين</MenuItem>
              {sortedTeachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>{teacher.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="الحالة"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="">كل الحالات</MenuItem>
              <MenuItem value="pending">في انتظار الرد</MenuItem>
              <MenuItem value="approved">موافق عليه</MenuItem>
              <MenuItem value="rejected">مرفوض</MenuItem>
            </TextField>
            <TextField
              type="date" size="small" label="من" value={from}
              onChange={(event) => setFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date" size="small" label="إلى" value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Paper>

        {/* Requests */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.2, md: 1.6 },
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            bgcolor: "var(--color-cream)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
            <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "15px", fontWeight: 800 }}>
              الطلبات
            </Typography>
            <Chip size="small" label={rows.length} sx={{ fontWeight: 800 }} />
          </Stack>

          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 230 }}>
              <CircularProgress />
            </Stack>
          ) : rows.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
              <EventAvailableRounded sx={{ fontSize: 44, color: "var(--color-muted)" }} />
              <Typography sx={{ mt: 0.8, color: "var(--color-navy-deep)", fontWeight: 800 }}>
                لا توجد طلبات
              </Typography>
              <Typography sx={{ mt: 0.3, color: "var(--color-muted)", fontSize: "10px" }}>
                جرّب تغيير الفلاتر أو إنشاء استئذان جديد.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={0.85}>
              {rows.map((row) => (
                <Paper
                  key={row._id}
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: "14px",
                    borderColor: "rgba(36,74,112,0.09)",
                    bgcolor: "var(--color-white)",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    transition: "200ms ease",
                    "&:hover": { boxShadow: "0 10px 22px rgba(18,47,77,0.06)" },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={0.7} flexWrap="wrap">
                      <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "12.5px", fontWeight: 800 }}>
                        {row.teacherName || "—"}
                      </Typography>
                      <Chip
                        size="small"
                        color={STATUS_COLORS[row.status]}
                        label={LEAVE_STATUS_LABELS[row.status] ?? row.status}
                        sx={{ height: 22, fontSize: "9px", fontWeight: 800 }}
                      />
                    </Stack>
                    <Typography sx={{ mt: 0.45, color: "var(--color-muted)", fontSize: "10px" }}>
                      {row.date} · انصراف {row.leaveAt}
                      {row.fromSlot ? ` · من الحصة ${row.fromSlot}` : " · اليوم كله"}
                    </Typography>
                    {row.reason && (
                      <Typography sx={{ mt: 0.45, color: "var(--color-text)", fontSize: "10px" }}>
                        {row.reason}
                      </Typography>
                    )}
                    {row.status !== "pending" && row.reviewedByName && (
                      <Typography sx={{ mt: 0.4, color: "var(--color-muted)", fontSize: "9px" }}>
                        {row.status === "approved" ? "وافق" : "رفض"}: {row.reviewedByName}
                        {row.reviewNote ? ` — ${row.reviewNote}` : ""}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap>
                    {row.status === "pending" && (
                      <>
                        <Button
                          size="small" variant="contained" color="success" startIcon={<CheckRounded />}
                          onClick={() => setDecision({ row, status: "approved" })}
                          disabled={busy}
                          sx={{ borderRadius: "10px", fontWeight: 800 }}
                        >
                          موافقة
                        </Button>
                        <Button
                          size="small" variant="outlined" color="error" startIcon={<CloseRounded />}
                          onClick={() => setDecision({ row, status: "rejected" })}
                          disabled={busy}
                          sx={{ borderRadius: "10px", fontWeight: 800 }}
                        >
                          رفض
                        </Button>
                      </>
                    )}
                    <Button
                      size="small" color="error" startIcon={<DeleteOutlineRounded />}
                      onClick={() => setCancelTarget(row)} disabled={busy}
                      sx={{ borderRadius: "10px", fontWeight: 800 }}
                    >
                      إلغاء الطلب
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

      <Dialog
        open={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <DialogTitle>إنشاء استئذان لمعلم</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              size="small"
              label="المعلم"
              value={createForm.teacherId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, teacherId: event.target.value }))
              }
              disabled={teachersLoading}
              helperText={
                teachersLoading
                  ? "جاري تحميل المعلمين..."
                  : sortedTeachers.length === 0
                    ? "لا يوجد معلمون متاحون"
                    : ""
              }
            >
              {sortedTeachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              size="small"
              label="اليوم"
              value={createForm.date}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="time"
              size="small"
              label="وقت الانصراف"
              value={createForm.leaveAt}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, leaveAt: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              size="small"
              label="أول حصة هيغيب عنها"
              value={createForm.fromSlot}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, fromSlot: event.target.value }))
              }
              helperText="سيبها فاضية لو الحصة مش محددة — اليوم كله هيتعرض في لوحة الاحتياطي"
            >
              <MenuItem value="">مش محدد</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                <MenuItem key={slot} value={slot}>
                  الحصة {slot}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              multiline
              minRows={2}
              label="السبب (اختياري)"
              value={createForm.reason}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, reason: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={submitCreate}
            disabled={
              busy ||
              teachersLoading ||
              !createForm.teacherId ||
              !createForm.date ||
              !createForm.leaveAt
            }
          >
            إنشاء الاستئذان
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(decision)}
        onClose={() => !busy && setDecision(null)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <DialogTitle>
          {decision?.status === "approved" ? "الموافقة على الاستئذان" : "رفض الاستئذان"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {decision?.row?.teacherName} · {decision?.row?.date} · انصراف{" "}
            {decision?.row?.leaveAt}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label="ملاحظة (اختيارية)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              decision?.status === "approved"
                ? "مثلاً: البديل أ. سارة"
                : "سبب الرفض"
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color={decision?.status === "approved" ? "success" : "error"}
            onClick={submitDecision}
            disabled={busy}
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => !busy && setCancelTarget(null)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <DialogTitle>إلغاء طلب الاستئذان</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            هل تريد إلغاء طلب استئذان {cancelTarget?.teacherName || "المعلم"} يوم{" "}
            {cancelTarget?.date}؟
          </Typography>
          {cancelTarget?.status !== "pending" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              الطلب تمت مراجعته بالفعل، والإدارة مسموح لها بإلغائه.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={busy}>
            رجوع
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteOutlineRounded />}
            onClick={submitCancel}
            disabled={busy}
          >
            إلغاء الطلب
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </AppContainer>
  );
};

export default LeaveRequests;
