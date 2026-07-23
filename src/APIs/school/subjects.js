import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/subjects";

export const fetchSubjects = async (
  filters = {}
) => {
  try {
    const response = await api.get(
      ENDPOINT,
      {
        params: filters,
      }
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل المواد الدراسية"
    );
  }
};

export const fetchSubjectsList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل قائمة المواد"
      );
    }
  };

export const fetchSingleSubject =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response = await api.get(
        `${ENDPOINT}/${id}`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل بيانات المادة"
      );
    }
  };

export const fetchMyStudentSubjects =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/student/me`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل مواد الطالب"
      );
    }
  };

export const fetchMyTeacherSubjects =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/teacher/me`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل مواد المعلم"
      );
    }
  };

export const addSubject = async (
  data
) => {
  try {
    const response = await api.post(
      ENDPOINT,
      data
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر إضافة المادة"
    );
  }
};

export const editSubject = async (
  data,
  id
) => {
  if (!id) {
    return {
      status: false,
      message:
        "معرّف المادة غير موجود",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تعديل بيانات المادة"
    );
  }
};

export const deleteSubject =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${id}`
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف المادة"
      );
    }
  };
