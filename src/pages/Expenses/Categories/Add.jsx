import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addExpenseCategory } from "@/APIs/expenses";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";

const ExpenseCategoriesAddPage = () => {
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
    };

    setLoading(true);
    const response = await addExpenseCategory(payload);
    if (response.status) {
      toast.success("تم إضافة التصنيف بنجاح");
      navigate("/expenses/categories");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة التصنيف");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة تصنيف مصروفات"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل التصنيف
        </Typography>

        <Grid container mt={8} spacing={8}>
          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"name"}
              error={errors.name?.message}
              label={"اسم التصنيف"}
              required={true}
              type={"text"}
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

export default ExpenseCategoriesAddPage;
