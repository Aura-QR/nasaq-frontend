import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { editExpenseCategory } from "@/APIs/expenses";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";
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
    if (category) {
      const normalized = {
        name: category.name,
        description: category.description || "",
      };
      reset(normalized);
      setDefaultValues(normalized);
    }
  }, [category, reset]);

  const onSubmit = async (data) => {
    setLoading(true);

    const payload = {
      name: data.name,
      description: data.description || undefined,
    };

    const changedData = getChangedValues(payload, defaultValues || {});
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editExpenseCategory(changedData, id);
    if (response.status) {
      toast.success("تم تعديل التصنيف بنجاح");
      navigate("/expenses/categories");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل التصنيف");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل تصنيف مصروفات"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل التصنيف
        </Typography>

        {defaultValues && (
          <Grid container mt={8} spacing={8}>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName={"name"}
                error={errors.name?.message}
                label={"اسم التصنيف"}
                required={true}
                type={"text"}
                defaultValue={defaultValues.name}
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
          </Grid>
        )}
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || categoryLoading}
      />
    </Container>
  );
};

export default ExpenseCategoriesEditPage;
