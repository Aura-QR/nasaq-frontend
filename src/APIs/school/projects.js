import { api } from "../Axios";

const ENDPOINT = "/projects";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeFailure = (
  error,
  fallback
) => ({
  status: false,
  message: getErrorMessage(error, fallback),
  statusCode: error?.response?.status,
});

const validationFailure = (
  message
) => ({
  status: false,
  message,
});

const isValidationError = (error) =>
  [400, 422].includes(
    Number(error?.response?.status)
  );

const attachCompatibilityMeta = (
  responseData,
  meta
) => {
  if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData)
  ) {
    return {
      ...responseData,
      __gradingCompatibility: meta,
    };
  }

  return {
    data: responseData,
    __gradingCompatibility: meta,
  };
};

export const fetchProjects = async (
  filters = {}
) => {
  try {
    const response = await api.get(
      ENDPOINT,
      { params: filters }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل المشروعات"
    );
  }
};

export const fetchTeacherProjects = async (
  filters = {}
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/teacher/me`,
      { params: filters }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل مشروعات المعلم"
    );
  }
};

export const fetchSingleProject = async (
  id
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل بيانات المشروع"
    );
  }
};

export const addProject = async (data) => {
  try {
    const response = await api.post(
      ENDPOINT,
      data
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر إضافة المشروع"
    );
  }
};

export const editProject = async (
  data,
  id
) => {
  try {
    const response = await api.patch(
      `${ENDPOINT}/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل المشروع"
    );
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(
      `${ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف المشروع"
    );
  }
};

export const addFilesToProject = async (
  projectId,
  files = []
) => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(
      `${ENDPOINT}/${projectId}/files`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر رفع ملفات المشروع"
    );
  }
};

export const removeFileFromProject = async (
  projectId,
  filename
) => {
  try {
    const response = await api.delete(
      `${ENDPOINT}/${projectId}/files/${encodeURIComponent(
        filename
      )}`
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف ملف المشروع"
    );
  }
};

export const fetchAllProjectSubmissions =
  async (filters = {}) => {
    try {
      const response = await api.get(
        `${ENDPOINT}/submissions`,
        { params: filters }
      );

      return response.data;
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل تسليمات المشروعات"
      );
    }
  };

export const fetchProjectSubmissions = async (
  projectId,
  filters = {}
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/${projectId}/submissions`,
      { params: filters }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل تسليمات المشروع"
    );
  }
};

export const downloadProjectSubmission = async (
  projectId,
  studentId
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/${projectId}/submissions/${studentId}/download`,
      { responseType: "blob" }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل ملفات التسليم"
    );
  }
};

/**
 * يدعم صيغتي الباك الموجودتين في الملفات المرسلة:
 * - Postman: { achievedGrade }
 * - API docs: { grade, feedback }
 *
 * يتم إعادة المحاولة بالصيغة البديلة فقط عند خطأ Validation 400/422.
 */
export const gradeSubmission = async (
  projectId,
  studentId,
  gradeOrPayload,
  feedback = ""
) => {
  const normalized =
    gradeOrPayload &&
    typeof gradeOrPayload === "object"
      ? {
          grade: Number(
            gradeOrPayload.grade ??
              gradeOrPayload.achievedGrade
          ),
          feedback: String(
            gradeOrPayload.feedback || ""
          ).trim(),
        }
      : {
          grade: Number(gradeOrPayload),
          feedback: String(
            feedback || ""
          ).trim(),
        };

  if (!projectId || !studentId) {
    return validationFailure(
      "بيانات المشروع أو الطالب غير مكتملة"
    );
  }

  if (!Number.isFinite(normalized.grade)) {
    return validationFailure(
      "درجة المشروع غير صالحة"
    );
  }

  const endpoint =
    `${ENDPOINT}/${projectId}/submissions/${studentId}/grade`;

  const documentedPayload = {
    grade: normalized.grade,
    ...(normalized.feedback
      ? { feedback: normalized.feedback }
      : {}),
  };

  const postmanPayload = {
    achievedGrade: normalized.grade,
  };

  const attempts = normalized.feedback
    ? [
        {
          payload: documentedPayload,
          mode: "grade-feedback",
          feedbackSaved: true,
        },
        {
          payload: postmanPayload,
          mode: "achievedGrade",
          feedbackSaved: false,
        },
      ]
    : [
        {
          payload: postmanPayload,
          mode: "achievedGrade",
          feedbackSaved: false,
        },
        {
          payload: documentedPayload,
          mode: "grade-feedback",
          feedbackSaved: true,
        },
      ];

  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];

    try {
      const response = await api.patch(
        endpoint,
        attempt.payload
      );

      return attachCompatibilityMeta(
        response.data,
        {
          mode: attempt.mode,
          feedbackSaved:
            attempt.feedbackSaved ||
            !normalized.feedback,
        }
      );
    } catch (error) {
      lastError = error;

      const hasFallback =
        index < attempts.length - 1;

      if (
        !hasFallback ||
        !isValidationError(error)
      ) {
        break;
      }
    }
  }

  return normalizeFailure(
    lastError,
    "تعذر حفظ تقييم المشروع"
  );
};

export const fetchMyProjects =
  fetchTeacherProjects;

export default {
  fetchProjects,
  fetchTeacherProjects,
  fetchMyProjects,
  fetchSingleProject,
  addProject,
  editProject,
  deleteProject,
  addFilesToProject,
  removeFileFromProject,
  fetchAllProjectSubmissions,
  fetchProjectSubmissions,
  downloadProjectSubmission,
  gradeSubmission,
};
