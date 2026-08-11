import {
  AccountBalanceWalletRounded,
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { addFeeConfig } from "@/APIs/financials/feeConfigs";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import { useFeeConfigOptions } from "@/utils/hooks/apis/financials/useFeeConfigOptions";

const FeeConfigsAddPage = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      academicYearId: "",
      gradeLevelId: "",
      tuitionFee: "",
      expatriateSurchargePercentage: 15,
    },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    academicYearOptions,
    gradeLevelOptions,
    activeAcademicYearId,
    loadingOptions,
    optionsError,
  } = useFeeConfigOptions();

  useEffect(() => {
    if (activeAcademicYearId) {
      setValue("academicYearId", activeAcademicYearId);
    }
  }, [activeAcademicYearId, setValue]);

  const onSubmit = async (formValues) => {
    const payload = {
      academicYearId: formValues.academicYearId,
      gradeLevelId: formValues.gradeLevelId,
      tuitionFee: Number(formValues.tuitionFee),
      expatriateSurchargePercentage: Number(
        formValues.expatriateSurchargePercentage,
      ),
    };

    setLoading(true);

    try {
      const response = await addFeeConfig(payload);

      if (!response?.status) {
        toast.error(
          response?.message || response || "حدث خطأ أثناء إضافة إعداد الرسوم",
        );
        return;
      }

      toast.success(response?.message || "تم إضافة إعداد الرسوم بنجاح");
      navigate("/financial/fee-configs");
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
        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="إضافة إعداد رسوم" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
              حدّد السنة والصف والرسوم السنوية ونسبة الزيادة لغير الجنسيات المحلية.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            ...formFieldsSx,
            mt: 1.25,
            p: { xs: 1.5, md: 2 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              pb: 1.25,
              mb: 1.5,
              borderBottom: "1px solid rgba(36,74,112,.07)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                color: "var(--color-gold-dark)",
                bgcolor: "var(--color-gold-soft)",
                borderRadius: "12px",
              }}
            >
              <AccountBalanceWalletRounded />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: "var(--color-navy-deep)",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                تفاصيل إعداد الرسوم
              </Typography>
              <Typography
                sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10 }}
              >
                يجب إنشاء إعداد واحد فقط لكل سنة دراسية وصف دراسي.
              </Typography>
            </Box>
          </Stack>

          {optionsError && (
            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "12px" }}>
              {optionsError}
            </Alert>
          )}

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Select
                register={register}
                registerName="academicYearId"
                data={academicYearOptions}
                name="name"
                error={errors.academicYearId?.message}
                label="السنة الدراسية"
                required
                disabled={loadingOptions}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Select
                register={register}
                registerName="gradeLevelId"
                data={gradeLevelOptions}
                name="name"
                error={errors.gradeLevelId?.message}
                label="الصف الدراسي"
                required
                disabled={loadingOptions}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName="tuitionFee"
                error={errors.tuitionFee?.message}
                label="الرسوم السنوية"
                required
                type="number"
                valueAsNumber
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Input
                register={register}
                registerName="expatriateSurchargePercentage"
                error={errors.expatriateSurchargePercentage?.message}
                label="نسبة زيادة غير المحليين (%)"
                required
                type="number"
                valueAsNumber
                defaultValue={15}
                inputProps={{ min: 0, max: 100, step: "0.01" }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{ ...pageCardSx, mt: 1.25, px: 1.5, py: 1.15 }}
        >
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={loading || loadingOptions}
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: { xs: "100%", sm: 190 },
                minHeight: 44,
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ إعداد الرسوم"}
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={() => navigate(-1)}
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{
                width: { xs: "100%", sm: 140 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-navy)",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default FeeConfigsAddPage;
