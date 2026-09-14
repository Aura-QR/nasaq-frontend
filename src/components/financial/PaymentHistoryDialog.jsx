import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import VoidPaymentDialog from "@/components/financial/VoidPaymentDialog";
import {
  canVoidPayment,
  isRefundEvent,
  isVoidedPayment,
  voidUnavailableReason,
} from "@/shared/financial/paymentVoid";
import { formatDate, formatMoney } from "@/utils/financial/financialUtils";

/**
 * One row of payment history: a payment, a refund, or a voided entry.
 * Shared by the tuition history and the per-installment dialog below.
 */
export const PaymentEventRow = ({ event, label, onVoid }) => {
  const voided = isVoidedPayment(event);
  const refund = isRefundEvent(event);
  const allowed = !voided && !refund && canVoidPayment(event);
  const blockedReason = voidUnavailableReason(event);

  const color = voided ? "var(--color-muted)" : refund ? "#d14343" : "#237449";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "10px minmax(0,1fr) auto",
        alignItems: "start",
        gap: 1,
        py: 1.1,
        borderBottom: "1px dashed rgba(36,74,112,.12)",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          mt: 0.6,
          borderRadius: "50%",
          bgcolor: voided ? "rgba(36,74,112,.25)" : color,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            color: voided ? "var(--color-muted)" : "var(--color-navy-deep)",
            textDecoration: voided ? "line-through" : "none",
          }}
        >
          {refund ? "استرداد" : "دفعة"}
          {label ? ` · ${label}` : ""}
          {"  "}
          <Box component="span" sx={{ color, fontWeight: 800 }}>
            {refund ? "−" : "+"} {formatMoney(event?.amount)}
          </Box>
        </Typography>
        <Typography sx={{ mt: 0.2, fontSize: 9.5, color: "var(--color-muted)" }}>
          {formatDate(event?.paidAt)}
          {event?.notes ? ` · ${event.notes}` : ""}
        </Typography>
        {voided ? (
          <Typography sx={{ mt: 0.3, fontSize: 10, fontWeight: 700, color: "#b33636" }}>
            ملغاة {event?.voidedAt ? `في ${formatDate(event.voidedAt)}` : ""}
            {event?.voidReason ? ` · ${event.voidReason}` : ""}
          </Typography>
        ) : null}
      </Box>
      {!voided && !refund ? (
        allowed ? (
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => onVoid?.(event)}
            sx={{ minWidth: 0, fontSize: 11, fontWeight: 800 }}
          >
            إلغاء
          </Button>
        ) : (
          <Tooltip title={blockedReason}>
            <span>
              <Button size="small" disabled sx={{ minWidth: 0, fontSize: 11 }}>
                إلغاء
              </Button>
            </span>
          </Tooltip>
        )
      ) : (
        <span />
      )}
    </Box>
  );
};

/**
 * The payments of one installment (or one additional fee), newest first, with
 * voiding. `target` is everything but the entry's position:
 * { section, tripId?, additionalFeeId?, installmentNumber? }.
 */
const PaymentHistoryDialog = ({
  open,
  onClose,
  onChanged,
  title,
  payments,
  target,
  studentId,
  academicYearId,
}) => {
  const [voiding, setVoiding] = useState(null);

  // Keep each entry's position: it is how the API addresses it.
  const rows = useMemo(
    () =>
      (Array.isArray(payments) ? payments : [])
        .map((event, paymentIndex) => ({ ...event, paymentIndex }))
        .reverse(),
    [payments]
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>
          سجل الدفعات{title ? ` · ${title}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {rows.length === 0 ? (
            <Typography sx={{ py: 3, textAlign: "center", fontSize: 12, color: "var(--color-muted)" }}>
              لا توجد دفعات مسجلة.
            </Typography>
          ) : (
            <Stack>
              {rows.map((event) => (
                <PaymentEventRow
                  key={event.paymentIndex}
                  event={event}
                  onVoid={setVoiding}
                />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      <VoidPaymentDialog
        open={Boolean(voiding)}
        onClose={() => setVoiding(null)}
        onVoided={async () => {
          await onChanged?.();
          onClose?.();
        }}
        studentId={studentId}
        academicYearId={academicYearId}
        title={title}
        target={
          voiding
            ? {
                ...target,
                paymentIndex: voiding.paymentIndex,
                amount: voiding.amount,
                paidAt: voiding.paidAt,
              }
            : null
        }
      />
    </>
  );
};

export default PaymentHistoryDialog;
