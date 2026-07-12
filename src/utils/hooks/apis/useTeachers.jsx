import { fetchTeachers } from "@/APIs/users/teachers";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useTeachers = (filters = {}) => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);

    // Memoize filters to prevent unnecessary re-fetches
    const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
          const res = await fetchTeachers(filters);
          console.log(res)
          if (res.status) {
            setTeachers(res.data);
            setPagination(res.pagination);
          } else {
            toast.error(res || "حدث خطأ ما اثناء جلب بيانات المعلمين!");
            setTeachers([]);
            setPagination(null);
          }
          setLoading(false);
      };
  
      fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterString]);

  return { teachers, loading, pagination };
};