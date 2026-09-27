import {
  Box,
  IconButton,
  Stack,
  useMediaQuery,
} from "@mui/material";

import {
  MenuRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";

const Container = ({
  children,
  noSidebar = false,
}) => {
  const location = useLocation();

  const isDesktop = useMediaQuery(
    "(min-width:769px)"
  );

  const [active, setActive] =
    useState(isDesktop);

  useEffect(() => {
    setActive(isDesktop);
  }, [isDesktop]);

  // =====================================================
  // STUDENT ROUTES
  // =====================================================
  //
  // صفحات الطالب موجودة بالفعل داخل StudentLayout
  // وبالتالي:
  // - لا نعرض Navbar العامة
  // - لا نعرض Sidebar الإدارة
  // - لا نعرض Footer العامة
  // - لا نضيف Padding إضافي
  //
  // StudentLayout هو المسؤول عن شكل صفحات الطالب بالكامل.
  // =====================================================

  const isStudentRoute =
    location.pathname ===
      "/student-dashboard" ||
    location.pathname.startsWith(
      "/student-dashboard/"
    );

  // =====================================================
  // STUDENT PAGES
  // =====================================================

  if (
    noSidebar &&
    isStudentRoute
  ) {
    return (
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    );
  }

  // =====================================================
  // PUBLIC PAGES
  // Navbar + Footer
  // =====================================================

  if (noSidebar) {
    return (
      <Stack
        minHeight="100vh"
        direction="column"
        sx={{
          backgroundColor:
            "var(--color-page)",
        }}
      >
        <Navbar
          noSidebar
          setActive={setActive}
          active={active}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {children}
        </Box>

        <Footer />
      </Stack>
    );
  }

  // =====================================================
  // ADMIN PAGES
  // Sidebar + Content
  // =====================================================

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",

        display: "flex",

        alignItems: "stretch",

        overflow: "hidden",

        color:
          "var(--color-text)",

        background:
          "radial-gradient(circle at 8% 8%, rgba(211, 164, 79, 0.06), transparent 24%), var(--color-page)",
      }}
    >
      {/* =================================================
          MOBILE SIDEBAR OVERLAY
      ================================================= */}

      {!isDesktop && active && (
        <Box
          className="sidebar-overlay"
          onClick={() =>
            setActive(false)
          }
          aria-hidden="true"
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        active={active}
        setActive={setActive}
      />

      {/* =================================================
          PAGE AREA
      ================================================= */}

      <Box
        sx={{
          position: "relative",

          minWidth: 0,

          flex: 1,

          minHeight: "100vh",

          overflowX: "hidden",
        }}
      >
        {/* ===============================================
            MOBILE MENU BUTTON
        =============================================== */}

        {!isDesktop && (
          <IconButton
            type="button"
            aria-label="فتح القائمة الجانبية"
            onClick={() =>
              setActive(true)
            }
            sx={{
              position: "fixed",

              top: 14,

              right: 14,

              zIndex: 950,

              width: 44,

              height: 44,

              color:
                "var(--color-navy)",

              backgroundColor:
                "rgba(255, 252, 247, 0.96)",

              border:
                "1px solid rgba(36, 74, 112, 0.10)",

              borderRadius: "14px",

              boxShadow:
                "0 10px 26px rgba(18, 47, 77, 0.14)",

              backdropFilter:
                "blur(14px)",

              WebkitBackdropFilter:
                "blur(14px)",

              "&:hover": {
                color:
                  "var(--color-gold-dark)",

                backgroundColor:
                  "var(--color-gold-soft)",
              },
            }}
          >
            <MenuRounded />
          </IconButton>
        )}

        {/* ===============================================
            ADMIN CONTENT
        =============================================== */}

        <Box
          component="main"
          sx={{
            width: "100%",

            minWidth: 0,

            px: {
              xs: 1.25,
              sm: 1.75,
              md: 2.25,
              xl: 3,
            },

            py: {
              xs: 1.5,
              md: 2,
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Container;