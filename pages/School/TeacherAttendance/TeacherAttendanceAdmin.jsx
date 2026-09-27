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
  TableSortLabel,
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
  FileDownloadOutlined,
  SettingsRounded,
} from "@mui/icons-material";

import { useAuthUser } from "react-auth-kit";
import usePermissions from "@/utils/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CSVLink } from "react-csv";


import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

import { getSchoolTeachers } from "@/APIs/school/teachers";

import {
  createManualTeacherAttendance,
  deleteTeacherAttendance,
  fetchAbsentTeachers,
  fetchTeacherAttendanceAdmin,
  fetchTeacherAttendanceSettings,
  fetchTeacherAttendanceSummary,
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

const monthStartKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
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

const extractAttendanceSummary = (response) => {
  if (!response || response?.status === false) {
    return {
      rows: [],
      totalTeachers: 0,
      dateFrom: "",
      dateTo: "",
    };
  }

  let payload = response;

  // يدعم الاستجابة المباشرة:
  // { status, dateFrom, dateTo, totalTeachers, data: [...] }
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
    totalTeachers: Number(
      payload?.totalTeachers ??
        payload?.meta?.totalTeachers ??
        rows.length
    ) || 0,
    dateFrom: payload?.dateFrom || "",
    dateTo: payload?.dateTo || "",
    // What absence is measured against. 3 out of 5 reads very differently
    // from 3 out of 22, and the column is meaningless without it.
    workingDays: Number(payload?.workingDays) || 0,
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

const zonedLocalToIso = (date, time, timeZone = "Asia/Riyadh") => {
  if (!date || !time) return "";

  const [year, month, day] = String(date).split("-").map(Number);
  const [hour, minute, second = 0] = String(time).split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) return "";

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second || 0);

  const getOffset = (timestamp) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(timestamp));

    const read = (type) =>
      Number(parts.find((part) => part.type === type)?.value || 0);

    const asUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      read("second")
    );

    return asUtc - timestamp;
  };

  let result = desiredUtc - getOffset(desiredUtc);
  result = desiredUtc - getOffset(result);
  return new Date(result).toISOString();
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

const emptyManualForm = () => ({
  teacherId: "",
  date: todayKey(),
  checkInAt: "07:45",
  notes: "",
});

const TeacherAttendanceAdmin = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.();
  const currentUser = authState?.user || authState || {};
  const adminName = currentUser?.name || currentUser?.fullName || "الإدارة";
  const currentRole = String(
    currentUser?.role || authState?.role || ""
  ).trim().toUpperCase();

  // Enabling teacher self check-in is the owner's and the school director's:
  // the server refuses teacherCheckInEnabled from anyone else (403). An
  // assistant opens straight on the daily log, as on the staff attendance page.
  const canConfigureAttendance = ["OWNER", "SUPERVISOR"].includes(currentRole);
  const teacherAttendancePermissions = usePermissions("teacherAttendance");
  const canCreateRecords = Boolean(teacherAttendancePermissions.add);
  const canEditRecords = Boolean(teacherAttendancePermissions.edit);
  const canDeleteRecords = Boolean(teacherAttendancePermissions.delete);

  const [tab, setTab] = useState(() => (canConfigureAttendance ? 0 : 1));

  // Settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [teacherCheckInEnabled, setTeacherCheckInEnabled] = useState(false);
  const [schoolLocationConfigured, setSchoolLocationConfigured] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Riyadh");

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

  // Summary report
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryTotalTeachers, setSummaryTotalTeachers] = useState(0);
  const [summaryWorkingDays, setSummaryWorkingDays] = useState(0);
  /*
   * A monthly review is a search for outliers, and the server answers in
   * alphabetical order — which buries them. Sorting is the difference between
   * reading the report and scanning it.
   */
  const [summarySort, setSummarySort] = useState({
    key: "teacherName",
    direction: "asc",
  });
  const [summaryRange, setSummaryRange] = useState({
    dateFrom: monthStartKey(),
    dateTo: todayKey(),
    teacherId: "",
  });

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

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);

    const response = await fetchTeacherAttendanceSettings();
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل إعدادات المدرسة");
      setSettingsLoading(false);
      return;
    }

    const settings = extractSettings(response);

    setTeacherCheckInEnabled(Boolean(settings?.teacherCheckInEnabled));
    setSchoolLocationConfigured(isValidSchoolLocation(settings?.location));
    setTimezone(settings?.timezone || "Asia/Riyadh");

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

    const response = await fetchTeacherAttendanceSummary({
      dateFrom,
      dateTo,
      teacherId: summaryRange.teacherId || undefined,
    });

    setSummaryLoading(false);
    setSummaryLoaded(true);

    if (isFailed(response)) {
      setSummaryRows([]);
      setSummaryTotalTeachers(0);
      setSummaryWorkingDays(0);
      toast.error(response?.message || "تعذر تحميل تقرير حضور المعلمين");
      return;
    }

    const summary = extractAttendanceSummary(response);
    setSummaryRows(summary.rows);
    setSummaryTotalTeachers(summary.totalTeachers);
    setSummaryWorkingDays(summary.workingDays);
  }, [summaryRange]);

  useEffect(() => {
    loadSettings();
    loadTeachers();
  }, [loadSettings, loadTeachers]);

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
          daysAbsent:
            totals.daysAbsent + (Number(row?.daysAbsent) || 0),
          totalLateMinutes:
            totals.totalLateMinutes + (Number(row?.totalLateMinutes) || 0),
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
          daysAbsent: 0,
          totalLateMinutes: 0,
          daysLate: 0,
          daysLeftEarly: 0,
          daysMissingCheckOut: 0,
        }
      ),
    [summaryRows]
  );

  const sortedSummaryRows = useMemo(() => {
    const { key, direction } = summarySort;
    const sign = direction === "desc" ? -1 : 1;

    return [...summaryRows].sort((a, b) => {
      if (key === "teacherName") {
        return (
          sign *
          String(a?.teacherName || "").localeCompare(
            String(b?.teacherName || ""),
            "ar"
          )
        );
      }
      return sign * ((Number(a?.[key]) || 0) - (Number(b?.[key]) || 0));
    });
  }, [summaryRows, summarySort]);

  const toggleSummarySort = useCallback((key) => {
    setSummarySort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        // A name reads best from alif down; every other column is a count
        // somebody is looking for the largest of, so start those at the top.
        : { key, direction: key === "teacherName" ? "asc" : "desc" }
    );
  }, []);

  /*
   * The report as a spreadsheet.
   *
   * Arabic headers survive Excel only with the byte-order mark CSVLink writes
   * by default — without it every column title opens as mojibake, which is
   * how an export gets reported as broken.
   */
  const summaryCsv = useMemo(
    () =>
      sortedSummaryRows.map((row) => ({
        "المعلم": row?.teacherName || "معلم",
        "الحالة": row?.teacherDeleted ? "محذوف" : "حالي",
        "أيام الدوام في الفترة": summaryWorkingDays,
        "أيام الحضور": Number(row?.daysPresent) || 0,
        "أيام الغياب": Number(row?.daysAbsent) || 0,
        "أيام التأخير": Number(row?.daysLate) || 0,
        "إجمالي دقائق التأخير": Number(row?.totalLateMinutes) || 0,
        "أيام الخروج المبكر": Number(row?.daysLeftEarly) || 0,
        "إجمالي دقائق الخروج المبكر":
          Number(row?.totalEarlyLeaveMinutes) || 0,
        "دقائق العمل": Number(row?.totalWorkMinutes) || 0,
        "دقائق العمل المتوقعة": Number(row?.totalExpectedWorkMinutes) || 0,
        "أيام بدون انصراف": Number(row?.daysMissingCheckOut) || 0,
        "أيام تأخير غير مقاس": Number(row?.daysLatenessNotTracked) || 0,
        "أيام خروج غير مقاس": Number(row?.daysEarlyLeaveNotTracked) || 0,
        "دوام في إجازة": Number(row?.daysOnDayOff) || 0,
      })),
    [sortedSummaryRows, summaryWorkingDays]
  );

  const summaryFileName = useMemo(
    () =>
      `تقرير-حضور-المعلمين-${summaryRange.dateFrom || "بداية"}-${
        summaryRange.dateTo || "نهاية"
      }.csv`,
    [summaryRange.dateFrom, summaryRange.dateTo]
  );

  const saveSettings = async () => {
    if (!canConfigureAttendance) return;
    if (teacherCheckInEnabled && !schoolLocationConfigured) {
      toast.error(
        "حدد موقع المدرسة من إعدادات المدرسة أولًا قبل تفعيل حضور المعلمين."
      );
      return;
    }

    setSettingsSaving(true);

    const response = await updateTeacherAttendanceSettings({
      teacherCheckInEnabled,
    });

    setSettingsSaving(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حفظ إعداد حضور المعلمين");
      return;
    }

    toast.success("تم حفظ إعداد حضور المعلمين");
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

    const checkInAt = zonedLocalToIso(
      manualForm.date,
      manualForm.checkInAt,
      timezone
    );

    if (!checkInAt) {
      toast.error("وقت الحضور غير صالح");
      return;
    }

    setManualSaving(true);
    const response = await createManualTeacherAttendance({
      ...manualForm,
      checkInAt,
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
    const response = await updateTeacherAttendance(id, payload);
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
                تفعيل الحضور والانصراف الذاتي للمعلمين
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#708198", fontSize: 10, lineHeight: 1.7 }}>
                هنا يتم تفعيل حضور المعلمين فقط. موقع المدرسة ونطاق التحقق والشبكة وجدول الدوام يتم ضبطهم مرة واحدة من إعدادات المدرسة.
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

          {teacherCheckInEnabled && !schoolLocationConfigured && (
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
            حفظ تفعيل المعلمين
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
                  <TableCell align="right">سبب التأخير</TableCell>
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
                    <TableCell colSpan={14} align="center" sx={{ py: 6, color: "#708198" }}>
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
                        <TableCell align="right">{formatTime(record?.checkInAt, timezone)}</TableCell>
                        <TableCell align="right">{formatTime(record?.checkOutAt, timezone)}</TableCell>
                        <TableCell align="right">
                          {record?.lateMinutes === null || record?.lateMinutes === undefined
                            ? "غير مقاس"
                            : formatMinutes(record.lateMinutes)}
                        </TableCell>
                        {/*
                          The teacher's own account of the lateness. It was
                          being stored and shown nowhere: a director saw "20
                          minutes" and an explanation existed one table away
                          that nothing displayed.
                        */}
                        <TableCell align="right" sx={{ maxWidth: 220 }}>
                          {record?.lateReason ? (
                            <Tooltip title={record.lateReason} arrow>
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {record.lateReason}
                              </Typography>
                            </Tooltip>
                          ) : (record?.lateMinutes ?? 0) > 0 ? (
                            <Chip
                              size="small"
                              label="لم يُذكر بعد"
                              sx={{
                                fontSize: 8.5,
                                height: 18,
                                color: "#9A6B12",
                                backgroundColor: "#FFF3D8",
                                fontWeight: 800,
                              }}
                            />
                          ) : (
                            <Typography sx={{ color: "#B6C0CC", fontSize: 10 }}>
                              —
                            </Typography>
                          )}
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
              تقرير حضور المعلمين
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
              lg: "1fr 1fr 1.25fr auto",
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
            label="المعلم"
            value={summaryRange.teacherId}
            onChange={(event) =>
              setSummaryRange((current) => ({
                ...current,
                teacherId: event.target.value,
              }))
            }
            size="small"
            fullWidth
          >
            <MenuItem value="">كل المعلمين</MenuItem>
            {teachers.map((teacher, index) => (
              <MenuItem
                key={normalizeId(teacher) || index}
                value={normalizeId(teacher)}
              >
                {getTeacherName(teacher)}
              </MenuItem>
            ))}
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

        {summaryLoaded && summaryRows.length > 0 ? (
          <Box sx={{ mt: 1.2, display: "flex", justifyContent: "flex-start" }}>
            <Box
              component={CSVLink}
              data={summaryCsv}
              filename={summaryFileName}
              sx={{ display: "inline-flex", textDecoration: "none" }}
            >
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlined />}
                sx={{ minHeight: 40, px: 2.2, borderRadius: "11px", fontWeight: 800 }}
              >
                {`تصدير التقرير (${summaryRows.length} معلم)`}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            lg: "repeat(6,minmax(0,1fr))",
          },
          gap: 1,
        }}
      >
        {[
          ["المعلمين في التقرير", summaryTotalTeachers],
          ["أيام الدوام في الفترة", summaryWorkingDays],
          ["أيام الحضور", summaryTotals.daysPresent],
          ["أيام الغياب", summaryTotals.daysAbsent],
          ["أيام التأخير", summaryTotals.daysLate],
          ["إجمالي التأخير", formatMinutes(summaryTotals.totalLateMinutes, { duration: true })],
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
        "غير مقاس" لا يعني أن المعلم حضر أو انصرف في الموعد؛ بل يعني أن جدول
        المدرسة لم يكن يحتوي على وقت بداية أو نهاية يمكن القياس عليه في ذلك اليوم.
      </Alert>

      <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
        {summaryLoading ? (
          <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 1520 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(36,74,112,.035)" }}>
                  {[
                    ["teacherName", "المعلم", "right"],
                    [null, "الحالة", "center"],
                    ["daysPresent", "أيام الحضور", "center"],
                    ["daysAbsent", "أيام الغياب", "center"],
                    ["daysLate", "أيام التأخير", "center"],
                    ["totalLateMinutes", "إجمالي التأخير", "center"],
                    ["daysLeftEarly", "الخروج المبكر", "center"],
                    ["totalEarlyLeaveMinutes", "إجمالي الخروج المبكر", "center"],
                    [null, "العمل / المتوقع", "right"],
                    ["daysMissingCheckOut", "بدون انصراف", "center"],
                    [null, "تأخير غير مقاس", "center"],
                    [null, "خروج غير مقاس", "center"],
                    [null, "دوام في إجازة", "center"],
                  ].map(([key, title, align]) => (
                    <TableCell key={title} align={align}>
                      {key ? (
                        <TableSortLabel
                          active={summarySort.key === key}
                          direction={
                            summarySort.key === key ? summarySort.direction : "desc"
                          }
                          onClick={() => toggleSummarySort(key)}
                        >
                          {title}
                        </TableSortLabel>
                      ) : (
                        title
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {!summaryLoaded ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 7, color: "#708198" }}>
                      اختر الفترة ثم اضغط «عرض التقرير».
                    </TableCell>
                  </TableRow>
                ) : !summaryRows.length ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 7, color: "#708198" }}>
                      لا توجد بيانات حضور في الفترة المحددة.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSummaryRows.map((row, index) => (
                    <TableRow
                      key={normalizeId(row?.teacherId) || `${row?.teacherName || "teacher"}-${index}`}
                      hover
                    >
                      <TableCell align="right">
                        <Typography sx={{ color: "#122F4D", fontSize: 11, fontWeight: 900 }}>
                          {row?.teacherName || "معلم"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row?.teacherDeleted ? "محذوف" : "حالي"}
                          sx={{
                            color: row?.teacherDeleted ? "#A44343" : "#237449",
                            backgroundColor: row?.teacherDeleted
                              ? "rgba(201,79,79,.12)"
                              : "rgba(116,201,154,.17)",
                            fontWeight: 800,
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {Number(row?.daysPresent) || 0}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={Number(row?.daysAbsent) || 0}
                          sx={{
                            color: Number(row?.daysAbsent) > 0 ? "#A44343" : "#237449",
                            backgroundColor: Number(row?.daysAbsent) > 0
                              ? "rgba(201,79,79,.12)"
                              : "rgba(116,201,154,.12)",
                            fontWeight: 800,
                          }}
                        />
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
              <Back title="حضور المعلمين" />
              <Typography sx={{ mt: 0.5, color: "#708198", fontSize: 10 }}>
                إعداد التسجيل الذاتي ومراجعة سجل حضور المعلمين والإدخالات اليدوية والتقارير.
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
