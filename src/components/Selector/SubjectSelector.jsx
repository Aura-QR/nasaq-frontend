import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import Select from "@/components/Select/Select";

const SubjectSelector = ({
    register, 
    errors,
    defaultSubjectId = "",
    label = "اختر المادة",
    required=false,
    onChange,
    }) =>{

    // calling useSubjectsList hook to fetch subjects list
    const {subjects, loading} = useSubjects();

    // Map subjects to display both name and code
    const mappedSubjects = subjects.map((item) => ({
      id: item._id || item.id,
      subjectName: item.subjectCode 
        ? `${item.subjectName} - ${item.subjectCode}` 
        : item.subjectName,
    }));

    return (
      <Select
        register={register}
        registerName="subjectId"
        error={errors.subjectId?.message}
        label={label}
        required={required}
        data={mappedSubjects}
        name="subjectName"
        disabled={subjects.length === 0 || loading}
        defaultValue={defaultSubjectId}
        onChange={onChange}
      />
    );
}
export default SubjectSelector;