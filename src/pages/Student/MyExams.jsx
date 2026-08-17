import {
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccessTimeRounded,
  ArrowForwardRounded,
  AssignmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ErrorOutlineRounded,
  EventAvailableRounded,
  HourglassBottomRounded,
  MenuBookRounded,
  SchoolRounded,
  TimerRounded,
  TuneRounded,
} from "@mui/icons-material";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import {
  useStudentExams,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  purple: "#8068c9",
  purpleLight: "#f3efff",

  orange: "#e69a43",
  orangeLight: "#fff3e4",

  green: "#43a978",
  greenLight: "#eaf8f1",

  red: "#d76760",
  redLight: "#fff0ef",

  gray: "#84919d",
  grayLight: "#f5f7f9",
};

const STATUS_UI = {
  pending: {
    label: "متاح الآن",
    color: COLORS.orange,
    background: COLORS.orangeLight,
    icon: EventAvailableRounded,
  },

  upcoming: {
    label: "لم يبدأ بعد",
    color: COLORS.blue,
    background: COLORS.blueLight,
    icon: HourglassBottomRounded,
  },

  completed: {
    label: "مكتمل",
    color: COLORS.green,
    background: COLORS.greenLight,
    icon: CheckCircleRounded,
  },

  overdue: {
    label: "منتهي",
    color: COLORS.red,
    background: COLORS.redLight,
    icon: ErrorOutlineRounded,
  },
};

// =====================================================
// HELPERS
// =====================================================

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const getExamSubject = (exam) => {
  const offeringFromCriteria =
    exam?.gradesCriteria
      ?.subjectOfferingId ||
    exam?.gradesCriteria
      ?.subjectOffering;

  const offering =
    exam?.subjectOffering ||
    exam?.subjectOfferingId ||
    offeringFromCriteria;

  return (
    offering?.subjectId ||
    offering?.subject ||
    exam?.gradesCriteria?.subjectId ||
    exam?.subjectId ||
    exam?.subject ||
    null
  );
};

const getSubjectId = (exam) =>
  normalizeId(
    getExamSubject(exam)
  );

const getSubjectName = (exam) => {
  const subject =
    getExamSubject(exam);

  return (
    subject?.subjectName ||
    subject?.name ||
    exam?.subjectName ||
    exam?.gradesCriteria
      ?.subjectName ||
    "مادة غير معروفة"
  );
};

const getStudentExamStatus = (exam) => {
  if (exam?.hasTaken) {
    return "completed";
  }

  const apiStatus = String(
    exam?.status || ""
  ).toLowerCase();

  if (
    [
      "expired",
      "ended",
      "overdue",
    ].includes(apiStatus)
  ) {
    return "overdue";
  }

  if (
    [
      "available",
      "active",
    ].includes(apiStatus)
  ) {
    return "pending";
  }

  if (
    [
      "upcoming",
      "not_started",
    ].includes(apiStatus)
  ) {
    return "upcoming";
  }

  const now = new Date();

  const startDate =
    exam?.startDate
      ? new Date(
          exam.startDate
        )
      : null;

  const endDate =
    exam?.endDate
      ? new Date(
          exam.endDate
        )
      : null;

  if (
    startDate &&
    !Number.isNaN(
      startDate.getTime()
    ) &&
    now < startDate
  ) {
    return "upcoming";
  }

  if (
    endDate &&
    !Number.isNaN(
      endDate.getTime()
    ) &&
    now > endDate
  ) {
    return "overdue";
  }

  if (
    startDate &&
    endDate &&
    !Number.isNaN(
      startDate.getTime()
    ) &&
    !Number.isNaN(
      endDate.getTime()
    ) &&
    now >= startDate &&
    now <= endDate
  ) {
    return "pending";
  }

  return "upcoming";
};

const formatDate = (value) => {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const getSubjectEntity = (item) => {
  if (!item) {
    return null;
  }

  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering ||
    null;

  if (
    typeof offering === "object" &&
    offering
  ) {
    return (
      offering?.subjectId ||
      offering?.subject ||
      offering
    );
  }

  return (
    item?.subjectId ||
    item?.subject ||
    item
  );
};

const getStudentSubjectId = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  return (
    normalizeId(subject) ||
    normalizeId(item)
  );
};

const getStudentSubjectName = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectName ||
      item?.name ||
      "مادة"
    );
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    item?.name ||
    "مادة"
  );
};

const getStudentSubjectCode = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectCode ||
      item?.code ||
      ""
    );
  }

  return (
    subject?.subjectCode ||
    subject?.code ||
    item?.subjectCode ||
    item?.code ||
    ""
  );
};

const getClassName = (
  studentProfile
) => {
  const classData =
    studentProfile?.classId ||
    studentProfile?.class ||
    studentProfile
      ?.currentEnrollment
      ?.classId ||
    studentProfile
      ?.currentEnrollment
      ?.class;

  if (
    !classData ||
    typeof classData === "string"
  ) {
    return "";
  }

  return (
    classData?.name ||
    classData?.className ||
    (classData?.roomNumber
      ? `الفصل ${classData.roomNumber}`
      : "")
  );
};

// =====================================================
// COMPONENT
// =====================================================

const MyExams = () => {
  const navigate = useNavigate();

  const outletContext =
    useOutletContext() || {};

  const studentProfile =
    outletContext
      ?.studentProfile ||
    null;

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  // ===================================================
  // API
  // ===================================================

  const {
    subjects: mySubjects,
    loading:
      loadingSubjects,
  } = useStudentSubjects();

  const {
    exams: quizExamsRaw,
    loading:
      loadingQuizExams,
  } = useStudentExams({
    examType: "quiz",
  });

  const {
    exams: finalExamsRaw,
    loading:
      loadingFinalExams,
  } = useStudentExams({
    examType: "final",
  });

  // ===================================================
  // MERGE
  // ===================================================

  const exams = useMemo(() => {
    const quizList =
      Array.isArray(
        quizExamsRaw
      )
        ? quizExamsRaw
        : [];

    const finalList =
      Array.isArray(
        finalExamsRaw
      )
        ? finalExamsRaw
        : [];

    const map = new Map();

    [
      ...finalList,
      ...quizList,
    ].forEach((exam) => {
      const id =
        normalizeId(exam);

      if (!id) {
        return;
      }

      map.set(id, exam);
    });

    return Array.from(
      map.values()
    );
  }, [
    quizExamsRaw,
    finalExamsRaw,
  ]);

  // ===================================================
  // SUBJECT MAP
  // ===================================================

  const subjectMap =
    useMemo(() => {
      const map = new Map();

      (
        Array.isArray(
          mySubjects
        )
          ? mySubjects
          : []
      ).forEach((subject) => {
        const id =
          getStudentSubjectId(
            subject
          );

        if (!id) {
          return;
        }

        map.set(id, {
          name:
            getStudentSubjectName(
              subject
            ),

          code:
            getStudentSubjectCode(
              subject
            ),
        });
      });

      return map;
    }, [mySubjects]);

  // ===================================================
  // NORMALIZED EXAMS
  // ===================================================

  const studentExams =
    useMemo(() => {
      return exams.map(
        (exam) => {
          const subjectId =
            getSubjectId(exam);

          const subjectInfo =
            subjectMap.get(
              subjectId
            );

          const subjectName =
            subjectInfo?.name ||
            getSubjectName(exam);

          const examType =
            exam?.examType ||
            exam?.type ||
            "quiz";

          const status =
            getStudentExamStatus(
              exam
            );

          return {
            id:
              normalizeId(exam),

            title:
              examType === "final"
                ? `الاختبار النهائي - ${subjectName}`
                : `اختبار قصير - ${subjectName}`,

            subject:
              subjectName,

            subjectId,

            examType,

            startDate:
              exam?.startDate,

            endDate:
              exam?.endDate,

            duration:
              exam?.duration
                ? `${exam.duration} دقيقة`
                : "غير محدد",

            status,

            hasTaken:
              Boolean(
                exam?.hasTaken
              ),

            rawExam: exam,
          };
        }
      );
    }, [
      exams,
      subjectMap,
    ]);

  // ===================================================
  // SUBJECT FILTER ITEMS
  // ===================================================

  const subjects =
    useMemo(() => {
      return (
        Array.isArray(
          mySubjects
        )
          ? mySubjects
          : []
      )
        .map(
          (subject) => {
            const id =
              getStudentSubjectId(
                subject
              );

            const name =
              getStudentSubjectName(
                subject
              );

            const code =
              getStudentSubjectCode(
                subject
              );

            return {
              id,

              name: code
                ? `${name} (${code})`
                : name,
            };
          }
        )
        .filter(
          (subject) =>
            Boolean(
              subject.id
            )
        );
    }, [mySubjects]);

  // ===================================================
  // FILTERING
  // ===================================================

  const examsAfterSubjectFilter =
    useMemo(() => {
      if (
        !selectedSubject
      ) {
        return studentExams;
      }

      return studentExams.filter(
        (exam) =>
          exam.subjectId ===
          selectedSubject
      );
    }, [
      studentExams,
      selectedSubject,
    ]);

  const filtered =
    useMemo(() => {
      if (
        !selectedStatus
      ) {
        return examsAfterSubjectFilter;
      }

      return examsAfterSubjectFilter.filter(
        (exam) =>
          exam.status ===
          selectedStatus
      );
    }, [
      examsAfterSubjectFilter,
      selectedStatus,
    ]);

  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(
      () => ({
        total:
          studentExams.length,

        pending:
          studentExams.filter(
            (exam) =>
              exam.status ===
              "pending"
          ).length,

        upcoming:
          studentExams.filter(
            (exam) =>
              exam.status ===
              "upcoming"
          ).length,

        completed:
          studentExams.filter(
            (exam) =>
              exam.status ===
              "completed"
          ).length,

        overdue:
          studentExams.filter(
            (exam) =>
              exam.status ===
              "overdue"
          ).length,
      }),
      [studentExams]
    );

  const hasClass =
    Boolean(
      studentProfile?.classId ||
        studentProfile?.class ||
        studentProfile
          ?.currentEnrollment
          ?.classId ||
        studentProfile
          ?.currentEnrollment
          ?.class
    );

  const className =
    getClassName(
      studentProfile
    );

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loadingSubjects ||
    loadingQuizExams ||
    loadingFinalExams
  ) {
    return (
      <Container
        noSidebar={true}
      >
        <Stack spacing={1.5}>
          <Skeleton
            variant="rounded"
            height={105}
            sx={{
              borderRadius:
                "22px",
            }}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns:
                {
                  xs: "repeat(2,1fr)",
                  md: "repeat(5,1fr)",
                },

              gap: 1,
            }}
          >
            {[
              1,
              2,
              3,
              4,
              5,
            ].map(
              (item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={90}
                  sx={{
                    borderRadius:
                      "17px",
                  }}
                />
              )
            )}
          </Box>

          <Skeleton
            variant="rounded"
            height={380}
            sx={{
              borderRadius:
                "24px",
            }}
          />
        </Stack>
      </Container>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Container
      noSidebar={true}
    >
      <Box
        dir="rtl"
        sx={{
          width: "100%",
        }}
      >
        {/* =============================================
            HEADER
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 2,

            px: {
              xs: 1.6,
              sm: 2.1,
              md: 2.5,
            },

            py: {
              xs: 1.6,
              md: 1.9,
            },

            display: "flex",

            alignItems: {
              xs: "flex-start",
              sm: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: 1.4,

            borderRadius:
              "22px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 62%,#f7f3ff 100%)",

            boxShadow:
              "0 10px 28px rgba(18,47,77,.045)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.1}
          >
            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard"
                )
              }
              sx={{
                width: 42,
                height: 42,

                borderRadius:
                  "13px",

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f2f6fa",

                border:
                  "1px solid rgba(36,74,112,.06)",

                "&:hover": {
                  backgroundColor:
                    "#e8f0f7",
                },
              }}
            >
              <ArrowForwardRounded />
            </IconButton>

            <Box
              sx={{
                width: 46,
                height: 46,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                placeItems:
                  "center",

                borderRadius:
                  "14px",

                color:
                  COLORS.purple,

                backgroundColor:
                  COLORS.purpleLight,
              }}
            >
              <AssignmentRounded
                sx={{
                  fontSize: 23,
                }}
              />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "18px",
                    md: "21px",
                  },

                  fontWeight: 900,
                }}
              >
                اختباراتي
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color:
                    "#909ba6",

                  fontSize: {
                    xs: "9px",
                    md: "10px",
                  },
                }}
              >
                تابع اختباراتك
                واعرف مواعيدها
                وحالتها بسهولة
              </Typography>
            </Box>
          </Stack>

          {className && (
            <Chip
              icon={
                <SchoolRounded />
              }
              label={
                className
              }
              sx={{
                height: 33,

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f5f8fa",

                border:
                  "1px solid rgba(36,74,112,.07)",

                fontSize:
                  "9px",

                fontWeight: 800,

                "& .MuiChip-icon":
                  {
                    color:
                      COLORS.gold,

                    fontSize:
                      "17px",
                  },
              }}
            />
          )}
        </Paper>

        {/* =============================================
            STATS
        ============================================= */}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns:
              {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(3,minmax(0,1fr))",
                md: "repeat(5,minmax(0,1fr))",
              },

            gap: 1,

            mb: 2,
          }}
        >
          <ExamStat
            title="إجمالي الاختبارات"
            value={
              stats.total
            }
            icon={
              AssignmentRounded
            }
            color={
              COLORS.blue
            }
            background={
              COLORS.blueLight
            }
          />

          <ExamStat
            title="متاح الآن"
            value={
              stats.pending
            }
            icon={
              EventAvailableRounded
            }
            color={
              COLORS.orange
            }
            background={
              COLORS.orangeLight
            }
          />

          <ExamStat
            title="لم يبدأ بعد"
            value={
              stats.upcoming
            }
            icon={
              HourglassBottomRounded
            }
            color={
              COLORS.purple
            }
            background={
              COLORS.purpleLight
            }
          />

          <ExamStat
            title="مكتمل"
            value={
              stats.completed
            }
            icon={
              CheckCircleRounded
            }
            color={
              COLORS.green
            }
            background={
              COLORS.greenLight
            }
          />

          <ExamStat
            title="منتهي"
            value={
              stats.overdue
            }
            icon={
              ErrorOutlineRounded
            }
            color={
              COLORS.red
            }
            background={
              COLORS.redLight
            }
          />
        </Box>

        {/* =============================================
            FILTERS
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 2,

            p: {
              xs: 1.2,
              sm: 1.4,
            },

            display: "flex",

            alignItems: {
              xs: "stretch",
              md: "center",
            },

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1.2,

            borderRadius:
              "18px",

            border:
              "1px solid rgba(18,47,77,.055)",

            backgroundColor:
              "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.7}
            sx={{
              minWidth: {
                md: 115,
              },
            }}
          >
            <TuneRounded
              sx={{
                color:
                  COLORS.blue,

                fontSize: 19,
              }}
            />

            <Typography
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize:
                  "10px",

                fontWeight: 900,
              }}
            >
              تصفية النتائج
            </Typography>
          </Stack>

          {/* SUBJECT */}

          <Select
            size="small"
            value={
              selectedSubject
            }
            onChange={(event) =>
              setSelectedSubject(
                event.target.value
              )
            }
            displayEmpty
            sx={{
              minWidth: {
                xs: "100%",
                md: 210,
              },

              height: 40,

              borderRadius:
                "12px",

              backgroundColor:
                "#f8fafb",

              fontSize: "9px",

              fontWeight: 700,

              "& fieldset": {
                borderColor:
                  "rgba(36,74,112,.08)",
              },
            }}
          >
            <MenuItem
              value=""
              sx={{
                fontSize: "10px",
              }}
            >
              كل المواد
            </MenuItem>

            {subjects.map(
              (subject) => (
                <MenuItem
                  key={
                    subject.id
                  }
                  value={
                    subject.id
                  }
                  sx={{
                    fontSize:
                      "10px",
                  }}
                >
                  {subject.name}
                </MenuItem>
              )
            )}
          </Select>

          {/* STATUS */}

          <Box
            sx={{
              display: "flex",

              flexWrap: "wrap",

              gap: 0.6,

              flex: 1,
            }}
          >
            <FilterChip
              active={
                selectedStatus ===
                ""
              }
              label="كل الحالات"
              onClick={() =>
                setSelectedStatus(
                  ""
                )
              }
              count={
                examsAfterSubjectFilter
                  .length
              }
            />

            {Object.entries(
              STATUS_UI
            ).map(
              ([
                id,
                item,
              ]) => {
                const count =
                  examsAfterSubjectFilter.filter(
                    (exam) =>
                      exam.status ===
                      id
                  ).length;

                return (
                  <FilterChip
                    key={id}
                    active={
                      selectedStatus ===
                      id
                    }
                    label={
                      item.label
                    }
                    count={
                      count
                    }
                    onClick={() =>
                      setSelectedStatus(
                        id
                      )
                    }
                  />
                );
              }
            )}
          </Box>
        </Paper>

        {/* =============================================
            EXAMS
        ============================================= */}

        {filtered.length > 0 ? (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "14px",
                    md: "16px",
                  },

                  fontWeight: 900,
                }}
              >
                الاختبارات
              </Typography>

              <Typography
                sx={{
                  color:
                    "#929da7",

                  fontSize: "8px",
                }}
              >
                {filtered.length} نتيجة
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                    lg: "repeat(3,minmax(0,1fr))",
                  },

                gap: 1.2,
              }}
            >
              {filtered.map(
                (exam) => (
                  <ExamCard
                    key={
                      exam.id
                    }
                    exam={exam}
                    onOpen={() =>
                      navigate(
                        `/student-dashboard/exams/${exam.id}/quiz`,
                        {
                          state: {
                            quiz: exam,
                            exam,
                            examType:
                              exam.examType,
                            rawExam:
                              exam.rawExam,
                          },
                        }
                      )
                    }
                  />
                )
              )}
            </Box>
          </>
        ) : (
          <EmptyExams
            hasClass={
              hasClass
            }
            selectedSubject={
              selectedSubject
            }
            selectedStatus={
              selectedStatus
            }
          />
        )}
      </Box>
    </Container>
  );
};

// =====================================================
// STAT
// =====================================================

const ExamStat = ({
  title,
  value,
  icon: Icon,
  color,
  background,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,

        minHeight: 76,

        display: "flex",

        alignItems: "center",

        gap: 1,

        borderRadius:
          "16px",

        border:
          "1px solid rgba(18,47,77,.05)",

        backgroundColor:
          "#fff",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,

          flexShrink: 0,

          display: "grid",

          placeItems:
            "center",

          borderRadius:
            "12px",

          color,

          backgroundColor:
            background,
        }}
      >
        <Icon
          sx={{
            fontSize: 20,
          }}
        />
      </Box>

      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color:
              COLORS.deepNavy,

            fontSize: "18px",

            lineHeight: 1,

            fontWeight: 900,
          }}
        >
          {value}
        </Typography>

        <Typography
          noWrap
          sx={{
            mt: 0.4,

            color:
              "#929da7",

            fontSize: "7.5px",
          }}
        >
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

// =====================================================
// FILTER CHIP
// =====================================================

const FilterChip = ({
  active,
  label,
  count,
  onClick,
}) => {
  return (
    <Chip
      onClick={onClick}
      label={`${label} (${count})`}
      sx={{
        height: 34,

        cursor: "pointer",

        color: active
          ? "#fff"
          : COLORS.navy,

        backgroundColor:
          active
            ? COLORS.navy
            : "#f8fafb",

        border:
          active
            ? "1px solid #244a70"
            : "1px solid rgba(36,74,112,.08)",

        fontSize: "8px",

        fontWeight: 800,

        "&:hover": {
          backgroundColor:
            active
              ? "#1b3d61"
              : "#f1f5f8",
        },
      }}
    />
  );
};

// =====================================================
// EXAM CARD
// =====================================================

const ExamCard = ({
  exam,
  onOpen,
}) => {
  const status =
    STATUS_UI[
      exam.status
    ] ||
    STATUS_UI.upcoming;

  const StatusIcon =
    status.icon;

  const isAvailable =
    exam.status ===
    "pending";

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",

        overflow: "hidden",

        minHeight: 220,

        p: 1.6,

        borderRadius:
          "20px",

        border:
          "1px solid rgba(18,47,77,.055)",

        backgroundColor:
          "#fff",

        transition:
          "transform .2s ease, box-shadow .2s ease",

        "&:hover": {
          transform:
            "translateY(-3px)",

          boxShadow:
            "0 14px 30px rgba(18,47,77,.07)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Box
          sx={{
            width: 45,
            height: 45,

            display: "grid",

            placeItems:
              "center",

            borderRadius:
              "14px",

            color:
              exam.examType ===
              "final"
                ? COLORS.purple
                : COLORS.blue,

            backgroundColor:
              exam.examType ===
              "final"
                ? COLORS.purpleLight
                : COLORS.blueLight,
          }}
        >
          <AssignmentRounded
            sx={{
              fontSize: 23,
            }}
          />
        </Box>

        <Chip
          icon={
            <StatusIcon />
          }
          label={
            status.label
          }
          sx={{
            height: 27,

            color:
              status.color,

            backgroundColor:
              status.background,

            fontSize: "7.5px",

            fontWeight: 900,

            "& .MuiChip-icon":
              {
                color:
                  status.color,

                fontSize:
                  "15px",
              },
          }}
        />
      </Stack>

      <Typography
        noWrap
        sx={{
          mt: 1.3,

          color:
            COLORS.deepNavy,

          fontSize: "12px",

          fontWeight: 900,
        }}
      >
        {exam.subject}
      </Typography>

      <Typography
        sx={{
          mt: 0.3,

          color:
            "#8995a0",

          fontSize: "8px",

          fontWeight: 700,
        }}
      >
        {exam.examType ===
        "final"
          ? "اختبار نهائي"
          : "اختبار قصير"}
      </Typography>

      <Stack
        spacing={0.7}
        sx={{
          mt: 1.4,
        }}
      >
        <ExamMeta
          icon={
            CalendarMonthRounded
          }
          text={`يبدأ: ${formatDate(
            exam.startDate
          )}`}
        />

        <ExamMeta
          icon={
            AccessTimeRounded
          }
          text={`ينتهي: ${formatDate(
            exam.endDate
          )}`}
        />

        <ExamMeta
          icon={
            TimerRounded
          }
          text={`المدة: ${exam.duration}`}
        />
      </Stack>

      <Button
        fullWidth
        disabled={
          !isAvailable
        }
        onClick={
          onOpen
        }
        endIcon={
          <ChevronLeftRounded />
        }
        sx={{
          mt: 1.5,

          minHeight: 38,

          borderRadius:
            "11px",

          color: "#fff",

          backgroundColor:
            COLORS.navy,

          fontSize: "9px",

          fontWeight: 900,

          textTransform:
            "none",

          "&:hover": {
            backgroundColor:
              "#1b3d61",
          },

          "&.Mui-disabled": {
            color:
              "#9ba5af",

            backgroundColor:
              "#f2f4f6",
          },
        }}
      >
        {exam.status ===
        "completed"
          ? "تم إكمال الاختبار"
          : exam.status ===
              "overdue"
            ? "انتهى الاختبار"
            : exam.status ===
                "upcoming"
              ? "لم يبدأ الاختبار"
              : exam.examType ===
                  "final"
                ? "ابدأ الاختبار"
                : "ابدأ الكويز"}
      </Button>
    </Paper>
  );
};

// =====================================================
// META
// =====================================================

const ExamMeta = ({
  icon: Icon,
  text,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.6}
  >
    <Icon
      sx={{
        color:
          "#9aa5af",

        fontSize: 14,
      }}
    />

    <Typography
      noWrap
      sx={{
        color:
          "#7e8a95",

        fontSize: "7.5px",
      }}
    >
      {text}
    </Typography>
  </Stack>
);

// =====================================================
// EMPTY
// =====================================================

const EmptyExams = ({
  hasClass,
  selectedSubject,
  selectedStatus,
}) => {
  const filtering =
    Boolean(
      selectedSubject ||
        selectedStatus
    );

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: {
          xs: 300,
          md: 350,
        },

        px: 2,
        py: 5,

        display: "grid",

        placeItems:
          "center",

        textAlign:
          "center",

        borderRadius:
          "24px",

        border:
          "1px dashed rgba(36,74,112,.14)",

        background:
          "linear-gradient(145deg,#ffffff,#f9fbfd)",
      }}
    >
      <Box>
        <Box
          sx={{
            width: 82,
            height: 82,

            mx: "auto",
            mb: 1.5,

            display: "grid",

            placeItems:
              "center",

            borderRadius:
              "24px",

            color: !hasClass
              ? COLORS.orange
              : COLORS.purple,

            backgroundColor:
              !hasClass
                ? COLORS.orangeLight
                : COLORS.purpleLight,
          }}
        >
          {!hasClass ? (
            <SchoolRounded
              sx={{
                fontSize: 39,
              }}
            />
          ) : (
            <AssignmentRounded
              sx={{
                fontSize: 39,
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            color:
              COLORS.deepNavy,

            fontSize: {
              xs: "15px",
              md: "17px",
            },

            fontWeight: 900,
          }}
        >
          {!hasClass
            ? "لم يتم تسجيلك في فصل بعد"
            : filtering
              ? "لا توجد اختبارات مطابقة"
              : "لا توجد اختبارات متاحة حاليًا"}
        </Typography>

        <Typography
          sx={{
            maxWidth: 420,

            mt: 0.6,

            color:
              "#8d99a5",

            fontSize: {
              xs: "9px",
              md: "10px",
            },

            lineHeight: 1.8,
          }}
        >
          {!hasClass
            ? "ستظهر اختباراتك هنا تلقائيًا بعد تسجيلك في فصل وإضافة الاختبارات إليه."
            : filtering
              ? "جرّب تغيير المادة أو الحالة لعرض نتائج أخرى."
              : "عند إضافة اختبار جديد لموادك سيظهر هنا تلقائيًا مع موعده وحالته."}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MyExams;
