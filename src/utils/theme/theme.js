import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import createCache from "@emotion/cache";
import { createTheme } from "@mui/material";

export const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export const theme = createTheme({
  direction: "rtl",

  palette: {
    primary: {
      main: "#318dce",
      secondary: "#323449",
      border: "#DEE3E2",
      icons: "#71748E",
      logo: "#818282",
      whiteBg: "#FCFDFD",
      bg: "#f4f6f5",
      inputs: "#EEF1F1",
      errorBg: "#F7E8F1",
      successBg: "#E0F5E6",
      background: "#ECEFF9",
      white: "#f7faff",
    },
    secondary: {
      main: "#323449",
    },
    text: {
      primary: "#050F0D",
      secondary: "#35413E",
      third: "#6E7775",
      placeholder: "#E6EAE9",
      light: "#F7F8F8",
    },
  },

  typography: {
    fontFamily: "'Cairo', sans-serif",
    h1: {
      fontSize: "64px",
      fontWeight: "600",
      lineHeight: "140%",
    },
    h2: {
      fontSize: "32px",
      fontWeight: "600",
      lineHeight: "140%",
    },
    h3: {
      fontSize: "24px",
      fontWeight: "600",
      lineHeight: "150%",
    },
    h4: {
      fontSize: 22,
      fontWeight: "500",
      lineHeight: "160%",
    },
    h5: {
      fontSize: "20px",
      fontWeight: "500",
      lineHeight: "140%",
    },
    title: {
      fontSize: "18px",
      fontWeight: "500",
      lineHeight: "140%",
    },
    subtitle: {
      fontSize: "16px",
      fontWeight: "500",
      lineHeight: "140%",
    },
    button: {
      fontSize: "16px",
      fontWeight: "500",
      textTransform: "capitalize",
      lineHeight: "auto",
      color: "text.light",
    },
    breadcrumbs: {
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "auto",
    },
    body: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "140%",
    },
    inputs: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "auto",
    },
    label: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "140%",
    },
  },

  spacing: 2,
});
