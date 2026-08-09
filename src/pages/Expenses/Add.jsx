import { Box, Grid } from "@mui/material";
import { ReceiptLongRounded } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { addExpense } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import FinancialFormShell from "@/components/financial/FinancialFormShell";

import Years from "@/utils/constants/Years";
import { getCurrencyFieldLabel } from "@/utils/financial/financialUtils";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";
import usePermissions from "@/utils/hooks/usePermissions";


const getCategoryItems = (value, depth = 0) => {
  if (!value || depth > 5) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "object") {
    return [];
  }

  for (const key of [
    "docs",
    "items",
    "results",
    "categories",
    "data",
  ]) {
    const items = getCategoryItems(
      value?.[key],
      depth + 1
    );

    if (items.length > 0) {
      return items;
    }
  }

  return [];
};

const normalizeCategoryOptions = (value) =>
  getCategoryItems(value)
    .map((item) => {
      const id =
        item?._id ||
        item?.id ||
        item?.value ||
        "";

      const label =
        item?.name ||
        item?.label ||
        item?.title ||
        "";

      if (!id || !label) {
        return null;
      }

      return {
        ...item,
        _id: String(id),
        id: String(id),
        value: String(id),
        name: String(label),
        label: String(label),
      };
    })
    .filter(Boolean);

const ExpensesAddPage = () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { date: today },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { categories = [] } = useExpenseCategories();
  const permissions =
    usePermissions("expenses");

  const categoryOptions = useMemo(
    () => normalizeCategoryOptions(categories),
    [categories]
  );

  const onSubmit = async (formValues) => {
    if (!permissions?.add) {
      toast.error(
        "ليس لديك صلاحية إضافة المصروفات"
      );
      return;
    }

    const payload = {
      name: formValues.name,
      amount: Number(formValues.amount),
      categoryId: formValues.categoryId || undefined,
      date: formValues.date,
      academicYear: formValues.academicYear || undefined,
      notes: formValues.notes || undefined,
    };

    setLoading(true);

    try {
      const response = await addExpense(payload);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ ما أثناء إضافة المصروف"
        );
        return;
      }

      toast.success("تم إضافة المصروف بنجاح");
      navigate("/expenses");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ ما أثناء إضافة المصروف"
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
          backTitle="إضافة مصروف"
          helperText="أدخل بيانات المصروف ثم احفظ السجل."
          sectionIcon={<ReceiptLongRounded />}
          sectionTitle="تفاصيل المصروف"
          sectionDescription="أضف الاسم والمبلغ والتصنيف والتاريخ."
          loading={loading}
          submitLabel="حفظ المصروف"
          onCancel={() => navigate(-1)}
        >
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
                data={categoryOptions}
                name="name"
                error={errors.categoryId?.message}
                label="التصنيف"
                required
                defaultSelect="اختر التصنيف"
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
        </FinancialFormShell>
      </Box>
    </Container>
  );
};

export default ExpensesAddPage;
