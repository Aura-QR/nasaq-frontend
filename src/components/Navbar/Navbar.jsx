import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
} from "@mui/material";
import {
  ArrowBackRounded,
  CloseRounded,
  MenuRounded,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

import afaqLogo from "../../images/afaq-logo.png";
import "./Navbar.scss";

const NAV_LINKS = [
  {
    label: "كيف تعمل؟",
    href: "#how-it-works",
  },
  {
    label: "أدوات نَسّق",
    href: "#tools",
  },
  {
    label: "الفِرَق",
    href: "#teams",
  },
  {
    label: "عن المنصة",
    href: "#about",
  },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Box
      component="header"
      className="nasaq-navbar-shell"
      dir="rtl"
    >
      <Box
        component="nav"
        className="nasaq-navbar"
        aria-label="التنقل الرئيسي"
      >
        <Link
          to="/"
          className="nasaq-navbar__brand"
          aria-label="العودة إلى الصفحة الرئيسية"
          onClick={closeMobileMenu}
        >
          <Box
            component="img"
            src={afaqLogo}
            alt="شعار منصة نَسّق"
            className="nasaq-navbar__logo"
          />
        </Link>

        <Box className="nasaq-navbar__links">
          {NAV_LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              className="nasaq-navbar__link"
            >
              {link.label}
            </Box>
          ))}
        </Box>

        <Box className="nasaq-navbar__actions">
          <Button
            component={Link}
            to="/login"
            className="nasaq-navbar__login"
            onClick={closeMobileMenu}
          >
            تسجيل الدخول
          </Button>

          <Button
            component={Link}
            to="/register"
            className="nasaq-navbar__start"
            onClick={closeMobileMenu}
          >
            <span>ابدأ الآن</span>
            <ArrowBackRounded />
          </Button>
        </Box>

        <IconButton
          type="button"
          className="nasaq-navbar__menu-button"
          aria-label={
            mobileMenuOpen
              ? "إغلاق القائمة"
              : "فتح القائمة"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((previous) => !previous)
          }
        >
          {mobileMenuOpen ? (
            <CloseRounded />
          ) : (
            <MenuRounded />
          )}
        </IconButton>

        <Box
          className={[
            "nasaq-navbar__mobile-menu",
            mobileMenuOpen
              ? "nasaq-navbar__mobile-menu--open"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Box className="nasaq-navbar__mobile-links">
            {NAV_LINKS.map((link) => (
              <Box
                key={link.href}
                component="a"
                href={link.href}
                className="nasaq-navbar__mobile-link"
                onClick={closeMobileMenu}
              >
                {link.label}
              </Box>
            ))}
          </Box>

          <Box className="nasaq-navbar__mobile-actions">
            <Button
              component={Link}
              to="/login"
              className="nasaq-navbar__login"
              onClick={closeMobileMenu}
            >
              تسجيل الدخول
            </Button>

            <Button
              component={Link}
              to="/register"
              className="nasaq-navbar__start"
              onClick={closeMobileMenu}
            >
              <span>ابدأ الآن</span>
              <ArrowBackRounded />
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Navbar;
