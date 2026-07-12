import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addExpense } from "@/APIs/expenses";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubmitSection from "@/components/SubmitSection";
import Years from "@/utils/constants/Years";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";

const ExpensesAddPage = () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: today,
    },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { categories } = useExpenseCategories();

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      amount: Number(data.amount),
      categoryId: data.categoryId || undefined,
      date: data.date,
      academicYear: data.academicYear || undefined,
      notes: data.notes || undefined,
    };

    setLoading(true);
    const response = await addExpense(payload);
    if (response.status) {
      toast.success("تم إضافة المصروف بنجاح");
      navigate("/expenses");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة المصروف");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة مصروف"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المصروف
        </Typography>

        <Grid container mt={8} spacing={8}>
          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"name"}
              error={errors.name?.message}
              label={"اسم المصروف"}
              required={true}
              type={"text"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"amount"}
              error={errors.amount?.message}
              label={"المبلغ (ريال)"}
              required={true}
              type={"number"}
              valueAsNumber={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"categoryId"}
              data={categories || []}
              name="name"
              error={errors.categoryId?.message}
              label={"التصنيف"}
              required={true}
              defaultSelect="اختر التصنيف"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"date"}
              error={errors.date?.message}
              label={"تاريخ المصروف"}
              required={true}
              type={"date"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"academicYear"}
              data={Years}
              error={errors.academicYear?.message}
              label={"السنة الدراسية"}
              defaultSelect="غير محدد"
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              register={register}
              registerName={"notes"}
              error={errors.notes?.message}
              label={"ملاحظات"}
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

export default ExpensesAddPage;
