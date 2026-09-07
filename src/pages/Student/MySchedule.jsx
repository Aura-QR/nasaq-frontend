import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import {
  ArrowForwardRounded,
  CalendarMonthRounded,
  MenuBookRounded,
  PersonRounded,
  ScheduleRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";

import {
  translateGender,
} from "@/utils/helpers/translateGender";

import {
  useStudentLectures,
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

  green: "#43a978",
  greenLight: "#eaf8f1",

  orange: "#e69a43",
  orangeLight: "#fff3e4",

  pink: "#d77993",
  pinkLight: "#fff0f4",
};

// =====================================================
// LESSON COLORS
// =====================================================

const LESSON_COLORS = [
  {
    bg: COLORS.blueLight,
    color: COLORS.blue,
    border: "#d9eafb",
  },

  {
    bg: COLORS.purpleLight,
    color: COLORS.purple,
    border: "#e4ddfb",
  },

  {
    bg: COLORS.greenLight,
    color: COLORS.green,
    border: "#d6eee2",
  },

  {
    bg: COLORS.orangeLight,
    color: COLORS.orange,
    border: "#f5e1c7",
  },

  {
    bg: COLORS.pinkLight,
    color: COLORS.pink,
    border: "#f2dce3",
  },
];

// =====================================================
// DAYS
// =====================================================

const JS_DAY_TO_ID = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// =====================================================
// HELPERS
// =====================================================

const getTeacherName = (
  teacher
) => {
  if (!teacher) {
    return "المعلم";
  }

  if (
    typeof teacher === "string"
  ) {
    return teacher;
  }

  const fullName = [
    teacher?.firstName,
    teacher?.fatherName,
    teacher?.familyName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    teacher?.name ||
    teacher?.fullName ||
    fullName ||
    "المعلم"
  );
};

const getSubjectName = (
  subject
) => {
  if (!subject) {
    return "مادة دراسية";
  }

  if (
    typeof subject === "string"
  ) {
    return subject;
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    "مادة دراسية"
  );
};

const getPreparationId = (lecture) => {
  const candidates = [
    lecture?.preparationId,
    lecture?.preparation,
    Array.isArray(lecture?.preparations)
      ? lecture.preparations[0]
      : null,
  ];

  for (const value of candidates) {
    if (!value) continue;

    if (typeof value === "string") {
      return value;
    }

    const status = String(
      value?.reviewStatus ||
        value?.status ||
        ""
    )
      .trim()
      .toLowerCase();

    if (
      status &&
      !["pending", "approved"].includes(
        status
      )
    ) {
      continue;
    }

    const id = value?._id || value?.id;
    if (id) return String(id);
  }

  return "";
};

const getClassLabel = (
  classData
) => {
  if (!classData) {
    return "";
  }

  if (
    typeof classData ===
    "string"
  ) {
    return "";
  }

  const values = [];

  if (classData?.name) {
    values.push(
      classData.name
    );
  }

  if (
    classData?.roomNumber
  ) {
    values.push(
      `فصل ${classData.roomNumber}`
    );
  }

  if (classData?.gender) {
    values.push(
      translateGender(
        classData.gender,
        "class"
      )
    );
  }

  return values
    .filter(Boolean)
    .join(" • ");
};

const getOrdinalLabel = (
  index
) => {
  const values = [
    "الأولى",
    "الثانية",
    "الثالثة",
    "الرابعة",
    "الخامسة",
    "السادسة",
    "السابعة",
    "الثامنة",
    "التاسعة",
    "العاشرة",
  ];

  return (
    values[index] ||
    `${index + 1}`
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const MySchedule = ({
  teacherData,
}) => {
  const navigate = useNavigate();

  const isMobile =
    useMediaQuery(
      "(max-width:700px)"
    );

  const outletContext =
    useOutletContext() || {};

  const studentProfile =
    outletContext?.studentProfile ||
    null;

  const {
    lectures = [],
    loading,
  } = useStudentLectures();

  const [
    weeklySchedule,
    setWeeklySchedule,
  ] = useState([]);

  // ===================================================
  // SAFE LECTURES
  // ===================================================

  const lectureList =
    Array.isArray(lectures)
      ? lectures
      : [];

  // ===================================================
  // STUDENT CLASS
  // ===================================================

  const myClass =
    lectureList?.[0]?.class ||
    lectureList?.[0]?.classId ||
    studentProfile?.class ||
    studentProfile?.classId ||
    null;

  // ===================================================
  // CURRENT DAY
  // ===================================================

  const currentDayId =
    JS_DAY_TO_ID[
      new Date().getDay()
    ];

  const currentDayObject =
    Days.find(
      (day) =>
        String(
          day?.id || ""
        ).toLowerCase() ===
        currentDayId
    );

  const initialDay =
    currentDayObject?.id ||
    Days?.[0]?.id ||
    "";

  const [
    selectedDayId,
    setSelectedDayId,
  ] = useState(initialDay);

  useEffect(() => {
    if (
      currentDayObject?.id
    ) {
      setSelectedDayId(
        currentDayObject.id
      );
    }
  }, [
    currentDayObject?.id,
  ]);

  // ===================================================
  // BUILD WEEKLY SCHEDULE
  // ===================================================

  useEffect(() => {
    const schedule =
      Slots.map(
        (
          slot,
          index
        ) => {
          const item = {
            slot:
              slot?.id ||
              index + 1,

            time:
              slot?.name ||
              `الحصة ${
                index + 1
              }`,
          };

          Days.forEach(
            (day) => {
              item[day.day] =
                null;
            }
          );

          return item;
        }
      );

    lectureList.forEach(
      (lecture) => {
        const lectureDay =
          String(
            lecture?.dayOfWeek ||
              ""
          ).toLowerCase();

        const dayObject =
          Days.find(
            (day) =>
              String(
                day?.id || ""
              ).toLowerCase() ===
              lectureDay
          );

        const slotNumber =
          Number(
            lecture?.slot
          );

        const slotIndex =
          slotNumber - 1;

        if (
          !dayObject ||
          Number.isNaN(
            slotIndex
          ) ||
          slotIndex < 0 ||
          slotIndex >=
            schedule.length
        ) {
          return;
        }

        schedule[
          slotIndex
        ][dayObject.day] = {
          id:
            lecture?._id ||
            lecture?.id,

          teacher:
            getTeacherName(
              lecture?.teacher ||
                lecture?.teacherId
            ),

          subject:
            getSubjectName(
              lecture?.subject ||
                lecture?.subjectId ||
                lecture
                  ?.subjectOfferingId
                  ?.subjectId
            ),

          class:
            lecture?.class ||
            lecture?.classId,

          term:
            lecture?.term ||
            lecture?.termId,

          slot:
            lecture?.slot,

          dayOfWeek:
            lecture?.dayOfWeek,

          preparationId:
            getPreparationId(
              lecture
            ),

          raw: lecture,
        };
      }
    );

    setWeeklySchedule(
      schedule
    );
  }, [lectureList]);

  // ===================================================
  // STATS
  // ===================================================

  const totalLectures =
    lectureList.length;

  const todayLectures =
    useMemo(() => {
      return lectureList.filter(
        (lecture) =>
          String(
            lecture?.dayOfWeek ||
              ""
          ).toLowerCase() ===
          currentDayId
      );
    }, [
      lectureList,
      currentDayId,
    ]);

  // ===================================================
  // SELECTED DAY
  // ===================================================

  const selectedDay =
    Days.find(
      (day) =>
        day.id ===
        selectedDayId
    ) || Days?.[0];

  const selectedDaySchedule =
    useMemo(() => {
      if (!selectedDay) {
        return [];
      }

      return weeklySchedule.map(
        (
          slot,
          index
        ) => ({
          ...slot,

          slotIndex: index,

          lesson:
            slot[
              selectedDay.day
            ] || null,
        })
      );
    }, [
      weeklySchedule,
      selectedDay,
    ]);

  const hasAnyLectures =
    totalLectures > 0;

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
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

          <Skeleton
            variant="rounded"
            height={440}
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
            mb: 1.6,

            px: {
              xs: 1.4,
              sm: 1.8,
              md: 2.2,
            },

            py: {
              xs: 1.3,
              md: 1.5,
            },

            display: "flex",

            alignItems: {
              xs: "flex-start",
              lg: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              lg: "row",
            },

            gap: 1.3,

            borderRadius:
              "22px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 65%,#edf6ff 100%)",

            boxShadow:
              "0 10px 28px rgba(18,47,77,.045)",
          }}
        >
          {/* ===========================================
              TITLE
          =========================================== */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard"
                )
              }
              sx={{
                width: 41,
                height: 41,

                flexShrink: 0,

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
              <ArrowForwardRounded
                sx={{
                  fontSize: 21,
                }}
              />
            </IconButton>

            <Box
              sx={{
                width: 45,
                height: 45,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                flexShrink: 0,

                placeItems:
                  "center",

                borderRadius:
                  "14px",

                color:
                  COLORS.blue,

                backgroundColor:
                  COLORS.blueLight,
              }}
            >
              <CalendarMonthRounded
                sx={{
                  fontSize: 22,
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

                  lineHeight: 1.15,

                  fontWeight: 900,
                }}
              >
                جدولي الدراسي
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,

                  color:
                    "#909ba6",

                  fontSize: {
                    xs: "8px",
                    md: "9px",
                  },
                }}
              >
                تابع حصصك
                الأسبوعية
                ومواعيدك بسهولة
              </Typography>
            </Box>
          </Stack>

          {/* ===========================================
              INFO BADGES
          =========================================== */}

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              width: {
                xs: "100%",
                lg: "auto",
              },

              flexWrap: "wrap",

              gap: 0.65,
            }}
          >
            {/* WEEK */}

            <Chip
              icon={
                <MenuBookRounded />
              }
              label={`${totalLectures} حصص الأسبوع`}
              sx={{
                height: 33,

                color:
                  COLORS.blue,

                backgroundColor:
                  COLORS.blueLight,

                border:
                  "1px solid rgba(78,141,204,.10)",

                fontSize:
                  "8px",

                fontWeight: 900,

                "& .MuiChip-label":
                  {
                    px: 1,
                  },

                "& .MuiChip-icon":
                  {
                    mr: 0.6,

                    ml: -0.1,

                    color:
                      COLORS.blue,

                    fontSize:
                      "16px",
                  },
              }}
            />

            {/* TODAY COUNT */}

            <Chip
              icon={
                <ScheduleRounded />
              }
              label={`${todayLectures.length} حصص اليوم`}
              sx={{
                height: 33,

                color:
                  COLORS.purple,

                backgroundColor:
                  COLORS.purpleLight,

                border:
                  "1px solid rgba(128,104,201,.10)",

                fontSize:
                  "8px",

                fontWeight: 900,

                "& .MuiChip-label":
                  {
                    px: 1,
                  },

                "& .MuiChip-icon":
                  {
                    mr: 0.6,

                    ml: -0.1,

                    color:
                      COLORS.purple,

                    fontSize:
                      "16px",
                  },
              }}
            />

            {/* TODAY */}

            <Chip
              icon={
                <CalendarMonthRounded />
              }
              label={`${
                currentDayObject?.day ||
                "اليوم"
              } • اليوم`}
              sx={{
                height: 33,

                color:
                  COLORS.green,

                backgroundColor:
                  COLORS.greenLight,

                border:
                  "1px solid rgba(67,169,120,.10)",

                fontSize:
                  "8px",

                fontWeight: 900,

                "& .MuiChip-label":
                  {
                    px: 1,
                  },

                "& .MuiChip-icon":
                  {
                    mr: 0.6,

                    ml: -0.1,

                    color:
                      COLORS.green,

                    fontSize:
                      "16px",
                  },
              }}
            />

            {/* CLASS */}

            {getClassLabel(
              myClass
            ) && (
              <Chip
                icon={
                  <SchoolRounded />
                }
                label={getClassLabel(
                  myClass
                )}
                sx={{
                  height: 33,

                  color:
                    COLORS.navy,

                  backgroundColor:
                    "#f5f7f9",

                  border:
                    "1px solid rgba(36,74,112,.08)",

                  fontSize:
                    "8px",

                  fontWeight:
                    900,

                  "& .MuiChip-label":
                    {
                      px: 1,
                    },

                  "& .MuiChip-icon":
                    {
                      mr: 0.6,

                      ml: -0.1,

                      color:
                        COLORS.gold,

                      fontSize:
                        "16px",
                    },
                }}
              />
            )}
          </Stack>
        </Paper>

        {/* =============================================
            NO SCHEDULE
        ============================================= */}

        {!hasAnyLectures ? (
          <EmptySchedule />
        ) : isMobile ? (
          /* ===========================================
             MOBILE
          =========================================== */

          <MobileSchedule
            selectedDayId={
              selectedDayId
            }
            setSelectedDayId={
              setSelectedDayId
            }
            selectedDay={
              selectedDay
            }
            schedule={
              selectedDaySchedule
            }
            currentDayId={
              currentDayId
            }
            teacherData={
              teacherData
            }
          />
        ) : (
          /* ===========================================
             DESKTOP
          =========================================== */

          <DesktopSchedule
            weeklySchedule={
              weeklySchedule
            }
            currentDayId={
              currentDayId
            }
            teacherData={
              teacherData
            }
          />
        )}
      </Box>
    </Container>
  );
};

// =====================================================
// EMPTY STATE
// =====================================================

const EmptySchedule = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: {
          xs: 290,
          md: 340,
        },

        px: 2,
        py: 4,

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
          "linear-gradient(145deg,#ffffff,#f8fbfd)",
      }}
    >
      <Box>
        <Box
          sx={{
            width: 78,
            height: 78,

            mx: "auto",
            mb: 1.4,

            display: "grid",

            placeItems:
              "center",

            borderRadius:
              "23px",

            color:
              COLORS.blue,

            backgroundColor:
              COLORS.blueLight,
          }}
        >
          <CalendarMonthRounded
            sx={{
              fontSize: 38,
            }}
          />
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
          لم يتم تحديد
          جدولك الدراسي بعد
        </Typography>

        <Typography
          sx={{
            maxWidth: 390,

            mt: 0.55,

            color:
              "#8d99a5",

            fontSize: {
              xs: "9px",
              md: "10px",
            },

            lineHeight: 1.8,
          }}
        >
          سيظهر جدولك هنا
          تلقائيًا بمجرد إضافة
          الحصص الدراسية إلى
          فصلك.
        </Typography>
      </Box>
    </Paper>
  );
};

// =====================================================
// DESKTOP SCHEDULE
// =====================================================

const DesktopSchedule = ({
  weeklySchedule,
  currentDayId,
  teacherData,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",

        borderRadius:
          "22px",

        border:
          "1px solid rgba(18,47,77,.06)",

        backgroundColor:
          "#fff",

        boxShadow:
          "0 8px 24px rgba(18,47,77,.035)",
      }}
    >
      <Box
        sx={{
          overflowX: "auto",

          "&::-webkit-scrollbar":
            {
              height: 6,
            },

          "&::-webkit-scrollbar-thumb":
            {
              backgroundColor:
                "#dce3e8",

              borderRadius: 20,
            },
        }}
      >
        <Box
          sx={{
            minWidth: 900,

            display: "grid",

            gridTemplateColumns: `120px repeat(${Days.length}, minmax(145px,1fr))`,
          }}
        >
          {/* ===========================================
              SLOT HEADER
          =========================================== */}

          <Box
            sx={{
              minHeight: 70,

              p: 1,

              display: "grid",

              placeItems:
                "center",

              borderLeft:
                "1px solid #edf0f3",

              borderBottom:
                "1px solid #e7ecf0",

              backgroundColor:
                "#f5f8fa",
            }}
          >
            <Stack
              alignItems="center"
              spacing={0.25}
            >
              <ScheduleRounded
                sx={{
                  color:
                    COLORS.gold,

                  fontSize: 19,
                }}
              />

              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize:
                    "9px",

                  fontWeight: 900,
                }}
              >
                الحصة
              </Typography>
            </Stack>
          </Box>

          {/* ===========================================
              DAYS HEADER
          =========================================== */}

          {Days.map(
            (day) => {
              const isToday =
                String(
                  day?.id || ""
                ).toLowerCase() ===
                currentDayId;

              return (
                <Box
                  key={
                    day.id
                  }
                  sx={{
                    minHeight:
                      70,

                    px: 1,
                    py: 0.8,

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    gap: 0.6,

                    borderLeft:
                      "1px solid #edf0f3",

                    borderBottom:
                      "1px solid #e7ecf0",

                    backgroundColor:
                      isToday
                        ? "#eaf4fd"
                        : "#f9fbfc",
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        COLORS.deepNavy,

                      fontSize:
                        "10px",

                      fontWeight:
                        900,
                    }}
                  >
                    {day.day}
                  </Typography>

                  {isToday && (
                    <Chip
                      label="اليوم"
                      size="small"
                      sx={{
                        height: 20,

                        color:
                          COLORS.blue,

                        backgroundColor:
                          "#fff",

                        fontSize:
                          "6.5px",

                        fontWeight:
                          900,

                        "& .MuiChip-label":
                          {
                            px: 0.8,
                          },
                      }}
                    />
                  )}
                </Box>
              );
            }
          )}

          {/* ===========================================
              ROWS
          =========================================== */}

          {weeklySchedule.map(
            (
              slot,
              rowIndex
            ) => (
              <ScheduleRow
                key={
                  slot.slot ||
                  rowIndex
                }
                slot={slot}
                rowIndex={
                  rowIndex
                }
                currentDayId={
                  currentDayId
                }
                teacherData={
                  teacherData
                }
              />
            )
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// =====================================================
// DESKTOP ROW
// =====================================================

const ScheduleRow = ({
  slot,
  rowIndex,
  currentDayId,
  teacherData,
}) => {
  return (
    <>
      {/* ===============================================
          SLOT
      =============================================== */}

      <Box
        sx={{
          minHeight: 94,

          p: 0.8,

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          textAlign:
            "center",

          borderLeft:
            "1px solid #edf0f3",

          borderBottom:
            "1px solid #edf0f3",

          backgroundColor:
            "#fafcfd",
        }}
      >
        <Box>
          <Typography
            sx={{
              color:
                COLORS.deepNavy,

              fontSize: "9px",

              fontWeight: 900,
            }}
          >
            الحصة{" "}
            {getOrdinalLabel(
              rowIndex
            )}
          </Typography>

          <Typography
            sx={{
              mt: 0.3,

              color:
                "#9aa5af",

              fontSize: "7px",
            }}
          >
            {slot.time}
          </Typography>
        </Box>
      </Box>

      {/* ===============================================
          LESSONS
      =============================================== */}

      {Days.map(
        (
          day,
          dayIndex
        ) => {
          const lesson =
            slot[
              day.day
            ];

          const isToday =
            String(
              day?.id || ""
            ).toLowerCase() ===
            currentDayId;

          return (
            <LessonCell
              key={day.id}
              lesson={lesson}
              rowIndex={
                rowIndex
              }
              dayIndex={
                dayIndex
              }
              isToday={
                isToday
              }
              teacherData={
                teacherData
              }
            />
          );
        }
      )}
    </>
  );
};

// =====================================================
// LESSON CELL
// =====================================================

const LessonCell = ({
  lesson,
  rowIndex,
  dayIndex,
  isToday,
  teacherData,
}) => {
  const navigate = useNavigate();
  const preparationId =
    lesson?.preparationId || "";

  const style =
    LESSON_COLORS[
      (rowIndex +
        dayIndex) %
        LESSON_COLORS.length
    ];

  return (
    <Box
      sx={{
        minHeight: 94,

        p: 0.65,

        display: "flex",

        alignItems:
          "center",

        borderLeft:
          "1px solid #edf0f3",

        borderBottom:
          "1px solid #edf0f3",

        backgroundColor:
          isToday
            ? "#fbfdff"
            : "#fff",
      }}
    >
      {lesson ? (
        <Paper
          elevation={0}
          component={preparationId ? "button" : "div"}
          type={preparationId ? "button" : undefined}
          onClick={() => {
            if (preparationId) {
              navigate(
                `/student-dashboard/preparations/${preparationId}`
              );
            }
          }}
          sx={{
            width: "100%",

            minHeight: 75,

            p: 0.9,

            display: "flex",

            flexDirection:
              "column",

            justifyContent:
              "center",

            borderRadius:
              "13px",

            border: `1px solid ${style.border}`,

            backgroundColor:
              style.bg,

            ...(preparationId
              ? {
                  cursor: "pointer",
                  textAlign: "right",
                  font: "inherit",
                }
              : {}),

            transition:
              "transform .18s ease, box-shadow .18s ease",

            "&:hover": {
              transform:
                "translateY(-2px)",

              boxShadow:
                "0 7px 17px rgba(18,47,77,.07)",
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.45}
          >
            <MenuBookRounded
              sx={{
                flexShrink: 0,

                color:
                  style.color,

                fontSize: 14,
              }}
            />

            <Typography
              noWrap
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize:
                  "8.5px",

                fontWeight: 900,
              }}
            >
              {
                lesson.subject
              }
            </Typography>
          </Stack>

          {!teacherData && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.35}
              sx={{
                mt: 0.55,
              }}
            >
              <PersonRounded
                sx={{
                  flexShrink: 0,

                  color:
                    "#8c98a3",

                  fontSize: 12,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color:
                    "#7e8c98",

                  fontSize:
                    "7px",
                }}
              >
                {
                  lesson.teacher
                }
              </Typography>
            </Stack>
          )}


          {preparationId && (
            <Typography
              sx={{
                mt: 0.55,
                color: style.color,
                fontSize: "7px",
                fontWeight: 900,
              }}
            >
              فتح تحضير الدرس
            </Typography>
          )}
        </Paper>
      ) : (
        <Typography
          sx={{
            width: "100%",

            textAlign:
              "center",

            color:
              "#c6cdd3",

            fontSize: "12px",
          }}
        >
          —
        </Typography>
      )}
    </Box>
  );
};

// =====================================================
// MOBILE SCHEDULE
// =====================================================

const MobileSchedule = ({
  selectedDayId,
  setSelectedDayId,
  selectedDay,
  schedule,
  currentDayId,
  teacherData,
}) => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* ===============================================
          DAY TABS
      =============================================== */}

      <Box
        sx={{
          mb: 1.1,

          overflowX: "auto",

          pb: 0.3,

          "&::-webkit-scrollbar":
            {
              display:
                "none",
            },
        }}
      >
        <Stack
          direction="row"
          spacing={0.6}
          sx={{
            minWidth:
              "max-content",
          }}
        >
          {Days.map(
            (day) => {
              const selected =
                day.id ===
                selectedDayId;

              const isToday =
                String(
                  day.id
                ).toLowerCase() ===
                currentDayId;

              return (
                <Chip
                  key={
                    day.id
                  }
                  label={
                    isToday
                      ? `${day.day} • اليوم`
                      : day.day
                  }
                  onClick={() =>
                    setSelectedDayId(
                      day.id
                    )
                  }
                  sx={{
                    height: 34,

                    px: 0.2,

                    cursor:
                      "pointer",

                    color:
                      selected
                        ? "#fff"
                        : COLORS.navy,

                    backgroundColor:
                      selected
                        ? COLORS.navy
                        : "#fff",

                    border:
                      "1px solid rgba(36,74,112,.08)",

                    fontSize:
                      "8px",

                    fontWeight:
                      800,

                    "&:hover": {
                      backgroundColor:
                        selected
                          ? COLORS.navy
                          : "#f4f7fa",
                    },
                  }}
                />
              );
            }
          )}
        </Stack>
      </Box>

      {/* ===============================================
          DAY SCHEDULE
      =============================================== */}

      <Paper
        elevation={0}
        sx={{
          p: 1.3,

          borderRadius:
            "19px",

          border:
            "1px solid rgba(18,47,77,.055)",

          backgroundColor:
            "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mb: 1,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize:
                  "12px",

                fontWeight: 900,
              }}
            >
              {
                selectedDay?.day
              }
            </Typography>

            <Typography
              sx={{
                mt: 0.15,

                color:
                  "#9aa4ad",

                fontSize: "7px",
              }}
            >
              حصص اليوم
              الدراسي
            </Typography>
          </Box>

          <CalendarMonthRounded
            sx={{
              color:
                COLORS.gold,

              fontSize: 19,
            }}
          />
        </Stack>

        <Stack spacing={0.7}>
          {schedule.map(
            (slot) => {
              const lesson =
                slot.lesson;

              const style =
                LESSON_COLORS[
                  slot.slotIndex %
                    LESSON_COLORS.length
                ];

              return (
                <Box
                  key={
                    slot.slot ||
                    slot.slotIndex
                  }
                  sx={{
                    p: 0.9,

                    display: "flex",

                    alignItems:
                      "center",

                    gap: 0.9,

                    borderRadius:
                      "13px",

                    backgroundColor:
                      lesson
                        ? style.bg
                        : "#f8fafb",

                    border: lesson
                      ? `1px solid ${style.border}`
                      : "1px solid #eef1f3",
                  }}
                >
                  {/* SLOT */}

                  <Box
                    sx={{
                      minWidth: 70,

                      py: 0.65,

                      textAlign:
                        "center",

                      borderRadius:
                        "10px",

                      backgroundColor:
                        "#fff",
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          COLORS.deepNavy,

                        fontSize:
                          "7.5px",

                        fontWeight:
                          900,
                      }}
                    >
                      الحصة{" "}
                      {getOrdinalLabel(
                        slot.slotIndex
                      )}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.15,

                        color:
                          "#9aa5af",

                        fontSize:
                          "6.5px",
                      }}
                    >
                      {slot.time}
                    </Typography>
                  </Box>

                  {/* LESSON */}

                  {lesson ? (
                    <Box
                      role={lesson.preparationId ? "button" : undefined}
                      tabIndex={lesson.preparationId ? 0 : undefined}
                      onClick={() => {
                        if (lesson.preparationId) {
                          navigate(
                            `/student-dashboard/preparations/${lesson.preparationId}`
                          );
                        }
                      }}
                      onKeyDown={(event) => {
                        if (
                          lesson.preparationId &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          navigate(
                            `/student-dashboard/preparations/${lesson.preparationId}`
                          );
                        }
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        cursor: lesson.preparationId ? "pointer" : "default",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.4}
                      >
                        <MenuBookRounded
                          sx={{
                            color:
                              style.color,

                            fontSize:
                              14,
                          }}
                        />

                        <Typography
                          noWrap
                          sx={{
                            color:
                              COLORS.deepNavy,

                            fontSize:
                              "9px",

                            fontWeight:
                              900,
                          }}
                        >
                          {
                            lesson.subject
                          }
                        </Typography>
                      </Stack>

                      {!teacherData && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.3}
                          sx={{
                            mt: 0.3,
                          }}
                        >
                          <PersonRounded
                            sx={{
                              color:
                                "#87939e",

                              fontSize:
                                11,
                            }}
                          />

                          <Typography
                            noWrap
                            sx={{
                              color:
                                "#84919c",

                              fontSize:
                                "7px",
                            }}
                          >
                            {
                              lesson.teacher
                            }
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        color:
                          "#aab4bd",

                        fontSize:
                          "8px",
                      }}
                    >
                      لا توجد حصة
                    </Typography>
                  )}
                </Box>
              );
            }
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default MySchedule;