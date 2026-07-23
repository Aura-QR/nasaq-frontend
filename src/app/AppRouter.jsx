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

import SchoolDashboardPage from "@/pages/SchoolDashboardPage/SchoolDashboardPage";
import StudentDashboardPage from "@/pages/StudentDashboardPage/StudentDashboardPage";
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
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      <Route
        path="/no-access"
        element={<NoAccess />}
      />

      <Route
        path="/platform/login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

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

      <Route
        element={
          <AuthenticatedRoute loginPath="/login" />
        }
      >
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
              <SchoolDashboardPage />
            }
          />
        </Route>

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
              <StudentDashboardPage />
            }
          />
        </Route>

        {appRoutes}
      </Route>

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
