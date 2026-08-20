import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteTrip, payTripInstallment, refundTripInstallment } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import { useTrip } from "@/utils/hooks/apis/financials/useTrip";
import usePermissions from "@/utils/hooks/usePermissions";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const installmentStatusMap = {
  paid: "مدفوع",
  overdue: "متأخر",
  pending: "قيد الانتظار",
};

const formatMoney = (value) => `${Number(value || 0)} ريال`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
};

const TripProfilePage = () => {
  const { studentId, tripId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const { trip, loading, refetch } = useTrip(studentId, tripId);

  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const installments = useMemo(() => {
    return (trip?.installments || []).map((item) => ({
      id: item?._id || item?.installmentNumber,
      installmentNumber: item?.installmentNumber,
      amountRaw: Number(item?.amount || 0),
      paidAmountRaw: Number(item?.paidAmount || 0),
      remainingRaw: Math.max(Number(item?.amount || 0) - Number(item?.paidAmount || 0), 0),
      amount: formatMoney(item?.amount),
      paidAmount: formatMoney(item?.paidAmount),
      dueDate: formatDate(item?.dueDate),
      paymentDate:
        item?.payments?.length > 0
          ? formatDate(item?.payments[item?.payments?.length - 1]?.paidAt)
          : "—",
      statusRaw: item?.status,
      status: installmentStatusMap[item?.status] || "قيد الانتظار",
    }));
  }, [trip?.installments]);

  const handleOpenPay = (installment) => {
    setSelectedInstallment(installment);
    setPayOpen(true);
  };

  const handleClosePay = () => {
    setPayOpen(false);
    setSelectedInstallment(null);
  };

  const handleOpenRefund = (installment) => {
    setSelectedInstallment(installment);
    setRefundOpen(true);
  };

  const handleCloseRefund = () => {
    setRefundOpen(false);
    setSelectedInstallment(null);
  };

  const handlePay = async (data) => {
    if (!studentId || !tripId) return;

    setActionLoading(true);
    const payload = {
      installmentNumber: Number(data.installmentNumber),
      amount: Number(data.amount),
      paidAt: data.paidAt,
      notes: data.notes || undefined,
    };

    const response = await payTripInstallment(studentId, tripId, payload);
    if (response.status) {
      toast.success(response.message || "تم تسجيل دفعة الرحلة بنجاح");
      handleClosePay();
      refetch();
    } else {
      toast.error(response?.message || response || "حدث خطأ ما أثناء تسجيل دفعة الرحلة");
    }
    setActionLoading(false);
  };

  const handleRefund = async (data) => {
    if (!studentId || !tripId || !selectedInstallment) return;

    const amount = Number(data.amount);
    const reason = String(data.reason || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("أدخل مبلغ استرداد صحيح");
      return;
    }

    if (amount > selectedInstallment.paidAmountRaw) {
      toast.error(
        `قيمة الاسترداد لا يمكن أن تتجاوز المدفوع ${formatMoney(
          selectedInstallment.paidAmountRaw
        )}`
      );
      return;
    }

    if (!reason) {
      toast.error("سبب التصحيح مطلوب");
      return;
    }

    setActionLoading(true);

    const response = await refundTripInstallment(
      studentId,
      tripId,
      selectedInstallment.installmentNumber,
      {
        installmentNumber: Number(selectedInstallment.installmentNumber),
        amount,
        reason,
      }
    );

    if (response?.status) {
      toast.success(
        response.message || "تم تسجيل استرداد دفعة الرحلة بنجاح"
      );
      handleCloseRefund();
      await refetch();
    } else {
      toast.error(
        response?.message ||
          response ||
          "تعذر تسجيل استرداد دفعة الرحلة"
      );
    }

    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!studentId || !tripId) return;

    setActionLoading(true);
    const response = await deleteTrip(studentId, tripId);
    if (response.status) {
      toast.success(response.message || "تم حذف الرحلة بنجاح");
      navigate(`/financial/records/${studentId}/trips`);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف الرحلة");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container>
        <Back title={"تفاصيل الرحلة"} />
        <Typography mt={8}>لا توجد بيانات لهذه الرحلة</Typography>
      </Container>
    );
  }

  const effectiveFee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
  const totalPaid = Number(trip?.totalPaid || 0);
  const remaining = Math.max(effectiveFee - totalPaid, 0);

  return (
    <Container>
      <Back title={"تفاصيل الرحلة"} />

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px 0px #0000000D",
          p: 12,
          borderRadius: "16px",
          mt: 8,
        }}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="اسم الرحلة" value={trip?.name || "—"} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="الوصف" value={trip?.description || "—"} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="الحالة" value={statusMap[trip?.status] || "غير مدفوعة"} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="إجمالي الرسوم" value={formatMoney(effectiveFee)} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard label="المتبقي" value={formatMoney(remaining)} />
          </Grid>
        </Grid>

        {permissions?.delete && (
          <Box mt={6}>
            <Button variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
              حذف الرحلة
            </Button>
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px 0px #0000000D",
          p: 12,
          borderRadius: "16px",
          mt: 8,
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1E293B]">أقساط الرحلة</h2>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
            عدد الأقساط: {installments.length}
          </span>
        </div>

        {installments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
            لا توجد أقساط لعرضها
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="rounded-r-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">القسط</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المبلغ</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المدفوع</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الاستحقاق</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">تاريخ الدفع</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الحالة</th>
                  <th className="rounded-l-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((item) => (
                  <tr key={item.id}>
                    <td className="rounded-r-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm font-semibold text-[#1E293B]">
                      #{item.installmentNumber}
                    </td>
                    <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                      {item.amount}
                    </td>
                    <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                      {item.paidAmount}
                    </td>
                    <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                      {item.dueDate}
                    </td>
                    <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                      {item.paymentDate}
                    </td>
                    <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.statusRaw === "paid" ? "bg-[#E7F8F1] text-[#0E9F6E]" : item.statusRaw === "overdue" ? "bg-[#FDECEC] text-[#D14343]" : "bg-[#EEF5FF] text-[#1D4ED8]"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="rounded-l-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm">
                      {permissions?.edit ? (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {item.statusRaw !== "paid" && item.remainingRaw > 0 && (
                            <Button
                              variant="contained"
                              onClick={() => handleOpenPay(item)}
                              sx={{ minWidth: "120px" }}
                            >
                              تسجيل دفعة
                            </Button>
                          )}

                          {item.paidAmountRaw > 0 && (
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleOpenRefund(item)}
                              sx={{ minWidth: "120px" }}
                            >
                              تصحيح دفعة
                            </Button>
                          )}

                          {item.statusRaw === "paid" && item.paidAmountRaw <= 0 && (
                            <Typography color="text.secondary" fontSize={13}>—</Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography color="text.secondary" fontSize={13}>—</Typography>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>

      <PayTripDialog
        open={payOpen}
        onClose={handleClosePay}
        installment={selectedInstallment}
        onSubmit={handlePay}
        loading={actionLoading}
      />

      <RefundTripDialog
        open={refundOpen}
        onClose={handleCloseRefund}
        installment={selectedInstallment}
        onSubmit={handleRefund}
        loading={actionLoading}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>حذف الرحلة</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من حذف هذه الرحلة؟</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 5 }}>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)}>
            إلغاء
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading}>
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const StatCard = ({ label, value }) => {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "10px",
        bgcolor: "primary.white",
        transition: ".5s",
        "&:hover": { bgcolor: "grey.100" },
      }}
    >
      <Typography variant="label" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}>
        {label}
      </Typography>
      <Typography variant="subtitle" sx={{ display: "block", fontWeight: 500, color: "text.primary" }}>
        {value}
      </Typography>
    </Box>
  );
};

const PayTripDialog = ({ open, onClose, installment, onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (installment) {
      reset({
        installmentNumber: installment.installmentNumber,
        amount: installment.remainingRaw,
        paidAt: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [installment, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 6 }}>تسجيل دفعة الرحلة</DialogTitle>
      <DialogContent>
        <input type="hidden" {...register("installmentNumber", { required: true, valueAsNumber: true })} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ المدفوع"
              error={Boolean(errors.amount)}
              helperText={errors.amount?.message || `المتبقي على القسط: ${installment?.remainingRaw || 0} ريال`}
              inputProps={{ min: 1, max: installment?.remainingRaw || undefined, step: "any" }}
              {...register("amount", {
                required: "أدخل مبلغ الدفعة",
                valueAsNumber: true,
                min: { value: 1, message: "المبلغ يجب أن يكون أكبر من صفر" },
                max: { value: installment?.remainingRaw || Number.MAX_SAFE_INTEGER, message: `أقصى مبلغ متاح هو ${installment?.remainingRaw || 0} ريال` },
              })}
            />
          </Grid>
          <Grid item xs={12}>
            <Input
              register={register}
              registerName={"paidAt"}
              error={errors.paidAt?.message}
              label={"تاريخ الدفع"}
              required={true}
              type={"date"}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 6, pb: 5, pt: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          إلغاء
        </Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading || !installment?.remainingRaw}>
          تسجيل الدفع
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const RefundTripDialog = ({ open, onClose, installment, onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (installment) {
      reset({
        amount: installment.paidAmountRaw,
        reason: "",
      });
    }
  }, [installment, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 6 }}>تصحيح / استرداد دفعة الرحلة</DialogTitle>

      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="مبلغ الاسترداد"
              error={Boolean(errors.amount)}
              helperText={
                errors.amount?.message ||
                `أقصى مبلغ متاح: ${installment?.paidAmountRaw || 0} ريال`
              }
              inputProps={{
                min: 1,
                max: installment?.paidAmountRaw || undefined,
                step: "any",
              }}
              {...register("amount", {
                required: "أدخل مبلغ الاسترداد",
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "المبلغ يجب أن يكون أكبر من صفر",
                },
                max: {
                  value:
                    installment?.paidAmountRaw ||
                    Number.MAX_SAFE_INTEGER,
                  message: `أقصى مبلغ متاح هو ${
                    installment?.paidAmountRaw || 0
                  } ريال`,
                },
              })}
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              register={register}
              registerName="reason"
              error={errors.reason?.message}
              label="سبب التصحيح"
              required={true}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 6, pb: 5, pt: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          إلغاء
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || !installment?.paidAmountRaw}
        >
          تسجيل الاسترداد
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripProfilePage;
