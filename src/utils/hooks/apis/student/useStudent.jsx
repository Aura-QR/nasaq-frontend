import {
  fetchStudentAttendance,
  fetchStudentClass,
  fetchStudentExams,
  fetchStudentGrades,
  fetchStudentLectures,
  fetchStudentMates,
  fetchStudentProjects,
  fetchStudentSubjects,
} from "@/APIs/student";

import { api } from "@/APIs/Axios";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

// =====================================================
// HELPERS
// =====================================================

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.docs)) {
    return value.docs;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const getErrorMessage = (
  response,
  fallback
) => {
  if (!response) {
    return fallback;
  }

  if (
    typeof response === "string"
  ) {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

// =====================================================
// NORMALIZE LECTURE
// =====================================================

const normalizeStudentLecture = (
  lecture
) => {
  if (!lecture) {
    return lecture;
  }

  const subjectOffering =
    lecture?.subjectOfferingId ||
    lecture?.subjectOffering ||
    null;

  const subject =
    lecture?.subject ||
    lecture?.subjectId ||
    subjectOffering?.subjectId ||
    subjectOffering?.subject ||
    null;

  const teacher =
    lecture?.teacher ||
    lecture?.teacherId ||
    null;

  const classData =
    lecture?.class ||
    lecture?.classId ||
    null;

  const term =
    lecture?.term ||
    lecture?.termId ||
    subjectOffering?.termId ||
    null;

  return {
    ...lecture,

    // نخلي شكل الداتا موحد للـ UI
    subject,
    teacher,
    class: classData,
    term,

    subjectOffering,
  };
};

const normalizeStudentLectures = (
  value
) =>
  asArray(value)
    .map(
      normalizeStudentLecture
    )
    .filter(Boolean);

// =====================================================
// STUDENT CLASS
// =====================================================

export const useStudentClass =
  () => {
    const [
      currentClass,
      setClass,
    ] = useState(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      const fetchData =
        async () => {
          try {
            const res =
              await fetchStudentClass();

            if (!mounted) {
              return;
            }

            if (res?.status) {
              setClass(
                res?.data || null
              );
            } else {
              setClass(null);

              toast.error(
                getErrorMessage(
                  res,
                  "حدث خطأ أثناء جلب بيانات الفصل"
                )
              );
            }
          } catch (error) {
            if (!mounted) {
              return;
            }

            console.error(
              "useStudentClass:",
              error
            );

            setClass(null);

            toast.error(
              "حدث خطأ أثناء جلب بيانات الفصل"
            );
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        };

      fetchData();

      return () => {
        mounted = false;
      };
    }, []);

    return {
      currentClass,
      loading,
    };
  };

// =====================================================
// STUDENT MATES
// =====================================================

export const useStudentMates =
  () => {
    const [mates, setMates] =
      useState(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      const fetchData =
        async () => {
          try {
            const res =
              await fetchStudentMates();

            if (!mounted) {
              return;
            }

            if (res?.status) {
              setMates(
                res?.data || []
              );
            } else {
              setMates(null);

              toast.error(
                getErrorMessage(
                  res,
                  "حدث خطأ أثناء جلب بيانات الزملاء"
                )
              );
            }
          } catch (error) {
            if (!mounted) {
              return;
            }

            console.error(
              "useStudentMates:",
              error
            );

            setMates(null);

            toast.error(
              "حدث خطأ أثناء جلب بيانات الزملاء"
            );
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        };

      fetchData();

      return () => {
        mounted = false;
      };
    }, []);

    return {
      mates,
      loading,
    };
  };

// =====================================================
// STUDENT LECTURES
// =====================================================

export const useStudentLectures =
  () => {
    const [
      lectures,
      setLectures,
    ] = useState([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      source,
      setSource,
    ] = useState("");

    useEffect(() => {
      let mounted = true;

      const extractList = (
        response
      ) => {
        const payload =
          response?.data ??
          response;

        const data =
          payload?.data ??
          payload;

        if (
          Array.isArray(data)
        ) {
          return data;
        }

        if (
          Array.isArray(
            data?.docs
          )
        ) {
          return data.docs;
        }

        if (
          Array.isArray(
            data?.items
          )
        ) {
          return data.items;
        }

        if (
          Array.isArray(
            data?.results
          )
        ) {
          return data.results;
        }

        return [];
      };

      const fetchData =
        async () => {
          try {
            if (mounted) {
              setLoading(true);
            }

            // ==========================================
            // 1) ENDPOINT الرسمي للطالب
            // ==========================================

            const directResponse =
              await fetchStudentLectures();

            const directLectures =
              directResponse?.status
                ? normalizeStudentLectures(
                    directResponse?.data
                  )
                : [];

            console.log(
              "[Schedule] direct:",
              directLectures
            );

            if (
              directLectures.length >
              0
            ) {
              if (!mounted) {
                return;
              }

              setLectures(
                directLectures
              );

              setSource(
                "student-me"
              );

              return;
            }

            // ==========================================
            // 2) FALLBACK: GET /students/me
            // ==========================================

            console.warn(
              "[Schedule] /lectures/student/me returned empty - starting fallback"
            );

            const studentResponse =
              await api.get(
                "/students/me"
              );

            const student =
              studentResponse
                ?.data?.data ||
              studentResponse
                ?.data ||
              null;

            console.log(
              "[Schedule] student:",
              student
            );

            const classId =
              normalizeId(
                student?.classId
              ) ||
              normalizeId(
                student?.class
              );

            console.log(
              "[Schedule] classId:",
              classId
            );

            if (!classId) {
              if (!mounted) {
                return;
              }

              console.warn(
                "[Schedule] no classId found"
              );

              setLectures([]);
              setSource(
                "no-class"
              );

              return;
            }

            // ==========================================
            // 3) FALLBACK: GET /lectures?classId=...
            // ==========================================

            const classLecturesResponse =
              await api.get(
                "/lectures",
                {
                  params: {
                    classId,
                    page: 1,
                    limit: 100,
                  },
                }
              );

            console.log(
              "[Schedule] class lectures raw:",
              classLecturesResponse
                ?.data
            );

            const classLectures =
              extractList(
                classLecturesResponse
              )
                .map(
                  normalizeStudentLecture
                )
                .filter(
                  (lecture) => {
                    const lectureClassId =
                      normalizeId(
                        lecture?.classId ||
                          lecture?.class
                      );

                    return (
                      !lectureClassId ||
                      lectureClassId ===
                        classId
                    );
                  }
                );

            console.log(
              "[Schedule] fallback lectures:",
              classLectures
            );

            if (!mounted) {
              return;
            }

            setLectures(
              classLectures
            );

            setSource(
              "class-fallback"
            );
          } catch (error) {
            if (!mounted) {
              return;
            }

            console.error(
              "[Schedule] ERROR:",
              error
            );

            console.error(
              "[Schedule] status:",
              error?.response
                ?.status
            );

            console.error(
              "[Schedule] response:",
              error?.response
                ?.data
            );

            setLectures([]);
            setSource("error");

            toast.error(
              error?.response
                ?.data?.message ||
                "تعذر تحميل الجدول الدراسي"
            );
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        };

      fetchData();

      return () => {
        mounted = false;
      };
    }, []);

    return {
      lectures,
      loading,
      source,
    };
  };

// =====================================================
// STUDENT ATTENDANCE
// =====================================================

export const useStudentAttendance =
  () => {
    const [
      attendance,
      setAttendance,
    ] = useState(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      const fetchData =
        async () => {
          try {
            const res =
              await fetchStudentAttendance();

            if (!mounted) {
              return;
            }

            if (res?.status) {
              setAttendance(
                res?.data || []
              );
            } else {
              setAttendance(null);

              toast.error(
                getErrorMessage(
                  res,
                  "حدث خطأ أثناء جلب بيانات الحضور"
                )
              );
            }
          } catch (error) {
            if (!mounted) {
              return;
            }

            console.error(
              "useStudentAttendance:",
              error
            );

            setAttendance(null);

            toast.error(
              "حدث خطأ أثناء جلب بيانات الحضور"
            );
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        };

      fetchData();

      return () => {
        mounted = false;
      };
    }, []);

    return {
      attendance,
      loading,
    };
  };

// =====================================================
// STUDENT SUBJECTS
// =====================================================

export const useStudentSubjects =
  () => {
    const [
      subjects,
      setSubjects,
    ] = useState(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      const fetchData =
        async () => {
          try {
            const res =
              await fetchStudentSubjects();

            if (!mounted) {
              return;
            }

            if (res?.status) {
              setSubjects(
                res?.data || []
              );
            } else {
              setSubjects(null);

              toast.error(
                getErrorMessage(
                  res,
                  "حدث خطأ أثناء جلب بيانات المواد"
                )
              );
            }
          } catch (error) {
            if (!mounted) {
              return;
            }

            console.error(
              "useStudentSubjects:",
              error
            );

            setSubjects(null);

            toast.error(
              "حدث خطأ أثناء جلب بيانات المواد"
            );
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        };

      fetchData();

      return () => {
        mounted = false;
      };
    }, []);

    return {
      subjects,
      loading,
    };
  };

// =====================================================
// STUDENT EXAMS
// =====================================================

export const useStudentExams = (
  filters = {}
) => {
  const [exams, setExams] =
    useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters
        ),
      [filters]
    );

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        if (mounted) {
          setLoading(true);
        }

        try {
          const res =
            await fetchStudentExams(
              filters
            );

          if (!mounted) {
            return;
          }

          if (res?.status) {
            setExams(
              res?.data || []
            );

            setPagination(
              res?.pagination ||
                null
            );
          } else {
            setExams([]);

            setPagination(null);

            toast.error(
              getErrorMessage(
                res,
                "حدث خطأ أثناء جلب بيانات الامتحانات"
              )
            );
          }
        } catch (error) {
          if (!mounted) {
            return;
          }

          console.error(
            "useStudentExams:",
            error
          );

          setExams([]);
          setPagination(null);

          toast.error(
            "حدث خطأ أثناء جلب بيانات الامتحانات"
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return {
    exams,
    loading,
    pagination,
  };
};

// =====================================================
// STUDENT PROJECTS
// =====================================================

export const useStudentProjects = (
  filters = {}
) => {
  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters
        ),
      [filters]
    );

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        if (mounted) {
          setLoading(true);
        }

        try {
          const res =
            await fetchStudentProjects(
              filters
            );

          if (!mounted) {
            return;
          }

          if (res?.status) {
            setProjects(
              res?.data || []
            );

            setPagination(
              res?.pagination ||
                null
            );
          } else {
            setProjects([]);

            setPagination(null);

            toast.error(
              getErrorMessage(
                res,
                "حدث خطأ أثناء جلب بيانات المشاريع"
              )
            );
          }
        } catch (error) {
          if (!mounted) {
            return;
          }

          console.error(
            "useStudentProjects:",
            error
          );

          setProjects([]);
          setPagination(null);

          toast.error(
            "حدث خطأ أثناء جلب بيانات المشاريع"
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return {
    projects,
    loading,
    pagination,
  };
};

// =====================================================
// GRADES
// =====================================================

export const useGradesCriteria = (
  filters = {}
) => {
  const [
    grades,
    setGrades,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const filterString =
    useMemo(
      () =>
        JSON.stringify(
          filters
        ),
      [filters]
    );

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        if (mounted) {
          setLoading(true);
        }

        try {
          const res =
            await fetchStudentGrades(
              filters
            );

          if (!mounted) {
            return;
          }

          if (res?.status) {
            setGrades(
              res?.data || []
            );

            setPagination(
              res?.pagination ||
                null
            );
          } else {
            /*
             * عدم وجود درجات/معايير تقييم
             * حالة طبيعية للطالب وليست Error.
             */
            setGrades([]);
            setPagination(null);

            console.warn(
              "[Student Grades]",
              getErrorMessage(
                res,
                "لا توجد بيانات درجات"
              )
            );
          }
        } catch (error) {
          if (!mounted) {
            return;
          }

          console.error(
            "useGradesCriteria:",
            error
          );

          setGrades([]);
          setPagination(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]);

  return {
    grades,
    loading,
    pagination,
  };
};
