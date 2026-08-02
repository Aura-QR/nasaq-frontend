import {
  AddRounded,
  AdminPanelSettingsRounded,
  CheckCircleRounded,
  GroupsRounded,
  PersonOffRounded,
  RefreshRounded,
  SearchRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
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

import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";

import TeacherDeleteDialog from "@/components/school/teachers/TeacherDeleteDialog";
import TeacherManagerRoleDialog from "@/components/school/teachers/TeacherManagerRoleDialog";
import TeacherStatusDialog from "@/components/school/teachers/TeacherStatusDialog";
import TeachersTable from "@/components/school/teachers/TeachersTable";

import {
  getSchoolTeachers,
  toggleSchoolTeacherActive,
  deleteSchoolTeacher,
} from "@/APIs/school/teachers";

import {
  demoteTeacherFromManager,
  promoteTeacherToManager,
} from "@/APIs/school/managers";

import {
  ROLES,
} from "@/shared/auth/roles";

import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

import {
  getTeacherId,
  isTeacherActive,
  isTeacherManager,
} from "@/utils/school/teacherData";

import {
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const extractTeachers = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  return (
    [
      value?.docs,
      value?.items,
      value?.teachers,
      value?.results,
      value?.records,
      value?.data,
    ].find(
      Array.isArray
    ) || []
  );
};

const extractPagination = (
  value,
  page,
  limit
) => {
  const source =
    value?.pagination ||
    value?.meta ||
    value;

  const totalDocs =
    Number(
      source?.totalDocs ??
      source?.total ??
      source?.count
    );

  const totalPages =
    Number(
      source?.totalPages ??
      source?.pages
    );

  if (
    !Number.isFinite(
      totalDocs
    ) &&
    !Number.isFinite(
      totalPages
    )
  ) {
    return null;
  }

  return {
    ...source,
    page:
      Number(
        source?.page ??
        source?.currentPage
      ) ||
      page,
    limit:
      Number(
        source?.limit ??
        source?.pageSize
      ) ||
      limit,
    totalDocs:
      Number.isFinite(
        totalDocs
      )
        ? totalDocs
        : 0,
    totalPages:
      Number.isFinite(
        totalPages
      )
        ? totalPages
        : 1,
  };
};

const StatCard = ({
  label,
  value,
  icon,
}) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: 82,
      p: 1.25,
      display: "flex",
      alignItems:
        "center",
      gap: 0.9,
      borderRadius:
        "15px",
      border:
        "1px solid #ded8cd",
      backgroundColor:
        "#ffffff",
      boxShadow:
        "0 7px 20px rgba(36,74,112,0.035)",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        flexShrink: 0,
        display: "grid",
        placeItems:
          "center",
        borderRadius:
          "11px",
        color:
          "#b78430",
        backgroundColor:
          "#fbf0d8",
        "& svg": {
          fontSize: 20,
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
            "8px",
          fontWeight:
            700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.1,
          color:
            "#122f4d",
          fontSize:
            "19px",
          fontWeight:
            800,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const List = () => {
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
    usePermissions(
      "teachers"
    );

  const canManageRole =
    role === ROLES.OWNER;

  const [
    teachers,
    setTeachers,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    selectedTeacher,
    setSelectedTeacher,
  ] = useState(null);

  const [
    statusOpen,
    setStatusOpen,
  ] = useState(false);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [
    roleOpen,
    setRoleOpen,
  ] = useState(false);

  const [
    roleLoading,
    setRoleLoading,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const debouncedSearch =
    useDebounce(
      search,
      500
    );

  const filters =
    useMemo(
      () => ({
        page,
        limit,
        name:
          debouncedSearch ||
          undefined,
        isActive:
          status === ""
            ? undefined
            : status ===
              "true",
      }),
      [
        page,
        limit,
        debouncedSearch,
        status,
      ]
    );

  const loadTeachers =
    useCallback(
      async ({
        force = false,
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await getSchoolTeachers(
            filters,
            {
              force,
            }
          );

        if (
          response?.status ===
            false
        ) {
          setTeachers([]);
          setPagination(null);
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

        setTeachers(
          nextTeachers
        );

        setPagination(
          extractPagination(
            response?.data,
            page,
            limit
          )
        );

        setLoading(false);
      },
      [
        JSON.stringify(
          filters
        ),
      ]
    );

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    status,
    limit,
  ]);

  const stats =
    useMemo(
      () => ({
        total:
          pagination?.totalDocs ??
          teachers.length,

        visible:
          teachers.length,

        active:
          teachers.filter(
            isTeacherActive
          ).length,

        managers:
          teachers.filter(
            isTeacherManager
          ).length,
      }),
      [
        teachers,
        pagination,
      ]
    );

  const handleStatusConfirm =
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
          ? "تم إيقاف حساب المعلم"
          : "تم تفعيل حساب المعلم"
      );

      setStatusOpen(false);
      setSelectedTeacher(null);
      setStatusLoading(false);

      await loadTeachers({
        force: true,
        silent: true,
      });
    };

  const handleRoleConfirm =
    async () => {
      if (!canManageRole) {
        toast.error(
          "هذه العملية متاحة لمالك المدرسة فقط"
        );
        return;
      }

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

      const wasManager =
        isTeacherManager(
          selectedTeacher
        );

      setRoleLoading(true);

      const response =
        wasManager
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
          (
            wasManager
              ? "تعذر إلغاء دور المدير"
              : "تعذر ترقية المعلم"
          )
        );
        setRoleLoading(false);
        return;
      }

      toast.success(
        wasManager
          ? "تم إلغاء دور المدير وإعادة الحساب إلى معلم"
          : "تمت ترقية المعلم إلى مدير بنجاح"
      );

      setRoleOpen(false);
      setSelectedTeacher(null);
      setRoleLoading(false);

      await loadTeachers({
        force: true,
        silent: true,
      });
    };

  const handleDeleteConfirm =
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
        "تم حذف المعلم بنجاح"
      );

      setDeleteOpen(false);
      setSelectedTeacher(null);
      setDeleteLoading(false);

      if (
        teachers.length === 1 &&
        page > 1
      ) {
        setPage(
          (previous) =>
            previous - 1
        );
        return;
      }

      await loadTeachers({
        force: true,
        silent: true,
      });
    };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.7,
              md: 2.1,
            },
            borderRadius:
              "18px",
            border:
              "1px solid rgba(36,74,112,0.08)",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.44))",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.06)",
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
            spacing={1.4}
          >
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.7}
              >
                <Typography
                  component="h1"
                  sx={{
                    color:
                      "#122f4d",
                    fontSize: {
                      xs: "21px",
                      md: "25px",
                    },
                    fontWeight:
                      800,
                  }}
                >
                  إدارة المعلمين
                </Typography>

                <Chip
                  size="small"
                  label={
                    stats.total
                  }
                  sx={{
                    color:
                      "#b78430",
                    backgroundColor:
                      "#fbf0d8",
                    fontWeight:
                      800,
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    "#7e8791",
                  fontSize:
                    "10px",
                }}
              >
                إدارة بيانات المعلمين وحالات الحسابات والأدوار الإدارية.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={0.8}
            >
              <Button
                type="button"
                onClick={() =>
                  loadTeachers({
                    force: true,
                  })
                }
                startIcon={
                  <RefreshRounded />
                }
                variant="outlined"
                sx={{
                  minHeight: 42,
                  borderRadius:
                    "12px",
                  color:
                    "#244a70",
                  borderColor:
                    "rgba(36,74,112,0.18)",
                  fontWeight:
                    800,
                }}
              >
                تحديث
              </Button>

              {permissions.add && (
                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/users/teachers/add"
                    )
                  }
                  startIcon={
                    <AddRounded />
                  }
                  variant="contained"
                  sx={{
                    minHeight: 42,
                    px: 2,
                    borderRadius:
                      "12px",
                    color:
                      "#ffffff",
                    backgroundColor:
                      "#244a70",
                    fontWeight:
                      800,
                    boxShadow:
                      "none",
                    "&:hover": {
                      backgroundColor:
                        "#1b3d61",
                      boxShadow:
                        "none",
                    },
                  }}
                >
                  إضافة معلم جديد
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg:
                "repeat(4,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <StatCard
            label="إجمالي المعلمين"
            value={stats.total}
            icon={
              <GroupsRounded />
            }
          />

          <StatCard
            label="الظاهر في الصفحة"
            value={stats.visible}
            icon={
              <SupervisorAccountRounded />
            }
          />

          <StatCard
            label="الحسابات النشطة"
            value={stats.active}
            icon={
              <CheckCircleRounded />
            }
          />

          <StatCard
            label="معلمون بدور مدير"
            value={stats.managers}
            icon={
              <AdminPanelSettingsRounded />
            }
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            p: 1.2,
            borderRadius:
              "16px",
            border:
              "1px solid #ded8cd",
            backgroundColor:
              "#ffffff",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث باسم المعلم..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    minHeight: 42,
                    borderRadius:
                      "12px",
                    backgroundColor:
                      "#fffcf7",
                  },
              }}
            />

            <TextField
              select
              size="small"
              label="الحالة"
              value={status}
              onChange={(
                event
              ) =>
                setStatus(
                  event.target.value
                )
              }
              sx={{
                width: {
                  xs: "100%",
                  md: 220,
                },
                "& .MuiOutlinedInput-root":
                  {
                    minHeight: 42,
                    borderRadius:
                      "12px",
                    backgroundColor:
                      "#fffcf7",
                  },
              }}
            >
              <MenuItem value="">
                كل الحالات
              </MenuItem>

              <MenuItem value="true">
                نشط
              </MenuItem>

              <MenuItem value="false">
                موقوف
              </MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 1.25,
              borderRadius:
                "14px",
            }}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            overflow:
              "hidden",
            borderRadius:
              "18px",
            border:
              "1px solid #ded8cd",
            backgroundColor:
              "#ffffff",
          }}
        >
          {!loading &&
          teachers.length === 0 ? (
            <Box
              sx={{
                minHeight: 300,
                display: "grid",
                placeItems:
                  "center",
                p: 3,
                textAlign:
                  "center",
              }}
            >
              <Box>
                <PersonOffRounded
                  sx={{
                    fontSize: 48,
                    color:
                      "#d3a44f",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    color:
                      "#122f4d",
                    fontWeight:
                      800,
                  }}
                >
                  لا توجد بيانات معلمين مطابقة
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color:
                      "#7e8791",
                    fontSize:
                      "10px",
                  }}
                >
                  غيّر البحث أو الحالة، أو أضف معلمًا جديدًا.
                </Typography>
              </Box>
            </Box>
          ) : (
            <TeachersTable
              teachers={
                teachers
              }
              loading={
                loading
              }
              canUpdate={
                permissions.edit
              }
              canDelete={
                permissions.delete
              }
              canManageRole={
                canManageRole
              }
              onView={(
                teacher
              ) =>
                navigate(
                  `/users/teachers/${getTeacherId(
                    teacher
                  )}`
                )
              }
              onEdit={(
                teacher
              ) =>
                navigate(
                  `/users/teachers/edit/${getTeacherId(
                    teacher
                  )}`
                )
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
                setRoleOpen(
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

          {pagination && (
            <Box
              sx={{
                p: 1,
                borderTop:
                  "1px solid rgba(222,216,205,0.75)",
              }}
            >
              <PaginationControls
                pagination={
                  pagination
                }
                page={page}
                onPageChange={
                  setPage
                }
                limit={limit}
                onLimitChange={
                  setLimit
                }
                label="عدد المعلمين"
              />
            </Box>
          )}
        </Paper>
      </Box>

      <TeacherStatusDialog
        open={statusOpen}
        teacher={
          selectedTeacher
        }
        loading={
          statusLoading
        }
        onClose={() => {
          setStatusOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={
          handleStatusConfirm
        }
      />

      <TeacherManagerRoleDialog
        open={roleOpen}
        teacher={
          selectedTeacher
        }
        loading={
          roleLoading
        }
        onClose={() => {
          setRoleOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={
          handleRoleConfirm
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
          setDeleteOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={
          handleDeleteConfirm
        }
      />
    </Container>
  );
};

export default List;
