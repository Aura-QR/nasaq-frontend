import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  CloseRounded,
  EventNoteRounded,
  GradeRounded,
  InfoOutlined,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Input from "@/components/Input/Input";
import Questions from "@/pages/School/Exams/Components/Questions";

import { addExam } from "@/APIs/school/exams";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchTermsByAcademicYear } from "@/APIs/school/lectures";
import { fetchSubjectOfferings } from "@/APIs/school/subjectOfferings";
import { fetchSubjects } from "@/APIs/school/subjects";
import { fetchGradeLevels } from "@/APIs/school/gradeLevels";
import { getSchoolClasses } from "@/APIs/school/classes";

import MCQExams from "@/utils/constants/MCQExams";
import usePermissions from "@/utils/hooks/usePermissions";

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
    payload?.exam?._id ||
    payload?.exam?.id ||
    ""
  );
};

const getResponseList = (response) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload?.docs ||
    payload?.items ||
    payload?.results ||
    []
  );
};

const normalizeId = (value) => {
  const resolved =
    value?.target?.value ??
    value;

  if (
    resolved &&
    typeof resolved === "object"
  ) {
    return String(
      resolved?._id ||
      resolved?.id ||
      resolved?.value ||
      ""
    ).trim();
  }

  return String(
    resolved || ""
  ).trim();
};

const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  return [value];
};

const extractList = (value) => {
  let current = value;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !("data" in current)
    ) {
      break;
    }

    current = current.data;
  }

  if (Array.isArray(current)) {
    return current;
  }

  if (
    !current ||
    typeof current !== "object"
  ) {
    return [];
  }

  for (const key of [
    "docs",
    "items",
    "results",
    "rows",
    "records",
    "academicYears",
    "years",
    "terms",
    "gradeLevels",
    "grades",
    "classes",
    "subjects",
    "offerings",
    "subjectOfferings",
  ]) {
    if (
      Array.isArray(current?.[key])
    ) {
      return current[key];
    }
  }

  return [];
};

const mapAcademicYear = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    "سنة دراسية",
});

const mapTerm = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    `الترم ${item?.order || ""}`.trim(),
  order: Number(item?.order || 0),
});

const getOfferingSubject = (offering) =>
  offering?.subjectId ||
  offering?.subject ||
  null;

const getOfferingGradeLevelId = (
  offering
) =>
  normalizeId(
    offering?.gradeLevelId ||
    offering?.gradeLevel
  );

const mapSubjectFromOffering = (
  offering
) => {
  const subject =
    getOfferingSubject(offering);

  const id =
    normalizeId(subject);

  const name =
    subject?.subjectName ||
    subject?.name ||
    offering?.subjectName ||
    "مادة";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    offering?.subjectCode ||
    "";

  return {
    id,
    name: code
      ? `${name} - ${code}`
      : name,
  };
};

const mapGradeLevel = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    item?.gradeName ||
    "صف دراسي",
  order: Number(item?.order || 0),
});

const mapCatalogSubject = (item) => {
  const id = normalizeId(item);

  const name =
    item?.subjectName ||
    item?.name ||
    item?.label ||
    "مادة";

  const code =
    item?.subjectCode ||
    item?.code ||
    "";

  return {
    id,
    name: code
      ? `${name} - ${code}`
      : name,
  };
};

const localizeFieldError = (message) => {
  if (!message) {
    return "";
  }

  const normalized =
    String(message).trim();

  if (
    normalized ===
      "This Field Is Required" ||
    normalized.toLowerCase() ===
      "this field is required"
  ) {
    return "هذا الحقل مطلوب";
  }

  return normalized;
};

const mapClass = (item) => {
  const id = normalizeId(item);

  const grade =
    item?.gradeLevelId ||
    item?.gradeLevel ||
    null;

  const gradeName =
    grade?.name ||
    item?.gradeLevelName ||
    "";

  const room =
    item?.roomNumber ||
    item?.name ||
    "";

  const label = [
    gradeName,
    room,
  ]
    .filter(Boolean)
    .join(" - ");

  return {
    id,
    name:
      label ||
      `فصل ${id.slice(-4)}`,
    gradeLevelId:
      normalizeId(grade),
  };
};

const criteriaMatchesSelection = (
  criteria,
  {
    subjectId,
    academicYearId,
    termId,
    gradeLevelId,
    yearTermIds,
  }
) => {
  const offering =
    criteria?.subjectOffering ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria.subjectOfferingId === "object"
        ? criteria.subjectOfferingId
        : null
    );

  const criteriaSubjectId =
    normalizeId(
      criteria?.subjectId ||
      criteria?.subject ||
      offering?.subjectId ||
      offering?.subject
    );

  if (
    !criteriaSubjectId ||
    criteriaSubjectId !== subjectId
  ) {
    return false;
  }

  const criteriaYearId =
    normalizeId(
      criteria?.academicYearId ||
      (
        criteria?.academicYear &&
        typeof criteria.academicYear === "object"
          ? criteria.academicYear
          : ""
      ) ||
      offering?.academicYearId
    );

  const criteriaTermId =
    normalizeId(
      criteria?.termId ||
      criteria?.term ||
      offering?.termId ||
      offering?.term
    );

  const criteriaGradeLevelId =
    normalizeId(
      criteria?.gradeLevelId ||
      criteria?.gradeLevel ||
      offering?.gradeLevelId ||
      offering?.gradeLevel
    );

  /*
   * الشكل الجديد:
   * Grades Criteria محفوظ بـ subjectId + academicYearId.
   * هنا لا نشترط Subject Offering أو termId.
   */
  if (
    criteriaYearId &&
    academicYearId
  ) {
    return (
      criteriaYearId === academicYearId
    );
  }

  /*
   * الشكل القديم:
   * Grades Criteria محفوظ بـ subjectOfferingId فقط.
   * الـSubject Offering يحمل الصف والترم، فنطابقهم مع
   * اختيارات صفحة الاختبار.
   */
  if (offering) {
    if (
      gradeLevelId &&
      criteriaGradeLevelId &&
      criteriaGradeLevelId !== gradeLevelId
    ) {
      return false;
    }

    if (
      termId &&
      criteriaTermId &&
      criteriaTermId !== termId
    ) {
      return false;
    }

    if (
      termId &&
      criteriaTermId === termId
    ) {
      return true;
    }

    if (
      criteriaTermId &&
      yearTermIds.has(
        criteriaTermId
      )
    ) {
      return true;
    }

    /*
     * بعض الـresponses القديمة لا تعمل populate للترم
     * ولكن تعمل populate للصف والمادة فقط.
     */
    if (
      gradeLevelId &&
      criteriaGradeLevelId === gradeLevelId
    ) {
      return true;
    }
  }

  return false;
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

const createQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

const normalizeQuestion = (
  question = {}
) => ({
  question:
    question?.question || "",
  options: [
    ...(Array.isArray(
      question?.options
    )
      ? question.options
      : []),
    "",
    "",
    "",
    "",
  ].slice(0, 4),
  correctAnswer:
    question?.correctAnswer ||
    "",
});

const validateExamDates = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    return true;
  }

  return (
    new Date(endDate) >=
    new Date(startDate)
  );
};

const FORM_CARD_SX = {
  p: {
    xs: 1.5,
    md: 2,
  },
  mt: 1.25,
  overflow: "visible",
  border:
    "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor:
    "var(--color-cream)",
  boxShadow:
    "0 12px 28px rgba(18,47,77,0.06)",

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root":
    {
      minHeight: 48,
      backgroundColor:
        "var(--color-white)",
      borderRadius: "12px",
    },

  "& .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.16)",
    },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.28)",
    },

  "& .MuiOutlinedInput-root.Mui-focused":
    {
      boxShadow:
        "0 0 0 3px rgba(211,164,79,0.10)",
    },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "var(--color-gold)",
      borderWidth: "1px",
    },

  "& .MuiInputLabel-root": {
    px: 0.65,
    color:
      "var(--color-muted)",
    backgroundColor:
      "var(--color-cream)",
    fontSize: "10.5px",
    fontWeight: 700,
  },
};

const SectionHeading = ({
  icon,
  title,
  description,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom:
        "1px solid rgba(36,74,112,0.07)",
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
        border:
          "1px solid rgba(211,164,79,0.22)",
        borderRadius: "12px",

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
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.2,
          color:
            "var(--color-muted)",
          fontSize: "10px",
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  </Stack>
);

const GradesCriteriaStatus = ({
  loading,
  hasGradesCriteria,
  subjectId,
  academicYearId,
  termId,
  canAddCriteria,
  navigate,
}) => {
  if (
    !subjectId ||
    !academicYearId
  ) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          minHeight: 150,
          p: 2,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border:
            "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          backgroundColor:
            "var(--color-cream)",
        }}
      >
        <Stack
          alignItems="center"
          spacing={0.7}
        >
          <InfoOutlined
            sx={{
              color:
                "var(--color-gold-dark)",
            }}
          />

          <Typography
            sx={{
              color:
                "var(--color-navy-deep)",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            اختر المادة والسنة الدراسية
          </Typography>

          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontSize: "10px",
            }}
          >
            بعد الاختيار سنتحقق من وجود توزيع درجات للمادة.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          minHeight: 150,
          display: "grid",
          placeItems: "center",
          border:
            "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          backgroundColor:
            "var(--color-cream)",
        }}
      >
        <Stack
          alignItems="center"
          spacing={1}
        >
          <CircularProgress
            size={25}
            sx={{
              color:
                "var(--color-gold-dark)",
            }}
          />

          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontSize: "10px",
            }}
          >
            جاري التحقق من توزيع الدرجات...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (hasGradesCriteria) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        minHeight: 190,
        p: 2,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        border:
          "1px solid rgba(211,164,79,0.20)",
        borderRadius: "18px",
        background:
          "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.50))",
      }}
    >
      <Stack
        alignItems="center"
        spacing={0.9}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
            color:
              "var(--color-gold-dark)",
            backgroundColor:
              "var(--color-gold-soft)",
            borderRadius: "15px",
          }}
        >
          <GradeRounded />
        </Box>

        <Typography
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          لا يوجد توزيع درجات مطابق لهذه المادة
        </Typography>

        <Typography
          sx={{
            maxWidth: 430,
            color:
              "var(--color-muted)",
            fontSize: "10px",
            lineHeight: 1.7,
          }}
        >
          يجب إضافة توزيع درجات للمادة في السنة المحددة قبل إنشاء الاختبار.
        </Typography>

        {canAddCriteria ? (
          <Button
            type="button"
            onClick={() => {
              const params =
                new URLSearchParams();

              params.set(
                "subjectId",
                subjectId
              );

              params.set(
                "academicYearId",
                academicYearId
              );

              if (termId) {
                params.set(
                  "termId",
                  termId
                );
              }

              navigate(
                `/school/gradesCriteria/add?${params.toString()}`
              );
            }}
            variant="contained"
            startIcon={
              <AddCircleOutlineRounded />
            }
            sx={{
              mt: 0.4,
              minHeight: 42,
              px: 2,
              borderRadius: "12px",
              color:
                "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "7px",
                  marginRight: 0,
                },
            }}
          >
            إضافة توزيع درجات
          </Button>
        ) : (
          <Typography
            sx={{
              color:
                "var(--color-danger)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            لا تملك صلاحية إضافة توزيع درجات؛ تواصل مع المسؤول.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};


const Add = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      academicYearId: "",
      termId: "",
      gradeLevelId: "",
      subjectId: "",
      examType: "",
      startDate: "",
      endDate: "",
      duration: "",
      questions: [
        createQuestion(),
      ],
      classIds: [],
    },
  });

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "questions",
  });

  const [loading, setLoading] =
    useState(false);

  const [
    gradesCriteriaLoading,
    setGradesCriteriaLoading,
  ] = useState(false);

  const [
    gradesCriteria,
    setGradesCriteria,
  ] = useState([]);

  const [
    yearTermIds,
    setYearTermIds,
  ] = useState(new Set());

  const subjectId =
    normalizeId(
      watch("subjectId")
    );

  const academicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const termId =
    normalizeId(
      watch("termId")
    );

  const gradeLevelId =
    normalizeId(
      watch("gradeLevelId")
    );

  const navigate =
    useNavigate();

  const criteriaPermissions =
    usePermissions(
      "gradesCriteria"
    );

  useEffect(() => {
    if (!academicYearId) {
      setYearTermIds(
        new Set()
      );
      return;
    }

    let active = true;

    const loadYearTerms =
      async () => {
        const response =
          await fetchTermsByAcademicYear(
            academicYearId
          );

        if (!active) {
          return;
        }

        setYearTermIds(
          new Set(
            extractList(response)
              .map(normalizeId)
              .filter(Boolean)
          )
        );
      };

    loadYearTerms();

    return () => {
      active = false;
    };
  }, [academicYearId]);

  useEffect(() => {
    if (
      !subjectId ||
      !academicYearId
    ) {
      setGradesCriteria([]);
      setGradesCriteriaLoading(
        false
      );
      return;
    }

    let active = true;

    const loadCriteria =
      async () => {
        setGradesCriteriaLoading(
          true
        );

        try {
          /*
           * أول محاولة للشكل الجديد:
           * subjectId + academicYearId.
           */
          let response =
            await fetchGradesCriteria({
              subjectId,
              academicYearId,
              page: 1,
              limit: 1000,
            });

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setGradesCriteria([]);

            toast.error(
              getErrorMessage(
                response,
                "حدث خطأ أثناء جلب توزيع الدرجات"
              )
            );
            return;
          }

          let list =
            extractList(response);

          let matched =
            list.filter((criteria) =>
              criteriaMatchesSelection(
                criteria,
                {
                  subjectId,
                  academicYearId,
                  termId,
                  gradeLevelId,
                  yearTermIds,
                }
              )
            );

          /*
           * لو البحث المفلتر لم يجد شيئًا، نجلب القائمة
           * بدون subjectId/academicYearId حتى ندعم السجلات
           * القديمة المحفوظة بـ subjectOfferingId فقط.
           */
          if (matched.length === 0) {
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
                extractList(
                  fallbackResponse
                );

              matched =
                list.filter(
                  (criteria) =>
                    criteriaMatchesSelection(
                      criteria,
                      {
                        subjectId,
                        academicYearId,
                        termId,
                        gradeLevelId,
                        yearTermIds,
                      }
                    )
                );
            }
          }

          setGradesCriteria(
            matched
          );
        } catch (error) {
          if (active) {
            setGradesCriteria([]);

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب توزيع الدرجات"
            );
          }
        } finally {
          if (active) {
            setGradesCriteriaLoading(
              false
            );
          }
        }
      };

    loadCriteria();

    return () => {
      active = false;
    };
  }, [
    subjectId,
    academicYearId,
    termId,
    gradeLevelId,
    yearTermIds,
  ]);

  const hasGradesCriteria =
    useMemo(() => {
      if (
        !subjectId ||
        !academicYearId ||
        gradesCriteriaLoading
      ) {
        return null;
      }

      return (
        gradesCriteria.length > 0
      );
    }, [
      subjectId,
      academicYearId,
      gradesCriteria,
      gradesCriteriaLoading,
    ]);

  const addQuestion = () => {
    append(
      createQuestion()
    );
  };

  const onSubmit = async (
    formData
  ) => {
    if (
      hasGradesCriteria !== true
    ) {
      toast.error(
        "يجب إضافة توزيع درجات للمادة قبل حفظ الاختبار"
      );
      return;
    }

    if (
      !validateExamDates(
        formData.startDate,
        formData.endDate
      )
    ) {
      toast.error(
        "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء"
      );
      return;
    }

    const normalizedSubjectId =
      normalizeId(
        formData.subjectId
      );

    const normalizedGradeLevelId =
      normalizeId(
        formData.gradeLevelId
      );

    const normalizedYearId =
      normalizeId(
        formData.academicYearId
      );

    const normalizedTermId =
      normalizeId(
        formData.termId
      );

    const normalizedClassIds =
      getArray(
        formData.classIds
      )
        .map(normalizeId)
        .filter(Boolean);

    const duration =
      Number(
        formData.duration
      );

    if (
      !normalizedYearId ||
      !normalizedTermId ||
      !normalizedGradeLevelId ||
      !normalizedSubjectId
    ) {
      toast.error(
        "اختر السنة والترم والصف والمادة"
      );
      return;
    }

    if (
      normalizedClassIds.length === 0
    ) {
      toast.error(
        "اختر فصلًا واحدًا على الأقل"
      );
      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration < 1
    ) {
      toast.error(
        "مدة الاختبار يجب أن تكون دقيقة واحدة على الأقل"
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        subjectId:
          normalizedSubjectId,
        academicYearId:
          normalizedYearId,
        termId:
          normalizedTermId,
        classIds:
          normalizedClassIds,
        examType:
          formData.examType,
        startDate:
          formData.startDate,
        endDate:
          formData.endDate,
        duration,
        questions:
          getArray(
            formData.questions
          ).map(
            normalizeQuestion
          ),
      };

      const response =
        await addExam(payload);

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة الاختبار"
          )
        );
        return;
      }

      toast.success(
        "تم إضافة الاختبار بنجاح"
      );

      const createdId =
        getResponseId(
          response
        );

      navigate(
        createdId
          ? `/school/exams/${createdId}`
          : "/school/exams"
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة الاختبار"
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
          maxWidth: "100%",
          minWidth: 0,
          pb: 3,
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.05,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "rgba(255,252,247,0.9)",
            boxShadow:
              "0 8px 20px rgba(18,47,77,0.04)",
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
            <Back title="إضافة اختبار جديد" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              أدخل بيانات الاختبار ثم
              أضف الأسئلة وحدّد
              الإجابات الصحيحة.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <EventNoteRounded />
            }
            title="تفاصيل الاختبار"
            description="حدّد المادة والنوع والمواعيد والمدة والفصول المستهدفة."
          />

          <DataInputs
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
          />
        </Paper>

        <GradesCriteriaStatus
          loading={
            gradesCriteriaLoading
          }
          hasGradesCriteria={
            hasGradesCriteria
          }
          subjectId={subjectId}
          academicYearId={
            academicYearId
          }
          termId={termId}
          canAddCriteria={
            criteriaPermissions.add
          }
          navigate={navigate}
        />

        {hasGradesCriteria ===
          true && (
          <Questions
            fields={fields}
            register={register}
            errors={errors}
            watch={watch}
            remove={remove}
            addQuestion={
              addQuestion
            }
          />
        )}

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
                hasGradesCriteria !==
                  true
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
                  sm: 180,
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
                : "حفظ الاختبار"}
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

const DataInputs = ({
  register,
  errors,
  setValue,
  watch,
}) => {
  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [terms, setTerms] =
    useState([]);

  const [
    gradeLevels,
    setGradeLevels,
  ] = useState([]);

  const [
    offerings,
    setOfferings,
  ] = useState([]);

  const [
    catalogSubjects,
    setCatalogSubjects,
  ] = useState([]);

  const [
    schoolClasses,
    setSchoolClasses,
  ] = useState([]);

  const [
    loadingYears,
    setLoadingYears,
  ] = useState(true);

  const [
    loadingTerms,
    setLoadingTerms,
  ] = useState(false);

  const [
    loadingGradeLevels,
    setLoadingGradeLevels,
  ] = useState(false);

  const [
    loadingOfferings,
    setLoadingOfferings,
  ] = useState(false);

  const [
    loadingCatalogSubjects,
    setLoadingCatalogSubjects,
  ] = useState(false);

  const [
    loadingClasses,
    setLoadingClasses,
  ] = useState(false);

  const [
    setupError,
    setSetupError,
  ] = useState("");

  const academicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const termId =
    normalizeId(
      watch("termId")
    );

  const gradeLevelId =
    normalizeId(
      watch("gradeLevelId")
    );

  const subjectId =
    normalizeId(
      watch("subjectId")
    );

  const selectedClassIds =
    getArray(
      watch("classIds")
    )
      .map(normalizeId)
      .filter(Boolean);

  useEffect(() => {
    let active = true;

    const loadYears =
      async () => {
        setLoadingYears(true);
        setSetupError("");

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
            setSetupError(
              response?.message ||
                "تعذر تحميل السنوات الدراسية"
            );
            return;
          }

          setAcademicYears(
            extractList(response)
              .map(mapAcademicYear)
              .filter(
                (item) =>
                  item.id &&
                  item.name
              )
          );
        } catch (error) {
          if (active) {
            setAcademicYears([]);
            setSetupError(
              error?.response?.data
                ?.message ||
                "تعذر تحميل السنوات الدراسية"
            );
          }
        } finally {
          if (active) {
            setLoadingYears(false);
          }
        }
      };

    loadYears();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadGradeLevels =
      async () => {
        setLoadingGradeLevels(
          true
        );

        try {
          const response =
            await fetchGradeLevels();

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setGradeLevels([]);
            setSetupError(
              response?.message ||
                "تعذر تحميل الصفوف الدراسية"
            );
            return;
          }

          setGradeLevels(
            extractList(response)
              .map(mapGradeLevel)
              .filter(
                (item) =>
                  item.id &&
                  item.name
              )
              .sort(
                (a, b) =>
                  a.order - b.order
              )
          );
        } catch (error) {
          if (active) {
            setGradeLevels([]);
            setSetupError(
              error?.response?.data
                ?.message ||
                "تعذر تحميل الصفوف الدراسية"
            );
          }
        } finally {
          if (active) {
            setLoadingGradeLevels(
              false
            );
          }
        }
      };

    loadGradeLevels();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCatalogSubjects =
      async () => {
        setLoadingCatalogSubjects(
          true
        );

        try {
          const response =
            await fetchSubjects({
              page: 1,
              limit: 1000,
            });

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setCatalogSubjects([]);
            return;
          }

          const normalized =
            extractList(response)
              .map(mapCatalogSubject)
              .filter(
                (item) =>
                  item.id &&
                  item.name
              );

          setCatalogSubjects(
            normalized
          );
        } catch {
          if (active) {
            setCatalogSubjects([]);
          }
        } finally {
          if (active) {
            setLoadingCatalogSubjects(
              false
            );
          }
        }
      };

    loadCatalogSubjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadTerms =
      async () => {
        setTerms([]);
        setOfferings([]);

        if (!academicYearId) {
          return;
        }

        setLoadingTerms(true);
        setSetupError("");

        try {
          const response =
            await fetchTermsByAcademicYear(
              academicYearId
            );

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setTerms([]);
            setSetupError(
              response?.message ||
                "تعذر تحميل الترمات"
            );
            return;
          }

          setTerms(
            extractList(response)
              .map(mapTerm)
              .filter(
                (item) =>
                  item.id
              )
              .sort(
                (a, b) =>
                  a.order - b.order
              )
          );
        } catch (error) {
          if (active) {
            setTerms([]);
            setSetupError(
              error?.response?.data
                ?.message ||
                "تعذر تحميل الترمات"
            );
          }
        } finally {
          if (active) {
            setLoadingTerms(false);
          }
        }
      };

    loadTerms();

    return () => {
      active = false;
    };
  }, [academicYearId]);

  useEffect(() => {
    let active = true;

    const loadOfferings =
      async () => {
        setOfferings([]);

        if (
          !termId ||
          !gradeLevelId
        ) {
          return;
        }

        setLoadingOfferings(true);
        setSetupError("");

        try {
          let response =
            await fetchSubjectOfferings({
              termId,
              gradeLevelId,
            });

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setOfferings([]);
            setSetupError(
              response?.message ||
                "تعذر تحميل المواد المفعلة"
            );
            return;
          }

          let list =
            extractList(response);

          /*
           * بعض نسخ الباك القديمة ترجع قائمة فارغة من
           * /subject-offerings/by-term/:termId
           * رغم وجود البيانات في list endpoint.
           * نجرب المسار الاحتياطي قبل اعتبار الترم بلا مواد.
           */
          if (list.length === 0) {
            const fallbackResponse =
              await fetchSubjectOfferings(
                {
                  termId,
                  gradeLevelId,
                },
                {
                  forceListEndpoint:
                    true,
                }
              );

            if (!active) {
              return;
            }

            if (
              fallbackResponse?.status !==
              false
            ) {
              const fallbackList =
                extractList(
                  fallbackResponse
                );

              if (
                fallbackList.length > 0
              ) {
                response =
                  fallbackResponse;
                list =
                  fallbackList;
              }
            }
          }

          setOfferings(list);
        } catch (error) {
          if (active) {
            setOfferings([]);
            setSetupError(
              error?.response?.data
                ?.message ||
                "تعذر تحميل المواد المفعلة"
            );
          }
        } finally {
          if (active) {
            setLoadingOfferings(false);
          }
        }
      };

    loadOfferings();

    return () => {
      active = false;
    };
  }, [
    termId,
    gradeLevelId,
  ]);

  useEffect(() => {
    let active = true;

    const loadClasses =
      async () => {
        setSchoolClasses([]);

        if (
          !academicYearId ||
          !gradeLevelId
        ) {
          return;
        }

        setLoadingClasses(true);

        try {
          const response =
            await getSchoolClasses({
              page: 1,
              limit: 1000,
              academicYearId,
              gradeLevelId,
            });

          if (!active) {
            return;
          }

          if (
            response?.status === false
          ) {
            setSchoolClasses([]);
            return;
          }

          setSchoolClasses(
            extractList(response)
          );
        } catch {
          if (active) {
            setSchoolClasses([]);
          }
        } finally {
          if (active) {
            setLoadingClasses(false);
          }
        }
      };

    loadClasses();

    return () => {
      active = false;
    };
  }, [
    academicYearId,
    gradeLevelId,
  ]);

  const subjectOptions =
    useMemo(() => {
      const map = new Map();

      offerings.forEach(
        (offering) => {
          const subject =
            mapSubjectFromOffering(
              offering
            );

          if (
            subject.id &&
            !map.has(subject.id)
          ) {
            map.set(
              subject.id,
              subject
            );
          }
        }
      );

      const offeringSubjects =
        Array.from(
          map.values()
        );

      if (
        offeringSubjects.length > 0
      ) {
        return offeringSubjects;
      }

      /*
       * CreateExamDto يحتاج subjectId وليس subjectOfferingId.
       * لذلك لو الترم لا يرجع عروض مواد، نظهر كتالوج مواد
       * المدرسة بدل ما يكون الحقل مقفول تمامًا.
       */
      return catalogSubjects;
    }, [
      offerings,
      catalogSubjects,
    ]);

  const usingCatalogFallback =
    termId &&
    gradeLevelId &&
    !loadingOfferings &&
    offerings.length === 0 &&
    subjectOptions.length > 0;

  const classOptions =
    useMemo(
      () =>
        schoolClasses
          .map(mapClass)
          .filter(
            (item) =>
              item.id &&
              (
                !gradeLevelId ||
                !item.gradeLevelId ||
                item.gradeLevelId ===
                  gradeLevelId
              )
          ),
      [
        schoolClasses,
        gradeLevelId,
      ]
    );

  useEffect(() => {
    if (
      selectedClassIds.length ===
        0 ||
      classOptions.length === 0
    ) {
      return;
    }

    const allowedIds =
      new Set(
        classOptions.map(
          (item) => item.id
        )
      );

    const validIds =
      selectedClassIds.filter(
        (id) =>
          allowedIds.has(id)
      );

    if (
      validIds.length !==
      selectedClassIds.length
    ) {
      setValue(
        "classIds",
        validIds,
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }
  }, [
    classOptions,
    selectedClassIds,
    setValue,
  ]);

  const updateValue = (
    field,
    value
  ) => {
    setValue(
      field,
      value,
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <>
      {setupError && (
        <Alert
          severity="warning"
          sx={{
            mb: 1.4,
            borderRadius: "12px",
            fontSize: "10px",
          }}
        >
          {setupError}
        </Alert>
      )}

      <Grid
        container
        spacing={{
          xs: 1.5,
          md: 2,
        }}
        alignItems="flex-start"
      >
        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Select
            key={`year-${academicYearId}-${academicYears.length}`}
            register={register}
            registerName="academicYearId"
            data={academicYears}
            name="name"
            error={localizeFieldError(
              errors
                .academicYearId
                ?.message
            )}
            label="السنة الدراسية"
            required
            disabled={loadingYears}
            defaultValue={
              academicYearId
            }
            onChange={(value) => {
              const nextValue =
                normalizeId(value);

              updateValue(
                "academicYearId",
                nextValue
              );
              updateValue(
                "termId",
                ""
              );
              updateValue(
                "gradeLevelId",
                ""
              );
              updateValue(
                "subjectId",
                ""
              );
              updateValue(
                "classIds",
                []
              );
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Select
            key={`term-${academicYearId}-${termId}-${terms.length}`}
            register={register}
            registerName="termId"
            data={terms}
            name="name"
            error={localizeFieldError(
              errors.termId
                ?.message
            )}
            label="الترم"
            required
            disabled={
              loadingTerms ||
              !academicYearId ||
              terms.length === 0
            }
            defaultValue={termId}
            onChange={(value) => {
              const nextValue =
                normalizeId(value);

              updateValue(
                "termId",
                nextValue
              );
              updateValue(
                "subjectId",
                ""
              );
              updateValue(
                "classIds",
                []
              );
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Select
            key={`grade-${academicYearId}-${gradeLevelId}-${gradeLevels.length}`}
            register={register}
            registerName="gradeLevelId"
            data={gradeLevels}
            name="name"
            error={localizeFieldError(
              errors
                .gradeLevelId
                ?.message
            )}
            label="الصف الدراسي"
            required
            disabled={
              loadingGradeLevels ||
              !academicYearId ||
              gradeLevels.length === 0
            }
            defaultValue={
              gradeLevelId
            }
            onChange={(value) => {
              const nextValue =
                normalizeId(value);

              updateValue(
                "gradeLevelId",
                nextValue
              );
              updateValue(
                "subjectId",
                ""
              );
              updateValue(
                "classIds",
                []
              );
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Select
            key={`subject-${termId}-${gradeLevelId}-${subjectId}-${subjectOptions.length}`}
            register={register}
            registerName="subjectId"
            data={subjectOptions}
            name="name"
            error={localizeFieldError(
              errors.subjectId
                ?.message
            )}
            label="المادة"
            required
            disabled={
              loadingOfferings ||
              loadingCatalogSubjects ||
              !termId ||
              !gradeLevelId ||
              subjectOptions.length === 0
            }
            defaultValue={
              subjectId
            }
            onChange={(value) => {
              const nextValue =
                normalizeId(value);

              updateValue(
                "subjectId",
                nextValue
              );
              updateValue(
                "classIds",
                []
              );
            }}
          />

          <Typography
            sx={{
              mt: 0.55,
              px: 0.35,
              minHeight: 16,
              color:
                usingCatalogFallback
                  ? "#a06a13"
                  : "var(--color-muted)",
              fontSize: "9.5px",
              fontWeight:
                usingCatalogFallback
                  ? 700
                  : 500,
            }}
          >
            {loadingOfferings ||
            loadingCatalogSubjects
              ? "جاري تحميل المواد..."
              : !termId
              ? "اختر الترم أولًا"
              : !gradeLevelId
              ? "اختر الصف الدراسي أولًا"
              : subjectOptions.length ===
                0
              ? "لا توجد مواد متاحة حاليًا"
              : usingCatalogFallback
              ? "لا توجد عروض مواد لهذا الصف والترم؛ تم عرض مواد المدرسة المتاحة."
              : `${subjectOptions.length} مادة مفعّلة لهذا الصف والترم`}
          </Typography>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Select
            register={register}
            registerName="examType"
            data={MCQExams}
            name="value"
            error={localizeFieldError(
              errors.examType
                ?.message
            )}
            label="نوع الاختبار"
            required
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Input
            register={register}
            registerName="startDate"
            error={localizeFieldError(
              errors.startDate
                ?.message
            )}
            label="تاريخ البدء"
            required
            type="date"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Input
            register={register}
            registerName="endDate"
            error={localizeFieldError(
              errors.endDate
                ?.message
            )}
            label="تاريخ الانتهاء"
            required
            type="date"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
        >
          <Input
            register={register}
            registerName="duration"
            error={localizeFieldError(
              errors.duration
                ?.message
            )}
            label="المدة بالدقائق"
            required
            valueAsNumber
            type="number"
            inputProps={{
              min: 1,
              step: 1,
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={12}
          lg={12}
          sx={{
            "& .MuiFormHelperText-root": {
              mx: 0.35,
              mt: 0.55,
              fontSize: "9.5px",
            },
          }}
        >
          <TextField
            select
            fullWidth
            label="الفصول"
            value={
              selectedClassIds
            }
            onChange={(event) => {
              const value =
                event.target.value;

              updateValue(
                "classIds",
                typeof value ===
                  "string"
                  ? value.split(",")
                  : value
              );
            }}
            disabled={
              loadingClasses ||
              !academicYearId ||
              !gradeLevelId ||
              !subjectId ||
              classOptions.length === 0
            }
            error={
              Boolean(
                errors.classIds
              )
            }
            helperText={
              errors.classIds
                ?.message ||
              (!academicYearId
                ? "اختر السنة الدراسية أولًا"
                : !gradeLevelId
                ? "اختر الصف الدراسي أولًا"
                : !subjectId
                ? "اختر المادة أولًا"
                : classOptions.length ===
                  0
                ? "لا توجد فصول متاحة لهذا الصف في السنة المختارة"
                : `${classOptions.length} فصل متاح`)
            }
            SelectProps={{
              multiple: true,
              renderValue: (
                selected
              ) =>
                classOptions
                  .filter(
                    (item) =>
                      selected.includes(
                        item.id
                      )
                  )
                  .map(
                    (item) =>
                      item.name
                  )
                  .join("، "),
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 320,
                    borderRadius:
                      "12px",
                    direction: "rtl",
                    mt: 0.5,
                  },
                },
              },
            }}
          >
            {classOptions.map(
              (item) => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                >
                  <Checkbox
                    size="small"
                    checked={
                      selectedClassIds.includes(
                        item.id
                      )
                    }
                  />
                  <ListItemText
                    primary={
                      item.name
                    }
                  />
                </MenuItem>
              )
            )}
          </TextField>
        </Grid>
      </Grid>
    </>
  );
};

export default Add;
