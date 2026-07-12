import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { useStudents } from "@/utils/hooks/apis/useStudents";

const StudentSelector = ({
  register,
  errors,
  classId,
  defaultStudentId = "",
  setValue,
  label = "اختر الطالب",
}) => {
  // calling useStudents hook to fetch students based on classId
  const { students, loading } = useStudents({classId});

  // Map students
  const mappedStudents = students.map((item) => ({
    id: item._id,
    name: item.name,
  }));

  const handleStudentChange = (value) => {
    if (setValue) {
      setValue("studentId", value);
    }
  };
  const handleStudentClick = () => {
    if (!classId) {
      toast.error("من فضلك اختر الفصل اولا ليظهر لك قائمة طلاب الفصل");
    } else if (students.length === 0) {
      toast.error("لا يوجد طلاب في هذا الفصل");
    }
  };

  return (
    <div onClick={handleStudentClick}>
      <Select
        register={register}
        registerName="studentId"
        error={errors.studentId?.message}
        label={label}
        required={true}
        data={mappedStudents}
        name="name"
        disabled={!classId || loading || mappedStudents.length === 0}
        defaultValue={defaultStudentId}
        onChange={handleStudentChange}
      />
    </div>
  );
};

export default StudentSelector;
