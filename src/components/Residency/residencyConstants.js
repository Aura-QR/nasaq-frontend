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
