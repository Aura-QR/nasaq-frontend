import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Teachers Components
import Teachers_List from "../pages/Users/Teachers/List";
import Teachers_Profile from "../pages/Users/Teachers/Profile";
import Teachers_Add from "../pages/Users/Teachers/Add";
import Teachers_Edit from "../pages/Users/Teachers/Edit";
import Teachers_Schedule from "../pages/Users/Teachers/Schedule";
import RequirePermission from "@/components/RequirePermission";

export const teachersRoutes = (
  <>
    <Route
      path="/users/teachers"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="teachers" operation="read">
            <Teachers_List />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/users/teachers/:id"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="teachers" operation="read">
            <Teachers_Profile />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/users/teachers/edit/:id"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="teachers" operation="edit">
            <Teachers_Edit />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/users/teachers/add"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="teachers" operation="add">
            <Teachers_Add />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/users/teachers/:id/schedule"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="lectures" operation="read">
            <Teachers_Schedule />
          </RequirePermission>
        </RequireAuth>
      }
    />
  </>
);
