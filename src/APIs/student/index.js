import { api } from "../Axios";

// =====================================================
// HELPERS
// =====================================================

const normalizeFailure = (
  err,
  fallback = "حدث خطأ ما"
) => ({
  status: false,
  message:
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback,
  statusCode:
    err?.response?.status,
});

// =====================================================
// STUDENT PROFILE
// GET /students/me
// =====================================================

export const fetchStudentMe = async () => {
  try {
    const response =
      await api.get("/students/me");

    return response.data;
  } catch (err) {
    return normalizeFailure(
      err,
      "تعذر تحميل بيانات الطالب"
    );
  }
};

// =====================================================
// STUDENT CLASS
// GET /students/me
//
// الـ backend بيرجع:
// data.classId = ID
// data.class   = populated class object
//
// مهم:
// لازم نفضل class object على classId
// لأن صفحات الطالب محتاجة roomNumber / gender ...etc
// =====================================================

export const fetchStudentClass = async () => {
  try {
    const response =
      await api.get("/students/me");

    const payload =
      response?.data || {};

    if (payload?.status === false) {
      return payload;
    }

    const student =
      payload?.data || null;

    if (!student) {
      return {
        status: false,
        message:
          "لم يتم العثور على بيانات الطالب",
        data: null,
      };
    }

    let studentClass = null;

    // -----------------------------------------
    // الأفضل: populated class object
    // -----------------------------------------

    if (
      student?.class &&
      typeof student.class === "object" &&
      !Array.isArray(student.class)
    ) {
      studentClass = student.class;
    }

    // -----------------------------------------
    // Fallback: classId object
    // -----------------------------------------

    else if (
      student?.classId &&
      typeof student.classId === "object" &&
      !Array.isArray(student.classId)
    ) {
      studentClass =
        student.classId;
    }

    // -----------------------------------------
    // Fallback: classId string
    //
    // نخليه Object للحفاظ على نفس contract
    // في الـ UI.
    // -----------------------------------------

    else if (student?.classId) {
      studentClass = {
        _id: String(
          student.classId
        ),
      };
    }

    return {
      ...payload,
      status: true,
      data: studentClass,
    };
  } catch (err) {
    return normalizeFailure(
      err,
      "تعذر تحميل بيانات الفصل"
    );
  }
};

// =====================================================
// STUDENT LECTURES
// GET /lectures/student/me
// =====================================================

export const fetchStudentLectures =
  async () => {
    try {
      const response =
        await api.get(
          "/lectures/student/me"
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل الجدول الدراسي"
      );
    }
  };

// =====================================================
// STUDENT ATTENDANCE
// GET /attendance/student/me
// =====================================================

export const fetchStudentAttendance =
  async () => {
    try {
      const response =
        await api.get(
          "/attendance/student/me"
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل سجل الحضور"
      );
    }
  };

// =====================================================
// STUDENT SUBJECTS
// GET /subjects/student/me
// =====================================================

export const fetchStudentSubjects =
  async () => {
    try {
      const response =
        await api.get(
          "/subjects/student/me"
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل المواد"
      );
    }
  };

// =====================================================
// STUDENT EXAMS
// GET /exams/student/me
// =====================================================

export const fetchStudentExams = async (
  filters = {}
) => {
  try {
    const response =
      await api.get(
        "/exams/student/me",
        {
          params: filters,
        }
      );

    return response.data;
  } catch (err) {
    return normalizeFailure(
      err,
      "تعذر تحميل الاختبارات"
    );
  }
};

// =====================================================
// STUDENT PROJECTS
// GET /projects/student/me
// =====================================================

export const fetchStudentProjects =
  async (filters = {}) => {
    try {
      const response =
        await api.get(
          "/projects/student/me",
          {
            params: filters,
          }
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل المشروعات"
      );
    }
  };

// =====================================================
// STUDENT GRADES
// GET /gradesCriteria/student/me/grades
// =====================================================

export const fetchStudentGrades =
  async (filters = {}) => {
    try {
      const response =
        await api.get(
          "/gradesCriteria/student/me/grades",
          {
            params: filters,
          }
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل الدرجات"
      );
    }
  };

// =====================================================
// STUDENT MATES
//
// لا يوجد Endpoint آمن للزملاء حاليًا.
// =====================================================

export const fetchStudentMates =
  async () => ({
    status: false,
    message:
      "ميزة زملاء الفصل غير متاحة حاليًا حتى يوفر الباك Endpoint آمنًا لها",
    data: [],
  });

// =====================================================
// START EXAM
// POST /exams/:examId/start
// =====================================================

export const startStudentExam = async (
  examId
) => {
  try {
    if (!examId) {
      return {
        status: false,
        message:
          "معرّف الاختبار مطلوب",
      };
    }

    const response =
      await api.post(
        `/exams/${examId}/start`
      );

    return response.data;
  } catch (err) {
    return normalizeFailure(
      err,
      "تعذر بدء الاختبار"
    );
  }
};

// =====================================================
// GRADE EXAM
// POST /exams/:examId/grade
// =====================================================

export const gradeStudentExam =
  async (examId, data) => {
    try {
      if (!examId) {
        return {
          status: false,
          message:
            "معرّف الاختبار مطلوب",
        };
      }

      const response =
        await api.post(
          `/exams/${examId}/grade`,
          data
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تسليم الاختبار"
      );
    }
  };

// =====================================================
// PROJECT SUBMISSION
// GET /projects/:projectId/my-submission
// =====================================================

export const fetchProjectSubmission =
  async (projectId) => {
    try {
      if (!projectId) {
        return {
          status: false,
          message:
            "معرّف المشروع مطلوب",
        };
      }

      const response =
        await api.get(
          `/projects/${projectId}/my-submission`
        );

      return response.data;
    } catch (err) {
      return normalizeFailure(
        err,
        "تعذر تحميل تسليم المشروع"
      );
    }
  };

// =====================================================
// SUBMIT PROJECT
// POST /projects/:projectId/submit
// =====================================================

export const submitProject = async (
  projectId,
  files = []
) => {
  try {
    if (!projectId) {
      return {
        status: false,
        message:
          "معرّف المشروع مطلوب",
      };
    }

    const formData =
      new FormData();

    files.forEach((file) => {
      formData.append(
        "files",
        file
      );
    });

    const response =
      await api.post(
        `/projects/${projectId}/submit`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return response.data;
  } catch (err) {
    return normalizeFailure(
      err,
      "تعذر تسليم المشروع"
    );
  }
};