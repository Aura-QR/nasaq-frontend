import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/enrollments";

export const createStudentEnrollment =
  async ({
    studentId,
    classId,
    academicYearId,
  }) => {
    if (
      !studentId ||
      !classId ||
      !academicYearId
    ) {
      return {
        status: false,
        message:
          "بيانات تسجيل الطالب في الفصل غير مكتملة",
      };
    }

    try {
      const response =
        await api.post(
          ENDPOINT,
          {
            studentId,
            classId,
            academicYearId,
          }
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر ربط الطالب بالفصل"
      );
    }
  };

export const fetchStudentEnrollments =
  async (studentId) => {
    if (!studentId) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
      };
    }

    try {
      const response =
        await api.get(
          `${ENDPOINT}/student/${studentId}`
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل تسجيلات الطالب"
      );
    }
  };

export const fetchActiveAcademicYear =
  async () => {
    try {
      const response =
        await api.get(
          "/academic-years/active"
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل السنة الدراسية النشطة"
      );
    }
  };
