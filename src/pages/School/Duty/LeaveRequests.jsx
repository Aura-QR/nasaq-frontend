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
import {
  CheckRounded,
  CloseRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import {
  fetchLeaveRequests,
  LEAVE_STATUS_LABELS,
  reviewLeaveRequest,
  toDateInput,
} from "@/APIs/school/duty";

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");

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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }} dir="rtl">
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}>
        <Typography variant="h5" fontWeight={700}>
          طلبات الاستئذان
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          الموافقة بتمنع احتساب الانصراف كمخالفة، وبتحدد الحصص المحتاجة بديل
        </Typography>

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
                    {row.status === "approved" ? "وافق" : "رفض"}:{" "}
                    {row.reviewedByName}
                    {row.reviewNote ? ` — ${row.reviewNote}` : ""}
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
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckRounded />}
                      onClick={() => setDecision({ row, status: "approved" })}
                    >
                      موافقة
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseRounded />}
                      onClick={() => setDecision({ row, status: "rejected" })}
                    >
                      رفض
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
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
          <Button onClick={() => setDecision(null)}>إلغاء</Button>
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
    </Container>
  );
};

export default LeaveRequests;
