import {
  AddRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  FilterAltOffRounded,
  MenuBookRounded,
  RefreshRounded,
  ScheduleRounded,
  SearchRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import nasaqLogo from "@/images/wadq-logo.png";
import {
  deletePreparation,
  fetchPreparations,
} from "@/APIs/school/preparation";
import {
  fetchLectures,
  fetchSingleLecture,
} from "@/APIs/school/lectures";
import {
  fetchSingleSubjectOffering,
} from "@/APIs/school/subjectOfferings";
import {
  fetchSingleSubject,
} from "@/APIs/school/subjects";
import { TEACHER_UI } from "@/shared/ui/teacherUi";

const COLORS = {
  navy: "#173f65",
  navyDark: "#122f4d",
  navySoft: "#eef3f7",
  gold: "#c89224",
  goldSoft: "#fff3d8",
  green: "#18865d",
  greenSoft: "#eaf7f1",
  red: "#d14343",
  redSoft: "#fff0f0",
  muted: "#8996a5",
  border: "#e1e7ec",
  page: "#ffffff",
};

const DAYS = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
  الأحد: "الأحد",
  الاثنين: "الاثنين",
  الثلاثاء: "الثلاثاء",
  الأربعاء: "الأربعاء",
  الخميس: "الخميس",
  الجمعة: "الجمعة",
  السبت: "السبت",
};

const SLOT_LABELS = {
  1: "الحصة الأولى",
  2: "الحصة الثانية",
  3: "الحصة الثالثة",
  4: "الحصة الرابعة",
  5: "الحصة الخامسة",
  6: "الحصة السادسة",
  7: "الحصة السابعة",
  8: "الحصة الثامنة",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const extractCollection = (response, extraKeys = []) => {
  let current = response;

  for (let index = 0; index < 5; index += 1) {
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

  if (Array.isArray(current)) return current;
  if (!current || typeof current !== "object") return [];

  const keys = [
    ...extraKeys,
    "items",
    "docs",
    "results",
    "records",
    "lectures",
    "preparations",
  ];

  for (const key of keys) {
    if (Array.isArray(current?.[key])) return current[key];
  }

  return [];
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const resolveTeacherId = (authState) => {
  const user = authState?.user || authState || {};
  const candidates = [
    authState?.teacherId,
    authState?.teacher,
    authState?.profile,
    authState?.user?.teacherId,
    authState?.user?.teacher,
    user?.teacherId,
    user?.teacher,
    user?.profile,
    user?._id,
    user?.id,
  ];

  return candidates.map(normalizeId).find(Boolean) || "";
};

const getLectureId = (lecture) => normalizeId(lecture);

const getPreparationId = (preparation) => normalizeId(preparation);

const getPreparationLectureId = (preparation) =>
  normalizeId(preparation?.lecture || preparation?.lectureId);

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const subjectCache = new Map();
const subjectPending = new Map();

const getSubjectOffering = (lecture) => {
  const candidates = [
    lecture?.subjectOffering,
    lecture?.subjectOfferingId,
    lecture?.offering,
    lecture?.offeringId,
  ];

  return candidates.find(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  ) || {};
};

const getSubjectEntity = (lecture) => {
  const offering = getSubjectOffering(lecture);
  const candidates = [
    lecture?.subject,
    lecture?.subjectId,
    lecture?.subjectData,
    lecture?.subjectDetails,
    lecture?.subjectEntity,
    offering?.subject,
    offering?.subjectId,
    offering?.subjectData,
    offering?.subjectDetails,
    offering?.subjectEntity,
  ];

  return candidates.find(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  ) || {};
};

const getSubjectId = (lecture) => {
  const offering = getSubjectOffering(lecture);
  const candidates = [
    lecture?.subject,
    lecture?.subjectId,
    lecture?.subjectData,
    lecture?.subjectDetails,
    lecture?.subjectEntity,
    offering?.subject,
    offering?.subjectId,
    offering?.subjectData,
    offering?.subjectDetails,
    offering?.subjectEntity,
  ];

  return candidates.map(normalizeId).find(Boolean) || "";
};

const getSubject = (lecture) => {
  const offering = getSubjectOffering(lecture);
  const subject = getSubjectEntity(lecture);

  const name = String(
    subject?.subjectName ||
      subject?.fullName ||
      subject?.name ||
      subject?.title ||
      subject?.label ||
      lecture?.subjectName ||
      lecture?.subjectTitle ||
      offering?.subjectName ||
      offering?.subjectTitle ||
      offering?.name ||
      ""
  ).trim();

  const code = String(
    subject?.subjectCode ||
      subject?.code ||
      lecture?.subjectCode ||
      offering?.subjectCode ||
      offering?.code ||
      ""
  ).trim();

  return {
    name: name || "مادة غير محددة",
    code,
  };
};

const hasResolvedSubject = (lecture) =>
  getSubject(lecture).name !== "مادة غير محددة";

const extractEntity = (response, keys = []) => {
  let current = response;

  for (let index = 0; index < 5; index += 1) {
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

  if (!current || Array.isArray(current) || typeof current !== "object") {
    return null;
  }

  for (const key of keys) {
    if (current?.[key] && typeof current[key] === "object") {
      return current[key];
    }
  }

  return current;
};

const getSubjectOfferingId = (lecture) =>
  normalizeId(
    lecture?.subjectOffering ||
      lecture?.subjectOfferingId ||
      lecture?.offering ||
      lecture?.offeringId
  );

const mergeLectureDetails = (lecture, details) => ({
  ...lecture,
  ...(details || {}),
  classId:
    details?.classId ||
    details?.class ||
    lecture?.classId ||
    lecture?.class,
  subjectOffering:
    details?.subjectOffering ||
    details?.subjectOfferingId ||
    lecture?.subjectOffering ||
    lecture?.subjectOfferingId,
  subject:
    details?.subject ||
    details?.subjectId ||
    details?.subjectData ||
    details?.subjectDetails ||
    lecture?.subject ||
    lecture?.subjectId ||
    lecture?.subjectData ||
    lecture?.subjectDetails,
});

const fetchSubjectCached = async (subjectId) => {
  if (!subjectId) return null;
  if (subjectCache.has(subjectId)) return subjectCache.get(subjectId);
  if (subjectPending.has(subjectId)) return subjectPending.get(subjectId);

  const request = fetchSingleSubject(subjectId)
    .then((response) => {
      if (isFailedResponse(response)) return null;

      const subject = extractEntity(response, [
        "subject",
        "item",
      ]);

      if (subject && typeof subject === "object") {
        subjectCache.set(subjectId, subject);
        return subject;
      }

      return null;
    })
    .catch(() => null)
    .finally(() => {
      subjectPending.delete(subjectId);
    });

  subjectPending.set(subjectId, request);
  return request;
};

const enrichLectureSubject = async (lecture) => {
  if (hasResolvedSubject(lecture)) {
    return lecture;
  }

  let enrichedLecture = lecture;
  const lectureId = getLectureId(lecture);

  if (lectureId) {
    const detailResponse = await fetchSingleLecture(lectureId, {
      force: true,
    });

    if (!isFailedResponse(detailResponse)) {
      const details = extractEntity(detailResponse, [
        "lecture",
        "item",
      ]);

      enrichedLecture = mergeLectureDetails(lecture, details);
    }
  }

  if (!hasResolvedSubject(enrichedLecture)) {
    const offeringId = getSubjectOfferingId(enrichedLecture);

    if (offeringId) {
      const offeringResponse = await fetchSingleSubjectOffering(offeringId);

      if (!isFailedResponse(offeringResponse)) {
        const offering = extractEntity(offeringResponse, [
          "subjectOffering",
          "offering",
          "item",
        ]);

        if (offering) {
          enrichedLecture = {
            ...enrichedLecture,
            subjectOffering: {
              ...asObject(enrichedLecture?.subjectOffering),
              ...asObject(enrichedLecture?.subjectOfferingId),
              ...offering,
            },
            subjectOfferingId: {
              ...asObject(enrichedLecture?.subjectOffering),
              ...asObject(enrichedLecture?.subjectOfferingId),
              ...offering,
            },
          };
        }
      }
    }
  }

  if (hasResolvedSubject(enrichedLecture)) {
    return enrichedLecture;
  }

  const subjectId = getSubjectId(enrichedLecture);
  const subject = await fetchSubjectCached(subjectId);

  if (!subject) {
    return enrichedLecture;
  }

  const offering = getSubjectOffering(enrichedLecture);
  const normalizedOffering = {
    ...offering,
    subject,
    subjectId: subject,
  };

  return {
    ...enrichedLecture,
    subject,
    subjectId: subject,
    subjectName:
      subject?.subjectName ||
      subject?.name ||
      enrichedLecture?.subjectName ||
      "",
    subjectCode:
      subject?.subjectCode ||
      subject?.code ||
      enrichedLecture?.subjectCode ||
      "",
    subjectOffering: normalizedOffering,
    subjectOfferingId: normalizedOffering,
  };
};

const getClassData = (lecture) => {
  const classroom = lecture?.classId || lecture?.class || {};
  const grade =
    classroom?.gradeLevelId ||
    classroom?.gradeLevel ||
    lecture?.gradeLevelId ||
    lecture?.gradeLevel ||
    {};

  const gradeName =
    grade?.name || grade?.title || classroom?.gradeName || "";
  const roomNumber =
    classroom?.roomNumber ||
    classroom?.name ||
    lecture?.roomNumber ||
    "";
  const gender = String(classroom?.gender || "").toLowerCase();
  const genderLabel =
    gender === "male"
      ? "بنين"
      : gender === "female"
        ? "بنات"
        : gender === "both" || gender === "mixed"
          ? "مختلط"
          : "";

  const parts = [
    gradeName,
    roomNumber ? `فصل ${roomNumber}` : "",
    genderLabel,
  ].filter(Boolean);

  return {
    id: normalizeId(classroom),
    label: parts.join(" - ") || "فصل غير محدد",
  };
};

const getDayLabel = (lecture) => {
  const value = String(lecture?.dayOfWeek || lecture?.day || "").trim();
  return DAYS[value] || DAYS[value.toLowerCase()] || value || "يوم غير محدد";
};

const getSlotLabel = (lecture) => {
  const slot = Number(
    lecture?.slot || lecture?.period || lecture?.slotNumber || 0
  );
  return SLOT_LABELS[slot] || (slot ? `الحصة ${slot}` : "حصة");
};

const getPreparationFiles = (preparation) => {
  const candidates = [
    preparation?.files,
    preparation?.filePaths,
    preparation?.attachments,
  ];

  return candidates.find(Array.isArray) || [];
};

const getPreparationDate = (preparation) => {
  const raw = preparation?.updatedAt || preparation?.createdAt;
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const loadTeacherPreparations = async (teacherId, lectures) => {
  const mainResponse = await fetchPreparations({
    teacherId,
    page: 1,
    limit: 500,
  });

  let list = isFailedResponse(mainResponse)
    ? []
    : extractCollection(mainResponse, ["preparations"]);

  if (list.length > 0 || lectures.length === 0) return list;

  const results = await Promise.allSettled(
    lectures.map(async (lecture) => {
      const lectureId = getLectureId(lecture);
      if (!lectureId) return [];

      const response = await fetchPreparations({
        lectureId,
        page: 1,
        limit: 10,
      });
      const primary = isFailedResponse(response)
        ? []
        : extractCollection(response, ["preparations"]);
      if (primary.length > 0) return primary;

      const legacyResponse = await fetchPreparations({
        lecture: lectureId,
        page: 1,
        limit: 10,
      });
      return isFailedResponse(legacyResponse)
        ? []
        : extractCollection(legacyResponse, ["preparations"]);
    })
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
};

const StatCard = ({ title, value, helper, icon, tone = "blue" }) => {
  const tones = {
    blue: { color: COLORS.navy, bg: COLORS.navySoft },
    gold: { color: COLORS.gold, bg: COLORS.goldSoft },
    green: { color: COLORS.green, bg: COLORS.greenSoft },
    red: { color: COLORS.red, bg: COLORS.redSoft },
  };
  const selected = tones[tone] || tones.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: COLORS.muted, fontSize: 10, fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography sx={{ color: COLORS.navyDark, fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
          {value}
        </Typography>
        <Typography noWrap sx={{ color: "#a0aab5", fontSize: 8.5, mt: 0.25 }}>
          {helper}
        </Typography>
      </Box>
      <Box
        sx={{
          ...TEACHER_UI.statIcon,
          display: "grid",
          placeItems: "center",
          color: selected.color,
          bgcolor: selected.bg,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const LoadingView = () => (
  <Box sx={{ ...TEACHER_UI.page }}>
    <Box sx={{ ...TEACHER_UI.container }}>
      <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />
      <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item}>
            <Skeleton variant="rounded" height={76} sx={{ borderRadius: 2.4 }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2.5, mt: 1.2 }} />
    </Box>
  </Box>
);

const TeacherPreparations = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};
  const teacherId = resolveTeacherId(authState);

  const [lectures, setLectures] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!teacherId) {
        setError("تعذر تحديد حساب المعلم الحالي");
        setLoading(false);
        return;
      }

      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      try {
        const lectureResponse = await fetchLectures({
          teacherId,
          page: 1,
          limit: 500,
        });

        if (isFailedResponse(lectureResponse)) {
          throw new Error(
            lectureResponse?.message ||
              (typeof lectureResponse === "string" ? lectureResponse : "تعذر تحميل حصص المعلم")
          );
        }

        const lectureList = extractCollection(lectureResponse, ["lectures"]);

        const enrichedLectureResults = await Promise.allSettled(
          lectureList.map((lecture) => enrichLectureSubject(lecture))
        );

        const enrichedLectureList = enrichedLectureResults.map(
          (result, index) =>
            result.status === "fulfilled"
              ? result.value
              : lectureList[index]
        );

        const preparationList = await loadTeacherPreparations(
          teacherId,
          enrichedLectureList
        );

        const uniquePreparations = Array.from(
          new Map(
            preparationList
              .filter((item) => getPreparationId(item))
              .map((item) => [getPreparationId(item), item])
          ).values()
        );

        setLectures(enrichedLectureList);
        setPreparations(uniquePreparations);
      } catch (requestError) {
        const message = requestError?.message || "تعذر تحميل التحاضير";
        setError(message);
        toast.error(message, { toastId: "teacher-preparations-load-error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const preparationByLecture = useMemo(() => {
    const map = new Map();
    preparations.forEach((preparation) => {
      const lectureId = getPreparationLectureId(preparation);
      if (lectureId) map.set(lectureId, preparation);
    });
    return map;
  }, [preparations]);

  const rows = useMemo(
    () =>
      lectures.map((lecture) => ({
        lecture,
        lectureId: getLectureId(lecture),
        preparation: preparationByLecture.get(getLectureId(lecture)) || null,
        subject: getSubject(lecture),
        classData: getClassData(lecture),
      })),
    [lectures, preparationByLecture]
  );

  const subjects = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = `${row.subject.name}|${row.subject.code}`;
      if (!map.has(key)) map.set(key, row.subject);
    });
    return Array.from(map.entries());
  }, [rows]);

  const classes = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = row.classData.id || row.classData.label;
      if (!map.has(key)) map.set(key, row.classData.label);
    });
    return Array.from(map.entries());
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const prepared = Boolean(row.preparation);
      const subjectKey = `${row.subject.name}|${row.subject.code}`;
      const classKey = row.classData.id || row.classData.label;
      const haystack = [
        row.subject.name,
        row.subject.code,
        row.classData.label,
        getDayLabel(row.lecture),
        getSlotLabel(row.lecture),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (subjectFilter === "all" || subjectFilter === subjectKey) &&
        (classFilter === "all" || classFilter === classKey) &&
        (statusFilter === "all" ||
          (statusFilter === "prepared" && prepared) ||
          (statusFilter === "missing" && !prepared))
      );
    });
  }, [rows, search, subjectFilter, classFilter, statusFilter]);

  const preparedCount = rows.filter((row) => row.preparation).length;
  const missingCount = Math.max(rows.length - preparedCount, 0);
  const totalFiles = preparations.reduce(
    (sum, preparation) => sum + getPreparationFiles(preparation).length,
    0
  );
  const completionRate = rows.length
    ? Math.round((preparedCount / rows.length) * 100)
    : 0;

  const nextMissing = rows.find((row) => !row.preparation);

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setClassFilter("all");
    setStatusFilter("all");
  };

  const handleDelete = async (preparation) => {
    const id = getPreparationId(preparation);
    if (!id || deletingId) return;

    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا التحضير؟"
    );
    if (!confirmed) return;

    setDeletingId(id);
    const response = await deletePreparation(id);

    if (isFailedResponse(response)) {
      toast.error(
        response?.message ||
          (typeof response === "string" ? response : "تعذر حذف التحضير")
      );
      setDeletingId("");
      return;
    }

    setPreparations((current) =>
      current.filter((item) => getPreparationId(item) !== id)
    );
    toast.success("تم حذف التحضير بنجاح");
    setDeletingId("");
  };

  if (loading) return <LoadingView />;

  return (
    <Box sx={{ ...TEACHER_UI.page }} dir="rtl">
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 220,
              height: 220,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
              left: -70,
              top: -110,
            }}
          />

          <Stack direction="row" alignItems="center" gap={1.3} sx={{ zIndex: 1 }}>
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                ...TEACHER_UI.heroLogo,
                objectFit: "contain",
                bgcolor: "#fff",
                p: 0.45,
              }}
            />
            <Box>
              <Chip
                icon={<MenuBookRounded />}
                label="بوابة المعلم"
                size="small"
                sx={{
                  height: 23,
                  mb: 0.45,
                  color: "#ffdf8c",
                  bgcolor: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,223,140,.25)",
                  fontSize: 8,
                  fontWeight: 900,
                }}
              />
              <Typography sx={{ ...TEACHER_UI.heroTitle }}>
                تحضيراتي
              </Typography>
              <Typography sx={{ ...TEACHER_UI.heroSubtitle, color: "rgba(255,255,255,.72)" }}>
                راجع تحاضير حصصك وأضف الملفات الناقصة من مكان واحد
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={0.8} sx={{ zIndex: 1 }}>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate("/teacher/dashboard")}
              sx={{
                ...TEACHER_UI.button,
                color: "#fff",
                border: "1px solid rgba(255,255,255,.25)",
              }}
            >
              لوحة التحكم
            </Button>
            <Tooltip title="تحديث البيانات">
              <IconButton
                onClick={() => loadData({ silent: true })}
                disabled={refreshing}
                sx={{
                  width: 36,
                  height: 36,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 1.8,
                }}
              >
                {refreshing ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <RefreshRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<AddRounded />}
              disabled={!nextMissing}
              onClick={() =>
                nextMissing &&
                navigate(
                  `/school/preparation/add?lectureId=${nextMissing.lectureId}`
                )
              }
              sx={{
                ...TEACHER_UI.button,
                color: COLORS.navyDark,
                bgcolor: "#ffdc83",
                "&:hover": { bgcolor: "#f5ca5c" },
              }}
            >
              إضافة تحضير
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="إجمالي الحصص"
              value={rows.length}
              helper="الحصص الموجودة في جدولك"
              icon={<ScheduleRounded fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="حصص محضّرة"
              value={preparedCount}
              helper={`${completionRate}% من إجمالي الحصص`}
              icon={<CheckCircleRounded fontSize="small" />}
              tone="green"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="تحتاج تحضير"
              value={missingCount}
              helper={missingCount ? "حصص بدون ملف تحضير" : "كل الحصص محضّرة"}
              icon={<WarningAmberRounded fontSize="small" />}
              tone="gold"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="ملفات التحضير"
              value={totalFiles}
              helper="إجمالي الملفات المرفوعة"
              icon={<MenuBookRounded fontSize="small" />}
              tone="blue"
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.section,
            mt: 1.1,
            border: `1px solid ${COLORS.border}`,
            bgcolor: "#fff",
          }}
        >
          <Grid container spacing={0.9} alignItems="center">
            <Grid item xs={12} lg={5}>
              <TextField
                fullWidth
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث بالمادة أو الفصل أو يوم الحصة"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: COLORS.muted }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    ...TEACHER_UI.field,
                    fontSize: 12,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} lg={2}>
              <FormControl fullWidth>
                <Select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  sx={{ ...TEACHER_UI.field, fontSize: 11 }}
                >
                  <MenuItem value="all">كل المواد</MenuItem>
                  {subjects.map(([key, subject]) => (
                    <MenuItem value={key} key={key}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} lg={2}>
              <FormControl fullWidth>
                <Select
                  value={classFilter}
                  onChange={(event) => setClassFilter(event.target.value)}
                  sx={{ ...TEACHER_UI.field, fontSize: 11 }}
                >
                  <MenuItem value="all">كل الفصول</MenuItem>
                  {classes.map(([key, label]) => (
                    <MenuItem value={key} key={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} lg={2}>
              <FormControl fullWidth>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ ...TEACHER_UI.field, fontSize: 11 }}
                >
                  <MenuItem value="all">كل الحالات</MenuItem>
                  <MenuItem value="prepared">تم التحضير</MenuItem>
                  <MenuItem value="missing">تحتاج تحضير</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} lg={1}>
              <Tooltip title="إلغاء الفلاتر">
                <IconButton
                  onClick={clearFilters}
                  sx={{
                    width: "100%",
                    height: 40,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 2,
                    color: COLORS.navy,
                  }}
                >
                  <FilterAltOffRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.section,
            mt: 1.1,
            border: `1px solid ${COLORS.border}`,
            bgcolor: "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography sx={{ color: COLORS.navyDark, fontSize: 16, fontWeight: 900 }}>
                تحاضير الحصص
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 9 }}>
                يظهر كل تحضير أمام الحصة المرتبط بها
              </Typography>
            </Box>
            <Chip
              label={`${filteredRows.length} حصة`}
              size="small"
              sx={{ fontSize: 8.5, fontWeight: 900, bgcolor: COLORS.navySoft, color: COLORS.navy }}
            />
          </Stack>

          {filteredRows.length === 0 ? (
            <Box
              sx={{
                ...TEACHER_UI.emptyState,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Stack alignItems="center" gap={0.7}>
                <MenuBookRounded sx={{ fontSize: 40, color: "#b5c0ca" }} />
                <Typography sx={{ color: COLORS.navyDark, fontSize: 14, fontWeight: 900 }}>
                  لا توجد تحاضير مطابقة
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 9 }}>
                  غيّر الفلاتر أو أضف تحضيرًا جديدًا للحصة التالية
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Grid container spacing={0.9}>
              {filteredRows.map((row) => {
                const preparation = row.preparation;
                const preparationId = getPreparationId(preparation);
                const prepared = Boolean(preparationId);
                const filesCount = getPreparationFiles(preparation).length;

                return (
                  <Grid item xs={12} md={6} key={row.lectureId}>
                    <Paper
                      elevation={0}
                      sx={{
                        ...TEACHER_UI.listCard,
                        minHeight: 92,
                        border: `1px solid ${prepared ? "#cce9dd" : "#eeddb4"}`,
                        bgcolor: prepared ? "#fbfffd" : "#fffdf8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.2,
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap={1.1} sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            color: prepared ? COLORS.green : COLORS.gold,
                            bgcolor: prepared ? COLORS.greenSoft : COLORS.goldSoft,
                            flexShrink: 0,
                          }}
                        >
                          {prepared ? <CheckCircleRounded /> : <WarningAmberRounded />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" gap={0.6} flexWrap="wrap">
                            <Typography noWrap sx={{ color: COLORS.navyDark, fontSize: 12.5, fontWeight: 900 }}>
                              {row.subject.name}
                              {row.subject.code ? ` - ${row.subject.code}` : ""}
                            </Typography>
                            <Chip
                              size="small"
                              label={prepared ? "تم التحضير" : "تحتاج تحضير"}
                              sx={{
                                height: 21,
                                fontSize: 7.5,
                                fontWeight: 900,
                                color: prepared ? COLORS.green : COLORS.gold,
                                bgcolor: prepared ? COLORS.greenSoft : COLORS.goldSoft,
                              }}
                            />
                          </Stack>
                          <Typography noWrap sx={{ color: COLORS.muted, fontSize: 8.5, mt: 0.2 }}>
                            {row.classData.label} • {getDayLabel(row.lecture)} • {getSlotLabel(row.lecture)}
                          </Typography>
                          <Typography noWrap sx={{ color: "#a2acb6", fontSize: 8, mt: 0.15 }}>
                            {prepared
                              ? `${filesCount} ملف${getPreparationDate(preparation) ? ` • آخر تحديث ${getPreparationDate(preparation)}` : ""}`
                              : "لم يتم رفع ملف تحضير لهذه الحصة"}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" alignItems="center" gap={0.45} flexShrink={0}>
                        {prepared ? (
                          <>
                            <Tooltip title="عرض التحضير">
                              <IconButton
                                onClick={() => navigate(`/school/preparation/${preparationId}`)}
                                sx={{ width: 32, height: 32, color: COLORS.navy, bgcolor: COLORS.navySoft }}
                              >
                                <VisibilityRounded sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل التحضير">
                              <IconButton
                                onClick={() => navigate(`/school/preparation/edit/${preparationId}`)}
                                sx={{ width: 32, height: 32, color: COLORS.gold, bgcolor: COLORS.goldSoft }}
                              >
                                <EditRounded sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف التحضير">
                              <span>
                                <IconButton
                                  disabled={deletingId === preparationId}
                                  onClick={() => handleDelete(preparation)}
                                  sx={{ width: 32, height: 32, color: COLORS.red, bgcolor: COLORS.redSoft }}
                                >
                                  {deletingId === preparationId ? (
                                    <CircularProgress size={15} color="inherit" />
                                  ) : (
                                    <DeleteOutlineRounded sx={{ fontSize: 17 }} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        ) : (
                          <Button
                            startIcon={<AddRounded />}
                            onClick={() =>
                              navigate(
                                `/school/preparation/add?lectureId=${row.lectureId}`
                              )
                            }
                            sx={{
                              ...TEACHER_UI.button,
                              color: "#fff",
                              bgcolor: COLORS.gold,
                              "&:hover": { bgcolor: "#ae7610" },
                            }}
                          >
                            إضافة تحضير
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default TeacherPreparations;
