import {
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  EventRepeatRounded,
  SaveRounded,
  StarRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  editInstallmentPlan,
  setDefaultInstallmentPlan,
} from "@/APIs/financials/installmentPlans";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import { useDiscounts } from "@/utils/hooks/apis/financials/useDiscounts";
import { useInstallmentPlan } from "@/utils/hooks/apis/financials/useInstallmentPlan";

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getLinkedDiscountId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || value?.id || "";
};

const InstallmentPlansEditPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaulting, setDefaulting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { installmentPlan, loading: installmentPlanLoading } =
    useInstallmentPlan(id);
  const { discounts, loading: discountsLoading } = useDiscounts();

  const discountOptions = useMemo(
    () =>
      (discounts || []).map((discount) => ({
        ...discount,
        id: discount?._id || discount?.id || "",
        displayName: `${discount?.name || "خصم"}${
          discount?.percentage !== undefined && discount?.percentage !== null
            ? ` (${discount.percentage}%)`
            : ""
        }${discount?.isActive === false ? " - غير نشط" : ""}`,
      })).filter((discount) => Boolean(discount.id)),
    [discounts],
  );

  const numberOfInstallments = Number(watch("numberOfInstallments") || 0);
  const safeInstallmentsCount = useMemo(
    () => Math.max(0, numberOfInstallments),
    [numberOfInstallments],
  );

  useEffect(() => {
    if (!installmentPlan) return;
    reset({
      name: installmentPlan.name || "",
      description: installmentPlan.description || "",
      numberOfInstallments: Number(installmentPlan.numberOfInstallments || 0),
      dueDates: (installmentPlan.dueDates || []).map(toInputDate),
      isActive: Boolean(installmentPlan.isActive),
      linkedDiscountId: getLinkedDiscountId(installmentPlan.linkedDiscountId),
    });
  }, [installmentPlan, reset]);

  const onSubmit = async (formValues) => {
    const dueDates = Array.from(
      { length: safeInstallmentsCount },
      (_, index) => formValues?.dueDates?.[index],
    ).filter(Boolean);

    if (dueDates.length !== safeInstallmentsCount) {
      toast.error("يجب إدخال تاريخ استحقاق لكل قسط");
      return;
    }

    const payload = {
      name: formValues.name,
      description: formValues.description || undefined,
      numberOfInstallments: Number(formValues.numberOfInstallments),
      dueDates,
      isActive: Boolean(formValues.isActive),
    };

    const previousLinkedDiscountId = getLinkedDiscountId(
      installmentPlan?.linkedDiscountId,
    );
    const nextLinkedDiscountId = formValues.linkedDiscountId || "";

    if (nextLinkedDiscountId) {
      payload.linkedDiscountId = nextLinkedDiscountId;
    } else if (previousLinkedDiscountId) {
      // null يسمح بفك الارتباط عند اختيار "بدون خصم مرتبط".
      payload.linkedDiscountId = null;
    }

    setLoading(true);
    try {
      const response = await editInstallmentPlan(payload, id);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء تعديل خطة التقسيط");
        return;
      }
      toast.success(response?.message || "تم تعديل خطة التقسيط بنجاح");
      navigate("/financial/installment-plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    setDefaulting(true);
    try {
      const response = await setDefaultInstallmentPlan(id);
      if (!response?.status) {
        toast.error(
          response?.message || response || "حدث خطأ أثناء تعيين الخطة الافتراضية",
        );
        return;
      }
      toast.success(response?.message || "تم تعيين الخطة الافتراضية بنجاح");
      navigate("/financial/installment-plans");
    } finally {
      setDefaulting(false);
    }
  };

  if (installmentPlanLoading) return <Loading />;

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{ pb: 3 }}
      >
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="تعديل خطة التقسيط" />
            {!installmentPlan?.isDefault ? (
              <Button
                type="button"
                onClick={handleSetDefault}
                disabled={defaulting || loading}
                variant="outlined"
                startIcon={<StarRounded />}
                sx={{
                  minHeight: 40,
                  borderRadius: "11px",
                  color: "var(--color-gold-dark)",
                  borderColor: "rgba(211,164,79,.35)",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "none",
                }}
              >
                {defaulting ? "جاري التعيين..." : "تعيين كخطة افتراضية"}
              </Button>
            ) : (
              <Stack direction="row" alignItems="center" spacing={0.7}>
                <StarRounded sx={{ color: "var(--color-gold-dark)", fontSize: 19 }} />
                <Typography sx={{ color: "var(--color-gold-dark)", fontSize: 11, fontWeight: 800 }}>
                  الخطة الافتراضية الحالية
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: { xs: 1.5, md: 2 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
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
              <EventRepeatRounded />
            </Box>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>
                تفاصيل الخطة
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10 }}>
                عدّل الاسم وعدد الأقساط وحالة الخطة.
              </Typography>
            </Box>
          </Stack>

          {installmentPlan && (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="name"
                  error={errors.name?.message}
                  label="اسم الخطة"
                  required
                  type="text"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="numberOfInstallments"
                  error={errors.numberOfInstallments?.message}
                  label="عدد الأقساط"
                  required
                  type="number"
                  valueAsNumber
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="description"
                  error={errors.description?.message}
                  label="وصف الخطة"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="الخصم المرتبط"
                  disabled={discountsLoading}
                  helperText={
                    discountsLoading
                      ? "جاري تحميل الخصومات..."
                      : "اختياري — اختر الخصم الذي ترتبط به هذه الخطة."
                  }
                  {...register("linkedDiscountId")}
                >
                  <MenuItem value="">بدون خصم مرتبط</MenuItem>
                  {discountOptions.map((discount) => (
                    <MenuItem key={discount.id} value={discount.id}>
                      {discount.displayName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  sx={{
                    m: 0,
                    px: 1.25,
                    py: 0.55,
                    width: "100%",
                    minHeight: 48,
                    border: "1px solid rgba(36,74,112,.08)",
                    borderRadius: "12px",
                    bgcolor: "var(--color-white)",
                  }}
                  control={
                    <Checkbox
                      checked={Boolean(watch("isActive"))}
                      onChange={(event) =>
                        setValue("isActive", event.target.checked, { shouldDirty: true })
                      }
                    />
                  }
                  label="الخطة نشطة"
                />
              </Grid>
            </Grid>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: { xs: 1.5, md: 2 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
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
              <CalendarMonthRounded />
            </Box>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>
                مواعيد الاستحقاق
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10 }}>
                يجب أن يساوي عدد التواريخ عدد الأقساط.
              </Typography>
            </Box>
          </Stack>

          {safeInstallmentsCount > 0 ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: safeInstallmentsCount }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={`edit-due-date-${index}`}>
                  <Input
                    register={register}
                    registerName={`dueDates.${index}`}
                    error={errors?.dueDates?.[index]?.message}
                    label={`تاريخ استحقاق القسط ${index + 1}`}
                    required
                    type="date"
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Stack alignItems="center" spacing={0.8} sx={{ py: 4, textAlign: "center" }}>
              <CheckCircleRounded sx={{ color: "var(--color-gold-dark)", fontSize: 36 }} />
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 13, fontWeight: 800 }}>
                أدخل عدد الأقساط أولاً
              </Typography>
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, px: 1.5, py: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={loading || defaulting}
              variant="contained"
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />
              }
              sx={{
                width: { xs: "100%", sm: 190 },
                minHeight: 44,
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              type="button"
              disabled={loading || defaulting}
              onClick={() => navigate(-1)}
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{
                width: { xs: "100%", sm: 140 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-navy)",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default InstallmentPlansEditPage;
