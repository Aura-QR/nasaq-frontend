import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AssessmentRounded,
  RefreshRounded,
  SearchRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { fetchDailyTrackingSummary } from "@/APIs/school/dailyTracking";
import { getSchoolClassesList } from "@/APIs/school/classes";
import { fetchSubjectOfferings } from "@/APIs/school/subjectOfferings";
import { fetchTeacherMyClasses } from "@/APIs/school/lectures";

const pad = (value) => String(value).padStart(2, "0");
const toLocalDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const startOfMonth = () => {
  const now = new Date();
  return toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
};
const endOfMonth = () => {
  const now = new Date();
  return toLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

const normalizeId = (value) => String(value?._id || value?.id || value || "").trim();
const unwrap = (value) => {
  let current = value;
  for (let i = 0; i < 4; i += 1) {
    if (current && typeof current === "object" && !Array.isArray(current) && "data" in current) {
      current = current.data;
    } else break;
  }
  return current;
};
const extractList = (response) => {
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  return data?.docs || data?.items || data?.results || data?.classes || data?.subjectOfferings || [];
};
const getClassEntity = (item) => {
  if (item?.classId && typeof item.classId === "object") return item.classId;
  if (item?.class && typeof item.class === "object") return item.class;
  return item;
};
const classKey = (item) => normalizeId(getClassEntity(item) || item?.classId || item?.class);
const className = (item) => {
  const value = getClassEntity(item);
  return value?.name || value?.className || value?.title || item?.className || `فصل ${classKey(item).slice(-5)}`;
};
const offeringName = (item) => {
  const subject = item?.subjectId || item?.subject;
  return subject?.subjectName || subject?.name || item?.subjectName || item?.name || `مادة ${normalizeId(item).slice(-5)}`;
};
const rateLabel = (value) => value === null || value === undefined ? "—" : `${Number(value).toFixed(1).replace(".0", "")}%`;
const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const RateCell = ({ value }) => {
  if (value === null || value === undefined) {
    return <Typography sx={{ fontWeight: 800, color: "#9AA6B2" }}>—</Typography>;
  }
  const numeric = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <Stack spacing={0.45} sx={{ minWidth: 96 }}>
      <Typography sx={{ fontSize: "10px", fontWeight: 900 }}>{rateLabel(value)}</Typography>
      <LinearProgress variant="determinate" value={numeric} sx={{ height: 5, borderRadius: 99 }} />
    </Stack>
  );
};

const DailyTrackingReport = () => {
  const getAuthUser = useAuthUser();
  const authRoot = getAuthUser?.() || {};
  const role = String(authRoot?.user?.role || authRoot?.role || "").toUpperCase();
  const isTeacher = role === "TEACHER";
  const [classes, setClasses] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [classId, setClassId] = useState("");
  const [subjectOfferingId, setSubjectOfferingId] = useState("");
  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(endOfMonth());
  const [report, setReport] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      setLoadingOptions(true);
      const [classesResponse, offeringsResponse] = await Promise.all([
        isTeacher ? fetchTeacherMyClasses({}, { force: true }) : getSchoolClassesList(),
        isTeacher
          ? Promise.resolve({ status: true, data: [] })
          : fetchSubjectOfferings({}, { forceListEndpoint: true }),
      ]);
      if (!active) return;
      const classRows = classesResponse?.status === false ? [] : extractList(classesResponse);
      const offeringRows = offeringsResponse?.status === false ? [] : extractList(offeringsResponse);
      setClasses(classRows);
      setOfferings(offeringRows);
      if (classRows.length) setClassId((current) => current || classKey(classRows[0]));
      setLoadingOptions(false);
    };
    loadOptions();
    return () => { active = false; };
  }, [isTeacher]);

  const selectedClass = useMemo(
    () => classes.find((item) => classKey(item) === classId) || null,
    [classes, classId]
  );

  const filteredOfferings = useMemo(() => {
    const gradeId = normalizeId(selectedClass?.gradeLevelId || selectedClass?.gradeLevel);
    if (!gradeId) return offerings;
    const matching = offerings.filter((item) => normalizeId(item?.gradeLevelId || item?.gradeLevel) === gradeId);
    return matching.length ? matching : offerings;
  }, [offerings, selectedClass]);

  useEffect(() => {
    if (subjectOfferingId && !filteredOfferings.some((item) => normalizeId(item) === subjectOfferingId)) {
      setSubjectOfferingId("");
    }
  }, [filteredOfferings, subjectOfferingId]);

  const loadReport = async () => {
    if (!classId) {
      setError("اختر الفصل أولًا");
      return;
    }
    if (!startDate || !endDate) {
      setError("اختر بداية ونهاية الفترة");
      return;
    }
    if (startDate > endDate) {
      setError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetchDailyTrackingSummary({
        startDate,
        endDate,
        classId,
        ...(subjectOfferingId ? { subjectOfferingId } : {}),
      });
      if (response?.status === false || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "تعذر تحميل تقرير المتابعة");
      }
      const data = response?.data?.data || response?.data || response;
      setReport(data);
    } catch (requestError) {
      setReport(null);
      setError(requestError?.message || "حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  };

  const students = Array.isArray(report?.students) ? report.students : [];

  return (
    <Box dir="rtl">
      <Paper elevation={0} sx={{ p: { xs: 1.6, md: 2.2 }, borderRadius: "22px", background: "linear-gradient(120deg, #173B5E 0%, #244F78 100%)", color: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1.2}>
          <Box>
            <Chip label="سجل المتابعة اليومي" size="small" sx={{ mb: .75, color: "#F2D792", bgcolor: "rgba(242,215,146,.12)", fontWeight: 900 }} />
            <Typography sx={{ fontSize: { xs: "22px", md: "28px" }, fontWeight: 900 }}>تقرير المتابعة الشهري</Typography>
            <Typography sx={{ mt: .35, color: "rgba(255,255,255,.72)", fontSize: "10px" }}>رصد سلوكي للحضور والمشاركة وحلّ الواجب والاختبارات القصيرة — لا يؤثر في الدرجات.</Typography>
          </Box>
          <AssessmentRounded sx={{ fontSize: 42, color: "#F2D792" }} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ mt: 1.2, p: 1.4, borderRadius: "18px", border: "1px solid rgba(36,74,112,.09)" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.2fr .9fr .9fr auto" }, gap: 1 }}>
          <TextField select size="small" label="الفصل" value={classId} disabled={loadingOptions} onChange={(event) => setClassId(event.target.value)}>
            {classes.map((item) => <MenuItem key={classKey(item)} value={classKey(item)}>{className(item)}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="المادة" value={subjectOfferingId} disabled={loadingOptions || isTeacher} onChange={(event) => setSubjectOfferingId(event.target.value)}>
            <MenuItem value="">{isTeacher ? "كل المواد المتاحة" : "كل المواد"}</MenuItem>
            {filteredOfferings.map((item) => <MenuItem key={normalizeId(item)} value={normalizeId(item)}>{offeringName(item)}</MenuItem>)}
          </TextField>
          <TextField type="date" size="small" label="من" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="إلى" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={loadReport} disabled={loading || loadingOptions || !classId} startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <SearchRounded />} sx={{ minHeight: 40, borderRadius: "11px", bgcolor: "#0E7A5E", fontWeight: 900, whiteSpace: "nowrap" }}>
            عرض التقرير
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="warning" sx={{ mt: 1.1, borderRadius: "13px" }}>{error}</Alert>}

      {report && (
        <>
          <Box sx={{ mt: 1.1, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 1 }}>
            <Paper elevation={0} sx={{ p: 1.3, border: "1px solid rgba(36,74,112,.09)", borderRadius: "15px" }}><Typography sx={{ fontSize: "9px", color: "#83909D" }}>عدد الطلاب</Typography><Typography sx={{ fontSize: "19px", fontWeight: 900 }}>{safeNumber(report?.studentCount)}</Typography></Paper>
            <Paper elevation={0} sx={{ p: 1.3, border: "1px solid rgba(36,74,112,.09)", borderRadius: "15px" }}><Typography sx={{ fontSize: "9px", color: "#83909D" }}>من</Typography><Typography sx={{ fontSize: "13px", fontWeight: 900 }}>{report?.startDate || startDate}</Typography></Paper>
            <Paper elevation={0} sx={{ p: 1.3, border: "1px solid rgba(36,74,112,.09)", borderRadius: "15px" }}><Typography sx={{ fontSize: "9px", color: "#83909D" }}>إلى</Typography><Typography sx={{ fontSize: "13px", fontWeight: 900 }}>{report?.endDate || endDate}</Typography></Paper>
            <Paper elevation={0} sx={{ p: 1.3, border: "1px solid rgba(36,74,112,.09)", borderRadius: "15px" }}><Typography sx={{ fontSize: "9px", color: "#83909D" }}>تنبيه</Typography><Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#B9821D" }}>{report?.note || "رصد سلوكي — لا يؤثر في الدرجات"}</Typography></Paper>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ mt: 1.1, border: "1px solid rgba(36,74,112,.09)", borderRadius: "17px" }}>
            <Table size="small" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F7F9FB" }}>
                  {["الطالب", "الحصص", "حضور", "غياب", "المشاركة", "حلّت الواجب", "اختبار ناجح", "اختبار غير مجتاز", "بدون اختبار"].map((label) => (
                    <TableCell key={label} align={label === "الطالب" ? "right" : "center"} sx={{ fontWeight: 900, fontSize: "9px", color: "#42576B" }}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student?.studentId || student?.studentName} hover>
                    <TableCell sx={{ fontWeight: 900, fontSize: "10px" }}>{student?.studentName || "—"}</TableCell>
                    <TableCell align="center">{safeNumber(student?.totalLectures)}</TableCell>
                    <TableCell align="center">{safeNumber(student?.presentCount)}</TableCell>
                    <TableCell align="center">{safeNumber(student?.absentCount)}</TableCell>
                    <TableCell align="center"><RateCell value={student?.participationRate} /></TableCell>
                    <TableCell align="center"><RateCell value={student?.homeworkRate} /></TableCell>
                    <TableCell align="center">{safeNumber(student?.quizzes?.passed)}</TableCell>
                    <TableCell align="center">{safeNumber(student?.quizzes?.failed)}</TableCell>
                    <TableCell align="center">{safeNumber(student?.quizzes?.noQuiz)}</TableCell>
                  </TableRow>
                ))}
                {!students.length && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: "#8B96A3" }}>لا توجد بيانات متابعة في الفترة المحددة.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button size="small" startIcon={<RefreshRounded />} onClick={loadReport} disabled={loading}>تحديث التقرير</Button>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default DailyTrackingReport;
