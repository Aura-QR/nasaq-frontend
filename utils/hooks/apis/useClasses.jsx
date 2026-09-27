import { fetchClasses } from "@/APIs/school/classes";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useClasses = (filters = {}) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchClasses(filters);
      if (res.status) {
        setClasses(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما اثناء جلب بيانات الفصول");
        setClasses([]);
        setPagination(null);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { classes, loading, pagination };
};
