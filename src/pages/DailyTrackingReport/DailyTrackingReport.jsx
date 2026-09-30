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
import { fetchMyClasses, getSchoolClassesList } from "@/APIs/school/classes";
import { fetchSubjectOfferings } from "@/APIs/school/subjectOfferings";
import { getSchoolTeachersList } from "@/APIs/school/teachers";
import { fetchTeacherAssignments, fetchLectures } from "@/APIs/school/lectures";
import Container from "@/components/Container/Container";


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
const teacherName = (item) => item?.name || item?.fullName || item?.teacherName || item?.username || `معلم ${normalizeId(item).slice(-5)}`;
const assignmentClassId = (item) => normalizeId(item?.classId || item?.class);
const assignmentOfferingId = (item) => normalizeId(item?.subjectOfferingId || item?.subjectOffering);

const COLORS = {
  navyDark: "var(--color-navy-dark, #1b3d61)",
  gold: "var(--color-gold, #d3a44f)",
  muted: "var(--color-muted, #7b8794)",
};

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
  const [teachers, setTeachers] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [teacherLectures, setTeacherLectures] = useState([]);
  const [teacherId, setTeacherId] = useState("");
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
      const [classesResponse, offeringsResponse, teachersResponse] = await Promise.all([
        isTeacher ? fetchMyClasses() : getSchoolClassesList(),
        isTeacher
          ? Promise.resolve({ status: true, data: [] })
          : fetchSubjectOfferings({}, { forceListEndpoint: true }),
        isTeacher
          ? Promise.resolve({ status: true, data: [] })
          : getSchoolTeachersList({ force: true }),
      ]);
      if (!active) return;
      const classRows = classesResponse?.status === false ? [] : extractList(classesResponse);
      const offeringRows = offeringsResponse?.status === false ? [] : extractList(offeringsResponse);
      const teacherRows = teachersResponse?.status === false ? [] : extractList(teachersResponse);
      setClasses(classRows);
      setOfferings(offeringRows);
      setTeachers(teacherRows);
      if (isTeacher && classRows.length) {
        setClassId((current) => current || classKey(classRows[0]));
      } else if (classesResponse?.status === false) {
        setError(classesResponse?.message || "تعذر تحميل فصول المعلم");
      } else if (isTeacher) {
        setError("لا توجد فصول مرتبطة بهذا المعلم حاليًا");
      }
      setLoadingOptions(false);
    };
    loadOptions();
    return () => { active = false; };
  }, [isTeacher]);


  useEffect(() => {
    if (isTeacher || !teacherId) {
      setTeacherAssignments([]);
      setTeacherLectures([]);
      return undefined;
    }

    let active = true;
    const loadTeacherScope = async () => {
      const [assignmentsResponse, lecturesResponse] = await Promise.all([
        fetchTeacherAssignments(
          { teacherId, page: 1, limit: 500 },
          { force: true }
        ),
        fetchLectures(
          { teacherId, page: 1, limit: 500 },
          { force: true }
        ),
      ]);
      if (!active) return;
      setTeacherAssignments(assignmentsResponse?.status === false ? [] : extractList(assignmentsResponse));
      setTeacherLectures(lecturesResponse?.status === false ? [] : extractList(lecturesResponse));
    };
    loadTeacherScope();
    return () => { active = false; };
  }, [isTeacher, teacherId]);

  const visibleClasses = useMemo(() => {
    if (isTeacher || !teacherId) return classes;
    const allowed = new Set([
      ...teacherAssignments.map(assignmentClassId),
      ...teacherLectures.map(assignmentClassId),
    ].filter(Boolean));
    return classes.filter((item) => allowed.has(classKey(item)));
  }, [classes, isTeacher, teacherAssignments, teacherLectures, teacherId]);

  useEffect(() => {
    if (!visibleClasses.length) {
      setClassId("");
      return;
    }
    if (!visibleClasses.some((item) => classKey(item) === classId)) {
      setClassId(classKey(visibleClasses[0]));
    }
  }, [visibleClasses, classId]);

  const selectedClass = useMemo(
    () => visibleClasses.find((item) => classKey(item) === classId) || null,
    [visibleClasses, classId]
  );

  const filteredOfferings = useMemo(() => {
    let rows = offerings;
    if (!isTeacher && teacherId) {
      const teacherScopeRows = [...teacherAssignments, ...teacherLectures];
      const relevantAssignments = classId
        ? teacherScopeRows.filter((item) => !assignmentClassId(item) || assignmentClassId(item) === classId)
        : teacherScopeRows;
      const assignedOfferingIds = new Set(relevantAssignments.map(assignmentOfferingId).filter(Boolean));
      if (assignedOfferingIds.size) {
        rows = rows.filter((item) => assignedOfferingIds.has(normalizeId(item)));
      } else {
        rows = [];
      }
    }
    const gradeId = normalizeId(selectedClass?.gradeLevelId || selectedClass?.gradeLevel);
    if (!gradeId) return rows;
    const matching = rows.filter((item) => normalizeId(item?.gradeLevelId || item?.gradeLevel) === gradeId);
    return matching.length ? matching : rows;
  }, [offerings, selectedClass, isTeacher, teacherId, teacherAssignments, teacherLectures, classId]);

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

  const reportContent = (
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.5, md: 2.2 },
            py: 1.8,
            borderRadius: "20px",
            border: isTeacher ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(36,74,112,0.075)",
            background: isTeacher
              ? "linear-gradient(135deg, var(--color-navy-deep), var(--color-navy) 58%, var(--color-navy-light))"
              : "linear-gradient(135deg,#fffdf8,rgba(251,240,216,0.34))",
            boxShadow: isTeacher
              ? "0 18px 42px rgba(18,47,77,0.18)"
              : "0 12px 28px rgba(18,47,77,0.045)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={1.5}>
            <Box>
              <Stack direction="row" gap={0.8} alignItems="center" flexWrap="wrap">
                <Typography sx={{ color: isTeacher ? "#fff" : COLORS.navyDark, fontWeight: 900, fontSize: { xs: "23px", md: "29px" } }}>
                  {isTeacher ? "تقرير المتابعة" : "سجل المتابعة اليومي"}
                </Typography>
                <Chip
                  label="تقرير شهري"
                  size="small"
                  sx={{
                    backgroundColor: isTeacher ? "rgba(242,215,146,0.16)" : "rgba(211,164,79,0.12)",
                    color: isTeacher ? "var(--color-gold-light, #f2d792)" : COLORS.navyDark,
                    border: isTeacher ? "1px solid rgba(242,215,146,0.18)" : "none",
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 0.45, color: isTeacher ? "rgba(255,255,255,0.7)" : COLORS.muted, fontSize: "10.5px" }}>
                {isTeacher
                  ? "ملخص متابعة فصولك للحضور والمشاركة وحلّ الواجب والاختبارات القصيرة — لا يؤثر في الدرجات."
                  : "رصد سلوكي للحضور والمشاركة وحلّ الواجب والاختبارات القصيرة — لا يؤثر في الدرجات."}
              </Typography>
            </Box>
            <AssessmentRounded sx={{ fontSize: 40, color: isTeacher ? "var(--color-gold-light, #f2d792)" : COLORS.gold }} />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ mt: 1.3, p: 1.4, borderRadius: "18px", border: "1px solid rgba(36,74,112,.08)", background: "#fff", boxShadow: "0 10px 24px rgba(18,47,77,0.04)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: isTeacher ? "1.25fr .95fr .95fr auto" : "1.1fr 1.1fr 1.1fr .9fr .9fr auto" }, gap: 1 }}>
            {!isTeacher && (
              <TextField select size="small" label="المعلم" value={teacherId} disabled={loadingOptions} onChange={(event) => { setTeacherId(event.target.value); setTeacherAssignments([]); setClassId(""); setSubjectOfferingId(""); setReport(null); }}>
                <MenuItem value="">كل المعلمين</MenuItem>
                {teachers.map((item) => <MenuItem key={normalizeId(item)} value={normalizeId(item)}>{teacherName(item)}</MenuItem>)}
              </TextField>
            )}
            <TextField select size="small" label="الفصل" value={classId} disabled={loadingOptions || (!isTeacher && teacherId && !visibleClasses.length)} onChange={(event) => setClassId(event.target.value)}>
              {visibleClasses.map((item) => <MenuItem key={classKey(item)} value={classKey(item)}>{className(item)}</MenuItem>)}
            </TextField>
            {!isTeacher && (
              <TextField select size="small" label="المادة" value={subjectOfferingId} disabled={loadingOptions} onChange={(event) => setSubjectOfferingId(event.target.value)}>
                <MenuItem value="">كل المواد</MenuItem>
                {filteredOfferings.map((item) => <MenuItem key={normalizeId(item)} value={normalizeId(item)}>{offeringName(item)}</MenuItem>)}
              </TextField>
            )}
            <TextField type="date" size="small" label="من" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="إلى" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" onClick={loadReport} disabled={loading || loadingOptions || !classId} startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <SearchRounded />} sx={{ minHeight: 40, borderRadius: "11px", bgcolor: COLORS.navyDark, "&:hover": { bgcolor: "#15324f" }, fontWeight: 900, whiteSpace: "nowrap" }}>
              عرض التقرير
            </Button>
          </Box>
          {!isTeacher && teacherId && !teacherAssignments.length && !loadingOptions && (
            <Typography sx={{ mt: 1, color: COLORS.muted, fontSize: "10px" }}>لا توجد إسنادات دراسية لهذا المعلم حاليًا.</Typography>
          )}
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

  if (isTeacher) {
    return (
      <Box
        dir="rtl"
        sx={{
          minHeight: "100vh",
          color: "var(--color-text)",
          backgroundColor: "var(--color-page)",
          backgroundImage: `
            radial-gradient(circle at 8% 8%, rgba(211,164,79,0.07), transparent 24%),
            radial-gradient(circle at 92% 4%, rgba(36,74,112,0.08), transparent 25%)
          `,
        }}
      >
        <Box
          component="main"
          sx={{
            width: "100%",
            maxWidth: "1680px",
            mx: "auto",
            px: { xs: 2, sm: 3, md: 4, lg: 5 },
            py: { xs: 2, sm: 2.5, md: 3.5 },
          }}
        >
          {reportContent}
        </Box>
      </Box>
    );
  }

  return <Container>{reportContent}</Container>;
};

export default DailyTrackingReport;
