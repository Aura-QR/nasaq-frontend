/**
 * Voiding a payment recorded by mistake — `paymentVoidRules.js` with the
 * signed-in user filled in.
 *
 * A void is not a refund. A refund is money that changed hands and went back;
 * a void says it never changed hands. The entry stays in the history, marked.
 */
import {
  getAuthToken,
  getStoredRole,
  getStoredUser,
} from "@/shared/auth/session";

import {
  DEFAULT_SCHOOL_TIMEZONE,
  canVoidPaymentFor,
  isRefundEvent,
  isVoidedPayment,
} from "./paymentVoidRules";

export {
  DEFAULT_SCHOOL_TIMEZONE,
  dayIn,
  isRefundEvent,
  isVoidedPayment,
  lastEffectivePaymentDate,
} from "./paymentVoidRules";

/**
 * The signed-in user's id as the server knows it. `recordedBy` on a payment is
 * the JWT's `sub`, so that is what is compared; the stored user is a fallback.
 */
export const getSessionUserId = () => {
  try {
    const payload = getAuthToken().split(".")[1];
    if (payload) {
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (json?.sub) return String(json.sub);
    }
  } catch {
    // fall through to the stored user
  }
  const user = getStoredUser();
  return String(user?.id || user?._id || "");
};

export const canVoidPayment = (event, options = {}) =>
  canVoidPaymentFor(event, {
    userId: getSessionUserId(),
    role: getStoredRole(),
    timezone: DEFAULT_SCHOOL_TIMEZONE,
    ...options,
  });

/** Why the button is disabled — a tooltip instead of a silent absence. */
export const voidUnavailableReason = (event, options = {}) => {
  if (!event || isRefundEvent(event) || isVoidedPayment(event)) return "";
  if (canVoidPayment(event, options)) return "";
  return "الإلغاء متاح لمن سجّل الدفعة في نفس اليوم، أو لمالك المدرسة.";
};
