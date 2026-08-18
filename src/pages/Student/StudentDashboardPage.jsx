import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTimeRounded,
  AccountBalanceWalletRounded,
  AssignmentRounded,
  AutoStoriesRounded,
  CalendarMonthRounded,
  CelebrationRounded,
  ChevronLeftRounded,
  DirectionsBusRounded,
  FolderRounded,
  HowToRegRounded,
  LibraryBooksRounded,
  MenuBookRounded,
  PaymentsRounded,
  RouteRounded,
  ScheduleRounded,
  SchoolRounded,
  TaskAltRounded,
} from "@mui/icons-material";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import {
  useStudentAttendance,
  useStudentExams,
  useStudentLectures,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",
  blue: "#4e8dcc",
  blueLight: "#edf6ff",
  purple: "#8068c9",
  purpleLight: "#f3efff",
  orange: "#e69a43",
  orangeLight: "#fff3e4",
  green: "#43a978",
  greenLight: "#eaf8f1",
  red: "#d76760",
  redLight: "#fff0ef",
};

const DAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const buildFullName = (value) => {
  if (!value || typeof value !== "object") return "";

  const user =
    value?.student ||
    value?.profile ||
    value?.user ||
    value?.data?.student ||
    value?.data?.profile ||
    value?.data?.user ||
    value;

  return (
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.fatherName, user?.familyName]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    ""
  );
};


const getClassName = (student) => {
  if (!student) return "";

  const enrollment =
    student?.currentEnrollment ||
    student?.enrollment ||
    student?.activeEnrollment ||
    {};

  const classData =
    student?.classId ||
    student?.class ||
    enrollment?.classId ||
    enrollment?.class ||
    {};

  if (typeof classData === "string") return "";
  return classData?.name || classData?.className || "";
};

const getAcademicYear = (student) => {
  if (!student) return "";

  const enrollment =
    student?.currentEnrollment ||
    student?.enrollment ||
    student?.activeEnrollment ||
    {};

  const year =
    student?.academicYearId ||
    student?.academicYear ||
    enrollment?.academicYearId ||
    enrollment?.academicYear ||
    {};

  if (typeof year === "string") return "";
  return year?.name || year?.academicYear || "";
};

const getNestedSubject = (item) => {
  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering ||
    item ||
    {};

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    item?.subjectId ||
    item?.subject ||
    {};

  return { offering, subject };
};

const getSubjectName = (item, fallback = "مادة دراسية") => {
  const { offering, subject } = getNestedSubject(item);

  if (typeof subject === "string") {
    return item?.subjectName || offering?.subjectName || fallback;
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    offering?.subjectName ||
    item?.subjectName ||
    item?.name ||
    fallback
  );
};

const getSubjectCode = (item) => {
  const { offering, subject } = getNestedSubject(item);

  if (typeof subject === "string") {
    return item?.subjectCode || offering?.subjectCode || "";
  }

  return (
    subject?.subjectCode ||
    subject?.code ||
    offering?.subjectCode ||
    item?.subjectCode ||
    item?.code ||
    ""
  );
};

const getTeacherName = (lecture) => {
  const teacher = lecture?.teacherId || lecture?.teacher || {};
  if (typeof teacher === "string") return "المعلم";
  return buildFullName(teacher) || "المعلم";
};

const getSlotLabel = (lecture) =>
  lecture?.startTime ||
  lecture?.time ||
  (lecture?.slot ? `الحصة ${lecture.slot}` : "موعد الحصة");

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const getExamType = (type) => {
  const map = {
    final: "اختبار نهائي",
    quiz: "اختبار قصير",
    midterm: "اختبار منتصف الفصل",
    assignment: "واجب",
  };

  return map[String(type || "").toLowerCase()] || type || "اختبار";
};

const isUpcomingExam = (exam) => {
  const endDate = exam?.endDate || exam?.endAt || exam?.date;
  if (!endDate) return true;

  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() >= Date.now();
};

const QUICK_ACTIONS = [
  {
    title: "موادي",
    description: "كل المواد الدراسية",
    icon: AutoStoriesRounded,
    path: "/student-dashboard/subjects",
    background: COLORS.blueLight,
    color: COLORS.blue,
  },
  {
    title: "جدولي",
    description: "حصصك ومواعيدك",
    icon: CalendarMonthRounded,
    path: "/student-dashboard/schedule",
    background: COLORS.purpleLight,
    color: COLORS.purple,
  },
  {
    title: "اختباراتي",
    description: "الاختبارات القادمة",
    icon: AssignmentRounded,
    path: "/student-dashboard/exams",
    background: COLORS.orangeLight,
    color: COLORS.orange,
  },
  {
    title: "واجباتي",
    description: "المهام المطلوبة",
    icon: TaskAltRounded,
    path: "/student-dashboard/assignments",
    background: COLORS.greenLight,
    color: COLORS.green,
  },
  {
    title: "صفي",
    description: "بيانات فصلك الدراسي",
    icon: SchoolRounded,
    path: "/student-dashboard/my-class",
    background: "#fff7e8",
    color: COLORS.gold,
  },
];

const MORE_ACTIONS = [
  {
    title: "المشاريع",
    icon: FolderRounded,
    path: "/student-dashboard/projects",
  },
  {
    title: "المكتبة",
    icon: LibraryBooksRounded,
    path: "/student-dashboard/library",
  },
  {
    title: "الحضور",
    icon: HowToRegRounded,
    path: "/student-dashboard/attendance",
  },
  {
    title: "سجلي المالي",
    icon: AccountBalanceWalletRounded,
    path: "/student-dashboard/financials/my-record",
  },
  {
    title: "الملخص المالي",
    icon: PaymentsRounded,
    path: "/student-dashboard/financials/my-summary",
  },
  {
    title: "خطة الباص",
    icon: DirectionsBusRounded,
    path: "/student-dashboard/financials/my-bus",
  },
  {
    title: "رحلاتي",
    icon: RouteRounded,
    path: "/student-dashboard/financials/my-trips",
  },
];

const SectionHeader = ({ title, subtitle, actionLabel, onAction }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.2}>
    <Box>
      <Typography sx={{ color: COLORS.deepNavy, fontSize: "14px", fontWeight: 900 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ mt: 0.2, color: "#99a3ad", fontSize: "8px" }}>
          {subtitle}
        </Typography>
      )}
    </Box>

    {actionLabel && (
      <Button
        onClick={onAction}
        endIcon={<ChevronLeftRounded />}
        sx={{
          color: COLORS.navy,
          fontSize: "9px",
          fontWeight: 800,
          textTransform: "none",
        }}
      >
        {actionLabel}
      </Button>
    )}
  </Stack>
);

const EmptyState = ({ icon: Icon, title, color = "#b7c3ce" }) => (
  <Box sx={{ py: 4, textAlign: "center" }}>
    <Icon sx={{ color, fontSize: 38 }} />
    <Typography
      sx={{
        mt: 0.5,
        color: COLORS.deepNavy,
        fontSize: "10.5px",
        fontWeight: 800,
      }}
    >
      {title}
    </Typography>
  </Box>
);

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { studentProfile, displayName: layoutDisplayName } = outletContext;

  const getAuthUser = useAuthUser();
  const authUser = getAuthUser?.() || null;
  const storedUser = useMemo(() => getStoredUser(), []);

  // كل بيانات الـ Dashboard تأتي من نفس Student hooks
  // المستخدمة في صفحات الطالب نفسها.
  const {
    subjects: studentSubjects = [],
    loading: loadingSubjects,
  } = useStudentSubjects();

  const {
    lectures: studentLectures = [],
    loading: loadingLectures,
  } = useStudentLectures();

  const {
    exams: studentExams = [],
    loading: loadingExams,
  } = useStudentExams();

  const {
    attendance: studentAttendance = [],
    attendanceTotal: apiAttendanceTotal = 0,
    loading: loadingAttendance,
  } = useStudentAttendance();

  const loginUserName = useMemo(
    () => buildFullName(authUser) || buildFullName(storedUser),
    [authUser, storedUser]
  );

  const displayName =
    buildFullName(studentProfile) ||
    layoutDisplayName ||
    loginUserName ||
    "الطالب";

  const firstName = displayName.trim().split(/\s+/)[0];

  const gender = String(studentProfile?.gender || "").toLowerCase();
  const isFemale = ["female", "f", "أنثى", "انثى"].includes(gender);

  const className = getClassName(studentProfile);
  const academicYear = getAcademicYear(studentProfile);

  const subjects = useMemo(
    () => (Array.isArray(studentSubjects) ? studentSubjects : []),
    [studentSubjects]
  );

  const visibleSubjects = useMemo(
    () => subjects.slice(0, 6),
    [subjects]
  );

  const lectures = useMemo(
    () => (Array.isArray(studentLectures) ? studentLectures : []),
    [studentLectures]
  );

  // كل حصص اليوم بدون slice حتى يكون العداد صحيحًا.
  // مثال: لو عند الطالب 5 حصص يوم الثلاثاء سيظهر "5" فعلًا.
  const todayLectures = useMemo(() => {
    const today = new Date().getDay();

    return lectures
      .filter((lecture) => {
        const day = String(lecture?.dayOfWeek || "")
          .trim()
          .toLowerCase();

        return DAYS[day] === today;
      })
      .sort((a, b) => Number(a?.slot || 0) - Number(b?.slot || 0));
  }, [lectures]);

  const exams = useMemo(
    () => (Array.isArray(studentExams) ? studentExams : []),
    [studentExams]
  );

  const upcomingItems = useMemo(
    () =>
      exams
        .filter(isUpcomingExam)
        .sort(
          (a, b) =>
            new Date(a?.startDate || 0).getTime() -
            new Date(b?.startDate || 0).getTime()
        ),
    [exams]
  );

  const upcomingExams = useMemo(
    () =>
      upcomingItems.filter(
        (item) => String(item?.examType || "").toLowerCase() !== "assignment"
      ),
    [upcomingItems]
  );

  const visibleUpcomingExams = useMemo(
    () => upcomingExams.slice(0, 3),
    [upcomingExams]
  );

  const absenceCount = useMemo(() => {
    const total = Number(apiAttendanceTotal);

    if (Number.isFinite(total) && total >= 0) {
      return total;
    }

    return Array.isArray(studentAttendance)
      ? studentAttendance.length
      : 0;
  }, [apiAttendanceTotal, studentAttendance]);

  const nextActivity = useMemo(() => {
    const nextLecture = todayLectures?.[0];

    if (nextLecture) {
      return {
        badge: "حصة اليوم",
        title: getSubjectName(nextLecture),
        description: getTeacherName(nextLecture),
        meta: getSlotLabel(nextLecture),
        icon: ScheduleRounded,
        color: COLORS.blue,
        background: COLORS.blueLight,
        path: "/student-dashboard/schedule",
      };
    }

    const nextItem = upcomingItems?.[0];
    if (!nextItem) return null;

    const isAssignment =
      String(nextItem?.examType || "").toLowerCase() === "assignment";

    return {
      badge: isAssignment ? "واجب قريب" : "اختبار قريب",
      title: getSubjectName(nextItem),
      description: getExamType(nextItem?.examType),
      meta: formatDate(nextItem?.startDate) || "قريباً",
      icon: isAssignment ? TaskAltRounded : AssignmentRounded,
      color: isAssignment ? COLORS.green : COLORS.orange,
      background: isAssignment ? COLORS.greenLight : COLORS.orangeLight,
      path: isAssignment
        ? "/student-dashboard/assignments"
        : "/student-dashboard/exams",
    };
  }, [todayLectures, upcomingItems]);

  const stats = [
    {
      title: "موادي",
      value: subjects.length,
      icon: MenuBookRounded,
      background: COLORS.blueLight,
      color: COLORS.blue,
    },
    {
      title: "حصص اليوم",
      value: todayLectures.length,
      icon: ScheduleRounded,
      background: COLORS.purpleLight,
      color: COLORS.purple,
    },
    {
      title: "اختبارات قادمة",
      value: upcomingExams.length,
      icon: AssignmentRounded,
      background: COLORS.orangeLight,
      color: COLORS.orange,
    },
    {
      title: "سجل الغياب",
      value: absenceCount,
      icon: AccessTimeRounded,
      background: COLORS.redLight,
      color: COLORS.red,
    },
  ];

  const loading =
    loadingSubjects ||
    loadingLectures ||
    loadingExams ||
    loadingAttendance;

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: "26px" }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,1fr)",
              md: "repeat(5,1fr)",
            },
            gap: 1.2,
          }}
        >
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={115}
              sx={{ borderRadius: "19px" }}
            />
          ))}
        </Box>
      </Stack>
    );
  }

  return (
    <Box dir="rtl">
      {/* =====================================================
          HERO
      ===================================================== */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: 165, md: 185 },
          mb: 2.3,
          p: { xs: 2.1, md: 2.8 },
          display: "flex",
          alignItems: "center",
          borderRadius: { xs: "23px", md: "27px" },
          border: "1px solid rgba(36,74,112,.06)",
          background:
            "linear-gradient(120deg,#fff8e8 0%,#fffdf8 45%,#edf6ff 100%)",
          boxShadow: "0 10px 28px rgba(18,47,77,.045)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 210,
            height: 210,
            left: -85,
            top: -115,
            borderRadius: "50%",
            backgroundColor: "rgba(78,141,204,.08)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 150,
            height: 150,
            right: -65,
            bottom: -85,
            borderRadius: "50%",
            backgroundColor: "rgba(211,164,79,.10)",
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ position: "relative", zIndex: 1, width: "100%" }}
        >
          <Box>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <CelebrationRounded sx={{ color: COLORS.gold, fontSize: 19 }} />
              <Typography sx={{ color: "#7f8b96", fontSize: "11px", fontWeight: 700 }}>
                أهلاً يا {firstName}
              </Typography>
            </Stack>

            <Typography
              component="h1"
              sx={{
                mt: 0.55,
                color: COLORS.deepNavy,
                fontSize: { xs: "24px", sm: "28px", md: "32px" },
                lineHeight: 1.25,
                fontWeight: 900,
              }}
            >
              {isFemale ? "جاهزة ليوم دراسي جديد؟" : "جاهز ليوم دراسي جديد؟"} 🚀
            </Typography>

            <Typography
              sx={{
                mt: 0.55,
                color: "#87929d",
                fontSize: { xs: "10px", md: "11px" },
              }}
            >
              تابع حصصك وموادك واختباراتك بسهولة من مكان واحد.
            </Typography>

            <Stack direction="row" sx={{ mt: 1.3, flexWrap: "wrap", gap: 0.7 }}>
              {className && (
                <Chip
                  label={className}
                  size="small"
                  sx={{
                    color: COLORS.navy,
                    backgroundColor: "rgba(36,74,112,.08)",
                    fontWeight: 800,
                    fontSize: "9px",
                  }}
                />
              )}

              {academicYear && (
                <Chip
                  label={`العام الدراسي ${academicYear}`}
                  size="small"
                  sx={{
                    color: "#90651f",
                    backgroundColor: "rgba(211,164,79,.14)",
                    fontWeight: 800,
                    fontSize: "9px",
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* الحصة / الاختبار / الواجب القادم بدل تكرار اللوجو */}
          <Box sx={{ width: { xs: "100%", sm: 235, md: 255 }, flexShrink: 0 }}>
            {nextActivity ? (
              <Paper
                elevation={0}
                onClick={() => navigate(nextActivity.path)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: "22px",
                  backgroundColor: "rgba(255,255,255,.92)",
                  border: "1px solid rgba(36,74,112,.07)",
                  boxShadow: "0 16px 32px rgba(18,47,77,.065)",
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 20px 38px rgba(18,47,77,.09)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Chip
                    label={nextActivity.badge}
                    size="small"
                    sx={{
                      height: 25,
                      color: nextActivity.color,
                      backgroundColor: nextActivity.background,
                      fontSize: "8px",
                      fontWeight: 900,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />

                  <Typography sx={{ color: "#9aa4ae", fontSize: "8px", fontWeight: 700 }}>
                    {nextActivity.meta}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.1} sx={{ mt: 1.3 }}>
                  <Box
                    sx={{
                      width: 43,
                      height: 43,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      borderRadius: "14px",
                      color: nextActivity.color,
                      backgroundColor: nextActivity.background,
                    }}
                  >
                    {(() => {
                      const Icon = nextActivity.icon;
                      return <Icon sx={{ fontSize: 22 }} />;
                    })()}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ color: COLORS.deepNavy, fontSize: "11px", fontWeight: 900 }}
                    >
                      {nextActivity.title}
                    </Typography>
                    <Typography noWrap sx={{ mt: 0.25, color: "#909ba5", fontSize: "8px" }}>
                      {nextActivity.description}
                    </Typography>
                  </Box>

                  <ChevronLeftRounded sx={{ color: "#a3aeb8", fontSize: 19 }} />
                </Stack>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 1.6,
                  borderRadius: "22px",
                  backgroundColor: "rgba(255,255,255,.84)",
                  border: "1px solid rgba(36,74,112,.06)",
                  boxShadow: "0 14px 28px rgba(18,47,77,.05)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "14px",
                      color: COLORS.gold,
                      backgroundColor: "#fff7e5",
                    }}
                  >
                    <CelebrationRounded sx={{ fontSize: 21 }} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{ color: COLORS.deepNavy, fontSize: "10.5px", fontWeight: 900 }}
                    >
                      لا يوجد شيء قريب
                    </Typography>
                    <Typography sx={{ mt: 0.25, color: "#929da7", fontSize: "8px" }}>
                      استمتع بيومك وراجع دروسك ✨
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* =====================================================
          QUICK ACCESS
      ===================================================== */}
      <Typography
        component="h2"
        sx={{
          mb: 1,
          color: COLORS.deepNavy,
          fontSize: { xs: "16px", md: "18px" },
          fontWeight: 900,
        }}
      >
        الوصول السريع
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            sm: "repeat(3,minmax(0,1fr))",
            md: "repeat(5,minmax(0,1fr))",
          },
          gap: 1.2,
          mb: 1.7,
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Paper
              key={action.title}
              elevation={0}
              onClick={() => navigate(action.path)}
              sx={{
                minHeight: 116,
                p: 1.55,
                cursor: "pointer",
                borderRadius: "20px",
                backgroundColor: action.background,
                border: "1px solid rgba(18,47,77,.05)",
                transition: "all .2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 25px rgba(18,47,77,.07)",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  mb: 1,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "14px",
                  color: action.color,
                  backgroundColor: "#fff",
                }}
              >
                <Icon sx={{ fontSize: 23 }} />
              </Box>

              <Typography sx={{ color: COLORS.deepNavy, fontSize: "12px", fontWeight: 900 }}>
                {action.title}
              </Typography>
              <Typography sx={{ mt: 0.2, color: "#87939e", fontSize: "8.5px" }}>
                {action.description}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* =====================================================
          STATS
      ===================================================== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            md: "repeat(4,minmax(0,1fr))",
          },
          gap: 1,
          mb: 2.4,
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Paper
              key={stat.title}
              elevation={0}
              sx={{
                p: 1.15,
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: "16px",
                border: "1px solid rgba(18,47,77,.05)",
                backgroundColor: "#fff",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: "12px",
                  color: stat.color,
                  backgroundColor: stat.background,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>

              <Box>
                <Typography
                  sx={{ color: COLORS.deepNavy, fontSize: "18px", fontWeight: 900, lineHeight: 1 }}
                >
                  {stat.value}
                </Typography>
                <Typography sx={{ mt: 0.4, color: "#929da7", fontSize: "8px" }}>
                  {stat.title}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* =====================================================
          TODAY + EXAMS
      ===================================================== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr .85fr" },
          gap: 1.4,
          mb: 2.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            borderRadius: "22px",
            border: "1px solid rgba(18,47,77,.055)",
            backgroundColor: "#fff",
          }}
        >
          <SectionHeader
            title="📅 جدول اليوم"
            subtitle="حصصك الدراسية اليوم"
            actionLabel="الجدول"
            onAction={() => navigate("/student-dashboard/schedule")}
          />

          {todayLectures.length ? (
            <Stack spacing={0.8}>
              {todayLectures.slice(0, 4).map((lecture, index) => (
                <Box
                  key={lecture?._id || index}
                  sx={{
                    p: 1.05,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "13px",
                    backgroundColor: index === 0 ? "#f4f8fc" : "#fafcfd",
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 68,
                      p: 0.7,
                      textAlign: "center",
                      borderRadius: "10px",
                      color: COLORS.navy,
                      backgroundColor: COLORS.blueLight,
                    }}
                  >
                    <Typography sx={{ fontSize: "8px", fontWeight: 900 }}>
                      {getSlotLabel(lecture)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 3,
                      height: 32,
                      borderRadius: "20px",
                      backgroundColor: index === 0 ? COLORS.gold : "#dfe6ec",
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ color: COLORS.deepNavy, fontSize: "10.5px", fontWeight: 900 }}
                    >
                      {getSubjectName(lecture)}
                    </Typography>
                    <Typography noWrap sx={{ mt: 0.15, color: "#99a3ad", fontSize: "8px" }}>
                      {getTeacherName(lecture)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState icon={CalendarMonthRounded} title="لا توجد حصص اليوم" />
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            borderRadius: "22px",
            border: "1px solid rgba(18,47,77,.055)",
            backgroundColor: "#fff",
          }}
        >
          <SectionHeader
            title="📝 الاختبارات القادمة"
            subtitle="استعد لاختباراتك"
            actionLabel="الكل"
            onAction={() => navigate("/student-dashboard/exams")}
          />

          {visibleUpcomingExams.length ? (
            <Stack spacing={0.8}>
              {visibleUpcomingExams.map((exam, index) => (
                <Box
                  key={exam?._id || index}
                  onClick={() => navigate("/student-dashboard/exams")}
                  sx={{
                    p: 1.05,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    borderRadius: "13px",
                    backgroundColor: "#fafcfd",
                    "&:hover": { backgroundColor: "#f5f8fb" },
                  }}
                >
                  <Box
                    sx={{
                      width: 39,
                      height: 39,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "12px",
                      color: COLORS.orange,
                      backgroundColor: COLORS.orangeLight,
                    }}
                  >
                    <AssignmentRounded sx={{ fontSize: 20 }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ color: COLORS.deepNavy, fontSize: "10px", fontWeight: 900 }}
                    >
                      {getSubjectName(exam)}
                    </Typography>
                    <Typography sx={{ mt: 0.15, color: "#99a3ad", fontSize: "8px" }}>
                      {getExamType(exam?.examType)}
                    </Typography>
                  </Box>

                  <Typography sx={{ color: COLORS.orange, fontSize: "8px", fontWeight: 900 }}>
                    {formatDate(exam?.startDate)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              icon={TaskAltRounded}
              title="لا توجد اختبارات قادمة"
              color={COLORS.green}
            />
          )}
        </Paper>
      </Box>

      {/* =====================================================
          SUBJECTS
      ===================================================== */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography
            sx={{
              color: COLORS.deepNavy,
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: 900,
            }}
          >
            موادي الدراسية
          </Typography>
          <Typography sx={{ color: "#98a2ac", fontSize: "8px" }}>
            المواد المسجلة لك
          </Typography>
        </Box>

        <Button
          onClick={() => navigate("/student-dashboard/subjects")}
          endIcon={<ChevronLeftRounded />}
          sx={{
            color: COLORS.navy,
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          كل المواد
        </Button>
      </Stack>

      {subjects.length ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              sm: "repeat(3,minmax(0,1fr))",
              md: "repeat(4,minmax(0,1fr))",
            },
            gap: 1.1,
            mb: 2.5,
          }}
        >
          {visibleSubjects.map((subject, index) => {
            const styles = [
              { background: COLORS.blueLight, color: COLORS.blue },
              { background: COLORS.greenLight, color: COLORS.green },
              { background: COLORS.orangeLight, color: COLORS.orange },
              { background: COLORS.purpleLight, color: COLORS.purple },
            ];

            const style = styles[index % styles.length];

            return (
              <Paper
                key={subject?._id || index}
                elevation={0}
                onClick={() => navigate("/student-dashboard/subjects")}
                sx={{
                  p: 1.5,
                  minHeight: 120,
                  cursor: "pointer",
                  borderRadius: "19px",
                  border: "1px solid rgba(18,47,77,.05)",
                  backgroundColor: "#fff",
                  transition: "all .2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 26px rgba(18,47,77,.07)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    mb: 1,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "13px",
                    color: style.color,
                    backgroundColor: style.background,
                  }}
                >
                  <MenuBookRounded sx={{ fontSize: 21 }} />
                </Box>

                <Typography
                  noWrap
                  sx={{ color: COLORS.deepNavy, fontSize: "11px", fontWeight: 900 }}
                >
                  {getSubjectName(subject)}
                </Typography>
                <Typography noWrap sx={{ mt: 0.3, color: "#9ba5ae", fontSize: "8px" }}>
                  {getSubjectCode(subject) || "مادة دراسية"}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            py: 4,
            mb: 2.5,
            textAlign: "center",
            borderRadius: "20px",
            backgroundColor: "#fff",
            border: "1px dashed rgba(36,74,112,.15)",
          }}
        >
          <AutoStoriesRounded sx={{ color: "#b2bec9", fontSize: 38 }} />
          <Typography
            sx={{ mt: 0.5, color: COLORS.deepNavy, fontSize: "10px", fontWeight: 800 }}
          >
            لا توجد مواد مسجلة حاليًا
          </Typography>
        </Paper>
      )}

      {/* =====================================================
          MORE
      ===================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: 1.6,
          borderRadius: "21px",
          border: "1px solid rgba(18,47,77,.05)",
          backgroundColor: "#fff",
        }}
      >
        <Typography sx={{ mb: 1, color: COLORS.deepNavy, fontSize: "13px", fontWeight: 900 }}>
          المزيد
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
            gap: 0.8,
          }}
        >
          {MORE_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Box
                key={action.title}
                onClick={() => navigate(action.path)}
                sx={{
                  p: 1.1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  borderRadius: "13px",
                  backgroundColor: "#f7f9fb",
                  "&:hover": { backgroundColor: "#eef4f8" },
                }}
              >
                <Box
                  sx={{
                    width: 37,
                    height: 37,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "11px",
                    color: COLORS.navy,
                    backgroundColor: "#fff",
                  }}
                >
                  <Icon sx={{ fontSize: 19 }} />
                </Box>

                <Typography sx={{ flex: 1, color: COLORS.deepNavy, fontSize: "10px", fontWeight: 800 }}>
                  {action.title}
                </Typography>

                <ChevronLeftRounded sx={{ color: "#a7b2bc", fontSize: 18 }} />
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentDashboardPage;
