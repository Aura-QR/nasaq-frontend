import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AutoStoriesRounded,
  CalendarMonthRounded,
  ClassRounded,
  DeleteOutlineRounded,
  DownloadRounded,
  EditRounded,
  EventNoteRounded,
  MenuBookRounded,
  PersonRounded,
  PictureAsPdfRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Popup from "@/components/Popup/Popup";
import Loading from "@/components/Loading";

import usePermissions from "@/utils/hooks/usePermissions";
import { usePreparation } from "@/utils/hooks/apis/usePreparation";

import { api } from "@/APIs/Axios";
import { deletePreparation } from "@/APIs/school/preparation";

import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
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

const unwrapLectureRecord = (
  response
) => {
  const payload =
    getResponseData(response);

  const nested =
    payload?.lecture ||
    payload?.record ||
    payload?.item ||
    payload?.result ||
    payload?.data?.lecture ||
    payload?.data;

  return nested &&
    typeof nested === "object" &&
    !Array.isArray(nested)
    ? nested
    : payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
    ? payload
    : null;
};

const extractLectureList = (
  response
) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.lectures,
      payload?.results,
      payload?.records,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

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

const getFileUrl = (
  file
) =>
  file?.url ||
  file?.fileUrl ||
  file?.downloadUrl ||
  file?.path ||
  file?.filePath ||
  "";



const DetailCard = ({
  icon,
  label,
  value,
}) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: 82,
      p: 1.25,
      display: "grid",
      gridTemplateColumns:
        "40px minmax(0,1fr)",
      alignItems: "center",
      gap: 1,
      border:
        "1px solid rgba(36,74,112,0.08)",
      borderRadius: "14px",
      backgroundColor:
        "var(--color-white)",
      transition:
        "transform 180ms ease, box-shadow 180ms ease",

      "&:hover": {
        transform:
          "translateY(-2px)",
        boxShadow:
          "0 10px 22px rgba(18,47,77,0.08)",
      },
    }}
  >
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
          fontSize: 20,
        },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color:
            "var(--color-muted)",
          fontSize: "9.5px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        title={String(
          value || "—"
        )}
        sx={{
          mt: 0.25,
          color:
            "var(--color-navy-deep)",
          fontSize: "12px",
          fontWeight: 800,
          lineHeight: 1.6,
          overflowWrap:
            "anywhere",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Paper>
);

const Profile = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const {
    preparation,
    loading,
  } = usePreparation(id);

  const [open, setOpen] =
    useState(false);

  const [resolvedPreparation, setResolvedPreparation] =
    useState(null);

  const [relationsLoading, setRelationsLoading] =
    useState(false);

  const permissions =
    usePermissions("preparation");

  useEffect(() => {
    let active = true;

    const hydratePreparation =
      async () => {
        if (!preparation) {
          setResolvedPreparation(null);
          return;
        }

        setRelationsLoading(true);

        const hydrated =
          await resolvePreparationRelations(
            preparation,
            createRelationCaches()
          );

        if (!active) {
          return;
        }

        setResolvedPreparation(
          hydrated
        );
        setRelationsLoading(false);
      };

    hydratePreparation();

    return () => {
      active = false;
    };
  }, [preparation]);

  const item = useMemo(
    () =>
      resolvedPreparation ||
      preparation ||
      null,
    [
      resolvedPreparation,
      preparation,
    ]
  );

  const handleDelete =
    async () => {
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

        navigate(
          "/school/preparation"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف التحضير"
        );
      }
    };

  if (
    loading ||
    relationsLoading
  ) {
    return <Loading />;
  }

  if (!preparation) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            minHeight: 300,
            display: "grid",
            placeItems: "center",
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontWeight: 700,
            }}
          >
            لم يتم العثور على بيانات التحضير
          </Typography>
        </Paper>
      </Container>
    );
  }

  const details = [
    {
      label: "الفصل",
      value:
        getClassLabel(item),
      icon:
        <ClassRounded />,
    },
    {
      label: "المعلم",
      value:
        getTeacherName(item),
      icon:
        <PersonRounded />,
    },
    {
      label: "المادة",
      value:
        getSubjectLabel(item),
      icon:
        <MenuBookRounded />,
    },
    {
      label: "اليوم",
      value:
        getDayLabel(item),
      icon:
        <CalendarMonthRounded />,
    },
    {
      label: "الحصة",
      value:
        getSlotLabel(item),
      icon:
        <ScheduleRounded />,
    },
    {
      label:
        "تاريخ الإنشاء",
      value:
        formatDate(
          item?.createdAt
        ),
      icon:
        <EventNoteRounded />,
    },
  ];

  const files =
    getArray(item?.files);

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
          color:
            "var(--color-text)",
        }}
      >
        <Back title="تفاصيل التحضير" />

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            mb: 1.25,
            p: {
              xs: 1.5,
              md: 2,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow:
              "0 12px 28px rgba(18,47,77,0.065)",
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
              <Typography
                component="h1"
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "20px",
                    md: "24px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {`${getSubjectLabel(
                  item
                )} - ${getDayLabel(
                  item
                )} - ${getSlotLabel(
                  item
                )}`}
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    "var(--color-muted)",
                  fontSize: "10.5px",
                }}
              >
                ملف التحضير المرتبط بالحصة والفصل الدراسي.
              </Typography>
            </Box>

            <Stack
              direction="row"
              gap={0.8}
              flexWrap="wrap"
            >
              {permissions.edit && (
                <Tooltip title="تعديل التحضير">
                  <IconButton
                    component={Link}
                    to={`/school/preparation/edit/${item?._id || item?.id}`}
                    sx={{
                      width: 38,
                      height: 38,
                      color:
                        "var(--color-navy)",
                      backgroundColor:
                        "rgba(36,74,112,0.07)",
                      border:
                        "1px solid rgba(36,74,112,0.10)",
                      borderRadius:
                        "11px",
                    }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {permissions.delete && (
                <Tooltip title="حذف التحضير">
                  <IconButton
                    onClick={() =>
                      setOpen(true)
                    }
                    sx={{
                      width: 38,
                      height: 38,
                      color:
                        "var(--color-danger)",
                      backgroundColor:
                        "rgba(201,79,79,0.07)",
                      border:
                        "1px solid rgba(201,79,79,0.14)",
                      borderRadius:
                        "11px",
                    }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
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
              md:
                "repeat(3, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {details.map(
            (detail) => (
              <DetailCard
                key={detail.label}
                {...detail}
              />
            )
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.5,
              md: 2,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 12px 28px rgba(18,47,77,0.06)",
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
              pb: 1.25,
              mb: 1.5,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
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
                  borderRadius: "12px",
                }}
              >
                <AutoStoriesRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  ملفات التحضير
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    color:
                      "var(--color-muted)",
                    fontSize: "10px",
                  }}
                >
                  الملفات المرفقة بهذا التحضير.
                </Typography>
              </Box>
            </Stack>

            <Typography
              sx={{
                color:
                  "var(--color-navy)",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {files.length} ملف
            </Typography>
          </Stack>

          {files.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm:
                    "repeat(2, minmax(0,1fr))",
                  lg:
                    "repeat(3, minmax(0,1fr))",
                  xl:
                    "repeat(4, minmax(0,1fr))",
                },
                gap: 1,
              }}
            >
              {files.map(
                (
                  file,
                  index
                ) => (
                  <Paper
                    key={
                      file?._id ||
                      file?.filename ||
                      index
                    }
                    elevation={0}
                    sx={{
                      minHeight: 165,
                      p: 1.3,
                      display: "flex",
                      flexDirection:
                        "column",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: 1,
                      border:
                        "1px solid rgba(36,74,112,0.08)",
                      borderRadius:
                        "15px",
                      backgroundColor:
                        "var(--color-white)",
                      transition:
                        "transform 180ms ease, box-shadow 180ms ease",

                      "&:hover": {
                        transform:
                          "translateY(-2px)",
                        boxShadow:
                          "0 12px 24px rgba(18,47,77,0.08)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        display: "grid",
                        placeItems:
                          "center",
                        color:
                          "var(--color-gold-dark)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        borderRadius:
                          "15px",
                      }}
                    >
                      <PictureAsPdfRounded />
                    </Box>

                    <Typography
                      noWrap
                      title={
                        getFileName(
                          file,
                          index
                        )
                      }
                      sx={{
                        width: "100%",
                        textAlign:
                          "center",
                        color:
                          "var(--color-navy-deep)",
                        fontSize:
                          "11px",
                        fontWeight:
                          800,
                      }}
                    >
                      {getFileName(
                        file,
                        index
                      )}
                    </Typography>

                    <Button
                      component="a"
                      href={
                        getFileUrl(file) ||
                        undefined
                      }
                      disabled={
                        !getFileUrl(file)
                      }
                      target="_blank"
                      rel="noreferrer"
                      download
                      fullWidth
                      variant="outlined"
                      startIcon={
                        <DownloadRounded />
                      }
                      sx={{
                        minHeight: 38,
                        borderRadius:
                          "10px",
                        color:
                          "var(--color-navy)",
                        borderColor:
                          "rgba(36,74,112,0.16)",
                        fontSize:
                          "10px",
                        fontWeight:
                          800,
                        textTransform:
                          "none",

                        "& .MuiButton-startIcon":
                          {
                            marginLeft:
                              "6px",
                            marginRight:
                              0,
                          },
                      }}
                    >
                      تحميل الملف
                    </Button>
                  </Paper>
                )
              )}
            </Box>
          ) : (
            <Box
              sx={{
                minHeight: 170,
                display: "grid",
                placeItems: "center",
                color:
                  "var(--color-muted)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              لا توجد ملفات مرفقة
            </Box>
          )}
        </Paper>

        <Popup
          open={open}
          setOpen={setOpen}
          message="هل أنت متأكد من حذف هذا التحضير؟"
          type="delete"
          fn={handleDelete}
        />
      </Box>
    </Container>
  );
};

export default Profile;
