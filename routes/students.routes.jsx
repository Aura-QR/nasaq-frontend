import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";
import RequirePermission from "@/components/RequirePermission";

// Students Components
import Students_List from "../pages/Users/Students/List";
import Students_Profile from "../pages/Users/Students/Profile";
import Students_Add from "../pages/Users/Students/Add";
import Students_Edit from "../pages/Users/Students/Edit";

export const studentsRoutes = (
  <>
    <Route path="/users/students" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="students" operation="read">
          <Students_List />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/users/students/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="students" operation="read">
          <Students_Profile />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/users/students/edit/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="students" operation="edit">
          <Students_Edit />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/users/students/add" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="students" operation="add">
          <Students_Add />
        </RequirePermission>
      </RequireAuth>
    } />
  </>
);
