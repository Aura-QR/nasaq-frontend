import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowBackRounded,
  ArrowForwardRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  EventBusyRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import {
  useStudentAttendance,
} from "@/utils/hooks/apis/student/useStudent";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  green: "#43a978",
  greenLight: "#eaf8f1",

  red: "#d76760",
  redLight: "#fff0ef",

  gold: "#d3a44f",

  gray: "#8c98a3",
  grayLight: "#f7f9fb",
};

// =====================================================
// WEEK
// =====================================================

const WEEK_DAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

const monthFormatter =
  new Intl.DateTimeFormat(
    "ar-EG-u-nu-latn",
    {
      month: "long",
      year: "numeric",
    }
  );

const dayFormatter =
  new Intl.DateTimeFormat(
    "ar-EG-u-nu-latn",
    {
      day: "numeric",
    }
  );

// =====================================================
// HELPERS
// =====================================================

const isSchoolDay = (date) => {
  const day = getDay(date);

  // Friday / Saturday
  return (
    day !== 5 &&
    day !== 6
  );
};

const normalizeAttendanceDate = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value.slice(
      0,
      10
    );
  }

  try {
    return format(
      new Date(value),
      "yyyy-MM-dd"
    );
  } catch {
    return "";
  }
};

const getDayStatus = ({
  day,
  absenceDates,
  today,
}) => {
  const key = format(
    day,
    "yyyy-MM-dd"
  );

  /*
   * API contract:
   * وجود record = غياب.
   */
  if (
    absenceDates.has(key)
  ) {
    return "absent";
  }

  /*
   * المستقبل لا يُحسب حضور.
   */
  if (
    isAfter(
      startOfDay(day),
      today
    )
  ) {
    return "future";
  }

  /*
   * Derived state:
   * يوم مضى ولا يوجد غياب مسجل.
   */
  return "clear";
};

const getDayTheme = (
  status
) => {
  if (
    status === "absent"
  ) {
    return {
      label: "غياب",
      color: COLORS.red,
      background:
        COLORS.redLight,
      border:
        "rgba(215,103,96,.24)",
    };
  }

  if (
    status === "future"
  ) {
    return {
      label: "قادم",
      color: "#9aa4ae",
      background:
        "#fafbfc",
      border:
        "rgba(36,74,112,.065)",
    };
  }

  return {
    label:
      "بدون غياب",
    color:
      COLORS.green,
    background:
      COLORS.greenLight,
    border:
      "rgba(67,169,120,.20)",
  };
};

// =====================================================
// MAIN
// =====================================================

const Attendance = () => {
  const navigate =
    useNavigate();

  const [
    monthCursor,
    setMonthCursor,
  ] = useState(
    new Date()
  );

  const {
    attendance = [],
    attendanceTotal = 0,
    loading,
  } =
    useStudentAttendance();

  const today =
    useMemo(
      () =>
        startOfDay(
          new Date()
        ),
      []
    );

  // ===================================================
  // ABSENCE SET
  // ===================================================

  const absenceDates =
    useMemo(() => {
      const list =
        Array.isArray(
          attendance
        )
          ? attendance
          : [];

      return new Set(
        list
          .map((item) =>
            normalizeAttendanceDate(
              item?.date
            )
          )
          .filter(Boolean)
      );
    }, [attendance]);

  // ===================================================
  // MONTH
  // ===================================================

  const monthStart =
    startOfMonth(
      monthCursor
    );

  const monthEnd =
    endOfMonth(
      monthCursor
    );

  const schoolDays =
    useMemo(() => {
      return eachDayOfInterval({
        start:
          monthStart,
        end:
          monthEnd,
      }).filter(
        isSchoolDay
      );
    }, [
      monthStart,
      monthEnd,
    ]);

  // ===================================================
  // CALENDAR LEADING CELLS
  // ===================================================

  const leadingEmptyCells =
    useMemo(() => {
      if (
        schoolDays.length ===
        0
      ) {
        return [];
      }

      const firstDay =
        getDay(
          schoolDays[0]
        );

      /*
       * Sunday = 0
       * Monday = 1
       * ...
       * Thursday = 4
       */
      return Array.from(
        {
          length:
            Math.min(
              firstDay,
              4
            ),
        },
        (_, index) =>
          index
      );
    }, [schoolDays]);

  // ===================================================
  // MONTH ATTENDANCE RECORDS
  // ===================================================

  const monthAbsenceDates =
    useMemo(() => {
      const set =
        new Set();

      (
        Array.isArray(
          attendance
        )
          ? attendance
          : []
      ).forEach(
        (item) => {
          const normalized =
            normalizeAttendanceDate(
              item?.date
            );

          if (!normalized) {
            return;
          }

          const date =
            new Date(
              `${normalized}T00:00:00`
            );

          if (
            isSameMonth(
              date,
              monthCursor
            ) &&
            !isAfter(
              startOfDay(
                date
              ),
              today
            )
          ) {
            set.add(
              normalized
            );
          }
        }
      );

      return set;
    }, [
      attendance,
      monthCursor,
      today,
    ]);

  // ===================================================
  // ELAPSED SCHOOL DAYS
  // ===================================================

  const elapsedSchoolDays =
    useMemo(() => {
      return schoolDays.filter(
        (day) =>
          !isAfter(
            startOfDay(day),
            today
          )
      );
    }, [
      schoolDays,
      today,
    ]);

  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(() => {
      const absent =
        monthAbsenceDates.size;

      const elapsed =
        elapsedSchoolDays.length;

      const withoutAbsence =
        Math.max(
          elapsed -
            absent,
          0
        );

      const rate =
        elapsed > 0
          ? Math.round(
              (withoutAbsence /
                elapsed) *
                100
            )
          : 0;

      const future =
        schoolDays.filter(
          (day) =>
            isAfter(
              startOfDay(
                day
              ),
              today
            )
        ).length;

      return {
        absent,
        elapsed,
        withoutAbsence,
        rate,
        future,
      };
    }, [
      monthAbsenceDates,
      elapsedSchoolDays,
      schoolDays,
      today,
    ]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <Container
        noSidebar={true}
      >
        <Stack spacing={1.25}>
          <Skeleton
            variant="rounded"
            height={92}
            sx={{
              borderRadius:
                "20px",
            }}
          />

          <Skeleton
            variant="rounded"
            height={58}
            sx={{
              borderRadius:
                "16px",
            }}
          />

          <Skeleton
            variant="rounded"
            height={430}
            sx={{
              borderRadius:
                "20px",
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
            mb: 1.25,

            px: {
              xs: 1.25,
              sm: 1.6,
              md: 2,
            },

            py: 1.2,

            display: "flex",

            alignItems: {
              xs: "flex-start",
              md: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1,

            borderRadius:
              "20px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 62%,#eaf8f1 100%)",

            boxShadow:
              "0 8px 24px rgba(18,47,77,.04)",
          }}
        >
          {/* TITLE */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.85}
          >
            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard"
                )
              }
              sx={{
                width: 39,
                height: 39,

                borderRadius:
                  "12px",

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f2f6fa",

                border:
                  "1px solid rgba(36,74,112,.06)",
              }}
            >
              <ArrowForwardRounded
                sx={{
                  fontSize: 20,
                }}
              />
            </IconButton>

            <Box
              sx={{
                width: 42,
                height: 42,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                placeItems:
                  "center",

                borderRadius:
                  "13px",

                color:
                  COLORS.green,

                backgroundColor:
                  COLORS.greenLight,
              }}
            >
              <CalendarMonthRounded
                sx={{
                  fontSize: 21,
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "17px",
                    md: "20px",
                  },

                  fontWeight:
                    900,

                  lineHeight: 1.2,
                }}
              >
                سجل الغياب
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,

                  color:
                    "#929da7",

                  fontSize:
                    "8px",
                }}
              >
                تابع أيام الغياب المسجلة خلال الشهر
              </Typography>
            </Box>
          </Stack>

          {/* BADGES */}

          <Stack
            direction="row"
            flexWrap="wrap"
            sx={{
              gap: 0.5,

              width: {
                xs: "100%",
                md: "auto",
              },
            }}
          >
            <HeaderBadge
              icon={
                EventBusyRounded
              }
              label={`${stats.absent} غياب`}
              color={
                COLORS.red
              }
              background={
                COLORS.redLight
              }
            />

            <HeaderBadge
              icon={
                CheckCircleRounded
              }
              label={`${stats.withoutAbsence} بدون غياب`}
              color={
                COLORS.green
              }
              background={
                COLORS.greenLight
              }
            />

            <HeaderBadge
              icon={
                SchoolRounded
              }
              label={`${stats.rate}%`}
              color={
                COLORS.blue
              }
              background={
                COLORS.blueLight
              }
            />
          </Stack>
        </Paper>

        {/* =============================================
            MONTH BAR
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.15,

            px: 1.25,
            py: 0.9,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            flexWrap: "wrap",

            gap: 1,

            borderRadius:
              "16px",

            border:
              "1px solid rgba(18,47,77,.055)",

            backgroundColor:
              "#fff",
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize:
                  "12px",

                fontWeight:
                  900,
              }}
            >
              التقويم الشهري
            </Typography>

            <Typography
              sx={{
                mt: 0.1,

                color:
                  "#9aa4ae",

                fontSize:
                  "7px",
              }}
            >
              الجمعة والسبت عطلة، وأيام المستقبل لا تدخل في الإحصائيات
            </Typography>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
          >
            <IconButton
              onClick={() =>
                setMonthCursor(
                  (prev) =>
                    addMonths(
                      prev,
                      1
                    )
                )
              }
              sx={{
                width: 34,
                height: 34,

                borderRadius:
                  "10px",

                color:
                  COLORS.navy,

                backgroundColor:
                  COLORS.grayLight,

                border:
                  "1px solid rgba(36,74,112,.06)",
              }}
            >
              <ArrowForwardRounded
                sx={{
                  fontSize: 17,
                }}
              />
            </IconButton>

            <Box
              sx={{
                minWidth: 145,

                px: 1.2,
                py: 0.75,

                textAlign:
                  "center",

                borderRadius:
                  "10px",

                backgroundColor:
                  "#f8fafb",

                border:
                  "1px solid rgba(36,74,112,.06)",
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
                {monthFormatter.format(
                  monthCursor
                )}
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setMonthCursor(
                  (prev) =>
                    subMonths(
                      prev,
                      1
                    )
                )
              }
              sx={{
                width: 34,
                height: 34,

                borderRadius:
                  "10px",

                color:
                  COLORS.navy,

                backgroundColor:
                  COLORS.grayLight,

                border:
                  "1px solid rgba(36,74,112,.06)",
              }}
            >
              <ArrowBackRounded
                sx={{
                  fontSize: 17,
                }}
              />
            </IconButton>
          </Stack>
        </Paper>

        {/* =============================================
            CALENDAR
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1,
              sm: 1.25,
              md: 1.5,
            },

            borderRadius:
              "20px",

            border:
              "1px solid rgba(18,47,77,.055)",

            backgroundColor:
              "#fff",

            boxShadow:
              "0 6px 20px rgba(18,47,77,.025)",
          }}
        >
          {/* MINI INFO */}

          <Stack
            direction="row"
            flexWrap="wrap"
            sx={{
              gap: 0.45,
              mb: 1,
            }}
          >
            <Legend
              label="غياب مسجل"
              color={
                COLORS.red
              }
              background={
                COLORS.redLight
              }
            />

            <Legend
              label="بدون غياب"
              color={
                COLORS.green
              }
              background={
                COLORS.greenLight
              }
            />

            <Legend
              label="قادم"
              color="#939da6"
              background="#f5f7f9"
            />

            <Legend
              label={`أيام مضت: ${stats.elapsed}`}
              color={
                COLORS.blue
              }
              background={
                COLORS.blueLight
              }
            />

            {attendanceTotal >
              0 && (
              <Legend
                label={`إجمالي سجلات API: ${attendanceTotal}`}
                color={
                  COLORS.navy
                }
                background="#f5f7f9"
              />
            )}
          </Stack>

          {/* GRID */}

          <Box
            sx={{
              overflowX:
                "auto",

              pb: 0.3,
            }}
          >
            <Box
              sx={{
                minWidth: 620,

                display: "grid",

                gridTemplateColumns:
                  "repeat(5,minmax(0,1fr))",

                gap: 0.55,
              }}
            >
              {/* WEEK HEADER */}

              {WEEK_DAYS_AR.map(
                (day) => (
                  <Box
                    key={day}
                    sx={{
                      py: 0.8,

                      textAlign:
                        "center",

                      borderRadius:
                        "9px",

                      color:
                        COLORS.deepNavy,

                      backgroundColor:
                        "#f7f9fb",

                      border:
                        "1px solid rgba(36,74,112,.065)",

                      fontSize:
                        "8px",

                      fontWeight:
                        900,
                    }}
                  >
                    {day}
                  </Box>
                )
              )}

              {/* LEADING CELLS */}

              {leadingEmptyCells.map(
                (item) => (
                  <Box
                    key={`empty-${item}`}
                    sx={{
                      minHeight:
                        62,

                      borderRadius:
                        "10px",

                      backgroundColor:
                        "#fbfcfd",
                    }}
                  />
                )
              )}

              {/* DAYS */}

              {schoolDays.map(
                (day) => {
                  const key =
                    format(
                      day,
                      "yyyy-MM-dd"
                    );

                  const status =
                    getDayStatus({
                      day,
                      absenceDates,
                      today,
                    });

                  const theme =
                    getDayTheme(
                      status
                    );

                  const current =
                    isToday(day);

                  return (
                    <Box
                      key={key}
                      sx={{
                        minHeight:
                          62,

                        px: 0.8,
                        py: 0.7,

                        display:
                          "flex",

                        flexDirection:
                          "column",

                        justifyContent:
                          "space-between",

                        borderRadius:
                          "10px",

                        backgroundColor:
                          theme.background,

                        border:
                          current
                            ? `2px solid ${COLORS.blue}`
                            : `1px solid ${theme.border}`,

                        transition:
                          "transform .15s ease, box-shadow .15s ease",

                        "&:hover":
                          {
                            transform:
                              "translateY(-1px)",

                            boxShadow:
                              "0 5px 12px rgba(18,47,77,.04)",
                          },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          sx={{
                            color:
                              COLORS.deepNavy,

                            fontSize:
                              "9px",

                            fontWeight:
                              900,
                          }}
                        >
                          {dayFormatter.format(
                            day
                          )}
                        </Typography>

                        {current && (
                          <Chip
                            label="اليوم"
                            sx={{
                              height:
                                17,

                              color:
                                COLORS.blue,

                              backgroundColor:
                                "#fff",

                              fontSize:
                                "5.5px",

                              fontWeight:
                                900,

                              "& .MuiChip-label":
                                {
                                  px: 0.6,
                                },
                            }}
                          />
                        )}
                      </Stack>

                      <Typography
                        sx={{
                          mt: 0.7,

                          color:
                            theme.color,

                          fontSize:
                            "6.5px",

                          fontWeight:
                            800,
                        }}
                      >
                        {theme.label}
                      </Typography>
                    </Box>
                  );
                }
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// =====================================================
// HEADER BADGE
// =====================================================

const HeaderBadge = ({
  icon: Icon,
  label,
  color,
  background,
}) => (
  <Chip
    icon={<Icon />}
    label={label}
    sx={{
      height: 29,

      color,

      backgroundColor:
        background,

      border:
        "1px solid rgba(36,74,112,.05)",

      fontSize: "7px",

      fontWeight: 900,

      "& .MuiChip-label":
        {
          px: 0.8,
        },

      "& .MuiChip-icon":
        {
          mr: 0.45,
          ml: -0.1,

          color,

          fontSize:
            "14px",
        },
    }}
  />
);

// =====================================================
// LEGEND
// =====================================================

const Legend = ({
  label,
  color,
  background,
}) => (
  <Chip
    label={label}
    sx={{
      height: 24,

      color,

      backgroundColor:
        background,

      fontSize: "6.5px",

      fontWeight: 800,

      "& .MuiChip-label":
        {
          px: 0.8,
        },
    }}
  />
);

export default Attendance;