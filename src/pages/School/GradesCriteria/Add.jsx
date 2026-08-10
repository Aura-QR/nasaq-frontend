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
  EditRounded,
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
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";

import {
  addGradesCriteria,
  fetchGradesCriteria,
} from "@/APIs/school/gradesCriteria";
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

const getCriteriaId = (criteria) =>
  normalizeId(
    criteria?._id ||
    criteria?.id
  );

const getCriteriaSubjectId = (criteria) =>
  normalizeId(
    criteria?.subjectId ||
    criteria?.subject ||
    criteria?.subjectOffering
      ?.subjectId ||
    criteria?.subjectOffering
      ?.subject ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria.subjectOfferingId === "object"
        ? criteria.subjectOfferingId
            ?.subjectId
        : ""
    )
  );

const getCriteriaAcademicYearId = (criteria) =>
  normalizeId(
    criteria?.academicYearId ||
    (
      criteria?.academicYear &&
      typeof criteria.academicYear === "object"
        ? criteria.academicYear
        : ""
    ) ||
    criteria?.subjectOffering
      ?.academicYearId ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria.subjectOfferingId === "object"
        ? criteria.subjectOfferingId
            ?.academicYearId
        : ""
    )
  );



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

const mapSubjectOption = (
  item
) => {
  const id =
    normalizeId(item);

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
      backgroundColor:
        "#fff",
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


const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      passingGrade: 50,
      academicYearId: "",
      subjectId: "",
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
  }, [register]);

  const [loading, setLoading] =
    useState(false);

  const [
    checkingExisting,
    setCheckingExisting,
  ] = useState(false);

  const [
    existingCriteria,
    setExistingCriteria,
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
    catalogSubjects,
    setCatalogSubjects,
  ] = useState([]);

  const [
    availableSubjects,
    setAvailableSubjects,
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

  const [searchParams] =
    useSearchParams();

  const querySubjectId =
    searchParams.get(
      "subjectId"
    ) || "";

  const queryAcademicYearId =
    searchParams.get(
      "academicYearId"
    ) || "";

  const queryAcademicYear =
    searchParams.get(
      "academicYear"
    ) || "";

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

        setCatalogSubjects(mapped);
        setAvailableSubjects(mapped);

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

  const selectedAcademicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const selectedSubjectId =
    normalizeId(
      watch("subjectId")
    );

  useEffect(() => {
    if (
      catalogSubjects.length === 0
    ) {
      return;
    }

    if (
      querySubjectId &&
      catalogSubjects.some(
        (subject) =>
          subject.id ===
          normalizeId(
            querySubjectId
          )
      )
    ) {
      setValue(
        "subjectId",
        normalizeId(
          querySubjectId
        ),
        {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        }
      );
    }
  }, [
    catalogSubjects,
    querySubjectId,
    setValue,
  ]);

  useEffect(() => {
    let active = true;

    const loadAcademicYears =
      async () => {
        setLoadingAcademicYears(
          true
        );

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
            ).map(
              mapAcademicYear
            )
          );
        }

        setLoadingAcademicYears(
          false
        );
      };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      academicYears.length === 0
    ) {
      return;
    }

    if (queryAcademicYearId) {
      setValue(
        "academicYearId",
        queryAcademicYearId
      );
      return;
    }

    if (!queryAcademicYear) {
      return;
    }

    const normalizedQuery =
      String(
        queryAcademicYear
      ).trim();

    const matchedYear =
      academicYears.find(
        (item) =>
          item.id ===
            normalizedQuery ||
          item.name ===
            normalizedQuery
      );

    if (matchedYear?.id) {
      setValue(
        "academicYearId",
        matchedYear.id
      );
    }
  }, [
    academicYears,
    queryAcademicYear,
    queryAcademicYearId,
    setValue,
  ]);

  useEffect(() => {
    if (
      !selectedAcademicYearId ||
      !selectedSubjectId
    ) {
      setExistingCriteria(null);
      setCheckingExisting(false);
      return;
    }

    let active = true;

    const checkExistingCriteria =
      async () => {
        setCheckingExisting(true);
        setExistingCriteria(null);

        try {
          let response =
            await fetchGradesCriteria({
              subjectId:
                selectedSubjectId,
              academicYearId:
                selectedAcademicYearId,
              page: 1,
              limit: 1000,
            });

          if (!active) {
            return;
          }

          let list =
            response?.status === false
              ? []
              : findFirstArray(response);

          let matched =
            list.find((criteria) => {
              const subjectId =
                getCriteriaSubjectId(
                  criteria
                );

              const academicYearId =
                getCriteriaAcademicYearId(
                  criteria
                );

              return (
                subjectId ===
                  selectedSubjectId &&
                (
                  !academicYearId ||
                  academicYearId ===
                    selectedAcademicYearId
                )
              );
            });

          /*
           * دعم السجلات القديمة التي قد لا تظهر عند استخدام
           * filters الحديثة لأنها محفوظة بـ subjectOfferingId.
           */
          if (!matched) {
            const fallbackResponse =
              await fetchGradesCriteria({
                page: 1,
                limit: 1000,
              });

            if (!active) {
              return;
            }

            if (
              fallbackResponse?.status !==
              false
            ) {
              list =
                findFirstArray(
                  fallbackResponse
                );

              matched =
                list.find(
                  (criteria) => {
                    const subjectId =
                      getCriteriaSubjectId(
                        criteria
                      );

                    const academicYearId =
                      getCriteriaAcademicYearId(
                        criteria
                      );

                    return (
                      subjectId ===
                        selectedSubjectId &&
                      (
                        !academicYearId ||
                        academicYearId ===
                          selectedAcademicYearId
                      )
                    );
                  }
                );
            }
          }

          setExistingCriteria(
            matched || null
          );
        } catch {
          /*
           * فشل check المسبق لا يمنع المستخدم من العمل.
           * الـBackend يظل هو مصدر الحماية النهائي من التكرار.
           */
          if (active) {
            setExistingCriteria(null);
          }
        } finally {
          if (active) {
            setCheckingExisting(false);
          }
        }
      };

    checkExistingCriteria();

    return () => {
      active = false;
    };
  }, [
    selectedAcademicYearId,
    selectedSubjectId,
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

  const onSubmit = async (
    formData
  ) => {
    if (existingCriteria) {
      toast.info(
        "يوجد توزيع درجات لهذه المادة والسنة بالفعل"
      );
      return;
    }

    if (!isTotalValid) {
      toast.error(
        "يجب أن يكون مجموع الدرجات 100 درجة"
      );
      return;
    }

    const passingGrade =
      normalizePassingGrade(
        formData.passingGrade
      );

    if (
      !isValidPassingGrade(
        passingGrade
      )
    ) {
      toast.error(
        "درجة النجاح يجب أن تكون من 0 إلى 100"
      );
      return;
    }

    const academicYearId =
      normalizeId(
        formData.academicYearId
      );

    const subjectId =
      normalizeId(
        formData.subjectId
      );

    if (!academicYearId) {
      toast.error(
        "اختر السنة الدراسية"
      );
      return;
    }

    if (!subjectId) {
      toast.error(
        "اختر المادة"
      );
      return;
    }

    const subjectExists =
      catalogSubjects.some(
        (subject) =>
          subject.id ===
          subjectId
      );

    if (!subjectExists) {
      toast.error(
        "المادة المختارة غير موجودة في قائمة مواد المدرسة"
      );
      return;
    }

    const payload = {
      subjectId,
      academicYearId,

      final: Number(
        formData.final
      ),

      activities: Number(
        formData.activities
      ),

      projects: Number(
        formData.projects
      ),

      projectsCount: Number(
        formData.projectsCount
      ),

      assignments: Number(
        formData.assignments
      ),

      assignmentsCount: Number(
        formData.assignmentsCount
      ),

      quizzes: Number(
        formData.quizzes
      ),

      quizzesCount: Number(
        formData.quizzesCount
      ),

      passingGrade,
    };

    setLoading(true);

    try {
      const response =
        await addGradesCriteria(
          payload
        );

      if (!response?.status) {
        const message =
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة توزيع الدرجات"
          );

        if (
          /موجودة بالفعل|مكرر|duplicate|already exists/i.test(
            String(message)
          )
        ) {
          toast.info(
            "يوجد توزيع درجات لهذه المادة والسنة بالفعل"
          );
        } else {
          toast.error(message);
        }

        return;
      }

      toast.success(
        "تم توزيع درجات المادة بنجاح"
      );

      const createdId =
        getResponseId(
          response
        );

      navigate(
        createdId
          ? `/school/gradesCriteria/${createdId}`
          : "/school/gradesCriteria"
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة توزيع الدرجات"
      );
    } finally {
      setLoading(false);
    }
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
            <Back title="إضافة توزيع درجات" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10.5px",
                lineHeight: 1.6,
              }}
            >
              اختر السنة والمادة من
              بيانات المدرسة ثم وزّع
              100 درجة على البنود.
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
            description="اختر السنة الدراسية والمادة من قائمة مواد المدرسة، ثم حدّد توزيع الدرجات."
          />

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
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setValue(
                    "academicYearId",
                    value || "",
                    {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    }
                  );

                }}
                disabled={
                  loadingAcademicYears
                }
                error={
                  Boolean(
                    errors
                      .academicYearId
                  )
                }
                helperText={
                  errors
                    .academicYearId
                    ?.message ||
                  (loadingAcademicYears
                    ? "جاري تحميل السنوات الدراسية..."
                    : "اختر السنة التي سيتم تطبيق توزيع الدرجات عليها")
                }
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxHeight: 320,
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
                      key={year.id}
                      value={year.id}
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
                  watch(
                    "subjectId"
                  ) || ""
                }
                onChange={(event) => {
                  setValue(
                    "subjectId",
                    event.target.value,
                    {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    }
                  );
                }}
                disabled={
                  loadingSubjects ||
                  availableSubjects.length === 0
                }
                error={
                  Boolean(
                    errors
                      .subjectId
                  )
                }
                helperText={
                  errors
                    .subjectId
                    ?.message ||
                  (loadingSubjects
                    ? "جاري تحميل مواد المدرسة..."
                    : availableSubjects.length > 0
                    ? `${availableSubjects.length} مادة متاحة في المدرسة`
                    : "لا توجد مواد دراسية متاحة")
                }
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxHeight: 320,
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

                {availableSubjects.map(
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

              {loadingSubjects && (
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.7}
                  sx={{
                    mt: 0.7,
                    color:
                      "var(--color-muted)",
                  }}
                >
                  <CircularProgress
                    size={12}
                    thickness={5}
                  />
                  <Typography
                    sx={{
                      fontSize:
                        "9.5px",
                    }}
                  >
                    جاري تحميل مواد المدرسة...
                  </Typography>
                </Stack>
              )}

              {!loadingSubjects &&
                subjectsError && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 0.8,
                      borderRadius:
                        "12px",
                      py: 0.25,
                      px: 1,
                      fontSize:
                        "10px",
                      alignItems:
                        "center",
                      backgroundColor:
                        "rgba(211,164,79,0.08)",
                      color:
                        "var(--color-navy)",
                      border:
                        "1px solid rgba(211,164,79,0.18)",
                    }}
                  >
                    {
                      subjectsError
                    }
                  </Alert>
                )}
            </Grid>
          </Grid>

          {checkingExisting && (
            <Stack
              direction="row"
              alignItems="center"
              gap={0.8}
              sx={{
                mt: 1.2,
                px: 0.4,
                color:
                  "var(--color-muted)",
              }}
            >
              <CircularProgress
                size={14}
                thickness={5}
              />
              <Typography
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                جاري التحقق من وجود توزيع درجات سابق...
              </Typography>
            </Stack>
          )}

          {!checkingExisting &&
            existingCriteria && (
              <Alert
                severity="info"
                sx={{
                  mt: 1.25,
                  borderRadius: "14px",
                  alignItems: "center",
                  "& .MuiAlert-message": {
                    width: "100%",
                  },
                }}
                action={
                  getCriteriaId(
                    existingCriteria
                  ) ? (
                    <Button
                      type="button"
                      size="small"
                      variant="contained"
                      startIcon={
                        <EditRounded />
                      }
                      onClick={() =>
                        navigate(
                          `/school/gradesCriteria/edit/${getCriteriaId(
                            existingCriteria
                          )}`
                        )
                      }
                      sx={{
                        minHeight: 34,
                        borderRadius:
                          "10px",
                        fontWeight: 800,
                        textTransform:
                          "none",
                      }}
                    >
                      تعديل التوزيع الحالي
                    </Button>
                  ) : null
                }
              >
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  يوجد توزيع درجات لهذه المادة والسنة بالفعل
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: "9.5px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  لا يمكن إنشاء توزيع جديد لنفس المادة والسنة. يمكنك تعديل التوزيع الحالي بدلًا من ذلك.
                </Typography>
              </Alert>
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
            description="حدّد درجة النجاح ثم وزّع بنود التقييم بحيث يكون مجموعها 100 درجة؛ درجة النجاح لا تدخل في المجموع."
            endContent={
              <Chip
                label={`المجموع ${totalGrades} / 100`}
                sx={{
                  minWidth: 118,
                  height: 36,
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

          <GradeInputs
            register={register}
            errors={errors}
          />
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
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.22))",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.045)",
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
                checkingExisting ||
                Boolean(
                  existingCriteria
                ) ||
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
                minHeight: 46,
                borderRadius: "13px",
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
                : checkingExisting
                ? "جاري التحقق..."
                : existingCriteria
                ? "التوزيع موجود بالفعل"
                : "حفظ توزيع الدرجات"}
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
                minHeight: 46,
                borderRadius: "13px",
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
  defaultValues = {},
}) => (
  <Grid
    container
    spacing={{
      xs: 1.5,
      md: 2,
    }}
  >
    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="passingGrade"
        error={errors.passingGrade?.message}
        label="درجة النجاح"
        type="number"
        defaultValue={
          defaultValues.passingGrade ?? 50
        }
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="final"
        error={errors.final?.message}
        label="درجة الاختبار النهائي"
        required
        type="number"
        defaultValue={defaultValues.final}
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="activities"
        error={errors.activities?.message}
        label="درجة أعمال السنة"
        required
        type="number"
        defaultValue={defaultValues.activities}
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="projects"
        error={errors.projects?.message}
        label="درجة المهام الأدائية"
        required
        type="number"
        defaultValue={defaultValues.projects}
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="projectsCount"
        error={errors.projectsCount?.message}
        label="عدد المهام الأدائية"
        required
        type="number"
        defaultValue={defaultValues.projectsCount}
        valueAsNumber
        inputProps={{
          min: 1,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="assignments"
        error={errors.assignments?.message}
        label="درجة الواجبات"
        required
        type="number"
        defaultValue={defaultValues.assignments}
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="assignmentsCount"
        error={errors.assignmentsCount?.message}
        label="عدد الواجبات"
        required
        type="number"
        defaultValue={defaultValues.assignmentsCount}
        valueAsNumber
        inputProps={{
          min: 1,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="quizzes"
        error={errors.quizzes?.message}
        label="درجة الاختبارات القصيرة"
        required
        type="number"
        defaultValue={defaultValues.quizzes}
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="quizzesCount"
        error={errors.quizzesCount?.message}
        label="عدد الاختبارات القصيرة"
        required
        type="number"
        defaultValue={defaultValues.quizzesCount}
        valueAsNumber
        inputProps={{
          min: 1,
          step: 1,
        }}
      />
    </Grid>
  </Grid>
);

export default Add;
