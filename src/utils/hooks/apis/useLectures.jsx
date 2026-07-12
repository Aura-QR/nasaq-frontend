import { fetchLectures } from "@/APIs/school/lectures";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useLectures = (filters = {}) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchLectures(filters);
      if (res.status) {
        setLectures(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الحصص!");
        setLectures([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { lectures, loading, pagination };
};