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
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { createTripTemplate } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";

const ModuleTripsAddPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "", description: "", fee: "" } });

  const onSubmit = async (formValues) => {
    const response = await createTripTemplate({
      name: formValues.name,
      description: formValues.description || undefined,
      fee: Number(formValues.fee),
    });

    if (!response?.status) {
      toast.error(response?.message || response || "حدث خطأ أثناء إنشاء الرحلة");
      return;
    }

    toast.success(response?.message || "تم إنشاء الرحلة بنجاح");
    const newId = response?.data?._id || response?.data?.id;
    navigate(newId ? `/financial/trips/${newId}` : "/financial/trips");
  };

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate dir="rtl" sx={{ pb: 3 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Back title="إنشاء رحلة" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
              أدخل بيانات الرحلة الأساسية ثم أضف الطلاب من صفحة التفاصيل.
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
                الاسم والوصف ورسوم الاشتراك الأساسية.
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
              {isSubmitting ? "جاري الحفظ..." : "إنشاء الرحلة"}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate("/financial/trips")}
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

export default ModuleTripsAddPage;
