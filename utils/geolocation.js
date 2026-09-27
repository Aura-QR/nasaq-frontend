/**
 * One place to ask the browser where the device is.
 *
 * getCurrentPosition's own `timeout` does not cover the permission prompt. The
 * spec starts that clock only once permission has been granted, so a prompt
 * the teacher never answers — or one the browser suppresses because the site
 * was blocked at some earlier visit — leaves both callbacks unfired. The
 * promise never settles, the caller's `finally` never runs, and the button
 * reads "جارِ تسجيل الحضور" until the page is reloaded: nothing to tap,
 * nothing to read, no way to tell whether it is working. A teacher on an old
 * phone reported exactly that.
 *
 * Three screens asked the browser this question and all three could hang, so
 * the answer lives here: put a clock on the whole request, and settle exactly
 * once whichever way it goes.
 */

/**
 * Longer than the browser's own timeout, because this one has to cover the
 * permission prompt as well — and someone reading that prompt for the first
 * time takes a few seconds.
 */
export const LOCATION_TIMEOUT_MS = 20000;

export const LOCATION_BLOCKED_MESSAGE =
  "صلاحية الموقع مرفوضة لهذا الموقع. افتح إعدادات المتصفح ← أذونات الموقع ← اسمح بالوصول، ثم أعد المحاولة.";

export const LOCATION_UNANSWERED_MESSAGE =
  "لم يستجب المتصفح لطلب الموقع. تأكد من تفعيل خدمة الموقع والسماح للمتصفح بالوصول إليها، ثم أعد المحاولة.";

const MESSAGE_BY_CODE = {
  1: LOCATION_BLOCKED_MESSAGE,
  2: "تعذر تحديد موقعك الحالي. تأكد أن خدمة الموقع (GPS) مفعّلة في إعدادات الجهاز.",
  3: "انتهت مهلة تحديد الموقع. اخرج إلى مكان مكشوف أو أعد المحاولة.",
};

/** Only ever thrown to jump out of the permission probe. */
class PermissionDenied extends Error {}

/**
 * Resolves with `{ lat, lng }`, or rejects with an Error whose message is
 * ready to show. It always does one or the other.
 */
export const requestBrowserLocation = async () => {
  if (!navigator.geolocation) {
    throw new Error("المتصفح لا يدعم تحديد الموقع الجغرافي");
  }

  /*
   * Where the Permissions API exists, a standing "block" is knowable before we
   * ask — and asking anyway is precisely the case that hangs, because the
   * browser answers a suppressed prompt with silence.
   */
  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });

      if (status?.state === "denied") {
        throw new PermissionDenied();
      }
    } catch (permissionError) {
      if (permissionError instanceof PermissionDenied) {
        throw new Error(LOCATION_BLOCKED_MESSAGE);
      }
      // Older browsers do not implement it for geolocation. Just ask.
    }
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const settle = (act) => (value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      act(value);
    };

    const succeed = settle(({ coords }) =>
      resolve({
        lat: coords.latitude,
        lng: coords.longitude,
      })
    );

    const fail = settle((locationError) =>
      reject(
        new Error(
          MESSAGE_BY_CODE[locationError?.code] ||
            "تعذر الوصول إلى موقعك الحالي"
        )
      )
    );

    const giveUp = settle(() =>
      reject(new Error(LOCATION_UNANSWERED_MESSAGE))
    );

    timer = setTimeout(giveUp, LOCATION_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(succeed, fail, {
      enableHighAccuracy: true,
      timeout: LOCATION_TIMEOUT_MS,
      maximumAge: 0,
    });
  });
};

export default requestBrowserLocation;
