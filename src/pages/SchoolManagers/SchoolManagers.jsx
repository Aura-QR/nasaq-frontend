import {
  AddRounded,
  AdminPanelSettingsRounded,
  DeleteOutlineRounded,
  EditNoteRounded,
  ErrorOutlineRounded,
  PersonAddAltRounded,
  RefreshRounded,
  SearchRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Skeleton,
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
  toast,
} from "react-toastify";

import {
  createSchoolManager,
  deleteSchoolManager,
  getSchoolManagers,
  updateManagerPermissions,
} from "@/APIs/school/managers";

import {
  getSchoolPermissions,
} from "@/APIs/school/permissions";

import ManagerFormDialog from "@/components/school/ManagerFormDialog";
import ManagerPermissionsDialog from "@/components/school/ManagerPermissionsDialog";
import SchoolConfirmDialog from "@/components/school/SchoolConfirmDialog";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

const unwrap = (
  value
) => {
  let current = value;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    if (
      !current ||
      typeof current !==
        "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    const next =
      current.data ??
      current.result ??
      current.payload ??
      current.response;

    if (
      !next ||
      next === current
    ) {
      break;
    }

    current = next;
  }

  return current;
};

const extractManagers = (
  payload
) => {
  const data =
    unwrap(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data?.managers,
    data?.admins,
    data?.users,
    data?.items,
    data?.docs,
    data?.results,
    data?.records,
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
};

const collectPermissionStrings =
  (value, output = new Set()) => {
    if (
      typeof value ===
        "string"
    ) {
      if (
        value.startsWith(
          "school."
        ) ||
        value === "*"
      ) {
        output.add(value);
      }

      return output;
    }

    if (
      Array.isArray(value)
    ) {
      value.forEach(
        (item) =>
          collectPermissionStrings(
            item,
            output
          )
      );

      return output;
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      Object.entries(
        value
      ).forEach(
        ([key, item]) => {
          if (
            key.startsWith(
              "school."
            ) &&
            item === true
          ) {
            output.add(key);
          }

          collectPermissionStrings(
            item,
            output
          );
        }
      );
    }

    return output;
  };

const extractPermissions = (
  payload
) =>
  Array.from(
    collectPermissionStrings(
      unwrap(payload)
    )
  ).filter(
    (permission) =>
      permission !== "*"
  );

const getManagerId = (
  manager
) =>
  manager?._id ||
  manager?.id ||
  manager?.managerId ||
  manager?.userId ||
  "";

const getManagerRole = (
  manager
) =>
  normalizeRole(
    manager?.role ||
      manager?.userRole
  );

const getManagerPermissions =
  (manager) => {
    const permissions =
      manager?.permissions ??
      manager?.managerPermissions ??
      [];

    return Array.isArray(
      permissions
    )
      ? permissions
      : [];
  };

const getManagerName = (
  manager
) =>
  manager?.username ||
  manager?.name ||
  manager?.fullName ||
  "مستخدم إداري";

const getPermissionShortLabel =
  (permission) => {
    const moduleName =
      String(
        permission || ""
      ).split(".")[1];

    const labels = {
      students: "الطلاب",
      teachers: "المعلمون",
      classes: "الفصول",
      subjects: "المواد",
      attendance: "الحضور",
      lectures: "الحصص",
      exams: "الاختبارات",
      financial: "المالية",
      managers: "المديرون",
    };

    return (
      labels[moduleName] ||
      moduleName ||
      permission
    );
  };

const StatCard = ({
  label,
  value,
  icon,
  loading,
}) => (
  <Box
    sx={{
      minHeight: 82,
      p: 1.25,

      display: "flex",
      alignItems:
        "center",

      gap: 0.9,

      borderRadius:
        "15px",

      backgroundColor:
        "#ffffff",

      border:
        "1px solid #ded8cd",

      boxShadow:
        "0 7px 20px rgba(36,74,112,0.035)",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,

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
            "7.5px",

          fontWeight:
            700,
        }}
      >
        {label}
      </Typography>

      {loading ? (
        <Skeleton
          width={44}
          height={28}
        />
      ) : (
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
      )}
    </Box>
  </Box>
);

const EmptyState = ({
  searched,
  onAdd,
  onResetSearch,
}) => (
  <Box
    sx={{
      minHeight: 300,

      px: 2,
      py: 4,

      display: "grid",
      placeItems:
        "center",

      textAlign:
        "center",
    }}
  >
    <Box>
      <Box
        sx={{
          width: 64,
          height: 64,

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
            fontSize: 31,
          },
        }}
      >
        <SupervisorAccountRounded />
      </Box>

      <Typography
        sx={{
          mt: 1.3,

          color:
            "#122f4d",

          fontSize:
            "14px",

          fontWeight:
            800,
        }}
      >
        {searched
          ? "لا توجد نتائج مطابقة"
          : "لا توجد حسابات إدارية حتى الآن"}
      </Typography>

      <Typography
        sx={{
          mt: 0.55,

          maxWidth: 380,

          color:
            "#7e8791",

          fontSize:
            "8.5px",

          lineHeight: 1.8,
        }}
      >
        {searched
          ? "جرّب البحث باسم مستخدم أو بريد إلكتروني مختلف."
          : "أضف أول مدير أو مشرف لتوزيع المسؤوليات والصلاحيات داخل المدرسة."}
      </Typography>

      <Button
        onClick={
          searched
            ? onResetSearch
            : onAdd
        }
        startIcon={
          searched ? (
            <RefreshRounded />
          ) : (
            <PersonAddAltRounded />
          )
        }
        sx={{
          mt: 1.5,

          minHeight: 40,
          px: 1.8,

          color:
            "#ffffff",

          backgroundColor:
            "#244a70",

          fontSize:
            "9px",

          fontWeight:
            800,

          "& .MuiButton-startIcon":
            {
              ml: 0.65,
              mr: 0,
            },

          "&:hover": {
            backgroundColor:
              "#1b3d61",
          },
        }}
      >
        {searched
          ? "مسح البحث"
          : "إضافة أول حساب"}
      </Button>
    </Box>
  </Box>
);

const SchoolManagers = () => {
  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const currentRole =
    normalizeRole(
      authState?.user?.role ||
        authState?.role
    );

  const [managers, setManagers] =
    useState([]);

  const [
    permissions,
    setPermissions,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    permissionsLoading,
    setPermissionsLoading,
  ] = useState(true);

  const [search, setSearch] =
    useState("");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    formLoading,
    setFormLoading,
  ] = useState(false);

  const [
    selectedManager,
    setSelectedManager,
  ] = useState(null);

  const [
    permissionsOpen,
    setPermissionsOpen,
  ] = useState(false);

  const [
    permissionsSaving,
    setPermissionsSaving,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const loadManagers =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const response =
        await getSchoolManagers();

      if (
        response?.status ===
        false
      ) {
        const message =
          response?.message ||
          "تعذر تحميل الحسابات الإدارية";

        setError(message);
        setLoading(false);
        return;
      }

      setManagers(
        extractManagers(
          response?.data
        )
      );

      setLoading(false);
    }, []);

  const loadPermissions =
    useCallback(async () => {
      setPermissionsLoading(
        true
      );

      const response =
        await getSchoolPermissions();

      if (
        response?.status ===
        false
      ) {
        setPermissions([]);
        setPermissionsLoading(
          false
        );

        return;
      }

      setPermissions(
        extractPermissions(
          response?.data
        )
      );

      setPermissionsLoading(
        false
      );
    }, []);

  useEffect(() => {
    loadManagers();
    loadPermissions();
  }, [
    loadManagers,
    loadPermissions,
  ]);

  const filteredManagers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return managers;
      }

      return managers.filter(
        (manager) =>
          [
            getManagerName(
              manager
            ),
            manager?.email,
            getManagerRole(
              manager
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      managers,
      search,
    ]);

  const stats =
    useMemo(
      () => ({
        total:
          managers.length,

        supervisors:
          managers.filter(
            (manager) =>
              getManagerRole(
                manager
              ) ===
              ROLES.SUPERVISOR
          ).length,

        managers:
          managers.filter(
            (manager) =>
              getManagerRole(
                manager
              ) ===
              ROLES.MANAGER
          ).length,
      }),
      [managers]
    );

  const handleCreate =
    async (payload) => {
      setFormLoading(true);

      const response =
        await createSchoolManager(
          payload
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر إنشاء الحساب"
        );

        setFormLoading(false);
        return;
      }

      toast.success(
        payload.role ===
          ROLES.SUPERVISOR
          ? "تم إنشاء المشرف بنجاح"
          : "تم إنشاء المدير بنجاح"
      );

      setFormOpen(false);
      setFormLoading(false);

      await loadManagers();
    };

  const handlePermissionsSave =
    async (
      selectedPermissions
    ) => {
      const managerId =
        getManagerId(
          selectedManager
        );

      if (!managerId) {
        toast.error(
          "معرّف المدير غير موجود"
        );

        return;
      }

      setPermissionsSaving(
        true
      );

      const response =
        await updateManagerPermissions(
          managerId,
          selectedPermissions
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر تحديث الصلاحيات"
        );

        setPermissionsSaving(
          false
        );

        return;
      }

      toast.success(
        "تم تحديث الصلاحيات بنجاح"
      );

      setPermissionsOpen(
        false
      );

      setSelectedManager(
        null
      );

      setPermissionsSaving(
        false
      );

      await loadManagers();
    };

  const handleDelete =
    async () => {
      const managerId =
        getManagerId(
          selectedManager
        );

      if (!managerId) {
        toast.error(
          "معرّف الحساب غير موجود"
        );

        return;
      }

      setDeleteLoading(true);

      const response =
        await deleteSchoolManager(
          managerId
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "تعذر حذف الحساب"
        );

        setDeleteLoading(false);
        return;
      }

      toast.success(
        "تم حذف الحساب الإداري"
      );

      setDeleteOpen(false);
      setSelectedManager(
        null
      );

      setDeleteLoading(false);

      await loadManagers();
    };

  const statCards = [
    {
      label:
        "إجمالي الحسابات",

      value:
        stats.total,

      icon:
        <AdminPanelSettingsRounded />,
    },

    {
      label:
        "المشرفون",

      value:
        stats.supervisors,

      icon:
        <SupervisorAccountRounded />,
    },

    {
      label:
        "المديرون",

      value:
        stats.managers,

      icon:
        <AdminPanelSettingsRounded />,
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs: "1fr",
              sm:
                "repeat(3,minmax(0,1fr))",
            },

          gap: 1,
        }}
      >
        {statCards.map(
          (card) => (
            <StatCard
              key={
                card.label
              }
              {...card}
              loading={
                loading
              }
            />
          )
        )}
      </Box>

      <Box
        sx={{
          mt: 1.25,
          p: 1.35,

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
            placeholder="ابحث بالاسم أو البريد..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            }}
            sx={{
              width: {
                xs: "100%",
                md: 360,
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
            spacing={0.75}
          >
            <Button
              onClick={() => {
                loadManagers();
                loadPermissions();
              }}
              startIcon={
                <RefreshRounded />
              }
              sx={{
                minHeight: 42,
                px: 1.45,

                color:
                  "#244a70",

                backgroundColor:
                  "rgba(36,74,112,0.07)",

                fontSize:
                  "9px",

                fontWeight:
                  800,

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              تحديث
            </Button>

            <Button
              onClick={() =>
                setFormOpen(
                  true
                )
              }
              startIcon={
                <AddRounded />
              }
              sx={{
                minHeight: 42,
                px: 1.55,

                color:
                  "#ffffff",

                backgroundColor:
                  "#244a70",

                fontSize:
                  "9px",

                fontWeight:
                  800,

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },

                "&:hover": {
                  backgroundColor:
                    "#1b3d61",
                },
              }}
            >
              إضافة حساب
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 1.25,

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
        {error &&
        !loading ? (
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
              <ErrorOutlineRounded
                sx={{
                  color:
                    "#c94f4f",

                  fontSize: 42,
                }}
              />

              <Typography
                sx={{
                  mt: 0.8,

                  color:
                    "#122f4d",

                  fontSize:
                    "14px",

                  fontWeight:
                    800,
                }}
              >
                تعذر تحميل الحسابات
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,

                  color:
                    "#7e8791",

                  fontSize:
                    "8.5px",
                }}
              >
                {error}
              </Typography>

              <Button
                onClick={
                  loadManagers
                }
                startIcon={
                  <RefreshRounded />
                }
                sx={{
                  mt: 1.3,

                  color:
                    "#ffffff",

                  backgroundColor:
                    "#244a70",
                }}
              >
                إعادة المحاولة
              </Button>
            </Box>
          </Box>
        ) : !loading &&
          !filteredManagers.length ? (
          <EmptyState
            searched={
              Boolean(
                search.trim()
              )
            }
            onAdd={() =>
              setFormOpen(
                true
              )
            }
            onResetSearch={() =>
              setSearch("")
            }
          />
        ) : (
          <Box
            sx={{
              overflowX:
                "auto",
            }}
          >
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 930,

                borderCollapse:
                  "collapse",

                "& th": {
                  px: 1.55,
                  py: 1.3,

                  color:
                    "#7e8791",

                  backgroundColor:
                    "rgba(36,74,112,0.035)",

                  borderBottom:
                    "1px solid #ded8cd",

                  fontSize:
                    "8.5px",

                  fontWeight:
                    800,

                  textAlign:
                    "right",
                },

                "& td": {
                  px: 1.55,
                  py: 1.3,

                  color:
                    "#193754",

                  borderBottom:
                    "1px solid rgba(222,216,205,0.7)",

                  fontSize:
                    "9.5px",
                },

                "& tbody tr":
                  {
                    transition:
                      "background-color 0.2s ease",
                  },

                "& tbody tr:hover":
                  {
                    backgroundColor:
                      "rgba(36,74,112,0.022)",
                  },
              }}
            >
              <Box component="thead">
                <Box component="tr">
                  <Box component="th">
                    الحساب
                  </Box>

                  <Box component="th">
                    البريد الإلكتروني
                  </Box>

                  <Box component="th">
                    الدور
                  </Box>

                  <Box component="th">
                    الصلاحيات
                  </Box>

                  <Box
                    component="th"
                    sx={{
                      width: 230,

                      textAlign:
                        "center !important",
                    }}
                  >
                    الإجراءات
                  </Box>
                </Box>
              </Box>

              <Box component="tbody">
                {loading
                  ? Array.from({
                      length: 5,
                    }).map(
                      (
                        _,
                        rowIndex
                      ) => (
                        <Box
                          component="tr"
                          key={
                            rowIndex
                          }
                        >
                          {Array.from({
                            length: 5,
                          }).map(
                            (
                              __,
                              cellIndex
                            ) => (
                              <Box
                                component="td"
                                key={
                                  cellIndex
                                }
                              >
                                <Skeleton />
                              </Box>
                            )
                          )}
                        </Box>
                      )
                    )
                  : filteredManagers.map(
                      (
                        manager,
                        index
                      ) => {
                        const role =
                          getManagerRole(
                            manager
                          );

                        const managerPermissions =
                          getManagerPermissions(
                            manager
                          );

                        const isSupervisor =
                          role ===
                          ROLES.SUPERVISOR;

                        const visiblePermissions =
                          managerPermissions.slice(
                            0,
                            2
                          );

                        const remainingPermissions =
                          Math.max(
                            managerPermissions.length -
                              visiblePermissions.length,
                            0
                          );

                        return (
                          <Box
                            component="tr"
                            key={
                              getManagerId(
                                manager
                              ) ||
                              index
                            }
                          >
                            <Box component="td">
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.8}
                              >
                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,

                                    display:
                                      "grid",

                                    placeItems:
                                      "center",

                                    borderRadius:
                                      "10px",

                                    color:
                                      "#244a70",

                                    backgroundColor:
                                      "rgba(36,74,112,0.07)",

                                    fontSize:
                                      "10px",

                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {String(
                                    getManagerName(
                                      manager
                                    )
                                  )
                                    .trim()
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </Box>

                                <Typography
                                  sx={{
                                    color:
                                      "#122f4d",

                                    fontSize:
                                      "9.5px",

                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {getManagerName(
                                    manager
                                  )}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box
                              component="td"
                              sx={{
                                direction:
                                  "ltr",

                                textAlign:
                                  "right",
                              }}
                            >
                              {manager?.email ||
                                "—"}
                            </Box>

                            <Box component="td">
                              <Chip
                                size="small"
                                label={
                                  isSupervisor
                                    ? "مشرف"
                                    : "مدير"
                                }
                                sx={{
                                  color:
                                    isSupervisor
                                      ? "#8a5a00"
                                      : "#244a70",

                                  backgroundColor:
                                    isSupervisor
                                      ? "#fbf0d8"
                                      : "rgba(36,74,112,0.08)",

                                  fontSize:
                                    "7.5px",

                                  fontWeight:
                                    800,
                                }}
                              />
                            </Box>

                            <Box component="td">
                              {isSupervisor ? (
                                <Chip
                                  label="صلاحيات كاملة"
                                  size="small"
                                  sx={{
                                    color:
                                      "#29734A",

                                    backgroundColor:
                                      "rgba(116,201,154,0.15)",

                                    fontSize:
                                      "7px",

                                    fontWeight:
                                      800,
                                  }}
                                />
                              ) : managerPermissions.length ? (
                                <Stack
                                  direction="row"
                                  spacing={0.45}
                                  sx={{
                                    flexWrap:
                                      "wrap",

                                    rowGap:
                                      0.4,
                                  }}
                                >
                                  {visiblePermissions.map(
                                    (
                                      permission
                                    ) => (
                                      <Chip
                                        key={
                                          permission
                                        }
                                        label={getPermissionShortLabel(
                                          permission
                                        )}
                                        size="small"
                                        sx={{
                                          height:
                                            23,

                                          color:
                                            "#244a70",

                                          backgroundColor:
                                            "rgba(36,74,112,0.06)",

                                          fontSize:
                                            "6.8px",

                                          fontWeight:
                                            700,
                                        }}
                                      />
                                    )
                                  )}

                                  {remainingPermissions >
                                    0 && (
                                    <Chip
                                      label={`+${remainingPermissions}`}
                                      size="small"
                                      sx={{
                                        height:
                                          23,

                                        color:
                                          "#8a5a00",

                                        backgroundColor:
                                          "#fbf0d8",

                                        fontSize:
                                          "6.8px",

                                        fontWeight:
                                          800,
                                      }}
                                    />
                                  )}
                                </Stack>
                              ) : (
                                <Chip
                                  label="بدون صلاحيات"
                                  size="small"
                                  sx={{
                                    color:
                                      "#7e8791",

                                    backgroundColor:
                                      "rgba(126,135,145,0.08)",

                                    fontSize:
                                      "7px",

                                    fontWeight:
                                      700,
                                  }}
                                />
                              )}
                            </Box>

                            <Box
                              component="td"
                              sx={{
                                width: 230,

                                textAlign:
                                  "center !important",
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="center"
                                spacing={0.75}
                              >
                                {!isSupervisor && (
                                  <Button
                                    onClick={() => {
                                      setSelectedManager(
                                        manager
                                      );

                                      setPermissionsOpen(
                                        true
                                      );
                                    }}
                                    startIcon={
                                      <EditNoteRounded />
                                    }
                                    sx={{
                                      minHeight:
                                        35,

                                      px: 1.15,

                                      color:
                                        "#244a70",

                                      backgroundColor:
                                        "rgba(36,74,112,0.07)",

                                      fontSize:
                                        "8px",

                                      fontWeight:
                                        800,

                                      "& .MuiButton-startIcon":
                                        {
                                          ml: 0.5,
                                          mr: 0,
                                        },
                                    }}
                                  >
                                    الصلاحيات
                                  </Button>
                                )}

                                <Button
                                  onClick={() => {
                                    setSelectedManager(
                                      manager
                                    );

                                    setDeleteOpen(
                                      true
                                    );
                                  }}
                                  startIcon={
                                    <DeleteOutlineRounded />
                                  }
                                  sx={{
                                    minHeight:
                                      35,

                                    px: 1.15,

                                    color:
                                      "#c94f4f",

                                    backgroundColor:
                                      "rgba(201,79,79,0.08)",

                                    fontSize:
                                      "8px",

                                    fontWeight:
                                      800,

                                    "& .MuiButton-startIcon":
                                      {
                                        ml: 0.5,
                                        mr: 0,
                                      },
                                  }}
                                >
                                  حذف
                                </Button>
                              </Stack>
                            </Box>
                          </Box>
                        );
                      }
                    )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <ManagerFormDialog
        open={formOpen}
        loading={
          formLoading
        }
        currentRole={
          currentRole
        }
        permissions={
          permissions
        }
        permissionsLoading={
          permissionsLoading
        }
        onClose={() =>
          setFormOpen(
            false
          )
        }
        onSubmit={
          handleCreate
        }
      />

      <ManagerPermissionsDialog
        open={
          permissionsOpen
        }
        manager={
          selectedManager
        }
        permissions={
          permissions
        }
        loading={
          permissionsSaving
        }
        onClose={() => {
          setPermissionsOpen(
            false
          );

          setSelectedManager(
            null
          );
        }}
        onSave={
          handlePermissionsSave
        }
      />

      <SchoolConfirmDialog
        open={
          deleteOpen
        }
        title="حذف الحساب الإداري"
        message={`سيتم حذف حساب "${
          getManagerName(
            selectedManager
          )
        }". لا يمكن التراجع عن هذه العملية.`}
        confirmLabel="تأكيد الحذف"
        loading={
          deleteLoading
        }
        danger
        onClose={() => {
          setDeleteOpen(
            false
          );

          setSelectedManager(
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

export default SchoolManagers;
