import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Grades Criteria Components
import Preparation_List from "@/pages/School/Preparation/List";
import Preparation_Profile from "@/pages/School/Preparation/Profile";
import Preparation_Add from "@/pages/School/Preparation/Add";
import Preparation_Edit from "@/pages/School/Preparation/Edit";
import RequirePermission from "@/components/RequirePermission";

export const preparationRoutes = (
  <>
    <Route path="/school/preparation" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="preparation" operation="read">
          <Preparation_List />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/preparation/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="preparation" operation="read">
          <Preparation_Profile />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/preparation/edit/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="preparation" operation="edit">
          <Preparation_Edit />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/preparation/add" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="preparation" operation="add">
          <Preparation_Add />
        </RequirePermission>
      </RequireAuth>
    } />
  </>
);
