import {
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Stack,
  TextField,
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
  TuneRounded,
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

import { useExams } from "@/utils/hooks/apis/useExams";
import { useTeachers } from "@/utils/hooks/apis/useTeachers";
import usePermissions from "@/utils/hooks/usePermissions";

import { deleteExam, fetchSingleExam } from "@/APIs/school/exams";
import { fetchClassesList } from "@/APIs/school/classes";
import { fetchSubjectOfferings } from "@/APIs/school/subjectOfferings";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchTermsByAcademicYear } from "@/APIs/school/lectures";

import MCQExams from "@/utils/constants/MCQExams";

import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";
import TaskIcon from "@mui/icons-material/Task";
import Person2Icon from "@mui/icons-material/Person2";
import GradeIcon from "@mui/icons-material/Grade";

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
      payload?.classes,
      payload?.offerings,
      payload?.subjectOfferings,
      payload?.gradesCriteria,
      payload?.criteria,
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
    item?.subjectOfferingId,
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


const getOfferingLabel = (item) => {
  if (!item) return "عرض مادة";

  const subject =
    item?.subjectId && typeof item.subjectId === "object"
      ? item.subjectId
      : item?.subject && typeof item.subject === "object"
      ? item.subject
      : null;

  const gradeLevel =
    item?.gradeLevelId && typeof item.gradeLevelId === "object"
      ? item.gradeLevelId
      : item?.gradeLevel && typeof item.gradeLevel === "object"
      ? item.gradeLevel
      : null;

  const term =
    item?.termId && typeof item.termId === "object"
      ? item.termId
      : item?.term && typeof item.term === "object"
      ? item.term
      : null;

  const subjectName =
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    item?.name ||
    "مادة";

  const subjectCode =
    subject?.subjectCode ||
    subject?.code ||
    item?.subjectCode ||
    "";

  const gradeName =
    gradeLevel?.name ||
    gradeLevel?.label ||
    "";

  const termName =
    term?.name ||
    term?.label ||
    "";

  return [
    subjectCode
      ? `${subjectName} - \u2066${subjectCode}\u2069`
      : subjectName,
    gradeName,
    termName,
  ]
    .filter(Boolean)
    .join(" · ");
};

const getCriteriaLabel = (item) => {
  if (!item) return "معيار درجات";

  const offering =
    item?.subjectOfferingId && typeof item.subjectOfferingId === "object"
      ? item.subjectOfferingId
      : item?.subjectOffering && typeof item.subjectOffering === "object"
      ? item.subjectOffering
      : null;

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    item?.subjectId ||
    item?.subject ||
    null;

  const subjectName =
    subject && typeof subject === "object"
      ? subject?.subjectName ||
        subject?.name ||
        "مادة"
      : "مادة";

  return `${subjectName} · معيار الدرجات`;
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
        ? `${subjectName} - \u2066${subjectCode}\u2069`
        : subjectName,
      createdById:
        normalizeId(item?.createdBy),
      createdBy:
        item?.createdBy?.name ||
        item?.createdBy?.username ||
        item?.createdByName ||
        "—",
      gradesCriteriaId:
        normalizeId(
          item?.gradesCriteriaId ||
          item?.gradesCriteria
        ),
      grade:
        item?.grade ??
        item?.totalGrade ??
        item?.maxGrade ??
        "—",
      questionsCount:
        getArray(item?.questions).length,
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

  // ============================================
  // API-aligned filters
  // ============================================

  const [
    subjectOfferingId,
    setSubjectOfferingId,
  ] = useState("");

  const [
    classFilter,
    setClassFilter,
  ] = useState("");

  const [
    examType,
    setExamType,
  ] = useState("");

  const [
    createdBy,
    setCreatedBy,
  ] = useState("");

  const [grade, setGrade] =
    useState("");

  const [
    gradesCriteriaId,
    setGradesCriteriaId,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    duration,
    setDuration,
  ] = useState("");

  const [
    showAdvancedFilters,
    setShowAdvancedFilters,
  ] = useState(false);

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  // These are used only to resolve readable labels in the table,
  // not as filters for GET /exams.
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

  const [
    subjectOfferingOptions,
    setSubjectOfferingOptions,
  ] = useState([]);

  const [
    classOptions,
    setClassOptions,
  ] = useState([]);

  const [
    criteriaOptions,
    setCriteriaOptions,
  ] = useState([]);

  const [
    loadingFilterOptions,
    setLoadingFilterOptions,
  ] = useState(true);

  const [
    loadingSubjectOfferings,
    setLoadingSubjectOfferings,
  ] = useState(true);

  const filters = useMemo(
    () => ({
      page,
      limit,
      subjectOfferingId:
        subjectOfferingId || undefined,

      // The schema field is classIds, not classId.
      // We send the selected id using the exact API key.
      classIds:
        classFilter || undefined,

      examType:
        examType || undefined,

      createdBy:
        createdBy || undefined,

      grade:
        grade === ""
          ? undefined
          : Number(grade),

      gradesCriteriaId:
        gradesCriteriaId || undefined,

      startDate:
        startDate || undefined,

      endDate:
        endDate || undefined,

      duration:
        duration === ""
          ? undefined
          : Number(duration),
    }),
    [
      page,
      limit,
      subjectOfferingId,
      classFilter,
      examType,
      createdBy,
      grade,
      gradesCriteriaId,
      startDate,
      endDate,
      duration,
    ]
  );

  const {
    exams,
    loading,
    pagination,
  } = useExams(filters);

  const {
    teachers = [],
    loading: loadingTeachers,
  } = useTeachers({
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

  // Load filters that have a direct list endpoint.
  // Subject offerings are loaded separately after resolving academic terms,
  // because the documented backend endpoint is /subject-offerings/by-term/:termId.
  useEffect(() => {
    let active = true;

    const loadFilterOptions = async () => {
      setLoadingFilterOptions(true);

      try {
        const [
          classesResponse,
          criteriaResponse,
        ] = await Promise.allSettled([
          fetchClassesList(),
          fetchGradesCriteria({
            page: 1,
            limit: 1000,
          }),
        ]);

        if (!active) {
          return;
        }

        const classes =
          classesResponse.status === "fulfilled"
            ? extractList(classesResponse.value)
            : [];

        setClassOptions(
          classes
            .map((item) => ({
              value: normalizeId(item),
              label:
                getClassLabel(item) ||
                item?.name ||
                item?.roomNumber ||
                normalizeId(item),
            }))
            .filter((item) => item.value)
        );

        const criteria =
          criteriaResponse.status === "fulfilled"
            ? extractList(criteriaResponse.value)
            : [];

        setCriteriaOptions(
          criteria
            .map((item) => ({
              value: normalizeId(item),
              label: getCriteriaLabel(item),
            }))
            .filter((item) => item.value)
        );
      } finally {
        if (active) {
          setLoadingFilterOptions(false);
        }
      }
    };

    loadFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAcademicStructure = async () => {
      setLoadingSubjectOfferings(true);

      try {
        const response = await fetchAcademicYears();

        if (
          !active ||
          response?.status === false
        ) {
          return;
        }

        const years = extractList(response)
          .map((year) => ({
            id: normalizeId(year),
            name:
              year?.name ||
              year?.label ||
              year?.title ||
              "سنة دراسية",
          }))
          .filter((year) => year.id);

        setAcademicYears(years);

        const termPairs = await Promise.all(
          years.map(async (year) => {
            const termsResponse =
              await fetchTermsByAcademicYear(year.id);

            if (
              termsResponse?.status === false
            ) {
              return [];
            }

            return extractList(termsResponse)
              .map((term) => [
                normalizeId(term),
                year,
              ])
              .filter(([termId]) => Boolean(termId));
          })
        );

        if (!active) {
          return;
        }

        const flatTermPairs = termPairs.flat();
        const nextTermYearMap = new Map(flatTermPairs);
        setTermYearMap(nextTermYearMap);

        const termIds = [
          ...new Set(
            flatTermPairs
              .map(([termId]) => termId)
              .filter(Boolean)
          ),
        ];

        let offerings = [];

        // First try the legacy all-offerings endpoint when it exists.
        // If the backend does not expose it (the documented API usually doesn't),
        // fall back to the supported by-term endpoint for every available term.
        const listResponse =
          await fetchSubjectOfferings(
            {},
            { forceListEndpoint: true }
          );

        if (
          listResponse?.status !== false
        ) {
          offerings = extractList(listResponse);
        }

        if (
          offerings.length === 0 &&
          termIds.length > 0
        ) {
          const offeringResponses =
            await Promise.allSettled(
              termIds.map((termId) =>
                fetchSubjectOfferings({ termId })
              )
            );

          offerings = offeringResponses.flatMap(
            (result) =>
              result.status === "fulfilled" &&
              result.value?.status !== false
                ? extractList(result.value)
                : []
          );
        }

        if (!active) {
          return;
        }

        const uniqueOfferings = Array.from(
          new Map(
            offerings
              .map((item) => [
                normalizeId(item),
                item,
              ])
              .filter(([id]) => Boolean(id))
          ).values()
        );

        setSubjectOfferingOptions(
          uniqueOfferings.map((item) => ({
            value: normalizeId(item),
            label: getOfferingLabel(item),
          }))
        );
      } catch (error) {
        if (active) {
          setAcademicYears([]);
          setTermYearMap(new Map());
          setSubjectOfferingOptions([]);

          console.error(
            "Failed to load academic structure / subject offerings:",
            error
          );
        }
      } finally {
        if (active) {
          setLoadingSubjectOfferings(false);
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
    subjectOfferingId,
    classFilter,
    examType,
    createdBy,
    grade,
    gradesCriteriaId,
    startDate,
    endDate,
    duration,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    subjectOfferingId,
    classFilter,
    examType,
    createdBy,
    grade,
    gradesCriteriaId,
    startDate,
    endDate,
    duration,
  ].filter(
    (value) =>
      value !== "" &&
      value !== null &&
      value !== undefined
  ).length;

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
              item.subjectOfferingId ||
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

  const creatorOptions =
    useMemo(() => {
      const map = new Map();

      getArray(teachers).forEach(
        (teacherItem) => {
          const id =
            normalizeId(
              teacherItem
            );

          if (!id) return;

          map.set(id, {
            value: id,
            label:
              teacherItem?.name ||
              teacherItem?.username ||
              teacherItem?.email ||
              id,
          });
        }
      );

      items.forEach((item) => {
        if (
          item.createdById &&
          !map.has(
            item.createdById
          )
        ) {
          map.set(
            item.createdById,
            {
              value:
                item.createdById,
              label:
                item.createdBy ||
                item.createdById,
            }
          );
        }
      });

      return Array.from(
        map.values()
      );
    }, [teachers, items]);

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
        الدرجة:
          item.grade,
        "عدد الأسئلة":
          item.questionsCount,
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
    setSubjectOfferingId("");
    setClassFilter("");
    setExamType("");
    setCreatedBy("");
    setGrade("");
    setGradesCriteriaId("");
    setStartDate("");
    setEndDate("");
    setDuration("");
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
            mb: 1.1,
            px: {
              xs: 1.15,
              md: 1.4,
            },
            py: 1,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "15px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 7px 18px rgba(18,47,77,0.04)",

            "& .MuiFormControl-root":
              {
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
                borderRadius: "10px",
                fontSize: "9.5px",
              },

            "& .MuiInputLabel-root":
              {
                px: 0.5,
                backgroundColor:
                  "var(--color-cream)",
                fontSize: "9px",
                fontWeight: 700,
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
            justifyContent="space-between"
            gap={0.9}
            sx={{ mb: 0.9 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.7}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(36,74,112,0.055)",
                  borderRadius: "9px",
                }}
              >
                <TuneRounded
                  sx={{ fontSize: 17 }}
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
                  تصفية الاختبارات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.05,
                    color:
                      "var(--color-muted)",
                    fontSize: "7.5px",
                  }}
                >
                  الفلاتر مرتبطة مباشرة
                  بحقول الاختبار في الـ API.
                </Typography>
              </Box>

              {activeFiltersCount > 0 && (
                <Chip
                  label={
                    activeFiltersCount
                  }
                  size="small"
                  sx={{
                    height: 22,
                    minWidth: 22,
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    fontSize: "7px",
                    fontWeight: 900,
                  }}
                />
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={0.6}
              useFlexGap
              flexWrap="wrap"
            >
              <Button
                type="button"
                onClick={() =>
                  setShowAdvancedFilters(
                    (value) => !value
                  )
                }
                variant="text"
                startIcon={
                  <TuneRounded />
                }
                sx={{
                  minHeight: 32,
                  px: 1,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    showAdvancedFilters
                      ? "rgba(36,74,112,0.09)"
                      : "rgba(36,74,112,0.045)",
                  borderRadius: "9px",
                  fontSize: "8px",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon":
                    {
                      marginLeft: "4px",
                      marginRight: 0,
                    },
                }}
              >
                {showAdvancedFilters
                  ? "إخفاء المتقدم"
                  : "فلاتر متقدمة"}
              </Button>

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
                  minHeight: 32,
                  px: 1,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(36,74,112,0.045)",
                  borderRadius: "9px",
                  fontSize: "8px",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon":
                    {
                      marginLeft: "4px",
                      marginRight: 0,
                    },
                }}
              >
                مسح
              </Button>
            </Stack>
          </Stack>

          {/* Primary API fields */}
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
              gap: 0.8,
              minWidth: 0,
              "& > *": {
                minWidth: 0,
              },
            }}
          >
            <SelectFilter
              value={
                subjectOfferingId
              }
              onChange={
                setSubjectOfferingId
              }
              label="عرض المادة"
              icon={SubjectIcon}
              allLabel="كل عروض المواد"
              options={
                subjectOfferingOptions
              }
            />

            <SelectFilter
              value={classFilter}
              onChange={setClassFilter}
              label="الفصل"
              icon={SchoolIcon}
              allLabel="كل الفصول"
              disabled={
                loadingFilterOptions
              }
              options={classOptions}
            />

            <SelectFilter
              value={examType}
              onChange={setExamType}
              label="نوع الاختبار"
              icon={TaskIcon}
              allLabel="كل الأنواع"
              options={MCQExams.map(
                (item) => ({
                  value: item.id,
                  label: item.value,
                })
              )}
            />

            <SelectFilter
              value={createdBy}
              onChange={setCreatedBy}
              label="أنشأه"
              icon={Person2Icon}
              allLabel="كل المعلمين"
              disabled={
                loadingTeachers
              }
              options={creatorOptions}
            />
          </Box>

          <Collapse
            in={showAdvancedFilters}
            timeout="auto"
            unmountOnExit
          >
            <Box
              sx={{
                mt: 0.9,
                pt: 0.9,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm:
                    "repeat(2, minmax(0, 1fr))",
                  lg:
                    "repeat(5, minmax(0, 1fr))",
                },
                gap: 0.8,
                borderTop:
                  "1px solid rgba(36,74,112,0.07)",
                minWidth: 0,
                "& > *": {
                  minWidth: 0,
                },
              }}
            >
              <TextField
                type="date"
                label="من تاريخ"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                type="date"
                label="إلى تاريخ"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                type="number"
                label="المدة بالدقائق"
                value={duration}
                onChange={(event) =>
                  setDuration(
                    event.target.value
                  )
                }
                inputProps={{
                  min: 1,
                }}
              />

              <TextField
                type="number"
                label="الدرجة"
                value={grade}
                onChange={(event) =>
                  setGrade(
                    event.target.value
                  )
                }
                inputProps={{
                  min: 0,
                }}
              />

              <SelectFilter
                value={
                  gradesCriteriaId
                }
                onChange={
                  setGradesCriteriaId
                }
                label="معيار الدرجات"
                icon={GradeIcon}
                allLabel="كل المعايير"
                disabled={
                  loadingFilterOptions
                }
                options={
                  criteriaOptions
                }
              />
            </Box>
          </Collapse>
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
