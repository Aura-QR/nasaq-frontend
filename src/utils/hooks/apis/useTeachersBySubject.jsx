import { fetchTeachersBySubjectId } from "@/APIs/users/teachers";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useTeachersBySubject = (subjectId) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subjectId) {
      setTeachers([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchTeachersBySubjectId(subjectId);
      if (res.status) {
        if (res.data.teachers && res.data.teachers.length > 0) {
          setTeachers(res.data.teachers);
        } else {
          toast.error("لا يوجد معلمين لهذة المادة");
          setTeachers([]);
        }
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المعلمين");
        setTeachers([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [subjectId]);

  return { teachers, loading };
};