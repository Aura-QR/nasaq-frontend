import { api } from "../Axios";

const ENDPOINT = "/library";
const ACADEMIC_YEARS_ENDPOINT = "/academic-years";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(
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
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
      pagination: payload?.pagination || null,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination:
      payload?.pagination ||
      payload?.data?.pagination ||
      null,
  };
};

const normalizeFailure = (
  error,
  fallback = "حدث خطأ ما"
) => ({
  status: false,
  message:
    error?.response?.data?.message ||
    error?.message ||
    fallback,
  data: error?.response?.data?.data,
});

/**
 * الـ Backend يقبل فقط الحقول الموجودة في CreateLibraryDto.
 * مهم: academicYear غير مقبول، والصحيح academicYearId.
 */
export const normalizeLibraryPayload = (
  data = {}
) => {
  const payload = {};

  const title = String(data?.title || "").trim();
  const link = String(data?.link || "").trim();
  const subjectId = normalizeId(
    data?.subjectId || data?.subject
  );
  const academicYearId = normalizeId(
    data?.academicYearId ||
      (typeof data?.academicYear === "object"
        ? data.academicYear
        : "")
  );
  const termId = normalizeId(
    data?.termId || data?.term
  );

  if (title) payload.title = title;
  if (link) payload.link = link;
  if (subjectId) payload.subjectId = subjectId;
  if (academicYearId) {
    payload.academicYearId = academicYearId;
  }
  if (termId) payload.termId = termId;

  return payload;
};

const normalizeLibraryFilters = (
  filters = {}
) => {
  const normalized = {
    page: filters?.page,
    limit: filters?.limit,
    title: filters?.title,
    subjectId: normalizeId(filters?.subjectId),
    academicYearId: normalizeId(
      filters?.academicYearId
    ),
    termId: normalizeId(filters?.termId),
  };

  return cleanParams(normalized);
};

export const fetchLibraries = async (
  filters = {}
) => {
  try {
    const response = await api.get(ENDPOINT, {
      params: normalizeLibraryFilters(filters),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل عناصر المكتبة"
    );
  }
};

export const fetchSingleLibrary = async (id) => {
  const libraryId = normalizeId(id);

  if (!libraryId) {
    return {
      status: false,
      message: "معرّف عنصر المكتبة غير موجود",
    };
  }

  try {
    const response = await api.get(
      `${ENDPOINT}/${libraryId}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل عنصر المكتبة"
    );
  }
};

export const fetchLibraryAcademicYears = async () => {
  try {
    const response = await api.get(
      ACADEMIC_YEARS_ENDPOINT
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل السنوات الدراسية"
    );
  }
};

export const addLibrary = async (data) => {
  const payload = normalizeLibraryPayload(data);

  if (!payload.title || !payload.link) {
    return {
      status: false,
      message: "عنوان العنصر والرابط مطلوبان",
    };
  }

  try {
    const response = await api.post(
      ENDPOINT,
      payload
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر إضافة عنصر المكتبة"
    );
  }
};

export const editLibrary = async (data, id) => {
  const libraryId = normalizeId(id);

  if (!libraryId) {
    return {
      status: false,
      message: "معرّف عنصر المكتبة غير موجود",
    };
  }

  const payload = normalizeLibraryPayload(data);

  if (Object.keys(payload).length === 0) {
    return {
      status: false,
      message: "لا توجد بيانات صالحة للتعديل",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${libraryId}`,
      payload
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل عنصر المكتبة"
    );
  }
};

export const deleteLibrary = async (id) => {
  const libraryId = normalizeId(id);

  if (!libraryId) {
    return {
      status: false,
      message: "معرّف عنصر المكتبة غير موجود",
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${libraryId}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف عنصر المكتبة"
    );
  }
};

/* Aliases للتوافق مع الملفات القديمة. */
export const fetchLibrary = fetchSingleLibrary;
export const getLibrary = fetchSingleLibrary;
export const createLibrary = addLibrary;
export const updateLibrary = editLibrary;
export const removeLibrary = deleteLibrary;

export default {
  fetchLibraries,
  fetchSingleLibrary,
  fetchLibrary,
  getLibrary,
  fetchLibraryAcademicYears,
  addLibrary,
  createLibrary,
  editLibrary,
  updateLibrary,
  deleteLibrary,
  removeLibrary,
  normalizeLibraryPayload,
};
