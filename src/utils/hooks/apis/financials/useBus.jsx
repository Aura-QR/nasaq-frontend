import {
  fetchBusCandidates,
  fetchBusList,
  fetchBusRecord,
  fetchMyBusRecord,
} from "@/APIs/financials/bus";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

const getResponseMessage = (
  response,
  fallback
) => {
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.error ||
    response?.data?.message ||
    response?.data?.error ||
    fallback
  );
};

const extractList = (
  response,
  preferredKeys = []
) => {
  const roots = [
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const root of roots) {
    if (Array.isArray(root)) {
      return root;
    }

    if (
      !root ||
      typeof root !== "object"
    ) {
      continue;
    }

    for (const key of preferredKeys) {
      if (Array.isArray(root?.[key])) {
        return root[key];
      }
    }

    const commonKeys = [
      "docs",
      "items",
      "results",
      "records",
      "data",
    ];

    for (const key of commonKeys) {
      if (Array.isArray(root?.[key])) {
        return root[key];
      }
    }
  }

  return [];
};

const extractPagination = (
  response
) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
  ];

  const source =
    candidates.find(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item?.totalDocs !==
          undefined ||
          item?.totalPages !==
            undefined)
    );

  if (!source) {
    return null;
  }

  const totalDocs = Number(
    source?.totalDocs
  );

  const totalPages = Number(
    source?.totalPages
  );

  if (
    !Number.isFinite(totalDocs) ||
    !Number.isFinite(totalPages)
  ) {
    return null;
  }

  return {
    totalDocs,
    totalPages,
  };
};

const normalizeEntityId = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const normalizeCandidate = (
  item
) => {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const nestedStudent =
    item?.student &&
    typeof item.student ===
      "object"
      ? item.student
      : null;

  const nestedStudentId =
    item?.studentId &&
    typeof item.studentId ===
      "object"
      ? item.studentId
      : null;

  const looksLikeStudent =
    Boolean(
      item?._id ||
        item?.id
    ) &&
    Boolean(
      item?.name ||
        item?.fullName ||
        item?.firstName ||
        item?.fatherName ||
        item?.familyName ||
        item?.email
    );

  let student =
    nestedStudent ||
    nestedStudentId ||
    (looksLikeStudent
      ? item
      : null);

  if (!student) {
    const studentId =
      normalizeEntityId(
        item?.studentId
      );

    if (!studentId) {
      return null;
    }

    student = {
      _id: studentId,
      name:
        item?.studentName ||
        item?.name ||
        "",
      firstName:
        item?.firstName ||
        "",
      fatherName:
        item?.fatherName ||
        "",
      familyName:
        item?.familyName ||
        "",
    };
  }

  const classCandidate =
    (
      item?.class &&
      typeof item.class ===
        "object"
        ? item.class
        : null
    ) ||
    (
      item?.classId &&
      typeof item.classId ===
        "object"
        ? item.classId
        : null
    ) ||
    (
      student?.class &&
      typeof student.class ===
        "object"
        ? student.class
        : null
    ) ||
    (
      student?.classId &&
      typeof student.classId ===
        "object"
        ? student.classId
        : null
    ) ||
    {};

  const studentId =
    normalizeEntityId(
      student
    );

  if (!studentId) {
    return null;
  }

  return {
    ...item,
    student: {
      ...student,
      _id: studentId,
    },
    class: classCandidate,
  };
};

const normalizeCandidates = (
  response
) => {
  const list =
    extractList(
      response,
      [
        "candidates",
        "students",
      ]
    );

  const normalized = list
    .map(normalizeCandidate)
    .filter(Boolean);

  /*
   * بعض ردود الـ backend قد تحتوي نفس الطالب
   * أكثر من مرة بسبب joins / enrollments قديمة.
   * نخلي كل طالب يظهر مرة واحدة فقط حسب student._id.
   */
  const uniqueByStudentId =
    new Map();

  normalized.forEach((item) => {
    const studentId =
      normalizeEntityId(
        item?.student
      );

    if (
      studentId &&
      !uniqueByStudentId.has(
        studentId
      )
    ) {
      uniqueByStudentId.set(
        studentId,
        item
      );
    }
  });

  return Array.from(
    uniqueByStudentId.values()
  );
};

export const useBus = (
  studentId
) => {
  const [
    busRecord,
    setBusRecord,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const fetchData =
    useCallback(
      async () => {
        if (!studentId) {
          setBusRecord(null);
          setLoading(false);
          return null;
        }

        setLoading(true);

        try {
          const res =
            await fetchBusRecord(
              studentId
            );

          if (res?.status) {
            const record =
              res?.data?.data ??
              res?.data ??
              null;

            setBusRecord(record);
            return record;
          }

          toast.error(
            getResponseMessage(
              res,
              "حدث خطأ ما أثناء جلب بيانات الباص"
            )
          );

          setBusRecord(null);
          return null;
        } catch (error) {
          toast.error(
            getResponseMessage(
              error,
              "حدث خطأ ما أثناء جلب بيانات الباص"
            )
          );

          setBusRecord(null);
          return null;
        } finally {
          setLoading(false);
        }
      },
      [studentId]
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    busRecord,
    loading,
    setBusRecord,
    refetch: fetchData,
  };
};

export const useMyBus = () => {
  const [
    busRecord,
    setBusRecord,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const fetchData =
    useCallback(
      async () => {
        setLoading(true);

        try {
          const res =
            await fetchMyBusRecord();

          if (res?.status) {
            const record =
              res?.data?.data ??
              res?.data ??
              null;

            setBusRecord(record);
            return record;
          }

          toast.error(
            getResponseMessage(
              res,
              "حدث خطأ ما أثناء جلب بيانات الباص"
            )
          );

          setBusRecord(null);
          return null;
        } catch (error) {
          toast.error(
            getResponseMessage(
              error,
              "حدث خطأ ما أثناء جلب بيانات الباص"
            )
          );

          setBusRecord(null);
          return null;
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    busRecord,
    loading,
    setBusRecord,
    refetch: fetchData,
  };
};

export const useBusList = (
  filters = {}
) => {
  const [
    busRecords,
    setBusRecords,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters || {}
        ),
      [filters]
    );

  const requestFilters =
    useMemo(() => {
      try {
        return JSON.parse(
          filterString
        );
      } catch {
        return {};
      }
    }, [filterString]);

  const fetchData =
    useCallback(
      async () => {
        setLoading(true);

        try {
          const res =
            await fetchBusList(
              requestFilters
            );

          if (res?.status) {
            const records =
              extractList(
                res,
                [
                  "busRecords",
                  "records",
                ]
              );

            setBusRecords(records);

            setPagination(
              extractPagination(res)
            );

            return records;
          }

          toast.error(
            getResponseMessage(
              res,
              "حدث خطأ ما أثناء جلب قائمة الباص"
            )
          );

          setBusRecords([]);
          setPagination(null);
          return [];
        } catch (error) {
          toast.error(
            getResponseMessage(
              error,
              "حدث خطأ ما أثناء جلب قائمة الباص"
            )
          );

          setBusRecords([]);
          setPagination(null);
          return [];
        } finally {
          setLoading(false);
        }
      },
      [requestFilters]
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    busRecords,
    loading,
    pagination,
    setPagination,
    refetch: fetchData,
  };
};

export const useBusCandidates = (
  filters = {}
) => {
  const [
    candidates,
    setCandidates,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters || {}
        ),
      [filters]
    );

  const requestFilters =
    useMemo(() => {
      try {
        return JSON.parse(
          filterString
        );
      } catch {
        return {};
      }
    }, [filterString]);

  const fetchData =
    useCallback(
      async () => {
        setLoading(true);

        try {
          const res =
            await fetchBusCandidates(
              requestFilters
            );

          if (res?.status) {
            const normalized =
              normalizeCandidates(
                res
              );

            setCandidates(
              normalized
            );

            return normalized;
          }

          toast.error(
            getResponseMessage(
              res,
              "حدث خطأ ما أثناء جلب الطلاب المتاحين للباص"
            )
          );

          setCandidates([]);
          return [];
        } catch (error) {
          toast.error(
            getResponseMessage(
              error,
              "حدث خطأ ما أثناء جلب الطلاب المتاحين للباص"
            )
          );

          setCandidates([]);
          return [];
        } finally {
          setLoading(false);
        }
      },
      [requestFilters]
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    candidates,
    loading,
    refetch: fetchData,
  };
};
