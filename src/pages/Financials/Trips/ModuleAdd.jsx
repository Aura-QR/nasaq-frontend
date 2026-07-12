import { Button, Grid, Paper, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createTripTemplate } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";

const ModuleTripsAddPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      fee: "",
    },
  });

  const onSubmit = async (formData) => {
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      fee: Number(formData.fee),
    };

    const response = await createTripTemplate(payload);
    if (response.status) {
      toast.success(response.message || "تم إنشاء الرحلة بنجاح");
      const newId = response?.data?._id;
      if (newId) navigate(`/financial/trips/${newId}`);
      else navigate("/financial/trips");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إنشاء الرحلة");
    }
  };

  return (
    <Container>
      <Back title={"إنشاء رحلة"} />

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

        </Grid>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} mt={8}>
          <Button variant="contained" disabled={isSubmitting} onClick={handleSubmit(onSubmit)} sx={{ minWidth: 160 }}>
            حفظ
          </Button>

          <Button variant="outlined" onClick={() => navigate("/financial/trips")} sx={{ minWidth: 160 }}>
            إلغاء
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ModuleTripsAddPage;
