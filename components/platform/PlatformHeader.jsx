import {
  MenuRounded,
  NotificationsNoneRounded,
} from "@mui/icons-material";

import {
  Avatar,
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
  authColors,
} from "@/pages/Auth/AuthLayout";

const PAGE_META = [
  {
    prefix:
      "/platform/dashboard",

    title:
      "لوحة المنصة",

    description:
      "نظرة عامة على أداء المنصة والمدارس المسجلة.",
  },

  {
    prefix:
      "/platform/schools/",

    title:
      "تفاصيل المدرسة",

    description:
      "عرض بيانات المدرسة وحالتها والتحكم في حسابها.",
  },

  {
    prefix:
      "/platform/schools",

    title:
      "إدارة المدارس",

    description:
      "عرض المدارس ومراجعة بياناتها وحالتها.",
  },

  {
    prefix:
      "/platform/settings",

    title:
      "إعدادات المنصة",

    description:
      "إعدادات عامة خاصة بإدارة النظام.",
  },
];

const getPageMeta = (
  pathname
) =>
  PAGE_META.find(
    (item) =>
      pathname.startsWith(
        item.prefix
      )
  ) || PAGE_META[0];

const PlatformHeader = ({
  onOpenSidebar,
  maxWidth = 1280,
}) => {
  const location =
    useLocation();

  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const user =
    authState?.user ||
    authState ||
    {};

  const pageMeta =
    getPageMeta(
      location.pathname
    );

  const displayName =
    user?.username ||
    user?.name ||
    user?.email ||
    "مدير المنصة";

  const initial =
    String(displayName)
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "S";

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,

        zIndex: 1100,

        backgroundColor:
          "rgba(240,237,230,0.88)",

        borderBottom:
          "1px solid rgba(36,74,112,0.08)",

        backdropFilter:
          "blur(14px)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth,

          mx: "auto",

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          py: 1.8,

          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",

          gap: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          sx={{
            minWidth: 0,
          }}
        >
          <IconButton
            type="button"
            onClick={
              onOpenSidebar
            }
            aria-label="فتح القائمة"
            sx={{
              display: {
                xs: "inline-flex",
                lg: "none",
              },

              width: 43,
              height: 43,

              flexShrink: 0,

              borderRadius:
                "13px",

              color:
                authColors.navy,

              backgroundColor:
                authColors.white,

              border:
                "1px solid rgba(36,74,112,0.09)",
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
                  authColors.navyDeep,

                fontSize: {
                  xs: "19px",
                  md: "23px",
                },

                fontWeight:
                  800,
              }}
            >
              {pageMeta.title}
            </Typography>

            <Typography
              noWrap
              sx={{
                mt: 0.25,

                color:
                  authColors.muted,

                fontSize: {
                  xs: "9px",
                  sm: "11px",
                },
              }}
            >
              {pageMeta.description}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <IconButton
            type="button"
            aria-label="الإشعارات"
            sx={{
              width: 42,
              height: 42,

              borderRadius:
                "13px",

              color:
                authColors.navy,

              backgroundColor:
                authColors.white,

              border:
                "1px solid rgba(36,74,112,0.09)",
            }}
          >
            <NotificationsNoneRounded />
          </IconButton>

          <Box
            sx={{
              display: {
                xs: "none",
                sm: "block",
              },

              textAlign:
                "left",
            }}
          >
            <Typography
              noWrap
              sx={{
                maxWidth: 180,

                color:
                  authColors.navyDeep,

                fontSize:
                  "11px",

                fontWeight:
                  800,
              }}
            >
              {displayName}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,

                color:
                  authColors.goldDark,

                fontSize:
                  "8px",

                fontWeight:
                  800,
              }}
            >
              SUPER_ADMIN
            </Typography>
          </Box>

          <Avatar
            sx={{
              width: 42,
              height: 42,

              color:
                authColors.goldSoft,

              backgroundColor:
                authColors.navy,

              fontSize:
                "14px",

              fontWeight:
                800,
            }}
          >
            {initial}
          </Avatar>
        </Stack>
      </Box>
    </Box>
  );
};

export default PlatformHeader;
