import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

import Classes_List from "../pages/School/Classes/List";
import Classes_Add from "../pages/School/Classes/Add";
import Classes_Edit from "../pages/School/Classes/Edit";
import Classes_Profile from "../pages/School/Classes/Profile";
import Classes_Schedule from "../pages/School/Classes/Schedule";
import RequirePermission from "@/components/RequirePermission";

export const classesRoutes = (
  <>
    <Route path="/school/classes" element={<RequireAuth loginPath="/"><RequirePermission module="classes" operation="read"><Classes_List /></RequirePermission></RequireAuth>} />
    <Route path="/school/classes/add" element={<RequireAuth loginPath="/"><RequirePermission module="classes" operation="add"><Classes_Add /></RequirePermission></RequireAuth>} />
    <Route path="/school/classes/edit/:id" element={<RequireAuth loginPath="/"><RequirePermission module="classes" operation="edit"><Classes_Edit /></RequirePermission></RequireAuth>} />
    <Route path="/school/classes/:id" element={<RequireAuth loginPath="/"><RequirePermission module="classes" operation="read"><Classes_Profile /></RequirePermission></RequireAuth>} />
    <Route path="/school/classes/:id/schedule" element={<RequireAuth loginPath="/"><RequirePermission module="classes" operation="read"><Classes_Schedule /></RequirePermission></RequireAuth>} />
  </>
);
