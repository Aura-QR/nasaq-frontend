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
import QuickPrepPrivacy from "@/pages/Privacy/QuickPrepPrivacy";

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
import PreparationAdd from "@/pages/School/Preparation/Add";
import PreparationEdit from "@/pages/School/Preparation/Edit";
import PreparationProfile from "@/pages/School/Preparation/Profile";
import TeacherLibrary from "@/pages/TeacherLibrary/TeacherLibrary";
import TeacherProfile from "@/pages/TeacherProfile/TeacherProfile";
import TeacherProjects from "@/pages/TeacherProjects/TeacherProjects";
import TeacherCheckIn from "@/pages/TeacherCheckIn/TeacherCheckIn";
import MyTeacherAbsenceExcuses from "@/pages/TeacherAbsenceExcuses/MyTeacherAbsenceExcuses";

// =========================
// School Pages
// =========================
import TeacherAttendanceAdmin from "@/pages/School/TeacherAttendance/TeacherAttendanceAdmin";
import StaffAttendanceAdmin from "@/pages/School/StaffAttendance/StaffAttendanceAdmin";
import StaffAttendance from "@/pages/StaffAttendance/StaffAttendance";
import StaffLateReasons from "@/pages/StaffLateReasons/StaffLateReasons";
import StaffLeaveRequests from "@/pages/StaffLeaveRequests/StaffLeaveRequests";
import MyStaffAbsenceExcuses from "@/pages/StaffAbsenceExcuses/MyStaffAbsenceExcuses";
import StaffAbsenceExcuses from "@/pages/StaffAbsenceExcuses/StaffAbsenceExcuses";
import CoverageBoard from "@/pages/School/Duty/CoverageBoard";
import LeaveRequests from "@/pages/School/Duty/LeaveRequests";
import CoverReport from "@/pages/School/Duty/CoverReport";
import MyCover from "@/pages/School/Duty/MyCover";
import TeacherDuty from "@/pages/TeacherDuty/TeacherDuty";

import SchoolManagersList from "@/pages/SchoolManagers/List";
import StaffMembers from "@/pages/StaffMembers/StaffMembers";
import SchoolManagerAdd from "@/pages/SchoolManagers/Add";
import SchoolPermissions from "@/pages/SchoolPermissions/SchoolPermissions";

import SubjectOfferings from "@/pages/SubjectOfferings/SubjectOfferings";
import TeacherConstraints from "@/pages/TeacherConstraints/TeacherConstraints";
import AbsenceExcuses from "@/pages/AbsenceExcuses/AbsenceExcuses";
import LateReasons from "@/pages/LateReasons/LateReasons";
import TeacherAbsenceExcuses from "@/pages/TeacherAbsenceExcuses/TeacherAbsenceExcuses";
import ClassRound from "@/pages/ClassRound/ClassRound";
import LessonObservations from "@/pages/LessonObservations/LessonObservations";
import MyObservations from "@/pages/MyObservations/MyObservations";
import SchoolSettings from "@/pages/SchoolSettings/SchoolSettings";
import SchoolDashboard from "@/pages/SchoolDashboard/SchoolDashboard";
import Terms from "@/pages/School/Terms/Terms";
import CurriculumManagement from "@/pages/School/Curriculum/CurriculumManagement";
import DailyTrackingReport from "@/pages/DailyTrackingReport/DailyTrackingReport";

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
import RequirePermission from "@/components/RequirePermission";

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
        path="/privacy/quick-prep"
        element={<QuickPrepPrivacy />}
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
          {/* Service staff are managed by the same people as managers, on a
              screen of their own so they never appear in the managers list. */}
          <Route
            path="/school/staff-members"
            element={<StaffMembers />}
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
            CURRICULUM ADMINISTRATION
            OWNER / MANAGER ONLY
        ===================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.OWNER,
                ROLES.MANAGER,
              ]}
            />
          }
        >
          <Route
            path="/school/curriculum"
            element={<CurriculumManagement />}
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
            path="/school/teacher-constraints"
            element={<TeacherConstraints />}
          />

          <Route
            path="/school/absence-excuses"
            element={
              <RequirePermission module="attendance" operation="read">
                <AbsenceExcuses />
              </RequirePermission>
            }
          />

          <Route
            path="/school/late-reasons"
            element={
              <RequirePermission module="teacherAttendance" operation="read">
                <LateReasons />
              </RequirePermission>
            }
          />

          <Route
            path="/school/teacher-absence-excuses"
            element={
              <RequirePermission module="teacherAttendance" operation="read">
                <TeacherAbsenceExcuses />
              </RequirePermission>
            }
          />

          <Route
            path="/school/class-round"
            element={<ClassRound />}
          />

          <Route
            path="/school/lesson-observations"
            element={<LessonObservations />}
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
            path="/school/daily-tracking"
            element={
              <RequirePermission module="dailyTracking" operation="read">
                <DailyTrackingReport />
              </RequirePermission>
            }
          />

          <Route
            path="/school/staff-attendance"
            element={
              <RequirePermission module="staffAttendance" operation="read">
                <StaffAttendanceAdmin />
              </RequirePermission>
            }
          />

          <Route
            path="/school/staff-late-reasons"
            element={
              <RequirePermission module="staffAttendance" operation="read">
                <StaffLateReasons />
              </RequirePermission>
            }
          />

          <Route
            path="/school/staff-leave-requests"
            element={
              <RequirePermission module="staffAttendance" operation="read">
                <StaffLeaveRequests />
              </RequirePermission>
            }
          />

          <Route
            path="/school/staff-absence-excuses"
            element={
              <RequirePermission module="staffAttendance" operation="read">
                <StaffAbsenceExcuses />
              </RequirePermission>
            }
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
            SUPERVISOR / MANAGER — PERSONAL COVER PERIODS
        ===================================================== */}
        <Route
          element={
            <RoleRoute
              allowedRoles={[ROLES.SUPERVISOR, ROLES.MANAGER]}
            />
          }
        >
          <Route path="/school/my-cover" element={<MyCover />} />
          <Route path="/school/cover-register" element={<TeacherAttendance />} />
        </Route>

        {/* =====================================================
            MANAGER / SUPERVISOR / SERVICE STAFF — PERSONAL STAFF ATTENDANCE
        ===================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.MANAGER,
                ROLES.SUPERVISOR,
                ROLES.STAFF,
              ]}
            />
          }
        >
          <Route
            path="/staff-attendance"
            element={<StaffAttendance />}
          />
          <Route
            path="/staff-leave-requests"
            element={<StaffLeaveRequests personal />}
          />
          <Route
            path="/staff-absence-excuses"
            element={<MyStaffAbsenceExcuses />}
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

          {/* Compatibility for earlier teacher sidebar links. */}
          <Route path="/teacher/students" element={<Navigate to="/teacher/classes" replace />} />
          <Route path="/teacher/lectures" element={<Navigate to="/teacher/schedule" replace />} />

          <Route
            path="/teacher/observations"
            element={<MyObservations />}
          />

          <Route
            path="/teacher/attendance"
            element={<TeacherAttendance />}
          />

          <Route
            path="/teacher/daily-tracking"
            element={<DailyTrackingReport />}
          />

          <Route
            path="/teacher/duty"
            element={<TeacherDuty />}
          />

          <Route
            path="/teacher/check-in"
            element={<TeacherCheckIn />}
          />

          <Route
            path="/teacher/absence-excuses"
            element={<MyTeacherAbsenceExcuses />}
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

          <Route
            path="/teacher/preparations/add"
            element={<PreparationAdd />}
          />

          <Route
            path="/teacher/preparation/add"
            element={<PreparationAdd />}
          />

          <Route
            path="/teacher/preparations/edit/:id"
            element={<PreparationEdit />}
          />

          <Route
            path="/teacher/preparations/:id"
            element={<PreparationProfile />}
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
