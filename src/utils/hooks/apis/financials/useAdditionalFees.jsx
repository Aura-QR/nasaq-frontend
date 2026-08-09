import { fetchAdditionalFees } from "@/APIs/financials/additionalFees";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useAdditionalFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAdditionalFees();
    if (res?.status || Array.isArray(res?.data)) {
      setFees(res.data || []);
    } else {
      const errMsg = typeof res === "string" ? res : res?.message || "حدث خطأ أثناء جلب الرسوم الإضافية";
      setError(errMsg);
      toast.error(errMsg);
      setFees([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    fees,
    additionalFees: fees,
    loading,
    error,
    setFees,
    setAdditionalFees: setFees,
    refetch,
  };
};
