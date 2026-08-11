import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useGrdaesCriterion = (filters = {}) => {
  const [gradesCriterion, setGradesCriterion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchGradesCriteria(filters);
      if (res.status) {
        setGradesCriterion(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res?.message || "حدث خطأ ما أثناء جلب توزيعات الدرجات !");
        setGradesCriterion([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { gradesCriterion, loading, pagination };
};