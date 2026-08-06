import {
  ArrowBackRounded,
  CloseRounded,
  EditRounded,
  EmailOutlined,
  GroupsRounded,
  LibraryBooksRounded,
  LocalPhoneOutlined,
  LockResetRounded,
  MenuBookRounded,
  PersonRounded,
  RefreshRounded,
  SaveRounded,
  ScheduleRounded,
  SubjectRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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

import { fetchLectures } from "@/APIs/school/lectures";
import { fetchMyClasses } from "@/APIs/school/classes";
import { fetchMyTeacherSubjects } from "@/APIs/school/subjects";
import { fetchMyTeacherProfile } from "@/APIs/users/teachers";
import { TEACHER_UI } from "@/shared/ui/teacherUi";
import nasaqLogo from "@/images/wadq-logo.png";

const PROFILE_STORAGE_KEY = "nasaq_teacher_profile_draft";

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
};

const emptyProfileForm = {
  name: "",
  email: "",
  phoneNumber: "",
  qualification: "",
  specialization: "",
  experience: "",
  address: "",
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

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

const extractCollection = (response, keys = []) => {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.docs,
    payload.items,
    payload.results,
    payload.records,
    payload.classes,
    payload.subjects,
    payload.lectures,
    payload.data,
    ...keys.map((key) => payload?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const collectObjects = (source) => {
  const result = [];
  const queue = [source];
  const visited = new Set();
  const nestedKeys = [
    "user",
    "teacher",
    "profile",
    "account",
    "data",
    "result",
    "payload",
    "authState",
  ];

  while (queue.length && result.length < 20) {
    const current = queue.shift();

    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      visited.has(current)
    ) {
      continue;
    }

    visited.add(current);
    result.push(current);

    nestedKeys.forEach((key) => {
      const child = current?.[key];
      if (child && typeof child === "object" && !Array.isArray(child)) {
        queue.push(child);
      }
    });
  }

  return result;
};

const getText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      if (normalized) return normalized;
      continue;
    }

    if (typeof value === "object") {
      const normalized = String(
        value.name ||
          value.title ||
          value.label ||
          value.email ||
          ""
      ).trim();

      if (normalized) return normalized;
    }
  }

  return "";
};

const getSafeText = (...values) => {
  const value = getText(...values);

  if (!value || /^[a-f\d]{24}$/i.test(value)) {
    return "";
  }

  return value;
};

const getFirstFromObjects = (objects, keys) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];
      const normalized = getText(value);
      if (normalized) return normalized;
    }
  }

  return "";
};

const GENERIC_TEACHER_NAMES = new Set([
  "المعلم",
  "معلم",
  "حساب المعلم",
  "teacher",
  "teacher account",
]);

const isGenericTeacherName = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || GENERIC_TEACHER_NAMES.has(normalized);
};

const getDisplayName = (...sources) => {
  const objects = sources.flatMap(collectObjects);
  const nameKeys = [
    "name",
    "fullName",
    "teacherName",
    "displayName",
    "username",
    "employeeName",
  ];

  for (const object of objects) {
    for (const key of nameKeys) {
      const candidate = getText(object?.[key]);
      if (!isGenericTeacherName(candidate)) return candidate;
    }
  }

  for (const source of objects) {
    const combined = [
      source?.firstName,
      source?.fatherName,
      source?.familyName || source?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!isGenericTeacherName(combined)) return combined;
  }

  const email = getFirstFromObjects(objects, ["email"]);
  if (email) {
    const prefix = email.split("@")[0]?.trim();
    if (!isGenericTeacherName(prefix)) return prefix;
  }

  return "";
};

const extractTeacherProfile = (response, authState) => {
  const payload = unwrapResponse(response);
  const authObjects = collectObjects(authState);
  const authUser = authObjects.find((item) => item?.email || item?.role) || {};

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ...authUser,
      user: authUser,
    };
  }

  const teacher =
    payload.teacher ||
    payload.profile ||
    payload.item ||
    payload;
  const user =
    payload.user ||
    teacher?.user ||
    authUser;

  return {
    ...user,
    ...teacher,
    user,
  };
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getTeacherId = (profile, authState) => {
  const objects = collectObjects({ profile, authState });
  const candidates = [];

  objects.forEach((object) => {
    candidates.push(
      object?._id,
      object?.id,
      object?.teacherId,
      object?.teacher
    );
  });

  return candidates.map(normalizeId).find(Boolean) || "";
};

const getEntityLabel = (entity, fallback) =>
  getText(
    entity?.name,
    entity?.subjectName,
    entity?.className,
    entity?.gradeLevelId,
    entity?.gradeLevel,
    entity?.roomNumber
  ) || fallback;

const readLocalDraft = () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const uniqueByLabel = (items, prefix) => {
  const map = new Map();

  items.forEach((item, index) => {
    const id = normalizeId(item);
    const label = getEntityLabel(item, `${prefix} ${index + 1}`);
    const key = id || label;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return [...map.values()];
};

const StatCard = ({ title, value, helper, icon, tone = "blue" }) => {
  const tones = {
    blue: { color: COLORS.navy, bg: COLORS.navySoft },
    gold: { color: COLORS.gold, bg: COLORS.goldSoft },
    green: { color: COLORS.green, bg: COLORS.greenSoft },
  };
  const selected = tones[tone] || tones.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        minHeight: 68,
        px: 1.35,
        py: 0.95,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: COLORS.muted, fontSize: 9.3, fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography
          sx={{
            color: COLORS.navyDark,
            fontSize: 19,
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>
        <Typography noWrap sx={{ color: "#a0aab5", fontSize: 8.1, mt: 0.18 }}>
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

const CompactDialogTitle = ({ title, subtitle, onClose, icon }) => (
  <DialogTitle sx={{ px: 2.2, pt: 2.1, pb: 1.2 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 38,
            height: 38,
            display: "grid",
            placeItems: "center",
            borderRadius: 1.8,
            color: COLORS.gold,
            bgcolor: COLORS.goldSoft,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ color: COLORS.navyDark, fontSize: 15, fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography sx={{ color: COLORS.muted, fontSize: 9, mt: 0.15 }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>

      <IconButton onClick={onClose} size="small">
        <CloseRounded fontSize="small" />
      </IconButton>
    </Stack>
  </DialogTitle>
);

const PasswordField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  visible,
  onToggleVisibility,
  autoComplete,
}) => (
  <Box>
    <Typography
      sx={{
        mb: 0.65,
        color: COLORS.navyDark,
        fontSize: 10.5,
        fontWeight: 900,
      }}
    >
      {label}
    </Typography>
    <TextField
      fullWidth
      placeholder="••••••••"
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={helperText || " "}
      autoComplete={autoComplete}
      inputProps={{ dir: "ltr" }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              edge="end"
              onClick={onToggleVisibility}
              aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              sx={{ color: COLORS.muted }}
            >
              {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          minHeight: 48,
          borderRadius: 2.2,
          bgcolor: "#fff",
          transition: "0.2s ease",
          "&:hover": { bgcolor: "#fbfcfd" },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(23, 63, 101, 0.08)",
          },
        },
        "& .MuiOutlinedInput-input": {
          py: 1.25,
          fontSize: 13,
          letterSpacing: visible ? 0 : 1.2,
        },
        "& .MuiFormHelperText-root": {
          mx: 0.25,
          mt: 0.45,
          minHeight: 16,
          fontSize: 9,
          fontWeight: 700,
        },
      }}
    />
  </Box>
);

const ProfileSkeleton = () => (
  <Box sx={{ ...TEACHER_UI.page }}>
    <Box sx={{ ...TEACHER_UI.container }}>
      <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />
      <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} sm={4} key={item}>
            <Skeleton variant="rounded" height={76} sx={{ borderRadius: 2.4 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2.5 }} />
        </Grid>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2.5 }} />
        </Grid>
      </Grid>
    </Box>
  </Box>
);

const TeacherProfile = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};

  const [profile, setProfile] = useState(null);
  const [localDraft, setLocalDraft] = useState(() => readLocalDraft());
  const [lectures, setLectures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const loadProfile = useCallback(
    async ({ silent = false } = {}) => {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      const sessionProfile = extractTeacherProfile(null, authState);
      setProfile(sessionProfile);

      try {
        const profileResult = await Promise.allSettled([
          fetchMyTeacherProfile(),
        ]);

        const profileResponse =
          profileResult[0]?.status === "fulfilled"
            ? profileResult[0].value
            : null;

        const nextProfile = isFailedResponse(profileResponse)
          ? sessionProfile
          : extractTeacherProfile(profileResponse, authState);

        setProfile(nextProfile);

        const teacherId = getTeacherId(nextProfile, authState);
        const [classesResult, subjectsResult, lecturesResult] =
          await Promise.allSettled([
            fetchMyClasses(),
            fetchMyTeacherSubjects(),
            fetchLectures({
              ...(teacherId ? { teacherId } : {}),
              page: 1,
              limit: 500,
            }),
          ]);

        const classesResponse =
          classesResult.status === "fulfilled" ? classesResult.value : null;
        const subjectsResponse =
          subjectsResult.status === "fulfilled" ? subjectsResult.value : null;
        const lecturesResponse =
          lecturesResult.status === "fulfilled" ? lecturesResult.value : null;

        const lectureList = isFailedResponse(lecturesResponse)
          ? []
          : extractCollection(lecturesResponse, ["lectures"]);
        const classList = isFailedResponse(classesResponse)
          ? []
          : extractCollection(classesResponse, ["classes"]);
        const subjectList = isFailedResponse(subjectsResponse)
          ? []
          : extractCollection(subjectsResponse, ["subjects"]);

        const lectureClasses = lectureList
          .map(
            (lecture) =>
              lecture?.classId ||
              lecture?.class ||
              lecture?.schoolClass ||
              lecture?.classroom ||
              null
          )
          .filter(Boolean);

        const lectureSubjects = lectureList
          .map((lecture) => {
            const offering =
              lecture?.subjectOfferingId ||
              lecture?.subjectOffering ||
              lecture?.offering ||
              null;

            return (
              offering?.subjectId ||
              offering?.subject ||
              lecture?.subjectId ||
              lecture?.subject ||
              null
            );
          })
          .filter(Boolean);

        setClasses(classList.length ? classList : lectureClasses);
        setSubjects(subjectList.length ? subjectList : lectureSubjects);
        setLectures(lectureList);
      } catch {
        setError("تعذر تحديث بعض بيانات الحساب، وتم عرض البيانات المتاحة.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authState]
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const mergedProfile = useMemo(
    () => ({
      ...extractTeacherProfile(null, authState),
      ...(profile || {}),
      ...(localDraft || {}),
      user: {
        ...(extractTeacherProfile(null, authState)?.user || {}),
        ...(profile?.user || {}),
        ...(localDraft || {}),
      },
    }),
    [authState, profile, localDraft]
  );

  const lectureTeacher = useMemo(
    () =>
      lectures
        .map(
          (lecture) =>
            lecture?.teacher ||
            lecture?.teacherId ||
            lecture?.teacherAssignment?.teacher ||
            lecture?.teacherAssignment?.teacherId ||
            null
        )
        .find((teacher) => Boolean(getDisplayName(teacher))),
    [lectures]
  );

  const classTeacher = useMemo(
    () =>
      classes
        .map(
          (schoolClass) =>
            schoolClass?.teacherInCharge ||
            schoolClass?.teacherInChargeId ||
            schoolClass?.teacher ||
            null
        )
        .find((teacher) => Boolean(getDisplayName(teacher))),
    [classes]
  );

  const displayName =
    getDisplayName(
      localDraft,
      mergedProfile,
      authState,
      lectureTeacher,
      classTeacher
    ) || "حساب المعلم";

  const avatarInitials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("") || "ح";

  const email = getSafeText(
    localDraft?.email,
    mergedProfile?.email,
    mergedProfile?.user?.email,
    ...collectObjects(authState).map((item) => item?.email)
  );
  const phone = getSafeText(
    localDraft?.phoneNumber,
    mergedProfile?.phoneNumber,
    mergedProfile?.phone,
    mergedProfile?.mobileNumber,
    mergedProfile?.user?.phoneNumber,
    mergedProfile?.user?.phone
  );
  const specialization = getSafeText(
    localDraft?.specialization,
    mergedProfile?.specialization,
    mergedProfile?.department,
    mergedProfile?.jobTitle
  );
  const isActive = !(
    mergedProfile?.isActive === false ||
    String(mergedProfile?.status || "").toLowerCase() === "inactive"
  );

  const uniqueClasses = useMemo(
    () => uniqueByLabel(classes, "فصل"),
    [classes]
  );
  const uniqueSubjects = useMemo(
    () => uniqueByLabel(subjects, "مادة"),
    [subjects]
  );

  const openProfileDialog = () => {
    setProfileErrors({});
    setProfileForm({
      name: displayName === "حساب المعلم" ? "" : displayName,
      email,
      phoneNumber: phone,
      qualification: getSafeText(
        localDraft?.qualification,
        mergedProfile?.qualification
      ),
      specialization,
      experience: getSafeText(
        localDraft?.experience,
        mergedProfile?.experience
      ),
      address: getSafeText(localDraft?.address, mergedProfile?.address),
    });
    setProfileDialogOpen(true);
  };

  const handleProfileField = (field) => (event) => {
    const value = event.target.value;
    setProfileForm((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => ({ ...current, [field]: "" }));
  };

  const saveProfileDraft = () => {
    const errors = {};
    const name = profileForm.name.trim();
    const phoneNumber = profileForm.phoneNumber.trim();

    if (name.length < 2) {
      errors.name = "اكتب اسم المعلم كاملًا";
    }

    if (phoneNumber && !/^[+\d][\d\s-]{6,19}$/.test(phoneNumber)) {
      errors.phoneNumber = "رقم الهاتف غير صحيح";
    }

    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }

    const nextDraft = {
      name,
      email: profileForm.email.trim(),
      phoneNumber,
      qualification: profileForm.qualification.trim(),
      specialization: profileForm.specialization.trim(),
      experience: profileForm.experience.trim(),
      address: profileForm.address.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextDraft));
    setLocalDraft(nextDraft);
    setProfile((current) => ({
      ...(current || {}),
      ...nextDraft,
      user: {
        ...(current?.user || {}),
        name: nextDraft.name,
        email: nextDraft.email,
        phoneNumber: nextDraft.phoneNumber,
      },
    }));
    setProfileDialogOpen(false);
    toast.success("تم حفظ التعديلات محليًا للمعاينة");
  };

  const openPasswordDialog = () => {
    setPasswordErrors({});
    setPasswordForm(emptyPasswordForm);
    setShowPasswords({ current: false, next: false, confirm: false });
    setPasswordDialogOpen(true);
  };

  const handlePasswordField = (field) => (event) => {
    const value = event.target.value;
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: "" }));
  };

  const submitPasswordPreview = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "أدخل كلمة المرور الحالية";
    }

    if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "كلمة المرور الجديدة 6 أحرف على الأقل";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "تأكيد كلمة المرور غير مطابق";
    }

    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setPasswordDialogOpen(false);
    toast.info("واجهة تغيير كلمة المرور جاهزة وتنتظر ربط مسار الباك");
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <Box sx={{ ...TEACHER_UI.page, minHeight: "100vh", bgcolor: "#fff" }}>
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            bgcolor: COLORS.navy,
            background: "linear-gradient(115deg, #173f65 0%, #2e638e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 170,
              height: 170,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
              left: -65,
              top: -95,
            }}
          />

          <Stack direction="row" alignItems="center" gap={1.1} sx={{ zIndex: 1 }}>
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                width: 52,
                height: 52,
                objectFit: "contain",
                bgcolor: "#fff",
                borderRadius: 2,
                p: 0.35,
              }}
            />
            <Box>
              <Typography sx={{ fontSize: { xs: 22, md: 27 }, fontWeight: 900, lineHeight: 1.15 }}>
                حسابي
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,.72)", fontSize: 9.5, mt: 0.25 }}>
                بيانات حسابك الأساسية والارتباطات الدراسية
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={0.7} sx={{ zIndex: 1 }}>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate("/teacher/dashboard")}
              sx={{
                minHeight: 34,
                px: 1.4,
                color: "#fff",
                fontSize: 10,
                fontWeight: 900,
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 1.7,
              }}
            >
              لوحة التحكم
            </Button>
            <Tooltip title="تحديث البيانات">
              <span>
                <IconButton
                  onClick={() => loadProfile({ silent: true })}
                  disabled={refreshing}
                  sx={{
                    width: 34,
                    height: 34,
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.25)",
                    borderRadius: 1.7,
                  }}
                >
                  {refreshing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshRounded fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="warning" sx={{ mt: 1, borderRadius: 2, py: 0.2 }}>
            {error}
          </Alert>
        )}

        {localDraft?.updatedAt && (
          <Alert severity="info" sx={{ mt: 1, borderRadius: 2, py: 0.15, fontSize: 10 }}>
            البيانات الشخصية المعدلة محفوظة محليًا للمعاينة لحين تفعيل الحفظ من الباك.
          </Alert>
        )}

        <Grid container spacing={1} sx={{ mt: 0.1 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="الفصول"
              value={uniqueClasses.length}
              helper="الفصول المرتبطة بحسابك"
              icon={<GroupsRounded fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="المواد"
              value={uniqueSubjects.length}
              helper="المواد المسندة إليك"
              icon={<SubjectRounded fontSize="small" />}
              tone="gold"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="الحصص الأسبوعية"
              value={lectures.length}
              helper="إجمالي الحصص في جدولك"
              icon={<ScheduleRounded fontSize="small" />}
              tone="green"
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 1.05,
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "320px minmax(0, 1fr)",
            },
            gap: 1.1,
            alignItems: "start",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.35, sm: 1.55 },
              borderRadius: 2.7,
              border: `1px solid ${COLORS.border}`,
              bgcolor: "#fff",
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.1}>
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  flexShrink: 0,
                  bgcolor: COLORS.navy,
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 900,
                  boxShadow: "0 9px 22px rgba(23, 63, 101, 0.14)",
                }}
              >
                {avatarInitials}
              </Avatar>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  noWrap
                  sx={{ color: COLORS.navyDark, fontSize: 16, fontWeight: 900 }}
                >
                  {displayName}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: COLORS.muted, fontSize: 9.2, mt: 0.1 }}
                >
                  {specialization || "معلم"}
                </Typography>
                <Chip
                  size="small"
                  label={isActive ? "حساب نشط" : "حساب موقوف"}
                  sx={{
                    mt: 0.55,
                    height: 21,
                    color: isActive ? COLORS.green : COLORS.red,
                    bgcolor: isActive ? COLORS.greenSoft : COLORS.redSoft,
                    fontSize: 8.2,
                    fontWeight: 900,
                  }}
                />
              </Box>
            </Stack>

            <Box
              sx={{
                mt: 1.15,
                p: 1,
                borderRadius: 1.9,
                bgcolor: "#f8fafc",
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {email && (
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 1.3,
                      color: COLORS.navy,
                      bgcolor: COLORS.navySoft,
                      flexShrink: 0,
                    }}
                  >
                    <EmailOutlined sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: COLORS.muted, fontSize: 8, fontWeight: 800 }}>
                      البريد الإلكتروني
                    </Typography>
                    <Typography
                      noWrap
                      dir="ltr"
                      sx={{ color: COLORS.navyDark, fontSize: 9.2, fontWeight: 900, textAlign: "left" }}
                    >
                      {email}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {phone && (
                <Stack direction="row" alignItems="center" gap={0.8} sx={{ mt: email ? 0.8 : 0 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 1.3,
                      color: COLORS.green,
                      bgcolor: COLORS.greenSoft,
                      flexShrink: 0,
                    }}
                  >
                    <LocalPhoneOutlined sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: COLORS.muted, fontSize: 8, fontWeight: 800 }}>
                      رقم الهاتف
                    </Typography>
                    <Typography
                      noWrap
                      dir="ltr"
                      sx={{ color: COLORS.navyDark, fontSize: 9.2, fontWeight: 900, textAlign: "left" }}
                    >
                      {phone}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>

            <Box
              sx={{
                mt: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 0.7,
              }}
            >
              <Button
                variant="contained"
                onClick={openProfileDialog}
                sx={{
                  minHeight: 38,
                  bgcolor: COLORS.navy,
                  borderRadius: 1.7,
                  fontSize: 8.8,
                  fontWeight: 900,
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: COLORS.navyDark, boxShadow: "none" },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" gap={0.45}>
                  <EditRounded sx={{ fontSize: 16 }} />
                  <span>تعديل البيانات</span>
                </Stack>
              </Button>

              <Button
                variant="outlined"
                onClick={openPasswordDialog}
                sx={{
                  minHeight: 38,
                  color: COLORS.navy,
                  borderColor: "#b9c8d4",
                  borderRadius: 1.7,
                  fontSize: 8.8,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  "&:hover": { borderColor: COLORS.navy, bgcolor: COLORS.navySoft },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" gap={0.45}>
                  <LockResetRounded sx={{ fontSize: 16 }} />
                  <span>تغيير المرور</span>
                </Stack>
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.35, sm: 1.55 },
              borderRadius: 2.7,
              border: `1px solid ${COLORS.border}`,
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={0.6}
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography sx={{ color: COLORS.navyDark, fontSize: 14, fontWeight: 900 }}>
                  المواد والفصول
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 8.5, mt: 0.08 }}>
                  الارتباطات الحالية في جدولك الدراسي
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${uniqueSubjects.length} مادة · ${uniqueClasses.length} فصل`}
                sx={{
                  height: 23,
                  color: COLORS.navy,
                  bgcolor: COLORS.navySoft,
                  fontSize: 8.2,
                  fontWeight: 900,
                }}
              />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 0.9,
              }}
            >
              <Box
                sx={{
                  minHeight: 88,
                  p: 1.05,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.8} sx={{ mb: 0.75 }}>
                  <Stack direction="row" alignItems="center" gap={0.65}>
                    <Box
                      sx={{
                        width: 29,
                        height: 29,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 1.35,
                        color: COLORS.gold,
                        bgcolor: COLORS.goldSoft,
                      }}
                    >
                      <MenuBookRounded sx={{ fontSize: 16 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: COLORS.navyDark, fontSize: 10.2, fontWeight: 900 }}>
                        المواد الدراسية
                      </Typography>
                      <Typography sx={{ color: COLORS.muted, fontSize: 7.9 }}>
                        المواد المسندة إليك
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label={uniqueSubjects.length}
                    sx={{ height: 21, minWidth: 28, bgcolor: COLORS.goldSoft, color: COLORS.gold, fontSize: 8, fontWeight: 900 }}
                  />
                </Stack>

                <Stack direction="row" gap={0.5} flexWrap="wrap" useFlexGap>
                  {uniqueSubjects.length ? (
                    uniqueSubjects.map((subject, index) => (
                      <Chip
                        key={normalizeId(subject) || index}
                        label={getEntityLabel(subject, `مادة ${index + 1}`)}
                        sx={{
                          height: 24,
                          color: COLORS.navy,
                          bgcolor: "#fff",
                          border: `1px solid ${COLORS.border}`,
                          fontSize: 8.4,
                          fontWeight: 900,
                        }}
                      />
                    ))
                  ) : (
                    <Typography sx={{ color: COLORS.muted, fontSize: 8.4 }}>
                      لا توجد مواد مرتبطة حاليًا.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box
                sx={{
                  minHeight: 88,
                  p: 1.05,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.8} sx={{ mb: 0.75 }}>
                  <Stack direction="row" alignItems="center" gap={0.65}>
                    <Box
                      sx={{
                        width: 29,
                        height: 29,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 1.35,
                        color: COLORS.green,
                        bgcolor: COLORS.greenSoft,
                      }}
                    >
                      <GroupsRounded sx={{ fontSize: 16 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: COLORS.navyDark, fontSize: 10.2, fontWeight: 900 }}>
                        الفصول الدراسية
                      </Typography>
                      <Typography sx={{ color: COLORS.muted, fontSize: 7.9 }}>
                        الفصول المرتبطة بجدولك
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label={uniqueClasses.length}
                    sx={{ height: 21, minWidth: 28, bgcolor: COLORS.greenSoft, color: COLORS.green, fontSize: 8, fontWeight: 900 }}
                  />
                </Stack>

                <Stack direction="row" gap={0.5} flexWrap="wrap" useFlexGap>
                  {uniqueClasses.length ? (
                    uniqueClasses.map((schoolClass, index) => (
                      <Chip
                        key={normalizeId(schoolClass) || index}
                        label={getEntityLabel(schoolClass, `فصل ${index + 1}`)}
                        sx={{
                          height: 24,
                          color: COLORS.green,
                          bgcolor: "#fff",
                          border: `1px solid ${COLORS.border}`,
                          fontSize: 8.4,
                          fontWeight: 900,
                        }}
                      />
                    ))
                  ) : (
                    <Typography sx={{ color: COLORS.muted, fontSize: 8.4 }}>
                      لا توجد فصول مرتبطة حاليًا.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 1.1 }} />

            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 0.7 }}>
              <Box>
                <Typography sx={{ color: COLORS.navyDark, fontSize: 11.2, fontWeight: 900 }}>
                  وصول سريع
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 7.9 }}>
                  انتقل مباشرة إلى أهم صفحاتك
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                gap: 0.7,
              }}
            >
              {[
                ["جدولي الدراسي", "/teacher/schedule", <ScheduleRounded />],
                ["فصولي وطلابي", "/teacher/classes", <GroupsRounded />],
                ["تحضيراتي", "/teacher/preparations", <MenuBookRounded />],
                ["المكتبة", "/teacher/library", <LibraryBooksRounded />],
              ].map(([label, path, icon]) => (
                <Button
                  key={path}
                  variant="outlined"
                  onClick={() => navigate(path)}
                  sx={{
                    minHeight: 43,
                    px: 0.65,
                    color: COLORS.navy,
                    borderColor: COLORS.border,
                    borderRadius: 1.7,
                    bgcolor: "#fff",
                    fontSize: 8.5,
                    fontWeight: 900,
                    "&:hover": { borderColor: "#b7c7d4", bgcolor: COLORS.navySoft },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="center" gap={0.45}>
                    <Box
                      sx={{
                        width: 25,
                        height: 25,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 1.1,
                        color: COLORS.navy,
                        bgcolor: COLORS.navySoft,
                        flexShrink: 0,
                        "& svg": { fontSize: 15 },
                      }}
                    >
                      {icon}
                    </Box>
                    <span>{label}</span>
                  </Stack>
                </Button>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <CompactDialogTitle
          title="تعديل البيانات الشخصية"
          subtitle="سيتم حفظ التعديلات محليًا لحين تفعيل مسار الباك"
          icon={<EditRounded />}
          onClose={() => setProfileDialogOpen(false)}
        />
        <Divider />
        <DialogContent sx={{ px: 2.2, py: 1.8 }}>
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="الاسم الكامل"
                value={profileForm.name}
                onChange={handleProfileField("name")}
                error={Boolean(profileErrors.name)}
                helperText={profileErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="البريد الإلكتروني"
                value={profileForm.email}
                disabled
                helperText="للعرض فقط"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="رقم الهاتف"
                value={profileForm.phoneNumber}
                onChange={handleProfileField("phoneNumber")}
                error={Boolean(profileErrors.phoneNumber)}
                helperText={profileErrors.phoneNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="المؤهل"
                value={profileForm.qualification}
                onChange={handleProfileField("qualification")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="التخصص"
                value={profileForm.specialization}
                onChange={handleProfileField("specialization")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="الخبرة"
                value={profileForm.experience}
                onChange={handleProfileField("experience")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="العنوان"
                value={profileForm.address}
                onChange={handleProfileField("address")}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.2, pb: 2, pt: 0.5 }}>
          <Button onClick={() => setProfileDialogOpen(false)} sx={{ color: COLORS.muted, fontWeight: 800 }}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveRounded />}
            onClick={saveProfileDraft}
            sx={{
              bgcolor: COLORS.navy,
              borderRadius: 1.8,
              fontWeight: 900,
              boxShadow: "none",
              "&:hover": { bgcolor: COLORS.navyDark, boxShadow: "none" },
            }}
          >
            حفظ التعديلات
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 520,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 26px 70px rgba(18, 47, 77, 0.24)",
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 2.6 },
            py: 2,
            color: "#fff",
            background: "linear-gradient(120deg, #173f65 0%, #2d628c 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Stack direction="row" alignItems="center" gap={1.1}>
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  color: COLORS.navy,
                  bgcolor: COLORS.goldSoft,
                }}
              >
                <LockResetRounded />
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 900 }}>
                  تغيير كلمة المرور
                </Typography>
                <Typography sx={{ mt: 0.15, color: "rgba(255,255,255,0.76)", fontSize: 9.5 }}>
                  أنشئ كلمة مرور قوية وسهلة التذكر
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={() => setPasswordDialogOpen(false)}
              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.16)" } }}
            >
              <CloseRounded />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ px: { xs: 2, sm: 2.8 }, pt: 2.3, pb: 1.2, bgcolor: "#fbfcfd" }}>
          <Box
            sx={{
              mb: 2,
              px: 1.4,
              py: 1.1,
              borderRadius: 2.2,
              border: `1px solid ${COLORS.border}`,
              bgcolor: "#fff",
            }}
          >
            <Typography sx={{ color: COLORS.navy, fontSize: 9.5, fontWeight: 800, lineHeight: 1.8 }}>
              كلمة المرور الجديدة لازم تكون 6 أحرف على الأقل. لن يتم تخزين أي كلمة مرور داخل المتصفح.
            </Typography>
          </Box>

          <Stack gap={0.5}>
            <PasswordField
              label="كلمة المرور الحالية"
              value={passwordForm.currentPassword}
              onChange={handlePasswordField("currentPassword")}
              error={passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              visible={showPasswords.current}
              onToggleVisibility={() =>
                setShowPasswords((current) => ({
                  ...current,
                  current: !current.current,
                }))
              }
              autoComplete="current-password"
            />

            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
                <PasswordField
                  label="كلمة المرور الجديدة"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordField("newPassword")}
                  error={passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                  visible={showPasswords.next}
                  onToggleVisibility={() =>
                    setShowPasswords((current) => ({
                      ...current,
                      next: !current.next,
                    }))
                  }
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <PasswordField
                  label="تأكيد كلمة المرور الجديدة"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordField("confirmPassword")}
                  error={passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  visible={showPasswords.confirm}
                  onToggleVisibility={() =>
                    setShowPasswords((current) => ({
                      ...current,
                      confirm: !current.confirm,
                    }))
                  }
                  autoComplete="new-password"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 2.8 },
            pb: 2.3,
            pt: 1,
            gap: 1,
            bgcolor: "#fbfcfd",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setPasswordDialogOpen(false)}
            sx={{
              minWidth: 105,
              minHeight: 42,
              color: COLORS.navy,
              borderColor: "#c9d4dd",
              borderRadius: 2,
              fontWeight: 900,
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={<LockResetRounded />}
            onClick={submitPasswordPreview}
            sx={{
              flex: 1,
              minHeight: 42,
              bgcolor: COLORS.navy,
              borderRadius: 2,
              fontWeight: 900,
              boxShadow: "none",
              "&:hover": { bgcolor: COLORS.navyDark, boxShadow: "none" },
            }}
          >
            حفظ كلمة المرور الجديدة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherProfile;
