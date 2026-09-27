export const authColors = {
  navy: "#0F2747",
  navyDark: "#071629",
  navyCard: "#0D213B",

  gold: "#D9A441",
  goldDark: "#B98224",
  goldLight: "#F2C86B",

  lightBackground: "#F7F5F1",
  lightCard: "#FFFFFF",

  darkBackground: "#061325",
  darkCard: "#0B1E35",

  lightText: "#172A3A",
  darkText: "#F8FAFC",

  lightMuted: "#6D7680",
  darkMuted: "#A7B3C4",

  lightBorder: "#E2E7EC",
  darkBorder: "rgba(255,255,255,0.12)",

  error: "#D94B4B",
};

export const getAuthFieldSx = (isDark) => ({
  "& .MuiOutlinedInput-root": {
    minHeight: "54px",
    borderRadius: "14px",
    backgroundColor: isDark
      ? "rgba(255,255,255,0.05)"
      : "#FFFFFF",
    color: isDark ? authColors.darkText : authColors.lightText,
    transition: "all 0.2s ease",

    "& fieldset": {
      borderColor: isDark
        ? authColors.darkBorder
        : authColors.lightBorder,
    },

    "&:hover fieldset": {
      borderColor: authColors.gold,
    },

    "&.Mui-focused": {
      boxShadow: `0 0 0 4px ${
        isDark
          ? "rgba(217,164,65,0.12)"
          : "rgba(217,164,65,0.14)"
      }`,
    },

    "&.Mui-focused fieldset": {
      borderColor: authColors.gold,
      borderWidth: "1.5px",
    },

    "&.Mui-error fieldset": {
      borderColor: authColors.error,
    },
  },

  "& .MuiInputLabel-root": {
    color: isDark
      ? authColors.darkMuted
      : authColors.lightMuted,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: authColors.goldDark,
  },

  "& .MuiInputAdornment-root svg": {
    color: isDark
      ? authColors.darkMuted
      : authColors.lightMuted,
  },

  "& .MuiFormHelperText-root": {
    marginInline: 0,
    fontFamily: "Cairo, sans-serif",
  },
});

export const getPrimaryButtonSx = () => ({
  minHeight: "54px",
  borderRadius: "14px",
  background: `linear-gradient(135deg, ${authColors.gold} 0%, ${authColors.goldDark} 100%)`,
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: "15px",
  boxShadow: "0 12px 24px rgba(185,130,36,0.22)",
  textTransform: "none",
  transition: "all 0.25s ease",

  "&:hover": {
    background: `linear-gradient(135deg, ${authColors.goldLight} 0%, ${authColors.gold} 100%)`,
    boxShadow: "0 15px 30px rgba(185,130,36,0.3)",
    transform: "translateY(-2px)",
  },

  "&:disabled": {
    color: "rgba(255,255,255,0.8)",
    background: "#B8A77D",
  },
});