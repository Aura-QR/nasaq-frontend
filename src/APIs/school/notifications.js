import { api } from "../Axios";

const ENDPOINT = "/notifications";

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
  message: error?.response?.data?.message || error?.message || fallback,
});

/** ما يتعرضش للمستخدم — نستخدمه لبناء النص بالعربي من النوع والبيانات. */
export const NOTIFICATION_ICONS = {
  leave_approved: "check",
  leave_rejected: "close",
  cover_assigned: "person",
  cover_removed: "undo",
};

export const NOTIFICATION_COLORS = {
  leave_approved: "success",
  leave_rejected: "error",
  cover_assigned: "info",
  cover_removed: "warning",
};

/**
 * GET /notifications
 *
 * الرد بيرجّع العدد غير المقروء جوّه نفس الطلب، فالبادج مش محتاج نداء تاني
 * لما اللستة تكون مفتوحة.
 */
export const fetchNotifications = async ({ unreadOnly, limit } = {}) => {
  try {
    const response = await api.get(ENDPOINT, {
      params: {
        ...(unreadOnly ? { unreadOnly: true } : {}),
        ...(limit ? { limit } : {}),
      },
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل الإشعارات");
  }
};

/** GET /notifications/unread-count — رخيص بما يكفي للاستطلاع الدوري. */
export const fetchUnreadCount = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/unread-count`);
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل عدد الإشعارات");
  }
};

export const markNotificationRead = async (id) => {
  try {
    const response = await api.patch(`${ENDPOINT}/${id}/read`);
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحديث الإشعار");
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.patch(`${ENDPOINT}/read-all`);
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحديث الإشعارات");
  }
};

/**
 * GET /duty/my-day
 *
 * حصص المدرس وحصص الاحتياطي على نفس الخط. الحصص اللي الاستئذان بيعفيه منها
 * بتيجي متعلّمة `excusedByLeave` مش محذوفة — إخفاؤها هو اللي بيخلي حد يروح
 * لحصة هو أصلًا مستأذن منها.
 */
export const fetchMyDay = async (date) => {
  try {
    const response = await api.get("/duty/my-day", {
      params: date ? { date } : {},
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل يومك");
  }
};

export default {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  fetchMyDay,
};
