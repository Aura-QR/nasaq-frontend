import { fetchSingleSubject } from "@/APIs/school/subjects";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useSubject = (subjectId) => {
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subjectId) {
      setSubject(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleSubject(subjectId);
      console.log(res)
      if (res.status) {
        setSubject(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المادة");
        setSubject(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [subjectId]);

  return { subject, loading };
};