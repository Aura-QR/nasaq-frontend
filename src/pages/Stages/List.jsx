import {
  AccountTreeRounded,
  AddRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  DeleteOutlineRounded,
  EditRounded,
  FirstPageRounded,
  LastPageRounded,
  RefreshRounded,
  SearchRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";
import StageFormDialog from "@/components/Stages/StageFormDialog";
import StageDeleteDialog from "@/components/Stages/StageDeleteDialog";
import usePermissions from "@/utils/hooks/usePermissions";

import {
  createStage,
  deleteStage,
  fetchStages,
  updateStage,
} from "@/APIs/school/stages";

const unwrapData = (
  response
) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractStages = (
  response
) => {
  const payload =
    unwrapData(
      response
    );

  if (
    Array.isArray(
      payload
    )
  ) {
    return payload;
  }

  return (
    [
      payload?.stages,
      payload?.items,
      payload?.docs,
      payload?.results,
      payload?.records,
      payload?.data,
    ].find(
      Array.isArray
    ) || []
  );
};

const getId = (
  value
) =>
  String(
    value?._id ||
    value?.id ||
    ""
  ).trim();

const sortByOrder = (
  rows
) =>
  [
    ...(
      Array.isArray(rows)
        ? rows
        : []
    ),
  ].sort(
    (a, b) =>
      Number(
        a?.order || 0
      ) -
      Number(
        b?.order || 0
      )
  );

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

      border:
        "1px solid #ded8cd",

      borderRadius:
        "15px",

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

        display:
          "grid",

        placeItems:
          "center",

        flexShrink: 0,

        color:
          "#b78430",

        backgroundColor:
          "#fbf0d8",

        borderRadius:
          "11px",

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

          fontWeight: 700,
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

          fontWeight: 800,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const StagesList = () => {
  const permissions = usePermissions("classes");

  const [
    stages,
    setStages,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    sort,
    setSort,
  ] = useState(
    "order-asc"
  );

  const [
    formDialog,
    setFormDialog,
  ] = useState({
    open: false,
    stage: null,
  });

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const loadStages =
    useCallback(
      async ({
        force = false,
      } = {}) => {
        setLoading(true);
        setError("");

        const response =
          await fetchStages({
            force,
          });

        if (
          response?.status ===
            false
        ) {
          setStages([]);

          setError(
            response?.message ||
            "تعذر تحميل المراحل الدراسية"
          );

          setLoading(false);

          return;
        }

        setStages(
          sortByOrder(
            extractStages(
              response
            )
          )
        );

        setLoading(false);
      },
      []
    );

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  const filteredStages =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const filtered =
          stages.filter(
            (stage) =>
              !normalizedSearch ||
              String(
                stage?.name ||
                ""
              )
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
          );

        return [
          ...filtered,
        ].sort(
          (a, b) => {
            if (
              sort ===
              "order-desc"
            ) {
              return (
                Number(
                  b?.order || 0
                ) -
                Number(
                  a?.order || 0
                )
              );
            }

            if (
              sort ===
              "name-asc"
            ) {
              return String(
                a?.name ||
                ""
              ).localeCompare(
                String(
                  b?.name ||
                  ""
                ),
                "ar"
              );
            }

            if (
              sort ===
              "name-desc"
            ) {
              return String(
                b?.name ||
                ""
              ).localeCompare(
                String(
                  a?.name ||
                  ""
                ),
                "ar"
              );
            }

            return (
              Number(
                a?.order || 0
              ) -
              Number(
                b?.order || 0
              )
            );
          }
        );
      },
      [
        stages,
        search,
        sort,
      ]
    );

  const stats =
    useMemo(
      () => {
        const orders =
          stages
            .map(
              (stage) =>
                Number(
                  stage?.order
                )
            )
            .filter(
              Number.isFinite
            );

        return {
          total:
            stages.length,

          visible:
            filteredStages.length,

          first:
            orders.length
              ? Math.min(
                  ...orders
                )
              : 0,

          last:
            orders.length
              ? Math.max(
                  ...orders
                )
              : 0,
        };
      },
      [
        stages,
        filteredStages,
      ]
    );

  const handleSave =
    async (values) => {
      setActionLoading(
        true
      );

      const editing =
        formDialog.stage;

      const response =
        editing
          ? await updateStage(
              getId(editing),
              values
            )
          : await createStage(
              values
            );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر حفظ المرحلة"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        editing
          ? "تم تعديل المرحلة بنجاح"
          : "تمت إضافة المرحلة بنجاح"
      );

      setFormDialog({
        open: false,
        stage: null,
      });

      setActionLoading(
        false
      );

      loadStages({
        force: true,
      });
    };

  const handleDelete =
    async () => {
      if (!deleteTarget) {
        return;
      }

      setActionLoading(
        true
      );

      const response =
        await deleteStage(
          getId(
            deleteTarget
          )
        );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر حذف المرحلة"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        "تم حذف المرحلة بنجاح"
      );

      setDeleteTarget(
        null
      );

      setActionLoading(
        false
      );

      loadStages({
        force: true,
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

            border:
              "1px solid rgba(36,74,112,0.08)",

            borderRadius:
              "18px",

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

                    fontWeight: 800,
                  }}
                >
                  إدارة المراحل الدراسية
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

                    fontWeight: 800,
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
                أنشئ هيكل المراحل الثابت للمدرسة وحدد ترتيب ظهور كل مرحلة.
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
                  loadStages({
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

                  fontWeight: 800,

                  "& .MuiButton-startIcon":
                    {
                      ml: 0.65,
                      mr: 0,
                    },
                }}
              >
                تحديث
              </Button>

              {permissions.add && (
                <Button
                  type="button"
                  onClick={() =>
                    setFormDialog({
                      open: true,
                      stage: null,
                    })
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

                    boxShadow:
                      "none",

                    fontWeight: 800,

                    "&:hover": {
                      backgroundColor:
                        "#1b3d61",

                      boxShadow:
                        "none",
                    },

                    "& .MuiButton-startIcon":
                      {
                        ml: 0.65,
                        mr: 0,
                      },
                  }}
                >
                  إضافة مرحلة جديدة
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mt: 1.25,

            display:
              "grid",

            gridTemplateColumns:
              {
                xs:
                  "1fr 1fr",

                lg:
                  "repeat(4,minmax(0,1fr))",
              },

            gap: 1,
          }}
        >
          <StatCard
            label="إجمالي المراحل"
            value={
              stats.total
            }
            icon={
              <AccountTreeRounded />
            }
          />

          <StatCard
            label="الظاهر في القائمة"
            value={
              stats.visible
            }
            icon={
              <SearchRounded />
            }
          />

          <StatCard
            label="أول ترتيب"
            value={
              stats.first
            }
            icon={
              <FirstPageRounded />
            }
          />

          <StatCard
            label="آخر ترتيب"
            value={
              stats.last
            }
            icon={
              <LastPageRounded />
            }
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,

            p: 1.2,

            border:
              "1px solid #ded8cd",

            borderRadius:
              "16px",

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
                  event.target
                    .value
                )
              }
              placeholder="ابحث باسم المرحلة..."
              InputProps={{
                startAdornment:
                  (
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
              label="الترتيب"
              value={sort}
              onChange={(
                event
              ) =>
                setSort(
                  event.target
                    .value
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
              <MenuItem value="order-asc">
                الترتيب تصاعديًا
              </MenuItem>

              <MenuItem value="order-desc">
                الترتيب تنازليًا
              </MenuItem>

              <MenuItem value="name-asc">
                الاسم أ — ي
              </MenuItem>

              <MenuItem value="name-desc">
                الاسم ي — أ
              </MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            action={
              <Button
                onClick={() =>
                  loadStages({
                    force: true,
                  })
                }
              >
                إعادة المحاولة
              </Button>
            }
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

            border:
              "1px solid #ded8cd",

            borderRadius:
              "18px",

            backgroundColor:
              "#ffffff",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 1.25,
                md: 1.5,
              },

              py: 1.2,

              borderBottom:
                "1px solid #ded8cd",
            }}
          >
            <Typography
              sx={{
                color:
                  "#122f4d",

                fontSize:
                  "16px",

                fontWeight: 800,
              }}
            >
              قائمة المراحل
            </Typography>

            <Typography
              sx={{
                mt: 0.2,

                color:
                  "#7e8791",

                fontSize:
                  "9px",
              }}
            >
              المراحل ثابتة عبر السنوات الدراسية ويُستخدم ترتيبها في عرض الهيكل الأكاديمي.
            </Typography>
          </Box>

          {!loading &&
          filteredStages.length ===
            0 ? (
            <Box
              sx={{
                minHeight: 290,

                display:
                  "grid",

                placeItems:
                  "center",

                p: 3,

                textAlign:
                  "center",
              }}
            >
              <Box>
                <AccountTreeRounded
                  sx={{
                    fontSize: 50,

                    color:
                      "#d3a44f",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,

                    color:
                      "#122f4d",

                    fontSize:
                      "14px",

                    fontWeight: 800,
                  }}
                >
                  {stages.length
                    ? "لا توجد مراحل مطابقة للبحث"
                    : "لا توجد مراحل دراسية حتى الآن"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,

                    color:
                      "#7e8791",

                    fontSize:
                      "9.5px",
                  }}
                >
                  {stages.length
                    ? "غيّر كلمة البحث لعرض نتائج أخرى."
                    : "ابدأ بإضافة المرحلة الابتدائية ثم المتوسطة والثانوية."}
                </Typography>

                {!stages.length &&
                  permissions.add && (
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={
                      <AddRounded />
                    }
                    onClick={() =>
                      setFormDialog({
                        open: true,
                        stage: null,
                      })
                    }
                    sx={{
                      mt: 1.5,

                      borderRadius:
                        "11px",

                      backgroundColor:
                        "#244a70",

                      fontWeight: 800,
                    }}
                  >
                    إضافة أول مرحلة
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
              >
                <Table
                  sx={{
                    tableLayout:
                      "fixed",
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor:
                          "#f1f5fa",
                      }}
                    >
                      <TableCell
                        align="right"
                        sx={{
                          width: "52%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        المرحلة الدراسية
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "24%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        ترتيب العرض
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "24%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        الإجراءات
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading
                      ? [...Array(4)].map(
                          (
                            _,
                            rowIndex
                          ) => (
                            <TableRow
                              key={rowIndex}
                            >
                              {[0, 1, 2].map(
                                (
                                  cell
                                ) => (
                                  <TableCell
                                    key={cell}
                                  >
                                    <Skeleton
                                      height={30}
                                    />
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          )
                        )
                      : filteredStages.map(
                          (
                            stage
                          ) => (
                            <TableRow
                              key={
                                getId(
                                  stage
                                )
                              }
                              hover
                              sx={{
                                "&:last-child td":
                                  {
                                    borderBottom: 0,
                                  },
                              }}
                            >
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.85}
                                >
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 36,

                                      display:
                                        "grid",

                                      placeItems:
                                        "center",

                                      flexShrink: 0,

                                      color:
                                        "#244a70",

                                      backgroundColor:
                                        "rgba(36,74,112,0.08)",

                                      borderRadius:
                                        "10px",
                                    }}
                                  >
                                    <AccountTreeRounded
                                      sx={{
                                        fontSize: 18,
                                      }}
                                    />
                                  </Box>

                                  <Box>
                                    <Typography
                                      sx={{
                                        color:
                                          "#122f4d",

                                        fontSize:
                                          "11px",

                                        fontWeight: 800,
                                      }}
                                    >
                                      {stage?.name}
                                    </Typography>

                                    <Typography
                                      sx={{
                                        mt: 0.15,

                                        color:
                                          "#7e8791",

                                        fontSize:
                                          "7.8px",
                                      }}
                                    >
                                      هيكل أكاديمي ثابت عبر السنوات
                                    </Typography>
                                  </Box>
                                </Stack>
                              </TableCell>

                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  icon={
                                    sort ===
                                    "order-desc"
                                      ? <ArrowDownwardRounded />
                                      : <ArrowUpwardRounded />
                                  }
                                  label={`الترتيب ${stage?.order}`}
                                  sx={{
                                    color:
                                      "#244a70",

                                    backgroundColor:
                                      "rgba(36,74,112,0.07)",

                                    fontSize:
                                      "8px",

                                    fontWeight: 800,

                                    "& .MuiChip-icon":
                                      {
                                        color:
                                          "#244a70",

                                        fontSize: 14,
                                      },
                                  }}
                                />
                              </TableCell>

                              <TableCell align="center">
                                <Stack
                                  direction="row"
                                  justifyContent="center"
                                  gap={0.45}
                                >
                                  {permissions.edit && (
                                  <Tooltip title="تعديل المرحلة">
                                    <IconButton
                                      type="button"
                                      onClick={() =>
                                        setFormDialog({
                                          open: true,
                                          stage,
                                        })
                                      }
                                      sx={{
                                        width: 34,
                                        height: 34,

                                        color:
                                          "#244a70",

                                        backgroundColor:
                                          "rgba(36,74,112,0.08)",
                                      }}
                                    >
                                      <EditRounded
                                        sx={{
                                          fontSize: 17,
                                        }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                  )}

                                  {permissions.delete && (
                                  <Tooltip title="حذف المرحلة">
                                    <IconButton
                                      type="button"
                                      onClick={() =>
                                        setDeleteTarget(
                                          stage
                                        )
                                      }
                                      sx={{
                                        width: 34,
                                        height: 34,

                                        color:
                                          "#c94f4f",

                                        backgroundColor:
                                          "rgba(201,79,79,0.09)",
                                      }}
                                    >
                                      <DeleteOutlineRounded
                                        sx={{
                                          fontSize: 17,
                                        }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                spacing={0.8}
                sx={{
                  display: {
                    xs: "flex",
                    md: "none",
                  },

                  p: 1,
                }}
              >
                {loading
                  ? [...Array(3)].map(
                      (
                        _,
                        index
                      ) => (
                        <Skeleton
                          key={index}
                          variant="rounded"
                          height={120}
                          sx={{
                            borderRadius:
                              "14px",
                          }}
                        />
                      )
                    )
                  : filteredStages.map(
                      (
                        stage
                      ) => (
                        <Paper
                          key={
                            getId(
                              stage
                            )
                          }
                          elevation={0}
                          sx={{
                            p: 1.15,

                            border:
                              "1px solid rgba(36,74,112,0.09)",

                            borderRadius:
                              "14px",

                            backgroundColor:
                              "#ffffff",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            gap={1}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  color:
                                    "#122f4d",

                                  fontSize:
                                    "14px",

                                  fontWeight: 800,
                                }}
                              >
                                {stage?.name}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.25,

                                  color:
                                    "#7e8791",

                                  fontSize:
                                    "8.5px",
                                }}
                              >
                                ترتيب العرض: {stage?.order}
                              </Typography>
                            </Box>

                            <Chip
                              size="small"
                              label={`#${stage?.order}`}
                              sx={{
                                color:
                                  "#b78430",

                                backgroundColor:
                                  "#fbf0d8",

                                fontWeight: 800,
                              }}
                            />
                          </Stack>

                          <Stack
                            direction="row"
                            gap={0.6}
                            sx={{
                              mt: 1,

                              pt: 0.9,

                              borderTop:
                                "1px solid rgba(36,74,112,0.07)",
                            }}
                          >
                            {permissions.edit && (
                            <Button
                              type="button"
                              size="small"
                              startIcon={
                                <EditRounded />
                              }
                              onClick={() =>
                                setFormDialog({
                                  open: true,
                                  stage,
                                })
                              }
                              sx={{
                                color:
                                  "#244a70",

                                fontWeight: 800,
                              }}
                            >
                              تعديل
                            </Button>
                            )}

                            {permissions.delete && (
                            <Button
                              type="button"
                              size="small"
                              color="error"
                              startIcon={
                                <DeleteOutlineRounded />
                              }
                              onClick={() =>
                                setDeleteTarget(
                                  stage
                                )
                              }
                              sx={{
                                fontWeight: 800,
                              }}
                            >
                              حذف
                            </Button>
                            )}
                          </Stack>
                        </Paper>
                      )
                    )}
              </Stack>
            </>
          )}
        </Paper>

        <StageFormDialog
          open={
            formDialog.open
          }
          stage={
            formDialog.stage
          }
          loading={
            actionLoading
          }
          onClose={() =>
            setFormDialog({
              open: false,
              stage: null,
            })
          }
          onSubmit={
            handleSave
          }
        />

        <StageDeleteDialog
          open={
            Boolean(
              deleteTarget
            )
          }
          stage={
            deleteTarget
          }
          loading={
            actionLoading
          }
          onClose={() =>
            setDeleteTarget(
              null
            )
          }
          onConfirm={
            handleDelete
          }
        />
      </Box>
    </Container>
  );
};

export default StagesList;
