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
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  CloudUploadRounded,
  EventAvailableRounded,
  GroupsRounded,
  HowToRegRounded,
  MenuBookRounded,
  RefreshRounded,
  SaveRounded,
  ScheduleRounded,
  SearchRounded,
  ShieldRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { api } from "@/APIs/Axios";
import { fetchLectures } from "@/APIs/school/lectures";
import { fetchMyDay } from "@/APIs/school/notifications";
import {
  addPreparation,
  fetchPreparations,
} from "@/APIs/school/preparation";

import nasaqLogo from "../../images/wadq-logo.png";
import NotificationBell from "@/components/Notifications/NotificationBell";
import usePermissions from "@/utils/hooks/usePermissions";

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


const extractDutySupervisorAssignment = (response, date) => {
  const payload = unwrapResponse(response);

  if (!payload) return null;

  const collections = Array.isArray(payload)
    ? payload
    : [
        payload?.docs,
        payload?.items,
        payload?.results,
        payload?.records,
        payload?.assignments,
        payload?.dutySupervisors,
        payload?.data,
      ].find(Array.isArray);

  if (Array.isArray(collections)) {
    return (
      collections.find(
        (item) => String(item?.date || "").slice(0, 10) === date
      ) ||
      collections[0] ||
      null
    );
  }

  return typeof payload === "object" ? payload : null;
};

const getDutySupervisorEntries = (assignment) => {
  if (!assignment || typeof assignment !== "object") return [];

  const source = [
    assignment?.supervisors,
    assignment?.teachers,
    assignment?.teacherIds,
    assignment?.supervisorIds,
  ].find(Array.isArray) || [];

  const parallelNames = [
    assignment?.teacherNames,
    assignment?.supervisorNames,
    assignment?.names,
  ].find(Array.isArray) || [];

  return source
    .map((entry, index) => {
      const objectEntry =
        entry && typeof entry === "object" && !Array.isArray(entry)
          ? entry
          : {};

      const teacher =
        objectEntry?.teacher && typeof objectEntry.teacher === "object"
          ? objectEntry.teacher
          : objectEntry?.teacherId && typeof objectEntry.teacherId === "object"
            ? objectEntry.teacherId
            : objectEntry?.user && typeof objectEntry.user === "object"
              ? objectEntry.user
              : {};

      const ids = [
        entry,
        objectEntry?.teacherId,
        objectEntry?.teacher,
        objectEntry?.userId,
        objectEntry?.user,
        objectEntry?._id,
        objectEntry?.id,
        teacher?._id,
        teacher?.id,
      ]
        .map(normalizeId)
        .filter(Boolean);

      const parallelName = parallelNames[index];
      const name = String(
        objectEntry?.teacherName ||
          objectEntry?.supervisorName ||
          objectEntry?.name ||
          teacher?.name ||
          teacher?.fullName ||
          (typeof parallelName === "string"
            ? parallelName
            : parallelName?.name || parallelName?.teacherName || "") ||
          ""
      ).trim();

      return {
        ids: Array.from(new Set(ids)),
        name,
      };
    })
    .filter((entry) => entry.ids.length > 0 || entry.name);
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getErrorMessage = (response, fallback) => {
  const message =
    typeof response === "string"
      ? response
      : response?.message ||
        response?.data?.message ||
        response?.error ||
        fallback;

  if (/network error|err_failed|cors/i.test(String(message || ""))) {
    return "تعذر الاتصال بالخادم. راجع إعدادات CORS في الباك ثم أعد المحاولة.";
  }

  return message;
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
        borderRadius: 3,
        borderColor: "#e3e9ef",
        p: { xs: 1.15, md: 1.25 },
        minHeight: 82,
        boxShadow: "0 6px 16px rgba(25, 58, 86, 0.035)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box sx={{ textAlign: "right", minWidth: 0 }}>
          <Typography
            sx={{
              color: "#78879a",
              fontWeight: 800,
              fontSize: 11.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: "#082a4b",
              fontWeight: 900,
              fontSize: 22,
              lineHeight: 1.15,
              mt: 0.2,
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              color: "#a0aaba",
              fontSize: 10,
              mt: 0.15,
            }}
          >
            {helper}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.8,
            display: "grid",
            placeItems: "center",
            bgcolor: palette.iconBg,
            color: palette.iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
};

const TeacherSchedule = () => {
  const navigate = useNavigate();
  const preparationPermissions = usePermissions("preparation");
  const [searchParams] = useSearchParams();
  const getAuthUser = useAuthUser();

  const isPreparationMode =
    searchParams.get("mode") === "prepare";

  const requestedPreparationLectureId =
    String(
      searchParams.get(
        "lectureId"
      ) || ""
    ).trim();

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const teacherId = resolveTeacherId(authRoot, currentUser);

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => getStartOfWeek(today), [today]);
  const todayKey = DAYS.find(
    (day) => day.jsDay === today.getDay()
  )?.key;

  const [lectures, setLectures] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [dutyDays, setDutyDays] = useState({});
  const [todaySupervisorAssignment, setTodaySupervisorAssignment] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [preparationFilter, setPreparationFilter] = useState("all");

  const [selectedLecture, setSelectedLecture] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submittingPreparation, setSubmittingPreparation] =
    useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    /*
     * في وضع إضافة التحضير نعرض كل حصص المعلم.
     * الحصة المحضّرة تظهر كـ "فتح التحضير"،
     * وغير المحضّرة يظهر لها "إضافة تحضير".
     */
    if (isPreparationMode) {
      setPreparationFilter("all");
    }
  }, [isPreparationMode]);

  const loadSchedule = useCallback(
    async ({ silent = false } = {}) => {
      if (!teacherId) {
        setLectures([]);
        setPreparations([]);
        setDutyDays({});
        setTodaySupervisorAssignment(null);
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
        const todayDate = formatLocalDate(today);

        const [lectureResponse, supervisorResponse] = await Promise.all([
          fetchLectures(
            {
              teacherId,
              page: 1,
              limit: 500,
            },
            {
              force: true,
            }
          ),
          api
            .get("/duty/supervisors", {
              params: { date: todayDate },
            })
            .catch(() => null),
        ]);

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

        // `my-day` هو المصدر الحقيقي للاستئذان والاحتياطي في يوم محدد.
        // نحمله لكل أيام الأسبوع بالتوازي حتى يظهر الاحتياطي داخل نفس الجدول،
        // والحصة المعفاة بالاستئذان تفضل ظاهرة ومعلّمة بدل ما تختفي.
        const dutyEntries = await Promise.all(
          DAYS.map(async (day) => {
            const date = formatLocalDate(
              getDateForDay(weekStart, day.jsDay)
            );
            const response = await fetchMyDay(date);

            return [
              day.key,
              response.status ? response.data : null,
            ];
          })
        );

        setLectures(lectureList);
        setPreparations(preparationList);
        setDutyDays(Object.fromEntries(dutyEntries));
        setTodaySupervisorAssignment(
          supervisorResponse
            ? extractDutySupervisorAssignment(supervisorResponse, todayDate)
            : null
        );
      } catch (requestError) {
        setLectures([]);
        setPreparations([]);
        setDutyDays({});
        setTodaySupervisorAssignment(null);
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
    [teacherId, weekStart, today]
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
        .map((lecture) => {
          const scheduleDayKey = getLectureDayKey(lecture);
          const scheduleSlot = getSlotNumber(lecture);
          const lectureId = getLectureId(lecture);
          const dutySlots = dutyDays?.[scheduleDayKey]?.slots ?? [];

          const ownDutySlot = dutySlots.find((slot) => {
            if (slot?.kind !== "own") return false;

            const dutyLectureId = normalizeId(slot?.lectureId);
            if (dutyLectureId && lectureId) {
              return dutyLectureId === lectureId;
            }

            return Number(slot?.slot) === scheduleSlot;
          });

          return {
            ...lecture,
            scheduleDayKey,
            scheduleSubject: getSubjectData(lecture),
            scheduleClassId: getClassId(lecture),
            scheduleClassLabel: getClassLabel(lecture),
            scheduleSlot,
            schedulePreparation:
              preparationByLecture.get(lectureId) || null,
            scheduleExcusedByLeave: Boolean(
              ownDutySlot?.excusedByLeave
            ),
          };
        })
        .filter((lecture) => lecture.scheduleDayKey),
    [lectures, preparationByLecture, dutyDays]
  );

  /*
   * لو جايين من "تحضيراتي" ومعانا lectureId،
   * افتح نموذج التحضير الحديث تلقائيًا.
   */
  useEffect(() => {
    if (
      !isPreparationMode ||
      !requestedPreparationLectureId ||
      selectedLecture
    ) {
      return;
    }

    const requestedLecture =
      enrichedLectures.find(
        (lecture) =>
          getLectureId(
            lecture
          ) ===
          requestedPreparationLectureId
      );

    if (!requestedLecture) {
      return;
    }

    const preparationId =
      getPreparationId(
        requestedLecture
          .schedulePreparation
      );

    if (preparationId) {
      navigate(
        `/teacher/preparations?preparationId=${preparationId}`,
        { replace: true }
      );
      return;
    }

    setSelectedLecture(
      requestedLecture
    );

    setUploadedFile(
      null
    );
  }, [
    isPreparationMode,
    requestedPreparationLectureId,
    enrichedLectures,
    selectedLecture,
    navigate,
  ]);


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

  const visibleDays = useMemo(() => {
    const base = DAYS.slice(0, 5);
    const extra = DAYS.slice(5).filter((day) =>
      enrichedLectures.some(
        (lecture) => lecture.scheduleDayKey === day.key
      ) || (dutyDays?.[day.key]?.slots?.length ?? 0) > 0
    );

    return [...base, ...extra];
  }, [enrichedLectures, dutyDays]);

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

  const coverSlotsByDay = useMemo(() => {
    const map = new Map(
      visibleDays.map((day) => [day.key, []])
    );
    const query = normalizeText(search);
    const hasStructuredFilter =
      Boolean(subjectFilter) ||
      Boolean(classFilter) ||
      preparationFilter !== "all";

    visibleDays.forEach((day) => {
      const covers = (dutyDays?.[day.key]?.slots ?? [])
        .filter((slot) => slot?.kind === "cover")
        .filter((slot) => {
          if (isPreparationMode || hasStructuredFilter) return false;
          if (!query) return true;

          return [
            slot?.subjectName,
            slot?.className,
            slot?.roomNumber,
            slot?.coveringFor,
            `الحصة ${slot?.slot ?? ""}`,
          ].some((value) => normalizeText(value).includes(query));
        })
        .sort((a, b) => Number(a?.slot) - Number(b?.slot));

      map.set(day.key, covers);
    });

    return map;
  }, [
    visibleDays,
    dutyDays,
    search,
    subjectFilter,
    classFilter,
    preparationFilter,
    isPreparationMode,
  ]);

  const displayedDays = useMemo(() => {
    if (!isPreparationMode) return visibleDays;

    return visibleDays.filter(
      (day) => (lecturesByDay.get(day.key) || []).length > 0
    );
  }, [isPreparationMode, visibleDays, lecturesByDay]);

  const visibleCoverCount = useMemo(
    () =>
      Array.from(coverSlotsByDay.values()).reduce(
        (total, slots) => total + slots.length,
        0
      ),
    [coverSlotsByDay]
  );

  const preparedCount = enrichedLectures.filter((lecture) =>
    Boolean(getPreparationId(lecture.schedulePreparation))
  ).length;

  const todayLectures = enrichedLectures.filter(
    (lecture) => lecture.scheduleDayKey === todayKey
  );
  const todayDuty = dutyDays?.[todayKey] ?? null;
  const todayCoverCount = Number(
    todayDuty?.stats?.cover ??
      (todayDuty?.slots ?? []).filter((slot) => slot?.kind === "cover").length
  );
  const todayExcusedCount = Number(
    todayDuty?.stats?.excused ??
      (todayDuty?.slots ?? []).filter(
        (slot) => slot?.kind === "own" && slot?.excusedByLeave
      ).length
  );

  const todaySupervisorInfo = useMemo(() => {
    const entries = getDutySupervisorEntries(todaySupervisorAssignment);

    const currentIds = new Set(
      [
        teacherId,
        currentUser?._id,
        currentUser?.id,
        currentUser?.teacherId,
        currentUser?.teacher,
        authRoot?.teacherId,
        authRoot?.teacher,
        authRoot?.user?._id,
        authRoot?.user?.id,
      ]
        .map(normalizeId)
        .filter(Boolean)
    );

    const isAssigned = entries.some((entry) =>
      entry.ids.some((id) => currentIds.has(id))
    );

    const names = Array.from(
      new Set(entries.map((entry) => entry.name).filter(Boolean))
    );

    const currentTeacherName = String(
      currentUser?.name || currentUser?.fullName || ""
    ).trim();

    return {
      isAssigned,
      names:
        names.length > 0
          ? names
          : isAssigned && currentTeacherName
            ? [currentTeacherName]
            : [],
      notes: String(todaySupervisorAssignment?.notes || "").trim(),
    };
  }, [
    todaySupervisorAssignment,
    teacherId,
    currentUser,
    authRoot,
  ]);

  const openAttendance = (lecture, day) => {
    const classId =
      lecture.scheduleClassId;

    const lectureId =
      getLectureId(
        lecture
      );

    const dayDate =
      getDateForDay(
        weekStart,
        day.jsDay
      );

    const params =
      new URLSearchParams({
        date:
          formatLocalDate(
            dayDate
          ),
      });

    if (classId) {
      params.set(
        "classId",
        classId
      );
    }

    if (lectureId) {
      params.set(
        "lectureId",
        lectureId
      );
    }

    navigate(
      `/teacher/attendance?${params.toString()}`
    );
  };

  const openPreparation = (lecture) => {
    const lectureId =
      getLectureId(
        lecture
      );

    const preparationId =
      getPreparationId(
        lecture.schedulePreparation
      );

    if (preparationId) {
      /*
       * لا نفتح School/Preparation/Profile القديمة.
       */
      navigate(
        `/teacher/preparations?preparationId=${preparationId}`
      );
      return;
    }

    if (!lectureId) {
      toast.error(
        "تعذر تحديد الحصة المختارة"
      );
      return;
    }

    /*
     * الـ Dialog الخاص برفع التحضير موجود داخل وضع prepare.
     * لذلك عند الضغط من الجدول العادي ننقل لنفس الصفحة بوضع
     * التحضير ونمرر lectureId، وبعد التحميل يتم فتح الـ Dialog
     * تلقائيًا بواسطة الـ effect الموجود أعلى الصفحة.
     */
    if (!isPreparationMode) {
      const params = new URLSearchParams();
      params.set("mode", "prepare");
      params.set("lectureId", lectureId);

      navigate(`/teacher/schedule?${params.toString()}`);
      return;
    }

    /*
     * داخل وضع التحضير نفتح نموذج الرفع الحديث مباشرة.
     */
    setSelectedLecture(
      lecture
    );

    setUploadedFile(
      null
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  const closePreparationDialog = () => {
    if (submittingPreparation) return;
    setSelectedLecture(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const choosePreparationFile = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setUploadedFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.error("ملف التحضير يجب أن يكون بصيغة PDF");
      event.target.value = "";
      setUploadedFile(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم ملف التحضير يجب ألا يتجاوز 20 ميجابايت");
      event.target.value = "";
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
  };

  const submitPreparationFromSchedule = async () => {
    const lectureId = getLectureId(selectedLecture);

    if (!lectureId) {
      toast.error("تعذر تحديد الحصة المختارة");
      return;
    }

    if (!uploadedFile) {
      toast.error("اختر ملف التحضير أولًا");
      return;
    }

    try {
      setSubmittingPreparation(true);

      const formData = new FormData();
      formData.append("lecture", lectureId);
      formData.append("files", uploadedFile);

      const response = await addPreparation(formData);

      if (isFailedResponse(response)) {
        toast.error(
          getErrorMessage(response, "تعذر حفظ ملف التحضير")
        );
        return;
      }

      toast.success("تم حفظ التحضير بنجاح");
      setSelectedLecture(null);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadSchedule({ silent: true });
    } catch (submitError) {
      toast.error(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "تعذر حفظ ملف التحضير"
      );
    } finally {
      setSubmittingPreparation(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setClassFilter("");
    setPreparationFilter("all");
  };

  if (isPreparationMode) {
    return (
      <Box
        dir="rtl"
        sx={{
          minHeight: "100dvh",
          bgcolor: "#f6f4ef",
          px: { xs: 1, md: 2 },
          py: { xs: 1, md: 1.5 },
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: "auto" }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.35, md: 1.6 },
              mb: 1.25,
              border: "1px solid rgba(200,144,39,.22)",
              background:
                "linear-gradient(135deg, #fffdf8 0%, #fff8e9 100%)",
              boxShadow: "0 10px 26px rgba(18,47,77,.05)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.25}
            >
              <Stack direction="row" alignItems="center" spacing={1.1}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.2,
                    bgcolor: "#fff0cf",
                    color: "#ad7415",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MenuBookRounded />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#0b2c4d",
                      fontWeight: 900,
                      fontSize: { xs: 20, md: 24 },
                      lineHeight: 1.2,
                    }}
                  >
                    اختر الحصة وابدأ التحضير
                  </Typography>
                  <Typography
                    sx={{
                      color: "#7f8a98",
                      fontSize: 12,
                      mt: 0.25,
                    }}
                  >
                    اختر حصة من القائمة، ثم ارفع ملف PDF واحفظ التحضير
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.8}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackRounded />}
                  onClick={() => navigate("/teacher/dashboard")}
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    fontWeight: 900,
                    color: "#214f77",
                    borderColor: "#cbd7e1",
                  }}
                >
                  لوحة التحكم
                </Button>

                <IconButton
                  onClick={() => loadSchedule({ silent: true })}
                  disabled={refreshing}
                  sx={{
                    border: "1px solid #d9e1e8",
                    borderRadius: 2,
                    color: "#214f77",
                  }}
                >
                  <RefreshRounded
                    sx={{
                      animation: refreshing
                        ? "spin 1s linear infinite"
                        : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>

          {error ? (
            <Alert severity="error" sx={{ mb: 1.25, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2.5,
              p: 1,
              mb: 1.25,
              border: "1px solid #e1e6eb",
              bgcolor: "#fff",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(280px, 1fr) 210px 210px",
                },
                gap: 0.8,
              }}
            >
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المادة أو الفصل أو رقم الحصة"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: "#8a95a3" }} />
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
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e1e6eb",
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={0.8}
              sx={{ px: 1.5, py: 1.2, borderBottom: "1px solid #edf0f3" }}
            >
              <Box>
                <Typography
                  sx={{ color: "#0b2c4d", fontWeight: 900, fontSize: 17 }}
                >
                  اختر الحصة التي تريد تحضيرها
                </Typography>
                <Typography sx={{ color: "#98a2af", fontSize: 11.5 }}>
                  {filteredLectures.length} حصة في جدولك • المحضّر منها يمكن فتحه للمراجعة
                </Typography>
              </Box>

              {(search || subjectFilter || classFilter) && (
                <Button size="small" onClick={clearFilters} sx={{ fontWeight: 800 }}>
                  مسح الفلاتر
                </Button>
              )}
            </Stack>

            {loading ? (
              <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredLectures.length === 0 && visibleCoverCount === 0 ? (
              <Box
                sx={{
                  minHeight: 260,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  px: 2,
                }}
              >
                <Stack alignItems="center" spacing={1}>
                  <CheckCircleRounded sx={{ fontSize: 44, color: "#26956d" }} />
                  <Typography sx={{ color: "#0b2c4d", fontWeight: 900 }}>
                    لا توجد حصص مطابقة
                  </Typography>
                  <Typography sx={{ color: "#98a2af", fontSize: 12 }}>
                    غيّر الفلاتر أو راجع الجدول الدراسي.
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Stack divider={<Divider flexItem />} sx={{ px: 1.1, py: 0.4 }}>
                {displayedDays.flatMap((day) => {
                  const dayDate = getDateForDay(weekStart, day.jsDay);
                  const dayLectures = lecturesByDay.get(day.key) || [];

                  return dayLectures.map((lecture, index) => (
                    <Box
                      key={getLectureId(lecture)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "120px minmax(0, 1fr) 220px",
                        },
                        alignItems: "center",
                        gap: 1,
                        py: 1.1,
                        px: 0.6,
                      }}
                    >
                      <Stack spacing={0.25}>
                        <Typography
                          sx={{ color: "#8a5c0d", fontWeight: 900, fontSize: 12.5 }}
                        >
                          {index === 0 ? day.label : ""}
                        </Typography>
                        <Typography sx={{ color: "#a0a9b5", fontSize: 10.5 }}>
                          {index === 0 ? formatDayDate(dayDate) : ""}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Chip
                          size="small"
                          label={getSlotLabel(lecture)}
                          sx={{
                            bgcolor: "#eef3f7",
                            color: "#284f6d",
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{ color: "#0b2c4d", fontWeight: 900, fontSize: 13.5 }}
                          >
                            {lecture.scheduleSubject.label}
                          </Typography>
                          <Typography
                            noWrap
                            sx={{ color: "#8d98a6", fontSize: 11 }}
                          >
                            {lecture.scheduleClassLabel}
                          </Typography>
                        </Box>
                      </Stack>

                      {(getPreparationId(lecture.schedulePreparation) || preparationPermissions.add) && (
                      <Button
                        fullWidth
                        variant={
                          getPreparationId(
                            lecture.schedulePreparation
                          )
                            ? "outlined"
                            : "contained"
                        }
                        startIcon={<MenuBookRounded />}
                        onClick={() => openPreparation(lecture)}
                        sx={{
                          minHeight: 40,
                          borderRadius: 2,
                          fontWeight: 900,
                          color: getPreparationId(
                            lecture.schedulePreparation
                          )
                            ? "#1b7f60"
                            : "#fff",
                          borderColor: getPreparationId(
                            lecture.schedulePreparation
                          )
                            ? "#7bc8af"
                            : undefined,
                          bgcolor: getPreparationId(
                            lecture.schedulePreparation
                          )
                            ? "#f4fbf8"
                            : "#c89027",
                          boxShadow: "none",
                          "&:hover": {
                            borderColor: getPreparationId(
                              lecture.schedulePreparation
                            )
                              ? "#42a987"
                              : undefined,
                            bgcolor: getPreparationId(
                              lecture.schedulePreparation
                            )
                              ? "#eaf8f2"
                              : "#ad7718",
                            boxShadow: "none",
                          },
                        }}
                      >
                        {getPreparationId(
                          lecture.schedulePreparation
                        )
                          ? "فتح التحضير الموجود"
                          : "إضافة تحضير"}
                      </Button>
                      )}
                    </Box>
                  ));
                })}
              </Stack>
            )}
          </Paper>
        </Box>

        <Dialog
          open={Boolean(selectedLecture)}
          onClose={closePreparationDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: 3, overflow: "hidden" },
          }}
        >
          <DialogTitle sx={{ p: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 1.6, py: 1.25, bgcolor: "#173f64", color: "#fff" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                  رفع ملف التحضير
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,.72)", fontSize: 11 }}>
                  {selectedLecture?.scheduleSubject?.label || "الحصة المختارة"}
                </Typography>
              </Box>

              <IconButton
                onClick={closePreparationDialog}
                disabled={submittingPreparation}
                sx={{ color: "#fff" }}
              >
                <CloseRounded />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: 1.6 }}>
            <Stack spacing={1.25}>
              <Paper
                variant="outlined"
                sx={{ p: 1.2, borderRadius: 2, bgcolor: "#fbfcfd" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={selectedLecture ? getSlotLabel(selectedLecture) : ""}
                    sx={{ fontWeight: 900 }}
                  />
                  <Box>
                    <Typography sx={{ color: "#0b2c4d", fontWeight: 900 }}>
                      {selectedLecture?.scheduleSubject?.label || ""}
                    </Typography>
                    <Typography sx={{ color: "#8f99a7", fontSize: 11 }}>
                      {selectedLecture?.scheduleClassLabel || ""}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Box
                component="label"
                sx={{
                  minHeight: 180,
                  border: "2px dashed #d7c28e",
                  borderRadius: 2.5,
                  bgcolor: uploadedFile ? "#fffaf0" : "#fffdf9",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  px: 2,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  "&:hover": { bgcolor: "#fff8e9", borderColor: "#c89027" },
                }}
              >
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={choosePreparationFile}
                />

                <Stack alignItems="center" spacing={0.8}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      bgcolor: "#fff0cf",
                      color: "#ad7415",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <CloudUploadRounded />
                  </Box>
                  <Typography sx={{ color: "#0b2c4d", fontWeight: 900 }}>
                    {uploadedFile ? uploadedFile.name : "اضغط لاختيار ملف PDF"}
                  </Typography>
                  <Typography sx={{ color: "#9aa4b1", fontSize: 11 }}>
                    PDF فقط — الحد الأقصى 20 ميجابايت
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 1.6, pb: 1.5, gap: 0.8 }}>
            <Button
              variant="outlined"
              onClick={closePreparationDialog}
              disabled={submittingPreparation}
              sx={{ borderRadius: 2, fontWeight: 900 }}
            >
              إلغاء
            </Button>
            {preparationPermissions.add && (
            <Button
              variant="contained"
              startIcon={
                submittingPreparation ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <SaveRounded />
                )
              }
              onClick={submitPreparationFromSchedule}
              disabled={!uploadedFile || submittingPreparation}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                bgcolor: "#173f64",
                "&:hover": { bgcolor: "#0e3151" },
              }}
            >
              حفظ التحضير
            </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100dvh",
        bgcolor: "#fff",
        px: { xs: 1, md: 1.5 },
        py: { xs: 1, md: 1.15 },
      }}
    >
      <Box sx={{ maxWidth: 1520, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 2.5, md: 3 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f64 0%, #245b86 58%, #2d6b99 100%)",
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.25, md: 1.4 },
            mb: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              insetInlineStart: -90,
              top: -120,
              width: 310,
              height: 310,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.09)",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Box
                sx={{
                  width: { xs: 46, md: 52 },
                  height: { xs: 46, md: 52 },
                  borderRadius: 2.5,
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
                  label={isPreparationMode ? "مسار التحضير" : "بوابة المعلم"}
                  icon={<ScheduleRounded />}
                  sx={{
                    mb: 0.3,
                    bgcolor: "rgba(255, 216, 128, .13)",
                    color: "#ffdc8e",
                    border: "1px solid rgba(255, 220, 142, .28)",
                    fontWeight: 900,
                    "& .MuiChip-icon": { color: "#ffdc8e" },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: 23, md: 28 },
                    fontWeight: 900,
                    lineHeight: 1.05,
                  }}
                >
                  {isPreparationMode
                    ? "اختر حصة للتحضير"
                    : "جدولي الدراسي"}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.75)",
                    mt: 0.3,
                    fontSize: { xs: 10.5, md: 11.5 },
                  }}
                >
                  {isPreparationMode
                    ? "اعرض الحصص غير المحضرة، ثم ابدأ رفع ملف التحضير"
                    : "تابع حصص الأسبوع والتحضيرات والحضور من مكان واحد"}
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
                  px: 1.4,
                  minHeight: 36,
                  fontSize: 12,
                  fontWeight: 900,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,.55)",
                    bgcolor: "rgba(255,255,255,.06)",
                  },
                }}
              >
                لوحة التحكم
              </Button>

              <NotificationBell
                sx={{
                  width: 36,
                  height: 36,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.28)",
                  borderRadius: 2.2,
                  "&:hover": { bgcolor: "rgba(255,255,255,.06)" },
                }}
              />

              <Tooltip title="تحديث الجدول">
                <span>
                  <IconButton
                    onClick={() =>
                      loadSchedule({ silent: true })
                    }
                    disabled={refreshing}
                    sx={{
                      width: 36,
                      height: 36,
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,.28)",
                      borderRadius: 2.2,
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={21} color="inherit" />
                    ) : (
                      <RefreshRounded />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {isPreparationMode ? (
          <Paper
            elevation={0}
            sx={{
              mb: 1,
              px: { xs: 1, md: 1.25 },
              py: 0.9,
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", md: "row" },
              gap: 0.8,
              borderRadius: 2.2,
              border: "1px solid #d8e9f5",
              bgcolor: "#f4fbff",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.9}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: 1.8,
                  bgcolor: "#dff2ff",
                  color: "#176a9b",
                }}
              >
                <MenuBookRounded fontSize="small" />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#0c3557",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  اختاري الحصة ثم اضغطي «إضافة تحضير»
                </Typography>
                <Typography
                  sx={{
                    mt: 0.1,
                    color: "#688399",
                    fontSize: 10.8,
                  }}
                >
                  الخطوات: اختيار الحصة ← رفع ملف PDF ← حفظ التحضير
                </Typography>
              </Box>
            </Stack>

            <Button
              size="small"
              variant="text"
              onClick={() =>
                navigate("/teacher/schedule", {
                  replace: true,
                })
              }
              sx={{
                alignSelf: { xs: "flex-end", md: "center" },
                color: "#1e5d86",
                fontWeight: 900,
                fontSize: 11,
              }}
            >
              عرض الجدول الكامل
            </Button>
          </Paper>
        ) : null}

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
            sx={{ mb: 1, py: 0.15, borderRadius: 2, fontSize: 12 }}
          >
            {error}
          </Alert>
        ) : null}

        {!isPreparationMode && todaySupervisorInfo.isAssigned ? (
          <Paper
            elevation={0}
            sx={{
              mb: 1,
              px: { xs: 1.2, md: 1.5 },
              py: { xs: 1.1, md: 1.25 },
              borderRadius: 2.5,
              border: "1.5px solid #dfbe72",
              bgcolor: "#fffaf0",
              boxShadow: "0 8px 20px rgba(173, 124, 34, .05)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              gap={1}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                spacing={1}
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    bgcolor: "#e2ae45",
                    color: "#fff",
                  }}
                >
                  <ShieldRounded />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.8}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography
                      sx={{
                        color: "#b27713",
                        fontSize: { xs: 14, md: 16 },
                        fontWeight: 900,
                      }}
                    >
                      أنت مكلّف بالمناوبة والإشراف اليوم
                    </Typography>

                    <Chip
                      size="small"
                      label="مناوب معتمد"
                      sx={{
                        height: 26,
                        color: "#fff",
                        bgcolor: "#b78325",
                        fontSize: 10.5,
                        fontWeight: 900,
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: "#42556a",
                      fontSize: { xs: 11, md: 12 },
                      lineHeight: 1.8,
                    }}
                  >
                    {todaySupervisorInfo.notes ||
                      "يرجى متابعة انضباط الطابور، الفسحة، الممرات، وتنظيم دخول وخروج الطلاب."}
                  </Typography>

                  {todaySupervisorInfo.names.length > 0 ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.6}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.7 }}
                    >
                      <Typography
                        sx={{
                          color: "#7f8a96",
                          fontSize: 10.5,
                          fontWeight: 800,
                        }}
                      >
                        المناوبون اليوم:
                      </Typography>

                      {todaySupervisorInfo.names.map((name) => (
                        <Chip
                          key={name}
                          size="small"
                          label={name}
                          sx={{
                            height: 25,
                            bgcolor: "#f1eee7",
                            color: "#51677b",
                            fontSize: 10.5,
                            fontWeight: 800,
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {!isPreparationMode ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 0.8,
            mb: 1,
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
            value={todayLectures.length + todayCoverCount}
            helper={
              todayCoverCount > 0
                ? `${todayCoverCount} احتياطي اليوم${
                    todayExcusedCount > 0
                      ? ` · ${todayExcusedCount} باستئذان`
                      : ""
                  }`
                : todayExcusedCount > 0
                  ? `${todayExcusedCount} حصة معفاة باستئذان`
                  : todayLectures.length
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
        ) : null}

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.2,
            borderColor: "#e5ebf0",
            p: 0.8,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: isPreparationMode
                  ? "minmax(280px, 1fr) 220px 220px"
                  : "minmax(260px, 1fr) 220px 220px 210px",
              },
              gap: 0.7,
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

            {!isPreparationMode ? (
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
            ) : null}
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
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
              px: { xs: 1.1, md: 1.35 },
              py: 0.85,
              borderBottom: "1px solid #e9edf2",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#082a4b",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                {isPreparationMode
                  ? "الحصص التي تحتاج تحضير"
                  : "الجدول الأسبوعي"}
              </Typography>
              <Typography sx={{ color: "#98a3b2", fontSize: 12 }}>
                {isPreparationMode
                  ? `${filteredLectures.length} حصة جاهزة لاختيار التحضير`
                  : formatWeekRange(weekStart)}
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
                minHeight: 330,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <CircularProgress size={34} />
                <Typography sx={{ color: "#8c98a8", fontSize: 13 }}>
                  جاري تحميل جدولك...
                </Typography>
              </Stack>
            </Box>
          ) : enrichedLectures.length === 0 && visibleCoverCount === 0 ? (
            <Box
              sx={{
                minHeight: 330,
                display: "grid",
                placeItems: "center",
                px: 2,
                textAlign: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 66,
                    height: 66,
                    borderRadius: 3,
                    bgcolor: "#fff3d8",
                    color: "#b67a14",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ScheduleRounded sx={{ fontSize: 34 }} />
                </Box>
                <Typography sx={{ color: "#082a4b", fontWeight: 900 }}>
                  لا توجد حصص مرتبطة بحسابك
                </Typography>
                <Typography sx={{ color: "#98a3b2", fontSize: 13 }}>
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
                  sx={{ fontSize: 38, color: "#ba821f" }}
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
                  lg: isPreparationMode
                    ? "repeat(2, minmax(0, 1fr))"
                    : `repeat(${Math.min(
                        displayedDays.length,
                        5
                      )}, minmax(0, 1fr))`,
                  xl: isPreparationMode
                    ? "repeat(3, minmax(0, 1fr))"
                    : undefined,
                },
                gap: 0.8,
                p: { xs: 0.8, md: 1 },
                alignItems: "start",
              }}
            >
              {displayedDays.map((day) => {
                const dayDate = getDateForDay(weekStart, day.jsDay);
                const dayLectures = lecturesByDay.get(day.key) || [];
                const dayCovers = coverSlotsByDay.get(day.key) || [];
                const dayItems = [
                  ...dayLectures.map((lecture) => ({
                    kind: "own",
                    slot: lecture.scheduleSlot,
                    lecture,
                  })),
                  ...dayCovers.map((cover, index) => ({
                    kind: "cover",
                    slot: Number(cover?.slot) || 0,
                    cover,
                    key:
                      normalizeId(cover?.substitutionId) ||
                      normalizeId(cover?.lectureId) ||
                      `${day.key}-${cover?.slot ?? index}-${index}`,
                  })),
                ].sort((a, b) => a.slot - b.slot);
                const isToday = day.key === todayKey;

                return (
                  <Paper
                    key={day.key}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.2,
                      overflow: "hidden",
                      borderColor: isPreparationMode
                        ? "#ead7aa"
                        : isToday
                        ? "#2f6f9f"
                        : "#e3e8ee",
                      boxShadow: isPreparationMode
                        ? "0 8px 22px rgba(127, 91, 22, .07)"
                        : isToday
                        ? "0 10px 24px rgba(34, 91, 134, .09)"
                        : "none",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 1,
                        py: 0.75,
                        bgcolor: isPreparationMode
                          ? "#fff8e9"
                          : isToday
                          ? "#214f77"
                          : "#f7f9fb",
                        color: isPreparationMode
                          ? "#8a5c0d"
                          : isToday
                          ? "#fff"
                          : "#173d60",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 13.5 }}>
                          {day.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: isToday
                              ? "rgba(255,255,255,.72)"
                              : "#9aa6b5",
                            fontSize: 11,
                          }}
                        >
                          {formatDayDate(dayDate)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={
                          dayCovers.length > 0
                            ? `${dayItems.length} حصة · ${dayCovers.length} احتياطي`
                            : `${dayItems.length} حصة`
                        }
                        sx={{
                          bgcolor: isToday
                            ? "rgba(255,255,255,.13)"
                            : "#e9eef3",
                          color: isToday ? "#fff" : "#315571",
                          fontWeight: 900,
                        }}
                      />
                    </Stack>

                    <Stack spacing={0.7} sx={{ p: 0.7 }}>
                      {dayItems.length === 0 ? (
                        <Box
                          sx={{
                            minHeight: 76,
                            display: "grid",
                            placeItems: "center",
                            textAlign: "center",
                            color: "#a4aebb",
                          }}
                        >
                          <Box>
                            <CalendarMonthRounded sx={{ fontSize: 22 }} />
                            <Typography sx={{ fontSize: 12, mt: 0.3 }}>
                              لا توجد حصص
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        dayItems.map((item) => {
                          if (item.kind === "cover") {
                            const cover = item.cover;

                            return (
                              <Paper
                                key={`cover-${item.key}`}
                                variant="outlined"
                                sx={{
                                  borderRadius: 2,
                                  borderColor: "#b9d4ec",
                                  bgcolor: "#f4f9fd",
                                  p: 0.85,
                                }}
                              >
                                <Stack spacing={0.6}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    spacing={1}
                                  >
                                    <Chip
                                      size="small"
                                      label={
                                        SLOT_LABELS[item.slot] ||
                                        `الحصة ${item.slot}`
                                      }
                                      sx={{
                                        bgcolor: "#e5f1fb",
                                        color: "#245d88",
                                        fontWeight: 900,
                                        fontSize: 10.5,
                                      }}
                                    />
                                    <Chip
                                      size="small"
                                      color="info"
                                      label="احتياطي"
                                      sx={{ fontWeight: 900, fontSize: 10.5 }}
                                    />
                                  </Stack>

                                  <Box>
                                    <Typography
                                      sx={{
                                        color: "#082a4b",
                                        fontWeight: 900,
                                        fontSize: 12.5,
                                        lineHeight: 1.35,
                                      }}
                                    >
                                      {cover?.subjectName || "حصة احتياطي"}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "#71879a",
                                        fontSize: 10.5,
                                        mt: 0.15,
                                      }}
                                    >
                                      {[
                                        cover?.className,
                                        cover?.roomNumber
                                          ? `غرفة ${cover.roomNumber}`
                                          : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "—"}
                                    </Typography>
                                    {cover?.coveringFor ? (
                                      <Typography
                                        sx={{
                                          color: "#4f7390",
                                          fontSize: 10.5,
                                          mt: 0.2,
                                          fontWeight: 800,
                                        }}
                                      >
                                        بدل {cover.coveringFor}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                </Stack>
                              </Paper>
                            );
                          }

                          const lecture = item.lecture;
                          const lectureId = getLectureId(lecture);
                          const hasPreparation = Boolean(
                            getPreparationId(
                              lecture.schedulePreparation
                            )
                          );
                          const isExcused = Boolean(
                            lecture.scheduleExcusedByLeave
                          );

                          return (
                            <Paper
                              key={lectureId}
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                borderColor: isExcused
                                  ? "#e5c98a"
                                  : hasPreparation
                                    ? "#dcebe3"
                                    : "#f0dfbb",
                                bgcolor: isExcused
                                  ? "#fff8e9"
                                  : hasPreparation
                                    ? "#fbfefc"
                                    : "#fffcf6",
                                p: 0.85,
                              }}
                            >
                              <Stack spacing={0.6}>
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
                                      fontSize: 10.5,
                                    }}
                                  />

                                  <Stack
                                    direction="row"
                                    spacing={0.4}
                                    alignItems="center"
                                  >
                                    {isExcused ? (
                                      <Chip
                                        size="small"
                                        color="warning"
                                        label="مستأذن"
                                        sx={{
                                          fontWeight: 900,
                                          fontSize: 10.5,
                                        }}
                                      />
                                    ) : null}
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
                                        fontSize: 10.5,
                                        "& .MuiChip-icon": {
                                          color: "inherit",
                                        },
                                      }}
                                    />
                                  </Stack>
                                </Stack>

                                <Box>
                                  <Typography
                                    sx={{
                                      color: "#082a4b",
                                      fontWeight: 900,
                                      fontSize: 12.5,
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {lecture.scheduleSubject.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "#8d99a8",
                                      fontSize: 10.5,
                                      mt: 0.15,
                                    }}
                                  >
                                    {lecture.scheduleClassLabel}
                                  </Typography>
                                </Box>

                                <Stack
                                  direction="row"
                                  spacing={0.7}
                                  sx={{ pt: 0.3 }}
                                >
                                  {(hasPreparation || preparationPermissions.add) && (
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
                                      fontSize: 10.5,
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
                                  )}

                                  <Tooltip
                                    title={
                                      isExcused
                                        ? "الحصة معفاة باستئذان معتمد"
                                        : "تسجيل الحضور"
                                    }
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={isExcused}
                                        onClick={() =>
                                          openAttendance(lecture, day)
                                        }
                                        sx={{
                                          border: "1px solid #d9e2ea",
                                          borderRadius: 1.8,
                                          color: "#1d5d86",
                                        }}
                                      >
                                        <HowToRegRounded fontSize="small" />
                                      </IconButton>
                                    </span>
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
