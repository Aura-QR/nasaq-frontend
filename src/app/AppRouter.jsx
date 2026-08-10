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
import TeacherExamGrading from "@/pages/TeacherExamGrading/TeacherExamGrading";
import TeacherExams from "@/pages/TeacherExams/TeacherExams";
import TeacherExamAdd from "@/pages/TeacherExamAdd/TeacherExamAdd";
import TeacherAttendance from "@/pages/TeacherAttendance/TeacherAttendance";
import TeacherSchedule from "@/pages/TeacherSchedule/TeacherSchedule";
import TeacherClasses from "@/pages/TeacherClasses/TeacherClasses";
import TeacherPreparations from "@/pages/TeacherPreparations/TeacherPreparations";
import TeacherLibrary from "@/pages/TeacherLibrary/TeacherLibrary";
import TeacherProfile from "@/pages/TeacherProfile/TeacherProfile";
import TeacherProjects from "@/pages/TeacherProjects/TeacherProjects";

import PreparationAdd from "@/pages/School/Preparation/Add";
import PreparationProfile from "@/pages/School/Preparation/Profile";
import PreparationEdit from "@/pages/School/Preparation/Edit";

import PlatformDashboard from "@/pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "@/pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "@/pages/PlatformSchoolDetails/PlatformSchoolDetails";

import SchoolManagersList from "@/pages/SchoolManagers/List";
import SchoolManagerAdd from "@/pages/SchoolManagers/Add";
import SubjectOfferings from "@/pages/SubjectOfferings/SubjectOfferings";
import SchoolSettings from "@/pages/SchoolSettings/SchoolSettings";
import SchoolDashboard from "@/pages/SchoolDashboard/SchoolDashboard";

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
      {/* Public routes */}
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

      {/* Guest routes */}
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

      {/* Authenticated routes */}
      <Route
        element={
          <AuthenticatedRoute loginPath="/login" />
        }
      >
        {/* Platform admin routes */}
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

        {/* Owner-only routes */}
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

        {/* School administration routes */}
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
            element={<SchoolDashboard />}
          />

          <Route
            path="/subject-offerings"
            element={<SubjectOfferings />}
          />

          <Route
            path="/school/settings"
            element={<SchoolSettings />}
          />
        </Route>

        {/* Teacher routes */}
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
            path="/teacher/schedule"
            element={<TeacherSchedule />}
          />

          <Route
            path="/teacher/classes"
            element={<TeacherClasses />}
          />

          <Route
            path="/teacher/attendance"
            element={<TeacherAttendance />}
          />

          {/* Teacher exams */}
          <Route
            path="/teacher/exams"
            element={<TeacherExams />}
          />

          <Route
            path="/teacher/exams/add"
            element={<TeacherExamAdd />}
          />

          <Route
            path="/teacher/grading/exams"
            element={<TeacherExamGrading />}
          />

          {/* Teacher projects */}
          <Route
            path="/teacher/projects"
            element={<TeacherProjects />}
          />

          <Route
            path="/teacher/grading/projects"
            element={<TeacherProjectGrading />}
          />

          {/* Teacher preparations */}
          <Route
            path="/teacher/preparations"
            element={<TeacherPreparations />}
          />

          <Route
            path="/teacher/preparations/add"
            element={<PreparationAdd />}
          />

          {/* دعم المسار القديم */}
          <Route
            path="/teacher/preparation/add"
            element={
              <Navigate
                to="/teacher/preparations/add"
                replace
              />
            }
          />

          <Route
            path="/teacher/preparations/edit/:id"
            element={<PreparationEdit />}
          />

          <Route
            path="/teacher/preparations/:id"
            element={<PreparationProfile />}
          />

          <Route
            path="/teacher/library"
            element={<TeacherLibrary />}
          />

          <Route
            path="/teacher/profile"
            element={<TeacherProfile />}
          />
        </Route>

        {/* Student routes */}
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

        {/* Existing application routes */}
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
