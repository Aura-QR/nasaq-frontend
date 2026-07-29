import { Box, Grid } from "@mui/material";
import { ReceiptLongRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { editExpense } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import Select from "@/components/Select/Select";
import FinancialFormShell from "@/components/financial/FinancialFormShell";

import { getChangedValues } from "@/utils/helpers/getChangedValues";
import Years from "@/utils/constants/Years";
import { getCurrencyFieldLabel } from "@/utils/financial/financialUtils";
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
  const { categories = [] } = useExpenseCategories();

  useEffect(() => {
    if (!expense) return;

    const normalized = {
      name: expense.name || "",
      amount: Number(expense.amount || 0),
      date: expense.date ? expense.date.slice(0, 10) : "",
      notes: expense.notes || "",
      categoryId: expense.categoryId?._id || expense.categoryId || "",
      academicYear: expense.academicYear || "",
    };

    reset(normalized);
    setDefaultValues(normalized);
  }, [expense, reset]);

  const onSubmit = async (formValues) => {
    const payload = {
      name: formValues.name,
      amount: Number(formValues.amount),
      categoryId: formValues.categoryId || undefined,
      date: formValues.date || undefined,
      academicYear: formValues.academicYear || undefined,
      notes: formValues.notes || undefined,
    };

    const changedData = getChangedValues(payload, defaultValues || {});

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      return;
    }

    setLoading(true);

    try {
      const response = await editExpense(changedData, id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ ما أثناء تعديل المصروف"
        );
        return;
      }

      toast.success("تم تعديل المصروف بنجاح");
      navigate("/expenses");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ ما أثناء تعديل المصروف"
      );
    } finally {
      setLoading(false);
    }
  };

  if (expenseLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{ pb: 3 }}
      >
        <FinancialFormShell
          backTitle="تعديل مصروف"
          helperText="راجع بيانات المصروف وعدّل الحقول المطلوبة."
          sectionIcon={<ReceiptLongRounded />}
          sectionTitle="تفاصيل المصروف"
          sectionDescription="يمكنك تعديل المبلغ أو التصنيف أو التاريخ أو الملاحظات."
          loading={loading}
          submitLabel="حفظ التغييرات"
          onCancel={() => navigate(-1)}
        >
          {defaultValues && (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="name"
                  error={errors.name?.message}
                  label="اسم المصروف"
                  required
                  type="text"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="amount"
                  error={errors.amount?.message}
                  label={getCurrencyFieldLabel("المبلغ")}
                  required
                  type="number"
                  valueAsNumber
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Select
                  register={register}
                  registerName="categoryId"
                  data={categories}
                  name="name"
                  error={errors.categoryId?.message}
                  label="التصنيف"
                  required
                  defaultValue={defaultValues.categoryId}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="date"
                  error={errors.date?.message}
                  label="تاريخ المصروف"
                  required
                  type="date"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Select
                  register={register}
                  registerName="academicYear"
                  data={Years}
                  error={errors.academicYear?.message}
                  label="السنة الدراسية"
                  defaultValue={defaultValues.academicYear}
                  defaultSelect="غير محدد"
                />
              </Grid>

              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="notes"
                  error={errors.notes?.message}
                  label="ملاحظات"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </FinancialFormShell>
      </Box>
    </Container>
  );
};

export default ExpensesEditPage;
