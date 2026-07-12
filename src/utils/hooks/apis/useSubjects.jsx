import { fetchSubjects } from "@/APIs/school/subjects";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useSubjects = (filters = {}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null)

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSubjects(filters);
      if (res.status) {
        setSubjects(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المواد");
        setSubjects([]);
        setPagination(null)
      }
      setLoading(false);
    };

    fetchData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { subjects, loading, pagination };
};