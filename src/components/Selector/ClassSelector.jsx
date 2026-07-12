import { Grid } from "@mui/material";
import { useMemo, useState} from "react";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { translateGender } from "@/utils/helpers/translateGender";
import Years from "@/utils/constants/Years";
import { useClasses } from "@/utils/hooks/apis/useClasses";
const ClassSelector = ({
  register,
  errors,
  setValue,

  defaultAcademicYear = "",
  defaultGender = "",
  defaultClassId = "",

  onClassChange,
  isClassRequired=true,
  isAcademicYearRequired = false,

  showClass=true,
  showAcademicYear = true,
  showGender = false,

  defaultSelect="جميع الفصول",
  gridProps = {xs:12}, // as class selector is used in many pages with different grid sizes
}) => {
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [gender, setGender] = useState(defaultGender);
  const [classId, setClassId] = useState(defaultClassId);

  // Check if it's student or attendance context
  const isStudent = useMemo(() => {
    return showGender && showAcademicYear; // in add student
  } , [showGender, showAcademicYear]);

  const isAttendance = useMemo(() => {
    return showAcademicYear && !showGender; // in add attendance
  } , [showGender, showAcademicYear]);

  // Build filters dynamically
  const filters = {};
  if (academicYear) filters.academicYear = academicYear;
  if (gender) filters.gender = gender;

  // Fetch classes based on filters
  const { classes, loading } = useClasses(filters);

  // Map classes for display
  const mappedClasses = classes.map((item) => ({
    id: item.id || item._id,
    name: `${item.academicYear} - ${item.roomNumber} - ${translateGender(item.gender, "class")}`,
    academicYear: item.academicYear,
    roomNumber: item.roomNumber,
    gender: item.gender,
  }));

   // Check if class selector should be disabled
  const isClassDisabled = () => {
    if (loading || mappedClasses.length === 0) return true;
    // If gender is shown, it must be selected to enable class selector
    if (showGender && !gender) return true;
    // If academic year is required, it must be selected to enable class selector
    if (isAcademicYearRequired && !academicYear) return true;
    return false;
  };

  const handleClassClick = () => {
    if(isStudent){ //in add student
      if ((!academicYear || !gender) && !classId) {
        toast.info("برجاء اختيار السنة الدراسية والجنس أولاً");
      } else if (classes.length === 0 ) {
        toast.info("لا يوجد فصول مطابقة للاختيارات");
      }
    } else if (isAttendance){ //in add attendance
      if ( academicYear && classes.length===0 ) {
        toast.info("لا يوجد فصول في هذه السنة الدراسية");
      }
    }
  };

  const handleAcademicYearChange = (value) => {
    if (setValue) {
      setAcademicYear(value);
      setClassId("");
      setValue("classId", "");
      isAttendance && setValue("studentId", "");
      if (onClassChange) onClassChange("")
    }
  };

  const handleGenderChange = (value) => {
    if (setValue) {
      setGender(value);
      setClassId("");
      setValue("classId", "");
      isAttendance && setValue("studentId", "");
      if (onClassChange) onClassChange("")
    }
  };

  const handleClassChange = (value) => {
    if (setValue) {
      setClassId(value);
      setValue("classId", value);
      isAttendance && setValue("studentId", "");
      if (onClassChange) onClassChange(value)
    }
  };

  const genderOptions = [
    { id: "male", label: "ولد" },
    { id: "female", label: "بنت" },
  ];

  return (
    <>
      {showAcademicYear && (
      <Grid item {...gridProps}>
          <Select
            register={register}
            registerName="academicYear"
            data={Years}
            error={errors?.academicYear?.message}
            label="السنة الدراسية"
            onChange={handleAcademicYearChange}
            defaultSelect="جميع السنين"
            defaultValue={defaultAcademicYear}
            required={isAcademicYearRequired}
          />
      </Grid>
      )}
      {showGender && (
      <Grid item  {...gridProps} >
          <Select
            register={register}
            registerName="gender"
            data={genderOptions}
            name="label"
            error={errors?.gender?.message}
            label="الجنس"
            onChange={handleGenderChange}
            defaultValue={defaultGender}
            required={isAcademicYearRequired}
          />
      </Grid>
      )}
      {showClass && (
        <Grid item  {...gridProps} onClick={handleClassClick}>
          <Select
            register={register}
            registerName="classId"
            data={mappedClasses}
            name="name"
            error={errors?.classId?.message}
            label="الفصل"
            disabled={isClassDisabled()}
            onChange={handleClassChange}
            defaultValue={defaultClassId}
            defaultSelect={defaultSelect}
            required={isClassRequired}
          />
        </Grid>
      )}
    </>
  );
};

export default ClassSelector;