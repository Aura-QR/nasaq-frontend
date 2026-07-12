import { CheckCircle, Error, HourglassEmpty, Schedule } from "@mui/icons-material";

const STATUS_CONFIG = {
  pending: {
    label: "متاح الآن",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
    icon: HourglassEmpty,
  },
  completed: {
    label: "مكتمل",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
    icon: CheckCircle,
  },
  overdue: {
    label: "منتهي",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
    icon: Error,
  },
  upcoming: {
    label: "لم يبدأ بعد",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-400",
    icon: Schedule,
  },
};

export default STATUS_CONFIG;