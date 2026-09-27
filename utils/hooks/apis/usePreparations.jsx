import { fetchPreparations } from "@/APIs/school/preparation";
import {
  useState,
  useEffect,
  useMemo,
} from "react";
import { toast } from "react-toastify";

export const usePreparations = (
  filters = {}
) => {
  const [
    preparations,
    setPreparations,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const filterString = useMemo(
    () =>
      JSON.stringify(
        filters || {}
      ),
    [filters]
  );

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        const res =
          await fetchPreparations(
            filters
          );

        if (!active) {
          return;
        }

        if (res?.status) {
          const data =
            Array.isArray(
              res?.data
            )
              ? res.data
              : res?.data?.docs ||
                res?.data?.items ||
                res?.data?.results ||
                [];

          const responsePagination =
            res?.pagination ||
            res?.data?.pagination ||
            null;

          setPreparations(data);

          setPagination(
            responsePagination
          );

          return;
        }

        toast.error(
          res?.message ||
            "حدث خطأ ما أثناء جلب التحضيرات !"
        );

        setPreparations([]);
        setPagination(null);
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "حدث خطأ ما أثناء جلب التحضيرات !"
        );

        setPreparations([]);
        setPagination(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };

    // filters intentionally tracked through filterString
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return {
    preparations,
    loading,
    pagination,
  };
};