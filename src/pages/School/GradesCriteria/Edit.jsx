import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AssessmentRounded,
  CloseRounded,
  EditNoteRounded,
  SaveRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";

import { useGradesCriteria } from "@/utils/hooks/apis/useGradesCriteria";
import { editGradesCriteria } from "@/APIs/school/gradesCriteria";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { api } from "@/APIs/Axios";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value?._id ||
      value?.id ||
      ""
    ).trim();
  }

  return String(value || "").trim();
};

const getResponseList = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.results,
      payload?.academicYears,
      payload?.years,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const mapAcademicYear = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    item?.academicYear ||
    "سنة دراسية",
});

const findFirstArray = (
  value,
  depth = 0
) => {
  if (depth > 8) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  const priorityKeys = [
    "data",
    "subjects",
    "docs",
    "items",
    "results",
    "rows",
    "records",
    "list",
  ];

  for (const key of priorityKeys) {
    if (!(key in value)) {
      continue;
    }

    const found =
      findFirstArray(
        value[key],
        depth + 1
      );

    if (found.length > 0) {
      return found;
    }
  }

  for (const nested of Object.values(
    value
  )) {
    const found =
      findFirstArray(
        nested,
        depth + 1
      );

    if (found.length > 0) {
      return found;
    }
  }

  return [];
};

const mapSubjectOption = (item) => {
  const id = normalizeId(item);

  const subjectName =
    item?.subjectName ||
    item?.name ||
    item?.title ||
    item?.label ||
    "";

  const subjectCode =
    item?.subjectCode ||
    item?.code ||
    "";

  if (!id || !subjectName) {
    return null;
  }

  return {
    id,
    subjectName,
    subjectCode,
    label: subjectCode
      ? `${subjectName} - ${subjectCode}`
      : subjectName,
  };
};

const dedupeSubjects = (
  values = []
) => {
  const map = new Map();

  values.forEach((item) => {
    const mapped =
      mapSubjectOption(item);

    if (!mapped) {
      return;
    }

    if (!map.has(mapped.id)) {
      map.set(
        mapped.id,
        mapped
      );
    }
  });

  return Array.from(
    map.values()
  );
};

const getResponseData = (response) =>
  response?.data?.data ||
  response?.data ||
  response;

const getResponseId = (response) => {
  const payload =
    getResponseData(response);

  return (
    payload?._id ||
    payload?.id ||
    payload?.gradesCriteria?._id ||
    payload?.gradesCriteria?.id ||
    ""
  );
};

const getErrorMessage = (
  response,
  fallback
) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string"
    ? response
    : fallback);

const GRADE_FIELDS = [
  "final",
  "activities",
  "projects",
  "assignments",
  "quizzes",
];

const PAYLOAD_FIELDS = [
  "subjectId",
  "academicYearId",
  "final",
  "activities",
  "projects",
  "projectsCount",
  "assignments",
  "assignmentsCount",
  "quizzes",
  "quizzesCount",
  "passingGrade",
];

const calculateTotal = (values) =>
  GRADE_FIELDS.reduce(
    (total, field) =>
      total +
      Number(values?.[field] || 0),
    0
  );

const normalizePassingGrade = (value) => {
  if (
    value === "" ||
    value === undefined ||
    value === null ||
    Number.isNaN(value)
  ) {
    return 50;
  }

  return Number(value);
};

const isValidPassingGrade = (value) =>
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;

const getCriteriaSubjectId = (
  criteria
) =>
  normalizeId(
    criteria?.subjectId ||
    criteria?.subject ||
    criteria?.subjectOffering
      ?.subjectId ||
    criteria?.subjectOffering
      ?.subject
  );

const getCriteriaAcademicYearId = (
  criteria
) =>
  normalizeId(
    criteria?.academicYearId ||
    (
      criteria?.academicYear &&
      typeof criteria.academicYear ===
        "object"
        ? criteria.academicYear
        : ""
    ) ||
    criteria?.subjectOffering
      ?.academicYearId
  );

const toEditableValues = (
  criteria = {}
) => ({
  subjectId:
    getCriteriaSubjectId(
      criteria
    ),

  academicYearId:
    getCriteriaAcademicYearId(
      criteria
    ),

  final: Number(
    criteria?.final ?? 0
  ),

  activities: Number(
    criteria?.activities ?? 0
  ),

  projects: Number(
    criteria?.projects ?? 0
  ),

  projectsCount: Number(
    criteria?.projectsCount ?? 0
  ),

  assignments: Number(
    criteria?.assignments ?? 0
  ),

  assignmentsCount: Number(
    criteria?.assignmentsCount ?? 0
  ),

  quizzes: Number(
    criteria?.quizzes ?? 0
  ),

  quizzesCount: Number(
    criteria?.quizzesCount ?? 0
  ),

  passingGrade:
    normalizePassingGrade(
      criteria?.passingGrade
    ),
});

const normalizeEditablePayload = (
  values = {}
) => ({
  subjectId: normalizeId(
    values?.subjectId
  ),

  academicYearId: normalizeId(
    values?.academicYearId
  ),

  final: Number(
    values?.final
  ),

  activities: Number(
    values?.activities
  ),

  projects: Number(
    values?.projects
  ),

  projectsCount: Number(
    values?.projectsCount
  ),

  assignments: Number(
    values?.assignments
  ),

  assignmentsCount: Number(
    values?.assignmentsCount
  ),

  quizzes: Number(
    values?.quizzes
  ),

  quizzesCount: Number(
    values?.quizzesCount
  ),

  passingGrade:
    normalizePassingGrade(
      values?.passingGrade
    ),
});

const samePayload = (
  first,
  second
) =>
  PAYLOAD_FIELDS.every(
    (key) =>
      String(first?.[key] ?? "") ===
      String(second?.[key] ?? "")
  );

const FORM_CARD_SX = {
  p: {
    xs: 1.35,
    md: 1.8,
  },
  mt: 1.15,
  overflow: "visible",
  border:
    "1px solid rgba(36,74,112,0.075)",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(255,252,247,0.98), rgba(255,255,255,0.96))",
  boxShadow:
    "0 12px 30px rgba(18,47,77,0.055)",

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root":
    {
      minHeight: 54,
      backgroundColor:
        "rgba(255,255,255,0.98)",
      borderRadius: "14px",
      fontSize: "13px",
    },

  "& .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.18)",
    },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.34)",
    },

  "& .MuiOutlinedInput-root.Mui-focused":
    {
      boxShadow:
        "0 0 0 3px rgba(211,164,79,0.10)",
      backgroundColor: "#fff",
    },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "var(--color-gold)",
      borderWidth: "1.5px",
    },

  "& .MuiInputLabel-root": {
    px: 0.6,
    color:
      "var(--color-muted)",
    backgroundColor:
      "var(--color-cream)",
    fontSize: "11px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused":
    {
      color:
        "var(--color-gold-dark)",
    },

  "& .MuiFormHelperText-root":
    {
      mx: 0.5,
      mt: 0.55,
      fontSize: "9.5px",
    },
};

const SectionHeading = ({
  icon,
  title,
  description,
  endContent,
}) => (
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
    sx={{
      pb: 1.2,
      mb: 1.35,
      borderBottom:
        "1px solid rgba(36,74,112,0.065)",
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color:
            "var(--color-gold-dark)",
          backgroundColor:
            "var(--color-gold-soft)",
          border:
            "1px solid rgba(211,164,79,0.22)",
          borderRadius: "13px",

          "& svg": {
            fontSize: 21,
          },
        }}
      >
        {icon}
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
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            color:
              "var(--color-muted)",
            fontSize: "10.5px",
            lineHeight: 1.65,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>

    {endContent}
  </Stack>
);

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      subjectId: "",
      academicYearId: "",
      passingGrade: 50,
      final: 0,
      activities: 0,
      projects: 0,
      projectsCount: 1,
      assignments: 0,
      assignmentsCount: 1,
      quizzes: 0,
      quizzesCount: 1,
    },
  });

  useEffect(() => {
    register(
      "subjectId",
      {
        required:
          "اختر المادة",
      }
    );

    register(
      "academicYearId",
      {
        required:
          "اختر السنة الدراسية",
      }
    );
  }, [register]);

  const [loading, setLoading] =
    useState(false);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [
    loadingAcademicYears,
    setLoadingAcademicYears,
  ] = useState(false);

  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    loadingSubjects,
    setLoadingSubjects,
  ] = useState(false);

  const [
    subjectsError,
    setSubjectsError,
  ] = useState("");

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    gradesCriteria,
    loading:
      gradesCriteriaLoading,
  } = useGradesCriteria(id);

  useEffect(() => {
    let active = true;

    const loadAcademicYears =
      async () => {
        setLoadingAcademicYears(
          true
        );

        try {
          const response =
            await fetchAcademicYears();

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setAcademicYears([]);

            toast.error(
              response?.message ||
                "تعذر تحميل السنوات الدراسية"
            );
          } else {
            setAcademicYears(
              getResponseList(
                response
              )
                .map(
                  mapAcademicYear
                )
                .filter(
                  (item) =>
                    item.id &&
                    item.name
                )
            );
          }
        } catch (error) {
          if (active) {
            setAcademicYears([]);

            toast.error(
              error?.response?.data
                ?.message ||
                "تعذر تحميل السنوات الدراسية"
            );
          }
        } finally {
          if (active) {
            setLoadingAcademicYears(
              false
            );
          }
        }
      };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSubjects =
      async () => {
        setLoadingSubjects(true);
        setSubjectsError("");

        const requests =
          await Promise.allSettled([
            api.get(
              "/subjects/list"
            ),
            api.get(
              "/subjects",
              {
                params: {
                  page: 1,
                  limit: 1000,
                },
              }
            ),
          ]);

        if (!active) {
          return;
        }

        const allItems = [];

        requests.forEach(
          (result) => {
            if (
              result.status !==
              "fulfilled"
            ) {
              return;
            }

            allItems.push(
              ...findFirstArray(
                result.value
              )
            );
          }
        );

        const mapped =
          dedupeSubjects(
            allItems
          );

        setSubjects(mapped);

        if (
          mapped.length === 0
        ) {
          const rejected =
            requests
              .filter(
                (result) =>
                  result.status ===
                  "rejected"
              )
              .map(
                (result) =>
                  result.reason
                    ?.response
                    ?.data
                    ?.message ||
                  result.reason
                    ?.message
              )
              .filter(Boolean);

          setSubjectsError(
            rejected[0] ||
            "لم يتم العثور على مواد دراسية. أضف المواد أولاً من إدارة المواد."
          );
        }

        setLoadingSubjects(false);
      };

    loadSubjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!gradesCriteria) {
      return;
    }

    /*
     * مهم:
     * لا نعمل spread للـgradesCriteria داخل الفورم.
     * الـGET قد يرجع populated fields مثل:
     * subjectOffering / subject / schoolId / createdAt ...
     * ولو اتبعتت في PATCH سيقوم ValidationPipe برفضها.
     */
    const normalized =
      toEditableValues(
        gradesCriteria
      );

    reset(normalized);

    setDefaultValues(
      normalized
    );
  }, [
    gradesCriteria,
    reset,
  ]);

  /*
   * دعم السجلات القديمة التي كانت تخزن اسم السنة
   * بدل academicYearId. نستخدم الاسم فقط لتحديد الـID
   * من قائمة السنوات ثم نخزن academicYearId في الفورم.
   */
  useEffect(() => {
    if (
      !gradesCriteria ||
      academicYears.length === 0 ||
      normalizeId(
        watch(
          "academicYearId"
        )
      )
    ) {
      return;
    }

    const legacyYearName =
      typeof gradesCriteria
        ?.academicYear ===
      "string"
        ? String(
            gradesCriteria
              .academicYear
          ).trim()
        : "";

    if (!legacyYearName) {
      return;
    }

    const matched =
      academicYears.find(
        (year) =>
          year.name ===
          legacyYearName ||
          year.id ===
          legacyYearName
      );

    if (matched?.id) {
      setValue(
        "academicYearId",
        matched.id,
        {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        }
      );

      setDefaultValues(
        (previous) =>
          previous
            ? {
                ...previous,
                academicYearId:
                  matched.id,
              }
            : previous
      );
    }
  }, [
    gradesCriteria,
    academicYears,
    setValue,
    watch,
  ]);

  const watchedValues =
    watch();

  const totalGrades =
    useMemo(
      () =>
        calculateTotal(
          watchedValues
        ),
      [watchedValues]
    );

  const isTotalValid =
    totalGrades === 100;

  const selectedAcademicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const selectedSubjectId =
    normalizeId(
      watch("subjectId")
    );

  const onSubmit = async (
    formData
  ) => {
    if (!isTotalValid) {
      toast.error(
        "يجب أن يكون مجموع الدرجات 100 درجة"
      );
      return;
    }

    const payload =
      normalizeEditablePayload(
        formData
      );

    if (
      !payload.academicYearId
    ) {
      toast.error(
        "اختر السنة الدراسية"
      );
      return;
    }

    if (!payload.subjectId) {
      toast.error(
        "اختر المادة"
      );
      return;
    }

    const subjectExists =
      subjects.some(
        (subject) =>
          subject.id ===
          payload.subjectId
      );

    if (
      subjects.length > 0 &&
      !subjectExists
    ) {
      toast.error(
        "المادة المختارة غير موجودة في قائمة مواد المدرسة"
      );
      return;
    }

    if (
      !isValidPassingGrade(
        payload.passingGrade
      )
    ) {
      toast.error(
        "درجة النجاح يجب أن تكون من 0 إلى 100"
      );
      return;
    }

    if (
      defaultValues &&
      samePayload(
        payload,
        normalizeEditablePayload(
          defaultValues
        )
      )
    ) {
      toast.info(
        "لم تحدث أي بيانات للتعديل"
      );
      return;
    }

    /*
     * Payload whitelist فقط.
     * لا subjectOffering
     * لا subject
     * لا academicYear
     * لا schoolId / createdAt / updatedAt / __v
     */
    const safePayload = {
      subjectId:
        payload.subjectId,

      academicYearId:
        payload.academicYearId,

      final:
        payload.final,

      activities:
        payload.activities,

      projects:
        payload.projects,

      projectsCount:
        payload.projectsCount,

      assignments:
        payload.assignments,

      assignmentsCount:
        payload.assignmentsCount,

      quizzes:
        payload.quizzes,

      quizzesCount:
        payload.quizzesCount,

      passingGrade:
        payload.passingGrade,
    };

    setLoading(true);

    try {
      const response =
        await editGradesCriteria(
          safePayload,
          id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء تعديل توزيع الدرجات"
          )
        );
        return;
      }

      toast.success(
        "تم تعديل توزيع الدرجات بنجاح"
      );

      const updatedId =
        getResponseId(
          response
        ) || id;

      navigate(
        `/school/gradesCriteria/${updatedId}`
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل توزيع الدرجات"
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    gradesCriteriaLoading &&
    !defaultValues
  ) {
    return <Loading />;
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
        sx={{
          width: "100%",
          pb: 3,
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 1.35,
              md: 1.8,
            },
            py: {
              xs: 1,
              md: 1.15,
            },
            border:
              "1px solid rgba(36,74,112,0.075)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.30))",
            boxShadow:
              "0 8px 22px rgba(18,47,77,0.045)",
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
            <Back title="تعديل توزيع الدرجات" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10.5px",
                lineHeight: 1.6,
              }}
            >
              عدّل السنة أو المادة
              والدرجات ثم احفظ
              التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <SchoolRounded />
            }
            title="المادة والسنة الدراسية"
            description="يتم الحفظ باستخدام subjectId و academicYearId فقط بدون Subject Offering."
          />

          {subjectsError && (
            <Alert
              severity="warning"
              sx={{
                mb: 1.25,
                borderRadius: "13px",
                fontSize: "10.5px",
              }}
            >
              {subjectsError}
            </Alert>
          )}

          {defaultValues && (
            <Grid
              container
              spacing={{
                xs: 1.25,
                md: 1.6,
              }}
              alignItems="flex-start"
            >
              <Grid
                item
                xs={12}
                md={6}
              >
                <TextField
                  select
                  fullWidth
                  label="السنة الدراسية"
                  value={
                    selectedAcademicYearId ||
                    ""
                  }
                  onChange={(
                    event
                  ) => {
                    setValue(
                      "academicYearId",
                      event.target
                        .value || "",
                      {
                        shouldDirty:
                          true,
                        shouldTouch:
                          true,
                        shouldValidate:
                          true,
                      }
                    );
                  }}
                  disabled={
                    loadingAcademicYears
                  }
                  error={Boolean(
                    errors
                      .academicYearId
                  )}
                  helperText={
                    errors
                      .academicYearId
                      ?.message ||
                    (loadingAcademicYears
                      ? "جاري تحميل السنوات الدراسية..."
                      : "اختر السنة المرتبط بها توزيع الدرجات")
                  }
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          maxHeight:
                            320,
                          borderRadius:
                            "14px",
                          mt: 0.6,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    اختر السنة الدراسية
                  </MenuItem>

                  {academicYears.map(
                    (year) => (
                      <MenuItem
                        key={
                          year.id
                        }
                        value={
                          year.id
                        }
                      >
                        {year.name}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                md={6}
              >
                <TextField
                  select
                  fullWidth
                  label="المادة"
                  value={
                    selectedSubjectId ||
                    ""
                  }
                  onChange={(
                    event
                  ) => {
                    setValue(
                      "subjectId",
                      event.target
                        .value || "",
                      {
                        shouldDirty:
                          true,
                        shouldTouch:
                          true,
                        shouldValidate:
                          true,
                      }
                    );
                  }}
                  disabled={
                    loadingSubjects ||
                    subjects.length ===
                      0
                  }
                  error={Boolean(
                    errors.subjectId
                  )}
                  helperText={
                    errors.subjectId
                      ?.message ||
                    (loadingSubjects
                      ? "جاري تحميل مواد المدرسة..."
                      : subjects.length >
                        0
                      ? `${subjects.length} مادة متاحة في المدرسة`
                      : "لا توجد مواد دراسية متاحة")
                  }
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          maxHeight:
                            320,
                          borderRadius:
                            "14px",
                          mt: 0.6,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    اختر المادة
                  </MenuItem>

                  {subjects.map(
                    (subject) => (
                      <MenuItem
                        key={
                          subject.id
                        }
                        value={
                          subject.id
                        }
                      >
                        {
                          subject.label
                        }
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>
            </Grid>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <AssessmentRounded />
            }
            title="تفاصيل توزيع الدرجات"
            description="حدّد درجة النجاح ثم راجع بنود التقييم؛ درجة النجاح لا تدخل ضمن مجموع 100 درجة."
            endContent={
              <Chip
                label={`${totalGrades} / 100`}
                sx={{
                  minWidth: 88,
                  height: 34,
                  color:
                    isTotalValid
                      ? "#237449"
                      : "var(--color-danger)",
                  backgroundColor:
                    isTotalValid
                      ? "rgba(116,201,154,0.16)"
                      : "rgba(201,79,79,0.08)",
                  border:
                    isTotalValid
                      ? "1px solid rgba(116,201,154,0.28)"
                      : "1px solid rgba(201,79,79,0.18)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              />
            }
          />

          {defaultValues && (
            <GradeInputs
              register={register}
              errors={errors}
              defaultValues={
                defaultValues
              }
            />
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.15,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.05)",
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
                loading ||
                gradesCriteriaLoading ||
                !isTotalValid
              }
              variant="contained"
              startIcon={
                loading ? (
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
                  sm: 200,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "7px",
                    marginRight: 0,
                  },
              }}
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ التغييرات"}
            </Button>

            <Button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              variant="outlined"
              startIcon={
                <CloseRounded />
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 145,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.18)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "7px",
                    marginRight: 0,
                  },
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

const GradeInputs = ({
  register,
  errors,
  defaultValues,
}) => (
  <Grid
    container
    spacing={{
      xs: 1.5,
      md: 2,
    }}
  >
    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="passingGrade"
        error={
          errors.passingGrade
            ?.message
        }
        label="درجة النجاح"
        type="number"
        defaultValue={
          defaultValues
            .passingGrade ?? 50
        }
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="final"
        error={
          errors.final?.message
        }
        label="درجة الاختبار النهائي"
        required
        type="number"
        defaultValue={
          defaultValues.final
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="activities"
        error={
          errors.activities
            ?.message
        }
        label="درجة أعمال السنة"
        required
        type="number"
        defaultValue={
          defaultValues
            .activities
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="projects"
        error={
          errors.projects
            ?.message
        }
        label="درجة المهام الأدائية"
        required
        type="number"
        defaultValue={
          defaultValues.projects
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="projectsCount"
        error={
          errors.projectsCount
            ?.message
        }
        label="عدد المهام الأدائية"
        required
        type="number"
        defaultValue={
          defaultValues
            .projectsCount
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="assignments"
        error={
          errors.assignments
            ?.message
        }
        label="درجة الواجبات"
        required
        type="number"
        defaultValue={
          defaultValues
            .assignments
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="assignmentsCount"
        error={
          errors.assignmentsCount
            ?.message
        }
        label="عدد الواجبات"
        required
        type="number"
        defaultValue={
          defaultValues
            .assignmentsCount
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="quizzes"
        error={
          errors.quizzes
            ?.message
        }
        label="درجة الاختبارات القصيرة"
        required
        type="number"
        defaultValue={
          defaultValues.quizzes
        }
        valueAsNumber
      />
    </Grid>

    <Grid
      item
      xs={12}
      sm={6}
      lg={4}
    >
      <Input
        register={register}
        registerName="quizzesCount"
        error={
          errors.quizzesCount
            ?.message
        }
        label="عدد الاختبارات القصيرة"
        required
        type="number"
        defaultValue={
          defaultValues
            .quizzesCount
        }
        valueAsNumber
      />
    </Grid>
  </Grid>
);

export default Edit;
