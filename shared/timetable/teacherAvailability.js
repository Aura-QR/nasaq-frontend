/*
 * متى لا يجوز جدولة المعلم.
 *
 * مولّد الجدول يقرأ هذه القيود ويعاملها قواعد لا تفضيلات: الخانة المحجوبة
 * لا تُعرض عليه أبدًا مهما كانت مناسبة.
 *
 * الشكل المخزَّن `{ [day]: number[] }`، والمصفوفة الفارغة تعني اليوم كله.
 * وهذا التمييز هو كل شيء: «غائب» ليس «موجود وفارغ». الأول يوم متاح والثاني
 * يوم محجوب بالكامل، ولو اختُزلا في حالة واحدة لتعذّر التعبير عن معلم يداوم
 * يومين في الأسبوع.
 *
 * منفصلة عن الشاشة لأن هذا هو الجزء الذي يخطئ بصمت: قيد ضائع لا يُرى في
 * الواجهة، يُرى بعد أسابيع في جدول معلم على يوم لا يداوم فيه.
 */

export const WEEKDAY_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** حالات اليوم الثلاث: متاح، أو محجوب بالكامل، أو بعض حصصه. */
export const dayStateOf = (blocks, day) => {
  const block = blocks?.[day];
  if (block === undefined) return "open";
  return block.length === 0 ? "all" : "some";
};

/** ينقل اليوم بين «متاح» و«محجوب بالكامل». */
export const toggleWholeDay = (blocks, day) => {
  const next = { ...(blocks ?? {}) };

  if (next[day] !== undefined) delete next[day];
  else next[day] = [];

  return next;
};

/**
 * يقلب حصة واحدة.
 *
 * نقر حصة في يوم محجوب بالكامل يعني «افتح اليوم إلا هذه الحصة» — وهي
 * الطريقة الوحيدة للخروج من الحجب الكامل إلى حجب جزئي دون إتاحة اليوم
 * كله أولًا ثم إعادة حجب ست حصص واحدة واحدة.
 *
 * وإفراغ آخر حصة محجوبة يحذف اليوم بدلًا من تركه مصفوفة فارغة، وإلا
 * لانقلب «لم يعد محجوبًا» إلى «محجوب بالكامل» بنقرة واحدة.
 */
export const toggleSlot = (blocks, day, slot) => {
  const next = { ...(blocks ?? {}) };
  const existing = next[day];

  if (existing !== undefined && existing.length === 0) {
    next[day] = [slot];
    return next;
  }

  const slots = new Set(existing ?? []);
  if (slots.has(slot)) slots.delete(slot);
  else slots.add(slot);

  if (slots.size === 0) delete next[day];
  else next[day] = [...slots].sort((first, second) => first - second);

  return next;
};

/** هل هذه الخانة محجوبة على المعلم؟ اليوم المحجوب بالكامل يحجب كل حصصه. */
export const isSlotBlocked = (blocks, day, slot) => {
  const block = blocks?.[day];
  if (block === undefined) return false;
  return block.length === 0 || block.includes(slot);
};

/** الشكل الذي يقبله الخادم في `unavailable`. */
export const toUnavailable = (blocks) =>
  WEEKDAY_ORDER.filter((day) => blocks?.[day] !== undefined).map((day) => ({
    day,
    slots: blocks[day],
  }));

/** العكس: ما يعيده الخادم إلى الشكل الذي تحرّره الشاشة. */
export const fromUnavailable = (unavailable) => {
  const blocks = {};

  for (const block of Array.isArray(unavailable) ? unavailable : []) {
    const day = String(block?.day || "").trim().toLowerCase();
    if (!day) continue;

    blocks[day] = Array.isArray(block?.slots)
      ? [...new Set(block.slots.map(Number).filter(Number.isInteger))].sort(
          (first, second) => first - second
        )
      : [];
  }

  return blocks;
};
