import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AccessTime,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  RadioButtonUnchecked,
} from "@mui/icons-material";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

import {
  gradeStudentExam,
  startStudentExam,
} from "@/APIs/student";

import {
  toast,
} from "react-toastify";

import {
  buildSubmitPayload,
  computeInitialSeconds,
  extractGradeResult,
  formatTime,
  getExamTypeLabel,
  isGradeResponse,
  normalizeStartedExam,
} from "./quizUtils";


const ActiveQuizPage = () => {
  const { examId } =
    useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const stateExamType =
    location.state?.examType ||
    location.state?.quiz
      ?.examType ||
    location.state?.exam
      ?.examType ||
    "quiz";


  const [
    loadingExam,
    setLoadingExam,
  ] = useState(true);


  const [
    startedExam,
    setStartedExam,
  ] = useState(null);


  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);


  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);


  const [
    answers,
    setAnswers,
  ] = useState(() => {
    try {
      const stored =
        sessionStorage.getItem(
          `quiz_answers_${examId}`
        );

      return stored
        ? JSON.parse(stored)
        : {};
    } catch {
      return {};
    }
  });


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  const [
    submitted,
    setSubmitted,
  ] = useState(false);


  // =========================================
  // Refs
  // =========================================

  const isSubmittingRef =
    useRef(false);

  const submittedRef =
    useRef(false);


  useEffect(() => {
    isSubmittingRef.current =
      isSubmitting;
  }, [isSubmitting]);


  useEffect(() => {
    submittedRef.current =
      submitted;
  }, [submitted]);


  // =========================================
  // Start / Resume Exam
  // =========================================

  useEffect(() => {
    const initExam = async () => {
      setLoadingExam(true);


      const response =
        await startStudentExam(
          examId
        );


      if (
        !response ||
        typeof response ===
          "string"
      ) {
        toast.error(
          typeof response ===
            "string"
            ? response
            : "حدث خطأ أثناء تحميل الاختبار"
        );


        navigate(
          location.pathname.replace(
            /\/active$/,
            ""
          ),
          {
            replace: true,
          }
        );

        return;
      }


      const normalized =
        normalizeStartedExam(
          response
        );


      if (
        !normalized.questions
          ?.length
      ) {
        toast.error(
          "لم يتم تحميل أسئلة الاختبار. حاول مجدداً."
        );


        navigate(
          location.pathname.replace(
            /\/active$/,
            ""
          ),
          {
            replace: true,
          }
        );

        return;
      }


      setStartedExam(
        normalized
      );


      setRemainingSeconds(
        computeInitialSeconds(
          normalized
        )
      );


      setLoadingExam(false);
    };


    initExam();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);


  // =========================================
  // Persist Answers
  // =========================================

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `quiz_answers_${examId}`,
        JSON.stringify(
          answers
        )
      );
    } catch {
      // Ignore storage errors
    }

  }, [
    answers,
    examId,
  ]);


  // =========================================
  // Exam Metadata
  // =========================================

  const examType =
    startedExam?.examType ||
    stateExamType;


  const examLabel =
    getExamTypeLabel(
      examType
    );


  const examTitle =
    location.state?.examTitle ||
    (
      examType === "final"
        ? "الاختبار النهائي"
        : examType ===
            "assignment"
        ? "الواجب"
        : "الكويز"
    );


  // =========================================
  // Questions
  // =========================================

  const examQuestions =
    useMemo(
      () =>
        startedExam?.questions ||
        [],
      [startedExam]
    );


  const totalQuestions =
    examQuestions.length;


  const currentQuestion =
    examQuestions[
      currentIndex
    ];


  // =========================================
  // Timer
  // =========================================

  useEffect(() => {
    if (
      loadingExam ||
      submitted ||
      remainingSeconds <= 0
    ) {
      return;
    }


    const interval =
      window.setInterval(
        () => {
          setRemainingSeconds(
            (previous) =>
              previous <= 1
                ? 0
                : previous - 1
          );
        },
        1000
      );


    return () =>
      window.clearInterval(
        interval
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadingExam,
    submitted,
  ]);


  // =========================================
  // Submit
  // =========================================

  const triggerSubmit =
    async (
      isTimeUp = false
    ) => {

      if (
        isSubmittingRef.current ||
        submittedRef.current
      ) {
        return;
      }


      isSubmittingRef.current =
        true;

      setIsSubmitting(true);


      const payload =
        buildSubmitPayload(
          examQuestions,
          answers
        );


      const response =
        await gradeStudentExam(
          examId,
          payload
        );


      console.log(
        "gradeExam response:",
        response
      );


      if (
        isGradeResponse(
          response
        )
      ) {
        const gradeResult =
          extractGradeResult(
            response
          );


        submittedRef.current =
          true;

        setSubmitted(true);


        try {
          sessionStorage.removeItem(
            `quiz_answers_${examId}`
          );
        } catch {
          // Ignore
        }


        const gradePath =
          location.pathname.replace(
            /\/[^/]+$/,
            "/grade"
          );


        navigate(
          gradePath,
          {
            replace: true,

            state: {
              gradeResult,

              isTimeUp,

              questions:
                examQuestions,

              answers,

              examTitle,

              examType,
            },
          }
        );

      } else {

        toast.error(
          typeof response ===
            "string"
            ? response
            : response?.message ||
              "حدث خطأ أثناء تسليم الاختبار"
        );


        isSubmittingRef.current =
          false;

        setIsSubmitting(false);
      }
    };


  // =========================================
  // Auto Submit
  // =========================================

  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      !loadingExam &&
      !submittedRef.current
    ) {
      triggerSubmit(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    remainingSeconds,
  ]);


  // =========================================
  // UI Data
  // =========================================

  const timerColorClass =
    useMemo(() => {

      if (
        remainingSeconds <= 60
      ) {
        return "text-red-600 bg-red-50 border-red-200";
      }


      if (
        remainingSeconds <= 180
      ) {
        return "text-amber-600 bg-amber-50 border-amber-200";
      }


      return "text-[#318dce] bg-[#EEF5FF] border-[#BCD7FF]";

    }, [
      remainingSeconds,
    ]);


  const answeredCount =
    Object.keys(
      answers
    ).length;


  const progressPercent =
    totalQuestions
      ? Math.round(
          (
            answeredCount /
            totalQuestions
          ) * 100
        )
      : 0;


  // =========================================
  // Loading
  // =========================================

  if (loadingExam) {
    return (
      <Container noSidebar={true}>
        <Back
          title={
            examTitle
          }
        />


        <div className="mt-6 min-h-[calc(100vh-200px)] flex items-center justify-center">

          <div className="text-center">

            <div className="inline-block w-10 h-10 rounded-full border-4 border-[#318dce] border-t-transparent animate-spin mb-4" />

            <p className="text-sm text-gray-500">
              جاري تحميل {examLabel}...
            </p>

          </div>

        </div>

      </Container>
    );
  }


  // =========================================
  // Render
  // =========================================

  return (
    <Container noSidebar={true}>

      <Back
        title={
          examTitle
        }
      />


      <div className="mt-6 min-h-[calc(100vh-200px)] flex flex-col gap-5">

        {/* Progress */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <p className="text-xs text-gray-500 mb-1">

                تقدم {examLabel}

              </p>


              <p className="text-sm font-bold text-[#1E293B]">

                السؤال{" "}
                {currentIndex + 1}{" "}
                من{" "}
                {totalQuestions}

              </p>

            </div>


            <span
              className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                px-3
                py-1.5
                text-sm
                font-bold
                border
                ${timerColorClass}
              `}
            >

              <AccessTime className="text-base" />

              {formatTime(
                remainingSeconds
              )}

            </span>

          </div>


          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">

            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width:
                  `${progressPercent}%`,

                backgroundColor:
                  "#318dce",
              }}
            />

          </div>


          <p className="text-xs text-gray-500">

            {answeredCount} إجابة من أصل{" "}
            {totalQuestions}

          </p>

        </div>


        {/* Question */}

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-7">

          <h3 className="text-lg sm:text-xl font-extrabold text-[#1E293B] leading-relaxed mb-5">

            {currentQuestion?.text ||
              ""}

          </h3>


          <div className="grid grid-cols-1 gap-3">

            {(
              currentQuestion
                ?.choices || []
            ).map(
              (choice) => {

                const isSelected =
                  answers[
                    currentQuestion
                      ?.id
                  ] === choice;


                return (
                  <button
                    key={choice}
                    type="button"

                    onClick={() =>
                      setAnswers(
                        (
                          previous
                        ) => ({
                          ...previous,

                          [currentQuestion
                            ?.id]:
                            choice,
                        })
                      )
                    }

                    className={`
                      w-full
                      text-right
                      rounded-2xl
                      border
                      px-4
                      py-3.5
                      transition-all
                      duration-200
                      flex
                      items-center
                      gap-3

                      ${
                        isSelected
                          ? "border-[#BCD7FF] bg-[#EEF5FF]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }
                    `}
                  >

                    {isSelected ? (

                      <CheckCircle className="text-[#318dce]" />

                    ) : (

                      <RadioButtonUnchecked className="text-gray-300" />

                    )}


                    <span
                      className={`
                        text-sm
                        font-semibold

                        ${
                          isSelected
                            ? "text-[#1E293B]"
                            : "text-gray-600"
                        }
                      `}
                    >

                      {choice}

                    </span>

                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* Navigation */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">

          <button
            type="button"

            onClick={() =>
              setCurrentIndex(
                (previous) =>
                  Math.max(
                    previous - 1,
                    0
                  )
              )
            }

            disabled={
              currentIndex === 0
            }

            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
          >

            <ArrowForward className="text-base" />

            السابق

          </button>


          <div className="flex items-center gap-2">

            {currentIndex <
            totalQuestions - 1 ? (

              <button
                type="button"

                onClick={() =>
                  setCurrentIndex(
                    (previous) =>
                      Math.min(
                        previous +
                          1,

                        totalQuestions -
                          1
                      )
                  )
                }

                className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200"

                style={{
                  backgroundColor:
                    "#318dce",
                }}
              >

                التالي

                <ArrowBack className="text-base" />

              </button>

            ) : (

              <button
                type="button"

                onClick={() =>
                  triggerSubmit(
                    false
                  )
                }

                disabled={
                  isSubmitting
                }

                className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200 disabled:opacity-60"

                style={{
                  backgroundColor:
                    "#318dce",
                }}
              >

                {isSubmitting
                  ? "جاري التسليم..."
                  : `تسليم ${examLabel}`}

              </button>

            )}

          </div>

        </div>

      </div>

    </Container>
  );
};


export default ActiveQuizPage;