import { Box, Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addInstallmentPlan } from "@/APIs/financials/installmentPlans";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";

const InstallmentPlansAddPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isDefault: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const numberOfInstallments = Number(watch("numberOfInstallments") || 0);
  const safeInstallmentsCount = useMemo(() => Math.max(0, numberOfInstallments), [numberOfInstallments]);

  const onSubmit = async (data) => {
    const dueDates = Array.from({ length: safeInstallmentsCount }, (_, i) => data?.dueDates?.[i]).filter(Boolean);

    const payload = {
      name: data.name,
      description: data.description || undefined,
      numberOfInstallments: Number(data.numberOfInstallments),
      dueDates,
      isDefault: !!data.isDefault,
    };

    setLoading(true);
    const response = await addInstallmentPlan(payload);
    if (response.status) {
      toast.success("تم إضافة خطة التقسيط بنجاح");
      navigate("/financial/installment-plans");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة خطة التقسيط");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة خطة تقسيط"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل خطة التقسيط
        </Typography>

        <Grid container mt={8} spacing={8}>
          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"name"}
              error={errors.name?.message}
              label={"اسم الخطة"}
              required={true}
              type={"text"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"numberOfInstallments"}
              error={errors.numberOfInstallments?.message}
              label={"عدد الأقساط"}
              required={true}
              type={"number"}
              valueAsNumber={true}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!watch("isDefault")}
                  onChange={(e) => setValue("isDefault", e.target.checked)}
                />
              }
              label="تعيين كخطة افتراضية"
            />
          </Grid>
        </Grid>
      </Box>

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          مواعيد الاستحقاق
        </Typography>

        <Grid container mt={8} spacing={8}>
          {safeInstallmentsCount > 0 && (
            <Grid item xs={12}>
              <Grid container spacing={6}>
                {Array.from({ length: safeInstallmentsCount }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`dueDate-${index}`}>
                    <Input
                      register={register}
                      registerName={`dueDates.${index}`}
                      error={errors?.dueDates?.[index]?.message}
                      label={`تاريخ استحقاق القسط ${index + 1}`}
                      required={true}
                      type={"date"}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        {safeInstallmentsCount > 0 && (
          <Typography color={"text.secondary"} fontSize={14} mt={6}>
            يجب أن يساوي عدد تواريخ الاستحقاق عدد الأقساط.
          </Typography>
        )}
      </Box>

      <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} />
    </Container>
  );
};

export default InstallmentPlansAddPage;
