import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import {
  fetchLibraries,
} from "@/APIs/school/library";

export const useLibraries = (
  filters = {},
  options = {}
) => {
  const [libraries, setLibraries] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [pagination, setPagination] =
    useState(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const enabled =
    options?.enabled !== false;

  const filterString = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  const refetch = useCallback(() => {
    setRefreshKey(
      (previous) => previous + 1
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!enabled) {
      setLibraries([]);
      setPagination(null);
      setLoading(false);

      return () => {
        mounted = false;
      };
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        const response =
          await fetchLibraries(
            filters
          );

        if (!mounted) {
          return;
        }

        if (!response?.status) {
          setLibraries([]);
          setPagination(null);

          toast.error(
            response?.message ||
              "حدث خطأ أثناء جلب بيانات المكتبة"
          );

          return;
        }

        setLibraries(
          Array.isArray(
            response?.data
          )
            ? response.data
            : []
        );

        setPagination(
          response?.pagination ||
            null
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        setLibraries([]);
        setPagination(null);

        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء جلب بيانات المكتبة"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterString,
    refreshKey,
    enabled,
  ]);

  return {
    libraries,
    loading,
    pagination,
    refetch,
  };
};

export default useLibraries;