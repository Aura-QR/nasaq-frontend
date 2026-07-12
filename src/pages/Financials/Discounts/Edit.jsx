import { Box, Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { editDiscount } from "@/APIs/financials/discounts";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useDiscount } from "@/utils/hooks/apis/financials/useDiscount";

const DiscountsEditPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const { discount, loading: discountLoading } = useDiscount(id);

  useEffect(() => {
    if (discount) {
      const normalized = {
        name: discount.name,
        description: discount.description || "",
        percentage: discount.percentage,
        isActive: discount.isActive,
      };
      reset(normalized);
      setDefaultValues(normalized);
    }
  }, [discount, reset]);

  const onSubmit = async (data) => {
    setLoading(true);

    const payload = {
      name: data.name,
      description: data.description || undefined,
      percentage: Number(data.percentage),
      isActive: !!data.isActive,
    };

    const changedData = getChangedValues(payload, defaultValues || {});
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editDiscount(changedData, id);
    if (response.status) {
      toast.success("تم تعديل الخصم بنجاح");
      navigate("/financial/discounts");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل الخصم");
    }

    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل خصم"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الخصم
        </Typography>

        {defaultValues && (
          <Grid container mt={8} spacing={8}>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName={"name"}
                error={errors.name?.message}
                label={"اسم الخصم"}
                required={true}
                type={"text"}
                defaultValue={defaultValues.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName={"percentage"}
                error={errors.percentage?.message}
                label={"نسبة الخصم (%)"}
                required={true}
                type={"number"}
                valueAsNumber={true}
                defaultValue={defaultValues.percentage}
              />
            </Grid>

            <Grid item xs={12}>
              <Input
                register={register}
                registerName={"description"}
                error={errors.description?.message}
                label={"الوصف"}
                type={"text"}
                multiline={true}
                defaultValue={defaultValues.description}
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
                label="الخصم نشط"
              />
            </Grid>
          </Grid>
        )}
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || discountLoading}
      />
    </Container>
  );
};

export default DiscountsEditPage;
