import { Box, Grid } from "@mui/material";
import { CategoryRounded } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { addExpenseCategory } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import FinancialFormShell from "@/components/financial/FinancialFormShell";

const ExpenseCategoriesAddPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (formValues) => {
    const payload = {
      name: formValues.name,
      description: formValues.description || undefined,
    };

    setLoading(true);

    try {
      const response = await addExpenseCategory(payload);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ ما أثناء إضافة التصنيف"
        );
        return;
      }

      toast.success("تم إضافة التصنيف بنجاح");
      navigate("/expenses/categories");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ ما أثناء إضافة التصنيف"
      );
    } finally {
      setLoading(false);
    }
  };

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
          backTitle="إضافة تصنيف مصروفات"
          helperText="أدخل اسم التصنيف ووصفه ثم احفظ البيانات."
          sectionIcon={<CategoryRounded />}
          sectionTitle="تفاصيل التصنيف"
          sectionDescription="استخدم اسمًا واضحًا يسهل اختياره عند تسجيل المصروف."
          loading={loading}
          submitLabel="حفظ التصنيف"
          onCancel={() => navigate(-1)}
        >
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
        </FinancialFormShell>
      </Box>
    </Container>
  );
};

export default ExpenseCategoriesAddPage;
