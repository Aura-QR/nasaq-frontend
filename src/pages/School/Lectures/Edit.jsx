import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import Select from "@/components/Select/Select";
import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";
import { fetchClasses } from "@/APIs/school/classes";
import { fetchTeachersBySubjectId, fetchSingleTeacher } from "@/APIs/users/teachers";
import { fetchSubjects } from "@/APIs/school/subjects";
import { editLecture, fetchSingleLecture } from "@/APIs/school/lectures";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Get item
  const { id } = useParams();
  useEffect(() => {
    const getLecture = async () => {
      const res = await fetchSingleLecture(id);
      const lecture = res.data;
      if (lecture) {
        lecture.classId = lecture.class._id;
        lecture.subjectId = lecture.subject._id;
        lecture.teacherId = lecture.teacher._id;

        reset(lecture);
        setDefaultValues(lecture);
      } else {
        toast.error(lecture || "حدث خطأ ما أثناء جلب بيانات الحصة");
      }
    };
    getLecture();
  }, [id, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);

    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, [
      "class",
      "subject",
      "teacher",
      "preparation"
    ]);
    
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editLecture(changedData, id);
    console.log(response);
    if (response.status) {
      toast.success("تم تعديل بيانات الحصة بنجاح");
      navigate(-1);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل بيانات الحصة");
    }

    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل الحصة"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          بيانات الحصة
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
            setValue={setValue}
          />
        )}
      </Box>
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultValues, setValue }) => {
  // State to track selected subject
  const [subject, setSubject] = useState(defaultValues.subjectId || null);
  // State to track selected class
  const [lectureClass, setLectureClass] = useState(
    defaultValues.classId || null
  );
  // State to hold teacher subjects
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  
  // Check If Coming From Class Schedule or Teacher Schedule
  const [searchParams] = useSearchParams();
  const isComingFromClass = searchParams.get("isComingFromClass");
  const isComingFromTeacher = searchParams.get("isComingFromTeacher");

  // Fetch teacher subjects if coming from teacher schedule
  useEffect(() => {
    if (isComingFromTeacher && defaultValues.teacherId) {
      const getTeacherSubjects = async () => {
        const response = await fetchSingleTeacher(defaultValues.teacherId);
        if (response.status && response.data) {
          setTeacherSubjects(response.data.subjects || []);
        }
      };
      getTeacherSubjects();
    }
  }, [isComingFromTeacher, defaultValues.teacherId]);

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"dayOfWeek"}
          error={errors.dayOfWeek?.message}
          label={"اليوم"}
          required={true}
          data={Days}
          defaultValue={defaultValues.dayOfWeek}
          name={"day"}
          disabled={Boolean(isComingFromClass) || Boolean(isComingFromTeacher)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"slot"}
          error={errors.slot?.message}
          label={"الحصة"}
          required={true}
          data={Slots}
          defaultValue={defaultValues.slot}
          name={"name"}
          disabled={Boolean(isComingFromClass) || Boolean(isComingFromTeacher)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectClass
          register={register}
          errors={errors}
          defaultValues={defaultValues}
          setLectureClass={setLectureClass}
          setValue={setValue}
          setSubject={setSubject}
          disabled={Boolean(isComingFromClass)}
          isComingFromTeacher={Boolean(isComingFromTeacher)}
          subject={subject}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectSubject
          register={register}
          errors={errors}
          defaultValues={defaultValues}
          setSubject={setSubject}
          setValue={setValue}
          lectureClass={lectureClass}
          isComingFromTeacher={Boolean(isComingFromTeacher)}
          teacherSubjects={teacherSubjects}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectTeacher
          register={register}
          errors={errors}
          subject={subject}
          setValue={setValue}
          defaultValues={defaultValues}
          disabled={Boolean(isComingFromTeacher)}
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
  subject
}) => {
  const [loading, setLoading] = useState(false);
  const [studentClasses, setStudentClass] = useState([]);

  const mappedClasses = (classes) => {
    return classes.map((classItem) => ({
      id: classItem._id,
      name: `${classItem.academicYear} - ${classItem.roomNumber} - ${translateGender(classItem.gender, "class")}`,
    }));
  };

  useEffect(() => {
    const getClass = async () => {
      setLoading(true);
      
      if (isComingFromTeacher && subject) {
        // If coming from teacher schedule and subject is selected
        const response = await fetchClasses({ subjectIds: subject });
        if (response.status) {
          const newClasses = mappedClasses(response.data);
          if (newClasses.length === 0) {
            toast.error("لا يوجد فصول متاحة لهذه المادة");
            setStudentClass([]);
          } else {
            setStudentClass(newClasses);
          }
        } else {
          toast.error(response || "حدث خطأ ما أثناء جلب بيانات الفصول");
          setStudentClass([]);
        }
      } else {
        // Normal fetch all classes
        const response = await fetchClasses();
        if (response.status) {
          setStudentClass(mappedClasses(response.data));
        } else {
          toast.error(response || "حدث خطأ ما أثناء جلب بيانات الفصول");
          setStudentClass([]);
        }
      }
      setLoading(false);
    };

    getClass();
  }, [isComingFromTeacher, subject]);

  const handleClassChange = (value) => {
    // Reset subject and teacher when class changes
    if (!isComingFromTeacher) {
      setValue("subjectId", "");
      setValue("teacherId", "");
      setSubject(null);
    }
    setLectureClass(value);
  };

  return (
    <Select
      register={register}
      registerName={"classId"}
      error={errors.classId?.message}
      label={"الفصل"}
      required={true}
      data={studentClasses}
      name={"name"}
      disabled={loading || disabled}
      defaultValue={defaultValues.classId}
      onChange={handleClassChange}
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
  teacherSubjects
}) => {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const mappedSubjects = (subjects) => {
    return subjects.map((subject) => ({
      id: subject._id,
      name: subject.subjectName,
    }));
  };

  useEffect(() => {
    const getSubjects = async () => {
      // If coming from teacher schedule and no class selected, show teacher's subjects
      if (isComingFromTeacher && !lectureClass) {
        setSubjects(mappedSubjects(teacherSubjects));
        return;
      }

      // Reset subjects when class changes or is not selected
      if (!lectureClass) {
        setSubjects([]);
        setValue("subjectId", "");
        setSubject(null);
        return;
      }

      setLoading(true);

      // Fetch subjects filtered by classId
      const response = await fetchSubjects({ classIds: lectureClass });

      // If coming from teacher schedule with a class selected
      if (isComingFromTeacher) {
        if (response.status && response.data && response.data.length > 0) {
          // Get class subjects
          const classSubjects = response.data;
          
          // Find intersection between teacher subjects and class subjects
          const intersection = teacherSubjects.filter(teacherSubj =>
            classSubjects.some(classSubj => classSubj._id === teacherSubj._id)
          );

          if (intersection.length > 0) {
            setSubjects(mappedSubjects(intersection));
          } else {
            toast.error("لا يوجد مواد دراسية للمعلم متاحة للفصل");
            setSubjects([]);
            setValue("subjectId", "");
          }
        } else {
          toast.error("لا توجد مواد مرتبطة بهذا الفصل");
          setSubjects([]);
          setValue("subjectId", "");
        }
        setLoading(false);
        return;
      }

      // Not coming from teacher schedule
      if (response.status) {
        if (response.data && response.data.length > 0) {
          setSubjects(mappedSubjects(response.data));
        } else {
          toast.error("لا توجد مواد مرتبطة بهذا الفصل");
          setSubjects([]);
        }
      } else {
        toast.error(response || "حدث خطأ ما أثناء جلب بيانات المواد");
        setSubjects([]);
      }

      setLoading(false);
    };

    getSubjects();
  }, [lectureClass, setValue, setSubject, isComingFromTeacher, teacherSubjects]);

  const handleSubjectChange = (value) => {
    // Don't reset teacher when coming from teacher schedule
    if (!isComingFromTeacher) {
      setValue("teacherId", "");
    }
    setSubject(value);
  };

  return (
    <Select
      register={register}
      registerName={"subjectId"}
      error={errors.subjectId?.message}
      label={"المادة"}
      required={true}
      data={subjects}
      name={"name"}
      disabled={isComingFromTeacher ? loading : !lectureClass || loading}
      onChange={handleSubjectChange}
      defaultValue={defaultValues.subjectId || ""}
    />
  );
};

const SelectTeacher = ({
  register,
  errors,
  subject,
  setValue,
  defaultValues,
  disabled
}) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const getTeachers = async () => {
      // If disabled (coming from teacher schedule), fetch single teacher
      if (disabled && defaultValues.teacherId) {
        setLoading(true);
        const response = await fetchSingleTeacher(defaultValues.teacherId);
        if (response.status && response.data) {
          setTeachers([{
            id: response.data._id,
            name: response.data.name
          }]);
        }
        setLoading(false);
        return;
      }

      // Reset teachers when subject changes
      if (!subject) {
        setTeachers([]);
        setValue("teacherId", "");
        return;
      }

      setLoading(true);
      const response = await fetchTeachersBySubjectId(subject);
      if (response.status) {
        if (response.data.teachers && response.data.teachers.length > 0) {
          setTeachers(response.data.teachers);
        } else {
          toast.error("لا يوجد معلمين لهذة المادة");
          setTeachers([]);
        }
      } else {
        toast.error(response || "حدث خطأ ما أثناء جلب بيانات المعلمين");
        setTeachers([]);
      }
      setLoading(false);
    };

    getTeachers();
  }, [subject, setValue, disabled, defaultValues.teacherId]);

  return (
    <Select
      register={register}
      registerName={"teacherId"}
      error={errors.teacherId?.message}
      label={"المعلم"}
      required={true}
      data={teachers}
      name={"name"}
      disabled={disabled || loading || (!disabled && (!subject || teachers.length === 0))}
      defaultValue={defaultValues.teacherId || ""}
    />
  );
};

export default Edit;