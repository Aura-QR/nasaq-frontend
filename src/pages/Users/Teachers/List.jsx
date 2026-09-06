import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineOutlined,
  AssignmentIndRounded,
  CheckCircleRounded,
  FileDownloadOutlined,
  Groups2Rounded,
  MenuBookRounded,
  PeopleAltRounded,
  RestartAltRounded,
  SortRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CSVLink } from "react-csv";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import AdminSetPasswordDialog from "@/components/school/AdminSetPasswordDialog";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";

import { deleteTeacher } from "@/APIs/users/teachers";
import { adminSetTeacherPassword } from "@/APIs/school/teachers";
import { useTeachers } from "@/utils/hooks/apis/useTeachers";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

import Status from "@/utils/constants/Status";
import { getStoredRole } from "@/shared/auth/session";
import { ROLES } from "@/shared/auth/roles";

const TABLE_HEADERS = [
  "اسم المعلم",
  "رقم الهاتف",
  "البريد الإلكتروني",
  "المواد الدراسية",
  "الحالة",
];

const TABLE_BODY = [
  "name",
  "phone",
  "email",
  "subjects",
  "status",
];

const getTeacherSubjects = (teacher) => {
  const subjects =
    Array.isArray(teacher?.subjects) &&
    teacher.subjects.length > 0
      ? teacher.subjects
      : Array.isArray(teacher?.subject)
      ? teacher.subject
      : [];

  if (subjects.length > 0) {
    return subjects
      .map(
        (subject) =>
          subject?.subjectName ||
          subject?.name ||
          subject?.title
      )
      .filter(Boolean);
  }

  const offerings = Array.isArray(
    teacher?.subjectOfferings
  )
    ? teacher.subjectOfferings
    : [];

  return offerings
    .map((offering) => {
      const subject =
        offering?.subjectId ||
        offering?.subject;

      return (
        subject?.subjectName ||
        subject?.name ||
        subject?.title
      );
    })
    .filter(Boolean);
};

const mapTeachers = (data = []) =>
  data.map((teacher) => {
    const subjectNames =
      getTeacherSubjects(teacher);

    const teacherName =
      teacher?.name ||
      [
        teacher?.firstName,
        teacher?.fatherName,
        teacher?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

    return {
      id: teacher?._id,
      name: teacherName || "—",
      phone:
        teacher?.phoneNumber ||
        teacher?.phone ||
        "—",
      email: teacher?.email || "—",
      subjects:
        subjectNames.length > 0
          ? subjectNames.join(" - ")
          : "لا يوجد",
      subjectNames,
      status: teacher?.isActive
        ? "نشط"
        : "غير نشط",
    };
  });

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي المعلمين",
    icon: <PeopleAltRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <Groups2Rounded />,
  },
  {
    key: "active",
    label: "المعلمون النشطون",
    icon: <CheckCircleRounded />,
  },
  {
    key: "subjects",
    label: "المواد الظاهرة",
    icon: <MenuBookRounded />,
  },
];

const List = () => {
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordTeacher, setPasswordTeacher] = useState(null);

  const canSetPassword = [
    ROLES.OWNER,
    ROLES.MANAGER,
    ROLES.SUPER_ADMIN,
  ].includes(getStoredRole());

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedSearch = useDebounce(
    search,
    700
  );

  const filters = useMemo(
    () => ({
      page,
      limit,
      name:
        debouncedSearch || undefined,
      isActive:
        status !== ""
          ? Boolean(Number(status))
          : undefined,
    }),
    [
      page,
      limit,
      debouncedSearch,
      status,
    ]
  );

  const {
    teachers,
    loading,
    pagination,
  } = useTeachers(filters);

  const permissions =
    usePermissions("teachers");

  const lecturePermissions =
    usePermissions("lectures");

  useEffect(() => {
    setItems(mapTeachers(teachers));
  }, [teachers]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(pagination);
    }
  }, [pagination]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    debouncedSearch,
    status,
  ]);

  const currentPagination =
    localPagination || pagination;

  const activeFiltersCount = [
    search,
    status,
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    const activeTeachers = items.filter(
      (teacher) =>
        teacher.status === "نشط"
    ).length;

    const visibleSubjects = new Set(
      items.flatMap(
        (teacher) =>
          teacher.subjectNames || []
      )
    ).size;

    return {
      total:
        currentPagination?.totalDocs ??
        items.length,
      visible: items.length,
      active: activeTeachers,
      subjects: visibleSubjects,
    };
  }, [items, currentPagination]);

  const csvData = useMemo(
    () =>
      items.map((teacher) => ({
        "اسم المعلم": teacher.name,
        "رقم الهاتف": teacher.phone,
        "البريد الإلكتروني":
          teacher.email,
        "المواد الدراسية":
          teacher.subjects,
        الحالة: teacher.status,
      })),
    [items]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    if (!permissions.delete) {
      toast.error(
        "ليس لديك صلاحية حذف المعلمين"
      );
      return;
    }

    try {
      const response =
        await deleteTeacher(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف المعلم"
        );
        return;
      }

      toast.success(
        "تم حذف المعلم بنجاح"
      );

      setItems((previousItems) =>
        previousItems.filter(
          (teacher) =>
            teacher.id !== id
        )
      );

      setLocalPagination(
        (previousPagination) => {
          if (!previousPagination) {
            return previousPagination;
          }

          return {
            ...previousPagination,
            totalDocs: Math.max(
              0,
              (previousPagination.totalDocs ||
                1) - 1
            ),
          };
        }
      );

      setActive(false);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء حذف المعلم"
      );
    }
  };

  const openPasswordDialog = (teacher) => {
    if (!canSetPassword) return;

    setPasswordTeacher(teacher);
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordTeacher(null);
  };

  const handleSetPassword = (payload) =>
    adminSetTeacherPassword(
      passwordTeacher?.id,
      payload
    );

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
          color:
            "var(--color-text)",

          "@media (prefers-reduced-motion: reduce)":
            {
              "&, & *": {
                transition:
                  "none !important",
                animation:
                  "none !important",
                transform:
                  "none !important",
              },
            },
        }}
      >
        {/* Page header */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,

            px: {
              xs: 1.7,
              sm: 2,
              md: 2.4,
            },

            py: {
              xs: 1.4,
              md: 1.6,
            },

            border:
              "1px solid rgba(36, 74, 112, 0.08)",
            borderRadius: "18px",

            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",

            boxShadow:
              "0 10px 24px rgba(18,47,77,0.06)",

            transition:
              "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",

            "&:hover": {
              transform:
                "translateY(-2px)",
              borderColor:
                "rgba(211,164,79,0.22)",
              boxShadow:
                "0 16px 34px rgba(18,47,77,0.10)",
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
              >
                <Typography
                  component="h1"
                  sx={{
                    color:
                      "var(--color-navy-deep)",

                    fontSize: {
                      xs: "21px",
                      md: "25px",
                    },

                    fontWeight: 800,
                    lineHeight: 1.3,
                  }}
                >
                  إدارة المعلمين
                </Typography>

                <Chip
                  label={
                    currentPagination
                      ?.totalDocs ??
                    items.length
                  }
                  size="small"
                  sx={{
                    height: 26,

                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",

                    border:
                      "1px solid rgba(211,164,79,0.24)",

                    fontSize: "10px",
                    fontWeight: 800,

                    "& .MuiChip-label":
                      {
                        px: 1,
                      },
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 0.45,

                  color:
                    "var(--color-muted)",
                  fontSize: "11px",
                  lineHeight: 1.6,
                }}
              >
                عرض بيانات المعلمين
                وإدارتها والبحث عنها من
                مكان واحد.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems="center"
              justifyContent="flex-start"
              gap={1.25}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                flexShrink: 0,
              }}
            >
              <Box
                component={CSVLink}
                data={csvData}
                filename="teachers.csv"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  display:
                    "inline-flex",
                  textDecoration: "none",
                }}
              >
                <Button
                  disabled={
                    items.length === 0
                  }
                  variant="outlined"
                  startIcon={
                    <FileDownloadOutlined />
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 112,
                    },
                    minHeight: 42,
                    px: 1.8,

                    borderRadius:
                      "12px",

                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(255, 252, 247, 0.84)",
                    borderColor:
                      "rgba(36, 74, 112, 0.16)",

                    boxShadow: "none",

                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, color 180ms ease, background-color 180ms ease, border-color 180ms ease",

                    fontSize: "12px",
                    fontWeight: 800,
                    whiteSpace:
                      "nowrap",
                    textTransform:
                      "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
                      },

                    "& svg": {
                      fontSize: "18px",
                    },

                    "&:hover": {
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      borderColor:
                        "rgba(211, 164, 79, 0.42)",
                      boxShadow:
                        "0 7px 16px rgba(18, 47, 77, 0.08)",
                      transform:
                        "translateY(-1px)",
                    },

                    "&.Mui-disabled":
                      {
                        color:
                          "rgba(126, 135, 145, 0.65)",
                        backgroundColor:
                          "rgba(240, 237, 230, 0.64)",
                        borderColor:
                          "rgba(36, 74, 112, 0.08)",
                      },
                  }}
                >
                  تصدير
                </Button>
              </Box>

              {permissions.edit && (
                <Button
                  component={Link}
                  to="/users/teachers/assignments"
                  variant="outlined"
                  startIcon={
                    <AssignmentIndRounded />
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 168,
                    },
                    minHeight: 42,
                    px: 1.8,

                    borderRadius:
                      "12px",

                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(255, 252, 247, 0.84)",
                    borderColor:
                      "rgba(36, 74, 112, 0.16)",

                    boxShadow: "none",

                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, color 180ms ease, background-color 180ms ease, border-color 180ms ease",

                    fontSize: "12px",
                    fontWeight: 800,
                    whiteSpace:
                      "nowrap",
                    textTransform:
                      "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
                      },

                    "& svg": {
                      fontSize: "19px",
                    },

                    "&:hover": {
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      borderColor:
                        "rgba(211, 164, 79, 0.42)",
                      boxShadow:
                        "0 7px 16px rgba(18, 47, 77, 0.08)",
                      transform:
                        "translateY(-1px)",
                    },
                  }}
                >
                  إسنادات المعلمين
                </Button>
              )}

              {permissions.add && (
                <Button
                  component={Link}
                  to="add"
                  variant="contained"
                  startIcon={
                    <AddCircleOutlineOutlined />
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 178,
                    },
                    minHeight: 42,
                    px: 2,

                    borderRadius:
                      "12px",

                    color:
                      "var(--color-white)",
                    background:
                      "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

                    boxShadow:
                      "0 9px 20px rgba(18, 47, 77, 0.16)",

                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",

                    fontSize: "12px",
                    fontWeight: 800,
                    whiteSpace:
                      "nowrap",
                    textTransform:
                      "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
                      },

                    "& svg": {
                      fontSize: "19px",
                    },

                    "&:hover": {
                      background:
                        "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                      boxShadow:
                        "0 12px 24px rgba(18, 47, 77, 0.21)",
                      transform:
                        "translateY(-1px)",
                    },
                  }}
                >
                  إضافة معلم جديد
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Statistics */}
        <Box
          sx={{
            mb: 1.25,

            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },

            gap: 1,
          }}
        >
          {STAT_CARDS.map((card) => (
            <Paper
              key={card.key}
              elevation={0}
              sx={{
                p: 1.3,

                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 1.5,

                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",

                backgroundColor:
                  "var(--color-cream)",

                boxShadow:
                  "0 10px 24px rgba(18,47,77,0.055)",

                transition:
                  "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, background-color 200ms ease",

                "& .stats-card-icon":
                  {
                    transition:
                      "transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease",
                  },

                "&:hover": {
                  transform:
                    "translateY(-4px)",
                  borderColor:
                    "rgba(211,164,79,0.25)",
                  backgroundColor:
                    "var(--color-white)",
                  boxShadow:
                    "0 17px 32px rgba(18,47,77,0.11)",
                },

                "&:hover .stats-card-icon":
                  {
                    transform:
                      "scale(1.08) rotate(-4deg)",
                    backgroundColor:
                      "rgba(242,215,146,0.58)",
                    boxShadow:
                      "0 8px 16px rgba(211,164,79,0.16)",
                  },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      "var(--color-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {card.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    color:
                      "var(--color-navy-deep)",
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {stats[card.key]}
                </Typography>
              </Box>

              <Box
                className="stats-card-icon"
                sx={{
                  width: 40,
                  height: 40,

                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,

                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",

                  border:
                    "1px solid rgba(211,164,79,0.22)",
                  borderRadius: "12px",

                  "& svg": {
                    fontSize: 21,
                  },
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Search and filters */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,

            px: {
              xs: 1.5,
              md: 1.75,
            },

            py: {
              xs: 1.4,
              md: 1.55,
            },

            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",

            backgroundColor:
              "var(--color-cream)",

            boxShadow:
              "0 9px 22px rgba(18,47,77,0.05)",

            transition:
              "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",

            "&:hover": {
              transform:
                "translateY(-2px)",
              borderColor:
                "rgba(36,74,112,0.13)",
              boxShadow:
                "0 15px 30px rgba(18,47,77,0.085)",
            },

            "& .MuiFormControl-root": {
              width: "100%",
              margin: 0,
            },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root":
              {
                minHeight: 48,
                height: 48,

                backgroundColor:
                  "var(--color-white)",
                borderRadius: "13px",
                fontSize: "12px",

                transition:
                  "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
              },

            "& .MuiInputBase-root:hover, & .MuiOutlinedInput-root:hover":
              {
                transform:
                  "translateY(-1px)",
                backgroundColor:
                  "rgba(255,255,255,0.98)",
                boxShadow:
                  "0 7px 16px rgba(18,47,77,0.07)",
              },

            "& .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(36,74,112,0.13)",
              },

            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(36,74,112,0.25)",
              },

            "& .MuiOutlinedInput-root.Mui-focused":
              {
                transform:
                  "translateY(-1px)",
                boxShadow:
                  "0 0 0 3px rgba(211,164,79,0.12)",
              },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderWidth: "1px",
                borderColor:
                  "var(--color-gold)",
              },

            "& .MuiInputLabel-root": {
              top: 0,
              right: 14,
              left: "auto",

              px: 0.7,

              color:
                "var(--color-muted)",
              backgroundColor:
                "var(--color-cream)",

              fontSize: "11px",
              fontWeight: 700,
              lineHeight: 1.4,

              transform:
                "translateY(-50%) scale(0.92)",
              transformOrigin:
                "top right",

              zIndex: 2,
              pointerEvents: "none",
            },

            "& .MuiInputLabel-root.MuiInputLabel-shrink":
              {
                transform:
                  "translateY(-50%) scale(0.92)",
              },

            "& .MuiInputLabel-root.Mui-focused":
              {
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-cream)",
              },

            "& .MuiOutlinedInput-notchedOutline legend":
              {
                width: 0,
                maxWidth: 0,
                padding: 0,
              },

            "& .MuiInputBase-input": {
              py: 0.8,
              px: 1.5,
              fontSize: "12px",
            },

            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              minHeight:
                "unset !important",
              py: "0 !important",
            },

            "& .MuiSvgIcon-root": {
              fontSize: "20px",
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            gap={1}
            sx={{
              mb: 1.25,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "15px",
                  fontWeight: 800,
                  lineHeight: 1.35,
                }}
              >
                البحث والتصفية
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color:
                    "var(--color-muted)",
                  fontSize: "9.5px",
                  lineHeight: 1.5,
                }}
              >
                استخدم الفلاتر للوصول
                إلى المعلمين بسرعة.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={
                activeFiltersCount === 0
              }
              onClick={resetFilters}
              variant="text"
              startIcon={
                <RestartAltRounded />
              }
              sx={{
                minHeight: 36,
                px: 1.25,

                alignSelf: {
                  xs: "flex-start",
                  sm: "center",
                },

                color:
                  "var(--color-navy)",
                backgroundColor:
                  "rgba(36,74,112,0.055)",

                border:
                  "1px solid rgba(36,74,112,0.075)",
                borderRadius: "11px",

                fontSize: "10.5px",
                fontWeight: 800,
                whiteSpace: "nowrap",
                textTransform: "none",

                transition:
                  "transform 180ms ease, color 180ms ease, background-color 180ms ease, border-color 180ms ease",

                "& .MuiButton-startIcon":
                  {
                    marginLeft: "6px",
                    marginRight: 0,
                  },

                "&:hover": {
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  borderColor:
                    "rgba(211,164,79,0.24)",
                  transform:
                    "translateY(-1px)",
                },

                "&.Mui-disabled": {
                  color:
                    "rgba(126,135,145,0.45)",
                  backgroundColor:
                    "rgba(36,74,112,0.025)",
                  borderColor:
                    "rgba(36,74,112,0.045)",
                },
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Grid
            container
            spacing={{
              xs: 1.5,
              md: 1.35,
            }}
            alignItems="center"
            sx={{
              pt: 0.8,
            }}
          >
            <Grid
              item
              xs={12}
              sm={6}
            >
              <SearchFilter
                value={search}
                onChange={setSearch}
                placeholder="ابحث باسم المعلم..."
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >
              <SelectFilter
                value={status}
                onChange={setStatus}
                label="حالة المعلم"
                icon={SortRounded}
                allLabel="جميع الحالات"
                options={Status.map(
                  (item) => ({
                    value:
                      item.id.toString(),
                    label:
                      item.label,
                  })
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Teachers table */}
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",

            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",

            backgroundColor:
              "var(--color-cream)",

            boxShadow:
              "0 14px 32px rgba(18,47,77,0.065)",

            transition:
              "box-shadow 220ms ease, border-color 220ms ease",

            "&:hover": {
              borderColor:
                "rgba(36,74,112,0.13)",
              boxShadow:
                "0 18px 38px rgba(18,47,77,0.09)",
            },
          }}
        >
          <Box
            sx={{
              px: {
                xs: 1.5,
                md: 1.9,
              },
              py: 1.25,

              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Typography
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              قائمة المعلمين
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              يمكنك عرض الملف أو تعديل
              البيانات أو حذف المعلم حسب
              صلاحياتك.
            </Typography>
          </Box>

          <Box
            sx={{
              p: {
                xs: 0.7,
                md: 1,
              },
            }}
          >
            <Table
              headers={TABLE_HEADERS}
              data={items}
              loading={loading}
              edit={permissions.edit}
              profile={permissions.read}
              body={TABLE_BODY}
              deleteFn={
                permissions.delete
                  ? handleDelete
                  : undefined
              }
              schedule={
                lecturePermissions.read
              }
              setPasswordFn={
                canSetPassword
                  ? openPasswordDialog
                  : undefined
              }
            />

            {currentPagination && (
              <PaginationControls
                pagination={
                  currentPagination
                }
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                label="عدد المعلمين"
              />
            )}
          </Box>
        </Paper>

        <AdminSetPasswordDialog
          open={passwordDialogOpen}
          name={passwordTeacher?.name || ""}
          subjectId={passwordTeacher?.id || ""}
          onClose={closePasswordDialog}
          onSubmit={handleSetPassword}
        />
      </Box>
    </Container>
  );
};

export default List;
