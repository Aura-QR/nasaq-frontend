import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  CalendarMonthRounded,
  CheckCircleRounded,
  EventAvailableRounded,
  GroupsRounded,
  HowToRegRounded,
  MenuBookRounded,
  RefreshRounded,
  ScheduleRounded,
  SearchRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

import { fetchLectures } from "@/APIs/school/lectures";
import { fetchPreparations } from "@/APIs/school/preparation";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const DAYS = [
  {
    key: "sunday",
    label: "الأحد",
    shortLabel: "أحد",
    jsDay: 0,
    aliases: ["sunday", "sun", "الأحد", "الاحد"],
  },
  {
    key: "monday",
    label: "الاثنين",
    shortLabel: "اثنين",
    jsDay: 1,
    aliases: ["monday", "mon", "الإثنين", "الاثنين"],
  },
  {
    key: "tuesday",
    label: "الثلاثاء",
    shortLabel: "ثلاثاء",
    jsDay: 2,
    aliases: ["tuesday", "tue", "الثلاثاء"],
  },
  {
    key: "wednesday",
    label: "الأربعاء",
    shortLabel: "أربعاء",
    jsDay: 3,
    aliases: ["wednesday", "wed", "الأربعاء", "الاربعاء"],
  },
  {
    key: "thursday",
    label: "الخميس",
    shortLabel: "خميس",
    jsDay: 4,
    aliases: ["thursday", "thu", "الخميس"],
  },
  {
    key: "friday",
    label: "الجمعة",
    shortLabel: "جمعة",
    jsDay: 5,
    aliases: ["friday", "fri", "الجمعة"],
  },
  {
    key: "saturday",
    label: "السبت",
    shortLabel: "سبت",
    jsDay: 6,
    aliases: ["saturday", "sat", "السبت"],
  },
];

const SLOT_LABELS = {
  1: "الحصة الأولى",
  2: "الحصة الثانية",
  3: "الحصة الثالثة",
  4: "الحصة الرابعة",
  5: "الحصة الخامسة",
  6: "الحصة السادسة",
  7: "الحصة السابعة",
  8: "الحصة الثامنة",
  9: "الحصة التاسعة",
  10: "الحصة العاشرة",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const isMongoId = (value) =>
  /^[a-f\d]{24}$/i.test(normalizeId(value));

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "");

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

const extractCollection = (response, extraKeys = []) => {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.docs,
    payload.items,
    payload.results,
    payload.records,
    payload.lectures,
    payload.preparations,
    payload.data,
    ...extraKeys.map((key) => payload?.[key]),
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

const resolveTeacherId = (authRoot, currentUser) => {
  const candidates = [
    authRoot?.teacherId,
    authRoot?.teacher,
    authRoot?.profile,
    authRoot?.user?.teacherId,
    authRoot?.user?.teacher,
    currentUser?.teacherId,
    currentUser?.teacher,
    currentUser?.profile,
    currentUser?._id,
    currentUser?.id,
  ];

  return candidates.map(normalizeId).find(isMongoId) || "";
};

const getLectureId = (lecture) => normalizeId(lecture);

const getClassEntity = (lecture) => {
  const value =
    lecture?.class ||
    lecture?.classId ||
    lecture?.classroom ||
    lecture?.schoolClass ||
    null;

  return value && typeof value === "object" ? value : null;
};

const getClassId = (lecture) =>
  normalizeId(
    lecture?.class ||
      lecture?.classId ||
      lecture?.classroom ||
      lecture?.schoolClass
  );

const getClassLabel = (lecture) => {
  const classEntity = getClassEntity(lecture);

  if (!classEntity) return "فصل غير محدد";

  const gradeName = String(
    classEntity?.gradeLevelId?.name ||
      classEntity?.gradeLevel?.name ||
      classEntity?.gradeName ||
      ""
  ).trim();

  const roomNumber = String(
    classEntity?.roomNumber || ""
  ).trim();

  const explicitName = String(
    classEntity?.className ||
      classEntity?.title ||
      classEntity?.displayName ||
      ""
  ).trim();

  const roomLabel = roomNumber
    ? `فصل ${roomNumber}`
    : explicitName;

  return (
    [gradeName, roomLabel].filter(Boolean).join(" - ") ||
    "فصل غير محدد"
  );
};

const getSubjectEntity = (lecture) => {
  const offering =
    lecture?.subjectOffering ||
    lecture?.subjectOfferingId ||
    null;

  return (
    lecture?.subject ||
    lecture?.subjectId ||
    offering?.subject ||
    offering?.subjectId ||
    null
  );
};

const getSubjectData = (lecture) => {
  const subject = getSubjectEntity(lecture);
  const offering =
    lecture?.subjectOffering ||
    lecture?.subjectOfferingId ||
    null;

  const name = String(
    subject?.name ||
      subject?.title ||
      subject?.subjectName ||
      lecture?.subjectName ||
      offering?.subjectName ||
      "مادة غير محددة"
  ).trim();

  const code = String(
    subject?.subjectCode ||
      subject?.code ||
      lecture?.subjectCode ||
      offering?.subjectCode ||
      ""
  ).trim();

  return {
    id: normalizeId(subject) || normalizeId(offering),
    name,
    code,
    label: code ? `${name} - ${code}` : name,
  };
};

const getSlotNumber = (lecture) => {
  const value = Number(
    lecture?.slot ||
      lecture?.period ||
      lecture?.slotNumber
  );

  return Number.isFinite(value) ? value : 0;
};

const getSlotLabel = (lecture) => {
  const slot = getSlotNumber(lecture);
  return SLOT_LABELS[slot] || (slot ? `الحصة ${slot}` : "حصة");
};

const getLectureDayKey = (lecture) => {
  const value = normalizeText(
    lecture?.dayOfWeek || lecture?.day
  );

  return (
    DAYS.find((day) =>
      day.aliases.some(
        (alias) => normalizeText(alias) === value
      )
    )?.key || ""
  );
};

const getPreparationLectureId = (preparation) =>
  normalizeId(
    preparation?.lecture ||
      preparation?.lectureId
  );

const getPreparationId = (preparation) =>
  normalizeId(preparation);

const formatLocalDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const getStartOfWeek = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getDateForDay = (weekStart, jsDay) => {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + jsDay);
  return date;
};

const formatDayDate = (date) =>
  new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);

const formatWeekRange = (weekStart) => {
  const weekEnd = getDateForDay(weekStart, 6);
  const formatter = new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(weekStart)} — ${formatter.format(weekEnd)}`;
};

const loadPreparationsForTeacher = async (
  teacherId,
  lectures
) => {
  const mainResponse = await fetchPreparations({
    teacherId,
    limit: 500,
  });

  let list = isFailedResponse(mainResponse)
    ? []
    : extractCollection(mainResponse, ["preparations"]);

  if (list.length > 0 || lectures.length === 0) {
    return list;
  }

  const results = await Promise.allSettled(
    lectures.map(async (lecture) => {
      const lectureId = getLectureId(lecture);
      if (!lectureId) return [];

      const response = await fetchPreparations({
        lectureId,
        limit: 10,
      });

      const primary = isFailedResponse(response)
        ? []
        : extractCollection(response, ["preparations"]);

      if (primary.length > 0) return primary;

      const legacyResponse = await fetchPreparations({
        lecture: lectureId,
        limit: 10,
      });

      return isFailedResponse(legacyResponse)
        ? []
        : extractCollection(legacyResponse, ["preparations"]);
    })
  );

  list = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return list;
};

const StatCard = ({ icon, title, value, helper, tone = "blue" }) => {
  const tones = {
    blue: {
      iconBg: "#eef3f8",
      iconColor: "#1f4f78",
    },
    green: {
      iconBg: "#e7f4ed",
      iconColor: "#16845f",
    },
    gold: {
      iconBg: "#fff3d8",
      iconColor: "#b67a14",
    },
    red: {
      iconBg: "#fdecec",
      iconColor: "#c64343",
    },
  };

  const palette = tones[tone] || tones.blue;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.4,
        borderColor: "#e3e9ef",
        p: { xs: 1, md: 1.05 },
        minHeight: 78,
        boxShadow: "0 10px 24px rgba(25, 58, 86, 0.045)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Box sx={{ textAlign: "right", minWidth: 0 }}>
          <Typography
            sx={{
              color: "#78879a",
              fontWeight: 800,
              fontSize: 11,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: "#082a4b",
              fontWeight: 900,
              fontSize: 21,
              lineHeight: 1.25,
              mt: 0.2,
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              color: "#a0aaba",
              fontSize: 9.75,
              mt: 0.15,
            }}
          >
            {helper}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.2,
            display: "grid",
            placeItems: "center",
            bgcolor: palette.iconBg,
            color: palette.iconColor,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "grid", placeItems: "center", "& svg": { fontSize: 19 } }}>
            {icon}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

const TeacherSchedule = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const teacherId = resolveTeacherId(authRoot, currentUser);

  const [lectures, setLectures] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [preparationFilter, setPreparationFilter] = useState("all");

  const loadSchedule = useCallback(
    async ({ silent = false } = {}) => {
      if (!teacherId) {
        setLectures([]);
        setPreparations([]);
        setError(
          "تعذر تحديد حساب المعلم الحالي. سجّل الدخول مرة أخرى."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const lectureResponse = await fetchLectures(
          {
            teacherId,
            page: 1,
            limit: 500,
          },
          {
            force: true,
          }
        );

        if (isFailedResponse(lectureResponse)) {
          throw new Error(
            getErrorMessage(
              lectureResponse,
              "تعذر تحميل جدول المعلم"
            )
          );
        }

        const lectureList = extractCollection(
          lectureResponse,
          ["lectures"]
        );

        const preparationList =
          await loadPreparationsForTeacher(
            teacherId,
            lectureList
          );

        setLectures(lectureList);
        setPreparations(preparationList);
      } catch (requestError) {
        setLectures([]);
        setPreparations([]);
        setError(
          requestError?.message ||
            requestError?.response?.data?.message ||
            "حدث خطأ أثناء تحميل الجدول"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const preparationByLecture = useMemo(() => {
    const map = new Map();

    preparations.forEach((preparation) => {
      const lectureId = getPreparationLectureId(preparation);

      if (lectureId && !map.has(lectureId)) {
        map.set(lectureId, preparation);
      }
    });

    return map;
  }, [preparations]);

  const enrichedLectures = useMemo(
    () =>
      lectures
        .map((lecture) => ({
          ...lecture,
          scheduleDayKey: getLectureDayKey(lecture),
          scheduleSubject: getSubjectData(lecture),
          scheduleClassId: getClassId(lecture),
          scheduleClassLabel: getClassLabel(lecture),
          scheduleSlot: getSlotNumber(lecture),
          schedulePreparation:
            preparationByLecture.get(getLectureId(lecture)) || null,
        }))
        .filter((lecture) => lecture.scheduleDayKey),
    [lectures, preparationByLecture]
  );

  const subjectOptions = useMemo(() => {
    const map = new Map();

    enrichedLectures.forEach((lecture) => {
      const subject = lecture.scheduleSubject;
      const key = subject.id || subject.label;
      if (key && !map.has(key)) map.set(key, subject);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "ar")
    );
  }, [enrichedLectures]);

  const classOptions = useMemo(() => {
    const map = new Map();

    enrichedLectures.forEach((lecture) => {
      const id = lecture.scheduleClassId;
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          label: lecture.scheduleClassLabel,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "ar")
    );
  }, [enrichedLectures]);

  const filteredLectures = useMemo(() => {
    const query = normalizeText(search);

    return enrichedLectures.filter((lecture) => {
      const subject = lecture.scheduleSubject;
      const hasPreparation = Boolean(
        getPreparationId(lecture.schedulePreparation)
      );

      if (
        subjectFilter &&
        subject.id !== subjectFilter &&
        subject.label !== subjectFilter
      ) {
        return false;
      }

      if (
        classFilter &&
        lecture.scheduleClassId !== classFilter
      ) {
        return false;
      }

      if (
        preparationFilter === "prepared" &&
        !hasPreparation
      ) {
        return false;
      }

      if (
        preparationFilter === "unprepared" &&
        hasPreparation
      ) {
        return false;
      }

      if (!query) return true;

      return [
        subject.name,
        subject.code,
        subject.label,
        lecture.scheduleClassLabel,
        getSlotLabel(lecture),
      ].some((value) => normalizeText(value).includes(query));
    });
  }, [
    enrichedLectures,
    search,
    subjectFilter,
    classFilter,
    preparationFilter,
  ]);

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => getStartOfWeek(today), [today]);
  const todayKey = DAYS.find(
    (day) => day.jsDay === today.getDay()
  )?.key;

  const visibleDays = useMemo(() => {
    const base = DAYS.slice(0, 5);
    const extra = DAYS.slice(5).filter((day) =>
      enrichedLectures.some(
        (lecture) => lecture.scheduleDayKey === day.key
      )
    );

    return [...base, ...extra];
  }, [enrichedLectures]);

  const lecturesByDay = useMemo(() => {
    const map = new Map(
      visibleDays.map((day) => [day.key, []])
    );

    filteredLectures.forEach((lecture) => {
      if (!map.has(lecture.scheduleDayKey)) return;
      map.get(lecture.scheduleDayKey).push(lecture);
    });

    map.forEach((items) =>
      items.sort((a, b) => a.scheduleSlot - b.scheduleSlot)
    );

    return map;
  }, [filteredLectures, visibleDays]);

  const preparedCount = enrichedLectures.filter((lecture) =>
    Boolean(getPreparationId(lecture.schedulePreparation))
  ).length;

  const todayLectures = enrichedLectures.filter(
    (lecture) => lecture.scheduleDayKey === todayKey
  );

  const openAttendance = (lecture, day) => {
    const classId = lecture.scheduleClassId;
    const dayDate = getDateForDay(weekStart, day.jsDay);
    const params = new URLSearchParams({
      date: formatLocalDate(dayDate),
    });

    if (classId) params.set("classId", classId);

    navigate(`/teacher/attendance?${params.toString()}`);
  };

  const openPreparation = (lecture) => {
    const lectureId = getLectureId(lecture);
    const hasPreparation = Boolean(
      getPreparationId(lecture.schedulePreparation)
    );

    if (hasPreparation) {
      navigate("/school/preparation");
      return;
    }

    navigate(
      `/school/preparation/add?lectureId=${lectureId}`
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setClassFilter("");
    setPreparationFilter("all");
  };

  return (
    <Box
      dir="rtl"
      sx={{
        bgcolor: "#fff",
        px: { xs: 1, md: 2 },
        py: { xs: 1, md: 1.25 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 2.6, md: 3 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f64 0%, #245b86 58%, #2d6b99 100%)",
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.1, md: 1.2 },
            mb: 1.2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              insetInlineStart: -70,
              top: -105,
              width: 250,
              height: 250,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.09)",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={1.2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Box
                sx={{
                  width: { xs: 44, md: 48 },
                  height: { xs: 44, md: 48 },
                  borderRadius: 2,
                  bgcolor: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: "0 8px 18px rgba(8, 32, 54, .15)",
                }}
              >
                <Box
                  component="img"
                  src={nasaqLogo}
                  alt="نسق"
                  sx={{
                    width: "78%",
                    height: "78%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box>
                <Chip
                  size="small"
                  label="بوابة المعلم"
                  icon={<ScheduleRounded />}
                  sx={{
                    mb: 0.35,
                    bgcolor: "rgba(255, 216, 128, .13)",
                    color: "#ffdc8e",
                    border: "1px solid rgba(255, 220, 142, .28)",
                    fontWeight: 900,
                    fontSize: 10.5,
                    height: 25,
                    "& .MuiChip-icon": { color: "#ffdc8e", fontSize: 16 },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: 21, md: 25 },
                    fontWeight: 900,
                    lineHeight: 1.05,
                  }}
                >
                  جدولي الدراسي
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.75)",
                    mt: 0.3,
                    fontSize: { xs: 10, md: 10.75 },
                  }}
                >
                  تابع حصص الأسبوع والتحضيرات والحضور من مكان واحد
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackRounded />}
                onClick={() => navigate("/teacher/dashboard")}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.28)",
                  borderRadius: 1.8,
                  px: 1.45,
                  minHeight: 34,
                  fontSize: 11.5,
                  fontWeight: 900,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,.55)",
                    bgcolor: "rgba(255,255,255,.06)",
                  },
                }}
              >
                لوحة التحكم
              </Button>

              <Tooltip title="تحديث الجدول">
                <span>
                  <IconButton
                    onClick={() =>
                      loadSchedule({ silent: true })
                    }
                    disabled={refreshing}
                    sx={{
                      width: 34,
                      height: 34,
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,.28)",
                      borderRadius: 1.8,
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
            </Stack>
          </Stack>
        </Paper>

        {error ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => loadSchedule()}
              >
                إعادة المحاولة
              </Button>
            }
            sx={{ mb: 2, borderRadius: 2.5 }}
          >
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
            mb: 1.15,
          }}
        >
          <StatCard
            title="إجمالي الحصص"
            value={enrichedLectures.length}
            helper="في جدولك الأسبوعي"
            icon={<ScheduleRounded />}
          />
          <StatCard
            title="حصص اليوم"
            value={todayLectures.length}
            helper={
              todayLectures.length
                ? "الحصص المجدولة اليوم"
                : "لا توجد حصص اليوم"
            }
            icon={<CalendarMonthRounded />}
            tone="green"
          />
          <StatCard
            title="حصص محضّرة"
            value={preparedCount}
            helper={`${Math.max(
              enrichedLectures.length - preparedCount,
              0
            )} تحتاج تحضير`}
            icon={<EventAvailableRounded />}
            tone="gold"
          />
          <StatCard
            title="فصول مرتبطة"
            value={classOptions.length}
            helper="الفصول الموجودة في جدولك"
            icon={<GroupsRounded />}
            tone="blue"
          />
        </Box>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            borderColor: "#e5ebf0",
            p: 0.8,
            mb: 1.15,
            "& .MuiInputBase-root": {
              minHeight: 38,
              fontSize: 11.5,
            },
            "& .MuiInputLabel-root": {
              fontSize: 11,
            },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(240px, 1fr) 180px 180px 170px",
              },
              gap: 0.75,
            }}
          >
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالمادة أو الفصل أو رقم الحصة"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#7d8794" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="المادة"
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              size="small"
            >
              <MenuItem value="">كل المواد</MenuItem>
              {subjectOptions.map((subject) => (
                <MenuItem
                  key={subject.id || subject.label}
                  value={subject.id || subject.label}
                >
                  {subject.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="الفصل"
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              size="small"
            >
              <MenuItem value="">كل الفصول</MenuItem>
              {classOptions.map((classItem) => (
                <MenuItem key={classItem.id} value={classItem.id}>
                  {classItem.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="حالة التحضير"
              value={preparationFilter}
              onChange={(event) =>
                setPreparationFilter(event.target.value)
              }
              size="small"
            >
              <MenuItem value="all">كل الحصص</MenuItem>
              <MenuItem value="prepared">تم التحضير</MenuItem>
              <MenuItem value="unprepared">تحتاج تحضير</MenuItem>
            </TextField>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.8,
            borderColor: "#e5ebf0",
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{
              px: { xs: 1.2, md: 1.4 },
              py: 0.7,
              borderBottom: "1px solid #e9edf2",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#082a4b",
                  fontWeight: 900,
                  fontSize: 15,
                }}
              >
                الجدول الأسبوعي
              </Typography>
              <Typography sx={{ color: "#98a3b2", fontSize: 10.5 }}>
                {formatWeekRange(weekStart)}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<CalendarMonthRounded />}
                label={`اليوم: ${
                  DAYS.find((day) => day.key === todayKey)?.label || ""
                }`}
                sx={{
                  bgcolor: "#edf5fb",
                  color: "#1f527c",
                  fontWeight: 800,
                  "& .MuiChip-icon": { color: "#1f527c" },
                }}
              />

              {(search ||
                subjectFilter ||
                classFilter ||
                preparationFilter !== "all") && (
                <Button
                  size="small"
                  onClick={clearFilters}
                  sx={{ fontWeight: 800 }}
                >
                  مسح الفلاتر
                </Button>
              )}
            </Stack>
          </Stack>

          {loading ? (
            <Box
              sx={{
                minHeight: 190,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <CircularProgress size={28} />
                <Typography sx={{ color: "#8c98a8", fontSize: 11.5 }}>
                  جاري تحميل جدولك...
                </Typography>
              </Stack>
            </Box>
          ) : enrichedLectures.length === 0 ? (
            <Box
              sx={{
                minHeight: 190,
                display: "grid",
                placeItems: "center",
                px: 2,
                textAlign: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 3,
                    bgcolor: "#fff3d8",
                    color: "#b67a14",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ScheduleRounded sx={{ fontSize: 28 }} />
                </Box>
                <Typography sx={{ color: "#082a4b", fontWeight: 900 }}>
                  لا توجد حصص مرتبطة بحسابك
                </Typography>
                <Typography sx={{ color: "#98a3b2", fontSize: 11.5 }}>
                  راجع إسنادات المعلم والجدول من حساب الإدارة.
                </Typography>
              </Stack>
            </Box>
          ) : filteredLectures.length === 0 ? (
            <Box
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                px: 2,
                textAlign: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <WarningAmberRounded
                  sx={{ fontSize: 31, color: "#ba821f" }}
                />
                <Typography sx={{ color: "#082a4b", fontWeight: 900 }}>
                  لا توجد حصص مطابقة للفلاتر
                </Typography>
                <Button onClick={clearFilters}>عرض الجدول كاملًا</Button>
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: `repeat(${Math.min(
                    visibleDays.length,
                    5
                  )}, minmax(0, 1fr))`,
                },
                gap: 0.65,
                p: { xs: 0.7, md: 0.75 },
                alignItems: "start",
              }}
            >
              {visibleDays.map((day) => {
                const dayDate = getDateForDay(weekStart, day.jsDay);
                const dayLectures = lecturesByDay.get(day.key) || [];
                const isToday = day.key === todayKey;

                return (
                  <Paper
                    key={day.key}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.3,
                      overflow: "hidden",
                      borderColor: isToday ? "#2f6f9f" : "#e3e8ee",
                      boxShadow: isToday
                        ? "0 7px 18px rgba(34, 91, 134, .08)"
                        : "none",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 0.85,
                        py: 0.55,
                        bgcolor: isToday ? "#214f77" : "#f7f9fb",
                        color: isToday ? "#fff" : "#173d60",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 12.75 }}>
                          {day.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: isToday
                              ? "rgba(255,255,255,.72)"
                              : "#9aa6b5",
                            fontSize: 9.75,
                          }}
                        >
                          {formatDayDate(dayDate)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={`${dayLectures.length} حصة`}
                        sx={{
                          bgcolor: isToday
                            ? "rgba(255,255,255,.13)"
                            : "#e9eef3",
                          color: isToday ? "#fff" : "#315571",
                          fontWeight: 900,
                          fontSize: 9,
                          height: 21,
                        }}
                      />
                    </Stack>

                    <Stack spacing={0.5} sx={{ p: 0.55 }}>
                      {dayLectures.length === 0 ? (
                        <Box
                          sx={{
                            minHeight: 66,
                            display: "grid",
                            placeItems: "center",
                            textAlign: "center",
                            color: "#a4aebb",
                          }}
                        >
                          <Box>
                            <CalendarMonthRounded sx={{ fontSize: 23 }} />
                            <Typography sx={{ fontSize: 10.5, mt: 0.2 }}>
                              لا توجد حصص
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        dayLectures.map((lecture) => {
                          const lectureId = getLectureId(lecture);
                          const hasPreparation = Boolean(
                            getPreparationId(
                              lecture.schedulePreparation
                            )
                          );

                          return (
                            <Paper
                              key={lectureId}
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                borderColor: hasPreparation
                                  ? "#dcebe3"
                                  : "#f0dfbb",
                                bgcolor: hasPreparation
                                  ? "#fbfefc"
                                  : "#fffcf6",
                                p: 0.65,
                              }}
                            >
                              <Stack spacing={0.45}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  spacing={1}
                                >
                                  <Chip
                                    size="small"
                                    label={getSlotLabel(lecture)}
                                    sx={{
                                      bgcolor: "#eef3f7",
                                      color: "#284f6d",
                                      fontWeight: 900,
                                      fontSize: 8.75,
                                    }}
                                  />

                                  <Chip
                                    size="small"
                                    icon={
                                      hasPreparation ? (
                                        <CheckCircleRounded />
                                      ) : (
                                        <WarningAmberRounded />
                                      )
                                    }
                                    label={
                                      hasPreparation
                                        ? "تم التحضير"
                                        : "تحتاج تحضير"
                                    }
                                    sx={{
                                      bgcolor: hasPreparation
                                        ? "#e7f4ed"
                                        : "#fff0d0",
                                      color: hasPreparation
                                        ? "#19825f"
                                        : "#a86d0e",
                                      fontWeight: 900,
                                      fontSize: 8.75,
                                      "& .MuiChip-icon": {
                                        color: "inherit",
                                      },
                                    }}
                                  />
                                </Stack>

                                <Box>
                                  <Typography
                                    sx={{
                                      color: "#082a4b",
                                      fontWeight: 900,
                                      fontSize: 11.75,
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {lecture.scheduleSubject.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "#8d99a8",
                                      fontSize: 9.75,
                                      mt: 0.15,
                                    }}
                                  >
                                    {lecture.scheduleClassLabel}
                                  </Typography>
                                </Box>

                                <Stack
                                  direction="row"
                                  spacing={0.45}
                                  sx={{ pt: 0.15 }}
                                >
                                  <Button
                                    fullWidth
                                    size="small"
                                    variant={
                                      hasPreparation
                                        ? "outlined"
                                        : "contained"
                                    }
                                    startIcon={<MenuBookRounded />}
                                    onClick={() =>
                                      openPreparation(lecture)
                                    }
                                    sx={{
                                      borderRadius: 1.8,
                                      fontWeight: 900,
                                      fontSize: 8.75,
                                      bgcolor: hasPreparation
                                        ? undefined
                                        : "#c89027",
                                      "&:hover": {
                                        bgcolor: hasPreparation
                                          ? undefined
                                          : "#ad7718",
                                      },
                                    }}
                                  >
                                    {hasPreparation
                                      ? "فتح التحضير"
                                      : "إضافة تحضير"}
                                  </Button>

                                  <Tooltip title="تسجيل الحضور">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        openAttendance(lecture, day)
                                      }
                                      sx={{
                                        border: "1px solid #d9e2ea",
                                        borderRadius: 1.5,
                                        width: 28,
                                        height: 28,
                                        color: "#1d5d86",
                                      }}
                                    >
                                      <HowToRegRounded fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </Stack>
                            </Paper>
                          );
                        })
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default TeacherSchedule;
