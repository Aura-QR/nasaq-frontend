import { Assignment, CalendarToday, InsertDriveFile, Star, HourglassEmpty, CheckCircle, Error, ChevronLeft } from "@mui/icons-material";
import { Subject } from "@mui/icons-material";

const STATUS_CONFIG = {
  pending: {
    label: "متاح للتسليم",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
    strip: "#f59e0b",
    Icon: HourglassEmpty,
  },
  overdue: {
    label: "منتهي",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
    strip: "#ef4444",
    Icon: Error,
  },
  submitted: {
    label: "بانتظار التصحيح",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-400",
    strip: "#318dce",
    Icon: HourglassEmpty,
  },
  graded: {
    label: "تم التصحيح",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
    strip: "#10b981",
    Icon: CheckCircle,
  },
};

const ProjectCard = ({ item, onAction, loadingSubmission }) => {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

  return (
    <div
      onClick={onAction}
      className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Color strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: cfg.strip }} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: "#EEF5FF" }}
            >
              <Assignment className="text-lg" style={{ color: "#318dce" }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1E293B] leading-snug line-clamp-2">
                {item.title}
              </h3>
              <span
                className="inline-flex items-center gap-1 mt-1 text-xs font-semibold"
                style={{ color: "#318dce" }}
              >
                <Subject className="text-sm" />
                {item.subject}
              </span>
            </div>
          </div>

          {/* Status badge */}
          {loadingSubmission ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-400 whitespace-nowrap flex-shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              جارٍ التحقق
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Due date */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarToday className="text-sm" style={{ color: "#318dce" }} />
          <span>
            <span className="font-semibold text-gray-600">موعد التسليم: </span>
            {item.endDate}
          </span>
        </div>

        {/* Grade display — only when graded */}
        {item.status === "graded" && item.achievedGrade !== null && item.achievedGrade !== undefined ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
            <Star className="text-sm text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
              درجتك:{" "}
              <span className="text-base font-black">{item.achievedGrade}</span>
              {item.maxGrade != null && (
                <span className="text-emerald-500 font-bold"> / {item.maxGrade}</span>
              )}
            </span>
          </div>
        ) : (
          /* Files chip */
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
            <InsertDriveFile className="text-sm text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">{item.filesLabel}</span>
          </div>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className="mt-auto w-full flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: cfg.strip }}
        >
          {item.status === "graded" ? "عرض النتيجة" : item.status === "submitted" ? "عرض التسليم" : "تسليم المشروع"}
          <ChevronLeft className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
