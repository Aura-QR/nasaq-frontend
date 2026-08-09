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
  AutoStoriesRounded,
  FileDownloadOutlined,
  MenuBookRounded,
  PersonRounded,
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
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthUser } from "react-auth-kit";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import PaginationControls from "@/components/Pagination";
import SearchFilter from "@/components/Filters/SearchFilter";

import usePermissions from "@/utils/hooks/usePermissions";
import { usePreparations } from "@/utils/hooks/apis/usePreparations";
import useDebounce from "@/utils/hooks/useDebounce";

import { api } from "@/APIs/Axios";
import { deletePreparation } from "@/APIs/school/preparation";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";

import { format } from "date-fns";
import { ar } from "date-fns/locale";

const SCHOOL_ADMIN_ROLES = [
  "OWNER",
  "SUPERVISOR",
  "MANAGER",
  "ADMIN",
];

const getAuthUserData = (
  authUser
) => {
  const value =
    typeof authUser ===
    "function"
      ? authUser()
      : authUser;

  return (
    value?.user ||
    value ||
    {}
  );
};

const normalizeRole = (
  role
) =>
  String(role || "")
    .trim()
    .toUpperCase();

const isSchoolAdmin = (
  role
) =>
  SCHOOL_ADMIN_ROLES.includes(
    normalizeRole(role)
  );

const getResponseData = (
  response
) =>
  response?.data?.data ||
  response?.data ||
  response;

const getResponseList = (
  response
) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload?.docs ||
    payload?.items ||
    payload?.results ||
    []
  );
};

const getResponseId = (
  response
) => {
  const payload =
    getResponseData(response);

  return (
    payload?._id ||
    payload?.id ||
    payload?.preparation?._id ||
    payload?.preparation?.id ||
    ""
  );
};

const getErrorMessage = (
  response,
  fallback
) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string"
    ? response
    : fallback);

const getArray = (
  value
) =>
  Array.isArray(value)
    ? value
    : [];

const getEntityId = (
  value
) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};


const RELATION_WRAPPER_KEYS = [
  "data",
  "result",
  "payload",
  "response",
  "record",
  "item",
  "lecture",
  "subjectOffering",
  "offering",
  "subject",
];

const unwrapApiEntity = (
  response,
  preferredKeys = []
) => {
  const root =
    response?.data ??
    response;

  const queue = [root];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      visited.has(current)
    ) {
      continue;
    }

    visited.add(current);

    const priorityKeys = [
      ...preferredKeys,
      ...RELATION_WRAPPER_KEYS,
    ];

    priorityKeys.forEach((key) => {
      const child = current?.[key];

      if (
        child &&
        typeof child === "object" &&
        !Array.isArray(child)
      ) {
        queue.unshift(child);
      }
    });

    const looksLikeEntity =
      Boolean(getEntityId(current)) ||
      Boolean(current.subjectName) ||
      Boolean(current.subjectCode) ||
      Boolean(current.subjectId) ||
      Boolean(current.subjectOfferingId) ||
      Boolean(current.dayOfWeek) ||
      current.slot !== undefined;

    const looksLikeWrapper =
      Object.prototype.hasOwnProperty.call(
        current,
        "status"
      ) &&
      Object.prototype.hasOwnProperty.call(
        current,
        "data"
      );

    if (
      looksLikeEntity &&
      !looksLikeWrapper
    ) {
      return current;
    }

    Object.values(current).forEach(
      (child) => {
        if (
          child &&
          typeof child === "object" &&
          !Array.isArray(child) &&
          !visited.has(child)
        ) {
          queue.push(child);
        }
      }
    );
  }

  return null;
};

const createRelationCaches = () => ({
  lectures: new Map(),
  offerings: new Map(),
  subjects: new Map(),
});

const fetchEntityCached = async (
  endpoint,
  preferredKeys,
  cache
) => {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  const request = api
    .get(endpoint)
    .then((response) =>
      unwrapApiEntity(
        response,
        preferredKeys
      )
    )
    .catch(() => null);

  cache.set(endpoint, request);
  return request;
};

const asObject = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? value
    : {};

const resolvePreparationRelations = async (
  item,
  caches = createRelationCaches()
) => {
  const initialLecture =
    item?.lecture ||
    item?.lectureId ||
    item?.lectureData;

  const lectureId =
    getEntityId(initialLecture);

  let lecture =
    asObject(initialLecture);

  if (lectureId) {
    const fetchedLecture =
      await fetchEntityCached(
        `/lectures/${lectureId}`,
        ["lecture"],
        caches.lectures
      );

    lecture = {
      ...lecture,
      ...asObject(fetchedLecture),
    };
  }

  const initialOffering =
    lecture?.subjectOfferingId ||
    lecture?.subjectOffering ||
    item?.subjectOfferingId ||
    item?.subjectOffering;

  const offeringId =
    getEntityId(initialOffering);

  let offering =
    asObject(initialOffering);

  if (offeringId) {
    const fetchedOffering =
      await fetchEntityCached(
        `/subject-offerings/${offeringId}`,
        [
          "subjectOffering",
          "offering",
        ],
        caches.offerings
      );

    offering = {
      ...offering,
      ...asObject(fetchedOffering),
    };
  }

  const initialSubject =
    offering?.subjectId ||
    offering?.subject ||
    lecture?.subjectId ||
    lecture?.subject ||
    item?.subjectId ||
    item?.subject;

  const subjectId =
    getEntityId(initialSubject);

  let subject =
    asObject(initialSubject);

  if (subjectId) {
    const fetchedSubject =
      await fetchEntityCached(
        `/subjects/${subjectId}`,
        ["subject"],
        caches.subjects
      );

    subject = {
      ...subject,
      ...asObject(fetchedSubject),
    };
  }

  const normalizedOffering = {
    ...offering,
    ...(offeringId
      ? { _id: offering._id || offeringId }
      : {}),
    ...(Object.keys(subject).length > 0
      ? {
          subjectId: subject,
          subject,
        }
      : {}),
  };

  const normalizedLecture = {
    ...lecture,
    ...(lectureId
      ? { _id: lecture._id || lectureId }
      : {}),
    ...(Object.keys(normalizedOffering).length > 0
      ? {
          subjectOfferingId:
            normalizedOffering,
          subjectOffering:
            normalizedOffering,
        }
      : {}),
    ...(Object.keys(subject).length > 0
      ? {
          subjectId: subject,
          subject,
        }
      : {}),
  };

  return {
    ...item,
    lecture: normalizedLecture,
    ...(lectureId
      ? { lectureId }
      : {}),
    ...(Object.keys(normalizedOffering).length > 0
      ? {
          subjectOfferingId:
            normalizedOffering,
          subjectOffering:
            normalizedOffering,
        }
      : {}),
    ...(Object.keys(subject).length > 0
      ? {
          subjectId: subject,
          subject,
          subjectName:
            subject.subjectName ||
            subject.name ||
            item?.subjectName ||
            "",
          subjectCode:
            subject.subjectCode ||
            subject.code ||
            item?.subjectCode ||
            "",
        }
      : {}),
  };
};

const getNestedName = (
  value
) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return (
      value.name ||
      value.title ||
      value.label ||
      ""
    );
  }

  return String(
    value || ""
  ).trim();
};

const getLectureData = (
  item
) => {
  const lecture =
    item?.lecture ||
    item?.lectureId ||
    item?.lectureData ||
    item;

  return lecture &&
    typeof lecture === "object"
    ? lecture
    : {};
};

const getClassData = (
  item
) => {
  const lecture =
    getLectureData(item);

  const classData =
    lecture?.class ||
    lecture?.classId ||
    item?.class ||
    item?.classId;

  return classData &&
    typeof classData === "object"
    ? classData
    : {};
};

const getSubjectOfferingData = (
  item
) => {
  const lecture =
    getLectureData(item);

  const offering =
    lecture?.subjectOfferingId ||
    lecture?.subjectOffering ||
    item?.subjectOfferingId ||
    item?.subjectOffering;

  return offering &&
    typeof offering === "object"
    ? offering
    : {};
};

const getSubjectData = (
  item
) => {
  const lecture =
    getLectureData(item);

  const offering =
    getSubjectOfferingData(item);

  const subjectData =
    item?.subject ||
    item?.subjectId ||
    lecture?.subject ||
    lecture?.subjectId ||
    offering?.subjectId ||
    offering?.subject;

  return subjectData &&
    typeof subjectData === "object"
    ? subjectData
    : {};
};

const getTeacherData = (
  item
) => {
  const lecture =
    getLectureData(item);

  const teacher =
    item?.teacher ||
    item?.teacherId ||
    lecture?.teacher ||
    lecture?.teacherId ||
    item?.createdBy;

  return teacher &&
    typeof teacher === "object"
    ? teacher
    : {};
};

const getTeacherName = (
  item
) => {
  const teacher =
    getTeacherData(item);

  return (
    teacher?.name ||
    teacher?.username ||
    item?.teacherName ||
    item?.createdBy?.name ||
    "—"
  );
};

const getClassLabel = (
  item
) => {
  const classData =
    getClassData(item);

  const academicYear =
    getNestedName(
      classData?.academicYearId ||
      classData?.academicYear ||
      item?.academicYearId ||
      item?.academicYear
    );

  const roomNumber =
    classData?.roomNumber ||
    classData?.name ||
    item?.roomNumber ||
    item?.className ||
    "";

  const gender =
    classData?.gender ||
    item?.gender ||
    "";

  return [
    academicYear,
    roomNumber,
    gender
      ? translateGender(
          gender,
          "class"
        )
      : "",
  ]
    .filter(Boolean)
    .join(" - ") || "—";
};

const getSubjectLabel = (
  item
) => {
  const subjectData =
    getSubjectData(item);

  const name =
    subjectData?.subjectName ||
    subjectData?.name ||
    item?.subjectName ||
    "—";

  const code =
    subjectData?.subjectCode ||
    subjectData?.code ||
    item?.subjectCode ||
    "";

  return code
    ? `${name} - ${code}`
    : name;
};

const getDayLabel = (
  item
) => {
  const lecture =
    getLectureData(item);

  const dayId =
    lecture?.dayOfWeek ??
    lecture?.day ??
    item?.dayOfWeek ??
    item?.day;

  const normalizedDay =
    String(dayId || "")
      .trim()
      .toLowerCase();

  return (
    Days.find(
      (day) =>
        String(day.id || "")
          .trim()
          .toLowerCase() ===
        normalizedDay
    )?.day ||
    "—"
  );
};

const getSlotLabel = (
  item
) => {
  const lecture =
    getLectureData(item);

  const slotId =
    lecture?.slot ??
    item?.slot;

  return (
    Slots.find(
      (slot) =>
        String(slot.id) ===
        String(slotId)
    )?.name ||
    "—"
  );
};

const formatDate = (
  value,
  pattern = "dd MMM، yyyy"
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return format(
    date,
    pattern,
    { locale: ar }
  );
};

const mapLectureOptions = (
  lectures
) =>
  getArray(lectures).map(
    (lecture) => {
      const slot =
        getSlotLabel(lecture);

      const day =
        getDayLabel(lecture);

      const classLabel =
        getClassLabel(lecture);

      const subjectLabel =
        getSubjectLabel(lecture);

      return {
        id:
          lecture?._id ||
          lecture?.id,
        name:
          `${subjectLabel} / ${day} / ${slot} / ${classLabel}`,
      };
    }
  );

const validatePdf = (
  file
) => {
  if (!file) {
    return {
      valid: false,
      message:
        "يرجى اختيار ملف التحضير",
    };
  }

  const isPdf =
    file.type ===
      "application/pdf" ||
    file.name
      ?.toLowerCase()
      .endsWith(".pdf");

  if (!isPdf) {
    return {
      valid: false,
      message:
        "نوع الملف غير مدعوم. الرجاء رفع ملف PDF فقط.",
    };
  }

  if (
    file.size >
    20 * 1024 * 1024
  ) {
    return {
      valid: false,
      message:
        "حجم الملف يجب ألا يتجاوز 20 ميجابايت",
    };
  }

  return {
    valid: true,
  };
};

const repairArabicEncoding = (
  value
) => {
  const text = String(
    value || ""
  );

  if (
    !/[ÃÂØÙ]/.test(text)
  ) {
    return text;
  }

  try {
    const bytes =
      Uint8Array.from(
        text,
        (character) =>
          character.charCodeAt(0) & 255
      );

    const decoded =
      new TextDecoder(
        "utf-8",
        { fatal: true }
      ).decode(bytes);

    return decoded || text;
  } catch {
    return text;
  }
};

const getFileName = (
  file,
  index = 0
) =>
  repairArabicEncoding(
    file?.originalName ||
      file?.filename ||
      file?.name ||
      `ملف التحضير ${index + 1}`
  );

const getFileSize = (
  file
) => {
  if (!file?.size) {
    return "";
  }

  return `${(
    file.size /
    1024 /
    1024
  ).toFixed(2)} MB`;
};


const TABLE_HEADERS = [
  "الفصل",
  "المعلم",
  "المادة",
  "اليوم",
  "الحصة",
  "تاريخ الإنشاء",
];

const TABLE_BODY = [
  "className",
  "teacherName",
  "subjectName",
  "dayOfWeek",
  "slot",
  "createdAt",
];

const mapPreparations = (
  data
) =>
  getArray(data).map(
    (item) => ({
      ...item,
      id:
        item?._id ||
        item?.id,
      className:
        getClassLabel(item),
      teacherName:
        getTeacherName(item),
      subjectName:
        getSubjectLabel(item),
      dayOfWeek:
        getDayLabel(item),
      slot:
        getSlotLabel(item),
      createdAt:
        formatDate(
          item?.createdAt
        ),
      filesCount:
        getArray(
          item?.files
        ).length,
    })
  );

const List = () => {
  const authUser =
    useAuthUser();

  const currentUser =
    getAuthUserData(
      authUser
    );

  const currentUserId =
    getEntityId(
      currentUser
    );

  const currentRole =
    normalizeRole(
      currentUser?.role
    );

  const canSearchTeachers =
    isSchoolAdmin(
      currentRole
    );

  const [items, setItems] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [teacher, setTeacher] =
    useState("");

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedSearch =
    useDebounce(
      teacher,
      700
    );

  const filters = useMemo(
    () => ({
      page,
      limit,
    }),
    [
      page,
      limit,
    ]
  );

  const {
    preparations,
    loading,
    pagination,
  } = usePreparations(filters);

  const permissions =
    usePermissions("preparation");

  useEffect(() => {
    let active = true;

    const hydratePreparations =
      async () => {
        const source =
          getArray(preparations);

        if (source.length === 0) {
          if (active) {
            setItems([]);
          }
          return;
        }

        const caches =
          createRelationCaches();

        const hydrated =
          await Promise.all(
            source.map((item) =>
              resolvePreparationRelations(
                item,
                caches
              )
            )
          );

        if (!active) {
          return;
        }

        const mapped =
          mapPreparations(
            hydrated
          );

        const query =
          String(
            debouncedSearch || ""
          )
            .trim()
            .toLowerCase();

        setItems(
          canSearchTeachers &&
          query
            ? mapped.filter(
                (item) =>
                  String(
                    item.teacherName ||
                    ""
                  )
                    .toLowerCase()
                    .includes(query)
              )
            : mapped
        );
      };

    hydratePreparations();

    return () => {
      active = false;
    };
  }, [
    preparations,
    debouncedSearch,
    canSearchTeachers,
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
    debouncedSearch,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount =
    canSearchTeachers &&
    teacher
      ? 1
      : 0;

  const stats = useMemo(
    () => ({
      total:
        currentPagination
          ?.totalDocs ??
        items.length,
      visible: items.length,
      teachers: new Set(
        items
          .map(
            (item) =>
              item.teacherName
          )
          .filter(
            (name) =>
              name &&
              name !== "—"
          )
      ).size,
      subjects: new Set(
        items
          .map(
            (item) =>
              item.subjectName
          )
          .filter(
            (name) =>
              name &&
              name !== "—"
          )
      ).size,
    }),
    [
      items,
      currentPagination,
    ]
  );

  const csvData = useMemo(
    () =>
      items.map(
        (item) => ({
          الفصل:
            item.className,
          المعلم:
            item.teacherName,
          المادة:
            item.subjectName,
          اليوم:
            item.dayOfWeek,
          الحصة:
            item.slot,
          "تاريخ الإنشاء":
            item.createdAt,
        })
      ),
    [items]
  );

  const resetFilters = () => {
    setTeacher("");
    setPage(1);
  };

  const handleDelete = async (
    id,
    setActive
  ) => {
    try {
      const response =
        await deletePreparation(
          id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "تعذر حذف التحضير"
          )
        );
        return;
      }

      toast.success(
        "تم حذف التحضير بنجاح"
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
          "حدث خطأ أثناء حذف التحضير"
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
                  إدارة التحاضير
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
                تابع تحاضير المعلمين
                المرتبطة بالحصص
                والمواد والفصول.
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
                filename="preparations.csv"
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
                  إضافة تحضير
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
                "repeat(2, minmax(0,1fr))",
              lg:
                "repeat(4, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {[
            {
              label:
                "إجمالي التحاضير",
              value: stats.total,
              icon:
                <AutoStoriesRounded />,
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
                "المعلمون في الصفحة",
              value:
                stats.teachers,
              icon:
                <PersonRounded />,
            },
            {
              label:
                "المواد في الصفحة",
              value:
                stats.subjects,
              icon:
                <MenuBookRounded />,
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

        {canSearchTeachers && (
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

              "& .MuiInputBase-root, & .MuiOutlinedInput-root":
                {
                  minHeight: 50,
                  height: 50,
                  backgroundColor:
                    "var(--color-white)",
                  borderRadius: "12px",
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
              gap={1.5}
            >
              <Box
                sx={{
                  width: {
                    xs: "100%",
                    sm: 410,
                  },
                  maxWidth: "100%",
                }}
              >
                <Typography
                  sx={{
                    mb: 0.75,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  البحث عن تحضير
                </Typography>

                <SearchFilter
                  value={teacher}
                  onChange={
                    setTeacher
                  }
                  placeholder="ابحث باسم المعلم..."
                />
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
                  alignSelf: {
                    xs: "stretch",
                    sm: "flex-end",
                  },
                  minHeight: 38,
                  px: 1.25,
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
                مسح البحث
              </Button>
            </Stack>
          </Paper>
        )}

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
              قائمة التحاضير
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح تفاصيل التحضير أو
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
                    <AutoStoriesRounded />
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
                    ? "لا توجد تحاضير مطابقة للبحث"
                    : "لا توجد تحاضير حتى الآن"}
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
                    ? "غيّر اسم المعلم أو امسح البحث لعرض نتائج أخرى."
                    : "أضف أول تحضير مرتبط بإحدى الحصص الدراسية."}
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
                    مسح البحث
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
                      إضافة أول تحضير
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
                    label="عدد التحاضير"
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
