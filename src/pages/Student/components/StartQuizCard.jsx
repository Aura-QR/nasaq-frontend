import { AccessTime } from "@mui/icons-material";

const StartQuizCard = ({
  examId,
  durationMinutes,
  totalQuestions,
  onStart,
  onCancel,
  isStarting = false,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">معرف الاختبار</p>
          <p className="text-sm font-bold text-[#1E293B]">{examId}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border text-[#318dce] bg-[#EEF5FF] border-[#BCD7FF]">
          <AccessTime className="text-sm" />
          {durationMinutes} دقيقة
        </span>
      </div>

      <h2 className="text-2xl font-extrabold text-[#1E293B] mb-2">جاهز لبدء الكويز؟</h2>
      <p className="text-sm text-gray-500 mb-6">
        بعد الضغط على &quot;ابدأ الآن&quot; سيتم تحميل الاختبار الحقيقي وبدء العداد التنازلي مباشرة.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">عدد الأسئلة</p>
          <p className="text-lg font-extrabold text-[#1E293B]">{totalQuestions}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">المدة</p>
          <p className="text-lg font-extrabold text-[#1E293B]">{durationMinutes} د</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">نوع الأسئلة</p>
          <p className="text-lg font-extrabold text-[#1E293B]">اختيار واحد</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">الحالة</p>
          <p className="text-lg font-extrabold text-[#318dce]">جاهز</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200"
          style={{ backgroundColor: "#318dce" }}
        >
          {isStarting ? "جاري البدء..." : "ابدأ الآن"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default StartQuizCard;
