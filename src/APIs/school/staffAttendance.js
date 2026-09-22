import { api } from "../Axios";

const ENDPOINT = "/staff-attendance";
const SCHOOL_SETTINGS_ENDPOINT = "/schools/me/settings";

const getErrorResult = (
  error,
  fallbackMessage = "حدث خطأ ما"
) => ({
  status: false,
  statusCode:
    error?.response?.status ||
    error?.response?.data?.statusCode ||
    500,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage,
  data: error?.response?.data?.data ?? null,
  error,
});

const compactParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== ""
    )
  );

const normalizeRequestId = (value) => {
  if (value && typeof value === "object") {
    return String(value?._id || value?.id || "").trim();
  }
  return String(value || "").trim();
};

export const fetchStaffAttendanceSettings = async () => {
  try {
    const response = await api.get(SCHOOL_SETTINGS_ENDPOINT);
    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل إعدادات حضور الإداريين والمشرفين"
    );
  }
};

export const updateStaffAttendanceSettings = async (data = {}) => {
  try {
    const payload = {
      staffCheckInEnabled: Boolean(data?.staffCheckInEnabled),
      ...(Object.prototype.hasOwnProperty.call(data, "checkInRadiusMeters")
        ? { checkInRadiusMeters: Number(data.checkInRadiusMeters) }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "schoolNetworkIps")
        ? {
            schoolNetworkIps: Array.isArray(data.schoolNetworkIps)
              ? data.schoolNetworkIps.map((item) => String(item || "").trim()).filter(Boolean)
              : [],
          }
        : {}),
      ...(data?.location &&
      Number.isFinite(Number(data.location.lat)) &&
      Number.isFinite(Number(data.location.lng))
        ? {
            location: {
              lat: Number(data.location.lat),
              lng: Number(data.location.lng),
            },
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "workSchedule")
        ? {
            workSchedule: Array.isArray(data.workSchedule)
              ? data.workSchedule.map((item) => {
                  const isWorkingDay = Boolean(item?.isWorkingDay);
                  return {
                    day: String(item?.day || "").trim().toLowerCase(),
                    isWorkingDay,
                    ...(isWorkingDay && item?.startTime
                      ? { startTime: String(item.startTime).slice(0, 5) }
                      : {}),
                    ...(isWorkingDay && item?.endTime
                      ? { endTime: String(item.endTime).slice(0, 5) }
                      : {}),
                    ...(item?.periodsPerDay !== undefined && item?.periodsPerDay !== null
                      ? { periodsPerDay: Number(item.periodsPerDay) }
                      : {}),
                  };
                })
              : [],
          }
        : {}),
    };

    const response = await api.patch(SCHOOL_SETTINGS_ENDPOINT, payload);
    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر حفظ إعدادات حضور الإداريين والمشرفين"
    );
  }
};

export const detectStaffAttendanceIp = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/detect-ip`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر اكتشاف عنوان الشبكة الحالي");
  }
};

export const checkInStaffAttendance = async ({
  lat,
  lng,
  mockLocationSuspected,
}) => {
  try {
    const response = await api.post(`${ENDPOINT}/check-in`, {
      lat: Number(lat),
      lng: Number(lng),
      ...(mockLocationSuspected !== undefined
        ? { mockLocationSuspected: Boolean(mockLocationSuspected) }
        : {}),
    });

    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تسجيل حضورك");
  }
};

export const checkOutStaffAttendance = async ({
  lat,
  lng,
  mockLocationSuspected,
}) => {
  try {
    const response = await api.post(`${ENDPOINT}/check-out`, {
      lat: Number(lat),
      lng: Number(lng),
      ...(mockLocationSuspected !== undefined
        ? { mockLocationSuspected: Boolean(mockLocationSuspected) }
        : {}),
    });

    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تسجيل انصرافك");
  }
};

export const fetchMyStaffAttendance = async (params = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/me`, {
      params: compactParams(params),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل سجل حضورك");
  }
};

export const fetchStaffDirectory = async (params = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/staff`, {
      params: compactParams(params),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل قائمة الإداريين والمشرفين");
  }
};

export const fetchStaffAttendanceAdmin = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINT, {
      params: compactParams(params),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل سجل حضور الإداريين والمشرفين");
  }
};

export const fetchAbsentStaff = async (params = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/absent`, {
      params: compactParams(params),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل كشف الغياب");
  }
};

export const fetchStaffAttendanceSummary = async (params = {}) => {
  if (!params?.dateFrom || !params?.dateTo) {
    return {
      status: false,
      statusCode: 400,
      message: "يجب تحديد تاريخ البداية وتاريخ النهاية لعرض التقرير",
      data: null,
    };
  }

  try {
    const response = await api.get(`${ENDPOINT}/summary`, {
      params: compactParams(params),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل تقرير الحضور");
  }
};

export const createManualStaffAttendance = async ({
  staffId,
  date,
  checkInAt,
  checkOutAt,
  notes,
}) => {
  try {
    const payload = {
      staffId,
      date,
      checkInAt,
      ...(checkOutAt ? { checkOutAt } : {}),
      ...(notes !== undefined ? { notes: String(notes || "").trim() } : {}),
    };

    const response = await api.post(ENDPOINT, payload);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تسجيل الحضور اليدوي");
  }
};

export const updateStaffAttendance = async (id, data = {}) => {
  if (!id) {
    return {
      status: false,
      statusCode: 400,
      message: "معرّف سجل الحضور غير موجود",
      data: null,
    };
  }

  try {
    const payload = {
      ...(data?.checkInAt ? { checkInAt: data.checkInAt } : {}),
      ...(data?.checkOutAt ? { checkOutAt: data.checkOutAt } : {}),
      ...(data?.notes !== undefined
        ? { notes: String(data.notes || "").trim() }
        : {}),
    };

    const response = await api.patch(`${ENDPOINT}/${id}`, payload);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تعديل سجل الحضور");
  }
};

export const deleteStaffAttendance = async (id) => {
  if (!id) {
    return {
      status: false,
      statusCode: 400,
      message: "معرّف سجل الحضور غير موجود",
      data: null,
    };
  }

  try {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر حذف سجل الحضور");
  }
};



/* =========================================================
   Staff lateness reasons
========================================================= */

export const fetchPendingStaffLateReason = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/me/late-reason/pending`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر التحقق من تأخير اليوم");
  }
};

export const submitStaffLateReason = async ({ reason, date } = {}) => {
  const text = String(reason || "").trim();
  if (text.length < 3) {
    return {
      status: false,
      statusCode: 400,
      message: "يُرجى كتابة سبب التأخير (3 أحرف على الأقل)",
      data: null,
    };
  }

  try {
    const response = await api.post(`${ENDPOINT}/me/late-reason`, {
      reason: text.slice(0, 500),
      ...(date ? { date } : {}),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر إرسال سبب التأخير");
  }
};

export const fetchStaffLateReasons = async ({
  status = "pending",
  dateFrom,
  dateTo,
  staffId,
} = {}) => {
  const params = compactParams({
    status,
    dateFrom,
    dateTo,
    staffId,
  });

  try {
    // The deployed API currently rejects page/limit query parameters even
    // though it returns page/limit metadata in the response. Send only the
    // filters the live endpoint accepts to avoid a guaranteed 400 request.
    const response = await api.get(`${ENDPOINT}/late-reasons`, { params });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل أعذار تأخير الإداريين والمشرفين");
  }
};

export const reviewStaffLateReason = async (attendanceId, verdict, note) => {
  const id = String(attendanceId || "").trim();
  const reviewNote = String(note || "").trim();

  if (!id) {
    return { status: false, statusCode: 400, message: "سجل التأخير غير محدد", data: null };
  }

  if (!['accepted', 'rejected'].includes(verdict)) {
    return { status: false, statusCode: 400, message: "قرار المراجعة غير صحيح", data: null };
  }

  if (verdict === "rejected" && !reviewNote) {
    return { status: false, statusCode: 400, message: "اذكر سبب رفض العذر", data: null };
  }

  try {
    const response = await api.patch(`${ENDPOINT}/late-reasons/${id}/review`, {
      verdict,
      ...(reviewNote ? { note: reviewNote.slice(0, 500) } : {}),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر حفظ قرار مراجعة التأخير");
  }
};

/* =========================================================
   Staff leave requests
========================================================= */

export const createStaffLeaveRequest = async ({ date, leaveAt, reason, staffId } = {}) => {
  if (!date || !leaveAt) {
    return { status: false, statusCode: 400, message: "التاريخ ووقت الاستئذان مطلوبان", data: null };
  }

  try {
    const response = await api.post(`${ENDPOINT}/leave-requests`, {
      date,
      leaveAt: String(leaveAt).slice(0, 5),
      ...(String(reason || "").trim() ? { reason: String(reason).trim() } : {}),
      ...(staffId ? { staffId: normalizeRequestId(staffId) } : {}),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر إرسال طلب الاستئذان");
  }
};

export const fetchStaffLeaveRequests = async ({ status, date, from, to, staffId } = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/leave-requests`, {
      params: compactParams({
        status,
        date,
        from,
        to,
        staffId: staffId ? normalizeRequestId(staffId) : undefined,
      }),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل طلبات الاستئذان");
  }
};

export const reviewStaffLeaveRequest = async (id, { status, reviewNote } = {}) => {
  const requestId = normalizeRequestId(id);
  const note = String(reviewNote || "").trim();

  if (!requestId || !['approved', 'rejected'].includes(status)) {
    return { status: false, statusCode: 400, message: "معرّف الطلب والحالة مطلوبان", data: null };
  }

  if (status === "rejected" && !note) {
    return { status: false, statusCode: 400, message: "سبب الرفض مطلوب", data: null };
  }

  try {
    const response = await api.patch(`${ENDPOINT}/leave-requests/${requestId}/review`, {
      status,
      ...(note ? { reviewNote: note.slice(0, 500) } : {}),
    });
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر حفظ نتيجة مراجعة الاستئذان");
  }
};

export const deleteStaffLeaveRequest = async (id) => {
  const requestId = normalizeRequestId(id);
  if (!requestId) {
    return { status: false, statusCode: 400, message: "معرّف الطلب غير موجود", data: null };
  }

  try {
    const response = await api.delete(`${ENDPOINT}/leave-requests/${requestId}`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر سحب طلب الاستئذان");
  }
};

export default {
  fetchStaffAttendanceSettings,
  updateStaffAttendanceSettings,
  detectStaffAttendanceIp,
  checkInStaffAttendance,
  checkOutStaffAttendance,
  fetchMyStaffAttendance,
  fetchStaffDirectory,
  fetchStaffAttendanceAdmin,
  fetchAbsentStaff,
  fetchStaffAttendanceSummary,
  createManualStaffAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
  fetchPendingStaffLateReason,
  submitStaffLateReason,
  fetchStaffLateReasons,
  reviewStaffLateReason,
  createStaffLeaveRequest,
  fetchStaffLeaveRequests,
  reviewStaffLeaveRequest,
  deleteStaffLeaveRequest,
};
