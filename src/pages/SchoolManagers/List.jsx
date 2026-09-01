import {
  AddCircleOutlineRounded,
  AdminPanelSettingsRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  ManageAccountsRounded,
  RefreshRounded,
  SearchRounded,
  SecurityRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";

import {
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
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";

import {
  deleteManager,
  fetchManagers,
} from "@/APIs/school/managers";

import {
  getSchoolPermissions,
  updateSchoolRolePermissions,
} from "@/APIs/school/permissions";

import SchoolRolePermissionsDialog from "@/components/school/SchoolRolePermissionsDialog";

const ROLE_LABELS = {
  OWNER: "مالك المدرسة",
  SUPERVISOR: "مدير المدرسة",
  MANAGER: "مساعد إداري",
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const getResponseMessage = (
  response,
  fallback
) => {
  if (
    typeof response === "string"
  ) {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

const isSuccessfulResponse = (
  response
) =>
  Boolean(response) &&
  typeof response !== "string" &&
  response?.status !== false;

const extractManagers = (
  response
) => {
  const candidates = [
    response?.data?.docs,
    response?.data?.items,
    response?.data,
    response?.docs,
    response?.items,
    response,
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
};

const getManagerId = (item) =>
  item?._id ||
  item?.id ||
  item?.userId ||
  "";

const getManagerType = (item) => {
  const type =
    String(item?.type || "")
      .trim()
      .toLowerCase();

  return type === "admin" ||
    type === "teacher"
    ? type
    : "";
};

const getManagerUsername = (
  item
) =>
  item?.username ||
  item?.name ||
  item?.fullName ||
  "—";

const getManagerEmail = (
  item
) =>
  item?.email || "—";

const getManagerRole = (
  item
) =>
  normalizeRole(
    item?.role
  );

const getManagerStatus = (
  item
) => {
  if (
    item?.isActive === false ||
    item?.active === false ||
    item?.status === "inactive"
  ) {
    return "inactive";
  }

  return "active";
};

const SchoolManagersList = () => {
  const navigate = useNavigate();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    permissionsOpen,
    setPermissionsOpen,
  ] = useState(false);

  const [
    permissionsLoading,
    setPermissionsLoading,
  ] = useState(false);

  const [
    permissionsSaving,
    setPermissionsSaving,
  ] = useState(false);

  const [
    managerPermissions,
    setManagerPermissions,
  ] = useState({});

  const loadManagers = async (
    force = false
  ) => {
    setLoading(true);

    const response =
      await fetchManagers({
        force,
      });

    if (
      !isSuccessfulResponse(
        response
      )
    ) {
      toast.error(
        getResponseMessage(
          response,
          "تعذر تحميل المديرين والمساعدين"
        )
      );

      setItems([]);
      setLoading(false);
      return;
    }

    setItems(
      extractManagers(response)
    );

    setLoading(false);
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {
          const role =
            getManagerRole(item);

          const matchesRole =
            !roleFilter ||
            role === roleFilter;

          const searchableText = [
            getManagerUsername(
              item
            ),
            getManagerEmail(item),
            ROLE_LABELS[role],
          ]
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch
            );

          return (
            matchesRole &&
            matchesSearch
          );
        }
      );
    }, [
      items,
      search,
      roleFilter,
    ]);

  const supervisorsCount =
    items.filter(
      (item) =>
        getManagerRole(item) ===
        "SUPERVISOR"
    ).length;

  const managersCount =
    items.filter(
      (item) =>
        getManagerRole(item) ===
        "MANAGER"
    ).length;

  const activeCount =
    items.filter(
      (item) =>
        getManagerStatus(item) ===
        "active"
    ).length;

  const unwrapPermissionsPayload = (value) => {
    let current = value;

    for (let index = 0; index < 6; index += 1) {
      if (
        !current ||
        typeof current !== "object" ||
        Array.isArray(current)
      ) {
        break;
      }

      const next =
        current.data ??
        current.result ??
        current.payload;

      if (!next || next === current) {
        break;
      }

      current = next;
    }

    return current;
  };

  const loadManagerPermissions = async () => {
    setPermissionsLoading(true);

    const response =
      await getSchoolPermissions();

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر تحميل صلاحيات المساعدين الإداريين"
      );
      setManagerPermissions({});
      setPermissionsLoading(false);
      return false;
    }

    const payload =
      unwrapPermissionsPayload(
        response?.data ?? response
      );

    const nextPermissions =
      payload?.MANAGER ||
      payload?.manager ||
      {};

    setManagerPermissions(
      nextPermissions &&
        typeof nextPermissions === "object" &&
        !Array.isArray(nextPermissions)
        ? nextPermissions
        : {}
    );
    setPermissionsLoading(false);
    return true;
  };

  const openManagerPermissions = async () => {
    setPermissionsOpen(true);
    await loadManagerPermissions();
  };

  const saveManagerPermissions = async (permissions) => {
    setPermissionsSaving(true);

    const response =
      await updateSchoolRolePermissions(
        "MANAGER",
        permissions
      );

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر تحديث صلاحيات المساعدين الإداريين"
      );
      setPermissionsSaving(false);
      return;
    }

    const payload =
      unwrapPermissionsPayload(
        response?.data ?? response
      );

    if (payload?.permissions) {
      setManagerPermissions(
        payload.permissions
      );
    } else {
      setManagerPermissions(
        permissions
      );
    }

    setPermissionsSaving(false);
    setPermissionsOpen(false);

    toast.success(
      payload?.note ||
        "تم تحديث صلاحيات المساعدين. تسري الصلاحيات الجديدة بعد تسجيل الدخول مرة أخرى."
    );
  };

  const handleDelete =
    async () => {
      const id =
        getManagerId(
          deleteTarget
        );

      const type =
        getManagerType(
          deleteTarget
        );

      if (!id || !type) {
        toast.error(
          "تعذر تحديد الحساب المطلوب حذفه"
        );
        return;
      }

      setDeleting(true);

      const response =
        await deleteManager(
          id,
          type
        );

      if (
        !isSuccessfulResponse(
          response
        )
      ) {
        toast.error(
          getResponseMessage(
            response,
            "تعذر حذف الحساب الإداري"
          )
        );

        setDeleting(false);
        return;
      }

      setItems(
        (previous) =>
          previous.filter(
            (item) =>
              getManagerId(item) !==
              id
          )
      );

      setDeleteTarget(null);
      setDeleting(false);

      toast.success(
        type === "teacher"
          ? "تم إلغاء صلاحية المدير من المعلم بنجاح"
          : "تم حذف الحساب الإداري بنجاح"
      );
    };
  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4, width: "100%" }}>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 2.35 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            borderRadius: "20px",
            border: "1px solid #DED8CD",
            background:
              "linear-gradient(135deg, #FFFDF8 0%, #F8F2E7 100%)",
            boxShadow: "0 8px 22px rgba(18,47,77,0.035)",
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.9}>
              <Typography
                sx={{
                  color: "#122F4D",
                  fontSize: { xs: "22px", md: "27px" },
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                إدارة المديرين والمساعدين
              </Typography>

              <Box
                sx={{
                  minWidth: 27,
                  height: 27,
                  px: 0.7,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "999px",
                  color: "#B78430",
                  bgcolor: "#FBF0D8",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                {items.length}
              </Box>
            </Stack>

            <Typography
              sx={{
                mt: 0.55,
                color: "#7E8791",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              إدارة الحسابات الإدارية والأدوار والصلاحيات من مكان واحد.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ flexShrink: 0 }}
          >
            <Button
              variant="outlined"
              startIcon={<SecurityRounded />}
              onClick={openManagerPermissions}
              sx={{
                minHeight: 48,
                px: 2,
                borderRadius: "12px",
                borderColor: "#C9D3DC",
                color: "#244A70",
                bgcolor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 900,
                "& .MuiButton-startIcon": { ml: 0.65, mr: 0 },
                "&:hover": {
                  borderColor: "#244A70",
                  bgcolor: "#F7FAFC",
                },
              }}
            >
              صلاحيات المساعدين
            </Button>

            <Button
              variant="contained"
              startIcon={<AddCircleOutlineRounded />}
              onClick={() => navigate("/school/managers/add")}
              sx={{
                minHeight: 48,
                px: 2.3,
                borderRadius: "12px",
                bgcolor: "#244A70",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 900,
                boxShadow: "none",
                "& .MuiButton-startIcon": { ml: 0.7, mr: 0 },
                "&:hover": {
                  bgcolor: "#122F4D",
                  boxShadow: "none",
                },
              }}
            >
              إضافة حساب إداري
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={() => loadManagers(true)}
              disabled={loading}
              sx={{
                minHeight: 48,
                px: 2,
                borderRadius: "12px",
                borderColor: "#C9D3DC",
                color: "#244A70",
                bgcolor: "rgba(255,255,255,0.55)",
                fontSize: "13px",
                fontWeight: 900,
                "& .MuiButton-startIcon": { ml: 0.65, mr: 0 },
                "&:hover": {
                  borderColor: "#244A70",
                  bgcolor: "#FFFFFF",
                },
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 1.6,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              lg: "repeat(4,minmax(0,1fr))",
            },
            gap: 1.2,
          }}
        >
          <StatCard
            label="إجمالي الحسابات"
            value={items.length}
            icon={<AdminPanelSettingsRounded />}
          />
          <StatCard
            label="الحسابات النشطة"
            value={activeCount}
            icon={<CheckCircleRounded />}
          />
          <StatCard
            label="المساعدون الإداريون"
            value={managersCount}
            icon={<ManageAccountsRounded />}
          />
          <StatCard
            label="مديرو المدرسة"
            value={supervisorsCount}
            icon={<SupervisorAccountRounded />}
          />
        </Box>

        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            borderRadius: "16px",
            bgcolor: "#FFFFFF",
            border: "1px solid #DED8CD",
            boxShadow: "0 5px 16px rgba(18,47,77,0.025)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم المستخدم أو البريد الإلكتروني..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#7E8791", fontSize: 23 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  minHeight: 48,
                  borderRadius: "12px",
                  bgcolor: "#FFFCF7",
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#D8D2C8" },
                  "&:hover fieldset": { borderColor: "#BFC9D2" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#244A70",
                    borderWidth: "1px",
                  },
                },
              }}
            />

            <TextField
              select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              size="small"
              sx={{
                width: { xs: "100%", md: 220 },
                "& .MuiOutlinedInput-root": {
                  minHeight: 48,
                  borderRadius: "12px",
                  bgcolor: "#FFFCF7",
                  fontSize: "13px",
                  "& fieldset": { borderColor: "#D8D2C8" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#244A70",
                    borderWidth: "1px",
                  },
                },
              }}
            >
              <MenuItem value="">كل الأدوار</MenuItem>
              <MenuItem value="MANAGER">مساعد إداري</MenuItem>
              <MenuItem value="SUPERVISOR">مدير المدرسة</MenuItem>
            </TextField>
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 1.4,
            overflow: "hidden",
            borderRadius: "17px",
            border: "1px solid #DED8CD",
            bgcolor: "#FFFFFF",
            boxShadow: "0 7px 20px rgba(18,47,77,0.03)",
          }}
        >
          {loading ? (
            <Box
              sx={{
                minHeight: 320,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress sx={{ color: "#244A70" }} />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box
              sx={{
                minHeight: 320,
                display: "grid",
                placeItems: "center",
                p: 3,
                textAlign: "center",
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: "auto",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "18px",
                    bgcolor: "#FBF0D8",
                    color: "#B78430",
                  }}
                >
                  <ManageAccountsRounded sx={{ fontSize: 32 }} />
                </Box>

                <Typography
                  sx={{
                    mt: 1.2,
                    color: "#122F4D",
                    fontSize: "15px",
                    fontWeight: 900,
                  }}
                >
                  لا توجد حسابات إدارية لعرضها
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: "#7E8791",
                    fontSize: "12px",
                  }}
                >
                  غيّر البحث أو الفلتر، أو أضف حسابًا إداريًا جديدًا.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 860,
                  borderCollapse: "collapse",
                  "& th": {
                    py: 1.35,
                    px: 1.7,
                    textAlign: "right",
                    bgcolor: "#F1F5F9",
                    color: "#315E88",
                    fontSize: "11px",
                    fontWeight: 900,
                    borderBottom: "1px solid #DED8CD",
                    whiteSpace: "nowrap",
                  },
                  "& td": {
                    py: 1.25,
                    px: 1.7,
                    color: "#193754",
                    fontSize: "12px",
                    borderBottom: "1px solid #EEEAE2",
                    verticalAlign: "middle",
                  },
                  "& tbody tr:hover": { bgcolor: "#FFFCF7" },
                  "& tbody tr:last-of-type td": { borderBottom: 0 },
                }}
              >
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>التواصل</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th style={{ textAlign: "center", width: 150 }}>
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => {
                    const id = getManagerId(item);
                    const role = getManagerRole(item);
                    const status = getManagerStatus(item);
                    const name = getManagerUsername(item);

                    return (
                      <tr key={id || getManagerEmail(item)}>
                        <td>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                flexShrink: 0,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "10px",
                                bgcolor: "#EEF3F7",
                                color: "#244A70",
                                fontSize: "12px",
                                fontWeight: 900,
                              }}
                            >
                              {String(name).trim().charAt(0).toUpperCase()}
                            </Box>

                            <Typography
                              sx={{
                                color: "#122F4D",
                                fontSize: "12.5px",
                                fontWeight: 900,
                              }}
                            >
                              {name}
                            </Typography>
                          </Stack>
                        </td>

                        <td>
                          <Typography
                            sx={{
                              color: "#244A70",
                              direction: "ltr",
                              textAlign: "right",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {getManagerEmail(item)}
                          </Typography>
                        </td>

                        <td>
                          <Chip
                            size="small"
                            label={ROLE_LABELS[role] || role || "—"}
                            sx={{
                              height: 27,
                              bgcolor:
                                role === "SUPERVISOR" ? "#FBF0D8" : "#EEF3F7",
                              color:
                                role === "SUPERVISOR" ? "#8A6220" : "#244A70",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: 900,
                            }}
                          />
                        </td>

                        <td>
                          <Chip
                            size="small"
                            icon={status === "active" ? <CheckCircleRounded /> : undefined}
                            label={status === "active" ? "نشط" : "غير نشط"}
                            sx={{
                              height: 28,
                              bgcolor: status === "active" ? "#E7F8F1" : "#FDECEC",
                              color: status === "active" ? "#0E7A5E" : "#C94F4F",
                              borderRadius: "9px",
                              fontSize: "10px",
                              fontWeight: 900,
                              "& .MuiChip-icon": {
                                color: "inherit",
                                fontSize: 16,
                              },
                            }}
                          />
                        </td>

                        <td>
                          <Stack direction="row" spacing={0.65} justifyContent="center">
                    
                            <Tooltip title="حذف الحساب">
                              <span>
                                <IconButton
                                  onClick={() => setDeleteTarget(item)}
                                  disabled={!id}
                                  size="small"
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    color: "#C94F4F",
                                    bgcolor: "#FDECEC",
                                    border: "1px solid #F3D4D4",
                                    "&:hover": { bgcolor: "#F9DDDD" },
                                  }}
                                >
                                  <DeleteOutlineRounded sx={{ fontSize: 20 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <SchoolRolePermissionsDialog
        open={permissionsOpen}
        permissions={managerPermissions}
        loading={permissionsLoading}
        saving={permissionsSaving}
        onClose={() => {
          if (!permissionsSaving) {
            setPermissionsOpen(false);
          }
        }}
        onSave={saveManagerPermissions}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "18px",
            border: "1px solid #DED8CD",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#122F4D",
            fontWeight: 900,
          }}
        >
          حذف الحساب الإداري
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#5D6A76",
              fontSize: "13px",
              lineHeight: 1.8,
            }}
          >
            سيتم حذف حساب "{getManagerUsername(deleteTarget)}" نهائيًا. لا يمكن التراجع عن هذه العملية.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{
              color: "#315E88",
              fontWeight: 800,
            }}
          >
            إلغاء
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              borderRadius: "10px",
              boxShadow: "none",
            }}
          >
            {deleting ? "جاري الحذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const StatCard = ({ label, value, icon }) => (
  <Box
    sx={{
      minHeight: 98,
      px: 2,
      py: 1.65,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1.4,
      borderRadius: "16px",
      border: "1px solid #DED8CD",
      bgcolor: "#FFFFFF",
      boxShadow: "0 6px 18px rgba(18,47,77,0.025)",
    }}
  >
    <Box>
      <Typography
        sx={{
          color: "#7E8791",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.4,
          color: "#122F4D",
          fontSize: "22px",
          fontWeight: 900,
        }}
      >
        {value}
      </Typography>
    </Box>

    <Box
      sx={{
        width: 48,
        height: 48,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "13px",
        color: "#B78430",
        bgcolor: "#FBF0D8",
        "& svg": { fontSize: 25 },
      }}
    >
      {icon}
    </Box>
  </Box>
);

export default SchoolManagersList;
