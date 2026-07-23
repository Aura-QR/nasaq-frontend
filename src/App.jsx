import {
  BrowserRouter,
} from "react-router-dom";

import {
  AuthProvider,
} from "react-auth-kit";

import {
  Provider,
} from "react-redux";

import {
  ThemeProvider,
} from "@mui/material/styles";

import {
  ToastContainer,
} from "react-toastify";

import AppRouter from "@/app/AppRouter";

import store from "@/store";

import {
  theme,
} from "@/utils/theme/theme";

import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider
      authType="cookie"
      authName="_auth"
      cookieDomain={
        window.location.hostname
      }
      cookieSecure={
        window.location.protocol ===
        "https:"
      }
    >
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <BrowserRouter
            future={{
              v7_startTransition:
                true,

              v7_relativeSplatPath:
                true,
            }}
          >
            <AppRouter />

            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </BrowserRouter>
        </Provider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
