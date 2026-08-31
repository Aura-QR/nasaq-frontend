import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CheckCircleRounded,
  FactCheckRounded,
  FlagRounded,
  InfoOutlined,
  AccessTimeRounded,
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

import {
  fetchNationalities,
} from "@/APIs/school/nationalities";

const DEFAULT_PASSING_GRADE = 50;
const DEFAULT_PERIODS_PER_DAY = 7;
const QUICK_VALUES = [40, 50, 60, 70];

const WEEK_DAYS = [
  { day: "sunday", label: "الأحد" },
  { day: "monday", label: "الاثنين" },
  { day: "tuesday", label: "الثلاثاء" },
  { day: "wednesday", label: "الأربعاء" },
  { day: "thursday", label: "الخميس" },
  { day: "friday", label: "الجمعة" },
  { day: "saturday", label: "السبت" },
];

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

const normalizeWorkStartTime = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return "";
  }

  // GET may return HH:mm, HH:mm:ss, or a full ISO value.
  const directTimeMatch = stringValue.match(/^(\d{2}):(\d{2})/);

  if (directTimeMatch) {
    return `${directTimeMatch[1]}:${directTimeMatch[2]}`;
  }

  const isoTimeMatch = stringValue.match(/T(\d{2}):(\d{2})/);

  if (isoTimeMatch) {
    return `${isoTimeMatch[1]}:${isoTimeMatch[2]}`;
  }

  return "";
};

const isValidWorkStartTime = (value) =>
  value === "" ||
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const normalizePeriodsPerDay = (value) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return DEFAULT_PERIODS_PER_DAY;
  }

  return Math.min(
    10,
    Math.max(1, Math.round(numberValue))
  );
};

const isValidPeriodsPerDay = (value) =>
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 10;

const createDefaultWorkSchedule = (
  workStartTime = "07:00"
) => {
  const startTime =
    normalizeWorkStartTime(workStartTime) ||
    "07:00";

  return WEEK_DAYS.map(({ day }) => {
    const isWorkingDay = ![
      "friday",
      "saturday",
    ].includes(day);

    return {
      day,
      isWorkingDay,
      startTime: isWorkingDay
        ? startTime
        : null,
      endTime: isWorkingDay
        ? "14:00"
        : null,
    };
  });
};

const normalizeWorkSchedule = (
  value,
  fallbackStartTime = "07:00"
) => {
  if (!Array.isArray(value) || !value.length) {
    return createDefaultWorkSchedule(
      fallbackStartTime
    );
  }

  const byDay = new Map(
    value
      .map((item) => [
        String(item?.day || "")
          .trim()
          .toLowerCase(),
        item,
      ])
      .filter(([day]) => day)
  );

  return WEEK_DAYS.map(({ day }) => {
    const item = byDay.get(day);

    if (!item) {
      return {
        day,
        isWorkingDay: false,
        startTime: null,
        endTime: null,
      };
    }

    const isWorkingDay = Boolean(
      item?.isWorkingDay
    );

    return {
      day,
      isWorkingDay,
      startTime: isWorkingDay
        ? normalizeWorkStartTime(
            item?.startTime
          ) || null
        : null,
      endTime: isWorkingDay
        ? normalizeWorkStartTime(
            item?.endTime
          ) || null
        : null,
    };
  });
};

const sameWorkSchedule = (first, second) =>
  JSON.stringify(
    normalizeWorkSchedule(first)
  ) ===
  JSON.stringify(
    normalizeWorkSchedule(second)
  );

const getFirstWorkingStartTime = (
  workSchedule,
  fallback = ""
) => {
  const firstWorkingDay =
    normalizeWorkSchedule(
      workSchedule,
      fallback
    ).find(
      (item) =>
        item.isWorkingDay &&
        item.startTime
    );

  return (
    firstWorkingDay?.startTime ||
    normalizeWorkStartTime(fallback) ||
    ""
  );
};

const validateWorkSchedule = (workSchedule) => {
  const normalized =
    normalizeWorkSchedule(workSchedule);

  const workingDays = normalized.filter(
    (item) => item.isWorkingDay
  );

  if (!workingDays.length) {
    return "يجب تحديد يوم عمل واحد على الأقل";
  }

  for (const item of workingDays) {
    const dayLabel =
      WEEK_DAYS.find(
        (day) => day.day === item.day
      )?.label || item.day;

    if (
      !item.startTime ||
      !item.endTime ||
      !isValidWorkStartTime(item.startTime) ||
      !isValidWorkStartTime(item.endTime)
    ) {
      return `حددي وقت بداية ونهاية صحيحين ليوم ${dayLabel}`;
    }

    if (item.startTime >= item.endTime) {
      return `وقت نهاية دوام ${dayLabel} يجب أن يكون بعد وقت البداية`;
    }
  }

  return "";
};

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const getResponseError = (
  response,
  fallback
) =>
  response?.message ||
  response?.error ||
  response?.data?.message ||
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
  ) {
    return "إعدادات المدرسة غير مفعلة في نسخة الباك الحالية. يتم عرض القيمة الافتراضية 50 مؤقتًا لحين إضافة الـ Endpoint.";
  }

  return message;
};

const findArray = (source) => {
  const candidates = [
    source,
    source?.data,
    source?.data?.data,
    source?.nationalities,
    source?.items,
    source?.results,
    source?.data?.nationalities,
    source?.data?.items,
    source?.data?.results,
    source?.data?.data?.nationalities,
    source?.data?.data?.items,
    source?.data?.data?.results,
  ];

  return (
    candidates.find(Array.isArray) || []
  );
};

const normalizeNationalityCode = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return normalizeNationalityCode(
      value?.code ??
        value?.nationalityCode ??
        value?.countryCode ??
        value?.alpha2 ??
        value?.iso2 ??
        value?.value ??
        value?.id
    );
  }

  return String(value)
    .trim()
    .toUpperCase();
};

const normalizeNationalityOption = (
  item
) => {
  if (
    item === null ||
    item === undefined
  ) {
    return null;
  }

  if (
    typeof item === "string"
  ) {
    const code =
      normalizeNationalityCode(item);

    return code
      ? {
          code,
          label: code,
        }
      : null;
  }

  const code =
    normalizeNationalityCode(item);

  if (!code) {
    return null;
  }

  const label =
    item?.nameAr ??
    item?.name_ar ??
    item?.arabicName ??
    item?.labelAr ??
    item?.label_ar ??
    item?.nationalityAr ??
    item?.nationality_ar ??
    item?.name ??
    item?.label ??
    item?.englishName ??
    item?.nationality ??
    code;

  return {
    code,
    label: String(label || code).trim(),
  };
};

const extractNationalityOptions = (
  response
) => {
  let items = findArray(response);

  if (!items.length) {
    const payload =
      unwrapResponse(response);

    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
    ) {
      const mappingCandidate =
        payload?.nationalities &&
        typeof payload.nationalities ===
          "object" &&
        !Array.isArray(
          payload.nationalities
        )
          ? payload.nationalities
          : null;

      if (mappingCandidate) {
        items = Object.entries(
          mappingCandidate
        ).map(([code, label]) => ({
          code,
          label,
        }));
      }
    }
  }

  const map = new Map();

  items.forEach((item) => {
    const option =
      normalizeNationalityOption(item);

    if (
      option?.code &&
      !map.has(option.code)
    ) {
      map.set(option.code, option);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      a.label.localeCompare(
        b.label,
        "ar"
      )
  );
};

const normalizeNationalityCodes = (
  values
) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(normalizeNationalityCode)
        .filter(Boolean)
    )
  ).sort();
};

const sameStringArray = (a, b) => {
  const first =
    normalizeNationalityCodes(a);
  const second =
    normalizeNationalityCodes(b);

  return (
    first.length === second.length &&
    first.every(
      (value, index) =>
        value === second[index]
    )
  );
};

const getLocalNationalities = (
  settings
) =>
  normalizeNationalityCodes(
    settings?.localNationalities ??
      settings?.localNationalityCodes ??
      []
  );

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
      periodsPerDay:
        DEFAULT_PERIODS_PER_DAY,
      workStartTime: "",
      workSchedule:
        createDefaultWorkSchedule(),
      localNationalities: [],
    },
  });

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [
    nationalityOptions,
    setNationalityOptions,
  ] = useState([]);

  const [
    nationalitiesLoading,
    setNationalitiesLoading,
  ] = useState(false);

  const [
    nationalitiesError,
    setNationalitiesError,
  ] = useState("");

  const [
    savedSettings,
    setSavedSettings,
  ] = useState({
    defaultPassingGrade:
      DEFAULT_PASSING_GRADE,
    periodsPerDay:
      DEFAULT_PERIODS_PER_DAY,
    workStartTime: "",
    workSchedule:
      createDefaultWorkSchedule(),
    localNationalities: [],
  });

  const [loadError, setLoadError] =
    useState("");

  const currentValue =
    normalizePassingGrade(
      watch("defaultPassingGrade")
    );

  const currentWorkStartTime =
    normalizeWorkStartTime(
      watch("workStartTime")
    );

  const currentPeriodsPerDay =
    normalizePeriodsPerDay(
      watch("periodsPerDay")
    );

  const currentWorkSchedule =
    normalizeWorkSchedule(
      watch("workSchedule"),
      currentWorkStartTime
    );

  const workingDaysCount =
    currentWorkSchedule.filter(
      (item) => item.isWorkingDay
    ).length;

  const weeklySlots =
    workingDaysCount *
    currentPeriodsPerDay;

  const currentLocalNationalities =
    normalizeNationalityCodes(
      watch("localNationalities") || []
    );

  const selectedNationalityOptions =
    useMemo(
      () =>
        currentLocalNationalities.map(
          (code) =>
            nationalityOptions.find(
              (option) =>
                option.code === code
            ) || {
              code,
              label: code,
            }
        ),
      [
        currentLocalNationalities,
        nationalityOptions,
      ]
    );

  const hasChanges = useMemo(
    () =>
      currentValue !==
        savedSettings.defaultPassingGrade ||
      currentPeriodsPerDay !==
        savedSettings.periodsPerDay ||
      !sameWorkSchedule(
        currentWorkSchedule,
        savedSettings.workSchedule
      ) ||
      !sameStringArray(
        currentLocalNationalities,
        savedSettings.localNationalities
      ),
    [
      currentValue,
      currentPeriodsPerDay,
      currentWorkSchedule,
      currentLocalNationalities,
      savedSettings,
    ]
  );

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      setLoading(true);
      setNationalitiesLoading(true);
      setLoadError("");
      setNationalitiesError("");

      const [
        settingsResult,
        nationalitiesResult,
      ] = await Promise.allSettled([
        fetchSchoolSettings(),
        fetchNationalities(),
      ]);

      if (!active) return;

      let nextPassingGrade =
        DEFAULT_PASSING_GRADE;
      let nextPeriodsPerDay =
        DEFAULT_PERIODS_PER_DAY;
      let nextWorkStartTime = "";
      let nextWorkSchedule =
        createDefaultWorkSchedule();
      let nextLocalNationalities = [];

      if (
        settingsResult.status ===
        "fulfilled"
      ) {
        const response =
          settingsResult.value;

        if (response?.status === false) {
          const message =
            getResponseError(
              response,
              "تعذر تحميل إعدادات المدرسة"
            );

          setLoadError(
            String(message)
              .toLowerCase()
              .includes("cannot get")
              ? "إعدادات المدرسة غير مفعلة في نسخة الباك الحالية. يتم عرض القيم الافتراضية مؤقتًا لحين إضافة الـ Endpoint."
              : message
          );
        } else {
          const settings =
            extractSettings(response);

          nextPassingGrade =
            normalizePassingGrade(
              settings?.defaultPassingGrade ??
                DEFAULT_PASSING_GRADE
            );

          nextPeriodsPerDay =
            normalizePeriodsPerDay(
              settings?.periodsPerDay ??
                DEFAULT_PERIODS_PER_DAY
            );

          nextWorkStartTime =
            normalizeWorkStartTime(
              settings?.workStartTime
            );

          nextWorkSchedule =
            normalizeWorkSchedule(
              settings?.workSchedule,
              nextWorkStartTime
            );

          nextLocalNationalities =
            getLocalNationalities(
              settings
            );
        }
      } else {
        setLoadError(
          getLoadErrorMessage(
            settingsResult.reason
          )
        );
      }

      if (
        nationalitiesResult.status ===
        "fulfilled"
      ) {
        const response =
          nationalitiesResult.value;

        if (response?.status === false) {
          setNationalitiesError(
            getResponseError(
              response,
              "تعذر تحميل قائمة الجنسيات"
            )
          );
        } else {
          const options =
            extractNationalityOptions(
              response
            );

          setNationalityOptions(
            options
          );

          if (!options.length) {
            setNationalitiesError(
              "تم استدعاء /nationalities لكن الاستجابة لا تحتوي قائمة جنسيات قابلة للعرض."
            );
          }
        }
      } else {
        setNationalitiesError(
          getErrorMessage(
            nationalitiesResult.reason,
            "تعذر تحميل قائمة الجنسيات"
          )
        );
      }

      const normalizedSettings = {
        defaultPassingGrade:
          nextPassingGrade,
        periodsPerDay:
          nextPeriodsPerDay,
        workStartTime:
          getFirstWorkingStartTime(
            nextWorkSchedule,
            nextWorkStartTime
          ),
        workSchedule:
          nextWorkSchedule,
        localNationalities:
          nextLocalNationalities,
      };

      reset(normalizedSettings);
      setSavedSettings(
        normalizedSettings
      );

      setNationalitiesLoading(false);
      setLoading(false);
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [reset]);

  useEffect(() => {
    if (
      !savedSettings.localNationalities
        .length
    ) {
      return;
    }

    setNationalityOptions(
      (currentOptions) => {
        const map = new Map(
          currentOptions.map(
            (option) => [
              option.code,
              option,
            ]
          )
        );

        savedSettings.localNationalities.forEach(
          (code) => {
            if (!map.has(code)) {
              map.set(code, {
                code,
                label: code,
              });
            }
          }
        );

        return Array.from(
          map.values()
        );
      }
    );
  }, [savedSettings.localNationalities]);

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

  const updateLocalNationalities = (
    options
  ) => {
    const codes =
      normalizeNationalityCodes(
        options.map(
          (option) => option?.code
        )
      );

    setValue(
      "localNationalities",
      codes,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const updateWorkScheduleDay = (
    day,
    changes
  ) => {
    const nextSchedule =
      currentWorkSchedule.map((item) => {
        if (item.day !== day) {
          return item;
        }

        const next = {
          ...item,
          ...changes,
        };

        if (!next.isWorkingDay) {
          return {
            ...next,
            startTime: null,
            endTime: null,
          };
        }

        return {
          ...next,
          startTime:
            normalizeWorkStartTime(
              next.startTime
            ) || "07:00",
          endTime:
            normalizeWorkStartTime(
              next.endTime
            ) || "14:00",
        };
      });

    setValue(
      "workSchedule",
      nextSchedule,
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

    const periodsPerDay = Number(
      formData.periodsPerDay
    );

    const workSchedule =
      normalizeWorkSchedule(
        formData.workSchedule,
        formData.workStartTime
      );

    const workStartTime =
      getFirstWorkingStartTime(
        workSchedule,
        formData.workStartTime
      );

    const localNationalities =
      normalizeNationalityCodes(
        formData.localNationalities
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

    if (!isValidPeriodsPerDay(periodsPerDay)) {
      toast.error(
        "عدد الحصص في اليوم يجب أن يكون رقمًا صحيحًا من 1 إلى 10"
      );
      return;
    }

    const workScheduleError =
      validateWorkSchedule(workSchedule);

    if (workScheduleError) {
      toast.error(workScheduleError);
      return;
    }

    if (
      localNationalities.length === 0
    ) {
      toast.error(
        "اختر جنسية محلية واحدة على الأقل"
      );
      return;
    }

    const availableCodes =
      new Set(
        nationalityOptions.map(
          (option) => option.code
        )
      );

    const invalidCodes =
      localNationalities.filter(
        (code) =>
          availableCodes.size > 0 &&
          !availableCodes.has(code)
      );

    if (invalidCodes.length) {
      toast.error(
        `يوجد كود جنسية غير صالح: ${invalidCodes.join(
          ", "
        )}`
      );
      return;
    }

    if (!hasChanges) {
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
          periodsPerDay,
          workSchedule,
          // Compatibility shim for older attendance logic.
          workStartTime:
            workStartTime || null,
          localNationalities,
        });

      if (response?.status === false) {
        toast.error(
          getResponseError(
            response,
            "تعذر حفظ إعدادات المدرسة"
          )
        );
        return;
      }

      const updatedSettings =
        extractSettings(response);

      const nextWorkSchedule =
        normalizeWorkSchedule(
          updatedSettings?.workSchedule ??
            workSchedule,
          updatedSettings?.workStartTime ??
            workStartTime
        );

      const nextSettings = {
        defaultPassingGrade:
          normalizePassingGrade(
            updatedSettings
              ?.defaultPassingGrade ??
              defaultPassingGrade
          ),
        periodsPerDay:
          normalizePeriodsPerDay(
            updatedSettings?.periodsPerDay ??
              periodsPerDay
          ),
        workStartTime:
          getFirstWorkingStartTime(
            nextWorkSchedule,
            updatedSettings?.workStartTime ??
              workStartTime
          ),
        workSchedule:
          nextWorkSchedule,
        localNationalities:
          normalizeNationalityCodes(
            updatedSettings
              ?.localNationalities ??
              updatedSettings
                ?.localNationalityCodes ??
              localNationalities
          ),
      };

      reset(nextSettings);
      setSavedSettings(
        nextSettings
      );
      setLoadError("");

      toast.success(
        "تم حفظ إعدادات المدرسة بنجاح"
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
    reset(savedSettings);
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
              label="الإعدادات العامة"
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
                      حرّكي المؤشر أو اكتبي الدرجة
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
                    المحفوظ حاليًا:{" "}
                    {
                      savedSettings
                        .defaultPassingGrade
                    }
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

          <Box
            sx={{
              px: { xs: 1.4, md: 1.8 },
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              background:
                "linear-gradient(135deg, rgba(36,74,112,0.035), rgba(255,255,255,0.9))",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
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
                <AccessTimeRounded />
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
                  الجدول الأسبوعي والحصص
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
                  حددي عدد الحصص اليومية وأيام العمل وأوقات البداية والنهاية لكل يوم.
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={`${weeklySlots} خانة أسبوعيًا — ${workingDaysCount} أيام × ${currentPeriodsPerDay} حصص`}
              size="small"
              sx={{
                height: 29,
                color:
                  "var(--color-navy-deep)",
                backgroundColor:
                  "var(--color-gold-soft)",
                border:
                  "1px solid rgba(211,164,79,0.22)",
                fontSize: "9.5px",
                fontWeight: 800,
              }}
            />
          </Box>

          <Box
            sx={{
              p: { xs: 1.35, md: 1.8 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.25, md: 1.5 },
                mb: 1.25,
                border:
                  "1px solid rgba(36,74,112,0.09)",
                borderRadius: "15px",
                backgroundColor:
                  "var(--color-white)",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                alignItems={{
                  xs: "stretch",
                  md: "center",
                }}
                justifyContent="space-between"
                gap={1.2}
              >
                <Box>
                  <Typography
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    عدد الحصص في اليوم
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      color:
                        "var(--color-muted)",
                      fontSize: "9.5px",
                    }}
                  >
                    من 1 إلى 10 حصص. القيمة الافتراضية 7.
                  </Typography>
                </Box>

                <TextField
                  {...register("periodsPerDay", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  label="عدد الحصص"
                  disabled={saving}
                  inputProps={{
                    min: 1,
                    max: 10,
                    step: 1,
                  }}
                  sx={{
                    width: {
                      xs: "100%",
                      md: 220,
                    },
                    "& .MuiOutlinedInput-root": {
                      minHeight: 50,
                      borderRadius: "13px",
                      backgroundColor:
                        "var(--color-white)",
                    },
                  }}
                />
              </Stack>
            </Paper>

            <Stack spacing={0.8}>
              {WEEK_DAYS.map(({ day, label }) => {
                const item =
                  currentWorkSchedule.find(
                    (row) => row.day === day
                  ) || {
                    day,
                    isWorkingDay: false,
                    startTime: null,
                    endTime: null,
                  };

                return (
                  <Paper
                    key={day}
                    elevation={0}
                    sx={{
                      p: 1,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "minmax(130px, 0.8fr) minmax(150px, 1fr) minmax(150px, 1fr)",
                      },
                      gap: 1,
                      alignItems: "center",
                      border: `1px solid ${
                        item.isWorkingDay
                          ? "rgba(211,164,79,0.22)"
                          : "rgba(36,74,112,0.08)"
                      }`,
                      borderRadius: "13px",
                      backgroundColor:
                        item.isWorkingDay
                          ? "rgba(251,240,216,0.26)"
                          : "rgba(36,74,112,0.018)",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.7}
                    >
                      <Checkbox
                        checked={
                          item.isWorkingDay
                        }
                        onChange={(event) =>
                          updateWorkScheduleDay(
                            day,
                            {
                              isWorkingDay:
                                event.target
                                  .checked,
                            }
                          )
                        }
                        disabled={saving}
                        size="small"
                        sx={{
                          p: 0.4,
                          color:
                            "rgba(36,74,112,0.35)",
                          "&.Mui-checked": {
                            color:
                              "var(--color-gold-dark)",
                          },
                        }}
                      />

                      <Typography
                        sx={{
                          color:
                            "var(--color-navy-deep)",
                          fontSize: "11px",
                          fontWeight: 900,
                        }}
                      >
                        {label}
                      </Typography>

                      <Chip
                        size="small"
                        label={
                          item.isWorkingDay
                            ? "يوم عمل"
                            : "إجازة"
                        }
                        sx={{
                          height: 23,
                          fontSize: "8.5px",
                          fontWeight: 800,
                          color:
                            item.isWorkingDay
                              ? "#1f805f"
                              : "var(--color-muted)",
                          backgroundColor:
                            item.isWorkingDay
                              ? "rgba(39,150,111,0.1)"
                              : "rgba(36,74,112,0.05)",
                        }}
                      />
                    </Stack>

                    <TextField
                      type="time"
                      label="بداية الدوام"
                      value={
                        item.startTime || ""
                      }
                      onChange={(event) =>
                        updateWorkScheduleDay(
                          day,
                          {
                            startTime:
                              event.target.value,
                          }
                        )
                      }
                      disabled={
                        saving ||
                        !item.isWorkingDay
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{ step: 60 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          minHeight: 46,
                          borderRadius: "11px",
                          backgroundColor:
                            "var(--color-white)",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: "10.5px",
                          fontWeight: 700,
                        },
                      }}
                    />

                    <TextField
                      type="time"
                      label="نهاية الدوام"
                      value={
                        item.endTime || ""
                      }
                      onChange={(event) =>
                        updateWorkScheduleDay(
                          day,
                          {
                            endTime:
                              event.target.value,
                          }
                        )
                      }
                      disabled={
                        saving ||
                        !item.isWorkingDay
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{ step: 60 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          minHeight: 46,
                          borderRadius: "11px",
                          backgroundColor:
                            "var(--color-white)",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: "10.5px",
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Paper>
                );
              })}
            </Stack>

            <Alert
              severity="info"
              icon={<InfoOutlined />}
              sx={{
                mt: 1.15,
                py: 0.45,
                borderRadius: "13px",
                border:
                  "1px solid rgba(36,74,112,0.1)",
                backgroundColor:
                  "rgba(36,74,112,0.035)",
                color:
                  "var(--color-navy-deep)",
                fontSize: "10px",
                lineHeight: 1.7,
              }}
            >
              السعة الأسبوعية للجدول = عدد أيام العمل × عدد الحصص في اليوم. سيتم إرسال <b>workSchedule</b> كاملًا، مع <b>workStartTime</b> للتوافق مع الأجزاء القديمة.
            </Alert>
          </Box>

          <Divider
            sx={{
              borderColor:
                "rgba(36,74,112,0.07)",
            }}
          />

          <Box
            sx={{
              px: { xs: 1.4, md: 1.8 },
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background:
                "linear-gradient(135deg, rgba(211,164,79,0.05), rgba(255,255,255,0.9))",
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
                  "var(--color-navy)",
                backgroundColor:
                  "rgba(36,74,112,0.06)",
                borderRadius: "12px",
              }}
            >
              <FlagRounded />
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
                الجنسيات المحلية
              </Typography>

          
            </Box>
          </Box>

          <Box
            sx={{
              p: { xs: 1.35, md: 1.8 },
            }}
          >
            {nationalitiesError ? (
              <Alert
                severity="warning"
                sx={{
                  mb: 1.1,
                  py: 0.25,
                  borderRadius: "12px",
                  fontSize: "10px",
                }}
              >
                {nationalitiesError}
              </Alert>
            ) : null}

            <Autocomplete
              multiple
              disableCloseOnSelect
              loading={
                nationalitiesLoading
              }
              disabled={
                saving ||
                (Boolean(
                  nationalitiesError
                ) &&
                  nationalityOptions.length ===
                    0)
              }
              options={nationalityOptions}
              value={
                selectedNationalityOptions
              }
              onChange={(_, value) =>
                updateLocalNationalities(
                  value
                )
              }
              isOptionEqualToValue={(
                option,
                value
              ) =>
                option.code === value.code
              }
              getOptionLabel={(option) =>
                `${option.label} (${option.code})`
              }
              noOptionsText="لا توجد جنسيات متاحة"
              loadingText="جاري تحميل الجنسيات..."
              renderTags={(
                value,
                getTagProps
              ) =>
                value.map(
                  (option, index) => (
                    <Chip
                      {...getTagProps({
                        index,
                      })}
                      key={option.code}
                      label={`${option.label} - ${option.code}`}
                      size="small"
                      sx={{
                        height: 27,
                        color:
                          "var(--color-navy-deep)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        border:
                          "1px solid rgba(211,164,79,0.2)",
                        fontSize: "9.5px",
                        fontWeight: 800,
                      }}
                    />
                  )
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="اختر الجنسيات المحلية"
                  placeholder={
                    currentLocalNationalities.length
                      ? ""
                      : "مثال: السعودية (SA)"
                  }
                  error={
                    currentLocalNationalities.length ===
                    0
                  }
                  helperText={
                    currentLocalNationalities.length ===
                    0
                      ? "اختر جنسية محلية واحدة على الأقل"
                      : `المحدد: ${currentLocalNationalities.join(
                          ", "
                        )}`
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {nationalitiesLoading ? (
                          <CircularProgress
                            size={16}
                          />
                        ) : null}
                        {
                          params.InputProps
                            .endAdornment
                        }
                      </>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      minHeight: 52,
                      borderRadius: "13px",
                      backgroundColor:
                        "var(--color-white)",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "12px",
                      fontWeight: 700,
                    },
                    "& .MuiFormHelperText-root": {
                      textAlign: "right",
                      mx: 0.5,
                      fontSize: "9.5px",
                    },
                  }}
                />
              )}
            />

       
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
                : "حفظ الإعدادات"}
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
