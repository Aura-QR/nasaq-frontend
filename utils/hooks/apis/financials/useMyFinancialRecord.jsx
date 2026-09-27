import { fetchMyFinancialRecord } from "@/APIs/financials/financialRecords";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useMyFinancialRecord = () => {
  const [financialRecord, setFinancialRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetchMyFinancialRecord();

      if (res?.status) {
        setFinancialRecord(res?.data || null);
      } else {
        const message =
          res?.message ||
          "حدث خطأ أثناء جلب مصاريف الطالب";

        setFinancialRecord(null);
        toast.error(message);
      }
    } catch (error) {
      console.error(
        "[Student Financial Record] ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ أثناء جلب مصاريف الطالب";

      setFinancialRecord(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    financialRecord,
    loading,
    setFinancialRecord,
    refetch: fetchData,
  };
};