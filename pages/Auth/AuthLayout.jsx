import {
  AutoAwesomeRounded,
  AutoStoriesRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DashboardCustomizeRounded,
  LoginRounded,
  MenuBookRounded,
  PersonAddAltRounded,
  QueryStatsRounded,
  SchoolRounded,
  TaskAltRounded,
  TrendingUpRounded,
} from "@mui/icons-material";


import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import wadqLogo from "../../images/wadq-logo.png";

/* =========================================
   Colors
========================================= */

export const authColors = {
  page: "#F0EDE6",

  navy: "#244A70",
  navyDark: "#1B3D61",
  navyDeep: "#122F4D",
  navyLight: "#315E88",

  gold: "#D3A44F",
  goldDark: "#B78430",
  goldLight: "#F2D792",
  goldSoft: "#FBF0D8",

  cream: "#FFFCF7",
  white: "#FFFFFF",

  text: "#193754",
  muted: "#7E8791",
  border: "#DED8CD",

  success: "#74C99A",
  danger: "#C94F4F",
};

/* =========================================
   Shared input
========================================= */

export const AuthField = ({
  label,
  type = "text",
  placeholder,
  icon,
  error,
  registration,
  autoComplete,
  inputMode,
  endAdornment,
}) => {
  return (
    <Box>
      <Typography
        component="label"
        sx={{
          display: "block",
          mb: 0.75,

          color: authColors.text,

          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          minHeight: 56,
          px: 1.3,

          display: "flex",
          alignItems: "center",
          gap: 0.8,

          direction: "rtl",
          overflow: "hidden",

          borderRadius: "14px",

          border: `1px solid ${
            error ? authColors.danger : authColors.border
          }`,

          backgroundColor: "rgba(255,255,255,0.84)",

          transition:
            "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",

          "&:hover": {
            borderColor: error
              ? authColors.danger
              : "rgba(211,164,79,0.7)",
          },

          "&:focus-within": {
            borderColor: authColors.gold,

            boxShadow:
              "0 0 0 4px rgba(211,164,79,0.12)",

            transform: "translateY(-1px)",
          },
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,

            display: "grid",
            placeItems: "center",

            borderRadius: "11px",

            color: error
              ? authColors.danger
              : authColors.navy,

            backgroundColor: error
              ? "rgba(201,79,79,0.08)"
              : "rgba(36,74,112,0.07)",

            "& svg": {
              fontSize: 19,
            },
          }}
        >
          {icon}
        </Box>

        <Box
          component="input"
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          {...registration}
          sx={{
            flex: 1,
            minWidth: 0,

            py: 1.2,

            border: 0,
            outline: 0,

            direction: "rtl",
            textAlign: "right",

            color: authColors.text,
            backgroundColor: "transparent",

            fontFamily: "Tajawal, Arial, sans-serif",
            fontSize: "14px",

            "&::placeholder": {
              color: "#A4A7AD",
              opacity: 1,
            },

            "&:-webkit-autofill": {
              WebkitBoxShadow:
                "0 0 0 100px #FFFFFF inset",

              WebkitTextFillColor: authColors.text,
            },
          }}
        />

        {endAdornment && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {endAdornment}
          </Box>
        )}
      </Box>

      {error && (
        <Typography
          sx={{
            mt: 0.55,

            color: authColors.danger,

            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

/* =========================================
   Brand
========================================= */

const Brand = () => {
  const navigate = useNavigate();

  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate("/")}
      aria-label="العودة إلى الصفحة الرئيسية"
      sx={{
        width: "fit-content",
        p: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.15,
        border: 0,
        color: "inherit",
        backgroundColor: "transparent",
        fontFamily: "Tajawal, Arial, sans-serif",
        cursor: "pointer",

        "&:hover .wadq-auth-logo": {
          transform: "translateY(-2px)",
          boxShadow: "0 15px 32px rgba(36,74,112,0.2)",
        },
      }}
    >
      <Box
        className="wadq-auth-logo"
        sx={{
          position: "relative",

          width: {
            xs: 60,
            sm: 66,
          },

          height: {
            xs: 58,
            sm: 62,
          },

          flexShrink: 0,
          overflow: "hidden",

          borderRadius: "16px",

          backgroundColor: authColors.white,

          border: "1px solid rgba(36,74,112,0.08)",

          boxShadow:
            "0 12px 27px rgba(36,74,112,0.14)",

          transition:
            "transform 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        <Box
          component="img"
          src={wadqLogo}
          alt=""
          aria-hidden="true"
          sx={{
            position: "absolute",

            top: {
              xs: -7,
              sm: -8,
            },

            left: "50%",

            width: {
              xs: 114,
              sm: 124,
            },

            maxWidth: "none",

            transform: "translateX(-50%)",

            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Typography
          sx={{
            color: authColors.navyDeep,

            fontSize: {
              xs: "20px",
              sm: "23px",
            },

            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          نَسّق
        </Typography>

        <Typography
          sx={{
            mt: 0.55,

            color: authColors.muted,

            fontSize: {
              xs: "9px",
              sm: "10px",
            },

            fontWeight: 600,
          }}
        >
          منصة المعلم الذكية
        </Typography>
      </Box>
    </Box>
  );
};

/* =========================================
   Authentication tabs
========================================= */

const AuthTabs = ({
  activeMode,
  onLogin,
  onRegister,
}) => {
  const isLogin = activeMode === "login";

  return (
    <Box
      sx={{
        position: "relative",

        width: "100%",

        display: "grid",
        gridTemplateColumns: "1fr 1fr",

        p: 0.5,

        borderRadius: "14px",

        backgroundColor: "rgba(36,74,112,0.055)",
        border: "1px solid rgba(36,74,112,0.07)",
      }}
    >
      <Box
        sx={{
          position: "absolute",

          top: 4,
          bottom: 4,

          right: isLogin
            ? 4
            : "calc(50% + 1px)",

          width: "calc(50% - 5px)",

          borderRadius: "11px",

          backgroundColor: authColors.white,

          boxShadow:
            "0 6px 18px rgba(36,74,112,0.1)",

          transition:
            "right 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      <Button
        type="button"
        onClick={onLogin}
        startIcon={<LoginRounded />}
        sx={{
          position: "relative",
          zIndex: 2,

          minHeight: 45,

          color: isLogin
            ? authColors.navyDeep
            : authColors.muted,

          fontFamily: "Tajawal, Arial, sans-serif",
          fontSize: "13px",
          fontWeight: isLogin ? 800 : 600,
          textTransform: "none",

          "&:hover": {
            backgroundColor: "transparent",
          },

          "& .MuiButton-startIcon": {
            ml: 0.7,
            mr: 0,
          },

          "& svg": {
            fontSize: 18,
          },
        }}
      >
        تسجيل الدخول
      </Button>

      <Button
        type="button"
        onClick={onRegister}
        startIcon={<PersonAddAltRounded />}
        sx={{
          position: "relative",
          zIndex: 2,

          minHeight: 45,

          color: !isLogin
            ? authColors.navyDeep
            : authColors.muted,

          fontFamily: "Tajawal, Arial, sans-serif",
          fontSize: "13px",
          fontWeight: !isLogin ? 800 : 600,
          textTransform: "none",

          "&:hover": {
            backgroundColor: "transparent",
          },

          "& .MuiButton-startIcon": {
            ml: 0.7,
            mr: 0,
          },

          "& svg": {
            fontSize: 18,
          },
        }}
      >
        إنشاء حساب
      </Button>
    </Box>
  );
};

/* =========================================
   Platform feature cards
========================================= */

const platformFeatures = [
  {
    icon: <MenuBookRounded />,
    title: "تحضير الدروس",
    subtitle: "أنشئ خطة درس منظمة",
  },
  {
    icon: <CalendarMonthRounded />,
    title: "الجدول الأسبوعي",
    subtitle: "نظّم حصصك بسهولة",
  },
  {
    icon: <TaskAltRounded />,
    title: "المهام والواجبات",
    subtitle: "تابع كل مهامك",
  },
  {
    icon: <QueryStatsRounded />,
    title: "تقارير الأداء",
    subtitle: "اعرف مستوى إنجازك",
  },
];

const PlatformFeatureCard = ({
  item,
  position,
  delay,
}) => {
  const positions = {
    topRight: {
      top: "17%",
      right: 0,
    },

    topLeft: {
      top: "18%",
      left: 0,
    },

    bottomRight: {
      bottom: "18%",
      right: 0,
    },

    bottomLeft: {
      bottom: "17%",
      left: 0,
    },
  };

  return (
    <Box
      sx={{
        position: "absolute",
        zIndex: 5,

        ...positions[position],

        width: {
          md: 156,
          lg: 184,
        },

        p: {
          md: 1.1,
          lg: 1.35,
        },

        display: "flex",
        alignItems: "center",
        gap: 0.9,

        borderRadius: "15px",

        background:
          "linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.07))",

        border:
          "1px solid rgba(255,255,255,0.16)",

        backdropFilter: "blur(16px)",

        boxShadow:
          "0 18px 36px rgba(15,45,73,0.25)",

        animation: `featureFloating 4.8s ease-in-out ${delay}s infinite`,

        "@keyframes featureFloating": {
          "0%, 100%": {
            transform: "translateY(0)",
          },

          "50%": {
            transform: "translateY(-7px)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,

          display: "grid",
          placeItems: "center",

          borderRadius: "12px",

          color: authColors.goldLight,

          backgroundColor:
            "rgba(211,164,79,0.16)",

          border:
            "1px solid rgba(211,164,79,0.25)",

          "& svg": {
            fontSize: 19,
          },
        }}
      >
        {item.icon}
      </Box>

      <Box>
        <Typography
          sx={{
            color: authColors.white,

            fontSize: {
              md: "8px",
              lg: "10px",
            },

            fontWeight: 800,
          }}
        >
          {item.title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,

            color: "rgba(255,255,255,0.64)",

            fontSize: {
              md: "6px",
              lg: "7px",
            },

            lineHeight: 1.55,
          }}
        >
          {item.subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

/* =========================================
   Animated platform visual
========================================= */

const AnimatedVisual = () => {
  const weekDays = [
    {
      day: "الأحد",
      active: true,
    },
    {
      day: "الاثنين",
      active: false,
    },
    {
      day: "الثلاثاء",
      active: false,
    },
    {
      day: "الأربعاء",
      active: false,
    },
    {
      day: "الخميس",
      active: false,
    },
  ];

  const lessonRows = [
    {
      time: "08:00",
      subject: "الرياضيات",
      className: "الصف الثاني المتوسط",
      status: "جاهز",
      statusType: "success",
    },
    {
      time: "09:30",
      subject: "العلوم",
      className: "الصف الأول المتوسط",
      status: "مراجعة",
      statusType: "pending",
    },
    {
      time: "11:00",
      subject: "اللغة العربية",
      className: "الصف الثالث المتوسط",
      status: "جاهز",
      statusType: "success",
    },
  ];

  return (
    <Box
      dir="rtl"
      sx={{
        position: "absolute",
        inset: 0,

        overflow: "hidden",

        background: `
          radial-gradient(
            circle at 17% 13%,
            rgba(211,164,79,0.22),
            transparent 29%
          ),
          radial-gradient(
            circle at 87% 82%,
            rgba(78,125,166,0.7),
            transparent 47%
          ),
          linear-gradient(
            145deg,
            #173A5D 0%,
            #214B72 48%,
            #2F628E 100%
          )
        `,
      }}
    >
      {/* Moving glow */}

      <Box
        sx={{
          position: "absolute",

          top: -150,
          left: -130,

          width: 400,
          height: 400,

          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(242,215,146,0.2), transparent 68%)",

          animation:
            "movingVisualGlow 10s ease-in-out infinite",

          "@keyframes movingVisualGlow": {
            "0%, 100%": {
              transform:
                "translate(0, 0) scale(1)",
            },

            "50%": {
              transform:
                "translate(50px, 40px) scale(1.12)",
            },
          },
        }}
      />

      {/* Dot pattern */}

      <Box
        sx={{
          position: "absolute",
          inset: 0,

          opacity: 0.2,

          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.62) 1px, transparent 1px)",

          backgroundSize: "28px 28px",

          maskImage:
            "linear-gradient(to bottom, black, transparent 84%)",
        }}
      />

      {/* Decorative rings */}

      <Box
        sx={{
          position: "absolute",

          width: 410,
          height: 410,

          right: -215,
          bottom: -210,

          borderRadius: "50%",

          border:
            "1px solid rgba(242,215,146,0.17)",

          "&::after": {
            content: '""',

            position: "absolute",
            inset: 38,

            borderRadius: "50%",

            border:
              "1px solid rgba(242,215,146,0.1)",
          },
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          height: "100%",

          px: {
            md: 3.5,
            lg: 5,
          },

          py: {
            md: 3.5,
            lg: 4.5,
          },

          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top title */}

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              position: "relative",

              width: 48,
              height: 48,

              flexShrink: 0,
              overflow: "hidden",

              borderRadius: "14px",

              backgroundColor: authColors.white,

              border:
                "1px solid rgba(242,215,146,0.34)",

              boxShadow:
                "0 12px 28px rgba(20,50,80,0.22)",
            }}
          >
            <Box
              component="img"
              src={wadqLogo}
              alt=""
              aria-hidden="true"
              sx={{
                position: "absolute",
                top: -5,
                left: "50%",

                width: 92,
                maxWidth: "none",

                transform: "translateX(-50%)",
                objectFit: "contain",
              }}
            />
          </Box>

          <Box>
            
            <Typography
              sx={{
                color: authColors.white,

                fontSize: {
                  md: "12px",
                  lg: "14px",
                },

                fontWeight: 800,
              }}
            >
              نَسّق لكل احتياجات المعلم
            </Typography>

            <Typography
              sx={{
                mt: 0.2,

                color: "rgba(255,255,255,0.62)",

                fontSize: {
                  md: "7px",
                  lg: "8px",
                },
              }}
            >
              حضّر، نظّم، تابع وطوّر أداءك
            </Typography>
          </Box>
        </Stack>

        {/* Main laptop area */}

        <Box
          sx={{
            position: "relative",

            flex: 1,

            display: "grid",
            placeItems: "center",

            minHeight: 0,
          }}
        >
          {/* Laptop shadow */}

          <Box
            sx={{
              position: "absolute",

              width: "65%",
              height: 32,

              bottom: "15%",

              borderRadius: "50%",

              backgroundColor:
                "rgba(13,38,62,0.38)",

              filter: "blur(18px)",
            }}
          />

          {/* Laptop */}

          <Box
            sx={{
              position: "relative",
              zIndex: 3,

              width: {
                md: "73%",
                lg: "68%",
              },

              maxWidth: 545,

              p: 1.1,

              borderRadius: "22px",

              background:
                "linear-gradient(145deg, #3A6A94, #1A4165)",

              border:
                "1px solid rgba(255,255,255,0.2)",

              boxShadow:
                "0 35px 70px rgba(15,45,72,0.34)",

              animation:
                "platformLaptopFloat 6s ease-in-out infinite",

              "@keyframes platformLaptopFloat": {
                "0%, 100%": {
                  transform:
                    "translateY(0) rotate(0deg)",
                },

                "50%": {
                  transform:
                    "translateY(-8px) rotate(-0.25deg)",
                },
              },
            }}
          >
            {/* Browser header */}

            <Box
              sx={{
                minHeight: 34,

                px: 1.2,

                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",

                borderRadius: "13px 13px 8px 8px",

                backgroundColor:
                  "rgba(255,255,255,0.08)",
              }}
            >
              <Stack
                direction="row"
                spacing={0.55}
              >
                {[
                  authColors.gold,
                  "#91A7BC",
                  "#5E7891",
                ].map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 7,
                      height: 7,

                      borderRadius: "50%",

                      backgroundColor: color,
                    }}
                  />
                ))}
              </Stack>

              <Typography
                sx={{
                  color:
                    "rgba(255,255,255,0.52)",

                  fontSize: "6.5px",
                }}
              >
                wadq-teacher-platform
              </Typography>
            </Box>

            {/* Dashboard */}

            <Box
              sx={{
                mt: 0.85,

                p: {
                  md: 1.2,
                  lg: 1.5,
                },

                borderRadius: "14px",

                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.06))",

                border:
                  "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Dashboard title */}

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      color: authColors.white,

                      fontSize: {
                        md: "10px",
                        lg: "13px",
                      },

                      fontWeight: 800,
                    }}
                  >
                    لوحة المعلم الذكية
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color:
                        "rgba(255,255,255,0.58)",

                      fontSize: {
                        md: "6px",
                        lg: "7px",
                      },
                    }}
                  >
                    نظّم حصصك ودروسك ومهامك من مكان واحد
                  </Typography>
                </Box>

                <Box
                  sx={{
                    px: 0.9,
                    py: 0.5,

                    display: "flex",
                    alignItems: "center",
                    gap: 0.45,

                    borderRadius: "999px",

                    color: authColors.goldLight,

                    backgroundColor:
                      "rgba(211,164,79,0.17)",

                    border:
                      "1px solid rgba(242,215,146,0.25)",
                  }}
                >
                  <AutoAwesomeRounded
                    sx={{
                      fontSize: {
                        md: 11,
                        lg: 13,
                      },
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: {
                        md: "5.5px",
                        lg: "7px",
                      },

                      fontWeight: 700,
                    }}
                  >
                    مساعد نَسّق
                  </Typography>
                </Box>
              </Stack>

              {/* Statistics */}

              <Box
                sx={{
                  mt: 1.2,

                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,1fr)",
                  gap: 0.75,
                }}
              >
                {[
                  {
                    number: "06",
                    label: "حصص اليوم",
                    icon: <MenuBookRounded />,
                  },
                  {
                    number: "04",
                    label: "دروس جاهزة",
                    icon: <TaskAltRounded />,
                  },
                  {
                    number: "92%",
                    label: "نسبة الإنجاز",
                    icon: <TrendingUpRounded />,
                  },
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      p: {
                        md: 0.8,
                        lg: 1,
                      },

                      borderRadius: "11px",

                      backgroundColor:
                        "rgba(20,53,82,0.42)",

                      border:
                        "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        sx={{
                          color: authColors.white,

                          fontSize: {
                            md: "11px",
                            lg: "14px",
                          },

                          fontWeight: 800,
                        }}
                      >
                        {stat.number}
                      </Typography>

                      <Box
                        sx={{
                          color: authColors.goldLight,

                          "& svg": {
                            fontSize: {
                              md: 13,
                              lg: 15,
                            },
                          },
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Stack>

                    <Typography
                      sx={{
                        mt: 0.25,

                        color:
                          "rgba(255,255,255,0.54)",

                        fontSize: {
                          md: "5.5px",
                          lg: "6.5px",
                        },
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Weekly schedule */}

              <Box
                sx={{
                  mt: 0.9,

                  p: 0.9,

                  borderRadius: "11px",

                  backgroundColor:
                    "rgba(20,53,82,0.32)",

                  border:
                    "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    sx={{
                      color: authColors.white,

                      fontSize: {
                        md: "7px",
                        lg: "9px",
                      },

                      fontWeight: 700,
                    }}
                  >
                    الجدول الأسبوعي
                  </Typography>

                  <CalendarMonthRounded
                    sx={{
                      color: authColors.goldLight,

                      fontSize: {
                        md: 12,
                        lg: 14,
                      },
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    mt: 0.65,

                    display: "grid",
                    gridTemplateColumns:
                      "repeat(5,1fr)",
                    gap: 0.4,
                  }}
                >
                  {weekDays.map((item) => (
                    <Box
                      key={item.day}
                      sx={{
                        py: {
                          md: 0.55,
                          lg: 0.7,
                        },

                        textAlign: "center",

                        borderRadius: "7px",

                        color: item.active
                          ? authColors.navyDeep
                          : "rgba(255,255,255,0.7)",

                        backgroundColor: item.active
                          ? authColors.goldLight
                          : "rgba(255,255,255,0.09)",

                        fontSize: {
                          md: "5px",
                          lg: "6px",
                        },

                        fontWeight: 700,
                      }}
                    >
                      {item.day}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Lessons */}

              <Stack
                spacing={0.55}
                sx={{ mt: 0.8 }}
              >
                {lessonRows.map(
                  (lesson, index) => (
                    <Box
                      key={lesson.subject}
                      sx={{
                        px: 0.85,
                        py: 0.65,

                        display: "grid",
                        gridTemplateColumns:
                          "34px 1fr auto",
                        alignItems: "center",
                        gap: 0.7,

                        borderRadius: "9px",

                        backgroundColor:
                          index === 0
                            ? "rgba(211,164,79,0.17)"
                            : "rgba(255,255,255,0.075)",

                        border:
                          index === 0
                            ? "1px solid rgba(242,215,146,0.24)"
                            : "1px solid rgba(255,255,255,0.09)",

                        opacity: 0,

                        animation: `lessonRowEntrance 0.45s ease ${
                          0.35 + index * 0.14
                        }s forwards`,

                        "@keyframes lessonRowEntrance": {
                          from: {
                            opacity: 0,
                            transform:
                              "translateX(12px)",
                          },

                          to: {
                            opacity: 1,
                            transform:
                              "translateX(0)",
                          },
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            index === 0
                              ? authColors.goldLight
                              : "rgba(255,255,255,0.65)",

                          fontSize: {
                            md: "5.5px",
                            lg: "7px",
                          },

                          fontWeight: 700,
                        }}
                      >
                        {lesson.time}
                      </Typography>

                      <Box>
                        <Typography
                          sx={{
                            color: authColors.white,

                            fontSize: {
                              md: "6.5px",
                              lg: "8px",
                            },

                            fontWeight: 700,
                          }}
                        >
                          {lesson.subject}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.1,

                            color:
                              "rgba(255,255,255,0.5)",

                            fontSize: {
                              md: "4.5px",
                              lg: "5.5px",
                            },
                          }}
                        >
                          {lesson.className}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          px: 0.65,
                          py: 0.35,

                          display: "flex",
                          alignItems: "center",
                          gap: 0.3,

                          borderRadius: "999px",

                          color:
                            lesson.statusType ===
                            "success"
                              ? "#BAF0D2"
                              : authColors.goldLight,

                          backgroundColor:
                            lesson.statusType ===
                            "success"
                              ? "rgba(74,185,125,0.17)"
                              : "rgba(211,164,79,0.15)",
                        }}
                      >
                        <CheckCircleRounded
                          sx={{
                            fontSize: {
                              md: 8,
                              lg: 10,
                            },
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: {
                              md: "4.5px",
                              lg: "5.5px",
                            },

                            fontWeight: 700,
                          }}
                        >
                          {lesson.status}
                        </Typography>
                      </Box>
                    </Box>
                  )
                )}
              </Stack>
            </Box>

            {/* Laptop base */}

            <Box
              sx={{
                position: "absolute",

                left: "7%",
                right: "7%",
                bottom: -17,

                height: 21,

                borderRadius:
                  "0 0 22px 22px",

                background:
                  "linear-gradient(180deg, #37658D, #183B5C)",

                borderTop:
                  "1px solid rgba(255,255,255,0.2)",

                "&::after": {
                  content: '""',

                  position: "absolute",

                  top: 4,
                  left: "40%",
                  right: "40%",

                  height: 4,

                  borderRadius: "999px",

                  backgroundColor:
                    "rgba(255,255,255,0.18)",
                },
              }}
            />
          </Box>

          {/* Floating cards */}

          <PlatformFeatureCard
            item={platformFeatures[0]}
            position="topRight"
            delay={0}
          />

          <PlatformFeatureCard
            item={platformFeatures[1]}
            position="topLeft"
            delay={0.6}
          />

          <PlatformFeatureCard
            item={platformFeatures[2]}
            position="bottomRight"
            delay={1.2}
          />

          <PlatformFeatureCard
            item={platformFeatures[3]}
            position="bottomLeft"
            delay={1.8}
          />
        </Box>

        {/* Bottom message */}

        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.7}
            sx={{ mb: 0.9 }}
          >
            <DashboardCustomizeRounded
              sx={{
                color: authColors.goldLight,
                fontSize: 17,
              }}
            />

            <Typography
              sx={{
                color: authColors.goldLight,

                fontSize: "9px",
                fontWeight: 700,
              }}
            >
              أدوات المعلم في مكان واحد
            </Typography>
          </Stack>

          <Typography
            sx={{
              color: authColors.white,

              fontSize: {
                md: "21px",
                lg: "26px",
              },

              fontWeight: 800,
              lineHeight: 1.45,
            }}
          >
            وسّع أثر التعليم،
            <Box
              component="span"
              sx={{
                display: "block",
                color: authColors.goldLight,
              }}
            >
              ودع التنظيم على نَسّق.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 0.8,

              maxWidth: 420,

              color:
                "rgba(255,255,255,0.6)",

              fontSize: {
                md: "7px",
                lg: "8px",
              },

              lineHeight: 1.8,
            }}
          >
            حضّر دروسك ونظّم جدولك وتابع مهامك
            وتقاريرك بسهولة مع منصة نَسّق.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

/* =========================================
   Main layout
========================================= */

const AuthLayout = ({
  activeMode,
  title,
  description,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        minHeight: "100vh",

        display: "grid",
        placeItems: "center",

        p: {
          xs: 0,
          sm: 2,
          md: 3,
        },

        overflow: "hidden",

        fontFamily: "Tajawal, Arial, sans-serif",

        background: `
          radial-gradient(
            circle at 8% 10%,
            rgba(36,74,112,0.15),
            transparent 28%
          ),
          radial-gradient(
            circle at 92% 92%,
            rgba(211,164,79,0.13),
            transparent 24%
          ),
          ${authColors.page}
        `,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1420,

          height: {
            xs: "100vh",
            sm: "calc(100vh - 32px)",
            md: "min(90vh, 830px)",
          },

          minHeight: {
            md: 690,
          },

          display: "flex",
          direction: "ltr",

          overflow: "hidden",

          borderRadius: {
            xs: 0,
            sm: "25px",
            md: "30px",
          },

          backgroundColor: authColors.cream,

          border: {
            xs: 0,
            sm: "1px solid rgba(255,255,255,0.8)",
          },

          boxShadow: {
            xs: "none",
            sm: "0 30px 80px rgba(36,74,112,0.17)",
          },
        }}
      >
        {/* Left animated visual */}

        <Box
          sx={{
            position: "relative",

            width: {
              xs: 0,
              md: "55%",
            },

            height: "100%",
            flexShrink: 0,

            display: {
              xs: "none",
              md: "block",
            },

            overflow: "hidden",
          }}
        >
          <AnimatedVisual />
        </Box>

        {/* Right form */}

        <Box
          dir="rtl"
          sx={{
            position: "relative",

            width: {
              xs: "100%",
              md: "45%",
            },

            height: "100%",
            flexShrink: 0,

            overflow: "hidden",

            background: `
              radial-gradient(
                circle at 0% 20%,
                rgba(211,164,79,0.075),
                transparent 28%
              ),
              ${authColors.cream}
            `,
          }}
        >
          <Box
            sx={{
              position: "absolute",

              top: -110,
              left: -100,

              width: 240,
              height: 240,

              borderRadius: "50%",

              border:
                "1px solid rgba(211,164,79,0.12)",

              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 2,

              width: "100%",
              height: "100%",

              px: {
                xs: 3,
                sm: 5,
                md: 5,
                lg: 7,
              },

              py: {
                xs: 3,
                md: 4,
              },

              display: "flex",
              flexDirection: "column",

              overflowY: "auto",
              overflowX: "hidden",

              scrollbarWidth: "none",
              msOverflowStyle: "none",

              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Brand />
            </Box>

            <Box
              sx={{
                flex: 1,

                width: "100%",
                maxWidth: 450,

                mx: "auto",

                display: "flex",
                flexDirection: "column",
                justifyContent: "center",

                py: {
                  xs: 4,
                  md: 2.5,
                },
              }}
            >
              <AuthTabs
                activeMode={activeMode}
                onLogin={() => navigate("/login")}
                onRegister={() =>
                  navigate("/register")
                }
              />

              <Box
                key={activeMode}
                sx={{
                  mt: {
                    xs: 3.5,
                    md:
                      activeMode === "register"
                        ? 2.7
                        : 4,
                  },

                  animation:
                    "authContentIn 0.45s cubic-bezier(0.22,1,0.36,1) both",

                  "@keyframes authContentIn": {
                    from: {
                      opacity: 0,
                      transform:
                        "translateY(16px)",
                    },

                    to: {
                      opacity: 1,
                      transform:
                        "translateY(0)",
                    },
                  },
                }}
              >
                <Typography
                  component="h1"
                  textAlign="center"
                  sx={{
                    color: authColors.navyDeep,

                    fontSize: {
                      xs: "28px",
                      md:
                        activeMode === "register"
                          ? "29px"
                          : "31px",
                      lg:
                        activeMode === "register"
                          ? "32px"
                          : "34px",
                    },

                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </Typography>

                <Box
                  sx={{
                    width: 66,
                    height: 2,

                    mx: "auto",
                    mt: 1.25,
                    mb: 1.45,

                    borderRadius: "999px",

                    background: `linear-gradient(
                      90deg,
                      transparent,
                      ${authColors.gold},
                      transparent
                    )`,
                  }}
                />

                <Typography
                  textAlign="center"
                  sx={{
                    mb:
                      activeMode === "register"
                        ? 2.1
                        : 3,

                    mx: "auto",
                    maxWidth: 380,

                    color: authColors.muted,

                    fontSize: "12px",
                    lineHeight: 1.9,
                  }}
                >
                  {description}
                </Typography>

                {children}
              </Box>
            </Box>

            <Typography
              textAlign="center"
              sx={{
                color: authColors.muted,
                fontSize: "9px",
              }}
            >
              جميع الحقوق محفوظة لمنصة نَسّق ©{" "}
              {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;