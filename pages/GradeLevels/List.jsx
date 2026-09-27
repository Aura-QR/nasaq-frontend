import {
  AccountTreeRounded,
  AddRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  DeleteOutlineRounded,
  EditRounded,
  FilterAltRounded,
  RefreshRounded,
  SchoolRounded,
  SearchRounded,
  TrendingUpRounded,
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
import GradeLevelFormDialog from "@/components/GradeLevels/GradeLevelFormDialog";
import GradeLevelDeleteDialog from "@/components/GradeLevels/GradeLevelDeleteDialog";

import {
  createGradeLevel,
  deleteGradeLevel,
  fetchGradeLevels,
  updateGradeLevel,
} from "@/APIs/school/gradeLevels";

import {
  fetchStages,
} from "@/APIs/school/stages";

import usePermissions from "@/utils/hooks/usePermissions";

const unwrapData = (
  response
) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractList = (
  response,
  keys = []
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
      ...keys.map(
        (key) =>
          payload?.[key]
      ),

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
    value ||
    ""
  ).trim();

const getStageId = (
  gradeLevel
) =>
  getId(
    gradeLevel
      ?.stageId ||
    gradeLevel
      ?.stage
  );

const getStageName = (
  gradeLevel,
  stageMap
) => {
  const populated =
    gradeLevel
      ?.stageId ||
    gradeLevel
      ?.stage;

  if (
    populated &&
    typeof populated ===
      "object"
  ) {
    return (
      populated?.name ||
      populated
        ?.stageName ||
      "—"
    );
  }

  return (
    stageMap.get(
      getStageId(
        gradeLevel
      )
    ) ||
    gradeLevel
      ?.stageName ||
    "—"
  );
};

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

const GradeLevelsList = () => {
  const permissions =
    usePermissions(
      "classes"
    );

  const [
    gradeLevels,
    setGradeLevels,
  ] = useState([]);

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
    stageFilter,
    setStageFilter,
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
    gradeLevel: null,
  });

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const loadData =
    useCallback(
      async ({
        force = false,
      } = {}) => {
        setLoading(true);
        setError("");

        const [
          gradeLevelsResponse,
          stagesResponse,
        ] =
          await Promise.all([
            fetchGradeLevels({
              force,
            }),

            fetchStages({
              force,
            }),
          ]);

        const errors = [];

        if (
          gradeLevelsResponse
            ?.status ===
          false
        ) {
          setGradeLevels([]);

          errors.push(
            gradeLevelsResponse
              ?.message ||
            "تعذر تحميل الصفوف الدراسية"
          );
        } else {
          setGradeLevels(
            sortByOrder(
              extractList(
                gradeLevelsResponse,
                [
                  "gradeLevels",
                  "grades",
                ]
              )
            )
          );
        }

        if (
          stagesResponse
            ?.status ===
          false
        ) {
          setStages([]);

          errors.push(
            stagesResponse
              ?.message ||
            "تعذر تحميل المراحل الدراسية"
          );
        } else {
          setStages(
            sortByOrder(
              extractList(
                stagesResponse,
                [
                  "stages",
                ]
              )
            )
          );
        }

        setError(
          errors.join(
            " — "
          )
        );

        setLoading(false);
      },
      []
    );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stageMap =
    useMemo(
      () =>
        new Map(
          stages.map(
            (stage) => [
              getId(stage),
              stage?.name ||
                "—",
            ]
          )
        ),
      [stages]
    );

  const orderedAll =
    useMemo(
      () =>
        sortByOrder(
          gradeLevels
        ),
      [gradeLevels]
    );

  const nextGradeMap =
    useMemo(
      () => {
        const map =
          new Map();

        orderedAll.forEach(
          (
            gradeLevel,
            index
          ) => {
            map.set(
              getId(
                gradeLevel
              ),
              orderedAll[
                index + 1
              ] || null
            );
          }
        );

        return map;
      },
      [orderedAll]
    );

  const filteredGradeLevels =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const filtered =
          gradeLevels.filter(
            (gradeLevel) => {
              const matchesSearch =
                !normalizedSearch ||
                String(
                  gradeLevel
                    ?.name ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  ) ||
                getStageName(
                  gradeLevel,
                  stageMap
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  );

              const matchesStage =
                !stageFilter ||
                getStageId(
                  gradeLevel
                ) ===
                  stageFilter;

              return (
                matchesSearch &&
                matchesStage
              );
            }
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
        gradeLevels,
        search,
        stageFilter,
        sort,
        stageMap,
      ]
    );

  const stats =
    useMemo(
      () => {
        const coveredStages =
          new Set(
            gradeLevels
              .map(
                getStageId
              )
              .filter(
                Boolean
              )
          ).size;

        const maxOrder =
          gradeLevels.length
            ? Math.max(
                ...gradeLevels.map(
                  (gradeLevel) =>
                    Number(
                      gradeLevel
                        ?.order ||
                      0
                    )
                )
              )
            : 0;

        return {
          total:
            gradeLevels.length,

          visible:
            filteredGradeLevels.length,

          stages:
            coveredStages,

          maxOrder,
        };
      },
      [
        gradeLevels,
        filteredGradeLevels,
      ]
    );

  const nextSuggestedOrder =
    stats.maxOrder + 1;

  const handleSave =
    async (values) => {
      setActionLoading(
        true
      );

      const editing =
        formDialog
          .gradeLevel;

      const response =
        editing
          ? await updateGradeLevel(
              getId(
                editing
              ),
              values
            )
          : await createGradeLevel(
              values
            );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر حفظ الصف الدراسي"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        editing
          ? "تم تعديل الصف الدراسي بنجاح"
          : "تمت إضافة الصف الدراسي بنجاح"
      );

      setFormDialog({
        open: false,
        gradeLevel: null,
      });

      setActionLoading(
        false
      );

      loadData({
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
        await deleteGradeLevel(
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
          "تعذر حذف الصف الدراسي"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        "تم حذف الصف الدراسي بنجاح"
      );

      setDeleteTarget(
        null
      );

      setActionLoading(
        false
      );

      loadData({
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
                  إدارة الصفوف الدراسية
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
                اربط الصفوف بالمراحل وحدد التسلسل العام المستخدم في ترقية الطلاب.
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
                  loadData({
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
                  disabled={
                    stages.length ===
                    0
                  }
                  onClick={() =>
                    setFormDialog({
                      open: true,
                      gradeLevel: null,
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
                  إضافة صف دراسي
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
            label="إجمالي الصفوف"
            value={
              stats.total
            }
            icon={
              <SchoolRounded />
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
            label="المراحل المستخدمة"
            value={
              stats.stages
            }
            icon={
              <AccountTreeRounded />
            }
          />

          <StatCard
            label="آخر ترتيب عام"
            value={
              stats.maxOrder
            }
            icon={
              <TrendingUpRounded />
            }
          />
        </Box>

        {stages.length ===
          0 &&
          !loading && (
            <Alert
              severity="warning"
              sx={{
                mt: 1.25,

                borderRadius:
                  "14px",
              }}
            >
              لا توجد مراحل دراسية. أضيفي المراحل أولًا من صفحة إدارة المراحل قبل إنشاء الصفوف.
            </Alert>
          )}

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
              lg: "row",
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
              placeholder="ابحث باسم الصف أو المرحلة..."
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
              label="المرحلة"
              value={
                stageFilter
              }
              onChange={(
                event
              ) =>
                setStageFilter(
                  event.target
                    .value
                )
              }
              InputProps={{
                startAdornment:
                  (
                    <InputAdornment position="start">
                      <FilterAltRounded />
                    </InputAdornment>
                  ),
              }}
              sx={{
                width: {
                  xs: "100%",
                  lg: 230,
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
                كل المراحل
              </MenuItem>

              {stages.map(
                (stage) => (
                  <MenuItem
                    key={
                      getId(stage)
                    }
                    value={
                      getId(stage)
                    }
                  >
                    {stage?.name}
                  </MenuItem>
                )
              )}
            </TextField>

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
                  lg: 210,
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
                  loadData({
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
              قائمة الصفوف الدراسية
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
              الترتيب العام يحدد الصف التالي عند تنفيذ ترقية الطلاب.
            </Typography>
          </Box>

          {!loading &&
          filteredGradeLevels
            .length === 0 ? (
            <Box
              sx={{
                minHeight: 300,

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
                <SchoolRounded
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
                  {gradeLevels.length
                    ? "لا توجد صفوف مطابقة للبحث"
                    : "لا توجد صفوف دراسية حتى الآن"}
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
                  {gradeLevels.length
                    ? "غيّري البحث أو فلتر المرحلة."
                    : "ابدئي بإضافة أول صف وربطه بالمرحلة المناسبة."}
                </Typography>

                {!gradeLevels.length &&
                  permissions.add &&
                  stages.length >
                    0 && (
                    <Button
                      type="button"
                      variant="contained"
                      startIcon={
                        <AddRounded />
                      }
                      onClick={() =>
                        setFormDialog({
                          open: true,
                          gradeLevel: null,
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
                      إضافة أول صف
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
                          width: "28%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        الصف الدراسي
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "22%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        المرحلة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "16%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        الترتيب العام
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "22%",

                          color:
                            "#244a70",

                          fontSize:
                            "9px",

                          fontWeight: 800,
                        }}
                      >
                        الصف التالي
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          width: "12%",

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
                      ? [...Array(5)].map(
                          (
                            _,
                            rowIndex
                          ) => (
                            <TableRow
                              key={rowIndex}
                            >
                              {[0, 1, 2, 3, 4].map(
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
                      : filteredGradeLevels.map(
                          (
                            gradeLevel
                          ) => {
                            const nextGrade =
                              nextGradeMap.get(
                                getId(
                                  gradeLevel
                                )
                              );

                            return (
                              <TableRow
                                key={
                                  getId(
                                    gradeLevel
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
                                      <SchoolRounded
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
                                        {gradeLevel?.name}
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
                                        مستوى دراسي ضمن مسار الترقية
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>

                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    icon={
                                      <AccountTreeRounded />
                                    }
                                    label={
                                      getStageName(
                                        gradeLevel,
                                        stageMap
                                      )
                                    }
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
                                  <Chip
                                    size="small"
                                    icon={
                                      sort ===
                                      "order-desc"
                                        ? <ArrowDownwardRounded />
                                        : <ArrowUpwardRounded />
                                    }
                                    label={`الترتيب ${gradeLevel?.order}`}
                                    sx={{
                                      color:
                                        "#b78430",

                                      backgroundColor:
                                        "#fbf0d8",

                                      fontSize:
                                        "8px",

                                      fontWeight: 800,

                                      "& .MuiChip-icon":
                                        {
                                          color:
                                            "#b78430",

                                          fontSize: 14,
                                        },
                                    }}
                                  />
                                </TableCell>

                                <TableCell align="center">
                                  {nextGrade ? (
                                    <Typography
                                      sx={{
                                        color:
                                          "#193754",

                                        fontSize:
                                          "9px",

                                        fontWeight: 700,
                                      }}
                                    >
                                      {nextGrade?.name}
                                    </Typography>
                                  ) : (
                                    <Chip
                                      size="small"
                                      label="نهاية التسلسل"
                                      sx={{
                                        color:
                                          "#6f7882",

                                        backgroundColor:
                                          "rgba(126,135,145,0.10)",

                                        fontSize:
                                          "8px",

                                        fontWeight: 800,
                                      }}
                                    />
                                  )}
                                </TableCell>

                                <TableCell align="center">
                                  <Stack
                                    direction="row"
                                    justifyContent="center"
                                    gap={0.45}
                                  >
                                    {permissions.edit && (
                                      <Tooltip title="تعديل الصف">
                                        <IconButton
                                          type="button"
                                          onClick={() =>
                                            setFormDialog({
                                              open: true,
                                              gradeLevel,
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
                                      <Tooltip title="حذف الصف">
                                        <IconButton
                                          type="button"
                                          onClick={() =>
                                            setDeleteTarget(
                                              gradeLevel
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
                            );
                          }
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
                          height={145}
                          sx={{
                            borderRadius:
                              "14px",
                          }}
                        />
                      )
                    )
                  : filteredGradeLevels.map(
                      (
                        gradeLevel
                      ) => {
                        const nextGrade =
                          nextGradeMap.get(
                            getId(
                              gradeLevel
                            )
                          );

                        return (
                          <Paper
                            key={
                              getId(
                                gradeLevel
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
                                  {gradeLevel?.name}
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
                                  {getStageName(
                                    gradeLevel,
                                    stageMap
                                  )}
                                </Typography>
                              </Box>

                              <Chip
                                size="small"
                                label={`#${gradeLevel?.order}`}
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
                                mt: 0.8,

                                color:
                                  "#193754",

                                fontSize:
                                  "8.5px",
                              }}
                            >
                              الصف التالي: {nextGrade?.name || "نهاية التسلسل"}
                            </Typography>

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
                                      gradeLevel,
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
                                      gradeLevel
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
                        );
                      }
                    )}
              </Stack>
            </>
          )}
        </Paper>

        <GradeLevelFormDialog
          open={
            formDialog.open
          }
          gradeLevel={
            formDialog
              .gradeLevel
          }
          stages={stages}
          gradeLevels={
            gradeLevels
          }
          defaultOrder={
            nextSuggestedOrder
          }
          loading={
            actionLoading
          }
          onClose={() =>
            setFormDialog({
              open: false,
              gradeLevel: null,
            })
          }
          onSubmit={
            handleSave
          }
        />

        <GradeLevelDeleteDialog
          open={
            Boolean(
              deleteTarget
            )
          }
          gradeLevel={
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

export default GradeLevelsList;
