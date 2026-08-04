import {
  Alert,
  Avatar,
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
  GroupsRounded,
  HowToRegRounded,
  MailOutlineRounded,
  MenuBookRounded,
  PersonOffRounded,
  PersonRounded,
  PhoneOutlined,
  QuizRounded,
  RefreshRounded,
  ScheduleRounded,
  SearchRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";

import { fetchLectures } from "@/APIs/school/lectures";
import { fetchSingleClass } from "@/APIs/school/classes";
import { fetchStudents } from "@/APIs/school/students";

import nasaqLogo from "../../images/wadq-logo.png";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const isMongoId = (value) =>
  /^[a-f\d]{24}$/i.test(normalizeId(value));

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
    payload.students,
    payload.classes,
    payload.data,
    ...extraKeys.map((key) => payload?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const extractEntity = (response) => {
  const payload = unwrapResponse(response);

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return null;
  }

  return (
    payload.class ||
    payload.schoolClass ||
    payload.student ||
    payload.item ||
    payload
  );
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

const getClassEntity = (value) => {
  if (!value || typeof value !== "object") return null;

  const nested = [
    value?.class,
    value?.classId,
    value?.classroom,
    value?.schoolClass,
  ].find((candidate) => candidate && typeof candidate === "object");

  return nested || value;
};

const getClassId = (value) => {
  const entity = getClassEntity(value);

  return normalizeId(
    entity?._id ||
      entity?.id ||
      value?.class ||
      value?.classId ||
      value?.classroom ||
      value?.schoolClass ||
      value
  );
};

const getClassLabel = (value, index = 0) => {
  const entity = getClassEntity(value);

  if (!entity) return `فصل ${index + 1}`;

  const gradeName = String(
    entity?.gradeLevelId?.name ||
      entity?.gradeLevel?.name ||
      entity?.gradeName ||
      ""
  ).trim();

  const roomNumber = String(entity?.roomNumber || "").trim();
  const explicitName = String(
    entity?.className ||
      entity?.title ||
      entity?.displayName ||
      ""
  ).trim();

  const roomLabel = roomNumber ? `فصل ${roomNumber}` : explicitName;

  return (
    [gradeName, roomLabel]
      .filter(Boolean)
      .filter((item, itemIndex, array) => array.indexOf(item) === itemIndex)
      .join(" - ") || `فصل ${index + 1}`
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
    id: normalizeId(subject) || normalizeId(offering) || name,
    name,
    code,
    label: code ? `${name} - ${code}` : name,
  };
};

const getStudentEntity = (row) =>
  row?.student ||
  row?.studentId ||
  row?.studentProfile ||
  row;

const getStudentId = (row) => normalizeId(getStudentEntity(row));

const getStudentName = (row, index = 0) => {
  const student = getStudentEntity(row);
  const combined = [
    student?.firstName,
    student?.fatherName,
    student?.familyName || student?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    student?.name ||
    student?.fullName ||
    student?.studentName ||
    combined ||
    `طالب ${index + 1}`
  );
};

const getStudentEmail = (row) => {
  const student = getStudentEntity(row);
  return String(student?.email || "").trim();
};

const getStudentPhone = (row) => {
  const student = getStudentEntity(row);
  return String(student?.phoneNumber || student?.phone || "").trim();
};

const getStudentCode = (row) => {
  const student = getStudentEntity(row);

  return String(
    student?.studentCode ||
      student?.code ||
      student?.username ||
      ""
  ).trim();
};

const isStudentActive = (row) => {
  const student = getStudentEntity(row);
  return student?.isActive !== false && student?.status !== "inactive";
};

const formatLocalDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const initialsOf = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "ط";

  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return `${first}${last}`.toUpperCase();
};

const StatCard = ({ icon, title, value, helper, accent = "navy" }) => {
  const palette = {
    navy: {
      color: "#214E78",
      background: "rgba(33,78,120,.08)",
    },
    green: {
      color: "#25865A",
      background: "rgba(37,134,90,.10)",
    },
    gold: {
      color: "#B9821D",
      background: "rgba(226,173,59,.16)",
    },
    red: {
      color: "#C44545",
      background: "rgba(196,69,69,.09)",
    },
  }[accent];

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 92,
        p: 1.5,
        border: "1px solid rgba(36,74,112,.09)",
        borderRadius: "18px",
        backgroundColor: "#fff",
        boxShadow: "0 10px 24px rgba(18,47,77,.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.25,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#7C8796",
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            color: "#122F4D",
            fontSize: "23px",
            lineHeight: 1.1,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>

        <Typography
          noWrap
          sx={{
            mt: 0.35,
            color: "#9AA6B2",
            fontSize: "8.5px",
          }}
        >
          {helper}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 43,
          height: 43,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          borderRadius: "13px",
          color: palette.color,
          backgroundColor: palette.background,
          "& svg": { fontSize: 23 },
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const TeacherClasses = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const teacherId = useMemo(
    () => resolveTeacherId(authRoot, currentUser),
    [authRoot, currentUser]
  );

  const [classes, setClasses] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);
  const pendingRef = useRef(false);

  const loadData = useCallback(
    async ({ force = false } = {}) => {
      if (!teacherId) {
        setError("تعذر تحديد حساب المعلم الحالي. سجّل الدخول مرة أخرى.");
        setClasses([]);
        setStudentsByClass({});
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (pendingRef.current && !force) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      pendingRef.current = true;

      if (force) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const lecturesResponse = await fetchLectures(
          {
            teacherId,
            page: 1,
            limit: 500,
          },
          { force }
        );

        if (requestId !== requestIdRef.current) return;

        if (isFailedResponse(lecturesResponse)) {
          throw new Error(
            getErrorMessage(lecturesResponse, "تعذر تحميل فصول المعلم")
          );
        }

        const lectureList = extractCollection(lecturesResponse, ["lectures"]);
        const classMap = new Map();

        lectureList.forEach((lecture) => {
          const classId = getClassId(lecture);
          if (!isMongoId(classId)) return;

          const subject = getSubjectData(lecture);
          const existing = classMap.get(classId) || {
            id: classId,
            entity: getClassEntity(lecture),
            lectures: [],
            subjectsMap: new Map(),
          };

          existing.lectures.push(lecture);
          existing.subjectsMap.set(subject.id, subject);

          const lectureClass = getClassEntity(lecture);
          if (lectureClass && Object.keys(lectureClass).length > Object.keys(existing.entity || {}).length) {
            existing.entity = lectureClass;
          }

          classMap.set(classId, existing);
        });

        const basicClasses = Array.from(classMap.values());

        const detailedRows = await Promise.all(
          basicClasses.map(async (classRow, index) => {
            const [classResponse, studentsResponse] = await Promise.all([
              fetchSingleClass(classRow.id),
              fetchStudents({
                classId: classRow.id,
                page: 1,
                limit: 500,
              }),
            ]);

            const students = isFailedResponse(studentsResponse)
              ? []
              : extractCollection(studentsResponse, ["students"]);

            const classDetails = isFailedResponse(classResponse)
              ? null
              : extractEntity(classResponse);

            const classFromStudent = students
              .map((student) => getClassEntity(getStudentEntity(student)?.class || student))
              .find(Boolean);

            const entity =
              classDetails ||
              classFromStudent ||
              classRow.entity ||
              { _id: classRow.id };

            return {
              ...classRow,
              entity,
              label: getClassLabel(entity, index),
              subjects: Array.from(classRow.subjectsMap.values()),
              students,
            };
          })
        );

        if (requestId !== requestIdRef.current) return;

        detailedRows.sort((first, second) =>
          first.label.localeCompare(second.label, "ar")
        );

        const nextStudentsMap = Object.fromEntries(
          detailedRows.map((row) => [row.id, row.students])
        );

        setClasses(detailedRows);
        setStudentsByClass(nextStudentsMap);
        setSelectedClassId((current) => {
          if (detailedRows.some((row) => row.id === current)) return current;
          return detailedRows[0]?.id || "";
        });
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return;

        setClasses([]);
        setStudentsByClass({});
        setSelectedClassId("");
        setError(loadError?.message || "تعذر تحميل فصول المعلم");
      } finally {
        if (requestId === requestIdRef.current) {
          pendingRef.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [teacherId]
  );

  useEffect(() => {
    loadData();

    return () => {
      requestIdRef.current += 1;
      pendingRef.current = false;
    };
  }, [loadData]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const selectedStudents = useMemo(
    () => studentsByClass[selectedClassId] || [],
    [studentsByClass, selectedClassId]
  );

  const uniqueStudents = useMemo(() => {
    const seen = new Set();

    return selectedStudents.filter((student) => {
      const id = getStudentId(student);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [selectedStudents]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return uniqueStudents.filter((student, index) => {
      const active = isStudentActive(student);

      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;

      if (!query) return true;

      const haystack = [
        getStudentName(student, index),
        getStudentEmail(student),
        getStudentPhone(student),
        getStudentCode(student),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [uniqueStudents, search, statusFilter]);

  const allStudents = useMemo(() => {
    const map = new Map();

    Object.values(studentsByClass)
      .flat()
      .forEach((student) => {
        const id = getStudentId(student);
        if (id && !map.has(id)) map.set(id, student);
      });

    return Array.from(map.values());
  }, [studentsByClass]);

  const allSubjects = useMemo(() => {
    const map = new Map();

    classes.forEach((classItem) => {
      classItem.subjects.forEach((subject) => {
        map.set(subject.id, subject);
      });
    });

    return Array.from(map.values());
  }, [classes]);

  const totalLectures = useMemo(
    () => classes.reduce((total, row) => total + row.lectures.length, 0),
    [classes]
  );

  const activeCount = useMemo(
    () => uniqueStudents.filter(isStudentActive).length,
    [uniqueStudents]
  );

  const openAttendance = () => {
    if (!selectedClassId) return;

    navigate(
      `/teacher/attendance?classId=${selectedClassId}&date=${formatLocalDate()}`
    );
  };

  const openExam = () => {
    const params = new URLSearchParams();
    if (selectedClassId) params.set("classId", selectedClassId);
    navigate(`/teacher/exams/add?${params.toString()}`);
  };

  if (loading) {
    return (
      <Box
        dir="rtl"
        sx={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Stack alignItems="center" spacing={1.2}>
          <CircularProgress size={30} sx={{ color: "#214E78" }} />
          <Typography sx={{ color: "#7C8796", fontSize: "12px" }}>
            جاري تحميل الفصول والطلاب...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#fff",
        color: "#122F4D",
        fontFamily: "Tajawal, sans-serif",
        px: { xs: 1.25, md: 2.25 },
        py: 1.5,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            minHeight: 126,
            px: { xs: 2, md: 3.1 },
            py: 2,
            borderRadius: "25px",
            background:
              "linear-gradient(115deg, #173E64 0%, #214E78 48%, #2E628E 100%)",
            color: "#fff",
            "&::before": {
              content: '\"\"',
              position: "absolute",
              insetInlineStart: -95,
              top: -115,
              width: 300,
              height: 300,
              border: "1px solid rgba(255,255,255,.10)",
              borderRadius: "50%",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <Box
                component="img"
                src={nasaqLogo}
                alt="نسق"
                sx={{
                  width: 68,
                  height: 68,
                  objectFit: "contain",
                  borderRadius: "18px",
                  backgroundColor: "#fff",
                  p: 0.65,
                  boxShadow: "0 10px 24px rgba(0,0,0,.12)",
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Chip
                  size="small"
                  icon={<SchoolRounded />}
                  label="بوابة المعلم"
                  sx={{
                    height: 24,
                    mb: 0.55,
                    color: "#F9D77F",
                    border: "1px solid rgba(249,215,127,.28)",
                    backgroundColor: "rgba(249,215,127,.08)",
                    "& .MuiChip-icon": { color: "#F9D77F", fontSize: 15 },
                    "& .MuiChip-label": { fontSize: "9px", fontWeight: 900 },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: { xs: "27px", md: "34px" },
                    lineHeight: 1.05,
                    fontWeight: 900,
                  }}
                >
                  فصولي وطلابي
                </Typography>

                <Typography
                  sx={{
                    mt: 0.45,
                    color: "rgba(255,255,255,.72)",
                    fontSize: { xs: "10px", md: "11px" },
                  }}
                >
                  تابع الفصول المرتبطة بجدولك وافتح بيانات الطلاب من مكان واحد
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    onClick={() => loadData({ force: true })}
                    disabled={refreshing}
                    sx={{
                      width: 43,
                      height: 43,
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,.24)",
                      borderRadius: "13px",
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <RefreshRounded />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                onClick={() => navigate("/teacher/dashboard")}
                startIcon={<ArrowBackRounded />}
                sx={{
                  minHeight: 43,
                  px: 1.7,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.24)",
                  borderRadius: "13px",
                  fontSize: "10px",
                  fontWeight: 900,
                  "&:hover": { backgroundColor: "rgba(255,255,255,.08)" },
                }}
              >
                لوحة التحكم
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error ? (
          <Alert severity="warning" sx={{ mt: 1.4, borderRadius: "15px" }}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            mt: 1.4,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.15,
          }}
        >
          <StatCard
            title="إجمالي الفصول"
            value={classes.length}
            helper="الفصول المرتبطة بجدولك"
            icon={<GroupsRounded />}
          />
          <StatCard
            title="إجمالي الطلاب"
            value={allStudents.length}
            helper="طلاب جميع الفصول"
            icon={<PersonRounded />}
            accent="green"
          />
          <StatCard
            title="المواد الدراسية"
            value={allSubjects.length}
            helper="مواد تدرّسها حاليًا"
            icon={<MenuBookRounded />}
            accent="gold"
          />
          <StatCard
            title="الحصص الأسبوعية"
            value={totalLectures}
            helper="إجمالي الحصص في جدولك"
            icon={<ScheduleRounded />}
          />
        </Box>

        {classes.length === 0 ? (
          <Box
            sx={{
              minHeight: 330,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "18px",
                  color: "#B9821D",
                  backgroundColor: "rgba(226,173,59,.16)",
                  "& svg": { fontSize: 31 },
                }}
              >
                <SchoolRounded />
              </Box>
              <Typography sx={{ fontSize: "17px", fontWeight: 900 }}>
                لا توجد فصول مرتبطة بجدولك
              </Typography>
              <Typography sx={{ color: "#8A96A3", fontSize: "10px" }}>
                راجع إسنادات المواد والحصص من حساب الإدارة.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            <Paper
              elevation={0}
              sx={{
                mt: 1.4,
                p: 1.25,
                border: "1px solid rgba(36,74,112,.09)",
                borderRadius: "18px",
                backgroundColor: "#fff",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                spacing={1.2}
              >
                <Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 900 }}>
                    فصولك الدراسية
                  </Typography>
                  <Typography sx={{ mt: 0.15, color: "#97A2AE", fontSize: "8.5px" }}>
                    اختر الفصل لعرض الطلاب والمواد والحصص المرتبطة به
                  </Typography>
                </Box>

                <TextField
                  select
                  size="small"
                  label="الفصل"
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  sx={{
                    display: { xs: "block", md: "none" },
                    minWidth: 230,
                    "& .MuiOutlinedInput-root": { borderRadius: "13px" },
                  }}
                >
                  {classes.map((classItem) => (
                    <MenuItem key={classItem.id} value={classItem.id}>
                      {classItem.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Box
                sx={{
                  mt: 1.1,
                  display: { xs: "none", md: "grid" },
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 0.85,
                }}
              >
                {classes.map((classItem) => {
                  const selected = classItem.id === selectedClassId;
                  const classStudents = studentsByClass[classItem.id] || [];

                  return (
                    <Paper
                      key={classItem.id}
                      component="button"
                      type="button"
                      onClick={() => setSelectedClassId(classItem.id)}
                      elevation={0}
                      sx={{
                        appearance: "none",
                        width: "100%",
                        p: 1.15,
                        textAlign: "right",
                        cursor: "pointer",
                        borderRadius: "15px",
                        border: selected
                          ? "1px solid #2E628E"
                          : "1px solid rgba(36,74,112,.10)",
                        backgroundColor: selected
                          ? "rgba(33,78,120,.055)"
                          : "#fff",
                        boxShadow: selected
                          ? "0 10px 22px rgba(33,78,120,.09)"
                          : "none",
                        transition: "all .18s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          borderColor: "rgba(33,78,120,.35)",
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: "11px", fontWeight: 900, color: "#122F4D" }}>
                            {classItem.label}
                          </Typography>
                          <Typography sx={{ mt: 0.25, color: "#8F9BA8", fontSize: "8px" }}>
                            {classItem.subjects.length} مادة • {classItem.lectures.length} حصة أسبوعيًا
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={`${classStudents.length} طالب`}
                          sx={{
                            height: 23,
                            flexShrink: 0,
                            color: selected ? "#214E78" : "#25865A",
                            backgroundColor: selected
                              ? "rgba(33,78,120,.10)"
                              : "rgba(37,134,90,.09)",
                            "& .MuiChip-label": { px: 1, fontSize: "8px", fontWeight: 900 },
                          }}
                        />
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                mt: 1.15,
                p: 1.3,
                border: "1px solid rgba(36,74,112,.09)",
                borderRadius: "18px",
                backgroundColor: "#fff",
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                alignItems={{ xs: "stretch", lg: "center" }}
                justifyContent="space-between"
                spacing={1.2}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 900 }}>
                    طلاب {selectedClass?.label || "الفصل"}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.55} sx={{ mt: 0.55 }}>
                    {(selectedClass?.subjects || []).map((subject) => (
                      <Chip
                        key={subject.id}
                        size="small"
                        label={subject.label}
                        sx={{
                          height: 22,
                          color: "#214E78",
                          backgroundColor: "rgba(33,78,120,.07)",
                          "& .MuiChip-label": { fontSize: "7.8px", fontWeight: 800 },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Stack direction="row" flexWrap="wrap" gap={0.8}>
                  <Button
                    onClick={openAttendance}
                    startIcon={<HowToRegRounded />}
                    sx={{
                      minHeight: 38,
                      px: 1.4,
                      color: "#fff",
                      backgroundColor: "#25865A",
                      borderRadius: "12px",
                      fontSize: "9px",
                      fontWeight: 900,
                      "&:hover": { backgroundColor: "#1F744E" },
                    }}
                  >
                    تسجيل الحضور
                  </Button>

                  <Button
                    onClick={() => navigate("/teacher/schedule")}
                    startIcon={<CalendarMonthRounded />}
                    variant="outlined"
                    sx={{
                      minHeight: 38,
                      px: 1.4,
                      color: "#214E78",
                      borderColor: "rgba(33,78,120,.25)",
                      borderRadius: "12px",
                      fontSize: "9px",
                      fontWeight: 900,
                    }}
                  >
                    الجدول الدراسي
                  </Button>

                  <Button
                    onClick={openExam}
                    startIcon={<QuizRounded />}
                    sx={{
                      minHeight: 38,
                      px: 1.4,
                      color: "#122F4D",
                      backgroundColor: "#F4D37D",
                      borderRadius: "12px",
                      fontSize: "9px",
                      fontWeight: 900,
                      "&:hover": { backgroundColor: "#EBC55C" },
                    }}
                  >
                    اختبار جديد
                  </Button>
                </Stack>
              </Stack>

              <Box
                sx={{
                  mt: 1.1,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1fr) 185px 170px",
                  },
                  gap: 0.9,
                }}
              >
                <TextField
                  size="small"
                  placeholder="ابحث باسم الطالب أو البريد أو الكود"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: "#82909E", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: 45, borderRadius: "13px" } }}
                />

                <TextField
                  select
                  size="small"
                  label="حالة الحساب"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { minHeight: 45, borderRadius: "13px" } }}
                >
                  <MenuItem value="all">كل الطلاب</MenuItem>
                  <MenuItem value="active">الحسابات النشطة</MenuItem>
                  <MenuItem value="inactive">الحسابات الموقوفة</MenuItem>
                </TextField>

                <Paper
                  elevation={0}
                  sx={{
                    minHeight: 45,
                    px: 1.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    border: "1px solid rgba(36,74,112,.10)",
                    borderRadius: "13px",
                  }}
                >
                  <Box>
                    <Typography sx={{ color: "#8995A2", fontSize: "7.7px", fontWeight: 800 }}>
                      الطلاب النشطون
                    </Typography>
                    <Typography sx={{ color: "#25865A", fontSize: "18px", lineHeight: 1.1, fontWeight: 900 }}>
                      {activeCount}/{uniqueStudents.length}
                    </Typography>
                  </Box>
                  <CheckCircleRounded sx={{ color: "#25865A", fontSize: 24 }} />
                </Paper>
              </Box>

              {filteredStudents.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 240,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Stack alignItems="center" spacing={0.9}>
                    <Box
                      sx={{
                        width: 57,
                        height: 57,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "17px",
                        color: "#B9821D",
                        backgroundColor: "rgba(226,173,59,.16)",
                        "& svg": { fontSize: 28 },
                      }}
                    >
                      <GroupsRounded />
                    </Box>
                    <Typography sx={{ fontSize: "15px", fontWeight: 900 }}>
                      لا يوجد طلاب مطابقون
                    </Typography>
                    <Typography sx={{ color: "#98A3AE", fontSize: "9px" }}>
                      غيّر البحث أو حالة الحساب لعرض الطلاب.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 1.15,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                      xl: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 0.85,
                  }}
                >
                  {filteredStudents.map((student, index) => {
                    const name = getStudentName(student, index);
                    const email = getStudentEmail(student);
                    const phone = getStudentPhone(student);
                    const code = getStudentCode(student);
                    const active = isStudentActive(student);

                    return (
                      <Paper
                        key={getStudentId(student) || `${name}-${index}`}
                        elevation={0}
                        sx={{
                          p: 1.05,
                          minHeight: 84,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          border: active
                            ? "1px solid rgba(37,134,90,.17)"
                            : "1px solid rgba(196,69,69,.18)",
                          borderRadius: "15px",
                          backgroundColor: active
                            ? "rgba(37,134,90,.025)"
                            : "rgba(196,69,69,.025)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 43,
                              height: 43,
                              flexShrink: 0,
                              fontSize: "11px",
                              fontWeight: 900,
                              backgroundColor: active ? "#25865A" : "#C44545",
                            }}
                          >
                            {initialsOf(name)}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: "10px", fontWeight: 900 }}>
                              {name}
                            </Typography>

                            {email ? (
                              <Stack direction="row" alignItems="center" spacing={0.45} sx={{ mt: 0.25 }}>
                                <MailOutlineRounded sx={{ color: "#97A2AE", fontSize: 13 }} />
                                <Typography noWrap sx={{ color: "#8A96A3", fontSize: "7.5px" }}>
                                  {email}
                                </Typography>
                              </Stack>
                            ) : null}

                            {phone || code ? (
                              <Stack direction="row" alignItems="center" spacing={0.45} sx={{ mt: 0.15 }}>
                                <PhoneOutlined sx={{ color: "#97A2AE", fontSize: 12 }} />
                                <Typography noWrap sx={{ color: "#8A96A3", fontSize: "7.4px" }}>
                                  {phone || code}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Box>
                        </Stack>

                        <Chip
                          size="small"
                          icon={active ? <CheckCircleRounded /> : <PersonOffRounded />}
                          label={active ? "نشط" : "موقوف"}
                          sx={{
                            height: 24,
                            flexShrink: 0,
                            color: active ? "#25865A" : "#C44545",
                            backgroundColor: active
                              ? "rgba(37,134,90,.10)"
                              : "rgba(196,69,69,.10)",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 14,
                            },
                            "& .MuiChip-label": {
                              px: 0.8,
                              fontSize: "7.5px",
                              fontWeight: 900,
                            },
                          }}
                        />
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
};

export default TeacherClasses;
