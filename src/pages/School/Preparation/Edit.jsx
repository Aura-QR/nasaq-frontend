import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AutoStoriesRounded,
  CloseRounded,
  CloudUploadRounded,
  EventNoteRounded,
  PictureAsPdfRounded,
  ReplayRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Loading from "@/components/Loading";

import { usePreparation } from "@/utils/hooks/apis/usePreparation";
import {
  fetchLectures,
} from "@/APIs/school/lectures";
import {
  editPreparation,
  replacePreparationFile,
} from "@/APIs/school/preparation";

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

const FORM_CARD_SX = {
  mt: 1.25,
  p: {
    xs: 1.5,
    md: 2,
  },
  overflow: "visible",
  border:
    "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor:
    "var(--color-cream)",
  boxShadow:
    "0 12px 28px rgba(18,47,77,0.06)",

  "& .MuiFormControl-root":
    {
      width: "100%",
      margin: 0,
    },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root":
    {
      minHeight: 48,
      backgroundColor:
        "var(--color-white)",
      borderRadius: "12px",
    },

  "& .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.16)",
    },

  "& .MuiOutlinedInput-root.Mui-focused":
    {
      boxShadow:
        "0 0 0 3px rgba(211,164,79,0.10)",
    },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "var(--color-gold)",
      borderWidth: "1px",
    },

  "& .MuiInputLabel-root": {
    px: 0.65,
    color:
      "var(--color-muted)",
    backgroundColor:
      "var(--color-cream)",
    fontSize: "10.5px",
    fontWeight: 700,
  },
};

const SectionHeading = ({
  icon,
  title,
  description,
  endContent,
}) => (
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
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            color:
              "var(--color-muted)",
            fontSize: "10px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>

    {endContent}
  </Stack>
);


const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  const [
    lecturesLoading,
    setLecturesLoading,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [lectures, setLectures] =
    useState([]);

  const [
    originalFile,
    setOriginalFile,
  ] = useState(null);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    defaultLectureId,
    setDefaultLectureId,
  ] = useState("");

  const fileInputRef =
    useRef(null);

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const requestedReturnTo =
    searchParams.get(
      "returnTo"
    ) || "";

  const returnTo =
    requestedReturnTo.startsWith(
      "/school/"
    )
      ? requestedReturnTo
      : "";

  const authUser =
    useAuthUser();

  const currentUser =
    getAuthUserData(
      authUser
    );

  const teacherId =
    currentUser?.id ||
    currentUser?._id ||
    "";

  const userRole =
    normalizeRole(
      currentUser?.role
    );

  const {
    preparation,
    loading:
      preparationLoading,
  } = usePreparation(id);

  useEffect(() => {
    let active = true;

    const loadLectures =
      async () => {
        setLecturesLoading(
          true
        );

        const filters =
          isSchoolAdmin(userRole)
            ? {}
            : {
                teacherId,
              };

        try {
          const response =
            await fetchLectures(
              filters,
              { force: true }
            );

          if (!active) {
            return;
          }

          if (!response?.status) {
            setLectures([]);

            toast.error(
              getErrorMessage(
                response,
                "حدث خطأ أثناء جلب الحصص"
              )
            );
            return;
          }

          setLectures(
            getResponseList(
              response
            )
          );
        } catch (error) {
          if (active) {
            setLectures([]);

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب الحصص"
            );
          }
        } finally {
          if (active) {
            setLecturesLoading(
              false
            );
          }
        }
      };

    loadLectures();

    return () => {
      active = false;
    };
  }, [
    teacherId,
    userRole,
  ]);

  useEffect(() => {
    if (!preparation) {
      return;
    }

    const lectureData =
      getLectureData(
        preparation
      );

    const lectureId =
      getEntityId(
        preparation?.lecture ||
        preparation?.lectureId ||
        lectureData
      );

    const file =
      getArray(
        preparation?.files
      )[0] || null;

    reset({
      lecture: lectureId,
    });

    setDefaultLectureId(
      lectureId
    );

    if (
      lectureId &&
      Object.keys(
        lectureData
      ).length > 0
    ) {
      setLectures(
        (previous) => {
          const exists =
            previous.some(
              (lecture) =>
                getEntityId(
                  lecture
                ) ===
                lectureId
            );

          return exists
            ? previous
            : [
                lectureData,
                ...previous,
              ];
        }
      );
    }

    setOriginalFile(file);
    setSelectedFile(null);
  }, [
    preparation,
    reset,
  ]);

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validation =
      validatePdf(file);

    if (!validation.valid) {
      toast.error(
        validation.message
      );
      return;
    }

    setSelectedFile(file);
  };

  const cancelReplacement =
    () => {
      setSelectedFile(null);
    };

  const onSubmit = async (
    formValues
  ) => {
    const lectureChanged =
      formValues.lecture !==
      defaultLectureId;

    const fileChanged =
      selectedFile instanceof
      File;

    if (
      !lectureChanged &&
      !fileChanged
    ) {
      toast.info(
        "لم تحدث أي بيانات للتعديل"
      );
      return;
    }

    setLoading(true);

    try {
      if (lectureChanged) {
        const updateResponse =
          await editPreparation(
            {
              lecture:
                formValues.lecture,
            },
            id
          );

        if (
          !updateResponse?.status
        ) {
          toast.error(
            getErrorMessage(
              updateResponse,
              "حدث خطأ أثناء تعديل التحضير"
            )
          );
          return;
        }
      }

      if (fileChanged) {
        const fileResponse =
          await replacePreparationFile(
            id,
            selectedFile,
            originalFile
          );

        if (!fileResponse?.status) {
          toast.error(
            getErrorMessage(
              fileResponse,
              "تعذر استبدال ملف التحضير"
            )
          );
          return;
        }

        if (
          fileResponse?.warning
        ) {
          toast.warning(
            fileResponse.warning
          );
        }
      }

      toast.success(
        "تم تعديل التحضير بنجاح"
      );

      if (returnTo) {
        navigate(
          returnTo,
          { replace: true }
        );
      } else {
        navigate(
          `/school/preparation/${id}`
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل التحضير"
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    lecturesLoading ||
    preparationLoading
  ) {
    return <Loading />;
  }

  const lectureOptions =
    mapLectureOptions(
      lectures
    );

  const displayedFile =
    selectedFile ||
    originalFile;

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(
          onSubmit
        )}
        noValidate
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 3,
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.05,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "rgba(255,252,247,0.9)",
            boxShadow:
              "0 8px 20px rgba(18,47,77,0.04)",
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
          >
            <Back title="تعديل التحضير" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              عدّل الحصة أو استبدل ملف التحضير ثم احفظ التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <EventNoteRounded />
            }
            title="تفاصيل التحضير"
            description="راجع الحصة الدراسية المرتبط بها التحضير."
          />

          <Grid
            container
            spacing={{
              xs: 1.5,
              md: 2,
            }}
          >
            <Grid
              item
              xs={12}
            >
              <Select
                register={register}
                registerName="lecture"
                data={
                  lectureOptions
                }
                name="name"
                error={
                  errors.lecture
                    ?.message
                }
                label="الحصة الدراسية"
                required
                defaultValue={
                  defaultLectureId
                }
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <AutoStoriesRounded />
            }
            title="ملف التحضير"
            description="يمكن استبدال الملف الحالي بملف PDF جديد بحد أقصى 20 ميجابايت."
            endContent={
              selectedFile ? (
                <Typography
                  sx={{
                    color:
                      "var(--color-gold-dark)",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  ملف بديل جديد
                </Typography>
              ) : (
                <Typography
                  sx={{
                    color:
                      "var(--color-success)",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  الملف الحالي
                </Typography>
              )
            }
          />

          {displayedFile ? (
            <Paper
              elevation={0}
              sx={{
                px: 1.4,
                py: 1.2,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 1.25,
                border:
                  selectedFile
                    ? "1px solid rgba(211,164,79,0.28)"
                    : "1px solid rgba(36,74,112,0.08)",
                borderRadius: "14px",
                backgroundColor:
                  selectedFile
                    ? "rgba(251,240,216,0.30)"
                    : "var(--color-white)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    borderRadius: "12px",
                  }}
                >
                  <PictureAsPdfRounded />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    title={
                      getFileName(
                        displayedFile
                      )
                    }
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    {getFileName(
                      displayedFile
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.15,
                      color:
                        "var(--color-muted)",
                      fontSize: "9px",
                    }}
                  >
                    {getFileSize(
                      displayedFile
                    ) || "ملف PDF"}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                gap={0.6}
                sx={{
                  flexShrink: 0,
                }}
              >
                {selectedFile && (
                  <Button
                    type="button"
                    onClick={
                      cancelReplacement
                    }
                    variant="text"
                    startIcon={
                      <ReplayRounded />
                    }
                    sx={{
                      color:
                        "var(--color-muted)",
                      fontSize: "9.5px",
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
                    التراجع
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() =>
                    fileInputRef
                      .current
                      ?.click()
                  }
                  variant="outlined"
                  startIcon={
                    <CloudUploadRounded />
                  }
                  sx={{
                    minHeight: 38,
                    borderRadius: "10px",
                    color:
                      "var(--color-navy)",
                    borderColor:
                      "rgba(36,74,112,0.16)",
                    fontSize: "9.5px",
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
                  استبدال الملف
                </Button>
              </Stack>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={
                  handleFileChange
                }
              />
            </Paper>
          ) : (
            <Box
              component="label"
              sx={{
                minHeight: 160,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                border:
                  "2px dashed rgba(36,74,112,0.18)",
                borderRadius: "16px",
                backgroundColor:
                  "rgba(36,74,112,0.025)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={
                  handleFileChange
                }
              />

              <Stack
                alignItems="center"
                spacing={0.7}
              >
                <CloudUploadRounded
                  sx={{
                    color:
                      "var(--color-gold-dark)",
                  }}
                />

                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  اختيار ملف تحضير
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.15,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.05)",
          }}
        >
          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            gap={1}
          >
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 180,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
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
              {loading
                ? "جاري الحفظ..."
                : "حفظ التغييرات"}
            </Button>

            <Button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              variant="outlined"
              startIcon={
                <CloseRounded />
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 145,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.18)",
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
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default Edit;
