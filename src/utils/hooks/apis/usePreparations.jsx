import { fetchPreparations } from "@/APIs/school/preparation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const usePreparations = (filters = {}) => {
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchPreparations(filters);
      if (res.status) {
        setPreparations(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب التحضيرات !");
        setPreparations([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { preparations, loading, pagination };
};
