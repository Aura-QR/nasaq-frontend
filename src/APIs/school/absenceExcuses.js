import { api } from "../Axios";

const ENDPOINT = "/attendance";

/**
 * أعذار الغياب.
 *
 * إشعار الغياب يطلب من ولي الأمر بيان السبب وإرفاق العذر الطبي. قبل هذا لم
 * يكن هناك مكان يُستقبل فيه الرد، فكان الطلب زينة — ونموذج لا يجمع شيئًا
 * يُعلّم الناس تجاهل ما بعده.
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
 * GET /attendance/excuses
 *
 * يفتح على «قيد المراجعة» افتراضيًا: القائمة موجودة لتُفرَّغ، وفتحها على كل
 * عذر أُرسل يومًا يدفن الثلاثة التي تحتاج قرارًا اليوم.
 */
export const fetchAbsenceExcuses = async ({
  status = "pending",
  from,
  to,
  classId,
  page = 1,
  limit = 20,
} = {}) => {
  try {
    return ok(
      await api.get(`${ENDPOINT}/excuses`, {
        params: {
          status,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(classId ? { classId } : {}),
          page,
          limit,
        },
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل أعذار الغياب");
  }
};

/**
 * PATCH /attendance/excuses/:id/review
 *
 * الرفض يلزمه سبب. رفض بلا سبب هو المدرسة تُبلغ أسرة أن تفسيرها لم يكفِ
 * وتمتنع عن قول لماذا، وبهذا يتحول النموذج إلى تظلّم.
 */
export const reviewAbsenceExcuse = async (attendanceId, verdict, note) => {
  const id = String(attendanceId || "").trim();

  if (!id) {
    return { status: false, message: "سجل الغياب غير محدد", data: null };
  }

  if (verdict === "rejected" && !String(note || "").trim()) {
    return { status: false, message: "اذكر سبب رفض العذر", data: null };
  }

  try {
    return ok(
      await api.patch(`${ENDPOINT}/excuses/${id}/review`, {
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

/** GET /attendance/me/excuse/pending — غيابات ولي الأمر التي لم يُجب عنها. */
export const fetchPendingExcuses = async () => {
  try {
    return ok(await api.get(`${ENDPOINT}/me/excuse/pending`));
  } catch (error) {
    return fail(error, "تعذر تحميل الغيابات");
  }
};

/** POST /attendance/me/excuse/attachment — يعيد المسار المطلوب إرساله مع العذر. */
export const uploadExcuseAttachment = async (file) => {
  if (!file) return { status: false, message: "لم يُختر ملف", data: null };

  const form = new FormData();
  form.append("file", file);

  try {
    return ok(
      await api.post(`${ENDPOINT}/me/excuse/attachment`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  } catch (error) {
    return fail(error, "تعذر رفع المرفق");
  }
};

/** POST /attendance/me/excuse — يُكتب مرة واحدة. */
export const submitAbsenceExcuse = async ({
  attendanceId,
  reason,
  attachment,
} = {}) => {
  const id = String(attendanceId || "").trim();
  const text = String(reason || "").trim();

  if (!id) return { status: false, message: "سجل الغياب غير محدد", data: null };
  if (text.length < 3) {
    return { status: false, message: "اكتب سبب الغياب", data: null };
  }

  try {
    return ok(
      await api.post(`${ENDPOINT}/me/excuse`, {
        attendanceId: id,
        reason: text.slice(0, 1000),
        ...(attachment ? { attachment } : {}),
      })
    );
  } catch (error) {
    return fail(error, "تعذر إرسال العذر");
  }
};

export default {
  fetchAbsenceExcuses,
  reviewAbsenceExcuse,
  fetchPendingExcuses,
  uploadExcuseAttachment,
  submitAbsenceExcuse,
};
