import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
	AccessTime,
	ArrowBack,
	ArrowForward,
	CheckCircle,
	RadioButtonUnchecked,
} from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import StartQuizCard from "./components/StartQuizCard";
import QuizSubmittedCard from "./components/QuizSubmittedCard";
import { fetchStudentExams, gradeStudentExam, startStudentExam } from "@/APIs/student";
import { toast } from "react-toastify";

const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60)
		.toString()
		.padStart(2, "0");
	const secs = (seconds % 60).toString().padStart(2, "0");
	return `${mins}:${secs}`;
};

const QuizPage = () => {
	const { examId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const quizMeta = location.state?.quiz;
	const [preStartExam, setPreStartExam] = useState(null);
	const [loadingStarter, setLoadingStarter] = useState(false);
	const [startedExam, setStartedExam] = useState(null);
	const [isStarting, setIsStarting] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [isStarted, setIsStarted] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState({});
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isTimeUp, setIsTimeUp] = useState(false);
	const [gradeResult, setGradeResult] = useState(null);

	const examQuestions = useMemo(() => {
		return startedExam?.questions || [];
	}, [startedExam]);

	useEffect(() => {
		let mounted = true;

		const rawFromState =
			location.state?.rawExam ||
			location.state?.exam?.rawExam ||
			location.state?.quiz?.rawExam ||
			location.state?.exam ||
			location.state?.quiz ||
			null;

		if (rawFromState) {
			setPreStartExam(rawFromState);
			setLoadingStarter(false);
			return () => {
				mounted = false;
			};
		}

		const fetchStarterExam = async () => {
			try {
				setLoadingStarter(true);

				const response =
					await fetchStudentExams();

				if (!mounted) return;

				if (response?.status) {
					const exams =
						Array.isArray(response?.data)
							? response.data
							: [];

					const exam =
						exams.find(
							(item) =>
								String(
									item?._id ||
										item?.id ||
										""
								) ===
								String(examId)
						) || null;

					setPreStartExam(exam);
				} else {
					setPreStartExam(null);

					toast.error(
						response?.message ||
							"تعذر تحميل بيانات الاختبار"
					);
				}
			} catch (error) {
				if (!mounted) return;

				console.error(
					"[Quiz] load exam:",
					error
				);

				setPreStartExam(null);

				toast.error(
					error?.response?.data?.message ||
						error?.message ||
						"تعذر تحميل بيانات الاختبار"
				);
			} finally {
				if (mounted) {
					setLoadingStarter(false);
				}
			}
		};

		fetchStarterExam();

		return () => {
			mounted = false;
		};
	}, [examId, location.state]);

	const resolvedDurationMinutes = useMemo(() => {
		if (typeof startedExam?.duration === "number") return startedExam.duration;
		if (typeof preStartExam?.duration === "number") return preStartExam.duration;
		if (typeof quizMeta?.duration === "number") return quizMeta.duration;
		if (typeof quizMeta?.duration === "string") {
			const parsed = Number.parseInt(quizMeta.duration, 10);
			if (!Number.isNaN(parsed)) return parsed;
		}
		return 0;
	}, [startedExam, preStartExam, quizMeta]);

	const totalQuestions = examQuestions.length;
	const totalSeconds = resolvedDurationMinutes * 60;
	const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

	useEffect(() => {
		setRemainingSeconds(totalSeconds);
	}, [totalSeconds]);

	const currentQuestion = examQuestions[currentIndex];
	const starterQuestionsCount = useMemo(() => {
		if (Array.isArray(preStartExam?.questions)) return preStartExam.questions.length;
		return Number(quizMeta?.questionsCount) || 0;
	}, [preStartExam, quizMeta]);
	const answeredCount = Object.keys(answers).length;
	const progressPercent = totalQuestions
		? Math.round((answeredCount / totalQuestions) * 100)
		: 0;

	const normalizeStartedExam = (rawExam) => {
		const source = rawExam?.data?.exam || rawExam?.exam || rawExam?.data || rawExam;
		return {
			...source,
			duration: source?.duration ?? rawExam?.duration,
			remainingSeconds: rawExam?.remainingSeconds,
			startedAt: rawExam?.startedAt,
			questions: (source?.questions || []).map((q, index) => ({
				id: q?._id || q?.id || `q-${index}`,
				text: q?.question || q?.text || "",
				choices: q?.options || q?.choices || [],
			})),
		};
	};

	const buildSubmitPayload = () => {
		const answersArray = examQuestions
			.filter((question) => typeof answers[question.id] === "string" && answers[question.id].trim() !== "")
			.map((question) => ({
				questionId: question.id,
				answer: answers[question.id],
			}));

		return {
			answers: answersArray,
		};
	};

	const handleStartQuiz = async () => {
		setIsStarting(true);
		const response = await startStudentExam(examId);
		console.log("startExam response:", response);

		if (response && (response?.exam || response?.data?.exam || response?.status)) {
			const normalized = normalizeStartedExam(response);
			setStartedExam(normalized);
			setRemainingSeconds(
				typeof normalized.remainingSeconds === "number"
					? normalized.remainingSeconds
					: (normalized.duration || resolvedDurationMinutes || 0) * 60
			);
			setIsStarted(true);
		} else {
			toast.error(response || "حدث خطأ ما أثناء بدء الاختبار");
		}
		setIsStarting(false);
	};

	useEffect(() => {
		if (!isStarted || isSubmitted) return;

		const interval = window.setInterval(() => {
			setRemainingSeconds((prev) =>
				prev <= 1 ? 0 : prev - 1
			);
		}, 1000);

		return () =>
			window.clearInterval(interval);
	}, [isStarted, isSubmitted]);

	useEffect(() => {
		if (!isStarted || isSubmitted || remainingSeconds > 0) return;
		submitQuiz(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [remainingSeconds, isStarted, isSubmitted]);

	const timerColorClass = useMemo(() => {
		if (remainingSeconds <= 60) return "text-red-600 bg-red-50 border-red-200";
		if (remainingSeconds <= 180) return "text-amber-600 bg-amber-50 border-amber-200";
		return "text-[#318dce] bg-[#EEF5FF] border-[#BCD7FF]";
	}, [remainingSeconds]);

	const submitQuiz = async (forceTimeUp = false) => {
		if (isSubmitting || !isStarted) return;
		setIsSubmitting(true);
		const payload = buildSubmitPayload();
		const response = await gradeStudentExam(examId, payload);
		console.log("gradeExam response:", response);

		if (response?.status) {
			setGradeResult(response?.data || response);
			if (forceTimeUp) setIsTimeUp(true);
			setIsSubmitted(true);
		} else {
			toast.error(response || "حدث خطأ ما أثناء تسليم الاختبار");
		}
		setIsSubmitting(false);
	};

	// eslint-disable-next-line no-unused-vars
	const resetQuiz = () => {
		setAnswers({});
		setCurrentIndex(0);
		setIsSubmitted(false);
		setIsTimeUp(false);
		setGradeResult(null);
		setRemainingSeconds(totalSeconds);
		setIsStarted(false);
		setStartedExam(null);
	};

	if (isSubmitted) {
		return (
			<Container noSidebar={true}>
				<Back title={quizMeta?.title || preStartExam?.title || "صفحة الكويز"} />

				<QuizSubmittedCard
					isTimeUp={isTimeUp}
				gradeResult={gradeResult}
				onBack={() => window.history.back()}
				/>
			</Container>
		);
	}

	return (
		<Container noSidebar={true}>
			<Back title={quizMeta?.title || preStartExam?.title || "صفحة الكويز"} />

			<div className="mt-6 min-h-[calc(100vh-200px)] flex flex-col gap-5">
				{!isStarted ? (
					<StartQuizCard
						examId={examId}
						durationMinutes={resolvedDurationMinutes}
						totalQuestions={starterQuestionsCount}
						onStart={handleStartQuiz}
						onCancel={() => navigate("/student-dashboard/exams")}
						isStarting={isStarting || loadingStarter}
					/>
				) : (
					<>
						<div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs text-gray-500 mb-1">تقدم الكويز</p>
									<p className="text-sm font-bold text-[#1E293B]">
										السؤال {currentIndex + 1} من {totalQuestions}
									</p>
								</div>

								<span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold border ${timerColorClass}`}>
									<AccessTime className="text-base" />
									{formatTime(remainingSeconds)}
								</span>
							</div>

							<div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
								<div
									className="h-full rounded-full transition-all duration-300"
									style={{ width: `${progressPercent}%`, backgroundColor: "#318dce" }}
								/>
							</div>

							<p className="text-xs text-gray-500">{answeredCount} إجابة من أصل {totalQuestions}</p>
						</div>

						<div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-7">
							<h3 className="text-lg sm:text-xl font-extrabold text-[#1E293B] leading-relaxed mb-5">
								{currentQuestion?.text || ""}
							</h3>

							<div className="grid grid-cols-1 gap-3">
								{(currentQuestion?.choices || []).map((choice) => {
									const isSelected = answers[currentQuestion?.id] === choice;
									return (
										<button
											key={choice}
											type="button"
											onClick={() =>
												setAnswers((prev) => ({
													...prev,
													[currentQuestion?.id]: choice,
												}))
											}
											className={`w-full text-right rounded-2xl border px-4 py-3.5 transition-all duration-200 flex items-center gap-3 ${
												isSelected
													? "border-[#BCD7FF] bg-[#EEF5FF]"
													: "border-gray-200 bg-white hover:bg-gray-50"
											}`}
										>
											{isSelected ? (
												<CheckCircle className="text-[#318dce]" />
											) : (
												<RadioButtonUnchecked className="text-gray-300" />
											)}
											<span className={`text-sm font-semibold ${isSelected ? "text-[#1E293B]" : "text-gray-600"}`}>
												{choice}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
							<button
								type="button"
								onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
								disabled={currentIndex === 0}
								className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
							>
								<ArrowForward className="text-base" />
								السابق
							</button>

							<div className="flex items-center gap-2">
								{currentIndex < totalQuestions - 1 ? (
									<button
										type="button"
										onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
										className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200"
										style={{ backgroundColor: "#318dce" }}
									>
										التالي
										<ArrowBack className="text-base" />
									</button>
								) : (
									<button
										type="button"
										onClick={() => submitQuiz(false)}
										disabled={isSubmitting}
										className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all duration-200"
										style={{ backgroundColor: "#318dce" }}
									>
										{isSubmitting ? "جاري التسليم..." : "تسليم الكويز"}
									</button>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</Container>
	);
};

export default QuizPage;
