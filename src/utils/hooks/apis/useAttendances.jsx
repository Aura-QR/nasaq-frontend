import { fetchAttendance } from "@/APIs/school/attendance";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useAttendances = (filters = {}) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchAttendance(filters);
      if (res.status) {
        setAttendances(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المكتبة!");
        setAttendances([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { attendances, loading, pagination };
};