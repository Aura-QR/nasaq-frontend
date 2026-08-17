import { api } from "../Axios";

const ENDPOINT = "/subject-offerings";

const normalizeSubjectOfferingMessage = (message, fallback = "حدث خطأ ما") => {
  const value = String(message || "").trim();

  if (!value) return fallback;

  if (/source or target academic year has no terms configured/i.test(value)) {
    return "لا يمكن نسخ عروض المواد لأن السنة المصدر أو السنة المستهدفة لا تحتوي على ترمات. أضف الترمات للسنتين أولًا ثم أعد المحاولة.";
  }

  if (/source academic year has no terms configured/i.test(value)) {
    return "السنة المصدر لا تحتوي على ترمات. أضف الترمات أولًا ثم أعد المحاولة.";
  }

  if (/target academic year has no terms configured/i.test(value)) {
    return "السنة المستهدفة لا تحتوي على ترمات. أضف الترمات أولًا ثم أعد المحاولة.";
  }

  return value;
};

const messageOf = (error, fallback = "حدث خطأ ما") =>
  normalizeSubjectOfferingMessage(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message,
    fallback
  );

const ok = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: normalizeSubjectOfferingMessage(
        payload?.message,
        "فشلت العملية"
      ),
      data: payload?.data,
      pagination: payload?.pagination,
    };
  }

  return {
    status: true,
    message: normalizeSubjectOfferingMessage(payload?.message, "Success"),
    data: payload?.data ?? payload,
    pagination: payload?.pagination || payload?.meta || payload?.paging,
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

export const buildSubjectOfferingPayload = (payload = {}) => ({
  subjectId: cleanId(payload?.subjectId),
  gradeLevelId: cleanId(payload?.gradeLevelId),
  termId: cleanId(payload?.termId),
});

/**
 * الباك الموثق يدعم /by-term/:termId، بينما بعض النسخ القديمة
 * تدعم GET /subject-offerings بفلاتر. لذلك الدالة تجرب المسارين.
 */
export const fetchSubjectOfferings = async (
  filters = {},
  { forceListEndpoint = false } = {}
) => {
  const termId = cleanId(filters?.termId);
  const gradeLevelId = cleanId(filters?.gradeLevelId);

  const params = {
    ...(gradeLevelId ? { gradeLevelId } : {}),
    ...(termId ? { termId } : {}),
  };

  try {
    if (termId && !forceListEndpoint) {
      try {
        return ok(
          await api.get(`${ENDPOINT}/by-term/${termId}`, {
            params: gradeLevelId ? { gradeLevelId } : {},
          })
        );
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }

    return ok(await api.get(ENDPOINT, { params }));
  } catch (error) {
    return fail(error, "تعذر تحميل عروض المواد");
  }
};

export const fetchSingleSubjectOffering = async (id) => {
  const offeringId = cleanId(id);

  if (!offeringId) {
    return {
      status: false,
      message: "معرّف عرض المادة غير موجود",
    };
  }

  try {
    return ok(await api.get(`${ENDPOINT}/${offeringId}`));
  } catch (error) {
    return fail(error, "تعذر تحميل بيانات عرض المادة");
  }
};

export const addSubjectOffering = async (payload) => {
  const body = buildSubjectOfferingPayload(payload);

  if (!body.subjectId || !body.gradeLevelId || !body.termId) {
    return {
      status: false,
      message: "اختر المادة والصف الدراسي والترم",
    };
  }

  try {
    return ok(await api.post(ENDPOINT, body));
  } catch (error) {
    return fail(error, "تعذر إنشاء عرض المادة");
  }
};

export const deleteSubjectOffering = async (id) => {
  const offeringId = cleanId(id);

  if (!offeringId) {
    return {
      status: false,
      message: "معرّف عرض المادة غير موجود",
    };
  }

  try {
    return ok(await api.delete(`${ENDPOINT}/${offeringId}`));
  } catch (error) {
    return fail(error, "تعذر حذف عرض المادة");
  }
};

export const copySubjectOfferingsFromYear = async (
  targetYearId,
  sourceYearId
) => {
  const targetId = cleanId(targetYearId);
  const sourceId = cleanId(sourceYearId);

  if (!targetId || !sourceId) {
    return {
      status: false,
      message: "اختر السنة المصدر والسنة المستهدفة",
    };
  }

  if (targetId === sourceId) {
    return {
      status: false,
      message: "لا يمكن النسخ من نفس السنة الدراسية",
    };
  }

  try {
    return ok(await api.post(`${ENDPOINT}/copy-from/${targetId}/${sourceId}`));
  } catch (error) {
    return fail(error, "تعذر نسخ عروض المواد");
  }
};

export default {
  fetchSubjectOfferings,
  fetchSingleSubjectOffering,
  addSubjectOffering,
  deleteSubjectOffering,
  copySubjectOfferingsFromYear,
  buildSubjectOfferingPayload,
};
