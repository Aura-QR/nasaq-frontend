import { fetchSingleClass } from "@/APIs/school/classes";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useClass = (classId) => {
  const [currentClass, setClass] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) {
      setClass(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleClass(classId);
      console.log(res)
      if (res.status) {
        setClass(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الفصل");
        setClass(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [classId]);

  return { currentClass, loading };
};