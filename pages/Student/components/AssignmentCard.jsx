import STATUS_CONFIG from "@/utils/constants/STATUS_CONFIG";
import { Assignment, Event, Subject, CalendarToday } from "@mui/icons-material";


const AssignmentCard = ({ item, actionLabel, onAction, actionDisabled = false }) => {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const disabledActionLabel = {
    completed: "تم الإكمال",
    overdue: "منتهي",
    upcoming: "لم يبدأ بعد",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      {/* Color accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: "#318dce" }} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#EEF5FF" }}>
              <Assignment className="text-lg" style={{ color: "#318dce" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] leading-snug line-clamp-2">
                {item.title}
              </h3>
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: "#318dce" }}>
                <Subject className="text-sm" />
                {item.subject}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Dates */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CalendarToday className="text-sm" style={{ color: "#318dce" }} />
            <span><span className="font-semibold text-gray-600">يبدأ في:</span> {item.startDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Event className="text-sm" style={{ color: "#318dce" }} />
            <span><span className="font-semibold text-gray-600">ينتهي في:</span> {item.endDate}</span>
          </div>
        </div>

        {/* Duration chip */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-gray-400">المدة</span>
          <span className="text-xs font-bold text-[#1E293B] bg-gray-100 px-3 py-1 rounded-full">
            {item.duration}
          </span>
        </div>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className={`w-full mt-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
              actionDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "text-white shadow-sm hover:opacity-95"
            }`}
            style={!actionDisabled ? { backgroundColor: "#318dce" } : undefined}
          >
            {actionDisabled
              ? disabledActionLabel[item.status] || "غير متاح حالياً"
              : actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AssignmentCard;