import {
  ArrowBackRounded,
  GppBadRounded,
  HomeRounded,
  LogoutRounded,
  LockPersonRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  useAuthUser,
  useIsAuthenticated,
  useSignOut,
} from "react-auth-kit";

import {
  useNavigate,
} from "react-router-dom";

import {
  clearAuthSession,
} from "@/shared/auth/session";

const ROLE_HOME_PATHS = {
  SUPER_ADMIN:
    "/platform/dashboard",

  OWNER:
    "/users/students",

  SUPERVISOR:
    "/users/students",

  MANAGER:
    "/users/students",

  TEACHER:
    "/teacher/dashboard",

  STUDENT:
    "/student-dashboard",
};

const ROLE_LABELS = {
  SUPER_ADMIN:
    "مدير المنصة",

  OWNER:
    "مالك المدرسة",

  SUPERVISOR:
    "مشرف المدرسة",

  MANAGER:
    "مدير المدرسة",

  TEACHER:
    "المعلم",

  STUDENT:
    "الطالب",
};

const normalizeRole = (
  role
) =>
  String(role || "")
    .trim()
    .toUpperCase();

const getCurrentUser = (
  authState
) =>
  authState?.user ||
  authState?.admin ||
  authState;

const NoAccess = () => {
  const getAuthUser =
    useAuthUser();

  const isAuthenticated =
    useIsAuthenticated();

  const signOut =
    useSignOut();

  const navigate =
    useNavigate();

  const authState =
    getAuthUser?.() || {};

  const user =
    getCurrentUser(
      authState
    ) || {};

  const role =
    normalizeRole(
      user?.role ||
      authState?.role ||
      localStorage.getItem(
        "role"
      )
    );

  const roleLabel =
    ROLE_LABELS[role] ||
    "المستخدم";

  const homePath =
    ROLE_HOME_PATHS[role] ||
    (
      isAuthenticated()
        ? "/"
        : "/login"
    );

  const handleReturn = () => {
    navigate(
      homePath,
      {
        replace: true,
      }
    );
  };

  const handleSignOut = () => {
    signOut();

    clearAuthSession();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  return (
    <Box
      dir="rtl"
      sx={{
        position:
          "relative",

        minHeight:
          "100vh",

        display:
          "grid",

        placeItems:
          "center",

        overflow:
          "hidden",

        px: {
          xs: 1.5,
          sm: 2.5,
        },

        py: {
          xs: 3,
          md: 4,
        },

        fontFamily:
          "Tajawal, Arial, sans-serif",

        background: `
          radial-gradient(
            circle at 14% 12%,
            rgba(36,74,112,0.16),
            transparent 30%
          ),
          radial-gradient(
            circle at 87% 86%,
            rgba(211,164,79,0.16),
            transparent 27%
          ),
          linear-gradient(
            135deg,
            #f0ede6 0%,
            #fbf8f1 48%,
            #eee9df 100%
          )
        `,
      }}
    >
      <Box
        sx={{
          position:
            "absolute",

          top: -130,
          right: -110,

          width: 330,
          height: 330,

          borderRadius:
            "50%",

          border:
            "1px solid rgba(36,74,112,0.08)",

          "&::after": {
            content:
              '""',

            position:
              "absolute",

            inset: 45,

            borderRadius:
              "50%",

            border:
              "1px solid rgba(211,164,79,0.11)",
          },
        }}
      />

      <Box
        sx={{
          position:
            "absolute",

          left: -95,
          bottom: -105,

          width: 260,
          height: 260,

          borderRadius:
            "50%",

          background:
            "radial-gradient(circle, rgba(36,74,112,0.08), transparent 68%)",
        }}
      />

      <Box
        sx={{
          position:
            "relative",

          zIndex: 1,

          width:
            "100%",

          maxWidth:
            760,

          px: {
            xs: 2,
            sm: 4,
            md: 5,
          },

          py: {
            xs: 3,
            sm: 4,
            md: 4.5,
          },

          overflow:
            "hidden",

          borderRadius: {
            xs: "24px",
            md: "30px",
          },

          border:
            "1px solid rgba(36,74,112,0.11)",

          background:
            "rgba(255,252,247,0.93)",

          backdropFilter:
            "blur(16px)",

          boxShadow:
            "0 28px 80px rgba(20,50,80,0.16)",
        }}
      >
        <Box
          sx={{
            position:
              "absolute",

            top: 0,
            right: 0,
            left: 0,

            height: 5,

            background:
              "linear-gradient(90deg, #244a70, #d3a44f, #244a70)",
          }}
        />

        <Stack
          alignItems="center"
          textAlign="center"
        >
          <Chip
            icon={
              <LockPersonRounded />
            }
            label="صلاحية الوصول"
            sx={{
              mb: 2.25,

              color:
                "#244a70",

              backgroundColor:
                "rgba(36,74,112,0.07)",

              border:
                "1px solid rgba(36,74,112,0.09)",

              fontFamily:
                "inherit",

              fontSize:
                "11px",

              fontWeight:
                800,

              "& .MuiChip-icon":
                {
                  color:
                    "#d3a44f",
                },
            }}
          />

          <Box
            sx={{
              position:
                "relative",

              width: {
                xs: 88,
                sm: 104,
              },

              height: {
                xs: 88,
                sm: 104,
              },

              display:
                "grid",

              placeItems:
                "center",

              mb: 2.5,

              borderRadius:
                "28px",

              color:
                "#b78430",

              background:
                "linear-gradient(145deg, #fbf0d8, #fffaf0)",

              border:
                "1px solid rgba(211,164,79,0.3)",

              boxShadow:
                "0 18px 36px rgba(183,132,48,0.15)",

              transform:
                "rotate(-3deg)",

              "& svg": {
                fontSize: {
                  xs: 46,
                  sm: 56,
                },

                transform:
                  "rotate(3deg)",
              },

              "&::after": {
                content:
                  '""',

                position:
                  "absolute",

                inset: -9,

                borderRadius:
                  "34px",

                border:
                  "1px dashed rgba(211,164,79,0.28)",
              },
            }}
          >
            <GppBadRounded />
          </Box>

          <Typography
            component="span"
            sx={{
              color:
                "#c94f4f",

              fontSize: {
                xs: "13px",
                sm: "14px",
              },

              fontWeight:
                900,

              letterSpacing:
                "0.08em",
            }}
          >
            خطأ 403
          </Typography>

          <Typography
            component="h1"
            sx={{
              mt: 0.75,

              color:
                "#122f4d",

              fontSize: {
                xs: "24px",
                sm: "31px",
                md: "35px",
              },

              fontWeight:
                900,

              lineHeight:
                1.35,
            }}
          >
            لا تملك صلاحية الوصول
            إلى هذه الصفحة
          </Typography>

          <Typography
            sx={{
              mt: 1.2,

              maxWidth:
                550,

              color:
                "#7e8791",

              fontSize: {
                xs: "13px",
                sm: "14px",
              },

              fontWeight:
                500,

              lineHeight:
                1.9,
            }}
          >
            هذه الصفحة غير متاحة لصلاحيات حساب
            {" "}
            <Box
              component="span"
              sx={{
                color:
                  "#244a70",

                fontWeight:
                  800,
              }}
            >
              {roleLabel}
            </Box>
            .
            يمكنك العودة إلى لوحة التحكم أو تسجيل الخروج
            والدخول بحساب آخر.
          </Typography>

          <Box
            sx={{
              width:
                "100%",

              mt: {
                xs: 3,
                sm: 3.5,
              },

              p: {
                xs: 1.2,
                sm: 1.35,
              },

              display:
                "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },

              gap: 1.15,

              borderRadius:
                "20px",

              backgroundColor:
                "rgba(36,74,112,0.045)",

              border:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Button
              type="button"
              onClick={
                handleReturn
              }
              startIcon={
                <HomeRounded />
              }
              endIcon={
                <ArrowBackRounded />
              }
              sx={{
                minHeight:
                  54,

                px: 2,

                borderRadius:
                  "15px",

                color:
                  "#fbf0d8",

                background:
                  "linear-gradient(135deg, #315e88 0%, #1b3d61 100%)",

                boxShadow:
                  "0 12px 26px rgba(27,61,97,0.22)",

                fontFamily:
                  "inherit",

                fontSize:
                  "13px",

                fontWeight:
                  800,

                textTransform:
                  "none",

                "&:hover": {
                  background:
                    "linear-gradient(135deg, #244a70 0%, #122f4d 100%)",

                  transform:
                    "translateY(-1px)",
                },

                "& .MuiButton-startIcon":
                  {
                    ml: 0.7,
                    mr: 0,
                  },

                "& .MuiButton-endIcon":
                  {
                    mr: 0.7,
                    ml: 0,
                  },
              }}
            >
              العودة إلى لوحة التحكم
            </Button>

            <Button
              type="button"
              onClick={
                handleSignOut
              }
              startIcon={
                <LogoutRounded />
              }
              variant="outlined"
              sx={{
                minHeight:
                  54,

                px: 2,

                borderRadius:
                  "15px",

                color:
                  "#c94f4f",

                borderColor:
                  "rgba(201,79,79,0.3)",

                backgroundColor:
                  "rgba(255,255,255,0.72)",

                fontFamily:
                  "inherit",

                fontSize:
                  "13px",

                fontWeight:
                  800,

                textTransform:
                  "none",

                "&:hover": {
                  borderColor:
                    "#c94f4f",

                  backgroundColor:
                    "rgba(201,79,79,0.06)",

                  transform:
                    "translateY(-1px)",
                },

                "& .MuiButton-startIcon":
                  {
                    ml: 0.7,
                    mr: 0,
                  },
              }}
            >
              تسجيل الخروج
            </Button>
          </Box>

          <Typography
            sx={{
              mt: 2,

              color:
                "#9aa1a8",

              fontSize:
                "10px",

              fontWeight:
                600,
            }}
          >
            في حالة احتياجك لهذه الصفحة، تواصل مع مالك المدرسة لتحديث صلاحيات حسابك.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default NoAccess;
