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
import TeacherProjectGrading from "@/pages/TeacherProjectGrading/TeacherProjectGrading";
import TeacherExams from "@/pages/TeacherExams/TeacherExams";
import TeacherExamAdd from "@/pages/TeacherExamAdd/TeacherExamAdd";
import TeacherAttendance from "@/pages/TeacherAttendance/TeacherAttendance";
import TeacherSchedule from "@/pages/TeacherSchedule/TeacherSchedule";
import TeacherClasses from "@/pages/TeacherClasses/TeacherClasses";

import PlatformDashboard from "@/pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "@/pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "@/pages/PlatformSchoolDetails/PlatformSchoolDetails";

import SchoolManagersList from "@/pages/SchoolManagers/List";
import SchoolManagerAdd from "@/pages/SchoolManagers/Add";

import PlatformLayout from "@/layouts/PlatformLayout/PlatformLayout";

import AuthenticatedRoute from "@/shared/guards/AuthenticatedRoute";
import GuestRoute from "@/shared/guards/GuestRoute";
import OwnerOnlyRoute from "@/shared/guards/OwnerOnlyRoute";
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
      <Route path="/" element={<Home />} />
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

      <Route element={<GuestRoute />}>
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
            element={<PlatformLayout />}
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
              element={<PlatformDashboard />}
            />
            <Route
              path="schools"
              element={<PlatformSchools />}
            />
            <Route
              path="schools/:schoolId"
              element={<PlatformSchoolDetails />}
            />
          </Route>
        </Route>

        <Route element={<OwnerOnlyRoute />}>
          <Route
            path="/school/managers"
            element={<SchoolManagersList />}
          />
          <Route
            path="/school/managers/add"
            element={<SchoolManagerAdd />}
          />
        </Route>

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
            path="/teacher"
            element={
              <Navigate
                to="/teacher/dashboard"
                replace
              />
            }
          />
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          />
          <Route
            path="/teacher/grading/projects"
            element={<TeacherProjectGrading />}
          />
          <Route
            path="/teacher/exams"
            element={<TeacherExams />}
          />
          <Route
            path="/teacher/exams/add"
            element={<TeacherExamAdd />}
          />
          <Route
            path="/teacher/attendance"
            element={<TeacherAttendance />}
          />
          <Route
            path="/teacher/schedule"
            element={<TeacherSchedule />}
          />
          <Route
            path="/teacher/classes"
            element={<TeacherClasses />}
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
              <Navigate
                to="/student-dashboard"
                replace
              />
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
