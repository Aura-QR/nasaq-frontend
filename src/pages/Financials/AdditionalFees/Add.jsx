import { Box, Grid, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { AccountBalanceWalletRounded } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addAdditionalFee } from "@/APIs/financials/additionalFees";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { FormActions, formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import Select from "@/components/Select/Select";

const AdditionalFeesAddPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      targetType: "school",
    },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const selectedTargetType = watch("targetType");

  const onSubmit = async (data) => {
    setLoading(true);

    const payload = {
      name: data.name,
      amount: Number(data.amount),
      description: data.description || undefined,
      targetType: data.targetType,
    };

    if (data.targetType === "student" || data.targetType === "class") {
      if (!data.targetId) {
        toast.error("يرجى إدخال معرف الهدف (targetId)");
        setLoading(false);
        return;
      }
      payload.targetId = data.targetId;
    } else if (data.targetType === "academicYear") {
      if (!data.targetAcademicYear && !data.targetId) {
        toast.error("يرجى تحديد السنة الدراسية");
        setLoading(false);
        return;
      }
      if (data.targetAcademicYear) payload.targetAcademicYear = data.targetAcademicYear;
      if (data.targetId) payload.targetId = data.targetId;
    }

    const response = await addAdditionalFee(payload);

    if (response?.status || response?.data) {
      toast.success("تم إضافة الرسوم الإضافية بنجاح");
      navigate("/financial/additional-fees");
    } else {
      toast.error(typeof response === "string" ? response : response?.message || "حدث خطأ أثناء إضافة الرسوم الإضافية");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} dir="rtl" sx={{ pb: 3 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, p: 1.4 }}>
          <Back title="إضافة رسوم إضافية" />
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 1.5, pb: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                bgcolor: "var(--color-gold-soft)",
                color: "var(--color-gold-dark)",
                borderRadius: "12px",
              }}
            >
              <AccountBalanceWalletRounded />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--color-navy-deep)" }}>
                تفاصيل الرسوم الإضافية
              </Typography>
              <Typography sx={{ fontSize: 10, color: "var(--color-muted)" }}>
                أدخل اسم الرسوم وقيمتها ونطاق التطبيق.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName="name"
                error={errors.name?.message}
                label="اسم الرسوم"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName="amount"
                error={errors.amount?.message}
                label="المبلغ"
                required
                type="number"
                valueAsNumber
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Select
                register={register}
                registerName="targetType"
                error={errors.targetType?.message}
                label="نوع الاستهداف"
                required
              >
                <MenuItem value="school">المدرسة بأكملها (school)</MenuItem>
                <MenuItem value="all">الكل (all)</MenuItem>
                <MenuItem value="class">فصل محدد (class)</MenuItem>
                <MenuItem value="student">طالب محدد (student)</MenuItem>
                <MenuItem value="academicYear">سنة دراسية (academicYear)</MenuItem>
              </Select>
            </Grid>

            {(selectedTargetType === "student" || selectedTargetType === "class") && (
              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="targetId"
                  error={errors.targetId?.message}
                  label={selectedTargetType === "student" ? "معرف الطالب (targetId)" : "معرف الفصل (targetId)"}
                  required
                />
              </Grid>
            )}

            {selectedTargetType === "academicYear" && (
              <Grid item xs={12} sm={6}>
                <Input
                  register={register}
                  registerName="targetAcademicYear"
                  error={errors.targetAcademicYear?.message}
                  label="السنة الدراسية (مثل: 2025-2026)"
                  required
                />
              </Grid>
            )}

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
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, p: 1.4 }}>
          <FormActions loading={loading} onCancel={() => navigate(-1)} label="حفظ الرسوم الإضافية" />
        </Paper>
      </Box>
    </Container>
  );
};

export default AdditionalFeesAddPage;
