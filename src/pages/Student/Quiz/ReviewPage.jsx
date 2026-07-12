import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Cancel, CheckCircle } from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

const ReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { gradeResult, questions = [], answers = {}, examTitle } = location.state || {};

  const resultsMap = useMemo(() => {
    const map = {};
    for (const r of gradeResult?.results || []) {
      map[r.questionId] = r;
    }
    return map;
  }, [gradeResult]);

  const title = examTitle || "مراجعة الكويز";

  if (!questions.length) {
    return (
      <Container noSidebar={true}>
        <Back title={title} />
        <div className="mt-10 text-center text-gray-500">لا توجد بيانات للمراجعة.</div>
      </Container>
    );
  }

  return (
    <Container noSidebar={true}>
      <Back title={title} />
      <div className="mt-6 flex flex-col gap-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1E293B]">مراجعة الإجابات</h2>
          <span className="text-sm text-gray-500">{questions.length} سؤال</span>
        </div>

        {/* Questions */}
        {questions.map((question, index) => {
          const result = resultsMap[question.id];
          const studentAnswer = result?.studentAnswer ?? answers[question.id];
          const correctAnswer = result?.correctAnswer;
          const isCorrect = result?.isCorrect ?? (studentAnswer === correctAnswer);
          const isAnswered = !!studentAnswer;

          return (
            <div
              key={question.id}
              className={`rounded-3xl border bg-white shadow-sm p-5 sm:p-6 ${
                !isAnswered
                  ? "border-gray-200"
                  : isCorrect
                  ? "border-emerald-200"
                  : "border-red-200"
              }`}
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center bg-gray-100 text-gray-500">
                  {index + 1}
                </span>
                <h3 className="text-base font-bold text-[#1E293B] leading-relaxed flex-1">
                  {question.text}
                </h3>
                {isAnswered && (
                  isCorrect ? (
                    <CheckCircle className="flex-shrink-0 text-emerald-500" />
                  ) : (
                    <Cancel className="flex-shrink-0 text-red-500" />
                  )
                )}
              </div>

              {/* Choices */}
              <div className="grid grid-cols-1 gap-2">
                {(question.choices || []).map((choice) => {
                  const isStudentChoice = studentAnswer === choice;
                  const isCorrectChoice = correctAnswer === choice;

                  let className =
                    "w-full text-right rounded-2xl border px-4 py-3 flex items-center gap-3 text-sm font-semibold ";
                  if (isCorrectChoice) {
                    className += "border-emerald-300 bg-emerald-50 text-emerald-800";
                  } else if (isStudentChoice && !isCorrect) {
                    className += "border-red-300 bg-red-50 text-red-700";
                  } else {
                    className += "border-gray-200 bg-white text-gray-600";
                  }

                  return (
                    <div key={choice} className={className}>
                      {isCorrectChoice ? (
                        <CheckCircle className="text-emerald-500 text-base flex-shrink-0" />
                      ) : isStudentChoice && !isCorrect ? (
                        <Cancel className="text-red-500 text-base flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className="flex-1">{choice}</span>
                      {isCorrectChoice && (
                        <span className="text-xs font-bold text-emerald-600">الإجابة الصحيحة</span>
                      )}
                      {isStudentChoice && !isCorrect && (
                        <span className="text-xs font-bold text-red-500">إجابتك</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Back button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            الرجوع إلى النتيجة
          </button>
        </div>

      </div>
    </Container>
  );
};

export default ReviewPage;
