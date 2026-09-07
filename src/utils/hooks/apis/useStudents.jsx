import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import { fetchStudents } from "@/APIs/users/students";

const CACHE_TTL = 1500;
const responseCache = new Map();
const pendingRequests = new Map();

const normalizeFilters = (
  filters = {}
) =>
  Object.fromEntries(
    Object.entries(filters)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
      .sort(([first], [second]) =>
        first.localeCompare(second)
      )
  );

const extractStudentsResponse = (
  response
) => {
  if (
    !response ||
    response?.status === false
  ) {
    return {
      status: false,
      message:
        response?.message ||
        "حدث خطأ أثناء جلب بيانات الطلاب",
      students: [],
      pagination: null,
    };
  }

  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  const students = Array.isArray(
    payload
  )
    ? payload
    : Array.isArray(payload?.docs)
    ? payload.docs
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(
        payload?.students
      )
    ? payload.students
    : [];

  const pagination =
    response?.pagination ??
    response?.data?.pagination ??
    payload?.pagination ??
    null;

  return {
    status: true,
    students,
    pagination,
  };
};

const loadStudents = async (
  filters,
  cacheKey
) => {
  const cached =
    responseCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.time <
      CACHE_TTL
  ) {
    return cached.value;
  }

  if (
    pendingRequests.has(cacheKey)
  ) {
    return pendingRequests.get(
      cacheKey
    );
  }

  const request = fetchStudents(
    filters
  )
    .then(extractStudentsResponse)
    .then((result) => {
      if (result.status) {
        responseCache.set(
          cacheKey,
          {
            time: Date.now(),
            value: result,
          }
        );
      }

      return result;
    })
    .finally(() => {
      pendingRequests.delete(
        cacheKey
      );
    });

  pendingRequests.set(
    cacheKey,
    request
  );

  return request;
};

export const useStudents = (
  filters = {}
) => {
  const [students, setStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const normalizedFilters =
    useMemo(
      () =>
        normalizeFilters(
          filters
        ),
      [
        JSON.stringify(
          normalizeFilters(filters)
        ),
      ]
    );

  const cacheKey = useMemo(
    () =>
      JSON.stringify(
        normalizedFilters
      ),
    [normalizedFilters]
  );

  useEffect(() => {
    let active = true;

    const fetchData =
      async () => {
        setLoading(true);

        const result =
          await loadStudents(
            normalizedFilters,
            cacheKey
          );

        if (!active) return;

        if (!result.status) {
          toast.error(
            result.message,
            {
              toastId:
                `students-${cacheKey}`,
            }
          );

          setStudents([]);
          setPagination(null);
          setLoading(false);
          return;
        }

        setStudents(
          result.students
        );

        setPagination(
          result.pagination
        );

        setLoading(false);
      };

    fetchData();

    return () => {
      active = false;
    };
  }, [cacheKey]);

  return {
    students,
    loading,
    pagination,
    setPagination,
  };
};
