import { api } from "../Axios";

const ENDPOINT = "/terms";

const messageOf = (error, fallback = "حدث خطأ ما") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const ok = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
  };
};

const fail = (error, fallback) => ({
  status: false,
  message: messageOf(error, fallback),
  statusCode: error?.response?.status,
  error,
});

const cleanId = (value) =>
  String(value?._id || value?.id || value || "").trim();

export const fetchTerms = async (academicYearId) => {
  const yearId = cleanId(academicYearId);

  if (!yearId) {
    return {
      status: true,
      data: [],
      message: "اختر السنة الدراسية",
    };
  }

  try {
    try {
      return ok(
        await api.get(`${ENDPOINT}/by-year/${yearId}`)
      );
    } catch (error) {
      if (error?.response?.status !== 404) {
        throw error;
      }
    }

    return ok(
      await api.get(ENDPOINT, {
        params: { academicYearId: yearId },
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل الترمات");
  }
};

export const addTerm = async (payload = {}) => {
  const body = {
    academicYearId: cleanId(payload.academicYearId),
    name: String(payload.name || "").trim(),
    order: Number(payload.order),
    startDate: payload.startDate,
    endDate: payload.endDate,
  };

  if (
    !body.academicYearId ||
    !body.name ||
    !body.order ||
    !body.startDate ||
    !body.endDate
  ) {
    return {
      status: false,
      message: "أكمل بيانات الترم المطلوبة",
    };
  }

  try {
    return ok(await api.post(ENDPOINT, body));
  } catch (error) {
    return fail(error, "تعذر إضافة الترم");
  }
};

export const updateTerm = async (id, payload = {}) => {
  const termId = cleanId(id);

  if (!termId) {
    return {
      status: false,
      message: "معرّف الترم غير موجود",
    };
  }

  const body = {
    ...(payload.name !== undefined
      ? { name: String(payload.name || "").trim() }
      : {}),
    ...(payload.order !== undefined
      ? { order: Number(payload.order) }
      : {}),
    ...(payload.startDate !== undefined
      ? { startDate: payload.startDate }
      : {}),
    ...(payload.endDate !== undefined
      ? { endDate: payload.endDate }
      : {}),
    ...(payload.status
      ? { status: payload.status }
      : {}),
  };

  try {
    return ok(await api.patch(`${ENDPOINT}/${termId}`, body));
  } catch (error) {
    return fail(error, "تعذر تعديل الترم");
  }
};

export const deleteTerm = async (id) => {
  const termId = cleanId(id);

  if (!termId) {
    return {
      status: false,
      message: "معرّف الترم غير موجود",
    };
  }

  try {
    return ok(await api.delete(`${ENDPOINT}/${termId}`));
  } catch (error) {
    return fail(error, "تعذر حذف الترم");
  }
};

export const copyTermsFromYear = async (
  targetYearId,
  sourceYearId
) => {
  const targetId = cleanId(targetYearId);
  const sourceId = cleanId(sourceYearId);

  if (!targetId || !sourceId) {
    return {
      status: false,
      message: "اختر السنة الحالية والسنة المصدر",
    };
  }

  if (targetId === sourceId) {
    return {
      status: false,
      message: "لا يمكن النسخ من نفس السنة",
    };
  }

  try {
    return ok(
      await api.post(
        `${ENDPOINT}/copy-from/${targetId}/${sourceId}`,
        {}
      )
    );
  } catch (error) {
    return fail(error, "تعذر نسخ الترمات من السنة السابقة");
  }
};


// -----------------------------------------------------------------------------
// Compatibility aliases for existing project pages (e.g. TermsManager.jsx)
// -----------------------------------------------------------------------------
export const fetchTermsByAcademicYear = fetchTerms;
export const getTermsByAcademicYear = fetchTerms;

export const createTerm = addTerm;
export const editTerm = updateTerm;
export const removeTerm = deleteTerm;

export const copyTerms = copyTermsFromYear;
export const copyTermsFromPreviousYear = copyTermsFromYear;

export const fetchSingleTerm = async (id) => {
  const termId = cleanId(id);

  if (!termId) {
    return {
      status: false,
      message: "معرّف الترم غير موجود",
    };
  }

  try {
    return ok(await api.get(`${ENDPOINT}/${termId}`));
  } catch (error) {
    return fail(error, "تعذر تحميل بيانات الترم");
  }
};

export const createTermsBulk = async (
  academicYearId,
  terms = []
) => {
  const yearId = cleanId(academicYearId);

  const cleanTerms = Array.isArray(terms)
    ? terms
        .map((term) => ({
          name: String(term?.name || "").trim(),
          order: Number(term?.order),
          startDate: term?.startDate,
          endDate: term?.endDate,
        }))
        .filter(
          (term) =>
            term.name &&
            term.order &&
            term.startDate &&
            term.endDate
        )
    : [];

  if (!yearId || cleanTerms.length === 0) {
    return {
      status: false,
      message: "اختر السنة وأضف ترمًا واحدًا على الأقل",
    };
  }

  try {
    return ok(
      await api.post(`${ENDPOINT}/bulk`, {
        academicYearId: yearId,
        terms: cleanTerms,
      })
    );
  } catch (error) {
    return fail(error, "تعذر إضافة الترمات");
  }
};

export const bulkCreateTerms = createTermsBulk;
export const addTermsBulk = createTermsBulk;

export default {
  fetchTerms,
  fetchTermsByAcademicYear,
  getTermsByAcademicYear,
  fetchSingleTerm,
  addTerm,
  createTerm,
  createTermsBulk,
  bulkCreateTerms,
  addTermsBulk,
  updateTerm,
  editTerm,
  deleteTerm,
  removeTerm,
  copyTermsFromYear,
  copyTerms,
  copyTermsFromPreviousYear,
};
