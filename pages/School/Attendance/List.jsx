import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
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
import PaginationControls from "@/components/Pagination";

import Add from "./Add";
import Edit from "./Edit";
import Delete from "./Delete";

import useDebounce from "@/utils/hooks/useDebounce";
import { useAttendances } from "@/utils/hooks/apis/useAttendances";
import usePermissions from "@/utils/hooks/usePermissions";
import { fetchClasses } from "@/APIs/school/classes";
import { fetchAcademicYears } from "@/APIs/school/academicYears";

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getEmbeddedObject = (value) =>
  value && typeof value === "object"
    ? value
    : null;

const getStudentData = (item) =>
  item?.student ||
  getEmbeddedObject(item?.studentId) ||
  {};

const getClassData = (item, classLookup = {}) => {
  const embedded =
    item?.class ||
    getEmbeddedObject(item?.classId);

  const classId =
    embedded?._id ||
    embedded?.id ||
    (typeof item?.classId === "string"
      ? item.classId
      : "");

  return (
    (classId && classLookup[classId]) ||
    embedded ||
    {}
  );
};

const getStudentName = (item) => {
  const student = getStudentData(item);

  return (
    student?.name ||
    [
      student?.firstName,
      student?.fatherName,
      student?.familyName,
    ]
      .filter(Boolean)
      .join(" ") ||
    item?.studentName ||
    item?.name ||
    "—"
  );
};

const getClassId = (item, classLookup = {}) => {
  const classData = getClassData(item, classLookup);

  return (
    classData?._id ||
    classData?.id ||
    (typeof item?.classId === "string"
      ? item.classId
      : "")
  );
};

const getStudentId = (item) => {
  const student = getStudentData(item);

  return (
    student?._id ||
    student?.id ||
    (typeof item?.studentId === "string"
      ? item.studentId
      : "")
  );
};

const getStudentMeta = (item) => {
  const student = getStudentData(item);
  const studentId = getStudentId(item);

  return (
    student?.schoolEmail ||
    student?.email ||
    student?.phoneNumber ||
    (studentId
      ? `رقم الطالب: ${String(studentId).slice(-6)}`
      : "—")
  );
};

const getAcademicYearLabel = (
  item,
  classLookup = {},
  academicYearLookup = {}
) => {
  const classData = getClassData(
    item,
    classLookup
  );

  const value =
    item?.academicYear ||
    item?.academicYearId ||
    classData?.academicYear ||
    classData?.academicYearId;

  if (typeof value === "string") {
    return (
      academicYearLookup[value]?.name ||
      academicYearLookup[value]?.label ||
      value ||
      "—"
    );
  }

  return (
    value?.name ||
    value?.label ||
    "—"
  );
};

const getClassLabel = (item, classLookup = {}) => {
  const classData = getClassData(item, classLookup);
  const gradeLevel =
    classData?.gradeLevelId ||
    classData?.gradeLevel;

  const className =
    classData?.name ||
    item?.className ||
    "";

  const roomNumber =
    classData?.roomNumber ||
    "";

  const gradeName =
    typeof gradeLevel === "object"
      ? gradeLevel?.name
      : "";

  const parts = [
    className || gradeName,
    roomNumber,
  ].filter(Boolean);

  return parts.length > 0
    ? [...new Set(parts)].join(" - ")
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

const AttendanceTable = ({
  items,
  loading,
  permissions,
  page,
  limit,
  setItems,
  setLocalPagination,
  classLookup,
  academicYearLookup,
}) => (
  <Box
    sx={{
      width: "100%",
      overflowX: "auto",
    }}
  >
    <Box
      component="table"
      sx={{
        width: "100%",
        minWidth: 900,
        borderCollapse: "collapse",

        "& th": {
          px: 1.55,
          py: 1.35,
          color: "#7e8791",
          backgroundColor:
            "rgba(36,74,112,0.035)",
          borderBottom:
            "1px solid #ded8cd",
          fontSize: "8.7px",
          fontWeight: 800,
          textAlign: "right",
          whiteSpace: "nowrap",
        },

        "& td": {
          px: 1.55,
          py: 1.25,
          color: "#193754",
          borderBottom:
            "1px solid rgba(222,216,205,0.7)",
          fontSize: "9.5px",
          verticalAlign: "middle",
        },

        "& tbody tr": {
          transition:
            "background-color 0.2s ease",
        },

        "& tbody tr:hover": {
          backgroundColor:
            "rgba(36,74,112,0.022)",
        },

        "& tbody tr:last-of-type td": {
          borderBottom: 0,
        },
      }}
    >
      <Box component="thead">
        <Box component="tr">
          <Box
            component="th"
            sx={{ width: 58 }}
          >
            #
          </Box>

          <Box component="th">
            الطالب
          </Box>

          <Box component="th">
            السنة الدراسية
          </Box>

          <Box component="th">
            الفصل
          </Box>

          <Box component="th">
            تاريخ الغياب
          </Box>

          <Box
            component="th"
            sx={{ width: 110 }}
          >
            الحالة
          </Box>

          <Box
            component="th"
            sx={{
              width: 145,
              textAlign:
                "center !important",
            }}
          >
            الإجراءات
          </Box>
        </Box>
      </Box>

      <Box component="tbody">
        {loading
          ? Array.from({
              length: 5,
            }).map(
              (_, rowIndex) => (
                <Box
                  component="tr"
                  key={rowIndex}
                >
                  {Array.from({
                    length: 7,
                  }).map(
                    (
                      __,
                      cellIndex
                    ) => (
                      <Box
                        component="td"
                        key={cellIndex}
                      >
                        <Skeleton />
                      </Box>
                    )
                  )}
                </Box>
              )
            )
          : items.map(
              (item, index) => {
                const recordId =
                  item?._id ||
                  item?.id ||
                  "";

                const studentName =
                  getStudentName(item);

                const initial =
                  studentName !== "—"
                    ? studentName
                        .trim()
                        .charAt(0)
                    : "ط";

                return (
                  <Box
                    component="tr"
                    key={
                      recordId ||
                      index
                    }
                  >
                    <Box component="td">
                      <Typography
                        sx={{
                          color:
                            "var(--color-muted)",
                          fontSize: "9px",
                          fontWeight: 800,
                        }}
                      >
                        {(page - 1) *
                          limit +
                          index +
                          1}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.9}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            display: "grid",
                            placeItems:
                              "center",
                            borderRadius:
                              "11px",
                            color: "#ffffff",
                            backgroundColor:
                              "#244a70",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
                          {initial}
                        </Box>

                        <Box
                          sx={{
                            minWidth: 0,
                            maxWidth: 250,
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              color:
                                "#122f4d",
                              fontSize:
                                "10px",
                              fontWeight:
                                800,
                            }}
                          >
                            {studentName}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.15,
                              color:
                                "#7e8791",
                              fontSize:
                                "7.5px",
                              direction: "ltr",
                              textAlign: "right",
                            }}
                          >
                            {getStudentMeta(
                              item
                            )}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "9px",
                          fontWeight: 700,
                        }}
                      >
                        {getAcademicYearLabel(
                          item,
                          classLookup,
                          academicYearLookup
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          maxWidth: 220,
                          fontSize: "9px",
                          fontWeight: 700,
                        }}
                      >
                        {getClassLabel(
                          item,
                          classLookup
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "9px",
                          fontWeight: 700,
                        }}
                      >
                        {formatDate(
                          item?.date
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Chip
                        icon={
                          <PersonOffRounded />
                        }
                        label="غائب"
                        size="small"
                        sx={{
                          height: 27,
                          color: "#A93434",
                          backgroundColor:
                            "rgba(196,69,69,.10)",
                          border:
                            "1px solid rgba(196,69,69,.12)",
                          fontSize: "8.5px",
                          fontWeight: 900,

                          "& .MuiChip-icon": {
                            color: "inherit",
                            fontSize: 15,
                          },
                        }}
                      />
                    </Box>

                    <Box component="td">
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.7}
                      >
                        {permissions.edit && (
                          <Edit
                            item={item}
                            setItems={
                              setItems
                            }
                          />
                        )}

                        {permissions.delete &&
                          recordId && (
                            <Delete
                              id={recordId}
                              setItems={
                                setItems
                              }
                              setLocalPagination={
                                setLocalPagination
                              }
                            />
                          )}

                        {!permissions.edit &&
                          !permissions.delete && (
                            <Typography
                              sx={{
                                color:
                                  "var(--color-muted)",
                                fontSize:
                                  "9px",
                              }}
                            >
                              —
                            </Typography>
                          )}
                      </Stack>
                    </Box>
                  </Box>
                );
              }
            )}
      </Box>
    </Box>
  </Box>
);

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

  const [classLookup, setClassLookup] =
    useState({});

  const [
    academicYearLookup,
    setAcademicYearLookup,
  ] = useState({});

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

  useEffect(() => {
    let mounted = true;

    const loadReferenceData = async () => {
      const [classesResponse, yearsResponse] =
        await Promise.all([
          fetchClasses({
            page: 1,
            limit: 1000,
          }),
          fetchAcademicYears(),
        ]);

      if (!mounted) {
        return;
      }

      const classes = Array.isArray(
        classesResponse?.data
      )
        ? classesResponse.data
        : [];

      const years = Array.isArray(
        yearsResponse?.data
      )
        ? yearsResponse.data
        : [];

      setClassLookup(
        Object.fromEntries(
          classes
            .map((classItem) => [
              String(
                classItem?._id ||
                  classItem?.id ||
                  ""
              ),
              classItem,
            ])
            .filter(([id]) => id)
        )
      );

      setAcademicYearLookup(
        Object.fromEntries(
          years
            .map((year) => [
              String(
                year?._id ||
                  year?.id ||
                  ""
              ),
              year,
            ])
            .filter(([id]) => id)
        )
      );
    };

    loadReferenceData();

    return () => {
      mounted = false;
    };
  }, []);

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
          .map((item) =>
            getClassId(
              item,
              classLookup
            )
          )
          .filter(Boolean)
      ).size,
    }),
    [
      items,
      currentPagination,
      classLookup,
    ]
  );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        الطالب:
          getStudentName(item),
        "السنة الدراسية":
          getAcademicYearLabel(
            item,
            classLookup,
            academicYearLookup
          ),
        الفصل:
          getClassLabel(
            item,
            classLookup
          ),
        "تاريخ الغياب":
          formatDate(item?.date),
      })),
    [
      items,
      classLookup,
      academicYearLookup,
    ]
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
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent:
                "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: 0.8,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Box>
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
                عرض منظم لسجلات الغياب مع
                إمكانية التعديل والحذف حسب
                الصلاحيات.
              </Typography>
            </Box>

            {!loading &&
              items.length > 0 && (
                <Chip
                  label={`${items.length} سجل في الصفحة`}
                  size="small"
                  sx={{
                    height: 27,
                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(36,74,112,0.06)",
                    border:
                      "1px solid rgba(36,74,112,0.08)",
                    fontSize: "8.5px",
                    fontWeight: 800,
                  }}
                />
              )}
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
                    onClick={resetFilters}
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
          ) : permissions.read ? (
            <>
              <AttendanceTable
                items={items}
                loading={loading}
                permissions={permissions}
                page={page}
                limit={limit}
                setItems={setItems}
                setLocalPagination={
                  setLocalPagination
                }
                classLookup={classLookup}
                academicYearLookup={
                  academicYearLookup
                }
              />

              {currentPagination &&
                items.length > 0 && (
                  <Box
                    sx={{
                      px: {
                        xs: 1,
                        md: 1.25,
                      },
                      py: 1.15,
                      borderTop:
                        "1px solid rgba(36,74,112,0.07)",
                    }}
                  >
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
                  </Box>
                )}
            </>
          ) : (
            <Box
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                color:
                  "var(--color-muted)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              لا تملك صلاحية عرض سجل الغياب
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
