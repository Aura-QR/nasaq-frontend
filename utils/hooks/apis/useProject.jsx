import { fetchSingleProject } from "@/APIs/school/projects";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useProject = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const res = await fetchSingleProject(projectId);
      console.log(res)
      if (res.status) {
        setProject(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب المشروع ");
        setProject(null);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  return { project, loading };
};