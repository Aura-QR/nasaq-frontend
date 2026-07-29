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
  CloseRounded,
  EventNoteRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";

import { fetchClasses } from "@/APIs/school/classes";
import { addLecture } from "@/APIs/school/lectures";
import {
  fetchSingleTeacher,
  fetchTeachersBySubjectId,
} from "@/APIs/users/teachers";
import { fetchSubjects } from "@/APIs/school/subjects";

const getResponsePayload = (response) => {
  if (
    !response ||
    typeof response === "string" ||
    response?.status === false
  ) {
    return null;
  }

  return (
    response?.data?.data ||
    response?.data ||
    response
  );
};

const getResponseList = (response) => {
  const payload =
    getResponsePayload(response);

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

const getErrorMessage = (
  response,
  fallback
) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string"
    ? response
    : fallback);

const mapClasses = (classes) =>
  (Array.isArray(classes)
    ? classes
    : []
  ).map((classItem) => ({
    id:
      classItem?._id ||
      classItem?.id,
    name: `${
      classItem?.academicYear ||
      "—"
    } - ${
      classItem?.roomNumber ||
      "—"
    } - ${translateGender(
      classItem?.gender,
      "class"
    ) || "—"}`,
  }));

const mapSubjects = (subjects) =>
  (Array.isArray(subjects)
    ? subjects
    : []
  ).map((subjectItem) => ({
    id:
      subjectItem?._id ||
      subjectItem?.id,
    name:
      subjectItem?.subjectName ||
      subjectItem?.name ||
      "—",
  }));

const mapTeachers = (teachers) =>
  (Array.isArray(teachers)
    ? teachers
    : []
  ).map((teacherItem) => ({
    id:
      teacherItem?._id ||
      teacherItem?.id,
    name:
      teacherItem?.name ||
      teacherItem?.username ||
      "—",
  }));

const FORM_CARD_SX = {
  p: {
    xs: 1.5,
    md: 2,
  },
  mt: 1.25,
  overflow: "visible",
  border:
    "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor:
    "var(--color-cream)",
  boxShadow:
    "0 12px 28px rgba(18,47,77,0.06)",

  "& .MuiFormControl-root": {
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

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.28)",
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
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom:
        "1px solid rgba(36,74,112,0.07)",
    }}
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
);


const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const classId =
    searchParams.get("classId");

  const day =
    searchParams.get("day");

  const slot =
    searchParams.get("slot");

  const teacherId =
    searchParams.get(
      "teacherId"
    );

  useEffect(() => {
    if (classId) {
      setValue(
        "classId",
        classId
      );
    }

    if (teacherId) {
      setValue(
        "teacherId",
        teacherId
      );
    }

    if (day) {
      setValue(
        "dayOfWeek",
        day
      );
    }

    if (slot) {
      setValue(
        "slot",
        slot
      );
    }
  }, [
    classId,
    day,
    slot,
    teacherId,
    setValue,
  ]);

  const onSubmit = async (
    formData
  ) => {
    setLoading(true);

    try {
      const payload = {
        ...formData,
        slot: Number(
          formData.slot
        ),
      };

      const response =
        await addLecture(
          payload
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة الحصة"
          )
        );
        return;
      }

      toast.success(
        "تم إضافة الحصة بنجاح"
      );

      navigate(-1);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة الحصة"
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Back title="إضافة حصة دراسية" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              حدّد اليوم والحصة ثم
              اختر الفصل والمادة
              والمعلم.
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
            title="تفاصيل الحصة"
            description="اربط الحصة بموعدها والفصل والمادة والمعلم المسؤول."
          />

          <DataInputs
            register={register}
            errors={errors}
            setValue={setValue}
            classId={classId}
            day={day}
            slot={slot}
            teacherId={
              teacherId
            }
          />
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
              {loading
                ? "جاري الحفظ..."
                : "حفظ الحصة"}
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

const DataInputs = ({
  register,
  errors,
  setValue,
  classId,
  day,
  slot,
  teacherId,
}) => {
  const [subject, setSubject] =
    useState(null);

  const [
    lectureClass,
    setLectureClass,
  ] = useState(
    classId || null
  );

  const [
    teacherSubjects,
    setTeacherSubjects,
  ] = useState([]);

  useEffect(() => {
    if (!teacherId) {
      setTeacherSubjects([]);
      return;
    }

    let active = true;

    const loadTeacher =
      async () => {
        try {
          const response =
            await fetchSingleTeacher(
              teacherId
            );

          const teacher =
            getResponsePayload(
              response
            );

          if (
            active &&
            teacher
          ) {
            setTeacherSubjects(
              Array.isArray(
                teacher.subjects
              )
                ? teacher.subjects
                : []
            );
          }
        } catch {
          if (active) {
            setTeacherSubjects(
              []
            );
          }
        }
      };

    loadTeacher();

    return () => {
      active = false;
    };
  }, [teacherId]);

  return (
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
        sm={6}
        lg={4}
      >
        <Select
          register={register}
          registerName="dayOfWeek"
          error={
            errors.dayOfWeek
              ?.message
          }
          label="اليوم"
          required
          data={Days}
          name="day"
          defaultValue={
            day || ""
          }
          disabled={Boolean(day)}
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <Select
          register={register}
          registerName="slot"
          error={
            errors.slot?.message
          }
          label="الحصة"
          required
          data={Slots}
          name="name"
          defaultValue={
            slot || ""
          }
          disabled={Boolean(slot)}
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <SelectClass
          register={register}
          errors={errors}
          setLectureClass={
            setLectureClass
          }
          setValue={setValue}
          setSubject={setSubject}
          classId={classId}
          teacherId={
            teacherId
          }
          subject={subject}
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <SelectSubject
          register={register}
          errors={errors}
          setSubject={
            setSubject
          }
          setValue={setValue}
          lectureClass={
            lectureClass
          }
          teacherId={
            teacherId
          }
          teacherSubjects={
            teacherSubjects
          }
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <SelectTeacher
          register={register}
          errors={errors}
          subject={subject}
          setValue={setValue}
          teacherId={
            teacherId
          }
        />
      </Grid>
    </Grid>
  );
};

const SelectClass = ({
  register,
  errors,
  setLectureClass,
  setValue,
  setSubject,
  classId,
  teacherId,
  subject,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [
    studentClasses,
    setStudentClasses,
  ] = useState([]);

  useEffect(() => {
    let active = true;

    const loadClasses =
      async () => {
        setLoading(true);

        try {
          const response =
            await fetchClasses(
              teacherId &&
                subject
                ? {
                    subjectIds:
                      subject,
                  }
                : undefined
            );

          const classes =
            getResponseList(
              response
            );

          if (!active) {
            return;
          }

          setStudentClasses(
            mapClasses(classes)
          );

          if (
            teacherId &&
            subject &&
            classes.length === 0
          ) {
            toast.info(
              "لا توجد فصول متاحة لهذه المادة"
            );
          }
        } catch (error) {
          if (active) {
            setStudentClasses(
              []
            );

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب بيانات الفصول"
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadClasses();

    return () => {
      active = false;
    };
  }, [
    teacherId,
    subject,
  ]);

  useEffect(() => {
    if (classId) {
      setLectureClass(
        classId
      );
    }
  }, [
    classId,
    setLectureClass,
  ]);

  const handleClassChange = (
    value
  ) => {
    if (!teacherId) {
      setValue(
        "subjectId",
        ""
      );
      setValue(
        "teacherId",
        ""
      );
      setSubject(null);
    }

    setLectureClass(value);
  };

  return (
    <Select
      register={register}
      registerName="classId"
      error={
        errors.classId?.message
      }
      label="الفصل"
      required
      data={studentClasses}
      name="name"
      disabled={
        Boolean(classId) ||
        loading
      }
      defaultValue={
        classId || ""
      }
      onChange={
        handleClassChange
      }
    />
  );
};

const SelectSubject = ({
  register,
  errors,
  setSubject,
  setValue,
  lectureClass,
  teacherId,
  teacherSubjects,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [subjects, setSubjects] =
    useState([]);

  useEffect(() => {
    let active = true;

    const loadSubjects =
      async () => {
        if (
          teacherId &&
          !lectureClass
        ) {
          setSubjects(
            mapSubjects(
              teacherSubjects
            )
          );
          return;
        }

        if (!lectureClass) {
          setSubjects([]);
          setValue(
            "subjectId",
            ""
          );
          setSubject(null);
          return;
        }

        setLoading(true);

        try {
          const response =
            await fetchSubjects({
              classIds:
                lectureClass,
            });

          const classSubjects =
            getResponseList(
              response
            );

          if (!active) {
            return;
          }

          if (teacherId) {
            const teacherIds =
              new Set(
                teacherSubjects.map(
                  (item) =>
                    item?._id ||
                    item?.id
                )
              );

            const intersection =
              classSubjects.filter(
                (item) =>
                  teacherIds.has(
                    item?._id ||
                      item?.id
                  )
              );

            setSubjects(
              mapSubjects(
                intersection
              )
            );

            if (
              intersection.length ===
              0
            ) {
              setValue(
                "subjectId",
                ""
              );

              toast.info(
                "لا توجد مواد للمعلم داخل هذا الفصل"
              );
            }

            return;
          }

          setSubjects(
            mapSubjects(
              classSubjects
            )
          );

          if (
            classSubjects.length ===
            0
          ) {
            setValue(
              "subjectId",
              ""
            );

            toast.info(
              "لا توجد مواد مرتبطة بهذا الفصل"
            );
          }
        } catch (error) {
          if (active) {
            setSubjects([]);
            setValue(
              "subjectId",
              ""
            );

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب بيانات المواد"
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadSubjects();

    return () => {
      active = false;
    };
  }, [
    lectureClass,
    teacherId,
    teacherSubjects,
    setSubject,
    setValue,
  ]);

  const handleSubjectChange = (
    value
  ) => {
    if (!teacherId) {
      setValue(
        "teacherId",
        ""
      );
    }

    setSubject(value);
  };

  return (
    <Select
      register={register}
      registerName="subjectId"
      error={
        errors.subjectId?.message
      }
      label="المادة"
      required
      data={subjects}
      name="name"
      disabled={
        teacherId
          ? loading
          : !lectureClass ||
            loading
      }
      onChange={
        handleSubjectChange
      }
    />
  );
};

const SelectTeacher = ({
  register,
  errors,
  subject,
  setValue,
  teacherId,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [teachers, setTeachers] =
    useState([]);

  useEffect(() => {
    let active = true;

    const loadTeachers =
      async () => {
        if (teacherId) {
          setLoading(true);

          try {
            const response =
              await fetchSingleTeacher(
                teacherId
              );

            const teacher =
              getResponsePayload(
                response
              );

            if (
              active &&
              teacher
            ) {
              setTeachers(
                mapTeachers([
                  teacher,
                ])
              );
            }
          } finally {
            if (active) {
              setLoading(false);
            }
          }

          return;
        }

        if (!subject) {
          setTeachers([]);
          setValue(
            "teacherId",
            ""
          );
          return;
        }

        setLoading(true);

        try {
          const response =
            await fetchTeachersBySubjectId(
              subject
            );

          const payload =
            getResponsePayload(
              response
            );

          const teacherRows =
            Array.isArray(payload)
              ? payload
              : payload?.teachers ||
                [];

          if (!active) {
            return;
          }

          setTeachers(
            mapTeachers(
              teacherRows
            )
          );

          if (
            teacherRows.length ===
            0
          ) {
            toast.info(
              "لا يوجد معلمون مرتبطون بهذه المادة"
            );
          }
        } catch (error) {
          if (active) {
            setTeachers([]);

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب بيانات المعلمين"
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadTeachers();

    return () => {
      active = false;
    };
  }, [
    subject,
    teacherId,
    setValue,
  ]);

  return (
    <Select
      register={register}
      registerName="teacherId"
      error={
        errors.teacherId?.message
      }
      label="المعلم"
      required
      data={teachers}
      name="name"
      defaultValue={
        teacherId || ""
      }
      disabled={
        Boolean(teacherId) ||
        loading ||
        (!teacherId &&
          (!subject ||
            teachers.length ===
              0))
      }
    />
  );
};

export default Add;
