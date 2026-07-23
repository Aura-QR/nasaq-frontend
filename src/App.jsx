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

import PlatformLogin from "./pages/PlatformLogin/PlatformLogin";
import PlatformDashboard from "./pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "./pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "./pages/PlatformSchoolDetails/PlatformSchoolDetails";
import PlatformSettings from "./pages/PlatformSettings/PlatformSettings";

import PlatformLayout from "./layouts/PlatformLayout/PlatformLayout";
import SuperAdminRoute from "./components/guards/SuperAdminRoute";

import { theme } from "@/utils/theme/theme";
import { appRoutes } from "./routes";

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
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              <Route
                path="/platform/login"
                element={
                  <PlatformLogin />
                }
              />

              <Route
                path="/onboarding"
                element={<Onboarding />}
              />

              <Route
                path="/preview/teacher-dashboard"
                element={
                  <TeacherDashboard />
                }
              />

              <Route
                path="/teacher/dashboard"
                element={
                  <RequireAuth loginPath="/login">
                    <TeacherDashboard />
                  </RequireAuth>
                }
              />

              <Route
                element={
                  <SuperAdminRoute />
                }
              >
                <Route
                  path="/platform"
                  element={
                    <PlatformLayout />
                  }
                >
                  <Route
                    index
                    element={
                      <Navigate
                        to="dashboard"
                        replace
                      />
                    }
                  />

                  <Route
                    path="dashboard"
                    element={
                      <PlatformDashboard />
                    }
                  />

                  <Route
                    path="schools"
                    element={
                      <PlatformSchools />
                    }
                  />

                  <Route
                    path="schools/:schoolId"
                    element={
                      <PlatformSchoolDetails />
                    }
                  />

                  <Route
                    path="settings"
                    element={
                      <PlatformSettings />
                    }
                  />
                </Route>
              </Route>

              <Route
                path="/no-access"
                element={
                  <RequireAuth loginPath="/login">
                    <NoAccess />
                  </RequireAuth>
                }
              />

              {appRoutes}

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
