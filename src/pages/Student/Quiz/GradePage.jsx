import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Cancel,
  CheckCircle,
  RateReview,
  TaskAlt,
} from "@mui/icons-material";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

import {
  getExamResultTitle,
  getExamTypeLabel,
} from "./quizUtils";


const GradePage = () => {
  const location =
    useLocation();

  const navigate =
    useNavigate();


  const {
    gradeResult,
    isTimeUp,
    questions,
    answers,
    examTitle,
    examType = "quiz",
  } =
    location.state || {};


  const passed =
    gradeResult?.passed;


  const percentage =
    gradeResult?.percentage ??
    null;


  const achievedGrade =
    gradeResult?.achievedGrade ??
    null;


  const maxGrade =
    gradeResult?.maxGrade ??
    null;


  const correctAnswers =
    gradeResult?.correctAnswers ??
    null;


  const incorrectAnswers =
    gradeResult?.incorrectAnswers ??
    null;


  const totalQuestions =
    gradeResult?.totalQuestions ??
    null;


  const answeredQuestions =
    gradeResult?.answeredQuestions ??
    null;


  const examLabel =
    getExamTypeLabel(
      examType
    );


  const title =
    examTitle ||
    getExamResultTitle(
      examType
    );


  const listPath =
    location.pathname.includes(
      "assignments"
    )
      ? "/student-dashboard/assignments"
      : "/student-dashboard/exams";


  return (
    <Container noSidebar={true}>

      <Back title={title} />


      <div className="mt-6 min-h-[calc(100vh-200px)] flex items-center justify-center">

        <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-sm p-8 text-center">

          {/* Icon */}

          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              backgroundColor:
                passed
                  ? "#ECFDF5"
                  : "#FEF2F2",
            }}
          >

            <TaskAlt
              className="text-4xl"

              style={{
                color:
                  passed
                    ? "#10b981"
                    : "#ef4444",
              }}
            />

          </div>


          <h2 className="text-2xl font-extrabold text-[#1E293B] mb-2">

            تم تسليم {examLabel}

          </h2>


          <p className="text-sm text-gray-500 mb-6">

            {isTimeUp
              ? "انتهى الوقت وتم التسليم تلقائياً."
              : "تم حفظ إجاباتك بنجاح."}

          </p>


          {/* Pass / Fail */}

          <div className="flex justify-center mb-5">

            <span
              className={`
                inline-flex
                items-center
                gap-1.5
                rounded-full
                px-4
                py-1.5
                text-sm
                font-bold
                border

                ${
                  passed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }
              `}
            >

              {passed ? (
                <CheckCircle className="text-base" />
              ) : (
                <Cancel className="text-base" />
              )}

              {passed
                ? "ناجح"
                : "راسب"}

            </span>

          </div>


          {/* Score */}

          {percentage !== null && (

            <div className="flex justify-center mb-6">

              <div
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4"

                style={{
                  borderColor:
                    passed
                      ? "#10b981"
                      : "#ef4444",

                  backgroundColor:
                    passed
                      ? "#ECFDF5"
                      : "#FEF2F2",
                }}
              >

                <span
                  className="text-2xl font-extrabold"

                  style={{
                    color:
                      passed
                        ? "#10b981"
                        : "#ef4444",
                  }}
                >

                  {percentage}%

                </span>


                {achievedGrade !==
                  null &&
                  maxGrade !==
                    null && (

                    <span className="text-xs text-gray-500 mt-0.5">

                      {achievedGrade}/
                      {maxGrade}

                    </span>

                  )}

              </div>

            </div>

          )}


          {/* Stats */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">

            {totalQuestions !==
              null && (

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs text-gray-500 mb-1">
                  إجمالي الأسئلة
                </p>

                <p className="text-xl font-extrabold text-[#1E293B]">
                  {totalQuestions}
                </p>

              </div>

            )}


            {answeredQuestions !==
              null && (

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs text-gray-500 mb-1">
                  الأسئلة المجابة
                </p>

                <p
                  className="text-xl font-extrabold"
                  style={{
                    color:
                      "#318dce",
                  }}
                >
                  {answeredQuestions}
                </p>

              </div>

            )}


            {correctAnswers !==
              null && (

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                <p className="text-xs text-emerald-600 mb-1">
                  إجابات صحيحة
                </p>

                <p className="text-xl font-extrabold text-emerald-700">
                  {correctAnswers}
                </p>

              </div>

            )}


            {incorrectAnswers !==
              null && (

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

                <p className="text-xs text-red-500 mb-1">
                  إجابات خاطئة
                </p>

                <p className="text-xl font-extrabold text-red-600">
                  {incorrectAnswers}
                </p>

              </div>

            )}

          </div>


          {/* Actions */}

          <div className="flex flex-wrap items-center justify-center gap-3">

            <button
              type="button"

              onClick={() =>
                navigate(
                  listPath
                )
              }

              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >

              {location.pathname.includes(
                "assignments"
              )
                ? "الرجوع إلى واجباتي"
                : "الرجوع إلى اختباراتي"}

            </button>


            {questions?.length >
              0 && (

              <button
                type="button"

                onClick={() => {

                  const reviewPath =
                    location.pathname.replace(
                      /\/[^/]+$/,
                      "/review"
                    );


                  navigate(
                    reviewPath,
                    {
                      state: {
                        gradeResult,
                        questions,
                        answers,
                        examTitle,
                        examType,
                      },
                    }
                  );

                }}

                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200"

                style={{
                  backgroundColor:
                    "#318dce",
                }}
              >

                <RateReview className="text-base" />

                مراجعة الإجابات

              </button>

            )}

          </div>

        </div>

      </div>

    </Container>
  );
};


export default GradePage;