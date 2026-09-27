import axios from "axios";

const getApiError = (
  error,
  fallbackMessage =
    "حدث خطأ ما"
) => {
  /*
   * الطلب المُلغى ليس فشلًا يراه المستخدم.
   *
   * عند انتهاء الجلسة يُلغي المعترض كل النداءات المعلّقة دفعة واحدة، فترجع
   * كلها إلى هنا. بدون هذا الفحص كانت كل شاشة تعرض رسالة خطأ في اللحظة
   * التي ينتقل فيها المستخدم إلى صفحة الدخول — عدة رسائل عن مشكلة واحدة،
   * لا يستطيع فعل شيء حيالها.
   *
   * silent يخبر المستدعي أن يتجاهلها بدل عرضها.
   */
  if (axios.isCancel?.(error)) {
    return {
      status: false,
      silent: true,
      message: "",
    };
  }

  const responseData =
    error?.response?.data;

  const rawMessage =
    responseData?.message ||
    responseData?.error ||
    error?.message;

  let message =
    fallbackMessage;

  if (
    Array.isArray(
      rawMessage
    )
  ) {
    message =
      rawMessage.join("، ");
  } else if (
    typeof rawMessage ===
      "string" &&
    rawMessage.trim()
  ) {
    message =
      rawMessage.trim();
  } else if (
    rawMessage &&
    typeof rawMessage ===
      "object"
  ) {
    message =
      rawMessage.message ||
      fallbackMessage;
  }

  return {
    status: false,

    /*
     * 401 يعني أن الخروج جارٍ بالفعل. الشاشة على وشك أن تُستبدل بصفحة
     * الدخول، فرسالة "غير مصرح" لا تضيف شيئًا.
     */
    silent:
      error?.response?.status ===
      401,

    message,

    statusCode:
      error?.response?.status ||
      responseData?.statusCode,

    errors:
      responseData?.errors,

    raw:
      responseData,
  };
};

export default getApiError;
export {
  getApiError,
};
