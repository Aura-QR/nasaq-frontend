import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";

import { voidPayment } from "@/APIs/financials/financialRecords";
import {
  formatDate,
  formatMoney,
  getErrorMessage,
} from "@/utils/financial/financialUtils";

/**
 * Confirm voiding one payment, with a reason.
 *
 * `target` addresses the entry exactly as the API expects:
 * { section, tripId?, additionalFeeId?, installmentNumber?, paymentIndex }
 * plus `amount` and `paidAt` for display. The amount is sent back as
 * `expectedAmount` so a stale page cannot void a different entry.
 */
const VoidPaymentDialog = ({
  open,
  onClose,
  onVoided,
  studentId,
  academicYearId,
  target,
  title,
}) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("اكتب سبب إلغاء الدفعة");
      return;
    }
    setSaving(true);
    const response = await voidPayment(studentId, {
      section: target.section,
      ...(target.tripId ? { tripId: String(target.tripId) } : {}),
      ...(target.additionalFeeId
        ? { additionalFeeId: String(target.additionalFeeId) }
        : {}),
      ...(target.installmentNumber !== undefined && target.installmentNumber !== null
        ? { installmentNumber: Number(target.installmentNumber) }
        : {}),
      paymentIndex: Number(target.paymentIndex),
      expectedAmount: Number(target.amount),
      reason: trimmed,
      ...(academicYearId ? { academicYearId } : {}),
    });
    setSaving(false);

    if (response?.status) {
      toast.success(response?.message || "تم إلغاء الدفعة");
      onClose?.();
      await onVoided?.();
      return;
    }
    toast.error(getErrorMessage(response, "تعذر إلغاء الدفعة"));
  };

  if (!target) return null;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      dir="rtl"
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>
        إلغاء دفعة مسجّلة بالخطأ
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: 1.5,
            mb: 1.5,
            borderRadius: "12px",
            bgcolor: "rgba(209,67,67,.06)",
            border: "1px solid rgba(209,67,67,.18)",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#b33636" }}>
            {formatMoney(target.amount)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "var(--color-muted)", mt: 0.3 }}>
            {title ? `${title} · ` : ""}
            {target.paidAt ? `بتاريخ ${formatDate(target.paidAt)}` : ""}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 1.5, fontSize: 11.5, py: 0.25 }}>
          الإلغاء للدفعة اللي ماحصلتش أصلًا. لو الفلوس اتردّت لولي الأمر،
          استخدم «استرداد». الدفعة تفضل ظاهرة في السجل ومعاها سبب الإلغاء.
        </Alert>

        <TextField
          label="سبب الإلغاء"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          fullWidth
          required
          multiline
          minRows={2}
          inputProps={{ maxLength: 500 }}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          تراجع
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={submit}
          disabled={saving || !reason.trim()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          إلغاء الدفعة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoidPaymentDialog;
