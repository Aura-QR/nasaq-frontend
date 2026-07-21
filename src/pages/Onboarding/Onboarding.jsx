import { useEffect, useMemo, useState } from "react";

import {
  ArrowBackRounded,
  ArrowForwardRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  EditNoteRounded,
  MenuBookRounded,
  RocketLaunchRounded,
  SchoolRounded,
  TaskAltRounded,
  TimelineRounded,
  TipsAndUpdatesRounded,
} from "@mui/icons-material";

import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import wadqLogo from "../../images/wadq-logo.png";

import "./Onboarding.css";

const STORAGE_KEY = "wadq_onboarding_draft";
const REGISTER_DRAFT_KEY = "wadq_registration_draft";
const ONBOARDING_COMPLETE_KEY = "wadq_onboarding_completed";

/*
 * غيّر هذا المسار لاحقًا إلى مسار لوحة المعلم الفعلية
 * بعد تحديد Route الـDashboard النهائي.
 */
const TEACHER_DASHBOARD_PATH = "/";

const educationStages = [
  {
    id: "primary",
    title: "المرحلة الابتدائية",
    shortTitle: "ابتدائي",
    description: "رحلة تعليمية مرنة وممتعة للصفوف الأولية والعليا.",
    accent: "#F2D792",
    icon: <SchoolRounded />,
  },
  {
    id: "middle",
    title: "المرحلة المتوسطة",
    shortTitle: "متوسط",
    description: "تنظيم أوضح للدروس والمهام وبناء فهم أعمق.",
    accent: "#8FC6E8",
    icon: <MenuBookRounded />,
  },
  {
    id: "secondary",
    title: "المرحلة الثانوية",
    shortTitle: "ثانوي",
    description: "تحضير متقدم ومتابعة دقيقة للأهداف والإنجاز.",
    accent: "#A9DDBF",
    icon: <TimelineRounded />,
  },
];

const subjects = [
  { id: "math", name: "الرياضيات", symbol: "∑" },
  { id: "science", name: "العلوم", symbol: "⚗" },
  { id: "arabic", name: "اللغة العربية", symbol: "ض" },
  { id: "english", name: "اللغة الإنجليزية", symbol: "A" },
  { id: "islamic", name: "الدراسات الإسلامية", symbol: "۞" },
  { id: "social", name: "الدراسات الاجتماعية", symbol: "⌖" },
  { id: "digital", name: "المهارات الرقمية", symbol: "</>" },
  { id: "art", name: "التربية الفنية", symbol: "✦" },
];

const weekDays = [
  { id: "sunday", label: "الأحد" },
  { id: "monday", label: "الاثنين" },
  { id: "tuesday", label: "الثلاثاء" },
  { id: "wednesday", label: "الأربعاء" },
  { id: "thursday", label: "الخميس" },
];

const periods = ["الأولى", "الثانية", "الثالثة", "الرابعة"];

const stepMeta = [
  {
    eyebrow: "مرحبًا بك",
    title: "لنصنع بداية مختلفة",
    subtitle: "إعداد حسابك لن يستغرق سوى دقائق قليلة.",
  },
  {
    eyebrow: "الخطوة الأولى",
    title: "أي مرحلة تدرّس؟",
    subtitle: "سنرتب لك المواد والأدوات المناسبة وفق اختيارك.",
  },
  {
    eyebrow: "الخطوة الثانية",
    title: "اختر موادك الأساسية",
    subtitle: "يمكنك تعديلها لاحقًا من إعدادات حسابك.",
  },
  {
    eyebrow: "الخطوة الثالثة",
    title: "ارسم ملامح أسبوعك",
    subtitle: "اختر مادة ثم اضغط على الحصة التي تريد إضافتها.",
  },
  {
    eyebrow: "كل شيء جاهز",
    title: "بداية منظّمة مع وَدْق",
    subtitle: "تم تجهيز مساحتك الأولى ويمكنك البدء الآن.",
  },
];

const stepVariants = {
  initial: {
    opacity: 0,
    y: 26,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -18,
    scale: 0.99,
    transition: {
      duration: 0.28,
    },
  },
};

const readJson = (key, fallback = null) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const Logo = () => {
  return (
    <div className="onboarding-logo">
      <span className="onboarding-logo__image">
        <img src={wadqLogo} alt="" aria-hidden="true" />
      </span>

      <span>
        <strong>وَدْق</strong>
        <small>منصة المعلم الذكية</small>
      </span>
    </div>
  );
};

const ProgressRail = ({ currentStep }) => {
  return (
    <div className="onboarding-progress" aria-label="تقدم إعداد الحساب">
      <div className="onboarding-progress__track">
        <motion.span
          initial={false}
          animate={{
            width: `${(currentStep / (stepMeta.length - 1)) * 100}%`,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </div>

      <div className="onboarding-progress__steps">
        {stepMeta.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;

          return (
            <span
              key={step.title}
              className={[
                isDone ? "is-done" : "",
                isActive ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <i>
                {isDone ? <CheckCircleRounded /> : String(index + 1).padStart(2, "0")}
              </i>
              <small>{index === 0 ? "البداية" : index === 4 ? "جاهز" : `خطوة ${index}`}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
};

const WelcomeStep = ({ teacherName }) => {
  return (
    <motion.div
      className="onboarding-welcome"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="welcome-drop-scene" aria-hidden="true">
        <motion.span
          className="welcome-drop-scene__drop"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.15,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        <motion.span
          className="welcome-drop-scene__ring welcome-drop-scene__ring--one"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.65, duration: 1 }}
        />
        <motion.span
          className="welcome-drop-scene__ring welcome-drop-scene__ring--two"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.65 }}
          transition={{ delay: 0.85, duration: 1.15 }}
        />
        <motion.span
          className="welcome-drop-scene__ring welcome-drop-scene__ring--three"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ delay: 1, duration: 1.35 }}
        />

        <motion.div
          className="welcome-drop-scene__center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.75,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <AutoAwesomeRounded />
        </motion.div>
      </div>

      <div className="welcome-copy">
        <motion.span
          initial={{ opacity: 0, y: 13 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          أهلًا بك يا
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
        >
          {teacherName}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88 }}
        >
          سنرتب معًا المرحلة والمواد وجدولك الأول، ثم نترك لك مساحة أكبر
          لتصنع أثر الحصة.
        </motion.p>

        <motion.div
          className="welcome-points"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                delayChildren: 1,
                staggerChildren: 0.12,
              },
            },
          }}
        >
          {[
            "إعداد سريع وواضح",
            "قابل للتعديل في أي وقت",
            "مصمم لرحلة المعلم",
          ].map((item) => (
            <motion.span
              key={item}
              variants={{
                hidden: { opacity: 0, x: 16 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <CheckCircleRounded />
              {item}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const StageStep = ({ selectedStage, onSelect }) => {
  return (
    <motion.div
      className="stage-step"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="stage-cards">
        {educationStages.map((stage, index) => {
          const isSelected = selectedStage === stage.id;

          return (
            <motion.button
              type="button"
              key={stage.id}
              className={`stage-card ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelect(stage.id)}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.55,
              }}
              whileHover={{
                y: -8,
                rotate: index === 0 ? -0.8 : index === 2 ? 0.8 : 0,
              }}
              whileTap={{ scale: 0.985 }}
              style={{
                "--stage-accent": stage.accent,
              }}
            >
              <span className="stage-card__number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="stage-card__icon">{stage.icon}</span>

              <span className="stage-card__copy">
                <strong>{stage.title}</strong>
                <small>{stage.description}</small>
              </span>

              <span className="stage-card__select">
                {isSelected ? <CheckCircleRounded /> : <ArrowBackRounded />}
              </span>

              <span className="stage-card__glow" />
            </motion.button>
          );
        })}
      </div>

      <div className="stage-hint">
        <TipsAndUpdatesRounded />
        سيؤثر اختيار المرحلة على المواد والاقتراحات التي تظهر لك لاحقًا.
      </div>
    </motion.div>
  );
};

const SubjectsStep = ({ selectedSubjects, onToggle }) => {
  return (
    <motion.div
      className="subjects-step"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="subjects-orbit">
        <div className="subjects-orbit__center">
          <strong>{selectedSubjects.length}</strong>
          <span>مواد مختارة</span>
        </div>

        <span className="subjects-orbit__ring subjects-orbit__ring--one" />
        <span className="subjects-orbit__ring subjects-orbit__ring--two" />

        <div className="subjects-grid">
          {subjects.map((subject, index) => {
            const isSelected = selectedSubjects.includes(subject.id);

            return (
              <motion.button
                type="button"
                key={subject.id}
                className={`subject-bubble ${isSelected ? "is-selected" : ""}`}
                onClick={() => onToggle(subject.id)}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.055,
                  duration: 0.4,
                }}
                whileHover={{ scale: 1.055 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  "--subject-delay": `${index * 0.35}s`,
                }}
              >
                <span>{subject.symbol}</span>
                <strong>{subject.name}</strong>
                {isSelected && <CheckCircleRounded />}
              </motion.button>
            );
          })}
        </div>
      </div>

      <p className="subjects-note">
        اختر مادة واحدة على الأقل للمتابعة. يمكنك إضافة باقي المواد لاحقًا.
      </p>
    </motion.div>
  );
};

const ScheduleStep = ({
  selectedSubjects,
  schedule,
  activeSubject,
  onSelectSubject,
  onAssign,
  onRemove,
}) => {
  const selectedSubjectItems = subjects.filter((subject) =>
    selectedSubjects.includes(subject.id)
  );

  return (
    <motion.div
      className="schedule-step"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="schedule-builder">
        <aside className="schedule-builder__subjects">
          <span>اختر المادة أولًا</span>

          <div>
            {selectedSubjectItems.map((subject) => (
              <motion.button
                type="button"
                key={subject.id}
                className={activeSubject === subject.id ? "is-active" : ""}
                onClick={() => onSelectSubject(subject.id)}
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <i>{subject.symbol}</i>
                <strong>{subject.name}</strong>
                <ArrowBackRounded />
              </motion.button>
            ))}
          </div>

          <small>
            بعد اختيار المادة، اضغط على أي حصة فارغة لإضافتها.
          </small>
        </aside>

        <div className="schedule-board">
          <div className="schedule-board__corner">
            <CalendarMonthRounded />
            الأسبوع
          </div>

          {weekDays.map((day) => (
            <div className="schedule-board__day" key={day.id}>
              {day.label}
            </div>
          ))}

          {periods.map((period, periodIndex) => (
            <>
              <div
                className="schedule-board__period"
                key={`period-${period}`}
              >
                <span>{periodIndex + 1}</span>
                {period}
              </div>

              {weekDays.map((day) => {
                const key = `${day.id}-${periodIndex}`;
                const subjectId = schedule[key];
                const subject = subjects.find(
                  (item) => item.id === subjectId
                );

                return (
                  <button
                    type="button"
                    key={key}
                    className={[
                      "schedule-cell",
                      subject ? "has-subject" : "",
                      !subject && activeSubject ? "is-ready" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      if (subject) {
                        onRemove(key);
                        return;
                      }

                      if (activeSubject) {
                        onAssign(key, activeSubject);
                      }
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {subject ? (
                        <motion.span
                          key={subject.id}
                          initial={{ opacity: 0, scale: 0.72 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.28 }}
                        >
                          <i>{subject.symbol}</i>
                          <strong>{subject.name}</strong>
                          <CloseRounded />
                        </motion.span>
                      ) : (
                        <motion.small
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: activeSubject ? 0.85 : 0.32 }}
                        >
                          {activeSubject ? "أضف هنا" : "فارغة"}
                        </motion.small>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const FinishStep = ({
  teacherName,
  selectedStage,
  selectedSubjects,
  schedule,
}) => {
  const stage = educationStages.find((item) => item.id === selectedStage);
  const scheduleCount = Object.keys(schedule).length;

  return (
    <motion.div
      className="finish-step"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="finish-scene">
        <motion.span
          className="finish-scene__paper finish-scene__paper--back"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: -9, x: -28 }}
          transition={{ delay: 0.15, duration: 0.65 }}
        />

        <motion.span
          className="finish-scene__paper finish-scene__paper--middle"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: 8, x: 24 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        />

        <motion.div
          className="finish-scene__paper finish-scene__paper--front"
          initial={{ opacity: 0, y: 35, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="finish-scene__paper-head">
            <Logo />
            <AutoAwesomeRounded />
          </div>

          <span>ملف المعلم</span>
          <h3>{teacherName}</h3>

          <div className="finish-summary">
            <div>
              <SchoolRounded />
              <span>
                <small>المرحلة</small>
                <strong>{stage?.shortTitle || "غير محددة"}</strong>
              </span>
            </div>

            <div>
              <MenuBookRounded />
              <span>
                <small>المواد</small>
                <strong>{selectedSubjects.length}</strong>
              </span>
            </div>

            <div>
              <CalendarMonthRounded />
              <span>
                <small>الحصص</small>
                <strong>{scheduleCount}</strong>
              </span>
            </div>
          </div>

          <motion.div
            className="finish-stamp"
            initial={{ opacity: 0, scale: 1.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{
              delay: 0.85,
              type: "spring",
              stiffness: 160,
              damping: 13,
            }}
          >
            جاهز
            <span>للبداية</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="finish-copy">
        <span>
          <CheckCircleRounded />
          اكتمل إعداد حسابك
        </span>

        <h2>مساحتك الأولى أصبحت جاهزة</h2>

        <p>
          حفظنا مرحلتك وموادك وجدولك المبدئي. يمكنك تعديل كل شيء لاحقًا
          من إعدادات حسابك.
        </p>

        <div className="finish-copy__points">
          <span>
            <TaskAltRounded />
            إعداد أول تحضير
          </span>
          <span>
            <CalendarMonthRounded />
            تنظيم جدولك
          </span>
          <span>
            <EditNoteRounded />
            تعديل المحتوى
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const savedDraft = useMemo(() => readJson(STORAGE_KEY, {}), []);
  const registerDraft = useMemo(
    () => readJson(REGISTER_DRAFT_KEY, {}),
    []
  );

  const teacherName =
    location.state?.teacherName ||
    savedDraft?.teacherName ||
    registerDraft?.name ||
    "معلمنا";

  const [currentStep, setCurrentStep] = useState(
    Number.isInteger(savedDraft?.currentStep)
      ? Math.min(savedDraft.currentStep, stepMeta.length - 1)
      : 0
  );

  const [selectedStage, setSelectedStage] = useState(
    savedDraft?.selectedStage || ""
  );

  const [selectedSubjects, setSelectedSubjects] = useState(
    Array.isArray(savedDraft?.selectedSubjects)
      ? savedDraft.selectedSubjects
      : []
  );

  const [schedule, setSchedule] = useState(
    savedDraft?.schedule && typeof savedDraft.schedule === "object"
      ? savedDraft.schedule
      : {}
  );

  const [activeSubject, setActiveSubject] = useState(
    savedDraft?.activeSubject || ""
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        teacherName,
        currentStep,
        selectedStage,
        selectedSubjects,
        schedule,
        activeSubject,
      })
    );
  }, [
    teacherName,
    currentStep,
    selectedStage,
    selectedSubjects,
    schedule,
    activeSubject,
  ]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep]);

  const canContinue = useMemo(() => {
    if (currentStep === 1) {
      return Boolean(selectedStage);
    }

    if (currentStep === 2) {
      return selectedSubjects.length > 0;
    }

    return true;
  }, [currentStep, selectedStage, selectedSubjects]);

  const toggleSubject = (subjectId) => {
    setSelectedSubjects((current) => {
      if (current.includes(subjectId)) {
        setSchedule((currentSchedule) =>
          Object.fromEntries(
            Object.entries(currentSchedule).filter(
              ([, value]) => value !== subjectId
            )
          )
        );

        if (activeSubject === subjectId) {
          setActiveSubject("");
        }

        return current.filter((item) => item !== subjectId);
      }

      return [...current, subjectId];
    });
  };

  const assignSubject = (cellKey, subjectId) => {
    setSchedule((current) => ({
      ...current,
      [cellKey]: subjectId,
    }));
  };

  const removeSubjectFromSchedule = (cellKey) => {
    setSchedule((current) => {
      const updated = { ...current };
      delete updated[cellKey];
      return updated;
    });
  };

  const goNext = () => {
    if (!canContinue) {
      toast.info(
        currentStep === 1
          ? "اختر المرحلة التعليمية أولًا"
          : "اختر مادة واحدة على الأقل"
      );
      return;
    }

    setCurrentStep((current) =>
      Math.min(current + 1, stepMeta.length - 1)
    );
  };

  const goBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const completeOnboarding = () => {
    window.localStorage.setItem(
      ONBOARDING_COMPLETE_KEY,
      JSON.stringify({
        completed: true,
        completedAt: new Date().toISOString(),
      })
    );

    window.localStorage.removeItem(STORAGE_KEY);

    toast.success("تم تجهيز حسابك في وَدْق بنجاح");

    navigate(TEACHER_DASHBOARD_PATH, {
      replace: true,
    });
  };

  return (
    <main className="onboarding-page" dir="rtl">
      <div className="onboarding-page__noise" />
      <span className="onboarding-bg-ring onboarding-bg-ring--one" />
      <span className="onboarding-bg-ring onboarding-bg-ring--two" />
      <span className="onboarding-bg-line onboarding-bg-line--one" />
      <span className="onboarding-bg-line onboarding-bg-line--two" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`ripple-${currentStep}`}
          className="step-ripple"
          initial={{ scale: 0, opacity: 0.62 }}
          animate={{ scale: 2.8, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.05, ease: "easeOut" }}
        />
      </AnimatePresence>

      <section className="onboarding-shell">
        <header className="onboarding-header">
          <Logo />

          <button
            type="button"
            onClick={() => navigate("/")}
            className="onboarding-exit"
          >
            حفظ والخروج
            <CloseRounded />
          </button>
        </header>

        <ProgressRail currentStep={currentStep} />

        <section className="onboarding-content">
          <div className="onboarding-content__heading">
            <AnimatePresence mode="wait">
              <motion.div
                key={`heading-${currentStep}`}
                initial={{ opacity: 0, y: 13 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32 }}
              >
                <span>{stepMeta[currentStep].eyebrow}</span>
                <h1>{stepMeta[currentStep].title}</h1>
                <p>{stepMeta[currentStep].subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="onboarding-content__stage">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <WelcomeStep key="welcome" teacherName={teacherName} />
              )}

              {currentStep === 1 && (
                <StageStep
                  key="stage"
                  selectedStage={selectedStage}
                  onSelect={setSelectedStage}
                />
              )}

              {currentStep === 2 && (
                <SubjectsStep
                  key="subjects"
                  selectedSubjects={selectedSubjects}
                  onToggle={toggleSubject}
                />
              )}

              {currentStep === 3 && (
                <ScheduleStep
                  key="schedule"
                  selectedSubjects={selectedSubjects}
                  schedule={schedule}
                  activeSubject={activeSubject}
                  onSelectSubject={setActiveSubject}
                  onAssign={assignSubject}
                  onRemove={removeSubjectFromSchedule}
                />
              )}

              {currentStep === 4 && (
                <FinishStep
                  key="finish"
                  teacherName={teacherName}
                  selectedStage={selectedStage}
                  selectedSubjects={selectedSubjects}
                  schedule={schedule}
                />
              )}
            </AnimatePresence>
          </div>
        </section>

        <footer className="onboarding-actions">
          <button
            type="button"
            className="onboarding-button onboarding-button--secondary"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ArrowForwardRounded />
            رجوع
          </button>

          <span>
            {currentStep + 1} من {stepMeta.length}
          </span>

          {currentStep < stepMeta.length - 1 ? (
            <motion.button
              type="button"
              className="onboarding-button onboarding-button--primary"
              onClick={goNext}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              {currentStep === 0 ? "لنبدأ إعداد حسابك" : "متابعة"}
              <ArrowBackRounded />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              className="onboarding-button onboarding-button--gold"
              onClick={completeOnboarding}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              افتح مساحة المعلم
              <RocketLaunchRounded />
            </motion.button>
          )}
        </footer>
      </section>
    </main>
  );
};

export default Onboarding;
