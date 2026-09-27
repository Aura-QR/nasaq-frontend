import {
  AddRounded,
  ArchiveRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DateRangeRounded,
  DeleteOutlineRounded,
  RefreshRounded,
  SearchRounded,
  SettingsRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
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
  Link,
  useNavigate,
} from "react-router-dom";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";

import {
  deleteAcademicYear,
  fetchAcademicYears,
} from "@/APIs/school/academicYears";

import {
  extractApiList,
  formatAcademicDate,
  getAcademicYearStatus,
  getEntityId,
  sortAcademicYears,
} from "@/utils/school/academicYearData";

const SETUP_LABELS = {
  setup_terms:
    "إعداد الترمات",

  setup_stages:
    "إعداد المراحل",

  setup_grade_levels:
    "إعداد الصفوف",

  setup_classes:
    "إعداد الفصول",

  setup_enrollments:
    "تسكين الطلاب",

  setup_subject_offerings:
    "تفعيل المواد",

  setup_teacher_assignments:
    "إسناد المعلمين",

  setup_schedule:
    "إعداد الجداول",

  completed:
    "اكتمل الإعداد",
};

const getSetupLabel = (
  value
) => {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  return (
    SETUP_LABELS[
      normalized
    ] ||
    (
      normalized
        ? "الإعداد جارٍ"
        : "لم يبدأ الإعداد"
    )
  );
};

const getYearDuration = (
  year
) => {
  const start =
    new Date(
      year?.startDate
    );

  const end =
    new Date(
      year?.endDate
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return "غير محددة";
  }

  const months =
    Math.max(
      1,
      Math.round(
        (
          end -
          start
        ) /
          (
            1000 *
            60 *
            60 *
            24 *
            30.4
          )
      )
    );

  return `${months} شهر`;
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

      display:
        "flex",

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

        display:
          "grid",

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

const StatusChip = ({
  status,
}) => {
  const active =
    getAcademicYearStatus(
      status
    ) === "active";

  return (
    <Chip
      size="small"
      icon={
        active ? (
          <CheckCircleRounded />
        ) : (
          <ArchiveRounded />
        )
      }
      label={
        active
          ? "نشطة"
          : "مؤرشفة"
      }
      sx={{
        minWidth: 82,

        color:
          active
            ? "#29734A"
            : "#6f7882",

        backgroundColor:
          active
            ? "rgba(116,201,154,0.16)"
            : "rgba(126,135,145,0.10)",

        border:
          active
            ? "1px solid rgba(116,201,154,0.24)"
            : "1px solid rgba(126,135,145,0.12)",

        fontSize:
          "8.5px",

        fontWeight: 800,

        "& .MuiChip-icon":
          {
            color:
              "inherit",

            fontSize: 15,
          },
      }}
    />
  );
};

const LoadingRows =
  () =>
    [...Array(4)].map(
      (
        _,
        index
      ) => (
        <TableRow
          key={index}
        >
          {[...Array(6)].map(
            (
              __,
              cellIndex
            ) => (
              <TableCell
                key={
                  cellIndex
                }
              >
                <Skeleton
                  height={28}
                />
              </TableCell>
            )
          )}
        </TableRow>
      )
    );

const AcademicYearsList =
  () => {
    const navigate =
      useNavigate();

    const [
      years,
      setYears,
    ] = useState([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      error,
      setError,
    ] = useState("");

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      status,
      setStatus,
    ] = useState("");

    const [
      deletingId,
      setDeletingId,
    ] = useState("");

    const loadYears =
      useCallback(
        async ({
          force = false,
        } = {}) => {
          setLoading(true);
          setError("");

          const response =
            await fetchAcademicYears({
              force,
            });

          if (
            response?.status ===
              false
          ) {
            setYears([]);

            setError(
              response?.message ||
              "تعذر تحميل السنوات الدراسية"
            );

            setLoading(false);

            return;
          }

          setYears(
            sortAcademicYears(
              extractApiList(
                response
              )
            )
          );

          setLoading(false);
        },
        []
      );

    useEffect(() => {
      loadYears();
    }, [loadYears]);

    const handleDeleteYear =
      async (year) => {
        const academicYearId =
          getEntityId(year);

        if (!academicYearId) {
          toast.error(
            "معرّف السنة الدراسية غير موجود"
          );
          return;
        }

        const confirmed =
          window.confirm(
            `هل أنت متأكد من حذف السنة "${year?.name || ""}"؟ لا يمكن التراجع عن هذه العملية.`
          );

        if (!confirmed) {
          return;
        }

        setDeletingId(
          academicYearId
        );

        const response =
          await deleteAcademicYear(
            academicYearId
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر حذف السنة الدراسية"
          );

          setDeletingId("");
          return;
        }

        toast.success(
          response?.message ||
            "تم حذف السنة الدراسية بنجاح"
        );

        setDeletingId("");

        await loadYears({
          force: true,
        });
      };

    const filteredYears =
      useMemo(
        () => {
          const normalizedSearch =
            search
              .trim()
              .toLowerCase();

          return years.filter(
            (year) => {
              const yearStatus =
                getAcademicYearStatus(
                  year?.status
                );

              const matchesSearch =
                !normalizedSearch ||
                String(
                  year?.name ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  );

              const matchesStatus =
                !status ||
                yearStatus ===
                  status;

              return (
                matchesSearch &&
                matchesStatus
              );
            }
          );
        },
        [
          years,
          search,
          status,
        ]
      );

    const stats =
      useMemo(
        () => ({
          total:
            years.length,

          visible:
            filteredYears.length,

          active:
            years.filter(
              (year) =>
                getAcademicYearStatus(
                  year?.status
                ) ===
                "active"
            ).length,

          archived:
            years.filter(
              (year) =>
                getAcademicYearStatus(
                  year?.status
                ) ===
                "archived"
            ).length,
        }),
        [
          years,
          filteredYears,
        ]
      );

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

                      fontWeight: 800,
                    }}
                  >
                    إدارة السنوات الدراسية
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
                  إدارة الأعوام الدراسية والترمات وحالة تجهيز كل سنة.
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
                    loadYears({
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

                <Button
                  type="button"
                  component={Link}
                  to="/school/academic-years/add"
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

                    fontWeight: 800,

                    boxShadow:
                      "none",

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
                  إضافة سنة دراسية
                </Button>
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
              label="إجمالي السنوات"
              value={
                stats.total
              }
              icon={
                <CalendarMonthRounded />
              }
            />

            <StatCard
              label="الظاهر في القائمة"
              value={
                stats.visible
              }
              icon={
                <DateRangeRounded />
              }
            />

            <StatCard
              label="السنوات النشطة"
              value={
                stats.active
              }
              icon={
                <CheckCircleRounded />
              }
            />

            <StatCard
              label="السنوات المؤرشفة"
              value={
                stats.archived
              }
              icon={
                <ArchiveRounded />
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
                    event.target
                      .value
                  )
                }
                placeholder="ابحث باسم السنة الدراسية..."
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
                label="الحالة"
                value={status}
                onChange={(
                  event
                ) =>
                  setStatus(
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
                <MenuItem value="">
                  كل الحالات
                </MenuItem>

                <MenuItem value="active">
                  نشطة
                </MenuItem>

                <MenuItem value="archived">
                  مؤرشفة
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
            filteredYears.length ===
              0 ? (
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
                  <CalendarMonthRounded
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

                      fontWeight: 800,
                    }}
                  >
                    لا توجد سنوات دراسية مطابقة
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
                    غيّر البحث أو الحالة، أو أضف سنة دراسية جديدة.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                <TableContainer
                  sx={{
                    display: {
                      xs:
                        "none",

                      md:
                        "block",
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
                            width:
                              "20%",

                            color:
                              "#244a70",

                            fontSize:
                              "9px",

                            fontWeight: 800,
                          }}
                        >
                          السنة الدراسية
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width:
                              "26%",

                            color:
                              "#244a70",

                            fontSize:
                              "9px",

                            fontWeight: 800,
                          }}
                        >
                          الفترة
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width:
                              "12%",

                            color:
                              "#244a70",

                            fontSize:
                              "9px",

                            fontWeight: 800,
                          }}
                        >
                          المدة
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width:
                              "14%",

                            color:
                              "#244a70",

                            fontSize:
                              "9px",

                            fontWeight: 800,
                          }}
                        >
                          الحالة
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width:
                              "18%",

                            color:
                              "#244a70",

                            fontSize:
                              "9px",

                            fontWeight: 800,
                          }}
                        >
                          خطوة الإعداد
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            width:
                              "10%",

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
                      {loading ? (
                        <LoadingRows />
                      ) : (
                        filteredYears.map(
                          (
                            year
                          ) => {
                            const active =
                              getAcademicYearStatus(
                                year
                                  ?.status
                              ) ===
                              "active";

                            return (
                              <TableRow
                                key={
                                  getEntityId(
                                    year
                                  )
                                }
                                hover
                                sx={{
                                  backgroundColor:
                                    active
                                      ? "rgba(251,240,216,0.18)"
                                      : "#ffffff",

                                  "&:last-child td":
                                    {
                                      borderBottom:
                                        0,
                                    },
                                }}
                              >
                                <TableCell
                                  align="right"
                                >
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

                                        flexShrink: 0,

                                        color:
                                          active
                                            ? "#b78430"
                                            : "#244a70",

                                        backgroundColor:
                                          active
                                            ? "#fbf0d8"
                                            : "rgba(36,74,112,0.08)",

                                        borderRadius:
                                          "10px",
                                      }}
                                    >
                                      <CalendarMonthRounded
                                        sx={{
                                          fontSize: 17,
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
                                        {year?.name}
                                      </Typography>

                                      {active && (
                                        <Typography
                                          sx={{
                                            mt: 0.1,

                                            color:
                                              "#b78430",

                                            fontSize:
                                              "7.5px",

                                            fontWeight: 800,
                                          }}
                                        >
                                          العام الدراسي الحالي
                                        </Typography>
                                      )}
                                    </Box>
                                  </Stack>
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#193754",

                                    fontSize:
                                      "9px",

                                    fontWeight: 700,
                                  }}
                                >
                                  {formatAcademicDate(
                                    year
                                      ?.startDate
                                  )}
                                  {" — "}
                                  {formatAcademicDate(
                                    year
                                      ?.endDate
                                  )}
                                </TableCell>

                                <TableCell
                                  align="center"
                                >
                                  <Chip
                                    size="small"
                                    label={
                                      getYearDuration(
                                        year
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
                                    }}
                                  />
                                </TableCell>

                                <TableCell
                                  align="center"
                                >
                                  <StatusChip
                                    status={
                                      year
                                        ?.status
                                    }
                                  />
                                </TableCell>

                                <TableCell
                                  align="center"
                                >
                                  <Chip
                                    size="small"
                                    icon={
                                      <SettingsRounded />
                                    }
                                    label={
                                      getSetupLabel(
                                        year
                                          ?.setupStep
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

                                          fontSize:
                                            14,
                                        },
                                    }}
                                  />
                                </TableCell>

                                <TableCell
                                  align="center"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={0.6}
                                    justifyContent="center"
                                    alignItems="center"
                                  >
                                    <Tooltip title="عرض التفاصيل والترمات">
                                      <IconButton
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/school/academic-years/${getEntityId(
                                              year
                                            )}`
                                          )
                                        }
                                        sx={{
                                          width: 34,
                                          height: 34,

                                          color:
                                            "#244a70",

                                          backgroundColor:
                                            "rgba(36,74,112,0.08)",

                                          border:
                                            "1px solid rgba(36,74,112,0.06)",

                                          "&:hover":
                                            {
                                              color:
                                                "#244a70",

                                              backgroundColor:
                                                "rgba(36,74,112,0.12)",
                                            },
                                        }}
                                      >
                                        <VisibilityRounded
                                          sx={{
                                            fontSize: 17,
                                          }}
                                        />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="حذف السنة الدراسية">
                                      <span>
                                        <IconButton
                                          type="button"
                                          disabled={
                                            deletingId ===
                                            getEntityId(year)
                                          }
                                          onClick={() =>
                                            handleDeleteYear(
                                              year
                                            )
                                          }
                                          sx={{
                                            width: 34,
                                            height: 34,

                                            color:
                                              "#d14343",

                                            backgroundColor:
                                              "rgba(209,67,67,0.07)",

                                            border:
                                              "1px solid rgba(209,67,67,0.12)",

                                            "&:hover":
                                              {
                                                color:
                                                  "#b52f2f",

                                                backgroundColor:
                                                  "rgba(209,67,67,0.12)",
                                              },
                                          }}
                                        >
                                          <DeleteOutlineRounded
                                            sx={{
                                              fontSize: 17,
                                            }}
                                          />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          }
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack
                  spacing={0.8}
                  sx={{
                    display: {
                      xs:
                        "flex",

                      md:
                        "none",
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
                            height={150}
                            sx={{
                              borderRadius:
                                "14px",
                            }}
                          />
                        )
                      )
                    : filteredYears.map(
                        (
                          year
                        ) => {
                          const active =
                            getAcademicYearStatus(
                              year
                                ?.status
                            ) ===
                            "active";

                          return (
                            <Paper
                              key={
                                getEntityId(
                                  year
                                )
                              }
                              elevation={0}
                              sx={{
                                p: 1.2,

                                border:
                                  active
                                    ? "1px solid rgba(211,164,79,0.28)"
                                    : "1px solid rgba(36,74,112,0.09)",

                                borderRadius:
                                  "14px",

                                backgroundColor:
                                  active
                                    ? "rgba(251,240,216,0.22)"
                                    : "#ffffff",
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
                                        "15px",

                                      fontWeight: 800,
                                    }}
                                  >
                                    {year?.name}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: 0.3,

                                      color:
                                        "#7e8791",

                                      fontSize:
                                        "8.5px",
                                    }}
                                  >
                                    {formatAcademicDate(
                                      year
                                        ?.startDate
                                    )}
                                    {" — "}
                                    {formatAcademicDate(
                                      year
                                        ?.endDate
                                    )}
                                  </Typography>
                                </Box>

                                <StatusChip
                                  status={
                                    year
                                      ?.status
                                  }
                                />
                              </Stack>

                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                gap={1}
                                sx={{
                                  mt: 1.2,

                                  pt: 1,

                                  borderTop:
                                    "1px solid rgba(36,74,112,0.07)",
                                }}
                              >
                                <Box>
                                  <Typography
                                    sx={{
                                      color:
                                        "#7e8791",

                                      fontSize:
                                        "7.5px",
                                    }}
                                  >
                                    خطوة الإعداد
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: 0.15,

                                      color:
                                        "#193754",

                                      fontSize:
                                        "9px",

                                      fontWeight: 800,
                                    }}
                                  >
                                    {getSetupLabel(
                                      year
                                        ?.setupStep
                                    )}
                                  </Typography>
                                </Box>

                                <Stack
                                  direction="row"
                                  spacing={0.6}
                                >
                                  <Button
                                    type="button"
                                    size="small"
                                    variant="outlined"
                                    startIcon={
                                      <VisibilityRounded />
                                    }
                                    onClick={() =>
                                      navigate(
                                        `/school/academic-years/${getEntityId(
                                          year
                                        )}`
                                      )
                                    }
                                    sx={{
                                      borderRadius:
                                        "10px",

                                      color:
                                        "#244a70",

                                      borderColor:
                                        "rgba(36,74,112,0.18)",

                                      fontSize:
                                        "9px",

                                      fontWeight: 800,
                                    }}
                                  >
                                    التفاصيل
                                  </Button>

                                  <Button
                                    type="button"
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={
                                      <DeleteOutlineRounded />
                                    }
                                    disabled={
                                      deletingId ===
                                      getEntityId(year)
                                    }
                                    onClick={() =>
                                      handleDeleteYear(
                                        year
                                      )
                                    }
                                    sx={{
                                      borderRadius:
                                        "10px",

                                      fontSize:
                                        "9px",

                                      fontWeight: 800,
                                    }}
                                  >
                                    حذف
                                  </Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          );
                        }
                      )}
                </Stack>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    );
  };

export default AcademicYearsList;
