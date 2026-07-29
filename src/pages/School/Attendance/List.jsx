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
  CalendarMonthRounded,
  FileDownloadOutlined,
  GroupsRounded,
  PersonOffRounded,
  RestartAltRounded,
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
import ClassFilter from "@/components/Filters/ClassFilter";
import DateRangeFilter from "@/components/Filters/DateRangeFilter";
import ListCard from "@/components/Cards/ListCard";
import PaginationControls from "@/components/Pagination";

import Add from "./Add";

import useDebounce from "@/utils/hooks/useDebounce";
import { useAttendances } from "@/utils/hooks/apis/useAttendances";
import usePermissions from "@/utils/hooks/usePermissions";

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getStudentName = (item) =>
  item?.student?.name ||
  item?.studentName ||
  item?.name ||
  "—";

const getClassId = (item) =>
  item?.class?._id ||
  item?.class?.id ||
  item?.classId ||
  "";

const getStudentId = (item) =>
  item?.student?._id ||
  item?.student?.id ||
  item?.studentId ||
  "";

const getClassLabel = (item) => {
  const classData =
    item?.class || {};

  const parts = [
    classData?.academicYear,
    classData?.roomNumber,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" - ")
    : "—";
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "ar-EG"
  );
};

const List = () => {
  const [items, setItems] =
    useState([]);

  const [
    studentName,
    setStudentName,
  ] = useState("");

  const [classId, setClassId] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedStudentName =
    useDebounce(
      studentName,
      700
    );

  const filters = useMemo(
    () => ({
      page,
      limit,
      name:
        debouncedStudentName ||
        undefined,
      classId:
        classId || undefined,
      startDate:
        startDate || undefined,
      endDate:
        endDate || undefined,
    }),
    [
      page,
      limit,
      debouncedStudentName,
      classId,
      startDate,
      endDate,
    ]
  );

  const {
    attendances,
    loading,
    pagination,
  } = useAttendances(filters);

  const permissions =
    usePermissions("attendance");

  useEffect(() => {
    setItems(
      getArray(attendances)
    );
  }, [attendances]);

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
    debouncedStudentName,
    classId,
    startDate,
    endDate,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    studentName,
    classId,
    startDate,
    endDate,
  ].filter(Boolean).length;

  const stats = useMemo(
    () => ({
      total:
        currentPagination
          ?.totalDocs ??
        items.length,

      visible:
        items.length,

      students: new Set(
        items
          .map(getStudentId)
          .filter(Boolean)
      ).size,

      classes: new Set(
        items
          .map(getClassId)
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
        الطالب:
          getStudentName(item),
        الفصل:
          getClassLabel(item),
        "تاريخ الغياب":
          formatDate(item?.date),
      })),
    [items]
  );

  const resetFilters = () => {
    setStudentName("");
    setClassId("");
    setStartDate("");
    setEndDate("");
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
  xs: 1.25,
  md: 1.35,
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
                  إدارة الغياب
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
                سجّل غياب الطلاب
                وابحث حسب الطالب
                والفصل والفترة الزمنية.
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
                filename="attendance.csv"
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
                "إجمالي الغيابات",
              value: stats.total,
              icon:
                <PersonOffRounded />,
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
                "الطلاب في الصفحة",
              value:
                stats.students,
              icon:
                <PersonOffRounded />,
            },
            {
              label:
                "الفصول في الصفحة",
              value:
                stats.classes,
              icon:
                <GroupsRounded />,
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
         py: {
  xs: 1.25,
  md: 1.35,
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
         sx={{ mb: 1.2 }}
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
                ابحث باسم الطالب أو
                حدّد الفصل والفترة
                الزمنية.
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
  sm: "repeat(2, minmax(0,1fr))",
  lg: "1.15fr 1fr 1.65fr",
},
              gap: 1.5,
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
            }}
          >
            <SearchFilter
              value={studentName}
              onChange={
                setStudentName
              }
              placeholder="ابحث باسم الطالب..."
            />

            <ClassFilter
              classId={classId}
              setClassId={
                setClassId
              }
            />

            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={
                setStartDate
              }
              onEndDateChange={
                setEndDate
              }
              startLabel="من تاريخ"
              endLabel="إلى تاريخ"
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
              سجل الغياب
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              راجع غياب الطلاب وعدّل
              السجلات حسب صلاحياتك.
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
                    <CalendarMonthRounded />
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
                    ? "لا توجد غيابات مطابقة للفلاتر"
                    : "لا توجد غيابات حتى الآن"}
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
                    : "أضف أول سجل غياب للطلاب."}
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
                  جاري تحميل الغيابات...
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
                            item?._id ||
                            item?.id ||
                            index
                          }
                        >
                          <ListCard
                            item={item}
                            setItems={
                              setItems
                            }
                            type="attendance"
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
                    label="عدد الغيابات"
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
