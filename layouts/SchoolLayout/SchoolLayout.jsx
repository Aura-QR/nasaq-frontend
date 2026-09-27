import {
  Box,
  Drawer,
} from "@mui/material";

import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import SchoolHeader from "@/components/school/SchoolHeader";
import SchoolSidebar, {
  SIDEBAR_WIDTH,
} from "@/components/school/SchoolSidebar";

const SchoolLayout = () => {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight:
          "100vh",

        backgroundColor:
          "#f0ede6",

        fontFamily:
          "Tajawal, Arial, sans-serif",
      }}
    >
      <Box
        component="aside"
        sx={{
          position:
            "fixed",

          top: 0,
          right: 0,
          bottom: 0,

          width:
            SIDEBAR_WIDTH,

          zIndex: 1200,

          display: {
            xs: "none",
            lg: "block",
          },
        }}
      >
        <SchoolSidebar />
      </Box>

      <Drawer
        anchor="right"
        open={
          mobileOpen
        }
        onClose={() =>
          setMobileOpen(
            false
          )
        }
        PaperProps={{
          sx: {
            width:
              SIDEBAR_WIDTH,

            border: 0,
          },
        }}
        sx={{
          display: {
            xs: "block",
            lg: "none",
          },
        }}
      >
        <SchoolSidebar
          mobile
          onClose={() =>
            setMobileOpen(
              false
            )
          }
        />
      </Drawer>

      <Box
        sx={{
          minHeight:
            "100vh",

          mr: {
            xs: 0,
            lg:
              `${SIDEBAR_WIDTH}px`,
          },
        }}
      >
        <Box
          sx={{
            px: {
              xs: 1.2,
              md: 1.65,
            },

            pt: {
              xs: 1.1,
              md: 1.35,
            },
          }}
        >
          <SchoolHeader
            onMenuClick={() =>
              setMobileOpen(
                true
              )
            }
          />
        </Box>

        <Box
          component="main"
          sx={{
            width:
              "100%",

            maxWidth:
              1280,

            mx: "auto",

            p: {
              xs: 1.25,
              md: 1.65,
            },

            pt: {
              xs: 1,
              md: 1.15,
            },

            pb: {
              xs: 2.5,
              md: 3,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolLayout;
