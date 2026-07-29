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
  EditNoteRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Loading from "@/components/Loading";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";
import { getChangedValues } from "@/utils/helpers/getChangedValues";

import { fetchClasses } from "@/APIs/school/classes";
import {
  editLecture,
  fetchSingleLecture,
} from "@/APIs/school/lectures";
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


const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [loading, setLoading] =
    useState(false);

  const [
    lectureLoading,
    setLectureLoading,
  ] = useState(true);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  useEffect(() => {
    let active = true;

    const loadLecture =
      async () => {
        setLectureLoading(true);

        try {
          const response =
            await fetchSingleLecture(
              id
            );

          const lecture =
            getResponsePayload(
              response
            );

          if (
            !lecture ||
            typeof lecture !==
              "object"
          ) {
            toast.error(
              getErrorMessage(
                response,
                "حدث خطأ أثناء جلب بيانات الحصة"
              )
            );
            return;
          }

          const normalized = {
            ...lecture,
            classId:
              lecture?.classId ||
              lecture?.class?._id ||
              lecture?.class?.id ||
              "",
            subjectId:
              lecture?.subjectId ||
              lecture?.subject?._id ||
              lecture?.subject?.id ||
              "",
            teacherId:
              lecture?.teacherId ||
              lecture?.teacher?._id ||
              lecture?.teacher?.id ||
              "",
            slot: Number(
              lecture?.slot
            ),
          };

          if (active) {
            reset(normalized);
            setDefaultValues(
              normalized
            );
          }
        } catch (error) {
          toast.error(
            error?.response?.data
              ?.message ||
              "حدث خطأ أثناء جلب بيانات الحصة"
          );
        } finally {
          if (active) {
            setLectureLoading(
              false
            );
          }
        }
      };

    loadLecture();

    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (
    formData
  ) => {
    const normalizedForm = {
      ...formData,
      slot: Number(
        formData.slot
      ),
    };

    const changedData =
      getChangedValues(
        normalizedForm,
        defaultValues,
        [
          "class",
          "subject",
          "teacher",
          "preparation",
        ]
      );

    if (
      Object.keys(
        changedData
      ).length === 0
    ) {
      toast.info(
        "لم تحدث أي بيانات للتعديل"
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await editLecture(
          changedData,
          id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء تعديل بيانات الحصة"
          )
        );
        return;
      }

      toast.success(
        "تم تعديل بيانات الحصة بنجاح"
      );

      navigate(-1);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل بيانات الحصة"
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    lectureLoading &&
    !defaultValues
  ) {
    return <Loading />;
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
            <Back title="تعديل الحصة" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              عدّل بيانات الحصة
              واحفظ التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <EditNoteRounded />
            }
            title="بيانات الحصة"
            description="راجع اليوم والوقت والفصل والمادة والمعلم المسؤول."
          />

          {defaultValues && (
            <DataInputs
              register={register}
              errors={errors}
              defaultValues={
                defaultValues
              }
              setValue={setValue}
            />
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
                lectureLoading
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

const DataInputs = ({
  register,
  errors,
  defaultValues,
  setValue,
}) => {
  const [subject, setSubject] =
    useState(
      defaultValues
        .subjectId ||
        null
    );

  const [
    lectureClass,
    setLectureClass,
  ] = useState(
    defaultValues
      .classId ||
      null
  );

  const [
    teacherSubjects,
    setTeacherSubjects,
  ] = useState([]);

  const [searchParams] =
    useSearchParams();

  const isComingFromClass =
    searchParams.get(
      "isComingFromClass"
    ) === "true";

  const isComingFromTeacher =
    searchParams.get(
      "isComingFromTeacher"
    ) === "true";

  useEffect(() => {
    if (
      !isComingFromTeacher ||
      !defaultValues.teacherId
    ) {
      return;
    }

    let active = true;

    const loadTeacher =
      async () => {
        try {
          const response =
            await fetchSingleTeacher(
              defaultValues
                .teacherId
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
  }, [
    isComingFromTeacher,
    defaultValues.teacherId,
  ]);

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
          defaultValue={
            defaultValues
              .dayOfWeek
          }
          name="day"
          disabled={
            isComingFromClass ||
            isComingFromTeacher
          }
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
          defaultValue={
            defaultValues.slot
          }
          name="name"
          disabled={
            isComingFromClass ||
            isComingFromTeacher
          }
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
          defaultValues={
            defaultValues
          }
          setLectureClass={
            setLectureClass
          }
          setValue={setValue}
          setSubject={setSubject}
          disabled={
            isComingFromClass
          }
          isComingFromTeacher={
            isComingFromTeacher
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
          defaultValues={
            defaultValues
          }
          setSubject={
            setSubject
          }
          setValue={setValue}
          lectureClass={
            lectureClass
          }
          isComingFromTeacher={
            isComingFromTeacher
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
          defaultValues={
            defaultValues
          }
          disabled={
            isComingFromTeacher
          }
        />
      </Grid>
    </Grid>
  );
};

const SelectClass = ({
  register,
  errors,
  defaultValues,
  setLectureClass,
  setValue,
  setSubject,
  disabled,
  isComingFromTeacher,
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
              isComingFromTeacher &&
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

          if (active) {
            setStudentClasses(
              mapClasses(classes)
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
    isComingFromTeacher,
    subject,
  ]);

  const handleClassChange = (
    value
  ) => {
    if (!isComingFromTeacher) {
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
        loading ||
        disabled
      }
      defaultValue={
        defaultValues.classId
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
  defaultValues,
  setSubject,
  setValue,
  lectureClass,
  isComingFromTeacher,
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
          isComingFromTeacher &&
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

          if (
            isComingFromTeacher
          ) {
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
    isComingFromTeacher,
    teacherSubjects,
    setSubject,
    setValue,
  ]);

  const handleSubjectChange = (
    value
  ) => {
    if (!isComingFromTeacher) {
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
        isComingFromTeacher
          ? loading
          : !lectureClass ||
            loading
      }
      onChange={
        handleSubjectChange
      }
      defaultValue={
        defaultValues.subjectId ||
        ""
      }
    />
  );
};

const SelectTeacher = ({
  register,
  errors,
  subject,
  setValue,
  defaultValues,
  disabled,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [teachers, setTeachers] =
    useState([]);

  useEffect(() => {
    let active = true;

    const loadTeachers =
      async () => {
        if (
          disabled &&
          defaultValues.teacherId
        ) {
          setLoading(true);

          try {
            const response =
              await fetchSingleTeacher(
                defaultValues
                  .teacherId
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
    disabled,
    defaultValues.teacherId,
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
      disabled={
        disabled ||
        loading ||
        (!disabled &&
          (!subject ||
            teachers.length ===
              0))
      }
      defaultValue={
        defaultValues.teacherId ||
        ""
      }
    />
  );
};

export default Edit;
