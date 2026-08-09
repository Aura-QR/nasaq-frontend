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
  AssignmentRounded,
  CheckCircleRounded,
  DownloadRounded,
  FactCheckRounded,
  FilterAltRounded,
  FolderZipRounded,
  GradeRounded,
  GroupsRounded,
  PendingActionsRounded,
  PersonRounded,
  RefreshRounded,
  SearchRounded,
  TaskAltRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import {
  downloadProjectSubmission,
  fetchProjectSubmissions,
  fetchTeacherProjects,
  gradeSubmission,
} from "@/APIs/school/projects";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value._id || value.id || ""
    ).trim();
  }

  return String(value || "").trim();
};

const unwrapResponse = (response) => {
  let payload = response;

  for (let index = 0; index < 3; index += 1) {
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

const extractCollection = (
  response,
  keys = []
) => {
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
    payload.submissions,
    payload.projects,
    payload.data,
    ...keys.map((key) => payload[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const getErrorMessage = (
  response,
  fallback
) => {
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getProjectId = (project) =>
  normalizeId(project);

const getStudentEntity = (submission) =>
  submission?.student ||
  submission?.studentId ||
  submission?.studentData ||
  null;

const getStudentId = (submission) =>
  normalizeId(getStudentEntity(submission)) ||
  normalizeId(submission?.studentId);

const getStudentName = (
  submission,
  fallback = "طالب"
) => {
  const student = getStudentEntity(submission);

  if (typeof student === "string") {
    return submission?.studentName || fallback;
  }

  const fullName = [
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
    submission?.studentName ||
    fullName ||
    fallback
  );
};

const getProjectTitle = (project) =>
  project?.title ||
  project?.name ||
  "مشروع بدون عنوان";

const getSubjectLabel = (project) => {
  const offering =
    project?.subjectOfferingId ||
    project?.subjectOffering ||
    {};

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    project?.subject ||
    {};

  return (
    subject?.subjectName ||
    subject?.name ||
    project?.subjectName ||
    "المادة غير محددة"
  );
};

const getClassLabel = (submission, project) => {
  const classEntity =
    submission?.class ||
    submission?.classId ||
    project?.class ||
    null;

  if (classEntity && typeof classEntity === "object") {
    return (
      classEntity.name ||
      classEntity.className ||
      classEntity.roomNumber ||
      "الفصل غير محدد"
    );
  }

  const classes = Array.isArray(project?.classes)
    ? project.classes
    : Array.isArray(project?.classIds)
      ? project.classIds
      : [];

  const firstClass = classes[0];

  if (firstClass && typeof firstClass === "object") {
    return (
      firstClass.name ||
      firstClass.className ||
      firstClass.roomNumber ||
      "الفصل غير محدد"
    );
  }

  return "الفصل غير محدد";
};

const getSubmissionGrade = (submission) => {
  const value =
    submission?.achievedGrade ??
    submission?.grade ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : null;
};

const getMaxGrade = (project) => {
  const candidates = [
    project?.grade,
    project?.maxGrade,
    project?.totalGrade,
    project?.fullMark,
  ];

  const value = candidates
    .map(Number)
    .find(
      (item) =>
        Number.isFinite(item) && item > 0
    );

  return value || 100;
};

const getFeedback = (submission) =>
  String(
    submission?.feedback ||
      submission?.teacherFeedback ||
      ""
  );

const getSubmissionFiles = (submission) => {
  const candidates = [
    submission?.files,
    submission?.filePaths,
    submission?.attachments,
  ];

  return candidates.find(Array.isArray) || [];
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      DATE_LOCALE,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

const downloadBlob = (
  blob,
  filename
) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const StatCard = ({
  title,
  value,
  helper,
  icon,
  tone = "navy",
}) => {
  const toneStyles = {
    navy: {
      color: "#173f67",
      background: "rgba(36,74,112,.08)",
    },
    gold: {
      color: "#b78430",
      background: "#fbf0d8",
    },
    green: {
      color: "#237449",
      background: "rgba(116,201,154,.15)",
    },
  };

  const currentTone =
    toneStyles[tone] || toneStyles.navy;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        minHeight: 112,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "18px",
        backgroundColor: "#fff",
        boxShadow: "0 12px 28px rgba(18,47,77,.055)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#6d7d90",
            fontSize: "10px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            color: "#122f4d",
            fontSize: "24px",
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            mt: 0.45,
            color: "#94a0af",
            fontSize: "8px",
          }}
        >
          {helper}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 46,
          height: 46,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: currentTone.color,
          backgroundColor:
            currentTone.background,
          borderRadius: "14px",
          "& svg": { fontSize: 23 },
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const EmptyState = ({
  title,
  description,
}) => (
  <Box
    sx={{
      minHeight: 260,
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
          color: "#b78430",
          backgroundColor: "#fbf0d8",
          borderRadius: "18px",
        }}
      >
        <TaskAltRounded />
      </Box>
      <Typography
        sx={{
          color: "#122f4d",
          fontSize: "14px",
          fontWeight: 900,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          maxWidth: 380,
          color: "#8b98a8",
          fontSize: "10px",
          lineHeight: 1.8,
        }}
      >
        {description}
      </Typography>
    </Stack>
  </Box>
);

const TeacherProjectGrading = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialProjectId =
    searchParams.get("projectId") || "all";
  const initialStudentId =
    searchParams.get("studentId") || "";

  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("pending");
  const [projectFilter, setProjectFilter] =
    useState(initialProjectId);
  const [query, setQuery] = useState("");

  const [gradingItem, setGradingItem] =
    useState(null);
  const [gradeValue, setGradeValue] =
    useState("");
  const [feedbackValue, setFeedbackValue] =
    useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] =
    useState("");

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const projectsResponse =
          await fetchTeacherProjects({
            page: 1,
            limit: 200,
          });

        if (isFailedResponse(projectsResponse)) {
          throw new Error(
            getErrorMessage(
              projectsResponse,
              "تعذر تحميل مشروعات المعلم"
            )
          );
        }

        const projectRows = extractCollection(
          projectsResponse,
          ["projects"]
        );

        const settled =
          await Promise.allSettled(
            projectRows.map(async (project) => {
              const projectId =
                getProjectId(project);

              if (!projectId) return [];

              const response =
                await fetchProjectSubmissions(
                  projectId,
                  { page: 1, limit: 500 }
                );

              if (isFailedResponse(response)) {
                return [];
              }

              return extractCollection(
                response,
                ["submissions"]
              ).map((submission) => ({
                ...submission,
                dashboardProject: project,
              }));
            })
          );

        const submissionRows = settled.flatMap(
          (result) =>
            result.status === "fulfilled"
              ? result.value
              : []
        );

        setProjects(projectRows);
        setSubmissions(submissionRows);
      } catch (loadError) {
        const message =
          loadError?.message ||
          "تعذر تحميل بيانات التصحيح";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!initialStudentId) return;

    const matched = submissions.find(
      (submission) =>
        getStudentId(submission) ===
        initialStudentId
    );

    if (matched) {
      setStatusFilter("all");
    }
  }, [initialStudentId, submissions]);

  const decoratedSubmissions = useMemo(
    () =>
      submissions.map((submission, index) => {
        const project =
          submission.dashboardProject || {};
        const projectId = getProjectId(project);
        const studentId =
          getStudentId(submission);
        const grade =
          getSubmissionGrade(submission);

        return {
          ...submission,
          dashboardKey:
            `${projectId}-${studentId || index}`,
          dashboardProject: project,
          dashboardProjectId: projectId,
          dashboardStudentId: studentId,
          dashboardStudentName:
            getStudentName(
              submission,
              `طالب ${index + 1}`
            ),
          dashboardProjectTitle:
            getProjectTitle(project),
          dashboardSubject:
            getSubjectLabel(project),
          dashboardClass:
            getClassLabel(
              submission,
              project
            ),
          dashboardGrade: grade,
          dashboardMaxGrade:
            getMaxGrade(project),
          dashboardFeedback:
            getFeedback(submission),
          dashboardFiles:
            getSubmissionFiles(submission),
          dashboardDate:
            submission?.submittedAt ||
            submission?.updatedAt ||
            submission?.createdAt,
          dashboardPending: grade === null,
        };
      }),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return decoratedSubmissions.filter(
      (item) => {
        const statusMatches =
          statusFilter === "all" ||
          (statusFilter === "pending" &&
            item.dashboardPending) ||
          (statusFilter === "graded" &&
            !item.dashboardPending);

        const projectMatches =
          projectFilter === "all" ||
          item.dashboardProjectId ===
            projectFilter;

        const queryMatches =
          !normalizedQuery ||
          [
            item.dashboardStudentName,
            item.dashboardProjectTitle,
            item.dashboardSubject,
            item.dashboardClass,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);

        return (
          statusMatches &&
          projectMatches &&
          queryMatches
        );
      }
    );
  }, [
    decoratedSubmissions,
    projectFilter,
    query,
    statusFilter,
  ]);

  const pendingCount = useMemo(
    () =>
      decoratedSubmissions.filter(
        (item) => item.dashboardPending
      ).length,
    [decoratedSubmissions]
  );

  const gradedCount =
    decoratedSubmissions.length - pendingCount;

  const openGradingDialog = (item) => {
    setGradingItem(item);
    setGradeValue(
      item.dashboardGrade ?? ""
    );
    setFeedbackValue(
      item.dashboardFeedback || ""
    );
  };

  const closeGradingDialog = () => {
    if (saving) return;
    setGradingItem(null);
    setGradeValue("");
    setFeedbackValue("");
  };

  const handleSaveGrade = async () => {
    if (!gradingItem) return;

    const grade = Number(gradeValue);
    const maxGrade =
      gradingItem.dashboardMaxGrade;

    if (!Number.isFinite(grade)) {
      toast.error("اكتب درجة صحيحة");
      return;
    }

    if (grade < 0 || grade > maxGrade) {
      toast.error(
        `الدرجة يجب أن تكون بين 0 و ${maxGrade}`
      );
      return;
    }

    setSaving(true);

    try {
      const response = await gradeSubmission(
        gradingItem.dashboardProjectId,
        gradingItem.dashboardStudentId,
        {
          grade,
          feedback: feedbackValue,
        }
      );

      if (isFailedResponse(response)) {
        toast.error(
          getErrorMessage(
            response,
            "تعذر حفظ التصحيح"
          )
        );
        return;
      }

      const compatibility =
        response?.__gradingCompatibility;

      setSubmissions((previous) =>
        previous.map((submission) => {
          const projectId = getProjectId(
            submission.dashboardProject
          );
          const studentId =
            getStudentId(submission);

          if (
            projectId !==
              gradingItem.dashboardProjectId ||
            studentId !==
              gradingItem.dashboardStudentId
          ) {
            return submission;
          }

          return {
            ...submission,
            achievedGrade: grade,
            grade,
            feedback:
              compatibility?.feedbackSaved ===
              false
                ? submission?.feedback
                : feedbackValue,
          };
        })
      );

      if (
        feedbackValue.trim() &&
        compatibility?.feedbackSaved === false
      ) {
        toast.warning(
          "تم حفظ الدرجة، لكن نسخة الباك الحالية لم تحفظ الملاحظات."
        );
      } else {
        toast.success(
          gradingItem.dashboardPending
            ? "تم تصحيح التسليم بنجاح"
            : "تم تعديل التصحيح بنجاح"
        );
      }

      closeGradingDialog();
    } catch (saveError) {
      toast.error(
        saveError?.message ||
          "تعذر حفظ التصحيح"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (item) => {
    const key = item.dashboardKey;
    setDownloadingId(key);

    try {
      const result =
        await downloadProjectSubmission(
          item.dashboardProjectId,
          item.dashboardStudentId
        );

      if (!(result instanceof Blob)) {
        toast.error(
          getErrorMessage(
            result,
            "تعذر تحميل ملفات الطالب"
          )
        );
        return;
      }

      const safeStudent =
        item.dashboardStudentName
          .replace(/[^\p{L}\p{N}_-]+/gu, "-")
          .replace(/^-+|-+$/g, "") ||
        "student";

      downloadBlob(
        result,
        `${safeStudent}-submission.zip`
      );
    } catch (downloadError) {
      toast.error(
        downloadError?.message ||
          "تعذر تحميل ملفات الطالب"
      );
    } finally {
      setDownloadingId("");
    }
  };

  const handleProjectFilter = (value) => {
    setProjectFilter(value);

    const next = new URLSearchParams(
      searchParams
    );

    if (value === "all") {
      next.delete("projectId");
    } else {
      next.set("projectId", value);
    }

    next.delete("studentId");
    setSearchParams(next, { replace: true });
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        p: { xs: 1.2, md: 2.5 },
        color: "#122f4d",
        background:
          "linear-gradient(180deg,#f6f3eb 0%,#f4f0e7 100%)",
      }}
    >
      <Box
        sx={{
          width: "min(1500px,100%)",
          mx: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2.2 },
            overflow: "hidden",
            position: "relative",
            color: "white",
            borderRadius: "24px",
            background:
              "linear-gradient(135deg,#173f67 0%,#2e648f 100%)",
            boxShadow:
              "0 18px 44px rgba(18,47,77,.16)",
            "&::after": {
              content: '\"\"',
              position: "absolute",
              inset: "auto -60px -100px auto",
              width: 260,
              height: 260,
              borderRadius: "50%",
              border:
                "1px solid rgba(255,255,255,.08)",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1.2}
            >
              <Box
                sx={{
                  width: 64,
                  height: 50,
                  p: 0.7,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: "14px",
                }}
              >
                <Box
                  component="img"
                  src={nasaqLogo}
                  alt="نسق"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box>
                <Chip
                  icon={<FactCheckRounded />}
                  label="تقييم الطلاب"
                  size="small"
                  sx={{
                    mb: 0.7,
                    color: "#ffe19b",
                    backgroundColor:
                      "rgba(255,255,255,.1)",
                    fontWeight: 800,
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }}
                />
                <Typography
                  component="h1"
                  sx={{
                    fontSize: {
                      xs: "24px",
                      md: "32px",
                    },
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  تصحيح المشروعات
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    color: "rgba(255,255,255,.72)",
                    fontSize: "10px",
                  }}
                >
                  راجع ملفات الطلاب، أضف الدرجة، وسجّل ملاحظاتك من مكان واحد.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              gap={0.8}
              flexWrap="wrap"
            >
              <Button
                type="button"
                onClick={() =>
                  navigate("/teacher/dashboard")
                }
                startIcon={<ArrowBackRounded />}
                sx={{
                  minHeight: 42,
                  px: 1.6,
                  color: "white",
                  border:
                    "1px solid rgba(255,255,255,.22)",
                  borderRadius: "12px",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon": {
                    marginLeft: "7px",
                    marginRight: 0,
                  },
                }}
              >
                لوحة التحكم
              </Button>

              <Button
                type="button"
                disabled={refreshing}
                onClick={() => loadData(true)}
                startIcon={
                  refreshing ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <RefreshRounded />
                  )
                }
                sx={{
                  minHeight: 42,
                  px: 1.6,
                  color: "#173f67",
                  backgroundColor: "#ffe19b",
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#f5d47c",
                  },
                  "& .MuiButton-startIcon": {
                    marginLeft: "7px",
                    marginRight: 0,
                  },
                }}
              >
                تحديث البيانات
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg: "repeat(4,1fr)",
            },
            gap: 1.1,
          }}
        >
          <StatCard
            title="مشروعاتي"
            value={projects.length}
            helper="المشروعات التي أنشأتها"
            icon={<AssignmentRounded />}
          />
          <StatCard
            title="إجمالي التسليمات"
            value={decoratedSubmissions.length}
            helper="كل ملفات الطلاب المستلمة"
            icon={<FolderZipRounded />}
          />
          <StatCard
            title="تحتاج تصحيح"
            value={pendingCount}
            helper="تسليمات لم تُسجّل درجتها"
            icon={<PendingActionsRounded />}
            tone="gold"
          />
          <StatCard
            title="تم تصحيحها"
            value={gradedCount}
            helper="تسليمات مكتملة التقييم"
            icon={<CheckCircleRounded />}
            tone="green"
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: { xs: 1.2, md: 1.5 },
            border:
              "1px solid rgba(36,74,112,.08)",
            borderRadius: "20px",
            backgroundColor: "#fff",
            boxShadow:
              "0 14px 30px rgba(18,47,77,.055)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            alignItems={{ xs: "stretch", lg: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={0.7}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  color: "#b78430",
                  backgroundColor: "#fbf0d8",
                  borderRadius: "12px",
                }}
              >
                <FilterAltRounded />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  فلترة التسليمات
                </Typography>
                <Typography
                  sx={{
                    color: "#8b98a8",
                    fontSize: "8.5px",
                  }}
                >
                  ابحث باسم الطالب أو اختر مشروعًا وحالة التصحيح.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              gap={0.8}
              sx={{ flex: 1, justifyContent: "flex-end" }}
            >
              <TextField
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="ابحث باسم الطالب أو المشروع"
                size="small"
                sx={{
                  minWidth: { md: 260 },
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42,
                    borderRadius: "12px",
                    backgroundColor: "#fbfcfd",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded
                        sx={{
                          color: "#7e8b9a",
                          fontSize: 19,
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                value={projectFilter}
                onChange={(event) =>
                  handleProjectFilter(
                    event.target.value
                  )
                }
                size="small"
                sx={{
                  minWidth: { md: 230 },
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42,
                    borderRadius: "12px",
                    backgroundColor: "#fbfcfd",
                  },
                }}
              >
                <MenuItem value="all">
                  كل المشروعات
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem
                    key={getProjectId(project)}
                    value={getProjectId(project)}
                  >
                    {getProjectTitle(project)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.2 }} />

          <Stack
            direction="row"
            gap={0.7}
            flexWrap="wrap"
          >
            {[
              ["pending", `تحتاج تصحيح (${pendingCount})`],
              ["graded", `تم التصحيح (${gradedCount})`],
              ["all", `الكل (${decoratedSubmissions.length})`],
            ].map(([value, label]) => (
              <Chip
                key={value}
                clickable
                onClick={() =>
                  setStatusFilter(value)
                }
                label={label}
                sx={{
                  color:
                    statusFilter === value
                      ? "white"
                      : "#173f67",
                  backgroundColor:
                    statusFilter === value
                      ? "#173f67"
                      : "rgba(36,74,112,.07)",
                  fontSize: "9px",
                  fontWeight: 800,
                }}
              />
            ))}
          </Stack>
        </Paper>

        {!!error && (
          <Alert
            severity="error"
            sx={{
              mt: 1.2,
              borderRadius: "14px",
            }}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: { xs: 1.2, md: 1.5 },
            minHeight: 360,
            border:
              "1px solid rgba(36,74,112,.08)",
            borderRadius: "20px",
            backgroundColor: "#fff",
            boxShadow:
              "0 14px 30px rgba(18,47,77,.055)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 900,
                }}
              >
                تسليمات الطلاب
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  color: "#8b98a8",
                  fontSize: "9px",
                }}
              >
                يظهر هنا كل تسليم مطابق للفلاتر الحالية.
              </Typography>
            </Box>

            <Chip
              label={`${filteredSubmissions.length} نتيجة`}
              sx={{
                color: "#173f67",
                backgroundColor:
                  "rgba(36,74,112,.07)",
                fontWeight: 800,
              }}
            />
          </Stack>

          <Divider sx={{ my: 1.2 }} />

          {loading ? (
            <Box
              sx={{
                minHeight: 280,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <CircularProgress
                  size={30}
                  sx={{ color: "#b78430" }}
                />
                <Typography
                  sx={{
                    color: "#8b98a8",
                    fontSize: "10px",
                  }}
                >
                  جاري تحميل التسليمات...
                </Typography>
              </Stack>
            </Box>
          ) : !filteredSubmissions.length ? (
            <EmptyState
              title="لا توجد تسليمات مطابقة"
              description="غيّر الفلاتر أو انتظر حتى يرسل الطلاب ملفات مشروعاتهم."
            />
          ) : (
            <Stack spacing={0.9}>
              {filteredSubmissions.map((item) => {
                const isDownloading =
                  downloadingId ===
                  item.dashboardKey;

                return (
                  <Paper
                    key={item.dashboardKey}
                    elevation={0}
                    sx={{
                      overflow: "hidden",
                      border: item.dashboardPending
                        ? "1px solid rgba(211,164,79,.3)"
                        : "1px solid rgba(116,201,154,.3)",
                      borderRadius: "16px",
                      backgroundColor:
                        item.dashboardPending
                          ? "rgba(251,240,216,.18)"
                          : "rgba(116,201,154,.045)",
                    }}
                  >
                    <Box
                      sx={{
                        height: 4,
                        backgroundColor:
                          item.dashboardPending
                            ? "#d3a44f"
                            : "#4f9b70",
                      }}
                    />

                    <Box sx={{ p: 1.35 }}>
                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        alignItems={{ xs: "stretch", lg: "center" }}
                        justifyContent="space-between"
                        gap={1.2}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1}
                          sx={{ minWidth: 0 }}
                        >
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                              color: "white",
                              backgroundColor:
                                item.dashboardPending
                                  ? "#d3a44f"
                                  : "#4f9b70",
                              borderRadius: "14px",
                            }}
                          >
                            <PersonRounded />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              gap={0.6}
                              flexWrap="wrap"
                            >
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  fontWeight: 900,
                                }}
                              >
                                {item.dashboardStudentName}
                              </Typography>

                              <Chip
                                size="small"
                                icon={
                                  item.dashboardPending ? (
                                    <PendingActionsRounded />
                                  ) : (
                                    <CheckCircleRounded />
                                  )
                                }
                                label={
                                  item.dashboardPending
                                    ? "بانتظار التصحيح"
                                    : `${item.dashboardGrade} / ${item.dashboardMaxGrade}`
                                }
                                sx={{
                                  color:
                                    item.dashboardPending
                                      ? "#9b6817"
                                      : "#237449",
                                  backgroundColor:
                                    item.dashboardPending
                                      ? "#fbf0d8"
                                      : "rgba(116,201,154,.15)",
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  "& .MuiChip-icon": {
                                    color: "inherit",
                                    fontSize: 15,
                                  },
                                }}
                              />
                            </Stack>

                            <Typography
                              noWrap
                              sx={{
                                mt: 0.25,
                                color: "#173f67",
                                fontSize: "10px",
                                fontWeight: 800,
                              }}
                            >
                              {item.dashboardProjectTitle}
                            </Typography>

                            <Stack
                              direction="row"
                              gap={0.55}
                              flexWrap="wrap"
                              sx={{ mt: 0.45 }}
                            >
                              <Typography
                                sx={{
                                  color: "#8b98a8",
                                  fontSize: "8px",
                                }}
                              >
                                {item.dashboardSubject}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#c0c7cf",
                                  fontSize: "8px",
                                }}
                              >
                                •
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#8b98a8",
                                  fontSize: "8px",
                                }}
                              >
                                {item.dashboardClass}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#c0c7cf",
                                  fontSize: "8px",
                                }}
                              >
                                •
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#8b98a8",
                                  fontSize: "8px",
                                }}
                              >
                                {formatDate(
                                  item.dashboardDate
                                )}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          gap={0.7}
                        >
                          <Tooltip title="تحميل جميع ملفات التسليم بصيغة ZIP">
                            <span>
                              <Button
                                type="button"
                                disabled={
                                  isDownloading ||
                                  !item.dashboardStudentId
                                }
                                onClick={() =>
                                  handleDownload(item)
                                }
                                variant="outlined"
                                startIcon={
                                  isDownloading ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <DownloadRounded />
                                  )
                                }
                                sx={{
                                  minHeight: 40,
                                  px: 1.4,
                                  color: "#173f67",
                                  borderColor:
                                    "rgba(36,74,112,.2)",
                                  borderRadius: "11px",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  textTransform: "none",
                                  "& .MuiButton-startIcon": {
                                    marginLeft: "6px",
                                    marginRight: 0,
                                  },
                                }}
                              >
                                تحميل الملفات
                              </Button>
                            </span>
                          </Tooltip>

                          <Button
                            type="button"
                            onClick={() =>
                              openGradingDialog(item)
                            }
                            variant="contained"
                            startIcon={
                              item.dashboardPending ? (
                                <GradeRounded />
                              ) : (
                                <CheckCircleRounded />
                              )
                            }
                            sx={{
                              minHeight: 40,
                              px: 1.5,
                              color: "white",
                              backgroundColor:
                                item.dashboardPending
                                  ? "#173f67"
                                  : "#4f9b70",
                              borderRadius: "11px",
                              fontSize: "9px",
                              fontWeight: 900,
                              textTransform: "none",
                              "&:hover": {
                                backgroundColor:
                                  item.dashboardPending
                                    ? "#122f4d"
                                    : "#3f865f",
                              },
                              "& .MuiButton-startIcon": {
                                marginLeft: "6px",
                                marginRight: 0,
                              },
                            }}
                          >
                            {item.dashboardPending
                              ? "تصحيح الآن"
                              : "تعديل التصحيح"}
                          </Button>
                        </Stack>
                      </Stack>

                      {!!item.dashboardFeedback && (
                        <Alert
                          severity="success"
                          icon={<FactCheckRounded />}
                          sx={{
                            mt: 1,
                            py: 0.15,
                            borderRadius: "10px",
                            fontSize: "8.5px",
                          }}
                        >
                          ملاحظتك: {item.dashboardFeedback}
                        </Alert>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog
        open={Boolean(gradingItem)}
        onClose={closeGradingDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            height: 5,
            background:
              "linear-gradient(90deg,#d3a44f,#173f67)",
          }}
        />

        <DialogTitle
          sx={{
            pb: 1,
            fontSize: "18px",
            fontWeight: 900,
          }}
        >
          {gradingItem?.dashboardPending
            ? "تصحيح تسليم المشروع"
            : "تعديل تصحيح المشروع"}
        </DialogTitle>

        <DialogContent>
          <Paper
            elevation={0}
            sx={{
              mb: 1.5,
              p: 1.2,
              border:
                "1px solid rgba(36,74,112,.08)",
              borderRadius: "14px",
              backgroundColor: "#f8fafc",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  color: "#173f67",
                  backgroundColor:
                    "rgba(36,74,112,.08)",
                  borderRadius: "12px",
                }}
              >
                <GroupsRounded />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  {gradingItem?.dashboardStudentName}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    color: "#7e8b9a",
                    fontSize: "9px",
                  }}
                >
                  {gradingItem?.dashboardProjectTitle}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={1.2}>
            <TextField
              autoFocus
              type="number"
              label="الدرجة"
              value={gradeValue}
              onChange={(event) =>
                setGradeValue(event.target.value)
              }
              inputProps={{
                min: 0,
                max:
                  gradingItem?.dashboardMaxGrade ||
                  100,
                step: 0.5,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    من {gradingItem?.dashboardMaxGrade || 100}
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            <TextField
              label="ملاحظات للطالب"
              value={feedbackValue}
              onChange={(event) =>
                setFeedbackValue(
                  event.target.value
                )
              }
              multiline
              minRows={4}
              placeholder="اكتب نقاط القوة أو الملاحظات التي تساعد الطالب على التحسن..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            <Alert
              severity="info"
              sx={{
                borderRadius: "12px",
                fontSize: "9px",
              }}
            >
              ملفات الباك المرسلة تحتوي صيغتين مختلفتين لحفظ الدرجة؛ الصفحة تتعامل تلقائيًا مع الصيغة التي يدعمها السيرفر.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            pt: 0.5,
            gap: 0.7,
          }}
        >
          <Button
            type="button"
            disabled={saving}
            onClick={closeGradingDialog}
            sx={{
              minHeight: 42,
              px: 1.5,
              color: "#667587",
              borderRadius: "11px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            إلغاء
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={handleSaveGrade}
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress
                  size={15}
                  color="inherit"
                />
              ) : (
                <GradeRounded />
              )
            }
            sx={{
              minHeight: 42,
              px: 2,
              color: "white",
              backgroundColor: "#173f67",
              borderRadius: "11px",
              fontWeight: 900,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                marginLeft: "7px",
                marginRight: 0,
              },
            }}
          >
            حفظ التصحيح
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherProjectGrading;
