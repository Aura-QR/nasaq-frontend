import { fetchSingleStudent } from "@/APIs/users/students";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useStudent = (studentId) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setStudent(null);
      toast.error("معرف الطالب غير موجود لجلب البيانات");
      return;
    }
    const fetchData = async () => {
      const res = await fetchSingleStudent(studentId);
      if (res.status) {
        setStudent(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الطالب");
        setStudent(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [studentId]);

  return { student, loading , setStudent };
};