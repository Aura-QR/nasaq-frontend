import { Box, Grid } from "@mui/material";
import { CategoryRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { editExpenseCategory } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import FinancialFormShell from "@/components/financial/FinancialFormShell";

import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useExpenseCategory } from "@/utils/hooks/apis/expenses/useExpenseCategory";

const ExpenseCategoriesEditPage = () => {
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

  const { category, loading: categoryLoading } = useExpenseCategory(id);

  useEffect(() => {
    if (!category) return;

    const normalized = {
      name: category.name || "",
      description: category.description || "",
    };

    reset(normalized);
    setDefaultValues(normalized);
  }, [category, reset]);

  const onSubmit = async (formValues) => {
    const payload = {
      name: formValues.name,
      description: formValues.description || undefined,
    };

    const changedData = getChangedValues(payload, defaultValues || {});

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      return;
    }

    setLoading(true);

    try {
      const response = await editExpenseCategory(changedData, id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ ما أثناء تعديل التصنيف"
        );
        return;
      }

      toast.success("تم تعديل التصنيف بنجاح");
      navigate("/expenses/categories");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ ما أثناء تعديل التصنيف"
      );
    } finally {
      setLoading(false);
    }
  };

  if (categoryLoading) {
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
          backTitle="تعديل تصنيف مصروفات"
          helperText="راجع بيانات التصنيف وعدّل الحقول المطلوبة."
          sectionIcon={<CategoryRounded />}
          sectionTitle="تفاصيل التصنيف"
          sectionDescription="يمكنك تعديل اسم التصنيف أو وصفه."
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
                  label="اسم التصنيف"
                  required
                  type="text"
                />
              </Grid>

              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="description"
                  error={errors.description?.message}
                  label="الوصف"
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

export default ExpenseCategoriesEditPage;
