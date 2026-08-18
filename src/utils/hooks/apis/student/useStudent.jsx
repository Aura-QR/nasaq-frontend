import {
  fetchStudentAttendance,
  fetchStudentExams,
  fetchStudentLectures,
  fetchStudentProjects,
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
//
// Backend-aligned source:
// GET /students/me
//
// The student response already contains classId populated.
// No request to /classes/student/me and no second
// GET /classes/:id request.
// =====================================================

const extractStudentClassFromProfile = (
  student
) => {
  if (!student) {
    return null;
  }

  const classData =
    student?.classId ||
    student?.class ||
    student?.currentEnrollment?.classId ||
    student?.currentEnrollment?.class ||
    null;

  if (
    classData &&
    typeof classData === "object" &&
    !Array.isArray(classData)
  ) {
    return classData;
  }

  return null;
};

export const useStudentClass = () => {
  const [
    currentClass,
    setClass,
  ] = useState(null);

  const [
    classId,
    setClassId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    source,
    setSource,
  ] = useState("students-me");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setError("");
        }

        const response =
          await api.get(
            "/students/me"
          );

        if (!mounted) {
          return;
        }

        const payload =
          response?.data?.data ??
          response?.data ??
          null;

        if (
          response?.data?.status === false
        ) {
          throw new Error(
            response?.data?.message ||
              "تعذر تحميل بيانات الطالب"
          );
        }

        const student =
          payload &&
          typeof payload === "object"
            ? payload
            : null;

        const resolvedClass =
          extractStudentClassFromProfile(
            student
          );

        const resolvedClassId =
          normalizeId(
            student?.classId
          ) ||
          normalizeId(
            student?.class
          ) ||
          normalizeId(
            student?.currentEnrollment
              ?.classId
          ) ||
          normalizeId(
            student?.currentEnrollment
              ?.class
          );

        if (!resolvedClass) {
          setClass(null);
          setClassId(
            resolvedClassId
          );
          setSource(
            "students-me-no-class"
          );
          setError(
            "لم يتم العثور على فصل مرتبط بالطالب"
          );
          return;
        }

        setClass(
          resolvedClass
        );
        setClassId(
          resolvedClassId ||
            normalizeId(
              resolvedClass
            )
        );
        setSource(
          "students-me"
        );
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        console.error(
          "[Student Class] /students/me ERROR:",
          requestError
        );

        setClass(null);
        setClassId("");
        setSource("error");

        const message =
          requestError?.response
            ?.data?.message ||
          requestError?.message ||
          "حدث خطأ أثناء جلب بيانات الفصل";

        setError(message);

        toast.error(message);
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
    classId,
    loading,
    source,
    error,
  };
};

// =====================================================
// STUDENT LECTURES
//
// 1) GET /lectures/student/me
// 2) لو رجع [] نقرأ classId من GET /students/me
// 3) GET /lectures?classId=...&page=1&limit=100
//
// الـ fallback كله API-driven ومفيش أي classId ثابت في الـ UI.
// =====================================================

export const useStudentLectures = () => {
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

    const extractAxiosList = (
      response
    ) => {
      const payload =
        response?.data ??
        response;

      const data =
        payload?.data ??
        payload;

      return asArray(data);
    };

    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }

        // ==========================================
        // 1) OFFICIAL STUDENT ENDPOINT
        // GET /lectures/student/me
        // ==========================================

        const directResponse =
          await fetchStudentLectures();

        const directLectures =
          directResponse?.status
            ? normalizeStudentLectures(
                directResponse?.data
              )
            : [];

        if (
          directLectures.length > 0
        ) {
          if (!mounted) {
            return;
          }

          console.log(
            "[Student Schedule] source: /lectures/student/me",
            directLectures
          );

          setLectures(
            directLectures
          );

          setSource(
            "student-me"
          );

          return;
        }

        // ==========================================
        // 2) FALLBACK
        // GET /students/me
        // ==========================================

        console.warn(
          "[Student Schedule] /lectures/student/me returned empty. Using class fallback."
        );

        const studentResponse =
          await api.get(
            "/students/me"
          );

        const student =
          studentResponse
            ?.data?.data ??
          studentResponse
            ?.data ??
          null;

        const classId =
          normalizeId(
            student?.classId
          ) ||
          normalizeId(
            student?.class
          );

        console.log(
          "[Student Schedule] fallback classId:",
          classId
        );

        if (!classId) {
          if (!mounted) {
            return;
          }

          setLectures([]);
          setSource(
            "no-class"
          );

          return;
        }

        // ==========================================
        // 3) GET LECTURES BY STUDENT CLASS
        // GET /lectures?classId=...
        // ==========================================

        const classResponse =
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

        const classLectures =
          extractAxiosList(
            classResponse
          )
            .map(
              normalizeStudentLecture
            )
            .filter(Boolean)
            .filter(
              (lecture) => {
                const lectureClassId =
                  normalizeId(
                    lecture?.class ||
                      lecture?.classId
                  );

                return (
                  !lectureClassId ||
                  lectureClassId ===
                    classId
                );
              }
            );

        if (!mounted) {
          return;
        }

        console.log(
          "[Student Schedule] source: class fallback",
          classLectures
        );

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
          "[Student Schedule] ERROR:",
          error
        );

        console.error(
          "[Student Schedule] status:",
          error?.response?.status
        );

        console.error(
          "[Student Schedule] response:",
          error?.response?.data
        );

        setLectures([]);
        setSource(
          "error"
        );

        toast.error(
          error?.response
            ?.data?.message ||
            error?.message ||
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
    ] = useState([]);

    const [
      attendanceTotal,
      setAttendanceTotal,
    ] = useState(0);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted = true;

      /*
       * GET /attendance/student/me
       *
       * الـ API عندنا absence-based:
       * كل record راجع من الـ endpoint = يوم غياب.
       *
       * بنطبع أكثر من response shape محتمل:
       *
       * data: [...]
       *
       * أو:
       * data: {
       *   data: [...],
       *   total: 3
       * }
       *
       * أو docs / items / results مع pagination.
       */
      const normalizeAttendanceResponse =
        (response) => {
          const payload =
            response?.data;

          if (
            Array.isArray(payload)
          ) {
            return {
              items: payload,
              total:
                payload.length,
            };
          }

          if (
            payload &&
            typeof payload ===
              "object"
          ) {
            const items =
              asArray(payload);

            const rawTotal =
              payload?.total ??
              payload?.totalItems ??
              payload?.count ??
              payload?.pagination
                ?.total ??
              payload?.pagination
                ?.totalItems;

            const parsedTotal =
              Number(rawTotal);

            return {
              items,

              total:
                Number.isFinite(
                  parsedTotal
                ) &&
                parsedTotal >= 0
                  ? parsedTotal
                  : items.length,
            };
          }

          return {
            items: [],
            total: 0,
          };
        };

      const fetchData =
        async () => {
          try {
            if (mounted) {
              setLoading(true);
            }

            const res =
              await fetchStudentAttendance();

            if (!mounted) {
              return;
            }

            if (res?.status) {
              const normalized =
                normalizeAttendanceResponse(
                  res
                );

              setAttendance(
                normalized.items
              );

              setAttendanceTotal(
                normalized.total
              );
            } else {
              setAttendance([]);
              setAttendanceTotal(0);

              toast.error(
                getErrorMessage(
                  res,
                  "حدث خطأ أثناء جلب بيانات الغياب"
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

            setAttendance([]);
            setAttendanceTotal(0);

            toast.error(
              error?.response?.data
                ?.message ||
                error?.message ||
                "حدث خطأ أثناء جلب بيانات الغياب"
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
      // كل عنصر هنا يمثل غيابًا حسب الـ API.
      attendance,

      // إجمالي سجلات الغياب القادم من الـ API إن وُجد.
      attendanceTotal,

      loading,
    };
  };

// =====================================================
// STUDENT SUBJECTS
// GET /gradesCriteria/student/me/subjects
//
// ده الـ endpoint المستخدم في Student flow في الـ collection.
// العناصر هنا لازم تحتفظ بـ subjectOfferingId لأن صفحة الدرجات
// تعتمد على subjectOfferingId وليس subjectId فقط.
// =====================================================

export const useStudentSubjects = () => {
  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }

        const response =
          await api.get(
            "/gradesCriteria/student/me/subjects"
          );

        if (!mounted) {
          return;
        }

        const payload =
          response?.data;

        if (
          payload?.status === false
        ) {
          setSubjects([]);

          toast.error(
            payload?.message ||
              "حدث خطأ أثناء جلب بيانات المواد"
          );

          return;
        }

        const list =
          asArray(
            payload?.data ??
              payload
          );

        console.log(
          "[Student Subjects] source: /gradesCriteria/student/me/subjects",
          list
        );

        setSubjects(list);
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "[Student Subjects] ERROR:",
          error
        );

        setSubjects([]);

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
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
// GET /exams/student/me
//
// الـ endpoint الرسمي للطالب يُطلب مرة واحدة.
// أي examType filter يتم Client-side بعد استلام response.
// =====================================================

export const useStudentExams = (
  filters = {}
) => {
  const [
    exams,
    setExams,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const examTypeFilter =
    String(
      filters?.examType || ""
    )
      .trim()
      .toLowerCase();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }

        // مهم: Student endpoint نفسه بدون query افتراضي.
        const res =
          await fetchStudentExams();

        if (!mounted) {
          return;
        }

        if (!res?.status) {
          setExams([]);
          setPagination(null);

          console.warn(
            "[Student Exams]",
            getErrorMessage(
              res,
              "لا توجد اختبارات"
            )
          );

          return;
        }

        const allItems =
          asArray(res?.data);

        const filteredItems =
          examTypeFilter
            ? allItems.filter(
                (exam) =>
                  String(
                    exam?.examType ||
                      exam?.type ||
                      ""
                  )
                    .trim()
                    .toLowerCase() ===
                  examTypeFilter
              )
            : allItems;

        setExams(filteredItems);

        setPagination(
          res?.pagination ||
            res?.data?.pagination ||
            null
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "[Student Exams] ERROR:",
          error
        );

        setExams([]);
        setPagination(null);

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "حدث خطأ أثناء جلب بيانات الاختبارات"
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
  }, [examTypeFilter]);

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
  ] = useState(null);

  const [
    criteria,
    setCriteria,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pagination,
    setPagination,
  ] = useState(null);

  const subjectOfferingId =
    normalizeId(
      filters?.subjectOfferingId
    );

  const filterString =
    useMemo(
      () =>
        JSON.stringify({
          subjectOfferingId,
        }),
      [subjectOfferingId]
    );

  useEffect(() => {
    let mounted = true;

    const unwrapPayload = (
      response
    ) => {
      const payload =
        response?.data ??
        response;

      return (
        payload?.data ??
        payload ??
        null
      );
    };

    const fetchData =
      async () => {
        if (mounted) {
          setLoading(true);
        }

        if (
          !subjectOfferingId
        ) {
          if (mounted) {
            setGrades(null);
            setCriteria(null);
            setPagination(null);
            setLoading(false);
          }

          return;
        }

        try {
          /*
           * Student grades flow:
           *
           * 1) GET /gradesCriteria/student/me
           * 2) GET /gradesCriteria/student/me/grades
           *
           * ونستخدم subjectOfferingId في الطلبين
           * لتجنب أي ambiguity بين الترمات.
           */
          const [
            criteriaResult,
            gradesResult,
          ] =
            await Promise.allSettled([
              api.get(
                "/gradesCriteria/student/me",
                {
                  params: {
                    subjectOfferingId,
                  },
                }
              ),

              api.get(
                "/gradesCriteria/student/me/grades",
                {
                  params: {
                    subjectOfferingId,
                  },
                }
              ),
            ]);

          if (!mounted) {
            return;
          }

          // ================================
          // CRITERIA
          // ================================

          if (
            criteriaResult.status ===
            "fulfilled"
          ) {
            const criteriaPayload =
              unwrapPayload(
                criteriaResult.value
              );

            setCriteria(
              criteriaPayload
            );
          } else {
            console.warn(
              "[Student Grade Criteria] request failed:",
              criteriaResult.reason
            );

            setCriteria(null);
          }

          // ================================
          // GRADES
          // ================================

          if (
            gradesResult.status ===
            "fulfilled"
          ) {
            const gradesPayload =
              unwrapPayload(
                gradesResult.value
              );

            setGrades(
              gradesPayload
            );

            setPagination(
              gradesResult.value
                ?.data
                ?.pagination ||
                gradesPayload
                  ?.pagination ||
                null
            );

            console.log(
              "[Student Grades] subjectOfferingId:",
              subjectOfferingId
            );

            console.log(
              "[Student Grades] response:",
              gradesPayload
            );
          } else {
            console.warn(
              "[Student Grades] request failed:",
              gradesResult.reason
            );

            setGrades(null);
            setPagination(null);
          }
        } catch (error) {
          if (!mounted) {
            return;
          }

          console.error(
            "useGradesCriteria:",
            error
          );

          setGrades(null);
          setCriteria(null);
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
    criteria,
    loading,
    pagination,
    subjectOfferingId,
  };
};
