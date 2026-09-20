/*
 * موضع المادة المفضَّل في اليوم.
 *
 * المولّد يزن هذا الحقل منذ كُتب — المادة المعلَّمة «أول اليوم» تُسحب إلى
 * بداية اليوم بثلاثة أضعاف الميل الافتراضي — غير أنه لم تكن هناك وسيلة
 * لضبطه، فظلت كل مادة في كل مدرسة على «عادي». وجدول يضع التربية الفنية أول
 * اليوم واللغة العربية آخره جدول صحيح وعديم الفائدة.
 *
 * ترجيح لا قاعدة: مادة أساسية لم يتسع لها الصباح تُجدول متأخرة بدلًا من ألا
 * تُجدول، فلا يمكن لهذا الاختيار أن يجعل جدولًا مستحيلًا.
 */

export const SLOT_PREFERENCES = [
  {
    value: "early",
    label: "أول اليوم",
    hint: "للمواد الأساسية — تُسحب إلى حصص الصباح",
    color: "#18865d",
    background: "#eaf7f1",
  },
  {
    value: "any",
    label: "عادي",
    hint: "بلا تفضيل — يوزّعها المولّد حسب المتاح",
    color: "#54606c",
    background: "#f1f3f5",
  },
  {
    value: "late",
    label: "آخر اليوم",
    hint: "للأنشطة كالتربية الفنية والبدنية",
    color: "#9a6a1e",
    background: "var(--color-gold-soft, #fbf0d8)",
  },
];

export const PREFERENCE_VALUES = SLOT_PREFERENCES.map((item) => item.value);

/** القيمة المخزَّنة أو «عادي». سجل قديم لا يحمل الحقل ليس خطأً. */
export const normalizePreference = (value) => {
  const preference = String(value ?? "").trim();
  return PREFERENCE_VALUES.includes(preference) ? preference : "any";
};

export const preferenceMeta = (value) =>
  SLOT_PREFERENCES.find(
    (item) => item.value === normalizePreference(value)
  ) ?? SLOT_PREFERENCES[1];

/**
 * هل تغيّر شيء في هذا الصف؟
 *
 * العدد والتفضيل يُحفظان معًا، فصف تغيّر فيه التفضيل وحده يجب أن يُرسل —
 * وإلا ضاع الاختيار بصمت عند الحفظ، وهو أسوأ من رفضه.
 */
export const planRowChanged = (row, draftPeriods, draftPreference) => {
  if (draftPeriods === "" || draftPeriods === undefined) return false;

  const periodsChanged =
    Number(draftPeriods) !== Number(row?.periodsPerWeek || 0);

  const preferenceChanged =
    normalizePreference(draftPreference) !==
    normalizePreference(row?.slotPreference);

  return periodsChanged || preferenceChanged;
};
