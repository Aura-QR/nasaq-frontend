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
  AddCircleOutlineRounded,
  FileDownloadOutlined,
  LibraryBooksRounded,
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

import Container from "@/components/Container/Container";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import ListCard from "@/components/Cards/ListCard";

import Add from "./Add";

import Years from "@/utils/constants/Years";
import useDebounce from "@/utils/hooks/useDebounce";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useLibraries } from "@/utils/hooks/apis/useLibraries";
import usePermissions from "@/utils/hooks/usePermissions";

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getItemId = (item) =>
  item?._id || item?.id || "";

const getSubjectId = (item) =>
  item?.subjectId ||
  item?.subject?._id ||
  item?.subject?.id ||
  "";

const getSubjectName = (item) => {
  const subject =
    item?.subject || {};

  const name =
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    "";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    item?.subjectCode ||
    "";

  if (!name) {
    return "غير محددة";
  }

  return code
    ? `${name} - ${code}`
    : name;
};

const getResponseData = (response) =>
  response?.data?.data ||
  response?.data ||
  response;

const List = () => {
  const [items, setItems] =
    useState([]);

  const [itemName, setItemName] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [
    academicYear,
    setAcademicYear,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedItemName =
    useDebounce(
      itemName,
      700
    );

  const {
    subjects = [],
    loading: loadingSubjects,
  } = useSubjects({
    page: 1,
    limit: 1000,
  });

  const mappedSubjects =
    getArray(subjects).map(
      (item) => ({
        id:
          item?._id ||
          item?.id,
        label:
          item?.subjectCode
            ? `${item.subjectName} - ${item.subjectCode}`
            : item?.subjectName ||
              item?.name ||
              "مادة",
      })
    );

  const filters = useMemo(
    () => ({
      page,
      limit,
      title:
        debouncedItemName ||
        undefined,
      subjectId:
        subject || undefined,
      academicYear:
        academicYear ||
        undefined,
    }),
    [
      page,
      limit,
      debouncedItemName,
      subject,
      academicYear,
    ]
  );

  const {
    libraries,
    loading,
    pagination,
  } = useLibraries(filters);

  const permissions =
    usePermissions("library");

  useEffect(() => {
    setItems(
      getArray(libraries)
    );
  }, [libraries]);

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
    debouncedItemName,
    subject,
    academicYear,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    itemName,
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
          .map(getSubjectId)
          .filter(Boolean)
      ).size,

      years: new Set(
        items
          .map(
            (item) =>
              item?.academicYear
          )
          .filter(Boolean)
      ).size,
    }),
    [
      items,
      currentPagination,
    ]
  );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        العنوان:
          item?.title || "—",
        الرابط:
          item?.link || "—",
        المادة:
          getSubjectName(item),
        "السنة الدراسية":
          item?.academicYear ||
          "غير محددة",
      })),
    [items]
  );

  const resetFilters = () => {
    setItemName("");
    setSubject("");
    setAcademicYear("");
    setPage(1);
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
                  إدارة المكتبة
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
                أضف الروابط والمصادر التعليمية ونظّمها حسب المادة والسنة الدراسية.
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
                filename="library.csv"
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
                <Add
                  setItems={setItems}
                  setLocalPagination={
                    setLocalPagination
                  }
                />
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
          {[
            {
              label:
                "إجمالي العناصر",
              value: stats.total,
              icon:
                <LibraryBooksRounded />,
            },
            {
              label:
                "الظاهر في الصفحة",
              value:
                stats.visible,
              icon:
                <VisibilityRounded />,
            },
            {
              label:
                "المواد في الصفحة",
              value:
                stats.subjects,
              icon:
                <MenuBookRounded />,
            },
            {
              label:
                "السنوات في الصفحة",
              value:
                stats.years,
              icon:
                <SchoolRounded />,
            },
          ].map((card) => (
            <Paper
              key={card.label}
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
                  {card.value}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
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
              xs: 1.5,
              md: 1.9,
            },
            py: 1.45,
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
                minWidth: 0,
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
            sx={{ mb: 1.35 }}
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
                ابحث بعنوان العنصر أو حدّد المادة والسنة الدراسية.
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
                sm:
                  "repeat(2, minmax(0, 1fr))",
                lg:
                  "1.35fr 1fr 1fr",
              },
              gap: 1.5,
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
            }}
          >
            <SearchFilter
              value={itemName}
              onChange={
                setItemName
              }
              placeholder="ابحث بعنوان العنصر..."
            />

            <SelectFilter
              value={subject}
              onChange={setSubject}
              label="المادة"
              icon={MenuBookRounded}
              allLabel="جميع المواد"
              disabled={
                loadingSubjects
              }
              options={mappedSubjects.map(
                (item) => ({
                  value: item.id,
                  label: item.label,
                })
              )}
            />

            <SelectFilter
              value={academicYear}
              onChange={
                setAcademicYear
              }
              label="السنة الدراسية"
              icon={SchoolRounded}
              allLabel="جميع السنوات"
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
              عناصر المكتبة
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح الروابط وعدّل العناصر حسب صلاحياتك.
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
                    <LibraryBooksRounded />
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
                    ? "لا توجد عناصر مطابقة للفلاتر"
                    : "لا توجد عناصر في المكتبة حتى الآن"}
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
                    : "أضف أول رابط أو مصدر تعليمي إلى المكتبة."}
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
                    sx={{
                      mt: 0.5,
                      minHeight: 42,
                      px: 2,
                      borderRadius:
                        "12px",
                      color:
                        "var(--color-navy)",
                      borderColor:
                        "rgba(36,74,112,0.18)",
                      fontWeight: 800,
                      textTransform:
                        "none",
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : (
                  permissions.add && (
                    <Add
                      setItems={setItems}
                      setLocalPagination={
                        setLocalPagination
                      }
                      compact
                    />
                  )
                )}
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                p: {
                  xs: 1,
                  md: 1.25,
                },
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 260,
                    display: "grid",
                    placeItems:
                      "center",
                    color:
                      "var(--color-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  جاري تحميل عناصر المكتبة...
                </Box>
              ) : (
                <Grid
                  container
                  spacing={1.25}
                >
                  {items.map(
                    (item, index) =>
                      permissions.read && (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          lg={4}
                          xl={3}
                          key={
                            getItemId(
                              item
                            ) ||
                            index
                          }
                        >
                          <ListCard
                            item={item}
                            setItems={
                              setItems
                            }
                            type="library"
                            setLocalPagination={
                              setLocalPagination
                            }
                          />
                        </Grid>
                      )
                  )}
                </Grid>
              )}

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
                    label="عدد عناصر المكتبة"
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
