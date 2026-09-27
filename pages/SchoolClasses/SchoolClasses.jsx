import {
  AddRounded,
  GroupsRounded,
  MeetingRoomRounded,
  PersonOffRounded,
  RefreshRounded,
  SearchRounded,
  WeekendRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createSchoolClass,
  deleteSchoolClass,
  getSchoolClasses,
  toggleSchoolClassActive,
  updateSchoolClass,
} from "@/APIs/school/classes";
import { getSchoolTeachersList } from "@/APIs/school/teachers";
import ClassDeleteDialog from "@/components/school/classes/ClassDeleteDialog";
import ClassFormDialog from "@/components/school/classes/ClassFormDialog";
import ClassesTable from "@/components/school/classes/ClassesTable";
import ClassStatusDialog from "@/components/school/classes/ClassStatusDialog";
import { getStoredPermissions, hasPermission } from "@/shared/auth/permissions";
import { ROLES } from "@/shared/auth/roles";
import {
  extractClasses,
  extractClassesPagination,
  getClassAcademicYear,
  getClassCapacity,
  getClassId,
  getClassRoomNumber,
  getClassStudentCount,
  getClassTeacherName,
  isClassActive,
} from "@/utils/school/classData";
import { extractTeachers } from "@/utils/school/teacherData";
import { getSchoolSessionInfo } from "@/utils/school/schoolSession";

const PAGE_LIMIT = 10;

const StatCard = ({ title, value, icon }) => (
  <Box
    sx={{
      minHeight: 72,
      p: 1.05,
      display: "flex",
      alignItems: "center",
      gap: 0.8,
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      border: "1px solid #ded8cd",
      boxShadow: "0 7px 18px rgba(36,74,112,0.035)",
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "10px",
        color: "#b78430",
        backgroundColor: "#fbf0d8",
        "& svg": { fontSize: 18 },
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ color: "#7e8791", fontSize: "7.5px", fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 0.05, color: "#122f4d", fontSize: "17px", fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const SchoolClasses = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const authState = getAuthUser();
  const { role } = getSchoolSessionInfo(authState);
  const permissions =
    authState?.permissions || authState?.user?.permissions || getStoredPermissions();

  const fullAccess = [ROLES.OWNER, ROLES.SUPERVISOR].includes(role);
  const canCreate = fullAccess || hasPermission(permissions, "school.classes.create");
  const canUpdate = fullAccess || hasPermission(permissions, "school.classes.update");
  const canDelete = fullAccess || hasPermission(permissions, "school.classes.delete");

  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await getSchoolClasses({
      page: pagination.page,
      limit: pagination.limit,
    });

    if (response?.status === false) {
      setError(response?.message || "تعذر تحميل الفصول");
      setLoading(false);
      return;
    }

    const nextClasses = extractClasses(response?.data);
    const nextPagination = extractClassesPagination(response?.data, {
      page: pagination.page,
      limit: pagination.limit,
      total: nextClasses.length,
    });

    setClasses(nextClasses);
    setPagination((previous) => ({ ...previous, ...nextPagination }));
    setLoading(false);
  }, [pagination.page, pagination.limit]);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    const response = await getSchoolTeachersList();

    if (response?.status === false) {
      setTeachers([]);
      setTeachersLoading(false);
      return;
    }

    setTeachers(extractTeachers(response?.data));
    setTeachersLoading(false);
  }, []);

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, [loadClasses, loadTeachers]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classes;

    return classes.filter((classItem) =>
      [
        getClassRoomNumber(classItem),
        getClassAcademicYear(classItem),
        getClassTeacherName(classItem),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [classes, search]);

  const activeCount = classes.filter(isClassActive).length;
  const inactiveCount = classes.length - activeCount;
  const totalCapacity = classes.reduce(
    (total, classItem) => total + getClassCapacity(classItem),
    0
  );
  const totalStudents = classes.reduce(
    (total, classItem) => total + getClassStudentCount(classItem),
    0
  );

  const openCreate = () => {
    setSelectedClass(null);
    setFormOpen(true);
  };

  const openEdit = (classItem) => {
    setSelectedClass(classItem);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setFormLoading(true);
    const classId = getClassId(selectedClass);
    const response = classId
      ? await updateSchoolClass(classId, payload)
      : await createSchoolClass(payload);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حفظ بيانات الفصل");
      setFormLoading(false);
      return;
    }

    toast.success(classId ? "تم تعديل بيانات الفصل" : "تم إضافة الفصل بنجاح");
    setFormOpen(false);
    setSelectedClass(null);
    setFormLoading(false);
    await loadClasses();
  };

  const handleToggleStatus = async () => {
    const classId = getClassId(selectedClass);
    if (!classId) {
      toast.error("معرّف الفصل غير موجود");
      return;
    }

    setStatusLoading(true);
    const response = await toggleSchoolClassActive(classId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر تغيير حالة الفصل");
      setStatusLoading(false);
      return;
    }

    toast.success(isClassActive(selectedClass) ? "تم إيقاف الفصل" : "تم تفعيل الفصل");
    setStatusOpen(false);
    setSelectedClass(null);
    setStatusLoading(false);
    await loadClasses();
  };

  const handleDelete = async () => {
    const classId = getClassId(selectedClass);
    if (!classId) {
      toast.error("معرّف الفصل غير موجود");
      return;
    }

    setDeleteLoading(true);
    const response = await deleteSchoolClass(classId);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر حذف الفصل");
      setDeleteLoading(false);
      return;
    }

    toast.success("تم حذف الفصل");
    setDeleteOpen(false);
    setSelectedClass(null);
    setDeleteLoading(false);

    if (classes.length === 1 && pagination.page > 1) {
      setPagination((previous) => ({ ...previous, page: previous.page - 1 }));
    } else {
      await loadClasses();
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,minmax(0,1fr))",
            lg: "repeat(4,minmax(0,1fr))",
          },
          gap: 0.75,
        }}
      >
        <StatCard title="إجمالي الفصول" value={pagination.total} icon={<MeetingRoomRounded />} />
        <StatCard title="النشطة في الصفحة" value={activeCount} icon={<WeekendRounded />} />
        <StatCard title="الموقوفة في الصفحة" value={inactiveCount} icon={<PersonOffRounded />} />
        <StatCard title="الطلاب / السعة" value={`${totalStudents}/${totalCapacity}`} icon={<GroupsRounded />} />
      </Box>

      <Box
        sx={{
          mt: 1,
          p: 1.3,
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid #ded8cd",
          boxShadow: "0 8px 22px rgba(36,74,112,0.035)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={1}
        >
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث برقم الغرفة أو السنة الدراسية أو المعلم..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchRounded /></InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", md: 390 },
              "& .MuiOutlinedInput-root": {
                minHeight: 42,
                borderRadius: "12px",
                backgroundColor: "#fffcf7",
                fontSize: "9.5px",
              },
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
            <Button
              onClick={() => {
                loadClasses();
                loadTeachers();
              }}
              startIcon={<RefreshRounded />}
              sx={{ color: "#244a70", backgroundColor: "rgba(36,74,112,0.07)" }}
            >
              تحديث
            </Button>

            {canCreate && (
              <Button
                onClick={openCreate}
                startIcon={<AddRounded />}
                sx={{ color: "#ffffff", backgroundColor: "#244a70", "&:hover": { backgroundColor: "#1b3d61" } }}
              >
                إضافة فصل
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={loadClasses}>إعادة المحاولة</Button>}
          sx={{ mt: 1, borderRadius: "12px" }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mt: 1,
          overflow: "hidden",
          borderRadius: "17px",
          backgroundColor: "#ffffff",
          border: "1px solid #ded8cd",
          boxShadow: "0 9px 24px rgba(36,74,112,0.04)",
        }}
      >
        {!loading && !error && filteredClasses.length === 0 ? (
          <Box sx={{ minHeight: 310, display: "grid", placeItems: "center", p: 3, textAlign: "center" }}>
            <Box>
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  mx: "auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "18px",
                  color: "#b78430",
                  backgroundColor: "#fbf0d8",
                  "& svg": { fontSize: 32 },
                }}
              >
                <MeetingRoomRounded />
              </Box>
              <Typography sx={{ mt: 1.4, color: "#122f4d", fontSize: "15px", fontWeight: 800 }}>
                {search ? "لا توجد نتائج مطابقة" : "لا توجد فصول حتى الآن"}
              </Typography>
              <Typography sx={{ mt: 0.5, color: "#7e8791", fontSize: "8.5px" }}>
                {search ? "جرّب البحث بكلمة مختلفة." : "أضف أول فصل لبدء تنظيم الطلاب والمواد."}
              </Typography>
              {!search && canCreate && (
                <Button onClick={openCreate} startIcon={<AddRounded />} sx={{ mt: 1.5, color: "#ffffff", backgroundColor: "#244a70" }}>
                  إضافة أول فصل
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          <ClassesTable
            classes={filteredClasses}
            loading={loading}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onView={(classItem) => navigate(`/school/classes/${getClassId(classItem)}`)}
            onEdit={openEdit}
            onToggleStatus={(classItem) => {
              setSelectedClass(classItem);
              setStatusOpen(true);
            }}
            onDelete={(classItem) => {
              setSelectedClass(classItem);
              setDeleteOpen(true);
            }}
          />
        )}

        {!loading && !error && pagination.totalPages > 1 && (
          <Stack alignItems="center" sx={{ py: 1.4, borderTop: "1px solid #ded8cd" }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, nextPage) =>
                setPagination((previous) => ({ ...previous, page: nextPage }))
              }
              shape="rounded"
              size="small"
            />
          </Stack>
        )}
      </Box>

      <ClassFormDialog
        open={formOpen}
        classItem={selectedClass}
        teachers={teachers}
        teachersLoading={teachersLoading}
        loading={formLoading}
        onClose={() => {
          setFormOpen(false);
          setSelectedClass(null);
        }}
        onSave={handleSave}
      />

      <ClassStatusDialog
        open={statusOpen}
        classItem={selectedClass}
        loading={statusLoading}
        onClose={() => {
          setStatusOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleToggleStatus}
      />

      <ClassDeleteDialog
        open={deleteOpen}
        classItem={selectedClass}
        loading={deleteLoading}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default SchoolClasses;
