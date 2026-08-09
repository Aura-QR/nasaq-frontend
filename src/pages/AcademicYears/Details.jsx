import {
  ArchiveRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  RefreshRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";
import AcademicYearForm from "@/components/AcademicYears/AcademicYearForm";
import TermsManager from "@/components/AcademicYears/TermsManager";

import {
  deleteAcademicYear,
  fetchAcademicYearById,
  fetchAcademicYears,
  updateAcademicYear,
} from "@/APIs/school/academicYears";

import {
  extractApiList,
  formatAcademicDate,
  getAcademicYearStatus,
  getAcademicYearStatusLabel,
  getEntityId,
  sortAcademicYears,
  toInputDate,
  unwrapApiData,
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
  const key =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  return (
    SETUP_LABELS[key] ||
    (
      key
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

    <Box
      sx={{
        minWidth: 0,
      }}
    >
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
        noWrap
        title={
          String(
            value ?? ""
          )
        }
        sx={{
          mt: 0.1,

          color:
            "#122f4d",

          fontSize:
            "13px",

          fontWeight: 800,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const AcademicYearDetails =
  () => {
    const {
      id,
    } = useParams();

    const navigate =
      useNavigate();

    const [
      year,
      setYear,
    ] = useState(null);

    const [
      allYears,
      setAllYears,
    ] = useState([]);

    const [
      termsCount,
      setTermsCount,
    ] = useState(0);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      refreshing,
      setRefreshing,
    ] = useState(false);

    const [
      actionLoading,
      setActionLoading,
    ] = useState(false);

    const [
      error,
      setError,
    ] = useState("");

    const [
      editOpen,
      setEditOpen,
    ] = useState(false);

    const [
      deleteOpen,
      setDeleteOpen,
    ] = useState(false);

    const {
      register,
      handleSubmit,
      formState: {
        errors,
      },
      reset,
      watch,
    } = useForm();

    const startDate =
      watch(
        "startDate"
      );

    const load =
      useCallback(
        async ({
          force = false,
          silent = false,
        } = {}) => {
          if (silent) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const [
            yearResponse,
            listResponse,
          ] =
            await Promise.all([
              fetchAcademicYearById(
                id,
                {
                  force,
                }
              ),

              fetchAcademicYears({
                force,
              }),
            ]);

          if (
            yearResponse?.status ===
              false
          ) {
            setYear(null);

            setError(
              yearResponse?.message ||
              "تعذر تحميل السنة الدراسية"
            );

            setLoading(false);
            setRefreshing(false);

            return;
          }

          setYear(
            unwrapApiData(
              yearResponse
            )
          );

          if (
            listResponse?.status !==
              false
          ) {
            setAllYears(
              sortAcademicYears(
                extractApiList(
                  listResponse
                )
              )
            );
          }

          setLoading(false);
          setRefreshing(false);
        },
        [id]
      );

    useEffect(() => {
      load();
    }, [load]);

    useEffect(() => {
      if (
        !editOpen ||
        !year
      ) {
        return;
      }

      reset({
        name:
          year?.name ||
          "",

        startDate:
          toInputDate(
            year?.startDate
          ),

        endDate:
          toInputDate(
            year?.endDate
          ),
      });
    }, [
      editOpen,
      year,
      reset,
    ]);

    const previousYears =
      useMemo(
        () =>
          allYears.filter(
            (item) =>
              getEntityId(
                item
              ) !== id
          ),
        [
          allYears,
          id,
        ]
      );

    const handleEdit =
      async (values) => {
        if (
          startDate &&
          values.endDate <
            startDate
        ) {
          toast.error(
            "تاريخ النهاية يجب أن يكون بعد تاريخ البداية"
          );

          return;
        }

        setActionLoading(
          true
        );

        const response =
          await updateAcademicYear(
            id,
            values
          );

        if (
          response?.status ===
            false
        ) {
          toast.error(
            response?.message ||
            "تعذر تعديل السنة الدراسية"
          );

          setActionLoading(
            false
          );

          return;
        }

        toast.success(
          "تم تعديل السنة الدراسية بنجاح"
        );

        setEditOpen(false);

        setActionLoading(
          false
        );

        load({
          force: true,
        });
      };

    const handleDelete =
      async () => {
        setActionLoading(
          true
        );

        const response =
          await deleteAcademicYear(
            id
          );

        if (
          response?.status ===
            false
        ) {
          toast.error(
            response?.message ||
            "تعذر حذف السنة الدراسية"
          );

          setActionLoading(
            false
          );

          return;
        }

        toast.success(
          "تم حذف السنة الدراسية بنجاح"
        );

        navigate(
          "/school/academic-years",
          {
            replace: true,
          }
        );
      };

    if (loading) {
      return (
        <Container>
          <Stack spacing={1.1}>
            <Skeleton
              variant="rounded"
              height={132}
              sx={{
                borderRadius:
                  "18px",
              }}
            />

            <Box
              sx={{
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
              {[0, 1, 2, 3].map(
                (item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={82}
                    sx={{
                      borderRadius:
                        "15px",
                    }}
                  />
                )
              )}
            </Box>

            <Skeleton
              variant="rounded"
              height={330}
              sx={{
                borderRadius:
                  "18px",
              }}
            />
          </Stack>
        </Container>
      );
    }

    if (
      error ||
      !year
    ) {
      return (
        <Container>
          <Alert
            severity="error"
            action={
              <Button
                onClick={() =>
                  load({
                    force: true,
                  })
                }
              >
                إعادة المحاولة
              </Button>
            }
            sx={{
              borderRadius:
                "14px",
            }}
          >
            {error ||
              "السنة الدراسية غير موجودة"}
          </Alert>
        </Container>
      );
    }

    const active =
      getAcademicYearStatus(
        year?.status
      ) === "active";

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
                  spacing={0.75}
                  sx={{
                    flexWrap:
                      "wrap",
                  }}
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
                    {year?.name}
                  </Typography>

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
                      getAcademicYearStatusLabel(
                        year?.status
                      )
                    }
                    sx={{
                      color:
                        active
                          ? "#29734A"
                          : "#6f7882",

                      backgroundColor:
                        active
                          ? "rgba(116,201,154,0.16)"
                          : "rgba(126,135,145,0.10)",

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
                  إدارة بيانات السنة الدراسية والترمات المرتبطة بها.
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={0.75}
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={
                    <ArrowBackRounded />
                  }
                  onClick={() =>
                    navigate(
                      "/school/academic-years"
                    )
                  }
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
                  رجوع
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  disabled={
                    refreshing
                  }
                  startIcon={
                    refreshing ? (
                      <CircularProgress
                        size={15}
                        color="inherit"
                      />
                    ) : (
                      <RefreshRounded />
                    )
                  }
                  onClick={() =>
                    load({
                      force: true,
                      silent: true,
                    })
                  }
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
                  variant="contained"
                  startIcon={
                    <EditRounded />
                  }
                  onClick={() =>
                    setEditOpen(
                      true
                    )
                  }
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
                  تعديل البيانات
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  startIcon={
                    <DeleteOutlineRounded />
                  }
                  onClick={() =>
                    setDeleteOpen(
                      true
                    )
                  }
                  sx={{
                    minHeight: 42,

                    borderRadius:
                      "12px",

                    fontWeight: 800,

                    "& .MuiButton-startIcon":
                      {
                        ml: 0.65,
                        mr: 0,
                      },
                  }}
                >
                  حذف السنة
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
              label="تاريخ البداية"
              value={
                formatAcademicDate(
                  year?.startDate
                )
              }
              icon={
                <CalendarMonthRounded />
              }
            />

            <StatCard
              label="تاريخ النهاية"
              value={
                formatAcademicDate(
                  year?.endDate
                )
              }
              icon={
                <CalendarMonthRounded />
              }
            />

            <StatCard
              label="مدة السنة"
              value={
                getYearDuration(
                  year
                )
              }
              icon={
                <ScheduleRounded />
              }
            />

            <StatCard
              label="عدد الترمات"
              value={
                termsCount
              }
              icon={
                <CalendarMonthRounded />
              }
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,

              px: 1.25,
              py: 0.95,

              borderRadius:
                "14px",

              border:
                "1px solid #ded8cd",

              backgroundColor:
                "#ffffff",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              justifyContent="space-between"
              gap={0.7}
            >
              <Typography
                sx={{
                  color:
                    "#7e8791",

                  fontSize:
                    "9px",
                }}
              >
                حالة تجهيز السنة
              </Typography>

              <Chip
                size="small"
                label={
                  getSetupLabel(
                    year?.setupStep
                  )
                }
                sx={{
                  color:
                    "#244a70",

                  backgroundColor:
                    "rgba(36,74,112,0.07)",

                  fontSize:
                    "8.5px",

                  fontWeight: 800,
                }}
              />
            </Stack>
          </Paper>

          <Box
            sx={{
              mt: 1.25,
            }}
          >
            <TermsManager
              academicYearId={
                id
              }
              previousYears={
                previousYears
              }
              onTermsChange={(
                nextTerms
              ) =>
                setTermsCount(
                  nextTerms.length
                )
              }
            />
          </Box>

          <Dialog
            open={
              editOpen
            }
            onClose={
              actionLoading
                ? undefined
                : () =>
                    setEditOpen(
                      false
                    )
            }
            fullWidth
            maxWidth="md"
            PaperProps={{
              sx: {
                borderRadius:
                  "18px",

                backgroundColor:
                  "#f0ede6",
              },
            }}
          >
            <DialogTitle
              sx={{
                color:
                  "#122f4d",

                fontWeight: 800,
              }}
            >
              تعديل السنة الدراسية
            </DialogTitle>

            <DialogContent
              sx={{
                pt:
                  "8px !important",
              }}
            >
              <Box
                component="form"
                onSubmit={
                  handleSubmit(
                    handleEdit
                  )
                }
              >
                <AcademicYearForm
                  register={
                    register
                  }
                  errors={
                    errors
                  }
                  loading={
                    actionLoading
                  }
                  mode="edit"
                  onCancel={() =>
                    setEditOpen(
                      false
                    )
                  }
                />
              </Box>
            </DialogContent>
          </Dialog>

          <Dialog
            open={
              deleteOpen
            }
            onClose={
              actionLoading
                ? undefined
                : () =>
                    setDeleteOpen(
                      false
                    )
            }
            fullWidth
            maxWidth="xs"
            PaperProps={{
              sx: {
                borderRadius:
                  "18px",
              },
            }}
          >
            <DialogTitle
              sx={{
                color:
                  "#122f4d",

                fontWeight: 800,
              }}
            >
              حذف السنة الدراسية
            </DialogTitle>

            <DialogContent
              sx={{
                pt:
                  "16px !important",
              }}
            >
              <Typography
                sx={{
                  color:
                    "#193754",

                  fontSize:
                    "11px",

                  lineHeight: 1.9,
                }}
              >
                هل تريد حذف السنة "{year?.name}"؟ قد يرفض الخادم الحذف إذا كانت مرتبطة بسجلات أكاديمية.
              </Typography>

              <Stack
                direction="row"
                spacing={0.8}
                sx={{
                  mt: 2,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    setDeleteOpen(
                      false
                    )
                  }
                  sx={{
                    borderRadius:
                      "10px",
                  }}
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  color="error"
                  disabled={
                    actionLoading
                  }
                  onClick={
                    handleDelete
                  }
                  sx={{
                    borderRadius:
                      "10px",
                  }}
                >
                  {actionLoading ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    "حذف السنة"
                  )}
                </Button>
              </Stack>
            </DialogContent>
          </Dialog>
        </Box>
      </Container>
    );
  };

export default AcademicYearDetails;
