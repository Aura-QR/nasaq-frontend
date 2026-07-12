import { fetchSingleLecture } from "@/APIs/school/lectures";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useLecture = (lectureId) => {
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lectureId) {
      setLecture(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleLecture(lectureId);
      if (res.status) {
        setLecture(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الحصة");
        setLecture(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [lectureId]);

  return { lecture, loading };
};