import {
  CloseRounded,
  DirectionsBusRounded,
  SaveRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  Controller,
  useForm,
} from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import {
  fetchBusPlan,
  updateBusPlan,
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

const normalizeId = (value) => {
  if (!value) return "";

  if (
    typeof value === "object"
  ) {
    return String(
      value?._id ||
        value?.id ||
        ""
    );
  }

  return String(value);
};

const extractPlan = (
  response
) => {
  if (!response) {
    return null;
  }

  if (
    response?.status === false
  ) {
    return null;
  }

  const candidates = [
    response?.data?.busPlan,
    response?.data?.data,
    response?.data,
    response?.busPlan,
    response,
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value ===
          "object" &&
        !Array.isArray(
          value
        ) &&
        (
          value?._id ||
          value?.id ||
          value?.name
        )
    ) || null
  );
};

const BusPlansEditPage = () => {
  const navigate =
    useNavigate();

  const {
    id,
  } = useParams();

  const {
    installmentPlans = [],
  } = useInstallmentPlans();

  const [
    loadingPlan,
    setLoadingPlan,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
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
      isActive: true,
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

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) {
        setLoadError(
          "معرّف خطة الباص غير موجود"
        );
        setLoadingPlan(
          false
        );
        return;
      }

      setLoadingPlan(true);
      setLoadError("");

      try {
        const response =
          await fetchBusPlan(
            id
          );

        if (!active) {
          return;
        }

        if (
          response?.status === false
        ) {
          throw new Error(
            response?.message ||
              "تعذر تحميل خطة الباص"
          );
        }

        const plan =
          extractPlan(
            response
          );

        if (!plan) {
          throw new Error(
            "لم يتم العثور على خطة الباص"
          );
        }

        reset({
          name:
            plan?.name ||
            "",
          description:
            plan?.description ||
            "",
          serviceType:
            plan?.serviceType ||
            "both",
          fee:
            plan?.fee ??
            "",
          installmentPlanId:
            normalizeId(
              plan?.installmentPlanId
            ),
          isActive:
            plan?.isActive !==
            false,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error?.response?.data
            ?.message ||
          error?.message ||
          "تعذر تحميل خطة الباص";

        setLoadError(
          message
        );

        toast.error(
          message,
          {
            toastId:
              `bus-plan-load-${id}`,
          }
        );
      } finally {
        if (active) {
          setLoadingPlan(
            false
          );
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    id,
    reset,
  ]);

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
        ).trim(),
      serviceType:
        values?.serviceType,
      fee:
        Number(
          values?.fee
        ),
      installmentPlanId:
        values?.installmentPlanId ||
        null,
      isActive:
        Boolean(
          values?.isActive
        ),
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
      await updateBusPlan(
        id,
        payload
      );

    if (!response?.status) {
      toast.error(
        getErrorMessage(
          response,
          "تعذر تعديل خطة الباص"
        )
      );
      return;
    }

    toast.success(
      response?.message ||
        "تم تعديل خطة الباص بنجاح"
    );

    navigate(
      "/financial/bus-plans"
    );
  };

  if (loadingPlan) {
    return (
      <Container>
        <Box
          dir="rtl"
          sx={{ pb: 3 }}
        >
          <Paper
            elevation={0}
            sx={{
              ...pageCardSx,
              p: 1.5,
            }}
          >
            <Skeleton
              height={48}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              ...pageCardSx,
              mt: 1.25,
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Skeleton
                variant="rounded"
                height={52}
              />
              <Skeleton
                variant="rounded"
                height={52}
              />
              <Skeleton
                variant="rounded"
                height={90}
              />
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container>
        <Box
          dir="rtl"
          sx={{ pb: 3 }}
        >
          <Paper
            elevation={0}
            sx={{
              ...pageCardSx,
              p: 1.5,
            }}
          >
            <Back title="تعديل خطة الباص" />
          </Paper>

          <Alert
            severity="error"
            sx={{
              mt: 1.25,
              borderRadius:
                "14px",
            }}
          >
            {loadError}
          </Alert>
        </Box>
      </Container>
    );
  }

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
            <Back title="تعديل خطة الباص" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: 10,
              }}
            >
              التعديلات تطبق على الطلاب
              المسجلين بعد التعديل فقط.
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
                عدّل الاتجاه والسعر وخطة
                التقسيط والحالة.
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

            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({
                  field,
                }) => (
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.8,
                      border:
                        "1px solid rgba(36,74,112,.09)",
                      borderRadius:
                        "12px",
                      bgcolor:
                        "rgba(255,255,255,.72)",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(
                            field.value
                          )}
                          onChange={(
                            _event,
                            checked
                          ) =>
                            field.onChange(
                              checked
                            )
                          }
                        />
                      }
                      label={
                        field.value
                          ? "الخطة نشطة"
                          : "الخطة غير نشطة"
                      }
                      sx={{
                        m: 0,
                        "& .MuiFormControlLabel-label":
                          {
                            color:
                              "var(--color-navy-deep)",
                            fontSize:
                              12,
                            fontWeight:
                              800,
                          },
                      }}
                    />
                  </Box>
                )}
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
                : "حفظ التغييرات"}
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

export default BusPlansEditPage;
