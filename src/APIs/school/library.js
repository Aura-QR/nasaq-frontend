import { api } from "../Axios";

const ENDPOINT = "/library";
const ACADEMIC_YEARS_ENDPOINT = "/academic-years";

/* =========================================================
   Helpers
========================================================= */

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

const normalizeSuccess = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message:
        payload?.message ||
        "فشلت العملية",

      data:
        payload?.data,

      pagination:
        payload?.pagination ||
        null,

      statusCode:
        payload?.statusCode,
    };
  }

  return {
    status: true,

    message:
      payload?.message ||
      "Success",

    data:
      payload?.data ??
      payload,

    pagination:
      payload?.pagination ||
      payload?.data?.pagination ||
      null,

    statusCode:
      payload?.statusCode,
  };
};

const normalizeFailure = (
  error,
  fallback = "حدث خطأ ما"
) => {
  return {
    status: false,

    message:
      error?.response?.data
        ?.message ||
      error?.message ||
      fallback,

    data:
      error?.response?.data
        ?.data,

    statusCode:
      error?.response?.status ||
      error?.response?.data
        ?.statusCode,
  };
};

/* =========================================================
   Library Payload

   Backend:
   {
     title,
     link,
     subjectOfferingId?
   }
========================================================= */

export const normalizeLibraryPayload = (
  data = {}
) => {
  const payload = {};

  /*
   * TITLE
   */
  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "title"
    )
  ) {
    payload.title = String(
      data?.title || ""
    ).trim();
  }

  /*
   * LINK
   */
  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "link"
    )
  ) {
    payload.link = String(
      data?.link || ""
    ).trim();
  }

  /*
   * SUBJECT OFFERING
   */
  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "subjectOfferingId"
    ) ||
    Object.prototype.hasOwnProperty.call(
      data,
      "subjectOffering"
    )
  ) {
    const subjectOfferingId =
      normalizeId(
        data?.subjectOfferingId ||
          data?.subjectOffering
      );

    /*
     * null مهم في PATCH
     * لو عايزين نحول المصدر
     * من مادة إلى مصدر عام.
     */
    payload.subjectOfferingId =
      subjectOfferingId || null;
  }

  return payload;
};

/* =========================================================
   GET /library
========================================================= */

export const fetchLibraries = async (
  filters = {},
  options = {}
) => {
  try {
    const params = cleanParams({
      page:
        filters?.page,

      limit:
        filters?.limit,

      subjectOfferingId:
        normalizeId(
          filters?.subjectOfferingId
        ),
    });

    /*
     * force موجود للتوافق مع
     * باقي API layer لو استخدمناه لاحقًا.
     */
    void options;

    const response = await api.get(
      ENDPOINT,
      {
        params,
      }
    );

    return normalizeSuccess(
      response
    );
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل عناصر المكتبة"
    );
  }
};

/* =========================================================
   GET /library/list

   Simplified list for dropdowns
========================================================= */

export const fetchLibraryList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل قائمة المكتبة"
      );
    }
  };

/* =========================================================
   GET /library/:id
========================================================= */

export const fetchSingleLibrary =
  async (id) => {
    const libraryId =
      normalizeId(id);

    if (!libraryId) {
      return {
        status: false,
        message:
          "معرّف عنصر المكتبة غير موجود",
      };
    }

    try {
      const response = await api.get(
        `${ENDPOINT}/${libraryId}`
      );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل عنصر المكتبة"
      );
    }
  };

/* =========================================================
   Academic Years

   موجودة للتوافق مع TeacherLibrary.jsx
========================================================= */

export const fetchLibraryAcademicYears =
  async () => {
    try {
      const response = await api.get(
        ACADEMIC_YEARS_ENDPOINT
      );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeFailure(
        error,
        "تعذر تحميل السنوات الدراسية"
      );
    }
  };

/* =========================================================
   POST /library
========================================================= */

export const addLibrary = async (
  data
) => {
  const payload =
    normalizeLibraryPayload(
      data
    );

  if (!payload.title) {
    return {
      status: false,
      message:
        "عنوان عنصر المكتبة مطلوب",
    };
  }

  if (!payload.link) {
    return {
      status: false,
      message:
        "رابط عنصر المكتبة مطلوب",
    };
  }

  try {
    const response = await api.post(
      ENDPOINT,
      payload
    );

    return normalizeSuccess(
      response
    );
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر إضافة عنصر المكتبة"
    );
  }
};

/* =========================================================
   PATCH /library/:id
========================================================= */

export const editLibrary = async (
  data,
  id
) => {
  const libraryId =
    normalizeId(id);

  if (!libraryId) {
    return {
      status: false,
      message:
        "معرّف عنصر المكتبة غير موجود",
    };
  }

  const payload =
    normalizeLibraryPayload(
      data
    );

  if (
    Object.keys(payload).length ===
    0
  ) {
    return {
      status: false,
      message:
        "لا توجد بيانات صالحة للتعديل",
    };
  }

  try {
    const response =
      await api.patch(
        `${ENDPOINT}/${libraryId}`,
        payload
      );

    return normalizeSuccess(
      response
    );
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل عنصر المكتبة"
    );
  }
};

/* =========================================================
   DELETE /library/:id
========================================================= */

export const deleteLibrary = async (
  id
) => {
  const libraryId =
    normalizeId(id);

  if (!libraryId) {
    return {
      status: false,
      message:
        "معرّف عنصر المكتبة غير موجود",
    };
  }

  try {
    const response =
      await api.delete(
        `${ENDPOINT}/${libraryId}`
      );

    return normalizeSuccess(
      response
    );
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف عنصر المكتبة"
    );
  }
};

/* =========================================================
   Aliases
========================================================= */

export const fetchLibrary =
  fetchSingleLibrary;

export const getLibrary =
  fetchSingleLibrary;

export const createLibrary =
  addLibrary;

export const updateLibrary =
  editLibrary;

export const removeLibrary =
  deleteLibrary;

export const fetchLibraryBySubject = async (
  subjectId
) => {
  const id = normalizeId(subjectId);

  if (!id) {
    return {
      status: false,
      message: "معرّف المادة غير موجود",
    };
  }

  try {
    const response = await api.get(
      `${ENDPOINT}/by-subject/${id}`
    );
    return normalizeSuccess(response);
  } catch (error) {
    if (error?.response?.status === 404) {
      return fetchLibraries({ subjectId: id });
    }
    return normalizeFailure(
      error,
      "تعذر تحميل مصادر المادة"
    );
  }
};

/* =========================================================
   Default Export
========================================================= */

export default {
  fetchLibraries,

  fetchLibraryList,

  fetchSingleLibrary,

  fetchLibraryBySubject,

  fetchLibraryAcademicYears,

  fetchLibrary,

  getLibrary,

  addLibrary,

  createLibrary,

  editLibrary,

  updateLibrary,

  deleteLibrary,

  removeLibrary,

  normalizeLibraryPayload,
};