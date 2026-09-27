import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchAttendance,
} from "@/APIs/school/attendance";

// =====================================================
// HELPERS
// =====================================================

const extractList = (response) => {
  let current = response;

  // نفك data المتداخلة بدون ما نفقد object الـ pagination
  for (let i = 0; i < 4; i += 1) {
    if (Array.isArray(current)) {
      return current;
    }

    if (
      current &&
      typeof current === "object"
    ) {
      const directCandidates = [
        current.attendances,
        current.attendance,
        current.absences,
        current.records,
        current.docs,
        current.items,
        current.results,
      ];

      const found =
        directCandidates.find(
          Array.isArray
        );

      if (found) {
        return found;
      }

      if (
        current.data !== undefined
      ) {
        current = current.data;
        continue;
      }
    }

    break;
  }

  return Array.isArray(current)
    ? current
    : [];
};

const extractPagination = (
  response,
  list
) => {
  const candidates = [
    response?.pagination,
    response?.data?.pagination,

    // بعض الـ APIs بترجع pagination fields
    // مباشرة داخل data.
    response?.data,
    response,
  ];

  const source =
    candidates.find(
      (value) =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        (
          value.totalDocs !== undefined ||
          value.total !== undefined ||
          value.totalItems !== undefined ||
          value.page !== undefined ||
          value.limit !== undefined ||
          value.totalPages !== undefined ||
          value.pages !== undefined
        )
    ) || null;

  if (!source) {
    return null;
  }

  const totalDocs = Number(
    source.totalDocs ??
      source.total ??
      source.totalItems ??
      list.length
  );

  const page = Number(
    source.page ??
      source.currentPage ??
      1
  );

  const limit = Number(
    source.limit ??
      source.pageSize ??
      list.length ??
      10
  );

  const totalPages = Number(
    source.totalPages ??
      source.pages ??
      (
        limit > 0
          ? Math.ceil(
              totalDocs / limit
            )
          : 1
      )
  );

  return {
    ...source,

    totalDocs:
      Number.isFinite(totalDocs)
        ? totalDocs
        : list.length,

    page:
      Number.isFinite(page)
        ? page
        : 1,

    limit:
      Number.isFinite(limit)
        ? limit
        : list.length,

    totalPages:
      Number.isFinite(totalPages)
        ? totalPages
        : 1,
  };
};

const isFailedResponse = (
  response
) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(
    response?.statusCode
  ) >= 400;

// =====================================================
// USE ATTENDANCES
// GET /attendance
// =====================================================

export const useAttendances = (
  filters = {}
) => {
  const [
    attendances,
    setAttendances,
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

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters || {}
        ),
      [filters]
    );

  useEffect(() => {
    let mounted = true;

    const loadAttendances =
      async () => {
        if (mounted) {
          setLoading(true);
          setError("");
        }

        try {
          const response =
            await fetchAttendance(
              filters
            );

          if (!mounted) {
            return;
          }

          if (
            isFailedResponse(
              response
            )
          ) {
            setAttendances([]);
            setPagination(null);

            setError(
              typeof response ===
                "string"
                ? response
                : response?.message ||
                    "تعذر تحميل الغيابات"
            );

            return;
          }

          const list =
            extractList(
              response
            );

          const paginationData =
            extractPagination(
              response,
              list
            );

          setAttendances(
            list
          );

          setPagination(
            paginationData
          );
        } catch (requestError) {
          if (!mounted) {
            return;
          }

          console.error(
            "useAttendances:",
            requestError
          );

          setAttendances([]);
          setPagination(null);

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "تعذر تحميل الغيابات"
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadAttendances();

    return () => {
      mounted = false;
    };

    // filters محسوبة بالفعل داخل filterString.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return {
    attendances,
    loading,
    pagination,
    error,
  };
};

// Named + default exports
// عشان يدعم:
// import { useAttendances } ...
// وأيضًا:
// import useAttendances ...
export default useAttendances;
