import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Grades Criteria Components
import Exams_List from "@/pages/School/Exams/List";
import Exams_Profile from "@/pages/School/Exams/Profile";
import Exams_Add from "@/pages/School/Exams/Add";
import Exams_Edit from "@/pages/School/Exams/Edit";
import RequirePermission from "@/components/RequirePermission";

export const examsRoutes = (
  <>
    <Route path="/school/exams" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="exams" operation="read">
          <Exams_List />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/exams/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="exams" operation="read">
          <Exams_Profile />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/exams/edit/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="exams" operation="edit">
          <Exams_Edit />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/exams/add" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="exams" operation="add">
          <Exams_Add />
        </RequirePermission>
      </RequireAuth>
    } />
  </>
);
