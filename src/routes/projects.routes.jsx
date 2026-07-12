import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Grades Criteria Components
import Projects_List from "@/pages/School/Projects/List";
import Projects_Profile from "@/pages/School/Projects/Profile";
import Projects_Add from "@/pages/School/Projects/Add";
import Projects_Edit from "@/pages/School/Projects/Edit";
import RequirePermission from "@/components/RequirePermission";

export const projectsRoutes = (
  <>
    <Route path="/school/projects" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="projects" operation="read">
          <Projects_List />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/projects/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="projects" operation="read">
          <Projects_Profile />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/projects/edit/:id" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="projects" operation="edit">
          <Projects_Edit />
        </RequirePermission>
      </RequireAuth>
    } />

    <Route path="/school/projects/add" element={
      <RequireAuth loginPath="/">
        <RequirePermission module="projects" operation="add">
          <Projects_Add />
        </RequirePermission>
      </RequireAuth>
    } />
  </>
);
