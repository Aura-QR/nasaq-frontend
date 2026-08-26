import {
  CalendarMonthRounded,
  MenuRounded,
  NotificationsNoneRounded,
} from "@mui/icons-material";

import {
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  useLocation,
} from "react-router-dom";

import {
  getSchoolRoleLabel,
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const getArabicDate = () =>
  new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

const SchoolHeader = ({
  onMenuClick,
}) => {
  const location =
    useLocation();

  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const {
    role,
    email,
    displayName,
    schoolName,
  } =
    getSchoolSessionInfo(
      authState
    );

  const dashboardPage =
    location.pathname ===
    "/school/dashboard";

  const managersPage =
    location.pathname ===
    "/school/managers";

  const studentDetailsPage =
    /^\/school\/students\/[^/]+$/.test(
      location.pathname
    );

  const studentsPage =
    location.pathname ===
      "/school/students" ||
    studentDetailsPage;

  const teacherDetailsPage =
    /^\/school\/teachers\/[^/]+$/.test(
      location.pathname
    );

  const teachersPage =
    location.pathname ===
      "/school/teachers" ||
    teacherDetailsPage;

  const classDetailsPage =
    /^\/school\/classes\/[^/]+$/.test(
      location.pathname
    );

  const classesPage =
    location.pathname ===
      "/school/classes" ||
    classDetailsPage;

  const pageTitle =
    dashboardPage
      ? "لوحة المدرسة"
      : managersPage
      ? "المديرون والمساعدون"
      : studentDetailsPage
      ? "تفاصيل الطالب"
      : studentsPage
      ? "إدارة الطلاب"
      : teacherDetailsPage
      ? "تفاصيل المعلم"
      : teachersPage
      ? "إدارة المعلمين"
      : classDetailsPage
      ? "تفاصيل الفصل"
      : classesPage
      ? "إدارة الفصول"
      : "إدارة المدرسة";

  const pageDescription =
    dashboardPage
      ? `مرحبًا بك في ${schoolName} • ${getArabicDate()}`
      : managersPage
      ? "إدارة الحسابات الإدارية وتوزيع الصلاحيات."
      : studentDetailsPage
      ? "عرض بيانات الطالب والتحكم في حالته."
      : studentsPage
      ? "إضافة الطلاب وتعديل بياناتهم ومتابعة حالتهم."
      : teacherDetailsPage
      ? "عرض بيانات المعلم والمواد المسندة والتحكم في حالته."
      : teachersPage
      ? "إضافة المعلمين وتعديل بياناتهم وإدارة أدوارهم."
      : classDetailsPage
      ? "عرض بيانات الفصل وإدارة الطلاب والمواد المرتبطة به."
      : classesPage
      ? "إنشاء الفصول وتعيين المعلمين وتنظيم الطلاب."
      : schoolName;

  const avatarLetter =
    String(
      displayName || "ن"
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  const accountSubtitle =
    email &&
    email !== displayName
      ? email
      : `${getSchoolRoleLabel(
          role
        )} • ${schoolName}`;

  return (
    <Box
      component="header"
      dir="rtl"
      sx={{
        minHeight: 82,
        px: {
          xs: 1.35,
          md: 1.8,
        },
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        gap: 1.2,
        position:
          "relative",
        overflow:
          "hidden",
        borderRadius:
          "18px",
        color:
          "#ffffff",
        background:
          "linear-gradient(135deg, #244a70 0%, #1b3d61 100%)",
        border:
          "1px solid rgba(211,164,79,0.58)",
        boxShadow:
          "0 12px 28px rgba(27,61,97,0.16)",
        fontFamily:
          "Tajawal, Arial, sans-serif",
        "&::before": {
          content: '""',
          position:
            "absolute",
          width: 150,
          height: 150,
          right: -80,
          top: -95,
          borderRadius:
            "50%",
          border:
            "1px solid rgba(242,215,146,0.14)",
        },
        "&::after": {
          content: '""',
          position:
            "absolute",
          width: 110,
          height: 110,
          left: -55,
          bottom: -72,
          borderRadius:
            "50%",
          backgroundColor:
            "rgba(255,255,255,0.025)",
          border:
            "1px solid rgba(255,255,255,0.07)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.9}
        sx={{
          minWidth: 0,
          position:
            "relative",
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={
            onMenuClick
          }
          aria-label="فتح القائمة"
          sx={{
            display: {
              xs: "inline-flex",
              lg: "none",
            },
            width: 40,
            height: 40,
            color: "#244a70",
            backgroundColor:
              "#f2d792",
            border:
              "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <MenuRounded />
        </IconButton>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            noWrap
            sx={{
              color:
                "#ffffff",
              fontSize: {
                xs: "18px",
                md: "22px",
              },
              fontWeight:
                800,
              lineHeight: 1.25,
            }}
          >
            {pageTitle}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.45}
            sx={{
              mt: 0.25,
              minWidth: 0,
            }}
          >
            {dashboardPage && (
              <CalendarMonthRounded
                sx={{
                  flexShrink: 0,
                  color:
                    "#f2d792",
                  fontSize: 12,
                }}
              />
            )}

            <Typography
              noWrap
              title={
                pageDescription
              }
              sx={{
                color:
                  "rgba(255,255,255,0.68)",
                fontSize:
                  "8.2px",
              }}
            >
              {pageDescription}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.7}
        sx={{
          minWidth: 0,
          flexShrink: 0,
          position:
            "relative",
          zIndex: 1,
        }}
      >
        <IconButton
          aria-label="الإشعارات"
          sx={{
            width: 40,
            height: 40,
            color:
              "#f2d792",
            backgroundColor:
              "rgba(255,255,255,0.08)",
            border:
              "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <NotificationsNoneRounded />
        </IconButton>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            minWidth: {
              xs: 44,
              sm: 226,
            },
            maxWidth: 305,
            px: {
              xs: 0.45,
              sm: 0.8,
            },
            py: 0.55,
            borderRadius:
              "13px",
            backgroundColor:
              "rgba(255,255,255,0.09)",
            border:
              "1px solid rgba(255,255,255,0.17)",
            backdropFilter:
              "blur(8px)",
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              display:
                "grid",
              placeItems:
                "center",
              borderRadius:
                "10px",
              color:
                "#244a70",
              backgroundColor:
                "#f2d792",
              border:
                "1px solid rgba(255,255,255,0.55)",
              fontSize:
                "11px",
              fontWeight:
                800,
            }}
          >
            {avatarLetter}
          </Box>

          <Box
            sx={{
              minWidth: 0,
              display: {
                xs: "none",
                sm: "block",
              },
            }}
          >
            <Typography
              noWrap
              title={
                displayName
              }
              sx={{
                color:
                  "#ffffff",
                fontSize:
                  "9.4px",
                fontWeight:
                  800,
              }}
            >
              {displayName}
            </Typography>

            <Typography
              noWrap
              title={
                accountSubtitle
              }
              sx={{
                mt: 0.1,
                color:
                  "#f2d792",
                direction:
                  email &&
                  email !==
                    displayName
                    ? "ltr"
                    : "rtl",
                textAlign:
                  "right",
                fontSize:
                  "7.3px",
                fontWeight:
                  700,
              }}
            >
              {accountSubtitle}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default SchoolHeader;
