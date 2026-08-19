import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
  EditRounded,
  FileDownloadOutlined,
  GroupsRounded,
  MenuBookRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Popup from "@/components/Popup/Popup";
import ClassFilter from "@/components/Filters/ClassFilter";

import {
  deleteLecture,
  fetchTermsByAcademicYear,
} from "@/APIs/school/lectures";

import { fetchClassesList } from "@/APIs/school/classes";

import { useLectures } from "@/utils/hooks/apis/useLectures";
import usePermissions from "@/utils/hooks/usePermissions";

import getArabicDays from "@/utils/helpers/getArabicDays";
import getLectureOrder from "@/utils/helpers/getLectureOrder";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";


const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value._id || value.id || ""
    ).trim();
  }

  return String(value || "").trim();
};

const normalizeDay = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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

const unwrapData = (response) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractList = (response) => {
  const payload = unwrapData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.results,
      payload?.records,
      payload?.classes,
      payload?.terms,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const getAcademicYear = (item) =>
  item?.academicYearId ||
  item?.academicYear ||
  null;

const mapTermOption = (item) => ({
  value: getId(item),
  label:
    item?.name ||
    `الترم ${item?.order || ""}`,
  order: Number(item?.order) || 0,
  status: item?.status || "",
});

const getLectureClass = (item) =>
  item?.class ||
  (item?.classId &&
  typeof item.classId === "object"
    ? item.classId
    : null);

const getLectureTeacher = (item) =>
  item?.teacher ||
  (item?.teacherId &&
  typeof item.teacherId === "object"
    ? item.teacherId
    : null);

const getLectureOffering = (item) =>
  (item?.subjectOfferingId &&
  typeof item.subjectOfferingId ===
    "object"
    ? item.subjectOfferingId
    : null) ||
  (item?.subjectOffering &&
  typeof item.subjectOffering === "object"
    ? item.subjectOffering
    : null);

const getLectureSubject = (item) => {
  const offering =
    getLectureOffering(item);

  return (
    item?.subject ||
    (item?.subjectId &&
    typeof item.subjectId === "object"
      ? item.subjectId
      : null) ||
    offering?.subjectId ||
    offering?.subject ||
    offering?.subjectDetails ||
    (offering?.subjectName ||
    offering?.name
      ? offering
      : null)
  );
};

const getClassLabel = (item) => {
  if (!item) {
    return "";
  }

  const academicYear =
    getEntityName(item?.academicYear) ||
    getEntityName(item?.academicYearId) ||
    getEntityName(item?.gradeLevelId) ||
    getEntityName(item?.gradeLevel) ||
    "";

  const className =
    item?.name || "";

  const roomNumber =
    item?.roomNumber || "";

  const gender =
    item?.gender === "male"
      ? "بنين"
      : item?.gender === "female"
      ? "بنات"
      : "";

  return (
    [
      academicYear,
      className,
      roomNumber &&
      roomNumber !== className
        ? `فصل ${roomNumber}`
        : "",
      gender,
    ]
      .filter(Boolean)
      .join(" - ") || "الفصل المختار"
  );
};

const mapLectures = (data = []) =>
  getArray(data).map((item) => {
    const classData =
      getLectureClass(item);

    const teacherData =
      getLectureTeacher(item);

    const offeringData =
      getLectureOffering(item);

    const subjectData =
      getLectureSubject(item);

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
      getEntityName(
        classData?.academicYear
      ) ||
      getEntityName(
        classData?.academicYearId
      ) ||
      getEntityName(
        classData?.gradeLevelId
      ) ||
      getEntityName(
        classData?.gradeLevel
      ) ||
      "";

    const roomNumber =
      classData?.roomNumber ||
      classData?.name ||
      "";

    const gender =
      classData?.gender === "male"
        ? "بنين"
        : classData?.gender ===
          "female"
        ? "بنات"
        : "";

    const className =
      [
        academicYear,
        roomNumber,
        gender,
      ]
        .filter(Boolean)
        .join(" - ") ||
      item?.className ||
      "—";

    const rawDay = normalizeDay(
      item?.dayOfWeek ||
        item?.day
    );

    const rawSlot =
      Number(item?.slot) || 0;

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
        "بدون معلم",

      subject: subjectCode
        ? `${subjectName} - ${subjectCode}`
        : subjectName,

      subjectName,

      dayOfWeek: rawDay,

      day:
        getArabicDays(rawDay) ||
        rawDay ||
        "—",

      slotNumber: rawSlot,

      slot:
        getLectureOrder(rawSlot) ||
        rawSlot ||
        "—",
    };
  });

const SUBJECT_TONES = [
  {
    bg: "#EEF5FF",
    border: "#CFE2F7",
    accent: "#4E8DCC",
  },
  {
    bg: "#EAF8F1",
    border: "#CBEBDD",
    accent: "#43A978",
  },
  {
    bg: "#F3EFFF",
    border: "#DED5FA",
    accent: "#8068C9",
  },
  {
    bg: "#FFF5E8",
    border: "#F1DDBE",
    accent: "#D39A3F",
  },
  {
    bg: "#FFF0EF",
    border: "#F3D1CF",
    accent: "#D76760",
  },
];

const getSubjectTone = (key) => {
  const value = String(key || "subject");

  const hash = Array.from(value).reduce(
    (sum, char) =>
      sum + char.charCodeAt(0),
    0
  );

  return SUBJECT_TONES[
    hash % SUBJECT_TONES.length
  ];
};

const List = () => {
  const navigate = useNavigate();

  const [items, setItems] =
    useState([]);

  const [
    classFilter,
    setClassFilter,
  ] = useState(
    () =>
      localStorage.getItem(
        "nasaq:lectures:lastClassId"
      ) || ""
  );

  const [termId, setTermId] =
    useState("");

  const [
    defaultTermId,
    setDefaultTermId,
  ] = useState("");

  const [
    termOptions,
    setTermOptions,
  ] = useState([]);

  const [
    termsLoading,
    setTermsLoading,
  ] = useState(false);

  const [
    classRows,
    setClassRows,
  ] = useState([]);

  const [
    classesLoading,
    setClassesLoading,
  ] = useState(true);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    selectedLectureId,
    setSelectedLectureId,
  ] = useState(null);

  const savedTermId =
    useMemo(
      () =>
        localStorage.getItem(
          "nasaq:lectures:lastTermId"
        ) || "",
      []
    );

  const permissions =
    usePermissions("lectures");

  useEffect(() => {
    let mounted = true;

    const loadClasses = async () => {
      setClassesLoading(true);

      const classesResponse =
        await fetchClassesList();

      if (!mounted) {
        return;
      }

      if (
        classesResponse?.status ===
        false
      ) {
        setClassRows([]);
        setClassesLoading(false);
        return;
      }

      const rows =
        extractList(classesResponse);

      setClassRows(rows);

      if (
        classFilter &&
        !rows.some(
          (item) =>
            getId(item) ===
            classFilter
        )
      ) {
        setClassFilter("");
        localStorage.removeItem(
          "nasaq:lectures:lastClassId"
        );
      }

      setClassesLoading(false);
    };

    loadClasses();

    return () => {
      mounted = false;
    };
  }, [classFilter]);

  const selectedClass =
    useMemo(
      () =>
        classRows.find(
          (item) =>
            getId(item) ===
            classFilter
        ) || null,
      [classRows, classFilter]
    );

  const selectedClassLabel =
    useMemo(
      () =>
        getClassLabel(
          selectedClass
        ),
      [selectedClass]
    );

  const selectedClassAcademicYearId =
    useMemo(() => {
      if (!selectedClass) {
        return "";
      }

      return getId(
        getAcademicYear(
          selectedClass
        )
      );
    }, [selectedClass]);

  useEffect(() => {
    let mounted = true;

    const loadTerms =
      async () => {
        if (!classFilter) {
          setTermOptions([]);
          setDefaultTermId("");
          setTermId("");
          setTermsLoading(false);
          return;
        }

        if (
          classesLoading ||
          !selectedClassAcademicYearId
        ) {
          setTermOptions([]);
          setDefaultTermId("");
          setTermId("");
          setTermsLoading(
            classesLoading
          );
          return;
        }

        setTermsLoading(true);

        const termsResponse =
          await fetchTermsByAcademicYear(
            selectedClassAcademicYearId
          );

        if (!mounted) {
          return;
        }

        if (
          termsResponse?.status ===
          false
        ) {
          setTermOptions([]);
          setDefaultTermId("");
          setTermId("");
          setTermsLoading(false);
          return;
        }

        const options =
          extractList(
            termsResponse
          )
            .map(mapTermOption)
            .filter(
              (item) =>
                item.value
            )
            .sort(
              (a, b) =>
                a.order - b.order
            );

        setTermOptions(options);

        const defaultTerm =
          options.find(
            (item) =>
              item.value ===
              savedTermId
          ) ||
          options.find(
            (item) =>
              item.status ===
              "active"
          ) ||
          options.find(
            (item) =>
              item.status ===
              "upcoming"
          ) ||
          options[0];

        const nextDefaultTermId =
          defaultTerm?.value ||
          "";

        setDefaultTermId(
          nextDefaultTermId
        );

        setTermId(
          nextDefaultTermId
        );

        setTermsLoading(false);
      };

    loadTerms();

    return () => {
      mounted = false;
    };
  }, [
    classFilter,
    classesLoading,
    selectedClassAcademicYearId,
    savedTermId,
  ]);

  useEffect(() => {
    if (classFilter) {
      localStorage.setItem(
        "nasaq:lectures:lastClassId",
        classFilter
      );
    } else {
      localStorage.removeItem(
        "nasaq:lectures:lastClassId"
      );
    }
  }, [classFilter]);

  useEffect(() => {
    if (termId) {
      localStorage.setItem(
        "nasaq:lectures:lastTermId",
        termId
      );
    } else if (!classFilter) {
      localStorage.removeItem(
        "nasaq:lectures:lastTermId"
      );
    }
  }, [termId, classFilter]);

  const filters = useMemo(
    () => ({
      page: 1,
      limit: 1000,
      classId:
        classFilter || undefined,
      termId:
        termId || undefined,
    }),
    [classFilter, termId]
  );

  const {
    lectures,
    loading,
  } = useLectures(filters, {
    enabled:
      !classesLoading &&
      !termsLoading,
  });

  useEffect(() => {
    setItems(
      mapLectures(lectures)
    );
  }, [lectures]);

  const selectedTermLabel =
    termOptions.find(
      (item) =>
        item.value === termId
    )?.label || "";

  const visibleItems = items;

  const stats = useMemo(
    () => ({
      total: items.length,

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
    [items]
  );

  const csvData =
    useMemo(
      () =>
        visibleItems.map(
          (item) => ({
            الفصل:
              item.className,
            المعلم:
              item.teacherName,
            المادة:
              item.subject,
            اليوم:
              item.day,
            الحصة:
              item.slot,
          })
        ),
      [visibleItems]
    );

  const scheduleMap =
    useMemo(() => {
      const map = new Map();

      items.forEach(
        (lecture) => {
          const key = `${normalizeDay(
            lecture.dayOfWeek
          )}:${Number(
            lecture.slotNumber
          )}`;

          if (!map.has(key)) {
            map.set(key, []);
          }

          map
            .get(key)
            .push(lecture);
        }
      );

      return map;
    }, [items]);

  const openAddFromCell = (
    dayId,
    slotId
  ) => {
    if (
      !permissions.add ||
      !classFilter ||
      !termId
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        classId: classFilter,
        termId,
        day: String(dayId),
        slot: String(slotId),
      });

    navigate(
      `/school/lectures/add?${params.toString()}`
    );
  };

  const openEditLecture = (
    lectureId
  ) => {
    if (
      !permissions.edit ||
      !lectureId
    ) {
      return;
    }

    navigate(
      `/school/lectures/edit/${lectureId}?isComingFromClass=true`
    );
  };

  const handleDeleteLecture =
    async () => {
      if (!selectedLectureId) {
        return;
      }

      try {
        const response =
          await deleteLecture(
            selectedLectureId
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "تعذر حذف الحصة"
          );
          return;
        }

        setItems(
          (previousItems) =>
            previousItems.filter(
              (item) =>
                item.id !==
                selectedLectureId
            )
        );

        setDeleteOpen(false);
        setSelectedLectureId(
          null
        );

        toast.success(
          "تم حذف الحصة بنجاح"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف الحصة"
        );
      }
    };

  const readyForSchedule =
    Boolean(classFilter) &&
    Boolean(termId) &&
    !classesLoading &&
    !termsLoading;

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
        {/* =========================================
            HEADER
        ========================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.2,
            px: {
              xs: 1.5,
              md: 2,
            },
            py: 1.35,
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
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
            gap={1.25}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: "13px",
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.22)",
                }}
              >
                <CalendarMonthRounded />
              </Box>

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: {
                      xs: "20px",
                      md: "24px",
                    },
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  الجدول الدراسي
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color:
                      "var(--color-muted)",
                    fontSize: "10px",
                  }}
                >
                  اختَر الفصل، وسيتم تحديد الترم تلقائيًا.
                  أضف الحصص مباشرة من علامة + داخل الجدول.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.7}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              {readyForSchedule && (
                <>
                  <MiniInfoChip
                    icon={
                      <CalendarMonthRounded />
                    }
                    label={`${stats.total} حصة`}
                  />

                  <MiniInfoChip
                    icon={
                      <MenuBookRounded />
                    }
                    label={`${stats.subjects} مواد`}
                  />

                  <MiniInfoChip
                    icon={
                      <GroupsRounded />
                    }
                    label={`${stats.teachers} معلمين`}
                  />
                </>
              )}

              <Box
                component={CSVLink}
                data={csvData}
                filename="lectures.csv"
                sx={{
                  display:
                    "inline-flex",
                  textDecoration:
                    "none",
                }}
              >
                <Button
                  disabled={
                    visibleItems.length ===
                    0
                  }
                  variant="outlined"
                  startIcon={
                    <FileDownloadOutlined />
                  }
                  sx={{
                    minHeight: 38,
                    px: 1.4,
                    borderRadius:
                      "11px",
                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(255,255,255,0.72)",
                    borderColor:
                      "rgba(36,74,112,0.14)",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform:
                      "none",
                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "6px",
                        marginRight: 0,
                      },
                  }}
                >
                  تصدير
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* =========================================
            CLASS SELECTOR
        ========================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.1,
            px: {
              xs: 1.1,
              md: 1.35,
            },
            py: 0.9,
            overflow: "visible",
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "15px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 6px 16px rgba(18,47,77,0.04)",
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
            spacing={1}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
              sx={{
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "10px",
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(36,74,112,0.055)",
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
                      "var(--color-navy-deep)",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  الفصل
                </Typography>

                <Typography
                  sx={{
                    mt: 0.05,
                    color:
                      "var(--color-muted)",
                    fontSize: "7.5px",
                  }}
                >
                  اختَر الفصل لعرض جدوله الدراسي
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                width: {
                  xs: "100%",
                  md: 430,
                  xl: 520,
                },
                maxWidth: "100%",
                "& .MuiFormControl-root": {
                  width: "100%",
                  minWidth: 0,
                  m: 0,
                },
                "& .MuiInputBase-root, & .MuiOutlinedInput-root":
                  {
                    minHeight: 42,
                    height: 42,
                    backgroundColor:
                      "var(--color-white)",
                    borderRadius: "11px",
                    fontSize: "10px",
                  },
              }}
            >
              <ClassFilter
                classId={
                  classFilter
                }
                setClassId={(value) => {
                  const nextValue =
                    value || "";

                  setClassFilter(
                    nextValue
                  );

                  setTermId("");
                  setDefaultTermId(
                    ""
                  );

                  localStorage.removeItem(
                    "nasaq:lectures:lastTermId"
                  );
                }}
              />
            </Box>

            {classFilter &&
              selectedTermLabel && (
                <Chip
                  icon={
                    <CalendarMonthRounded />
                  }
                  label={
                    selectedTermLabel
                  }
                  size="small"
                  sx={{
                    flexShrink: 0,
                    height: 27,
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    border:
                      "1px solid rgba(211,164,79,0.14)",
                    fontSize: "8px",
                    fontWeight: 800,
                    "& .MuiChip-icon": {
                      color:
                        "var(--color-gold-dark)",
                      fontSize: 13,
                    },
                  }}
                />
              )}
          </Stack>
        </Paper>

        {/* =========================================
            SCHEDULE
        ========================================= */}

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
              "0 12px 28px rgba(18,47,77,0.055)",
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
              px: {
                xs: 1.4,
                md: 1.8,
              },
              py: 1.15,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={0.7}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "15px",
                    fontWeight: 900,
                  }}
                >
                  جدول الحصص
                </Typography>

                {selectedClassLabel && (
                  <Tooltip
                    title={selectedClassLabel}
                    arrow
                  >
                    <Chip
                      icon={
                        <SchoolRounded />
                      }
                      label={
                        selectedClassLabel
                      }
                      size="small"
                      sx={{
                        maxWidth: {
                          xs: 210,
                          md: 300,
                        },
                        height: 25,
                        color:
                          "var(--color-navy)",
                        backgroundColor:
                          "rgba(36,74,112,0.055)",
                        fontSize: "8px",
                        fontWeight: 800,
                        "& .MuiChip-label":
                          {
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          },
                        "& .MuiChip-icon":
                          {
                            color:
                              "var(--color-navy)",
                            fontSize: 14,
                          },
                      }}
                    />
                  </Tooltip>
                )}

                {selectedTermLabel && (
                  <Chip
                    label={
                      selectedTermLabel
                    }
                    size="small"
                    sx={{
                      height: 25,
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      fontSize: "8px",
                      fontWeight: 800,
                    }}
                  />
                )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.25,
                  color:
                    "var(--color-muted)",
                  fontSize: "8.5px",
                }}
              >
                اضغط على علامة + لإضافة
                حصة، أو على الحصة الحالية
                لتعديلها.
              </Typography>
            </Box>
          </Stack>

          {!classFilter ? (
            <SchedulePlaceholder
              title="جاهز تبني جدول الفصل؟"
              description="اختَر الفصل من الشريط بالأعلى، وسيتم تحديد الترم المناسب وعرض الجدول مباشرة. بعدها اضغط + داخل أي خانة فارغة لإضافة الحصة."
            />
          ) : termsLoading ? (
            <ScheduleLoading />
          ) : !termId ? (
            <SchedulePlaceholder
              title="لا يوجد ترم متاح لهذا الفصل"
              description="تم اختيار الفصل، لكن لم يتم العثور على ترم مرتبط بالسنة الدراسية الخاصة به."
            />
          ) : loading ? (
            <ScheduleLoading />
          ) : (
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Box
                sx={{
                  minWidth:
                    Math.max(
                      1080,
                      116 +
                        Slots.length *
                          132
                    ),
                  display: "grid",
                  gridTemplateColumns: `116px repeat(${Slots.length}, minmax(132px, 1fr))`,
                  direction: "rtl",
                }}
              >
                <ScheduleHeaderCell>
                  اليوم
                </ScheduleHeaderCell>

                {Slots.map(
                  (slotItem) => (
                    <ScheduleHeaderCell
                      key={slotItem.id}
                    >
                      {slotItem.name ||
                        `الحصة ${slotItem.id}`}
                    </ScheduleHeaderCell>
                  )
                )}

                {Days.map(
                  (day) => (
                    <ScheduleDayRow
                      key={day.id}
                      day={day}
                      scheduleMap={
                        scheduleMap
                      }
                      permissions={
                        permissions
                      }
                      onAdd={
                        openAddFromCell
                      }
                      onEdit={
                        openEditLecture
                      }
                      onDelete={(
                        lectureId
                      ) => {
                        setSelectedLectureId(
                          lectureId
                        );
                        setDeleteOpen(
                          true
                        );
                      }}
                    />
                  )
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message="هل أنت متأكد من حذف هذه الحصة؟"
        type="delete"
        fn={handleDeleteLecture}
      />
    </Container>
  );
};

const MiniInfoChip = ({
  icon,
  label,
}) => (
  <Chip
    icon={icon}
    label={label}
    size="small"
    sx={{
      height: 27,
      color:
        "var(--color-navy)",
      backgroundColor:
        "rgba(36,74,112,0.055)",
      border:
        "1px solid rgba(36,74,112,0.06)",
      fontSize: "8px",
      fontWeight: 800,
      "& .MuiChip-icon": {
        color:
          "var(--color-gold-dark)",
        fontSize: 14,
      },
    }}
  />
);

const ScheduleHeaderCell = ({
  children,
}) => (
  <Box
    sx={{
      minHeight: 50,
      px: 0.8,
      display: "grid",
      placeItems: "center",
      color:
        "var(--color-navy-deep)",
      background:
        "linear-gradient(135deg, #F5F8FC, #EDF2F7)",
      borderBottom:
        "1px solid rgba(36,74,112,0.08)",
      borderLeft:
        "1px solid rgba(36,74,112,0.07)",
      fontSize: "10px",
      fontWeight: 900,
      textAlign: "center",
    }}
  >
    {children}
  </Box>
);

const ScheduleDayRow = ({
  day,
  scheduleMap,
  permissions,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const dayId =
    normalizeDay(day?.id);

  return (
    <>
      <Box
        sx={{
          minHeight: 112,
          px: 0.8,
          display: "grid",
          placeItems: "center",
          color:
            "var(--color-navy-deep)",
          backgroundColor:
            "rgba(36,74,112,0.035)",
          borderBottom:
            "1px solid rgba(36,74,112,0.07)",
          borderLeft:
            "1px solid rgba(36,74,112,0.07)",
          textAlign: "center",
        }}
      >
        <Stack
          spacing={0.2}
          alignItems="center"
        >
          <Typography
            sx={{
              fontSize: "10.5px",
              fontWeight: 900,
            }}
          >
            {day?.day || "—"}
          </Typography>

          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontSize: "7.5px",
            }}
          >
            يوم دراسي
          </Typography>
        </Stack>
      </Box>

      {Slots.map(
        (slotItem) => {
          const slotId =
            Number(
              slotItem?.id
            ) || 0;

          const key = `${dayId}:${slotId}`;

          const cellLectures =
            scheduleMap.get(
              key
            ) || [];

          const lecture =
            cellLectures[0] ||
            null;

          const hasLecture =
            Boolean(
              lecture?.id
            );
          const isHighlighted = true;

          return (
            <ScheduleCell
              key={
                slotItem.id
              }
              lecture={
                lecture
              }
              extraCount={Math.max(
                0,
                cellLectures.length -
                  1
              )}
              highlighted={
                isHighlighted
              }
              canAdd={
                permissions.add
              }
              canEdit={
                permissions.edit
              }
              canDelete={
                permissions.delete
              }
              onAdd={() =>
                onAdd(
                  day.id,
                  slotId
                )
              }
              onEdit={() =>
                onEdit(
                  lecture?.id
                )
              }
              onDelete={() =>
                onDelete(
                  lecture?.id
                )
              }
            />
          );
        }
      )}
    </>
  );
};

const ScheduleCell = ({
  lecture,
  extraCount,
  highlighted,
  canAdd,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const hasLecture =
    Boolean(lecture?.id);

  const tone = getSubjectTone(
    lecture?.subjectId ||
      lecture?.subject
  );

  const handleCellClick = () => {
    if (
      hasLecture &&
      canEdit
    ) {
      onEdit();
      return;
    }

    if (
      !hasLecture &&
      canAdd
    ) {
      onAdd();
    }
  };

  return (
    <Box
      role={
        hasLecture ||
        canAdd
          ? "button"
          : undefined
      }
      tabIndex={
        hasLecture ||
        canAdd
          ? 0
          : undefined
      }
      onClick={
        handleCellClick
      }
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          handleCellClick();
        }
      }}
      sx={{
        position: "relative",
        minHeight: 112,
        p: 0.8,
        display: "flex",
        alignItems: "stretch",
        justifyContent:
          "center",
        backgroundColor:
          "rgba(255,255,255,0.76)",
        borderBottom:
          "1px solid rgba(36,74,112,0.07)",
        borderLeft:
          "1px solid rgba(36,74,112,0.07)",
        cursor:
          (hasLecture &&
            canEdit) ||
          (!hasLecture && canAdd)
            ? "pointer"
            : "default",
        transition:
          "background-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          backgroundColor:
            hasLecture
              ? "rgba(251,240,216,0.36)"
              : canAdd
              ? "rgba(36,74,112,0.035)"
              : undefined,
          boxShadow:
            (hasLecture &&
              canEdit) ||
            (!hasLecture &&
              canAdd)
              ? "inset 0 0 0 2px rgba(211,164,79,0.12)"
              : "none",
        },
      }}
    >
      {hasLecture ? (
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            p: 1,
            position: "relative",
            display: "flex",
            flexDirection:
              "column",
            justifyContent:
              "center",
            borderRadius:
              "13px",
            backgroundColor:
              tone.bg,
            border: `1px solid ${tone.border}`,
            borderRight: `4px solid ${tone.accent}`,
            opacity:
              highlighted
                ? 1
                : 0.28,
            transition:
              "opacity 160ms ease, transform 160ms ease",
            "&:hover": {
              opacity: 1,
              transform:
                canEdit
                  ? "translateY(-1px)"
                  : "none",
            },
          }}
        >
          {canDelete && (
            <Tooltip title="حذف الحصة">
              <IconButton
                type="button"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();
                  onDelete();
                }}
                sx={{
                  position:
                    "absolute",
                  top: 5,
                  left: 5,
                  width: 27,
                  height: 27,
                  color: "#D76760",
                  backgroundColor:
                    "rgba(255,255,255,0.82)",
                  "&:hover": {
                    backgroundColor:
                      "#FFF0EF",
                  },
                }}
              >
                <DeleteOutlineRounded
                  sx={{
                    fontSize: 16,
                  }}
                />
              </IconButton>
            </Tooltip>
          )}

          <Typography
            title={
              lecture.subject
            }
            sx={{
              pr: 0.2,
              pl: canDelete
                ? 3.1
                : 0.2,
              color:
                "var(--color-navy-deep)",
              fontSize: "10.5px",
              fontWeight: 900,
              lineHeight: 1.45,
              overflow: "hidden",
              textOverflow:
                "ellipsis",
              whiteSpace:
                "nowrap",
            }}
          >
            {lecture.subject}
          </Typography>

          <Typography
            title={
              lecture.teacherName
            }
            sx={{
              mt: 0.45,
              color:
                "var(--color-muted)",
              fontSize: "8px",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow:
                "ellipsis",
              whiteSpace:
                "nowrap",
            }}
          >
            {lecture.teacherName}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mt: 0.8,
            }}
          >
            {extraCount > 0 ? (
              <Chip
                label={`+${extraCount}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: "7px",
                  fontWeight: 900,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(255,255,255,0.72)",
                }}
              />
            ) : (
              <Box />
            )}

            {canEdit && (
              <EditRounded
                sx={{
                  color:
                    tone.accent,
                  fontSize: 15,
                }}
              />
            )}
          </Stack>
        </Box>
      ) : canAdd ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{
            width: "100%",
            minHeight: 94,
            color:
              "var(--color-muted)",
            border:
              "1px dashed rgba(36,74,112,0.16)",
            borderRadius:
              "13px",
            transition:
              "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
            "&:hover": {
              color:
                "var(--color-navy)",
              borderColor:
                "rgba(211,164,79,0.48)",
              backgroundColor:
                "rgba(251,240,216,0.30)",
            },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              display: "grid",
              placeItems:
                "center",
              borderRadius:
                "10px",
              backgroundColor:
                "rgba(36,74,112,0.055)",
            }}
          >
            <AddRounded
              sx={{
                fontSize: 20,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: "8px",
              fontWeight: 800,
            }}
          >
            إضافة حصة
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            width: "100%",
            minHeight: 94,
            borderRadius:
              "13px",
            backgroundColor:
              "rgba(36,74,112,0.02)",
          }}
        />
      )}
    </Box>
  );
};

const SchedulePlaceholder = ({
  title,
  description,
}) => (
  <Box
    sx={{
      minHeight: 290,
      px: {
        xs: 1.5,
        md: 2.4,
      },
      py: 2.2,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(251,240,216,0.16))",
    }}
  >
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 720,
        p: {
          xs: 2,
          md: 2.5,
        },
        border:
          "1px dashed rgba(36,74,112,0.16)",
        borderRadius: "20px",
        backgroundColor:
          "rgba(255,255,255,0.72)",
      }}
    >
      <Stack
        alignItems="center"
        spacing={1}
      >
        <Box
          sx={{
            width: 62,
            height: 62,
            display: "grid",
            placeItems: "center",
            borderRadius: "18px",
            color:
              "var(--color-gold-dark)",
            backgroundColor:
              "var(--color-gold-soft)",
            border:
              "1px solid rgba(211,164,79,0.22)",
          }}
        >
          <AutoAwesomeRounded />
        </Box>

        <Typography
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: {
              xs: "15px",
              md: "17px",
            },
            fontWeight: 900,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            maxWidth: 470,
            color:
              "var(--color-muted)",
            fontSize: "9.5px",
            lineHeight: 1.8,
          }}
        >
          {description}
        </Typography>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={0.8}
          sx={{
            pt: 0.6,
            width: "100%",
            maxWidth: 560,
          }}
        >
          {[
            {
              number: "1",
              title: "اختر الفصل",
              text: "من خانة الفصل بالأعلى",
            },
            {
              number: "2",
              title: "حدد الترم",
              text: "سيتم اقتراح الترم تلقائياً",
            },
            {
              number: "3",
              title: "ابدأ الإضافة",
              text: "اضغط + داخل أي خانة فارغة",
            },
          ].map((step) => (
            <Box
              key={step.number}
              sx={{
                flex: 1,
                minWidth: 0,
                p: 1.1,
                borderRadius:
                  "14px",
                backgroundColor:
                  "rgba(36,74,112,0.035)",
                border:
                  "1px solid rgba(36,74,112,0.055)",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  mx: "auto",
                  mb: 0.55,
                  display: "grid",
                  placeItems: "center",
                  borderRadius:
                    "9px",
                  color:
                    "var(--color-white)",
                  background:
                    "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                {step.number}
              </Box>

              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                {step.title}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color:
                    "var(--color-muted)",
                  fontSize: "7.5px",
                  lineHeight: 1.55,
                }}
              >
                {step.text}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  </Box>
);

const ScheduleLoading = () => (
  <Box
    sx={{
      minHeight: 250,
      display: "grid",
      placeItems: "center",
    }}
  >
    <Stack
      alignItems="center"
      spacing={1}
    >
      <CircularProgress
        size={30}
        sx={{
          color:
            "var(--color-gold-dark)",
        }}
      />

      <Typography
        sx={{
          color:
            "var(--color-muted)",
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        جاري تحميل الجدول...
      </Typography>
    </Stack>
  </Box>
);

export default List;
