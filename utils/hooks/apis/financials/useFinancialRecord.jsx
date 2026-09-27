import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "@/APIs/Axios";

const extractRecord = (
  response
) => {
  const payload =
    response?.data ??
    response;

  const data =
    payload?.data ??
    payload;

  if (
    !data ||
    Array.isArray(data) ||
    typeof data !== "object"
  ) {
    return null;
  }

  return (
    data?.record ||
    data?.financialRecord ||
    data?.item ||
    data
  );
};

export const useFinancialRecord = (
  studentId,
  academicYearId = ""
) => {
  const [
    financialRecord,
    setFinancialRecord,
  ] = useState(null);

  const [loading, setLoading] =
    useState(Boolean(studentId));

  const [error, setError] =
    useState("");

  const refetch =
    useCallback(async () => {
      if (!studentId) {
        setFinancialRecord(
          null
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await api.get(
            `/financial/records/${studentId}`,
            {
              params:
                academicYearId
                  ? {
                      academicYearId,
                    }
                  : undefined,
            }
          );

        setFinancialRecord(
          extractRecord(
            response
          )
        );
      } catch (err) {
        setFinancialRecord(
          null
        );

        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "تعذر تحميل الملف المالي للطالب"
        );
      } finally {
        setLoading(false);
      }
    }, [
      studentId,
      academicYearId,
    ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    financialRecord,
    setFinancialRecord,
    loading,
    error,
    refetch,
  };
};

export default useFinancialRecord;
