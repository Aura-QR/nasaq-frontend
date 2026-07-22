import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
  RequireAuth,
} from "react-auth-kit";

import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";

import store from "./store";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Onboarding from "./pages/Onboarding/Onboarding";
import NoAccess from "./pages/Others/NoAccess";
import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";

import { theme } from "@/utils/theme/theme";
import { appRoutes } from "./routes";

import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider
      authType="cookie"
      authName="_auth"
      cookieDomain={window.location.hostname}
      cookieSecure={
        window.location.protocol === "https:"
      }
    >
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public landing page */}
              <Route
                path="/"
                element={<Home />}
              />

              {/* Authentication */}
              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              {/* Onboarding للحساب الجديد فقط */}
              <Route
                path="/onboarding"
                element={<Onboarding />}
              />

              {/*
                معاينة مؤقتة للداشبورد
                بدون تسجيل دخول
              */}
              <Route
                path="/preview/teacher-dashboard"
                element={<TeacherDashboard />}
              />

              {/* المسار الحقيقي المحمي */}
              <Route
                path="/teacher/dashboard"
                element={
                  <RequireAuth loginPath="/login">
                    <TeacherDashboard />
                  </RequireAuth>
                }
              />

              {/* Other protected routes */}
              <Route
                path="/no-access"
                element={
                  <RequireAuth loginPath="/login">
                    <NoAccess />
                  </RequireAuth>
                }
              />

              {/* Existing application routes */}
              {appRoutes}

              {/* Unknown routes */}
              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Routes>

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