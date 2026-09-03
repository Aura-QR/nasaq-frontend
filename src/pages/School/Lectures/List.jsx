import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
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
import FeasibilityPanel from "./FeasibilityPanel";
import GenerateTimetablePanel from "./GenerateTimetablePanel";

import { api } from "@/APIs/Axios";

import {
  copyLectureSchedule,
  deleteLecture,
  fetchLectures,
  fetchTermsByAcademicYear,
} from "@/APIs/school/lectures";

import { fetchClassesList } from "@/APIs/school/classes";
import { fetchAcademicYears } from "@/APIs/school/academicYears";

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

const extractAcademicYears = (response) => {
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
      payload?.academicYears,
      payload?.years,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const getAcademicYearLabel = (item) =>
  item?.name ||
  item?.title ||
  item?.label ||
  "سنة دراسية";

const getBucketCount = (value) => {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const nested = [
      value?.items,
      value?.docs,
      value?.results,
      value?.records,
    ].find(Array.isArray);

    if (nested) {
      return nested.length;
    }
  }

  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric
    : 0;
};

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

  // الصفحة أصلًا تعرض فصول السنة الدراسية الحالية فقط،
  // لذلك لا نعرض academicYearId حتى لا يظهر ObjectId للمستخدم.
  const gender =
    item?.gender === "male"
      ? "بنين"
      : item?.gender === "female"
      ? "بنات"
      : "";

  const rawClassName = String(
    item?.name ||
      item?.title ||
      item?.label ||
      ""
  ).trim();

  // بعض أسماء الفصول تأتي مثل: "أولى متوسط/بنات".
  // نحذف نوع الطلاب من الاسم ثم نضيفه مرة واحدة بشكل واضح في النهاية.
  const className = rawClassName
    .replace(/\s*[\/|\-–—]\s*(بنين|بنات)\s*$/u, "")
    .trim();

  const roomNumber = String(
    item?.roomNumber || ""
  ).trim();

  const roomLabel =
    roomNumber &&
    roomNumber !== className &&
    !className.includes(roomNumber)
      ? `فصل ${roomNumber}`
      : "";

  return (
    [className, roomLabel, gender]
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index
      )
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

  const [
    automationOpen,
    setAutomationOpen,
  ] = useState(false);

  const [
    automationScope,
    setAutomationScope,
  ] = useState("current");

  const [
    copyOpen,
    setCopyOpen,
  ] = useState(false);

  const [
    copyLoading,
    setCopyLoading,
  ] = useState(false);

  const [
    copyYears,
    setCopyYears,
  ] = useState([]);

  const [
    copyYearsLoading,
    setCopyYearsLoading,
  ] = useState(false);

  const [
    copySourceYearId,
    setCopySourceYearId,
  ] = useState("");

  const [
    copySourceTermId,
    setCopySourceTermId,
  ] = useState("");

  const [
    copySourceTerms,
    setCopySourceTerms,
  ] = useState([]);

  const [
    copySourceTermsLoading,
    setCopySourceTermsLoading,
  ] = useState(false);

  const [
    copyTargetTermId,
    setCopyTargetTermId,
  ] = useState("");

  const [
    copyResult,
    setCopyResult,
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

      try {
        const [
          classesResponse,
          activeYearResponse,
        ] = await Promise.all([
          fetchClassesList(),
          api
            .get(
              "/academic-years/active"
            )
            .catch(() => null),
        ]);

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

        const allRows =
          extractList(classesResponse);

        const activeYear =
          unwrapData(
            activeYearResponse
          );

        const activeYearId =
          getId(activeYear);

        const rows = activeYearId
          ? allRows.filter(
              (item) =>
                getId(
                  getAcademicYear(
                    item
                  )
                ) ===
                activeYearId
            )
          : allRows;

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
          setTermId("");
          setDefaultTermId("");

          localStorage.removeItem(
            "nasaq:lectures:lastClassId"
          );

          localStorage.removeItem(
            "nasaq:lectures:lastTermId"
          );
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setClassRows([]);
        toast.error(
          error?.response?.data
            ?.message ||
            "تعذر تحميل فصول السنة الدراسية الحالية"
        );
      } finally {
        if (mounted) {
          setClassesLoading(false);
        }
      }
    };

    loadClasses();

    return () => {
      mounted = false;
    };
  }, [classFilter]);

  const safeClassFilter =
    useMemo(
      () =>
        classRows.some(
          (item) =>
            getId(item) ===
            classFilter
        )
          ? classFilter
          : "",
      [classRows, classFilter]
    );

  const selectedClass =
    useMemo(
      () =>
        classRows.find(
          (item) =>
            getId(item) ===
            safeClassFilter
        ) || null,
      [
        classRows,
        safeClassFilter,
      ]
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

  const openCopySchedule = () => {
    if (!permissions.add) {
      return;
    }

    if (
      !selectedClassAcademicYearId ||
      !termOptions.length
    ) {
      toast.info(
        "اختر فصلًا يحتوي على سنة دراسية وترمات أولًا"
      );
      return;
    }

    setCopyTargetTermId(
      termId ||
        defaultTermId ||
        termOptions[0]?.value ||
        ""
    );

    setCopySourceYearId("");
    setCopySourceTermId("");
    setCopySourceTerms([]);
    setCopyResult(null);
    setCopyOpen(true);
  };

  useEffect(() => {
    let mounted = true;

    const loadCopyYears = async () => {
      if (!copyOpen) {
        return;
      }

      setCopyYearsLoading(true);

      try {
        const response =
          await fetchAcademicYears();

        if (!mounted) {
          return;
        }

        if (response?.status === false) {
          setCopyYears([]);
          toast.error(
            response?.message ||
              "تعذر تحميل السنوات الدراسية"
          );
          return;
        }

        const years =
          extractAcademicYears(
            response
          );

        setCopyYears(years);

        const targetYearId =
          selectedClassAcademicYearId;

        const sameYearHasOtherTerm =
          termOptions.some(
            (item) =>
              item.value !==
              (copyTargetTermId ||
                termId)
          );

        const defaultSourceYear =
          sameYearHasOtherTerm
            ? targetYearId
            : getId(
                years.find(
                  (item) =>
                    getId(item) !==
                    targetYearId
                )
              );

        setCopySourceYearId(
          (current) =>
            current ||
            defaultSourceYear ||
            targetYearId ||
            ""
        );
      } catch (error) {
        if (mounted) {
          setCopyYears([]);
          toast.error(
            error?.response?.data
              ?.message ||
              "تعذر تحميل السنوات الدراسية"
          );
        }
      } finally {
        if (mounted) {
          setCopyYearsLoading(false);
        }
      }
    };

    loadCopyYears();

    return () => {
      mounted = false;
    };
  }, [
    copyOpen,
    selectedClassAcademicYearId,
    termOptions,
    copyTargetTermId,
    termId,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadSourceTerms = async () => {
      if (
        !copyOpen ||
        !copySourceYearId
      ) {
        setCopySourceTerms([]);
        setCopySourceTermId("");
        setCopySourceTermsLoading(false);
        return;
      }

      setCopySourceTermsLoading(true);

      try {
        const response =
          await fetchTermsByAcademicYear(
            copySourceYearId,
            { force: true }
          );

        if (!mounted) {
          return;
        }

        if (response?.status === false) {
          setCopySourceTerms([]);
          setCopySourceTermId("");
          toast.error(
            response?.message ||
              "تعذر تحميل ترمات السنة المصدر"
          );
          return;
        }

        const options =
          extractList(response)
            .map(mapTermOption)
            .filter(
              (item) => item.value
            )
            .sort(
              (a, b) =>
                a.order - b.order
            );

        setCopySourceTerms(options);

        setCopySourceTermId(
          (current) => {
            const currentIsValid =
              options.some(
                (item) =>
                  item.value ===
                    current &&
                  !(
                    copySourceYearId ===
                      selectedClassAcademicYearId &&
                    current ===
                      copyTargetTermId
                  )
              );

            if (currentIsValid) {
              return current;
            }

            return (
              options.find(
                (item) =>
                  !(
                    copySourceYearId ===
                      selectedClassAcademicYearId &&
                    item.value ===
                      copyTargetTermId
                  )
              )?.value || ""
            );
          }
        );
      } catch (error) {
        if (mounted) {
          setCopySourceTerms([]);
          setCopySourceTermId("");
          toast.error(
            error?.response?.data
              ?.message ||
              "تعذر تحميل ترمات السنة المصدر"
          );
        }
      } finally {
        if (mounted) {
          setCopySourceTermsLoading(false);
        }
      }
    };

    loadSourceTerms();

    return () => {
      mounted = false;
    };
  }, [
    copyOpen,
    copySourceYearId,
    copyTargetTermId,
    selectedClassAcademicYearId,
  ]);

  const copySummary = useMemo(() => {
    const data =
      copyResult &&
      typeof copyResult === "object"
        ? copyResult
        : {};

    return {
      created: getBucketCount(
        data?.created
      ),
      unresolved: getBucketCount(
        data?.unresolved
      ),
      needsTeacher: getBucketCount(
        data?.needsTeacher
      ),
      teacherConflict:
        getBucketCount(
          data?.teacherConflict
        ),
    };
  }, [copyResult]);

  const handleCopySchedule = async () => {
    if (copyLoading) {
      return;
    }

    if (
      !selectedClassAcademicYearId ||
      !copyTargetTermId ||
      !copySourceTermId
    ) {
      toast.info(
        "اختر الترم المصدر والترم الهدف أولًا"
      );
      return;
    }

    if (
      copyTargetTermId ===
      copySourceTermId
    ) {
      toast.error(
        "الترم المصدر والترم الهدف يجب أن يكونا مختلفين"
      );
      return;
    }

    setCopyLoading(true);
    setCopyResult(null);

    try {
      const response =
        await copyLectureSchedule(
          selectedClassAcademicYearId,
          copyTargetTermId,
          copySourceTermId
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            "تعذر نسخ الجدول الدراسي"
        );
        return;
      }

      const result =
        unwrapData(response) || {};

      setCopyResult(result);

      const refreshed =
        await fetchLectures(
          {
            page: 1,
            limit: 1000,
            classId:
              classFilter ||
              undefined,
            termId:
              copyTargetTermId,
          },
          { force: true }
        );

      if (refreshed?.status) {
        setItems(
          mapLectures(
            refreshed?.data
          )
        );
      }

      setTermId(
        copyTargetTermId
      );

      localStorage.setItem(
        "nasaq:lectures:lastTermId",
        copyTargetTermId
      );

      toast.success(
        `تم نسخ الجدول: ${getBucketCount(
          result?.created
        )} حصة تم إنشاؤها`
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "حدث خطأ أثناء نسخ الجدول الدراسي"
      );
    } finally {
      setCopyLoading(false);
    }
  };


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
          color: "var(--color-text)",
        }}
      >
        {/* =========================================
            SIMPLE HEADER
        ========================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1,
            px: { xs: 1.4, md: 1.8 },
            py: 1.2,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.34))",
            boxShadow: "0 8px 20px rgba(18,47,77,0.045)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: "12px",
                  color: "var(--color-gold-dark)",
                  backgroundColor: "var(--color-gold-soft)",
                  border: "1px solid rgba(211,164,79,0.20)",
                }}
              >
                <CalendarMonthRounded sx={{ fontSize: 22 }} />
              </Box>

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "20px", md: "24px" },
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}
                >
                  الجدول الدراسي
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    color: "var(--color-muted)",
                    fontSize: "9px",
                  }}
                >
                  اختر الفصل ثم أدر الحصص مباشرة من الجدول، أو استخدم الإنشاء التلقائي عند الحاجة.
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
              {permissions.add &&
                selectedClassAcademicYearId &&
                termOptions.length > 0 && (
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AutoAwesomeRounded />}
                    onClick={openCopySchedule}
                    sx={{
                      minHeight: 36,
                      px: 1.25,
                      borderRadius: "10px",
                      color: "var(--color-gold-dark)",
                      backgroundColor: "rgba(255,255,255,0.72)",
                      borderColor: "rgba(211,164,79,0.26)",
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "none",
                      "& .MuiButton-startIcon": {
                        marginLeft: "5px",
                        marginRight: 0,
                      },
                    }}
                  >
                    نسخ الجدول
                  </Button>
                )}

              <Box
                component={CSVLink}
                data={csvData}
                filename="lectures.csv"
                sx={{ display: "inline-flex", textDecoration: "none" }}
              >
                <Button
                  disabled={visibleItems.length === 0}
                  variant="outlined"
                  startIcon={<FileDownloadOutlined />}
                  sx={{
                    minHeight: 36,
                    px: 1.25,
                    borderRadius: "10px",
                    color: "var(--color-navy)",
                    backgroundColor: "rgba(255,255,255,0.72)",
                    borderColor: "rgba(36,74,112,0.14)",
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "5px",
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
            CLASS + PRIMARY ACTION
        ========================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1,
            p: { xs: 1.1, md: 1.25 },
            overflow: "visible",
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 6px 16px rgba(18,47,77,0.035)",
          }}
        >
          <Stack spacing={0.9}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              gap={0.9}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    mb: 0.55,
                    color: "var(--color-navy-deep)",
                    fontSize: "9px",
                    fontWeight: 900,
                  }}
                >
                  الفصل الدراسي
                </Typography>

                <TextField
                  select
                  fullWidth
                  size="small"
                  value={safeClassFilter}
                  disabled={classesLoading}
                  onChange={(event) => {
                    const nextValue = event.target.value || "";
                    setClassFilter(nextValue);
                    setTermId("");
                    setDefaultTermId("");
                    localStorage.removeItem("nasaq:lectures:lastTermId");
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    MenuProps: {
                      PaperProps: { sx: { maxHeight: 320 } },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      minHeight: 42,
                      height: 42,
                      backgroundColor: "var(--color-white)",
                      borderRadius: "11px",
                      fontSize: "10px",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>اختر الفصل لعرض الجدول</em>
                  </MenuItem>

                  {classRows.map((classItem) => {
                    const classId = getId(classItem);

                    return (
                      <MenuItem key={classId} value={classId}>
                        {getClassLabel(classItem)}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>

              {classFilter && selectedTermLabel && (
                <Chip
                  icon={<CalendarMonthRounded />}
                  label={selectedTermLabel}
                  size="small"
                  sx={{
                    alignSelf: { xs: "flex-start", md: "center" },
                    flexShrink: 0,
                    height: 30,
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    border: "1px solid rgba(211,164,79,0.14)",
                    fontSize: "8.5px",
                    fontWeight: 900,
                    "& .MuiChip-icon": {
                      color: "var(--color-gold-dark)",
                      fontSize: 14,
                    },
                  }}
                />
              )}

              {permissions.add && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.7}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{
                    flexShrink: 0,
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<AutoAwesomeRounded />}
                    disabled={!readyForSchedule}
                    onClick={() => {
                      setAutomationScope("current");
                      setAutomationOpen(true);
                    }}
                    sx={{
                      minHeight: 42,
                      px: 1.6,
                      borderRadius: "11px",
                      color: "var(--color-white)",
                      background:
                        "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                      boxShadow: "none",
                      fontSize: "9.5px",
                      fontWeight: 900,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": { boxShadow: "none" },
                      "& .MuiButton-startIcon": {
                        marginLeft: "6px",
                        marginRight: 0,
                      },
                    }}
                  >
                    إنشاء جدول للفصل
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AutoAwesomeRounded />}
                    disabled={!termId || classesLoading || termsLoading}
                    onClick={() => {
                      setAutomationScope("all");
                      setAutomationOpen(true);
                    }}
                    sx={{
                      minHeight: 42,
                      px: 1.6,
                      borderRadius: "11px",
                      color: "var(--color-gold-dark)",
                      backgroundColor: "rgba(255,255,255,0.72)",
                      borderColor: "rgba(211,164,79,0.42)",
                      boxShadow: "none",
                      fontSize: "9.5px",
                      fontWeight: 900,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        borderColor: "var(--color-gold-dark)",
                        backgroundColor: "rgba(251,240,216,0.42)",
                      },
                      "& .MuiButton-startIcon": {
                        marginLeft: "6px",
                        marginRight: 0,
                      },
                    }}
                  >
                    إنشاء جداول كل الفصول
                  </Button>
                </Stack>
              )}
            </Stack>

            {readyForSchedule ? (
              <Stack
                direction="row"
                spacing={0.65}
                useFlexGap
                flexWrap="wrap"
                alignItems="center"
              >
                <Typography
                  sx={{
                    ml: 0.25,
                    color: "var(--color-muted)",
                    fontSize: "8px",
                    fontWeight: 700,
                  }}
                >
                  ملخص الفصل:
                </Typography>
                <MiniInfoChip
                  icon={<CalendarMonthRounded />}
                  label={`${stats.total} حصة`}
                />
                <MiniInfoChip
                  icon={<MenuBookRounded />}
                  label={`${stats.subjects} مواد`}
                />
                <MiniInfoChip
                  icon={<GroupsRounded />}
                  label={`${stats.teachers} معلمين`}
                />
              </Stack>
            ) : (
              <Typography
                sx={{
                  color: "var(--color-muted)",
                  fontSize: "8px",
                }}
              >
                اختر الفصل أولًا، وسيتم تحديد الترم المناسب تلقائيًا.
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* =========================================
            SCHEDULE FIRST
        ========================================= */}

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 10px 24px rgba(18,47,77,0.045)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={0.8}
            sx={{
              px: { xs: 1.3, md: 1.6 },
              py: 1,
              borderBottom: "1px solid rgba(36,74,112,0.07)",
              backgroundColor: "rgba(255,255,255,0.58)",
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={0.6}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  جدول الحصص
                </Typography>

                {selectedClassLabel && (
                  <Tooltip title={selectedClassLabel} arrow>
                    <Chip
                      icon={<SchoolRounded />}
                      label={selectedClassLabel}
                      size="small"
                      sx={{
                        maxWidth: { xs: 210, md: 300 },
                        height: 24,
                        color: "var(--color-navy)",
                        backgroundColor: "rgba(36,74,112,0.055)",
                        fontSize: "7.8px",
                        fontWeight: 800,
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                        "& .MuiChip-icon": {
                          color: "var(--color-navy)",
                          fontSize: 13,
                        },
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.2,
                  color: "var(--color-muted)",
                  fontSize: "8px",
                }}
              >
                اضغط على الخانة الفارغة لإضافة حصة، واضغط على الحصة لتعديلها.
              </Typography>
            </Box>

            {readyForSchedule && permissions.add && (
              <Button
                type="button"
                variant="text"
                startIcon={<AutoAwesomeRounded />}
                onClick={() => {
                  setAutomationScope("current");
                  setAutomationOpen(true);
                }}
                sx={{
                  alignSelf: { xs: "flex-start", sm: "center" },
                  minHeight: 32,
                  px: 1,
                  color: "var(--color-navy)",
                  fontSize: "8.5px",
                  fontWeight: 900,
                  textTransform: "none",
                  "& .MuiButton-startIcon": {
                    marginLeft: "5px",
                    marginRight: 0,
                  },
                }}
              >
                أدوات الإنشاء التلقائي
              </Button>
            )}
          </Stack>

          {!classFilter ? (
            <SchedulePlaceholder
              title="اختر الفصل لعرض الجدول"
              description="بمجرد اختيار الفصل سيظهر الترم المناسب والجدول مباشرة، ويمكنك بعدها إضافة الحصص أو استخدام الإنشاء التلقائي."
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
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box
                sx={{
                  minWidth: Math.max(960, 92 + Slots.length * 112),
                  display: "grid",
                  gridTemplateColumns: `92px repeat(${Slots.length}, minmax(112px, 1fr))`,
                  direction: "rtl",
                }}
              >
                <ScheduleHeaderCell>اليوم</ScheduleHeaderCell>

                {Slots.map((slotItem) => (
                  <ScheduleHeaderCell key={slotItem.id}>
                    {slotItem.name || `الحصة ${slotItem.id}`}
                  </ScheduleHeaderCell>
                ))}

                {Days.map((day) => (
                  <ScheduleDayRow
                    key={day.id}
                    day={day}
                    scheduleMap={scheduleMap}
                    permissions={permissions}
                    onAdd={openAddFromCell}
                    onEdit={openEditLecture}
                    onDelete={(lectureId) => {
                      setSelectedLectureId(lectureId);
                      setDeleteOpen(true);
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* =========================================
          AUTOMATION TOOLS DIALOG
      ========================================= */}

      <Dialog
        open={automationOpen}
        onClose={() => setAutomationOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: "18px",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            borderBottom: "1px solid rgba(36,74,112,0.07)",
          }}
        >
          <Typography
            sx={{
              color: "var(--color-navy-deep)",
              fontSize: "16px",
              fontWeight: 900,
            }}
          >
            {automationScope === "all"
              ? "إنشاء جداول كل الفصول"
              : "إنشاء جدول الفصل تلقائيًا"}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "var(--color-muted)",
              fontSize: "8.5px",
            }}
          >
            {automationScope === "all"
              ? "سيتم تطبيق المعاينة على كل الفصول النشطة في الترم الحالي قبل الاعتماد النهائي."
              : "افحص جاهزية الفصل الحالي، ثم استخدم المعاينة قبل اعتماد التوزيع النهائي."}
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 1.2, md: 1.6 },
            backgroundColor: "#F8FAFC",
          }}
        >
          <Stack spacing={1.1}>
            <Alert severity="info" sx={{ borderRadius: "12px", fontSize: "9px" }}>
              {automationScope === "all"
                ? "سيتم العمل على كل الفصول النشطة في هذا الترم. ابدأ بالمعاينة، وراجع النتيجة، ثم اعتمدها."
                : "سيتم العمل على الفصل المحدد فقط. ابدأ بالمعاينة، وراجع النتيجة، ثم اعتمدها."}
            </Alert>

            <FeasibilityPanel
              key={`feasibility-${automationScope}-${automationOpen ? "open" : "closed"}`}
              termId={termId}
              termLabel={selectedTermLabel}
              classId={classFilter}
              classLabel={selectedClassLabel}
              initialScope={automationScope}
            />

            <GenerateTimetablePanel
              key={`generate-${automationScope}-${automationOpen ? "open" : "closed"}`}
              termId={termId}
              termLabel={selectedTermLabel}
              classId={classFilter}
              classLabel={selectedClassLabel}
              initialScope={automationScope}
              onCommitted={async () => {
                const refreshed = await fetchLectures(
                  {
                    page: 1,
                    limit: 1000,
                    classId: classFilter || undefined,
                    termId: termId || undefined,
                  },
                  { force: true }
                );

                if (refreshed?.status) {
                  setItems(mapLectures(refreshed?.data));
                }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.2 }}>
          <Button
            type="button"
            onClick={() => setAutomationOpen(false)}
            sx={{
              borderRadius: "10px",
              color: "var(--color-navy)",
              fontWeight: 900,
              textTransform: "none",
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={copyOpen}
        onClose={() => {
          if (!copyLoading) {
            setCopyOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "18px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color:
              "var(--color-navy-deep)",
            fontWeight: 900,
          }}
        >
          نسخ الجدول الدراسي
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={1.2}
            sx={{ pt: 0.5 }}
          >
            <Alert
              severity="info"
              sx={{
                borderRadius: "12px",
                fontSize: "11px",
              }}
            >
              سيتم نسخ جدول ترم كامل إلى الترم الهدف في السنة
              الدراسية المرتبطة بالفصل المحدد. الحالات التي تحتاج
              مراجعة ستظهر بعد التنفيذ.
            </Alert>

            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "12px",
                backgroundColor:
                  "rgba(36,74,112,0.025)",
              }}
            >
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: "9px",
                  fontWeight: 800,
                }}
              >
                السنة الهدف
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                {getAcademicYearLabel(
                  copyYears.find(
                    (item) =>
                      getId(item) ===
                      selectedClassAcademicYearId
                  )
                ) ||
                  getEntityName(
                    getAcademicYear(
                      selectedClass
                    )
                  ) ||
                  "السنة الدراسية الحالية للفصل"}
              </Typography>
            </Paper>

            <TextField
              select
              size="small"
              label="السنة المصدر"
              value={copySourceYearId}
              disabled={
                copyYearsLoading ||
                copyLoading
              }
              onChange={(event) => {
                setCopySourceYearId(
                  event.target.value
                );
                setCopySourceTermId("");
                setCopyResult(null);
              }}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "11px",
                  },
              }}
            >
              {copyYears.map(
                (year) => (
                  <MenuItem
                    key={getId(year)}
                    value={getId(year)}
                  >
                    {getAcademicYearLabel(
                      year
                    )}
                    {year?.status ===
                    "active"
                      ? " - الحالية"
                      : ""}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              select
              size="small"
              label="الترم المصدر"
              value={copySourceTermId}
              disabled={
                !copySourceYearId ||
                copySourceTermsLoading ||
                copyLoading
              }
              onChange={(event) => {
                setCopySourceTermId(
                  event.target.value
                );
                setCopyResult(null);
              }}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "11px",
                  },
              }}
            >
              {copySourceTerms.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={
                      copySourceYearId ===
                        selectedClassAcademicYearId &&
                      option.value ===
                        copyTargetTermId
                    }
                  >
                    {option.label}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              select
              size="small"
              label="الترم الهدف"
              value={copyTargetTermId}
              disabled={
                !termOptions.length ||
                copyLoading
              }
              onChange={(event) => {
                const nextValue =
                  event.target.value;

                setCopyTargetTermId(
                  nextValue
                );

                if (
                  copySourceYearId ===
                    selectedClassAcademicYearId &&
                  copySourceTermId ===
                    nextValue
                ) {
                  setCopySourceTermId(
                    ""
                  );
                }

                setCopyResult(null);
              }}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "11px",
                  },
              }}
            >
              {termOptions.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                )
              )}
            </TextField>

            {copySourceYearId ===
              selectedClassAcademicYearId &&
              copySourceTermId &&
              copySourceTermId ===
                copyTargetTermId && (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius:
                      "12px",
                    fontSize:
                      "10px",
                  }}
                >
                  اختر ترمين مختلفين للنسخ داخل نفس السنة الدراسية.
                </Alert>
              )}

            {copyResult && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  border:
                    "1px solid rgba(36,74,112,0.08)",
                  borderRadius:
                    "12px",
                  backgroundColor:
                    "rgba(255,255,255,0.82)",
                }}
              >
                <Typography
                  sx={{
                    mb: 0.8,
                    color:
                      "var(--color-navy-deep)",
                    fontSize:
                      "11px",
                    fontWeight: 900,
                  }}
                >
                  نتيجة النسخ
                </Typography>

                <Stack
                  direction="row"
                  useFlexGap
                  flexWrap="wrap"
                  gap={0.6}
                >
                  <Chip
                    size="small"
                    label={`تم الإنشاء: ${copySummary.created}`}
                    sx={{
                      color: "#2F7D59",
                      backgroundColor:
                        "#EAF8F1",
                      fontWeight: 800,
                    }}
                  />

                  <Chip
                    size="small"
                    label={`مادة غير متاحة: ${copySummary.unresolved}`}
                    sx={{
                      color: "#B36B27",
                      backgroundColor:
                        "#FFF5E8",
                      fontWeight: 800,
                    }}
                  />

                  <Chip
                    size="small"
                    label={`تحتاج معلم: ${copySummary.needsTeacher}`}
                    sx={{
                      color: "#6D59B0",
                      backgroundColor:
                        "#F3EFFF",
                      fontWeight: 800,
                    }}
                  />

                  <Chip
                    size="small"
                    label={`تعارض معلم: ${copySummary.teacherConflict}`}
                    sx={{
                      color: "#B74F49",
                      backgroundColor:
                        "#FFF0EF",
                      fontWeight: 800,
                    }}
                  />
                </Stack>

                {(copySummary.needsTeacher >
                  0 ||
                  copySummary.teacherConflict >
                    0 ||
                  copySummary.unresolved >
                    0) && (
                  <Typography
                    sx={{
                      mt: 0.8,
                      color:
                        "var(--color-muted)",
                      fontSize:
                        "9px",
                      lineHeight: 1.7,
                    }}
                  >
                    راجع الحصص التي لم تُحل تلقائيًا بعد النسخ؛ تعارض
                    المعلم قد ينشئ الحصة بدون معلم لتعديلها يدويًا.
                  </Typography>
                )}
              </Paper>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.2,
            gap: 0.8,
          }}
        >
          <Button
            type="button"
            disabled={copyLoading}
            onClick={() =>
              setCopyOpen(false)
            }
            sx={{
              borderRadius: "10px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            إغلاق
          </Button>

          <Button
            type="button"
            variant="contained"
            disabled={
              copyLoading ||
              copyYearsLoading ||
              copySourceTermsLoading ||
              !copySourceYearId ||
              !copySourceTermId ||
              !copyTargetTermId ||
              copySourceTermId ===
                copyTargetTermId
            }
            startIcon={
              copyLoading ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <AutoAwesomeRounded />
              )
            }
            onClick={
              handleCopySchedule
            }
            sx={{
              borderRadius: "10px",
              color:
                "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
              boxShadow: "none",
              fontWeight: 900,
              textTransform: "none",
              "&:hover": {
                boxShadow: "none",
              },
              "& .MuiButton-startIcon":
                {
                  marginLeft:
                    "6px",
                  marginRight: 0,
                },
            }}
          >
            تنفيذ النسخ
          </Button>
        </DialogActions>
      </Dialog>

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
      minHeight: 44,
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
          minHeight: 96,
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
        minHeight: 96,
        p: 0.55,
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
            p: 0.85,
            position: "relative",
            display: "flex",
            flexDirection:
              "column",
            justifyContent:
              "center",
            borderRadius:
              "11px",
            backgroundColor:
              tone.bg,
            border: `1px solid ${tone.border}`,
            borderRight: `3px solid ${tone.accent}`,
            opacity:
              highlighted
                ? 1
                : 0.28,
            transition:
              "opacity 160ms ease, transform 160ms ease",
            "& .lecture-delete-action": {
              opacity: 0,
              transform: "scale(0.92)",
              transition: "opacity 140ms ease, transform 140ms ease",
            },
            "&:hover": {
              opacity: 1,
              transform:
                canEdit
                  ? "translateY(-1px)"
                  : "none",
            },
            "&:hover .lecture-delete-action": {
              opacity: 1,
              transform: "scale(1)",
            },
          }}
        >
          {canDelete && (
            <Tooltip title="حذف الحصة">
              <IconButton
                className="lecture-delete-action"
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
                  width: 25,
                  height: 25,
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

<Box />
          </Stack>
        </Box>
      ) : canAdd ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{
            width: "100%",
            minHeight: 82,
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
              width: 28,
              height: 28,
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
                fontSize: 18,
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
            minHeight: 82,
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
      minHeight: 220,
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
