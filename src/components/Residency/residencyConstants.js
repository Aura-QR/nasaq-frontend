export const RESIDENCY_TYPES = [
  { value: "iqama", label: "إقامة" },
  { value: "visit_visa", label: "تأشيرة زيارة" },
  { value: "passport", label: "جواز سفر" },
  { value: "other", label: "أخرى" },
];

export const STATUS_META = {
  pending: { label: "قيد المراجعة", color: "warning" },
  approved: { label: "مقبولة", color: "success" },
  rejected: { label: "مرفوضة", color: "error" },
};

export const formatDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-SA-u-ca-gregory", { year: "numeric", month: "long", day: "numeric" });
};

export const RESIDENCY_EMPTY = { type: "iqama", otherTypeLabel: "", documentNumber: "", issueDate: "", expiryDate: "" };

/** سبب منع الرفع، أو سلسلة فارغة إن كانت البيانات صالحة. */
export const residencyProblem = (values, files) => {
  if (!files?.length) return "يرجى إرفاق صورة الوثيقة";
  if (values.type === "other" && !values.otherTypeLabel.trim()) return "يرجى كتابة اسم الوثيقة";
  if (values.issueDate && values.expiryDate && values.expiryDate <= values.issueDate) {
    return "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار";
  }
  return "";
};

/** هل أدخل المستخدم شيئًا في حقول الوثيقة؟ */
export const residencyTouched = (values, files) =>
  Boolean(files?.length || values.documentNumber?.trim() || values.issueDate || values.expiryDate || values.otherTypeLabel?.trim());
