import { Button, Grid, Paper, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createTrip } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const TripsAddPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { installmentPlans } = useInstallmentPlans();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      fee: "",
      installmentPlanId: "",
    },
  });

  const planOptions = (installmentPlans || []).map((plan) => ({
    ...plan,
    displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${plan.isDefault ? " - افتراضية" : ""}`,
  }));

  const onSubmit = async (formData) => {
    if (!studentId) return;

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      fee: Number(formData.fee),
      installmentPlanId: formData.installmentPlanId || undefined,
    };

    const response = await createTrip(studentId, payload);
    if (response.status) {
      toast.success(response.message || "تم إضافة الرحلة بنجاح");
      const newTripId = response?.data?._id;
      if (newTripId) {
        navigate(`/financial/records/${studentId}/trips/${newTripId}`);
      } else {
        navigate(`/financial/records/${studentId}/trips`);
      }
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة الرحلة");
    }
  };

  return (
    <Container>
      <Back title={"إضافة رحلة"} />

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
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Input
              register={register}
              registerName={"name"}
              error={errors.name?.message}
              label={"اسم الرحلة"}
              required={true}
              type={"text"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              register={register}
              registerName={"fee"}
              error={errors.fee?.message}
              label={"رسوم الرحلة"}
              required={true}
              type={"number"}
              valueAsNumber={true}
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              register={register}
              registerName={"description"}
              error={errors.description?.message}
              label={"وصف الرحلة"}
              type={"text"}
              multiline={true}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Select
              register={register}
              registerName={"installmentPlanId"}
              data={planOptions}
              name="displayName"
              error={errors.installmentPlanId?.message}
              label={"خطة التقسيط"}
              defaultSelect="دفعة واحدة بدون خطة"
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} mt={8}>
          <Button
            variant="contained"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            sx={{ minWidth: 160 }}
          >
            حفظ
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate(`/financial/records/${studentId}/trips`)}
            sx={{ minWidth: 160 }}
          >
            إلغاء
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default TripsAddPage;
