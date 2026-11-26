import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/duty";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const normalizeSuccess = (response) => {
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

const normalizeFailure = (error, fallback) => ({
  status: false,
  message:
    error?.response?.data?.message ||
    error?.message ||
    fallback,
  statusCode: error?.response?.status,
});

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

/** `YYYY-MM-DD` in the browser's own day, not UTC — a school day is local. */
export const toDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

export const DAY_NAMES = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

export const LEAVE_STATUS_LABELS = {
  pending: "في انتظار الرد",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

export const COVER_REASON_LABELS = {
  absent: "غياب",
  planned_absence: "غياب مسبق",
  leave: "استئذان",
  other: "أخرى",
};

/*
 * ─────────────────────────────────────────────────────── لوحة الاحتياطي
 */

/**
 * GET /duty/coverage
 *
 * كل الحصص المحتاجة بديل النهارده، ومعاها المقترحين لكل حصة.
 * قراءة فقط — مش بتكتب أي حاجة.
 */
export const fetchCoverage = async (date) => {
  try {
    const response = await api.get(`${ENDPOINT}/coverage`, {
      params: cleanParams({ date }),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return getApiError(error, "تعذر تحميل لوحة الاحتياطي");
  }
};

/*
 * ────────────────────────────────────────────────────────── التكليفات
 */

/** POST /duty/substitutions */
export const assignSubstitute = async ({
  date,
  lectureId,
  substituteTeacherId,
  reason,
  notes,
} = {}) => {
  const lecture = normalizeId(lectureId);
  const substitute = normalizeId(substituteTeacherId);

  if (!date || !lecture || !substitute) {
    return {
      status: false,
      message: "التاريخ والحصة والمعلم البديل مطلوبين",
    };
  }

  try {
    const response = await api.post(`${ENDPOINT}/substitutions`, {
      date,
      lectureId: lecture,
      substituteTeacherId: substitute,
      ...(reason ? { reason } : {}),
      ...(notes ? { notes } : {}),
    });

    return normalizeSuccess(response);
  } catch (error) {
    // ٤٠٠ هنا معناه إن الباك رفض لسبب محدد — المعلم مشغول، أو التاريخ يومه
    // مش يوم الحصة. الرسالة بتاعته أوضح من أي نص عام.
    return normalizeFailure(error, "تعذر تكليف المعلم بالحصة");
  }
};

/** DELETE /duty/substitutions/:id */
export const removeSubstitute = async (id) => {
  const substitutionId = normalizeId(id);

  if (!substitutionId) {
    return { status: false, message: "معرّف التكليف غير موجود" };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/substitutions/${substitutionId}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر إلغاء التكليف");
  }
};

/**
 * GET /duty/substitutions
 *
 * لو اللي بينادي معلم، الباك بيرجّعله تكليفاته هو بس مهما بعت teacherId.
 */
export const fetchSubstitutions = async ({ date, teacherId } = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/substitutions`, {
      params: cleanParams({ date, teacherId: normalizeId(teacherId) }),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل التكليفات");
  }
};

/*
 * ──────────────────────────────────────────────────── المناوبة اليومية
 */

/**
 * PUT /duty/supervisors
 *
 * بيستبدل اليوم بالكامل — مصفوفة فاضية بتمسح المناوبة.
 */
export const setDutySupervisors = async ({ date, teacherIds, notes } = {}) => {
  if (!date) {
    return { status: false, message: "التاريخ مطلوب" };
  }

  try {
    const response = await api.put(`${ENDPOINT}/supervisors`, {
      date,
      teacherIds: (Array.isArray(teacherIds) ? teacherIds : [])
        .map(normalizeId)
        .filter(Boolean),
      ...(notes !== undefined ? { notes: String(notes ?? "") } : {}),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر حفظ المناوبة");
  }
};

/** GET /duty/supervisors — يوم واحد أو مدى. */
export const fetchDutySupervisors = async ({ date, from, to } = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/supervisors`, {
      params: cleanParams({ date, from, to }),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل المناوبة");
  }
};

/*
 * ────────────────────────────────────────────────────────── الاستئذان
 */

/**
 * POST /duty/leave-requests
 *
 * `fromSlot` أهم من `leaveAt`: المدرسة مالهاش أوقات محددة لكل حصة، فالوقت
 * لوحده مبيحددش الحصص اللي محتاجة بديل. لو اتساب فاضي، اليوم كله بيتعرض
 * على المدير.
 */
export const createLeaveRequest = async ({
  date,
  leaveAt,
  fromSlot,
  reason,
  teacherId,
  kind,
  dateTo,
} = {}) => {
  if (!date || (kind !== "full_day" && !leaveAt)) {
    return { status: false, message: "التاريخ ووقت الانصراف مطلوبين" };
  }

  if (!String(reason || "").trim()) {
    return { status: false, message: "سبب الاستئذان مطلوب" };
  }

  try {
    const response = await api.post(`${ENDPOINT}/leave-requests`, {
      date,
      ...(kind === "full_day" ? { kind, dateTo: dateTo || date } : { leaveAt, ...(fromSlot ? { fromSlot: Number(fromSlot) } : {}) }),
      reason: String(reason).trim(),
      ...(teacherId ? { teacherId: normalizeId(teacherId) } : {}),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر إرسال طلب الاستئذان");
  }
};

/**
 * GET /duty/leave-requests
 *
 * المعلم بياخد طلباته هو بس، مهما بعت teacherId — الفلترة على السيرفر.
 */
export const fetchLeaveRequests = async ({
  date,
  from,
  to,
  status,
  teacherId,
} = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/leave-requests`, {
      params: cleanParams({
        date,
        from,
        to,
        status,
        teacherId: normalizeId(teacherId),
      }),
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل طلبات الاستئذان");
  }
};

/** PATCH /duty/leave-requests/:id/review */
export const reviewLeaveRequest = async (id, { status, reviewNote } = {}) => {
  const requestId = normalizeId(id);

  if (!requestId || !status) {
    return { status: false, message: "معرّف الطلب والحالة مطلوبين" };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/leave-requests/${requestId}/review`,
      { status, ...(reviewNote ? { reviewNote } : {}) }
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر حفظ نتيجة المراجعة");
  }
};

/** DELETE /duty/leave-requests/:id */
export const cancelLeaveRequest = async (id, scope) => {
  const requestId = normalizeId(id);

  if (!requestId) {
    return { status: false, message: "معرّف الطلب غير موجود" };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/leave-requests/${requestId}`, { params: cleanParams({ scope }) }
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر إلغاء طلب الاستئذان");
  }
};

/**
 * GET /duty/cover-report
 *
 * مين شايل الاحتياطي على مدى فترة. الباك بيرجّعهم مرتّبين بالأتقل، وبيعلّم
 * على اللي شايل ضعف الباقين — فمفيش إعادة ترتيب ولا حساب هنا.
 */
export const fetchCoverReport = async ({ from, to } = {}) => {
  if (!from || !to) {
    return { status: false, message: "تاريخ البداية والنهاية مطلوبين" };
  }

  try {
    const response = await api.get(`${ENDPOINT}/cover-report`, {
      params: { from, to },
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل تقرير الاحتياطي");
  }
};

export default {
  fetchCoverage,
  fetchCoverReport,
  assignSubstitute,
  removeSubstitute,
  fetchSubstitutions,
  setDutySupervisors,
  fetchDutySupervisors,
  createLeaveRequest,
  fetchLeaveRequests,
  reviewLeaveRequest,
  cancelLeaveRequest,
};

export const addDays = (date, days) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return toDateInput(value);
};

export const groupLeaveRequests = (rows = []) => {
  const groups = new Map();
  for (const row of rows) {
    const key = row.groupId ? `${row.groupId}-${row.status}` : row._id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map(group => {
    const sorted = [...group].sort((a,b) => String(a.date).localeCompare(String(b.date)));
    return { ...sorted[0], groupDays: sorted.length, dateTo: sorted.at(-1).date };
  });
};
export const leaveDescription = row => row.kind === "full_day"
  ? `غياب يوم كامل · ${row.groupDays || 1} أيام (${row.date}${row.dateTo && row.dateTo !== row.date ? ` إلى ${row.dateTo}` : ""})`
  : `${row.date} · استئذان ${row.leaveAt || ""}`;

export const cancelAffectedCovers = async (data, onError) => {
  const covers = data?.affectedCovers;
  if (!Array.isArray(covers) || !covers.length) return;
  if (!window.confirm(`لهذه المعلمة ${covers.length} حصة احتياط مسجّلة في هذه الأيام. هل تريد إلغاءها وإبلاغ البدلاء؟`)) return;
  for (const cover of covers) {
    const response = await removeSubstitute(cover?.substitutionId || cover?._id || cover?.id || cover);
    if (!response.status) onError(response.message);
  }
};
