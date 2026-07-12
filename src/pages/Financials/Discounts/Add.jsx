import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addDiscount } from "@/APIs/financials/discounts";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";

const DiscountsAddPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      percentage: Number(data.percentage),
    };

    setLoading(true);
    const response = await addDiscount(payload);
    if (response.status) {
      toast.success("تم إضافة الخصم بنجاح");
      navigate("/financial/discounts");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة الخصم");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة خصم"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الخصم
        </Typography>

        <Grid container mt={8} spacing={8}>
          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"name"}
              error={errors.name?.message}
              label={"اسم الخصم"}
              required={true}
              type={"text"}
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
            />
          </Grid>
        </Grid>
      </Box>

      <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} />
    </Container>
  );
};

export default DiscountsAddPage;
