import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  ArrowBackRounded,
  AssignmentTurnedInRounded,
  CheckCircleRounded,
  FactCheckRounded,
  GradingRounded,
  HelpOutlineRounded,
  PendingActionsRounded,
  PersonRounded,
  QuizRounded,
  RefreshRounded,
  SaveRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import {
  fetchExamResults,
  fetchExams,
  fetchSingleExam,
  gradeExamStudent,
} from "@/APIs/school/exams";

import { TEACHER_UI } from "@/shared/ui/teacherUi";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const COLORS = {
  navy: "#1A466D",
  navyLight: "#2D648F",
  navyDeep: "#122F4D",
  gold: "#D3A44F",
  goldSoft: "#FBF0D8",
  green: "#1F8A5B",
  greenSoft: "#E7F6EF",
  red: "#CC4B4B",
  redSoft: "#FDECEC",
  muted: "#7A8CA3",
  border: "rgba(36,74,112,.12)",
  surface: "#FFFFFF",
  soft: "#F7F9FC",
};

const STATUS_OPTIONS = [
  { value: "all", label: "كل النتائج" },
  { value: "pending", label: "تحتاج مراجعة" },
  { value: "graded", label: "تم التصحيح" },
];

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const unwrapResponse = (response) => {
  let payload = response;

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
    ...keys.map((key) => payload?.[key]),
    payload.docs,
    payload.items,
    payload.results,
    payload.records,
    payload.exams,
    payload.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getErrorMessage = (response, fallback) => {
  if (typeof response === "string") return response;

  return (
    response?.message ||
    response?.data?.message ||
    response?.error ||
    fallback
  );
};

const getExamId = (exam) => normalizeId(exam);

const getExamTitle = (exam) =>
  String(
    exam?.title ||
      exam?.name ||
      exam?.examName ||
      "اختبار بدون عنوان"
  ).trim();

const getSubjectOffering = (exam) =>
  exam?.subjectOfferingId ||
  exam?.subjectOffering ||
  exam?.offering ||
  {};

const getSubjectEntity = (exam) => {
  const offering = getSubjectOffering(exam);

  return (
    offering?.subjectId ||
    offering?.subject ||
    exam?.subjectId ||
    exam?.subject ||
    {}
  );
};

const getSubjectLabel = (exam) => {
  const subject = getSubjectEntity(exam);

  const name =
    subject?.subjectName ||
    subject?.name ||
    exam?.subjectName ||
    "المادة غير محددة";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    exam?.subjectCode ||
    "";

  return [name, code].filter(Boolean).join(" - ");
};

const getClassEntities = (exam) => {
  const value =
    exam?.classes ||
    exam?.classIds ||
    exam?.classrooms ||
    [];

  return Array.isArray(value) ? value : [];
};

const getClassLabel = (entity, index) => {
  if (entity && typeof entity === "object") {
    return (
      entity?.name ||
      entity?.className ||
      entity?.roomNumber ||
      `فصل ${index + 1}`
    );
  }

  return `فصل ${index + 1}`;
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value, withTime = false) => {
  const date = parseDate(value);
  if (!date) return "غير محدد";

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
};

const getQuestions = (exam) =>
  Array.isArray(exam?.questions) ? exam.questions : [];

const getQuestionId = (question) => normalizeId(question);

const getQuestionText = (question, index) =>
  String(
    question?.question ||
      question?.text ||
      question?.questionText ||
      `السؤال ${index + 1}`
  ).trim();

const getMaxScore = (exam) => {
  const direct = Number(
    exam?.totalGrade ??
      exam?.maxGrade ??
      exam?.maxScore ??
      exam?.totalScore ??
      exam?.grade
  );

  if (Number.isFinite(direct) && direct > 0) return direct;

  const questions = getQuestions(exam);
  const explicitPoints = questions
    .map((question) =>
      Number(
        question?.points ??
          question?.mark ??
          question?.marks ??
          question?.weight ??
          question?.score
      )
    )
    .filter((value) => Number.isFinite(value) && value > 0);

  const questionPoints = explicitPoints.reduce(
    (sum, value) => sum + value,
    0
  );

  // لا نفترض أن كل سؤال بدرجة واحدة؛ بعض نسخ الباك تحفظ الدرجة
  // كنسبة مئوية ولا ترجع وزنًا لكل سؤال.
  return questionPoints > 0 ? questionPoints : 100;
};

const getStudentEntity = (result) =>
  result?.studentId ||
  result?.student ||
  result?.userId ||
  result?.user ||
  result?.learner ||
  {};

const getStudentId = (result) => {
  const entityId = normalizeId(getStudentEntity(result));

  return (
    entityId ||
    normalizeId(
      result?.studentId ||
        result?.userId ||
        result?.learnerId
    )
  );
};

const getStudentName = (result) => {
  const student = getStudentEntity(result);

  const fullName = String(
    student?.name ||
      student?.fullName ||
      result?.studentName ||
      result?.name ||
      ""
  ).trim();

  if (fullName) return fullName;

  const joined = [
    student?.firstName,
    student?.fatherName,
    student?.familyName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return joined || "طالب بدون اسم";
};

const getStudentEmail = (result) => {
  const student = getStudentEntity(result);

  return String(
    student?.email ||
      result?.schoolEmail ||
      result?.studentEmail ||
      result?.email ||
      ""
  ).trim();
};

const getResultScore = (result) => {
  const rawValue =
    result?.achievedGrade ??
    result?.score ??
    result?.grade ??
    result?.totalScore ??
    result?.result?.score ??
    result?.result?.grade;

  if (
    rawValue === undefined ||
    rawValue === null ||
    String(rawValue).trim() === ""
  ) {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
};

const getSubmittedAt = (result) =>
  result?.submittedAt ||
  result?.completedAt ||
  result?.finishedAt ||
  result?.gradedAt ||
  result?.startedAt ||
  result?.result?.submittedAt ||
  result?.result?.completedAt ||
  null;

const getAttemptStatusLabel = (result) => {
  const dateLabel = formatDate(
    getSubmittedAt(result),
    true
  );

  if (result?.submitted === false) {
    return `بدأ ولم يسلّم • ${dateLabel}`;
  }

  if (result?.submitted === true) {
    return `تم التسليم • ${dateLabel}`;
  }

  return dateLabel;
};

const getAnswers = (result) => {
  const candidates = [
    result?.answers,
    result?.submittedAnswers,
    result?.studentAnswers,
    result?.responses,
    result?.result?.answers,
  ];

  return candidates.find(Array.isArray) || [];
};

const getAnswerQuestionId = (answer) =>
  normalizeId(
    answer?.questionId ||
      answer?.question ||
      answer?.questionRef
  );

const getAnswerValue = (answer) =>
  String(
    answer?.answer ??
      answer?.value ??
      answer?.selectedOption ??
      answer?.response ??
      ""
  );

const looksLikeResult = (item) => {
  if (!item || typeof item !== "object") return false;

  return Boolean(
    getStudentId(item) &&
      (
        getResultScore(item) !== null ||
        getAnswers(item).length ||
        getSubmittedAt(item) ||
        item?.startedAt ||
        item?.attemptId ||
        item?.examAttemptId ||
        item?.isSubmitted ||
        item?.submitted === true ||
        item?.graded === true ||
        item?.attemptStatus ||
        item?.examStatus
      )
  );
};

const extractExamResults = (examDetail) => {
  const payload = unwrapResponse(examDetail);
  if (!payload || typeof payload !== "object") return [];

  const root = payload?.exam || payload;

  const candidates = [
    root?.studentResults,
    root?.examResults,
    root?.submissions,
    root?.attempts,
    root?.results,
    root?.studentGrades,
    root?.grades,
    root?.participants,
    root?.students,
    payload?.studentResults,
    payload?.examResults,
    payload?.submissions,
    payload?.attempts,
    payload?.results,
  ];

  const raw = candidates.find(Array.isArray) || [];
  const unique = new Map();

  raw.filter(looksLikeResult).forEach((item, index) => {
    const studentId = getStudentId(item);
    const attemptId = normalizeId(item);
    const key = `${studentId}-${attemptId || index}`;

    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values());
};

const StatCard = ({ icon, label, value, helper, tone = "navy" }) => {
  const palette = {
    navy: [COLORS.navy, "rgba(36,74,112,.08)"],
    green: [COLORS.green, COLORS.greenSoft],
    gold: ["#B77B13", COLORS.goldSoft],
    red: [COLORS.red, COLORS.redSoft],
  }[tone];

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        display: "grid",
        gridTemplateColumns: "38px minmax(0,1fr)",
        alignItems: "center",
        gap: 1,
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.surface,
      }}
    >
      <Box
        sx={{
          ...TEACHER_UI.statIcon,
          display: "grid",
          placeItems: "center",
          color: palette[0],
          backgroundColor: palette[1],
          "& svg": { fontSize: 20 },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: COLORS.muted,
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.1,
            color: COLORS.navyDeep,
            fontSize: "22px",
            lineHeight: 1.1,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>
        <Typography
          noWrap
          sx={{
            mt: 0.25,
            color: COLORS.muted,
            fontSize: "8px",
          }}
        >
          {helper}
        </Typography>
      </Box>
    </Paper>
  );
};

const TeacherExamGrading = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedExamId = String(
    searchParams.get("examId") || ""
  ).trim();

  const requestedStudentId = String(
    searchParams.get("studentId") || ""
  ).trim();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(requestedExamId);
  const [detailCache, setDetailCache] = useState({});
  const [resultsCache, setResultsCache] = useState({});
  const [overrideMap, setOverrideMap] = useState({});

  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [examSearch, setExamSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [answerTarget, setAnswerTarget] = useState(null);
  const [gradeTarget, setGradeTarget] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    score: "",
  });
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const autoOpenedStudentRef = useRef("");
  const detailCacheRef = useRef({});
  const resultsCacheRef = useRef({});

  useEffect(() => {
    detailCacheRef.current = detailCache;
  }, [detailCache]);

  useEffect(() => {
    resultsCacheRef.current = resultsCache;
  }, [resultsCache]);

  const loadExams = useCallback(async ({ silent = false } = {}) => {
    silent ? setRefreshing(true) : setLoadingExams(true);
    setError("");

    try {
      const response = await fetchExams({ page: 1, limit: 500 });

      if (isFailedResponse(response)) {
        setExams([]);
        setError(
          getErrorMessage(response, "تعذر تحميل اختبارات المعلم")
        );
        return;
      }

      const nextExams = extractCollection(response, ["exams"]);
      setExams(nextExams);

      setSelectedExamId((current) => {
        if (
          current &&
          nextExams.some((exam) => getExamId(exam) === current)
        ) {
          return current;
        }

        if (
          requestedExamId &&
          nextExams.some(
            (exam) => getExamId(exam) === requestedExamId
          )
        ) {
          return requestedExamId;
        }

        return getExamId(nextExams[0]);
      });
    } catch (requestError) {
      setExams([]);
      setError(
        requestError?.response?.data?.message ||
          "تعذر الاتصال بخدمة الاختبارات"
      );
    } finally {
      setLoadingExams(false);
      setRefreshing(false);
    }
  }, [requestedExamId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const loadExamDetail = useCallback(
    async (examId, { force = false } = {}) => {
      if (!examId) return;

      const hasDetail =
        Boolean(detailCacheRef.current[examId]);
      const hasResults =
        Boolean(resultsCacheRef.current[examId]);

      if (
        !force &&
        hasDetail &&
        hasResults
      ) {
        return;
      }

      setLoadingDetail(true);
      setError("");

      try {
        const [
          detailResult,
          resultsResult,
        ] = await Promise.allSettled([
          fetchSingleExam(examId),
          fetchExamResults(examId),
        ]);

        let nextError = "";

        if (
          detailResult.status === "fulfilled" &&
          !isFailedResponse(detailResult.value)
        ) {
          const response = detailResult.value;

          setDetailCache((current) => {
            const next = {
              ...current,
              [examId]: response,
            };
            detailCacheRef.current = next;
            return next;
          });
        } else {
          nextError =
            detailResult.status === "fulfilled"
              ? getErrorMessage(
                  detailResult.value,
                  "تعذر تحميل تفاصيل الاختبار"
                )
              : detailResult.reason?.message ||
                "تعذر تحميل تفاصيل الاختبار";
        }

        if (
          resultsResult.status === "fulfilled" &&
          !isFailedResponse(resultsResult.value)
        ) {
          const response = resultsResult.value;

          setResultsCache((current) => {
            const next = {
              ...current,
              [examId]: response,
            };
            resultsCacheRef.current = next;
            return next;
          });
        } else {
          nextError =
            resultsResult.status === "fulfilled"
              ? getErrorMessage(
                  resultsResult.value,
                  "تعذر تحميل نتائج الاختبار"
                )
              : resultsResult.reason?.message ||
                "تعذر تحميل نتائج الاختبار";
        }

        if (nextError) {
          setError(nextError);
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "تعذر تحميل بيانات الاختبار"
        );
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetail(selectedExamId);
    }
  }, [selectedExamId, loadExamDetail]);

  useEffect(() => {
    if (!selectedExamId) return;

    const next = new URLSearchParams(searchParams);
    next.set("examId", selectedExamId);
    setSearchParams(next, { replace: true });
    autoOpenedStudentRef.current = "";
    // searchParams intentionally omitted to avoid URL update loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, setSearchParams]);

  const selectedExam = useMemo(
    () =>
      exams.find((exam) => getExamId(exam) === selectedExamId) ||
      null,
    [exams, selectedExamId]
  );

  const selectedResponse =
    detailCache[selectedExamId];

  const selectedPayload =
    unwrapResponse(selectedResponse);

  const selectedDetail =
    selectedPayload?.exam ||
    selectedPayload ||
    selectedExam ||
    null;

  const selectedResultsResponse =
    resultsCache[selectedExamId];

  const selectedResultsPayload =
    unwrapResponse(
      selectedResultsResponse
    );

  const rawResults = useMemo(
    () =>
      extractExamResults(
        selectedResultsResponse
      ),
    [selectedResultsResponse]
  );

  const results = useMemo(
    () =>
      rawResults.map((result) => {
        const studentId = getStudentId(result);
        const override = overrideMap[`${selectedExamId}:${studentId}`];

        return override
          ? {
              ...result,
              achievedGrade: override.score,
              score: override.score,
              dashboardOverridden: true,
            }
          : result;
      }),
    [rawResults, overrideMap, selectedExamId]
  );

  const filteredExams = useMemo(() => {
    const query = examSearch.trim().toLowerCase();

    return exams.filter((exam) => {
      const classes = getClassEntities(exam)
        .map(getClassLabel)
        .join(" ");

      const target = [
        getExamTitle(exam),
        getSubjectLabel(exam),
        classes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || target.includes(query);
    });
  }, [exams, examSearch]);

  const filteredResults = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return results.filter((result) => {
      const score = getResultScore(result);
      const status = score === null ? "pending" : "graded";

      const matchesStatus =
        statusFilter === "all" || statusFilter === status;

      const target = [
        getStudentName(result),
        getStudentEmail(result),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || target.includes(query))
      );
    });
  }, [results, studentSearch, statusFilter]);

  const resultCounts = useMemo(() => {
    const graded = results.filter(
      (result) =>
        getResultScore(result) !== null
    ).length;

    const startedRaw = Number(
      selectedResultsPayload?.startedCount
    );

    const enrolledRaw = Number(
      selectedResultsPayload?.enrolledCount
    );

    const started = Number.isFinite(startedRaw)
      ? startedRaw
      : results.length;

    const total = Number.isFinite(enrolledRaw)
      ? enrolledRaw
      : started;

    return {
      total,
      started,
      graded,
      pending: Math.max(started - graded, 0),
      notStarted: Math.max(total - started, 0),
    };
  }, [results, selectedResultsPayload]);

  const resultsMaxScore = Number(
    selectedResultsPayload?.totalGrade
  );

  const maxScore =
    Number.isFinite(resultsMaxScore) &&
    resultsMaxScore > 0
      ? resultsMaxScore
      : getMaxScore(
          selectedDetail ||
            selectedExam ||
            {}
        );

  useEffect(() => {
    if (
      !requestedStudentId ||
      !selectedExamId ||
      autoOpenedStudentRef.current === `${selectedExamId}:${requestedStudentId}`
    ) {
      return;
    }

    const target = results.find(
      (result) => getStudentId(result) === requestedStudentId
    );

    if (!target) return;

    autoOpenedStudentRef.current = `${selectedExamId}:${requestedStudentId}`;
    setGradeTarget(target);
    setGradeForm({
      score:
        getResultScore(target) === null
          ? ""
          : String(getResultScore(target)),
    });
  }, [requestedStudentId, selectedExamId, results]);

  const selectExam = (examId) => {
    const next = new URLSearchParams(searchParams);
    next.set("examId", examId);
    next.delete("studentId");
    setSearchParams(next, { replace: true });

    autoOpenedStudentRef.current = "";
    setSelectedExamId(examId);
    setStudentSearch("");
    setStatusFilter("all");
  };

  const openGradeDialog = (result) => {
    setGradeTarget(result);
    setGradeError("");
    setGradeForm({
      score:
        getResultScore(result) === null
          ? ""
          : String(getResultScore(result)),
    });
  };

  const closeGradeDialog = () => {
    if (savingGrade) return;
    setGradeTarget(null);
    setGradeError("");
  };

  const saveGrade = async () => {
    const studentId = getStudentId(gradeTarget);
    const score = Number(gradeForm.score);

    if (!selectedExamId || !studentId) {
      setGradeError("بيانات الاختبار أو الطالب غير مكتملة");
      return;
    }

    if (!Number.isFinite(score)) {
      setGradeError("أدخل درجة صحيحة");
      return;
    }

    if (score < 0 || score > maxScore) {
      setGradeError(`يجب أن تكون الدرجة بين 0 و${maxScore}`);
      return;
    }

    setSavingGrade(true);
    setGradeError("");

    try {
      const response = await gradeExamStudent(
        selectedExamId,
        studentId,
        {
          achievedGrade: score,
        }
      );

      if (isFailedResponse(response)) {
        setGradeError(
          getErrorMessage(response, "تعذر حفظ درجة الطالب")
        );
        return;
      }

      setOverrideMap((current) => ({
        ...current,
        [`${selectedExamId}:${studentId}`]: {
          score,
        },
      }));

      toast.success("تم حفظ درجة الطالب");
      setGradeTarget(null);
    } catch (requestError) {
      setGradeError(
        requestError?.response?.data?.message ||
          "حدث خطأ أثناء حفظ الدرجة"
      );
    } finally {
      setSavingGrade(false);
    }
  };

  const answerRows = useMemo(() => {
    if (!answerTarget) return [];

    const questions = getQuestions(selectedDetail || selectedExam || {});
    const answers = getAnswers(answerTarget);
    const answerMap = new Map(
      answers.map((answer) => [
        getAnswerQuestionId(answer),
        answer,
      ])
    );

    return questions.map((question, index) => {
      const questionId = getQuestionId(question);
      const answer = answerMap.get(questionId);

      return {
        id: questionId || index,
        question: getQuestionText(question, index),
        studentAnswer: answer
          ? getAnswerValue(answer)
          : "لم تُسجل إجابة",
        correctAnswer: String(
          question?.correctAnswer ??
            question?.answer ??
            "غير محددة"
        ),
      };
    });
  }, [answerTarget, selectedDetail, selectedExam]);

  return (
    <Box dir="rtl" sx={TEACHER_UI.page}>
      <Box sx={TEACHER_UI.container}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            color: "white",
            background: `linear-gradient(110deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
            "&::before": {
              content: '\"\"',
              position: "absolute",
              width: 210,
              height: 210,
              insetInlineStart: -85,
              top: -115,
              border: "1px solid rgba(255,255,255,.10)",
              borderRadius: "50%",
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            sx={{ position: "relative", zIndex: 1, minWidth: 0 }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="نسق"
              sx={{
                ...TEACHER_UI.heroLogo,
                objectFit: "contain",
                background: "white",
                p: 0.55,
                flexShrink: 0,
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              <Chip
                icon={<GradingRounded />}
                label="بوابة المعلم"
                size="small"
                sx={{
                  mb: 0.4,
                  height: 22,
                  color: "#FFE19A",
                  border: "1px solid rgba(255,225,154,.35)",
                  background: "rgba(255,225,154,.08)",
                  fontSize: "8px",
                  fontWeight: 900,
                  "& .MuiChip-icon": {
                    color: "#FFE19A",
                    fontSize: 14,
                  },
                }}
              />

              <Typography sx={TEACHER_UI.heroTitle}>
                تصحيح الاختبارات
              </Typography>
              <Typography
                sx={{
                  ...TEACHER_UI.heroSubtitle,
                  color: "rgba(255,255,255,.76)",
                }}
              >
                راجع نتائج الطلاب وعدّل الدرجات والملاحظات من مكان واحد
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.7}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Button
              onClick={() => navigate("/teacher/exams")}
              startIcon={<ArrowBackRounded />}
              variant="outlined"
              sx={{
                ...TEACHER_UI.button,
                color: "white",
                borderColor: "rgba(255,255,255,.34)",
                "&:hover": {
                  borderColor: "white",
                  background: "rgba(255,255,255,.08)",
                },
              }}
            >
              اختباراتي
            </Button>

            <Tooltip title="تحديث البيانات">
              <span>
                <IconButton
                  onClick={() => {
                    loadExams({ silent: true });
                    if (selectedExamId) {
                      loadExamDetail(selectedExamId, { force: true });
                    }
                  }}
                  disabled={refreshing || loadingDetail}
                  sx={{
                    width: 34,
                    height: 34,
                    color: "white",
                    border: "1px solid rgba(255,255,255,.34)",
                    borderRadius: 1.8,
                  }}
                >
                  {refreshing || loadingDetail ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshRounded fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            <Button
              onClick={() => navigate("/teacher/dashboard")}
              variant="outlined"
              sx={{
                ...TEACHER_UI.button,
                color: "white",
                borderColor: "rgba(255,255,255,.34)",
                "&:hover": {
                  borderColor: "white",
                  background: "rgba(255,255,255,.08)",
                },
              }}
            >
              لوحة التحكم
            </Button>
          </Stack>
        </Paper>

        {!!error && (
          <Alert
            severity="warning"
            onClose={() => setError("")}
            sx={{ mt: 1, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0,1fr))",
              lg: "repeat(4, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <StatCard
            icon={<QuizRounded />}
            label="إجمالي الاختبارات"
            value={exams.length}
            helper="الاختبارات المسجلة بحسابك"
          />
          <StatCard
            icon={<AssignmentTurnedInRounded />}
            label="طلاب الاختبار المحدد"
            value={resultCounts.total}
            helper={`${resultCounts.started} بدأوا الاختبار`}
            tone="gold"
          />
          <StatCard
            icon={<PendingActionsRounded />}
            label="تحتاج مراجعة"
            value={resultCounts.pending}
            helper="نتائج بلا درجة محفوظة"
            tone="red"
          />
          <StatCard
            icon={<CheckCircleRounded />}
            label="تم التصحيح"
            value={resultCounts.graded}
            helper="درجات مسجلة للطلاب"
            tone="green"
          />
        </Box>

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "340px minmax(0,1fr)",
            },
            gap: 1,
            alignItems: "start",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              ...TEACHER_UI.section,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 900 }}>
                  الاختبارات
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: "8px" }}>
                  اختر اختبارًا لعرض نتائج طلابه
                </Typography>
              </Box>
              <Chip
                label={`${filteredExams.length} اختبار`}
                size="small"
                sx={{ fontSize: "8px", fontWeight: 900 }}
              />
            </Stack>

            <TextField
              value={examSearch}
              onChange={(event) => setExamSearch(event.target.value)}
              placeholder="ابحث باسم الاختبار أو المادة"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  ...TEACHER_UI.field,
                  backgroundColor: COLORS.soft,
                },
              }}
            />

            <Stack spacing={0.7} sx={{ mt: 1 }}>
              {loadingExams ? (
                <Box
                  sx={{
                    minHeight: 150,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <CircularProgress size={25} />
                </Box>
              ) : !filteredExams.length ? (
                <Box
                  sx={{
                    minHeight: 150,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ color: COLORS.muted, fontSize: "10px" }}>
                    لا توجد اختبارات مطابقة
                  </Typography>
                </Box>
              ) : (
                filteredExams.map((exam, index) => {
                  const examId = getExamId(exam);
                  const active = examId === selectedExamId;
                  const cachedResultsPayload =
                    unwrapResponse(
                      resultsCache[examId]
                    );
                  const cachedStarted =
                    Number(
                      cachedResultsPayload
                        ?.startedCount
                    );

                  return (
                    <Button
                      key={examId || index}
                      onClick={() => selectExam(examId)}
                      sx={{
                        p: 1,
                        display: "block",
                        textAlign: "right",
                        border: `1px solid ${
                          active ? COLORS.navyLight : COLORS.border
                        }`,
                        borderRadius: 2,
                        color: COLORS.navyDeep,
                        backgroundColor: active
                          ? "rgba(45,100,143,.08)"
                          : COLORS.surface,
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "rgba(45,100,143,.06)",
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{ fontSize: "10px", fontWeight: 900 }}
                          >
                            {getExamTitle(exam)}
                          </Typography>
                          <Typography
                            noWrap
                            sx={{
                              mt: 0.2,
                              color: COLORS.muted,
                              fontSize: "8px",
                            }}
                          >
                            {getSubjectLabel(exam)}
                          </Typography>
                        </Box>

                        <Chip
                          label={
                            Number.isFinite(
                              cachedStarted
                            )
                              ? `${cachedStarted} بدأ`
                              : "عرض النتائج"
                          }
                          size="small"
                          sx={{
                            flexShrink: 0,
                            height: 22,
                            fontSize: "7.5px",
                            fontWeight: 900,
                          }}
                        />
                      </Stack>
                    </Button>
                  );
                })
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              ...TEACHER_UI.section,
              minHeight: 340,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            {!selectedExam ? (
              <Box
                sx={{
                  minHeight: 300,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                }}
              >
                <Stack alignItems="center" spacing={0.8}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      display: "grid",
                      placeItems: "center",
                      color: "#B77B13",
                      backgroundColor: COLORS.goldSoft,
                      borderRadius: 2.2,
                    }}
                  >
                    <FactCheckRounded />
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 900 }}>
                    اختر اختبارًا لبدء التصحيح
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "15px", fontWeight: 900 }}>
                      {getExamTitle(selectedDetail || selectedExam)}
                    </Typography>
                    <Typography
                      sx={{ mt: 0.2, color: COLORS.muted, fontSize: "8.5px" }}
                    >
                      {getSubjectLabel(selectedDetail || selectedExam)} • الدرجة النهائية {maxScore}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.6} flexWrap="wrap">
                    {getClassEntities(selectedDetail || selectedExam)
                      .slice(0, 3)
                      .map((entity, index) => (
                        <Chip
                          key={normalizeId(entity) || index}
                          label={getClassLabel(entity, index)}
                          size="small"
                          sx={{ fontSize: "7.5px", fontWeight: 900 }}
                        />
                      ))}
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1 }} />

                {resultCounts.notStarted > 0 && (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      fontSize: "9px",
                    }}
                  >
                    {resultCounts.notStarted} طلاب لم يبدأوا الاختبار، ولا يظهرون في القائمة.
                  </Alert>
                )}

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  gap={0.8}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <TextField
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="ابحث باسم الطالب أو البريد"
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRounded sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        ...TEACHER_UI.field,
                        backgroundColor: COLORS.soft,
                      },
                    }}
                  />

                  <TextField
                    select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    label="الحالة"
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", md: 180 },
                      "& .MuiOutlinedInput-root": TEACHER_UI.field,
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                {loadingDetail ? (
                  <Box
                    sx={{
                      minHeight: 210,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Stack alignItems="center" spacing={0.8}>
                      <CircularProgress size={26} />
                      <Typography sx={{ color: COLORS.muted, fontSize: "9px" }}>
                        جاري تحميل نتائج الاختبار...
                      </Typography>
                    </Stack>
                  </Box>
                ) : !results.length ? (
                  <Box
                    sx={{
                      ...TEACHER_UI.emptyState,
                      mt: 1,
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Stack
                      alignItems="center"
                      spacing={0.8}
                    >
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          display: "grid",
                          placeItems: "center",
                          color: COLORS.gold,
                          backgroundColor:
                            COLORS.goldSoft,
                          borderRadius: 2,
                        }}
                      >
                        <AssignmentTurnedInRounded />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 900,
                        }}
                      >
                        لم يبدأ أي طالب الاختبار حتى الآن
                      </Typography>

                      <Typography
                        sx={{
                          color: COLORS.muted,
                          fontSize: "8.5px",
                        }}
                      >
                        الطلاب الذين لم يبدأوا لا يكون لهم صف داخل نتائج الاختبار.
                      </Typography>
                    </Stack>
                  </Box>
                ) : !filteredResults.length ? (
                  <Box
                    sx={{
                      ...TEACHER_UI.emptyState,
                      mt: 1,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Typography sx={{ color: COLORS.muted, fontSize: "10px" }}>
                      لا توجد نتائج مطابقة للبحث أو الفلتر
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mt: 1,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0,1fr))",
                      },
                      gap: 0.8,
                    }}
                  >
                    {filteredResults.map((result, index) => {
                      const studentId = getStudentId(result);
                      const score = getResultScore(result);
                      const graded = score !== null;
                      const email = getStudentEmail(result);

                      return (
                        <Paper
                          key={`${studentId || "student"}-${index}`}
                          elevation={0}
                          sx={{
                            ...TEACHER_UI.studentCard,
                            display: "grid",
                            gridTemplateColumns: "42px minmax(0,1fr) auto",
                            alignItems: "center",
                            gap: 0.9,
                            border: `1px solid ${
                              graded
                                ? "rgba(31,138,91,.18)"
                                : "rgba(211,164,79,.28)"
                            }`,
                            backgroundColor: graded
                              ? "rgba(231,246,239,.36)"
                              : "rgba(251,240,216,.30)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              display: "grid",
                              placeItems: "center",
                              color: graded ? COLORS.green : "#B77B13",
                              backgroundColor: graded
                                ? COLORS.greenSoft
                                : COLORS.goldSoft,
                              borderRadius: 2,
                            }}
                          >
                            <PersonRounded />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{ fontSize: "10px", fontWeight: 900 }}
                            >
                              {getStudentName(result)}
                            </Typography>
                            {!!email && (
                              <Typography
                                noWrap
                                sx={{ mt: 0.15, color: COLORS.muted, fontSize: "7.5px" }}
                              >
                                {email}
                              </Typography>
                            )}
                            <Typography
                              sx={{ mt: 0.25, color: COLORS.muted, fontSize: "7.5px" }}
                            >
                              {getAttemptStatusLabel(result)}
                            </Typography>
                          </Box>

                          <Stack alignItems="flex-end" spacing={0.45}>
                            <Chip
                              label={
                                graded
                                  ? `${score} / ${maxScore}`
                                  : "تحتاج مراجعة"
                              }
                              size="small"
                              sx={{
                                height: 22,
                                color: graded ? COLORS.green : "#9B6810",
                                backgroundColor: graded
                                  ? COLORS.greenSoft
                                  : COLORS.goldSoft,
                                fontSize: "8px",
                                fontWeight: 900,
                              }}
                            />

                            <Stack direction="row" spacing={0.35}>
                              <Tooltip title="عرض الإجابات">
                                <span>
                                  <IconButton
                                    onClick={() => setAnswerTarget(result)}
                                    disabled={!getAnswers(result).length}
                                    size="small"
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      border: `1px solid ${COLORS.border}`,
                                    }}
                                  >
                                    <VisibilityRounded sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Button
                                onClick={() => openGradeDialog(result)}
                                startIcon={<GradingRounded />}
                                sx={{
                                  ...TEACHER_UI.button,
                                  minHeight: 30,
                                  color: "white",
                                  backgroundColor: COLORS.navy,
                                  "&:hover": { backgroundColor: COLORS.navyDeep },
                                }}
                              >
                                {graded ? "تعديل" : "تصحيح"}
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={Boolean(gradeTarget)}
        onClose={closeGradeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 900 }}>
            تصحيح نتيجة الطالب
          </Typography>
          <Typography sx={{ mt: 0.25, color: COLORS.muted, fontSize: "9px" }}>
            {gradeTarget ? getStudentName(gradeTarget) : ""} • الدرجة من {maxScore}
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {!!gradeError && (
            <Alert severity="error" sx={{ mb: 1.2, borderRadius: 2 }}>
              {gradeError}
            </Alert>
          )}

          <Stack spacing={1.2}>
            <TextField
              value={gradeForm.score}
              onChange={(event) =>
                setGradeForm((current) => ({
                  ...current,
                  score: event.target.value,
                }))
              }
              label="درجة الطالب"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: maxScore, step: "0.5" }}
              helperText={`القيمة المسموحة من 0 إلى ${maxScore}`}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeGradeDialog} disabled={savingGrade}>
            إلغاء
          </Button>
          <Button
            onClick={saveGrade}
            disabled={savingGrade}
            variant="contained"
            startIcon={
              savingGrade ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <SaveRounded />
              )
            }
            sx={{
              color: "white",
              backgroundColor: COLORS.navy,
              borderRadius: 2,
              fontWeight: 900,
              "&:hover": { backgroundColor: COLORS.navyDeep },
            }}
          >
            حفظ الدرجة
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(answerTarget)}
        onClose={() => setAnswerTarget(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography sx={{ fontSize: "16px", fontWeight: 900 }}>
            إجابات {answerTarget ? getStudentName(answerTarget) : ""}
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {!answerRows.length ? (
            <Alert severity="info">لا توجد إجابات تفصيلية متاحة.</Alert>
          ) : (
            <Stack spacing={1}>
              {answerRows.map((row, index) => (
                <Paper
                  key={row.id}
                  elevation={0}
                  sx={{
                    p: 1.2,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ fontSize: "10px", fontWeight: 900 }}>
                    {index + 1}. {row.question}
                  </Typography>
                  <Typography sx={{ mt: 0.7, color: COLORS.muted, fontSize: "9px" }}>
                    إجابة الطالب: <b>{row.studentAnswer}</b>
                  </Typography>
                  <Typography sx={{ mt: 0.35, color: COLORS.green, fontSize: "9px" }}>
                    الإجابة الصحيحة: <b>{row.correctAnswer}</b>
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAnswerTarget(null)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherExamGrading;
