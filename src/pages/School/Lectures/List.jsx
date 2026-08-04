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
  CalendarMonthRounded,
  EventNoteRounded,
  FileDownloadOutlined,
  GroupsRounded,
  MenuBookRounded,
  RestartAltRounded,
  ScheduleRounded,
  SearchOffRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import PaginationControls from "@/components/Pagination";

import { deleteLecture } from "@/APIs/school/lectures";
import { useLectures } from "@/utils/hooks/apis/useLectures";
import { useTeachers } from "@/utils/hooks/apis/useTeachers";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import usePermissions from "@/utils/hooks/usePermissions";

import getArabicDays from "@/utils/helpers/getArabicDays";
import getLectureOrder from "@/utils/helpers/getLectureOrder";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import Person2Icon from "@mui/icons-material/Person2";
import SubjectIcon from "@mui/icons-material/Subject";

const TABLE_HEADERS = [
  "الفصل",
  "المعلم",
  "المادة",
  "اليوم",
  "الحصة",
];

const TABLE_BODY = [
  "className",
  "teacherName",
  "subject",
  "day",
  "slot",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي الحصص",
    icon: <EventNoteRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <ScheduleRounded />,
  },
  {
    key: "teachers",
    label: "المعلمون في الصفحة",
    icon: <GroupsRounded />,
  },
  {
    key: "subjects",
    label: "المواد في الصفحة",
    icon: <MenuBookRounded />,
  },
];

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const getEntityName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.title ||
    value.label ||
    ""
  );
};

const getLectureClass = (item) =>
  item?.class ||
  (item?.classId && typeof item.classId === "object"
    ? item.classId
    : null);

const getLectureTeacher = (item) =>
  item?.teacher ||
  (item?.teacherId && typeof item.teacherId === "object"
    ? item.teacherId
    : null);

const getLectureOffering = (item) =>
  (item?.subjectOfferingId &&
  typeof item.subjectOfferingId === "object"
    ? item.subjectOfferingId
    : null) ||
  (item?.subjectOffering &&
  typeof item.subjectOffering === "object"
    ? item.subjectOffering
    : null);

const getLectureSubject = (item) => {
  const offering = getLectureOffering(item);

  return (
    item?.subject ||
    (item?.subjectId && typeof item.subjectId === "object"
      ? item.subjectId
      : null) ||
    offering?.subjectId ||
    offering?.subject ||
    offering?.subjectDetails ||
    (offering?.subjectName || offering?.name
      ? offering
      : null)
  );
};

const mapLectures = (data = []) =>
  getArray(data).map((item) => {
    const classData = getLectureClass(item);
    const teacherData = getLectureTeacher(item);
    const offeringData = getLectureOffering(item);
    const subjectData = getLectureSubject(item);

    const subjectName =
      subjectData?.subjectName ||
      subjectData?.name ||
      offeringData?.subjectName ||
      item?.subjectName ||
      "مادة غير محددة";

    const subjectCode =
      subjectData?.subjectCode ||
      subjectData?.code ||
      offeringData?.subjectCode ||
      item?.subjectCode ||
      "";

    const academicYear =
      getEntityName(classData?.academicYear) ||
      getEntityName(classData?.academicYearId) ||
      getEntityName(classData?.gradeLevelId) ||
      getEntityName(classData?.gradeLevel) ||
      "";

    const roomNumber =
      classData?.roomNumber ||
      classData?.name ||
      "";

    const gender =
      classData?.gender === "male"
        ? "بنين"
        : classData?.gender === "female"
        ? "بنات"
        : "";

    const className =
      [academicYear, roomNumber, gender]
        .filter(Boolean)
        .join(" - ") ||
      item?.className ||
      "—";

    return {
      id: getId(item),

      classId: getId(
        item?.classId ||
        item?.class
      ),

      teacherId: getId(
        item?.teacherId ||
        item?.teacher
      ),

      subjectId:
        getId(subjectData) ||
        getId(
          offeringData?.subjectId ||
          offeringData?.subject
        ),

      subjectOfferingId: getId(
        item?.subjectOfferingId ||
        item?.subjectOffering
      ),

      termId: getId(
        item?.termId ||
        item?.term
      ),

      className,

      teacherName:
        teacherData?.name ||
        teacherData?.username ||
        teacherData?.email ||
        item?.teacherName ||
        "—",

      subject: subjectCode
        ? `${subjectName} - ${subjectCode}`
        : subjectName,

      day:
        getArabicDays(item?.dayOfWeek) ||
        item?.dayOfWeek ||
        "—",

      slot:
        getLectureOrder(item?.slot) ||
        item?.slot ||
        "—",
    };
  });

const List = () => {
  const [items, setItems] = useState([]);
  const [classFilter, setClassFilter] =
    useState("");
  const [teacher, setTeacher] =
    useState("");
  const [subject, setSubject] =
    useState("");
  const [slot, setSlot] =
    useState("");
  const [dayOfWeek, setDayOfWeek] =
    useState("");
  const [page, setPage] =
    useState(1);
  const [limit, setLimit] =
    useState(10);
  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const { teachers = [] } =
    useTeachers({
      page: 1,
      limit: 1000,
    });

  const { subjects = [] } =
    useSubjects({
      page: 1,
      limit: 1000,
    });

  const filters = useMemo(
    () => ({
      page: subject ? 1 : page,
      limit: subject ? 1000 : limit,
      teacherId:
        teacher || undefined,
      classId:
        classFilter || undefined,
      dayOfWeek:
        dayOfWeek || undefined,
      slot: slot || undefined,
    }),
    [
      page,
      limit,
      teacher,
      classFilter,
      dayOfWeek,
      slot,
      subject,
    ]
  );

  const {
    lectures,
    loading,
    pagination,
  } = useLectures(filters);

  const permissions =
    usePermissions("lectures");

  useEffect(() => {
    const mappedLectures =
      mapLectures(lectures);

    const filteredLectures = subject
      ? mappedLectures.filter(
          (item) =>
            item.subjectId === subject
        )
      : mappedLectures;

    setItems(filteredLectures);
  }, [lectures, subject]);

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
    slot,
    dayOfWeek,
    subject,
    teacher,
    classFilter,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    teacher,
    classFilter,
    subject,
    slot,
    dayOfWeek,
  ].filter(Boolean).length;

  const stats = useMemo(
    () => ({
      total: subject
        ? items.length
        : (currentPagination?.totalDocs ??
          items.length),
      visible: items.length,
      teachers: new Set(
        items
          .map(
            (item) =>
              item.teacherId
          )
          .filter(Boolean)
      ).size,
      subjects: new Set(
        items
          .map(
            (item) =>
              item.subjectId
          )
          .filter(Boolean)
      ).size,
    }),
    [
      items,
      currentPagination,
      subject,
    ]
  );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        الفصل: item.className,
        المعلم:
          item.teacherName,
        المادة: item.subject,
        اليوم: item.day,
        الحصة: item.slot,
      })),
    [items]
  );

  const teacherOptions =
    getArray(teachers).map(
      (item) => ({
        value:
          item?._id ||
          item?.id,
        label:
          item?.name || "—",
      })
    );

  const subjectOptions =
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

  const resetFilters = () => {
    setClassFilter("");
    setTeacher("");
    setSubject("");
    setSlot("");
    setDayOfWeek("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    try {
      const response =
        await deleteLecture(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف الحصة"
        );
        return;
      }

      toast.success(
        "تم حذف الحصة بنجاح"
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
          "حدث خطأ أثناء حذف الحصة"
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
                  إدارة الحصص
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
                أنشئ الحصص واربطها
                بالفصول والمعلمين
                والمواد داخل الجدول
                الدراسي.
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
                filename="lectures.csv"
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

                    "&:hover": {
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      borderColor:
                        "rgba(211,164,79,0.42)",
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
                      sm: 172,
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

                    "&:hover": {
                      background:
                        "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                      transform:
                        "translateY(-1px)",
                    },
                  }}
                >
                  إضافة حصة جديدة
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
                    "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",

                  "&:hover": {
                    transform:
                      "translateY(-3px)",
                    borderColor:
                      "rgba(211,164,79,0.25)",
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
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
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
                fontSize: "12px",
              },

            "& .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(36,74,112,0.18)",
              },

            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
              {
                borderColor:
                  "rgba(36,74,112,0.30)",
              },

            "& .MuiOutlinedInput-root.Mui-focused":
              {
                boxShadow:
                  "0 0 0 3px rgba(211,164,79,0.10)",
              },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderWidth: "1px",
                borderColor:
                  "var(--color-gold)",
              },

            "& .MuiInputLabel-root":
              {
                px: 0.65,
                color:
                  "var(--color-muted)",
                backgroundColor:
                  "var(--color-cream)",
                fontSize: "10.5px",
                fontWeight: 700,
              },

            "& .MuiInputLabel-root.Mui-focused":
              {
                color:
                  "var(--color-gold-dark)",
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
            sx={{
              mb: {
                xs: 1.5,
                md: 1.7,
              },
            }}
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
                استخدم الفلاتر للوصول
                إلى الحصة المطلوبة
                بسرعة.
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
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft: "5px",
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
                  "repeat(3, minmax(0, 1fr))",
                xl:
                  "repeat(5, minmax(0, 1fr))",
              },
              gap: {
                xs: 1.25,
                md: 1.5,
              },
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
            }}
          >
            <SelectFilter
              value={teacher}
              onChange={setTeacher}
              label="المعلم"
              icon={Person2Icon}
              allLabel="جميع المعلمين"
              options={
                teacherOptions
              }
            />

            <ClassFilter
              classId={
                classFilter
              }
              setClassId={
                setClassFilter
              }
            />

            <SelectFilter
              value={subject}
              onChange={setSubject}
              label="المادة"
              icon={SubjectIcon}
              allLabel="جميع المواد"
              options={
                subjectOptions
              }
            />

            <SelectFilter
              value={slot}
              onChange={setSlot}
              label="الحصة"
              icon={GpsFixedIcon}
              allLabel="جميع الحصص"
              options={Slots.map(
                (item) => ({
                  value: item.id,
                  label: item.name,
                })
              )}
            />

            <SelectFilter
              value={dayOfWeek}
              onChange={
                setDayOfWeek
              }
              label="اليوم"
              icon={
                CalendarMonthIcon
              }
              allLabel="جميع الأيام"
              options={Days.map(
                (item) => ({
                  value: item.id,
                  label: item.day,
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
              قائمة الحصص
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              يمكنك تعديل الحصة أو
              حذفها حسب صلاحياتك.
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
                    ? "لا توجد حصص مطابقة للفلاتر"
                    : "لا توجد حصص حتى الآن"}
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
                    : "أضف أول حصة لبدء تنظيم الجدول الدراسي."}
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

                      "& .MuiButton-startIcon":
                        {
                          marginLeft:
                            "7px",
                          marginRight: 0,
                        },
                    }}
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

                        "& .MuiButton-startIcon":
                          {
                            marginLeft:
                              "7px",
                            marginRight: 0,
                          },
                      }}
                    >
                      إضافة أول حصة
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
                minWidth: 0,
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
                body={TABLE_BODY}
                deleteFn={
                  permissions.delete
                    ? handleDelete
                    : undefined
                }
              />

              {!subject &&
                currentPagination &&
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
                    label="عدد الحصص"
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
