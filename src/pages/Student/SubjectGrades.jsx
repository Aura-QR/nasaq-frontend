import { useMemo } from "react";

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardRounded,
  AssignmentRounded,
  BarChartRounded,
  EmojiEventsRounded,
  FactCheckRounded,
  MenuBookRounded,
  QuizRounded,
  SchoolRounded,
  TrendingUpRounded,
} from "@mui/icons-material";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Container from "@/components/Container/Container";
import {
  useGradesCriteria,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

const subjectFallback = {
  subjectName: "مادة دراسية",
  subjectCode: "",
  teacherName: "غير محدد",
  termLabel: "الفصل الدراسي",
};

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",
  blue: "#4e8dcc",
  blueLight: "#edf6ff",
  green: "#43a978",
  greenLight: "#eaf8f1",
  orange: "#e69a43",
  orangeLight: "#fff3e4",
  purple: "#8068c9",
  purpleLight: "#f3efff",
  pink: "#d77993",
  pinkLight: "#fff0f4",
};

const sectionConfigs = [
  {
    key: "final",
    label: "الاختبار النهائي",
    helperText: "الدرجة النهائية المعتمدة في المادة",
    entryLabel: "النتيجة النهائية",
    Icon: EmojiEventsRounded,
    color: COLORS.blue,
    background: COLORS.blueLight,
    border: "#d7e8fa",
  },
  {
    key: "activities",
    label: "الأنشطة",
    helperText: "الحضور والمشاركة والتفاعل",
    entryLabel: "النشاط الصفي",
    Icon: FactCheckRounded,
    color: COLORS.pink,
    background: COLORS.pinkLight,
    border: "#f1dce4",
  },
  {
    key: "assignments",
    label: "الواجبات",
    helperText: "متابعة أداء الطالب في الواجبات",
    entryLabel: "واجب",
    Icon: AssignmentRounded,
    color: COLORS.orange,
    background: COLORS.orangeLight,
    border: "#f3dfc4",
  },
  {
    key: "quizzes",
    label: "الاختبارات القصيرة",
    helperText: "نتائج التقييمات القصيرة",
    entryLabel: "اختبار قصير",
    Icon: QuizRounded,
    color: COLORS.green,
    background: COLORS.greenLight,
    border: "#d5ecdf",
  },
  {
    key: "projects",
    label: "المشاريع",
    helperText: "مستوى الإنجاز في المشاريع",
    entryLabel: "مشروع",
    Icon: BarChartRounded,
    color: COLORS.purple,
    background: COLORS.purpleLight,
    border: "#e3dcf8",
  },
];

const getPercentage = (grade, max) => {
  if (!max) return 0;
  return Math.min(100, Math.max(0, Math.round((grade / max) * 100)));
};

const getSubjectOfferingId = (item) => {
  if (!item) return "";

  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering ||
    null;

  if (typeof offering === "string") {
    return offering;
  }

  if (offering && typeof offering === "object") {
    return String(
      offering?._id ||
        offering?.id ||
        ""
    );
  }

  const looksLikeOffering =
    Boolean(item?.subjectId) &&
    Boolean(
      item?.termId ||
        item?.gradeLevelId ||
        item?.academicYearId
    );

  if (looksLikeOffering) {
    return String(
      item?._id ||
        item?.id ||
        ""
    );
  }

  return "";
};

const unwrapObject = (value) => {
  let current = value;

  for (let index = 0; index < 4; index += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      current?.data !== undefined
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
};

const getGradesBreakdown = (payload) => {
  const normalized = unwrapObject(payload);

  if (
    !normalized ||
    typeof normalized !== "object" ||
    Array.isArray(normalized)
  ) {
    return null;
  }

  const nested =
    normalized?.grades ||
    normalized?.breakdown ||
    normalized?.gradeBreakdown ||
    null;

  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested)
  ) {
    return nested;
  }

  const hasGradeSections = sectionConfigs.some(
    (section) =>
      normalized?.[section.key] !== undefined &&
      normalized?.[section.key] !== null
  );

  return hasGradeSections
    ? normalized
    : null;
};

const getCriteriaData = (criteria) => {
  const normalized = unwrapObject(criteria);

  if (Array.isArray(normalized)) {
    return normalized[0] || null;
  }

  if (
    normalized &&
    typeof normalized === "object"
  ) {
    return normalized;
  }

  return null;
};

const getCriteriaMax = (
  criteriaData,
  key
) => {
  const raw =
    criteriaData?.[key];

  if (
    raw === undefined ||
    raw === null
  ) {
    return 0;
  }

  if (typeof raw === "number") {
    return raw;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  if (
    typeof raw === "object"
  ) {
    const parsed = Number(
      raw?.total ??
        raw?.max ??
        raw?.weight ??
        raw?.percentage
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
};

const getTeacherName = (grades, selectedSubject) => {
  const teacher =
    grades?.teacher ||
    grades?.teacherId ||
    selectedSubject?.teacher ||
    selectedSubject?.teacherId ||
    selectedSubject?.subjectOfferingId?.teacher ||
    selectedSubject?.subjectOfferingId?.teacherId;

  if (!teacher) return subjectFallback.teacherName;
  if (typeof teacher === "string") return teacher;

  return (
    teacher?.name ||
    teacher?.fullName ||
    [teacher?.firstName, teacher?.fatherName, teacher?.familyName]
      .filter(Boolean)
      .join(" ") ||
    subjectFallback.teacherName
  );
};

const getSubjectName = (grades, selectedSubject) =>
  grades?.subject?.subjectName ||
  grades?.subject?.name ||
  selectedSubject?.subjectName ||
  selectedSubject?.name ||
  selectedSubject?.subjectId?.subjectName ||
  selectedSubject?.subjectId?.name ||
  selectedSubject?.subjectOfferingId?.subjectId?.subjectName ||
  selectedSubject?.subjectOfferingId?.subjectId?.name ||
  subjectFallback.subjectName;

const getSubjectCode = (grades, selectedSubject) =>
  grades?.subject?.subjectCode ||
  grades?.subject?.code ||
  selectedSubject?.subjectCode ||
  selectedSubject?.code ||
  selectedSubject?.subjectId?.subjectCode ||
  selectedSubject?.subjectId?.code ||
  selectedSubject?.subjectOfferingId?.subjectId?.subjectCode ||
  selectedSubject?.subjectOfferingId?.subjectId?.code ||
  subjectFallback.subjectCode;

const getTermLabel = (grades, selectedSubject) => {
  const term =
    grades?.term ||
    grades?.termId ||
    selectedSubject?.term ||
    selectedSubject?.termId ||
    selectedSubject?.subjectOfferingId?.term ||
    selectedSubject?.subjectOfferingId?.termId;

  if (typeof term === "string") {
    return grades?.academicYear || subjectFallback.termLabel;
  }

  return term?.name || term?.label || grades?.academicYear || subjectFallback.termLabel;
};

const SubjectGrades = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * Route id = subjectOfferingId.
   * MySubjects also sends it in navigation state as an extra safeguard.
   */
  const subjectOfferingId = String(
    location?.state?.subjectOfferingId ||
      id ||
      ""
  );

  const {
    subjects,
    loading: subjectsLoading,
  } = useStudentSubjects();

  const {
    grades,
    criteria,
    loading: gradesLoading,
  } = useGradesCriteria({
    subjectOfferingId,
  });

  const gradesData =
    useMemo(
      () =>
        getGradesBreakdown(
          grades
        ),
      [grades]
    );

  const criteriaData =
    useMemo(
      () =>
        getCriteriaData(
          criteria
        ),
      [criteria]
    );

  const subjectsList = useMemo(
    () =>
      Array.isArray(subjects)
        ? subjects
        : [],
    [subjects]
  );

  const selectedSubject = useMemo(
    () =>
      subjectsList.find(
        (subject) =>
          getSubjectOfferingId(
            subject
          ) ===
          subjectOfferingId
      ) ||
      location?.state?.subject ||
      null,
    [
      subjectsList,
      subjectOfferingId,
      location?.state?.subject,
    ]
  );

  const subjectDetails = {
    subjectName: getSubjectName(
      unwrapObject(grades) ||
        criteriaData,
      selectedSubject
    ),
    subjectCode: getSubjectCode(
      unwrapObject(grades) ||
        criteriaData,
      selectedSubject
    ),
    teacherName: getTeacherName(
      unwrapObject(grades) ||
        criteriaData,
      selectedSubject
    ),
    termLabel: getTermLabel(
      unwrapObject(grades) ||
        criteriaData,
      selectedSubject
    ),
  };

  const sectionSummaries =
    useMemo(() => {
      if (!gradesData) {
        return [];
      }

      return sectionConfigs
        .map((section) => {
          const rawValue =
            gradesData?.[section.key];

          /*
           * لو الـ API لم يرجع القسم أصلًا،
           * لا ننشئ 0/0 من عندنا.
           */
          if (
            rawValue === undefined ||
            rawValue === null
          ) {
            return null;
          }

          const rawEntries =
            Array.isArray(rawValue)
              ? rawValue
              : [rawValue];

          const entries =
            rawEntries
              .map(
                (entry, index) => {
                  if (
                    entry === null ||
                    entry === undefined
                  ) {
                    return null;
                  }

                  const entryObject =
                    typeof entry ===
                    "object"
                      ? entry
                      : {
                          grade:
                            entry,
                        };

                  const grade =
                    Number(
                      entryObject
                        ?.grade ??
                        entryObject
                          ?.score ??
                        entryObject
                          ?.value ??
                        0
                    ) || 0;

                  const explicitMax =
                    Number(
                      entryObject
                        ?.total ??
                        entryObject
                          ?.max ??
                        entryObject
                          ?.maxGrade
                    );

                  const criteriaMax =
                    getCriteriaMax(
                      criteriaData,
                      section.key
                    );

                  const max =
                    Number.isFinite(
                      explicitMax
                    ) &&
                    explicitMax > 0
                      ? explicitMax
                      : criteriaMax;

                  return {
                    grade,
                    max,

                    title:
                      Array.isArray(
                        rawValue
                      )
                        ? entryObject
                            ?.title ||
                          entryObject
                            ?.name ||
                          `${section.entryLabel} ${
                            entryObject
                              ?.number ||
                            index + 1
                          }`
                        : section.entryLabel,

                    percentage:
                      getPercentage(
                        grade,
                        max
                      ),
                  };
                }
              )
              .filter(Boolean);

          if (
            entries.length === 0
          ) {
            return null;
          }

          const totals =
            entries.reduce(
              (
                summary,
                entry
              ) => ({
                grade:
                  summary.grade +
                  entry.grade,

                max:
                  summary.max +
                  entry.max,
              }),
              {
                grade: 0,
                max: 0,
              }
            );

          return {
            ...section,
            entries,

            totalGrade:
              totals.grade,

            totalMax:
              totals.max,

            percentage:
              getPercentage(
                totals.grade,
                totals.max
              ),
          };
        })
        .filter(Boolean);
    }, [
      gradesData,
      criteriaData,
    ]);

  const overallSummary =
    useMemo(() => {
      return sectionSummaries.reduce(
        (
          summary,
          section
        ) => ({
          grade:
            summary.grade +
            section.totalGrade,

          max:
            summary.max +
            section.totalMax,

          items:
            summary.items +
            section.entries.length,
        }),
        {
          grade: 0,
          max: 0,
          items: 0,
        }
      );
    }, [sectionSummaries]);

  const overallPercentage =
    getPercentage(
      overallSummary.grade,
      overallSummary.max
    );

  const visibleSections =
    sectionSummaries;

  const hasGrades =
    visibleSections.length > 0;

  const loading =
    subjectsLoading ||
    gradesLoading;

  if (loading) {
    return (
      <Container noSidebar={true}>
        <Paper
          elevation={0}
          sx={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",
            border:
              "1px solid rgba(18,47,77,.055)",
          }}
        >
          <Stack
            alignItems="center"
            spacing={1}
          >
            <CircularProgress
              size={34}
            />

            <Typography
              sx={{
                color: "#8f9aa4",
                fontSize: "9px",
              }}
            >
              جاري تحميل بيانات الدرجات...
            </Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container noSidebar={true}>
      <Box dir="rtl" sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            mb: 1.6,
            px: { xs: 1.5, sm: 2, md: 2.4 },
            py: { xs: 1.4, md: 1.7 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "20px",
            border: "1px solid rgba(18,47,77,.055)",
            background: "linear-gradient(120deg,#ffffff,#fbfdff)",
            boxShadow: "0 8px 24px rgba(18,47,77,.04)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() => navigate("/student-dashboard/subjects")}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                color: COLORS.navy,
                backgroundColor: "#f2f6fa",
                border: "1px solid rgba(36,74,112,.06)",
                "&:hover": { backgroundColor: "#e8f0f7" },
              }}
            >
              <ArrowForwardRounded />
            </IconButton>

            <Box
              sx={{
                width: 43,
                height: 43,
                display: { xs: "none", sm: "grid" },
                placeItems: "center",
                borderRadius: "13px",
                color: COLORS.blue,
                backgroundColor: COLORS.blueLight,
              }}
            >
              <TrendingUpRounded sx={{ fontSize: 21 }} />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color: COLORS.deepNavy,
                  fontSize: { xs: "17px", md: "20px" },
                  fontWeight: 900,
                }}
              >
                درجاتي
              </Typography>

              <Typography sx={{ mt: 0.1, color: "#909ba6", fontSize: "9px" }}>
                تابع مستواك ودرجاتك في المادة
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            mb: 1.5,
            p: { xs: 1.7, md: 2.2 },
            minHeight: { xs: 180, md: 170 },
            display: "flex",
            alignItems: "center",
            borderRadius: "23px",
            border: "1px solid rgba(78,141,204,.18)",
            background:
              "linear-gradient(120deg,#eef6ff 0%,#f9fcff 58%,#fff8ea 100%)",
            boxShadow: "0 10px 28px rgba(18,47,77,.045)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 150,
              height: 150,
              right: -70,
              bottom: -90,
              borderRadius: "50%",
              backgroundColor: "rgba(78,141,204,.08)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              width: 120,
              height: 120,
              left: -55,
              top: -70,
              borderRadius: "50%",
              backgroundColor: "rgba(211,164,79,.09)",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ position: "relative", zIndex: 1, width: "100%" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1.1}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    borderRadius: "16px",
                    color: COLORS.blue,
                    backgroundColor: "#fff",
                    border: "1px solid rgba(78,141,204,.14)",
                  }}
                >
                  <MenuBookRounded sx={{ fontSize: 25 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.6 }}>
                    {subjectDetails.subjectCode && (
                      <Chip
                        label={subjectDetails.subjectCode}
                        size="small"
                        sx={{
                          height: 24,
                          color: "#fff",
                          backgroundColor: COLORS.blue,
                          fontSize: "8px",
                          fontWeight: 900,
                        }}
                      />
                    )}

                    <Chip
                      label={hasGrades ? "بيانات الدرجات" : "لا توجد درجات بعد"}
                      size="small"
                      sx={{
                        height: 24,
                        color: hasGrades ? COLORS.green : COLORS.orange,
                        backgroundColor: hasGrades
                          ? COLORS.greenLight
                          : COLORS.orangeLight,
                        fontSize: "8px",
                        fontWeight: 900,
                      }}
                    />
                  </Stack>

                  <Typography
                    noWrap
                    sx={{
                      color: COLORS.deepNavy,
                      fontSize: { xs: "21px", md: "26px" },
                      lineHeight: 1.2,
                      fontWeight: 900,
                    }}
                  >
                    {subjectDetails.subjectName}
                  </Typography>

                  <Typography sx={{ mt: 0.35, color: "#87939e", fontSize: "9px" }}>
                    ملخص واضح لدرجاتك وتقدمك في المادة
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" sx={{ mt: 1.4, flexWrap: "wrap", gap: 0.7 }}>
                <InfoChip icon={SchoolRounded} label={subjectDetails.termLabel} />
                <InfoChip
                  icon={MenuBookRounded}
                  label={`المعلم: ${subjectDetails.teacherName}`}
                />
                <InfoChip
                  icon={FactCheckRounded}
                  label={`${overallSummary.items} عناصر تقييم`}
                />
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", md: 235 },
                p: 1.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.3,
                borderRadius: "19px",
                backgroundColor: "rgba(255,255,255,.88)",
                border: "1px solid rgba(36,74,112,.06)",
              }}
            >
              <Box>
                <Typography sx={{ color: "#8b97a2", fontSize: "8px", fontWeight: 700 }}>
                  تقدمك الحالي
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    color: COLORS.deepNavy,
                    fontSize: "22px",
                    fontWeight: 900,
                  }}
                >
                  {hasGrades ? `${overallSummary.grade} / ${overallSummary.max}` : "—"}
                </Typography>

                <Typography sx={{ mt: 0.15, color: "#98a2ac", fontSize: "8px" }}>
                  مجموع الدرجات الحالية
                </Typography>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  width: 72,
                  height: 72,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={72}
                  thickness={4}
                  sx={{ position: "absolute", color: "#e8eef3" }}
                />

                <CircularProgress
                  variant="determinate"
                  value={hasGrades ? overallPercentage : 0}
                  size={72}
                  thickness={4}
                  sx={{ position: "absolute", color: COLORS.blue }}
                />

                <Typography
                  sx={{ color: COLORS.deepNavy, fontSize: "15px", fontWeight: 900 }}
                >
                  {hasGrades ? `${overallPercentage}%` : "—"}
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3,minmax(0,1fr))",
            },
            gap: 1,
            mb: 1.7,
          }}
        >
          <SummaryCard
            label="الدرجة الحالية"
            value={hasGrades ? `${overallSummary.grade}/${overallSummary.max}` : "—"}
            note="مجموع درجاتك في المادة"
            Icon={SchoolRounded}
            color={COLORS.green}
            background={COLORS.greenLight}
          />

          <SummaryCard
            label="النسبة الكلية"
            value={hasGrades ? `${overallPercentage}%` : "—"}
            note="أداؤك في عناصر التقييم"
            Icon={TrendingUpRounded}
            color={COLORS.blue}
            background={COLORS.blueLight}
          />

          <SummaryCard
            label="عناصر التقييم"
            value={hasGrades ? overallSummary.items : "—"}
            note="عدد العناصر المسجلة"
            Icon={FactCheckRounded}
            color={COLORS.orange}
            background={COLORS.orangeLight}
          />
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography
              sx={{
                color: COLORS.deepNavy,
                fontSize: { xs: "14px", md: "16px" },
                fontWeight: 900,
              }}
            >
              تفاصيل الدرجات
            </Typography>

            <Typography sx={{ mt: 0.1, color: "#98a2ac", fontSize: "8px" }}>
              تفاصيل كل عنصر تقييم في المادة
            </Typography>
          </Box>

          <Chip
            label={hasGrades ? `${visibleSections.length} أقسام` : "لا توجد درجات"}
            size="small"
            sx={{
              height: 27,
              color: COLORS.navy,
              backgroundColor: "#f3f6f9",
              fontSize: "8px",
              fontWeight: 800,
            }}
          />
        </Stack>

        {hasGrades ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2,minmax(0,1fr))",
              },
              gap: 1.1,
            }}
          >
            {visibleSections.map((section) => (
              <GradeSectionCard
                key={section.key}
                section={section}
              />
            ))}
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              minHeight: 190,
              px: 2,
              py: 4,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              borderRadius: "20px",
              border: "1px dashed rgba(36,74,112,.14)",
              background:
                "linear-gradient(145deg,#ffffff,#f8fbfd)",
            }}
          >
            <Box>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 1.2,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "18px",
                  color: COLORS.orange,
                  backgroundColor:
                    COLORS.orangeLight,
                }}
              >
                <FactCheckRounded
                  sx={{ fontSize: 30 }}
                />
              </Box>

              <Typography
                sx={{
                  color: COLORS.deepNavy,
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                لا توجد درجات مسجلة لهذه المادة
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color: "#929da7",
                  fontSize: "9px",
                }}
              >
                ستظهر الدرجات هنا فور تسجيلها في النظام.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

const InfoChip = ({ icon: Icon, label }) => (
  <Chip
    icon={<Icon />}
    label={label}
    sx={{
      height: 31,
      color: COLORS.navy,
      backgroundColor: "rgba(255,255,255,.82)",
      border: "1px solid rgba(36,74,112,.06)",
      fontSize: "8px",
      fontWeight: 800,
      "& .MuiChip-icon": {
        color: COLORS.gold,
        fontSize: "15px",
      },
    }}
  />
);

const SummaryCard = ({ label, value, note, Icon, color, background }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.3,
      display: "flex",
      alignItems: "center",
      gap: 1,
      borderRadius: "16px",
      border: "1px solid rgba(18,47,77,.05)",
      backgroundColor: "#fff",
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        borderRadius: "12px",
        color,
        backgroundColor: background,
      }}
    >
      <Icon sx={{ fontSize: 21 }} />
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: COLORS.deepNavy,
          fontSize: "17px",
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        {value}
      </Typography>

      <Typography sx={{ mt: 0.4, color: "#7f8b96", fontSize: "8px", fontWeight: 800 }}>
        {label}
      </Typography>

      <Typography noWrap sx={{ mt: 0.1, color: "#a0a9b1", fontSize: "7px" }}>
        {note}
      </Typography>
    </Box>
  </Paper>
);

const GradeSectionCard = ({ section }) => {
  const Icon = section.Icon;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "19px",
        border: `1px solid ${section.border}`,
        backgroundColor: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack direction="row" alignItems="center" spacing={0.9} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              borderRadius: "13px",
              color: section.color,
              backgroundColor: section.background,
            }}
          >
            <Icon sx={{ fontSize: 21 }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{ color: COLORS.deepNavy, fontSize: "11px", fontWeight: 900 }}
            >
              {section.label}
            </Typography>

            <Typography noWrap sx={{ mt: 0.15, color: "#929da7", fontSize: "7.5px" }}>
              {section.helperText}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={`${section.percentage}%`}
          size="small"
          sx={{
            height: 26,
            color: section.color,
            backgroundColor: section.background,
            fontSize: "8px",
            fontWeight: 900,
          }}
        />
      </Stack>

      <Box sx={{ mt: 1.3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 0.5 }}
        >
          <Typography sx={{ color: "#929da7", fontSize: "7.5px" }}>
            الدرجة الحالية
          </Typography>

          <Typography sx={{ color: COLORS.deepNavy, fontSize: "8px", fontWeight: 900 }}>
            {section.totalGrade} / {section.totalMax}
          </Typography>
        </Stack>

        <Box
          sx={{
            height: 7,
            overflow: "hidden",
            borderRadius: "20px",
            backgroundColor: "#eef1f4",
          }}
        >
          <Box
            sx={{
              width: `${section.percentage}%`,
              height: "100%",
              borderRadius: "20px",
              backgroundColor: section.color,
              transition: "width .3s ease",
            }}
          />
        </Box>
      </Box>

      <Stack spacing={0.7} sx={{ mt: 1.2 }}>
        {section.entries.map((entry, index) => (
          <Box
            key={`${entry.title}-${index}`}
            sx={{
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderRadius: "12px",
              backgroundColor: "#f8fafb",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ color: COLORS.deepNavy, fontSize: "8.5px", fontWeight: 800 }}
              >
                {entry.title}
              </Typography>

              <Typography sx={{ mt: 0.15, color: "#9aa4ae", fontSize: "7px" }}>
                الدرجة {entry.grade} من {entry.max}
              </Typography>
            </Box>

            <Typography
              sx={{
                minWidth: 40,
                color: section.color,
                textAlign: "left",
                fontSize: "9px",
                fontWeight: 900,
              }}
            >
              {entry.percentage}%
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default SubjectGrades;
