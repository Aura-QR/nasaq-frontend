import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
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
  GroupsRounded,
  HowToRegRounded,
  PersonOffRounded,
  RefreshRounded,
  SaveRounded,
  SchoolRounded,
  SearchRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import {
  addAttendance,
  deleteAttendance,
  fetchAttendance,
  fetchLectureAttendanceSheet,
} from "@/APIs/school/attendance";

import {
  fetchLectures,
} from "@/APIs/school/lectures";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

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

const extractCollection = (response, extraKeys = []) => {
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
    payload.classes,
    payload.students,
    payload.attendance,
    payload.attendances,
    payload.absences,
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

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const isMongoId = (value) =>
  /^[a-f\d]{24}$/i.test(normalizeId(value));

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

const extractStudentsFromClass = (value) => {
  const payload = unwrapResponse(value);
  const classEntity =
    payload?.class ||
    payload?.classData ||
    payload?.schoolClass ||
    payload;

  const candidates = [
    classEntity?.students,
    classEntity?.studentIds,
    classEntity?.enrolledStudents,
    classEntity?.members,
    classEntity?.enrollments,
    payload?.students,
    payload?.studentIds,
    payload?.enrolledStudents,
    payload?.members,
    payload?.enrollments,
  ];

  return candidates.find(Array.isArray) || [];
};

const getClassEntity = (classItem) => {
  if (!classItem || typeof classItem !== "object") {
    return classItem;
  }

  const nestedCandidates = [
    classItem?.class,
    classItem?.classId,
    classItem?.classroom,
    classItem?.schoolClass,
  ];

  return (
    nestedCandidates.find(
      (candidate) => candidate && typeof candidate === "object"
    ) || classItem
  );
};

const getClassId = (classItem) => {
  const entity = getClassEntity(classItem);

  return normalizeId(
    entity?._id ||
      entity?.id ||
      classItem?.classId ||
      classItem?.class ||
      classItem?.classroom ||
      classItem?.schoolClass ||
      entity
  );
};

const getClassName = (classItem, index = 0) => {
  const entity = getClassEntity(classItem);

  const gradeName =
    entity?.gradeLevelId?.name ||
    entity?.gradeLevel?.name ||
    entity?.gradeName ||
    "";

  const roomNumber = String(entity?.roomNumber || "").trim();
  const explicitClassName = String(
    entity?.className ||
      entity?.title ||
      entity?.displayName ||
      ""
  ).trim();

  // الباك المنشور قد يعيد اسم المدرسة داخل entity.name،
  // لذلك لا نستخدمه كاسم للفصل. رقم الغرفة هو المصدر الأدق حاليًا.
  const roomLabel = roomNumber ? `فصل ${roomNumber}` : explicitClassName;

  const parts = [gradeName, roomLabel]
    .filter(Boolean)
    .filter((value, itemIndex, array) => array.indexOf(value) === itemIndex);

  return parts.join(" - ") || `فصل ${index + 1}`;
};

const getStudentEntity = (row) =>
  row?.student ||
  row?.studentId ||
  row?.studentProfile ||
  row;

const getStudentId = (row) =>
  normalizeId(getStudentEntity(row));

const getStudentName = (row, index = 0) => {
  const student = getStudentEntity(row);
  const combinedName = [student?.firstName, student?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    student?.name ||
    student?.fullName ||
    student?.studentName ||
    combinedName ||
    `طالب ${index + 1}`
  );
};

const getStudentCode = (row) => {
  const student = getStudentEntity(row);

  return (
    student?.studentCode ||
    student?.code ||
    student?.username ||
    student?.email ||
    ""
  );
};

const getAttendanceStudentId = (record) =>
  normalizeId(
    record?.studentId ||
      record?.student ||
      record?.studentProfile
  );

const getAttendanceRecordId = (record) => normalizeId(record);

const getAttendanceClassId = (record) =>
  normalizeId(record?.classId || record?.class);

const getAttendanceDate = (record) =>
  String(record?.date || record?.attendanceDate || "").slice(0, 10);

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getDateWeekday = (value) => {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return WEEKDAY_KEYS[date.getDay()] || "";
};

const getLectureId = (lecture) =>
  normalizeId(lecture);

const getLectureClassId = (lecture) =>
  normalizeId(
    lecture?.class ||
      lecture?.classId ||
      lecture?.classroom ||
      lecture?.schoolClass
  );

const getLectureWeekday = (lecture) =>
  String(
    lecture?.dayOfWeek ||
      lecture?.weekday ||
      lecture?.day ||
      ""
  )
    .trim()
    .toLowerCase();

const getSheetAttendanceRecordId = (studentRow) =>
  normalizeId(
    studentRow?.attendanceId ||
      studentRow?.attendanceRecordId ||
      studentRow?.absenceId ||
      studentRow?.attendance ||
      studentRow?.absence ||
      studentRow?.record
  );

const sameSet = (first, second) => {
  if (first.size !== second.size) return false;

  for (const value of first) {
    if (!second.has(value)) return false;
  }

  return true;
};

const StatCard = ({ icon, label, value, helper, accent = "navy" }) => {
  const palette = {
    navy: {
      icon: "#214E78",
      background: "rgba(33,78,120,.08)",
    },
    green: {
      icon: "#25865A",
      background: "rgba(37,134,90,.10)",
    },
    red: {
      icon: "#C44545",
      background: "rgba(196,69,69,.09)",
    },
    gold: {
      icon: "#B9821D",
      background: "rgba(226,173,59,.16)",
    },
  }[accent] || {
    icon: "#214E78",
    background: "rgba(33,78,120,.08)",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 96,
        p: 1.55,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "18px",
        backgroundColor: "#fff",
        boxShadow: "0 10px 24px rgba(18,47,77,.055)",
      }}
    >
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

      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: palette.icon,
          backgroundColor: palette.background,
          borderRadius: "13px",
          "& svg": { fontSize: 23 },
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const teacherId = useMemo(
    () => resolveTeacherId(authRoot, currentUser),
    [authRoot, currentUser]
  );

  const [initialRequestedClassId] = useState(
    () => searchParams.get("classId") || ""
  );
  const requestedDate = searchParams.get("date") || formatLocalDate();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(
    isMongoId(initialRequestedClassId) ? initialRequestedClassId : ""
  );
  const [selectedDate, setSelectedDate] = useState(requestedDate);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [initialAbsentIds, setInitialAbsentIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep the latest classes outside loadRoster dependencies.
  // Updating class metadata must not trigger a new roster request.
  const classesRef = useRef([]);
  const lecturesRef = useRef([]);
  const rosterRequestIdRef = useRef(0);
  const pendingRosterKeyRef = useRef("");
  const pendingClassesRef = useRef(false);

  const selectedClass = useMemo(
    () => classes.find((item) => getClassId(item) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const classSelectValue = useMemo(
    () =>
      classes.some((item) => getClassId(item) === selectedClassId)
        ? selectedClassId
        : "",
    [classes, selectedClassId]
  );

  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);

  const uniqueStudents = useMemo(() => {
    const seen = new Set();

    return students.filter((row) => {
      const id = getStudentId(row);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [students]);

  const counts = useMemo(() => {
    const total = uniqueStudents.length;
    const absent = absentIds.size;
    const present = Math.max(0, total - absent);

    return {
      total,
      absent,
      present,
      saved: initialAbsentIds.size,
    };
  }, [uniqueStudents, absentIds, initialAbsentIds]);

  const hasChanges = useMemo(
    () => !sameSet(absentIds, initialAbsentIds),
    [absentIds, initialAbsentIds]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return uniqueStudents.filter((row, index) => {
      const id = getStudentId(row);
      const isAbsent = absentIds.has(id);

      if (statusFilter === "absent" && !isAbsent) return false;
      if (statusFilter === "present" && isAbsent) return false;

      if (!query) return true;

      const searchable = [
        getStudentName(row, index),
        getStudentCode(row),
        id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [uniqueStudents, absentIds, search, statusFilter]);

  const loadClasses = useCallback(async () => {
    if (pendingClassesRef.current) return;

    pendingClassesRef.current = true;
    setLoadingClasses(true);
    setError("");

    try {
      if (!teacherId) {
        throw new Error(
          "تعذر تحديد حساب المعلم الحالي من بيانات تسجيل الدخول"
        );
      }

      const lecturesResponse = await fetchLectures(
        {
          teacherId,
          page: 1,
          limit: 500,
        },
        { force: true }
      );

      if (isFailedResponse(lecturesResponse)) {
        throw new Error(
          getErrorMessage(lecturesResponse, "تعذر تحميل جدول المعلم")
        );
      }

      const lectureList = extractCollection(lecturesResponse, [
        "lectures",
      ]);

      lecturesRef.current = lectureList;

      const map = new Map();

      lectureList.forEach((lecture) => {
        const rawClass =
          lecture?.class ||
          lecture?.classId ||
          lecture?.classroom ||
          lecture?.schoolClass;

        const classId = normalizeId(rawClass);
        if (!isMongoId(classId) || map.has(classId)) return;

        const entity =
          rawClass && typeof rawClass === "object"
            ? rawClass
            : { _id: classId };

        map.set(classId, entity);
      });

      const uniqueClasses = Array.from(map.values());
      classesRef.current = uniqueClasses;
      setClasses(uniqueClasses);

      setSelectedClassId((current) => {
        const initialExists = uniqueClasses.some(
          (item) => getClassId(item) === initialRequestedClassId
        );

        if (isMongoId(initialRequestedClassId) && initialExists) {
          return initialRequestedClassId;
        }

        const currentExists = uniqueClasses.some(
          (item) => getClassId(item) === current
        );

        if (isMongoId(current) && currentExists) return current;
        return uniqueClasses[0] ? getClassId(uniqueClasses[0]) : "";
      });

      if (!uniqueClasses.length) {
        setError(
          "لا توجد فصول داخل حصص المعلم الحالية. راجع الجدول وتكليفات المعلم من حساب الإدارة."
        );
      }
    } catch (requestError) {
      lecturesRef.current = [];
      setClasses([]);
      setSelectedClassId("");
      setError(
        requestError?.message || "حدث خطأ أثناء تحميل فصول المعلم"
      );
    } finally {
      pendingClassesRef.current = false;
      setLoadingClasses(false);
    }
  }, [teacherId, initialRequestedClassId]);

  const loadRoster = useCallback(
    async ({ silent = false, force = false } = {}) => {
      if (!isMongoId(selectedClassId) || !selectedDate) {
        setStudents([]);
        setAttendanceRecords([]);
        setAbsentIds(new Set());
        setInitialAbsentIds(new Set());
        return;
      }

      const requestKey = `${selectedClassId}:${selectedDate}`;

      // React StrictMode may run effects twice in development.
      // Do not start the same request while it is already pending.
      if (!force && pendingRosterKeyRef.current === requestKey) {
        return;
      }

      pendingRosterKeyRef.current = requestKey;
      const requestId = ++rosterRequestIdRef.current;

      if (silent) setRefreshing(true);
      else setLoadingRoster(true);

      setError("");

      try {
        const selectedWeekday = getDateWeekday(selectedDate);

        const lecture =
          lecturesRef.current.find(
            (item) =>
              getLectureClassId(item) === selectedClassId &&
              getLectureWeekday(item) === selectedWeekday
          ) || null;

        const lectureId = getLectureId(lecture);

        if (!isMongoId(lectureId)) {
          setStudents([]);
          setAttendanceRecords([]);
          setAbsentIds(new Set());
          setInitialAbsentIds(new Set());
          setError(
            "لا توجد حصة لهذا الفصل في التاريخ المحدد."
          );
          return;
        }

        const sheetResponse =
          await fetchLectureAttendanceSheet(
            lectureId,
            selectedDate
          );

        // Ignore an old request that finished after a newer request.
        if (requestId !== rosterRequestIdRef.current) return;

        if (isFailedResponse(sheetResponse)) {
          throw new Error(
            getErrorMessage(
              sheetResponse,
              "تعذر تحميل كشف الحضور"
            )
          );
        }

        const sheet = unwrapResponse(sheetResponse) || {};
        const studentList = Array.isArray(sheet?.students)
          ? sheet.students
          : [];

        const savedAbsentIds = new Set(
          studentList
            .filter((row) => row?.absent === true)
            .map(getStudentId)
            .filter(Boolean)
        );

        const explicitRecords =
          [
            sheet?.attendanceRecords,
            sheet?.attendance,
            sheet?.attendances,
            sheet?.absences,
          ].find(Array.isArray) || [];

        const records = explicitRecords.length
          ? explicitRecords
          : studentList
              .filter((row) => row?.absent === true)
              .map((row) => ({
                _id: getSheetAttendanceRecordId(row),
                studentId: getStudentId(row),
                classId: selectedClassId,
                date: selectedDate,
              }));

        const sheetLecture =
          sheet?.lecture ||
          lecture ||
          null;

        const rawRosterClass =
          sheet?.class ||
          sheetLecture?.class ||
          sheetLecture?.classId ||
          sheetLecture?.classroom ||
          sheetLecture?.schoolClass ||
          null;

        const rosterClass =
          rawRosterClass &&
          typeof rawRosterClass === "object"
            ? rawRosterClass
            : null;

        if (rosterClass) {
          setClasses((current) => {
            let changed = false;

            const next = current.map((item) => {
              if (getClassId(item) !== selectedClassId) return item;

              const existing = getClassEntity(item) || {};
              const nextRoomNumber = String(
                rosterClass?.roomNumber || existing?.roomNumber || ""
              ).trim();
              const currentRoomNumber = String(
                existing?.roomNumber || ""
              ).trim();

              const nextGradeName = String(
                rosterClass?.gradeLevelId?.name ||
                  rosterClass?.gradeLevel?.name ||
                  rosterClass?.gradeName ||
                  ""
              ).trim();
              const currentGradeName = String(
                existing?.gradeLevelId?.name ||
                  existing?.gradeLevel?.name ||
                  existing?.gradeName ||
                  ""
              ).trim();

              if (
                nextRoomNumber === currentRoomNumber &&
                (!nextGradeName || nextGradeName === currentGradeName)
              ) {
                return item;
              }

              changed = true;
              return {
                ...existing,
                ...rosterClass,
                _id: selectedClassId,
              };
            });

            if (changed) {
              classesRef.current = next;
              return next;
            }

            return current;
          });
        }

        setStudents(studentList);
        setAttendanceRecords(records);
        setAbsentIds(new Set(savedAbsentIds));
        setInitialAbsentIds(new Set(savedAbsentIds));
      } catch (requestError) {
        if (requestId !== rosterRequestIdRef.current) return;

        setStudents([]);
        setAttendanceRecords([]);
        setAbsentIds(new Set());
        setInitialAbsentIds(new Set());
        setError(
          requestError?.message || "حدث خطأ أثناء تحميل سجل الحضور"
        );
      } finally {
        if (requestId === rosterRequestIdRef.current) {
          pendingRosterKeyRef.current = "";
          setLoadingRoster(false);
          setRefreshing(false);
        }
      }
    },
    [selectedClassId, selectedDate]
  );

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (isMongoId(selectedClassId)) next.set("classId", selectedClassId);
    else next.delete("classId");

    if (selectedDate) next.set("date", selectedDate);
    else next.delete("date");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedClassId, selectedDate, searchParams, setSearchParams]);

  const toggleAbsent = (studentId) => {
    if (!studentId || saving) return;

    setAbsentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const setVisibleStudentsAbsent = () => {
    setAbsentIds((current) => {
      const next = new Set(current);
      filteredStudents.forEach((row) => {
        const id = getStudentId(row);
        if (id) next.add(id);
      });
      return next;
    });
  };

  const setAllPresent = () => {
    setAbsentIds(new Set());
  };

  const handleSave = async () => {
    if (!isMongoId(selectedClassId) || !selectedDate) {
      toast.error("اختر فصلًا صحيحًا والتاريخ أولًا");
      return;
    }

    if (!hasChanges) {
      toast.info("لا توجد تغييرات جديدة للحفظ");
      return;
    }

    const existingByStudent = new Map(
      attendanceRecords
        .map((record) => [getAttendanceStudentId(record), record])
        .filter(([studentId]) => Boolean(studentId))
    );

    const toAdd = [...absentIds].filter(
      (studentId) => !existingByStudent.has(studentId)
    );

    const toDelete = [...existingByStudent.entries()].filter(
      ([studentId]) => !absentIds.has(studentId)
    );

    let attendanceLookupPromise = null;

    const resolveAttendanceRecordId = async (
      studentId,
      record
    ) => {
      const directId = getAttendanceRecordId(record);

      if (directId) {
        return directId;
      }

      if (!attendanceLookupPromise) {
        attendanceLookupPromise = fetchAttendance({
          classId: selectedClassId,
          date: selectedDate,
          page: 1,
          limit: 500,
        });
      }

      const lookupResponse = await attendanceLookupPromise;

      if (isFailedResponse(lookupResponse)) {
        throw new Error(
          getErrorMessage(
            lookupResponse,
            "تعذر تحديد سجل الغياب المطلوب حذفه"
          )
        );
      }

      const matchingRecord = extractCollection(
        lookupResponse,
        ["attendanceRecords"]
      ).find((item) => {
        const itemStudentId =
          getAttendanceStudentId(item);
        const itemClassId =
          getAttendanceClassId(item);
        const itemDate =
          getAttendanceDate(item);

        return (
          itemStudentId === studentId &&
          (!itemClassId || itemClassId === selectedClassId) &&
          (!itemDate || itemDate === selectedDate)
        );
      });

      return getAttendanceRecordId(matchingRecord);
    };

    setSaving(true);

    try {
      const operations = [
        ...toAdd.map(async (studentId) => {
          const response = await addAttendance({
            studentId,
            classId: selectedClassId,
            date: selectedDate,
          });

          if (isFailedResponse(response)) {
            throw new Error(
              getErrorMessage(response, "تعذر إضافة غياب طالب")
            );
          }

          return response;
        }),
        ...toDelete.map(async ([studentId, record]) => {
          const recordId =
            await resolveAttendanceRecordId(
              studentId,
              record
            );

          if (!recordId) {
            throw new Error(
              "تعذر تحديد سجل الغياب المطلوب حذفه"
            );
          }

          const response = await deleteAttendance(recordId);

          if (isFailedResponse(response)) {
            throw new Error(
              getErrorMessage(response, "تعذر حذف غياب طالب")
            );
          }

          return response;
        }),
      ];

      const results = await Promise.allSettled(operations);
      const failures = results.filter((result) => result.status === "rejected");

      await loadRoster({ silent: true, force: true });

      if (failures.length) {
        toast.error(
          `تم حفظ جزء من السجل، وتعذر تنفيذ ${failures.length} عملية`
        );
      } else {
        toast.success(
          `تم حفظ الحضور بنجاح • ${absentIds.size} غائب`
        );
      }
    } catch (requestError) {
      toast.error(
        requestError?.message || "حدث خطأ أثناء حفظ الحضور"
      );
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingClasses || loadingRoster;

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: { xs: 2, sm: 2.5, md: 3.5 },
        color: "#122F4D",
        backgroundColor: "transparent",
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
            gap={1.6}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.55}>
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
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Chip
                  icon={<HowToRegRounded />}
                  label="بوابة المعلم"
                  size="small"
                  sx={{
                    mb: 0.75,
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
                    fontSize: { xs: "22px", md: "28px" },
                    fontWeight: 900,
                    lineHeight: 1.18,
                  }}
                >
                  تسجيل الحضور
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    color: "rgba(255,255,255,.72)",
                    fontSize: { xs: "9.5px", md: "10.5px" },
                  }}
                >
                  حدّد الطلاب الغائبين فقط، وسيُعتبر باقي الفصل حاضرًا تلقائيًا.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={0.8}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
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
                لوحة التحكم
              </Button>

              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    type="button"
                    disabled={refreshing || !selectedClassId}
                    onClick={() => loadRoster({ silent: true, force: true })}
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
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 1.25,
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
            icon={<GroupsRounded />}
            label="إجمالي الطلاب"
            value={counts.total}
            helper={selectedClass ? getClassName(selectedClass) : "اختر فصلًا"}
          />
          <StatCard
            icon={<CheckCircleRounded />}
            label="الحاضرون"
            value={counts.present}
            helper="يُحسبون تلقائيًا من إجمالي الفصل"
            accent="green"
          />
          <StatCard
            icon={<PersonOffRounded />}
            label="الغائبون"
            value={counts.absent}
            helper="الطلاب المحددون حاليًا"
            accent="red"
          />
          <StatCard
            icon={<SaveRounded />}
            label="غياب محفوظ"
            value={counts.saved}
            helper={formatDisplayDate(selectedDate)}
            accent="gold"
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            p: { xs: 1.1, md: 1.35 },
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "17px",
            backgroundColor: "#fff",
            boxShadow: "0 10px 24px rgba(18,47,77,.045)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            alignItems={{ xs: "stretch", lg: "center" }}
            gap={1}
          >
            <TextField
              select
              value={classSelectValue}
              onChange={(event) => setSelectedClassId(event.target.value)}
              label="الفصل"
              size="small"
              disabled={loadingClasses || !classes.length}
              sx={{
                minWidth: { xs: "100%", lg: 250 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                },
              }}
            >
              {classes.map((item, index) => (
                <MenuItem key={getClassId(item)} value={getClassId(item)}>
                  {getClassName(item, index)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              label="التاريخ"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: { xs: "100%", lg: 210 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                },
              }}
            />

            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الطالب أو الكود"
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
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              label="الحالة"
              size="small"
              sx={{
                minWidth: { xs: "100%", lg: 165 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                  borderRadius: "12px",
                },
              }}
            >
              <MenuItem value="all">كل الطلاب</MenuItem>
              <MenuItem value="present">الحاضرون</MenuItem>
              <MenuItem value="absent">الغائبون</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="warning"
            sx={{ mt: 1.15, borderRadius: "13px", fontSize: "10px" }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={30} sx={{ color: "#214E78" }} />
              <Typography sx={{ color: "#7B8794", fontSize: "10px" }}>
                جاري تحميل طلاب الفصل...
              </Typography>
            </Stack>
          </Box>
        ) : !classes.length ? (
          <Box
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Stack alignItems="center" spacing={0.8}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  display: "grid",
                  placeItems: "center",
                  color: "#B9821D",
                  backgroundColor: "rgba(226,173,59,.16)",
                  borderRadius: "17px",
                }}
              >
                <SchoolRounded />
              </Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 900 }}>
                لا توجد فصول مرتبطة بحسابك
              </Typography>
              <Typography sx={{ color: "#8B96A3", fontSize: "9.5px" }}>
                راجع تكليفات المعلم من حساب الإدارة.
              </Typography>
            </Stack>
          </Box>
        ) : !uniqueStudents.length ? (
          <Box
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Stack alignItems="center" spacing={0.8}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  display: "grid",
                  placeItems: "center",
                  color: "#214E78",
                  backgroundColor: "rgba(33,78,120,.08)",
                  borderRadius: "17px",
                }}
              >
                <GroupsRounded />
              </Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 900 }}>
                لا يوجد طلاب في هذا الفصل
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
              sx={{ mt: 1.35, mb: 1 }}
            >
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 900 }}>
                  طلاب {getClassName(selectedClass)}
                </Typography>
                <Typography sx={{ mt: 0.15, color: "#8B96A3", fontSize: "9px" }}>
                  اضغط على الطالب لتغيير حالته بين حاضر وغائب.
                </Typography>
              </Box>

              <Stack direction="row" gap={0.7} flexWrap="wrap">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={setAllPresent}
                  disabled={!absentIds.size || saving}
                  startIcon={<CheckCircleRounded />}
                  sx={{
                    minHeight: 36,
                    borderRadius: "10px",
                    color: "#25865A",
                    borderColor: "rgba(37,134,90,.25)",
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "5px",
                      marginRight: 0,
                    },
                  }}
                >
                  الكل حاضر
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={setVisibleStudentsAbsent}
                  disabled={!filteredStudents.length || saving}
                  startIcon={<PersonOffRounded />}
                  sx={{
                    minHeight: 36,
                    borderRadius: "10px",
                    color: "#C44545",
                    borderColor: "rgba(196,69,69,.24)",
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "5px",
                      marginRight: 0,
                    },
                  }}
                >
                  تحديد الظاهر كغائب
                </Button>
              </Stack>
            </Stack>

            {!filteredStudents.length ? (
              <Box
                sx={{
                  minHeight: 220,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "#8B96A3", fontSize: "11px" }}>
                  لا توجد نتائج مطابقة للبحث أو الفلتر.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0,1fr))",
                    xl: "repeat(3, minmax(0,1fr))",
                  },
                  gap: 0.9,
                }}
              >
                {filteredStudents.map((row, index) => {
                  const studentId = getStudentId(row);
                  const name = getStudentName(row, index);
                  const code = getStudentCode(row);
                  const isAbsent = absentIds.has(studentId);
                  const initials = name
                    .trim()
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("");

                  return (
                    <Paper
                      key={studentId}
                      component="button"
                      type="button"
                      elevation={0}
                      onClick={() => toggleAbsent(studentId)}
                      sx={{
                        width: "100%",
                        p: 1.15,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        textAlign: "right",
                        cursor: "pointer",
                        border: isAbsent
                          ? "1px solid rgba(196,69,69,.28)"
                          : "1px solid rgba(37,134,90,.18)",
                        borderRadius: "15px",
                        backgroundColor: isAbsent
                          ? "rgba(196,69,69,.035)"
                          : "rgba(37,134,90,.025)",
                        boxShadow: "none",
                        transition: "all .18s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: "0 8px 18px rgba(18,47,77,.07)",
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            color: "white",
                            backgroundColor: isAbsent ? "#C44545" : "#25865A",
                            fontSize: "11px",
                            fontWeight: 900,
                          }}
                        >
                          {initials || "ط"}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{ fontSize: "14.5px", fontWeight: 900 }}
                          >
                            {name}
                          </Typography>
                          <Typography
                            noWrap
                            sx={{ mt: 0.3, color: "#8B96A3", fontSize: "12.5px" }}
                          >
                            {code || `رقم الطالب: ${studentId.slice(-6)}`}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          icon={isAbsent ? <PersonOffRounded /> : <CheckCircleRounded />}
                          label={isAbsent ? "غائب" : "حاضر"}
                          size="small"
                          sx={{
                            height: 28,
                            color: isAbsent ? "#A93434" : "#237449",
                            backgroundColor: isAbsent
                              ? "rgba(196,69,69,.10)"
                              : "rgba(37,134,90,.10)",
                            fontSize: "12px",
                            fontWeight: 900,
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                        <Checkbox
                          checked={isAbsent}
                          tabIndex={-1}
                          disableRipple
                          sx={{
                            p: 0.6,
                            color: "rgba(36,74,112,.28)",
                            "&.Mui-checked": { color: "#C44545" },
                          }}
                        />
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}

            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: { xs: 1.8, md: 2.2 },
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 1.5,
                border: hasChanges
                  ? "1px solid rgba(211,164,79,.38)"
                  : "1px solid rgba(36,74,112,.08)",
                borderRadius: "18px",
                backgroundColor: hasChanges
                  ? "rgba(242,215,146,.14)"
                  : "#fff",
                boxShadow: "0 10px 24px rgba(18,47,77,.05)",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "14.5px", fontWeight: 900 }}>
                  {hasChanges
                    ? "لديك تغييرات غير محفوظة"
                    : "سجل الحضور محفوظ"}
                </Typography>
                <Typography sx={{ mt: 0.3, color: "#8B96A3", fontSize: "12.5px" }}>
                  {counts.present} حاضر • {counts.absent} غائب • {formatDisplayDate(selectedDate)}
                </Typography>
              </Box>

              <Button
                type="button"
                variant="contained"
                disabled={!hasChanges || saving}
                onClick={handleSave}
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveRounded />
                  )
                }
                sx={{
                  minHeight: 44,
                  px: 2.6,
                  borderRadius: "12px",
                  color: "#122F4D",
                  backgroundColor: "#F2D792",
                  boxShadow: "none",
                  fontSize: "13.5px",
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
                حفظ الحضور
              </Button>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
};

export default TeacherAttendance;
