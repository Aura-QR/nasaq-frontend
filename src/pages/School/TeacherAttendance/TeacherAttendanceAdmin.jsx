import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  DeleteOutlineRounded,
  EditRounded,
  GpsFixedRounded,
  LocationOnRounded,
  MyLocationRounded,
  PersonOffRounded,
  RefreshRounded,
  RouterRounded,
  SaveRounded,
  SettingsRounded,
  WifiFindRounded,
} from "@mui/icons-material";

import { useAuthUser } from "react-auth-kit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

import { getSchoolTeachers } from "@/APIs/school/teachers";

import {
  createManualTeacherAttendance,
  deleteTeacherAttendance,
  detectTeacherAttendanceIp,
  fetchAbsentTeachers,
  fetchTeacherAttendanceAdmin,
  fetchTeacherAttendanceSettings,
  updateTeacherAttendance,
  updateTeacherAttendanceSettings,
} from "@/APIs/school/teacherAttendance";

const PAGE_LIMIT = 10;

const todayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value?._id || value?.id || "").trim();
  }
  return String(value || "").trim();
};

const extractSettings = (response) => {
  if (!response || response?.status === false) return {};

  let payload = response;
  for (let index = 0; index < 4; index += 1) {
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

  return payload?.settings || payload?.school?.settings || payload || {};
};

const extractTeachers = (response) => {
  if (!response || response?.status === false) return [];

  let payload = response;

  // يدعم شكل getSchoolTeachers الحالي + استجابات الباك المتداخلة
  for (let index = 0; index < 5; index += 1) {
    if (Array.isArray(payload)) return payload;

    if (!payload || typeof payload !== "object") {
      return [];
    }

    const directList =
      payload?.docs ||
      payload?.items ||
      payload?.results ||
      payload?.teachers;

    if (Array.isArray(directList)) {
      return directList;
    }

    if (payload?.data !== undefined) {
      payload = payload.data;
      continue;
    }

    break;
  }

  return Array.isArray(payload) ? payload : [];
};

const extractAttendancePage = (response) => {
  if (!response || response?.status === false) {
    return { rows: [], meta: {} };
  }

  // Expected backend shape:
  // { status, message, data: { data: [...], meta: {...} } }
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return { rows: payload, meta: {} };
  }

  if (Array.isArray(payload?.data)) {
    return {
      rows: payload.data,
      meta: payload.meta || {},
    };
  }

  return { rows: [], meta: payload?.meta || {} };
};

const extractAbsent = (response) => {
  if (!response || response?.status === false) {
    return {
      teachers: [],
      isWorkingDay: true,
      message: "",
    };
  }

  const payload = response?.data ?? response;

  return {
    teachers: Array.isArray(payload?.absentTeachers)
      ? payload.absentTeachers
      : Array.isArray(payload)
        ? payload
        : [],
    isWorkingDay: payload?.isWorkingDay !== false,
    message: payload?.message || "",
  };
};

const getTeacherEntity = (record) =>
  record?.teacherId || record?.teacher || record?.teacherProfile || {};

const getTeacherName = (recordOrTeacher) => {
  const teacher =
    recordOrTeacher?.teacherId ||
    recordOrTeacher?.teacher ||
    recordOrTeacher;

  return (
    teacher?.name ||
    teacher?.fullName ||
    teacher?.username ||
    [teacher?.firstName, teacher?.fatherName, teacher?.familyName]
      .filter(Boolean)
      .join(" ") ||
    "معلم"
  );
};

const getRecordedByName = (record) => {
  const actor = record?.recordedBy;
  if (!actor) return "—";
  if (typeof actor === "string") return "إدارة المدرسة";
  return actor?.name || actor?.fullName || actor?.email || "إدارة المدرسة";
};

const normalizeRecordDate = (record) =>
  String(
    record?.date ||
      record?.attendanceDate ||
      record?.checkInDate ||
      record?.createdAt ||
      ""
  ).slice(0, 10);

const formatTime = (value) => {
  if (!value) return "—";
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  return text;
};

const formatMinutes = (value, { duration = false } = {}) => {
  if (value === null || value === undefined || value === "") return "—";

  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "—";

  if (!duration) return `${Math.max(0, Math.round(minutes))} د`;

  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours) return `${remainingMinutes} د`;
  if (!remainingMinutes) return `${hours} س`;

  return `${hours} س ${remainingMinutes} د`;
};

const getVerification = (record) => ({
  gps: Boolean(record?.verification?.gps),
  network: Boolean(record?.verification?.network),
});

const getRecordId = (record) => normalizeId(record);

const isFailed = (response) =>
  response?.status === false || Number(response?.statusCode) >= 400;

const WORK_WEEK_DAYS = [
  { day: "sunday", label: "الأحد" },
  { day: "monday", label: "الاثنين" },
  { day: "tuesday", label: "الثلاثاء" },
  { day: "wednesday", label: "الأربعاء" },
  { day: "thursday", label: "الخميس" },
  { day: "friday", label: "الجمعة" },
  { day: "saturday", label: "السبت" },
];

const normalizeWorkSchedule = (value) => {
  const incoming = Array.isArray(value) ? value : [];

  return WORK_WEEK_DAYS.map(({ day }) => {
    const saved = incoming.find(
      (item) =>
        String(item?.day || "")
          .trim()
          .toLowerCase() === day
    );

    if (!saved) {
      // Empty/unconfigured schedule means every day is treated as a
      // working day but without measured start/end times.
      return {
        day,
        isWorkingDay: true,
        startTime: "",
        endTime: "",
      };
    }

    const isWorkingDay =
      saved?.isWorkingDay !== false;

    return {
      day,
      isWorkingDay,
      startTime:
        isWorkingDay && saved?.startTime
          ? String(saved.startTime).slice(0, 5)
          : "",
      endTime:
        isWorkingDay && saved?.endTime
          ? String(saved.endTime).slice(0, 5)
          : "",
    };
  });
};

const pageCardSx = {
  border: "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream, #FFFCF7)",
  boxShadow: "0 12px 28px rgba(18,47,77,0.06)",
};

const emptyManualForm = () => ({
  teacherId: "",
  date: todayKey(),
  checkInAt: "07:45",
  notes: "",
});

const TeacherAttendanceAdmin = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.();
  const currentUser = authState?.user || authState || {};
  const adminName = currentUser?.name || currentUser?.fullName || "الإدارة";

  const [tab, setTab] = useState(0);

  // Settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [teacherCheckInEnabled, setTeacherCheckInEnabled] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(150);
  const [workSchedule, setWorkSchedule] = useState(() => normalizeWorkSchedule([]));
  const [networkIps, setNetworkIps] = useState([]);
  const [newIp, setNewIp] = useState("");
  const [detectingIp, setDetectingIp] = useState(false);
  const [locating, setLocating] = useState(false);

  // Admin list
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [absentTeachers, setAbsentTeachers] = useState([]);
  const [absentDayInfo, setAbsentDayInfo] = useState({
    isWorkingDay: true,
    message: "",
  });
  const [showAbsent, setShowAbsent] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Manual create
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualForm);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({ checkInAt: "", checkOutAt: "", notes: "" });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const today = useMemo(todayKey, []);

  const parseCoordinate = (value) => {
    if (value === null || value === undefined) return null;

    const normalized = String(value).trim();
    if (!normalized) return null;

    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const isValidSchoolLocation = (latValue, lngValue) => {
    const latitude = parseCoordinate(latValue);
    const longitude = parseCoordinate(lngValue);

    if (latitude === null || longitude === null) return false;

    const insideValidRange =
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    // 0,0 is almost always an empty/default coordinate in our UI flow.
    // Do not allow it to activate attendance by mistake.
    const isZeroZero = latitude === 0 && longitude === 0;

    return insideValidRange && !isZeroZero;
  };

  const hasValidLocation = useMemo(
    () => isValidSchoolLocation(lat, lng),
    [lat, lng]
  );

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);

    const response = await fetchTeacherAttendanceSettings();
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل إعدادات المدرسة");
      setSettingsLoading(false);
      return;
    }

    const settings = extractSettings(response);

    const savedLat = settings?.location?.lat;
    const savedLng = settings?.location?.lng;
    const savedLocationIsValid = isValidSchoolLocation(savedLat, savedLng);

    // Ignore the accidental 0,0 value that may have been saved by older UI logic.
    setLat(savedLocationIsValid ? String(savedLat) : "");
    setLng(savedLocationIsValid ? String(savedLng) : "");

    // Never show self check-in as enabled while the school location is invalid.
    setTeacherCheckInEnabled(
      Boolean(settings?.teacherCheckInEnabled) && savedLocationIsValid
    );

    setRadius(Number(settings?.checkInRadiusMeters) || 150);
    setWorkSchedule(
      normalizeWorkSchedule(settings?.workSchedule)
    );
    setNetworkIps(
      Array.isArray(settings?.schoolNetworkIps)
        ? settings.schoolNetworkIps.filter(Boolean)
        : []
    );

    setSettingsLoading(false);
  }, []);

  const loadTeachers = useCallback(async () => {
    const response = await getSchoolTeachers({ page: 1, limit: 1000 });
    if (response?.status === false) return;
    setTeachers(extractTeachers(response));
  }, []);

  const loadAbsent = useCallback(async () => {
    const response = await fetchAbsentTeachers();

    if (response?.status === false) {
      return;
    }

    const absentData = extractAbsent(response);

    setAbsentTeachers(absentData.teachers);
    setAbsentDayInfo({
      isWorkingDay: absentData.isWorkingDay,
      message: absentData.message,
    });

    if (!absentData.isWorkingDay) {
      setShowAbsent(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);

    const params = {
      page,
      limit: PAGE_LIMIT,
      ...(filter === "manual" ? { method: "manual" } : {}),
    };

    const response = await fetchTeacherAttendanceAdmin(params);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل سجل حضور المعلمين");
      setRecords([]);
      setMeta({});
      setRecordsLoading(false);
      return;
    }

    const pageData = extractAttendancePage(response);
    setRecords(pageData.rows);
    setMeta(pageData.meta);
    setRecordsLoading(false);
  }, [filter, page]);

  useEffect(() => {
    loadSettings();
    loadTeachers();
  }, [loadSettings, loadTeachers]);

  useEffect(() => {
    loadRecords();
    loadAbsent();
  }, [loadRecords, loadAbsent]);

  const visibleRecords = useMemo(() => {
    if (filter === "weak") {
      return records.filter((record) => {
        if (record?.method === "manual") return false;
        const { gps, network } = getVerification(record);
        return gps !== network;
      });
    }

    if (filter === "today") {
      return records.filter((record) => normalizeRecordDate(record) === today);
    }

    return records;
  }, [records, filter, today]);

  const totalPages = Math.max(
    1,
    Number(meta?.totalPages || meta?.pages || meta?.lastPage || 1)
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords?.latitude);
        const longitude = Number(coords?.longitude);

        if (!isValidSchoolLocation(latitude, longitude)) {
          setLocating(false);
          toast.error(
            "المتصفح أعاد موقعًا غير صالح. تأكد من تشغيل خدمة الموقع ثم حاول مرة أخرى."
          );
          return;
        }

        setLat(String(latitude));
        setLng(String(longitude));
        setLocating(false);
        toast.success("تم التقاط موقع الجهاز الحالي");
      },
      (error) => {
        setLocating(false);

        const messageByCode = {
          1: "تم رفض صلاحية الموقع. اسمح للموقع بالوصول إلى Location ثم حاول مرة أخرى.",
          2: "تعذر تحديد موقع الجهاز حاليًا. تأكد من تشغيل خدمة الموقع.",
          3: "انتهت مهلة تحديد الموقع. حاول مرة أخرى.",
        };

        toast.error(
          messageByCode[error?.code] ||
            "تعذر التقاط موقع الجهاز. تأكد من صلاحية الموقع."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleDetectIp = async () => {
    setDetectingIp(true);
    const response = await detectTeacherAttendanceIp();
    setDetectingIp(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر اكتشاف عنوان الشبكة");
      return;
    }

    const ip = response?.data?.ip || response?.ip;
    if (!ip) {
      toast.error("لم يرجع السيرفر عنوان IP صالحًا");
      return;
    }

    setNetworkIps((previous) =>
      previous.includes(ip) ? previous : [ip, ...previous]
    );
    toast.success(`تم اكتشاف ${ip}`);
  };

  const addManualIp = () => {
    const value = newIp.trim();
    if (!value) return;

    if (networkIps.includes(value)) {
      toast.info("عنوان الشبكة موجود بالفعل");
      return;
    }

    setNetworkIps((previous) => [...previous, value]);
    setNewIp("");
  };

  const updateWorkScheduleDay = (
    day,
    changes
  ) => {
    setWorkSchedule((current) =>
      current.map((item) => {
        if (item.day !== day) return item;

        const next = {
          ...item,
          ...changes,
        };

        if (changes?.isWorkingDay === false) {
          next.startTime = "";
          next.endTime = "";
        }

        return next;
      })
    );
  };

  const saveSettings = async () => {
    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(lng);

    if (teacherCheckInEnabled && !hasValidLocation) {
      toast.error(
        "حدد موقع مدرسة صالحًا أولًا. لا يمكن استخدام إحداثيات فارغة أو 0,0."
      );
      return;
    }

    const numericRadius = Number(radius);
    if (!Number.isFinite(numericRadius) || numericRadius < 20 || numericRadius > 500) {
      toast.error("نصف قطر القبول يجب أن يكون بين 20 و500 متر");
      return;
    }

    setSettingsSaving(true);

    const payload = {
      teacherCheckInEnabled,
      checkInRadiusMeters: numericRadius,
      workSchedule: workSchedule.map((item) => ({
        day: item.day,
        isWorkingDay: Boolean(item.isWorkingDay),
        startTime:
          item.isWorkingDay && item.startTime
            ? item.startTime
            : null,
        endTime:
          item.isWorkingDay && item.endTime
            ? item.endTime
            : null,
      })),
      schoolNetworkIps: networkIps,
      ...(hasValidLocation
        ? {
            location: {
              lat: latitude,
              lng: longitude,
            },
          }
        : {}),
    };

    const response = await updateTeacherAttendanceSettings(payload);
    setSettingsSaving(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حفظ إعدادات حضور المعلمين");
      return;
    }

    toast.success("تم حفظ إعدادات حضور المعلمين");
    await loadSettings();
  };

  const openManualDialog = () => {
    setManualForm(emptyManualForm());
    setManualOpen(true);
  };

  const createManualRecord = async () => {
    if (!manualForm.teacherId) {
      toast.error("اختر المعلم");
      return;
    }

    if (!manualForm.date || !manualForm.checkInAt) {
      toast.error("حدد التاريخ ووقت الحضور");
      return;
    }

    if (manualForm.date > today) {
      toast.error("لا يمكن تسجيل حضور يدوي بتاريخ مستقبلي");
      return;
    }

    setManualSaving(true);
    const response = await createManualTeacherAttendance(manualForm);
    setManualSaving(false);

    if (isFailed(response)) {
      toast.error(response?.message || "تعذر تسجيل الحضور اليدوي");
      return;
    }

    toast.success("تم تسجيل الحضور اليدوي");
    setManualOpen(false);
    await Promise.all([loadRecords(), loadAbsent()]);
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setEditForm({
      checkInAt:
        formatTime(record?.checkInAt) === "—"
          ? ""
          : formatTime(record?.checkInAt),
      checkOutAt:
        formatTime(record?.checkOutAt) === "—"
          ? ""
          : formatTime(record?.checkOutAt),
      notes: record?.notes || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const id = getRecordId(selectedRecord);
    if (!id) return;

    if (!editForm.checkInAt) {
      toast.error("حدد وقت الحضور");
      return;
    }

    setEditSaving(true);
    const response = await updateTeacherAttendance(id, editForm);
    setEditSaving(false);

    if (isFailed(response)) {
      toast.error(response?.message || "تعذر تعديل سجل الحضور");
      return;
    }

    toast.success("تم تعديل سجل الحضور");
    setEditOpen(false);
    setSelectedRecord(null);
    await loadRecords();
  };

  const openDeleteDialog = (record) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const id = getRecordId(selectedRecord);
    if (!id) return;

    setDeleteSaving(true);
    const response = await deleteTeacherAttendance(id);
    setDeleteSaving(false);

    if (isFailed(response)) {
      toast.error(response?.message || "تعذر حذف سجل الحضور");
      return;
    }

    toast.success("تم حذف سجل الحضور");
    setDeleteOpen(false);
    setSelectedRecord(null);
    await Promise.all([loadRecords(), loadAbsent()]);
  };

  const renderSettings = () => {
    if (settingsLoading) {
      return (
        <Paper elevation={0} sx={{ ...pageCardSx, p: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      );
    }

    return (
      <Stack spacing={1.5}>
        <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
                تفعيل تسجيل الحضور والانصراف الذاتي
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10, lineHeight: 1.7 }}>
                يستخدم نفس الإعداد للحضور والانصراف الذاتي. لا يمكن تفعيله قبل وجود موقع صالح للمدرسة، وشبكة المدرسة اختيارية.
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={teacherCheckInEnabled}
                  onChange={(event) => setTeacherCheckInEnabled(event.target.checked)}
                />
              }
              label={teacherCheckInEnabled ? "مفعّل" : "متوقف"}
            />
          </Stack>

          {teacherCheckInEnabled && !hasValidLocation && (
            <Alert severity="warning" sx={{ mt: 1.2, borderRadius: "12px" }}>
              حدد موقع المدرسة أولًا. الباك سيرفض التفعيل من غير Location.
            </Alert>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
          <Box>
            <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
              جدول دوام المعلمين الأسبوعي
            </Typography>
            <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10, lineHeight: 1.7 }}>
              حدّد أيام العمل ووقت البداية والنهاية لكل يوم. اليوم غير المفعّل يُرسل بدون أوقات.
            </Typography>
          </Box>

          <Stack spacing={0.9} sx={{ mt: 1.5 }}>
            {WORK_WEEK_DAYS.map(({ day, label }) => {
              const item =
                workSchedule.find(
                  (row) => row.day === day
                ) || {
                  day,
                  isWorkingDay: true,
                  startTime: "",
                  endTime: "",
                };

              return (
                <Paper
                  key={day}
                  elevation={0}
                  sx={{
                    p: 1.1,
                    border:
                      "1px solid rgba(36,74,112,.08)",
                    borderRadius: "14px",
                    backgroundColor: item.isWorkingDay
                      ? "#fff"
                      : "rgba(36,74,112,.025)",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "180px minmax(0,1fr)",
                      },
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.isWorkingDay}
                          onChange={(event) =>
                            updateWorkScheduleDay(
                              day,
                              {
                                isWorkingDay:
                                  event.target.checked,
                              }
                            )
                          }
                        />
                      }
                      label={
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: "#122F4D",
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.1,
                              color: "#708198",
                              fontSize: 8.5,
                            }}
                          >
                            {item.isWorkingDay
                              ? "يوم عمل"
                              : "إجازة"}
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr",
                        },
                        gap: 1,
                      }}
                    >
                      <TextField
                        type="time"
                        label="بداية الدوام"
                        value={item.startTime}
                        disabled={!item.isWorkingDay}
                        onChange={(event) =>
                          updateWorkScheduleDay(
                            day,
                            {
                              startTime:
                                event.target.value,
                            }
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 60 }}
                        fullWidth
                        size="small"
                      />

                      <TextField
                        type="time"
                        label="نهاية الدوام"
                        value={item.endTime}
                        disabled={!item.isWorkingDay}
                        onChange={(event) =>
                          updateWorkScheduleDay(
                            day,
                            {
                              endTime:
                                event.target.value,
                            }
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 60 }}
                        fullWidth
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          <Alert severity="info" sx={{ mt: 1.2, borderRadius: "12px" }}>
            لو وقت البداية أو النهاية فارغ في يوم عمل، يعتبر اليوم يوم دوام لكن القياس المرتبط بهذا الوقت يكون غير متاح.
          </Alert>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
                <LocationOnRounded sx={{ verticalAlign: "middle", ml: 0.6, color: "#B78430" }} />
                موقع المدرسة
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10 }}>
                استخدم موقع الجهاز وأنت داخل المدرسة أو أدخل الإحداثيات يدويًا.
              </Typography>
            </Box>

            <Button
              type="button"
              variant="outlined"
              onClick={handleUseMyLocation}
              disabled={locating}
              startIcon={locating ? <CircularProgress size={15} /> : <MyLocationRounded />}
              sx={{ borderRadius: "11px" }}
            >
              {locating ? "جارٍ تحديد الموقع" : "استخدم موقعي الحالي"}
            </Button>
          </Stack>

          <Box
            sx={{
              mt: 1.5,
              height: 180,
              display: "grid",
              placeItems: "center",
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              border: "1px solid rgba(36,74,112,.09)",
              backgroundImage:
                "linear-gradient(rgba(36,74,112,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(36,74,112,.045) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              backgroundColor: "rgba(36,74,112,.025)",
            }}
          >
            <Box
              sx={{
                width: Math.max(80, Math.min(160, 70 + (Number(radius) / 500) * 100)),
                height: Math.max(80, Math.min(160, 70 + (Number(radius) / 500) * 100)),
                position: "absolute",
                borderRadius: "50%",
                border: "2px dashed rgba(183,132,48,.55)",
                backgroundColor: "rgba(251,240,216,.38)",
              }}
            />
            <GpsFixedRounded sx={{ zIndex: 1, color: "#B78430", fontSize: 38 }} />
          </Box>

          <Box
            sx={{
              mt: 1.4,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1,
            }}
          >
            <TextField
              label="Latitude"
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              type="number"
              inputProps={{ step: "any", min: -90, max: 90 }}
              fullWidth
            />
            <TextField
              label="Longitude"
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              type="number"
              inputProps={{ step: "any", min: -180, max: 180 }}
              fullWidth
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>نصف قطر القبول</Typography>
              <Chip label={`${radius} متر`} size="small" sx={{ fontWeight: 800 }} />
            </Stack>
            <Slider
              value={Number(radius)}
              onChange={(_, value) => setRadius(Number(value))}
              min={20}
              max={500}
              step={10}
              valueLabelDisplay="auto"
              sx={{ mt: 1, color: "#B78430" }}
            />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
                <RouterRounded sx={{ verticalAlign: "middle", ml: 0.6, color: "#B78430" }} />
                شبكة المدرسة / IP
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10 }}>
                اختياري. زر الاكتشاف يقرأ الـIP الذي يراه السيرفر فعليًا.
              </Typography>
            </Box>

            <Button
              onClick={handleDetectIp}
              disabled={detectingIp}
              startIcon={detectingIp ? <CircularProgress size={15} /> : <WifiFindRounded />}
              variant="outlined"
              sx={{ borderRadius: "11px" }}
            >
              {detectingIp ? "جارٍ الاكتشاف" : "اكتشاف IP الحالي"}
            </Button>
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1.5 }}>
            {!networkIps.length ? (
              <Alert severity="info" sx={{ width: "100%", borderRadius: "12px" }}>
                لا توجد شبكة مسجلة. يمكن الاعتماد على الموقع الجغرافي فقط.
              </Alert>
            ) : (
              networkIps.map((ip) => (
                <Chip
                  key={ip}
                  label={ip}
                  onDelete={() =>
                    setNetworkIps((previous) => previous.filter((item) => item !== ip))
                  }
                  sx={{ fontFamily: "monospace" }}
                />
              ))
            )}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1.4 }}>
            <TextField
              label="إضافة IP يدوي"
              value={newIp}
              onChange={(event) => setNewIp(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addManualIp();
                }
              }}
              fullWidth
              placeholder="مثال: 156.203.44.118"
            />
            <Button onClick={addManualIp} variant="outlined" startIcon={<AddRounded />}>
              إضافة
            </Button>
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            onClick={saveSettings}
            disabled={settingsSaving}
            variant="contained"
            startIcon={settingsSaving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            sx={{
              minHeight: 44,
              px: 2.5,
              color: "#122F4D",
              backgroundColor: "#F2D792",
              boxShadow: "none",
              borderRadius: "12px",
              fontWeight: 900,
              "&:hover": { backgroundColor: "#E8C96F", boxShadow: "none" },
            }}
          >
            حفظ إعدادات الحضور
          </Button>
        </Stack>
      </Stack>
    );
  };

  const renderLog = () => (
    <Stack spacing={1.5}>
      <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={1.2}
        >
          <Box>
            <Typography sx={{ color: "#122F4D", fontSize: 16, fontWeight: 900 }}>
              سجل الحضور اليومي
            </Typography>
            <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10 }}>
              كل سجل يوضح طريقة التسجيل ونتيجة GPS والشبكة بشكل منفصل.
            </Typography>
          </Box>

          <Stack direction="row" gap={0.7}>
            <Button
              variant="outlined"
              onClick={() => Promise.all([loadRecords(), loadAbsent()])}
              startIcon={<RefreshRounded />}
            >
              تحديث
            </Button>
            <Button
              variant="contained"
              onClick={openManualDialog}
              startIcon={<AddRounded />}
              sx={{
                color: "#122F4D",
                backgroundColor: "#F2D792",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#E8C96F", boxShadow: "none" },
              }}
            >
              تسجيل حضور يدوي
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        onClick={() => absentDayInfo.isWorkingDay && setShowAbsent((value) => !value)}
        sx={{
          ...pageCardSx,
          p: 1.3,
          cursor: absentDayInfo.isWorkingDay ? "pointer" : "default",
          borderColor: "rgba(201,79,79,.18)",
          backgroundColor: "rgba(253,234,234,.52)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonOffRounded sx={{ color: "#C94848" }} />
            <Box>
              <Typography sx={{ color: "#A23E3E", fontSize: 12, fontWeight: 900 }}>
                {absentDayInfo.isWorkingDay
                  ? `${absentTeachers.length} معلم بدون سجل حضور اليوم`
                  : absentDayInfo.message ||
                    "هذا اليوم إجازة رسمية للمدرسة"}
              </Typography>
              <Typography sx={{ color: "#8B6262", fontSize: 9 }}>
                {absentDayInfo.isWorkingDay
                  ? "اضغط لعرض القائمة"
                  : "لا يتم احتساب غياب المعلمين في يوم الإجازة"}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={
              absentDayInfo.isWorkingDay
                ? showAbsent
                  ? "إخفاء"
                  : "عرض"
                : "إجازة"
            }
            size="small"
          />
        </Stack>

        <Collapse in={absentDayInfo.isWorkingDay && showAbsent}>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" flexWrap="wrap" gap={0.7}>
            {!absentTeachers.length ? (
              <Typography sx={{ color: "#708198", fontSize: 10 }}>
                كل المعلمين لديهم سجل حضور اليوم.
              </Typography>
            ) : (
              absentTeachers.map((teacher, index) => (
                <Chip
                  key={normalizeId(teacher) || index}
                  label={getTeacherName(teacher)}
                  sx={{ backgroundColor: "#fff" }}
                />
              ))
            )}
          </Stack>
        </Collapse>
      </Paper>

      <Paper elevation={0} sx={{ ...pageCardSx, p: 1.2 }}>
        <Stack direction="row" flexWrap="wrap" gap={0.7}>
          {[
            ["all", "كل السجلات"],
            ["manual", "يدوي فقط"],
            ["weak", "تحقق جزئي"],
            ["today", "اليوم"],
          ].map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              clickable
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              sx={{
                color: filter === value ? "#fff" : "#344054",
                backgroundColor: filter === value ? "#122F4D" : "#fff",
                border: "1px solid rgba(36,74,112,.12)",
                fontWeight: 800,
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
        {recordsLoading ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(36,74,112,.035)" }}>
                  <TableCell align="right">المعلم</TableCell>
                  <TableCell align="right">التاريخ</TableCell>
                  <TableCell align="right">الحضور</TableCell>
                  <TableCell align="right">الانصراف</TableCell>
                  <TableCell align="right">التأخير</TableCell>
                  <TableCell align="right">مدة العمل</TableCell>
                  <TableCell align="right">طريقة الانصراف</TableCell>
                  <TableCell align="right">طريقة الحضور</TableCell>
                  <TableCell align="right">GPS</TableCell>
                  <TableCell align="right">الشبكة</TableCell>
                  <TableCell align="right">المسافة</TableCell>
                  <TableCell align="right">سجّله</TableCell>
                  <TableCell align="center">إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!visibleRecords.length ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 6, color: "#708198" }}>
                      لا توجد سجلات مطابقة للفلتر الحالي.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRecords.map((record, index) => {
                    const teacher = getTeacherEntity(record);
                    const verification = getVerification(record);
                    const manual = record?.method === "manual";
                    const weak = !manual && verification.gps !== verification.network;
                    const id = getRecordId(record) || index;

                    return (
                      <TableRow
                        key={id}
                        hover
                        sx={{
                          backgroundColor: manual
                            ? "rgba(255,243,216,.28)"
                            : weak
                              ? "rgba(251,240,216,.18)"
                              : "transparent",
                        }}
                      >
                        <TableCell align="right">
                          <Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 900 }}>
                              {getTeacherName(teacher)}
                            </Typography>
                            <Typography sx={{ color: "#708198", fontSize: 8.5 }}>
                              {teacher?.email || teacher?.phoneNumber || ""}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{normalizeRecordDate(record) || "—"}</TableCell>
                        <TableCell align="right">{formatTime(record?.checkInAt)}</TableCell>
                        <TableCell align="right">{formatTime(record?.checkOutAt)}</TableCell>
                        <TableCell align="right">
                          {record?.lateMinutes === null || record?.lateMinutes === undefined
                            ? "غير مقاس"
                            : formatMinutes(record.lateMinutes)}
                        </TableCell>
                        <TableCell align="right">
                          {formatMinutes(record?.workMinutes, { duration: true })}
                        </TableCell>
                        <TableCell align="right">{record?.checkOutMethod || "—"}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={manual ? "يدوي" : weak ? "ذاتي — جزئي" : "ذاتي"}
                            sx={{
                              color: manual || weak ? "#9A6B12" : "#237449",
                              backgroundColor: manual || weak ? "#FFF3D8" : "#E7F6ED",
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">{verification.gps ? "✅" : "—"}</TableCell>
                        <TableCell align="right">{verification.network ? "✅" : "—"}</TableCell>
                        <TableCell align="right">
                          {record?.distanceMeters === undefined || record?.distanceMeters === null
                            ? "—"
                            : `${Math.round(Number(record.distanceMeters) || 0)} م`}
                        </TableCell>
                        <TableCell align="right">
                          {manual ? getRecordedByName(record) : "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" justifyContent="center" spacing={0.2}>
                            <Tooltip title="تعديل">
                              <IconButton size="small" onClick={() => openEditDialog(record)}>
                                <EditRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
                              <IconButton
                                size="small"
                                onClick={() => openDeleteDialog(record)}
                                sx={{ color: "#C94848" }}
                              >
                                <DeleteOutlineRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && filter !== "weak" && filter !== "today" && (
          <Stack alignItems="center" sx={{ py: 1.5 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Stack>
        )}
      </Paper>
    </Stack>
  );

  return (
    <Container>
      <Box dir="rtl" sx={{ width: "100%", pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            p: { xs: 1.4, md: 1.8 },
            mb: 1.5,
            background:
              "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.45))",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.2}
          >
            <Box>
              <Back title="حضور المعلمين" />
              <Typography sx={{ mt: 0.5, color: "#708198", fontSize: 10 }}>
                إعداد التسجيل الذاتي ومراجعة سجل حضور المعلمين والإدخالات اليدوية.
              </Typography>
            </Box>

            <Chip
              icon={<SettingsRounded />}
              label={`الإدارة: ${adminName}`}
              sx={{
                color: "#B78430",
                backgroundColor: "#FBF0D8",
                "& .MuiChip-icon": { color: "inherit" },
                fontWeight: 800,
              }}
            />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.5, overflow: "hidden" }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<SettingsRounded />} iconPosition="start" label="إعدادات الحضور" />
            <Tab icon={<GpsFixedRounded />} iconPosition="start" label="سجل الحضور اليومي" />
          </Tabs>
        </Paper>

        {tab === 0 ? renderSettings() : renderLog()}
      </Box>

      <Dialog
        open={manualOpen}
        onClose={() => !manualSaving && setManualOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>تسجيل حضور يدوي</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "12px" }}>
            السجل اليدوي لا يحمل تحقق GPS أو شبكة، وسيظهر مميزًا في التقارير باسم الإدارة التي سجّلته.
          </Alert>

          <Stack spacing={1.2}>
            <TextField
              select
              label="المعلم"
              value={manualForm.teacherId}
              onChange={(event) =>
                setManualForm((previous) => ({ ...previous, teacherId: event.target.value }))
              }
              fullWidth
              required
            >
              <MenuItem value="" disabled>اختر المعلم</MenuItem>
              {teachers.map((teacher, index) => (
                <MenuItem key={normalizeId(teacher) || index} value={normalizeId(teacher)}>
                  {getTeacherName(teacher)}
                </MenuItem>
              ))}
            </TextField>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
              }}
            >
              <TextField
                type="date"
                label="التاريخ"
                value={manualForm.date}
                onChange={(event) =>
                  setManualForm((previous) => ({ ...previous, date: event.target.value }))
                }
                inputProps={{ max: today }}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                type="time"
                label="وقت الحضور"
                value={manualForm.checkInAt}
                onChange={(event) =>
                  setManualForm((previous) => ({ ...previous, checkInAt: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <TextField
              label="السبب / ملاحظات"
              value={manualForm.notes}
              onChange={(event) =>
                setManualForm((previous) => ({ ...previous, notes: event.target.value }))
              }
              multiline
              minRows={2}
              placeholder="مثال: الجهاز لا يدعم تحديد الموقع"
              fullWidth
            />

            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              سيتولى السيرفر تسجيل recordedBy تلقائيًا باسم الحساب الإداري الحالي.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualOpen(false)} disabled={manualSaving}>إلغاء</Button>
          <Button
            onClick={createManualRecord}
            disabled={manualSaving}
            variant="contained"
            startIcon={manualSaving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />}
          >
            حفظ السجل
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>تعديل سجل الحضور</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 0.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
              }}
            >
              <TextField
                type="time"
                label="وقت الحضور"
                value={editForm.checkInAt}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    checkInAt: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                type="time"
                label="وقت الانصراف"
                value={editForm.checkOutAt}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    checkOutAt: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              عند تعديل وقت الحضور أو الانصراف سيعيد السيرفر حساب التأخير ومدة العمل تلقائيًا.
            </Alert>

            <TextField
              label="ملاحظات"
              value={editForm.notes}
              onChange={(event) =>
                setEditForm((previous) => ({ ...previous, notes: event.target.value }))
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>إلغاء</Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />}
          >
            حفظ التعديل
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleteSaving && setDeleteOpen(false)}>
        <DialogTitle>حذف سجل الحضور؟</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#667085", fontSize: 12 }}>
            سيتم حذف سجل {getTeacherName(getTeacherEntity(selectedRecord || {}))} نهائيًا.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteSaving}>إلغاء</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteSaving}
            startIcon={deleteSaving ? <CircularProgress size={15} color="inherit" /> : <DeleteOutlineRounded />}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherAttendanceAdmin;
