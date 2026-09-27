import {
  Box,
} from "@mui/material";

import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import PlatformHeader from "@/components/platform/PlatformHeader";
import PlatformSidebar from "@/components/platform/PlatformSidebar";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const PLATFORM_SIDEBAR_WIDTH = 280;
const PLATFORM_CONTENT_MAX_WIDTH = 1280;

const PlatformLayout = () => {
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const openMobileSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        minHeight: "100vh",

        display: "flex",

        fontFamily:
          "Tajawal, Arial, sans-serif",

        backgroundColor:
          authColors.page,
      }}
    >
      <PlatformSidebar
        width={
          PLATFORM_SIDEBAR_WIDTH
        }
        mobileOpen={
          mobileSidebarOpen
        }
        onMobileClose={
          closeMobileSidebar
        }
      />

      <Box
        component="main"
        sx={{
          width: {
            xs: "100%",

            lg: `calc(100% - ${PLATFORM_SIDEBAR_WIDTH}px)`,
          },

          minWidth: 0,
          minHeight: "100vh",

          mr: {
            xs: 0,

            lg: `${PLATFORM_SIDEBAR_WIDTH}px`,
          },

          display: "flex",
          flexDirection: "column",

          transition:
            "margin-right 0.25s ease, width 0.25s ease",
        }}
      >
        <PlatformHeader
          maxWidth={
            PLATFORM_CONTENT_MAX_WIDTH
          }
          onOpenSidebar={
            openMobileSidebar
          }
        />

        <Box
          sx={{
            flex: 1,

            width: "100%",

            px: {
              xs: 2,
              sm: 3,
              md: 4,
            },

            py: {
              xs: 2.5,
              md: 3.5,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",

              maxWidth:
                PLATFORM_CONTENT_MAX_WIDTH,

              mx: "auto",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PlatformLayout;
