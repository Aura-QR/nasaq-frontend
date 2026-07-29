import {
  AccountBalanceWalletRounded,
  DeleteOutlineRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  TourRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteTrip, payTripInstallment } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import {
  DialogHeader,
  EmptyState,
  FormActions,
  StatCard,
  StatsGrid,
  pageCardSx,
} from "@/components/financial/FinancialShell";
import {
  formatDate,
  formatMoney,
  mapFeeStatus,
  mapInstallmentStatus,
} from "@/utils/financial/financialUtils";
import { useTrip } from "@/utils/hooks/apis/financials/useTrip";
import usePermissions from "@/utils/hooks/usePermissions";

const statusSx = (status) => {
  if (status === "paid") return { color: "#287653", bgcolor: "#EAF7F0" };
  if (status === "overdue") return { color: "var(--color-danger)", bgcolor: "rgba(201,79,79,.10)" };
  return { color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.08)" };
};

const TripProfilePage = () => {
  const { studentId, tripId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const { trip, loading, refetch } = useTrip(studentId, tripId);

  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const installments = useMemo(
    () =>
      (trip?.installments || []).map((item) => ({
        id: item?._id || item?.installmentNumber,
        installmentNumber: item?.installmentNumber,
        amountRaw: Number(item?.amount || 0),
        amount: formatMoney(item?.amount),
        paidAmount: formatMoney(item?.paidAmount),
        dueDate: formatDate(item?.dueDate),
        paymentDate:
          item?.status === "paid" && item?.payments?.length
            ? formatDate(item.payments[item.payments.length - 1]?.paidAt)
            : "—",
        statusRaw: item?.status,
        status: mapInstallmentStatus(item?.status),
      })),
    [trip?.installments],
  );

  const handlePay = async (formValues) => {
    const payload = {
      installmentNumber: Number(formValues.installmentNumber),
      amount: Number(formValues.amount),
      paidAt: formValues.paidAt,
      notes: formValues.notes || undefined,
    };
    setActionLoading(true);
    try {
      const response = await payTripInstallment(studentId, tripId, payload);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء تسجيل دفعة الرحلة");
        return;
      }
      toast.success(response?.message || "تم تسجيل دفعة الرحلة بنجاح");
      setPayOpen(false);
      setSelectedInstallment(null);
      await refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await deleteTrip(studentId, tripId);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء حذف الرحلة");
        return;
      }
      toast.success(response?.message || "تم حذف الرحلة بنجاح");
      navigate(`/financial/records/${studentId}/trips`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!trip) {
    return (
      <Container>
        <Back title="تفاصيل الرحلة" />
        <EmptyState icon={<TourRounded />} title="لا توجد بيانات لهذه الرحلة" description="تعذر العثور على سجل الرحلة المطلوب." />
      </Container>
    );
  }

  const effectiveFee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
  const totalPaid = Number(trip?.totalPaid || 0);
  const remaining = Math.max(effectiveFee - totalPaid, 0);
  const paidCount = installments.filter((item) => item.statusRaw === "paid").length;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05, mb: 1.25 }}>
          <Back title="تفاصيل الرحلة" />
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 2 }, background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.42))" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
            <Box>
              <Typography component="h1" sx={{ color: "var(--color-navy-deep)", fontSize: 24, fontWeight: 800 }}>
                {trip?.name || "تفاصيل الرحلة"}
              </Typography>
              <Typography sx={{ mt: 0.25, color: "var(--color-muted)", fontSize: 10 }}>
                {trip?.description || "راجع الرسوم والأقساط والمدفوعات الخاصة بالرحلة."}
              </Typography>
            </Box>
            {permissions?.delete && (
              <Button type="button" onClick={() => setDeleteOpen(true)} variant="outlined" startIcon={<DeleteOutlineRounded />} sx={{ borderRadius: "11px", color: "var(--color-danger)", borderColor: "rgba(201,79,79,.24)", fontWeight: 800, textTransform: "none" }}>
                حذف الرحلة
              </Button>
            )}
          </Stack>
        </Paper>

        <StatsGrid>
          <StatCard label="إجمالي الرسوم" value={formatMoney(effectiveFee)} icon={<AccountBalanceWalletRounded />} />
          <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} icon={<PaymentsRounded />} />
          <StatCard label="المتبقي" value={formatMoney(remaining)} icon={<ReceiptLongRounded />} />
          <StatCard label="الأقساط المدفوعة" value={`${paidCount}/${installments.length}`} icon={<TourRounded />} />
        </StatsGrid>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 2 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))" }, gap: 1 }}>
            {[
              ["اسم الرحلة", trip?.name || "—"],
              ["الوصف", trip?.description || "—"],
              ["الحالة", mapFeeStatus(trip?.status)],
              ["إجمالي الرسوم", formatMoney(effectiveFee)],
              ["إجمالي المدفوع", formatMoney(totalPaid)],
              ["المتبقي", formatMoney(remaining)],
            ].map(([label, value]) => (
              <Box key={label} sx={{ p: 1.25, border: "1px solid rgba(36,74,112,.08)", borderRadius: "13px", bgcolor: "var(--color-white)" }}>
                <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5, fontWeight: 700 }}>{label}</Typography>
                <Typography sx={{ mt: 0.3, color: "var(--color-navy-deep)", fontSize: 12, fontWeight: 800 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1} sx={{ px: 1.7, py: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>أقساط الرحلة</Typography>
              <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5 }}>راجع الاستحقاقات وسجّل الدفعات.</Typography>
            </Box>
            <Chip label={`عدد الأقساط: ${installments.length}`} size="small" sx={{ color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.07)", fontWeight: 800 }} />
          </Stack>

          {installments.length === 0 ? (
            <EmptyState icon={<ReceiptLongRounded />} title="لا توجد أقساط لعرضها" description="لم يتم إنشاء جدول أقساط لهذه الرحلة." />
          ) : (
            <Box sx={{ p: 1, overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", minWidth: 850, borderCollapse: "separate", borderSpacing: "0 8px", "& th": { px: 1.2, py: 1, color: "var(--color-muted)", bgcolor: "rgba(36,74,112,.045)", fontSize: 10, fontWeight: 800, textAlign: "right" }, "& td": { px: 1.2, py: 1, color: "var(--color-text)", bgcolor: "var(--color-white)", borderTop: "1px solid rgba(36,74,112,.08)", borderBottom: "1px solid rgba(36,74,112,.08)", fontSize: 11 } }}>
                <thead><tr><th>القسط</th><th>المبلغ</th><th>المدفوع</th><th>الاستحقاق</th><th>تاريخ الدفع</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {installments.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.installmentNumber}</td><td>{item.amount}</td><td>{item.paidAmount}</td><td>{item.dueDate}</td><td>{item.paymentDate}</td>
                      <td><Chip label={item.status} size="small" sx={{ ...statusSx(item.statusRaw), height: 26, fontSize: 9, fontWeight: 800 }} /></td>
                      <td>{permissions?.edit && item.statusRaw !== "paid" ? <Button type="button" onClick={() => { setSelectedInstallment(item); setPayOpen(true); }} variant="contained" sx={{ minWidth: 105, minHeight: 34, borderRadius: "9px", fontSize: 9.5, fontWeight: 800, textTransform: "none" }}>تسجيل دفعة</Button> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>

        <PaymentDialog open={payOpen} onClose={() => { if (!actionLoading) { setPayOpen(false); setSelectedInstallment(null); } }} installment={selectedInstallment} onSubmit={handlePay} loading={actionLoading} />
        <DeleteDialog open={deleteOpen} onClose={() => !actionLoading && setDeleteOpen(false)} onConfirm={handleDelete} loading={actionLoading} />
      </Box>
    </Container>
  );
};

const PaymentDialog = ({ open, onClose, installment, onSubmit, loading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  useEffect(() => {
    if (!installment) return;
    reset({ installmentNumber: installment.installmentNumber, amount: installment.amountRaw, paidAt: new Date().toISOString().slice(0, 10), notes: "" });
  }, [installment, reset]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { overflow: "hidden", borderRadius: "20px", bgcolor: "var(--color-cream)" } }}>
      <DialogHeader icon={<PaymentsRounded />} title="تسجيل دفعة الرحلة" description={installment ? `القسط رقم ${installment.installmentNumber} — ${installment.amount}` : ""} loading={loading} onClose={onClose} />
      <DialogContent sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register("installmentNumber", { required: true, valueAsNumber: true })} />
          <input type="hidden" {...register("amount", { required: true, valueAsNumber: true })} />
          <Stack spacing={1.5}>
            <Input register={register} registerName="paidAt" error={errors.paidAt?.message} label="تاريخ الدفع" required type="date" />
            <Input register={register} registerName="notes" error={errors.notes?.message} label="ملاحظات" multiline rows={3} />
          </Stack>
          <FormActions loading={loading} onCancel={onClose} label="تسجيل الدفع" />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, onConfirm, loading }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { overflow: "hidden", borderRadius: "20px", bgcolor: "var(--color-cream)" } }}>
    <DialogHeader icon={<DeleteOutlineRounded />} title="حذف الرحلة" description="لن تتمكن من استعادة الرحلة بعد الحذف." loading={loading} onClose={onClose} />
    <DialogContent sx={{ p: 2 }}>
      <Typography sx={{ color: "var(--color-text)", fontSize: 12, lineHeight: 1.8 }}>هل أنت متأكد من حذف هذه الرحلة؟</Typography>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1} sx={{ mt: 2 }}>
        <Button type="button" disabled={loading} onClick={onConfirm} variant="contained" sx={{ flex: 1, minHeight: 42, borderRadius: "11px", bgcolor: "var(--color-danger)", fontWeight: 800, textTransform: "none" }}>تأكيد الحذف</Button>
        <Button type="button" disabled={loading} onClick={onClose} variant="outlined" sx={{ flex: 1, minHeight: 42, borderRadius: "11px", color: "var(--color-navy)", fontWeight: 800, textTransform: "none" }}>إلغاء</Button>
      </Stack>
    </DialogContent>
  </Dialog>
);

export default TripProfilePage;
