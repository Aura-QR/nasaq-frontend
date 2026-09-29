import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  GroupsRounded,
  RefreshRounded,
  SaveRounded,
  SchoolRounded,
} from "@mui/icons-material";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchLectureAttendanceSheet } from "@/APIs/school/attendance";
import { saveDailyTrackingBulk } from "@/APIs/school/dailyTracking";
import { fetchLectures } from "@/APIs/school/lectures";
import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-SA-u-nu-latn";
const DAY_LABELS = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(normalizeId(value));

const formatLocalDate = (date = new Date()) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

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

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getErrorMessage = (response, fallback) =>
  (typeof response === "string" && response) ||
  response?.message ||
  response?.data?.message ||
  response?.error ||
  fallback;

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

const extractLectures = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  return payload?.docs || payload?.lectures || payload?.items || payload?.results || [];
};

const getClassId = (lecture) =>
  normalizeId(lecture?.classId || lecture?.class || lecture?.classroom || lecture?.schoolClass);

const getClassName = (lecture) => {
  const value = lecture?.classId || lecture?.class || lecture?.classroom || lecture?.schoolClass;
  if (!value || typeof value !== "object") return "فصل غير محدد";
  return value?.name || value?.className || value?.title || value?.roomNumber || "فصل غير محدد";
};

const getSubjectName = (lecture) => {
  const offering = lecture?.subjectOfferingId || lecture?.subjectOffering;
  const subject = lecture?.subjectId || lecture?.subject || offering?.subjectId || offering?.subject;
  return subject?.subjectName || subject?.name || offering?.subjectName || lecture?.subjectName || "مادة غير محددة";
};

const getLectureLabel = (lecture) => {
  const day = DAY_LABELS[String(lecture?.dayOfWeek || lecture?.day || "").toLowerCase()] || lecture?.dayOfWeek || "";
  const slot = lecture?.slot || lecture?.period || lecture?.slotNumber;
  return [getSubjectName(lecture), getClassName(lecture), slot ? `الحصة ${slot}` : "", day]
    .filter(Boolean)
    .join(" · ");
};

const normalizeSheet = (response) => {
  const body = response?.data ?? response;
  const data = body?.data ?? body;
  return data && typeof data === "object" ? data : null;
};

const serializeRows = (rows) =>
  JSON.stringify(
    rows.map((row) => ({
      studentId: row.studentId,
      absent: row.absent,
      participation: row.participation,
      homework: row.homework,
      quiz: row.quiz,
    }))
  );

const TrackingRow = memo(function TrackingRow({ row, index, disabled, onChange }) {
  const absent = row.absent === true;
  const quizTitle = row.quiz === null
    ? "لا يوجد اختبار اليوم"
    : row.quiz === true
      ? "اجتازت الاختبار"
      : "لم تجتز الاختبار";

  return (
    <Paper
      elevation={0}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(150px,1fr) repeat(4,58px)", md: "minmax(260px,1fr) repeat(4,110px)" },
        alignItems: "center",
        minWidth: { xs: 470, md: 720 },
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "14px",
        overflow: "hidden",
        backgroundColor: absent ? "rgba(196,69,69,.035)" : "#fff",
      }}
    >
      <Box sx={{ px: 1.4, py: 1.1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: "11px", fontWeight: 900, color: "#122F4D" }}>
          {index + 1}. {row.name}
        </Typography>
        <Typography noWrap sx={{ mt: .2, color: "#8B96A3", fontSize: "8.5px" }}>
          {row.schoolEmail || `رقم الطالب: ${row.studentId.slice(-6)}`}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", placeItems: "center" }}>
        <Checkbox
          checked={!absent}
          disabled={disabled}
          onChange={(event) => onChange(row.studentId, "attendance", event.target.checked)}
          inputProps={{ "aria-label": `حضور ${row.name}` }}
          sx={{ color: "rgba(36,74,112,.3)", "&.Mui-checked": { color: "#25865A" } }}
        />
      </Box>
      <Box sx={{ display: "grid", placeItems: "center" }}>
        <Checkbox
          checked={row.participation === true}
          disabled={disabled || absent}
          onChange={(event) => onChange(row.studentId, "participation", event.target.checked)}
          sx={{ "&.Mui-checked": { color: "#214E78" } }}
        />
      </Box>
      <Box sx={{ display: "grid", placeItems: "center" }}>
        <Checkbox
          checked={row.homework === true}
          disabled={disabled || absent}
          onChange={(event) => onChange(row.studentId, "homework", event.target.checked)}
          sx={{ "&.Mui-checked": { color: "#B9821D" } }}
        />
      </Box>
      <Tooltip title={`${quizTitle} — اضغط للتبديل: لا يوجد ← اجتازت ← لم تجتز`} arrow>
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Checkbox
            checked={row.quiz === true}
            indeterminate={row.quiz === false}
            disabled={disabled || absent}
            onChange={() => onChange(row.studentId, "quiz")}
            sx={{
              color: "rgba(36,74,112,.3)",
              "&.Mui-checked": { color: "#25865A" },
              "&.MuiCheckbox-indeterminate": { color: "#C44545" },
            }}
          />
        </Box>
      </Tooltip>
    </Paper>
  );
});

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const teacherId = useMemo(() => resolveTeacherId(authRoot, currentUser), [authRoot, currentUser]);

  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || formatLocalDate());
  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState(searchParams.get("lectureId") || "");
  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const initialRowsRef = useRef("[]");
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => normalizeId(lecture) === selectedLectureId) || null,
    [lectures, selectedLectureId]
  );

  const currentSerialized = useMemo(() => serializeRows(rows), [rows]);
  const hasChanges = currentSerialized !== initialRowsRef.current;

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [row.name, row.schoolEmail, row.studentId].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [rows, search]);

  const counts = useMemo(() => {
    const total = rows.length;
    const absent = rows.filter((row) => row.absent === true).length;
    return { total, absent, present: total - absent };
  }, [rows]);

  const loadLectures = useCallback(async () => {
    setLoadingLectures(true);
    setError("");
    try {
      if (!teacherId) throw new Error("تعذر تحديد حساب المعلم الحالي");
      const response = await fetchLectures({ teacherId, page: 1, limit: 500 }, { force: true });
      if (isFailedResponse(response)) throw new Error(getErrorMessage(response, "تعذر تحميل حصص المعلم"));
      const list = extractLectures(response);
      setLectures(list);

      const requestedLectureId = searchParams.get("lectureId") || "";
      const requestedClassId = searchParams.get("classId") || "";
      const requestedExists = list.some((item) => normalizeId(item) === requestedLectureId);
      if (requestedExists) {
        setSelectedLectureId(requestedLectureId);
        return;
      }

      const classMatches = requestedClassId
        ? list.filter((item) => getClassId(item) === requestedClassId)
        : list;
      setSelectedLectureId(normalizeId(classMatches[0] || list[0] || ""));
    } catch (requestError) {
      setLectures([]);
      setSelectedLectureId("");
      setError(requestError?.message || "حدث خطأ أثناء تحميل الحصص");
    } finally {
      setLoadingLectures(false);
    }
  }, [teacherId]);

  const loadSheet = useCallback(async ({ silent = false } = {}) => {
    if (!isMongoId(selectedLectureId) || !selectedDate) {
      setSheet(null);
      setRows([]);
      initialRowsRef.current = "[]";
      return;
    }
    if (!silent) setLoadingSheet(true);
    setError("");
    try {
      const response = await fetchLectureAttendanceSheet(selectedLectureId, selectedDate);
      if (isFailedResponse(response)) throw new Error(getErrorMessage(response, "تعذر تحميل كشف المتابعة"));
      const data = normalizeSheet(response);
      const nextRows = (Array.isArray(data?.students) ? data.students : []).map((student) => ({
        studentId: normalizeId(student),
        name: student?.name || student?.fullName || "طالب",
        schoolEmail: student?.schoolEmail || student?.email || "",
        absent: student?.absent,
        participation: student?.participation,
        homework: student?.homework,
        quiz: student?.quiz,
      }));
      setSheet(data);
      setRows(nextRows);
      initialRowsRef.current = serializeRows(nextRows);
    } catch (requestError) {
      setSheet(null);
      setRows([]);
      initialRowsRef.current = "[]";
      setError(requestError?.message || "حدث خطأ أثناء تحميل كشف المتابعة");
    } finally {
      setLoadingSheet(false);
    }
  }, [selectedLectureId, selectedDate]);

  useEffect(() => { loadLectures(); }, [loadLectures]);
  useEffect(() => { loadSheet(); }, [loadSheet]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedLectureId) next.set("lectureId", selectedLectureId); else next.delete("lectureId");
    if (selectedLecture) {
      const classId = getClassId(selectedLecture);
      if (classId) next.set("classId", classId);
    }
    next.set("date", selectedDate);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [selectedLectureId, selectedDate, selectedLecture, searchParams, setSearchParams]);

  useEffect(() => {
    const warn = (event) => {
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const confirmDiscard = () =>
    !hasChanges || window.confirm("لديك تغييرات غير محفوظة في المتابعة. هل تريد المتابعة بدون حفظ؟");

  const updateRow = useCallback((studentId, field, value) => {
    setRows((current) => current.map((row) => {
      if (row.studentId !== studentId) return row;
      if (field === "attendance") {
        if (!value) {
          return { ...row, absent: true, participation: false, homework: false, quiz: null };
        }
        return { ...row, absent: false, participation: true, homework: true, quiz: null };
      }
      if (field === "quiz") {
        const nextQuiz = row.quiz === null ? true : row.quiz === true ? false : null;
        return { ...row, quiz: nextQuiz };
      }
      return { ...row, [field]: value };
    }));
  }, []);

  const handleLectureChange = (event) => {
    if (!confirmDiscard()) return;
    setSelectedLectureId(event.target.value);
  };

  const handleDateChange = (event) => {
    if (!confirmDiscard()) return;
    setSelectedDate(event.target.value);
  };

  const handleSave = async () => {
    if (!isMongoId(selectedLectureId) || !selectedDate || !rows.length) return;
    setSaving(true);
    try {
      const response = await saveDailyTrackingBulk({
        lectureId: selectedLectureId,
        date: selectedDate,
        records: rows.map((row) => ({
          studentId: row.studentId,
          absent: row.absent === true,
          participation: row.participation,
          homework: row.homework,
          quiz: row.quiz,
        })),
      });
      if (isFailedResponse(response)) throw new Error(getErrorMessage(response, "تعذر حفظ سجل المتابعة"));

      const data = response?.data ?? response;
      const failed = Number(data?.data?.attendance?.failed ?? data?.attendance?.failed ?? 0);
      if (failed > 0) {
        toast.warning(`تم حفظ المتابعة، وتعذّر تسجيل غياب (${failed}) من الطالبات. أعيدي المحاولة.`);
        setSheet((current) => current ? { ...current, trackingRecorded: true } : current);
        return;
      }

      initialRowsRef.current = serializeRows(rows);
      setSheet((current) => current ? { ...current, trackingRecorded: true } : current);
      toast.success(response?.message || "تم حفظ سجل المتابعة");
    } catch (requestError) {
      toast.error(requestError?.message || "حدث خطأ أثناء حفظ المتابعة");
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingLectures || loadingSheet;

  return (
    <Box dir="rtl" sx={{ minHeight: "100vh", py: { xs: 1.5, md: 2.2 }, color: "#122F4D" }}>
      <Box sx={{ width: "min(1480px, calc(100% - 24px))", mx: "auto" }}>
        <Paper elevation={0} sx={{ p: { xs: 1.7, md: 2.4 }, borderRadius: "24px", color: "white", background: "linear-gradient(120deg, #173B5E 0%, #244F78 55%, #2C5C87 100%)", boxShadow: "0 18px 45px rgba(18,47,77,.18)" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <Box sx={{ width: 54, height: 54, p: .7, display: "grid", placeItems: "center", bgcolor: "#fff", borderRadius: "14px" }}>
                <Box component="img" src={nasaqLogo} alt="نسق" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </Box>
              <Box>
                <Chip label="بوابة المعلم" size="small" sx={{ mb: .7, height: 25, color: "#F2D792", bgcolor: "rgba(242,215,146,.12)", fontSize: "9px", fontWeight: 800 }} />
                <Typography sx={{ fontSize: { xs: "22px", md: "28px" }, fontWeight: 900 }}>المتابعة اليومية</Typography>
                <Typography sx={{ mt: .35, color: "rgba(255,255,255,.72)", fontSize: "10px" }}>
                  الحضور والمشاركة وحلّ الواجب والاختبار القصير في حفظ واحد — لا تؤثر في الدرجات.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" gap={.8}>
              <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => confirmDiscard() && navigate("/teacher/dashboard")} sx={{ color: "#fff", borderColor: "rgba(255,255,255,.3)", borderRadius: "12px", fontSize: "10px", fontWeight: 800 }}>
                لوحة التحكم
              </Button>
              <Tooltip title="تحديث الكشف">
                <span>
                  <IconButton disabled={loadingSheet || !selectedLectureId} onClick={() => { if (confirmDiscard()) loadSheet({ silent: true }); }} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: "12px" }}>
                    {loadingSheet ? <CircularProgress size={18} color="inherit" /> : <RefreshRounded />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ mt: 1.25, p: 1.3, border: "1px solid rgba(36,74,112,.08)", borderRadius: "17px", bgcolor: "#fff" }}>
          <Stack direction={{ xs: "column", lg: "row" }} gap={1}>
            <TextField select label="الحصة" size="small" value={selectedLectureId} onChange={handleLectureChange} disabled={loadingLectures || !lectures.length} sx={{ minWidth: { xs: "100%", lg: 360 } }}>
              {lectures.map((lecture) => (
                <MenuItem key={normalizeId(lecture)} value={normalizeId(lecture)}>{getLectureLabel(lecture)}</MenuItem>
              ))}
            </TextField>
            <TextField type="date" label="التاريخ" size="small" value={selectedDate} onChange={handleDateChange} InputLabelProps={{ shrink: true }} sx={{ minWidth: 210 }} />
            <TextField size="small" fullWidth placeholder="ابحث باسم الطالب" value={search} onChange={(event) => setSearch(event.target.value)} />
          </Stack>
        </Paper>

        {error && <Alert severity="warning" sx={{ mt: 1.1, borderRadius: "13px", fontSize: "10px" }}>{error}</Alert>}

        {!loading && selectedLecture && (
          <Box sx={{ mt: 1.15, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 1 }}>
            <Paper elevation={0} sx={{ p: 1.3, borderRadius: "15px", border: "1px solid rgba(36,74,112,.08)" }}><Typography sx={{ color: "#8B96A3", fontSize: "9px" }}>الحصة</Typography><Typography sx={{ fontWeight: 900, fontSize: "12px" }}>{getLectureLabel(selectedLecture)}</Typography></Paper>
            <Paper elevation={0} sx={{ p: 1.3, borderRadius: "15px", border: "1px solid rgba(36,74,112,.08)" }}><Typography sx={{ color: "#8B96A3", fontSize: "9px" }}>الحضور</Typography><Typography sx={{ fontWeight: 900, fontSize: "12px", color: "#25865A" }}>{counts.present} من {counts.total} حاضرة</Typography></Paper>
            <Paper elevation={0} sx={{ p: 1.3, borderRadius: "15px", border: "1px solid rgba(36,74,112,.08)" }}><Typography sx={{ color: "#8B96A3", fontSize: "9px" }}>حالة المتابعة</Typography><Typography sx={{ fontWeight: 900, fontSize: "12px", color: sheet?.trackingRecorded ? "#25865A" : "#B9821D" }}>{sheet?.trackingRecorded ? "تم الحفظ" : "لم تُحفظ بعد"}</Typography></Paper>
          </Box>
        )}

        {loading ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><Stack alignItems="center" spacing={1}><CircularProgress size={30} /><Typography sx={{ fontSize: "10px", color: "#8B96A3" }}>جاري تحميل كشف المتابعة...</Typography></Stack></Box>
        ) : !lectures.length ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center", textAlign: "center" }}><Stack alignItems="center" spacing={1}><SchoolRounded sx={{ fontSize: 44, color: "#B9821D" }} /><Typography sx={{ fontWeight: 900 }}>لا توجد حصص مرتبطة بحسابك</Typography></Stack></Box>
        ) : !rows.length ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center", textAlign: "center" }}><Stack alignItems="center" spacing={1}><GroupsRounded sx={{ fontSize: 44, color: "#214E78" }} /><Typography sx={{ fontWeight: 900 }}>لا يوجد طلاب في كشف هذه الحصة</Typography></Stack></Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mt: 1.15, borderRadius: "13px", fontSize: "9.5px" }}>
              «حلّت الواجب» رصد يومي لا يؤثر في الدرجات. في الاختبار: فارغ = لا يوجد اختبار، علامة صح = اجتازت، علامة ناقص = لم تجتز.
            </Alert>

            <Box sx={{ mt: 1.1, overflowX: "auto", pb: .4 }}>
              <Box sx={{ minWidth: { xs: 470, md: 720 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(150px,1fr) repeat(4,58px)", md: "minmax(260px,1fr) repeat(4,110px)" }, px: .4, mb: .65, alignItems: "end" }}>
                  <Typography sx={{ px: 1, fontSize: "9px", color: "#7B8794", fontWeight: 900 }}>الطالبة</Typography>
                  <Typography align="center" sx={{ fontSize: "9px", fontWeight: 900 }}>الحضور</Typography>
                  <Typography align="center" sx={{ fontSize: "9px", fontWeight: 900 }}>المشاركة</Typography>
                  <Box><Typography align="center" sx={{ fontSize: "9px", fontWeight: 900 }}>حلّت الواجب</Typography><Typography align="center" sx={{ fontSize: "7px", color: "#9AA6B2" }}>رصد يومي</Typography></Box>
                  <Typography align="center" sx={{ fontSize: "9px", fontWeight: 900 }}>اختبار قصير</Typography>
                </Box>
                <Stack spacing={.65}>
                  {filteredRows.map((row) => <TrackingRow key={row.studentId} row={row} index={rows.findIndex((item) => item.studentId === row.studentId)} disabled={saving} onChange={updateRow} />)}
                </Stack>
              </Box>
            </Box>

            <Paper elevation={0} sx={{ position: "sticky", bottom: 10, mt: 1.2, p: 1.25, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 1, border: hasChanges ? "1px solid rgba(211,164,79,.32)" : "1px solid rgba(36,74,112,.1)", borderRadius: "16px", bgcolor: hasChanges ? "rgba(242,215,146,.15)" : "#fff", boxShadow: "0 10px 28px rgba(18,47,77,.10)" }}>
              <Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 900 }}>{hasChanges ? "لديك تغييرات غير محفوظة" : sheet?.trackingRecorded ? "تم حفظ المتابعة" : "الكشف جاهز للرصد"}</Typography>
                <Typography sx={{ mt: .2, color: "#8B96A3", fontSize: "8.8px" }}>{counts.present} حاضرة • {counts.absent} غائبة • {formatDisplayDate(selectedDate)}</Typography>
              </Box>
              <Button variant="contained" disabled={saving || !rows.length} onClick={handleSave} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />} sx={{ minHeight: 42, px: 2.4, borderRadius: "12px", bgcolor: "#F2D792", color: "#122F4D", boxShadow: "none", fontSize: "10px", fontWeight: 900, "&:hover": { bgcolor: "#E8C96F", boxShadow: "none" } }}>
                حفظ المتابعة
              </Button>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
};

export default TeacherAttendance;
