import {
  AddRounded,
  ArrowBackRounded,
  AttachFileRounded,
  AutoStoriesRounded,
  CheckCircleRounded,
  CloseRounded,
  CloudUploadRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  EditNoteRounded,
  LinkRounded,
  MenuBookRounded,
  SaveRounded,
  SearchRounded,
  SendRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
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
  FormControlLabel,
  Grid,
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthUser } from "react-auth-kit";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";
import {
  addPreparation,
  addPreparationFiles,
  addPreparationResource,
  deletePreparationResource,
  editPreparation,
  fetchPreparationReferenceLists,
  fetchSinglePreparation,
  submitPreparation,
} from "@/APIs/school/preparation";
import {
  fetchLectures,
  fetchSingleLecture,
} from "@/APIs/school/lectures";
import { fetchSingleSubjectOffering } from "@/APIs/school/subjectOfferings";
import {
  fetchCurriculumLessons,
  fetchCurriculumUnits,
} from "@/APIs/school/curriculum";
import {
  addLibraryResource,
  fetchLibraries,
} from "@/APIs/school/library";
import {
  fetchExams,
  fetchTeacherExams,
} from "@/APIs/school/exams";
import {
  fetchProjects,
  fetchTeacherProjects,
} from "@/APIs/school/projects";

const AUTOSAVE_MS = 30_000;
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

const EMPTY_FORM = {
  lecture: "",
  unitId: "",
  lessonId: "",
  lessonTitle: "",
  warmup: "",
  vocabulary: "",
  objectives: [""],
  digitalContentIds: [],
  teachingStrategies: [],
  otherTeachingStrategy: "",
  educationalAids: [],
  otherEducationalAid: "",
  thinkingSkills: "",
  lessonClosing: "",
  enrichments: [],
  homeworks: [],
  exams: [],
  activities: [],
  teacherInstructions: "",
};

const STATUS_META = {
  draft: { label: "مسودة", tone: "warning" },
  pending: { label: "بانتظار المراجعة", tone: "info" },
  approved: { label: "معتمد", tone: "success" },
  needs_revision: { label: "يحتاج تعديل", tone: "error" },
};

const SCHOOL_ADMIN_ROLES = [
  "OWNER",
  "SUPERVISOR",
  "MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

const ASSIGNMENT_GROUPS = [
  { key: "enrichments", label: "إثراءات المعلم", singular: "إثراء" },
  { key: "homeworks", label: "واجبات", singular: "واجب" },
  { key: "exams", label: "اختبارات", singular: "اختبار" },
  { key: "activities", label: "أنشطة", singular: "نشاط" },
];

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const normalizeRole = (value) =>
  String(value || "").trim().toUpperCase();

const unwrap = (value) => {
  let current = value;
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
  return current;
};

const extractList = (value, preferredKeys = []) => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const keys = [
    ...preferredKeys,
    "docs",
    "items",
    "results",
    "records",
    "data",
  ];

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return Object.values(payload).find(Array.isArray) || [];
};

const extractEntity = (value) => {
  const payload = unwrap(value);
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return {};
  }
  return payload.preparation || payload.lecture || payload.item || payload;
};

const getName = (value, fallback = "") => {
  if (value && typeof value === "object") {
    return String(
      value.name ||
        value.title ||
        value.label ||
        value.subjectName ||
        value.lessonTitle ||
        fallback
    ).trim();
  }
  return String(value || fallback).trim();
};

const getAttachmentLabel = (file, index = 0) => {
  if (typeof file === "string") {
    const name = file.split("/").filter(Boolean).pop() || "";
    try {
      return decodeURIComponent(name) || `مرفق ${index + 1}`;
    } catch {
      return name || `مرفق ${index + 1}`;
    }
  }

  return String(
    file?.originalName ||
      file?.name ||
      file?.filename ||
      file?.storedName ||
      file?.path?.split?.("/")?.pop?.() ||
      `مرفق ${index + 1}`
  );
};

const getCurrentUser = (authUser) => {
  const auth = typeof authUser === "function" ? authUser() : authUser;
  return auth?.user || auth || {};
};

const getLectureOffering = (lecture) =>
  (lecture?.subjectOfferingId && typeof lecture.subjectOfferingId === "object"
    ? lecture.subjectOfferingId
    : null) ||
  (lecture?.subjectOffering && typeof lecture.subjectOffering === "object"
    ? lecture.subjectOffering
    : null) ||
  {};

const getLectureSubject = (lecture) => {
  const offering = getLectureOffering(lecture);

  const subjectCandidates = [
    lecture?.subjectId,
    lecture?.subject,
    offering?.subjectId,
    offering?.subject,
  ];
  const entity =
    subjectCandidates.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    ) || {};
  const id = subjectCandidates.map(normalizeId).find(Boolean) || "";

  return {
    id,
    name:
      getName(entity) ||
      String(
        lecture?.subjectName ||
          offering?.subjectName ||
          offering?.subject?.name ||
          offering?.subjectId?.name ||
          ""
      ).trim() ||
      "المادة",
    offeringId: normalizeId(
      lecture?.subjectOfferingId || lecture?.subjectOffering
    ),
  };
};

const getLectureGrade = (lecture) => {
  const offering = getLectureOffering(lecture);
  const classroom =
    (lecture?.classId && typeof lecture.classId === "object"
      ? lecture.classId
      : null) ||
    (lecture?.class && typeof lecture.class === "object" ? lecture.class : null) ||
    {};
  const candidates = [
    offering?.gradeLevelId,
    offering?.gradeLevel,
    classroom?.gradeLevelId,
    classroom?.gradeLevel,
    lecture?.gradeLevelId,
    lecture?.gradeLevel,
  ];
  const entity =
    candidates.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    ) || {};

  return {
    id: candidates.map(normalizeId).find(Boolean) || "",
    name:
      getName(entity) ||
      String(
        offering?.gradeLevelName ||
          offering?.gradeName ||
          classroom?.gradeName ||
          lecture?.gradeName ||
          ""
      ).trim() ||
      "الصف الدراسي",
  };
};

const hydrateLectureCurriculumContext = async (lecture) => {
  if (!lecture || typeof lecture !== "object") return lecture || null;

  const rawOffering = lecture?.subjectOfferingId || lecture?.subjectOffering;
  const offeringId = normalizeId(rawOffering);
  let offering =
    rawOffering && typeof rawOffering === "object" && !Array.isArray(rawOffering)
      ? rawOffering
      : {};

  const hasCurriculumIds =
    normalizeId(offering?.subjectId || offering?.subject) &&
    normalizeId(offering?.gradeLevelId || offering?.gradeLevel);

  if (offeringId && !hasCurriculumIds) {
    const response = await fetchSingleSubjectOffering(offeringId);
    if (response?.status) {
      offering = {
        ...offering,
        ...extractEntity(response),
      };
    }
  }

  if (!offeringId && !Object.keys(offering).length) return lecture;

  const normalizedOffering = {
    ...offering,
    ...(offeringId ? { _id: offering?._id || offeringId } : {}),
  };

  return {
    ...lecture,
    subjectOfferingId: normalizedOffering,
    subjectOffering: normalizedOffering,
  };
};

const getLectureClassId = (lecture) =>
  normalizeId(
    lecture?.classId ||
      lecture?.class
  );

const getLectureLabel = (lecture) => {
  const subject = getLectureSubject(lecture);
  const classroom =
    (lecture?.classId && typeof lecture.classId === "object"
      ? lecture.classId
      : null) ||
    (lecture?.class && typeof lecture.class === "object" ? lecture.class : null) ||
    {};
  const className =
    getName(classroom) || classroom?.roomNumber || lecture?.className || "";
  const slot = lecture?.slot || lecture?.period || "";
  const day = lecture?.dayOfWeek || lecture?.day || "";

  return [subject.name, className, day, slot ? `الحصة ${slot}` : ""]
    .filter(Boolean)
    .join(" — ");
};

const normalizeObjectiveRows = (value) => {
  const source = Array.isArray(value) ? value : [];
  const rows = source
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.text || item?.title || item?.name || ""
    )
    .map((item) => String(item || ""));
  return rows.length ? rows : [""];
};

const normalizeIds = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => normalizeId(item?.libraryItemId || item?.itemId || item))
    .filter(Boolean);

const normalizeChoiceArray = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.value || item?.id || item?.name || item?.label || ""
    )
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const normalizeAssignmentItems = (value) =>
  (Array.isArray(value) ? value : []).map((item, index) => {
    if (typeof item === "string") {
      return { id: item, resourceId: item, title: item };
    }
    return {
      ...item,
      id:
        normalizeId(item) ||
        String(item?.key || `local-${index}`),
      resourceId:
        normalizeId(
          item?._id ||
            item?.resourceId
        ) || "",
      examId:
        normalizeId(item?.examId) || "",
      projectId:
        normalizeId(item?.projectId) || "",
      title:
        getName(item) ||
        item?.examTitle ||
        item?.lessonTitle ||
        `عنصر ${index + 1}`,
      startDate:
        String(
          item?.startAt ||
            item?.startDate ||
            item?.from ||
            ""
        ).slice(0, 10),
      endDate:
        String(
          item?.dueAt ||
            item?.endDate ||
            item?.to ||
            ""
        ).slice(0, 10),
      description:
        String(item?.description || ""),
      link:
        String(item?.link || ""),
      totalGrade:
        item?.totalGrade ?? "",
    };
  });

const RESOURCE_GROUP_BY_TYPE = {
  enrichment: "enrichments",
  homework: "homeworks",
  quiz: "exams",
  activity: "activities",
};

const RESOURCE_TYPE_BY_GROUP = {
  enrichments: "enrichment",
  homeworks: "homework",
  exams: "quiz",
  activities: "activity",
};

const groupResources = (resources = []) => {
  const grouped = {
    enrichments: [],
    homeworks: [],
    exams: [],
    activities: [],
  };

  (Array.isArray(resources) ? resources : []).forEach(
    (resource) => {
      const group =
        RESOURCE_GROUP_BY_TYPE[
          String(resource?.type || "")
            .trim()
            .toLowerCase()
        ];

      if (!group) return;

      grouped[group].push(
        normalizeAssignmentItems(
          [resource]
        )[0]
      );
    }
  );

  return grouped;
};

const getStatus = (preparation) => {
  const status = String(
    preparation?.status || preparation?.reviewStatus || "draft"
  )
    .trim()
    .toLowerCase();

  if (status === "pending_review" || status === "submitted") return "pending";
  return STATUS_META[status] ? status : "draft";
};

const snapshot = (form) =>
  JSON.stringify({
    lecture: normalizeId(form.lecture),
    ...makePayload(form),
  });

const assignmentCount = (form) =>
  ASSIGNMENT_GROUPS.reduce(
    (total, group) => total + (form[group.key]?.length || 0),
    0
  );

const isOtherChoice = (item) => {
  const value = String(item?.value || item?.id || item?.name || item?.label || "")
    .trim()
    .toLowerCase();
  return value === "other" || value === "أخرى" || value.includes("other");
};

const normalizeReferenceChoices = (value) =>
  (Array.isArray(value) ? value : []).map((item, index) => {
    if (typeof item === "string") {
      return { id: item, value: item, label: item };
    }
    const id = String(item?.value || item?.id || item?._id || index);
    return {
      ...item,
      id,
      value: String(item?.value || item?.id || item?._id || item?.name || id),
      label: getName(item, id),
    };
  });

const getReferenceLists = (response) => {
  const data = extractEntity(response);
  const strategies =
    data?.teachingStrategies ||
    data?.strategies ||
    data?.teaching_strategies ||
    data?.methods ||
    [];
  const aids =
    data?.educationalAids ||
    data?.teachingAids ||
    data?.aids ||
    data?.educational_aids ||
    [];

  return {
    strategies: normalizeReferenceChoices(strategies),
    aids: normalizeReferenceChoices(aids),
  };
};

const getStructuredForm = (preparation = {}) => {
  const lessonRef =
    preparation?.lessonId ||
    preparation?.lesson ||
    null;
  const resources =
    groupResources(
      preparation?.resources
    );

  return {
    lecture:
      normalizeId(
        preparation?.lecture ||
          preparation?.lectureId
      ),
    unitId:
      normalizeId(
        preparation?.unitId ||
          preparation?.unit ||
          lessonRef?.unitId ||
          lessonRef?.unit
      ),
    lessonId:
      normalizeId(lessonRef),
    lessonTitle:
      String(
        preparation?.lessonTitle ||
          getName(lessonRef) ||
          ""
      ),
    warmup:
      String(
        preparation?.warmUp ||
          preparation?.warmup ||
          preparation?.introduction ||
          ""
      ),
    vocabulary:
      String(
        preparation?.vocabulary ||
          preparation?.lessonVocabulary ||
          ""
      ),
    objectives:
      normalizeObjectiveRows(
        preparation?.objectives
      ),
    digitalContentIds:
      normalizeIds(
        preparation?.digitalContentIds ||
          preparation?.digitalContents ||
          preparation?.libraryItems
      ),
    teachingStrategies:
      normalizeChoiceArray(
        preparation?.teachingStrategies
      ),
    otherTeachingStrategy:
      String(
        preparation?.strategiesOther ||
          preparation?.otherTeachingStrategy ||
          ""
      ),
    educationalAids:
      normalizeChoiceArray(
        preparation?.teachingAids ||
          preparation?.educationalAids
      ),
    otherEducationalAid: "",
    thinkingSkills:
      String(
        preparation?.thinkingSkills ||
          ""
      ),
    lessonClosing:
      String(
        preparation?.closure ||
          preparation?.lessonClosing ||
          preparation?.closing ||
          ""
      ),
    enrichments:
      resources.enrichments.length
        ? resources.enrichments
        : normalizeAssignmentItems(
            preparation?.enrichments
          ),
    homeworks:
      resources.homeworks.length
        ? resources.homeworks
        : normalizeAssignmentItems(
            preparation?.homeworks ||
              preparation?.assignments
          ),
    exams:
      resources.exams.length
        ? resources.exams
        : normalizeAssignmentItems(
            preparation?.exams
          ),
    activities:
      resources.activities.length
        ? resources.activities
        : normalizeAssignmentItems(
            preparation?.activities
          ),
    teacherInstructions:
      String(
        preparation?.teacherInstructions ||
          ""
      ),
  };
};

const makePayload = (form) => {
  const teachingAids = [
    ...form.educationalAids,
  ];

  if (
    form.educationalAids.some(
      (value) =>
        String(value)
          .trim()
          .toLowerCase() === "other" ||
        String(value).trim() === "أخرى"
    ) &&
    String(
      form.otherEducationalAid || ""
    ).trim()
  ) {
    teachingAids.push(
      String(
        form.otherEducationalAid
      ).trim()
    );
  }

  const payload = {
    warmUp:
      String(form.warmup || ""),
    vocabulary:
      String(form.vocabulary || ""),
    objectives:
      form.objectives
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean),
    digitalContentIds:
      form.digitalContentIds
        .map(normalizeId)
        .filter(Boolean),
    teachingStrategies:
      form.teachingStrategies,
    strategiesOther:
      String(
        form.otherTeachingStrategy ||
          ""
      ),
    teachingAids,
    thinkingSkills:
      String(
        form.thinkingSkills || ""
      ),
    closure:
      String(
        form.lessonClosing || ""
      ),
    teacherInstructions:
      String(
        form.teacherInstructions ||
          ""
      ),
  };

  const lessonId =
    normalizeId(form.lessonId);

  if (lessonId) {
    payload.lessonId =
      lessonId;
  }

  return payload;
};

const makeChangedPayload = (form, previousSnapshot = "") => {
  const current = makePayload(form);

  let previous = {};
  try {
    const parsed = JSON.parse(previousSnapshot || "{}");
    previous = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    previous = {};
  }

  const changed = {};

  Object.entries(current).forEach(([key, value]) => {
    const before = previous?.[key];
    if (JSON.stringify(value) !== JSON.stringify(before)) {
      changed[key] = value;
    }
  });

  return changed;
};

const dateOnlyToIso = (
  value,
  endOfDay = false
) => {
  const date = String(
    value || ""
  ).trim();

  if (!date) return "";

  const suffix = endOfDay
    ? "T23:59:59.999Z"
    : "T00:00:00.000Z";

  return `${date}${suffix}`;
};

const StudentBadge = () => (
  <Chip
    size="small"
    label="تظهر في حساب الطالب"
    sx={{
      height: 22,
      bgcolor: "rgba(36,74,112,.07)",
      color: "var(--color-muted)",
      fontSize: 9,
      fontWeight: 800,
    }}
  />
);

const FieldLabel = ({ children, studentVisible = false, required = false }) => (
  <Stack direction="row" alignItems="center" gap={0.7} flexWrap="wrap" mb={0.65}>
    <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 12.5 }}>
      {children}{required ? " *" : ""}
    </Typography>
    {studentVisible && <StudentBadge />}
  </Stack>
);

const SectionCard = ({ title, subtitle, icon, children, id }) => (
  <Paper
    id={id}
    elevation={0}
    sx={{
      p: { xs: 1.25, md: 1.7 },
      border: "1px solid rgba(36,74,112,.09)",
      borderRadius: "18px",
      bgcolor: "#fff",
      boxShadow: "0 10px 26px rgba(18,47,77,.045)",
      scrollMarginTop: 120,
    }}
  >
    <Stack direction="row" alignItems="center" gap={1} mb={1.4}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          bgcolor: "var(--color-gold-soft)",
          color: "var(--color-gold-dark)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 15 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5, mt: 0.2 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Stack>
    {children}
  </Paper>
);

const WizardSteps = ({ step, onStep, stepTwoEnabled }) => (
  <Paper
    elevation={0}
    sx={{
      position: "sticky",
      top: 8,
      zIndex: 20,
      p: 1,
      border: "1px solid rgba(36,74,112,.1)",
      borderRadius: "16px",
      bgcolor: "rgba(255,255,255,.95)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 24px rgba(18,47,77,.08)",
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
      {[1, 2].map((number, index) => {
        const active = step === number;
        const enabled = number === 1 || stepTwoEnabled;
        return (
          <Stack
            key={number}
            direction="row"
            alignItems="center"
            sx={{ flex: index === 0 ? 1 : "unset", minWidth: 0 }}
          >
            <Button
              type="button"
              disabled={!enabled}
              onClick={() => onStep(number)}
              sx={{
                minWidth: 0,
                px: 0.8,
                color: active ? "var(--color-navy-deep)" : "var(--color-muted)",
                textTransform: "none",
              }}
            >
              <Stack alignItems="center" gap={0.3}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: active ? "var(--color-navy)" : enabled ? "var(--color-gold-soft)" : "#f0f1f3",
                    color: active ? "#fff" : enabled ? "var(--color-gold-dark)" : "#aaa",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  {number}
                </Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 900, whiteSpace: "nowrap" }}>
                  {number === 1 ? "المعلومات الأساسية" : "إعداد الدرس"}
                </Typography>
              </Stack>
            </Button>
            {index === 0 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: { xs: 0.4, sm: 1 },
                  borderRadius: 99,
                  bgcolor: stepTwoEnabled ? "var(--color-gold)" : "rgba(36,74,112,.12)",
                }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  </Paper>
);

const ChoiceChecklist = ({ options, values, onChange, disabled, otherValue, onOtherChange }) => {
  const selected = new Set(values);
  const hasOther = options.some((option) => isOtherChoice(option) && selected.has(option.value));

  return (
    <Stack spacing={0.45}>
      <Grid container spacing={0.4}>
        {options.map((option) => (
          <Grid item xs={12} sm={6} key={option.id}>
            <FormControlLabel
              disabled={disabled}
              control={
                <Checkbox
                  size="small"
                  checked={selected.has(option.value)}
                  onChange={(event) => {
                    const next = new Set(values);
                    if (event.target.checked) next.add(option.value);
                    else next.delete(option.value);
                    onChange(Array.from(next));
                  }}
                />
              }
              label={option.label}
              sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 11.5, fontWeight: 700 } }}
            />
          </Grid>
        ))}
      </Grid>
      {hasOther && (
        <TextField
          fullWidth
          size="small"
          disabled={disabled}
          value={otherValue}
          onChange={(event) => onOtherChange(event.target.value)}
          placeholder="اكتب الخيار الآخر"
          inputProps={{ maxLength: 300 }}
        />
      )}
    </Stack>
  );
};

const AssignmentCard = ({
  item,
  group,
  onRemove,
  onEdit,
  onAnswers,
  readOnly,
}) => (
  <Paper
    variant="outlined"
    sx={{ p: 1, borderRadius: "13px", borderColor: "rgba(36,74,112,.11)", bgcolor: "#fcfdff" }}
  >
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 11.5 }}>
          {group.singular} — {item.title || "بدون عنوان"}
        </Typography>
        {(item.startDate || item.endDate) && (
          <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5, mt: 0.3 }}>
            {item.startDate ? `البداية: ${item.startDate}` : ""}
            {item.startDate && item.endDate ? "   " : ""}
            {item.endDate ? `النهاية: ${item.endDate}` : ""}
          </Typography>
        )}
      </Box>
      <Stack direction="row" alignItems="center" gap={0.35} justifyContent="flex-end">
        {onAnswers && (
          <Button size="small" onClick={onAnswers} sx={{ minWidth: 0, px: 0.8, fontSize: 9.5, fontWeight: 900, textTransform: "none" }}>
            الإجابات
          </Button>
        )}
        {onEdit && !readOnly && (
          <Button size="small" onClick={onEdit} sx={{ minWidth: 0, px: 0.8, fontSize: 9.5, fontWeight: 900, textTransform: "none" }}>
            تعديل
          </Button>
        )}
        {!readOnly && (
          <Tooltip title="إزالة من التحضير">
            <IconButton size="small" onClick={onRemove} sx={{ color: "var(--color-danger)" }}>
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  </Paper>
);

const StructuredPreparationForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const authUser = useAuthUser();
  const currentUser = getCurrentUser(authUser);
  const role = normalizeRole(currentUser?.role);
  const teacherPortal = location.pathname.startsWith("/teacher/");
  const explicitId = normalizeId(params?.id);
  const preselectedLectureId = String(searchParams.get("lectureId") || "").trim();
  const requestedReturnTo = String(searchParams.get("returnTo") || "").trim();
  const safeReturnTo =
    requestedReturnTo.startsWith("/teacher/") || requestedReturnTo.startsWith("/school/")
      ? requestedReturnTo
      : teacherPortal
        ? "/teacher/preparations"
        : "/school/preparation";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preparationId, setPreparationId] = useState(explicitId);
  const [preparationStatus, setPreparationStatus] = useState("draft");
  const [reviewNote, setReviewNote] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [units, setUnits] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumMessage, setCurriculumMessage] = useState("");
  const [referenceLists, setReferenceLists] = useState({ strategies: [], aids: [] });
  const [libraryItems, setLibraryItems] = useState([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryDialog, setLibraryDialog] = useState(false);
  const [libraryDraft, setLibraryDraft] = useState({ title: "", link: "", file: null });
  const [librarySaving, setLibrarySaving] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState(null);
  const [assignmentEditIndex, setAssignmentEditIndex] = useState(null);
  const [assignmentDraft, setAssignmentDraft] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    totalGrade: "",
    link: "",
  });
  const [examOptions, setExamOptions] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [suggestedObjectives, setSuggestedObjectives] = useState(false);
  const savedSnapshotRef = useRef(snapshot(EMPTY_FORM));
  const lastSaveRef = useRef(null);
  const saveDraftRef = useRef(null);
  const dirtyRef = useRef(false);
  const objectivePrefillLessonRef = useRef("");
  const mountedRef = useRef(true);
  const createDraftPromiseRef = useRef(null);
  const autosaveCreateBlockedRef = useRef(false);

  const subject = useMemo(() => getLectureSubject(lecture || {}), [lecture]);
  const grade = useMemo(() => getLectureGrade(lecture || {}), [lecture]);
  const currentSnapshot = useMemo(() => snapshot(form), [form]);
  const dirty = currentSnapshot !== savedSnapshotRef.current || Boolean(attachment);
  const readOnly =
    mode === "view" ||
    preparationStatus === "pending";
  const editable =
    mode !== "view" &&
    preparationStatus !== "pending";
  const canPickLecture = mode === "create" && !preselectedLectureId && !preparationId;

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const updateForm = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    if (dirty && !window.confirm("لديك تغييرات لم يتم حفظها. هل تريد المغادرة؟")) {
      return;
    }
    navigate(safeReturnTo);
  }, [dirty, navigate, safeReturnTo]);

  const navigateAway = useCallback(
    (target) => {
      if (dirty && !window.confirm("لديك تغييرات لم يتم حفظها. هل تريد المغادرة؟")) {
        return;
      }
      navigate(target);
    },
    [dirty, navigate]
  );

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const refsPromise = fetchPreparationReferenceLists();
        let initialPreparation = null;
        let lectureId = preselectedLectureId;

        if (explicitId) {
          const prepResponse = await fetchSinglePreparation(explicitId);
          if (!prepResponse?.status) {
            toast.error(prepResponse?.message || "تعذر تحميل التحضير");
            return;
          }
          initialPreparation = extractEntity(prepResponse);
          lectureId = normalizeId(initialPreparation?.lecture || initialPreparation?.lectureId);
        }

        let lectureRows = [];
        if (lectureId) {
          const lectureResponse = await fetchSingleLecture(lectureId, { force: true });
          if (lectureResponse?.status) {
            lectureRows = [extractEntity(lectureResponse)].filter(Boolean);
          }
        } else {
          const filters = SCHOOL_ADMIN_ROLES.includes(role)
            ? {}
            : { teacherId: normalizeId(currentUser?.teacherId || currentUser) };
          const lectureResponse = await fetchLectures(filters, { force: true });
          if (lectureResponse?.status) {
            lectureRows = extractList(lectureResponse, ["lectures"]);
          }
        }

        const refsResponse = await refsPromise;
        if (!active) return;

        setReferenceLists(getReferenceLists(refsResponse));
        setLectures(lectureRows.filter((item) => normalizeId(item)));

        if (lectureId) {
          const selectedLecture = lectureRows.find((item) => normalizeId(item) === lectureId) || lectureRows[0] || null;
          setLecture(selectedLecture);
        }

        if (initialPreparation) {
          const normalized = getStructuredForm(initialPreparation);
          setForm(normalized);
          savedSnapshotRef.current = snapshot(normalized);
          objectivePrefillLessonRef.current =
            normalizeId(normalized.lessonId);
          setPreparationId(normalizeId(initialPreparation));
          setPreparationStatus(getStatus(initialPreparation));
          setReviewNote(String(initialPreparation?.reviewNote || ""));
          setExistingFiles(
            extractList(
              { data: initialPreparation?.files || initialPreparation?.attachments || [] },
              ["files", "attachments"]
            )
          );
        } else {
          const initial = { ...EMPTY_FORM, lecture: lectureId || "" };
          setForm(initial);
          savedSnapshotRef.current = snapshot(initial);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "تعذر فتح نموذج التحضير");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [explicitId, preselectedLectureId, role]);

  useEffect(() => {
    let active = true;
    const selected = lectures.find(
      (item) => normalizeId(item) === normalizeId(form.lecture)
    );

    if (!selected) {
      setLecture(null);
      return () => {
        active = false;
      };
    }

    const hydrate = async () => {
      const hydrated = await hydrateLectureCurriculumContext(selected);
      if (active) setLecture(hydrated);
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [form.lecture, lectures]);

  useEffect(() => {
    if (!lecture || !subject.id || !grade.id) {
      setUnits([]);
      setLessons([]);
      return;
    }

    let active = true;
    const run = async () => {
      setCurriculumLoading(true);
      setCurriculumMessage("");
      const response = await fetchCurriculumUnits({
        subjectId: subject.id,
        gradeLevelId: grade.id,
      });
      if (!active) return;

      if (!response?.status) {
        setUnits([]);
        setCurriculumMessage(response?.message || "تعذر تحميل وحدات المنهج");
      } else {
        const rows = extractList(response, ["units"]);
        setUnits(rows);
        if (!rows.length) {
          setCurriculumMessage("لم يتم إعداد دروس هذه المادة بعد — تواصل مع إدارة المدرسة");
        }
      }
      setCurriculumLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [lecture, subject.id, grade.id]);

  useEffect(() => {
    if (!form.unitId) {
      setLessons([]);
      return;
    }
    let active = true;
    const run = async () => {
      setCurriculumLoading(true);
      const response = await fetchCurriculumLessons(form.unitId);
      if (!active) return;
      if (response?.status) {
        setLessons(extractList(response, ["lessons"]));
      } else {
        setLessons([]);
        toast.error(response?.message || "تعذر تحميل الدروس");
      }
      setCurriculumLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [form.unitId]);

  useEffect(() => {
    if (!form.lessonId) return;
    const selected = lessons.find(
      (item) =>
        normalizeId(item) ===
        normalizeId(form.lessonId)
    );
    if (!selected) return;

    const title = getName(selected);
    if (title && title !== form.lessonTitle) {
      setForm((current) => ({
        ...current,
        lessonTitle: title,
      }));
    }
  }, [form.lessonId, form.lessonTitle, lessons]);

  useEffect(() => {
    if (!subject.offeringId) {
      setLibraryItems([]);
      return;
    }

    let active = true;

    const run = async () => {
      setLibraryLoading(true);

      const response =
        await fetchLibraries(
          {
            subjectOfferingId:
              subject.offeringId,
            limit: 500,
          },
          { force: true }
        );

      if (!active) return;

      if (response?.status) {
        setLibraryItems(
          extractList(
            response,
            [
              "library",
              "libraries",
              "items",
            ]
          )
        );
      } else {
        setLibraryItems([]);
      }

      setLibraryLoading(false);
    };

    run();

    return () => {
      active = false;
    };
  }, [subject.offeringId]);

  const createDraftRecord = useCallback(
    async ({ silent = false } = {}) => {
      if (preparationId) {
        return preparationId;
      }

      const lectureId =
        normalizeId(form.lecture);

      if (!lectureId) {
        if (!silent) {
          toast.error(
            "اختر الحصة الدراسية أولًا"
          );
        }
        return false;
      }

      if (
        silent &&
        autosaveCreateBlockedRef.current
      ) {
        return false;
      }

      if (createDraftPromiseRef.current) {
        return createDraftPromiseRef.current;
      }

      if (!silent) {
        autosaveCreateBlockedRef.current = false;
      }

      const createPromise = (async () => {
        const response =
          await addPreparation({
            lecture: lectureId,
          });

        if (!response?.status) {
          if (
            !response?.statusCode ||
            Number(response.statusCode) >= 500
          ) {
            /*
             * لا نعيد POST تلقائيًا بعد فشل شبكة مبهم؛
             * المستخدم يستطيع المحاولة يدويًا بعد التحقق.
             */
            autosaveCreateBlockedRef.current = true;
          }

          if (!silent) {
            toast.error(
              response?.message ||
                "تعذر إنشاء مسودة التحضير"
            );
          }
          return false;
        }

        const created =
          extractEntity(response);
        const id =
          normalizeId(created) ||
          normalizeId(response?.data);

        if (!id) {
          if (!silent) {
            toast.error(
              "تم إنشاء المسودة لكن تعذر قراءة معرّفها"
            );
          }
          return false;
        }

        if (mountedRef.current) {
          setPreparationId(id);
          setPreparationStatus(
            getStatus(created)
          );
        }

        autosaveCreateBlockedRef.current = false;
        return id;
      })();

      createDraftPromiseRef.current =
        createPromise;

      try {
        return await createPromise;
      } finally {
        createDraftPromiseRef.current = null;
      }
    },
    [form.lecture, preparationId]
  );

  const saveDraft = useCallback(
    async ({ silent = false } = {}) => {
      if (saving || readOnly) {
        return preparationId || false;
      }

      const lectureId =
        normalizeId(form.lecture);

      if (!lectureId) {
        if (!silent) {
          toast.error(
            "اختر الحصة الدراسية أولًا"
          );
        }
        return false;
      }

      setSaving(true);

      try {
        let id = preparationId;
        const hadContentChanges =
          snapshot(form) !==
          savedSnapshotRef.current;

        if (!id) {
          id = await createDraftRecord({
            silent,
          });

          if (!id) {
            return false;
          }
        }

        let lastResponse = null;

        if (hadContentChanges) {
          const payload =
            makeChangedPayload(
              form,
              savedSnapshotRef.current
            );

          if (Object.keys(payload).length) {
            lastResponse =
              await editPreparation(
                payload,
                id
              );

            if (!lastResponse?.status) {
              if (!silent) {
                toast.error(
                  lastResponse?.message ||
                    "تعذر حفظ المسودة"
                );
              }
              return false;
            }
          }
        }

        if (attachment && id) {
          const uploadResponse =
            await addPreparationFiles(
              id,
              attachment
            );

          if (!uploadResponse?.status) {
            if (!silent) {
              toast.error(
                uploadResponse?.message ||
                  "تم حفظ المسودة لكن تعذر رفع المرفق"
              );
            }
            return false;
          }

          const uploadedFile =
            attachment;

          setAttachment(null);
          setExistingFiles(
            (current) => [
              ...current,
              {
                name:
                  uploadedFile.name,
                size:
                  uploadedFile.size,
              },
            ]
          );

          lastResponse =
            uploadResponse;
        }

        const savedEntity =
          extractEntity(
            lastResponse || {}
          );
        const responseStatus =
          Object.keys(savedEntity).length
            ? getStatus(savedEntity)
            : "draft";

        savedSnapshotRef.current =
          snapshot(form);
        lastSaveRef.current =
          new Date();
        setPreparationStatus(
          responseStatus
        );

        if (!silent) {
          toast.success(
            "تم حفظ المسودة"
          );
        }

        return id;
      } catch (error) {
        if (!silent) {
          toast.error(
            error?.response?.data?.message ||
              "تعذر حفظ المسودة"
          );
        }
        return false;
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    [
      attachment,
      createDraftRecord,
      form,
      preparationId,
      readOnly,
      saving,
    ]
  );

  useEffect(() => {
    saveDraftRef.current = saveDraft;
  }, [saveDraft]);

  useEffect(() => {
    if (!editable) return undefined;

    const timer = window.setInterval(() => {
      if (dirtyRef.current) {
        saveDraftRef.current?.({ silent: true });
      }
    }, AUTOSAVE_MS);

    return () => window.clearInterval(timer);
  }, [editable]);

  const changeStep = async (nextStep) => {
    if (nextStep === step) return;

    if (editable) {
      const saved = await saveDraft({ silent: Boolean(preparationId) });
      if (!saved) return;
    }

    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addObjective = () => updateForm({ objectives: [...form.objectives, ""] });
  const updateObjective = (index, value) => {
    const next = [...form.objectives];
    next[index] = value;
    updateForm({ objectives: next });
  };
  const deleteObjective = (index) => {
    const next = form.objectives.filter((_, rowIndex) => rowIndex !== index);
    updateForm({ objectives: next.length ? next : [""] });
  };

  const handleLessonSelection = (lessonIdValue) => {
    const nextLessonId =
      normalizeId(lessonIdValue);
    const selected =
      lessons.find(
        (item) =>
          normalizeId(item) ===
          nextLessonId
      );

    if (!selected) {
      updateForm({
        lessonId: "",
        lessonTitle: "",
      });
      setSuggestedObjectives(false);
      return;
    }

    const suggestions =
      normalizeObjectiveRows(
        selected?.objectives
      )
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean);
    const currentObjectives =
      form.objectives
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean);
    const changingLesson =
      Boolean(form.lessonId) &&
      normalizeId(form.lessonId) !==
        nextLessonId;

    let objectives =
      form.objectives;
    let usingSuggestions = false;

    if (
      currentObjectives.length === 0
    ) {
      objectives =
        suggestions.length
          ? suggestions
          : [""];
      usingSuggestions =
        suggestions.length > 0;
    } else if (changingLesson) {
      const replace =
        window.confirm(
          "تم تغيير الدرس. هل تريد استخدام الأهداف المقترحة للدرس الجديد؟\n\nاضغط إلغاء للاحتفاظ بالأهداف الحالية."
        );

      if (replace) {
        objectives =
          suggestions.length
            ? suggestions
            : [""];
        usingSuggestions =
          suggestions.length > 0;
      }
    }

    objectivePrefillLessonRef.current =
      nextLessonId;
    setSuggestedObjectives(
      usingSuggestions
    );
    updateForm({
      lessonId: nextLessonId,
      lessonTitle:
        getName(selected),
      objectives,
    });
  };

  const toggleLibraryItem = (id) => {
    const next = new Set(form.digitalContentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateForm({ digitalContentIds: Array.from(next) });
  };

  const saveLibraryItem = async () => {
    if (librarySaving) return;
    setLibrarySaving(true);
    const response = await addLibraryResource({
      ...libraryDraft,
      subjectId: subject.id,
      subjectOfferingId: subject.offeringId,
    });
    setLibrarySaving(false);
    if (!response?.status) {
      toast.error(response?.message || "تعذر إضافة المحتوى");
      return;
    }
    const created = extractEntity(response);
    const id = normalizeId(created);
    if (id) {
      setLibraryItems((current) => [created, ...current.filter((item) => normalizeId(item) !== id)]);
      updateForm({ digitalContentIds: Array.from(new Set([...form.digitalContentIds, id])) });
    }
    setLibraryDraft({ title: "", link: "", file: null });
    setLibraryDialog(false);
    toast.success("تمت إضافة المحتوى إلى مكتبة المدرسة");
  };

  const refreshResourceState = useCallback(
    async (idValue) => {
      const id = normalizeId(idValue);
      if (!id) return false;

      const response =
        await fetchSinglePreparation(id);

      if (!response?.status) {
        return false;
      }

      const entity =
        extractEntity(response);
      const grouped =
        groupResources(
          entity?.resources
        );

      setForm((current) => ({
        ...current,
        ...grouped,
      }));
      setPreparationStatus(
        getStatus(entity)
      );

      return entity;
    },
    []
  );

  const ensureDraftForResource = async () => {
    if (preparationId) {
      return preparationId;
    }

    const id =
      await createDraftRecord({
        silent: false,
      });

    return normalizeId(id);
  };

  const matchesPreparationContext = (item) => {
    const offeringId = normalizeId(
      item?.subjectOfferingId ||
        item?.subjectOffering ||
        item?.offeringId ||
        item?.offering
    );
    const classId =
      getLectureClassId(
        lecture || {}
      );
    const itemClassIds = (
      Array.isArray(item?.classIds)
        ? item.classIds
        : item?.classId
          ? [item.classId]
          : item?.class
            ? [item.class]
            : []
    )
      .map(normalizeId)
      .filter(Boolean);

    const offeringMatches =
      !subject.offeringId
        ? true
        : offeringId ===
          subject.offeringId;
    const classMatches =
      !classId
        ? true
        : itemClassIds.includes(
            classId
          );

    return (
      offeringMatches &&
      classMatches
    );
  };

  const openAssignment = async (groupKey) => {
    setAssignmentDialog(groupKey);
    setAssignmentEditIndex(null);
    setAssignmentDraft({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      totalGrade: "",
      link: "",
    });

    if (groupKey === "exams") {
      setExamLoading(true);

      const filters = {
        ...(subject.offeringId
          ? {
              subjectOfferingId:
                subject.offeringId,
            }
          : {}),
        ...(getLectureClassId(
          lecture || {}
        )
          ? {
              classIds:
                getLectureClassId(
                  lecture || {}
                ),
            }
          : {}),
      };

      const response =
        role === "TEACHER"
          ? await fetchTeacherExams(
              filters
            )
          : await fetchExams(
              filters
            );

      setExamOptions(
        response?.status
          ? extractList(
              response,
              ["exams"]
            ).filter(
              matchesPreparationContext
            )
          : []
      );
      setExamLoading(false);
    }

    if (groupKey === "activities") {
      setProjectLoading(true);

      const response =
        role === "TEACHER"
          ? await fetchTeacherProjects()
          : await fetchProjects();

      setProjectOptions(
        extractList(
          response,
          ["projects"]
        ).filter(
          matchesPreparationContext
        )
      );
      setProjectLoading(false);
    }
  };

  const addExistingExam = async (exam) => {
    if (resourceSaving) return;

    const id =
      await ensureDraftForResource();
    if (!id) return;

    setResourceSaving(true);

    const response =
      await addPreparationResource(
        id,
        {
          type: "quiz",
          examId:
            normalizeId(exam),
        }
      );

    setResourceSaving(false);

    if (!response?.status) {
      toast.error(
        response?.message ||
          "تعذر ربط الاختبار بالتحضير"
      );
      return;
    }

    await refreshResourceState(id);
    setAssignmentDialog(null);
    toast.success(
      "تمت إضافة الاختبار للتحضير"
    );
  };

  const addExistingProject = async (project) => {
    if (resourceSaving) return;

    const id =
      await ensureDraftForResource();
    if (!id) return;

    setResourceSaving(true);

    const response =
      await addPreparationResource(
        id,
        {
          type: "activity",
          projectId:
            normalizeId(project),
        }
      );

    setResourceSaving(false);

    if (!response?.status) {
      toast.error(
        response?.message ||
          "تعذر ربط النشاط بالتحضير"
      );
      return;
    }

    await refreshResourceState(id);
    setAssignmentDialog(null);
    toast.success(
      "تمت إضافة النشاط للتحضير"
    );
  };

  const editAssignment = (groupKey, index) => {
    const item =
      form[groupKey]?.[index];
    if (!item) return;

    setAssignmentDialog(groupKey);
    setAssignmentEditIndex(index);
    setAssignmentDraft({
      title: item.title || "",
      description:
        item.description || "",
      startDate:
        item.startDate || "",
      endDate:
        item.endDate || "",
      totalGrade:
        item.totalGrade ?? "",
      link: item.link || "",
    });
  };

  const addCustomAssignment = async () => {
    const group =
      ASSIGNMENT_GROUPS.find(
        (item) =>
          item.key ===
          assignmentDialog
      );

    if (!group || resourceSaving) {
      return;
    }

    const title =
      String(
        assignmentDraft.title || ""
      ).trim();

    if (!title) {
      toast.error(
        "اكتب عنوان التكليف"
      );
      return;
    }

    if (
      assignmentDraft.startDate &&
      assignmentDraft.endDate &&
      assignmentDraft.endDate <
        assignmentDraft.startDate
    ) {
      toast.error(
        "تاريخ النهاية يجب ألا يسبق البداية"
      );
      return;
    }

    const id =
      await ensureDraftForResource();
    if (!id) return;

    const payload = {
      type:
        RESOURCE_TYPE_BY_GROUP[
          group.key
        ],
      title,
      ...(String(
        assignmentDraft.description || ""
      ).trim()
        ? {
            description:
              String(
                assignmentDraft.description
              ).trim(),
          }
        : {}),
      ...(assignmentDraft.startDate
        ? {
            startAt:
              dateOnlyToIso(
                assignmentDraft.startDate
              ),
          }
        : {}),
      ...(assignmentDraft.endDate
        ? {
            dueAt:
              dateOnlyToIso(
                assignmentDraft.endDate,
                true
              ),
          }
        : {}),
      ...(String(
        assignmentDraft.totalGrade ?? ""
      ).trim() !== ""
        ? {
            totalGrade:
              Number(
                assignmentDraft.totalGrade
              ),
          }
        : {}),
      ...(String(
        assignmentDraft.link || ""
      ).trim()
        ? {
            link:
              String(
                assignmentDraft.link
              ).trim(),
          }
        : {}),
    };

    const oldItem =
      Number.isInteger(
        assignmentEditIndex
      )
        ? form[group.key]?.[
            assignmentEditIndex
          ]
        : null;

    setResourceSaving(true);

    const createResponse =
      await addPreparationResource(
        id,
        payload
      );

    if (!createResponse?.status) {
      setResourceSaving(false);
      toast.error(
        createResponse?.message ||
          "تعذر إضافة التكليف"
      );
      return;
    }

    if (oldItem?.resourceId) {
      const deleteResponse =
        await deletePreparationResource(
          id,
          oldItem.resourceId
        );

      if (!deleteResponse?.status) {
        setResourceSaving(false);
        await refreshResourceState(id);
        toast.warning(
          "تم إنشاء النسخة الجديدة، لكن تعذر حذف التكليف القديم"
        );
        setAssignmentDialog(null);
        setAssignmentEditIndex(null);
        return;
      }
    }

    setResourceSaving(false);
    await refreshResourceState(id);
    setAssignmentDialog(null);
    setAssignmentEditIndex(null);
    toast.success(
      oldItem
        ? "تم استبدال التكليف"
        : "تمت إضافة التكليف"
    );
  };

  const removeAssignment = async (
    groupKey,
    index
  ) => {
    const item =
      form[groupKey]?.[index];
    const resourceId =
      normalizeId(
        item?.resourceId ||
          item?._id
      );

    if (!resourceId) {
      return;
    }

    if (resourceSaving) return;

    setResourceSaving(true);

    const response =
      await deletePreparationResource(
        preparationId,
        resourceId
      );

    setResourceSaving(false);

    if (!response?.status) {
      toast.error(
        response?.message ||
          "تعذر حذف التكليف"
      );
      return;
    }

    await refreshResourceState(
      preparationId
    );
    toast.success(
      "تم حذف التكليف"
    );
  };

  const validateForSubmit = () => {
    const errors = [];
    if (!normalizeId(form.lessonId)) {
      errors.push({
        message: "اختر درسًا من المنهج",
        target: "lesson-section",
        step: 1,
      });
    }
    if (!form.objectives.some((item) => String(item || "").trim())) {
      errors.push({ message: "أضف هدفاً واحداً على الأقل", target: "objectives-section", step: 1 });
    }
    if (!form.digitalContentIds.length) {
      errors.push({ message: "اختر المحتوى الرقمي المرتبط بالدرس", target: "digital-content-section", step: 1 });
    }
    if (!assignmentCount(form)) {
      errors.push({ message: "أضف إثراء أو واجب أو اختبار أو نشاط", target: "assignments-section", step: 2 });
    }
    return errors;
  };

  const jumpToError = (error) => {
    setStep(error.step);
    window.setTimeout(() => {
      document.getElementById(error.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleSubmitForReview = async () => {
    const errors = validateForSubmit();
    setValidationErrors(errors);
    if (errors.length) {
      jumpToError(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      let id = preparationId;
      if (dirty || !id) {
        const savedId = await saveDraft({ silent: true });
        if (!savedId) return;
        id = normalizeId(savedId) || preparationId || id;
      }

      if (!id) {
        toast.error("تعذر تحديد المسودة بعد الحفظ");
        return;
      }

      const response = await submitPreparation(id);
      if (!response?.status) {
        toast.error(response?.message || "تعذر إرسال التحضير للمراجعة");
        return;
      }
      setPreparationId(id);
      setPreparationStatus("pending");
      savedSnapshotRef.current = snapshot(form);
      setValidationErrors([]);
      toast.success("تم إرسال التحضير للمراجعة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachment = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("حجم المرفق يجب ألا يتجاوز 20 ميجابايت");
      return;
    }
    setAttachment(file);
  };

  if (loading) return <Loading />;

  const Wrapper = ({ children }) =>
    teacherPortal ? (
      <Box sx={{ minHeight: "100dvh", bgcolor: "#fff", px: { xs: 1, md: 1.5 }, py: 1.2 }}>
        <Box sx={{ maxWidth: 1380, mx: "auto" }}>{children}</Box>
      </Box>
    ) : (
      <Container>{children}</Container>
    );

  const selectedLibraryItems = libraryItems.filter((item) => form.digitalContentIds.includes(normalizeId(item)));
  const filteredLibraryItems = libraryItems.filter((item) =>
    getName(item).toLowerCase().includes(librarySearch.trim().toLowerCase())
  );
  const statusMeta = STATUS_META[preparationStatus] || STATUS_META.draft;

  return (
    <Wrapper>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            mb: 1.1,
            px: { xs: 1.2, md: 1.6 },
            py: 1.15,
            borderRadius: "18px",
            color: "#fff",
            background: "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              <IconButton onClick={goBack} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>
                <ArrowBackRounded />
              </IconButton>
              <Box>
                <Typography sx={{ fontSize: { xs: 17, md: 20 }, fontWeight: 900 }}>
                  {mode === "create" ? "تحضير درس جديد" : mode === "view" ? "عرض التحضير" : "تعديل التحضير"}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,.72)", fontSize: 10.5 }}>
                  تحضير منظم خطوة بخطوة — يتم حفظ المسودة تلقائيًا كل 30 ثانية
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.7}>
              <Chip label={statusMeta.label} color={statusMeta.tone} size="small" sx={{ fontWeight: 900 }} />
              {saving && <Chip label="جاري الحفظ..." size="small" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#fff" }} />}
              {!saving && lastSaveRef.current && <Chip label="تم حفظ المسودة" size="small" icon={<CheckCircleRounded />} sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }} />}
            </Stack>
          </Stack>
        </Paper>

        {reviewNote && preparationStatus === "needs_revision" && (
          <Alert severity="warning" icon={<WarningAmberRounded />} sx={{ mb: 1.1, borderRadius: "14px", fontWeight: 800 }}>
            <strong>ملاحظة المراجع:</strong> {reviewNote}
          </Alert>
        )}

        <WizardSteps step={step} onStep={changeStep} stepTwoEnabled={Boolean(preparationId) || mode !== "create"} />

        <Stack spacing={1.15} mt={1.15}>
          <SectionCard
            id="lesson-section"
            title="الدرس"
            subtitle="المادة والصف من الحصة الدراسية، ويمكنك اختيار الوحدة والدرس فقط."
            icon={<MenuBookRounded />}
          >
            {canPickLecture && (
              <TextField
                select
                fullWidth
                size="small"
                label="الحصة الدراسية"
                value={form.lecture}
                onChange={(event) => {
                  setPreparationId("");
                  setPreparationStatus("draft");
                  updateForm({
                    ...EMPTY_FORM,
                    lecture: event.target.value,
                  });
                  setStep(1);
                }}
                sx={{ mb: 1.2 }}
              >
                {lectures.map((item) => (
                  <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                    {getLectureLabel(item)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {!form.lecture && (
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                اختر الحصة أولًا لعرض المنهج الخاص بالمادة والصف.
              </Alert>
            )}

            {form.lecture && (
              <Grid container spacing={1}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" label="المادة" value={subject.name} disabled />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="الوحدة"
                    value={form.unitId}
                    disabled={!editable || curriculumLoading || !units.length}
                    onChange={(event) => {
                      objectivePrefillLessonRef.current = "";
                      setSuggestedObjectives(false);
                      updateForm({ unitId: event.target.value, lessonId: "", lessonTitle: "" });
                    }}
                  >
                    {units.map((item) => (
                      <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                        {getName(item)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="الدرس"
                    value={form.lessonId}
                    disabled={!editable || curriculumLoading || !form.unitId || !lessons.length}
                    onChange={(event) =>
                      handleLessonSelection(
                        event.target.value
                      )
                    }
                  >
                    {lessons.map((item) => (
                      <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                        {getName(item)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>
                    الصف: <strong>{grade.name}</strong>
                  </Typography>
                </Grid>
              </Grid>
            )}

            {curriculumMessage && (
              <Alert severity={units.length ? "info" : "warning"} sx={{ mt: 1, borderRadius: "12px" }}>
                {curriculumMessage}
              </Alert>
            )}
          </SectionCard>

          {step === 1 ? (
            <>
              <SectionCard
                title="المعلومات الأساسية"
                subtitle="اكتب ما سيبدأ به الطالب وما يحتاج معرفته قبل الشرح."
                icon={<AutoStoriesRounded />}
              >
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={6}>
                    <FieldLabel studentVisible>التهيئة</FieldLabel>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      disabled={!editable}
                      value={form.warmup}
                      onChange={(event) => updateForm({ warmup: event.target.value })}
                      placeholder="أهلاً بكم في درسنا اليوم..."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FieldLabel studentVisible>مفردات الدرس</FieldLabel>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      disabled={!editable}
                      value={form.vocabulary}
                      onChange={(event) => updateForm({ vocabulary: event.target.value })}
                      placeholder="المفاهيم والمصطلحات التي يقدمها الدرس"
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard
                id="objectives-section"
                title={form.lessonTitle || "أهداف الدرس"}
                subtitle="الأهداف التي سيكتسبها الطالب في الدرس"
                icon={<EditNoteRounded />}
              >
                <FieldLabel studentVisible required>الأهداف التي سيكتسبها الطالب في الدرس</FieldLabel>
                {suggestedObjectives && (
                  <Alert severity="info" sx={{ mb: 1, borderRadius: "12px", fontSize: 11 }}>
                    مقترحة من تحضير سابق لنفس الدرس — عدّلي أو احذفي بحرية
                  </Alert>
                )}
                <Stack spacing={0.75}>
                  {form.objectives.map((objective, index) => (
                    <Stack direction="row" alignItems="center" gap={0.6} key={`objective-${index}`}>
                      <TextField
                        fullWidth
                        size="small"
                        disabled={!editable}
                        value={objective}
                        onChange={(event) => updateObjective(index, event.target.value)}
                        placeholder={`الهدف ${index + 1}`}
                      />
                      {editable && (
                        <IconButton onClick={() => deleteObjective(index)} sx={{ color: "var(--color-danger)" }}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                  {editable && (
                    <Button type="button" startIcon={<AddRounded />} onClick={addObjective} sx={{ alignSelf: "flex-start", fontWeight: 900, textTransform: "none" }}>
                      إضافة هدف
                    </Button>
                  )}
                </Stack>
              </SectionCard>

              <SectionCard
                id="digital-content-section"
                title="المحتوى الرقمي المرتبط بالدرس"
                subtitle="اختر من مكتبة المدرسة، أو أضف رابطًا أو ملفًا دون مغادرة التحضير."
                icon={<LinkRounded />}
              >
                <FieldLabel studentVisible required>المحتوى الرقمي المرتبط بالدرس</FieldLabel>
                <Stack direction={{ xs: "column", sm: "row" }} gap={0.8} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="ابحث في مكتبة المادة"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
                      ),
                    }}
                  />
                  {editable && (
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<AddRounded />}
                      onClick={() => setLibraryDialog(true)}
                      sx={{ whiteSpace: "nowrap", fontWeight: 900, textTransform: "none" }}
                    >
                      أضف رابط أو ملف
                    </Button>
                  )}
                </Stack>

                {selectedLibraryItems.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.6} mb={1}>
                    {selectedLibraryItems.map((item) => {
                      const id = normalizeId(item);
                      return (
                        <Chip
                          key={id}
                          label={getName(item, "محتوى")}
                          onDelete={editable ? () => toggleLibraryItem(id) : undefined}
                          sx={{ fontWeight: 800 }}
                        />
                      );
                    })}
                  </Stack>
                )}

                {libraryLoading ? (
                  <CircularProgress size={24} />
                ) : filteredLibraryItems.length ? (
                  <Stack spacing={0.6} sx={{ maxHeight: 260, overflowY: "auto" }}>
                    {filteredLibraryItems.map((item) => {
                      const id = normalizeId(item);
                      const selected = form.digitalContentIds.includes(id);
                      return (
                        <Paper key={id} variant="outlined" sx={{ p: 0.8, borderRadius: "12px" }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ color: "var(--color-navy-deep)", fontWeight: 850, fontSize: 11.5 }}>
                                {getName(item, "محتوى رقمي")}
                              </Typography>
                              <Typography noWrap sx={{ color: "var(--color-muted)", fontSize: 9.5 }}>
                                {item?.link || item?.url || item?.fileName || item?.filename || "عنصر من مكتبة المدرسة"}
                              </Typography>
                            </Box>
                            <Button
                              type="button"
                              disabled={!editable}
                              onClick={() => toggleLibraryItem(id)}
                              variant={selected ? "contained" : "outlined"}
                              size="small"
                              sx={{ minWidth: 38, fontWeight: 900 }}
                            >
                              {selected ? "−" : "+"}
                            </Button>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: "12px" }}>
                    لا يوجد محتوى في مكتبة هذه المادة بعد. يمكنك إضافة أول رابط أو ملف من هنا.
                  </Alert>
                )}
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard
                title="طرق تنفيذ الدرس"
                subtitle="هذه الخيارات تظهر للمعلم والمشرف فقط."
                icon={<AutoStoriesRounded />}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <FieldLabel>استراتيجيات التدريس</FieldLabel>
                    <ChoiceChecklist
                      options={referenceLists.strategies}
                      values={form.teachingStrategies}
                      disabled={!editable}
                      onChange={(value) => updateForm({ teachingStrategies: value })}
                      otherValue={form.otherTeachingStrategy}
                      onOtherChange={(value) => updateForm({ otherTeachingStrategy: value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FieldLabel>الوسائل التعليمية المستخدمة</FieldLabel>
                    <ChoiceChecklist
                      options={referenceLists.aids}
                      values={form.educationalAids}
                      disabled={!editable}
                      onChange={(value) => updateForm({ educationalAids: value })}
                      otherValue={form.otherEducationalAid}
                      onOtherChange={(value) => updateForm({ otherEducationalAid: value })}
                    />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard title="إكمال الدرس" icon={<CheckCircleRounded />}>
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={6}>
                    <FieldLabel studentVisible>مهارات التفكير</FieldLabel>
                    <TextField fullWidth multiline minRows={4} disabled={!editable} value={form.thinkingSkills} onChange={(event) => updateForm({ thinkingSkills: event.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FieldLabel studentVisible>إغلاق الدرس</FieldLabel>
                    <TextField fullWidth multiline minRows={4} disabled={!editable} value={form.lessonClosing} onChange={(event) => updateForm({ lessonClosing: event.target.value })} />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard
                id="assignments-section"
                title="تكليفات الحصة"
                subtitle="يجب إضافة نوع واحد على الأقل قبل الإرسال للمراجعة."
                icon={<MenuBookRounded />}
              >
                <Alert severity="info" sx={{ mb: 1.2, borderRadius: "12px", fontWeight: 900 }}>
                  يتعين عليك إضافة إثراء أو واجب أو اختبار أو نشاط واحد على الأقل *
                </Alert>
                <Grid container spacing={1}>
                  {ASSIGNMENT_GROUPS.map((group) => (
                    <Grid item xs={12} md={6} key={group.key}>
                      <Paper variant="outlined" sx={{ p: 1, borderRadius: "14px", height: "100%" }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
                          <Stack direction="row" alignItems="center" gap={0.6}>
                            <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 12 }}>
                              {group.label}
                            </Typography>
                            <StudentBadge />
                          </Stack>
                          {editable && (
                            <Button size="small" startIcon={<AddRounded />} onClick={() => openAssignment(group.key)} sx={{ fontWeight: 900, textTransform: "none" }}>
                              إضافة
                            </Button>
                          )}
                        </Stack>
                        <Stack spacing={0.55}>
                          {form[group.key].length ? (
                            form[group.key].map((item, index) => (
                              <AssignmentCard
                                key={`${group.key}-${item.id || index}`}
                                item={item}
                                group={group}
                                readOnly={!editable}
                                onRemove={() => removeAssignment(group.key, index)}
                                onEdit={() => {
                                  if (item.examId) {
                                    navigateAway(
                                      role === "TEACHER"
                                        ? `/teacher/exams/edit/${item.examId}`
                                        : `/school/exams/edit/${item.examId}`
                                    );
                                    return;
                                  }

                                  if (item.projectId) {
                                    navigateAway(
                                      role === "TEACHER"
                                        ? `/teacher/projects`
                                        : `/school/projects/edit/${item.projectId}`
                                    );
                                    return;
                                  }

                                  editAssignment(group.key, index);
                                }}
                                onAnswers={
                                  item.examId
                                    ? () =>
                                        navigateAway(
                                          role === "TEACHER"
                                            ? `/teacher/grading/exams?examId=${item.examId}`
                                            : `/school/exams/${item.examId}`
                                        )
                                    : undefined
                                }
                              />
                            ))
                          ) : (
                            <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5, py: 1 }}>
                              لا توجد عناصر مضافة
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>

              <SectionCard title="تعليمات المعلم" icon={<EditNoteRounded />}>
                <FieldLabel studentVisible>تعليمات المعلم</FieldLabel>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  disabled={!editable}
                  value={form.teacherInstructions}
                  onChange={(event) => updateForm({ teacherInstructions: event.target.value })}
                />
              </SectionCard>

              <SectionCard
                title="مرفقات (اختياري)"
                subtitle="ورقة عمل أو عرض أو ملف مساند. المرفق لا يُحتسب ضمن شروط إرسال التحضير."
                icon={<AttachFileRounded />}
              >
                {existingFiles.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.55} mb={1}>
                    {existingFiles.map((file, index) => (
                      <Chip
                        key={`${getAttachmentLabel(file, index)}-${index}`}
                        size="small"
                        icon={<AttachFileRounded />}
                        label={getAttachmentLabel(file, index)}
                        sx={{ maxWidth: 280, fontWeight: 800 }}
                      />
                    ))}
                  </Stack>
                )}

                {editable ? (
                  <Button component="label" variant="outlined" startIcon={<CloudUploadRounded />} sx={{ fontWeight: 900, textTransform: "none" }}>
                    {attachment ? attachment.name : "اختيار مرفق"}
                    <input hidden type="file" onChange={handleAttachment} />
                  </Button>
                ) : (
                  <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>
                    {existingFiles.length
                      ? "هذه المرفقات مواد مساندة ولا تدخل ضمن شروط الإرسال."
                      : "لا توجد مرفقات مساندة لهذا التحضير."}
                  </Typography>
                )}
              </SectionCard>
            </>
          )}

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ borderRadius: "14px" }}>
              <Typography sx={{ fontWeight: 900, mb: 0.5 }}>لا يمكن الإرسال:</Typography>
              <Stack spacing={0.35}>
                {validationErrors.map((error) => (
                  <Button
                    key={error.target}
                    type="button"
                    onClick={() => jumpToError(error)}
                    sx={{ justifyContent: "flex-start", color: "inherit", fontWeight: 800, textTransform: "none", p: 0 }}
                  >
                    • {error.message} ← اذهب
                  </Button>
                ))}
              </Stack>
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 1.1,
              border: "1px solid rgba(36,74,112,.09)",
              borderRadius: "16px",
              bgcolor: "var(--color-cream)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.8}>
              <Stack direction={{ xs: "column", sm: "row" }} gap={0.7}>
                {editable && (
                  <Button
                    variant="outlined"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveRounded />}
                    disabled={saving || submitting || !form.lecture}
                    onClick={() => saveDraft()}
                    sx={{ fontWeight: 900, textTransform: "none" }}
                  >
                    حفظ كمسودة
                  </Button>
                )}
                {editable && step === 2 && (
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendRounded />}
                    disabled={saving || submitting || resourceSaving || !form.lecture}
                    onClick={handleSubmitForReview}
                    sx={{ fontWeight: 900, textTransform: "none", bgcolor: "var(--color-navy)" }}
                  >
                    إرسال للمراجعة
                  </Button>
                )}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} gap={0.7}>
                {step === 2 && (
                  <Button variant="text" onClick={() => changeStep(1)} sx={{ fontWeight: 900, textTransform: "none" }}>
                    السابق
                  </Button>
                )}
                {step === 1 && editable && (
                  <Button variant="contained" onClick={() => changeStep(2)} sx={{ fontWeight: 900, textTransform: "none", bgcolor: "var(--color-gold-dark)" }}>
                    حفظ ومتابعة
                  </Button>
                )}
                <Button variant="text" startIcon={<CloseRounded />} onClick={goBack} sx={{ fontWeight: 900, textTransform: "none", color: "var(--color-muted)" }}>
                  {readOnly ? "عودة" : "إغلاق"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Dialog open={libraryDialog} onClose={() => !librarySaving && setLibraryDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900 }}>أضف رابط أو ملف إلى مكتبة المدرسة</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.1}>
              <TextField fullWidth size="small" label="العنوان" value={libraryDraft.title} onChange={(event) => setLibraryDraft((current) => ({ ...current, title: event.target.value }))} />
              <TextField fullWidth size="small" label="الرابط" value={libraryDraft.link} disabled={Boolean(libraryDraft.file)} onChange={(event) => setLibraryDraft((current) => ({ ...current, link: event.target.value }))} placeholder="https://..." />
              <Divider>أو</Divider>
              <Button component="label" variant="outlined" startIcon={<CloudUploadRounded />} sx={{ fontWeight: 900, textTransform: "none" }}>
                {libraryDraft.file ? libraryDraft.file.name : "اختيار ملف"}
                <input hidden type="file" onChange={(event) => setLibraryDraft((current) => ({ ...current, file: event.target.files?.[0] || null, link: "" }))} />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={librarySaving} onClick={() => setLibraryDialog(false)}>إلغاء</Button>
            <Button variant="contained" disabled={librarySaving} onClick={saveLibraryItem} startIcon={librarySaving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />}>
              حفظ وإضافة للتحضير
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(assignmentDialog)}
          onClose={() => {
            if (resourceSaving) return;
            setAssignmentDialog(null);
            setAssignmentEditIndex(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            {Number.isInteger(assignmentEditIndex) ? "تعديل" : "إضافة"}{" "}
            {ASSIGNMENT_GROUPS.find((item) => item.key === assignmentDialog)?.singular || "تكليف"}
          </DialogTitle>
          <DialogContent dividers>
            {assignmentDialog === "exams" && (
              <Box mb={1.5}>
                <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 12, mb: 0.7 }}>
                  اختبارات موجودة بالفعل
                </Typography>
                {examLoading ? (
                  <CircularProgress size={22} />
                ) : examOptions.length ? (
                  <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto" }}>
                    {examOptions.map((exam) => (
                      <Paper key={normalizeId(exam)} variant="outlined" sx={{ p: 0.8, borderRadius: "11px" }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 900 }}>{getName(exam, exam?.examTitle || "اختبار")}</Typography>
                            <Typography sx={{ fontSize: 9.5, color: "var(--color-muted)" }}>{exam?.examType || "اختبار"}</Typography>
                          </Box>
                          <Button size="small" disabled={resourceSaving} onClick={() => addExistingExam(exam)}>استخدام</Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>لا توجد اختبارات سابقة لهذه المادة.</Typography>
                )}
                <Button
                  size="small"
                  startIcon={<AddRounded />}
                  onClick={() => navigateAway(role === "TEACHER" ? "/teacher/exams/add" : "/school/exams/add")}
                  sx={{ mt: 0.7, fontWeight: 900, textTransform: "none" }}
                >
                  إنشاء اختبار جديد
                </Button>
                <Divider sx={{ my: 1.2 }}>أو أضف وصفًا سريعًا</Divider>
              </Box>
            )}
            {assignmentDialog === "activities" && (
              <Box mb={1.5}>
                <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900, fontSize: 12, mb: 0.7 }}>
                  مشروعات موجودة بالفعل
                </Typography>
                {projectLoading ? (
                  <CircularProgress size={22} />
                ) : projectOptions.length ? (
                  <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: "auto" }}>
                    {projectOptions.map((project) => (
                      <Paper key={normalizeId(project)} variant="outlined" sx={{ p: 0.8, borderRadius: "11px" }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 900 }}>
                              {getName(project, "نشاط / مشروع")}
                            </Typography>
                            <Typography sx={{ fontSize: 9.5, color: "var(--color-muted)" }}>
                              نشاط موجود لنفس الحصة والمادة
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            disabled={resourceSaving}
                            onClick={() => addExistingProject(project)}
                          >
                            استخدام
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>
                    لا توجد مشروعات مناسبة لهذه الحصة.
                  </Typography>
                )}
                <Button
                  size="small"
                  startIcon={<AddRounded />}
                  onClick={() => navigateAway(role === "TEACHER" ? "/teacher/projects" : "/school/projects/add")}
                  sx={{ mt: 0.7, fontWeight: 900, textTransform: "none" }}
                >
                  إنشاء مشروع جديد
                </Button>
                <Divider sx={{ my: 1.2 }}>أو أضف نشاطًا سريعًا</Divider>
              </Box>
            )}
            <Stack spacing={1}>
              <TextField fullWidth size="small" label="العنوان" value={assignmentDraft.title} onChange={(event) => setAssignmentDraft((current) => ({ ...current, title: event.target.value }))} />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="الوصف (اختياري)"
                value={assignmentDraft.description}
                onChange={(event) => setAssignmentDraft((current) => ({ ...current, description: event.target.value }))}
              />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="date" label="البداية" InputLabelProps={{ shrink: true }} value={assignmentDraft.startDate} onChange={(event) => setAssignmentDraft((current) => ({ ...current, startDate: event.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="date" label="النهاية" InputLabelProps={{ shrink: true }} value={assignmentDraft.endDate} onChange={(event) => setAssignmentDraft((current) => ({ ...current, endDate: event.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="الدرجة (اختياري)"
                    inputProps={{ min: 0 }}
                    value={assignmentDraft.totalGrade}
                    onChange={(event) => setAssignmentDraft((current) => ({ ...current, totalGrade: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="رابط (اختياري)"
                    placeholder="https://..."
                    value={assignmentDraft.link}
                    onChange={(event) => setAssignmentDraft((current) => ({ ...current, link: event.target.value }))}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={resourceSaving}
              onClick={() => {
                setAssignmentDialog(null);
                setAssignmentEditIndex(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              disabled={resourceSaving}
              onClick={addCustomAssignment}
              startIcon={resourceSaving ? <CircularProgress size={15} color="inherit" /> : <AddRounded />}
            >
              {Number.isInteger(assignmentEditIndex) ? "حفظ" : "إضافة"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Wrapper>
  );
};

export default StructuredPreparationForm;
