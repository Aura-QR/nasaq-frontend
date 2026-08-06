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
  AssessmentRounded,
  FileDownloadOutlined,
  GradeRounded,
  MenuBookRounded,
  RestartAltRounded,
  SchoolRounded,
  SearchOffRounded,
  VisibilityRounded,
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
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";

import Years from "@/utils/constants/Years";
import { useGrdaesCriterion } from "@/utils/hooks/apis/useGradesCriterion";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import usePermissions from "@/utils/hooks/usePermissions";
import { deleteGradesCriteria } from "@/APIs/school/gradesCriteria";

import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";

const TABLE_HEADERS = [
  "المادة",
  "السنة الدراسية",
  "درجة النجاح",
  "الاختبار النهائي",
  "المهام الأدائية",
  "الواجبات",
  "الاختبارات القصيرة",
  "أعمال السنة",
];

const TABLE_BODY = [
  "subject",
  "academicYear",
  "passingGrade",
  "final",
  "projects",
  "assignments",
  "quizzes",
  "activities",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي التوزيعات",
    icon: <AssessmentRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <VisibilityRounded />,
  },
  {
    key: "subjects",
    label: "المواد في الصفحة",
    icon: <MenuBookRounded />,
  },
  {
    key: "years",
    label: "السنوات الدراسية",
    icon: <SchoolRounded />,
  },
];

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const formatGrade = (value) =>
  `${Number(value || 0)} درجة`;

const mapCriteria = (data = []) =>
  getArray(data).map((item) => {
    const subjectName =
      item?.subject?.subjectName ||
      item?.subjectName ||
      "—";

    const subjectCode =
      item?.subject?.subjectCode ||
      item?.subjectCode ||
      "";

    return {
      id: item?._id || item?.id,
      subjectId:
        item?.subject?._id ||
        item?.subject?.id ||
        item?.subjectId ||
        "",
      subject: subjectCode
        ? `${subjectName} - ${subjectCode}`
        : subjectName,
      academicYear:
        item?.academicYear || "—",
      passingGrade: formatGrade(
        item?.passingGrade ?? 50
      ),
      passingGradeValue: Number(
        item?.passingGrade ?? 50
      ),
      final: formatGrade(item?.final),
      projects: formatGrade(item?.projects),
      assignments: formatGrade(
        item?.assignments
      ),
      quizzes: formatGrade(item?.quizzes),
      activities: formatGrade(
        item?.activities
      ),
    };
  });

const List = () => {
  const [items, setItems] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [subject, setSubject] =
    useState("");

  const [
    academicYear,
    setAcademicYear,
  ] = useState("");

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit,
      academicYear:
        academicYear || undefined,
      subjectId:
        subject || undefined,
    }),
    [
      page,
      limit,
      subject,
      academicYear,
    ]
  );

  const {
    gradesCriterion,
    loading,
    pagination,
  } = useGrdaesCriterion(
    filters
  );

  const {
    subjects = [],
    loading: loadingSubjects,
  } = useSubjects({
    page: 1,
    limit: 1000,
  });

  const permissions =
    usePermissions(
      "gradesCriteria"
    );

  useEffect(() => {
    setItems(
      mapCriteria(
        gradesCriterion
      )
    );
  }, [gradesCriterion]);

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
    academicYear,
    subject,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    subject,
    academicYear,
  ].filter(Boolean).length;

  const stats = useMemo(
    () => ({
      total:
        currentPagination
          ?.totalDocs ??
        items.length,
      visible: items.length,
      subjects: new Set(
        items
          .map(
            (item) =>
              item.subjectId
          )
          .filter(Boolean)
      ).size,
      years: new Set(
        items
          .map(
            (item) =>
              item.academicYear
          )
          .filter(
            (value) =>
              value &&
              value !== "—"
          )
      ).size,
    }),
    [
      items,
      currentPagination,
    ]
  );

  const mappedSubjects =
    getArray(subjects).map(
      (item) => {
        const id =
          item?._id ||
          item?.id;

        const name =
          item?.subjectName ||
          item?.name ||
          "—";

        const code =
          item?.subjectCode ||
          item?.code ||
          "";

        return {
          value: id,
          label: code
            ? `${name} - ${code}`
            : name,
        };
      }
    );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        المادة: item.subject,
        "السنة الدراسية":
          item.academicYear,
        "درجة النجاح":
          item.passingGradeValue,
        "الاختبار النهائي":
          item.final,
        "المهام الأدائية":
          item.projects,
        الواجبات:
          item.assignments,
        "الاختبارات القصيرة":
          item.quizzes,
        "أعمال السنة":
          item.activities,
      })),
    [items]
  );

  const resetFilters = () => {
    setSubject("");
    setAcademicYear("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    try {
      const response =
        await deleteGradesCriteria(
          id
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف توزيع الدرجات"
        );
        return;
      }

      toast.success(
        "تم حذف توزيع الدرجات بنجاح"
      );

      setItems(
        (previousItems) =>
          previousItems.filter(
            (item) =>
              item.id !== id
          )
      );

      setLocalPagination(
        (previous) =>
          previous
            ? {
                ...previous,
                totalDocs:
                  Math.max(
                    0,
                    Number(
                      previous.totalDocs ||
                        1
                    ) - 1
                  ),
              }
            : previous
      );

      setActive(false);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء حذف توزيع الدرجات"
      );
    }
  };

  const showEmptyState =
    !loading &&
    items.length === 0;

  const hasFilters =
    activeFiltersCount > 0;

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 4,
          overflowX: "hidden",
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: {
              xs: 1.5,
              sm: 2,
              md: 2.4,
            },
            py: {
              xs: 1.4,
              md: 1.6,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.06)",
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
            gap={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
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
                  توزيع الدرجات
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
                حدّد درجات الاختبارات
                والمهام والواجبات لكل
                مادة وسنة دراسية.
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
                filename="grades-criteria.csv"
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
                    borderRadius: "12px",
                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(255,252,247,0.84)",
                    borderColor:
                      "rgba(36,74,112,0.16)",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
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
                      sm: 190,
                    },
                    minHeight: 42,
                    borderRadius: "12px",
                    color:
                      "var(--color-white)",
                    background:
                      "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                    boxShadow:
                      "0 9px 20px rgba(18,47,77,0.16)",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
                      },
                  }}
                >
                  إضافة توزيع درجات
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
              xs:
                "repeat(2, minmax(0, 1fr))",
              lg:
                "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {STAT_CARDS.map(
            (card) => (
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
                    "transform 200ms ease, box-shadow 200ms ease",

                  "&:hover": {
                    transform:
                      "translateY(-3px)",
                    boxShadow:
                      "0 17px 32px rgba(18,47,77,0.10)",
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
                    {
                      stats[
                        card.key
                      ]
                    }
                  </Typography>
                </Box>

                <Box
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
            )
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: {
              xs: 1.5,
              md: 1.9,
            },
            py: {
              xs: 1.45,
              md: 1.65,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 9px 22px rgba(18,47,77,0.05)",

            "& .MuiFormControl-root":
              {
                width: "100%",
                margin: 0,
              },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root":
              {
                minHeight: 50,
                height: 50,
                backgroundColor:
                  "var(--color-white)",
                borderRadius: "12px",
              },

            "& .MuiInputLabel-root":
              {
                px: 0.65,
                backgroundColor:
                  "var(--color-cream)",
                fontSize: "10.5px",
                fontWeight: 700,
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
              sm: "flex-start",
            }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "15px",
                  fontWeight: 800,
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
                }}
              >
                استخدم المادة والسنة
                الدراسية للوصول إلى
                التوزيع المطلوب.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={
                activeFiltersCount ===
                0
              }
              onClick={resetFilters}
              variant="text"
              startIcon={
                <RestartAltRounded />
              }
              sx={{
                minHeight: 36,
                px: 1.2,
                color:
                  "var(--color-navy)",
                backgroundColor:
                  "rgba(36,74,112,0.055)",
                border:
                  "1px solid rgba(36,74,112,0.075)",
                borderRadius: "11px",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "5px",
                    marginRight: 0,
                  },
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md:
                  "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            <SelectFilter
              value={subject}
              onChange={setSubject}
              label="المادة"
              icon={SubjectIcon}
              allLabel="جميع المواد"
              disabled={
                loadingSubjects
              }
              options={
                mappedSubjects
              }
            />

            <SelectFilter
              value={academicYear}
              onChange={
                setAcademicYear
              }
              label="السنة الدراسية"
              icon={SchoolIcon}
              allLabel="جميع السنين"
              options={Years.map(
                (year) => ({
                  value: year,
                  label: year,
                })
              )}
            />
          </Box>
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
              قائمة توزيعات الدرجات
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح التفاصيل أو عدّل
              التوزيع حسب صلاحياتك.
            </Typography>
          </Box>

          {showEmptyState ? (
            <Box
              sx={{
                minHeight: {
                  xs: 250,
                  md: 290,
                },
                px: 2,
                py: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Stack
                alignItems="center"
                spacing={1}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    border:
                      "1px solid rgba(211,164,79,0.22)",
                    borderRadius: "18px",

                    "& svg": {
                      fontSize: 30,
                    },
                  }}
                >
                  {hasFilters ? (
                    <SearchOffRounded />
                  ) : (
                    <GradeRounded />
                  )}
                </Box>

                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  {hasFilters
                    ? "لا توجد توزيعات مطابقة للفلاتر"
                    : "لا توجد توزيعات درجات حتى الآن"}
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 390,
                    color:
                      "var(--color-muted)",
                    fontSize: "10px",
                    lineHeight: 1.7,
                  }}
                >
                  {hasFilters
                    ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                    : "أضف أول توزيع درجات لإحدى المواد."}
                </Typography>

                {hasFilters ? (
                  <Button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    variant="outlined"
                    startIcon={
                      <RestartAltRounded />
                    }
                  >
                    مسح الفلاتر
                  </Button>
                ) : (
                  permissions.add && (
                    <Button
                      component={Link}
                      to="add"
                      variant="contained"
                      startIcon={
                        <AddCircleOutlineOutlined />
                      }
                      sx={{
                        mt: 0.5,
                        minHeight: 42,
                        px: 2,
                        borderRadius:
                          "12px",
                        color:
                          "var(--color-white)",
                        background:
                          "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                        fontSize:
                          "11px",
                        fontWeight: 800,
                        textTransform:
                          "none",
                      }}
                    >
                      إضافة أول توزيع
                    </Button>
                  )
                )}
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                p: {
                  xs: 0.7,
                  md: 1,
                },
              }}
            >
              <Table
                headers={
                  TABLE_HEADERS
                }
                data={items}
                loading={loading}
                edit={
                  permissions.edit
                }
                profile
                body={TABLE_BODY}
                deleteFn={
                  permissions.delete
                    ? handleDelete
                    : undefined
                }
              />

              {currentPagination &&
                items.length > 0 && (
                  <PaginationControls
                    pagination={
                      currentPagination
                    }
                    page={page}
                    onPageChange={
                      setPage
                    }
                    limit={limit}
                    onLimitChange={
                      setLimit
                    }
                    label="عدد توزيعات الدرجات"
                  />
                )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
