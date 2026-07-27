import {
  AddRounded,
  GroupsRounded,
  PersonOffRounded,
  PersonRounded,
  RefreshRounded,
  SearchRounded,
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

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  createSchoolStudent,
  deleteSchoolStudent,
  getSchoolStudents,
  toggleSchoolStudentActive,
  updateSchoolStudent,
} from "@/APIs/school/students";

import StudentDeleteDialog from "@/components/school/students/StudentDeleteDialog";
import StudentFormDialog from "@/components/school/students/StudentFormDialog";
import StudentStatusDialog from "@/components/school/students/StudentStatusDialog";
import StudentsTable from "@/components/school/students/StudentsTable";

import {
  getStoredPermissions,
  hasPermission,
} from "@/shared/auth/permissions";

import {
  ROLES,
} from "@/shared/auth/roles";

import {
  extractStudents,
  extractStudentsPagination,
  getStudentEmail,
  getStudentId,
  getStudentName,
  getStudentPhone,
  isStudentActive,
} from "@/utils/school/studentData";

import {
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const PAGE_LIMIT = 10;

const StatCard = ({
  title,
  value,
  icon,
}) => (
  <Box
    sx={{
      minHeight: 72,
      p: 1.05,
      display: "flex",
      alignItems:
        "center",
      gap: 0.8,
      borderRadius:
        "14px",
      backgroundColor:
        "#ffffff",
      border:
        "1px solid #ded8cd",
      boxShadow:
        "0 7px 18px rgba(36,74,112,0.035)",
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        display: "grid",
        placeItems:
          "center",
        borderRadius:
          "10px",
        color:
          "#b78430",
        backgroundColor:
          "#fbf0d8",
        "& svg": {
          fontSize: 18,
        },
      }}
    >
      {icon}
    </Box>

    <Box>
      <Typography
        sx={{
          color:
            "#7e8791",
          fontSize:
            "7.5px",
          fontWeight:
            700,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.05,
          color:
            "#122f4d",
          fontSize:
            "17px",
          fontWeight:
            800,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const SchoolStudents = () => {
  const navigate =
    useNavigate();

  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const {
    role,
  } =
    getSchoolSessionInfo(
      authState
    );

  const permissions =
    authState?.permissions ||
    authState?.user
      ?.permissions ||
    getStoredPermissions();

  const fullAccess =
    [
      ROLES.OWNER,
      ROLES.SUPERVISOR,
    ].includes(role);

  const canCreate =
    fullAccess ||
    hasPermission(
      permissions,
      "school.students.create"
    );

  const canUpdate =
    fullAccess ||
    hasPermission(
      permissions,
      "school.students.update"
    );

  const canDelete =
    fullAccess ||
    hasPermission(
      permissions,
      "school.students.delete"
    );

  const [students, setStudents] =
    useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit:
      PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    formLoading,
    setFormLoading,
  ] = useState(false);

  const [
    statusOpen,
    setStatusOpen,
  ] = useState(false);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const loadStudents =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const response =
        await getSchoolStudents({
          page:
            pagination.page,
          limit:
            pagination.limit,
        });

      if (
        response?.status ===
        false
      ) {
        setError(
          response?.message ||
            "تعذر تحميل الطلاب"
        );

        setLoading(false);
        return;
      }

      const nextStudents =
        extractStudents(
          response?.data
        );

      const nextPagination =
        extractStudentsPagination(
          response?.data,
          {
            page:
              pagination.page,
            limit:
              pagination.limit,
            total:
              nextStudents.length,
          }
        );

      setStudents(
        nextStudents
      );

      setPagination(
        (previous) => ({
          ...previous,
          ...nextPagination,
        })
      );

      setLoading(false);
    }, [
      pagination.page,
      pagination.limit,
    ]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) =>
          [
            getStudentName(
              student
            ),
            getStudentEmail(
              student
            ),
            getStudentPhone(
              student
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      students,
      search,
    ]);

  const currentActive =
    students.filter(
      isStudentActive
    ).length;

  const currentInactive =
    students.length -
    currentActive;

  const openCreate = () => {
    setSelectedStudent(
      null
    );
    setFormOpen(true);
  };

  const openEdit = (
    student
  ) => {
    setSelectedStudent(
      student
    );
    setFormOpen(true);
  };

  const handleSave =
    async (payload) => {
      setFormLoading(true);

      const studentId =
        getStudentId(
          selectedStudent
        );

      const response =
        studentId
          ? await updateSchoolStudent(
              studentId,
              payload
            )
          : await createSchoolStudent(
              payload
            );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر حفظ بيانات الطالب"
        );
        setFormLoading(false);
        return;
      }

      toast.success(
        studentId
          ? "تم تعديل بيانات الطالب"
          : "تم إضافة الطالب بنجاح"
      );

      setFormOpen(false);
      setSelectedStudent(
        null
      );
      setFormLoading(false);

      await loadStudents();
    };

  const handleToggleStatus =
    async () => {
      const studentId =
        getStudentId(
          selectedStudent
        );

      if (!studentId) {
        toast.error(
          "معرّف الطالب غير موجود"
        );
        return;
      }

      setStatusLoading(true);

      const response =
        await toggleSchoolStudentActive(
          studentId
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر تغيير حالة الطالب"
        );
        setStatusLoading(false);
        return;
      }

      toast.success(
        isStudentActive(
          selectedStudent
        )
          ? "تم إيقاف الطالب"
          : "تم تفعيل الطالب"
      );

      setStatusOpen(false);
      setSelectedStudent(
        null
      );
      setStatusLoading(false);

      await loadStudents();
    };

  const handleDelete =
    async () => {
      const studentId =
        getStudentId(
          selectedStudent
        );

      if (!studentId) {
        toast.error(
          "معرّف الطالب غير موجود"
        );
        return;
      }

      setDeleteLoading(true);

      const response =
        await deleteSchoolStudent(
          studentId
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر حذف الطالب"
        );
        setDeleteLoading(false);
        return;
      }

      toast.success(
        "تم حذف الطالب"
      );

      setDeleteOpen(false);
      setSelectedStudent(
        null
      );
      setDeleteLoading(false);

      if (
        students.length === 1 &&
        pagination.page > 1
      ) {
        setPagination(
          (previous) => ({
            ...previous,
            page:
              previous.page -
              1,
          })
        );
      } else {
        await loadStudents();
      }
    };

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            {
              xs: "1fr",
              sm:
                "repeat(3,minmax(0,1fr))",
            },
          gap: 0.8,
        }}
      >
        <StatCard
          title="إجمالي الطلاب"
          value={
            pagination.total
          }
          icon={
            <GroupsRounded />
          }
        />

        <StatCard
          title="النشطون في الصفحة"
          value={
            currentActive
          }
          icon={
            <PersonRounded />
          }
        />

        <StatCard
          title="الموقوفون في الصفحة"
          value={
            currentInactive
          }
          icon={
            <PersonOffRounded />
          }
        />
      </Box>

      <Box
        sx={{
          mt: 1,
          p: 1.3,
          borderRadius:
            "16px",
          backgroundColor:
            "#ffffff",
          border:
            "1px solid #ded8cd",
          boxShadow:
            "0 8px 22px rgba(36,74,112,0.035)",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          justifyContent="space-between"
          spacing={1}
        >
          <TextField
            size="small"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="ابحث باسم الطالب أو البريد أو الهاتف..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: {
                xs: "100%",
                md: 370,
              },
              "& .MuiOutlinedInput-root":
                {
                  minHeight: 42,
                  borderRadius:
                    "12px",
                  backgroundColor:
                    "#fffcf7",
                  fontSize:
                    "9.5px",
                },
            }}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={0.7}
          >
            <Button
              onClick={
                loadStudents
              }
              startIcon={
                <RefreshRounded />
              }
              sx={{
                color:
                  "#244a70",
                backgroundColor:
                  "rgba(36,74,112,0.07)",
              }}
            >
              تحديث
            </Button>

            {canCreate && (
              <Button
                onClick={
                  openCreate
                }
                startIcon={
                  <AddRounded />
                }
                sx={{
                  color:
                    "#ffffff",
                  backgroundColor:
                    "#244a70",
                  "&:hover": {
                    backgroundColor:
                      "#1b3d61",
                  },
                }}
              >
                إضافة طالب
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={
                loadStudents
              }
            >
              إعادة المحاولة
            </Button>
          }
          sx={{
            mt: 1,
            borderRadius:
              "12px",
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mt: 1,
          overflow:
            "hidden",
          borderRadius:
            "17px",
          backgroundColor:
            "#ffffff",
          border:
            "1px solid #ded8cd",
          boxShadow:
            "0 9px 24px rgba(36,74,112,0.04)",
        }}
      >
        {!loading &&
        !error &&
        filteredStudents.length ===
          0 ? (
          <Box
            sx={{
              minHeight: 310,
              display: "grid",
              placeItems:
                "center",
              p: 3,
              textAlign:
                "center",
            }}
          >
            <Box>
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  mx: "auto",
                  display: "grid",
                  placeItems:
                    "center",
                  borderRadius:
                    "18px",
                  color:
                    "#b78430",
                  backgroundColor:
                    "#fbf0d8",
                  "& svg": {
                    fontSize: 32,
                  },
                }}
              >
                <GroupsRounded />
              </Box>

              <Typography
                sx={{
                  mt: 1.4,
                  color:
                    "#122f4d",
                  fontSize:
                    "15px",
                  fontWeight:
                    800,
                }}
              >
                {search
                  ? "لا توجد نتائج مطابقة"
                  : "لا يوجد طلاب حتى الآن"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color:
                    "#7e8791",
                  fontSize:
                    "8.5px",
                }}
              >
                {search
                  ? "جرّب البحث بكلمة مختلفة."
                  : "أضف أول طالب لبدء إدارة بيانات الطلاب."}
              </Typography>

              {!search &&
                canCreate && (
                  <Button
                    onClick={
                      openCreate
                    }
                    startIcon={
                      <AddRounded />
                    }
                    sx={{
                      mt: 1.5,
                      color:
                        "#ffffff",
                      backgroundColor:
                        "#244a70",
                    }}
                  >
                    إضافة أول طالب
                  </Button>
                )}
            </Box>
          </Box>
        ) : (
          <StudentsTable
            students={
              filteredStudents
            }
            loading={
              loading
            }
            canUpdate={
              canUpdate
            }
            canDelete={
              canDelete
            }
            onView={(
              student
            ) =>
              navigate(
                `/school/students/${getStudentId(
                  student
                )}`
              )
            }
            onEdit={
              openEdit
            }
            onToggleStatus={(
              student
            ) => {
              setSelectedStudent(
                student
              );
              setStatusOpen(
                true
              );
            }}
            onDelete={(
              student
            ) => {
              setSelectedStudent(
                student
              );
              setDeleteOpen(
                true
              );
            }}
          />
        )}

        {!loading &&
          !error &&
          pagination.totalPages >
            1 && (
            <Stack
              alignItems="center"
              sx={{
                py: 1.4,
                borderTop:
                  "1px solid #ded8cd",
              }}
            >
              <Pagination
                count={
                  pagination.totalPages
                }
                page={
                  pagination.page
                }
                onChange={(
                  _,
                  nextPage
                ) =>
                  setPagination(
                    (previous) => ({
                      ...previous,
                      page:
                        nextPage,
                    })
                  )
                }
                shape="rounded"
                size="small"
              />
            </Stack>
          )}
      </Box>

      <StudentFormDialog
        open={formOpen}
        student={
          selectedStudent
        }
        loading={
          formLoading
        }
        onClose={() => {
          setFormOpen(false);
          setSelectedStudent(
            null
          );
        }}
        onSave={
          handleSave
        }
      />

      <StudentStatusDialog
        open={statusOpen}
        student={
          selectedStudent
        }
        loading={
          statusLoading
        }
        onClose={() => {
          setStatusOpen(
            false
          );
          setSelectedStudent(
            null
          );
        }}
        onConfirm={
          handleToggleStatus
        }
      />

      <StudentDeleteDialog
        open={deleteOpen}
        student={
          selectedStudent
        }
        loading={
          deleteLoading
        }
        onClose={() => {
          setDeleteOpen(
            false
          );
          setSelectedStudent(
            null
          );
        }}
        onConfirm={
          handleDelete
        }
      />
    </Box>
  );
};

export default SchoolStudents;
