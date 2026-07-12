import { Box, Button, Checkbox, FormControlLabel, Grid, Stack, Typography } from "@mui/material";
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
import SubmitSection from "@/components/SubmitSection";
import { useInstallmentPlan } from "@/utils/hooks/apis/financials/useInstallmentPlan";

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

  const { installmentPlan, loading: installmentPlanLoading } = useInstallmentPlan(id);
  const numberOfInstallments = Number(watch("numberOfInstallments") || 0);
  const safeInstallmentsCount = useMemo(() => Math.max(0, numberOfInstallments), [numberOfInstallments]);

  useEffect(() => {
    if (installmentPlan) {
      reset({
        name: installmentPlan.name,
        description: installmentPlan.description || "",
        numberOfInstallments: installmentPlan.numberOfInstallments,
        dueDates: (installmentPlan.dueDates || []).map((d) => new Date(d).toISOString().slice(0, 10)),
        isActive: installmentPlan.isActive,
      });
    }
  }, [installmentPlan, reset]);

  const onSubmit = async (data) => {
    const dueDates = Array.from({ length: safeInstallmentsCount }, (_, i) => data?.dueDates?.[i]).filter(Boolean);

    const payload = {
      name: data.name,
      description: data.description || undefined,
      numberOfInstallments: Number(data.numberOfInstallments),
      dueDates,
      isActive: !!data.isActive,
    };

    setLoading(true);
    const response = await editInstallmentPlan(payload, id);
    if (response.status) {
      toast.success("تم تعديل خطة التقسيط بنجاح");
      navigate("/financial/installment-plans");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل خطة التقسيط");
    }
    setLoading(false);
  };

  const handleSetDefault = async () => {
    setDefaulting(true);
    const response = await setDefaultInstallmentPlan(id);
    if (response.status) {
      toast.success("تم تعيين الخطة الافتراضية بنجاح");
      navigate("/financial/installment-plans");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعيين الخطة الافتراضية");
    }
    setDefaulting(false);
  };

  return (
    <Container>
      <Back title={"تعديل خطة التقسيط"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent={"space-between"} alignItems={{ xs: "start", sm: "center" }} spacing={4}>
          <Typography variant="title" fontWeight={"500"}>
            تفاصيل خطة التقسيط
          </Typography>

          {!!installmentPlan && !installmentPlan.isDefault && (
            <Button variant="outlined" onClick={handleSetDefault} disabled={defaulting}>
              تعيين كخطة افتراضية
            </Button>
          )}
        </Stack>

        {!!installmentPlan && installmentPlan.isDefault && (
          <Typography color={"primary.main"} mt={3} fontWeight={500}>
            هذه هي الخطة الافتراضية الحالية
          </Typography>
        )}

        {!!installmentPlan && (
          <Grid container mt={8} spacing={8}>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName={"name"}
                error={errors.name?.message}
                label={"اسم الخطة"}
                required={true}
                type={"text"}
                defaultValue={installmentPlan.name}
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
                defaultValue={installmentPlan.numberOfInstallments}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!watch("isActive")}
                    onChange={(e) => setValue("isActive", e.target.checked)}
                  />
                }
                label="الخطة نشطة"
              />
            </Grid>
          </Grid>
        )}
      </Box>

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
        مواعيد الاستحقاق
        </Typography>
        {!!installmentPlan && (
          <Grid container mt={8} spacing={8}>
            {safeInstallmentsCount > 0 && (
              <Grid item xs={12}>
                <Grid container spacing={6}>
                  {Array.from({ length: safeInstallmentsCount }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`edit-dueDate-${index}`}>
                      <Input
                        register={register}
                        registerName={`dueDates.${index}`}
                        error={errors?.dueDates?.[index]?.message}
                        label={`تاريخ استحقاق القسط ${index + 1}`}
                        required={true}
                        type={"date"}
                        defaultValue={watch("dueDates")?.[index] || installmentPlan?.dueDates?.[index]?.slice(0, 10)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || installmentPlanLoading || defaulting}
      />
    </Container>
  );
};

export default InstallmentPlansEditPage;
