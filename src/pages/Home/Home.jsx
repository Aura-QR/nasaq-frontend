import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  useAuthUser,
  useIsAuthenticated,
  useSignOut,
} from "react-auth-kit";
import {
  ArrowBackRounded,
  ArrowDownwardRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  DescriptionRounded,
  DownloadRounded,
  EditNoteRounded,
  InsightsRounded,
  MenuBookRounded,
  MenuRounded,
  SchoolRounded,
  TaskAltRounded,
  TimelineRounded,
  ViewWeekRounded,
} from "@mui/icons-material";

import "./Home.css";
import nasaqLogo from "../../images/wadq-logo.png";

const preparationStages = [
  {
    label: "المادة",
    value: "الرياضيات",
    caption: "اختيار المادة والمرحلة",
  },
  {
    label: "الدرس",
    value: "الكسور الاعتيادية",
    caption: "تحديد الوحدة والدرس",
  },
  {
    label: "المحتوى",
    value: "أهداف وأنشطة وتقويم",
    caption: "إنشاء عناصر التحضير",
  },
  {
    label: "النتيجة",
    value: "تحضير جاهز",
    caption: "مراجعة وتحميل الملف",
  },
];

const marqueeItems = [
  "تحضير الدروس",
  "الجدول الأسبوعي",
  "أوراق العمل",
  "الاختبارات",
  "المهام والواجبات",
  "تقارير الأداء",
];

const journeySteps = [
  {
    number: "01",
    title: "اختر المادة والصف",
    description:
      "ابدأ من المنهج الذي تدرّسه، وحدد المرحلة والمادة خلال ثوانٍ.",
    label: "المادة المختارة",
    value: "رياضيات · ثاني متوسط",
    icon: <SchoolRounded />,
  },
  {
    number: "02",
    title: "حدد الوحدة والدرس",
    description:
      "تظهر لك وحدات المنهج ودروسه بشكل واضح ومنظم بدون بحث طويل.",
    label: "الوحدة والدرس",
    value: "الأعداد النسبية · مقارنة الكسور",
    icon: <MenuBookRounded />,
  },
  {
    number: "03",
    title: "راجع محتوى التحضير",
    description:
      "تتكوّن الأهداف والتمهيد والاستراتيجيات والأنشطة والتقويم أمامك.",
    label: "عناصر التحضير",
    value: "5 عناصر مكتملة وقابلة للتعديل",
    icon: <EditNoteRounded />,
  },
  {
    number: "04",
    title: "حمّل وابدأ حصتك",
    description:
      "عدّل ما تحتاجه ثم حمّل الملف واحتفظ به داخل جدولك الأسبوعي.",
    label: "حالة التحضير",
    value: "جاهز للتحميل والمشاركة",
    icon: <DownloadRounded />,
  },
];

const toolTabs = [
  {
    key: "prepare",
    shortTitle: "حضّر",
    title: "تحضير متكامل يبدأ من درس واحد",
    description:
      "توليد خطة منظمة تشمل أهداف الدرس والتمهيد والاستراتيجيات والأنشطة وأساليب التقويم.",
    icon: <DescriptionRounded />,
    stats: [
      ["5", "عناصر أساسية"],
      ["دقائق", "بدلًا من ساعات"],
      ["مرن", "قابل للتعديل"],
    ],
    preview: "lesson",
  },
  {
    key: "organize",
    shortTitle: "نظّم",
    title: "جدول أسبوعي يرى يومك كما تراه أنت",
    description:
      "رتّب الحصص والتحضيرات والمهام في مساحة واحدة، واعرف ما يحتاج انتباهك قبل بداية اليوم.",
    icon: <ViewWeekRounded />,
    stats: [
      ["5", "أيام دراسية"],
      ["مرتب", "حسب الحصص"],
      ["واضح", "على كل الأجهزة"],
    ],
    preview: "schedule",
  },
  {
    key: "follow",
    shortTitle: "تابع",
    title: "المهام والواجبات تحت السيطرة",
    description:
      "تابع ما تم إنجازه وما يحتاج مراجعة، مع حالات واضحة لكل مهمة أو تحضير.",
    icon: <TaskAltRounded />,
    stats: [
      ["12", "مهمة هذا الأسبوع"],
      ["8", "تم إنجازها"],
      ["4", "قيد المتابعة"],
    ],
    preview: "tasks",
  },
  {
    key: "improve",
    shortTitle: "طوّر",
    title: "أرقام بسيطة تساعدك على التطور",
    description:
      "شاهد معدل إنجاز التحضيرات وانتظام الجدول وتوزيع المهام بدون تقارير معقدة.",
    icon: <InsightsRounded />,
    stats: [
      ["92%", "معدل الإنجاز"],
      ["+18%", "تحسن أسبوعي"],
      ["4.8", "تقييم التجربة"],
    ],
    preview: "analytics",
  },
];

const beforeItems = [
  "ملفات موزعة في أكثر من مكان",
  "بحث طويل قبل كل حصة",
  "تنسيق يدوي ومتكرر",
  "صعوبة متابعة ما تم إنجازه",
];

const afterItems = [
  "كل الأدوات في مساحة واحدة",
  "اختيار مباشر من المنهج",
  "تحضير منظم وقابل للتعديل",
  "جدول واضح وتقارير مختصرة",
];

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function NasaqLogo({ light = false }) {
  return (
    <Link
      to="/"
      className={`nasaq-logo ${light ? "nasaq-logo--light" : ""}`}
      aria-label="العودة إلى الصفحة الرئيسية"
    >
      <img
        className="nasaq-logo__image"
        src={nasaqLogo}
        alt="شعار منصة نَسّق"
      />
    </Link>
  );
}

function HeroPreparationFlow() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % preparationStages.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  const progress = ((activeStage + 1) / preparationStages.length) * 100;

  return (
    <motion.div
      className="hero-flow"
      initial={{ opacity: 0, scale: 0.94, y: 35 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.95, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="hero-flow__orbit hero-flow__orbit--one" />
      <span className="hero-flow__orbit hero-flow__orbit--two" />

      <div className="hero-flow__top">
        <div>
          <span>مسار التحضير الذكي</span>
          <strong>من اختيار الدرس إلى ملف جاهز</strong>
        </div>

        <div className="hero-flow__status">
          <AutoAwesomeRounded />
          يعمل الآن
        </div>
      </div>

      <div className="hero-flow__rail" aria-label="مراحل إعداد التحضير">
        {preparationStages.map((stage, index) => {
          const isDone = index < activeStage;
          const isActive = index === activeStage;

          return (
            <button
              type="button"
              key={stage.label}
              className={`hero-flow__stage ${
                isActive ? "is-active" : ""
              } ${isDone ? "is-done" : ""}`}
              onClick={() => setActiveStage(index)}
            >
              <span className="hero-flow__stage-number">
                {isDone ? <CheckCircleRounded /> : `0${index + 1}`}
              </span>

              <span>
                <small>{stage.label}</small>
                <strong>{stage.value}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="hero-flow__paper">
        <div className="hero-flow__paper-head">
          <div>
            <small>تحضير درس</small>
            <h3>الكسور الاعتيادية</h3>
          </div>

          <span>الصف الخامس الابتدائي</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            className="hero-flow__content"
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.35 }}
          >
            <span className="hero-flow__content-icon">
              {activeStage === 0 && <SchoolRounded />}
              {activeStage === 1 && <MenuBookRounded />}
              {activeStage === 2 && <EditNoteRounded />}
              {activeStage === 3 && <CheckCircleRounded />}
            </span>

            <div>
              <small>{preparationStages[activeStage].caption}</small>
              <strong>{preparationStages[activeStage].value}</strong>
              <p>
                {activeStage === 0 &&
                  "تم ربط التحضير بالمادة والمرحلة والخطة الدراسية المناسبة."}
                {activeStage === 1 &&
                  "تم اختيار الوحدة والدرس المطلوب من تسلسل المنهج."}
                {activeStage === 2 &&
                  "يتم الآن إعداد الأهداف والتمهيد والأنشطة وأساليب التقويم."}
                {activeStage === 3 &&
                  "اكتمل التحضير ويمكنك مراجعته وتعديله ثم تحميله."}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="hero-flow__lines">
          {[88, 72, 93, 62].map((width, index) => (
            <span
              key={width}
              style={{
                width: `${width}%`,
                animationDelay: `${index * 0.11}s`,
              }}
            />
          ))}
        </div>

        <div className="hero-flow__progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="hero-flow__footer">
          <span>
            المرحلة {activeStage + 1} من {preparationStages.length}
          </span>

          <strong>
            {activeStage === preparationStages.length - 1
              ? "جاهز للحصة"
              : "جاري الإعداد"}
          </strong>
        </div>
      </div>

      <motion.div
        className="hero-flow__stamp"
        animate={{
          rotate: activeStage === 3 ? -8 : -3,
          scale: activeStage === 3 ? 1.06 : 0.9,
          opacity: activeStage === 3 ? 1 : 0.45,
        }}
        transition={{ duration: 0.45 }}
      >
        جاهز
        <span>للحصة</span>
      </motion.div>
    </motion.div>
  );
}

function JourneyPreview({ activeIndex }) {
  const step = journeySteps[activeIndex];

  return (
    <div className="journey-preview">
      <div className="journey-preview__toolbar">
        <span />
        <span />
        <span />
        <small>wadq.sa / preparation</small>
      </div>

      <div className="journey-preview__body">
        <div className="journey-preview__sidebar">
          {[0, 1, 2, 3].map((item) => (
            <span
              key={item}
              className={item === activeIndex ? "is-active" : ""}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.number}
            className="journey-preview__main"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42 }}
          >
            <span className="journey-preview__icon">{step.icon}</span>
            <small>{step.label}</small>
            <h3>{step.value}</h3>

            <div className="journey-preview__blocks">
              <span />
              <span />
              <span />
            </div>

            <div className="journey-preview__action">
              {activeIndex === 3 ? <DownloadRounded /> : <AutoAwesomeRounded />}
              {activeIndex === 3 ? "تحميل التحضير" : "متابعة الخطوة"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolPreview({ type }) {
  if (type === "schedule") {
    return (
      <div className="tool-preview tool-preview--schedule">
        <div className="tool-preview__header">
          <div>
            <small>هذا الأسبوع</small>
            <strong>جدول الحصص</strong>
          </div>
          <CalendarMonthRounded />
        </div>

        <div className="schedule-grid">
          {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"].map(
            (day, index) => (
              <div key={day} className={index === 1 ? "is-active" : ""}>
                <small>{day}</small>
                <span>{index + 11}</span>
              </div>
            )
          )}
        </div>

        <div className="schedule-lessons">
          <span>
            <i>08:00</i>
            <strong>الرياضيات</strong>
            <small>تحضير جاهز</small>
          </span>
          <span>
            <i>09:30</i>
            <strong>العلوم</strong>
            <small>قيد المراجعة</small>
          </span>
          <span>
            <i>11:00</i>
            <strong>لغتي</strong>
            <small>تحضير جديد</small>
          </span>
        </div>
      </div>
    );
  }

  if (type === "tasks") {
    return (
      <div className="tool-preview tool-preview--tasks">
        <div className="tool-preview__header">
          <div>
            <small>المتابعة</small>
            <strong>مهام هذا الأسبوع</strong>
          </div>
          <TaskAltRounded />
        </div>

        {[
          ["مراجعة تحضير الرياضيات", "مكتملة", true],
          ["إضافة واجب العلوم", "اليوم", false],
          ["تحضير حصة اللغة العربية", "غدًا", false],
          ["تحديث الجدول الأسبوعي", "مكتملة", true],
        ].map(([title, status, done]) => (
          <div className={`task-row ${done ? "is-done" : ""}`} key={title}>
            <CheckCircleRounded />
            <span>
              <strong>{title}</strong>
              <small>{status}</small>
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "analytics") {
    return (
      <div className="tool-preview tool-preview--analytics">
        <div className="tool-preview__header">
          <div>
            <small>ملخص الأداء</small>
            <strong>تقدمك هذا الشهر</strong>
          </div>
          <TimelineRounded />
        </div>

        <div className="analytics-score">
          <span>
            <strong>92%</strong>
            <small>نسبة الإنجاز</small>
          </span>

          <div className="analytics-ring">
            <i />
          </div>
        </div>

        <div className="analytics-bars">
          {[68, 82, 72, 90, 78, 96, 88].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>

        <div className="analytics-labels">
          <span>الأحد</span>
          <span>الخميس</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-preview tool-preview--lesson">
      <div className="tool-preview__header">
        <div>
          <small>تحضير جديد</small>
          <strong>درس العمليات على الكسور</strong>
        </div>
        <DescriptionRounded />
      </div>

      {[
        ["أهداف الدرس", "3 أهداف تعليمية"],
        ["التمهيد", "سؤال تفاعلي وموقف حياتي"],
        ["استراتيجيات التدريس", "تعلم تعاوني وحل المشكلات"],
        ["التقويم", "أسئلة قصيرة وبطاقة خروج"],
      ].map(([title, detail], index) => (
        <div className="lesson-block" key={title}>
          <span>{`0${index + 1}`}</span>
          <div>
            <strong>{title}</strong>
            <small>{detail}</small>
          </div>
          <CheckCircleRounded />
        </div>
      ))}
    </div>
  );
}

const readStorageValue = (key, fallback = null) => {
  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  } catch {
    return fallback;
  }
};

const normalizeRole = (role) =>
  String(role || "")
    .replace(/^["']|["']$/g, "")
    .trim()
    .toUpperCase();

const getDashboardPath = (role) => {
  switch (normalizeRole(role)) {
    case "SUPER_ADMIN":
      return "/platform/dashboard";

    case "OWNER":
    case "SUPERVISOR":
    case "MANAGER":
      return "/school/dashboard";

    case "TEACHER":
      return "/teacher/dashboard";

    case "STUDENT":
      return "/student/dashboard";

    default:
      return "/";
  }
};

const getUserDisplayName = (user) => {
  const fullName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "مستخدم نَسّق";

  return String(fullName).trim();
};

function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const authUser = useAuthUser();
  const signOut = useSignOut();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeJourney, setActiveJourney] = useState(0);
  const [activeTool, setActiveTool] = useState("prepare");
  const [comparison, setComparison] = useState(56);

  const authenticated = isAuthenticated();

  const storedUser = readStorageValue("user", null);
  const storedRole = readStorageValue("role", "");

  const authData = authenticated ? authUser() : null;

  const currentUser =
    authData?.user ||
    authData ||
    storedUser ||
    null;

  const currentRole = normalizeRole(
    currentUser?.role ||
      authData?.role ||
      storedRole
  );

  const userName = getUserDisplayName(currentUser);
  const firstName = userName.split(/\s+/)[0] || "مستخدم نَسّق";
  const dashboardPath = getDashboardPath(currentRole);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const selectedTool = useMemo(
    () => toolTabs.find((tool) => tool.key === activeTool) ?? toolTabs[0],
    [activeTool]
  );

  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = (event) => {
    event?.preventDefault?.();

    signOut();

    window.localStorage.removeItem("user");
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("permissions");

    closeMenu();

    navigate("/", {
      replace: true,
    });
  };

  return (
    <div className="wadq-home">
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="site-header__inner">
          <NasaqLogo />

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`}>
            <a href="#journey" onClick={closeMenu}>
              كيف تعمل؟
            </a>
            <a href="#tools" onClick={closeMenu}>
              أدوات نَسّق
            </a>
            <a href="#difference" onClick={closeMenu}>
              الفرق
            </a>
            <a href="#about" onClick={closeMenu}>
              عن المنصة
            </a>

            <div className="site-nav__mobile-actions">
              {authenticated ? (
                <>
                  <Link to={dashboardPath} onClick={closeMenu}>
                    لوحة التحكم
                  </Link>

                  <Link to="/" onClick={handleSignOut}>
                    تسجيل الخروج
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu}>
                    تسجيل الدخول
                  </Link>

                  <Link to="/register" onClick={closeMenu}>
                    ابدأ الآن
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="site-header__actions">
            {authenticated ? (
              <>
                <Link
                  className="button button--ghost"
                  to="/"
                  onClick={handleSignOut}
                >
                  تسجيل الخروج
                </Link>

                <Link
                  className="button button--primary button--small"
                  to={dashboardPath}
                >
                  لوحة التحكم
                  <ArrowBackRounded />
                </Link>
              </>
            ) : (
              <>
                <Link className="button button--ghost" to="/login">
                  تسجيل الدخول
                </Link>

                <Link
                  className="button button--primary button--small"
                  to="/register"
                >
                  ابدأ الآن
                  <ArrowBackRounded />
                </Link>
              </>
            )}

            <button
              type="button"
              className="menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseRounded /> : <MenuRounded />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-section__noise" />
          <span className="hero-section__glow hero-section__glow--one" />
          <span className="hero-section__glow hero-section__glow--two" />
          <span className="hero-section__line hero-section__line--one" />
          <span className="hero-section__line hero-section__line--two" />

          <div className="page-container hero-section__content">
            <motion.div
              className="hero-copy"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.12,
                  },
                },
              }}
            >
              <motion.span className="eyebrow eyebrow--light" variants={reveal}>
                <AutoAwesomeRounded />
                {authenticated
                  ? `مرحبًا بعودتك يا ${firstName}`
                  : "تجربة تعليمية صُممت للمعلم السعودي"}
              </motion.span>

              <motion.h1 variants={reveal}>
                من فكرة الدرس
                <span>إلى حصة جاهزة للإبداع</span>
              </motion.h1>

              <motion.p variants={reveal}>
                نَسّق تجمع التحضير والتنظيم والمتابعة في رحلة واحدة واضحة،
                لتمنحك وقتًا أكبر للشرح وصناعة أثر حقيقي داخل الفصل.
              </motion.p>

              <motion.div className="hero-copy__actions" variants={reveal}>
                <Link
                  className="button button--gold"
                  to={authenticated ? dashboardPath : "/register"}
                >
                  {authenticated ? "الذهاب إلى لوحة التحكم" : "ابدأ مع نَسّق"}
                  <ArrowBackRounded />
                </Link>

                <a className="button button--outline-light" href="#journey">
                  اكتشف التجربة
                  <ArrowDownwardRounded />
                </a>
              </motion.div>

              <motion.div className="hero-copy__proof" variants={reveal}>
                <span>
                  <CheckCircleRounded />
                  متوافق مع رحلة المعلم
                </span>
                <span>
                  <CheckCircleRounded />
                  محتوى قابل للتعديل
                </span>
                <span>
                  <CheckCircleRounded />
                  واجهة عربية كاملة
                </span>
              </motion.div>
            </motion.div>

            <HeroPreparationFlow />
          </div>

          <div className="hero-section__curve" />
        </section>

        <section className="marquee-section" aria-label="أدوات المنصة">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item}-${index}`}>
                <i />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="journey" className="journey-section section-space">
          <div className="page-container">
            <motion.div
              className="section-heading section-heading--split"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
            >
              <div>
                <span className="eyebrow">
                  <TimelineRounded />
                  رحلة واضحة
                </span>
                <h2>
                  التحضير لا يحتاج
                  <span>خطوات معقدة</span>
                </h2>
              </div>

              <p>
                من أول اختيار المادة إلى تحميل التحضير، كل خطوة تظهر في وقتها
                وبشكل يساعدك على التركيز بدل التنقل بين ملفات وأدوات متعددة.
              </p>
            </motion.div>

            <div className="journey-layout">
              <div className="journey-steps">
                {journeySteps.map((step, index) => (
                  <motion.article
                    key={step.number}
                    className={`journey-step ${
                      activeJourney === index ? "is-active" : ""
                    }`}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{ duration: 0.55 }}
                    onViewportEnter={() => setActiveJourney(index)}
                    onMouseEnter={() => setActiveJourney(index)}
                    onClick={() => setActiveJourney(index)}
                  >
                    <span className="journey-step__number">{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                    <ArrowBackRounded />
                  </motion.article>
                ))}
              </div>

              <div className="journey-sticky">
                <JourneyPreview activeIndex={activeJourney} />

                <div className="journey-sticky__caption">
                  <span>الخطوة الحالية</span>
                  <strong>{journeySteps[activeJourney].title}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tools" className="tools-section section-space">
          <span className="tools-section__shape tools-section__shape--one" />
          <span className="tools-section__shape tools-section__shape--two" />

          <div className="page-container">
            <motion.div
              className="section-heading section-heading--light"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
            >
              <span className="eyebrow eyebrow--light">
                <AutoAwesomeRounded />
                أكثر من أداة في تجربة واحدة
              </span>
              <h2>
                نَسّق تعمل معك
                <span>قبل الحصة وبعدها</span>
              </h2>
              <p>
                اختر ما تريد إنجازه، وستتغير المساحة لتعرض لك الأداة المناسبة
                بدون ازدحام أو تشتيت.
              </p>
            </motion.div>

            <div className="tools-tabs" role="tablist">
              {toolTabs.map((tool) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTool === tool.key}
                  key={tool.key}
                  className={activeTool === tool.key ? "is-active" : ""}
                  onClick={() => setActiveTool(tool.key)}
                >
                  {tool.icon}
                  {tool.shortTitle}
                </button>
              ))}
            </div>

            <div className="tools-stage">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTool.key}
                  className="tools-stage__copy"
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.38 }}
                >
                  <span className="tools-stage__icon">{selectedTool.icon}</span>
                  <h3>{selectedTool.title}</h3>
                  <p>{selectedTool.description}</p>

                  <div className="tools-stage__stats">
                    {selectedTool.stats.map(([value, label]) => (
                      <span key={label}>
                        <strong>{value}</strong>
                        <small>{label}</small>
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTool.preview}
                  className="tools-stage__preview"
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.42 }}
                >
                  <ToolPreview type={selectedTool.preview} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section id="about" className="drop-section section-space">
          <div className="page-container drop-section__layout">
            <motion.div
              className="drop-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.8 }}
            >
              <span className="drop-visual__drop" />
              <span className="drop-visual__wave drop-visual__wave--one" />
              <span className="drop-visual__wave drop-visual__wave--two" />
              <span className="drop-visual__wave drop-visual__wave--three" />

              <div className="drop-visual__labels">
                <span>فكرة</span>
                <span>تحضير</span>
                <span>أثر</span>
              </div>
            </motion.div>

            <motion.div
              className="drop-copy"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={reveal}
            >
              <span className="eyebrow">
                <AutoAwesomeRounded />
                معنى يتحول إلى تجربة
              </span>

              <h2>
                كل فكرة تبدأ
                <span>بقطرة</span>
              </h2>

              <p>
                نَسّق هي المطر الهادئ الذي يترك أثره. ومن هنا صممنا المنصة:
                فكرة صغيرة تدخلها، فتتحول إلى تحضير واضح وحصة أكثر ثراءً وأثرًا.
              </p>

              <div className="drop-copy__features">
                <span>
                  <CheckCircleRounded />
                  تجربة هادئة وغير مزدحمة
                </span>
                <span>
                  <CheckCircleRounded />
                  خطوات مرتبطة بسياق المعلم
                </span>
                <span>
                  <CheckCircleRounded />
                  هوية عربية حديثة ومميزة
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="difference" className="comparison-section section-space">
          <div className="page-container">
            <motion.div
              className="section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
            >
              <span className="eyebrow">
                <TimelineRounded />
                فرق تشعر به من أول أسبوع
              </span>
              <h2>
                من تحضير مشتت
                <span>إلى يوم منظم</span>
              </h2>
              <p>
                حرّك المؤشر وشاهد كيف تجمع نَسّق الخطوات المتفرقة داخل رحلة
                واحدة.
              </p>
            </motion.div>

            <div
              className="comparison-card"
              style={{ "--comparison-position": `${comparison}%` }}
            >
              <div className="comparison-card__after">
                <div className="comparison-card__label">مع نَسّق</div>
                <div className="comparison-card__content">
                  <span className="comparison-card__icon comparison-card__icon--after">
                    <AutoAwesomeRounded />
                  </span>
                  <h3>كل شيء في مساره الصحيح</h3>

                  <div className="comparison-list">
                    {afterItems.map((item) => (
                      <span key={item}>
                        <CheckCircleRounded />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="comparison-card__before">
                <div className="comparison-card__label">قبل نَسّق</div>
                <div className="comparison-card__content">
                  <span className="comparison-card__icon">
                    <DescriptionRounded />
                  </span>
                  <h3>وقت كثير بين ملفات متفرقة</h3>

                  <div className="comparison-list comparison-list--before">
                    {beforeItems.map((item) => (
                      <span key={item}>
                        <i />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="12"
                max="88"
                value={comparison}
                onChange={(event) => setComparison(Number(event.target.value))}
                aria-label="المقارنة بين قبل وبعد استخدام ودق"
              />

              <div className="comparison-handle" aria-hidden="true">
                <ArrowBackRounded />
                <ArrowBackRounded />
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta__pattern" />

          <div className="page-container final-cta__inner">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={reveal}
            >
              <span className="eyebrow eyebrow--light">
                <AutoAwesomeRounded />
                حصتك القادمة تبدأ من هنا
              </span>

              <h2>
                دع التحضير علينا
                <span>وركّز أنت على أثر الحصة</span>
              </h2>

              <p>
                ابدأ أول تحضير، ونظّم أسبوعك، واجمع أدواتك التعليمية داخل
                تجربة واحدة صُممت لتناسب يوم المعلم.
              </p>

              <div className="final-cta__actions">
                {authenticated ? (
                  <>
                    <Link className="button button--gold" to={dashboardPath}>
                      افتح لوحة التحكم
                      <ArrowBackRounded />
                    </Link>

                    <Link
                      className="button button--outline-light"
                      to="/"
                      onClick={handleSignOut}
                    >
                      تسجيل الخروج
                    </Link>
                  </>
                ) : (
                  <>
                    <Link className="button button--gold" to="/register">
                      أنشئ حسابك
                      <ArrowBackRounded />
                    </Link>

                    <Link className="button button--outline-light" to="/login">
                      لدي حساب بالفعل
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              className="final-cta__papers"
              initial={{ opacity: 0, x: -45 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8 }}
            >
              <span className="final-paper final-paper--back" />
              <span className="final-paper final-paper--middle" />

              <div className="final-paper final-paper--front">
                <div className="final-paper__top">
                  <span>نَسّق</span>
                  <small>تحضير درس</small>
                </div>
                <strong>التغيرات في الأنظمة البيئية</strong>
                <i />
                <i />
                <i />
                <div>
                  <CheckCircleRounded />
                  جاهز للحصة
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-container site-footer__inner">
          <NasaqLogo />

          <div className="site-footer__links">
            <a href="#journey">كيف تعمل؟</a>
            <a href="#tools">الأدوات</a>
            <a href="#difference">الفرق</a>
          </div>

          <p>جميع الحقوق محفوظة لمنصة نَسّق © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
