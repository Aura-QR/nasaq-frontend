import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";

import StartQuizCard from "../components/StartQuizCard";

import {
  fetchStudentExams,
} from "@/APIs/student";

import { toast } from "react-toastify";

import {
  getExamTypeLabel,
} from "./quizUtils";


const StartPage = () => {
  const { examId } = useParams();

  const navigate = useNavigate();

  const location = useLocation();


  const quizMeta =
    location.state?.quiz ||
    location.state?.exam ||
    null;


  const [preStartExam, setPreStartExam] =
    useState(null);

  const [
    loadingStarter,
    setLoadingStarter,
  ] = useState(false);


  // =========================================
  // Load Exam
  // =========================================

  useEffect(() => {
    const fetchExam = async () => {
      setLoadingStarter(true);

      try {
        /*
         * لو داخل من assignments
         * ندور على assignment فقط.
         *
         * غير كده ندور في quiz + final.
         */

        const isAssignmentPage =
          location.pathname.includes(
            "assignments"
          );


        const stateExamType =
          quizMeta?.examType ||
          location.state?.examType;


        let examTypes;


        if (stateExamType) {
          examTypes = [
            stateExamType,
          ];
        } else if (isAssignmentPage) {
          examTypes = [
            "assignment",
          ];
        } else {
          examTypes = [
            "quiz",
            "final",
          ];
        }


        const responses =
          await Promise.all(
            examTypes.map(
              (examType) =>
                fetchStudentExams({
                  examType,
                })
            )
          );


        const exams =
          responses.flatMap(
            (response) => {
              if (
                !response?.status ||
                !Array.isArray(
                  response?.data
                )
              ) {
                return [];
              }

              return response.data;
            }
          );


        let exam =
          exams.find(
            (item) =>
              item?._id === examId
          ) || null;


        /*
         * Fallback:
         * لو جاي من MyExams ومعانا
         * rawExam بالفعل.
         */

        if (!exam && quizMeta) {
          if (
            quizMeta?.rawExam?._id ===
            examId
          ) {
            exam =
              quizMeta.rawExam;
          } else if (
            quizMeta?.id === examId ||
            quizMeta?._id === examId
          ) {
            exam =
              quizMeta;
          }
        }


        setPreStartExam(exam);


        if (!exam) {
          toast.error(
            "لم يتم العثور على بيانات الاختبار"
          );
        }
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء جلب بيانات الاختبار"
        );
      } finally {
        setLoadingStarter(false);
      }
    };


    fetchExam();

  }, [
    examId,
    location.pathname,
    location.state,
    quizMeta,
  ]);


  // =========================================
  // Exam Type
  // =========================================

  const examType =
    preStartExam?.examType ||
    quizMeta?.examType ||
    location.state?.examType ||
    (
      location.pathname.includes(
        "assignments"
      )
        ? "assignment"
        : "quiz"
    );


  const examLabel =
    getExamTypeLabel(
      examType
    );


  // =========================================
  // Duration
  // =========================================

  const durationMinutes =
    useMemo(() => {
      if (
        typeof preStartExam?.duration ===
        "number"
      ) {
        return preStartExam.duration;
      }


      if (
        typeof quizMeta?.duration ===
        "number"
      ) {
        return quizMeta.duration;
      }


      if (
        typeof quizMeta?.duration ===
        "string"
      ) {
        const parsed =
          Number.parseInt(
            quizMeta.duration,
            10
          );

        if (
          !Number.isNaN(parsed)
        ) {
          return parsed;
        }
      }


      return 0;

    }, [
      preStartExam,
      quizMeta,
    ]);


  // =========================================
  // Questions Count
  // =========================================

  const questionsCount =
    useMemo(() => {
      if (
        Array.isArray(
          preStartExam?.questions
        )
      ) {
        return (
          preStartExam.questions.length
        );
      }


      return (
        Number(
          quizMeta?.questionsCount
        ) || 0
      );

    }, [
      preStartExam,
      quizMeta,
    ]);


  // =========================================
  // Title
  // =========================================

  const examTitle =
    quizMeta?.title ||
    preStartExam?.title ||
    (
      examType === "final"
        ? "الاختبار النهائي"
        : examType === "assignment"
        ? "الواجب"
        : "الكويز"
    );


  // =========================================
  // Back Path
  // =========================================

  const backPath =
    location.pathname.includes(
      "assignments"
    )
      ? "/student-dashboard/assignments"
      : "/student-dashboard/exams";


  // =========================================
  // Start
  // =========================================

  const handleStart = () => {
    navigate(
      "active",
      {
        state: {
          examTitle,

          quiz:
            quizMeta,

          exam:
            preStartExam,

          examType,

          examLabel,
        },
      }
    );
  };


  return (
    <Container noSidebar={true}>
      <Back title={examTitle} />


      <div className="mt-6 min-h-[calc(100vh-200px)] flex items-center justify-center">

        <StartQuizCard
          examId={examId}

          durationMinutes={
            durationMinutes
          }

          totalQuestions={
            questionsCount
          }

          examType={examType}

          examLabel={examLabel}

          onStart={handleStart}

          onCancel={() =>
            navigate(backPath)
          }

          isStarting={
            loadingStarter
          }
        />

      </div>
    </Container>
  );
};


export default StartPage;