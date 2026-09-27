import {
  ApartmentRounded,
  DashboardRounded,
  LogoutRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  clearAuthSession,
} from "@/APIs/Axios";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

import nasaqLogo from "@/images/wadq-logo.png";

const NAV_ITEMS = [
  {
    label:
      "لوحة المنصة",

    path:
      "/platform/dashboard",

    icon:
      <DashboardRounded />,
  },

  {
    label:
      "المدارس",

    path:
      "/platform/schools",

    icon:
      <ApartmentRounded />,
  },
];

const SidebarContent = ({
  onNavigate,
}) => {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const signOut =
    useSignOut();

  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const user =
    authState?.user ||
    authState ||
    {};

  const displayName =
    user?.username ||
    user?.name ||
    user?.email ||
    "مدير المنصة";

  const handleLogout =
    () => {
      signOut();
      clearAuthSession();

      navigate(
        "/platform/login",
        {
          replace: true,
        }
      );
    };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",

        display: "flex",
        flexDirection: "column",

        color:
          authColors.white,

        background: `
          radial-gradient(
            circle at 14% 10%,
            rgba(242,215,146,0.16),
            transparent 27%
          ),
          linear-gradient(
            180deg,
            ${authColors.navyDeep} 0%,
            ${authColors.navy} 58%,
            ${authColors.navyDark} 100%
          )
        `,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.7,
          pb: 2.2,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => {
            navigate(
              "/platform/dashboard"
            );

            onNavigate?.();
          }}
          sx={{
            width: "100%",
            p: 0,

            display: "flex",
            alignItems: "center",
            gap: 1.15,

            border: 0,

            color: "inherit",
            backgroundColor:
              "transparent",

            fontFamily:
              "Tajawal, Arial, sans-serif",

            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              position: "relative",

              width: 58,
              height: 56,

              flexShrink: 0,
              overflow: "hidden",

              borderRadius: "15px",

              backgroundColor:
                authColors.white,

              border:
                "1px solid rgba(242,215,146,0.28)",

              boxShadow:
                "0 12px 28px rgba(8,24,41,0.28)",
            }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                position: "absolute",

                top: -7,
                left: "50%",

                width: 112,
                maxWidth: "none",

                transform:
                  "translateX(-50%)",

                objectFit:
                  "contain",
              }}
            />
          </Box>

          <Box
            sx={{
              minWidth: 0,
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                color:
                  authColors.white,

                fontSize: "20px",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              نَسّق
            </Typography>

            <Typography
              sx={{
                mt: 0.45,

                color:
                  "rgba(255,255,255,0.58)",

                fontSize: "9px",
                fontWeight: 600,
              }}
            >
              إدارة المنصة
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider
        sx={{
          mx: 2.4,

          borderColor:
            "rgba(255,255,255,0.1)",
        }}
      />

      <Stack
        spacing={0.75}
        sx={{
          px: 1.8,
          py: 2.4,
        }}
      >
        {NAV_ITEMS.map(
          (item) => {
            const active =
              location.pathname ===
                item.path ||
              location.pathname.startsWith(
                `${item.path}/`
              );

            return (
              <Button
                key={
                  item.path
                }
                component={
                  NavLink
                }
                to={
                  item.path
                }
                onClick={() =>
                  onNavigate?.()
                }
                startIcon={
                  item.icon
                }
                sx={{
                  minHeight: 50,
                  px: 1.7,

                  justifyContent:
                    "flex-start",

                  borderRadius:
                    "14px",

                  color: active
                    ? authColors.navyDeep
                    : "rgba(255,255,255,0.72)",

                  backgroundColor:
                    active
                      ? authColors.goldLight
                      : "transparent",

                  fontSize:
                    "13px",

                  fontWeight:
                    active
                      ? 800
                      : 650,

                  textTransform:
                    "none",

                  transition:
                    "transform 0.2s ease, background-color 0.2s ease, color 0.2s ease",

                  "& .MuiButton-startIcon":
                    {
                      ml: 1,
                      mr: 0,

                      color: active
                        ? authColors.goldDark
                        : "rgba(255,255,255,0.68)",
                    },

                  "& svg": {
                    fontSize: 21,
                  },

                  "&:hover": {
                    transform:
                      "translateX(-3px)",

                    color: active
                      ? authColors.navyDeep
                      : authColors.white,

                    backgroundColor:
                      active
                        ? authColors.goldLight
                        : "rgba(255,255,255,0.08)",
                  },
                }}
              >
                {item.label}
              </Button>
            );
          }
        )}
      </Stack>

      <Box
        sx={{
          mt: "auto",
          p: 1.8,
        }}
      >
        <Box
          sx={{
            p: 1.6,

            borderRadius:
              "16px",

            backgroundColor:
              "rgba(255,255,255,0.075)",

            border:
              "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography
            noWrap
            sx={{
              color:
                authColors.white,

              fontSize:
                "12px",

              fontWeight:
                800,
            }}
          >
            {displayName}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,

              color:
                authColors.goldLight,

              fontSize:
                "9px",

              fontWeight:
                700,
            }}
          >
            SUPER_ADMIN
          </Typography>

          <Button
            fullWidth
            onClick={
              handleLogout
            }
            startIcon={
              <LogoutRounded />
            }
            sx={{
              minHeight: 42,

              mt: 1.4,

              borderRadius:
                "11px",

              color:
                "#FFD0CE",

              backgroundColor:
                "rgba(201,79,79,0.13)",

              fontSize:
                "11px",

              fontWeight:
                800,

              textTransform:
                "none",

              "& .MuiButton-startIcon":
                {
                  ml: 0.7,
                  mr: 0,
                },

              "&:hover": {
                backgroundColor:
                  "rgba(201,79,79,0.2)",
              },
            }}
          >
            تسجيل الخروج
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const PlatformSidebar = ({
  width,
  mobileOpen,
  onMobileClose,
}) => {
  return (
    <>
      <Box
        component="aside"
        sx={{
          position: "fixed",

          top: 0,
          right: 0,
          bottom: 0,

          zIndex: 1200,

          width,

          display: {
            xs: "none",
            lg: "block",
          },

          boxShadow:
            "-12px 0 35px rgba(20,50,80,0.12)",
        }}
      >
        <SidebarContent />
      </Box>

      <Drawer
        anchor="right"
        open={
          mobileOpen
        }
        onClose={
          onMobileClose
        }
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            lg: "none",
          },

          "& .MuiDrawer-paper":
            {
              width: {
                xs:
                  "min(86vw, 300px)",
              },

              border: 0,
            },
        }}
      >
        <SidebarContent
          onNavigate={
            onMobileClose
          }
        />
      </Drawer>
    </>
  );
};

export default PlatformSidebar;
