import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchSubjects,
  normalizeSubjectFilters,
} from "@/APIs/school/subjects";

const extractSubjects = (
  response
) => {
  const data =
    response?.data ??
    response;

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  return (
    [
      data?.docs,
      data?.items,
      data?.subjects,
      data?.results,
      data?.records,
      data?.data,
    ].find(
      Array.isArray
    ) || []
  );
};

const extractPagination = (
  response
) => {
  const data =
    response?.data ??
    response;

  return (
    response?.pagination ||
    data?.pagination ||
    data?.meta ||
    (
      data &&
      !Array.isArray(data) &&
      (
        data.totalDocs !==
          undefined ||
        data.total !==
          undefined
      )
        ? data
        : null
    )
  );
};

const useSubjects = (
  filters = {}
) => {
  const normalizedFilters =
    useMemo(
      () =>
        normalizeSubjectFilters(
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
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const load =
    useCallback(
      async ({
        force = false,
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await fetchSubjects(
            normalizedFilters,
            {
              force,
            }
          );

        if (
          response?.status ===
            false
        ) {
          setSubjects([]);
          setPagination(null);
          setError(
            response?.message ||
            "تعذر تحميل المواد الدراسية"
          );
          setLoading(false);

          return [];
        }

        const nextSubjects =
          extractSubjects(
            response
          );

        setSubjects(
          nextSubjects
        );

        setPagination(
          extractPagination(
            response
          )
        );

        setLoading(false);

        return nextSubjects;
      },
      [filtersKey]
    );

  useEffect(() => {
    let active = true;

    const run = async () => {
      const response =
        await fetchSubjects(
          normalizedFilters
        );

      if (!active) {
        return;
      }

      if (
        response?.status ===
          false
      ) {
        setSubjects([]);
        setPagination(null);
        setError(
          response?.message ||
          "تعذر تحميل المواد الدراسية"
        );
        setLoading(false);
        return;
      }

      setSubjects(
        extractSubjects(
          response
        )
      );

      setPagination(
        extractPagination(
          response
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
    subjects,
    loading,
    pagination,
    error,
    refetch: load,
  };
};

export {
  extractPagination,
  extractSubjects,
  useSubjects,
};

export default useSubjects;
