import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/APIs/Axios";

const ALLOWED_FILTERS = new Set([
  "page",
  "limit",
  "classId",
  "studentName",
  "tuitionStatus",
  "academicYearId",
]);

const cleanFilters = (
  filters = {}
) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        ALLOWED_FILTERS.has(
          key
        ) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

const extractRecords = (
  response
) => {
  const payload =
    response?.data ??
    response;

  const data =
    payload?.data ??
    payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object"
  ) {
    for (const key of [
      "docs",
      "items",
      "results",
      "records",
      "rows",
    ]) {
      if (
        Array.isArray(
          data?.[key]
        )
      ) {
        return data[key];
      }
    }
  }

  return [];
};

const extractPagination = (
  response
) => {
  const payload =
    response?.data ??
    response;

  return (
    payload?.pagination ||
    payload?.meta ||
    payload?.data?.pagination ||
    null
  );
};

export const useFinancialRecords = (
  filters = {}
) => {
  const [
    financialRecords,
    setFinancialRecords,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const params =
    useMemo(
      () =>
        cleanFilters(
          filters
        ),
      [filters]
    );

  const refetch =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get(
            "/financial/records",
            {
              params,
            }
          );

        setFinancialRecords(
          extractRecords(
            response
          )
        );

        setPagination(
          extractPagination(
            response
          )
        );
      } catch (err) {
        setFinancialRecords([]);
        setPagination(null);

        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "تعذر تحميل السجلات المالية"
        );
      } finally {
        setLoading(false);
      }
    }, [params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    financialRecords,
    setFinancialRecords,
    pagination,
    loading,
    error,
    refetch,
  };
};

export default useFinancialRecords;
