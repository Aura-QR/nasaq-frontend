import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/teachers";

export const fetchTeachers = async (
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
      "تعذر تحميل المعلمين"
    );
  }
};

export const fetchTeachersList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل قائمة المعلمين"
      );
    }
  };

export const fetchSingleTeacher =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
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
        "تعذر تحميل بيانات المعلم"
      );
    }
  };

export const fetchMyTeacherProfile =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/me`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل الملف الشخصي"
      );
    }
  };

export const fetchTeachersBySubjectId =
  async (subjectId) => {
    if (!subjectId) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response = await api.get(
        `${ENDPOINT}/by-subject/${subjectId}`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل معلمي المادة"
      );
    }
  };

export const addTeacher = async (
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
      "تعذر إضافة المعلم"
    );
  }
};

export const editTeacher = async (
  data,
  id
) => {
  if (!id) {
    return {
      status: false,
      message:
        "معرّف المعلم غير موجود",
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
      "تعذر تعديل بيانات المعلم"
    );
  }
};

export const deleteTeacher =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
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
        "تعذر حذف المعلم"
      );
    }
  };

export const toggleActiveTeacher =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${id}/toggle-active`
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تغيير حالة المعلم"
      );
    }
  };
