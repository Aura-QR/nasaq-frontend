import { fetchStudents } from "@/APIs/users/students";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useStudents = (filters = {}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchStudents(filters);
      if (res.status) {
        setStudents(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res.message || "حدث خطأ ما أثناء جلب بيانات الطلاب!");
        setStudents([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { students, loading, pagination, setPagination};
};