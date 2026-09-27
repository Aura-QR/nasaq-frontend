import {
  CloseRounded,
  DirectionsBusRounded,
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
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createBusPlan,
} from "@/APIs/financials/busPlans";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";

import {
  formFieldsSx,
  pageCardSx,
} from "@/components/financial/FinancialShell";

import {
  getErrorMessage,
} from "@/utils/financial/financialUtils";

import {
  useInstallmentPlans,
} from "@/utils/hooks/apis/financials/useInstallmentPlans";

const SERVICE_TYPES = [
  {
    _id: "pickup",
    displayName:
      "ذهاب فقط",
  },
  {
    _id: "dropoff",
    displayName:
      "عودة فقط",
  },
  {
    _id: "both",
    displayName:
      "ذهاب وعودة",
  },
];

const BusPlansAddPage = () => {
  const navigate = useNavigate();

  const {
    installmentPlans = [],
  } = useInstallmentPlans();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      serviceType:
        "both",
      fee: "",
      installmentPlanId:
        "",
    },
  });

  const planOptions =
    installmentPlans.map(
      (plan) => ({
        ...plan,
        _id:
          plan?._id ||
          plan?.id,
        displayName:
          `${plan?.name || "خطة"}${
            plan?.numberOfInstallments
              ? ` (${plan.numberOfInstallments} قسط)`
              : ""
          }`,
      })
    );

  const onSubmit = async (
    values
  ) => {
    const payload = {
      name:
        String(
          values?.name || ""
        ).trim(),
      description:
        String(
          values?.description ||
            ""
        ).trim() ||
        undefined,
      serviceType:
        values?.serviceType,
      fee:
        Number(
          values?.fee
        ),
      installmentPlanId:
        values?.installmentPlanId ||
        undefined,
    };

    if (!payload.name) {
      toast.error(
        "اسم خطة الباص مطلوب"
      );
      return;
    }

    if (
      ![
        "pickup",
        "dropoff",
        "both",
      ].includes(
        payload.serviceType
      )
    ) {
      toast.error(
        "نوع الخدمة مطلوب"
      );
      return;
    }

    if (
      !Number.isFinite(
        payload.fee
      ) ||
      payload.fee < 0
    ) {
      toast.error(
        "رسوم الخطة يجب أن تكون صفر أو أكثر"
      );
      return;
    }

    const response =
      await createBusPlan(
        payload
      );

    if (!response?.status) {
      toast.error(
        getErrorMessage(
          response,
          "تعذر إنشاء خطة الباص"
        )
      );
      return;
    }

    toast.success(
      response?.message ||
        "تم إنشاء خطة الباص بنجاح"
    );

    navigate(
      "/financial/bus-plans"
    );
  };

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(
          onSubmit
        )}
        noValidate
        dir="rtl"
        sx={{ pb: 3 }}
      >
        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            px: 1.5,
            py: 1.05,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="إضافة خطة باص" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: 10,
              }}
            >
              الاتجاه والسعر وخطة التقسيط
              جزء ثابت من خطة الباص.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            ...formFieldsSx,
            mt: 1.25,
            p: {
              xs: 1.5,
              md: 2,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems:
                  "center",
                color:
                  "var(--color-gold-dark)",
                bgcolor:
                  "var(--color-gold-soft)",
                borderRadius:
                  "12px",
              }}
            >
              <DirectionsBusRounded />
            </Box>

            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                بيانات خطة الباص
              </Typography>

              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 10,
                }}
              >
                مثال: VIP - ذهاب وعودة.
              </Typography>
            </Box>
          </Stack>

          <Grid
            container
            spacing={1.5}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Input
                register={register}
                registerName="name"
                error={
                  errors.name
                    ?.message
                }
                label="اسم الخطة"
                required
                type="text"
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <Input
                register={register}
                registerName="fee"
                error={
                  errors.fee
                    ?.message
                }
                label="رسوم الخطة"
                required
                type="number"
                valueAsNumber
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <Select
                register={
                  register
                }
                registerName="serviceType"
                data={
                  SERVICE_TYPES
                }
                name="displayName"
                label="نوع الخدمة"
                required
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <Select
                register={
                  register
                }
                registerName="installmentPlanId"
                data={
                  planOptions
                }
                name="displayName"
                label="خطة التقسيط"
                defaultSelect="بدون تقسيط - دفعة واحدة"
              />
            </Grid>

            <Grid item xs={12}>
              <Input
                register={register}
                registerName="description"
                error={
                  errors.description
                    ?.message
                }
                label="وصف الخطة"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mt: 1.25,
            px: 1.5,
            py: 1.15,
          }}
        >
          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            gap={1}
          >
            <Button
              type="submit"
              disabled={
                isSubmitting
              }
              variant="contained"
              startIcon={
                isSubmitting ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 170,
                },
                minHeight: 44,
                borderRadius:
                  "12px",
                background:
                  "var(--color-navy)",
                fontWeight: 800,
                textTransform:
                  "none",
              }}
            >
              {isSubmitting
                ? "جاري الحفظ..."
                : "إنشاء الخطة"}
            </Button>

            <Button
              type="button"
              disabled={
                isSubmitting
              }
              onClick={() =>
                navigate(
                  "/financial/bus-plans"
                )
              }
              variant="outlined"
              startIcon={
                <CloseRounded />
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 135,
                },
                minHeight: 44,
                borderRadius:
                  "12px",
                color:
                  "var(--color-navy)",
                fontWeight: 800,
                textTransform:
                  "none",
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

export default BusPlansAddPage;
