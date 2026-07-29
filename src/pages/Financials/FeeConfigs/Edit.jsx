import {
  AccountBalanceWalletRounded,
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";
import {
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
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { editFeeConfig } from "@/APIs/financials/feeConfigs";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import Select from "@/components/Select/Select";
import { formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import Years from "@/utils/constants/Years";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useFeeConfig } from "@/utils/hooks/apis/financials/useFeeConfig";

const FeeConfigsEditPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { feeConfig, loading: feeConfigLoading } = useFeeConfig(id);

  useEffect(() => {
    if (!feeConfig) return;

    const normalized = {
      academicYear: feeConfig.academicYear || "",
      tuitionFee: Number(feeConfig.tuitionFee || 0),
    };

    reset(normalized);
    setDefaultValues(normalized);
  }, [feeConfig, reset]);

  const onSubmit = async (formValues) => {
    const normalized = {
      academicYear: formValues.academicYear,
      tuitionFee: Number(formValues.tuitionFee),
    };

    const changedData = getChangedValues(normalized, defaultValues || {});

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      return;
    }

    setLoading(true);

    try {
      const response = await editFeeConfig(changedData, id);

      if (!response?.status) {
        toast.error(
          response?.message || response || "حدث خطأ أثناء تعديل إعداد الرسوم",
        );
        return;
      }

      toast.success(response?.message || "تم تعديل إعداد الرسوم بنجاح");
      navigate("/financial/fee-configs");
    } finally {
      setLoading(false);
    }
  };

  if (feeConfigLoading) return <Loading />;

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{ pb: 3 }}
      >
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="تعديل إعداد الرسوم" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
              عدّل السنة أو قيمة الرسوم ثم احفظ التغييرات.
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
                sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}
              >
                تفاصيل إعداد الرسوم
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10 }}>
                ستُطبق القيمة الجديدة عند استخدام هذا الإعداد.
              </Typography>
            </Box>
          </Stack>

          {defaultValues && (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Select
                  register={register}
                  registerName="academicYear"
                  data={Years}
                  error={errors.academicYear?.message}
                  label="السنة الدراسية"
                  required
                  defaultValue={defaultValues.academicYear}
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
                  defaultValue={defaultValues.tuitionFee}
                />
              </Grid>
            </Grid>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, px: 1.5, py: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />
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
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
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

export default FeeConfigsEditPage;
