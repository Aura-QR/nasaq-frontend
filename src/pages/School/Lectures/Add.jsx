import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";
import { fetchClasses } from "@/APIs/school/classes";
import { addLecture } from "@/APIs/school/lectures";
import { fetchTeachersBySubjectId } from "@/APIs/users/teachers";
import { fetchSubjects } from "@/APIs/school/subjects";
import { fetchSingleTeacher } from "../../../APIs/users/teachers";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId");
  const day = searchParams.get("day");
  const slot = searchParams.get("slot");
  const teacherId = searchParams.get("teacherId"); //if coming from teacher schedule

  useEffect(() => {
    if (classId) { //schedule of class
      setValue("classId", classId);
    }
    if (teacherId) { //schedule of teacher
      setValue("teacherId", teacherId);
    }
    setValue("dayOfWeek", day);
    setValue("slot", slot);
  }, [classId, day, slot, setValue, teacherId]);

  const onSubmit = async (data) => {
    setLoading(true);
    data.slot = Number(data.slot);
    const response = await addLecture(data);
    if (response.status) {
      toast.success("تم إضافة الحصة بنجاح");
      navigate(-1);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة حصة دراسية"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الحصة
        </Typography>
        <DataInputs 
          register={register} 
          errors={errors} 
          setValue={setValue} 
          classId={classId} 
          day={day} 
          slot={slot} 
          teacherId={teacherId} 
        />
      </Box>
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, setValue, classId, day, slot, teacherId }) => {
  // state to hold the Id of selected subject
  const [subject, setSubject] = useState(null);
  // state to hold the selected class
  const [lectureClass, setLectureClass] = useState(null);
  //state to keep track of subjects available for the class
  const [subjects, setSubjects] = useState([]);
  //state to keep track of subjects taught by the teacher (if coming from teacher schedule only)
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // Fetch teacher subjects if coming from teacher schedule
  useEffect(() => {
    if (teacherId) { //initial filling subjects taught by the teacher if comming from teacher schedule
      const getTeacherSubjects = async () => {
        const response = await fetchSingleTeacher(teacherId);
        if (response.status && response.data) {
          setTeacherSubjects(response.data.subjects || []); // to pass it to SelectSubject component
        }
      };
      getTeacherSubjects();
    }
  }, [teacherId]);

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
          name={"day"}
          defaultValue={day || ""}
          disabled={Boolean(day)}
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
          name={"name"}
          defaultValue={slot || ""}
          disabled={Boolean(slot)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectClass
          register={register}
          errors={errors}
          setLectureClass={setLectureClass} // to set the selected classId
          classId={classId} // if coming from class schedule
          teacherId={teacherId} // if coming from teacher schedule
          subject={subject} // reflect the subjectIc selected
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectSubject
          register={register}
          errors={errors}
          setSubject={setSubject}
          setValue={setValue}
          lectureClass={lectureClass}
          subjects={subjects}
          setSubjects={setSubjects}
          teacherId={teacherId}
          teacherSubjects={teacherSubjects}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <SelectTeacher
          register={register}
          errors={errors}
          subject={subject}
          setValue={setValue}
          teacherId={teacherId}
        />
      </Grid>
    </Grid>
  );
};

const SelectClass = ({ 
  register, 
  errors, 
  setLectureClass, // reflect the selected class
  classId,
  teacherId,
  subject,
}) => {
  const [loading, setLoading] = useState(false);
  // to list the classes available for the lecture
  const [studentClasses, setStudentClasses] = useState([]);

  const mappedClasses = (classes) => {
    return classes.map((classItem) => ({
      id: classItem._id,
      name: `${classItem.academicYear} - ${classItem.roomNumber} - ${translateGender(classItem.gender, "class")}`,
      subjects: classItem.subjects || []
    }));
  }

  useEffect(() => {
    const getClasses = async () => {
      setLoading(true);
      if(teacherId && subject){
        // If coming from teacher schedule and subject is selected
        const response = await fetchClasses({subjectIds: subject});
        if (response.status){
          const newClasses = mappedClasses(response.data);
          if(newClasses.length === 0){
            toast.error("لا يوجد فصول متاحة لهذه المادة ");
            setStudentClasses([]);
            return;
          }
          else
          setStudentClasses(mappedClasses(response.data));
        }
        else {
          toast.error(response || "حدث خطأ ما أثناء جلب بيانات الفصول");
          setStudentClasses([]);
        }
      }
      else{
        // coming from class schedule or no subject selected
        const response = await fetchClasses();
        if (response.status) {
          setStudentClasses(mappedClasses(response.data));
        }
        else {
          toast.error(response || "حدث خطأ ما أثناء جلب بيانات الفصول");
          setStudentClasses([]);
        }
      }
      setLoading(false);
    };

    getClasses();
  }, [teacherId, subject]);

  // if coming from class schedule, set the classId as selected class
  useEffect(() => {
    if (classId) {
      setLectureClass(classId);
    }
  }, [classId, setLectureClass]);

  const handleClassChange = (value) => {
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
      disabled={classId ? loading || Boolean(classId) : loading}
      defaultValue={classId || ""}
      onChange={handleClassChange}
    />
  );
};

const SelectSubject = ({
  register,
  errors,
  setSubject,
  setValue,
  lectureClass,
  subjects,
  setSubjects,
  teacherId,
  teacherSubjects
}) => {
  const [loading, setLoading] = useState(false);

  const mappedSubjects = (subjects) => {
    return subjects.map((subject) => ({
      id: subject._id,
      name: subject.subjectName,
    }));
  };

  useEffect(() => {
    const getSubjects = async () => {
      // If coming from teacher schedule and no class selected, show teacher's subjects
      if (teacherId && !lectureClass) {
        setSubjects(mappedSubjects(teacherSubjects));
        return;
      }
      
      if (!lectureClass) { // coming from lecture module directly with no class
        setSubjects([]);
        setValue("subjectId", "");
        setSubject(null);
        return;
      }
      
      setLoading(true);
      const response = await fetchSubjects({ classIds: lectureClass });
        
      // If coming from teacher schedule with a class selected
      if (teacherId) {
        // Find intersection between teacher subjects and class subjects
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
  }, [lectureClass, setValue, setSubject, teacherId, teacherSubjects, setSubjects]);

  const handleSubjectChange = (value) => {
    // Don't reset teacherId if coming from teacher schedule
    if (!teacherId) {
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
      disabled={teacherId ? loading : !lectureClass || loading}
      onChange={handleSubjectChange}
    />
  );
};

const SelectTeacher = ({ register, errors, subject, setValue, teacherId }) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Fetch single teacher if teacherId is provided
  useEffect(() => {
    if (teacherId) {
      const getSingleTeacher = async () => {
        setLoading(true);
        const response = await fetchSingleTeacher(teacherId);
        if (response.status && response.data) {
          setTeachers([{
            id: response.data._id,
            name: response.data.name
          }]);
        }
        setLoading(false);
      };
      getSingleTeacher();
    }
  }, [teacherId]);

  // Fetch teachers by subject (coming from lecture module directly)
  useEffect(() => {
    if (!teacherId && subject) {
      const getTeachers = async () => {
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
    } else if (!teacherId && !subject) {
      setTeachers([]);
      setValue("teacherId", "");
    }
  }, [subject, setValue, teacherId]);

  return (
    <Select
      register={register}
      registerName={"teacherId"}
      error={errors.teacherId?.message}
      label={"المعلم"}
      required={true}
      data={teachers}
      name={"name"}
      defaultValue={teacherId || ""}
      disabled={Boolean(teacherId) || loading || (!teacherId && (!subject || teachers.length === 0))}
    />
  );
};

export default Add;