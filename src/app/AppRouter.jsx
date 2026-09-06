import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// =========================
// Public Pages
// =========================
import Home from "@/pages/Home/Home";
import Login from "@/pages/Login/Login";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import Register from "@/pages/Register/Register";
import Onboarding from "@/pages/Onboarding/Onboarding";
import NoAccess from "@/pages/Others/NoAccess";

// =========================
// Teacher Pages
// =========================
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
import TeacherCheckIn from "@/pages/TeacherCheckIn/TeacherCheckIn";

// =========================
// School Pages
// =========================
import TeacherAttendanceAdmin from "@/pages/School/TeacherAttendance/TeacherAttendanceAdmin";
import CoverageBoard from "@/pages/School/Duty/CoverageBoard";
import LeaveRequests from "@/pages/School/Duty/LeaveRequests";
import CoverReport from "@/pages/School/Duty/CoverReport";
import TeacherDuty from "@/pages/TeacherDuty/TeacherDuty";

import SchoolManagersList from "@/pages/SchoolManagers/List";
import SchoolManagerAdd from "@/pages/SchoolManagers/Add";
import SchoolPermissions from "@/pages/SchoolPermissions/SchoolPermissions";

import SubjectOfferings from "@/pages/SubjectOfferings/SubjectOfferings";
import SchoolSettings from "@/pages/SchoolSettings/SchoolSettings";
import SchoolDashboard from "@/pages/SchoolDashboard/SchoolDashboard";
import Terms from "@/pages/School/Terms/Terms";

// =========================
// Platform Pages
// =========================
import PlatformDashboard from "@/pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "@/pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "@/pages/PlatformSchoolDetails/PlatformSchoolDetails";

import PlatformLayout from "@/layouts/PlatformLayout/PlatformLayout";

// =========================
// Guards
// =========================
import AuthenticatedRoute from "@/shared/guards/AuthenticatedRoute";
import GuestRoute from "@/shared/guards/GuestRoute";
import RoleRoute from "@/shared/guards/RoleRoute";

// =========================
// Roles
// =========================
import {
  ROLES,
  SCHOOL_ADMIN_ROLES,
} from "@/shared/auth/roles";

// =========================
// Modular routes
// Includes student routes
// =========================
import {
  appRoutes,
} from "@/routes";

const AppRouter = () => {
  return (
    <Routes>
      {/* =========================================================
          PUBLIC ROUTES
      ========================================================= */}

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

      {/* =========================================================
          GUEST ROUTES
      ========================================================= */}

      <Route element={<GuestRoute />}>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* استعادة كلمة المرور — للضيوف فقط، فالمستخدم المسجّل
            يغيّر كلمته من ملفه الشخصي */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
      </Route>

      {/* =========================================================
          AUTHENTICATED ROUTES
      ========================================================= */}

      <Route
        element={
          <AuthenticatedRoute
            loginPath="/login"
          />
        }
      >
        {/* =====================================================
            PLATFORM ADMIN
        ===================================================== */}

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

        {/* =====================================================
            OWNER / SUPERVISOR — MANAGER ADMIN
        ===================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.OWNER,
                ROLES.SUPERVISOR,
                ROLES.SUPER_ADMIN,
              ]}
            />
          }
        >
          <Route
            path="/school/managers"
            element={<SchoolManagersList />}
          />
        </Route>

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.OWNER,
                ROLES.SUPERVISOR,
              ]}
            />
          }
        >
          <Route
            path="/school/managers/add"
            element={<SchoolManagerAdd />}
          />

          <Route
            path="/school/permissions"
            element={<SchoolPermissions />}
          />
        </Route>

        {/* =====================================================
            SCHOOL ADMINISTRATION
            OWNER / MANAGER / SUPERVISOR
        ===================================================== */}

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
            path="/school/terms"
            element={<Terms />}
          />

          <Route
            path="/school/settings"
            element={<SchoolSettings />}
          />

          <Route
            path="/school/teacher-attendance"
            element={<TeacherAttendanceAdmin />}
          />

          <Route
            path="/school/duty"
            element={<CoverageBoard />}
          />

          <Route
            path="/school/leave-requests"
            element={<LeaveRequests />}
          />

          <Route
            path="/school/cover-report"
            element={<CoverReport />}
          />
        </Route>

        {/* =====================================================
            TEACHER ROUTES
        ===================================================== */}

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

          <Route
            path="/teacher/duty"
            element={<TeacherDuty />}
          />

          <Route
            path="/teacher/check-in"
            element={<TeacherCheckIn />}
          />

          {/* =========================
              Exams
          ========================= */}

          <Route
            path="/teacher/exams"
            element={<TeacherExams />}
          />

          <Route
            path="/teacher/exams/add"
            element={<TeacherExamAdd />}
          />

          <Route
            path="/teacher/exams/edit/:id"
            element={<TeacherExamAdd />}
          />

          <Route
            path="/teacher/grading/exams"
            element={<TeacherExamGrading />}
          />

          {/* =========================
              Projects
          ========================= */}

          <Route
            path="/teacher/projects"
            element={<TeacherProjects />}
          />

          <Route
            path="/teacher/grading/projects"
            element={<TeacherProjectGrading />}
          />

          {/* =========================
              Preparations
          ========================= */}

          <Route
            path="/teacher/preparations"
            element={<TeacherPreparations />}
          />

          {/*
            Teacher preparation routes must stay inside the
            teacher portal UI. The old School/Preparation
            components are intentionally not mounted here.
          */}
          <Route
            path="/teacher/preparations/add"
            element={
              <Navigate
                to="/teacher/schedule?mode=prepare"
                replace
              />
            }
          />

          <Route
            path="/teacher/preparation/add"
            element={
              <Navigate
                to="/teacher/schedule?mode=prepare"
                replace
              />
            }
          />

          <Route
            path="/teacher/preparations/edit/:id"
            element={
              <Navigate
                to="/teacher/preparations"
                replace
              />
            }
          />

          <Route
            path="/teacher/preparations/:id"
            element={
              <Navigate
                to="/teacher/preparations"
                replace
              />
            }
          />

          {/* =========================
              Library / Profile
          ========================= */}

          <Route
            path="/teacher/library"
            element={<TeacherLibrary />}
          />

          <Route
            path="/teacher/profile"
            element={<TeacherProfile />}
          />
        </Route>

        {/* =====================================================
            APPLICATION ROUTES

            Student routes موجودة هنا عن طريق appRoutes
        ===================================================== */}

        {appRoutes}

      </Route>

      {/* =========================================================
          UNKNOWN ROUTES
      ========================================================= */}

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