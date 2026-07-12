import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SelectFilter from "@/components/Filters/SelectFilter";
import { fetchClassesList } from "@/APIs/school/classes";
import { fetchClasses } from "@/APIs/school/classes";
import { Class } from "@mui/icons-material";
import { translateGender } from "@/utils/helpers/translateGender";

const ClassFilter = ({ classId, setClassId, academicYear }) => {
  // Classes list for filter
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch classes for filter
  useEffect(() => {
    const fetchClassesData = async () => {
      setLoadingClasses(true);
      
      // Use fetchClasses with filter if academicYear is provided, ifnot use fetchClassesList
      const res = academicYear 
        ? await fetchClasses({ academicYear })
        : await fetchClassesList();
      
      console.log(res);
      if (res.status) {
        // Handle different response formats
        const classesData = res.data.map(item => {
          // fetchClasses has _id, fetchClassesList has id
          const classId = item._id || item.id;
          return {
            id: classId,
            academicYear: item.academicYear,
            roomNumber: item.roomNumber,
            gender: item.gender
          };
        });
        setClasses(classesData);
      } else {
        toast.error(res.message || "حدث خطأ ما!");
        setClasses([]);
      }
      setLoadingClasses(false);
    };
    fetchClassesData();
  }, [academicYear]);
  
  return (
    <SelectFilter
      value={classId}
      onChange={setClassId}
      label="الفصل"
      icon={Class}
      allLabel="جميع الفصول"
      disabled={loadingClasses}
      options={classes.map(item => ({ 
        value: item.id, 
        label: item.academicYear + " - " + item.roomNumber + " - " + translateGender(item.gender, "classes")
      }))}
    />
  );
};

export default ClassFilter;