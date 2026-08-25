import {
  CloseRounded,
  SaveRounded,
  TourRounded,
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
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import {
  fetchTripTemplate,
  updateTripTemplate,
} from "@/APIs/financials/trips";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";

import {
  formFieldsSx,
  pageCardSx,
} from "@/components/financial/FinancialShell";

const extractTrip = (response) => {
  if (!response) return null;

  if (response?.status === false) {
    return null;
  }

  const candidates = [
    response?.data?.trip,
    response?.data?.data,
    response?.data,
    response?.trip,
    response,
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        (value?._id || value?.id || value?.name)
    ) || null
  );
};

const ModuleTripsEditPage = () => {
  const navigate = useNavigate();

  const {
    tripTemplateId,
    id,
  } = useParams();

  const templateId =
    tripTemplateId || id || "";

  const [loadingTrip, setLoadingTrip] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

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
      fee: "",
      isActive: true,
    },
  });

  useEffect(() => {
    let active = true;

    const loadTrip = async () => {
      if (!templateId) {
        setLoadError(
          "معرّف الرحلة غير موجود"
        );
        setLoadingTrip(false);
        return;
      }

      setLoadingTrip(true);
      setLoadError("");

      try {
        const response =
          await fetchTripTemplate(
            templateId
          );

        if (!active) return;

        if (response?.status === false) {
          throw new Error(
            response?.message ||
              "تعذر تحميل بيانات الرحلة"
          );
        }

        const trip =
          extractTrip(response);

        if (!trip) {
          throw new Error(
            "لم يتم العثور على بيانات الرحلة"
          );
        }

        reset({
          name: trip?.name || "",
          description:
            trip?.description || "",
          fee: trip?.fee ?? "",
          isActive:
            trip?.isActive !== false,
        });
      } catch (error) {
        if (!active) return;

        console.error(
          "[Trips] load template error:",
          error
        );

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "تعذر تحميل بيانات الرحلة";

        setLoadError(message);

        toast.error(message, {
          toastId:
            `trip-edit-load-${templateId}`,
        });
      } finally {
        if (active) {
          setLoadingTrip(false);
        }
      }
    };

    loadTrip();

    return () => {
      active = false;
    };
  }, [templateId, reset]);

  const onSubmit = async (
    formValues
  ) => {
    const name = String(
      formValues?.name || ""
    ).trim();

    const fee = Number(
      formValues?.fee
    );

    if (!name) {
      toast.error("اسم الرحلة مطلوب");
      return;
    }

    if (
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      toast.error(
        "رسوم الرحلة يجب أن تكون رقمًا صحيحًا أكبر من أو يساوي صفر"
      );
      return;
    }

    const response =
      await updateTripTemplate(
        templateId,
        {
          name,
          description: String(
            formValues?.description || ""
          ).trim(),
          fee,
          isActive: Boolean(
            formValues?.isActive
          ),
        }
      );

    if (!response?.status) {
      toast.error(
        response?.message ||
          response ||
          "حدث خطأ أثناء تعديل الرحلة"
      );
      return;
    }

    toast.success(
      response?.message ||
        "تم تعديل الرحلة بنجاح"
    );

    navigate(
      `/financial/trips/${templateId}`
    );
  };

  if (loadingTrip) {
    return (
      <Container>
        <Box dir="rtl" sx={{ pb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              ...pageCardSx,
              px: 1.5,
              py: 1.05,
            }}
          >
            <Skeleton
              variant="rounded"
              height={44}
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
                height={100}
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
        <Box dir="rtl" sx={{ pb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              ...pageCardSx,
              px: 1.5,
              py: 1.05,
            }}
          >
            <Back title="تعديل الرحلة" />
          </Paper>

          <Alert
            severity="error"
            sx={{
              mt: 1.25,
              borderRadius: "14px",
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
        onSubmit={handleSubmit(onSubmit)}
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
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            gap={1}
          >
            <Back title="تعديل الرحلة" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: 10,
              }}
            >
              تعديل سعر القالب يطبق على التسجيلات الجديدة فقط، ولا يغيّر رسوم الطلاب المسجلين سابقًا.
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
                placeItems: "center",
                color:
                  "var(--color-gold-dark)",
                bgcolor:
                  "var(--color-gold-soft)",
                borderRadius: "12px",
              }}
            >
              <TourRounded />
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
                تفاصيل الرحلة
              </Typography>

              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 10,
                }}
              >
                عدّل الاسم والوصف والرسوم وحالة الرحلة.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Input
                register={register}
                registerName="name"
                error={errors.name?.message}
                label="اسم الرحلة"
                required
                type="text"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Input
                register={register}
                registerName="fee"
                error={errors.fee?.message}
                label="رسوم الرحلة"
                required
                type="number"
                valueAsNumber
              />
            </Grid>

            <Grid item xs={12}>
              <Input
                register={register}
                registerName="description"
                error={
                  errors.description?.message
                }
                label="وصف الرحلة"
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
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
                          ? "الرحلة نشطة"
                          : "الرحلة غير نشطة"
                      }
                      sx={{
                        m: 0,
                        "& .MuiFormControlLabel-label":
                          {
                            color:
                              "var(--color-navy-deep)",
                            fontSize: 12,
                            fontWeight: 800,
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
              disabled={isSubmitting}
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
                borderRadius: "12px",
                background:
                  "var(--color-navy)",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {isSubmitting
                ? "جاري الحفظ..."
                : "حفظ التغييرات"}
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                navigate(
                  `/financial/trips/${templateId}`
                )
              }
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{
                width: {
                  xs: "100%",
                  sm: 135,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
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

export default ModuleTripsEditPage;
