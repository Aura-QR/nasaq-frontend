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
  AddRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  EventAvailableRounded,
  FactCheckRounded,
  HelpOutlineRounded,
  HourglassBottomRounded,
  MenuBookRounded,
  PendingActionsRounded,
  QuizRounded,
  RefreshRounded,
  ScheduleRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  deleteExam,
  fetchExams,
  fetchTeacherExams,
} from "@/APIs/school/exams";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const TYPE_OPTIONS = [
  { value: "all", label: "كل الأنواع" },
  { value: "final", label: "اختبار نهائي" },
  { value: "assignment", label: "واجب" },
  { value: "activity", label: "نشاط" },
  { value: "quiz", label: "اختبار قصير" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "active", label: "نشط الآن" },
  { value: "upcoming", label: "قادم" },
  { value: "ended", label: "منتهي" },
  { value: "draft", label: "غير محدد" },
];

const TYPE_LABELS = {
  final: "اختبار نهائي",
  assignment: "واجب",
  activity: "نشاط",
  quiz: "اختبار قصير",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const unwrapResponse = (response) => {
  let payload = response;

  for (let index = 0; index < 4; index += 1) {
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

const extractCollection = (response) => {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [
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
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

const getExamId = (exam) => normalizeId(exam);

const getExamType = (exam) =>
  String(exam?.examType || exam?.type || "").trim();

const getExamTypeLabel = (exam) =>
  TYPE_LABELS[getExamType(exam)] ||
  exam?.typeLabel ||
  "اختبار";

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

const getClasses = (exam) => {
  const value =
    exam?.classes ||
    exam?.classIds ||
    exam?.classrooms ||
    [];

  return Array.isArray(value) ? value : [];
};

const getClassLabel = (classEntity, index) => {
  if (classEntity && typeof classEntity === "object") {
    return (
      classEntity?.name ||
      classEntity?.className ||
      classEntity?.roomNumber ||
      `فصل ${index + 1}`
    );
  }

  return `فصل ${index + 1}`;
};

const getQuestions = (exam) =>
  Array.isArray(exam?.questions) ? exam.questions : [];

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value, withTime = false) => {
  const date = parseDate(value);

  if (!date) {
    return "غير محدد";
  }

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

const getExamStatus = (exam) => {
  const start = parseDate(exam?.startDate);
  const end = parseDate(exam?.endDate);
  const now = new Date();

  if (!start && !end) {
    return "draft";
  }

  if (start && now < start) {
    return "upcoming";
  }

  if (end && now > end) {
    return "ended";
  }

  return "active";
};

const STATUS_CONFIG = {
  active: {
    label: "نشط الآن",
    color: "#237449",
    background: "rgba(116,201,154,.16)",
    icon: <CheckCircleRounded />,
  },
  upcoming: {
    label: "قادم",
    color: "#A46D0A",
    background: "rgba(226,173,59,.16)",
    icon: <HourglassBottomRounded />,
  },
  ended: {
    label: "منتهي",
    color: "#6B7280",
    background: "rgba(107,114,128,.12)",
    icon: <EventAvailableRounded />,
  },
  draft: {
    label: "غير محدد",
    color: "#6B7280",
    background: "rgba(107,114,128,.10)",
    icon: <PendingActionsRounded />,
  },
};

const StatCard = ({ icon, label, value, helper, accent = "navy" }) => {
  const accentColor =
    accent === "gold"
      ? "var(--color-gold-dark, #B78430)"
      : accent === "green"
        ? "#237449"
        : "var(--color-navy, #244A70)";

  const softColor =
    accent === "gold"
      ? "var(--color-gold-soft, #FBF0D8)"
      : accent === "green"
        ? "rgba(116,201,154,.14)"
        : "rgba(36,74,112,.08)";

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 94,
        p: 1.35,
        display: "grid",
        gridTemplateColumns: "44px minmax(0,1fr)",
        alignItems: "center",
        gap: 1,
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "18px",
        backgroundColor: "var(--color-white, #fff)",
        boxShadow: "0 12px 30px rgba(18,47,77,.055)",
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          color: accentColor,
          backgroundColor: softColor,
          borderRadius: "13px",
          "& svg": { fontSize: 22 },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#7B8794",
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            color: "#122F4D",
            fontSize: { xs: "24px", sm: "28px", md: "32px" },
            lineHeight: 1.15,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>
        <Typography
          noWrap
          sx={{
            mt: 0.45,
            color: "#9AA6B2",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {helper}
        </Typography>
      </Box>
    </Paper>
  );
};

const TeacherExams = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedExam, setSelectedExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadExams = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetchTeacherExams({
        page: 1,
        limit: 500,
      });

      if (isFailedResponse(response)) {
        setExams([]);
        setError(
          getErrorMessage(
            response,
            "تعذر تحميل اختباراتك"
          )
        );
        return;
      }

      setExams(extractCollection(response));
    } catch (requestError) {
      setExams([]);
      setError(
        requestError?.response?.data?.message ||
          "تعذر الاتصال بخدمة الاختبارات"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const counts = useMemo(() => {
    const result = {
      total: exams.length,
      active: 0,
      upcoming: 0,
      ended: 0,
    };

    exams.forEach((exam) => {
      const status = getExamStatus(exam);
      if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const type = getExamType(exam);
      const status = getExamStatus(exam);
      const classesText = getClasses(exam)
        .map(getClassLabel)
        .join(" ");

      const searchTarget = [
        exam?.title,
        getExamTypeLabel(exam),
        getSubjectLabel(exam),
        classesText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchTarget.includes(query);
      const matchesType =
        typeFilter === "all" || type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [exams, search, typeFilter, statusFilter]);

  const handleDelete = async () => {
    const examId = getExamId(deleteTarget);

    if (!examId) {
      toast.error("تعذر تحديد الاختبار");
      return;
    }

    setDeleting(true);

    try {
      const response = await deleteExam(examId);

      if (isFailedResponse(response)) {
        toast.error(
          getErrorMessage(
            response,
            "تعذر حذف الاختبار"
          )
        );
        return;
      }

      setExams((previous) =>
        previous.filter((exam) => getExamId(exam) !== examId)
      );
      setDeleteTarget(null);
      toast.success("تم حذف الاختبار بنجاح");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          "حدث خطأ أثناء حذف الاختبار"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        color: "var(--color-navy-deep, #122F4D)",
        py: { xs: 2, sm: 2.5, md: 3.5 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1680px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 2.2, md: 3 },
            borderRadius: "24px",
            color: "white",
            background:
              "linear-gradient(120deg, #173B5E 0%, #244F78 55%, #2C5C87 100%)",
            boxShadow: "0 18px 45px rgba(18,47,77,.18)",
            "&::after": {
              content: '""',
              position: "absolute",
              width: 320,
              height: 320,
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
            gap={1.6}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.8}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: { xs: 52, md: 60 },
                  height: { xs: 52, md: 60 },
                  p: 0.8,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,.12)",
                }}
              >
                <Box
                  component="img"
                  src={nasaqLogo}
                  alt="نسق"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0, pt: 0.1 }}>
                <Chip
                  icon={<QuizRounded />}
                  label="بوابة المعلم"
                  size="small"
                  sx={{
                    mb: 0.8,
                    height: 27,
                    color: "#F2D792",
                    backgroundColor: "rgba(242,215,146,.12)",
                    border: "1px solid rgba(242,215,146,.22)",
                    fontSize: "12px",
                    fontWeight: 800,
                    "& .MuiChip-icon": { color: "inherit", fontSize: 16 },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "24px", md: "32px" },
                    fontWeight: 900,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  اختباراتي
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    color: "rgba(255,255,255,.80)",
                    fontSize: { xs: "12.5px", md: "14px" },
                    lineHeight: 1.6,
                  }}
                >
                  أنشئ اختباراتك وتابع حالتها وأسئلتها وتصحيح الطلاب من مكان واحد.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1.2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
                variant="outlined"
                startIcon={<ArrowBackRounded />}
                sx={{
                  minHeight: 44,
                  px: 2,
                  borderColor: "rgba(255,255,255,.28)",
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#F2D792",
                    backgroundColor: "rgba(255,255,255,.08)",
                  },
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                لوحة التحكم
              </Button>

              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    type="button"
                    disabled={refreshing}
                    onClick={() => loadExams({ silent: true })}
                    sx={{
                      width: 42,
                      height: 42,
                      color: "white",
                      border: "1px solid rgba(255,255,255,.25)",
                      borderRadius: "12px",
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <RefreshRounded />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                type="button"
                onClick={() => navigate("/teacher/grading/exams")}
                variant="outlined"
                startIcon={<FactCheckRounded />}
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
                تصحيح الاختبارات
              </Button>

              <Button
                type="button"
                onClick={() => navigate("/teacher/exams/add")}
                variant="contained"
                startIcon={<AddRounded />}
                sx={{
                  minHeight: 42,
                  px: 2,
                  borderRadius: "12px",
                  color: "var(--color-navy-deep, #122F4D)",
                  backgroundColor: "#F2D792",
                  boxShadow: "none",
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#E8C96F",
                    boxShadow: "none",
                  },
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                إنشاء اختبار
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 1.4,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0,1fr))",
              lg: "repeat(4, minmax(0,1fr))",
            },
            gap: 1.1,
          }}
        >
          <StatCard
            icon={<FactCheckRounded />}
            label="إجمالي الاختبارات"
            value={counts.total}
            helper="كل الاختبارات المسجلة بحسابك"
          />
          <StatCard
            icon={<CheckCircleRounded />}
            label="نشطة الآن"
            value={counts.active}
            helper="متاحة للطلاب حاليًا"
            accent="green"
          />
          <StatCard
            icon={<HourglassBottomRounded />}
            label="اختبارات قادمة"
            value={counts.upcoming}
            helper="لم يبدأ موعدها بعد"
            accent="gold"
          />
          <StatCard
            icon={<EventAvailableRounded />}
            label="اختبارات منتهية"
            value={counts.ended}
            helper="انتهى موعد إتاحتها"
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.4,
            p: { xs: 1.2, md: 1.5 },
            border: 0,
            borderRadius: 0,
            backgroundColor: "transparent",
            boxShadow: "none",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            alignItems={{ xs: "stretch", lg: "center" }}
            gap={1}
          >
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالمادة أو نوع الاختبار أو الفصل"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                  backgroundColor: "#FAFBFC",
                },
              }}
            />

            <TextField
              select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              label="النوع"
              size="small"
              sx={{
                minWidth: { xs: "100%", lg: 190 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                },
              }}
            >
              {TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              label="الحالة"
              size="small"
              sx={{
                minWidth: { xs: "100%", lg: 190 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                },
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {!!error && (
          <Alert
            severity="warning"
            sx={{ mt: 1.3, borderRadius: "14px" }}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 1.4 }}>
          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                border: 0,
                borderRadius: 0,
                backgroundColor: "transparent",
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <CircularProgress
                  size={30}
                  sx={{ color: "var(--color-gold-dark, #B78430)" }}
                />
                <Typography
                  sx={{
                    color: "var(--color-muted, #708198)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  جاري تحميل الاختبارات...
                </Typography>
              </Stack>
            </Paper>
          ) : !filteredExams.length ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                px: 2,
                textAlign: "center",
                border: 0,
                borderRadius: 0,
                backgroundColor: "transparent",
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-gold-dark, #B78430)",
                    backgroundColor: "var(--color-gold-soft, #FBF0D8)",
                    borderRadius: "16px",
                  }}
                >
                  <QuizRounded sx={{ fontSize: 27 }} />
                </Box>
                <Typography sx={{ fontSize: "15px", fontWeight: 900 }}>
                  لا توجد اختبارات مطابقة
                </Typography>
                <Typography
                  sx={{
                    maxWidth: 440,
                    color: "var(--color-muted, #708198)",
                    fontSize: "10px",
                    lineHeight: 1.8,
                  }}
                >
                  غيّر الفلاتر أو أنشئ اختبارًا جديدًا ليظهر هنا.
                </Typography>
                <Button
                  type="button"
                  onClick={() => navigate("/teacher/exams/add")}
                  variant="contained"
                  startIcon={<AddRounded />}
                  sx={{
                    mt: 0.5,
                    borderRadius: "11px",
                    color: "var(--color-navy-deep, #122F4D)",
                    backgroundColor: "#F2D792",
                    boxShadow: "none",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#E8C96F",
                      boxShadow: "none",
                    },
                    "& .MuiButton-startIcon": {
                      marginLeft: "6px",
                      marginRight: 0,
                    },
                  }}
                >
                  إنشاء اختبار
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0,1fr))",
                  xl: "repeat(3, minmax(0,1fr))",
                },
                gap: 1.2,
              }}
            >
              {filteredExams.map((exam, index) => {
                const examId = getExamId(exam);
                const status = getExamStatus(exam);
                const statusConfig = STATUS_CONFIG[status];
                const classes = getClasses(exam);
                const questions = getQuestions(exam);
                const duration = Number(exam?.duration || 0);

                return (
                  <Paper
                    key={examId || index}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      border: "1px solid rgba(36,74,112,.08)",
                      borderRadius: "19px",
                      backgroundColor: "#fff",
                      boxShadow: "0 12px 30px rgba(18,47,77,.055)",
                      transition: "transform .18s ease, box-shadow .18s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 18px 38px rgba(18,47,77,.09)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 5,
                        backgroundColor:
                          status === "active"
                            ? "#4D9E72"
                            : status === "upcoming"
                              ? "var(--color-gold, #D3A44F)"
                              : "var(--color-navy-light, #315E88)",
                      }}
                    />

                    <Box sx={{ p: 1.55 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={1}
                      >
                        <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                              color: "var(--color-gold-dark, #B78430)",
                              backgroundColor: "var(--color-gold-soft, #FBF0D8)",
                              borderRadius: "13px",
                            }}
                          >
                            <QuizRounded />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: "var(--color-gold-dark, #B78430)",
                                fontSize: "12px",
                                fontWeight: 900,
                              }}
                            >
                              {getExamTypeLabel(exam)}
                            </Typography>
                            <Typography
                              title={getSubjectLabel(exam)}
                              sx={{
                                mt: 0.25,
                                color: "var(--color-navy-deep, #122F4D)",
                                fontSize: "16px",
                                fontWeight: 900,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {exam?.title || getSubjectLabel(exam)}
                            </Typography>
                            {!!exam?.title && (
                              <Typography
                                sx={{
                                  mt: 0.2,
                                  color: "var(--color-muted, #708198)",
                                  fontSize: "12.5px",
                                }}
                              >
                                {getSubjectLabel(exam)}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            flexShrink: 0,
                            height: 28,
                            color: statusConfig.color,
                            backgroundColor: statusConfig.background,
                            fontSize: "11.5px",
                            fontWeight: 900,
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      </Stack>

                      <Box
                        sx={{
                          mt: 1.5,
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.1,
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                          }}
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <CalendarMonthRounded sx={{ fontSize: 18 }} />
                            <Box>
                              <Typography sx={{ fontSize: "11px", color: "#7B8798" }}>
                                البداية
                              </Typography>
                              <Typography sx={{ fontSize: "12.5px", fontWeight: 800 }}>
                                {formatDate(exam?.startDate)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Box
                          sx={{
                            p: 1.1,
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                          }}
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <EventAvailableRounded sx={{ fontSize: 18 }} />
                            <Box>
                              <Typography sx={{ fontSize: "11px", color: "#7B8798" }}>
                                النهاية
                              </Typography>
                              <Typography sx={{ fontSize: "12.5px", fontWeight: 800 }}>
                                {formatDate(exam?.endDate)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Box>

                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={0.8}
                        sx={{ mt: 1.2 }}
                      >
                        <Chip
                          icon={<HelpOutlineRounded />}
                          label={`${questions.length} سؤال`}
                          size="small"
                          sx={{ height: 26, fontSize: "11.5px", fontWeight: 800 }}
                        />
                        <Chip
                          icon={<ScheduleRounded />}
                          label={duration ? `${duration} دقيقة` : "المدة غير محددة"}
                          size="small"
                          sx={{ height: 26, fontSize: "11.5px", fontWeight: 800 }}
                        />
                        <Chip
                          icon={<MenuBookRounded />}
                          label={`${classes.length} فصل`}
                          size="small"
                          sx={{ height: 26, fontSize: "11.5px", fontWeight: 800 }}
                        />
                      </Stack>

                      <Divider sx={{ my: 1.2, borderColor: "rgba(36,74,112,.07)" }} />

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={0.6}
                      >
                        <Stack direction="row" gap={0.45}>
                          <Tooltip title="عرض سريع">
                            <IconButton
                              type="button"
                              onClick={() => setSelectedExam(exam)}
                              sx={{
                                width: 36,
                                height: 36,
                                color: "var(--color-navy, #244A70)",
                                backgroundColor: "rgba(36,74,112,.07)",
                                borderRadius: "10px",
                              }}
                            >
                              <VisibilityRounded sx={{ fontSize: 19 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="تعديل الاختبار والأسئلة">
                            <IconButton
                              type="button"
                              onClick={() =>
                                navigate(`/school/exams/edit/${examId}`)
                              }
                              sx={{
                                width: 36,
                                height: 36,
                                color: "var(--color-gold-dark, #B78430)",
                                backgroundColor: "var(--color-gold-soft, #FBF0D8)",
                                borderRadius: "10px",
                              }}
                            >
                              <EditRounded sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="حذف الاختبار">
                            <IconButton
                              type="button"
                              onClick={() => setDeleteTarget(exam)}
                              sx={{
                                width: 36,
                                height: 36,
                                color: "#B54747",
                                backgroundColor: "rgba(181,71,71,.08)",
                                borderRadius: "10px",
                              }}
                            >
                              <DeleteOutlineRounded sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <Button
                          type="button"
                          onClick={() => navigate(`/school/exams/${examId}`)}
                          variant="contained"
                          endIcon={<ArrowBackRounded />}
                          sx={{
                            minHeight: 36,
                            px: 1.35,
                            borderRadius: "10px",
                            backgroundColor: "var(--color-navy, #244A70)",
                            boxShadow: "none",
                            fontSize: "9px",
                            fontWeight: 800,
                            textTransform: "none",
                            "& .MuiButton-endIcon": {
                              marginRight: "5px",
                              marginLeft: 0,
                            },
                          }}
                        >
                          التفاصيل
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={Boolean(selectedExam)}
        onClose={() => setSelectedExam(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            backgroundColor: "#FCFBF8",
          },
        }}
      >
        {selectedExam && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-gold-dark, #B78430)",
                    backgroundColor: "var(--color-gold-soft, #FBF0D8)",
                    borderRadius: "12px",
                  }}
                >
                  <QuizRounded />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "16px", fontWeight: 900 }}>
                    {selectedExam?.title || getSubjectLabel(selectedExam)}
                  </Typography>
                  <Typography sx={{ fontSize: "9px", color: "#708198" }}>
                    {getExamTypeLabel(selectedExam)} — {getSubjectLabel(selectedExam)}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0,1fr))",
                    md: "repeat(4, minmax(0,1fr))",
                  },
                  gap: 0.8,
                }}
              >
                {[
                  ["البداية", formatDate(selectedExam?.startDate, true)],
                  ["النهاية", formatDate(selectedExam?.endDate, true)],
                  ["المدة", `${Number(selectedExam?.duration || 0)} دقيقة`],
                  ["عدد الأسئلة", `${getQuestions(selectedExam).length} سؤال`],
                ].map(([label, value]) => (
                  <Paper
                    key={label}
                    elevation={0}
                    sx={{
                      p: 1.1,
                      border: "1px solid rgba(36,74,112,.08)",
                      borderRadius: "12px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Typography sx={{ fontSize: "8.5px", color: "#7B8798" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: "10px", fontWeight: 800 }}>
                      {value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Typography sx={{ mt: 1.5, mb: 0.7, fontSize: "12px", fontWeight: 900 }}>
                الفصول
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {getClasses(selectedExam).length ? (
                  getClasses(selectedExam).map((classEntity, index) => (
                    <Chip
                      key={normalizeId(classEntity) || index}
                      label={getClassLabel(classEntity, index)}
                      size="small"
                      sx={{ fontSize: "9px", fontWeight: 800 }}
                    />
                  ))
                ) : (
                  <Typography sx={{ fontSize: "10px", color: "#708198" }}>
                    لم تُحدد فصول لهذا الاختبار.
                  </Typography>
                )}
              </Stack>

              <Typography sx={{ mt: 1.6, mb: 0.7, fontSize: "12px", fontWeight: 900 }}>
                الأسئلة
              </Typography>

              {getQuestions(selectedExam).length ? (
                <Stack spacing={0.8}>
                  {getQuestions(selectedExam).map((question, index) => (
                    <Paper
                      key={normalizeId(question) || index}
                      elevation={0}
                      sx={{
                        p: 1.15,
                        border: "1px solid rgba(36,74,112,.08)",
                        borderRadius: "13px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <Typography sx={{ fontSize: "10.5px", fontWeight: 900 }}>
                        {index + 1}. {question?.question || "سؤال بدون نص"}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.55} sx={{ mt: 0.75 }}>
                        {(Array.isArray(question?.options) ? question.options : []).map(
                          (option, optionIndex) => {
                            const isCorrect = option === question?.correctAnswer;
                            return (
                              <Chip
                                key={`${index}-${optionIndex}`}
                                label={option}
                                size="small"
                                sx={{
                                  color: isCorrect ? "#237449" : "#43516A",
                                  backgroundColor: isCorrect
                                    ? "rgba(116,201,154,.16)"
                                    : "#F5F7F9",
                                  fontSize: "8.5px",
                                  fontWeight: isCorrect ? 900 : 700,
                                }}
                              />
                            );
                          }
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  لا توجد أسئلة داخل هذا الاختبار حتى الآن.
                </Alert>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 1.2 }}>
              <Button
                type="button"
                onClick={() => setSelectedExam(null)}
                sx={{ borderRadius: "10px", fontWeight: 800 }}
              >
                إغلاق
              </Button>
              <Button
                type="button"
                onClick={() =>
                  navigate(`/school/exams/edit/${getExamId(selectedExam)}`)
                }
                variant="contained"
                startIcon={<EditRounded />}
                sx={{
                  borderRadius: "10px",
                  backgroundColor: "var(--color-navy, #244A70)",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                تعديل وإدارة الأسئلة
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          حذف الاختبار
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "11px", lineHeight: 1.9 }}>
            هل أنت متأكد من حذف اختبار
            {" "}
            <strong>
              {deleteTarget?.title || getSubjectLabel(deleteTarget)}
            </strong>
            ؟ لا يمكن التراجع عن هذه الخطوة.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.2 }}>
          <Button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            sx={{ borderRadius: "10px", fontWeight: 800 }}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={
              deleting ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <DeleteOutlineRounded />
              )
            }
            sx={{
              borderRadius: "10px",
              fontWeight: 800,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                marginLeft: "6px",
                marginRight: 0,
              },
            }}
          >
            حذف الاختبار
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherExams;
