import { api } from "../Axios";

const ENDPOINT = "/teacher-constraints";

/**
 * متى لا يجوز جدولة المعلم.
 *
 * مولّد الجدول يقرأ هذه القيود منذ كُتب ويعاملها قواعد لا تفضيلات: الخانة
 * المحجوبة لا تُعرض أبدًا مهما كانت مناسبة. غير أنه لم تكن هناك شاشة تضبطها،
 * فظل معلم يداوم يومين في الأسبوع يُجدَّل على الخمسة.
 *
 * القيود لكل ترم على حدة — لا تمتد إلى الترم التالي، لأن نصاب المعلم وأيامه
 * يُعاد ترتيبها مع كل ترم.
 */

const ok = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data ?? null,
    };
  }

  return {
    status: true,
    message: payload?.message || "تم",
    data: payload?.data ?? payload,
  };
};

const fail = (error, fallback) => ({
  status: false,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback,
  data: null,
});

/** GET /teacher-constraints?termId= — قيود كل المعلمين في الترم. */
export const fetchTeacherConstraints = async (termId) => {
  const id = String(termId || "").trim();

  if (!id) {
    return { status: false, message: "يجب تحديد الترم", data: [] };
  }

  try {
    return ok(await api.get(ENDPOINT, { params: { termId: id } }));
  } catch (error) {
    return fail(error, "تعذر تحميل قيود المعلمين");
  }
};

/**
 * PUT /teacher-constraints
 *
 * يستبدل المجموعة كاملة لهذا المعلم في هذا الترم. أرسل كل شيء، ومصفوفة
 * فارغة تمسح القيود. اليوم بلا حصص محددة يعني اليوم كله.
 */
export const saveTeacherConstraint = async ({
  teacherId,
  termId,
  unavailable = [],
  note,
} = {}) => {
  const teacher = String(teacherId || "").trim();
  const term = String(termId || "").trim();

  if (!teacher || !term) {
    return { status: false, message: "يجب تحديد المعلم والترم", data: null };
  }

  const blocks = (Array.isArray(unavailable) ? unavailable : [])
    .map((block) => {
      const day = String(block?.day || "").trim().toLowerCase();
      const slots = Array.isArray(block?.slots)
        ? [...new Set(block.slots.map(Number).filter(Number.isInteger))]
            .filter((slot) => slot >= 1 && slot <= 20)
            .sort((first, second) => first - second)
        : [];

      // حصص فارغة = اليوم كله، وهي حالة صحيحة يقبلها الخادم.
      return day ? { day, slots } : null;
    })
    .filter(Boolean);

  try {
    return ok(
      await api.put(ENDPOINT, {
        teacherId: teacher,
        termId: term,
        unavailable: blocks,
        ...(String(note || "").trim()
          ? { note: String(note).trim().slice(0, 300) }
          : {}),
      })
    );
  } catch (error) {
    return fail(error, "تعذر حفظ قيود المعلم");
  }
};

/** DELETE /teacher-constraints/:teacherId/:termId */
export const clearTeacherConstraint = async (teacherId, termId) => {
  const teacher = String(teacherId || "").trim();
  const term = String(termId || "").trim();

  if (!teacher || !term) {
    return { status: false, message: "يجب تحديد المعلم والترم", data: null };
  }

  try {
    return ok(await api.delete(`${ENDPOINT}/${teacher}/${term}`));
  } catch (error) {
    return fail(error, "تعذر مسح قيود المعلم");
  }
};

export default {
  fetchTeacherConstraints,
  saveTeacherConstraint,
  clearTeacherConstraint,
};
