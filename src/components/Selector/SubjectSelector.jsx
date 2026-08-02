import Select from "@/components/Select/Select";

const SubjectSelector = ({
  register,
  errors,
  data = [],
  loading = false,
  defaultSubjectId = "",
  label = "المادة",
  required = false,
  disabled = false,
  registerName = "subjectOfferingId",
  valueName = "name",
  onChange,
}) => (
  <Select
    register={register}
    registerName={registerName}
    error={errors?.[registerName]?.message}
    label={label}
    required={required}
    data={data}
    name={valueName}
    disabled={
      disabled ||
      loading ||
      data.length === 0
    }
    defaultValue={defaultSubjectId}
    onChange={onChange}
  />
);

export default SubjectSelector;
