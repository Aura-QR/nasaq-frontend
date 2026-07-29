import {
  AccountBalanceWalletRounded,
  DirectionsBusRounded,
  DiscountRounded,
  GroupsRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  SchoolRounded,
  TourRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select as MuiSelect,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { payTuitionInstallment } from "@/APIs/financials/financialRecords";
import {
  applyDiscountToTuition,
  removeDiscountFromTuition,
} from "@/APIs/financials/discounts";
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
import { translateGender } from "@/utils/helpers/translateGender";
import { useDiscounts } from "@/utils/hooks/apis/financials/useDiscounts";
import { useFinancialRecord } from "@/utils/hooks/apis/financials/useFinancialRecord";
import usePermissions from "@/utils/hooks/usePermissions";

const statusSx = (status) => {
  if (status === "paid") return { color: "#287653", bgcolor: "#EAF7F0" };
  if (status === "overdue") {
    return { color: "var(--color-danger)", bgcolor: "rgba(201,79,79,.10)" };
  }
  return { color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.08)" };
};

const InfoCard = ({ label, value }) => (
  <Box
    sx={{
      p: 1.25,
      border: "1px solid rgba(36,74,112,.08)",
      borderRadius: "13px",
      bgcolor: "var(--color-white)",
    }}
  >
    <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5, fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography
      sx={{
        mt: 0.3,
        color: "var(--color-navy-deep)",
        fontSize: 12,
        fontWeight: 800,
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const FinancialRecordProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { financialRecord, loading, refetch } = useFinancialRecord(studentId);
  const permissions = usePermissions("financial");
  const { discounts = [], loading: discountsLoading } = useDiscounts();

  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);

  const installments = useMemo(
    () =>
      (financialRecord?.tuition?.installments || []).map((item) => ({
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
    [financialRecord],
  );

  const handlePayInstallment = async (formValues) => {
    const payload = {
      installmentNumber: Number(formValues.installmentNumber),
      amount: Number(formValues.amount),
      paidAt: formValues.paidAt,
      notes: formValues.notes || undefined,
    };

    setPayLoading(true);
    try {
      const response = await payTuitionInstallment(studentId, payload);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء تسجيل دفعة القسط");
        return;
      }
      toast.success(response?.message || "تم تسجيل دفعة القسط بنجاح");
      setPayOpen(false);
      setSelectedInstallment(null);
      await refetch();
    } finally {
      setPayLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedDiscountId) {
      toast.error("يرجى اختيار خصم أولاً");
      return;
    }

    setDiscountLoading(true);
    try {
      const response = await applyDiscountToTuition(studentId, {
        discountId: selectedDiscountId,
      });
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء تطبيق الخصم");
        return;
      }
      toast.success(response?.message || "تم تطبيق الخصم على الرسوم الدراسية بنجاح");
      setSelectedDiscountId("");
      await refetch();
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setDiscountLoading(true);
    try {
      const response = await removeDiscountFromTuition(studentId);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء إزالة الخصم");
        return;
      }
      toast.success(response?.message || "تم إزالة الخصم من الرسوم الدراسية بنجاح");
      await refetch();
    } finally {
      setDiscountLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!financialRecord) {
    return (
      <Container>
        <Back title="تفاصيل مصاريف الطالب" />
        <EmptyState
          icon={<AccountBalanceWalletRounded />}
          title="لا توجد بيانات مالية لهذا الطالب"
          description="لم يتم إنشاء ملف مصروفات دراسية للطالب حتى الآن."
        />
      </Container>
    );
  }

  const student = financialRecord?.studentId || financialRecord?.student || {};
  const cls = financialRecord?.classId || financialRecord?.class || {};
  const tuition = financialRecord?.tuition || {};
  const effectiveFee = Number(
    tuition?.discountApplied || tuition?.discount
      ? tuition?.netFee ?? tuition?.fee ?? 0
      : tuition?.fee || 0,
  );
  const totalPaid = Number(tuition?.totalPaid || 0);
  const remaining = Math.max(effectiveFee - totalPaid, 0);
  const activeDiscounts = discounts.filter((item) => item?.isActive);
  const tuitionDiscount = tuition?.discount || null;
  const paidInstallments = installments.filter((item) => item.statusRaw === "paid").length;

  const infoCards = [
    { label: "اسم الطالب", value: student?.name || "—" },
    {
      label: "السنة الدراسية",
      value: financialRecord?.academicYear || cls?.academicYear || "—",
    },
    {
      label: "الفصل",
      value: cls?.roomNumber
        ? `${cls.roomNumber} - ${translateGender(cls?.gender, "class")}`
        : "—",
    },
    { label: "خطة التقسيط", value: financialRecord?.installmentPlanId?.name || "—" },
    { label: "حالة الرسوم", value: mapFeeStatus(tuition?.status) },
    { label: "البريد المدرسي", value: student?.schoolEmail || student?.email || "—" },
  ];

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Back title="تفاصيل مصاريف الطالب" />

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mt: 1.25,
            mb: 1.25,
            p: { xs: 1.5, md: 2 },
            background:
              "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.42))",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={1.5}
          >
            <Box>
              <Typography
                component="h1"
                sx={{ color: "var(--color-navy-deep)", fontSize: 24, fontWeight: 800 }}
              >
                {student?.name || "ملف الطالب"}
              </Typography>
              <Typography sx={{ mt: 0.25, color: "var(--color-muted)", fontSize: 10 }}>
                {student?.schoolEmail || student?.email || "راجع المصروفات والخصومات والأقساط."}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              {permissions?.read && (
                <Button
                  type="button"
                  onClick={() => navigate(`/financial/bus/${studentId}`)}
                  variant="outlined"
                  startIcon={<DirectionsBusRounded />}
                  sx={{ borderRadius: "11px", fontWeight: 800, textTransform: "none" }}
                >
                  خدمة الباص
                </Button>
              )}
              {permissions?.read && (
                <Button
                  type="button"
                  onClick={() => navigate("/financial/trips")}
                  variant="contained"
                  startIcon={<TourRounded />}
                  sx={{
                    borderRadius: "11px",
                    background: "var(--color-navy)",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  إدارة الرحلات
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <StatsGrid>
          <StatCard label="إجمالي الرسوم" value={formatMoney(effectiveFee)} icon={<AccountBalanceWalletRounded />} />
          <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} icon={<PaymentsRounded />} />
          <StatCard label="المتبقي" value={formatMoney(remaining)} icon={<ReceiptLongRounded />} />
          <StatCard label="الأقساط المدفوعة" value={`${paidInstallments}/${installments.length}`} icon={<GroupsRounded />} />
        </StatsGrid>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 2 } }}>
          <Typography sx={{ mb: 1.25, color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>
            بيانات الطالب والمصروفات
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))" },
              gap: 1,
            }}
          >
            {infoCards.map((item) => (
              <InfoCard key={item.label} label={item.label} value={item.value} />
            ))}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-gold-dark)",
                  bgcolor: "var(--color-gold-soft)",
                  borderRadius: "12px",
                }}
              >
                <DiscountRounded />
              </Box>
              <Box>
                <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 15, fontWeight: 800 }}>
                  خصم الرسوم الدراسية
                </Typography>
                <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10 }}>
                  {tuition?.discountApplied && tuitionDiscount
                    ? `الخصم الحالي: ${tuitionDiscount?.name || "خصم"} (${tuitionDiscount?.percentage || 0}%)`
                    : "لا يوجد خصم مطبق حالياً."}
                </Typography>
              </Box>
            </Stack>

            {permissions?.edit && (
              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                {!tuition?.discountApplied ? (
                  <>
                    <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 230 } }}>
                      <InputLabel id="tuition-discount-label">اختر خصم</InputLabel>
                      <MuiSelect
                        labelId="tuition-discount-label"
                        value={selectedDiscountId}
                        label="اختر خصم"
                        onChange={(event) => setSelectedDiscountId(event.target.value)}
                        disabled={discountsLoading || discountLoading}
                        sx={{ bgcolor: "var(--color-white)", borderRadius: "11px" }}
                      >
                        {activeDiscounts.map((item) => (
                          <MenuItem key={item?._id || item?.id} value={item?._id || item?.id}>
                            {item?.name} - {item?.percentage}%
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                    <Button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={!selectedDiscountId || discountLoading || discountsLoading}
                      variant="contained"
                      sx={{ borderRadius: "11px", fontWeight: 800, textTransform: "none" }}
                    >
                      تطبيق الخصم
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={handleRemoveDiscount}
                    disabled={discountLoading}
                    variant="outlined"
                    color="error"
                    sx={{ borderRadius: "11px", fontWeight: 800, textTransform: "none" }}
                  >
                    إزالة الخصم
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={1}
            sx={{ px: 1.7, py: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}
          >
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>
                أقساط الرسوم الدراسية
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 9.5 }}>
                راجع الاستحقاقات وسجّل الدفعات غير المكتملة.
              </Typography>
            </Box>
            <Chip
              label={`عدد الأقساط: ${installments.length}`}
              size="small"
              sx={{ color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.07)", fontWeight: 800 }}
            />
          </Stack>

          {installments.length === 0 ? (
            <EmptyState
              icon={<ReceiptLongRounded />}
              title="لا توجد أقساط لعرضها"
              description="لم يتم إنشاء جدول أقساط للمصروفات الدراسية."
            />
          ) : (
            <InstallmentsTable
              installments={installments}
              permissions={permissions}
              onPay={(item) => {
                setSelectedInstallment(item);
                setPayOpen(true);
              }}
            />
          )}
        </Paper>

        <PayInstallmentDialog
          open={payOpen}
          onClose={() => {
            if (!payLoading) {
              setPayOpen(false);
              setSelectedInstallment(null);
            }
          }}
          installment={selectedInstallment}
          onSubmit={handlePayInstallment}
          loading={payLoading}
        />
      </Box>
    </Container>
  );
};

const InstallmentsTable = ({ installments, permissions, onPay }) => (
  <Box sx={{ p: 1, overflowX: "auto" }}>
    <Box
      component="table"
      sx={{
        width: "100%",
        minWidth: 850,
        borderCollapse: "separate",
        borderSpacing: "0 8px",
        "& th": {
          px: 1.2,
          py: 1,
          color: "var(--color-muted)",
          bgcolor: "rgba(36,74,112,.045)",
          fontSize: 10,
          fontWeight: 800,
          textAlign: "right",
        },
        "& td": {
          px: 1.2,
          py: 1,
          color: "var(--color-text)",
          bgcolor: "var(--color-white)",
          borderTop: "1px solid rgba(36,74,112,.08)",
          borderBottom: "1px solid rgba(36,74,112,.08)",
          fontSize: 11,
        },
      }}
    >
      <thead>
        <tr>
          <th>القسط</th>
          <th>المبلغ</th>
          <th>المدفوع</th>
          <th>الاستحقاق</th>
          <th>تاريخ الدفع</th>
          <th>الحالة</th>
          <th>الإجراء</th>
        </tr>
      </thead>
      <tbody>
        {installments.map((item) => (
          <tr key={item.id}>
            <td>#{item.installmentNumber}</td>
            <td>{item.amount}</td>
            <td>{item.paidAmount}</td>
            <td>{item.dueDate}</td>
            <td>{item.paymentDate}</td>
            <td>
              <Chip
                label={item.status}
                size="small"
                sx={{ ...statusSx(item.statusRaw), height: 26, fontSize: 9, fontWeight: 800 }}
              />
            </td>
            <td>
              {permissions?.edit && item.statusRaw !== "paid" ? (
                <Button
                  type="button"
                  onClick={() => onPay(item)}
                  variant="contained"
                  sx={{ minWidth: 105, minHeight: 34, borderRadius: "9px", fontSize: 9.5, fontWeight: 800, textTransform: "none" }}
                >
                  تسجيل دفعة
                </Button>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Box>
  </Box>
);

const PayInstallmentDialog = ({ open, onClose, installment, onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!installment) return;
    reset({
      installmentNumber: installment.installmentNumber,
      amount: installment.amountRaw,
      paidAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }, [installment, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { overflow: "hidden", borderRadius: "20px", bgcolor: "var(--color-cream)" } }}
    >
      <DialogHeader
        icon={<PaymentsRounded />}
        title="تسجيل دفعة المصروفات"
        description={
          installment
            ? `القسط رقم ${installment.installmentNumber} — ${installment.amount}`
            : ""
        }
        loading={loading}
        onClose={onClose}
      />
      <DialogContent sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register("installmentNumber", { required: true, valueAsNumber: true })} />
          <input type="hidden" {...register("amount", { required: true, valueAsNumber: true })} />
          <Stack spacing={1.5}>
            <Input
              register={register}
              registerName="paidAt"
              error={errors.paidAt?.message}
              label="تاريخ الدفع"
              required
              type="date"
            />
            <Input
              register={register}
              registerName="notes"
              error={errors.notes?.message}
              label="ملاحظات"
              multiline
              rows={3}
            />
          </Stack>
          <FormActions loading={loading} onCancel={onClose} label="تسجيل الدفع" />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialRecordProfilePage;
