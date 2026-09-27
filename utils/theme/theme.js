import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  direction: "rtl",

  typography: {
    fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',

    h1: {
      fontWeight: 800,
    },

    h2: {
      fontWeight: 800,
    },

    h3: {
      fontWeight: 800,
    },

    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },

  palette: {
    mode: "light",

    primary: {
      main: "#249B91",
      dark: "#177C75",
      light: "#BEE9E4",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#14344A",
      dark: "#0B2435",
      contrastText: "#FFFFFF",
    },

    warning: {
      main: "#D9A640",
    },

    error: {
      main: "#D65353",
    },

    background: {
      default: "#EDF7F5",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#173447",
      secondary: "#71838D",
    },

    divider: "#DCE9E6",
  },

  shape: {
    borderRadius: 14,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          direction: "rtl",
        },

        body: {
          direction: "rtl",
          margin: 0,
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
          textTransform: "none",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
        },

        input: {
          textAlign: "right",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
          transformOrigin: "top right",
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
          textAlign: "right",
          marginRight: 0,
          marginLeft: 0,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", "Tajawal", Arial, sans-serif',
          direction: "rtl",
        },
      },
    },
  },
});