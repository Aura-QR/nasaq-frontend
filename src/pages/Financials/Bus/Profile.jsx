import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { payBusInstallment, unenrollBus } from "@/APIs/financials/bus";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import { useBus } from "@/utils/hooks/apis/financials/useBus";
import { translateGender } from "@/utils/helpers/translateGender";
import usePermissions from "@/utils/hooks/usePermissions";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const serviceTypeMap = {
  pickup: "ذهاب فقط",
  dropoff: "عودة فقط",
  both: "ذهاب وعودة",
};

const installmentStatusMap = {
  paid: "مدفوع",
  overdue: "متأخر",
  pending: "قيد الانتظار",
};

const formatMoney = (value) => `${Number(value || 0)} جنيه`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
};

const BusProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { busRecord, loading, refetch } = useBus(studentId);
  const permissions = usePermissions("financial");

  const [payOpen, setPayOpen] = useState(false);
  const [unenrollOpen, setUnenrollOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const student = busRecord?.student || {};
  const cls = busRecord?.class || {};
  const bus = busRecord?.bus || {};

  const installments = useMemo(() => {
    const busInstallments = busRecord?.bus?.installments || [];

    return busInstallments.map((item) => ({
      id: item?._id || item?.installmentNumber,
      installmentNumber: item?.installmentNumber,
      amountRaw: Number(item?.amount || 0),
      amount: formatMoney(item?.amount),
      paidAmount: formatMoney(item?.paidAmount),
      dueDate: formatDate(item?.dueDate),
      paymentDate:
        item?.status === "paid" && item?.payments?.length > 0
          ? formatDate(item?.payments[item?.payments?.length - 1]?.paidAt)
          : "—",
      statusRaw: item?.status,
      status: installmentStatusMap[item?.status] || "قيد الانتظار",
    }));
  }, [busRecord?.bus?.installments]);

  const handleOpenPay = (installment) => {
    setSelectedInstallment(installment);
    setPayOpen(true);
  };

  const handleClosePay = () => {
    setPayOpen(false);
    setSelectedInstallment(null);
  };

  const handlePay = async (data) => {
    setActionLoading(true);

    const payload = {
      installmentNumber: Number(data.installmentNumber),
      amount: Number(data.amount),
      paidAt: data.paidAt,
      notes: data.notes || undefined,
    };

    const response = await payBusInstallment(studentId, payload);
    if (response.status) {
      toast.success(response.message || "تم تسجيل دفعة الباص بنجاح");
      handleClosePay();
      await refetch();
    } else {
      toast.error(response || "حدث خطأ ما أثناء تسجيل دفعة الباص");
    }

    setActionLoading(false);
  };

  const handleUnenroll = async () => {
    setActionLoading(true);

    const response = await unenrollBus(studentId);
    if (response.status) {
      toast.success(response.message || "تم إلغاء تسجيل الطالب من خدمة الباص");
      setUnenrollOpen(false);
      navigate("/financial/bus");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إلغاء تسجيل الباص");
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

  if (!busRecord) {
    return (
      <Container>
        <Back title={"ملف الباص"} />
        <Typography mt={8}>لا توجد بيانات باص لهذا الطالب</Typography>
      </Container>
    );
  }

  const isEnrolled = !!bus?.enrolled;
  const fee = Number(bus?.discount ? bus?.netFee : bus?.fee || 0);
  const totalPaid = Number(bus?.totalPaid || 0);
  const remaining = Math.max(fee - totalPaid, 0);

  return (
    <Container>
      <Back title={"ملف الباص"} />

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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent={"space-between"} spacing={4} mb={6}>
          <Typography variant="title" fontWeight={500}>بيانات الطالب</Typography>

          {permissions?.edit && isEnrolled && (
            <Button variant="outlined" color="error" onClick={() => setUnenrollOpen(true)}>
              إلغاء الاشتراك من الباص
            </Button>
          )}
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="اسم الطالب" value={student?.name || "—"} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="البريد المدرسي" value={student?.schoolEmail || "—"} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="الفصل" value={cls?.roomNumber ? `${cls?.roomNumber} - ${translateGender(cls?.gender, "class")}` : "—"} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="السنة الدراسية" value={busRecord?.academicYear || cls?.academicYear || "—"} />
          </Grid>
        </Grid>
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
        <Typography variant="title" fontWeight={500} mb={6}>تفاصيل خدمة الباص</Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="حالة الاشتراك" value={isEnrolled ? "مشترك" : "غير مشترك"} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="نوع خدمة الباص" value={serviceTypeMap[bus?.serviceType] || "ذهاب وعودة"} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="إجمالي رسوم الباص" value={formatMoney(fee)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="المتبقي" value={formatMoney(remaining)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="الحالة" value={statusMap[bus?.status] || "غير مدفوعة"} />
          </Grid>
        </Grid>
      </Paper>

      {isEnrolled && (
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
            <h2 className="text-lg font-bold text-[#1E293B]">أقساط الباص</h2>
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
                        {permissions?.edit && item.statusRaw !== "paid" ? (
                          <Button variant="contained" onClick={() => handleOpenPay(item)} sx={{ minWidth: "120px" }}>
                            تسجيل دفعة
                          </Button>
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
      )}

      <PayBusDialog
        open={payOpen}
        onClose={handleClosePay}
        installment={selectedInstallment}
        onSubmit={handlePay}
        loading={actionLoading}
      />

      <Dialog open={unenrollOpen} onClose={() => setUnenrollOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>إلغاء التسجيل من الباص</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من إلغاء تسجيل الطالب من خدمة الباص؟</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 5 }}>
          <Button variant="outlined" onClick={() => setUnenrollOpen(false)}>
            إلغاء
          </Button>
          <Button variant="contained" color="error" onClick={handleUnenroll} disabled={actionLoading}>
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

const PayBusDialog = ({ open, onClose, installment, onSubmit, loading }) => {
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
        amount: installment.amountRaw,
        paidAt: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [installment, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 6 }}>تسجيل دفعة الباص</DialogTitle>
      <DialogContent>
        <input type="hidden" {...register("installmentNumber", { required: true, valueAsNumber: true })} />
        <input type="hidden" {...register("amount", { required: true, valueAsNumber: true })} />
        <Grid container spacing={4}>
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
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          تسجيل الدفع
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BusProfilePage;

