import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import StartQuizCard from "../components/StartQuizCard";
import { fetchStudentExams } from "@/APIs/student";
import { toast } from "react-toastify";
const StartPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const quizMeta = location.state?.quiz;

  const [preStartExam, setPreStartExam] = useState(null);
  const [loadingStarter, setLoadingStarter] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      setLoadingStarter(true);
      const response = await fetchStudentExams();
      if (response?.status) {
        const exams = response?.data || [];
        const exam = exams.find((item) => item?._id === examId) || null;
        setPreStartExam(exam);
      } else {
        toast.error(response || "حدث خطأ ما أثناء جلب بيانات الاختبار");
      }
      setLoadingStarter(false);
    };
    fetchExam();
  }, [examId]);

  const durationMinutes = useMemo(() => {
    if (typeof preStartExam?.duration === "number") return preStartExam.duration;
    if (typeof quizMeta?.duration === "number") return quizMeta.duration;
    if (typeof quizMeta?.duration === "string") {
      const parsed = Number.parseInt(quizMeta.duration, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  }, [preStartExam, quizMeta]);

  const questionsCount = useMemo(() => {
    if (Array.isArray(preStartExam?.questions)) return preStartExam.questions.length;
    return Number(quizMeta?.questionsCount) || 0;
  }, [preStartExam, quizMeta]);

  const examTitle = quizMeta?.title || preStartExam?.title || "صفحة الكويز";

  const backPath = location.pathname.includes("assignments")
    ? "/student-dashboard/assignments"
    : "/student-dashboard/exams";

  const handleStart = () => {
    navigate("active", { state: { examTitle, quiz: quizMeta } });
  };

  return (
    <Container noSidebar={true}>
      <Back title={examTitle} />
      <div className="mt-6 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <StartQuizCard
          examId={examId}
          durationMinutes={durationMinutes}
          totalQuestions={questionsCount}
          onStart={handleStart}
          onCancel={() => navigate(backPath)}
          isStarting={loadingStarter}
        />
      </div>
    </Container>
  );
};

export default StartPage;
