import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  HomeRounded,
  LogoutRounded,
  NotificationsNoneRounded,
} from "@mui/icons-material";

import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import { toast } from "react-toastify";

import wadqLogo from "@/images/wadq-logo.png";

import {
  getStudentMe,
  unwrapData,
} from "@/APIs/student/dashboard";

// =====================================================
// USER HELPERS
// =====================================================

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const buildFullName = (value) => {
  if (!value || typeof value !== "object") {
    return "";
  }

  const user =
    value?.student ||
    value?.profile ||
    value?.user ||
    value?.data?.student ||
    value?.data?.profile ||
    value?.data?.user ||
    value;

  return (
    user?.fullName ||
    user?.name ||
    [
      user?.firstName,
      user?.fatherName,
      user?.familyName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    ""
  );
};

const normalizeStudent = (response) => {
  const data = unwrapData(response) || {};

  return (
    data?.student ||
    data?.profile ||
    data
  );
};

// =====================================================
// COMPONENT
// =====================================================

const StudentLayout = () => {
  const navigate = useNavigate();

  const signOut = useSignOut();
  const getAuthUser = useAuthUser();

  const authUser =
    getAuthUser?.() || null;

  const storedUser = useMemo(
    () => getStoredUser(),
    []
  );

  const [
    studentProfile,
    setStudentProfile,
  ] = useState(null);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  // ===================================================
  // CURRENT STUDENT
  // Fetch once here so both the header and child pages
  // use the same student profile.
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadStudent = async () => {
      try {
        const response =
          await getStudentMe();

        if (!mounted) {
          return;
        }

        const student =
          normalizeStudent(response);

        setStudentProfile(student);

        // Helpful fallback for the rest of the app.
        if (student) {
          localStorage.setItem(
            "studentProfile",
            JSON.stringify(student)
          );
        }
      } catch (error) {
        console.warn(
          "Could not load /students/me:",
          error
        );

        try {
          const cached =
            localStorage.getItem(
              "studentProfile"
            );

          if (cached && mounted) {
            setStudentProfile(
              JSON.parse(cached)
            );
          }
        } catch {
          // Ignore invalid cached data.
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    loadStudent();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    buildFullName(studentProfile) ||
    buildFullName(authUser) ||
    buildFullName(storedUser) ||
    "الطالب";

  const avatarLetter =
    displayName
      ?.trim()
      ?.charAt(0) || "ط";

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    try {
      signOut();
    } catch {
      // local cleanup below is still applied
    }

    localStorage.removeItem("token");
    localStorage.removeItem(
      "accessToken"
    );
    localStorage.removeItem("user");
    localStorage.removeItem(
      "studentProfile"
    );

    toast.success(
      "تم تسجيل الخروج بنجاح"
    );

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#f7f5ef 100%)",
        color: "#122f4d",
        fontFamily:
          "Tajawal, Arial, sans-serif",
      }}
    >
      {/* =================================================
          ONE STUDENT HEADER ONLY
      ================================================= */}

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1200,
          px: {
            xs: 1.2,
            sm: 2,
            md: 3,
          },
          pt: 1.2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1320,
            minHeight: 72,
            mx: "auto",
            px: {
              xs: 1.2,
              sm: 1.6,
              md: 2,
            },
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            borderRadius: "21px",
            backgroundColor:
              "rgba(255,255,255,.96)",
            border:
              "1px solid rgba(36,74,112,.07)",
            boxShadow:
              "0 8px 28px rgba(18,47,77,.055)",
            backdropFilter:
              "blur(14px)",
          }}
        >
          {/* LOGO */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={() =>
              navigate(
                "/student-dashboard"
              )
            }
            sx={{
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Box
              sx={{
                width: {
                  xs: 47,
                  md: 52,
                },
                height: {
                  xs: 47,
                  md: 52,
                },
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "15px",
                backgroundColor:
                  "#fff7e5",
                border:
                  "1px solid rgba(211,164,79,.20)",
              }}
            >
              <Box
                component="img"
                src={wadqLogo}
                alt="نسق"
                sx={{
                  width: "90%",
                  height: "90%",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </Box>

            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              <Typography
                sx={{
                  color: "#122f4d",
                  fontSize: {
                    sm: "16px",
                    md: "18px",
                  },
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                نسق
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  color: "#95a0aa",
                  fontSize: "8px",
                }}
              >
                بوابتك التعليمية
              </Typography>
            </Box>
          </Stack>

          {/* USER ACTIONS */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={{
              xs: 0.45,
              sm: 0.65,
            }}
          >
            <Tooltip title="الرئيسية">
              <IconButton
                onClick={() =>
                  navigate(
                    "/student-dashboard"
                  )
                }
                sx={{
                  width: 40,
                  height: 40,
                  display: {
                    xs: "none",
                    sm: "inline-flex",
                  },
                  borderRadius: "12px",
                  color: "#244a70",
                  backgroundColor:
                    "#f3f7fb",
                  border:
                    "1px solid rgba(36,74,112,.06)",
                  "&:hover": {
                    backgroundColor:
                      "#eaf1f7",
                  },
                }}
              >
                <HomeRounded
                  sx={{
                    fontSize: 20,
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="الإشعارات">
              <IconButton
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  color: "#244a70",
                  backgroundColor:
                    "#f3f7fb",
                  border:
                    "1px solid rgba(36,74,112,.06)",
                  "&:hover": {
                    backgroundColor:
                      "#eaf1f7",
                  },
                }}
              >
                <Badge
                  variant="dot"
                  color="warning"
                  overlap="circular"
                >
                  <NotificationsNoneRounded
                    sx={{
                      fontSize: 20,
                    }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* STUDENT */}

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                px: {
                  xs: 0,
                  sm: 0.5,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background:
                    "linear-gradient(135deg,#244a70,#315e88)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                {avatarLetter}
              </Avatar>

              <Box
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                  minWidth: 92,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    maxWidth: 160,
                    color: "#122f4d",
                    fontSize: "11px",
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}
                >
                  {profileLoading &&
                  displayName ===
                    "الطالب"
                    ? "جاري التحميل..."
                    : displayName}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: "#9ba5ae",
                    fontSize: "8px",
                  }}
                >
                  حساب الطالب
                </Typography>
              </Box>
            </Stack>

            {/* LOGOUT */}

            <Button
              type="button"
              onClick={handleLogout}
              startIcon={
                <LogoutRounded />
              }
              sx={{
                minWidth: 0,
                minHeight: 40,
                px: {
                  xs: 1,
                  sm: 1.3,
                },
                borderRadius: "11px",
                color: "#c94b45",
                backgroundColor:
                  "#fff5f3",
                border:
                  "1px solid rgba(201,75,69,.12)",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon":
                  {
                    margin: 0,
                    marginLeft:
                      "4px",
                  },
                "& svg": {
                  fontSize: "17px",
                },
                "&:hover": {
                  backgroundColor:
                    "#ffebe8",
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: {
                    xs: "none",
                    sm: "inline",
                  },
                }}
              >
                تسجيل الخروج
              </Box>
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* =================================================
          STUDENT CONTENT
      ================================================= */}

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: 1320,
          mx: "auto",
          px: {
            xs: 1.2,
            sm: 2,
            md: 3,
          },
          pt: {
            xs: 1.7,
            md: 2,
          },
          pb: {
            xs: 4,
            md: 5,
          },
        }}
      >
        <Outlet
          context={{
            studentProfile,
            profileLoading,
            displayName,
          }}
        />
      </Box>
    </Box>
  );
};

export default StudentLayout;
