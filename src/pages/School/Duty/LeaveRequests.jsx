import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
  RefreshRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";

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
  const [status, setStatus] = useState("pending");
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
  }, [status, from, to]);

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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }} dir="rtl">
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              طلبات الاستئذان
            </Typography>
            <Typography variant="body2" color="text.secondary">
              الموافقة بتمنع احتساب الانصراف كمخالفة، وبتحدد الحصص المحتاجة بديل
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setCreateOpen(true)}
            disabled={teachersLoading}
          >
            استئذان لمعلم
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            select
            size="small"
            label="الحالة"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">الكل</MenuItem>
            <MenuItem value="pending">في انتظار الرد</MenuItem>
            <MenuItem value="approved">موافق عليه</MenuItem>
            <MenuItem value="rejected">مرفوض</MenuItem>
          </TextField>
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
          <Button startIcon={<RefreshRounded />} onClick={load} disabled={loading}>
            تحديث
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: "#FFFCF7" }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            مفيش طلبات في النطاق ده.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <Paper
              key={row._id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "#FFFCF7",
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {row.teacherName || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row.date} · انصراف {row.leaveAt}
                  {row.fromSlot ? ` · من الحصة ${row.fromSlot}` : " · اليوم كله"}
                </Typography>
                {row.reason && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {row.reason}
                  </Typography>
                )}
                {row.status !== "pending" && row.reviewedByName && (
                  <Typography variant="caption" color="text.secondary">
                    {row.status === "approved" ? "وافق" : "رفض"}: {" "}
                    {row.reviewedByName}
                    {row.reviewNote ? ` — ${row.reviewNote}` : ""}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  color={STATUS_COLORS[row.status]}
                  label={LEAVE_STATUS_LABELS[row.status] ?? row.status}
                />
                {row.status === "pending" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckRounded />}
                      onClick={() => setDecision({ row, status: "approved" })}
                      disabled={busy}
                    >
                      موافقة
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseRounded />}
                      onClick={() => setDecision({ row, status: "rejected" })}
                      disabled={busy}
                    >
                      رفض
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineRounded />}
                  onClick={() => setCancelTarget(row)}
                  disabled={busy}
                >
                  إلغاء الطلب
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog
        open={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
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
    </Container>
  );
};

export default LeaveRequests;
