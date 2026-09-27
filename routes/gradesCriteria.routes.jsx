import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Grades Criteria Components
import GradesCriteria_List from "../pages/School/GradesCriteria/List";
import GradesCriteria_Profile from "../pages/School/GradesCriteria/Profile";
import GradesCriteria_Add from "../pages/School/GradesCriteria/Add";
import GradesCriteria_Edit from "../pages/School/GradesCriteria/Edit";
import RequirePermission from "@/components/RequirePermission";

export const gradesCriteriaRoutes = (
  <>
    <Route path="/school/gradesCriteria" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="gradesCriteria" operation="read">
          <GradesCriteria_List />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/gradesCriteria/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="gradesCriteria" operation="read">
          <GradesCriteria_Profile />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/gradesCriteria/edit/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="gradesCriteria" operation="edit">
          <GradesCriteria_Edit />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/gradesCriteria/add" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="gradesCriteria" operation="add">
          <GradesCriteria_Add />
        </RequirePermission>
      </RequireAuth>
    } />
  </>
);
