import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Subjects Components
import Subjects_List from "../pages/School/Subjects/List";
import Subjects_Add from "../pages/School/Subjects/Add";
import Subjects_Edit from "../pages/School/Subjects/Edit";
import RequirePermission from "@/components/RequirePermission";

export const subjectsRoutes = (
  <>
    <Route
      path="/school/subjects"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="subjects" operation="read">
            <Subjects_List />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/subjects/add"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="subjects" operation="add">
            <Subjects_Add />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/subjects/edit/:id"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="subjects" operation="edit">
            <Subjects_Edit />
          </RequirePermission>
        </RequireAuth>
      }
    />
  </>
);
