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


// =====================================================
// HELPERS
// =====================================================

const normalizeId = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};


const extractExams = (response) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
  ];

  for (const candidate of candidates) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      const list = [
        candidate.exams,
        candidate.docs,
        candidate.items,
        candidate.results,
        candidate.data,
      ].find(Array.isArray);

      if (list) {
        return list;
      }
    }
  }

  return [];
};


const getQuestionsCount = (
  exam
) => {
  if (
    Array.isArray(
      exam?.questions
    )
  ) {
    return exam.questions.length;
  }

  const value =
    exam?.questionsCount ??
    exam?.questionCount ??
    exam?.totalQuestions;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const getDuration = (exam) => {
  const value =
    exam?.duration ??
    exam?.durationMinutes;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


// =====================================================
// COMPONENT
// =====================================================

const StartPage = () => {
  const { examId } =
    useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();


  // ===================================================
  // DATA COMING FROM MY EXAMS / ASSIGNMENTS
  // ===================================================

  const stateExam =
    useMemo(() => {
      return (
        location.state
          ?.rawExam ||
        location.state?.exam
          ?.rawExam ||
        location.state?.quiz
          ?.rawExam ||
        location.state?.assignment
          ?.rawExam ||
        location.state?.exam ||
        location.state?.quiz ||
        location.state
          ?.assignment ||
        null
      );
    }, [
      location.state,
    ]);


  const stateExamMatches =
    useMemo(() => {
      if (!stateExam) {
        return null;
      }

      return (
        normalizeId(
          stateExam
        ) ===
        normalizeId(examId)
      )
        ? stateExam
        : null;
    }, [
      stateExam,
      examId,
    ]);


  // ===================================================
  // STATE
  // ===================================================

  const [
    preStartExam,
    setPreStartExam,
  ] = useState(
    stateExamMatches
  );

  const [
    loadingStarter,
    setLoadingStarter,
  ] = useState(
    !stateExamMatches
  );


  // ===================================================
  // LOAD EXAM
  // ===================================================

  useEffect(() => {
    let mounted = true;


    const loadExam =
      async () => {
        /*
         * لو الاختبار جاي أصلًا كامل
         * من MyExams / MyAssignments
         * مفيش داعي نعمل request جديد.
         */

        if (
          stateExamMatches
        ) {
          setPreStartExam(
            stateExamMatches
          );

          setLoadingStarter(
            false
          );

          return;
        }


        setLoadingStarter(
          true
        );


        try {
          /*
           * مهم:
           *
           * نجيب كل الاختبارات
           * بدون examType filter.
           *
           * كده الصفحة تدعم:
           *
           * final
           * quiz
           * assignment
           * activity
           *
           * وأي نوع جديد بعد كده.
           */

          const response =
            await fetchStudentExams();


          if (!mounted) {
            return;
          }


          /*
           * fetchStudentExams
           * ممكن ترجع:
           *
           * { status, data }
           *
           * أو Array مباشرة
           *
           * لذلك بنعمل normalization.
           */

          const exams =
            extractExams(
              response
            );


          const exam =
            exams.find(
              (item) =>
                normalizeId(
                  item
                ) ===
                normalizeId(
                  examId
                )
            ) || null;


          setPreStartExam(
            exam
          );


          if (!exam) {
            toast.error(
              "لم يتم العثور على بيانات الاختبار",
              {
                toastId:
                  `exam-not-found-${examId}`,
              }
            );
          }
        } catch (error) {
          if (!mounted) {
            return;
          }


          console.error(
            "[StartPage] load exam:",
            error
          );


          setPreStartExam(
            null
          );


          toast.error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "حدث خطأ أثناء جلب بيانات الاختبار",
            {
              toastId:
                `exam-load-error-${examId}`,
            }
          );
        } finally {
          if (mounted) {
            setLoadingStarter(
              false
            );
          }
        }
      };


    loadExam();


    return () => {
      mounted = false;
    };
  }, [
    examId,
    stateExamMatches,
  ]);


  // ===================================================
  // RESOLVED EXAM
  // ===================================================

  const exam =
    preStartExam ||
    stateExamMatches ||
    stateExam ||
    null;


  // ===================================================
  // EXAM TYPE
  // ===================================================

  const examType =
    exam?.examType ||
    location.state
      ?.examType ||
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
  // Subject
  // =========================================

  const subjectData =
    exam?.subjectOffering
      ?.subjectId ||
    exam?.gradesCriteria
      ?.subjectOfferingId
      ?.subjectId ||
    null;


  const subjectLabel =
    [
      subjectData?.subjectName,
      subjectData?.subjectCode,
    ]
      .filter(Boolean)
      .join(" - ") ||
    "المادة غير محددة";


  // ===================================================
  // DURATION
  // ===================================================

  const durationMinutes =
    useMemo(
      () =>
        getDuration(
          exam
        ),
      [exam]
    );


  // ===================================================
  // QUESTIONS COUNT
  // ===================================================

  const questionsCount =
    useMemo(
      () =>
        getQuestionsCount(
          exam
        ),
      [exam]
    );


  // ===================================================
  // TITLE
  // ===================================================

  const examTitle =
    useMemo(() => {
      if (exam?.title) {
        return exam.title;
      }


      switch (
        String(
          examType || ""
        ).toLowerCase()
      ) {
        case "final":
          return "الاختبار النهائي";

        case "assignment":
          return "الواجب";

        case "activity":
          return "النشاط";

        case "quiz":
          return "الاختبار القصير";

        default:
          return (
            examLabel ||
            "الاختبار"
          );
      }
    }, [
      exam,
      examType,
      examLabel,
    ]);


  // ===================================================
  // BACK PATH
  // ===================================================

  const backPath =
    location.pathname.includes(
      "assignments"
    )
      ? "/student-dashboard/assignments"
      : "/student-dashboard/exams";


  // ===================================================
  // START
  // ===================================================

  const handleStart = () => {
    if (!exam) {
      toast.error(
        "بيانات الاختبار غير متاحة",
        {
          toastId:
            `exam-start-missing-${examId}`,
        }
      );

      return;
    }


    navigate(
      "active",
      {
        state: {
          examTitle,

          quiz: exam,

          exam,

          rawExam: exam,

          examType,

          examLabel,
        },
      }
    );
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Container
      noSidebar={true}
    >
      <Back
        title={
          examTitle
        }
      />


      <div
        className="
          mt-6
          min-h-[calc(100vh-200px)]
          flex
          items-center
          justify-center
        "
      >
        <StartQuizCard
          subjectLabel={
            subjectLabel
          }

          durationMinutes={
            durationMinutes
          }

          totalQuestions={
            questionsCount
          }

          examType={
            examType
          }

          examLabel={
            examLabel
          }

          onStart={
            handleStart
          }

          onCancel={() =>
            navigate(
              backPath
            )
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