import { fetchSingleExam } from "@/APIs/school/exams";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useExam = (examId) => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examId) {
      setExam(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleExam(examId);
      console.log(res)
      if (res.status) {
        setExam(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب الامتحان");
        setExam(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [examId]);

  return { exam, loading };
};