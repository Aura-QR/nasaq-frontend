import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Home from "@/pages/Home/Home";
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import Onboarding from "@/pages/Onboarding/Onboarding";
import NoAccess from "@/pages/Others/NoAccess";
import TeacherDashboard from "@/pages/TeacherDashboard/TeacherDashboard";

import PlatformDashboard from "@/pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "@/pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "@/pages/PlatformSchoolDetails/PlatformSchoolDetails";

import PlatformLayout from "@/layouts/PlatformLayout/PlatformLayout";

import AuthenticatedRoute from "@/shared/guards/AuthenticatedRoute";
import GuestRoute from "@/shared/guards/GuestRoute";
import RoleRoute from "@/shared/guards/RoleRoute";

import {
  ROLES,
  SCHOOL_ADMIN_ROLES,
} from "@/shared/auth/roles";

import {
  appRoutes,
} from "@/routes";

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={<Home />}
      />
      <Route
  path="/platform"
  element={<PlatformLayout />}
>
  <Route
    path="schools"
    element={<PlatformSchools />}
  />

  <Route
    path="schools/:schoolId"
    element={<PlatformSchoolDetails />}
  />
</Route>

      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      <Route
        path="/no-access"
        element={<NoAccess />}
      />

      {/*
       * Unified authentication:
       * /auth/login is used by all roles,
       * so the old platform login URL now
       * redirects to the normal login page.
       */}
      <Route
        path="/platform/login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* Guest-only routes */}
      <Route
        element={<GuestRoute />}
      >
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Route>

      {/* Super Admin / Platform routes */}
      <Route
        element={
          <AuthenticatedRoute loginPath="/login" />
        }
      >
        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.SUPER_ADMIN,
              ]}
            />
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
          </Route>
        </Route>
      </Route>

      {/* School-scoped authenticated routes */}
      <Route
        element={
          <AuthenticatedRoute loginPath="/login" />
        }
      >
        {/* Owner / Supervisor / Manager */}
        <Route
          element={
            <RoleRoute
              allowedRoles={
                SCHOOL_ADMIN_ROLES
              }
            />
          }
        >
          <Route
            path="/school/dashboard"
            element={
              <Navigate
                to="/users/students"
                replace
              />
            }
          />
        </Route>

        {/* Teacher */}
        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.TEACHER,
              ]}
            />
          }
        >
          <Route
            path="/teacher/dashboard"
            element={
              <TeacherDashboard />
            }
          />
        </Route>

        {/* Student */}
        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.STUDENT,
              ]}
            />
          }
        >
          <Route
            path="/student/dashboard"
            element={
              <Navigate
                to="/student-dashboard"
                replace
              />
            }
          />
        </Route>

        {/*
         * Temporary compatibility with
         * existing protected application routes.
         * These routes can later be moved into
         * their corresponding modules.
         */}
        {appRoutes}
      </Route>

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
  );
};

export default AppRouter;
