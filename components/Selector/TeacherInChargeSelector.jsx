import Select from "../Select/Select";
import { useTeachers } from "@/utils/hooks/apis/useTeachers";
import { toast } from "react-toastify";
import { useMemo } from "react";

const TeacherInChargeSelector = ({
  register,
  errors,
  defaultTeacherInChargeId = "",
  defaultTeacherInChargeName = "",
  label = "رائد الفصل",
}) => {
  // calling useTeachers to fetch teacher in charge based on not being selected before and is active
  const { teachers, loading } = useTeachers({
    isActive: true,
    isInCharge: false,
  });

  // Merge the current teacher in charge with available teachers
  const teachersData = useMemo(() => {
    // If there's a default teacher, add them to the list
    if (defaultTeacherInChargeId && defaultTeacherInChargeName) {
      return [
        {
          _id: defaultTeacherInChargeId,
          name: defaultTeacherInChargeName,
        },
        ...teachers,
      ];
    }
    return teachers;
  }, [teachers, defaultTeacherInChargeId, defaultTeacherInChargeName]);

  console.log(teachersData);

  const handleTeacherClick = () => {
    if (teachersData.length === 0) {
      toast.error("لا يوجد مدرسين متوفرين. جميع المدرسين مسؤولين عن فصول أخرى");
      return;
    }
  };

  return (
    <div onClick={handleTeacherClick}>
      <Select
        register={register}
        registerName={"teacherInChargeId"}
        error={errors.teacherInChargeId?.message}
        data={teachersData}
        name="name"
        value="_id"
        disabled={loading || teachersData.length === 0}
        defaultValue={defaultTeacherInChargeId}
        label={label}
      />
    </div>
  );
};

export default TeacherInChargeSelector;
