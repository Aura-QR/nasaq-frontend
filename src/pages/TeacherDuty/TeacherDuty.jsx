import { useCallback, useEffect, useState } from "react";
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
import { AddRounded, DeleteOutlineRounded } from "@mui/icons-material";
import { toast } from "react-toastify";

import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequests,
  LEAVE_STATUS_LABELS,
  toDateInput,
} from "@/APIs/school/duty";
import { fetchMyDay } from "@/APIs/school/notifications";
import AppContainer from "@/components/Container/Container";

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

/**
 * شاشة المعلم — استئذاناته، والحصص المكلّف بيها احتياطي.
 *
 * الاتنين على نفس الشاشة عن قصد: الحصة الاحتياطي بتيجي من غياب زميل، وهي نفس
 * اللحظة اللي المعلم بيسأل فيها "أنا عليّ إيه النهارده".
 */
const TeacherDuty = () => {
  const [requests, setRequests] = useState([]);
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: toDateInput(),
    leaveAt: "",
    fromSlot: "",
    reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);

    const [leaveResponse, dayResponse] = await Promise.all([
      fetchLeaveRequests({}),
      fetchMyDay(toDateInput()),
    ]);

    if (leaveResponse.status) {
      setRequests(Array.isArray(leaveResponse.data) ? leaveResponse.data : []);
    } else {
      toast.error(leaveResponse.message);
    }

    if (dayResponse.status) setDay(dayResponse.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setBusy(true);
    const response = await createLeaveRequest(form);
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setOpen(false);
      setForm({ date: toDateInput(), leaveAt: "", fromSlot: "", reason: "" });
      load();
    } else {
      toast.error(response.message);
    }
  };

  const cancel = async (id) => {
    setBusy(true);
    const response = await cancelLeaveRequest(id);
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      load();
    } else {
      toast.error(response.message);
    }
  };

  return (
    <AppContainer>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          py: { xs: 1, md: 1.5 },
          pb: 4,
        }}
      >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            الاستئذان والاحتياطي
          </Typography>
          <Typography variant="body2" color="text.secondary">
            طلبات انصرافك، والحصص المكلّف بيها بدل زميل
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setOpen(true)}
          >
            طلب استئذان
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <MyDay day={day} />

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFCF7" }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              طلبات الاستئذان
            </Typography>

            {requests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                مفيش طلبات.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {requests.map((row) => (
                  <Paper
                    key={row._id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {row.date} · انصراف {row.leaveAt}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.fromSlot
                          ? `من الحصة ${row.fromSlot}`
                          : "اليوم كله"}
                        {row.reason ? ` · ${row.reason}` : ""}
                      </Typography>
                      {row.status !== "pending" && row.reviewNote && (
                        <Typography variant="caption" color="text.secondary">
                          {row.reviewedByName}: {row.reviewNote}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        color={STATUS_COLORS[row.status]}
                        label={LEAVE_STATUS_LABELS[row.status] ?? row.status}
                      />
                      {row.status === "pending" && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineRounded />}
                          onClick={() => cancel(row._id)}
                          disabled={busy}
                        >
                          إلغاء
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle>طلب استئذان</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              type="date"
              size="small"
              label="اليوم"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="time"
              size="small"
              label="وقت الانصراف"
              value={form.leaveAt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, leaveAt: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              size="small"
              label="أول حصة هتغيب عنها"
              value={form.fromSlot}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fromSlot: event.target.value }))
              }
              helperText="سيبها فاضية لو مش متأكد — الإدارة هتشوف اليوم كله"
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
              value={form.reason}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reason: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={busy || !form.date || !form.leaveAt}
          >
            إرسال
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </AppContainer>
  );
};

/**
 * يوم المدرس كامل — حصصه وحصص الاحتياطي على نفس الخط، مرتبين بالحصة.
 *
 * الحصص اللي الاستئذان بيعفيه منها **بتتعلّم مش بتختفي**: إخفاؤها هو اللي
 * بيخلي حد يروح لحصة هو أصلًا مستأذن منها.
 */
const MyDay = ({ day }) => {
  if (!day) return null;

  const slots = day.slots ?? [];

  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h6" fontWeight={700}>
          يومك النهارده
        </Typography>
        <Stack direction="row" spacing={0.75}>
          <Chip size="small" label={`${day.stats?.own ?? 0} حصة`} />
          {(day.stats?.cover ?? 0) > 0 && (
            <Chip
              size="small"
              color="info"
              label={`${day.stats.cover} احتياطي`}
            />
          )}
          {(day.stats?.excused ?? 0) > 0 && (
            <Chip
              size="small"
              color="warning"
              label={`${day.stats.excused} باستئذان`}
            />
          )}
        </Stack>
      </Stack>

      {slots.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          مفيش حصص عليك النهارده.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {slots.map((slot) => (
            <Paper
              key={`${slot.kind}-${slot.lectureId}`}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor:
                  slot.kind === "cover" ? "#B9D4EC" : "rgba(0,0,0,0.12)",
                bgcolor:
                  slot.kind === "cover"
                    ? "#F4F9FD"
                    : slot.excusedByLeave
                      ? "#FBF6EC"
                      : "transparent",
                opacity: slot.excusedByLeave ? 0.75 : 1,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                flexWrap="wrap"
              >
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    الحصة {slot.slot} · {slot.className ?? "—"}
                    {slot.roomNumber ? ` · ${slot.roomNumber}` : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {slot.subjectName ?? "—"}
                    {slot.coveringFor ? ` · بدل ${slot.coveringFor}` : ""}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.75}>
                  {slot.kind === "cover" && (
                    <Chip size="small" color="info" label="احتياطي" />
                  )}
                  {slot.excusedByLeave && (
                    <Chip size="small" color="warning" label="مستأذن" />
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default TeacherDuty;
