import {
  AddRounded,
  ArrowBackRounded,
  DeleteOutlineRounded,
  EditRounded,
  GroupsRounded,
  MeetingRoomRounded,
  MenuBookRounded,
  PauseCircleOutlineRounded,
  PersonRemoveRounded,
  SchoolRounded,
  WeekendRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  addStudentToSchoolClass,
  deleteSchoolClass,
  getSchoolClassById,
  getSchoolClassStudents,
  removeStudentFromSchoolClass,
  toggleSchoolClassActive,
  updateSchoolClass,
} from "@/APIs/school/classes";
import { getSchoolStudentsList } from "@/APIs/school/students";
import { getSchoolTeachersList } from "@/APIs/school/teachers";
import ClassDeleteDialog from "@/components/school/classes/ClassDeleteDialog";
import ClassFormDialog from "@/components/school/classes/ClassFormDialog";
import ClassStatusDialog from "@/components/school/classes/ClassStatusDialog";
import ClassStudentDialog from "@/components/school/classes/ClassStudentDialog";
import ClassStudentRemoveDialog from "@/components/school/classes/ClassStudentRemoveDialog";
import { getStoredPermissions, hasPermission } from "@/shared/auth/permissions";
import { ROLES } from "@/shared/auth/roles";
import {
  extractClass,
  extractClassStudents,
  getClassAcademicYear,
  getClassCapacity,
  getClassDisplayName,
  getClassGenderLabel,
  getClassRoomNumber,
  getClassStudentCount,
  getClassSubjectNames,
  getClassTeacherName,
  isClassActive,
} from "@/utils/school/classData";
import {
  extractStudents,
  getStudentAcademicYear,
  getStudentEmail,
  getStudentId,
  getStudentName,
  isStudentActive,
} from "@/utils/school/studentData";
import { extractTeachers } from "@/utils/school/teacherData";
import { getSchoolSessionInfo } from "@/utils/school/schoolSession";

const InfoCard = ({ icon, label, value }) => (
  <Box
    sx={{
      minHeight: 80,
      p: 1.15,
      display: "grid",
      gridTemplateColumns: "38px minmax(0,1fr)",
      alignItems: "center",
      gap: 0.9,
      borderRadius: "14px",
      backgroundColor: "#fffcf7",
      border: "1px solid rgba(36,74,112,0.08)",
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        display: "grid",
        placeItems: "center",
        borderRadius: "11px",
        color: "#b78430",
        backgroundColor: "#fbf0d8",
        "& svg": { fontSize: 19 },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: "#7e8791", fontSize: "7.7px", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        noWrap
        title={String(value || "—")}
        sx={{ mt: 0.25, color: "#122f4d", fontSize: "10px", fontWeight: 800 }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const SchoolClassDetails = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser();
  const { role } = getSchoolSessionInfo(authState);
  const permissions =
    authState?.permissions || authState?.user?.permissions || getStoredPermissions();

  const fullAccess = [ROLES.OWNER, ROLES.SUPERVISOR].includes(role);
  const canUpdate = fullAccess || hasPermission(permissions, "school.classes.update");
  const canDelete = fullAccess || hasPermission(permissions, "school.classes.delete");

  const [classItem, setClassItem] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [removeStudentOpen, setRemoveStudentOpen] = useState(false);
  const [removeStudentLoading, setRemoveStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadClass = useCallback(async () => {
    if (!classId) {
      setError("معرّف الفصل غير موجود");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [classResponse, teachersResponse] = await Promise.all([
      getSchoolClassById(classId),
      getSchoolTeachersList(),
    ]);

    if (classResponse?.status === false) {
      setError(classResponse?.message || "تعذر تحميل بيانات الفصل");
      setLoading(false);
      return;
    }

    setClassItem(extractClass(classResponse?.data));
    if (teachersResponse?.status !== false) {
      setTeachers(extractTeachers(teachersResponse?.data));
    }
    setLoading(false);
  }, [classId]);

  const loadClassStudents = useCallback(async () => {
    if (!classId) return;

    setStudentsLoading(true);
    setStudentsError("");
    const response = await getSchoolClassStudents(classId);

    if (response?.status === false) {
      setStudentsError(response?.message || "تعذر تحميل طلاب الفصل");
      setStudentsLoading(false);
      return;
    }

    setClassStudents(extractClassStudents(response?.data));
    setStudentsLoading(false);
  }, [classId]);

  const loadAvailableStudents = useCallback(async () => {
    const response = await getSchoolStudentsList();

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تحميل قائمة الطلاب");
      setAllStudents([]);
      return;
    }

    setAllStudents(extractStudents(response?.data));
  }, []);

  useEffect(() => {
    loadClass();
    loadClassStudents();
  }, [loadClass, loadClassStudents]);

  const existingStudentIds = useMemo(
    () => classStudents.map(getStudentId).filter(Boolean),
    [classStudents]
  );

  const handleSave = async (payload) => {
    setFormLoading(true);
    const response = await updateSchoolClass(classId, payload);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تعديل الفصل");
      setFormLoading(false);
      return;
    }

    toast.success("تم تعديل بيانات الفصل");
    setFormOpen(false);
    setFormLoading(false);
    await loadClass();
  };

  const handleToggleStatus = async () => {
    const active = isClassActive(classItem);
    setStatusLoading(true);
    const response = await toggleSchoolClassActive(classId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تغيير حالة الفصل");
      setStatusLoading(false);
      return;
    }

    toast.success(active ? "تم إيقاف الفصل" : "تم تفعيل الفصل");
    setStatusOpen(false);
    setStatusLoading(false);
    await loadClass();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const response = await deleteSchoolClass(classId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حذف الفصل");
      setDeleteLoading(false);
      return;
    }

    toast.success("تم حذف الفصل");
    navigate("/school/classes", { replace: true });
  };

  const openAddStudent = async () => {
    setAddStudentOpen(true);
    if (!allStudents.length) await loadAvailableStudents();
  };

  const handleAddStudent = async (studentId) => {
    if (!studentId) return;

    setAddStudentLoading(true);
    const response = await addStudentToSchoolClass(classId, studentId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر إضافة الطالب إلى الفصل");
      setAddStudentLoading(false);
      return;
    }

    toast.success("تمت إضافة الطالب إلى الفصل");
    setAddStudentOpen(false);
    setAddStudentLoading(false);
    await Promise.all([loadClass(), loadClassStudents()]);
  };

  const handleRemoveStudent = async () => {
    const studentId = getStudentId(selectedStudent);
    if (!studentId) {
      toast.error("معرّف الطالب غير موجود");
      return;
    }

    setRemoveStudentLoading(true);
    const response = await removeStudentFromSchoolClass(classId, studentId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر إزالة الطالب من الفصل");
      setRemoveStudentLoading(false);
      return;
    }

    toast.success("تمت إزالة الطالب من الفصل");
    setRemoveStudentOpen(false);
    setSelectedStudent(null);
    setRemoveStudentLoading(false);
    await Promise.all([loadClass(), loadClassStudents()]);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton height={110} sx={{ borderRadius: "17px" }} />
        <Skeleton height={320} sx={{ mt: 1, borderRadius: "17px" }} />
      </Box>
    );
  }

  if (error || !classItem) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={loadClass}>إعادة المحاولة</Button>}
      >
        {error || "بيانات الفصل غير موجودة"}
      </Alert>
    );
  }

  const active = isClassActive(classItem);
  const capacity = getClassCapacity(classItem);
  const studentCount = classStudents.length || getClassStudentCount(classItem);
  const occupancy = capacity > 0 ? Math.min(100, Math.round((studentCount / capacity) * 100)) : 0;
  const subjectNames = getClassSubjectNames(classItem);

  const details = [
    { label: "السنة الدراسية", value: getClassAcademicYear(classItem), icon: <SchoolRounded /> },
    { label: "نوع الفصل", value: getClassGenderLabel(classItem), icon: <GroupsRounded /> },
    { label: "رقم الغرفة", value: getClassRoomNumber(classItem), icon: <MeetingRoomRounded /> },
    { label: "المعلم المسؤول", value: getClassTeacherName(classItem), icon: <SchoolRounded /> },
    { label: "السعة القصوى", value: capacity, icon: <WeekendRounded /> },
    { label: "عدد المواد", value: subjectNames.length, icon: <MenuBookRounded /> },
  ];

  return (
    <Box>
      <Box
        sx={{
          p: 1.4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.2,
          borderRadius: "17px",
          backgroundColor: "#ffffff",
          border: "1px solid #ded8cd",
          boxShadow: "0 8px 22px rgba(36,74,112,0.04)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
              borderRadius: "14px",
              color: "#ffffff",
              backgroundColor: "#244a70",
              "& svg": { fontSize: 24 },
            }}
          >
            <MeetingRoomRounded />
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <Typography sx={{ color: "#122f4d", fontSize: "18px", fontWeight: 800 }}>
                {getClassDisplayName(classItem)}
              </Typography>
              <Chip
                size="small"
                label={active ? "نشط" : "موقوف"}
                sx={{
                  height: 23,
                  color: active ? "#29734A" : "#A44343",
                  backgroundColor: active ? "rgba(116,201,154,0.17)" : "rgba(201,79,79,0.12)",
                  fontSize: "7.2px",
                  fontWeight: 800,
                }}
              />
            </Stack>
            <Typography sx={{ mt: 0.25, color: "#7e8791", fontSize: "8px" }}>
              {getClassAcademicYear(classItem)} • {getClassGenderLabel(classItem)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.65}>
          <Button
            onClick={() => navigate("/school/classes")}
            startIcon={<ArrowBackRounded />}
            sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,0.07)" }}
          >
            العودة للفصول
          </Button>

          {canUpdate && (
            <>
              <Button
                onClick={() => setFormOpen(true)}
                startIcon={<EditRounded />}
                sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,0.07)" }}
              >
                تعديل
              </Button>
              <Button
                onClick={() => setStatusOpen(true)}
                startIcon={<PauseCircleOutlineRounded />}
                sx={{
                  color: active ? "#c94f4f" : "#29734A",
                  backgroundColor: active ? "rgba(201,79,79,0.08)" : "rgba(116,201,154,0.14)",
                }}
              >
                {active ? "إيقاف" : "تفعيل"}
              </Button>
            </>
          )}

          {canDelete && (
            <Button
              onClick={() => setDeleteOpen(true)}
              startIcon={<DeleteOutlineRounded />}
              sx={{ color: "#c94f4f", backgroundColor: "rgba(201,79,79,0.08)" }}
            >
              حذف
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 1,
          p: 1.5,
          borderRadius: "17px",
          backgroundColor: "#ffffff",
          border: "1px solid #ded8cd",
          boxShadow: "0 8px 22px rgba(36,74,112,0.035)",
        }}
      >
        <Typography sx={{ color: "#122f4d", fontSize: "13px", fontWeight: 800 }}>
          بيانات الفصل
        </Typography>

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              lg: "repeat(3,minmax(0,1fr))",
            },
            gap: 0.8,
          }}
        >
          {details.map((item) => <InfoCard key={item.label} {...item} />)}
        </Box>

        <Box
          sx={{
            mt: 0.9,
            p: 1.2,
            borderRadius: "13px",
            backgroundColor: "#fffcf7",
            border: "1px solid rgba(36,74,112,0.08)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ color: "#7e8791", fontSize: "7.7px", fontWeight: 700 }}>
              نسبة الإشغال
            </Typography>
            <Typography sx={{ color: "#122f4d", fontSize: "9px", fontWeight: 800 }}>
              {studentCount}/{capacity || "—"} • {occupancy}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={occupancy}
            sx={{
              mt: 0.7,
              height: 7,
              borderRadius: "999px",
              backgroundColor: "rgba(36,74,112,0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: "999px",
                backgroundColor: occupancy >= 90 ? "#c94f4f" : "#d3a44f",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            mt: 0.9,
            p: 1.2,
            borderRadius: "13px",
            backgroundColor: "#fffcf7",
            border: "1px solid rgba(36,74,112,0.08)",
          }}
        >
          <Typography sx={{ color: "#7e8791", fontSize: "7.7px", fontWeight: 700 }}>
            المواد المرتبطة
          </Typography>
          {subjectNames.length ? (
            <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 0.7 }}>
              {subjectNames.map((subject, index) => (
                <Chip
                  key={`${subject}-${index}`}
                  label={subject}
                  sx={{
                    color: "#244a70",
                    backgroundColor: "rgba(36,74,112,0.07)",
                    fontSize: "7.5px",
                    fontWeight: 700,
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ mt: 0.45, color: "#7e8791", fontSize: "8.5px" }}>
              لا توجد مواد مرتبطة بهذا الفصل.
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 1,
          overflow: "hidden",
          borderRadius: "17px",
          backgroundColor: "#ffffff",
          border: "1px solid #ded8cd",
          boxShadow: "0 8px 22px rgba(36,74,112,0.035)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ p: 1.35, borderBottom: "1px solid #ded8cd" }}
        >
          <Box>
            <Typography sx={{ color: "#122f4d", fontSize: "13px", fontWeight: 800 }}>
              طلاب الفصل
            </Typography>
            <Typography sx={{ mt: 0.15, color: "#7e8791", fontSize: "7.8px" }}>
              {classStudents.length} طالب مرتبط بالفصل.
            </Typography>
          </Box>

          {canUpdate && (
            <Button
              onClick={openAddStudent}
              startIcon={<AddRounded />}
              sx={{ color: "#ffffff", backgroundColor: "#244a70" }}
            >
              إضافة طالب
            </Button>
          )}
        </Stack>

        {studentsError && <Alert severity="warning" sx={{ m: 1.2 }}>{studentsError}</Alert>}

        {studentsLoading ? (
          <Stack spacing={0.8} sx={{ p: 1.3 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height={52} sx={{ borderRadius: "12px" }} />
            ))}
          </Stack>
        ) : classStudents.length ? (
          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 720,
                borderCollapse: "collapse",
                "& th": {
                  px: 1.4,
                  py: 1.15,
                  color: "#7e8791",
                  backgroundColor: "rgba(36,74,112,0.035)",
                  borderBottom: "1px solid #ded8cd",
                  textAlign: "right",
                  fontSize: "8.3px",
                  fontWeight: 800,
                },
                "& td": {
                  px: 1.4,
                  py: 1.15,
                  color: "#193754",
                  borderBottom: "1px solid rgba(222,216,205,0.7)",
                  fontSize: "9px",
                },
              }}
            >
              <Box component="thead">
                <Box component="tr">
                  <Box component="th">الطالب</Box>
                  <Box component="th">البريد</Box>
                  <Box component="th">السنة الدراسية</Box>
                  <Box component="th">الحالة</Box>
                  {canUpdate && <Box component="th" sx={{ textAlign: "center !important" }}>الإجراء</Box>}
                </Box>
              </Box>

              <Box component="tbody">
                {classStudents.map((student, index) => (
                  <Box component="tr" key={getStudentId(student) || index}>
                    <Box component="td">
                      <Typography sx={{ color: "#122f4d", fontSize: "9.5px", fontWeight: 800 }}>
                        {getStudentName(student)}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ direction: "ltr", textAlign: "right" }}>
                      {getStudentEmail(student)}
                    </Box>
                    <Box component="td">{getStudentAcademicYear(student)}</Box>
                    <Box component="td">
                      <Chip
                        size="small"
                        label={isStudentActive(student) ? "نشط" : "موقوف"}
                        sx={{
                          height: 23,
                          color: isStudentActive(student) ? "#29734A" : "#A44343",
                          backgroundColor: isStudentActive(student)
                            ? "rgba(116,201,154,0.17)"
                            : "rgba(201,79,79,0.12)",
                          fontSize: "7px",
                          fontWeight: 800,
                        }}
                      />
                    </Box>
                    {canUpdate && (
                      <Box component="td" sx={{ textAlign: "center !important" }}>
                        <Button
                          onClick={() => {
                            setSelectedStudent(student);
                            setRemoveStudentOpen(true);
                          }}
                          startIcon={<PersonRemoveRounded />}
                          sx={{ color: "#c94f4f", backgroundColor: "rgba(201,79,79,0.08)", fontSize: "7.8px" }}
                        >
                          إزالة
                        </Button>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ minHeight: 190, display: "grid", placeItems: "center", p: 2, textAlign: "center" }}>
            <Box>
              <GroupsRounded sx={{ color: "#d3a44f", fontSize: 38 }} />
              <Typography sx={{ mt: 0.7, color: "#122f4d", fontSize: "12px", fontWeight: 800 }}>
                لا يوجد طلاب في الفصل
              </Typography>
              <Typography sx={{ mt: 0.3, color: "#7e8791", fontSize: "8px" }}>
                أضف الطلاب إلى الفصل لبدء تنظيمهم.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <ClassFormDialog
        open={formOpen}
        classItem={classItem}
        teachers={teachers}
        loading={formLoading}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <ClassStatusDialog
        open={statusOpen}
        classItem={classItem}
        loading={statusLoading}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleToggleStatus}
      />
      <ClassDeleteDialog
        open={deleteOpen}
        classItem={classItem}
        loading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <ClassStudentDialog
        open={addStudentOpen}
        students={allStudents}
        existingStudentIds={existingStudentIds}
        loading={addStudentLoading}
        onClose={() => setAddStudentOpen(false)}
        onConfirm={handleAddStudent}
      />
      <ClassStudentRemoveDialog
        open={removeStudentOpen}
        student={selectedStudent}
        loading={removeStudentLoading}
        onClose={() => {
          setRemoveStudentOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleRemoveStudent}
      />
    </Box>
  );
};

export default SchoolClassDetails;
