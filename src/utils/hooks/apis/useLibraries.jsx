import { fetchLibraries } from "@/APIs/school/library";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useLibraries = (filters = {}) => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchLibraries(filters);
      if (res.status) {
        setLibraries(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المكتبة!");
        setLibraries([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { libraries, loading, pagination };
};