import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/students";

export const fetchStudents = async (
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
      "تعذر تحميل الطلاب"
    );
  }
};

export const fetchStudentsList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل قائمة الطلاب"
      );
    }
  };

export const fetchSingleStudent =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
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
        "تعذر تحميل بيانات الطالب"
      );
    }
  };

export const fetchMyStudentProfile =
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

export const addStudent = async (
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
      "تعذر إضافة الطالب"
    );
  }
};

export const editStudent = async (
  data,
  id
) => {
  if (!id) {
    return {
      status: false,
      message:
        "معرّف الطالب غير موجود",
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
      "تعذر تعديل بيانات الطالب"
    );
  }
};

export const deleteStudent =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
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
        "تعذر حذف الطالب"
      );
    }
  };

export const toggleActiveStudent =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
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
        "تعذر تغيير حالة الطالب"
      );
    }
  };

export const requestStudentPasswordSetup =
  async (email) => {
    try {
      const response = await api.post(
        `${ENDPOINT}/request-password-setup`,
        {
          email: email?.trim(),
        }
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر إرسال رمز التحقق"
      );
    }
  };

export const setStudentPassword =
  async ({
    email,
    otp,
    password,
  }) => {
    try {
      const response = await api.post(
        `${ENDPOINT}/set-password`,
        {
          email: email?.trim(),
          otp: otp?.trim(),
          password,
        }
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تعيين كلمة المرور"
      );
    }
  };
