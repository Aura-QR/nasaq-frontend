import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";
import Dashboard from "@/pages/Student/Dashboard";
import MyClass from "@/pages/Student/MyClass";
import MySubjects from "@/pages/Student/MySubjects";
import MySchedule from "@/pages/Student/MySchedule";
import MyExams from "@/pages/Student/MyExams";
import MyProjects from "@/pages/Student/MyProjects";
import MyAssignments from "@/pages/Student/MyAssignments";
import Library from "@/pages/Student/Library";
import Attendance from "@/pages/Student/Attendance";
import IsStudent from "@/components/IsStudent";
import SubjectGrades from "@/pages/Student/SubjectGrades";
import StartPage from "@/pages/Student/Quiz/StartPage";
import ActiveQuizPage from "@/pages/Student/Quiz/ActiveQuizPage";
import GradePage from "@/pages/Student/Quiz/GradePage";
import ReviewPage from "@/pages/Student/Quiz/ReviewPage";
import SubmissionPage from "@/pages/Student/SubmissionPage";
import StudentFinancialMyRecord from "@/pages/Student/Financials/MyRecord";
import StudentFinancialMySummary from "@/pages/Student/Financials/MySummary";
import StudentFinancialMyBus from "@/pages/Student/Financials/MyBus";
import StudentFinancialMyTrips from "@/pages/Student/Financials/MyTrips";


export const studentRoutes = (
  <>
    <Route path="/student-dashboard" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <Dashboard />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/my-class" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MyClass />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/subjects" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MySubjects />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/schedule" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MySchedule />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/exams" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MyExams />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/exams/:examId/quiz" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StartPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/exams/:examId/quiz/active" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <ActiveQuizPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/exams/:examId/quiz/grade" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <GradePage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/exams/:examId/quiz/review" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <ReviewPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/projects" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MyProjects />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/projects/:projectId" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <SubmissionPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/assignments" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <MyAssignments />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/assignments/:examId/quiz" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StartPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/assignments/:examId/quiz/active" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <ActiveQuizPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/assignments/:examId/quiz/grade" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <GradePage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/assignments/:examId/quiz/review" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <ReviewPage />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/library" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <Library />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/attendance" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <Attendance />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/subjects/:id" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <SubjectGrades />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/financials/my-record" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StudentFinancialMyRecord />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/financials/my-summary" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StudentFinancialMySummary />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/financials/my-bus" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StudentFinancialMyBus />
        </IsStudent>
      </RequireAuth>
    } />

    <Route path="/student-dashboard/financials/my-trips" element={
      <RequireAuth loginPath="/">
        <IsStudent>
          <StudentFinancialMyTrips />
        </IsStudent>
      </RequireAuth>
    } />
  </>
);
