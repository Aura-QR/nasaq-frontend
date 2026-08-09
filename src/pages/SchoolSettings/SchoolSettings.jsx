import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

import {
  CheckCircleRounded,
  FactCheckRounded,
  InfoOutlined,
  RestartAltRounded,
  SaveRounded,
  SettingsRounded,
  TuneRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";

import {
  fetchSchoolSettings,
  updateSchoolSettings,
} from "@/APIs/school/schoolSettings";

const DEFAULT_PASSING_GRADE = 50;
const QUICK_VALUES = [40, 50, 60, 70];

const unwrapResponse = (response) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractSettings = (response) => {
  const payload = unwrapResponse(response) || {};

  return (
    payload?.settings ||
    payload?.school?.settings ||
    payload
  );
};

const normalizePassingGrade = (value) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? Math.min(100, Math.max(0, numberValue))
    : DEFAULT_PASSING_GRADE;
};

const isValidPassingGrade = (value) =>
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const getLoadErrorMessage = (error) => {
  const status = error?.response?.status;
  const message = getErrorMessage(
    error,
    "تعذر تحميل إعدادات المدرسة"
  );

  if (
    status === 404 ||
    String(message)
      .toLowerCase()
      .includes("cannot get")
  ) 

  return message;
};

const pageCardSx = {
  border:
    "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor:
    "var(--color-cream)",
  boxShadow:
    "0 10px 24px rgba(18,47,77,0.055)",
};

const SchoolSettings = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      defaultPassingGrade:
        DEFAULT_PASSING_GRADE,
    },
  });

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [savedValue, setSavedValue] =
    useState(DEFAULT_PASSING_GRADE);
  const [loadError, setLoadError] =
    useState("");

  const currentValue =
    normalizePassingGrade(
      watch("defaultPassingGrade")
    );

  const hasChanges = useMemo(
    () => currentValue !== savedValue,
    [currentValue, savedValue]
  );

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response =
          await fetchSchoolSettings();

        if (!active) return;

      

        const settings =    
          extractSettings(response);

        const defaultPassingGrade =
          normalizePassingGrade(
            settings?.defaultPassingGrade ??
              DEFAULT_PASSING_GRADE
          );

        reset({ defaultPassingGrade });
        setSavedValue(defaultPassingGrade);
      } catch (error) {
        if (active) {
          setLoadError(
            getLoadErrorMessage(error)
          );

          reset({
            defaultPassingGrade:
              DEFAULT_PASSING_GRADE,
          });
          setSavedValue(
            DEFAULT_PASSING_GRADE
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [reset]);

  const updateGradeValue = (value) => {
    setValue(
      "defaultPassingGrade",
      normalizePassingGrade(value),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const onSubmit = async (formData) => {
    const defaultPassingGrade =
      normalizePassingGrade(
        formData.defaultPassingGrade
      );

    if (
      !isValidPassingGrade(
        defaultPassingGrade
      )
    ) {
      toast.error(
        "درجة النجاح الافتراضية يجب أن تكون من 0 إلى 100"
      );
      return;
    }

    if (
      defaultPassingGrade === savedValue
    ) {
      toast.info(
        "لا توجد تغييرات جديدة للحفظ"
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await updateSchoolSettings({
          defaultPassingGrade,
        });

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر حفظ إعدادات المدرسة"
        );
        return;
      }

      const updatedSettings =
        extractSettings(response);

      const updatedValue =
        normalizePassingGrade(
          updatedSettings
            ?.defaultPassingGrade ??
            defaultPassingGrade
        );

      reset({
        defaultPassingGrade:
          updatedValue,
      });
      setSavedValue(updatedValue);
      setLoadError("");

      toast.success(
        "تم حفظ درجة النجاح الافتراضية بنجاح"
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "تعذر حفظ إعدادات المدرسة"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    reset({
      defaultPassingGrade: savedValue,
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: 1120,
          mx: "auto",
          pb: 3,
          color: "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.99), rgba(251,240,216,0.5))",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="إعدادات المدرسة" />

            <Chip
              icon={<SettingsRounded />}
              label="النجاح والترحيل"
              sx={{
                alignSelf: {
                  xs: "flex-start",
                  sm: "center",
                },
                height: 31,
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
                border:
                  "1px solid rgba(211,164,79,0.22)",
                fontSize: "10.5px",
                fontWeight: 800,
              }}
            />
          </Stack>
        </Paper>

        {loadError ? (
          <Alert
            severity="warning"
            icon={<WarningAmberRounded />}
            sx={{
              mt: 1,
              py: 0.25,
              border:
                "1px solid rgba(211,164,79,0.25)",
              borderRadius: "14px",
              backgroundColor:
                "rgba(251,240,216,0.7)",
              color:
                "var(--color-navy-deep)",
              fontSize: "10.5px",
              fontWeight: 700,
              "& .MuiAlert-icon": {
                color:
                  "var(--color-gold-dark)",
              },
            }}
          >
            {loadError}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mt: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 1.4, md: 1.8 },
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background:
                "linear-gradient(135deg, rgba(36,74,112,0.035), rgba(255,255,255,0.85))",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
                borderRadius: "12px",
              }}
            >
              <FactCheckRounded />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "15px",
                    md: "17px",
                  },
                  fontWeight: 900,
                }}
              >
                درجة النجاح الافتراضية
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color:
                    "var(--color-muted)",
                  fontSize: "10px",
                  lineHeight: 1.65,
                }}
              >
                تُستخدم فقط عندما لا تكون للمادة درجة نجاح خاصة داخل توزيع الدرجات.
              </Typography>
            </Box>
          </Box>

          <Divider
            sx={{
              borderColor:
                "rgba(36,74,112,0.07)",
            }}
          />

          <Box
            sx={{
              p: { xs: 1.35, md: 1.8 },
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1.2fr) minmax(280px, 0.75fr)",
              },
              gap: 1.25,
              alignItems: "stretch",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.25, md: 1.5 },
                border:
                  "1px solid rgba(36,74,112,0.09)",
                borderRadius: "15px",
                backgroundColor:
                  "var(--color-white)",
              }}
            >
              <Stack spacing={1.25}>
                <Box
                  sx={{
                    "& .MuiFormControl-root": {
                      width: "100%",
                      margin: 0,
                    },
                    "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
                      minHeight: 46,
                      backgroundColor:
                        "var(--color-white)",
                      borderRadius: "12px",
                    },
                  }}
                >
                  <Input
                    register={register}
                    registerName="defaultPassingGrade"
                    error={
                      errors.defaultPassingGrade
                        ?.message
                    }
                    label="درجة النجاح"
                    required
                    type="number"
                    valueAsNumber
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 1,
                    }}
                  />
                </Box>

                <Box sx={{ px: 0.5 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.2 }}
                  >
                    <Typography
                      sx={{
                        color:
                          "var(--color-muted)",
                        fontSize: "9.5px",
                        fontWeight: 700,
                      }}
                    >
                      0
                    </Typography>

                    <Typography
                      sx={{
                        color:
                          "var(--color-navy-deep)",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      حرّك المؤشر أو اكتب الدرجة
                    </Typography>

                    <Typography
                      sx={{
                        color:
                          "var(--color-muted)",
                        fontSize: "9.5px",
                        fontWeight: 700,
                      }}
                    >
                      100
                    </Typography>
                  </Stack>

                  <Slider
                    value={currentValue}
                    onChange={(_, value) =>
                      updateGradeValue(value)
                    }
                    min={0}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{
                      color:
                        "var(--color-gold)",
                      py: 0.6,
                      "& .MuiSlider-thumb": {
                        width: 17,
                        height: 17,
                        boxShadow:
                          "0 3px 10px rgba(211,164,79,0.28)",
                      },
                      "& .MuiSlider-track": {
                        border: 0,
                      },
                      "& .MuiSlider-rail": {
                        opacity: 0.18,
                      },
                    }}
                  />
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={0.65}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ ml: 0.4 }}
                  >
                    <TuneRounded
                      sx={{
                        fontSize: 16,
                        color:
                          "var(--color-navy-light)",
                      }}
                    />
                    <Typography
                      sx={{
                        color:
                          "var(--color-muted)",
                        fontSize: "9.5px",
                        fontWeight: 700,
                      }}
                    >
                      اختيارات سريعة
                    </Typography>
                  </Stack>

                  {QUICK_VALUES.map((value) => (
                    <Chip
                      key={value}
                      label={`${value}%`}
                      clickable
                      onClick={() =>
                        updateGradeValue(value)
                      }
                      sx={{
                        height: 28,
                        color:
                          currentValue === value
                            ? "var(--color-white)"
                            : "var(--color-navy)",
                        backgroundColor:
                          currentValue === value
                            ? "var(--color-navy)"
                            : "rgba(36,74,112,0.055)",
                        border:
                          "1px solid rgba(36,74,112,0.08)",
                        fontSize: "10px",
                        fontWeight: 800,
                        "&:hover": {
                          backgroundColor:
                            currentValue === value
                              ? "var(--color-navy-dark)"
                              : "var(--color-gold-soft)",
                        },
                      }}
                    />
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.65}
                  sx={{
                    p: 0.9,
                    borderRadius: "11px",
                    backgroundColor:
                      "rgba(36,74,112,0.035)",
                  }}
                >
                  <InfoOutlined
                    sx={{
                      fontSize: 16,
                      color:
                        "var(--color-navy-light)",
                    }}
                  />
                  <Typography
                    sx={{
                      color:
                        "var(--color-muted)",
                      fontSize: "9.5px",
                      lineHeight: 1.65,
                    }}
                  >
                    القيمة المسموحة من 0 إلى 100. المواد التي لها درجة نجاح خاصة تستخدم درجتها أولًا.
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.35, md: 1.55 },
                display: "flex",
                flexDirection: "column",
                justifyContent:
                  "space-between",
                gap: 1,
                border:
                  "1px solid rgba(116,201,154,0.25)",
                borderRadius: "15px",
                background:
                  "linear-gradient(145deg, rgba(232,247,239,0.9), rgba(255,255,255,0.96))",
              }}
            >
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.8}
                >
                  <CheckCircleRounded
                    sx={{
                      color: "#27966f",
                      fontSize: 21,
                    }}
                  />
                  <Typography
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "10.5px",
                      fontWeight: 800,
                    }}
                  >
                    الدرجة التي سيستخدمها النظام
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="baseline"
                  spacing={0.6}
                  sx={{ mt: 1 }}
                >
                  <Typography
                    sx={{
                      color: "#1f805f",
                      fontSize: {
                        xs: "34px",
                        md: "42px",
                      },
                      lineHeight: 1,
                      fontWeight: 950,
                    }}
                  >
                    {currentValue}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#1f805f",
                      fontSize: "13px",
                      fontWeight: 900,
                    }}
                  >
                    من 100
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Box
                  sx={{
                    height: 7,
                    overflow: "hidden",
                    borderRadius: 99,
                    backgroundColor:
                      "rgba(39,150,111,0.12)",
                  }}
                >
                  <Box
                    sx={{
                      width: `${currentValue}%`,
                      height: "100%",
                      borderRadius: 99,
                      background:
                        "linear-gradient(90deg, #56b98f, #27966f)",
                      transition:
                        "width 180ms ease",
                    }}
                  />
                </Box>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mt: 0.9 }}
                >
                  <Typography
                    sx={{
                      color:
                        "var(--color-muted)",
                      fontSize: "9.5px",
                    }}
                  >
                    المحفوظ حاليًا: {savedValue}
                  </Typography>

                  <Chip
                    label={
                      hasChanges
                        ? "تغييرات غير محفوظة"
                        : "الإعداد محفوظ"
                    }
                    size="small"
                    sx={{
                      height: 25,
                      color: hasChanges
                        ? "var(--color-gold-dark)"
                        : "#1f805f",
                      backgroundColor: hasChanges
                        ? "var(--color-gold-soft)"
                        : "rgba(39,150,111,0.1)",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Box>
            </Paper>
          </Box>

          <Divider
            sx={{
              borderColor:
                "rgba(36,74,112,0.07)",
            }}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="flex-start"
            gap={0.8}
            sx={{
              px: { xs: 1.35, md: 1.8 },
              py: 1.15,
              backgroundColor:
                "rgba(36,74,112,0.018)",
            }}
          >
            <Button
              type="submit"
              disabled={saving || !hasChanges}
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress
                    size={15}
                    color="inherit"
                  />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 190,
                },
                minHeight: 42,
                borderRadius: "11px",
                color:
                  "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "none",
                boxShadow:
                  "0 8px 18px rgba(36,74,112,0.16)",
                "& .MuiButton-startIcon": {
                  marginLeft: "6px",
                  marginRight: 0,
                },
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ درجة النجاح"}
            </Button>

            <Button
              type="button"
              onClick={handleReset}
              disabled={saving || !hasChanges}
              variant="outlined"
              startIcon={<RestartAltRounded />}
              sx={{
                width: {
                  xs: "100%",
                  sm: 145,
                },
                minHeight: 42,
                borderRadius: "11px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.18)",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "6px",
                  marginRight: 0,
                },
              }}
            >
              إلغاء التغييرات
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export { SchoolSettings };
export default SchoolSettings;
