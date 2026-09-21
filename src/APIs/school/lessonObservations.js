import { api } from "../Axios";

const ENDPOINT = "/lesson-observations";

/**
 * ما يراه المشرف حين ينظر داخل الفصل.
 *
 * ليست حضور المعلمين، وهو اليوم: معلمة تبصم السابعة إلا عشرًا وتصل الحصة
 * الرابعة متأخرة عشر دقائق، والسجل اليومي لا يملك طريقة ليقول ذلك. هذه الحصة.
 *
 * وليست الاحتياطي، وهو تعيين بديل. الاحتياطي قرار، وهذه ملاحظة.
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

/**
 * GET /lesson-observations/round
 *
 * حصص اليوم ومعها ما كُتب عن كل واحدة، والتغطية إن وُجدت — فالحصة التي
 * أعادت الإدارة إسنادها ليست غيابًا يُبلَّغ عنه.
 */
export const fetchRound = async (date) => {
  try {
    return ok(
      await api.get(`${ENDPOINT}/round`, {
        params: date ? { date } : {},
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل جولة الفصول");
  }
};

/**
 * POST /lesson-observations
 *
 * تُكتب مرة لكل (حصة + يوم). مشرفان يمشيان الممر نفسه يجب ألا يُبلغا المعلم
 * مرتين ولا يُحسب غياب واحد غيابين.
 */
export const recordObservation = async ({
  lectureId,
  date,
  status,
  lateMinutes,
  observedAt,
  note,
} = {}) => {
  const id = String(lectureId || "").trim();

  if (!id) return { status: false, message: "الحصة غير محددة", data: null };
  if (!["present", "late", "absent"].includes(status)) {
    return { status: false, message: "الحالة غير صحيحة", data: null };
  }

  try {
    return ok(
      await api.post(ENDPOINT, {
        lectureId: id,
        status,
        ...(date ? { date } : {}),
        ...(status === "late" && Number.isFinite(Number(lateMinutes))
          ? { lateMinutes: Math.max(0, Math.round(Number(lateMinutes))) }
          : {}),
        ...(observedAt ? { observedAt } : {}),
        ...(String(note || "").trim()
          ? { note: String(note).trim().slice(0, 500) }
          : {}),
      })
    );
  } catch (error) {
    return fail(error, "تعذر تسجيل الملاحظة");
  }
};

/** GET /lesson-observations — السجل. */
export const fetchObservations = async ({
  status = "",
  teacherId,
  dateFrom,
  dateTo,
  page = 1,
  limit = 50,
} = {}) => {
  try {
    return ok(
      await api.get(ENDPOINT, {
        params: {
          ...(status ? { status } : {}),
          ...(teacherId ? { teacherId } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
          page,
          limit,
        },
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل سجل الملاحظات");
  }
};

/** GET /lesson-observations/me/pending — ما على المعلم أن يرد عليه. */
export const fetchMyObservations = async () => {
  try {
    return ok(await api.get(`${ENDPOINT}/me/pending`));
  } catch (error) {
    return fail(error, "تعذر تحميل الملاحظات");
  }
};

/** POST /lesson-observations/:id/reason — يُكتب مرة واحدة. */
export const explainObservation = async (observationId, reason) => {
  const id = String(observationId || "").trim();
  const text = String(reason || "").trim();

  if (!id) return { status: false, message: "الملاحظة غير محددة", data: null };
  if (text.length < 3) {
    return { status: false, message: "اكتب السبب", data: null };
  }

  try {
    return ok(
      await api.post(`${ENDPOINT}/${id}/reason`, { reason: text.slice(0, 1000) })
    );
  } catch (error) {
    return fail(error, "تعذر إرسال الرد");
  }
};

/**
 * PATCH /lesson-observations/:id/review
 *
 * الرفض يلزمه سبب: الملاحظة أثر في سجل المعلم، ورفض عذره صامتًا يتركه بلا
 * شيء يردّ عليه.
 */
export const reviewObservation = async (observationId, verdict, note) => {
  const id = String(observationId || "").trim();

  if (!id) return { status: false, message: "الملاحظة غير محددة", data: null };
  if (verdict === "rejected" && !String(note || "").trim()) {
    return { status: false, message: "اذكر سبب رفض العذر", data: null };
  }

  try {
    return ok(
      await api.patch(`${ENDPOINT}/${id}/review`, {
        verdict,
        ...(String(note || "").trim()
          ? { note: String(note).trim().slice(0, 500) }
          : {}),
      })
    );
  } catch (error) {
    return fail(error, "تعذر حفظ القرار");
  }
};

export default {
  fetchRound,
  recordObservation,
  fetchObservations,
  fetchMyObservations,
  explainObservation,
  reviewObservation,
};
