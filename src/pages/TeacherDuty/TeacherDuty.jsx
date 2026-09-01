import { useCallback, useEffect, useState } from "react";
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
import { AddRounded, DeleteOutlineRounded } from "@mui/icons-material";
import { toast } from "react-toastify";

import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequests,
  LEAVE_STATUS_LABELS,
  toDateInput,
} from "@/APIs/school/duty";

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

/**
 * شاشة المعلم لطلبات الاستئذان.
 *
 * حصص الاحتياطي وحالة الحصص المعفاة بالاستئذان تظهر الآن داخل الجدول الدراسي
 * نفسه، لذلك تفضل هذه الشاشة مخصصة لإنشاء الطلبات ومتابعتها فقط.
 */
const TeacherDuty = () => {
  const [requests, setRequests] = useState([]);
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

    const leaveResponse = await fetchLeaveRequests({});

    if (leaveResponse.status) {
      setRequests(Array.isArray(leaveResponse.data) ? leaveResponse.data : []);
    } else {
      toast.error(leaveResponse.message);
    }

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
    <Container maxWidth="md" sx={{ py: 3 }} dir="rtl">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            طلبات الاستئذان
          </Typography>
          <Typography variant="body2" color="text.secondary">
            قدّم طلب انصراف وتابع حالة الموافقة أو الرفض
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setOpen(true)}
        >
          طلب استئذان
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
                      {/* الإلغاء متاح قبل المراجعة بس — بعدها الإدارة هي اللي تعدّل. */}
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
    </Container>
  );
};


export default TeacherDuty;
