import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSchoolTeachers,
  normalizeTeacherFilters,
} from "@/APIs/school/teachers";

const extractTeachers = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  const candidates = [
    value?.docs,
    value?.items,
    value?.teachers,
    value?.results,
    value?.records,
    value?.data,
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
};

const extractPagination = (
  value,
  {
    page,
    limit,
  }
) => {
  const source =
    value?.pagination ||
    value?.meta ||
    value;

  const totalDocs =
    Number(
      source?.totalDocs ??
      source?.total ??
      source?.count
    );

  const totalPages =
    Number(
      source?.totalPages ??
      source?.pages
    );

  const currentPage =
    Number(
      source?.page ??
      source?.currentPage ??
      page
    );

  const currentLimit =
    Number(
      source?.limit ??
      source?.pageSize ??
      limit
    );

  if (
    !Number.isFinite(
      totalDocs
    ) &&
    !Number.isFinite(
      totalPages
    )
  ) {
    return null;
  }

  return {
    ...source,
    totalDocs:
      Number.isFinite(
        totalDocs
      )
        ? totalDocs
        : 0,
    totalPages:
      Number.isFinite(
        totalPages
      )
        ? totalPages
        : 1,
    page:
      Number.isFinite(
        currentPage
      )
        ? currentPage
        : page,
    limit:
      Number.isFinite(
        currentLimit
      )
        ? currentLimit
        : limit,
  };
};

const useTeachers = (
  filters = {}
) => {
  const normalizedFilters =
    useMemo(
      () =>
        normalizeTeacherFilters(
          filters
        ),
      [
        JSON.stringify(
          filters
        ),
      ]
    );

  const filtersKey =
    useMemo(
      () =>
        JSON.stringify(
          normalizedFilters
        ),
      [normalizedFilters]
    );

  const [
    teachers,
    setTeachers,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const load = useCallback(
    async ({
      force = false,
      silent = false,
    } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const response =
        await getSchoolTeachers(
          normalizedFilters,
          {
            force,
          }
        );

      if (
        response?.status ===
          false
      ) {
        setTeachers([]);
        setPagination(null);
        setError(
          response?.message ||
          "تعذر تحميل المعلمين"
        );
        setLoading(false);

        return [];
      }

      const nextTeachers =
        extractTeachers(
          response?.data
        );

      setTeachers(
        nextTeachers
      );

      setPagination(
        extractPagination(
          response?.pagination ??
            response?.data,
          normalizedFilters
        )
      );

      setLoading(false);

      return nextTeachers;
    },
    [filtersKey]
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      const result =
        await getSchoolTeachers(
          normalizedFilters
        );

      if (!active) {
        return;
      }

      if (
        result?.status ===
          false
      ) {
        setTeachers([]);
        setPagination(null);
        setError(
          result?.message ||
          "تعذر تحميل المعلمين"
        );
        setLoading(false);
        return;
      }

      setTeachers(
        extractTeachers(
          result?.data
        )
      );

      setPagination(
        extractPagination(
          result?.pagination ??
            result?.data,
          normalizedFilters
        )
      );

      setError("");
      setLoading(false);
    };

    setLoading(true);
    run();

    return () => {
      active = false;
    };
  }, [filtersKey]);

  return {
    teachers,
    pagination,
    loading,
    error,
    refetch: load,
  };
};

export {
  extractPagination,
  extractTeachers,
  useTeachers,
};

export default useTeachers;
