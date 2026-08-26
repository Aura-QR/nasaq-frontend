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

  // مهم جدًا:
  // duplicate self check-in يرجع record موجود داخل data مع 409.
  data: error?.response?.data?.data ?? null,
  error,
});

/* =========================================================
   School / Teacher Attendance Settings
========================================================= */

export const fetchTeacherAttendanceSettings = async () => {
  try {
    const response = await api.get(
      SCHOOL_SETTINGS_ENDPOINT
    );

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
      Number.isFinite(
        Number(data.location.lat)
      ) &&
      Number.isFinite(
        Number(data.location.lng)
      )
        ? {
            location: {
              lat: Number(data.location.lat),
              lng: Number(data.location.lng),
            },
          }
        : {}),

      /*
       * وقت بداية دوام المعلمين.
       *
       * "07:30" => قياس التأخير يبدأ من 07:30
       * null    => إيقاف قياس التأخير
       *
       * لا نضيفه للـ payload إلا لو الشاشة
       * أرسلته فعلًا، حتى لا نغير الإعداد بدون قصد.
       */
      ...(Object.prototype.hasOwnProperty.call(
        data,
        "workStartTime"
      )
        ? {
            workStartTime:
              data.workStartTime === "" ||
              data.workStartTime === null
                ? null
                : data.workStartTime,
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
    // لا نرسل checkInAt هنا نهائيًا؛
    // السيرفر هو الذي يسجل الوقت.
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
   My Attendance
========================================================= */

export const fetchMyTeacherAttendance = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/me`,
      {
        params,
      }
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
        ? {
            notes: String(notes).trim(),
          }
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
      /*
       * يقبل:
       * "07:45"
       * أو ISO Date String
       */
      ...(data?.checkInAt
        ? {
            checkInAt: data.checkInAt,
          }
        : {}),

      /*
       * NEW
       *
       * يقبل:
       * "14:00"
       * أو ISO Date String
       *
       * لو checkOutAt أقدم من checkInAt
       * الباك سيرجع 400 ورسالة الخطأ ستصل للـ UI
       * عن طريق getErrorResult.
       */
      ...(data?.checkOutAt
        ? {
            checkOutAt: data.checkOutAt,
          }
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
  /*
   * الباك يشترط dateFrom و dateTo.
   * نمنع الطلب من الفرونت أصلًا لو ناقصين.
   */
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

      ...(teacherId
        ? {
            teacherId,
          }
        : {}),
    };

    const response = await api.get(
      `${ENDPOINT}/summary`,
      {
        params,
      }
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
  fetchMyTeacherAttendance,
  fetchTeacherAttendanceAdmin,
  fetchAbsentTeachers,
  createManualTeacherAttendance,
  updateTeacherAttendance,

  // NEW
  fetchTeacherAttendanceSummary,

  deleteTeacherAttendance,
};