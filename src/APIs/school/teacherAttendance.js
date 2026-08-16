import { api } from "../Axios";

const ENDPOINT = "/teacher-attendance";

const SCHOOL_SETTINGS_ENDPOINT = "/schools/me/settings";

const getErrorResult = (error, fallbackMessage = "حدث خطأ ما") => ({
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
  // مهم جدًا: duplicate self check-in يرجع record موجود داخل data مع 409.
  data: error?.response?.data?.data ?? null,
  error,
});


export const fetchTeacherAttendanceSettings = async () => {
  try {
    const response = await api.get(SCHOOL_SETTINGS_ENDPOINT);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل إعدادات حضور المعلمين");
  }
};

export const updateTeacherAttendanceSettings = async (data = {}) => {
  try {
    const payload = {
      teacherCheckInEnabled: Boolean(data?.teacherCheckInEnabled),
      checkInRadiusMeters: Number(data?.checkInRadiusMeters),
      schoolNetworkIps: Array.isArray(data?.schoolNetworkIps)
        ? data.schoolNetworkIps.filter(Boolean)
        : [],
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
    };

    const response = await api.patch(SCHOOL_SETTINGS_ENDPOINT, payload);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر حفظ إعدادات حضور المعلمين");
  }
};

export const detectTeacherAttendanceIp = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/detect-ip`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر اكتشاف عنوان الشبكة الحالي");
  }
};

export const checkInTeacherAttendance = async ({ lat, lng }) => {
  try {
    // لا نرسل checkInAt هنا نهائيًا؛ السيرفر هو الذي يسجل الوقت.
    const response = await api.post(`${ENDPOINT}/check-in`, {
      lat,
      lng,
    });

    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تسجيل حضورك");
  }
};

export const fetchMyTeacherAttendance = async (params = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/me`, {
      params,
    });

    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل سجل حضورك");
  }
};

export const fetchTeacherAttendanceAdmin = async (params = {}) => {
  try {
    const response = await api.get(ENDPOINT, {
      params,
    });

    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل سجل حضور المعلمين");
  }
};

export const fetchAbsentTeachers = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/absent`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل قائمة المعلمين غير المسجلين");
  }
};

export const createManualTeacherAttendance = async ({
  teacherId,
  date,
  checkInAt,
  notes,
}) => {
  try {
    const payload = {
      teacherId,
      date,
      checkInAt,
      ...(String(notes || "").trim()
        ? { notes: String(notes).trim() }
        : {}),
    };

    const response = await api.post(ENDPOINT, payload);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تسجيل الحضور اليدوي");
  }
};

export const updateTeacherAttendance = async (id, data) => {
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

export const deleteTeacherAttendance = async (id) => {
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

export default {
  fetchTeacherAttendanceSettings,
  updateTeacherAttendanceSettings,
  detectTeacherAttendanceIp,
  checkInTeacherAttendance,
  fetchMyTeacherAttendance,
  fetchTeacherAttendanceAdmin,
  fetchAbsentTeachers,
  createManualTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};
