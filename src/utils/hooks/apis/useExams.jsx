import { fetchExams } from "@/APIs/school/exams";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useExams = (filters = {}) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchExams(filters);
      if (res.status) {
        setExams(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب الامتحانات !");
        setExams([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { exams, loading, pagination };
};