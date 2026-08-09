import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  ArrowBackRounded,
  AssignmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  EditRounded,
  FactCheckRounded,
  FolderRounded,
  GroupsRounded,
  MenuBookRounded,
  RefreshRounded,
  SearchRounded,
  UploadFileRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthUser } from "react-auth-kit";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  addFilesToProject,
  addProject,
  deleteProject,
  editProject,
  fetchProjectSubmissions,
  fetchTeacherProjects,
} from "@/APIs/school/projects";

import { fetchLectures } from "@/APIs/school/lectures";
import { fetchMyClasses } from "@/APIs/school/classes";
import { TEACHER_UI } from "@/shared/ui/teacherUi";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const COLORS = {
  navy: "#173F67",
  navyLight: "#2C648F",
  gold: "#D69A17",
  goldSoft: "#FFF5D9",
  green: "#1B8E62",
  greenSoft: "#EAF8F1",
  red: "#D44848",
  redSoft: "#FFF0F0",
  page: "#FFFFFF",
  surface: "#FFFFFF",
  muted: "#7D8CA0",
  border: "#DCE5ED",
  soft: "#F7FAFC",
  text: "#092A4A",
};

const EMPTY_FORM = {
  id: "",
  title: "",
  description: "",
  dueDate: "",
  subjectOfferingId: "",
  classIds: [],
  files: [],
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "");

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  response?.success === false;

const getErrorMessage = (
  response,
  fallback = "تعذر إتمام العملية"
) => {
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.error ||
    response?.data?.message ||
    fallback
  );
};

const extractCollection = (response, keys = []) => {
  if (!response || typeof response === "string") {
    return [];
  }

  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.docs,
    payload?.items,
    payload?.results,
    payload?.records,
    payload?.data,
    ...keys.map((key) => payload?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const extractEntity = (response) => {
  if (!response || typeof response === "string") {
    return null;
  }

  const payload = response?.data ?? response;
  return payload?.data || payload?.project || payload;
};

const getProjectId = (project) =>
  normalizeId(project?._id || project?.id);

const getProjectTitle = (project) =>
  String(
    project?.title ||
      project?.name ||
      "مشروع بدون عنوان"
  ).trim();

const getProjectDescription = (project) =>
  String(
    project?.description ||
      project?.details ||
      "لا يوجد وصف للمشروع"
  ).trim();

const getProjectDueDate = (project) =>
  project?.dueDate ||
  project?.deadline ||
  project?.endDate ||
  "";

const getOfferingEntity = (source) => {
  const candidates = [
    source?.subjectOffering,
    source?.subjectOfferingId,
    source?.offering,
    source?.offeringId,
  ];

  return (
    candidates.find(
      (item) => item && typeof item === "object"
    ) || null
  );
};

const getOfferingId = (source) =>
  normalizeId(
    source?.subjectOfferingId ||
      source?.subjectOffering ||
      source?.offeringId ||
      source?.offering
  );

const getSubjectEntity = (source) => {
  const offering = getOfferingEntity(source);
  const candidates = [
    source?.subject,
    source?.subjectId,
    source?.subjectDetails,
    offering?.subject,
    offering?.subjectId,
    offering?.subjectDetails,
  ];

  return (
    candidates.find(
      (item) => item && typeof item === "object"
    ) || null
  );
};

const getSubjectLabel = (source) => {
  const subject = getSubjectEntity(source);
  const offering = getOfferingEntity(source);

  const name =
    subject?.name ||
    subject?.title ||
    source?.subjectName ||
    offering?.subjectName ||
    "مادة غير محددة";

  const code =
    subject?.code ||
    source?.subjectCode ||
    offering?.subjectCode ||
    "";

  return code ? `${name} - ${code}` : name;
};

const getClassEntity = (source) => {
  const candidates = [
    source?.class,
    source?.classId,
    source?.schoolClass,
  ];

  return (
    candidates.find(
      (item) => item && typeof item === "object"
    ) || null
  );
};

const getClassName = (classItem) => {
  if (!classItem) {
    return "فصل غير محدد";
  }

  if (typeof classItem === "string") {
    return "فصل دراسي";
  }

  const grade =
    classItem?.gradeLevel?.name ||
    classItem?.gradeLevelId?.name ||
    classItem?.stage?.name ||
    "";

  const name =
    classItem?.name ||
    classItem?.className ||
    classItem?.roomNumber ||
    "فصل";

  const gender =
    classItem?.gender === "female"
      ? "بنات"
      : classItem?.gender === "male"
        ? "بنين"
        : "";

  return [grade, name, gender]
    .filter(Boolean)
    .join(" - ");
};

const getProjectClassIds = (project) => {
  const source =
    project?.classIds ||
    project?.classes ||
    project?.targetClasses ||
    [];

  return (Array.isArray(source) ? source : [source])
    .map(normalizeId)
    .filter(Boolean);
};

const getProjectClasses = (project) => {
  const source =
    project?.classes ||
    project?.classIds ||
    project?.targetClasses ||
    [];

  return Array.isArray(source) ? source : [source];
};

const getFiles = (project) => {
  const source =
    project?.files ||
    project?.filePaths ||
    project?.attachments ||
    [];

  return Array.isArray(source) ? source : [];
};

const getSubmissionStudentId = (submission) =>
  normalizeId(
    submission?.studentId ||
      submission?.student ||
      submission?.userId ||
      submission?.user
  );

const isGradedSubmission = (submission) => {
  const value =
    submission?.grade ??
    submission?.achievedGrade ??
    submission?.score;

  return value !== undefined && value !== null && value !== "";
};

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const formatDate = (value) => {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (value) =>
  String(value || "م")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const StatCard = ({ icon, title, value, subtitle, tone = "navy" }) => {
  const tones = {
    navy: {
      background: "#EDF3F8",
      color: COLORS.navy,
    },
    green: {
      background: COLORS.greenSoft,
      color: COLORS.green,
    },
    gold: {
      background: COLORS.goldSoft,
      color: COLORS.gold,
    },
    red: {
      background: COLORS.redSoft,
      color: COLORS.red,
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        border: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.25,
      }}
    >
      <Box sx={{ minWidth: 0, textAlign: "right" }}>
        <Typography
          sx={{
            color: COLORS.muted,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: COLORS.text,
            fontWeight: 900,
            fontSize: { xs: 18, md: 20 },
            lineHeight: 1.1,
            mt: 0.25,
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            color: "#A0ABBA",
            fontSize: 10.5,
            mt: 0.2,
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          ...TEACHER_UI.statIcon,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          ...tones[tone],
          "& svg": { fontSize: 19 },
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const TeacherProjects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const getAuthUser = useAuthUser();
  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;

  const highlightedProjectId = String(
    searchParams.get("projectId") || ""
  ).trim();

  const [projects, setProjects] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const teacherId = useMemo(
    () =>
      normalizeId(
        authRoot?.teacher ||
          authRoot?.teacherId ||
          currentUser?.teacher ||
          currentUser?.teacherId ||
          currentUser?._id ||
          currentUser?.id
      ),
    [authRoot, currentUser]
  );

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      try {
        const [projectsResponse, lecturesResponse, classesResponse] =
          await Promise.all([
            fetchTeacherProjects({ page: 1, limit: 500 }),
            fetchLectures(
              {
                ...(teacherId ? { teacherId } : {}),
                page: 1,
                limit: 500,
              },
              { force: true }
            ),
            fetchMyClasses(),
          ]);

        if (isFailedResponse(projectsResponse)) {
          throw new Error(
            getErrorMessage(
              projectsResponse,
              "تعذر تحميل مشروعاتك"
            )
          );
        }

        const nextProjects = extractCollection(
          projectsResponse,
          ["projects"]
        );

        const nextLectures = isFailedResponse(lecturesResponse)
          ? []
          : extractCollection(lecturesResponse, ["lectures"]);

        const nextClasses = isFailedResponse(classesResponse)
          ? []
          : extractCollection(classesResponse, ["classes"]);

        setProjects(nextProjects);
        setLectures(nextLectures);
        setClasses(nextClasses);

        const submissionsResults = await Promise.all(
          nextProjects.map(async (project) => {
            const projectId = getProjectId(project);
            if (!projectId) {
              return ["", []];
            }

            const response = await fetchProjectSubmissions(projectId, {
              page: 1,
              limit: 500,
            });

            return [
              projectId,
              isFailedResponse(response)
                ? []
                : extractCollection(response, ["submissions"]),
            ];
          })
        );

        setSubmissionMap(
          Object.fromEntries(
            submissionsResults.filter(([id]) => Boolean(id))
          )
        );
      } catch (requestError) {
        setError(
          requestError?.message ||
            "تعذر تحميل صفحة المشروعات"
        );
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

  const classOptions = useMemo(() => {
    const map = new Map();

    const add = (classItem) => {
      const id = normalizeId(classItem);
      if (!id || map.has(id)) {
        return;
      }

      map.set(id, {
        id,
        label: getClassName(classItem),
        raw: classItem,
      });
    };

    classes.forEach(add);
    lectures.forEach((lecture) =>
      add(lecture?.class || lecture?.classId)
    );
    projects.forEach((project) =>
      getProjectClasses(project).forEach(add)
    );

    return Array.from(map.values());
  }, [classes, lectures, projects]);

  const offeringOptions = useMemo(() => {
    const map = new Map();

    const add = (source) => {
      const id = getOfferingId(source);
      if (!id || map.has(id)) {
        return;
      }

      const relatedClassId = normalizeId(
        source?.class || source?.classId
      );

      map.set(id, {
        id,
        label: getSubjectLabel(source),
        classIds: relatedClassId ? [relatedClassId] : [],
      });
    };

    lectures.forEach(add);
    projects.forEach(add);

    return Array.from(map.values());
  }, [lectures, projects]);

  const filteredClassOptions = useMemo(() => {
    if (!form.subjectOfferingId) {
      return classOptions;
    }

    const offering = offeringOptions.find(
      (item) => item.id === form.subjectOfferingId
    );

    if (!offering || offering.classIds.length === 0) {
      return classOptions;
    }

    const allowed = new Set(offering.classIds);
    return classOptions.filter((item) => allowed.has(item.id));
  }, [classOptions, offeringOptions, form.subjectOfferingId]);

  const projectRows = useMemo(
    () =>
      projects.map((project) => {
        const id = getProjectId(project);
        const dueDate = getProjectDueDate(project);
        const dueTimestamp = dueDate
          ? new Date(dueDate).getTime()
          : Number.NaN;
        const isExpired =
          Number.isFinite(dueTimestamp) &&
          dueTimestamp < Date.now();
        const submissions = submissionMap[id] || [];
        const graded = submissions.filter(isGradedSubmission).length;

        return {
          id,
          project,
          title: getProjectTitle(project),
          description: getProjectDescription(project),
          subject: getSubjectLabel(project),
          dueDate,
          isExpired,
          classes: getProjectClasses(project),
          classIds: getProjectClassIds(project),
          fileCount: getFiles(project).length,
          submissions,
          submittedCount: submissions.length,
          gradedCount: graded,
          pendingCount: submissions.length - graded,
        };
      }),
    [projects, submissionMap]
  );

  const visibleRows = useMemo(() => {
    const query = normalizeText(search);

    return projectRows.filter((row) => {
      const matchesSearch =
        !query ||
        [
          row.title,
          row.description,
          row.subject,
          ...row.classes.map(getClassName),
        ].some((value) => normalizeText(value).includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !row.isExpired) ||
        (statusFilter === "expired" && row.isExpired) ||
        (statusFilter === "pending" && row.pendingCount > 0);

      return matchesSearch && matchesStatus;
    });
  }, [projectRows, search, statusFilter]);

  const stats = useMemo(() => {
    const active = projectRows.filter((row) => !row.isExpired).length;
    const expired = projectRows.filter((row) => row.isExpired).length;
    const pending = projectRows.reduce(
      (total, row) => total + row.pendingCount,
      0
    );

    return {
      total: projectRows.length,
      active,
      expired,
      pending,
    };
  }, [projectRows]);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = (row) => {
    setForm({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: toDateInputValue(row.dueDate),
      subjectOfferingId: getOfferingId(row.project),
      classIds: row.classIds,
      files: [],
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleOfferingChange = (event) => {
    const nextOfferingId = event.target.value;
    const offering = offeringOptions.find(
      (item) => item.id === nextOfferingId
    );

    setForm((current) => ({
      ...current,
      subjectOfferingId: nextOfferingId,
      classIds:
        offering?.classIds?.length > 0
          ? offering.classIds
          : current.classIds,
    }));
  };

  const handleSave = async () => {
    setFormError("");

    if (!form.title.trim()) {
      setFormError("اكتب عنوان المشروع");
      return;
    }

    if (!form.description.trim()) {
      setFormError("اكتب وصف المشروع");
      return;
    }

    if (!form.subjectOfferingId) {
      setFormError("اختر المادة المرتبطة بالمشروع");
      return;
    }

    if (!form.dueDate) {
      setFormError("حدد موعد تسليم المشروع");
      return;
    }

    const dueDate = new Date(form.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      setFormError("موعد التسليم غير صالح");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        subjectOfferingId: form.subjectOfferingId,
        classIds: form.classIds,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: dueDate.toISOString(),
      };

      const response = form.id
        ? await editProject(payload, form.id)
        : await addProject(payload);

      if (isFailedResponse(response)) {
        throw new Error(
          getErrorMessage(
            response,
            form.id
              ? "تعذر تعديل المشروع"
              : "تعذر إنشاء المشروع"
          )
        );
      }

      const savedProject = extractEntity(response);
      const savedProjectId =
        form.id || getProjectId(savedProject);

      if (form.files.length > 0 && savedProjectId) {
        const uploadResponse = await addFilesToProject(
          savedProjectId,
          form.files
        );

        if (isFailedResponse(uploadResponse)) {
          throw new Error(
            getErrorMessage(
              uploadResponse,
              "تم حفظ المشروع لكن تعذر رفع الملفات"
            )
          );
        }
      }

      closeFormDialog();
      await loadData({ silent: true });
    } catch (saveError) {
      setFormError(
        saveError?.message || "تعذر حفظ المشروع"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    setDeleting(true);

    try {
      const response = await deleteProject(deleteTarget.id);
      if (isFailedResponse(response)) {
        throw new Error(
          getErrorMessage(response, "تعذر حذف المشروع")
        );
      }

      setDeleteTarget(null);
      await loadData({ silent: true });
    } catch (deleteError) {
      setError(
        deleteError?.message || "تعذر حذف المشروع"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: COLORS.page,
        }}
      >
        <CircularProgress sx={{ color: COLORS.navy }} />
      </Box>
    );
  }

  return (
    <Box
      dir="rtl"
      sx={{
        ...TEACHER_UI.page,
        minHeight: "100vh",
        background: COLORS.page,
        color: COLORS.text,
      }}
    >
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            color: "white",
            overflow: "hidden",
            position: "relative",
            background: `linear-gradient(110deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 180,
              height: 180,
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "50%",
              insetInlineStart: -65,
              top: -95,
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.1}
            alignItems="center"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="نسق"
              sx={{
                ...TEACHER_UI.heroLogo,
                objectFit: "contain",
                background: "white",
                p: 0.45,
              }}
            />

            <Box>
              <Chip
                icon={<AssignmentRounded />}
                label="بوابة المعلم"
                size="small"
                sx={{
                  height: 23,
                  mb: 0.45,
                  color: "#FFE19A",
                  border: "1px solid rgba(255,225,154,.35)",
                  background: "rgba(255,225,154,.08)",
                  fontWeight: 900,
                  "& .MuiChip-label": { fontSize: "8.5px", px: 1 },
                  "& .MuiChip-icon": { color: "#FFE19A", fontSize: 14 },
                }}
              />
              <Typography
                sx={{
                  ...TEACHER_UI.heroTitle,
                }}
              >
                مشروعاتي
              </Typography>
              <Typography
                sx={{
                  ...TEACHER_UI.heroSubtitle,
                  color: "rgba(255,255,255,.74)",
                }}
              >
                أنشئ مشروعاتك وتابع التسليمات والتصحيح من مكان واحد
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.7}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Button
              onClick={() => navigate("/teacher/dashboard")}
              startIcon={<ArrowBackRounded />}
              variant="outlined"
              sx={{
                ...TEACHER_UI.button,
                color: "white",
                borderColor: "rgba(255,255,255,.35)",
                "&:hover": {
                  borderColor: "white",
                  background: "rgba(255,255,255,.08)",
                },
              }}
            >
              لوحة التحكم
            </Button>

            <Tooltip title="تحديث البيانات">
              <span>
                <IconButton
                  onClick={() => loadData({ silent: true })}
                  disabled={refreshing}
                  sx={{
                    width: 34,
                    height: 34,
                    color: "white",
                    border: "1px solid rgba(255,255,255,.35)",
                    borderRadius: 1.8,
                  }}
                >
                  {refreshing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshRounded />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            <Button
              onClick={openCreateDialog}
              startIcon={<AddRounded />}
              sx={{
                ...TEACHER_UI.button,
                color: COLORS.text,
                background: "#FFDB83",
                px: 1.5,
                "&:hover": { background: "#F6C958" },
              }}
            >
              مشروع جديد
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mt: 1.5, borderRadius: 3 }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 0.8,
            mt: 0.8,
          }}
        >
          <StatCard
            icon={<AssignmentRounded />}
            title="إجمالي المشروعات"
            value={stats.total}
            subtitle="كل المشروعات التي أنشأتها"
          />
          <StatCard
            icon={<CheckCircleRounded />}
            title="مشروعات نشطة"
            value={stats.active}
            subtitle="ما زال موعدها متاحًا"
            tone="green"
          />
          <StatCard
            icon={<WarningAmberRounded />}
            title="مشروعات منتهية"
            value={stats.expired}
            subtitle="انتهى موعد تسليمها"
            tone="gold"
          />
          <StatCard
            icon={<FactCheckRounded />}
            title="تحتاج تصحيح"
            value={stats.pending}
            subtitle="تسليمات تنتظر تقييمك"
            tone="red"
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 0.8,
            p: 0.75,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) 205px",
            },
            gap: 1,
          }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم المشروع أو المادة أو الفصل"
            size="small"
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
              },
            }}
          />

          <FormControl size="small">
            <InputLabel>الحالة</InputLabel>
            <Select
              value={statusFilter}
              label="الحالة"
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ ...TEACHER_UI.field }}
            >
              <MenuItem value="all">كل المشروعات</MenuItem>
              <MenuItem value="active">النشطة</MenuItem>
              <MenuItem value="expired">المنتهية</MenuItem>
              <MenuItem value="pending">تحتاج تصحيح</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 0.8,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2.5,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.2,
              py: 0.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                المشروعات المسجلة
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 9.5 }}>
                تابع تفاصيل المشروع والتسليمات المرتبطة به
              </Typography>
            </Box>
            <Chip
              label={`${visibleRows.length} مشروع`}
              size="small"
              sx={{ height: 24, fontWeight: 900, background: "#EEF3F7", "& .MuiChip-label": { fontSize: "8.5px" } }}
            />
          </Box>

          <Divider />

          {visibleRows.length === 0 ? (
            <Box
              sx={{
                ...TEACHER_UI.emptyState,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                p: 2,
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    mx: "auto",
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    background: COLORS.goldSoft,
                    color: COLORS.gold,
                  }}
                >
                  <AssignmentRounded sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ mt: 0.75, fontWeight: 900, fontSize: 14 }}>
                  لا توجد مشروعات مطابقة
                </Typography>
                <Typography sx={{ mt: 0.25, color: COLORS.muted, fontSize: 9.5 }}>
                  غيّر الفلاتر أو أنشئ مشروعًا جديدًا للطلاب.
                </Typography>
                <Button
                  onClick={openCreateDialog}
                  startIcon={<AddRounded />}
                  sx={{
                    mt: 1.1,
                    borderRadius: 3,
                    background: COLORS.navy,
                    color: "white",
                    fontWeight: 900,
                    px: 2.2,
                    "&:hover": { background: COLORS.navyLight },
                  }}
                >
                  إنشاء مشروع
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.3,
              }}
            >
              {visibleRows.map((row) => {
                const highlighted = row.id === highlightedProjectId;

                return (
                  <Paper
                    key={row.id}
                    elevation={0}
                    sx={{
                      p: 1.7,
                      borderRadius: 3.5,
                      border: `1px solid ${
                        highlighted ? COLORS.navyLight : COLORS.border
                      }`,
                      background: highlighted ? "#F5F9FD" : "white",
                      transition: "180ms ease",
                      "&:hover": {
                        borderColor: COLORS.navyLight,
                        transform: "translateY(-1px)",
                        boxShadow: "0 10px 24px rgba(17,52,84,.07)",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1.3}
                    >
                      <Stack direction="row" spacing={1.2} sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            color: row.isExpired ? COLORS.red : COLORS.gold,
                            background: row.isExpired
                              ? COLORS.redSoft
                              : COLORS.goldSoft,
                            flexShrink: 0,
                          }}
                        >
                          <FolderRounded />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              fontSize: 17,
                              color: COLORS.text,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.title}
                          </Typography>
                          <Typography
                            sx={{
                              color: COLORS.navy,
                              fontSize: 12,
                              fontWeight: 800,
                              mt: 0.2,
                            }}
                          >
                            {row.subject}
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        size="small"
                        label={row.isExpired ? "منتهي" : "نشط"}
                        sx={{
                          fontWeight: 900,
                          color: row.isExpired ? COLORS.red : COLORS.green,
                          background: row.isExpired
                            ? COLORS.redSoft
                            : COLORS.greenSoft,
                        }}
                      />
                    </Stack>

                    <Typography
                      sx={{
                        mt: 1.2,
                        minHeight: 42,
                        color: COLORS.muted,
                        fontSize: 12.5,
                        lineHeight: 1.8,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {row.description}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1.3,
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 0.8,
                      }}
                    >
                      <Box sx={{ p: 1, borderRadius: 2.5, background: COLORS.soft }}>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <CalendarMonthRounded sx={{ fontSize: 18, color: COLORS.navy }} />
                          <Box>
                            <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                              موعد التسليم
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, fontWeight: 900 }}>
                              {formatDate(row.dueDate)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Box sx={{ p: 1, borderRadius: 2.5, background: COLORS.soft }}>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <GroupsRounded sx={{ fontSize: 18, color: COLORS.green }} />
                          <Box>
                            <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                              الفصول
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                              {row.classIds.length || row.classes.length}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Box sx={{ p: 1, borderRadius: 2.5, background: COLORS.soft }}>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <DescriptionRounded sx={{ fontSize: 18, color: COLORS.gold }} />
                          <Box>
                            <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                              الملفات
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                              {row.fileCount}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>

                    {row.classes.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.7}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 1.1 }}
                      >
                        {row.classes.slice(0, 4).map((classItem, index) => (
                          <Chip
                            key={`${normalizeId(classItem) || index}`}
                            label={getClassName(classItem)}
                            size="small"
                            sx={{
                              height: 26,
                              fontSize: 10.5,
                              fontWeight: 800,
                              background: "#EEF6F2",
                              color: COLORS.green,
                            }}
                          />
                        ))}
                      </Stack>
                    )}

                    <Box
                      sx={{
                        mt: 1.3,
                        p: 1.1,
                        borderRadius: 2.5,
                        background: "#F8FAFC",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 1,
                        textAlign: "center",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                          التسليمات
                        </Typography>
                        <Typography sx={{ fontWeight: 900, color: COLORS.navy }}>
                          {row.submittedCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                          تم التصحيح
                        </Typography>
                        <Typography sx={{ fontWeight: 900, color: COLORS.green }}>
                          {row.gradedCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10, color: COLORS.muted }}>
                          متبقي
                        </Typography>
                        <Typography sx={{ fontWeight: 900, color: COLORS.red }}>
                          {row.pendingCount}
                        </Typography>
                      </Box>
                    </Box>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={0.8}
                      sx={{ mt: 1.3 }}
                    >
                      <Button
                        onClick={() =>
                          navigate(
                            `/teacher/grading/projects?projectId=${row.id}`
                          )
                        }
                        startIcon={<FactCheckRounded />}
                        sx={{
                          flex: 1,
                          borderRadius: 2.5,
                          background: COLORS.navy,
                          color: "white",
                          fontWeight: 900,
                          "&:hover": { background: COLORS.navyLight },
                        }}
                      >
                        تصحيح التسليمات
                      </Button>

                      <Button
                        onClick={() => openEditDialog(row)}
                        startIcon={<EditRounded />}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderColor: COLORS.border,
                          color: COLORS.navy,
                          fontWeight: 900,
                        }}
                      >
                        تعديل
                      </Button>

                      <Tooltip title="حذف المشروع">
                        <IconButton
                          onClick={() => setDeleteTarget(row)}
                          sx={{
                            borderRadius: 2.5,
                            border: `1px solid ${COLORS.border}`,
                            color: COLORS.red,
                          }}
                        >
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog
        open={formOpen}
        onClose={closeFormDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 5,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                background: COLORS.goldSoft,
                color: COLORS.gold,
              }}
            >
              <AssignmentRounded />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 19 }}>
                {form.id ? "تعديل المشروع" : "إنشاء مشروع جديد"}
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                حدد بيانات المشروع والفصول المستهدفة
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={closeFormDialog} disabled={saving}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.2 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 3 }}>
              {formError}
            </Alert>
          )}

          {offeringOptions.length === 0 && (
            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 3 }}>
              لم يتم العثور على عروض مواد مرتبطة بجدولك. راجع تعيينات المواد والحصص من الإدارة أولًا.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.4,
              pt: 0.4,
            }}
          >
            <TextField
              label="عنوان المشروع"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              fullWidth
              sx={{ gridColumn: { md: "1 / -1" } }}
            />

            <FormControl fullWidth>
              <InputLabel>المادة</InputLabel>
              <Select
                value={form.subjectOfferingId}
                label="المادة"
                onChange={handleOfferingChange}
              >
                {offeringOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="موعد التسليم"
              type="datetime-local"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <FormControl fullWidth sx={{ gridColumn: { md: "1 / -1" } }}>
              <InputLabel>الفصول المستهدفة</InputLabel>
              <Select
                multiple
                value={form.classIds}
                label="الفصول المستهدفة"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    classIds:
                      typeof event.target.value === "string"
                        ? event.target.value.split(",")
                        : event.target.value,
                  }))
                }
                renderValue={(selected) =>
                  selected
                    .map(
                      (id) =>
                        classOptions.find((item) => item.id === id)?.label ||
                        id
                    )
                    .join("، ")
                }
              >
                {filteredClassOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    <Checkbox checked={form.classIds.includes(option.id)} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="وصف المشروع"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={4}
              fullWidth
              sx={{ gridColumn: { md: "1 / -1" } }}
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileRounded />}
              sx={{
                gridColumn: { md: "1 / -1" },
                minHeight: 54,
                borderRadius: 3,
                borderStyle: "dashed",
                borderColor: COLORS.gold,
                color: COLORS.gold,
                fontWeight: 900,
              }}
            >
              {form.files.length > 0
                ? `${form.files.length} ملف محدد`
                : "إرفاق ملفات للمشروع"}
              <input
                hidden
                multiple
                type="file"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    files: Array.from(event.target.files || []),
                  }))
                }
              />
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={closeFormDialog}
            disabled={saving}
            sx={{ color: COLORS.muted, fontWeight: 900 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || offeringOptions.length === 0}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : form.id ? (
                <EditRounded />
              ) : (
                <AddRounded />
              )
            }
            sx={{
              minWidth: 145,
              borderRadius: 3,
              background: COLORS.navy,
              color: "white",
              fontWeight: 900,
              "&:hover": { background: COLORS.navyLight },
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : form.id
                ? "حفظ التعديلات"
                : "إنشاء المشروع"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          حذف المشروع
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: COLORS.muted, lineHeight: 1.8 }}>
            سيتم حذف مشروع <strong>{deleteTarget?.title}</strong> نهائيًا. هل تريد المتابعة؟
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{ color: COLORS.muted, fontWeight: 900 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteOutlineRounded />
              )
            }
            sx={{
              background: COLORS.red,
              color: "white",
              borderRadius: 3,
              fontWeight: 900,
              "&:hover": { background: "#B93636" },
            }}
          >
            حذف المشروع
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherProjects;
