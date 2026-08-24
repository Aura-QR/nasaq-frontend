import {
  AccessTime,
} from "@mui/icons-material";


const StartQuizCard = ({
  subjectLabel = "المادة غير محددة",

  durationMinutes = 0,

  totalQuestions = 0,

  examType = "quiz",

  examLabel = "الاختبار",

  onStart,

  onCancel,

  isStarting = false,
}) => {
  // =========================================
  // LABELS
  // =========================================

  const normalizedExamType =
    String(
      examType || ""
    )
      .trim()
      .toLowerCase();


  const resolvedExamLabel = (() => {
    if (examLabel) {
      return examLabel;
    }

    switch (
      normalizedExamType
    ) {
      case "activity":
        return "النشاط";

      case "assignment":
        return "الواجب";

      case "final":
        return "الاختبار النهائي";

      case "quiz":
        return "الاختبار القصير";

      default:
        return "الاختبار";
    }
  })();


  const startTitle = (() => {
    switch (
      normalizedExamType
    ) {
      case "activity":
        return "جاهز لبدء النشاط؟";

      case "assignment":
        return "جاهز لبدء الواجب؟";

      case "final":
        return "جاهز لبدء الاختبار النهائي؟";

      case "quiz":
        return "جاهز لبدء الاختبار القصير؟";

      default:
        return "جاهز لبدء الاختبار؟";
    }
  })();


  const loadingLabel = (() => {
    switch (
      normalizedExamType
    ) {
      case "activity":
        return "جاري بدء النشاط...";

      case "assignment":
        return "جاري بدء الواجب...";

      case "final":
        return "جاري بدء الاختبار...";

      case "quiz":
        return "جاري بدء الاختبار...";

      default:
        return "جاري البدء...";
    }
  })();


  const buttonLabel = (() => {
    switch (
      normalizedExamType
    ) {
      case "activity":
        return "ابدأ النشاط";

      case "assignment":
        return "ابدأ الواجب";

      case "final":
        return "ابدأ الاختبار";

      case "quiz":
        return "ابدأ الاختبار";

      default:
        return "ابدأ الآن";
    }
  })();


  return (
    <div
      className="
        w-full
        max-w-3xl
        mx-auto
        rounded-3xl
        border
        border-gray-200
        bg-white
        shadow-sm
        p-6
        sm:p-8
      "
    >
      {/* =====================================
          HEADER
      ===================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          mb-6
        "
      >
        {/* SUBJECT */}

        <div>
          <p
            className="
              text-xs
              font-semibold
              text-gray-500
              mb-1
            "
          >
            المادة
          </p>

          <p
            className="
              text-sm
              font-bold
              text-[#1E293B]
            "
          >
            {subjectLabel}
          </p>
        </div>


        {/* DURATION */}

        <span
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            px-3
            py-1.5
            text-xs
            font-bold
            border
            text-[#318dce]
            bg-[#EEF5FF]
            border-[#BCD7FF]
          "
        >
          <AccessTime
            className="text-sm"
          />

          {durationMinutes} دقيقة
        </span>
      </div>


      {/* =====================================
          TITLE
      ===================================== */}

      <h2
        className="
          text-2xl
          font-extrabold
          text-[#1E293B]
          mb-2
        "
      >
        {startTitle}
      </h2>


      <p
        className="
          text-sm
          text-gray-500
          mb-6
        "
      >
        بعد الضغط على &quot;ابدأ الآن&quot;
        سيتم تحميل {resolvedExamLabel} وبدء
        العداد التنازلي مباشرة.
      </p>


      {/* =====================================
          INFORMATION CARDS
      ===================================== */}

      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-4
          gap-3
          mb-7
        "
      >
        {/* QUESTIONS */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            p-3
          "
        >
          <p
            className="
              text-xs
              text-gray-500
            "
          >
            عدد الأسئلة
          </p>

          <p
            className="
              text-lg
              font-extrabold
              text-[#1E293B]
            "
          >
            {totalQuestions}
          </p>
        </div>


        {/* DURATION */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            p-3
          "
        >
          <p
            className="
              text-xs
              text-gray-500
            "
          >
            المدة
          </p>

          <p
            className="
              text-lg
              font-extrabold
              text-[#1E293B]
            "
          >
            {durationMinutes} د
          </p>
        </div>


        {/* QUESTION TYPE */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            p-3
          "
        >
          <p
            className="
              text-xs
              text-gray-500
            "
          >
            نوع الأسئلة
          </p>

          <p
            className="
              text-lg
              font-extrabold
              text-[#1E293B]
            "
          >
            اختيار واحد
          </p>
        </div>


        {/* STATUS */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            p-3
          "
        >
          <p
            className="
              text-xs
              text-gray-500
            "
          >
            الحالة
          </p>

          <p
            className="
              text-lg
              font-extrabold
              text-[#318dce]
            "
          >
            جاهز
          </p>
        </div>
      </div>


      {/* =====================================
          ACTIONS
      ===================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={onStart}
          disabled={
            isStarting
          }
          className="
            rounded-xl
            px-5
            py-2.5
            text-sm
            font-bold
            text-white
            shadow-sm
            hover:opacity-95
            transition-all
            duration-200
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
          style={{
            backgroundColor:
              "#318dce",
          }}
        >
          {isStarting
            ? loadingLabel
            : buttonLabel}
        </button>


        <button
          type="button"
          onClick={onCancel}
          disabled={
            isStarting
          }
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            px-5
            py-2.5
            text-sm
            font-bold
            text-gray-700
            hover:bg-gray-50
            transition-all
            duration-200
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};


export default StartQuizCard;