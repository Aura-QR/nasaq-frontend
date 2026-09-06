import { Navigate, Route } from "react-router-dom";

// =========================
// Student Pages
// =========================
import StudentDashboardPage from "@/pages/Student/StudentDashboardPage";
import MyClass from "@/pages/Student/MyClass";
import MySubjects from "@/pages/Student/MySubjects";
import MySchedule from "@/pages/Student/MySchedule";
import MyExams from "@/pages/Student/MyExams";
import MyProjects from "@/pages/Student/MyProjects";
import MyAssignments from "@/pages/Student/MyAssignments";
import Library from "@/pages/Student/Library";
import Attendance from "@/pages/Student/Attendance";
import SubjectGrades from "@/pages/Student/SubjectGrades";
import PreparationView from "@/pages/Student/PreparationView";

// =========================
// Quiz Pages
// =========================
import StartPage from "@/pages/Student/Quiz/StartPage";
import ActiveQuizPage from "@/pages/Student/Quiz/ActiveQuizPage";
import GradePage from "@/pages/Student/Quiz/GradePage";
import ReviewPage from "@/pages/Student/Quiz/ReviewPage";

// =========================
// Submission
// =========================
import SubmissionPage from "@/pages/Student/SubmissionPage";

// =========================
// Financial Pages
// =========================
import StudentFinancialMyRecord from "@/pages/Student/Financials/MyRecord";
import StudentFinancialMySummary from "@/pages/Student/Financials/MySummary";
import StudentFinancialMyBus from "@/pages/Student/Financials/MyBus";
import StudentFinancialMyTrips from "@/pages/Student/Financials/MyTrips";

// =========================
// Layout & Guards
// =========================
import StudentLayout from "@/layouts/StudentLayout/StudentLayout";
import RoleRoute from "@/shared/guards/RoleRoute";
import { ROLES } from "@/shared/auth/roles";

export const studentRoutes = (
  <>
    {/* =========================================================
        STUDENT ONLY
    ========================================================= */}
    <Route
      element={
        <RoleRoute
          allowedRoles={[ROLES.STUDENT]}
        />
      }
    >
      {/* =========================================================
          Redirect aliases
          لو أي جزء قديم في المشروع بيوجه للمسارات دي
          هيروح للداشبورد الجديدة
      ========================================================= */}

      <Route
        path="/student"
        element={
          <Navigate
            to="/student-dashboard"
            replace
          />
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <Navigate
            to="/student-dashboard"
            replace
          />
        }
      />

      {/* =========================================================
          STUDENT LAYOUT
      ========================================================= */}
      <Route element={<StudentLayout />}>

        {/* =========================
            Dashboard
        ========================= */}
        <Route
          index
          path="/student-dashboard"
          element={<StudentDashboardPage />}
        />

        {/* =========================
            My Class
        ========================= */}
        <Route
          path="/student-dashboard/my-class"
          element={<MyClass />}
        />

        {/* =========================
            Subjects
        ========================= */}
        <Route
          path="/student-dashboard/subjects"
          element={<MySubjects />}
        />

        <Route
          path="/student-dashboard/subjects/:id"
          element={<SubjectGrades />}
        />

        {/* =========================
            Schedule
        ========================= */}
        <Route
          path="/student-dashboard/schedule"
          element={<MySchedule />}
        />

        {/* =========================
            Exams
        ========================= */}
        <Route
          path="/student-dashboard/exams"
          element={<MyExams />}
        />

        <Route
          path="/student-dashboard/exams/:examId/quiz"
          element={<StartPage />}
        />

        <Route
          path="/student-dashboard/exams/:examId/quiz/active"
          element={<ActiveQuizPage />}
        />

        <Route
          path="/student-dashboard/exams/:examId/quiz/grade"
          element={<GradePage />}
        />

        <Route
          path="/student-dashboard/exams/:examId/quiz/review"
          element={<ReviewPage />}
        />

        {/* =========================
            Projects
        ========================= */}
        <Route
          path="/student-dashboard/projects"
          element={<MyProjects />}
        />

        <Route
          path="/student-dashboard/projects/:projectId"
          element={<SubmissionPage />}
        />

        {/* =========================
            Assignments
        ========================= */}
        <Route
          path="/student-dashboard/assignments"
          element={<MyAssignments />}
        />

        <Route
          path="/student-dashboard/assignments/:examId/quiz"
          element={<StartPage />}
        />

        <Route
          path="/student-dashboard/assignments/:examId/quiz/active"
          element={<ActiveQuizPage />}
        />

        <Route
          path="/student-dashboard/assignments/:examId/quiz/grade"
          element={<GradePage />}
        />

        <Route
          path="/student-dashboard/assignments/:examId/quiz/review"
          element={<ReviewPage />}
        />

        {/* =========================
            Lesson preparation view
            The preparation ID is supplied by an authorized flow.
        ========================= */}
        <Route
          path="/student-dashboard/preparations/:id"
          element={<PreparationView />}
        />

        {/* =========================
            Library
        ========================= */}
        <Route
          path="/student-dashboard/library"
          element={<Library />}
        />

        {/* =========================
            Attendance
        ========================= */}
        <Route
          path="/student-dashboard/attendance"
          element={<Attendance />}
        />

        {/* =========================
            Financials
        ========================= */}
        <Route
          path="/student-dashboard/financials/my-record"
          element={<StudentFinancialMyRecord />}
        />

        <Route
          path="/student-dashboard/financials/my-summary"
          element={<StudentFinancialMySummary />}
        />

        <Route
          path="/student-dashboard/financials/my-bus"
          element={<StudentFinancialMyBus />}
        />

        <Route
          path="/student-dashboard/financials/my-trips"
          element={<StudentFinancialMyTrips />}
        />

      </Route>
    </Route>
  </>
);