import {
  AddCircleOutlineRounded,
  DeleteOutlineRounded,
  ManageAccountsRounded,
  SecurityRounded,
  SearchRounded,
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
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";

import {
  deleteManager,
  fetchManagers,
  MANAGER_DEFAULT_PERMISSIONS,
  updateManagerPermissions,
} from "@/APIs/school/managers";

const ROLE_LABELS = {
  OWNER: "مالك المدرسة",
  SUPERVISOR: "مشرف",
  MANAGER: "مدير",
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
    syncingManagerId,
    setSyncingManagerId,
  ] = useState("");

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
          "تعذر تحميل المديرين والمشرفين"
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

  const handleSyncPermissions =
    async (item) => {
      const id =
        getManagerId(item);

      if (!id) {
        toast.error(
          "معرّف المدير غير موجود"
        );
        return;
      }

      setSyncingManagerId(id);

      const response =
        await updateManagerPermissions(
          id,
          MANAGER_DEFAULT_PERMISSIONS
        );

      if (
        !isSuccessfulResponse(
          response
        )
      ) {
        toast.error(
          getResponseMessage(
            response,
            "تعذر ضبط صلاحيات المدير"
          )
        );

        setSyncingManagerId("");
        return;
      }

      setSyncingManagerId("");

      await loadManagers(true);

      toast.success(
        "تم ضبط صلاحيات المدير الإدارية والأكاديمية فقط. تم استبعاد المالية والمصروفات، ويجب تسجيل الخروج ثم الدخول بالحساب مرة أخرى."
      );
    };

  const handleDelete =
    async () => {
      const id =
        getManagerId(
          deleteTarget
        );

      if (!id) {
        toast.error(
          "تعذر تحديد الحساب المطلوب حذفه"
        );
        return;
      }

      setDeleting(true);

      const response =
        await deleteManager(id);

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
        "تم حذف الحساب الإداري بنجاح"
      );
    };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 2.2,
              md: 3,
            },

            borderRadius: "22px",

            border:
              "1px solid #DED8CD",

            background:
              "linear-gradient(135deg, #244A70 0%, #122F4D 100%)",

            color: "#FFFFFF",

            boxShadow:
              "0 15px 34px rgba(18,47,77,0.14)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "15px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor:
                    "rgba(255,255,255,0.12)",
                  color: "#F2D792",
                }}
              >
                <ManageAccountsRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: {
                      xs: "19px",
                      md: "23px",
                    },
                    fontWeight: 900,
                  }}
                >
                  المديرون والمشرفون
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: "12px",
                    color:
                      "rgba(255,255,255,0.76)",
                  }}
                >
                  أنشئ حسابات الإدارة وتابعها من مكان واحد.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={
                <AddCircleOutlineRounded />
              }
              onClick={() =>
                navigate(
                  "/school/managers/add"
                )
              }
              sx={{
                minHeight: 46,
                px: 2.6,
                borderRadius: "13px",
                bgcolor: "#D3A44F",
                color: "#122F4D",
                fontWeight: 900,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#F2D792",
                  boxShadow: "none",
                },
              }}
            >
              إضافة حساب إداري
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: 1.4,
          }}
        >
          <StatCard
            label="إجمالي الحسابات"
            value={items.length}
          />
          <StatCard
            label="المشرفون"
            value={supervisorsCount}
          />
          <StatCard
            label="المديرون"
            value={managersCount}
          />
          <StatCard
            label="الحسابات النشطة"
            value={activeCount}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 1.6,
            borderRadius: "18px",
            border:
              "1px solid #DED8CD",
            bgcolor: "#FFFCF7",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1.3}
          >
            <TextField
              fullWidth
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث باسم المستخدم أو البريد الإلكتروني"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded
                      sx={{
                        color:
                          "#315E88",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "13px",
                    bgcolor:
                      "#FFFFFF",
                  },
              }}
            />

            <TextField
              select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              label="الدور"
              size="small"
              sx={{
                width: {
                  xs: "100%",
                  md: 220,
                },
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "13px",
                    bgcolor:
                      "#FFFFFF",
                  },
              }}
            >
              <MenuItem value="">
                كل الأدوار
              </MenuItem>

              <MenuItem value="SUPERVISOR">
                مشرف
              </MenuItem>

              <MenuItem value="MANAGER">
                مدير
              </MenuItem>
            </TextField>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            overflow: "hidden",
            borderRadius: "20px",
            border:
              "1px solid #DED8CD",
            bgcolor: "#FFFFFF",
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
              <CircularProgress />
            </Box>
          ) : filteredItems.length ===
            0 ? (
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
                <ManageAccountsRounded
                  sx={{
                    fontSize: 48,
                    color: "#D3A44F",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    color: "#193754",
                    fontWeight: 800,
                  }}
                >
                  لا توجد حسابات إدارية لعرضها
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: "#7E8791",
                    fontSize: "13px",
                  }}
                >
                  أضف أول حساب مشرف أو مدير للمدرسة.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 760,
                  borderCollapse:
                    "collapse",

                  "& th": {
                    py: 1.6,
                    px: 2,
                    textAlign: "right",
                    bgcolor: "#F8F5EF",
                    color: "#315E88",
                    fontSize: "12px",
                    fontWeight: 900,
                    borderBottom:
                      "1px solid #DED8CD",
                  },

                  "& td": {
                    py: 1.5,
                    px: 2,
                    color: "#193754",
                    fontSize: "13px",
                    borderBottom:
                      "1px solid #EEEAE2",
                  },

                  "& tbody tr:hover": {
                    bgcolor: "#FFFCF7",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>اسم المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map(
                    (item) => {
                      const id =
                        getManagerId(
                          item
                        );

                      const role =
                        getManagerRole(
                          item
                        );

                      const status =
                        getManagerStatus(
                          item
                        );

                      return (
                        <tr
                          key={
                            id ||
                            getManagerEmail(
                              item
                            )
                          }
                        >
                          <td>
                            <Typography
                              sx={{
                                fontSize:
                                  "13px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {getManagerUsername(
                                item
                              )}
                            </Typography>
                          </td>

                          <td>
                            {getManagerEmail(
                              item
                            )}
                          </td>

                          <td>
                            <Chip
                              size="small"
                              label={
                                ROLE_LABELS[
                                  role
                                ] ||
                                role ||
                                "—"
                              }
                              sx={{
                                bgcolor:
                                  role ===
                                  "SUPERVISOR"
                                    ? "#FBF0D8"
                                    : "#DDEEE8",
                                color:
                                  role ===
                                  "SUPERVISOR"
                                    ? "#8A6220"
                                    : "#075244",
                                fontWeight:
                                  800,
                              }}
                            />
                          </td>

                          <td>
                            <Chip
                              size="small"
                              label={
                                status ===
                                "active"
                                  ? "نشط"
                                  : "غير نشط"
                              }
                              sx={{
                                bgcolor:
                                  status ===
                                  "active"
                                    ? "#E7F8F1"
                                    : "#FDECEC",
                                color:
                                  status ===
                                  "active"
                                    ? "#0E7A5E"
                                    : "#C94F4F",
                                fontWeight:
                                  800,
                              }}
                            />
                          </td>

                          <td>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                            >
                              {role ===
                                "MANAGER" && (
                                <Tooltip title="تطبيق صلاحيات المدير الإدارية والأكاديمية">
                                  <span>
                                    <IconButton
                                      onClick={() =>
                                        handleSyncPermissions(
                                          item
                                        )
                                      }
                                      disabled={
                                        !id ||
                                        syncingManagerId ===
                                          id
                                      }
                                      sx={{
                                        color:
                                          "#244A70",
                                        bgcolor:
                                          "#EEF3F7",

                                        "&:hover":
                                          {
                                            bgcolor:
                                              "#DDE7EF",
                                          },
                                      }}
                                    >
                                      {syncingManagerId ===
                                      id ? (
                                        <CircularProgress
                                          size={20}
                                        />
                                      ) : (
                                        <SecurityRounded />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}

                              <Tooltip title="حذف الحساب">
                                <span>
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      setDeleteTarget(
                                        item
                                      )
                                    }
                                    disabled={
                                      !id
                                    }
                                  >
                                    <DeleteOutlineRounded />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog
        open={Boolean(
          deleteTarget
        )}
        onClose={() =>
          !deleting &&
          setDeleteTarget(null)
        }
        dir="rtl"
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
            color="text.secondary"
          >
            هل أنت متأكد من حذف حساب{" "}
            <strong>
              {getManagerUsername(
                deleteTarget
              )}
            </strong>
            ؟
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDeleteTarget(null)
            }
            disabled={deleting}
          >
            إلغاء
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "جاري الحذف..."
              : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const StatCard = ({
  label,
  value,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.7,
      borderRadius: "17px",
      border:
        "1px solid #DED8CD",
      bgcolor: "#FFFFFF",
    }}
  >
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
        mt: 0.45,
        color: "#122F4D",
        fontSize: "23px",
        fontWeight: 900,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

export default SchoolManagersList;
