import { fetchLectures } from "@/APIs/school/lectures";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export const useLectures = (
  filters = {},
  options = {}
) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const enabled = options?.enabled !== false;

  const filterString = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  useEffect(() => {
    let mounted = true;

    if (!enabled) {
      setLoading(false);
      setLectures([]);
      setPagination(null);
      return () => {
        mounted = false;
      };
    }

    const fetchData = async () => {
      setLoading(true);

      const res = await fetchLectures(filters);

      if (!mounted) {
        return;
      }

      if (res?.status) {
        setLectures(
          Array.isArray(res?.data) ? res.data : []
        );
        setPagination(res?.pagination ?? null);
      } else {
        toast.error(
          res?.message ||
            "حدث خطأ ما أثناء جلب بيانات الحصص!"
        );
        setLectures([]);
        setPagination(null);
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
    // filters are represented by filterString intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString, enabled]);

  return {
    lectures,
    loading,
    pagination,
  };
};
