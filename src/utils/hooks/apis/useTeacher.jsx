import { fetchSingleTeacher } from "@/APIs/users/teachers";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useTeacher = (teacherId) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setTeacher(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleTeacher(teacherId);
      if (res.status) {
        setTeacher(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المعلم");
        setTeacher(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [teacherId]);

  return { teacher, loading };
};