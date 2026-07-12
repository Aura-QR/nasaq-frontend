import { fetchSubjectsList } from "@/APIs/school/subjects";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useSubjectsList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSubjectsList();
      console.log(res)
      if (res.status) {
        setSubjects(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المواد");
        setSubjects([]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { subjects, loading };
};