import { fetchSingleGradesCriteria } from "@/APIs/school/gradesCriteria";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useGradesCriteria = (gradesCriteriaId) => {
  const [gradesCriteria, setGradesCriteria] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gradesCriteriaId) {
      setGradesCriteria(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleGradesCriteria(gradesCriteriaId);
      console.log(res)
      if (res.status) {
        setGradesCriteria(res.data);
      } else {
        toast.error(res?.message || "حدث خطأ ما أثناء جلب توزع الدرجات");
        setGradesCriteria(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [gradesCriteriaId]);

  return { gradesCriteria, loading };
};