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
  AssessmentRounded,
  DeleteOutlineRounded,
  EditRounded,
  GpsFixedRounded,
  PersonOffRounded,
  RefreshRounded,
  SaveRounded,
  SettingsRounded,
} from "@mui/icons-material";

import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import usePermissions from "@/utils/hooks/usePermissions";

import {
  createManualStaffAttendance,
  deleteStaffAttendance,
  fetchAbsentStaff,
  fetchStaffAttendanceAdmin,
  fetchStaffAttendanceSettings,
  fetchStaffAttendanceSummary,
  fetchStaffDirectory,
  updateStaffAttendance,
  updateStaffAttendanceSettings,
} from "@/APIs/school/staffAttendance";

const PAGE_LIMIT = 10;

const dateKey = (timeZone = "Asia/Riyadh", date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${read("year")}-${read("month")}-${read("day")}`;
};

const todayKey = (timeZone = "Asia/Riyadh") => dateKey(timeZone);

const monthStartKey = (timeZone = "Asia/Riyadh") => {
  const today = todayKey(timeZone);
  return `${today.slice(0, 7)}-01`;
};

const zonedLocalToIso = (date, time, timeZone = "Asia/Riyadh") => {
  if (!date || !time) return "";
  const [year, month, day] = String(date).split("-").map(Number);
  const [hour, minute, second = 0] = String(time).split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return "";

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second || 0);
  const getOffset = (timestamp) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(timestamp));
    const read = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    const asUtc = Date.UTC(
      read("year"), read("month") - 1, read("day"),
      read("hour"), read("minute"), read("second")
    );
    return asUtc - timestamp;
  };

  let result = desiredUtc - getOffset(desiredUtc);
  result = desiredUtc - getOffset(result);
  return new Date(result).toISOString();
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

const extractStaff = (response) => {
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
      payload?.staffMembers;

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
  if (!response || response?.status === false) return { rows: [], meta: {} };
  if (Array.isArray(response?.data)) {
    return { rows: response.data, meta: response?.meta || {} };
  }
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.data)) {
    return { rows: payload.data, meta: payload?.meta || response?.meta || {} };
  }
  return { rows: [], meta: response?.meta || payload?.meta || {} };
};

const extractAbsent = (response) => {
  if (!response || response?.status === false) {
    return { staffMembers: [], isWorkingDay: true, message: "" };
  }
  const payload = response?.data && !Array.isArray(response.data)
    ? response.data
    : response;
  return {
    staffMembers: Array.isArray(payload?.absentStaff) ? payload.absentStaff : [],
    isWorkingDay: payload?.isWorkingDay !== false,
    message: payload?.message || "",
  };
};

const extractAttendanceSummary = (response) => {
  if (!response || response?.status === false) {
    return {
      rows: [],
      totalStaff: 0,
      dateFrom: "",
      dateTo: "",
    };
  }

  let payload = response;

  // يدعم الاستجابة المباشرة:
  // { status, dateFrom, dateTo, totalStaff, data: [...] }
  // وأي wrapper محتمل حولها.
  for (let index = 0; index < 3; index += 1) {
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload?.data &&
      !Array.isArray(payload.data) &&
      Array.isArray(payload.data?.data)
    ) {
      payload = payload.data;
      continue;
    }

    break;
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

  return {
    rows,
    totalStaff: Number(
      payload?.totalStaff ??
        payload?.meta?.totalStaff ??
        rows.length
    ) || 0,
    dateFrom: payload?.dateFrom || "",
    dateTo: payload?.dateTo || "",
  };
};

const getStaffEntity = (record) => record || {};

const getStaffName = (recordOrStaff) =>
  recordOrStaff?.name ||
  recordOrStaff?.username ||
  recordOrStaff?.fullName ||
  recordOrStaff?.email ||
  "إداري / مشرف";

const getStaffId = (item) =>
  normalizeId(
    item?.staffId ||
      item?.staff ||
      item?._id ||
      item?.id ||
      ""
  );

const roleLabel = (role) =>
  String(role || "").toUpperCase() === "SUPERVISOR" ? "مشرف" : "مدير / إداري";

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

const METHOD_LABELS = { location: "ذاتي", manual: "يدوي" };

const formatTime = (value, timeZone = "Asia/Riyadh") => {
  if (!value) return "—";
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  return text;
};

const formatTimeForInput = (value, timeZone = "Asia/Riyadh") => {
  if (!value) return "";

  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
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


const verificationLabel = (value) => {
  if (!value) return "—";
  const gps = Boolean(value?.gps);
  const network = Boolean(value?.network);
  if (gps && network) return "GPS + شبكة";
  if (gps) return "GPS فقط";
  if (network) return "شبكة فقط";
  return "غير متحقق";
};

const getRecordId = (record) => normalizeId(record);

const isFailed = (response) =>
  response?.status === false || Number(response?.statusCode) >= 400;

const isValidSchoolLocation = (location) => {
  const latitude = Number(location?.lat);
  const longitude = Number(location?.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  const insideValidRange =
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return insideValidRange && !(latitude === 0 && longitude === 0);
};

const pageCardSx = {
  border: "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream, #FFFCF7)",
  boxShadow: "0 12px 28px rgba(18,47,77,0.06)",
};

const emptyManualForm = (timeZone = "Asia/Riyadh") => ({
  staffId: "",
  date: todayKey(timeZone),
  checkInAt: "07:45",
  checkOutAt: "",
  notes: "",
});

const StaffAttendanceAdmin = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.();
  const currentUser = authState?.user || authState || {};
  const adminName = currentUser?.name || currentUser?.fullName || "الإدارة";
  const currentUserId = normalizeId(
    currentUser?.userId ||
      currentUser?._id ||
      currentUser?.id ||
      currentUser?.sub ||
      ""
  );
  const currentRole = String(
    currentUser?.role || authState?.role || ""
  ).trim().toUpperCase();

  const staffAttendancePermissions = usePermissions("staffAttendance");
  const canCreateRecords = Boolean(staffAttendancePermissions.add);
  const canEditRecords = Boolean(staffAttendancePermissions.edit);
  const canDeleteRecords = Boolean(staffAttendancePermissions.delete);
  const canConfigureAttendance = ["OWNER", "SUPERVISOR"].includes(currentRole);

  const navigate = useNavigate();

  const [tab, setTab] = useState(() => (canConfigureAttendance ? 0 : 1));

  // Settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [staffCheckInEnabled, setStaffCheckInEnabled] = useState(false);
  const [schoolLocationConfigured, setSchoolLocationConfigured] = useState(false);

  // Admin list
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [absentStaff, setAbsentStaff] = useState([]);
  const [absentDayInfo, setAbsentDayInfo] = useState({
    isWorkingDay: true,
    message: "",
  });
  const [showAbsent, setShowAbsent] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [timezone, setTimezone] = useState("Asia/Riyadh");

  // Summary report
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryTotalStaff, setSummaryTotalStaff] = useState(0);
  const [summaryRange, setSummaryRange] = useState({
    dateFrom: monthStartKey("Asia/Riyadh"),
    dateTo: todayKey("Asia/Riyadh"),
    staffId: "",
    role: "",
  });

  // Manual create
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualForm, setManualForm] = useState(() => emptyManualForm("Asia/Riyadh"));

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({ checkInAt: "", checkOutAt: "", notes: "" });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const today = useMemo(() => todayKey(timezone), [timezone]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);

    const response = await fetchStaffAttendanceSettings();
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل إعدادات المدرسة");
      setSettingsLoading(false);
      return;
    }

    const settings = extractSettings(response);

    setStaffCheckInEnabled(settings?.staffCheckInEnabled === true);
    setSchoolLocationConfigured(isValidSchoolLocation(settings?.location));

    const nextTimezone = settings?.timezone || "Asia/Riyadh";
    setTimezone(nextTimezone);
    setSummaryRange((current) => ({
      ...current,
      dateFrom: monthStartKey(nextTimezone),
      dateTo: todayKey(nextTimezone),
    }));

    setSettingsLoading(false);
  }, []);

  const loadStaff = useCallback(async () => {
    const response = await fetchStaffDirectory();
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل قائمة الإداريين والمشرفين");
      return;
    }
    setStaffMembers(extractStaff(response));
  }, []);

  const loadAbsent = useCallback(async () => {
    const response = await fetchAbsentStaff({ date: today });

    if (response?.status === false) {
      return;
    }

    const absentData = extractAbsent(response);

    setAbsentStaff(absentData.staffMembers);
    setAbsentDayInfo({
      isWorkingDay: absentData.isWorkingDay,
      message: absentData.message,
    });

    if (!absentData.isWorkingDay) {
      setShowAbsent(false);
    }
  }, [today]);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);

    const params = {
      page,
      limit: PAGE_LIMIT,
      ...(filter === "manual" ? { method: "manual" } : {}),
      ...(filter === "today" ? { date: today } : {}),
      ...(staffFilter ? { staffId: staffFilter } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    };

    const response = await fetchStaffAttendanceAdmin(params);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل سجل حضور الإداريين والمشرفين");
      setRecords([]);
      setMeta({});
      setRecordsLoading(false);
      return;
    }

    const pageData = extractAttendancePage(response);
    setRecords(pageData.rows);
    setMeta(pageData.meta);
    setRecordsLoading(false);
  }, [filter, page, staffFilter, roleFilter, today]);

  const loadSummary = useCallback(async () => {
    const dateFrom = String(summaryRange.dateFrom || "").trim();
    const dateTo = String(summaryRange.dateTo || "").trim();

    if (!dateFrom || !dateTo) {
      toast.error("حدد تاريخ البداية وتاريخ النهاية");
      return;
    }

    if (dateFrom > dateTo) {
      toast.error("تاريخ البداية يجب أن يكون قبل أو مساويًا لتاريخ النهاية");
      return;
    }

    setSummaryLoading(true);

    const response = await fetchStaffAttendanceSummary({
      dateFrom,
      dateTo,
      staffId: summaryRange.staffId || undefined,
      role: summaryRange.role || undefined,
    });

    setSummaryLoading(false);
    setSummaryLoaded(true);

    if (isFailed(response)) {
      setSummaryRows([]);
      setSummaryTotalStaff(0);
      toast.error(response?.message || "تعذر تحميل تقرير حضور الإداريين والمشرفين");
      return;
    }

    const summary = extractAttendanceSummary(response);
    setSummaryRows(summary.rows);
    setSummaryTotalStaff(summary.totalStaff);
  }, [summaryRange]);

  useEffect(() => {
    loadSettings();
    loadStaff();
  }, [loadSettings, loadStaff]);

  useEffect(() => {
    loadRecords();
    loadAbsent();
  }, [loadRecords, loadAbsent]);

  useEffect(() => {
    if (tab === 2 && !summaryLoaded) {
      loadSummary();
    }
  }, [tab, summaryLoaded, loadSummary]);

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

  const summaryTotals = useMemo(
    () =>
      summaryRows.reduce(
        (totals, row) => ({
          daysPresent:
            totals.daysPresent + (Number(row?.daysPresent) || 0),
          daysLate:
            totals.daysLate + (Number(row?.daysLate) || 0),
          daysLeftEarly:
            totals.daysLeftEarly + (Number(row?.daysLeftEarly) || 0),
          daysMissingCheckOut:
            totals.daysMissingCheckOut +
            (Number(row?.daysMissingCheckOut) || 0),
        }),
        {
          daysPresent: 0,
          daysLate: 0,
          daysLeftEarly: 0,
          daysMissingCheckOut: 0,
        }
      ),
    [summaryRows]
  );

  const saveSettings = async () => {
    if (staffCheckInEnabled && !schoolLocationConfigured) {
      toast.error(
        "حدد موقع المدرسة من إعدادات المدرسة أولًا قبل تفعيل حضور الإداريين والمشرفين."
      );
      return;
    }

    setSettingsSaving(true);

    // Only this flag belongs to the staff attendance screen.
    // Shared attendance settings are edited once from School Settings.
    const response = await updateStaffAttendanceSettings({
      staffCheckInEnabled,
    });

    setSettingsSaving(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حفظ إعداد حضور الإداريين والمشرفين");
      return;
    }

    toast.success("تم حفظ إعداد حضور الإداريين والمشرفين");
    await loadSettings();
  };

  const openManualDialog = () => {
    setManualForm(emptyManualForm(timezone));
    setManualOpen(true);
  };

  const createManualRecord = async () => {
    if (!manualForm.staffId) {
      toast.error("اختر الإداري / المشرف");
      return;
    }

    if (currentUserId && normalizeId(manualForm.staffId) === currentUserId) {
      toast.error("لا يمكن تسجيل حضورك يدويًا من شاشة الإدارة");
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

    if (manualForm.checkOutAt && manualForm.checkOutAt < manualForm.checkInAt) {
      toast.error("وقت الانصراف لا يمكن أن يسبق وقت الحضور");
      return;
    }

    const checkInAt = zonedLocalToIso(
      manualForm.date, manualForm.checkInAt, timezone
    );
    const checkOutAt = manualForm.checkOutAt
      ? zonedLocalToIso(manualForm.date, manualForm.checkOutAt, timezone)
      : "";

    setManualSaving(true);
    const response = await createManualStaffAttendance({
      ...manualForm,
      checkInAt,
      ...(checkOutAt ? { checkOutAt } : {}),
    });
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
      checkInAt: formatTimeForInput(record?.checkInAt, timezone),
      checkOutAt: formatTimeForInput(record?.checkOutAt, timezone),
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

    if (editForm.checkOutAt && editForm.checkOutAt < editForm.checkInAt) {
      toast.error("وقت الانصراف لا يمكن أن يسبق وقت الحضور");
      return;
    }

    const recordDate = normalizeRecordDate(selectedRecord);
    const originalCheckInAt = formatTimeForInput(selectedRecord?.checkInAt, timezone);
    const originalCheckOutAt = formatTimeForInput(selectedRecord?.checkOutAt, timezone);
    const payload = {
      notes: editForm.notes,
    };

    if (editForm.checkInAt !== originalCheckInAt) {
      payload.checkInAt = zonedLocalToIso(
        recordDate,
        editForm.checkInAt,
        timezone
      );
    }

    if (editForm.checkOutAt && editForm.checkOutAt !== originalCheckOutAt) {
      payload.checkOutAt = zonedLocalToIso(
        recordDate,
        editForm.checkOutAt,
        timezone
      );
    }

    setEditSaving(true);
    const response = await updateStaffAttendance(id, payload);
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
    const response = await deleteStaffAttendance(id);
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
                تفعيل الحضور والانصراف الذاتي للإداريين والمشرفين
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10, lineHeight: 1.7 }}>
                هنا يتم تفعيل حضور الإداريين والمشرفين فقط. موقع المدرسة ونطاق التحقق والشبكة وجدول الدوام يتم ضبطهم مرة واحدة من إعدادات المدرسة.
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={staffCheckInEnabled}
                  onChange={(event) => setStaffCheckInEnabled(event.target.checked)}
                />
              }
              label={staffCheckInEnabled ? "مفعّل" : "متوقف"}
            />
          </Stack>

          {staffCheckInEnabled && !schoolLocationConfigured && (
            <Alert severity="warning" sx={{ mt: 1.2, borderRadius: "12px" }}>
              موقع المدرسة غير مضبوط. اضبطه من «إعدادات المدرسة» أولًا ثم فعّل تسجيل الحضور.
            </Alert>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, p: { xs: 1.5, md: 2 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.2}
          >
            <Box>
              <Typography sx={{ color: "#122F4D", fontSize: 14, fontWeight: 900 }}>
                إعدادات الموقع والحضور المشتركة
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10, lineHeight: 1.7 }}>
                يتم تعديل الموقع، نصف قطر القبول، شبكة المدرسة وجدول الدوام من إعدادات المدرسة فقط حتى تستخدمها كل فئات الحضور بنفس القيم.
              </Typography>
            </Box>

            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate("/school/settings")}
              startIcon={<SettingsRounded />}
              sx={{ borderRadius: "11px", whiteSpace: "nowrap" }}
            >
              فتح إعدادات المدرسة
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
            حفظ تفعيل الإداريين والمشرفين
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
            {canCreateRecords && (
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
            )}
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
                  ? `${absentStaff.length} إداري / مشرف بدون سجل حضور اليوم`
                  : absentDayInfo.message ||
                    "هذا اليوم إجازة رسمية للمدرسة"}
              </Typography>
              <Typography sx={{ color: "#8B6262", fontSize: 9 }}>
                {absentDayInfo.isWorkingDay
                  ? "اضغط لعرض القائمة"
                  : "لا يتم احتساب غياب الإداريين والمشرفين في يوم الإجازة"}
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
            {!absentStaff.length ? (
              <Typography sx={{ color: "#708198", fontSize: 10 }}>
                كل الإداريين والمشرفين لديهم سجل حضور اليوم.
              </Typography>
            ) : (
              absentStaff.map((teacher, index) => (
                <Chip
                  key={getStaffId(teacher) || index}
                  label={getStaffName(teacher)}
                  sx={{ backgroundColor: "#fff" }}
                />
              ))
            )}
          </Stack>
        </Collapse>
      </Paper>

      <Paper elevation={0} sx={{ ...pageCardSx, p: 1.2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 210px 180px" },
            gap: 1,
            alignItems: "center",
          }}
        >
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

          <TextField
            select
            size="small"
            label="الشخص"
            value={staffFilter}
            onChange={(event) => { setStaffFilter(event.target.value); setPage(1); }}
          >
            <MenuItem value="">الكل</MenuItem>
            {staffMembers.map((member, index) => (
              <MenuItem key={getStaffId(member) || index} value={getStaffId(member)}>
                {getStaffName(member)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="الدور"
            value={roleFilter}
            onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}
          >
            <MenuItem value="">الكل</MenuItem>
            <MenuItem value="MANAGER">مدير / إداري</MenuItem>
            <MenuItem value="SUPERVISOR">مشرف</MenuItem>
          </TextField>
        </Box>
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
                  <TableCell align="right">الإداري / المشرف</TableCell>
                  <TableCell align="right">التاريخ</TableCell>
                  <TableCell align="right">الحضور</TableCell>
                  <TableCell align="right">الانصراف</TableCell>
                  <TableCell align="right">التأخير</TableCell>
                  <TableCell align="right">مدة العمل</TableCell>
                  <TableCell align="right">طريقة الانصراف</TableCell>
                  <TableCell align="right">طريقة الحضور</TableCell>
                  <TableCell align="right">تحقق الحضور</TableCell>
                  <TableCell align="right">تحقق الانصراف</TableCell>
                  <TableCell align="right">المسافة ح/ص</TableCell>
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
                    const staff = getStaffEntity(record);
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
                              {getStaffName(staff)}
                            </Typography>
                            <Typography sx={{ color: "#708198", fontSize: 8.5 }}>
                              {roleLabel(record?.role)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{normalizeRecordDate(record) || "—"}</TableCell>
                        <TableCell align="right">{formatTime(record?.checkInAt, timezone)}</TableCell>
                        <TableCell align="right">{formatTime(record?.checkOutAt, timezone)}</TableCell>
                        <TableCell align="right">
                          {record?.lateMinutes === null || record?.lateMinutes === undefined
                            ? "غير مقاس"
                            : formatMinutes(record.lateMinutes)}
                        </TableCell>
                        <TableCell align="right">
                          {formatMinutes(record?.workMinutes, { duration: true })}
                        </TableCell>
                        <TableCell align="right">{METHOD_LABELS[record?.checkOutMethod] || record?.checkOutMethod || "—"}</TableCell>
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
                        <TableCell align="right">{verificationLabel(record?.verification)}</TableCell>
                        <TableCell align="right">
                          {record?.checkOutAt ? verificationLabel(record?.checkOutVerification) : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {`${record?.distanceMeters == null ? "—" : `${Math.round(Number(record.distanceMeters) || 0)}م`} / ${record?.checkOutDistanceMeters == null ? "—" : `${Math.round(Number(record.checkOutDistanceMeters) || 0)}م`}`}
                        </TableCell>
                        <TableCell align="right">
                          {manual ? getRecordedByName(record) : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {currentUserId && getStaffId(record) === currentUserId ? (
                            <Typography sx={{ color: "#98A2B3", fontSize: 11 }}>—</Typography>
                          ) : canEditRecords || canDeleteRecords ? (
                            <Stack direction="row" justifyContent="center" spacing={0.2}>
                              {canEditRecords && (
                                <Tooltip title="تعديل">
                                  <IconButton size="small" onClick={() => openEditDialog(record)}>
                                    <EditRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canDeleteRecords && (
                                <Tooltip title="حذف">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDeleteDialog(record)}
                                    sx={{ color: "#C94848" }}
                                  >
                                    <DeleteOutlineRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          ) : (
                            <Typography sx={{ color: "#98A2B3", fontSize: 11 }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && filter !== "weak" && (
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


  const renderSummary = () => (
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
              تقرير حضور الإداريين والمشرفين
            </Typography>
            <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10 }}>
              ملخص الحضور والتأخير والخروج المبكر وساعات العمل خلال فترة محددة.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={loadSummary}
            disabled={summaryLoading}
            startIcon={
              summaryLoading
                ? <CircularProgress size={15} />
                : <RefreshRounded />
            }
            sx={{ borderRadius: "11px" }}
          >
            {summaryLoading ? "جارٍ تحميل التقرير" : "تحديث التقرير"}
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "1fr 1fr 1.25fr 1fr auto",
            },
            gap: 1,
            alignItems: "center",
          }}
        >
          <TextField
            type="date"
            label="من تاريخ"
            value={summaryRange.dateFrom}
            onChange={(event) =>
              setSummaryRange((current) => ({
                ...current,
                dateFrom: event.target.value,
              }))
            }
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />

          <TextField
            type="date"
            label="إلى تاريخ"
            value={summaryRange.dateTo}
            onChange={(event) =>
              setSummaryRange((current) => ({
                ...current,
                dateTo: event.target.value,
              }))
            }
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />

          <TextField
            select
            label="الإداري / المشرف"
            value={summaryRange.staffId}
            onChange={(event) =>
              setSummaryRange((current) => ({
                ...current,
                staffId: event.target.value,
              }))
            }
            size="small"
            fullWidth
          >
            <MenuItem value="">كل الإداريين والمشرفين</MenuItem>
            {staffMembers.map((teacher, index) => (
              <MenuItem
                key={getStaffId(teacher) || index}
                value={getStaffId(teacher)}
              >
                {getStaffName(teacher)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="الدور"
            value={summaryRange.role}
            onChange={(event) =>
              setSummaryRange((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
            size="small"
            fullWidth
          >
            <MenuItem value="">كل الأدوار</MenuItem>
            <MenuItem value="MANAGER">مدير / إداري</MenuItem>
            <MenuItem value="SUPERVISOR">مشرف</MenuItem>
          </TextField>

          <Button
            variant="contained"
            onClick={loadSummary}
            disabled={summaryLoading}
            startIcon={
              summaryLoading
                ? <CircularProgress size={15} color="inherit" />
                : <AssessmentRounded />
            }
            sx={{
              minHeight: 40,
              px: 2.2,
              color: "#122F4D",
              backgroundColor: "#F2D792",
              boxShadow: "none",
              borderRadius: "11px",
              fontWeight: 900,
              "&:hover": {
                backgroundColor: "#E8C96F",
                boxShadow: "none",
              },
            }}
          >
            عرض التقرير
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            lg: "repeat(5,minmax(0,1fr))",
          },
          gap: 1,
        }}
      >
        {[
          ["الإداريين والمشرفين في التقرير", summaryTotalStaff],
          ["أيام الحضور", summaryTotals.daysPresent],
          ["أيام التأخير", summaryTotals.daysLate],
          ["أيام الخروج المبكر", summaryTotals.daysLeftEarly],
          ["بدون انصراف", summaryTotals.daysMissingCheckOut],
        ].map(([label, value]) => (
          <Paper
            key={label}
            elevation={0}
            sx={{
              ...pageCardSx,
              p: 1.35,
              backgroundColor: "#fff",
            }}
          >
            <Typography sx={{ color: "#708198", fontSize: 9, fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "#122F4D",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Alert severity="info" sx={{ borderRadius: "14px" }}>
        "غير مقاس" لا يعني أن الإداري / المشرف حضر أو انصرف في الموعد؛ بل يعني أن جدول
        المدرسة لم يكن يحتوي على وقت بداية أو نهاية يمكن القياس عليه في ذلك اليوم.
      </Alert>

      <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
        {summaryLoading ? (
          <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 1380 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(36,74,112,.035)" }}>
                  <TableCell align="right">الإداري / المشرف</TableCell>
                  <TableCell align="center">الحالة</TableCell>
                  <TableCell align="center">أيام الحضور</TableCell>
                  <TableCell align="center">أيام التأخير</TableCell>
                  <TableCell align="center">إجمالي التأخير</TableCell>
                  <TableCell align="center">الخروج المبكر</TableCell>
                  <TableCell align="center">إجمالي الخروج المبكر</TableCell>
                  <TableCell align="right">العمل / المتوقع</TableCell>
                  <TableCell align="center">بدون انصراف</TableCell>
                  <TableCell align="center">تأخير غير مقاس</TableCell>
                  <TableCell align="center">خروج غير مقاس</TableCell>
                  <TableCell align="center">دوام في إجازة</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {!summaryLoaded ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 7, color: "#708198" }}>
                      اختر الفترة ثم اضغط «عرض التقرير».
                    </TableCell>
                  </TableRow>
                ) : !summaryRows.length ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 7, color: "#708198" }}>
                      لا توجد بيانات حضور في الفترة المحددة.
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryRows.map((row, index) => (
                    <TableRow
                      key={normalizeId(row?.staffId) || `${row?.name || "staff"}-${index}`}
                      hover
                    >
                      <TableCell align="right">
                        <Typography sx={{ color: "#122F4D", fontSize: 11, fontWeight: 900 }}>
                          {row?.name || "إداري / مشرف"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={roleLabel(row?.role)}
                          sx={{
                            color: "#244A70",
                            backgroundColor: "rgba(36,74,112,.08)",
                            fontWeight: 800,
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {Number(row?.daysPresent) || 0}
                      </TableCell>
                      <TableCell align="center">
                        {Number(row?.daysLate) || 0}
                      </TableCell>
                      <TableCell align="center">
                        {formatMinutes(Number(row?.totalLateMinutes) || 0)}
                      </TableCell>
                      <TableCell align="center">
                        {Number(row?.daysLeftEarly) || 0}
                      </TableCell>
                      <TableCell align="center">
                        {formatMinutes(Number(row?.totalEarlyLeaveMinutes) || 0)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography sx={{ fontSize: 9.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                          {formatMinutes(row?.totalWorkMinutes, { duration: true })}
                          {" من "}
                          {formatMinutes(row?.totalExpectedWorkMinutes, { duration: true })}
                          {" متوقعة"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={Number(row?.daysMissingCheckOut) || 0}
                          sx={{
                            color: Number(row?.daysMissingCheckOut) > 0 ? "#A44343" : "#237449",
                            backgroundColor: Number(row?.daysMissingCheckOut) > 0
                              ? "rgba(201,79,79,.12)"
                              : "rgba(116,201,154,.12)",
                            fontWeight: 800,
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {Number(row?.daysLatenessNotTracked) || 0}
                      </TableCell>
                      <TableCell align="center">
                        {Number(row?.daysEarlyLeaveNotTracked) || 0}
                      </TableCell>
                      <TableCell align="center">
                        {Number(row?.daysOnDayOff) || 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
              <Back title="حضور الإداريين والمشرفين" />
              <Typography sx={{ mt: 0.5, color: "#708198", fontSize: 10 }}>
                إعداد التسجيل الذاتي ومراجعة سجل حضور الإداريين والمشرفين والإدخالات اليدوية والتقارير.
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
            {canConfigureAttendance && (
              <Tab value={0} icon={<SettingsRounded />} iconPosition="start" label="إعدادات الحضور" />
            )}
            <Tab value={1} icon={<GpsFixedRounded />} iconPosition="start" label="سجل الحضور اليومي" />
            <Tab value={2} icon={<AssessmentRounded />} iconPosition="start" label="تقرير الحضور" />
          </Tabs>
        </Paper>

        {tab === 0
          ? renderSettings()
          : tab === 1
            ? renderLog()
            : renderSummary()}
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
              label="الإداري / المشرف"
              value={manualForm.staffId}
              onChange={(event) =>
                setManualForm((previous) => ({ ...previous, staffId: event.target.value }))
              }
              fullWidth
              required
            >
              <MenuItem value="" disabled>اختر الإداري / المشرف</MenuItem>
              {staffMembers
                .filter((member) => !currentUserId || getStaffId(member) !== currentUserId)
                .map((teacher, index) => (
                  <MenuItem key={getStaffId(teacher) || index} value={getStaffId(teacher)}>
                    {getStaffName(teacher)}
                  </MenuItem>
                ))}
            </TextField>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
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
              <TextField
                type="time"
                label="وقت الانصراف (اختياري)"
                value={manualForm.checkOutAt}
                onChange={(event) =>
                  setManualForm((previous) => ({ ...previous, checkOutAt: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
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
            سيتم حذف سجل {getStaffName(selectedRecord || {})} نهائيًا.
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

export default StaffAttendanceAdmin;
