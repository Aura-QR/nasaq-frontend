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
  DeleteOutlineRounded,
  EventNoteRounded,
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
  useSearchParams,
} from "react-router-dom";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Loading from "@/components/Loading";

import { addPreparation } from "@/APIs/school/preparation";
import { fetchLectures } from "@/APIs/school/lectures";

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

const getLectureData = (
  item
) =>
  item?.lecture || {};

const getClassData = (
  item
) =>
  getLectureData(item)?.class ||
  item?.class ||
  {};

const getSubjectData = (
  item
) =>
  item?.subject ||
  getLectureData(item)?.subject ||
  {};

const getTeacherName = (
  item
) =>
  item?.teacher?.name ||
  item?.createdBy?.name ||
  item?.name ||
  getLectureData(item)?.teacher?.name ||
  "—";

const getClassLabel = (
  item
) => {
  const classData =
    getClassData(item);

  const academicYear =
    classData?.academicYear ||
    item?.academicYear ||
    "";

  const roomNumber =
    classData?.roomNumber ||
    item?.roomNumber ||
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
    "—";

  const code =
    subjectData?.subjectCode ||
    subjectData?.code ||
    "";

  return code
    ? `${name} - ${code}`
    : name;
};

const getDayLabel = (
  item
) => {
  const dayId =
    getLectureData(item)
      ?.dayOfWeek ??
    item?.dayOfWeek;

  return (
    Days.find(
      (day) =>
        day.id === dayId
    )?.day ||
    "—"
  );
};

const getSlotLabel = (
  item
) => {
  const slotId =
    getLectureData(item)
      ?.slot ??
    item?.slot;

  return (
    Slots.find(
      (slot) =>
        slot.id === slotId
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

const getFileName = (
  file,
  index = 0
) =>
  file?.originalName ||
  file?.filename ||
  file?.name ||
  `ملف التحضير ${index + 1}`;

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


const Add = () => {
  const [searchParams] =
    useSearchParams();

  const preselectedLectureId =
    searchParams.get(
      "lectureId"
    ) || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      lecture:
        preselectedLectureId,
    },
  });

  const [
    lecturesLoading,
    setLecturesLoading,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [
    uploadedFile,
    setUploadedFile,
  ] = useState(null);

  const [lectures, setLectures] =
    useState([]);

  const fileInputRef =
    useRef(null);

  const navigate =
    useNavigate();

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
              filters
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
    if (
      preselectedLectureId &&
      lectures.length > 0
    ) {
      setValue(
        "lecture",
        preselectedLectureId
      );
    }
  }, [
    preselectedLectureId,
    lectures,
    setValue,
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

    setUploadedFile(file);
    setValue(
      "files",
      file,
      {
        shouldValidate: true,
      }
    );
  };

  const removeFile = () => {
    setUploadedFile(null);
    setValue(
      "files",
      null,
      {
        shouldValidate: true,
      }
    );
  };

  const onSubmit = async (
    formValues
  ) => {
    if (!uploadedFile) {
      toast.error(
        "يرجى رفع ملف التحضير"
      );
      return;
    }

    setLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "lecture",
        formValues.lecture
      );

      formData.append(
        "files",
        uploadedFile
      );

      const response =
        await addPreparation(
          formData
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة التحضير"
          )
        );
        return;
      }

      toast.success(
        "تم إضافة التحضير بنجاح"
      );

      const createdId =
        getResponseId(
          response
        );

      navigate(
        createdId
          ? `/school/preparation/${createdId}`
          : "/school/preparation"
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة التحضير"
      );
    } finally {
      setLoading(false);
    }
  };

  if (lecturesLoading) {
    return <Loading />;
  }

  const lectureOptions =
    mapLectureOptions(
      lectures
    );

  if (
    lectureOptions.length === 0
  ) {
    return (
      <Container>
        <Box
          dir="rtl"
          sx={{ pb: 3 }}
        >
          <Back title="إضافة تحضير" />

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              minHeight: 300,
              px: 2,
              py: 3,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
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
                  borderRadius: "18px",
                }}
              >
                <EventNoteRounded />
              </Box>

              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "16px",
                  fontWeight: 800,
                }}
              >
                {isSchoolAdmin(
                  userRole
                )
                  ? "لا توجد حصص دراسية متاحة"
                  : "لا توجد حصص دراسية لهذا المعلم"}
              </Typography>

              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: "10px",
                }}
              >
                يجب إنشاء حصة دراسية أولًا قبل إضافة التحضير.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

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
            <Back title="إضافة تحضير جديد" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              اختر الحصة ثم أرفق ملف التحضير بصيغة PDF.
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
            description="اختر الحصة الدراسية المرتبط بها ملف التحضير."
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
                disabled={
                  Boolean(
                    preselectedLectureId
                  )
                }
                defaultValue={
                  preselectedLectureId
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
            description="ارفع ملف PDF واحدًا بحد أقصى 20 ميجابايت."
            endContent={
              uploadedFile ? (
                <Typography
                  sx={{
                    color:
                      "var(--color-success)",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  تم اختيار الملف
                </Typography>
              ) : null
            }
          />

          {!uploadedFile ? (
            <Box
              component="label"
              htmlFor="preparation-file-upload"
              sx={{
                minHeight: 175,
                px: 2,
                py: 2.5,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                cursor: "pointer",
                border:
                  "2px dashed rgba(36,74,112,0.18)",
                borderRadius: "16px",
                backgroundColor:
                  "rgba(36,74,112,0.025)",
                transition:
                  "border-color 180ms ease, background-color 180ms ease",

                "&:hover": {
                  borderColor:
                    "var(--color-gold)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                },
              }}
            >
              <input
                ref={fileInputRef}
                id="preparation-file-upload"
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={
                  handleFileChange
                }
              />

              <Stack
                alignItems="center"
                spacing={0.8}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    borderRadius: "15px",
                  }}
                >
                  <CloudUploadRounded />
                </Box>

                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  اضغط لاختيار ملف التحضير
                </Typography>

                <Typography
                  sx={{
                    color:
                      "var(--color-muted)",
                    fontSize: "9.5px",
                  }}
                >
                  PDF فقط — الحد الأقصى 20 ميجابايت
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                px: 1.4,
                py: 1.2,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 1,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "14px",
                backgroundColor:
                  "var(--color-white)",
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
                    width: 42,
                    height: 42,
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
                  <AutoStoriesRounded />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    title={
                      getFileName(
                        uploadedFile
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
                      uploadedFile
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
                      uploadedFile
                    ) || "ملف PDF"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                type="button"
                onClick={removeFile}
                variant="text"
                startIcon={
                  <DeleteOutlineRounded />
                }
                sx={{
                  flexShrink: 0,
                  color:
                    "var(--color-danger)",
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
                حذف
              </Button>
            </Paper>
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
              disabled={
                loading ||
                !uploadedFile
              }
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
                : "حفظ التحضير"}
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

export default Add;
