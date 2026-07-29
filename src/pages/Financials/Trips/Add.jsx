import {
  CloseRounded,
  SaveRounded,
  TourRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { createTrip } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const TripsAddPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { installmentPlans = [] } = useInstallmentPlans();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", description: "", fee: "", installmentPlanId: "" },
  });

  const planOptions = installmentPlans.map((plan) => ({
    ...plan,
    displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${
      plan.isDefault ? " - افتراضية" : ""
    }`,
  }));

  const onSubmit = async (formValues) => {
    if (!studentId) return;
    const payload = {
      name: formValues.name,
      description: formValues.description || undefined,
      fee: Number(formValues.fee),
      installmentPlanId: formValues.installmentPlanId || undefined,
    };

    const response = await createTrip(studentId, payload);
    if (!response?.status) {
      toast.error(response?.message || response || "حدث خطأ أثناء إضافة الرحلة");
      return;
    }

    toast.success(response?.message || "تم إضافة الرحلة بنجاح");
    const newTripId = response?.data?._id || response?.data?.id;
    navigate(
      newTripId
        ? `/financial/records/${studentId}/trips/${newTripId}`
        : `/financial/records/${studentId}/trips`,
    );
  };

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate dir="rtl" sx={{ pb: 3 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Back title="إضافة رحلة" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
              أدخل تفاصيل الرحلة وحدّد طريقة السداد.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: { xs: 1.5, md: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", borderRadius: "12px" }}>
              <TourRounded />
            </Box>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>
                تفاصيل الرحلة
              </Typography>
              <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
                الرسوم وخطة التقسيط اختيارية ويمكن الدفع دفعة واحدة.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Input register={register} registerName="name" error={errors.name?.message} label="اسم الرحلة" required type="text" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Input register={register} registerName="fee" error={errors.fee?.message} label="رسوم الرحلة" required type="number" valueAsNumber />
            </Grid>
            <Grid item xs={12}>
              <Input register={register} registerName="description" error={errors.description?.message} label="وصف الرحلة" multiline rows={3} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Select
                register={register}
                registerName="installmentPlanId"
                data={planOptions}
                name="displayName"
                error={errors.installmentPlanId?.message}
                label="خطة التقسيط"
                defaultSelect="دفعة واحدة بدون خطة"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, px: 1.5, py: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
              sx={{ width: { xs: "100%", sm: 170 }, minHeight: 44, borderRadius: "12px", background: "var(--color-navy)", fontWeight: 800, textTransform: "none" }}
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ الرحلة"}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate(`/financial/records/${studentId}/trips`)}
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{ width: { xs: "100%", sm: 135 }, minHeight: 44, borderRadius: "12px", color: "var(--color-navy)", fontWeight: 800, textTransform: "none" }}
            >
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default TripsAddPage;
