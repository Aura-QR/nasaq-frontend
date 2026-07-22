import { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  ArrowBackRounded,
  AssignmentTurnedInRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DescriptionRounded,
  LogoutRounded,
  MenuBookRounded,
  NotificationsNoneRounded,
  QuizRounded,
  ScheduleRounded,
  TrendingUpRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";
import { useNavigate } from "react-router-dom";

import nasaqLogo from "../../images/wadq-logo.png";

const stats = [
  {
    title: "حصص اليوم",
    value: "06",
    helper: "متبقي 3 حصص",
    icon: <CalendarMonthRounded />,
  },
  {
    title: "دروس جاهزة",
    value: "12",
    helper: "تم إعدادها هذا الأسبوع",
    icon: <MenuBookRounded />,
  },
  {
    title: "مهام مكتملة",
    value: "08",
    helper: "من أصل 10 مهام",
    icon: <AssignmentTurnedInRounded />,
  },
  {
    title: "نسبة الإنجاز",
    value: "82%",
    helper: "أفضل من الأسبوع الماضي",
    icon: <TrendingUpRounded />,
  },
];

const quickTools = [
  {
    title: "تحضير درس",
    description: "أنشئ خطة درس منظمة خلال دقائق",
    icon: <AutoAwesomeRounded />,
    path: "/teacher/preparation",
  },
  {
    title: "إنشاء اختبار",
    description: "كوّن اختبارًا مناسبًا لمحتوى الدرس",
    icon: <QuizRounded />,
    path: "/teacher/exams",
  },
  {
    title: "ورقة عمل",
    description: "جهّز نشاطًا سريعًا لطلابك",
    icon: <DescriptionRounded />,
    path: "/teacher/worksheets",
  },
  {
    title: "شهادة",
    description: "أنشئ شهادة تقدير بقالب احترافي",
    icon: <WorkspacePremiumRounded />,
    path: "/teacher/certificates",
  },
];

const todaySchedule = [
  {
    time: "08:00",
    subject: "الرياضيات",
    lesson: "الكسور الاعتيادية",
    status: "جاهز",
  },
  {
    time: "09:00",
    subject: "العلوم",
    lesson: "دورة الماء",
    status: "قيد المراجعة",
  },
  {
    time: "10:30",
    subject: "اللغة العربية",
    lesson: "المفعول به",
    status: "غير محضّر",
  },
];

const recentPreparations = [
  {
    title: "الكسور الاعتيادية",
    subject: "الرياضيات",
    date: "اليوم، 07:25 ص",
    progress: 100,
  },
  {
    title: "دورة الماء",
    subject: "العلوم",
    date: "أمس، 08:40 م",
    progress: 75,
  },
  {
    title: "المفعول به",
    subject: "اللغة العربية",
    date: "20 يوليو، 06:10 م",
    progress: 40,
  },
];

const getStatusStyles = (status) => {
  if (status === "جاهز") {
    return {
      color: "#2f7d58",
      backgroundColor: "#e7f6ed",
    };
  }

  if (status === "قيد المراجعة") {
    return {
      color: "#9a6b12",
      backgroundColor: "#fff3d8",
    };
  }

  return {
    color: "#9d3d3d",
    backgroundColor: "#fdeaea",
  };
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const signOut = useSignOut();

  const authState = getAuthUser?.();
  const currentUser =
    authState?.user || authState || {};

  const teacherName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.firstName ||
    "المعلم";

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "اليوم";
    }
  }, []);

  const handleLogout = () => {
    signOut();

    localStorage.removeItem("permissions");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        color: "var(--color-text)",
        backgroundColor: "var(--color-page)",
        backgroundImage: `
          radial-gradient(
            circle at 10% 10%,
            rgba(211, 164, 79, 0.08),
            transparent 24%
          ),
          radial-gradient(
            circle at 90% 5%,
            rgba(36, 74, 112, 0.09),
            transparent 26%
          )
        `,
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: {
            xs: 2,
            md: 4,
          },
          py: 1.5,
          backgroundColor:
            "rgba(240, 237, 230, 0.82)",
          borderBottom:
            "1px solid rgba(36, 74, 112, 0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "min(100%, 1480px)",
            minHeight: 72,
            mx: "auto",
            px: {
              xs: 1.5,
              sm: 2.5,
            },
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            border:
              "1px solid rgba(211, 164, 79, 0.16)",
            borderRadius: "22px",
            backgroundColor:
              "rgba(255, 252, 247, 0.94)",
            boxShadow:
              "0 14px 34px rgba(18, 47, 77, 0.10)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="شعار منصة نَسّق"
              sx={{
                width: {
                  xs: 112,
                  sm: 138,
                },
                height: 52,
                objectFit: "contain",
                objectPosition: "right center",
              }}
            />
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              aria-label="الإشعارات"
              sx={{
                width: 44,
                height: 44,
                color: "var(--color-navy)",
                backgroundColor:
                  "rgba(36, 74, 112, 0.06)",
                border:
                  "1px solid rgba(36, 74, 112, 0.08)",
              }}
            >
              <NotificationsNoneRounded />
            </IconButton>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                display: {
                  xs: "none",
                  sm: "flex",
                },
                px: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  color: "var(--color-navy-deep)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211, 164, 79, 0.28)",
                  fontWeight: 800,
                }}
              >
                {String(teacherName).trim().charAt(0)}
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {teacherName}
                </Typography>

                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  معلم
                </Typography>
              </Box>
            </Stack>

            <IconButton
              aria-label="تسجيل الخروج"
              onClick={handleLogout}
              sx={{
                width: 44,
                height: 44,
                color: "var(--color-danger)",
                backgroundColor:
                  "rgba(201, 79, 79, 0.07)",
                border:
                  "1px solid rgba(201, 79, 79, 0.10)",
              }}
            >
              <LogoutRounded />
            </IconButton>
          </Stack>
        </Paper>
      </Box>

      <Box
        component="main"
        sx={{
          width: "min(100%, 1480px)",
          mx: "auto",
          px: {
            xs: 2,
            md: 4,
          },
          py: {
            xs: 3,
            md: 4,
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            mb: 3,
            p: {
              xs: 2.5,
              sm: 3.5,
              md: 4,
            },
            borderRadius: {
              xs: "22px",
              md: "28px",
            },
            color: "var(--color-white)",
            background: `
              linear-gradient(
                135deg,
                var(--color-navy-deep) 0%,
                var(--color-navy) 56%,
                var(--color-navy-light) 100%
              )
            `,
            boxShadow:
              "0 24px 55px rgba(18, 47, 77, 0.20)",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 320,
              height: 320,
              top: -170,
              left: -100,
              border:
                "1px solid rgba(242, 215, 146, 0.18)",
              borderRadius: "50%",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              width: 250,
              height: 250,
              bottom: -170,
              right: -60,
              border:
                "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            justifyContent="space-between"
            spacing={3}
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box>
              <Chip
                icon={<AutoAwesomeRounded />}
                label="لوحة المعلم"
                sx={{
                  mb: 2,
                  color: "var(--color-gold-light)",
                  backgroundColor:
                    "rgba(255, 255, 255, 0.10)",
                  border:
                    "1px solid rgba(242, 215, 146, 0.22)",
                  "& .MuiChip-icon": {
                    color: "var(--color-gold-light)",
                  },
                }}
              />

              <Typography
                component="h1"
                sx={{
                  maxWidth: 760,
                  mb: 1,
                  color: "var(--color-white)",
                  fontSize: {
                    xs: "28px",
                    sm: "36px",
                    md: "43px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.35,
                }}
              >
                صباح الخير، {teacherName}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 700,
                  color: "rgba(255,255,255,0.76)",
                  fontSize: {
                    xs: "13px",
                    sm: "15px",
                  },
                  lineHeight: 1.9,
                }}
              >
                رتّب يومك، تابع حصصك، وابدأ تحضير
                دروسك من مكان واحد.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.5}
                sx={{
                  mt: 3,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() =>
                    navigate("/teacher/preparation")
                  }
                  sx={{
                    minHeight: 52,
                    px: 3,
                    borderRadius: "15px",
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    boxShadow:
                      "0 14px 28px rgba(0,0,0,0.16)",
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor:
                        "var(--color-gold)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  ابدأ تحضير درس
                </Button>

                <Button
                  variant="outlined"
                  endIcon={<ArrowBackRounded />}
                  onClick={() =>
                    navigate("/teacher/schedule")
                  }
                  sx={{
                    minHeight: 52,
                    px: 3,
                    borderRadius: "15px",
                    color: "var(--color-white)",
                    borderColor:
                      "rgba(255,255,255,0.28)",
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      borderColor:
                        "var(--color-gold-light)",
                      backgroundColor:
                        "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  عرض الجدول
                </Button>
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                minWidth: {
                  xs: "100%",
                  md: 280,
                },
                p: 2.5,
                border:
                  "1px solid rgba(255,255,255,0.14)",
                borderRadius: "20px",
                color: "var(--color-white)",
                backgroundColor:
                  "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  mb: 1.5,
                }}
              >
                <ScheduleRounded
                  sx={{
                    color: "var(--color-gold-light)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  اليوم الدراسي
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mb: 2,
                  color: "rgba(255,255,255,0.70)",
                  fontSize: "12px",
                  lineHeight: 1.8,
                }}
              >
                {todayLabel}
              </Typography>

              <Divider
                sx={{
                  mb: 2,
                  borderColor:
                    "rgba(255,255,255,0.12)",
                }}
              />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.62)",
                      fontSize: "10px",
                    }}
                  >
                    الحصة القادمة
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: "15px",
                      fontWeight: 800,
                    }}
                  >
                    الرياضيات
                  </Typography>
                </Box>

                <Chip
                  label="08:00"
                  sx={{
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    fontWeight: 800,
                  }}
                />
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 3,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {stats.map((stat) => (
            <Paper
              key={stat.title}
              elevation={0}
              sx={{
                p: 2.5,
                border:
                  "1px solid rgba(36, 74, 112, 0.09)",
                borderRadius: "20px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 12px 28px rgba(18, 47, 77, 0.07)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "var(--color-muted)",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {stat.title}
                  </Typography>

                  <Typography
                    sx={{
                      my: 0.5,
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "28px",
                      fontWeight: 800,
                    }}
                  >
                    {stat.value}
                  </Typography>

                  <Typography
                    sx={{
                      color: "var(--color-muted)",
                      fontSize: "10px",
                    }}
                  >
                    {stat.helper}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    border:
                      "1px solid rgba(211, 164, 79, 0.22)",
                    borderRadius: "16px",
                  }}
                >
                  {stat.icon}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.35fr) minmax(330px, 0.65fr)",
            },
            gap: 3,
          }}
        >
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: {
                  xs: 2.2,
                  sm: 3,
                },
                border:
                  "1px solid rgba(36, 74, 112, 0.09)",
                borderRadius: "24px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 14px 30px rgba(18, 47, 77, 0.07)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    component="h2"
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    أدواتك السريعة
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: "var(--color-muted)",
                      fontSize: "11px",
                    }}
                  >
                    ابدأ أي مهمة من مكان واحد
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {quickTools.map((tool) => (
                  <Button
                    key={tool.title}
                    onClick={() =>
                      navigate(tool.path)
                    }
                    sx={{
                      p: 2,
                      minHeight: 110,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 2,
                      textAlign: "right",
                      border:
                        "1px solid rgba(36, 74, 112, 0.09)",
                      borderRadius: "18px",
                      color:
                        "var(--color-navy-deep)",
                      backgroundColor:
                        "var(--color-white)",
                      textTransform: "none",
                      "&:hover": {
                        borderColor:
                          "rgba(211, 164, 79, 0.42)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        transform:
                          "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color:
                          "var(--color-gold-dark)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        borderRadius: "15px",
                      }}
                    >
                      {tool.icon}
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 800,
                        }}
                      >
                        {tool.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.6,
                          color:
                            "var(--color-muted)",
                          fontSize: "10px",
                          lineHeight: 1.6,
                        }}
                      >
                        {tool.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: {
                  xs: 2.2,
                  sm: 3,
                },
                border:
                  "1px solid rgba(36, 74, 112, 0.09)",
                borderRadius: "24px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 14px 30px rgba(18, 47, 77, 0.07)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    component="h2"
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    جدول اليوم
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: "var(--color-muted)",
                      fontSize: "11px",
                    }}
                  >
                    تابع حصصك وتحضيراتك القادمة
                  </Typography>
                </Box>

                <Button
                  endIcon={<ArrowBackRounded />}
                  onClick={() =>
                    navigate("/teacher/schedule")
                  }
                  sx={{
                    color: "var(--color-navy)",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  الجدول كاملًا
                </Button>
              </Stack>

              <Stack spacing={1.25}>
                {todaySchedule.map((item) => (
                  <Paper
                    key={`${item.time}-${item.subject}`}
                    elevation={0}
                    sx={{
                      p: 1.7,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "72px 1fr",
                        sm: "82px 1fr auto",
                      },
                      alignItems: "center",
                      gap: 1.5,
                      border:
                        "1px solid rgba(36, 74, 112, 0.08)",
                      borderRadius: "16px",
                      backgroundColor:
                        "var(--color-white)",
                    }}
                  >
                    <Chip
                      label={item.time}
                      sx={{
                        color:
                          "var(--color-navy-deep)",
                        backgroundColor:
                          "rgba(36, 74, 112, 0.07)",
                        fontWeight: 800,
                      }}
                    />

                    <Box>
                      <Typography
                        sx={{
                          color:
                            "var(--color-navy-deep)",
                          fontSize: "13px",
                          fontWeight: 800,
                        }}
                      >
                        {item.subject}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.4,
                          color:
                            "var(--color-muted)",
                          fontSize: "10px",
                        }}
                      >
                        {item.lesson}
                      </Typography>
                    </Box>

                    <Chip
                      label={item.status}
                      sx={{
                        display: {
                          xs: "none",
                          sm: "inline-flex",
                        },
                        ...getStatusStyles(item.status),
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border:
                  "1px solid rgba(36, 74, 112, 0.09)",
                borderRadius: "24px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 14px 30px rgba(18, 47, 77, 0.07)",
              }}
            >
              <Typography
                component="h2"
                sx={{
                  mb: 0.5,
                  color: "var(--color-navy-deep)",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                آخر التحضيرات
              </Typography>

              <Typography
                sx={{
                  mb: 2.5,
                  color: "var(--color-muted)",
                  fontSize: "11px",
                }}
              >
                أكمل ما بدأته أو راجع الملفات الجاهزة
              </Typography>

              <Stack spacing={1.5}>
                {recentPreparations.map(
                  (preparation) => (
                    <Paper
                      key={preparation.title}
                      elevation={0}
                      sx={{
                        p: 1.8,
                        border:
                          "1px solid rgba(36, 74, 112, 0.08)",
                        borderRadius: "16px",
                        backgroundColor:
                          "var(--color-white)",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Box>
                          <Typography
                            sx={{
                              color:
                                "var(--color-navy-deep)",
                              fontSize: "13px",
                              fontWeight: 800,
                            }}
                          >
                            {preparation.title}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.4,
                              color:
                                "var(--color-muted)",
                              fontSize: "10px",
                            }}
                          >
                            {preparation.subject} •{" "}
                            {preparation.date}
                          </Typography>
                        </Box>

                        {preparation.progress ===
                        100 ? (
                          <CheckCircleRounded
                            sx={{
                              color:
                                "var(--color-success)",
                              fontSize: 22,
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color:
                                "var(--color-gold-dark)",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {preparation.progress}%
                          </Typography>
                        )}
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={preparation.progress}
                        sx={{
                          height: 7,
                          mt: 1.6,
                          borderRadius: 999,
                          backgroundColor:
                            "rgba(36, 74, 112, 0.08)",
                          "& .MuiLinearProgress-bar":
                            {
                              borderRadius: 999,
                              backgroundColor:
                                preparation.progress ===
                                100
                                  ? "var(--color-success)"
                                  : "var(--color-gold)",
                            },
                        }}
                      />
                    </Paper>
                  )
                )}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                overflow: "hidden",
                borderRadius: "24px",
                color: "var(--color-white)",
                background: `
                  linear-gradient(
                    145deg,
                    var(--color-navy) 0%,
                    var(--color-navy-deep) 100%
                  )
                `,
                boxShadow:
                  "0 18px 40px rgba(18, 47, 77, 0.16)",
              }}
            >
              <Typography
                sx={{
                  color: "var(--color-gold-light)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                إنجاز الأسبوع
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                أداء رائع 👏
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "rgba(255,255,255,0.70)",
                  fontSize: "11px",
                  lineHeight: 1.8,
                }}
              >
                أكملت 8 مهام وحضّرت 12 درسًا هذا
                الأسبوع.
              </Typography>

              <LinearProgress
                variant="determinate"
                value={82}
                sx={{
                  height: 9,
                  mt: 2.5,
                  borderRadius: 999,
                  backgroundColor:
                    "rgba(255,255,255,0.12)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor:
                      "var(--color-gold-light)",
                  },
                }}
              />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  mt: 1,
                }}
              >
                <Typography
                  sx={{
                    color:
                      "rgba(255,255,255,0.66)",
                    fontSize: "10px",
                  }}
                >
                  التقدم الأسبوعي
                </Typography>

                <Typography
                  sx={{
                    color:
                      "var(--color-gold-light)",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  82%
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
