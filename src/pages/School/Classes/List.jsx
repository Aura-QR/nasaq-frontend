import {
  AddRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  EventSeatRounded,
  MeetingRoomRounded,
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
  RefreshRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";
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
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  deleteSchoolClass,
  getSchoolClasses,
  toggleSchoolClassActive,
} from "@/APIs/school/classes";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchStages } from "@/APIs/school/stages";
import { fetchGradeLevels } from "@/APIs/school/gradeLevels";
import {
  extractApiList,
  getClassAcademicYear,
  getClassAvailableSeats,
  getClassCapacity,
  getClassDisplayName,
  getClassGender,
  getClassGenderLabel,
  getClassGradeLevelId,
  getClassGradeLevelName,
  getClassId,
  getClassOccupancy,
  getClassRoomNumber,
  getClassStudentCount,
  getClassTeacherName,
  getEntityId,
  isClassActive,
} from "@/utils/school/classData";
import usePermissions from "@/utils/hooks/usePermissions";

const stageIdOfGrade = (grade) =>
  getEntityId(
    grade?.stageId && typeof grade.stageId === "object"
      ? grade.stageId
      : grade?.stage && typeof grade.stage === "object"
        ? grade.stage
        : grade?.stageId || grade?.stage
  );

const StatCard = ({ label, value, icon }) => (
  <Paper elevation={0} sx={{ minHeight: 82, p: 1.25, display: "flex", alignItems: "center", gap: .9, border: "1px solid #ded8cd", borderRadius: "15px", backgroundColor: "#fff", boxShadow: "0 7px 20px rgba(36,74,112,.035)" }}>
    <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "#b78430", backgroundColor: "#fbf0d8", borderRadius: "11px" }}>{icon}</Box>
    <Box><Typography sx={{ color: "#7e8791", fontSize: "8px", fontWeight: 700 }}>{label}</Typography><Typography sx={{ color: "#122f4d", fontSize: "19px", fontWeight: 800 }}>{value}</Typography></Box>
  </Paper>
);

const ConfirmDialog = ({ open, item, type, loading, onClose, onConfirm }) => {
  const active = isClassActive(item);
  const deleting = type === "delete";
  const title = deleting ? "حذف الفصل" : active ? "إيقاف الفصل" : "تفعيل الفصل";
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "18px" } }}>
      <DialogTitle sx={{ color: "#122f4d", fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent><Typography sx={{ color: "#193754", fontSize: "10.5px", lineHeight: 1.9 }}>{deleting ? "سيتم حذف" : active ? "سيتم إيقاف" : "سيتم تفعيل"} «{getClassDisplayName(item)}».</Typography></DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>إلغاء</Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color={deleting || active ? "error" : "success"}>{loading ? <CircularProgress size={16} color="inherit" /> : "تأكيد"}</Button>
      </DialogActions>
    </Dialog>
  );
};

const List = () => {
  const navigate = useNavigate();
  const permissions = usePermissions("classes");
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [yearId, setYearId] = useState("");
  const [stageId, setStageId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialog, setDialog] = useState({ type: "", item: null });

  useEffect(() => {
    const loadOptions = async () => {
      const [yearRes, stageRes, gradeRes] = await Promise.all([fetchAcademicYears(), fetchStages(), fetchGradeLevels()]);
      if (yearRes?.status !== false) setYears(extractApiList(yearRes, ["academicYears", "years"]));
      if (stageRes?.status !== false) setStages(extractApiList(stageRes, ["stages"]));
      if (gradeRes?.status !== false) setGrades(extractApiList(gradeRes, ["gradeLevels", "grades"]));
    };
    loadOptions();
  }, []);

  const load = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError("");
    const response = await getSchoolClasses(
      { page: page + 1, limit, academicYearId: yearId || undefined, gradeLevelId: gradeId || undefined },
      { force }
    );
    if (response?.status === false) {
      setRows([]);
      setTotal(0);
      setError(response?.message || "تعذر تحميل الفصول");
      setLoading(false);
      return;
    }
    const list = extractApiList(response, ["classes"]);
    const pagination = response?.pagination || response?.data?.pagination || response?.data?.meta || {};
    setRows(list);
    setTotal(Number(pagination?.totalDocs ?? pagination?.totalItems ?? pagination?.total ?? list.length));
    setLoading(false);
  }, [page, limit, yearId, gradeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [yearId, gradeId, limit]);

  const filteredGrades = useMemo(
    () => grades.filter((grade) => !stageId || stageIdOfGrade(grade) === stageId).sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0)),
    [grades, stageId]
  );

  useEffect(() => {
    if (!stageId || !gradeId) return;
    const selected = grades.find((grade) => getEntityId(grade) === gradeId);
    if (selected && stageIdOfGrade(selected) !== stageId) setGradeId("");
  }, [stageId, gradeId, grades]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => {
      const searchable = [item?.name, item?.roomNumber, item?.gradeLevelId?.name, item?.gradeLevel?.name, item?.teacherInChargeId?.name, item?.teacherInCharge?.name].filter(Boolean).join(" ").toLowerCase();
      const grade = grades.find((entry) => getEntityId(entry) === getClassGradeLevelId(item));
      return (!q || searchable.includes(q)) &&
        (!gender || getClassGender(item) === gender) &&
        (!status || isClassActive(item) === (status === "active")) &&
        (!stageId || stageIdOfGrade(grade) === stageId);
    });
  }, [rows, search, gender, status, stageId, grades]);

  const stats = useMemo(() => ({
    total,
    visible: visible.length,
    active: visible.filter(isClassActive).length,
    seats: visible.reduce((sum, item) => sum + getClassAvailableSeats(item), 0),
  }), [visible, total]);

  const resetFilters = () => {
    setSearch(""); setYearId(""); setStageId(""); setGradeId(""); setGender(""); setStatus(""); setPage(0);
  };

  const confirmAction = async () => {
    const item = dialog.item;
    if (!item) return;
    setActionLoading(true);
    const response = dialog.type === "delete"
      ? await deleteSchoolClass(getClassId(item))
      : await toggleSchoolClassActive(getClassId(item));
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تنفيذ العملية");
      setActionLoading(false);
      return;
    }
    toast.success(dialog.type === "delete" ? "تم حذف الفصل" : "تم تغيير حالة الفصل");
    setDialog({ type: "", item: null });
    setActionLoading(false);
    load({ force: true });
  };

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 1.7, md: 2.1 }, border: "1px solid rgba(36,74,112,.08)", borderRadius: "18px", background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))", boxShadow: "0 10px 24px rgba(18,47,77,.06)" }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" gap={1.2}>
            <Box><Stack direction="row" alignItems="center" spacing={.7}><Typography component="h1" sx={{ color: "#122f4d", fontSize: { xs: "21px", md: "25px" }, fontWeight: 800 }}>إدارة الفصول</Typography><Chip size="small" label={stats.total} sx={{ color: "#b78430", backgroundColor: "#fbf0d8", fontWeight: 800 }} /></Stack><Typography sx={{ mt: .35, color: "#7e8791", fontSize: "10px" }}>الفصول مرتبطة بالسنة الدراسية والصف ضمن الهيكل الأكاديمي.</Typography></Box>
            <Stack direction={{ xs: "column", sm: "row" }} gap={.8}>
              <Button variant="outlined" startIcon={<RefreshRounded />} onClick={() => load({ force: true })}>تحديث</Button>
              {permissions.add && <Button component={Link} to="/school/classes/add" variant="contained" startIcon={<AddRounded />} sx={{ backgroundColor: "#244a70", boxShadow: "none", "&:hover": { backgroundColor: "#1b3d61", boxShadow: "none" } }}>إضافة فصل جديد</Button>}
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ mt: 1.25, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4,minmax(0,1fr))" }, gap: 1 }}>
          <StatCard label="إجمالي الفصول" value={stats.total} icon={<MeetingRoomRounded />} />
          <StatCard label="الظاهر في الصفحة" value={stats.visible} icon={<SearchRounded />} />
          <StatCard label="الفصول النشطة" value={stats.active} icon={<CheckCircleRounded />} />
          <StatCard label="الأماكن المتاحة" value={stats.seats} icon={<EventSeatRounded />} />
        </Box>

        <Paper elevation={0} sx={{ mt: 1.25, p: 1.2, border: "1px solid #ded8cd", borderRadius: "16px", backgroundColor: "#fff" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr repeat(5,minmax(145px,1fr))" }, gap: .8 }}>
            <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الفصل أو الغرفة أو المعلم..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
            <TextField select size="small" label="السنة" value={yearId} onChange={(e) => setYearId(e.target.value)}><MenuItem value="">كل السنوات</MenuItem>{years.map((year) => <MenuItem key={getEntityId(year)} value={getEntityId(year)}>{year?.name}</MenuItem>)}</TextField>
            <TextField select size="small" label="المرحلة" value={stageId} onChange={(e) => setStageId(e.target.value)}><MenuItem value="">كل المراحل</MenuItem>{stages.map((stage) => <MenuItem key={getEntityId(stage)} value={getEntityId(stage)}>{stage?.name}</MenuItem>)}</TextField>
            <TextField select size="small" label="الصف" value={gradeId} onChange={(e) => setGradeId(e.target.value)}><MenuItem value="">كل الصفوف</MenuItem>{filteredGrades.map((grade) => <MenuItem key={getEntityId(grade)} value={getEntityId(grade)}>{grade?.name}</MenuItem>)}</TextField>
            <TextField select size="small" label="النوع" value={gender} onChange={(e) => setGender(e.target.value)}><MenuItem value="">كل الأنواع</MenuItem><MenuItem value="male">بنين</MenuItem><MenuItem value="female">بنات</MenuItem><MenuItem value="both">مختلط</MenuItem></TextField>
            <TextField select size="small" label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">كل الحالات</MenuItem><MenuItem value="active">نشط</MenuItem><MenuItem value="inactive">موقوف</MenuItem></TextField>
          </Box>
          <Button onClick={resetFilters} sx={{ mt: .5, color: "#7e8791", fontSize: "8.5px", fontWeight: 800 }}>إعادة ضبط الفلاتر</Button>
        </Paper>

        {error && <Alert severity="error" sx={{ mt: 1.25, borderRadius: "14px" }}>{error}</Alert>}

        <Paper elevation={0} sx={{ mt: 1.25, overflow: "hidden", border: "1px solid #ded8cd", borderRadius: "18px", backgroundColor: "#fff" }}>
          <TableContainer>
            <Table sx={{ minWidth: 1080, tableLayout: "fixed" }}>
              <TableHead><TableRow sx={{ backgroundColor: "#f1f5fa" }}>{["الفصل", "الصف", "السنة", "النوع", "المعلم", "الإشغال", "الحالة", "الإجراءات"].map((label) => <TableCell key={label} align="center" sx={{ color: "#244a70", fontSize: "8.7px", fontWeight: 800 }}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {loading ? [...Array(5)].map((_, rowIndex) => <TableRow key={rowIndex}>{[...Array(8)].map((__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>) : visible.map((item) => {
                  const active = isClassActive(item);
                  const occupancy = getClassOccupancy(item);
                  return (
                    <TableRow key={getClassId(item)} hover>
                      <TableCell align="right"><Typography sx={{ color: "#122f4d", fontSize: "10px", fontWeight: 800 }}>{getClassDisplayName(item)}</Typography><Typography sx={{ color: "#7e8791", fontSize: "7.4px" }}>الغرفة: {getClassRoomNumber(item)}</Typography></TableCell>
                      <TableCell align="center" sx={{ fontSize: "8.5px" }}>{getClassGradeLevelName(item)}</TableCell>
                      <TableCell align="center" sx={{ fontSize: "8.5px" }}>{getClassAcademicYear(item)}</TableCell>
                      <TableCell align="center"><Chip size="small" label={getClassGenderLabel(item)} sx={{ fontSize: "7.5px" }} /></TableCell>
                      <TableCell align="center" sx={{ fontSize: "8.5px" }}>{getClassTeacherName(item)}</TableCell>
                      <TableCell align="center"><Box sx={{ width: 120, mx: "auto" }}><Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: "7.5px", fontWeight: 800 }}>{getClassStudentCount(item)}/{getClassCapacity(item) || "—"}</Typography><Typography sx={{ fontSize: "7px" }}>{occupancy}%</Typography></Stack><LinearProgress variant="determinate" value={occupancy} sx={{ mt: .35, height: 5, borderRadius: 99, "& .MuiLinearProgress-bar": { backgroundColor: occupancy >= 90 ? "#c94f4f" : "#d3a44f" } }} /></Box></TableCell>
                      <TableCell align="center"><Chip size="small" label={active ? "نشط" : "موقوف"} sx={{ color: active ? "#29734A" : "#A44343", backgroundColor: active ? "rgba(116,201,154,.17)" : "rgba(201,79,79,.12)", fontSize: "7.5px", fontWeight: 800 }} /></TableCell>
                      <TableCell align="center"><Stack direction="row" justifyContent="center" gap={.3}>
                        <Tooltip title="عرض"><IconButton onClick={() => navigate(`/school/classes/${getClassId(item)}`)} sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,.08)" }}><VisibilityRounded fontSize="small" /></IconButton></Tooltip>
                        {permissions.edit && <><Tooltip title="تعديل"><IconButton onClick={() => navigate(`/school/classes/edit/${getClassId(item)}`)} sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,.08)" }}><EditRounded fontSize="small" /></IconButton></Tooltip><Tooltip title={active ? "إيقاف" : "تفعيل"}><IconButton onClick={() => setDialog({ type: "status", item })} sx={{ color: active ? "#c94f4f" : "#29734A", backgroundColor: active ? "rgba(201,79,79,.09)" : "rgba(116,201,154,.14)" }}>{active ? <PauseCircleOutlineRounded fontSize="small" /> : <PlayCircleOutlineRounded fontSize="small" />}</IconButton></Tooltip></>}
                        {permissions.delete && <Tooltip title="حذف"><IconButton onClick={() => setDialog({ type: "delete", item })} sx={{ color: "#c94f4f", backgroundColor: "rgba(201,79,79,.09)" }}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip>}
                      </Stack></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {!loading && visible.length === 0 && <Box sx={{ py: 7, textAlign: "center" }}><MeetingRoomRounded sx={{ fontSize: 46, color: "#d3a44f" }} /><Typography sx={{ mt: 1, color: "#122f4d", fontWeight: 800 }}>لا توجد فصول مطابقة</Typography></Box>}
          <TablePagination component="div" count={total} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={limit} onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="عدد الصفوف:" />
        </Paper>

        <ConfirmDialog open={Boolean(dialog.item)} item={dialog.item} type={dialog.type} loading={actionLoading} onClose={() => setDialog({ type: "", item: null })} onConfirm={confirmAction} />
      </Box>
    </Container>
  );
};

export default List;
