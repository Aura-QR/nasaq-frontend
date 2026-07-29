import {
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  EventRepeatRounded,
  SaveRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { addInstallmentPlan } from "@/APIs/financials/installmentPlans";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";

const InstallmentPlansAddPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { isDefault: false, dueDates: [] } });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const numberOfInstallments = Number(watch("numberOfInstallments") || 0);
  const safeInstallmentsCount = useMemo(
    () => Math.max(0, numberOfInstallments),
    [numberOfInstallments],
  );

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
      isDefault: Boolean(formValues.isDefault),
    };

    setLoading(true);
    try {
      const response = await addInstallmentPlan(payload);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء إضافة خطة التقسيط");
        return;
      }
      toast.success(response?.message || "تم إضافة خطة التقسيط بنجاح");
      navigate("/financial/installment-plans");
    } finally {
      setLoading(false);
    }
  };

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
            <Back title="إضافة خطة تقسيط" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
              أدخل بيانات الخطة ثم حدّد تاريخ استحقاق كل قسط.
            </Typography>
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
                الاسم وعدد الأقساط وحالة الخطة الافتراضية.
              </Typography>
            </Box>
          </Stack>

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
            <Grid item xs={12}>
              <FormControlLabel
                sx={{
                  m: 0,
                  px: 1.25,
                  py: 0.55,
                  border: "1px solid rgba(36,74,112,.08)",
                  borderRadius: "12px",
                  bgcolor: "var(--color-white)",
                }}
                control={
                  <Checkbox
                    checked={Boolean(watch("isDefault"))}
                    onChange={(event) =>
                      setValue("isDefault", event.target.checked, { shouldDirty: true })
                    }
                  />
                }
                label="تعيين كخطة افتراضية"
              />
            </Grid>
          </Grid>
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
                يظهر حقل تاريخ جديد لكل قسط تضيفه.
              </Typography>
            </Box>
          </Stack>

          {safeInstallmentsCount > 0 ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: safeInstallmentsCount }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={`due-date-${index}`}>
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
              <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
                ستظهر مواعيد الاستحقاق هنا تلقائياً.
              </Typography>
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, px: 1.5, py: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={loading}
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
              {loading ? "جاري الحفظ..." : "حفظ خطة التقسيط"}
            </Button>
            <Button
              type="button"
              disabled={loading}
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

export default InstallmentPlansAddPage;
