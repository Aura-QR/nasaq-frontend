import { Grid } from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import MultiSelect from "@/components/MultiSelect/MultiSelect";
import { translateGender } from "@/utils/helpers/translateGender";
import Years from "@/utils/constants/Years";
import { useClasses } from "@/utils/hooks/apis/useClasses";

const ClassSelectors = ({
  register,
  errors,
  defaultAcademicYear = "",
  selectedClassIds = [],
  setSelectedClassIds,
  onAcademicYearChange,
  setValue,
}) => {
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);

  // Build filters dynamically
  const filters = {};
  if (academicYear) filters.academicYear = academicYear;

  // Fetch classes based on filters
  const { classes, loading } = useClasses(filters);

  // Map classes for display
  const mappedClasses = classes.map((item) => ({
    id: item.id || item._id,
    name: `${item.academicYear} - ${item.roomNumber} - ${translateGender(item.gender,"class")}`,
  }));

  // Check if class selector should be disabled
  const isClassDisabled = () => {
    if (loading) return true;
    if (!academicYear) return true;
    if (mappedClasses.length === 0) return true;
    return false;
  };

  const handleClassClick = () => {
    if (!academicYear) {
      toast.info("برجاء اختيار السنة الدراسية أولاً");
      return;
    }
    if (academicYear && classes.length === 0 && !loading) {
      toast.info("لا يوجد فصول في هذه السنة الدراسية");
      return;
    }
  };

  const handleAcademicYearChange = (value) => {
    setAcademicYear(value);
    setSelectedClassIds([]);
    // Call the parent callback if provided
    if (onAcademicYearChange) {
      onAcademicYearChange(value);
    }
  };

  const handleClassChange = (ids) => {
    setSelectedClassIds(ids);
    setValue("classIds", ids);
  };

  return (
    <>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName="academicYear"
          data={Years}
          error={errors?.academicYear?.message}
          label="السنة الدراسية"
          onChange={handleAcademicYearChange}
          defaultSelect="جميع السنين"
          defaultValue={defaultAcademicYear}
          required={true}
        />
      </Grid>
      <Grid item xs={12} onClick={handleClassClick}>
        <MultiSelect
          register={register}
          registerName="classIds"
          data={mappedClasses}
          name="name"
          error={errors?.classIds?.message}
          label="الفصول"
          disabled={isClassDisabled()}
          onChange={handleClassChange}
          required={true}
          defaultValue={selectedClassIds}
          selectedValues={selectedClassIds}
          setSelectedValues={setSelectedClassIds}
        />
      </Grid>
    </>
  );
};

export default ClassSelectors;