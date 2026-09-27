import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { fetchAdditionalFees } from "@/APIs/financials/additionalFees";

const extractItems = (
  value,
  depth = 0
) => {
  if (!value || depth > 6) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "object") {
    return [];
  }

  for (const key of [
    "additionalFees",
    "fees",
    "docs",
    "items",
    "results",
    "records",
    "data",
  ]) {
    const items = extractItems(
      value?.[key],
      depth + 1
    );

    if (items.length > 0) {
      return items;
    }
  }

  return [];
};

export const useAdditionalFees = () => {
  const [
    additionalFees,
    setAdditionalFees,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    const response =
      await fetchAdditionalFees();

    if (response?.status === false) {
      setAdditionalFees([]);
      setError(
        response?.message ||
          "تعذر تحميل الرسوم الإضافية"
      );
      setLoading(false);
      return;
    }

    setAdditionalFees(
      extractItems(response)
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    additionalFees,
    setAdditionalFees,
    loading,
    error,
    refetch,
  };
};

export default useAdditionalFees;
