import { Box, Paper, Stack, Typography } from "@mui/material";
import { CalendarMonthRounded } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import AcademicYearForm from "@/components/AcademicYears/AcademicYearForm";
import { createAcademicYear } from "@/APIs/school/academicYears";
import { getEntityId, unwrapApiData } from "@/utils/school/academicYearData";

const AcademicYearAdd = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const startDate = watch("startDate");

  const onSubmit = async (values) => {
    if (startDate && values.endDate < startDate) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    setLoading(true);
    const response = await createAcademicYear(values);
    if (response?.status === false) {
      toast.error(response?.message || "تعذر إنشاء السنة الدراسية");
      setLoading(false);
      return;
    }

    toast.success("تم إنشاء السنة الدراسية بنجاح");
    const yearId = getEntityId(unwrapApiData(response));
    navigate(
      yearId ? `/school/academic-years/${yearId}` : "/school/academic-years",
      { replace: true }
    );
  };

  return (
    <Container>
      <Box component="form" noValidate dir="rtl" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.2}>
          <Paper elevation={0} sx={{ p: { xs: 1.4, md: 1.7 }, display: "flex", alignItems: "center", gap: 1, border: "1px solid rgba(36,74,112,0.08)", borderRadius: "18px", background: "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))" }}>
            <CalendarMonthRounded sx={{ color: "var(--color-gold-dark)" }} />
            <Box>
              <Typography component="h1" sx={{ color: "var(--color-navy-deep)", fontSize: { xs: "20px", md: "24px" }, fontWeight: 900 }}>
                بدء سنة دراسية جديدة
              </Typography>
              <Typography sx={{ color: "var(--color-muted)", fontSize: "9.5px" }}>
                بعد الإنشاء ستنتقل مباشرة لإعداد الترمات.
              </Typography>
            </Box>
          </Paper>

          <AcademicYearForm
            register={register}
            errors={errors}
            loading={loading}
            onCancel={() => navigate("/school/academic-years")}
          />
        </Stack>
      </Box>
    </Container>
  );
};

export default AcademicYearAdd;
