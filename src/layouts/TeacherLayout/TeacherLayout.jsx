import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  CloseRounded,
  DashboardRounded,
  LibraryBooksRounded,
  LogoutRounded,
  MenuBookRounded,
  MenuRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  fetchMyTeacherProfile,
} from "@/APIs/users/teachers";

import nasaqLogo from "../../images/wadq-logo.png";
import NotificationBell from "@/components/Notifications/NotificationBell";

const NAV_ITEMS = [
  {
    label: "لوحة التحكم",
    path: "/teacher/dashboard",
    icon: <DashboardRounded />,
  },
  {
    label: "جدول اليوم",
    path: "/teacher/dashboard",
    hash: "#today-schedule",
    icon: <ScheduleRounded />,
  },
  {
    label: "تحضيراتي",
    path: "/school/preparation",
    icon: <MenuBookRounded />,
  },
  {
    label: "المكتبة",
    path: "/school/library",
    icon: <LibraryBooksRounded />,
  },
];

const extractEntity = (response) => {
  if (
    !response ||
    typeof response === "string" ||
    response?.status === false
  ) {
    return null;
  }

  const payload = response?.data ?? response;

  return (
    payload?.data?.teacher ||
    payload?.teacher ||
    payload?.data ||
    payload
  );
};

const getDisplayName = (...sources) => {
  const candidates = [];

  sources.filter(Boolean).forEach((source) => {
    candidates.push(
      source,
      source?.user,
      source?.teacher,
      source?.profile,
      source?.account
    );
  });

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const combinedName = [
      candidate?.firstName,
      candidate?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const name = String(
      candidate?.name ||
        candidate?.fullName ||
        candidate?.teacherName ||
        candidate?.username ||
        combinedName ||
        ""
    ).trim();

    if (name && name !== "المعلم") {
      return name;
    }
  }

  return "";
};

const TeacherNavigation = ({ mobile = false, onNavigate }) => {
  const location = useLocation();

  return (
    <Stack
      direction={mobile ? "column" : "row"}
      alignItems={mobile ? "stretch" : "center"}
      gap={mobile ? 0.75 : 0.35}
      sx={{ width: mobile ? "100%" : "auto" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.hash
          ? location.pathname === item.path &&
            location.hash === item.hash
          : item.path === "/teacher/dashboard"
            ? location.pathname === item.path &&
              location.hash !== "#today-schedule"
            : location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

        return (
          <Button
            key={`${item.path}${item.hash || ""}`}
            component={NavLink}
            to={`${item.path}${item.hash || ""}`}
            onClick={onNavigate}
            startIcon={item.icon}
            sx={{
              minHeight: mobile ? 44 : 38,
              px: mobile ? 1.5 : 1.35,
              justifyContent: mobile ? "flex-start" : "center",
              borderRadius: "9px",
              color: active
                ? "#ffffff"
                : "var(--color-navy-deep)",
              backgroundColor: active
                ? "var(--color-primary, #0e7a5e)"
                : "transparent",
              fontSize: mobile ? "12px" : "11px",
              fontWeight: 800,
              textTransform: "none",
              whiteSpace: "nowrap",
              "& .MuiButton-startIcon": {
                marginLeft: "6px",
                marginRight: 0,
                "& svg": {
                  fontSize: mobile ? 19 : 17,
                },
              },
              "&:hover": {
                color: active
                  ? "#ffffff"
                  : "var(--color-primary, #0e7a5e)",
                backgroundColor: active
                  ? "var(--color-primary, #0e7a5e)"
                  : "rgba(14,122,94,0.06)",
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );
};

const TeacherLayout = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const signOut = useSignOut();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const response = await fetchMyTeacherProfile();

      if (!active) {
        return;
      }

      const profile = extractEntity(response);

      if (profile) {
        setTeacherProfile(profile);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const teacherName = useMemo(
    () =>
      getDisplayName(
        teacherProfile,
        currentUser,
        authRoot
      ) ||
      currentUser?.email ||
      "المعلم",
    [teacherProfile, currentUser, authRoot]
  );

  const handleLogout = () => {
    signOut();
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        color: "var(--color-text)",
        backgroundColor: "#f8f5ef",
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1200,
          backgroundColor: "rgba(255,253,250,0.96)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(36,74,112,0.09)",
          boxShadow: "0 8px 24px rgba(18,47,77,0.045)",
        }}
      >
        <Box
          sx={{
            width: "min(100%, 1380px)",
            minHeight: 68,
            mx: "auto",
            px: { xs: 1.5, md: 2.5 },
            display: "grid",
            gridTemplateColumns: {
              xs: "auto 1fr auto",
              lg: "190px minmax(0, 1fr) 230px",
            },
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ minWidth: 0 }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="شعار منصة نسق"
              sx={{
                width: 78,
                height: 42,
                objectFit: "contain",
                objectPosition: "right center",
              }}
            />
          </Stack>

          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              justifyContent: "center",
              minWidth: 0,
              width: "fit-content",
              mx: "auto",
              px: 0.55,
              py: 0.45,
              border: "1px solid rgba(36,74,112,0.08)",
              borderRadius: "13px",
              backgroundColor: "rgba(255,255,255,0.72)",
            }}
          >
            <TeacherNavigation />
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            gap={0.8}
            sx={{ minWidth: 0 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={0.8}
              sx={{
                minWidth: 0,
                display: { xs: "none", sm: "flex" },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  color: "#ffffff",
                  backgroundColor:
                    "var(--color-navy, #244a70)",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                {String(teacherName).trim().charAt(0)}
              </Avatar>

              <Box sx={{ minWidth: 0, maxWidth: 145 }}>
                <Typography
                  noWrap
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {teacherName}
                </Typography>

                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "9px",
                    fontWeight: 600,
                  }}
                >
                  حساب المعلم
                </Typography>
              </Box>
            </Stack>

            <NotificationBell
              sx={{
                width: 36,
                height: 36,
                color: "var(--color-navy-deep)",
                border: "1px solid #dfe5eb",
                backgroundColor: "#fffdfa",
              }}
            />

            <Tooltip title="تسجيل الخروج">
              <IconButton
                aria-label="تسجيل الخروج"
                onClick={handleLogout}
                sx={{
                  width: 36,
                  height: 36,
                  color: "#c94f4f",
                  border: "1px solid rgba(201,79,79,0.16)",
                  backgroundColor: "rgba(201,79,79,0.05)",
                }}
              >
                <LogoutRounded sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>

            <IconButton
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                width: 36,
                height: 36,
                color: "var(--color-navy-deep)",
                border: "1px solid #dfe5eb",
                backgroundColor: "#fffdfa",
              }}
            >
              <MenuRounded />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      <Box component="main">
        <Outlet
          context={{
            teacherName,
            teacherProfile,
          }}
        />
      </Box>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: "min(84vw, 310px)",
            p: 1.5,
            backgroundColor: "#fffdfa",
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Box
            component="img"
            src={nasaqLogo}
            alt="شعار منصة نسق"
            sx={{
              width: 88,
              height: 48,
              objectFit: "contain",
            }}
          />

          <IconButton
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <CloseRounded />
          </IconButton>
        </Stack>

        <TeacherNavigation
          mobile
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer>
    </Box>
  );
};

export default TeacherLayout;
