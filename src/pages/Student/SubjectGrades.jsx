import { useMemo } from "react";
import {
  Assignment,
  BarChart,
  EmojiEvents,
  FactCheck,
  MenuBook,
  Quiz,
  School,
  TrendingUp,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import SUBJECT_PALETTES from "@/utils/constants/SubjectPalettes";
import { useGradesCriteria, useStudentSubjects } from "@/utils/hooks/apis/student/useStudent";

const subjectFallback = {
  subjectName: "الرياضيات",
  subjectCode: "MATH-01",
  teacherName: "أ. سارة خالد",
  termLabel: "الفصل الدراسي الثاني",
};

const sectionConfigs = [
  {
    key: "final",
    label: "الاختبار النهائي",
    helperText: "يوضح الدرجة النهائية المعتمدة في المادة.",
    entryLabel: "النتيجة النهائية",
    Icon: EmojiEvents,
    accent: "text-[#318dce]",
    softBg: "bg-[#EEF5FF]",
    border: "border-[#BCD7FF]",
    fill: "bg-[#318dce]",
  },
  {
    key: "activities",
    label: "الأنشطة",
    helperText: "الحضور والمشاركة والتفاعل المستمر.",
    entryLabel: "النشاط الصفي",
    Icon: FactCheck,
    accent: "text-pink-600",
    softBg: "bg-pink-50",
    border: "border-pink-200",
    fill: "bg-pink-500",
  },
  {
    key: "assignments",
    label: "الواجبات",
    helperText: "متابعة أداء الطالب في الواجبات المطلوبة.",
    entryLabel: "واجب",
    Icon: Assignment,
    accent: "text-amber-600",
    softBg: "bg-amber-50",
    border: "border-amber-200",
    fill: "bg-amber-500",
  },
  {
    key: "quizzes",
    label: "الكويزات",
    helperText: "نتائج التقييمات القصيرة أثناء الفصل.",
    entryLabel: "كويز",
    Icon: Quiz,
    accent: "text-emerald-600",
    softBg: "bg-emerald-50",
    border: "border-emerald-200",
    fill: "bg-emerald-500",
  },
  {
    key: "projects",
    label: "المشاريع",
    helperText: "مستوى الإنجاز في المشاريع العملية للمادة.",
    entryLabel: "مشروع",
    Icon: BarChart,
    accent: "text-indigo-600",
    softBg: "bg-indigo-50",
    border: "border-indigo-200",
    fill: "bg-indigo-500",
  },
];

const getPercentage = (grade, max) => {
  if (!max) return 0;
  return Math.round((grade / max) * 100);
};

const SubjectGrades = () => {
  const { id } = useParams();
  const { subjects } = useStudentSubjects();
  const { grades } = useGradesCriteria({ subjectId: id });
  const gradesData = grades?.grades || null;
  console.log(gradesData)

  const subjectsList = useMemo(
    () => subjects || [],
    [subjects]
  );

  const selectedSubject = useMemo(
    () => subjectsList.find((subject) => subject?._id === id),
    [subjectsList, id]
  );

  const subjectIndex = useMemo(
    () => subjectsList.findIndex((subject) => subject?._id === id),
    [subjectsList, id]
  );

  const palette =
    subjectIndex >= 0
      ? SUBJECT_PALETTES[subjectIndex % SUBJECT_PALETTES.length]
      : SUBJECT_PALETTES[0];

  const subjectDetails = {
    subjectName:
      grades?.subject?.subjectName ||
      selectedSubject?.subjectName ||
      subjectFallback.subjectName,
    subjectCode:
      grades?.subject?.subjectCode ||
      selectedSubject?.subjectCode ||
      subjectFallback.subjectCode,
    teacherName: subjectFallback.teacherName,
    termLabel: grades?.academicYear || subjectFallback.termLabel,
  };

  const hasBackendGrades = Boolean(gradesData);

  const sectionSummaries = useMemo(() => {
    return sectionConfigs.map((section) => {
      const rawValue = gradesData?.[section.key];
      const fallbackValue =
        section.key === "final" || section.key === "activities"
          ? { grade: 0, total: 0 }
          : [];
      const resolvedValue = rawValue ?? fallbackValue;
      const rawEntries = Array.isArray(resolvedValue)
        ? resolvedValue
        : [resolvedValue];
      const entries = rawEntries.map((entry, index) => ({
        grade: Number(entry?.grade) || 0,
        max: Number(entry?.total ?? entry?.max) || 0,
        title: Array.isArray(resolvedValue)
          ? `${section.entryLabel} ${entry?.number || index + 1}`
          : section.entryLabel,
        percentage: getPercentage(
          Number(entry?.grade) || 0,
          Number(entry?.total ?? entry?.max) || 0
        ),
      }));

      const totals = entries.reduce(
        (summary, entry) => ({
          grade: summary.grade + entry.grade,
          max: summary.max + entry.max,
        }),
        { grade: 0, max: 0 }
      );

      return {
        ...section,
        entries,
        totalGrade: totals.grade,
        totalMax: totals.max,
        percentage: getPercentage(totals.grade, totals.max),
      };
    });
  }, [gradesData]);

  const overallSummary = useMemo(() => {
    return sectionSummaries.reduce(
      (summary, section) => ({
        grade: summary.grade + section.totalGrade,
        max: summary.max + section.totalMax,
        items: summary.items + section.entries.length,
      }),
      { grade: 0, max: 0, items: 0 }
    );
  }, [sectionSummaries]);

  const bestSection = useMemo(() => {
    return sectionSummaries.reduce((best, section) => {
      if (!best || section.percentage > best.percentage) {
        return section;
      }
      return best;
    }, null);
  }, [sectionSummaries]);

  const overallPercentage = getPercentage(overallSummary.grade, overallSummary.max);

  const summaryCards = [
    {
      label: "النسبة الكلية",
      value: `${overallPercentage}%`,
      note: "أداء الطالب في جميع عناصر التقييم",
      Icon: TrendingUp,
      accent: "text-[#318dce]",
      softBg: "bg-[#EEF5FF]",
      border: "border-[#BCD7FF]",
    },
    {
      label: "الدرجة المحصّلة",
      value: `${overallSummary.grade}/${overallSummary.max}`,
      note: "مجموع الدرجات الحالية في المادة",
      Icon: School,
      accent: "text-emerald-600",
      softBg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "عناصر التقييم",
      value: overallSummary.items,
      note: "عدد الدرجات المعروضة في هذا العرض",
      Icon: FactCheck,
      accent: "text-amber-600",
      softBg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "أفضل قسم",
      value: bestSection?.label || "-",
      note: bestSection ? `${bestSection.percentage}%` : "-",
      Icon: EmojiEvents,
      accent: "text-pink-600",
      softBg: "bg-pink-50",
      border: "border-pink-200",
    },
  ];

  return (
    <Container noSidebar={true}>
      <Back title={"درجاتي"} />

      <div className="mt-4 min-h-[calc(100vh-200px)] space-y-4 sm:mt-6 sm:space-y-6">
        <div className={`relative overflow-hidden rounded-[24px] border ${palette.border} ${palette.bg} p-4 shadow-sm sm:rounded-[28px] sm:p-6`}>
          <span className={`pointer-events-none absolute -top-10 left-2 h-24 w-24 rounded-full ${palette.badge} opacity-10 sm:left-6 sm:h-32 sm:w-32`} />
          <span className={`pointer-events-none absolute -bottom-10 right-2 h-28 w-28 rounded-full ${palette.badge} opacity-10 sm:-bottom-14 sm:right-10 sm:h-40 sm:w-40`} />

          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#318dce] shadow-sm sm:px-4 sm:text-sm">
                  {hasBackendGrades ? "بيانات فعلية" : "بيانات تجريبية"}
                </span>
                {subjectDetails.subjectCode && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white sm:px-4 sm:text-sm ${palette.badge}`}>
                    {subjectDetails.subjectCode}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm sm:h-16 sm:w-16 sm:rounded-3xl">
                  <MenuBook className={`text-[28px] sm:text-3xl ${palette.icon}`} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold leading-tight text-[#1E293B] sm:text-3xl">{subjectDetails.subjectName}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:leading-7">
                    عرض واضح لكل درجات المادة بحيث يقدر الطالب يفهم مستوى أدائه بسرعة ويعرف أين يحتاج يركز أكثر.
                  </p>

                  <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-3">
                    <span className="rounded-full border border-white/70 bg-white px-4 py-2 text-center shadow-sm sm:text-right">
                      {subjectDetails.termLabel}
                    </span>
                    <span className="rounded-full border border-white/70 bg-white px-4 py-2 text-center shadow-sm sm:text-right">
                      المعلم: {subjectDetails.teacherName}
                    </span>
                    <span className="rounded-full border border-white/70 bg-white px-4 py-2 text-center shadow-sm sm:text-right">
                      {overallSummary.items} عناصر تقييم
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:rounded-[24px] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-500">المعدل الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1E293B] sm:text-4xl">{overallPercentage}%</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${palette.bg} border ${palette.border} sm:h-14 sm:w-14`}>
                  <TrendingUp className={`text-[26px] sm:text-3xl ${palette.icon}`} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-500">
                  <span>التقدم في المادة</span>
                  <span>{overallSummary.grade} من {overallSummary.max}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${palette.badge}`} style={{ width: `${overallPercentage}%` }} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">أقوى نتيجة</p>
                  <p className="mt-2 text-sm font-bold text-[#1E293B]">{bestSection?.label || "-"}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">أعلى نسبة</p>
                  <p className="mt-2 text-sm font-bold text-[#1E293B]">{bestSection ? `${bestSection.percentage}%` : "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-[24px] border ${card.border} ${card.softBg} p-4 shadow-sm sm:rounded-3xl sm:p-5`}>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">{card.label}</p>
                  <p className="mt-2 text-xl font-bold text-[#1E293B] break-words sm:mt-3 sm:text-2xl">{card.value}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">{card.note}</p>
                </div>
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${card.border} bg-white sm:h-12 sm:w-12`}>
                  <card.Icon className={`text-2xl ${card.accent}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
          {sectionSummaries.map((section) => (
            <div key={section.key} className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[26px] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${section.border} ${section.softBg} sm:h-12 sm:w-12`}>
                    <section.Icon className={`text-2xl ${section.accent}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E293B]">{section.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-500">{section.helperText}</p>
                  </div>
                </div>

                <div className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${section.softBg} ${section.accent}`}>
                  {section.percentage}%
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">الدرجة الحالية</p>
                  <p className="mt-2 text-lg font-bold text-[#1E293B]">{section.totalGrade}/{section.totalMax}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">عدد العناصر</p>
                  <p className="mt-2 text-lg font-bold text-[#1E293B]">{section.entries.length}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {section.entries.map((entry) => (
                  <div key={entry.title} className={`rounded-2xl border ${section.border} bg-white p-4`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1E293B]">{entry.title}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500">الدرجة: {entry.grade} من {entry.max}</p>
                      </div>
                      <div className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${section.softBg} ${section.accent}`}>
                        {entry.percentage}%
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${section.fill}`} style={{ width: `${entry.percentage}%` }} />
                    </div>

                    <div className="mt-3 flex flex-col gap-1 text-xs font-medium text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>الدرجة المحصّلة: {entry.grade}</span>
                      <span>الحد الأعلى: {entry.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default SubjectGrades;