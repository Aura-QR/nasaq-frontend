import { api } from "../Axios";

const ENDPOINT =
  "/preparation";

const normalizeId = (
  value
) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};

const cleanParams = (
  params = {}
) =>
  Object.fromEntries(
    Object.entries(
      params || {}
    ).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

const normalizeSuccess = (
  response
) => {
  const payload =
    response?.data;

  if (
    payload?.status === false
  ) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    /*
     * الباك بيرد { data: [...], totalDocs, totalPages } لما يتبعتله page/limit.
     * الهوك بيدور على `pagination`، فمن غير السطر ده كان بيلاقي null
     * وأزرار الصفحات مكانتش بتظهر — المستخدم يشوف أول ١٠ وخلاص.
     */
    const hasPageInfo =
      payload.totalDocs !==
        undefined ||
      payload.totalPages !==
        undefined;

    return {
      ...payload,
      status:
        payload.status ??
        true,
      data:
        payload.data ??
        payload,
      pagination: hasPageInfo
        ? {
            totalDocs:
              payload.totalDocs,
            totalPages:
              payload.totalPages,
          }
        : payload.pagination,
    };
  }

  return {
    status: true,
    message: "Success",
    data: payload,
  };
};

const normalizeFailure = (
  error,
  fallback = "حدث خطأ ما"
) => ({
  status: false,
  message:
    error?.response?.data
      ?.message ||
    error?.message ||
    fallback,
  data:
    error?.response?.data
      ?.data,
});

const getServerFilename = (
  file
) => {
  if (!file) {
    return "";
  }

  const directName =
    file?.filename ||
    file?.storedName ||
    file?.serverFilename;

  if (directName) {
    return String(
      directName
    );
  }

  const path =
    file?.path ||
    file?.filePath ||
    file?.url ||
    file?.fileUrl ||
    "";

  if (!path) {
    return "";
  }

  const cleanPath =
    String(path).split("?")[0];

  return decodeURIComponent(
    cleanPath
      .split("/")
      .filter(Boolean)
      .pop() || ""
  );
};

const toFilesArray = (
  files
) =>
  (Array.isArray(files)
    ? files
    : [files]
  ).filter(Boolean);

export const fetchPreparations =
  async (
    filters = {}
  ) => {
    try {
      const response =
        await api.get(
          ENDPOINT,
          {
            params:
              cleanParams(
                filters
              ),
          }
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل التحاضير"
      );
    }
  };

export const fetchSinglePreparation =
  async (
    id
  ) => {
    const preparationId =
      normalizeId(id);

    if (!preparationId) {
      return {
        status: false,
        message:
          "معرّف التحضير غير موجود",
      };
    }

    try {
      const response =
        await api.get(
          `${ENDPOINT}/${preparationId}`
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل التحضير"
      );
    }
  };

export const addPreparation =
  async (
    data
  ) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          data
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر إضافة التحضير"
      );
    }
  };

const patchPreparation =
  async (
    id,
    data
  ) => {
    const preparationId =
      normalizeId(id);

    if (!preparationId) {
      return {
        status: false,
        message:
          "معرّف التحضير غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${preparationId}`,
          data
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تعديل التحضير"
      );
    }
  };

export const addPreparationFiles =
  async (
    id,
    files
  ) => {
    const preparationId =
      normalizeId(id);

    if (!preparationId) {
      return {
        status: false,
        message:
          "معرّف التحضير غير موجود",
      };
    }

    const selectedFiles =
      toFilesArray(files);

    if (
      selectedFiles.length === 0
    ) {
      return {
        status: false,
        message:
          "لم يتم اختيار ملف",
      };
    }

    const formData =
      new FormData();

    selectedFiles.forEach(
      (file) => {
        formData.append(
          "files",
          file
        );
      }
    );

    try {
      const response =
        await api.post(
          `${ENDPOINT}/${preparationId}/files`,
          formData
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر رفع ملف التحضير"
      );
    }
  };

export const deletePreparationFile =
  async (
    id,
    filename
  ) => {
    const preparationId =
      normalizeId(id);

    const normalizedFilename =
      String(
        filename || ""
      ).trim();

    if (!preparationId) {
      return {
        status: false,
        message:
          "معرّف التحضير غير موجود",
      };
    }

    if (!normalizedFilename) {
      return {
        status: false,
        message:
          "اسم الملف غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${preparationId}/files/${encodeURIComponent(
            normalizedFilename
          )}`
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر حذف ملف التحضير"
      );
    }
  };

export const replacePreparationFile =
  async (
    id,
    newFile,
    oldFile
  ) => {
    const uploadResponse =
      await addPreparationFiles(
        id,
        newFile
      );

    if (
      !uploadResponse?.status
    ) {
      return uploadResponse;
    }

    const oldFilename =
      getServerFilename(
        oldFile
      );

    if (!oldFilename) {
      return uploadResponse;
    }

    const removeResponse =
      await deletePreparationFile(
        id,
        oldFilename
      );

    if (
      !removeResponse?.status
    ) {
      return {
        ...uploadResponse,
        status: true,
        warning:
          "تم رفع الملف الجديد، لكن تعذر حذف الملف القديم.",
      };
    }

    return uploadResponse;
  };

export const editPreparation =
  async (
    data,
    id
  ) => {
    if (
      typeof FormData !==
        "undefined" &&
      data instanceof FormData
    ) {
      const lecture =
        normalizeId(
          data.get(
            "lecture"
          )
        );

      const files =
        data
          .getAll("files")
          .filter(Boolean);

      let response = {
        status: true,
        data: null,
      };

      if (lecture) {
        response =
          await patchPreparation(
            id,
            { lecture }
          );

        if (!response?.status) {
          return response;
        }
      }

      if (
        files.length > 0
      ) {
        return addPreparationFiles(
          id,
          files
        );
      }

      return response;
    }

    return patchPreparation(
      id,
      data
    );
  };

export const deletePreparation =
  async (
    id
  ) => {
    const preparationId =
      normalizeId(id);

    if (!preparationId) {
      return {
        status: false,
        message:
          "معرّف التحضير غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${preparationId}`
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر حذف التحضير"
      );
    }
  };



export const fetchPreparationReferenceLists = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/reference-lists`);
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل قوائم إعداد الدرس"
    );
  }
};

export const submitPreparation = async (id) => {
  const preparationId = normalizeId(id);

  if (!preparationId) {
    return {
      status: false,
      message: "معرّف التحضير غير موجود",
    };
  }

  // Structured-preparation backends expose a dedicated submit action.
  // The two method attempts keep the frontend compatible during rollout,
  // while the final PATCH fallback works with the legacy reviewStatus model.
  try {
    const response = await api.post(`${ENDPOINT}/${preparationId}/submit`, {});
    return normalizeSuccess(response);
  } catch (error) {
    if (![404, 405].includes(error?.response?.status)) {
      return normalizeFailure(error, "تعذر إرسال التحضير للمراجعة");
    }
  }

  try {
    const response = await api.patch(`${ENDPOINT}/${preparationId}/submit`, {});
    return normalizeSuccess(response);
  } catch (error) {
    if (![404, 405].includes(error?.response?.status)) {
      return normalizeFailure(error, "تعذر إرسال التحضير للمراجعة");
    }
  }

  return patchPreparation(preparationId, {
    reviewStatus: "pending",
  });
};

/*
 * Aliases للتوافق مع الملفات القديمة.
 */
export const fetchPreparation =
  fetchSinglePreparation;

export const getPreparation =
  fetchSinglePreparation;

export const createPreparation =
  addPreparation;

export const updatePreparation =
  editPreparation;

export const removePreparation =
  deletePreparation;

export default {
  fetchPreparations,
  fetchPreparationReferenceLists,
  fetchSinglePreparation,
  fetchPreparation,
  getPreparation,
  addPreparation,
  createPreparation,
  editPreparation,
  updatePreparation,
  deletePreparation,
  removePreparation,
  addPreparationFiles,
  deletePreparationFile,
  replacePreparationFile,
  submitPreparation,
};
