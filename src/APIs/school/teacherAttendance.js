import { api } from "../Axios";

const ENDPOINT = "/teacher-attendance";
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
  // مهم جدًا: 409 في check-in/check-out يرجع بيانات السجل الحالي داخل data.
  data: error?.response?.data?.data ?? null,
  error,
});

/* =========================================================
   School / Teacher Attendance Settings
========================================================= */

export const fetchTeacherAttendanceSettings = async () => {
  try {
    const response = await api.get(SCHOOL_SETTINGS_ENDPOINT);
    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل إعدادات حضور المعلمين"
    );
  }
};

export const updateTeacherAttendanceSettings = async (
  data = {}
) => {
  try {
    const payload = {
      teacherCheckInEnabled: Boolean(
        data?.teacherCheckInEnabled
      ),

      checkInRadiusMeters: Number(
        data?.checkInRadiusMeters
      ),

      schoolNetworkIps: Array.isArray(
        data?.schoolNetworkIps
      )
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

      // workSchedule يستبدل الجدول بالكامل في الباك،
      // لذلك الصفحة ترسل الأيام السبعة كاملة عند الحفظ.
      ...(Object.prototype.hasOwnProperty.call(
        data,
        "workSchedule"
      )
        ? {
            workSchedule: Array.isArray(data.workSchedule)
              ? data.workSchedule.map((item) => {
                  const isWorkingDay = Boolean(
                    item?.isWorkingDay
                  );

                  return {
                    day: String(item?.day || "")
                      .trim()
                      .toLowerCase(),
                    isWorkingDay,
                    startTime:
                      isWorkingDay && item?.startTime
                        ? String(item.startTime).slice(0, 5)
                        : null,
                    endTime:
                      isWorkingDay && item?.endTime
                        ? String(item.endTime).slice(0, 5)
                        : null,
                  };
                })
              : [],
          }
        : {}),
    };

    const response = await api.patch(
      SCHOOL_SETTINGS_ENDPOINT,
      payload
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر حفظ إعدادات حضور المعلمين"
    );
  }
};

/* =========================================================
   Detect IP
========================================================= */

export const detectTeacherAttendanceIp = async () => {
  try {
    const response = await api.get(
      `${ENDPOINT}/detect-ip`
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر اكتشاف عنوان الشبكة الحالي"
    );
  }
};

/* =========================================================
   Teacher Self Check-in
========================================================= */

export const checkInTeacherAttendance = async ({
  lat,
  lng,
  mockLocationSuspected,
}) => {
  try {
    // لا نرسل checkInAt؛ السيرفر هو الذي يسجل الوقت.
    const response = await api.post(
      `${ENDPOINT}/check-in`,
      {
        lat,
        lng,
        ...(mockLocationSuspected !== undefined
          ? {
              mockLocationSuspected: Boolean(
                mockLocationSuspected
              ),
            }
          : {}),
      }
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تسجيل حضورك"
    );
  }
};

/* =========================================================
   Teacher Self Check-out
========================================================= */

export const checkOutTeacherAttendance = async ({
  lat,
  lng,
  mockLocationSuspected,
}) => {
  try {
    // نفس تحقق الموقع والشبكة المستخدم في check-in.
    // لا نرسل checkOutAt؛ السيرفر هو الذي يسجل الوقت.
    const response = await api.post(
      `${ENDPOINT}/check-out`,
      {
        lat,
        lng,
        ...(mockLocationSuspected !== undefined
          ? {
              mockLocationSuspected: Boolean(
                mockLocationSuspected
              ),
            }
          : {}),
      }
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تسجيل انصرافك"
    );
  }
};

/* =========================================================
   My Attendance
========================================================= */

export const fetchMyTeacherAttendance = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/me`,
      { params }
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل سجل حضورك"
    );
  }
};

/* =========================================================
   Admin Attendance List
========================================================= */

export const fetchTeacherAttendanceAdmin = async (
  params = {}
) => {
  try {
    const response = await api.get(ENDPOINT, {
      params,
    });

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل سجل حضور المعلمين"
    );
  }
};

/* =========================================================
   Absent Teachers
========================================================= */

export const fetchAbsentTeachers = async () => {
  try {
    const response = await api.get(
      `${ENDPOINT}/absent`
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل قائمة المعلمين غير المسجلين"
    );
  }
};

/* =========================================================
   Manual Attendance
========================================================= */

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

    const response = await api.post(
      ENDPOINT,
      payload
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تسجيل الحضور اليدوي"
    );
  }
};

/* =========================================================
   Update Attendance
========================================================= */

export const updateTeacherAttendance = async (
  id,
  data
) => {
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
      ...(data?.checkInAt
        ? { checkInAt: data.checkInAt }
        : {}),

      ...(data?.checkOutAt
        ? { checkOutAt: data.checkOutAt }
        : {}),

      ...(data?.notes !== undefined
        ? {
            notes: String(
              data.notes || ""
            ).trim(),
          }
        : {}),
    };

    const response = await api.patch(
      `${ENDPOINT}/${id}`,
      payload
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تعديل سجل الحضور"
    );
  }
};

/* =========================================================
   Teacher Attendance Summary
========================================================= */

export const fetchTeacherAttendanceSummary = async ({
  dateFrom,
  dateTo,
  teacherId,
} = {}) => {
  if (!dateFrom || !dateTo) {
    return {
      status: false,
      statusCode: 400,
      message:
        "يجب تحديد تاريخ البداية وتاريخ النهاية لعرض التقرير",
      data: null,
    };
  }

  try {
    const params = {
      dateFrom,
      dateTo,
      ...(teacherId ? { teacherId } : {}),
    };

    const response = await api.get(
      `${ENDPOINT}/summary`,
      { params }
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر تحميل تقرير حضور المعلمين"
    );
  }
};

/* =========================================================
   Delete Attendance
========================================================= */

export const deleteTeacherAttendance = async (
  id
) => {
  if (!id) {
    return {
      status: false,
      statusCode: 400,
      message: "معرّف سجل الحضور غير موجود",
      data: null,
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return getErrorResult(
      error,
      "تعذر حذف سجل الحضور"
    );
  }
};

/* =========================================================
   Default Export
========================================================= */

export default {
  fetchTeacherAttendanceSettings,
  updateTeacherAttendanceSettings,
  detectTeacherAttendanceIp,
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  fetchMyTeacherAttendance,
  fetchTeacherAttendanceAdmin,
  fetchAbsentTeachers,
  createManualTeacherAttendance,
  updateTeacherAttendance,
  fetchTeacherAttendanceSummary,
  deleteTeacherAttendance,
};
