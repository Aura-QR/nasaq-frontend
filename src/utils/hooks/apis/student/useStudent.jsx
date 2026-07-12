import { fetchStudentAttendance, fetchStudentClass, fetchStudentExams, fetchStudentGrades, fetchStudentLectures, fetchStudentMates, fetchStudentProjects, fetchStudentSubjects } from "@/APIs/student";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

export const useStudentClass = () => {
  const [currentClass, setClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      const res = await fetchStudentClass();
      if (res.status) {
        setClass(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الفصل");
        setClass(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { currentClass, loading };
};

export const useStudentMates = () => {
  const [mates, setMates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      const res = await fetchStudentMates();
      if (res.status) {
        setMates(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الزملاء");
        setMates(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { mates, loading };
};

export const useStudentLectures = () => {
  const [lectures, setLectures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      const res = await fetchStudentLectures();
      console.log(res.data)
      if (res.status) {
        setLectures(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المحاضرات");
        setLectures(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { lectures, loading };
};

export const useStudentAttendance = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      const res = await fetchStudentAttendance();
      if (res.status) {
        setAttendance(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات الحضور");
        setAttendance(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { attendance, loading };
};

export const useStudentSubjects = () => {
  const [subjects, setSubjects] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      const res = await fetchStudentSubjects();
      if (res.status) {
        setSubjects(res.data);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب بيانات المواد");
        setSubjects(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { subjects, loading };
};

export const useStudentExams = (filters = {}) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchStudentExams(filters);
      if (res.status) {
        setExams(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما اثناء جلب بيانات الامتحانات");
        setExams([]);
        setPagination(null);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { exams, loading, pagination };
};

export const useStudentProjects = (filters = {}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchStudentProjects(filters);
      if (res.status) {
        setProjects(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما اثناء جلب بيانات المشاريع");
        setProjects([]);
        setPagination(null);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { projects, loading, pagination };
};

export const useGradesCriteria = (filters = {}) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  // Memoize filters to prevent unnecessary re-fetches
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchStudentGrades(filters);
      console.log(res)
      if (res.status) {
        setGrades(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res || "حدث خطأ ما اثناء جلب بيانات الدرجات");
        setGrades([]);
        setPagination(null);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return { grades, loading, pagination };
};