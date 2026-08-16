import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  FactCheckRounded,
  MenuBookRounded,
  QuizRounded,
  RadioButtonCheckedRounded,
  SaveRounded,
  SchoolRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { api } from "@/APIs/Axios";
import { addExam } from "@/APIs/school/exams";

import nasaqLogo from "../../images/wadq-logo.png";

const EXAM_TYPES = [
  { value: "quiz", label: "اختبار قصير" },
  { value: "assignment", label: "واجب" },
  { value: "activity", label: "نشاط" },
  { value: "final", label: "اختبار نهائي" },
];

const createQuestion = (source = {}) => ({
  localId:
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()}`,
  question: source.question || "",
  options: Array.isArray(source.options)
    ? [...source.options.slice(0, 4), "", "", "", ""].slice(0, 4)
    : ["", "", "", ""],
  correctAnswer: source.correctAnswer || "",
});

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const unwrapResponse = (response) => {
  let payload = response?.data ?? response;

  for (let index = 0; index < 5; index += 1) {
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload.data !== undefined
    ) {
      payload = payload.data;
      continue;
    }

    break;
  }

  return payload;
};

const extractCollection = (response, keys = []) => {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.docs,
    payload.items,
    payload.results,
    payload.records,
    payload.assignments,
    payload.teacherAssignments,
    payload.subjects,
    payload.classes,
    payload.data,
    ...keys.map((key) => payload?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const extractEntity = (response) => {
  const payload = unwrapResponse(response);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload.teacher || payload.profile || payload;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getSubjectEntity = (offering) =>
  offering?.subjectId ||
  offering?.subject ||
  offering?.subjectEntity ||
  {};

const getOfferingLabel = (offering, index) => {
  const subject = getSubjectEntity(offering);
  const subjectName =
    subject?.subjectName ||
    subject?.name ||
    offering?.subjectName ||
    `مادة ${index + 1}`;
  const subjectCode =
    subject?.subjectCode ||
    subject?.code ||
    offering?.subjectCode ||
    "";
  const grade =
    offering?.gradeLevelId?.name ||
    offering?.gradeLevel?.name ||
    offering?.gradeName ||
    "";
  const term =
    offering?.termId?.name ||
    offering?.term?.name ||
    "";

  return [
    [subjectName, subjectCode].filter(Boolean).join(" - "),
    grade,
    term,
  ]
    .filter(Boolean)
    .join(" • ");
};

const getClassLabel = (classEntity, index) => {
  const name =
    classEntity?.name ||
    classEntity?.className ||
    classEntity?.roomNumber ||
    `فصل ${index + 1}`;
  const grade =
    classEntity?.gradeLevelId?.name ||
    classEntity?.gradeLevel?.name ||
    classEntity?.academicYear ||
    "";

  return [name, grade].filter(Boolean).join(" — ");
};

const getClassOfferingIds = (classEntity) => {
  const sources = [
    classEntity?.subjectOfferingId,
    classEntity?.subjectOffering,
    classEntity?.subjectOfferingIds,
    classEntity?.subjectOfferings,
    classEntity?.offerings,
  ];

  const subjectSources = Array.isArray(classEntity?.subjects)
    ? classEntity.subjects.flatMap((subject) => [
        subject?.subjectOfferingId,
        subject?.subjectOffering,
        subject?.offeringId,
        subject?.offering,
      ])
    : [];

  return [...sources, ...subjectSources]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalizeId)
    .filter(Boolean);
};

const getOfferingGradeId = (offering) =>
  normalizeId(
    offering?.gradeLevelId ||
      offering?.gradeLevel ||
      offering?.classLevelId
  );

const getClassGradeId = (classEntity) =>
  normalizeId(
    classEntity?.gradeLevelId ||
      classEntity?.gradeLevel ||
      classEntity?.classLevelId
  );

const collectOfferingCandidates = (items) => {
  const candidates = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const direct = [
      item.subjectOfferingId,
      item.subjectOffering,
      item.offeringId,
      item.offering,
    ];

    direct.forEach((candidate) => {
      if (candidate) candidates.push(candidate);
    });

    [item.subjectOfferings, item.offerings, item.subjects].forEach((list) => {
      if (!Array.isArray(list)) return;

      list.forEach((entry) => {
        const nested =
          entry?.subjectOfferingId ||
          entry?.subjectOffering ||
          entry?.offeringId ||
          entry?.offering;

        if (nested) candidates.push(nested);
      });
    });
  });

  return candidates;
};

const SectionTitle = ({ icon, title, description, endContent }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    justifyContent="space-between"
    gap={1}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "var(--color-gold-dark, #B78430)",
          backgroundColor: "var(--color-gold-soft, #FBF0D8)",
          borderRadius: "12px",
          "& svg": { fontSize: 21 },
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          sx={{
            color: "var(--color-navy-deep, #122F4D)",
            fontSize: "14px",
            fontWeight: 900,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.15,
            color: "var(--color-muted, #708198)",
            fontSize: "9.5px",
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>

    {endContent}
  </Stack>
);

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 46,
    borderRadius: "12px",
    backgroundColor: "#fff",
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
  },
  "& .MuiInputBase-input": {
    fontSize: "12px",
  },
};

const TeacherExamAdd = () => {
  const navigate = useNavigate();

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [offerings, setOfferings] = useState([]);
  const [classes, setClasses] = useState([]);

  const [subjectOfferingId, setSubjectOfferingId] = useState("");
  const [classIds, setClassIds] = useState([]);
  const [examType, setExamType] = useState("quiz");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([createQuestion()]);
  const [validationErrors, setValidationErrors] = useState({});

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError("");

    try {
      const [profileResult, classesResult, subjectsResult] =
        await Promise.allSettled([
          api.get("/teachers/me"),
          api.get("/classes/teacher/me"),
          api.get("/subjects/teacher/me"),
        ]);

      const profile =
        profileResult.status === "fulfilled"
          ? extractEntity(profileResult.value)
          : null;
      const teacherId = normalizeId(profile);

      const myClasses =
        classesResult.status === "fulfilled"
          ? extractCollection(classesResult.value, ["myClasses"])
          : [];
      const mySubjects =
        subjectsResult.status === "fulfilled"
          ? extractCollection(subjectsResult.value, ["teacherSubjects"])
          : [];

      let assignments = [];

      try {
        const assignmentResponse = await api.get("/teacher-assignments", {
          params: {
            ...(teacherId ? { teacherId } : {}),
            page: 1,
            limit: 500,
          },
        });

        assignments = extractCollection(assignmentResponse, [
          "assignments",
          "teacherAssignments",
        ]);

        if (teacherId) {
          assignments = assignments.filter((assignment) => {
            const assignedTeacherId = normalizeId(
              assignment?.teacherId || assignment?.teacher
            );

            return !assignedTeacherId || assignedTeacherId === teacherId;
          });
        }
      } catch {
        assignments = [];
      }

      const rawCandidates = collectOfferingCandidates([
        ...assignments,
        ...myClasses,
        ...mySubjects,
      ]);

      const hydrated = [];
      const pendingIds = [];

      rawCandidates.forEach((candidate) => {
        if (candidate && typeof candidate === "object") {
          const id = normalizeId(candidate);
          if (id) hydrated.push(candidate);
          return;
        }

        const id = normalizeId(candidate);
        if (id) pendingIds.push(id);
      });

      const uniquePendingIds = [...new Set(pendingIds)].filter(
        (id) => !hydrated.some((item) => normalizeId(item) === id)
      );

      if (uniquePendingIds.length) {
        const responses = await Promise.allSettled(
          uniquePendingIds.map((id) => api.get(`/subject-offerings/${id}`))
        );

        responses.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const entity = extractEntity(result.value);
          if (entity && normalizeId(entity)) hydrated.push(entity);
        });
      }

      const uniqueOfferings = Array.from(
        new Map(
          hydrated
            .map((item) => [normalizeId(item), item])
            .filter(([id]) => Boolean(id))
        ).values()
      );

      setClasses(myClasses);
      setOfferings(uniqueOfferings);

      if (!uniqueOfferings.length) {
        setOptionsError(
          "لا توجد مادة دراسية مرتبطة بحسابك كـ Subject Offering. راجع تعيينات المعلم من الإدارة."
        );
      }
    } catch (error) {
      setClasses([]);
      setOfferings([]);
      setOptionsError(
        getErrorMessage(error, "تعذر تحميل مواد وفصول المعلم")
      );
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedOffering = useMemo(
    () =>
      offerings.find(
        (offering) => normalizeId(offering) === subjectOfferingId
      ) || null,
    [offerings, subjectOfferingId]
  );

  const availableClasses = useMemo(() => {
    if (!subjectOfferingId) return classes;

    const offeringGradeId = getOfferingGradeId(selectedOffering);

    const matched = classes.filter((classEntity) => {
      const linkedOfferingIds = getClassOfferingIds(classEntity);
      if (linkedOfferingIds.length) {
        return linkedOfferingIds.includes(subjectOfferingId);
      }

      const classGradeId = getClassGradeId(classEntity);
      if (offeringGradeId && classGradeId) {
        return offeringGradeId === classGradeId;
      }

      return true;
    });

    return matched.length ? matched : classes;
  }, [classes, selectedOffering, subjectOfferingId]);

  useEffect(() => {
    const allowedIds = new Set(availableClasses.map(normalizeId));
    setClassIds((previous) => previous.filter((id) => allowedIds.has(id)));
  }, [availableClasses]);

  const updateQuestion = (questionIndex, patch) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex ? { ...question, ...patch } : question
      )
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex) return question;

        const oldValue = question.options[optionIndex];
        const nextOptions = question.options.map((option, currentIndex) =>
          currentIndex === optionIndex ? value : option
        );

        return {
          ...question,
          options: nextOptions,
          correctAnswer:
            question.correctAnswer === oldValue
              ? value
              : question.correctAnswer,
        };
      })
    );
  };

  const addQuestionCard = () => {
    setQuestions((previous) => [...previous, createQuestion()]);
  };

  const duplicateQuestion = (questionIndex) => {
    setQuestions((previous) => {
      const source = previous[questionIndex];
      const copy = createQuestion(source);
      const next = [...previous];
      next.splice(questionIndex + 1, 0, copy);
      return next;
    });
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) {
      toast.info("يجب أن يحتوي الاختبار على سؤال واحد على الأقل");
      return;
    }

    setQuestions((previous) =>
      previous.filter((_, index) => index !== questionIndex)
    );
  };

  const toggleClass = (classId) => {
    setClassIds((previous) =>
      previous.includes(classId)
        ? previous.filter((id) => id !== classId)
        : [...previous, classId]
    );
  };

  const validate = () => {
    const errors = {};

    if (!subjectOfferingId) {
      errors.subjectOfferingId = "اختر المادة الدراسية";
    }

    if (!classIds.length) {
      errors.classIds = "اختر فصلًا واحدًا على الأقل";
    }

    if (!examType) {
      errors.examType = "اختر نوع الاختبار";
    }

    if (!startDate) errors.startDate = "حدد تاريخ البداية";
    if (!endDate) errors.endDate = "حدد تاريخ النهاية";

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = "تاريخ النهاية يجب ألا يسبق تاريخ البداية";
    }

    const numericDuration = Number(duration);
    if (!Number.isFinite(numericDuration) || numericDuration < 1) {
      errors.duration = "مدة الاختبار يجب أن تكون دقيقة واحدة على الأقل";
    }

    const questionErrors = questions.map((question) => {
      const item = {};
      const cleanOptions = question.options.map((option) => option.trim());

      if (!question.question.trim()) {
        item.question = "اكتب نص السؤال";
      }

      if (cleanOptions.some((option) => !option)) {
        item.options = "أكمل الاختيارات الأربعة";
      } else if (new Set(cleanOptions).size !== cleanOptions.length) {
        item.options = "لا يمكن تكرار نفس الاختيار";
      }

      if (!question.correctAnswer.trim()) {
        item.correctAnswer = "حدد الإجابة الصحيحة";
      } else if (!cleanOptions.includes(question.correctAnswer.trim())) {
        item.correctAnswer = "الإجابة الصحيحة يجب أن تكون أحد الاختيارات";
      }

      return item;
    });

    if (questionErrors.some((item) => Object.keys(item).length)) {
      errors.questions = questionErrors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("راجع البيانات المطلوبة قبل الحفظ");
      return;
    }

    const payload = {
      subjectOfferingId,
      classIds,
      examType,
      startDate,
      endDate,
      duration: Number(duration),
      questions: questions.map((question) => ({
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.correctAnswer.trim(),
      })),
    };

    setSaving(true);

    try {
      const response = await addExam(payload);

      if (isFailedResponse(response)) {
        toast.error(
          typeof response === "string"
            ? response
            : response?.message || "تعذر إنشاء الاختبار"
        );
        return;
      }

      toast.success("تم إنشاء الاختبار بنجاح");
      navigate("/teacher/exams", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "حدث خطأ أثناء إنشاء الاختبار"));
    } finally {
      setSaving(false);
    }
  };

  const completedQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.question.trim() &&
          question.options.every((option) => option.trim()) &&
          question.correctAnswer.trim()
      ).length,
    [questions]
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      dir="rtl"
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        color: "var(--color-navy-deep, #122F4D)",
        py: { xs: 1.5, md: 2.2 },
      }}
    >
      <Box
        sx={{
          width: "min(1480px, calc(100% - 24px))",
          mx: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 1.7, md: 2.4 },
            borderRadius: "24px",
            color: "white",
            background:
              "linear-gradient(120deg, #173B5E 0%, #244F78 55%, #2C5C87 100%)",
            boxShadow: "0 18px 45px rgba(18,47,77,.18)",
            "&::after": {
              content: '\"\"',
              position: "absolute",
              width: 260,
              height: 260,
              left: -80,
              top: -120,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.5}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <Box
                sx={{
                  width: { xs: 52, md: 56 },
                  height: { xs: 52, md: 56 },
                  p: 0.8,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: "14px",
                  boxShadow: "0 8px 20px rgba(0,0,0,.12)",
                }}
              >
                <Box
                  component="img"
                  src={nasaqLogo}
                  alt="نسق"
                  sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>

              <Box>
                <Chip
                  icon={<QuizRounded />}
                  label="بوابة المعلم"
                  size="small"
                  sx={{
                    mb: 0.65,
                    height: 25,
                    color: "#F2D792",
                    backgroundColor: "rgba(242,215,146,.12)",
                    border: "1px solid rgba(242,215,146,.22)",
                    fontSize: "9px",
                    fontWeight: 800,
                    "& .MuiChip-icon": { color: "inherit", fontSize: 15 },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "21px", md: "28px" },
                    fontWeight: 900,
                    lineHeight: 1.18,
                  }}
                >
                  إنشاء اختبار جديد
                </Typography>
                <Typography
                  sx={{
                    mt: 0.3,
                    color: "rgba(255,255,255,.72)",
                    fontSize: { xs: "9.5px", md: "10.5px" },
                  }}
                >
                  حدد المادة والفصول ثم أضف الأسئلة والإجابات الصحيحة.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} gap={0.8}>
              <Button
                type="button"
                onClick={() => navigate("/teacher/exams")}
                variant="outlined"
                startIcon={<ArrowBackRounded />}
                sx={{
                  minHeight: 42,
                  px: 1.7,
                  borderColor: "rgba(255,255,255,.28)",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,.5)",
                    backgroundColor: "rgba(255,255,255,.08)",
                  },
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                اختباراتي
              </Button>

              <Button
                type="submit"
                disabled={saving || loadingOptions || !offerings.length}
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveRounded />
                  )
                }
                sx={{
                  minHeight: 42,
                  px: 2.1,
                  borderRadius: "12px",
                  color: "var(--color-navy-deep, #122F4D)",
                  backgroundColor: "#F2D792",
                  boxShadow: "none",
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#E8C96F", boxShadow: "none" },
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                {saving ? "جارٍ إنشاء الاختبار" : "حفظ الاختبار"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {optionsError && (
          <Alert
            severity="warning"
            action={
              <Button type="button" size="small" onClick={loadOptions}>
                إعادة المحاولة
              </Button>
            }
            sx={{ mt: 1.4, borderRadius: "14px" }}
          >
            {optionsError}
          </Alert>
        )}

        <Box
          sx={{
            mt: 1.4,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(0, 1.65fr)" },
            gap: 1.3,
            alignItems: "start",
          }}
        >
          <Stack spacing={1.3} sx={{ position: { lg: "sticky" }, top: 16 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 1.8 },
                border: "1px solid rgba(36,74,112,.09)",
                borderRadius: "18px",
                boxShadow: "0 12px 28px rgba(18,47,77,.05)",
              }}
            >
              <SectionTitle
                icon={<FactCheckRounded />}
                title="بيانات الاختبار"
                description="البيانات الأساسية وموعد إتاحة الاختبار."
              />

              <Divider sx={{ my: 1.5, borderColor: "rgba(36,74,112,.07)" }} />

              {loadingOptions ? (
                <Box sx={{ minHeight: 210, display: "grid", placeItems: "center" }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={26} sx={{ color: "#B78430" }} />
                    <Typography sx={{ color: "#708198", fontSize: "10px" }}>
                      جارٍ تحميل المواد والفصول...
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Stack spacing={1.2}>
                  <TextField
                    select
                    label="المادة الدراسية"
                    value={subjectOfferingId}
                    onChange={(event) => {
                      setSubjectOfferingId(event.target.value);
                      setValidationErrors((previous) => ({
                        ...previous,
                        subjectOfferingId: undefined,
                      }));
                    }}
                    error={Boolean(validationErrors.subjectOfferingId)}
                    helperText={validationErrors.subjectOfferingId}
                    sx={fieldSx}
                  >
                    <MenuItem value="" disabled>
                      اختر المادة
                    </MenuItem>
                    {offerings.map((offering, index) => (
                      <MenuItem key={normalizeId(offering)} value={normalizeId(offering)}>
                        {getOfferingLabel(offering, index)}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="نوع الاختبار"
                    value={examType}
                    onChange={(event) => setExamType(event.target.value)}
                    error={Boolean(validationErrors.examType)}
                    helperText={validationErrors.examType}
                    sx={fieldSx}
                  >
                    {EXAM_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 1,
                    }}
                  >
                    <TextField
                      type="date"
                      label="تاريخ البداية"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      error={Boolean(validationErrors.startDate)}
                      helperText={validationErrors.startDate}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />

                    <TextField
                      type="date"
                      label="تاريخ النهاية"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      error={Boolean(validationErrors.endDate)}
                      helperText={validationErrors.endDate}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Box>

                  <TextField
                    type="number"
                    label="مدة الاختبار بالدقائق"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    error={Boolean(validationErrors.duration)}
                    helperText={validationErrors.duration}
                    inputProps={{ min: 1, step: 1 }}
                    sx={fieldSx}
                  />
                </Stack>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 1.8 },
                border: "1px solid rgba(36,74,112,.09)",
                borderRadius: "18px",
                boxShadow: "0 12px 28px rgba(18,47,77,.05)",
              }}
            >
              <SectionTitle
                icon={<SchoolRounded />}
                title="الفصول المستهدفة"
                description="حدد الفصول التي سيظهر لها الاختبار."
                endContent={
                  <Chip
                    label={`${classIds.length} محدد`}
                    size="small"
                    sx={{ fontSize: "9px", fontWeight: 800 }}
                  />
                }
              />

              <Divider sx={{ my: 1.4, borderColor: "rgba(36,74,112,.07)" }} />

              {!subjectOfferingId ? (
                <Typography
                  sx={{ py: 2, color: "#708198", fontSize: "10px", textAlign: "center" }}
                >
                  اختر المادة أولًا لعرض الفصول المتاحة.
                </Typography>
              ) : !availableClasses.length ? (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  لا توجد فصول مرتبطة بهذه المادة.
                </Alert>
              ) : (
                <FormControl error={Boolean(validationErrors.classIds)} fullWidth>
                  <Stack spacing={0.7}>
                    {availableClasses.map((classEntity, index) => {
                      const classId = normalizeId(classEntity);
                      const checked = classIds.includes(classId);

                      return (
                        <Paper
                          key={classId || index}
                          elevation={0}
                          onClick={() => toggleClass(classId)}
                          sx={{
                            px: 1.1,
                            py: 0.65,
                            cursor: "pointer",
                            border: checked
                              ? "1px solid rgba(183,132,48,.4)"
                              : "1px solid rgba(36,74,112,.08)",
                            borderRadius: "12px",
                            backgroundColor: checked ? "#FBF0D8" : "#fff",
                          }}
                        >
                          <FormControlLabel
                            onClick={(event) => event.stopPropagation()}
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={() => toggleClass(classId)}
                                sx={{
                                  color: "#B78430",
                                  "&.Mui-checked": { color: "#B78430" },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography sx={{ fontSize: "11px", fontWeight: 800 }}>
                                  {getClassLabel(classEntity, index)}
                                </Typography>
                                <Typography sx={{ color: "#708198", fontSize: "9px" }}>
                                  {classEntity?.studentsCount ??
                                    classEntity?.studentCount ??
                                    classEntity?.students?.length ??
                                    0}{" "}
                                  طالب
                                </Typography>
                              </Box>
                            }
                            sx={{ m: 0, width: "100%" }}
                          />
                        </Paper>
                      );
                    })}
                  </Stack>
                  {validationErrors.classIds && (
                    <FormHelperText>{validationErrors.classIds}</FormHelperText>
                  )}
                </FormControl>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                color: "white",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #173B5E, #2C5C87)",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ color: "#F2D792", fontSize: "10px", fontWeight: 900 }}>
                    ملخص الاختبار
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontSize: "23px", fontWeight: 900 }}>
                    {completedQuestions} / {questions.length}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,.68)", fontSize: "9px" }}>
                    أسئلة مكتملة من إجمالي الأسئلة
                  </Typography>
                </Box>
                <CheckCircleRounded sx={{ color: "#F2D792", fontSize: 36 }} />
              </Stack>
            </Paper>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 1.8 },
              border: "1px solid rgba(36,74,112,.09)",
              borderRadius: "18px",
              boxShadow: "0 12px 28px rgba(18,47,77,.05)",
            }}
          >
            <SectionTitle
              icon={<MenuBookRounded />}
              title="أسئلة الاختبار"
              description="أضف السؤال والاختيارات وحدد الإجابة الصحيحة."
              endContent={
                <Button
                  type="button"
                  onClick={addQuestionCard}
                  variant="outlined"
                  startIcon={<AddRounded />}
                  sx={{
                    minHeight: 38,
                    borderRadius: "10px",
                    color: "#244A70",
                    borderColor: "rgba(36,74,112,.25)",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": { marginLeft: "5px", marginRight: 0 },
                  }}
                >
                  إضافة سؤال
                </Button>
              }
            />

            <Divider sx={{ my: 1.5, borderColor: "rgba(36,74,112,.07)" }} />

            {validationErrors.questions && (
              <Alert severity="error" sx={{ mb: 1.2, borderRadius: "12px" }}>
                بعض الأسئلة غير مكتملة. راجع نص السؤال والاختيارات والإجابة الصحيحة.
              </Alert>
            )}

            <Stack spacing={1.2}>
              {questions.map((question, questionIndex) => {
                const questionError = validationErrors.questions?.[questionIndex] || {};

                return (
                  <Paper
                    key={question.localId}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      border: Object.keys(questionError).length
                        ? "1px solid rgba(211,47,47,.32)"
                        : "1px solid rgba(36,74,112,.09)",
                      borderRadius: "16px",
                    }}
                  >
                    <Box
                      sx={{
                        height: 4,
                        backgroundColor: Object.keys(questionError).length
                          ? "#D32F2F"
                          : "#244A70",
                      }}
                    />

                    <Box sx={{ p: { xs: 1.2, md: 1.5 } }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              backgroundColor: "#244A70",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 900,
                            }}
                          >
                            {questionIndex + 1}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 900 }}>
                              السؤال {questionIndex + 1}
                            </Typography>
                            <Typography sx={{ color: "#708198", fontSize: "9px" }}>
                              اختر الإجابة الصحيحة من الدائرة بجوار الاختيار.
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={0.3}>
                          <Tooltip title="نسخ السؤال">
                            <IconButton
                              type="button"
                              onClick={() => duplicateQuestion(questionIndex)}
                              size="small"
                              sx={{ color: "#244A70" }}
                            >
                              <ContentCopyRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف السؤال">
                            <IconButton
                              type="button"
                              onClick={() => removeQuestion(questionIndex)}
                              size="small"
                              sx={{ color: "#C94848" }}
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        label="نص السؤال"
                        value={question.question}
                        onChange={(event) =>
                          updateQuestion(questionIndex, { question: event.target.value })
                        }
                        error={Boolean(questionError.question)}
                        helperText={questionError.question}
                        sx={{ ...fieldSx, mt: 1.2 }}
                      />

                      <Box
                        sx={{
                          mt: 1.1,
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                          gap: 0.9,
                        }}
                      >
                        {question.options.map((option, optionIndex) => {
                          const checked =
                            Boolean(option.trim()) &&
                            question.correctAnswer === option;

                          return (
                            <Stack
                              key={`${question.localId}-option-${optionIndex}`}
                              direction="row"
                              alignItems="center"
                              spacing={0.2}
                            >
                              <Radio
                                checked={checked}
                                disabled={!option.trim()}
                                onChange={() =>
                                  updateQuestion(questionIndex, {
                                    correctAnswer: option,
                                  })
                                }
                                sx={{
                                  color: "#B78430",
                                  "&.Mui-checked": { color: "#B78430" },
                                }}
                              />
                              <TextField
                                fullWidth
                                label={`الاختيار ${optionIndex + 1}`}
                                value={option}
                                onChange={(event) =>
                                  updateOption(questionIndex, optionIndex, event.target.value)
                                }
                                sx={fieldSx}
                              />
                            </Stack>
                          );
                        })}
                      </Box>

                      {(questionError.options || questionError.correctAnswer) && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.8 }}>
                          <WarningAmberRounded sx={{ color: "#D32F2F", fontSize: 16 }} />
                          <Typography sx={{ color: "#D32F2F", fontSize: "9.5px" }}>
                            {questionError.options || questionError.correctAnswer}
                          </Typography>
                        </Stack>
                      )}

                      {question.correctAnswer && !questionError.correctAnswer && (
                        <Chip
                          icon={<RadioButtonCheckedRounded />}
                          label={`الإجابة الصحيحة: ${question.correctAnswer}`}
                          size="small"
                          sx={{
                            mt: 1,
                            color: "#237449",
                            backgroundColor: "rgba(116,201,154,.14)",
                            fontSize: "9px",
                            fontWeight: 800,
                            "& .MuiChip-icon": { color: "inherit", fontSize: 15 },
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Stack>

            <Button
              type="button"
              onClick={addQuestionCard}
              fullWidth
              variant="outlined"
              startIcon={<AddRounded />}
              sx={{
                mt: 1.3,
                minHeight: 46,
                borderStyle: "dashed",
                borderRadius: "12px",
                color: "#B78430",
                borderColor: "rgba(183,132,48,.38)",
                backgroundColor: "rgba(251,240,216,.28)",
                fontSize: "10px",
                fontWeight: 900,
                textTransform: "none",
                "& .MuiButton-startIcon": { marginLeft: "5px", marginRight: 0 },
              }}
            >
              إضافة سؤال آخر
            </Button>
          </Paper>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.3,
            p: 1.2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1,
            border: "1px solid rgba(36,74,112,.09)",
            borderRadius: "16px",
            boxShadow: "0 10px 24px rgba(18,47,77,.04)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <CalendarMonthRounded sx={{ color: "#B78430" }} />
            <Box>
              <Typography sx={{ fontSize: "11px", fontWeight: 900 }}>
                راجع بيانات الاختبار قبل الحفظ
              </Typography>
              <Typography sx={{ color: "#708198", fontSize: "9px" }}>
                سيظهر الاختبار للفصول المحددة وفق تاريخ البداية والنهاية.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} gap={0.7}>
            <Button
              type="button"
              onClick={() => navigate("/teacher/exams")}
              variant="text"
              sx={{ color: "#708198", fontSize: "10px", fontWeight: 800 }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingOptions || !offerings.length}
              variant="contained"
              startIcon={
                saving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />
              }
              sx={{
                minHeight: 42,
                px: 2.3,
                color: "#122F4D",
                backgroundColor: "#F2D792",
                borderRadius: "11px",
                boxShadow: "none",
                fontSize: "10px",
                fontWeight: 900,
                textTransform: "none",
                "&:hover": { backgroundColor: "#E8C96F", boxShadow: "none" },
                "& .MuiButton-startIcon": { marginLeft: "5px", marginRight: 0 },
              }}
            >
              {saving ? "جارٍ الحفظ" : "إنشاء الاختبار"}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default TeacherExamAdd;
