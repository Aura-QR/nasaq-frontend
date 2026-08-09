import { fetchAdditionalFees } from "@/APIs/financials/additionalFees";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useAdditionalFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdditionalFees();
    if (res?.status || Array.isArray(res?.data)) {
      setFees(res.data || []);
    } else {
      toast.error(typeof res === "string" ? res : "حدث خطأ أثناء جلب الرسوم الإضافية");
      setFees([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { fees, loading, setFees, refetch };
};
