import axios from "axios";

import {
  clearAuthSession,
  getAuthToken,
} from "@/shared/auth/session";

const API_BASE_URL = String(
  import.meta.env.VITE_API ||
    ""
)
  .trim()
  .replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API is not defined. Add it to your .env file."
  );
}

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/platform/auth/login",
  "/schools/register",
  "/students/request-password-setup",
  "/students/set-password",
];

const isPublicRequest = (
  url = ""
) =>
  PUBLIC_ENDPOINTS.some(
    (endpoint) =>
      url === endpoint ||
      url.endsWith(endpoint)
  );

/*
 * انتهاء الجلسة يحدث مرة واحدة، مهما كان عدد النداءات التي اكتشفته.
 *
 * صفحة كالداشبورد تطلق عدة نداءات متوازية. عند انتهاء الـ token يرجع كل
 * واحد منها 401، وكان كل واحد ينفّذ redirect بمفرده — فتومض الصفحة وتُعاد
 * تحميلها مرارًا. الحارس القديم كان يقارن المسار الحالي بمسار الدخول، وهو
 * لا يكفي: النداءات ترجع في نفس اللحظة، قبل أن يتغيّر المسار.
 */
let sessionExpiryHandled = false;

/*
 * إشارة إلغاء مشتركة. أول 401 يُلغي كل ما هو معلّق، فلا يصل أي نداء آخر
 * إلى الخادم ليعود بـ 401 ويعيد الدورة.
 */
let requestAbort = new AbortController();

/** يُستدعى بعد تسجيل دخول ناجح ليعمل ما بعده بشكل طبيعي. */
export const resetSessionGuard = () => {
  sessionExpiryHandled = false;
  requestAbort = new AbortController();
};

/** هل هناك خروج جارٍ الآن — تقرأه الشاشات لتتوقف عن الجلب. */
export const isSessionExpiring = () => sessionExpiryHandled;

export const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    headers: {
      Accept:
        "application/json",

      "Content-Type":
        "application/json",
    },

    timeout: 20000,
  });

api.interceptors.request.use(
  (config) => {
    /*
     * بعد اكتشاف انتهاء الجلسة لا يُرسل شيء جديد. أي نداء يبدأ في تلك
     * اللحظة — من useEffect يُعاد تشغيله أثناء الانتقال مثلًا — كان يعود
     * بـ 401 ويغذّي الدورة من جديد.
     */
    if (sessionExpiryHandled) {
      return Promise.reject(
        new axios.Cancel(
          "session-expired"
        )
      );
    }

    // إشارة مشتركة، ليُلغي أول 401 كل ما هو معلّق دفعة واحدة.
    config.signal =
      config.signal ||
      requestAbort.signal;

    const token =
      getAuthToken();

    config.headers =
      config.headers || {};

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers
        .Authorization;
    }

    if (
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    const requestUrl =
      error?.config?.url ||
      "";

    /*
     * الطلبات الملغاة ليست أخطاء يراها المستخدم — هي أثر جانبي للخروج
     * الذي بدأ بالفعل. تُمرَّر صامتة حتى لا تعرض الشاشات رسالة فشل وهي
     * في طريقها إلى صفحة الدخول.
     */
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      !isPublicRequest(
        requestUrl
      ) &&
      !sessionExpiryHandled
    ) {
      // يُرفع قبل أي شيء آخر: النداءات المتوازية تصل في نفس دورة الحدث،
      // وهذا السطر هو ما يجعل أوّلها فقط ينفّذ ما يلي.
      sessionExpiryHandled = true;

      clearAuthSession();

      // إلغاء ما تبقّى معلّقًا، فلا يرجع أي منها بـ 401 بعد قليل.
      requestAbort.abort();

      const loginPath =
        window.location.pathname.startsWith(
          "/platform"
        )
          ? "/platform/login"
          : "/login";

      if (
        window.location.pathname !==
        loginPath
      ) {
        /*
         * replace وليس assign: الصفحة المنتهية جلستها لا تستحق موضعًا في
         * سجل التصفح، وإلا أعاد زر الرجوع المستخدم إليها لتفشل ثانية.
         */
        window.location.replace(
          loginPath
        );
      }
    }

    /*
     * 403 لا يمسح الجلسة.
     * معناه أن المستخدم مسجل،
     * لكنه لا يملك الصلاحية أو
     * سياق المدرسة المطلوب.
     */

    return Promise.reject(
      error
    );
  }
);

export {
  API_BASE_URL,
  PUBLIC_ENDPOINTS,
};

export default api;
