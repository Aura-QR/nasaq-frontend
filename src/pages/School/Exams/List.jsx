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
  AssignmentRounded,
  FileDownloadOutlined,
  GroupsRounded,
  MenuBookRounded,
  RestartAltRounded,
  SchoolRounded,
  SearchOffRounded,
  TaskAltRounded,
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

import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useExams } from "@/utils/hooks/apis/useExams";
import usePermissions from "@/utils/hooks/usePermissions";

import { deleteExam, fetchSingleExam } from "@/APIs/school/exams";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchTermsByAcademicYear } from "@/APIs/school/lectures";

import MCQExams from "@/utils/constants/MCQExams";

import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";
import TaskIcon from "@mui/icons-material/Task";

const TABLE_HEADERS = [
  "المادة",
  "المعلم",
  "السنة الدراسية",
  "نوع الاختبار",
  "تاريخ البدء",
  "تاريخ الانتهاء",
  "المدة (دقيقة)",
];

const TABLE_BODY = [
  "subject",
  "createdBy",
  "academicYear",
  "examType",
  "startDate",
  "endDate",
  "duration",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي الاختبارات",
    icon: <AssignmentRounded />,
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
    key: "classes",
    label: "الفصول المرتبطة",
    icon: <GroupsRounded />,
  },
];

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value?._id ||
        value?.id ||
        value?.value ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const getResponseData = (response) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractList = (response) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return [];
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.results,
      payload?.rows,
      payload?.records,
      payload?.academicYears,
      payload?.years,
      payload?.terms,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const getExamTypeLabel = (value) =>
  MCQExams.find(
    (exam) =>
      String(exam.id) ===
      String(value)
  )?.value ||
  value ||
  "—";

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

const getOfferingData = (item) => {
  const candidates = [
    item?.subjectOffering,
    item?.gradesCriteria
      ?.subjectOfferingId,
    item?.gradesCriteria
      ?.subjectOffering,
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value === "object"
    ) || null
  );
};

const getSubjectData = (item) => {
  const offering =
    getOfferingData(item);

  const candidates = [
    offering?.subjectId,
    offering?.subject,
    item?.gradesCriteria?.subjectId,
    item?.subjectId,
    item?.subject,
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value === "object"
    ) || null
  );
};

const getSubjectId = (item) => {
  const subject = getSubjectData(item);
  const offering =
    getOfferingData(item);

  return normalizeId(
    subject ||
      offering?.subjectId ||
      offering?.subject ||
      item?.subjectId ||
      item?.subject
  );
};

const getTermId = (item) => {
  const offering =
    getOfferingData(item);

  return normalizeId(
    offering?.termId ||
      offering?.term ||
      item?.termId ||
      item?.term
  );
};

const getAcademicYearId = (
  item,
  termYearMap
) => {
  const direct = [
    item?.academicYearId,
    item?.gradesCriteria
      ?.academicYearId,
    getOfferingData(item)
      ?.academicYearId,
  ]
    .map(normalizeId)
    .find(Boolean);

  if (direct) {
    return direct;
  }

  const termId = getTermId(item);
  return (
    termYearMap.get(termId)?.id ||
    ""
  );
};

const getAcademicYearName = (
  item,
  termYearMap,
  academicYearMap
) => {
  const directObjects = [
    item?.academicYearId,
    item?.academicYear,
    item?.gradesCriteria
      ?.academicYearId,
    item?.gradesCriteria
      ?.academicYear,
    getOfferingData(item)
      ?.academicYearId,
  ];

  for (const value of directObjects) {
    if (
      value &&
      typeof value === "object"
    ) {
      const label =
        value?.name ||
        value?.label ||
        value?.title;

      if (label) {
        return label;
      }
    }
  }

  const yearId = getAcademicYearId(
    item,
    termYearMap
  );

  if (yearId) {
    return (
      academicYearMap.get(yearId)
        ?.name ||
      academicYearMap.get(yearId)
        ?.label ||
      "—"
    );
  }

  if (
    typeof item?.academicYear ===
      "string" &&
    item.academicYear.trim()
  ) {
    return item.academicYear;
  }

  return "—";
};

const getClassList = (item) =>
  getArray(
    item?.classes?.length
      ? item.classes
      : item?.classIds
  );

const getClassLabel = (classItem) => {
  if (
    !classItem ||
    typeof classItem === "string"
  ) {
    return "";
  }

  const room =
    classItem?.roomNumber ||
    classItem?.name ||
    "";

  const gender =
    classItem?.gender === "female"
      ? "بنات"
      : classItem?.gender === "male"
      ? "بنين"
      : "";

  return [room, gender]
    .filter(Boolean)
    .join(" - ");
};

const mapExams = (
  data = [],
  detailsMap = new Map(),
  termYearMap = new Map(),
  academicYearMap = new Map()
) =>
  getArray(data).map((baseItem) => {
    const id = normalizeId(baseItem);
    const detail =
      detailsMap.get(id) || null;

    const item = detail
      ? {
          ...baseItem,
          ...detail,
        }
      : baseItem;

    const subjectData =
      getSubjectData(item) || {};

    const subjectName =
      subjectData?.subjectName ||
      subjectData?.name ||
      item?.subjectName ||
      "—";

    const subjectCode =
      subjectData?.subjectCode ||
      subjectData?.code ||
      item?.subjectCode ||
      "";

    const classes =
      getClassList(item);

    return {
      id:
        item?._id || item?.id || id,
      subjectOfferingId:
        normalizeId(
          item?.subjectOfferingId ||
            getOfferingData(item)
        ),
      subjectId:
        getSubjectId(item),
      subject: subjectCode
        ? `${subjectName} - ${subjectCode}`
        : subjectName,
      createdBy:
        item?.createdBy?.name ||
        item?.createdBy?.username ||
        item?.createdByName ||
        "—",
      academicYearId:
        getAcademicYearId(
          item,
          termYearMap
        ),
      academicYear:
        getAcademicYearName(
          item,
          termYearMap,
          academicYearMap
        ),
      termId: getTermId(item),
      examTypeValue:
        item?.examType || "",
      examType:
        getExamTypeLabel(
          item?.examType
        ),
      startDate: formatDate(
        item?.startDate
      ),
      endDate: formatDate(
        item?.endDate
      ),
      duration:
        item?.duration ?? "—",
      classIds: classes
        .map(normalizeId)
        .filter(Boolean),
      classOptions: classes
        .map((classItem) => ({
          id: normalizeId(classItem),
          label:
            getClassLabel(classItem),
        }))
        .filter(
          (classItem) =>
            classItem.id
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

  const [
    classFilter,
    setClassFilter,
  ] = useState("");

  const [
    examType,
    setExamType,
  ] = useState("");

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [
    termYearMap,
    setTermYearMap,
  ] = useState(new Map());

  const [
    examDetailsMap,
    setExamDetailsMap,
  ] = useState(new Map());

  const filters = useMemo(
    () => ({
      page,
      limit,
      academicYearId:
        academicYear || undefined,
      subjectId:
        subject || undefined,
      classId:
        classFilter || undefined,
      examType:
        examType || undefined,
    }),
    [
      page,
      limit,
      subject,
      academicYear,
      classFilter,
      examType,
    ]
  );

  const {
    exams,
    loading,
    pagination,
  } = useExams(filters);

  const {
    subjects = [],
    loading: loadingSubjects,
  } = useSubjects({
    page: 1,
    limit: 1000,
  });

  const academicYearMap =
    useMemo(
      () =>
        new Map(
          academicYears.map(
            (year) => [
              year.id,
              year,
            ]
          )
        ),
      [academicYears]
    );

  const permissions =
    usePermissions("exams");

  useEffect(() => {
    let active = true;

    const loadAcademicStructure =
      async () => {
        try {
          const response =
            await fetchAcademicYears();

          if (
            !active ||
            response?.status === false
          ) {
            return;
          }

          const years =
            extractList(response)
              .map((year) => ({
                id: normalizeId(year),
                name:
                  year?.name ||
                  year?.label ||
                  year?.title ||
                  "سنة دراسية",
              }))
              .filter(
                (year) => year.id
              );

          setAcademicYears(years);

          const termPairs =
            await Promise.all(
              years.map(async (year) => {
                const termsResponse =
                  await fetchTermsByAcademicYear(
                    year.id
                  );

                if (
                  termsResponse?.status ===
                  false
                ) {
                  return [];
                }

                return extractList(
                  termsResponse
                )
                  .map((term) => [
                    normalizeId(term),
                    year,
                  ])
                  .filter(
                    ([termId]) =>
                      Boolean(termId)
                  );
              })
            );

          if (!active) {
            return;
          }

          setTermYearMap(
            new Map(
              termPairs.flat()
            )
          );
        } catch {
          if (active) {
            setAcademicYears([]);
            setTermYearMap(
              new Map()
            );
          }
        }
      };

    loadAcademicStructure();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const list = getArray(exams);

    const missing = list.filter(
      (item) => {
        const id = normalizeId(item);

        if (
          !id ||
          examDetailsMap.has(id)
        ) {
          return false;
        }

        const subject =
          getSubjectData(item);

        const hasSubject =
          Boolean(
            subject?.subjectName ||
              subject?.name
          );

        const hasTerm =
          Boolean(getTermId(item));

        return !(
          hasSubject && hasTerm
        );
      }
    );

    if (missing.length === 0) {
      return undefined;
    }

    const loadDetails = async () => {
      const pairs =
        await Promise.all(
          missing.map(async (item) => {
            const id =
              normalizeId(item);

            const response =
              await fetchSingleExam(id);

            if (
              response?.status === false ||
              typeof response ===
                "string"
            ) {
              return null;
            }

            const detail =
              getResponseData(response);

            return detail &&
              typeof detail === "object"
              ? [id, detail]
              : null;
          })
        );

      if (!active) {
        return;
      }

      const validPairs =
        pairs.filter(Boolean);

      if (validPairs.length === 0) {
        return;
      }

      setExamDetailsMap(
        (previous) => {
          const next =
            new Map(previous);

          validPairs.forEach(
            ([id, detail]) =>
              next.set(id, detail)
          );

          return next;
        }
      );
    };

    loadDetails();

    return () => {
      active = false;
    };
  }, [exams, examDetailsMap]);

  useEffect(() => {
    setItems(
      mapExams(
        exams,
        examDetailsMap,
        termYearMap,
        academicYearMap
      )
    );
  }, [
    exams,
    examDetailsMap,
    termYearMap,
    academicYearMap,
  ]);

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
    classFilter,
    examType,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    subject,
    academicYear,
    classFilter,
    examType,
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
      classes: new Set(
        items.flatMap(
          (item) =>
            item.classIds
        )
      ).size,
    }),
    [
      items,
      currentPagination,
    ]
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

  const classOptions =
    useMemo(() => {
      const map = new Map();

      items.forEach((item) => {
        getArray(
          item.classOptions
        ).forEach((classItem) => {
          if (
            classItem.id &&
            !map.has(classItem.id)
          ) {
            map.set(
              classItem.id,
              {
                value: classItem.id,
                label:
                  classItem.label ||
                  classItem.id,
              }
            );
          }
        });
      });

      return Array.from(
        map.values()
      );
    }, [items]);

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        المادة: item.subject,
        المعلم:
          item.createdBy,
        "السنة الدراسية":
          item.academicYear,
        "نوع الاختبار":
          item.examType,
        "تاريخ البدء":
          item.startDate,
        "تاريخ الانتهاء":
          item.endDate,
        "المدة بالدقائق":
          item.duration,
      })),
    [items]
  );

  const resetFilters = () => {
    setSubject("");
    setAcademicYear("");
    setClassFilter("");
    setExamType("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    try {
      const response =
        await deleteExam(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف الاختبار"
        );
        return;
      }

      toast.success(
        "تم حذف الاختبار بنجاح"
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
          "حدث خطأ أثناء حذف الاختبار"
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
                  إدارة الاختبارات
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
                أنشئ الاختبارات واربطها
                بالمواد والفصول وحدّد
                مواعيدها ومدتها.
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
                filename="exams.csv"
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
                      sm: 170,
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
                  إضافة اختبار
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
                والفصل والنوع للوصول
                إلى الاختبار المطلوب.
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
                xl:
                  "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
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
                subjectOptions
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
              options={academicYears.map(
                (year) => ({
                  value: year.id,
                  label: year.name,
                })
              )}
            />

            <SelectFilter
              value={classFilter}
              onChange={setClassFilter}
              label="الفصل"
              icon={SchoolIcon}
              allLabel="جميع الفصول"
              options={classOptions}
            />

            <SelectFilter
              value={examType}
              onChange={setExamType}
              label="نوع الاختبار"
              icon={TaskIcon}
              allLabel="جميع الاختبارات"
              options={MCQExams.map(
                (item) => ({
                  value: item.id,
                  label: item.value,
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
              قائمة الاختبارات
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح تفاصيل الاختبار أو
              عدّل بياناته حسب
              صلاحياتك.
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
                    <TaskAltRounded />
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
                    ? "لا توجد اختبارات مطابقة للفلاتر"
                    : "لا توجد اختبارات حتى الآن"}
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
                    : "أضف أول اختبار لبدء تقييم الطلاب."}
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
                      إضافة أول اختبار
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
                    label="عدد الاختبارات"
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
