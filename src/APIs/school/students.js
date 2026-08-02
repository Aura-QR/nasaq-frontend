import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/students";

const STUDENT_FIELDS = [
  "firstName",
  "fatherName",
  "familyName",
  "birthDate",
  "gender",
  "nationality",
  "phoneNumber",
  "email",
  "address",
  "previousSchool",
  "registrationDate",
  "notes",
  "isActive",
  "password",
  "classId",
  "status",
];

const OPTIONAL_TEXT_FIELDS = new Set([
  "previousSchool",
  "registrationDate",
  "notes",
  "password",
  "classId",
  "status",
]);

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(
    object || {},
    key
  );

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return value._id || value.id || "";
  }

  return String(value).trim();
};

const normalizeBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";

/**
 * يبني Payload مطابقًا لـ CreateStudentDto / UpdateStudentDto.
 * أي حقول قديمة مثل academicYear أو installmentPlanId
 * لن يتم إرسالها إلى الباك.
 */
export const normalizeStudentPayload = (
  data = {},
  { partial = false } = {}
) => {
  const source = {
    ...data,
  };

  // دعم اسم الحقل القديم في الفورم إن كان ما زال مستخدمًا.
  if (
    !hasOwn(source, "phoneNumber") &&
    hasOwn(source, "phone")
  ) {
    source.phoneNumber = source.phone;
  }

  const payload = {};

  STUDENT_FIELDS.forEach((field) => {
    if (partial && !hasOwn(source, field)) {
      return;
    }

    let value = source[field];

    if (field === "classId") {
      value = normalizeId(value);
    } else if (field === "isActive") {
      value = normalizeBoolean(value);
    } else if (
      typeof value === "string" &&
      field !== "password"
    ) {
      value = value.trim();
    }

    if (
      OPTIONAL_TEXT_FIELDS.has(field) &&
      (value === "" ||
        value === null ||
        value === undefined ||
        value === "null")
    ) {
      return;
    }

    if (
      value !== undefined &&
      value !== null
    ) {
      payload[field] = value;
    }
  });

  return payload;
};

const unwrapData = (value) => {
  let current = value;

  for (let index = 0; index < 4; index += 1) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !hasOwn(current, "data")
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

export const getStudentResponseId = (
  response
) => {
  const candidates = [
    response?.data?.student,
    response?.data?.data?.student,
    response?.student,
    response?.data?.data,
    response?.data,
    unwrapData(response),
    response,
  ];

  for (const candidate of candidates) {
    const id =
      candidate?._id ||
      candidate?.id;

    if (id) return id;
  }

  return "";
};

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

export const fetchStudentEnrollmentHistory =
  async (studentId) => {
    if (!studentId) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
      };
    }

    try {
      const response = await api.get(
        `/enrollments/student/${studentId}`
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل السجل الدراسي للطالب"
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
      normalizeStudentPayload(data)
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
      normalizeStudentPayload(
        data,
        {
          partial: true,
        }
      )
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
