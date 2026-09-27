import {
  ArrowBackRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
  EditRounded,
  EventSeatRounded,
  GroupsRounded,
  MeetingRoomRounded,
  PauseCircleRounded,
  PlayCircleRounded,
  RefreshRounded,
  ScheduleRounded,
  SchoolRounded,
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
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  deleteSchoolClass,
  getSchoolClassById,
  getSchoolClassStudents,
  toggleSchoolClassActive,
} from "@/APIs/school/classes";
import {
  extractApiList,
  extractClass,
  getClassAcademicYear,
  getClassCapacity,
  getClassDisplayName,
  getClassGenderLabel,
  getClassGradeLevelName,
  getClassRoomNumber,
  getClassStageName,
  getClassStudentCount,
  getClassTeacherName,
  getEntityId,
  isClassActive,
} from "@/utils/school/classData";
import usePermissions from "@/utils/hooks/usePermissions";

const studentName = (student) =>
  String(student?.name || [student?.firstName, student?.fatherName, student?.familyName].filter(Boolean).join(" ") || "طالب");

const InfoCard = ({ label, value, icon }) => (
  <Paper elevation={0} sx={{ minHeight: 82, p: 1.25, display: "flex", alignItems: "center", gap: .9, border: "1px solid #ded8cd", borderRadius: "15px", backgroundColor: "#fff" }}>
    <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "#b78430", backgroundColor: "#fbf0d8", borderRadius: "11px" }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}><Typography sx={{ color: "#7e8791", fontSize: "8px", fontWeight: 700 }}>{label}</Typography><Typography noWrap title={String(value)} sx={{ color: "#122f4d", fontSize: "11px", fontWeight: 800 }}>{value}</Typography></Box>
  </Paper>
);

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions("classes");
  const [item, setItem] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState("");

  const load = useCallback(async ({ force = false, silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    const [classRes, studentsRes] = await Promise.all([
      getSchoolClassById(id, { force }),
      getSchoolClassStudents(id, { force }),
    ]);

    if (classRes?.status === false) {
      setItem(null);
      setError(classRes?.message || "تعذر تحميل الفصل");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextClass = extractClass(classRes);
    const list = studentsRes?.status === false
      ? (Array.isArray(nextClass?.students) ? nextClass.students : [])
      : extractApiList(studentsRes, ["students", "enrollments"]).map((row) => row?.studentId || row?.student || row);

    setItem({ ...nextClass, students: list });
    setStudents(list);
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const active = isClassActive(item);
  const capacity = getClassCapacity(item);
  const count = students.length || getClassStudentCount(item);
  const occupancy = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
  const remainingSeats = Math.max(0, capacity - count);

  const confirmAction = async () => {
    setActionLoading(true);
    const response = dialog === "delete"
      ? await deleteSchoolClass(id)
      : await toggleSchoolClassActive(id);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تنفيذ العملية");
      setActionLoading(false);
      return;
    }

    toast.success(dialog === "delete" ? "تم حذف الفصل" : "تم تغيير حالة الفصل");
    if (dialog === "delete") {
      navigate("/school/classes", { replace: true });
      return;
    }
    setDialog("");
    setActionLoading(false);
    load({ force: true });
  };

  if (loading) return <Container><Stack spacing={1}><Skeleton variant="rounded" height={120} /><Skeleton variant="rounded" height={90} /><Skeleton variant="rounded" height={320} /></Stack></Container>;
  if (error || !item) return <Container><Alert severity="error">{error || "الفصل غير موجود"}</Alert></Container>;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 1.8 }, border: "1px solid rgba(36,74,112,.08)", borderRadius: "18px", background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))", boxShadow: "0 10px 24px rgba(18,47,77,.06)" }}>
          <Stack direction={{ xs: "column", lg: "row" }} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between" gap={1.2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={.7} sx={{ flexWrap: "wrap" }}>
                <Typography component="h1" sx={{ color: "#122f4d", fontSize: { xs: "21px", md: "24px" }, fontWeight: 800 }}>{getClassDisplayName(item)}</Typography>
                <Chip size="small" label={active ? "نشط" : "موقوف"} sx={{ color: active ? "#29734A" : "#A44343", backgroundColor: active ? "rgba(116,201,154,.17)" : "rgba(201,79,79,.12)", fontSize: "8px", fontWeight: 800 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={.55} sx={{ mt: .35, flexWrap: "wrap" }}>
                <Typography sx={{ color: "#7e8791", fontSize: "9px" }}>{getClassGradeLevelName(item)}</Typography>
                <Typography sx={{ color: "#c4bcae" }}>•</Typography>
                <Typography sx={{ color: "#7e8791", fontSize: "9px" }}>{getClassAcademicYear(item)}</Typography>
                <Chip size="small" label={`الغرفة ${getClassRoomNumber(item)}`} sx={{ height: 22, color: "#244a70", backgroundColor: "rgba(36,74,112,.07)", fontSize: "7.2px", fontWeight: 800 }} />
              </Stack>
            </Box>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              gap={{ xs: 1, md: 1.35 }}
              sx={{ flexWrap: "wrap" }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                gap={0.9}
                sx={{ flexWrap: "wrap" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackRounded />}
                  onClick={() => navigate("/school/classes")}
                  sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}
                >
                  رجوع
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshRounded />}
                  disabled={refreshing}
                  onClick={() => load({ force: true, silent: true })}
                  sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ScheduleRounded />}
                  onClick={() => navigate(`/school/classes/${id}/schedule`)}
                  sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}
                >
                  الجدول
                </Button>
              </Stack>

              {(permissions.edit || permissions.delete) && (
                <Box
                  sx={{
                    display: { xs: "none", md: "block" },
                    width: "1px",
                    height: 34,
                    backgroundColor: "#ded8cd",
                  }}
                />
              )}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                gap={0.9}
                sx={{ flexWrap: "wrap" }}
              >
                {permissions.edit && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<EditRounded />}
                      onClick={() => navigate(`/school/classes/edit/${id}`)}
                      sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", backgroundColor: "#244a70", boxShadow: "none", fontWeight: 800, "&:hover": { backgroundColor: "#1b3d61", boxShadow: "none" } }}
                    >
                      تعديل
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={active ? <PauseCircleRounded /> : <PlayCircleRounded />}
                      onClick={() => setDialog("status")}
                      sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", color: active ? "#c94f4f" : "#29734A", borderColor: active ? "rgba(201,79,79,.30)" : "rgba(41,115,74,.28)", fontWeight: 800 }}
                    >
                      {active ? "إيقاف" : "تفعيل"}
                    </Button>
                  </>
                )}

                {permissions.delete && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => setDialog("delete")}
                    sx={{ minHeight: 40, minWidth: 106, px: 1.6, borderRadius: "11px", color: "#c94f4f", borderColor: "rgba(201,79,79,.30)", fontWeight: 800 }}
                  >
                    حذف
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ mt: 1.1, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4,minmax(0,1fr))" }, gap: 1 }}>
          <InfoCard label="السنة الدراسية" value={getClassAcademicYear(item)} icon={<CalendarMonthRounded />} />
          <InfoCard label="المرحلة والصف" value={`${getClassStageName(item)} — ${getClassGradeLevelName(item)}`} icon={<SchoolRounded />} />
          <InfoCard label="نوع الفصل" value={getClassGenderLabel(item)} icon={<MeetingRoomRounded />} />
          <InfoCard label="المعلم المسؤول" value={getClassTeacherName(item)} icon={<GroupsRounded />} />
        </Box>

        <Paper elevation={0} sx={{ mt: 1.1, p: 1.4, border: "1px solid #ded8cd", borderRadius: "18px", backgroundColor: "#fff" }}>
          <Stack direction={{ xs: "column", lg: "row" }} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between" gap={1.3}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Box><Typography sx={{ color: "#122f4d", fontSize: "15px", fontWeight: 800 }}>إشغال الفصل</Typography><Typography sx={{ color: "#7e8791", fontSize: "8.5px" }}>نسبة المقاعد المستخدمة داخل الفصل.</Typography></Box>
                <Chip size="small" label={`${occupancy}%`} sx={{ color: "#b78430", backgroundColor: "#fbf0d8", fontWeight: 800 }} />
              </Stack>
              <LinearProgress variant="determinate" value={occupancy} sx={{ mt: 1.1, height: 7, borderRadius: 99, backgroundColor: "rgba(36,74,112,.08)", "& .MuiLinearProgress-bar": { borderRadius: 99, backgroundColor: occupancy >= 90 ? "#c94f4f" : "#d3a44f" } }} />
            </Box>
            <Stack direction="row" justifyContent={{ xs: "space-between", lg: "flex-end" }} gap={{ xs: 1.2, md: 3 }} sx={{ minWidth: { lg: 330 }, px: { lg: 1.5 }, borderRight: { lg: "1px solid #ded8cd" } }}>
              <Box><Typography sx={{ color: "#7e8791", fontSize: "8px", fontWeight: 700 }}>المسجلون</Typography><Typography sx={{ color: "#122f4d", fontSize: "18px", fontWeight: 800 }}>{count}</Typography></Box>
              <Box><Typography sx={{ color: "#7e8791", fontSize: "8px", fontWeight: 700 }}>السعة</Typography><Typography sx={{ color: "#122f4d", fontSize: "18px", fontWeight: 800 }}>{capacity || "—"}</Typography></Box>
              <Box><Typography sx={{ color: "#7e8791", fontSize: "8px", fontWeight: 700 }}>المتاح</Typography><Typography sx={{ color: "#122f4d", fontSize: "18px", fontWeight: 800 }}>{remainingSeats}</Typography></Box>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ mt: 1.1, overflow: "hidden", border: "1px solid #ded8cd", borderRadius: "18px", backgroundColor: "#fff" }}>
          <Box sx={{ px: 1.5, py: 1.15, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderBottom: "1px solid #ded8cd" }}><Box><Typography sx={{ color: "#122f4d", fontSize: "16px", fontWeight: 800 }}>طلاب الفصل</Typography><Typography sx={{ color: "#7e8791", fontSize: "8.5px" }}>الطلاب المرتبطون بالفصل من خلال التسجيلات.</Typography></Box><Chip size="small" icon={<EventSeatRounded />} label={`${count} طالب`} sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,.07)", fontWeight: 800 }} /></Box>
          {students.length ? <TableContainer><Table><TableHead><TableRow sx={{ backgroundColor: "#f1f5fa" }}><TableCell>الطالب</TableCell><TableCell align="center">البريد</TableCell><TableCell align="center">الهاتف</TableCell></TableRow></TableHead><TableBody>{students.map((student, index) => <TableRow key={getEntityId(student) || index}><TableCell sx={{ fontWeight: 800 }}>{studentName(student)}</TableCell><TableCell align="center">{student?.email || "—"}</TableCell><TableCell align="center">{student?.phoneNumber || student?.phone || "—"}</TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Box sx={{ minHeight: 190, display: "grid", placeItems: "center", py: 3, px: 2, textAlign: "center" }}><Box><GroupsRounded sx={{ fontSize: 46, color: "#d3a44f" }} /><Typography sx={{ mt: .8, color: "#122f4d", fontSize: "14px", fontWeight: 800 }}>لا يوجد طلاب مسجلون في الفصل</Typography><Typography sx={{ mt: .3, color: "#7e8791", fontSize: "9px" }}>يظهر الطلاب هنا بعد إنشاء تسجيلات مرتبطة بهذا الفصل.</Typography></Box></Box>}
        </Paper>

        <Dialog open={Boolean(dialog)} onClose={actionLoading ? undefined : () => setDialog("")} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "18px" } }}>
          <DialogTitle sx={{ color: "#122f4d", fontWeight: 800 }}>{dialog === "delete" ? "حذف الفصل" : active ? "إيقاف الفصل" : "تفعيل الفصل"}</DialogTitle>
          <DialogContent><Typography sx={{ fontSize: "10.5px", lineHeight: 1.8 }}>تأكيد العملية على «{getClassDisplayName(item)}»؟</Typography></DialogContent>
          <DialogActions><Button onClick={() => setDialog("")} disabled={actionLoading}>إلغاء</Button><Button onClick={confirmAction} disabled={actionLoading} variant="contained" color={dialog === "delete" || active ? "error" : "success"}>{actionLoading ? <CircularProgress size={16} color="inherit" /> : "تأكيد"}</Button></DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Profile;
