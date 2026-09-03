import {
  AddRounded,
  AdminPanelSettingsRounded,
  PersonOffRounded,
  PersonRounded,
  RefreshRounded,
  SchoolRounded,
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
  createSchoolTeacher,
  deleteSchoolTeacher,
  getSchoolTeachers,
  toggleSchoolTeacherActive,
  updateSchoolTeacher,
} from "@/APIs/school/teachers";

import {
  demoteTeacherFromManager,
  promoteTeacherToManager,
} from "@/APIs/school/managers";

import TeacherDeleteDialog from "@/components/school/teachers/TeacherDeleteDialog";
import TeacherFormDialog from "@/components/school/teachers/TeacherFormDialog";
import TeacherManagerRoleDialog from "@/components/school/teachers/TeacherManagerRoleDialog";
import TeacherStatusDialog from "@/components/school/teachers/TeacherStatusDialog";
import TeachersTable from "@/components/school/teachers/TeachersTable";

import {
  getStoredPermissions,
  hasPermission,
} from "@/shared/auth/permissions";

import {
  ROLES,
} from "@/shared/auth/roles";

import {
  extractTeachers,
  extractTeachersPagination,
  getTeacherEmail,
  getTeacherId,
  getTeacherName,
  getTeacherPhone,
  isTeacherActive,
  isTeacherManager,
} from "@/utils/school/teacherData";

import {
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

// Ten meant five pages for a school with forty-three teachers, and the pager
// that would have let you reach them was itself hidden by the bug above.
const PAGE_LIMIT = 25;

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

const SchoolTeachers = () => {
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
      "school.teachers.create"
    );

  const canUpdate =
    fullAccess ||
    hasPermission(
      permissions,
      "school.teachers.update"
    );

  const canDelete =
    fullAccess ||
    hasPermission(
      permissions,
      "school.teachers.delete"
    );

  const canManageRole =
    fullAccess;

  const [teachers, setTeachers] =
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
    selectedTeacher,
    setSelectedTeacher,
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
    managerRoleOpen,
    setManagerRoleOpen,
  ] = useState(false);

  const [
    managerRoleLoading,
    setManagerRoleLoading,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const loadTeachers =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const response =
        await getSchoolTeachers({
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
            "تعذر تحميل المعلمين"
        );

        setLoading(false);
        return;
      }

      const nextTeachers =
        extractTeachers(
          response?.data
        );

      /*
       * `response`, not `response.data`. The pagination sits *beside* data in
       * the envelope, so handing over the inner array threw away the only copy
       * of it — and the pager, which renders on totalPages > 1, stayed hidden.
       */
      const nextPagination =
        extractTeachersPagination(
          response,
          {
            page:
              pagination.page,
            limit:
              pagination.limit,
            total:
              nextTeachers.length,
          }
        );

      setTeachers(
        nextTeachers
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
    loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return teachers;
      }

      return teachers.filter(
        (teacher) =>
          [
            getTeacherName(
              teacher
            ),
            getTeacherEmail(
              teacher
            ),
            getTeacherPhone(
              teacher
            ),
            teacher?.specialization,
            teacher?.qualification,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      teachers,
      search,
    ]);

  const activeCount =
    teachers.filter(
      isTeacherActive
    ).length;

  const inactiveCount =
    teachers.length -
    activeCount;

  const managerCount =
    teachers.filter(
      isTeacherManager
    ).length;

  const openCreate = () => {
    setSelectedTeacher(
      null
    );
    setFormOpen(true);
  };

  const openEdit = (
    teacher
  ) => {
    setSelectedTeacher(
      teacher
    );
    setFormOpen(true);
  };

  const handleSave =
    async (payload) => {
      setFormLoading(true);

      const teacherId =
        getTeacherId(
          selectedTeacher
        );

      const response =
        teacherId
          ? await updateSchoolTeacher(
              teacherId,
              payload
            )
          : await createSchoolTeacher(
              payload
            );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر حفظ بيانات المعلم"
        );
        setFormLoading(false);
        return;
      }

      toast.success(
        teacherId
          ? "تم تعديل بيانات المعلم"
          : "تم إضافة المعلم بنجاح"
      );

      setFormOpen(false);
      setSelectedTeacher(
        null
      );
      setFormLoading(false);

      await loadTeachers();
    };

  const handleToggleStatus =
    async () => {
      const teacherId =
        getTeacherId(
          selectedTeacher
        );

      if (!teacherId) {
        toast.error(
          "معرّف المعلم غير موجود"
        );
        return;
      }

      setStatusLoading(true);

      const response =
        await toggleSchoolTeacherActive(
          teacherId
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر تغيير حالة المعلم"
        );
        setStatusLoading(false);
        return;
      }

      toast.success(
        isTeacherActive(
          selectedTeacher
        )
          ? "تم إيقاف المعلم"
          : "تم تفعيل المعلم"
      );

      setStatusOpen(false);
      setSelectedTeacher(
        null
      );
      setStatusLoading(false);

      await loadTeachers();
    };

  const handleToggleManagerRole =
    async () => {
      const teacherId =
        getTeacherId(
          selectedTeacher
        );

      if (!teacherId) {
        toast.error(
          "معرّف المعلم غير موجود"
        );
        return;
      }

      const manager =
        isTeacherManager(
          selectedTeacher
        );

      setManagerRoleLoading(
        true
      );

      const response =
        manager
          ? await demoteTeacherFromManager(
              teacherId
            )
          : await promoteTeacherToManager(
              teacherId
            );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            (manager
              ? "تعذر إلغاء دور المدير"
              : "تعذر ترقية المعلم")
        );
        setManagerRoleLoading(
          false
        );
        return;
      }

      toast.success(
        manager
          ? "تم إلغاء دور المدير"
          : "تمت ترقية المعلم إلى مدير"
      );

      setManagerRoleOpen(
        false
      );
      setSelectedTeacher(
        null
      );
      setManagerRoleLoading(
        false
      );

      await loadTeachers();
    };

  const handleDelete =
    async () => {
      const teacherId =
        getTeacherId(
          selectedTeacher
        );

      if (!teacherId) {
        toast.error(
          "معرّف المعلم غير موجود"
        );
        return;
      }

      setDeleteLoading(true);

      const response =
        await deleteSchoolTeacher(
          teacherId
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر حذف المعلم"
        );
        setDeleteLoading(false);
        return;
      }

      toast.success(
        "تم حذف المعلم"
      );

      setDeleteOpen(false);
      setSelectedTeacher(
        null
      );
      setDeleteLoading(false);

      if (
        teachers.length === 1 &&
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
        await loadTeachers();
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
                "repeat(2,minmax(0,1fr))",
              lg:
                "repeat(4,minmax(0,1fr))",
            },
          gap: 0.75,
        }}
      >
        <StatCard
          title="إجمالي المعلمين"
          value={
            pagination.total
          }
          icon={
            <SchoolRounded />
          }
        />

        <StatCard
          title="النشطون في الصفحة"
          value={
            activeCount
          }
          icon={
            <PersonRounded />
          }
        />

        <StatCard
          title="الموقوفون في الصفحة"
          value={
            inactiveCount
          }
          icon={
            <PersonOffRounded />
          }
        />

        <StatCard
          title="المديرون من المعلمين"
          value={
            managerCount
          }
          icon={
            <AdminPanelSettingsRounded />
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
            placeholder="ابحث باسم المعلم أو البريد أو الهاتف أو التخصص..."
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
                md: 390,
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
                loadTeachers
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
                إضافة معلم
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
                loadTeachers
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
        filteredTeachers.length ===
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
                <SchoolRounded />
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
                  : "لا يوجد معلمون حتى الآن"}
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
                  : "أضف أول معلم لبدء إدارة هيئة التدريس."}
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
                    إضافة أول معلم
                  </Button>
                )}
            </Box>
          </Box>
        ) : (
          <TeachersTable
            teachers={
              filteredTeachers
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
            canManageRole={
              canManageRole
            }
            onView={(
              teacher
            ) =>
              navigate(
                `/school/teachers/${getTeacherId(
                  teacher
                )}`
              )
            }
            onEdit={
              openEdit
            }
            onToggleStatus={(
              teacher
            ) => {
              setSelectedTeacher(
                teacher
              );
              setStatusOpen(
                true
              );
            }}
            onToggleManagerRole={(
              teacher
            ) => {
              setSelectedTeacher(
                teacher
              );
              setManagerRoleOpen(
                true
              );
            }}
            onDelete={(
              teacher
            ) => {
              setSelectedTeacher(
                teacher
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

      <TeacherFormDialog
        open={formOpen}
        teacher={
          selectedTeacher
        }
        loading={
          formLoading
        }
        onClose={() => {
          setFormOpen(false);
          setSelectedTeacher(
            null
          );
        }}
        onSave={
          handleSave
        }
      />

      <TeacherStatusDialog
        open={statusOpen}
        teacher={
          selectedTeacher
        }
        loading={
          statusLoading
        }
        onClose={() => {
          setStatusOpen(
            false
          );
          setSelectedTeacher(
            null
          );
        }}
        onConfirm={
          handleToggleStatus
        }
      />

      <TeacherManagerRoleDialog
        open={
          managerRoleOpen
        }
        teacher={
          selectedTeacher
        }
        loading={
          managerRoleLoading
        }
        onClose={() => {
          setManagerRoleOpen(
            false
          );
          setSelectedTeacher(
            null
          );
        }}
        onConfirm={
          handleToggleManagerRole
        }
      />

      <TeacherDeleteDialog
        open={deleteOpen}
        teacher={
          selectedTeacher
        }
        loading={
          deleteLoading
        }
        onClose={() => {
          setDeleteOpen(
            false
          );
          setSelectedTeacher(
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

export default SchoolTeachers;
