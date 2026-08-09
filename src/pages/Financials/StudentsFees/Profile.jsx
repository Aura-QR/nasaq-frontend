import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { payTuitionInstallment } from "@/APIs/financials/financialRecords";
import { applyDiscountToTuition, removeDiscountFromTuition } from "@/APIs/financials/discounts";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import { translateGender } from "@/utils/helpers/translateGender";
import { useDiscounts } from "@/utils/hooks/apis/financials/useDiscounts";
import { useFinancialRecord } from "@/utils/hooks/apis/financials/useFinancialRecord";
import usePermissions from "@/utils/hooks/usePermissions";

const FinancialRecordProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { financialRecord, loading, refetch } = useFinancialRecord(studentId);
  const permissions = usePermissions("financial");
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const { discounts, loading: discountsLoading } = useDiscounts();

  const installmentsRows = useMemo(() => {
    const mapStatus = (status) => {
      if (status === "paid") return "مدفوع";
      if (status === "overdue") return "متأخر";
      return "قيد الانتظار";
    };

    return (financialRecord?.tuition?.installments || []).map((item) => ({
      id: item?._id || item?.installmentNumber,
      installmentNumber: item?.installmentNumber,
      amountRaw: Number(item?.amount || 0),
      paidAmountRaw: Number(item?.paidAmount || 0),
      remainingRaw: Math.max(Number(item?.amount || 0) - Number(item?.paidAmount || 0), 0),
      amount: `${item?.amount || 0} جنيه`,
      paidAmount: `${item?.paidAmount || 0} جنيه`,
      dueDateRaw: item?.dueDate,
      dueDate: item?.dueDate ? new Date(item.dueDate).toLocaleDateString("en-GB") : "—",
      paymentDate:
        item?.payments?.length > 0 && item?.payments[item?.payments?.length - 1]?.paidAt
          ? new Date(item?.payments[item?.payments?.length - 1]?.paidAt).toLocaleDateString("en-GB")
          : "—",
      statusRaw: item?.status,
      status: mapStatus(item?.status),
    }));
  }, [financialRecord]);

  const handleOpenPay = (installment) => {
    setSelectedInstallment(installment);
    setPayOpen(true);
  };

  const handleClosePay = () => {
    setPayOpen(false);
    setSelectedInstallment(null);
  };

  const handlePayInstallment = async (formData) => {
    if (!studentId) return;

    setPayLoading(true);
    const academicYearId =
      financialRecord?.academicYearId?._id ||
      financialRecord?.academicYearId ||
      undefined;

    const payload = {
      installmentNumber: Number(formData.installmentNumber),
      amount: Number(formData.amount),
      paidAt: formData.paidAt,
      notes: formData.notes || undefined,
      ...(academicYearId ? { academicYearId } : {}),
    };

    const response = await payTuitionInstallment(studentId, payload);
    if (response.status) {
      toast.success(response.message || "تم تسجيل دفعة القسط بنجاح");
      handleClosePay();
      await refetch();
    } else {
      toast.error(response?.message || response || "حدث خطأ ما أثناء تسجيل دفعة القسط");
    }
    setPayLoading(false);
  };

  const handleApplyTuitionDiscount = async () => {
    if (!studentId) return;
    if (!selectedDiscountId) {
      toast.error("يرجى اختيار خصم أولاً");
      return;
    }

    setDiscountLoading(true);
    const response = await applyDiscountToTuition(studentId, { discountId: selectedDiscountId });
    if (response.status) {
      toast.success(response.message || "تم تطبيق الخصم على الرسوم الدراسية بنجاح");
      setSelectedDiscountId("");
      await refetch();
    } else {
      toast.error(response || "حدث خطأ ما أثناء تطبيق الخصم");
    }
    setDiscountLoading(false);
  };

  const handleRemoveTuitionDiscount = async () => {
    if (!studentId) return;

    setDiscountLoading(true);
    const response = await removeDiscountFromTuition(studentId);
    if (response.status) {
      toast.success(response.message || "تم إزالة الخصم من الرسوم الدراسية بنجاح");
      await refetch();
    } else {
      toast.error(response || "حدث خطأ ما أثناء إزالة الخصم");
    }
    setDiscountLoading(false);
  };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (!financialRecord) {
    return (
      <Container>
        <Back title={"تفاصيل مصاريف الطالب"} />
        <Typography mt={8}>لا توجد بيانات مالية لهذا الطالب</Typography>
      </Container>
    );
  }

  const student = financialRecord?.studentId || {};
  const cls = financialRecord?.classId || {};
  const tuition = financialRecord?.tuition || {};
  const effectiveFee = Number(tuition?.discount ? tuition?.netFee : tuition?.fee || 0);
  const remaining = Math.max(Number(effectiveFee || 0) - Number(tuition?.totalPaid || 0), 0);

  const mapFeeStatus = (status) => {
    if (status === "paid") return "مدفوعة";
    if (status === "partial") return "جزئية";
    return "غير مدفوعة";
  };

  const infoCards = [
    { key: "اسم الطالب", value: student?.name || "—" },
    { key: "السنة الدراسية", value: financialRecord?.academicYear || cls?.academicYear || "—" },
    {
      key: "الفصل",
      value: cls?.roomNumber ? `${cls?.roomNumber} - ${translateGender(cls?.gender, "class")}` : "—",
    },
    { key: "الخطة", value: financialRecord?.installmentPlanId?.name || "—" },
    { key: "حالة الرسوم", value: mapFeeStatus(tuition?.status) },
    { key: "إجمالي الرسوم", value: `${effectiveFee || 0} جنيه` },
    { key: "إجمالي المدفوع", value: `${tuition?.totalPaid || 0} جنيه` },
    { key: "المتبقي", value: `${remaining} جنيه` },
  ];

  const tuitionDiscount = tuition?.discount || null;
  const activeDiscounts = (discounts || []).filter((item) => item?.isActive);

  return (
    <Container>
      <Back title={"تفاصيل مصاريف الطالب"} />

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
        <Stack spacing={1} mb={6}>
          <Typography variant="h4" fontWeight="bold">
            {student?.name || "—"}
          </Typography>
          <Typography color="text.secondary">{student?.schoolEmail || student?.email || "—"}</Typography>
        </Stack>

        <Grid container spacing={4}>
          {infoCards.map((field, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  bgcolor: i % 2 === 0 ? "primary.white" : "white",
                  transition: ".5s",
                  "&:hover": { bgcolor: "grey.100" },
                }}
              >
                <Typography variant="label" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}>
                  {field.key}
                </Typography>
                <Typography variant="subtitle" sx={{ display: "block", fontWeight: 500, color: "text.primary" }}>
                  {field.value}
                </Typography>
              </Box>
            </Grid>
          ))}
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
        <Typography variant="h5" fontWeight={700} mb={6}>
          خدمات الطالب المالية
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
          {permissions?.read && (
            <Button variant="outlined" onClick={() => navigate(`/financial/bus/${studentId}`)} sx={{ minWidth: 180 }}>
              خدمة الباص
            </Button>
          )}

          {permissions?.read && (
            <Button variant="contained" onClick={() => navigate(`/financial/trips`)} sx={{ minWidth: 180 }}>
              إدارة الرحلات
            </Button>
          )}
        </Stack>
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={6}
          justifyContent={"space-between"}
          alignItems={{ xs: "start", md: "center" }}
        >
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              خصم الرسوم الدراسية
            </Typography>

            {tuition?.discountApplied && tuitionDiscount ? (
              <Typography color="text.secondary" fontWeight={500}>
                الخصم الحالي: {tuitionDiscount?.name} ({tuitionDiscount?.percentage}%) - قيمة الخصم: {tuitionDiscount?.discountAmount || 0} جنيه
              </Typography>
            ) : (
              <Typography color="text.secondary" fontWeight={500}>
                لا يوجد خصم مطبق حالياً على الرسوم الدراسية
              </Typography>
            )}
          </Stack>

          {permissions?.edit && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={4} width={{ xs: "100%", md: "auto" }}>
              {!tuition?.discountApplied ? (
                <>
                  <FormControl sx={{ minWidth: { xs: "100%", sm: 260 } }} size="small">
                    <InputLabel id="tuition-discount-label">اختر خصم</InputLabel>
                    <Select
                      labelId="tuition-discount-label"
                      value={selectedDiscountId}
                      label="اختر خصم"
                      onChange={(e) => setSelectedDiscountId(e.target.value)}
                      disabled={discountsLoading || discountLoading}
                    >
                      {activeDiscounts.map((item) => (
                        <MenuItem key={item._id} value={item._id}>
                          {item.name} - {item.percentage}%
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    onClick={handleApplyTuitionDiscount}
                    disabled={!selectedDiscountId || discountLoading || discountsLoading}
                    sx={{ minWidth: 140 }}
                  >
                    تطبيق الخصم
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveTuitionDiscount}
                  disabled={discountLoading}
                  sx={{ minWidth: 160 }}
                >
                  إزالة الخصم
                </Button>
              )}
            </Stack>
          )}
        </Stack>
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
          <h2 className="text-lg font-bold text-[#1E293B]">أقساط الرسوم الدراسية</h2>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
            عدد الأقساط: {installmentsRows.length}
          </span>
        </div>

        {installmentsRows.length === 0 ? (
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
                {installmentsRows.map((item) => (
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

      <PayInstallmentDialog
        open={payOpen}
        onClose={handleClosePay}
        installment={selectedInstallment}
        loading={payLoading}
        onSubmit={handlePayInstallment}
      />
    </Container>
  );
};

const PayInstallmentDialog = ({ open, onClose, installment, loading, onSubmit }) => {
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
      <DialogTitle sx={{ pb: 6 }}>تسجيل دفعة القسط</DialogTitle>
      <DialogContent>
        <input type="hidden" {...register("installmentNumber", { required: true, valueAsNumber: true })} />

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ المدفوع"
              error={Boolean(errors.amount)}
              helperText={errors.amount?.message || `المتبقي على القسط: ${installment?.remainingRaw || 0} جنيه`}
              inputProps={{ min: 1, max: installment?.remainingRaw || undefined, step: "any" }}
              {...register("amount", {
                required: "أدخل مبلغ الدفعة",
                valueAsNumber: true,
                min: { value: 1, message: "المبلغ يجب أن يكون أكبر من صفر" },
                max: {
                  value: installment?.remainingRaw || Number.MAX_SAFE_INTEGER,
                  message: `أقصى مبلغ متاح هو ${installment?.remainingRaw || 0} جنيه`,
                },
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
      <DialogActions sx={{ px: 12, pb: 10, pt: 1 }}>
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

export default FinancialRecordProfilePage;
