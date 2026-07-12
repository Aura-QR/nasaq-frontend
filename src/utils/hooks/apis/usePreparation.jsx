import { fetchSinglePreparation } from "@/APIs/school/preparation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const usePreparation = (preparationId) => {
  const [preparation, setPreparation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preparationId) {
      setPreparation(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSinglePreparation(preparationId);
      if (res.status) {
        setPreparation(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب التحضير ");
        setPreparation(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [preparationId]);

  return { preparation, loading };
};