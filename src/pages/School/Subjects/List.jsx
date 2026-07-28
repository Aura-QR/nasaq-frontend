import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineOutlined,
  BookmarkBorderRounded,
  FileDownloadOutlined,
  MenuBookRounded,
  RestartAltRounded,
  TagRounded,
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
import SearchFilter from "@/components/Filters/SearchFilter";
import PaginationControls from "@/components/Pagination";

import { deleteSubject } from "@/APIs/school/subjects";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

const TABLE_HEADERS = [
  "اسم المادة",
  "كود المادة",
];

const TABLE_BODY = [
  "subjectName",
  "subjectCode",
];

const mapSubjects = (data = []) =>
  data.map((subject) => ({
    id: subject?._id,
    subjectName:
      subject?.subjectName || "—",
    subjectCode:
      subject?.subjectCode || "بدون كود",
  }));

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي المواد",
    icon: <MenuBookRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <BookmarkBorderRounded />,
  },
  {
    key: "coded",
    label: "مواد لها كود",
    icon: <TagRounded />,
  },
  {
    key: "withoutCode",
    label: "مواد بدون كود",
    icon: <TagRounded />,
  },
];

const List = () => {
  const [items, setItems] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [limit, setLimit] =
    useState(10);

  const [page, setPage] =
    useState(1);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedSearch =
    useDebounce(search, 700);

  /*
   * حقل بحث واحد للاسم أو الكود.
   *
   * لأن الـAPI الحالي يستخدم فلترين منفصلين
   * subjectName وsubjectCode، نحدد الفلتر
   * تلقائيًا من شكل القيمة المكتوبة:
   *
   * - الأكواد غالبًا تحتوي أرقامًا أو شرطة،
   *   أو تكون أحرفًا إنجليزية كبيرة.
   * - باقي القيم يتم البحث بها كاسم مادة.
   */
  const searchFilters = useMemo(() => {
    const value =
      debouncedSearch.trim();

    if (!value) {
      return {};
    }

    const looksLikeCode =
      /\d/.test(value) ||
      /[-_/]/.test(value) ||
      /^[A-Z]{2,}[A-Z0-9\s-]*$/.test(
        value
      );

    return looksLikeCode
      ? {
          subjectCode: value,
        }
      : {
          subjectName: value,
        };
  }, [debouncedSearch]);

  const filters = useMemo(
    () => ({
      page,
      limit,
      ...searchFilters,
    }),
    [
      page,
      limit,
      searchFilters,
    ]
  );

  const {
    subjects,
    loading,
    pagination,
  } = useSubjects(filters);

  const permissions =
    usePermissions("subjects");

  useEffect(() => {
    setItems(mapSubjects(subjects));
  }, [subjects]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(
        pagination
      );
    }
  }, [pagination]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    debouncedSearch,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount =
    search.trim() ? 1 : 0;

  const stats = useMemo(() => {
    const coded = items.filter(
      (item) =>
        item.subjectCode &&
        item.subjectCode !==
          "بدون كود"
    ).length;

    return {
      total:
        currentPagination
          ?.totalDocs ??
        items.length,
      visible: items.length,
      coded,
      withoutCode:
        items.length - coded,
    };
  }, [
    items,
    currentPagination,
  ]);

  const csvData = useMemo(
    () =>
      items.map((subject) => ({
        "اسم المادة":
          subject.subjectName,
        "كود المادة":
          subject.subjectCode ===
          "بدون كود"
            ? ""
            : subject.subjectCode,
      })),
    [items]
  );

  const resetFilters = () => {
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    try {
      const response =
        await deleteSubject(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف المادة"
        );
        return;
      }

      toast.success(
        "تم حذف المادة بنجاح"
      );

      setItems(
        (previousItems) =>
          previousItems.filter(
            (item) =>
              item.id !== id
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
          "حدث خطأ أثناء حذف المادة"
      );
    }
  };

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
                  إدارة المواد الدراسية
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
                أنشئ المواد وعدّل أكوادها
                لاستخدامها مع المعلمين
                والفصول والجداول.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems="center"
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
                filename="subjects.csv"
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

                    "&:hover": {
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      borderColor:
                        "rgba(211, 164, 79, 0.42)",
                      transform:
                        "translateY(-1px)",
                    },
                  }}
                >
                  تصدير
                </Button>
              </Box>

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
                      sm: 180,
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
                  إضافة مادة جديدة
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

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

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,

            px: {
              xs: 1.25,
              md: 1.5,
            },

            py: {
              xs: 1.1,
              md: 1.15,
            },

            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",

            backgroundColor:
              "var(--color-cream)",

            boxShadow:
              "0 9px 22px rgba(18,47,77,0.05)",

            "& .MuiFormControl-root": {
              width: "100%",
              margin: 0,
            },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root":
              {
                minHeight: 44,
                height: 44,

                backgroundColor:
                  "var(--color-white)",
                borderRadius: "12px",
                fontSize: "12px",
              },

            "& .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(36,74,112,0.13)",
              },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderWidth: "1px",
                borderColor:
                  "var(--color-gold)",
              },

            "& .MuiInputBase-input": {
              py: 0.7,
              px: 1.4,
              fontSize: "12px",
            },
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
            gap={{
              xs: 1,
              md: 1.4,
            }}
          >
            <Box
              sx={{
                minWidth: {
                  md: 205,
                },
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "14px",
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                البحث في المواد
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color:
                    "var(--color-muted)",
                  fontSize: "9px",
                  lineHeight: 1.45,
                }}
              >
                ابحث بالاسم أو الكود.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: {
                  md: 590,
                  xl: 670,
                },
                flex: {
                  md: 1,
                },
              }}
            >
              <SearchFilter
                value={search}
                onChange={setSearch}
                placeholder="ابحث باسم المادة أو كود المادة..."
              />
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
                minWidth: 108,
                minHeight: 40,
                px: 1.25,
                flexShrink: 0,

                alignSelf: {
                  xs: "flex-start",
                  md: "center",
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
                textTransform: "none",

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
                },
              }}
            >
              مسح البحث
            </Button>
          </Stack>
        </Paper>

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
              قائمة المواد
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              عدّل بيانات المادة أو احذفها
              حسب الصلاحيات المتاحة.
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
              body={TABLE_BODY}
              deleteFn={
                permissions.delete
                  ? handleDelete
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
                label="عدد المواد"
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
