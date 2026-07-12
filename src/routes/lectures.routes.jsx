import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Lectures Components
import Lectures_List from "../pages/School/Lectures/List";
import Lectures_Add from "../pages/School/Lectures/Add";
import Lectures_Edit from "../pages/School/Lectures/Edit";
import RequirePermission from "@/components/RequirePermission";

export const lecturesRoutes = (
  <>
    <Route
      path="/school/lectures"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="lectures" operation="read">
            <Lectures_List />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/lectures/add"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="lectures" operation="add">
            <Lectures_Add />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/lectures/edit/:id"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="lectures" operation="edit">
            <Lectures_Edit />
          </RequirePermission>
        </RequireAuth>
      }
    />
  </>
);
