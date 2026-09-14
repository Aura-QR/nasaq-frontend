/**
 * The rules for voiding a payment, with nothing browser-specific in them so
 * they can be tested on their own. `paymentVoid.js` supplies the signed-in
 * user. The server enforces the same rules and is the authority.
 */
export const DEFAULT_SCHOOL_TIMEZONE = "Asia/Riyadh";

export const isVoidedPayment = (event) => Boolean(event?.voidedAt);

export const isRefundEvent = (event) =>
  String(event?.type || "").toLowerCase() === "refund";

/** The calendar date of `date` in `timezone`, as YYYY-MM-DD. */
export const dayIn = (date, timezone = DEFAULT_SCHOOL_TIMEZONE) => {
  const format = (tz) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  try {
    return format(timezone || DEFAULT_SCHOOL_TIMEZONE);
  } catch {
    // An unrecognised timezone must not change who is allowed.
    return format(DEFAULT_SCHOOL_TIMEZONE);
  }
};

/**
 * - the owner may void any payment, at any time;
 * - whoever recorded it may void it on the same calendar day in the school's
 *   timezone;
 * - refunds and already-voided entries are never voidable;
 * - an entry with no `recordedAt` (recorded before it was tracked) is the
 *   owner's alone.
 */
export const canVoidPaymentFor = (
  event,
  { userId, role, timezone = DEFAULT_SCHOOL_TIMEZONE, now = new Date() } = {}
) => {
  if (!event || isRefundEvent(event) || isVoidedPayment(event)) return false;
  if (String(role || "").toUpperCase() === "OWNER") return true;
  if (!event.recordedAt || !userId) return false;
  if (String(event.recordedBy || "") !== String(userId)) return false;
  return dayIn(event.recordedAt, timezone) === dayIn(now, timezone);
};

/**
 * The date of the most recent payment that still counts. A voided entry is
 * kept in the array but never happened, so it is not the "last payment".
 */
export const lastEffectivePaymentDate = (payments) => {
  const list = Array.isArray(payments) ? payments : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (!isVoidedPayment(list[i])) return list[i]?.paidAt || null;
  }
  return null;
};
