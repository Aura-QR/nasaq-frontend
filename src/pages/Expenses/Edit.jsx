import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { editExpense } from "@/APIs/expenses";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubmitSection from "@/components/SubmitSection";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import Years from "@/utils/constants/Years";
import { useExpense } from "@/utils/hooks/apis/expenses/useExpense";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";

const ExpensesEditPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const { expense, loading: expenseLoading } = useExpense(id);
  const { categories } = useExpenseCategories();

  useEffect(() => {
    if (expense) {
      const normalized = {
        name: expense.name,
        amount: expense.amount,
        date: expense.date ? expense.date.slice(0, 10) : "",
        notes: expense.notes || "",
        categoryId: expense.categoryId?._id || expense.categoryId || "",
        academicYear: expense.academicYear || "",
      };
      reset(normalized);
      setDefaultValues(normalized);
    }
  }, [expense, reset]);

  const onSubmit = async (data) => {
    setLoading(true);

    const payload = {
      name: data.name,
      amount: Number(data.amount),
      categoryId: data.categoryId || undefined,
      date: data.date || undefined,
      academicYear: data.academicYear || undefined,
      notes: data.notes || undefined,
    };

    const changedData = getChangedValues(payload, {
      name: defaultValues?.name,
      amount: defaultValues?.amount,
      categoryId: defaultValues?.categoryId,
      date: defaultValues?.date,
      academicYear: defaultValues?.academicYear,
      notes: defaultValues?.notes,
    });

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editExpense(changedData, id);
    if (response.status) {
      toast.success("تم تعديل المصروف بنجاح");
      navigate("/expenses");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل المصروف");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل مصروف"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المصروف
        </Typography>

        {defaultValues && (
          <Grid container mt={8} spacing={8}>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName={"name"}
                error={errors.name?.message}
                label={"اسم المصروف"}
                required={true}
                type={"text"}
                defaultValue={defaultValues.name}
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
                defaultValue={defaultValues.amount}
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
                defaultValue={defaultValues.categoryId}
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
                defaultValue={defaultValues.date}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Select
                register={register}
                registerName={"academicYear"}
                data={Years}
                error={errors.academicYear?.message}
                label={"السنة الدراسية"}
                defaultValue={defaultValues.academicYear}
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
                defaultValue={defaultValues.notes}
              />
            </Grid>
          </Grid>
        )}
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || expenseLoading}
      />
    </Container>
  );
};

export default ExpensesEditPage;
