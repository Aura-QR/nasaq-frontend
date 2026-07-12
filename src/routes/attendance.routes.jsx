import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Attendance Components
import Attendance_List from "../pages/School/Attendance/List";
import Attendance_Add from "../pages/School/Attendance/Add";
import Attendance_Edit from "../pages/School/Attendance/Edit";
import RequirePermission from "@/components/RequirePermission";

export const attendanceRoutes = (
  <>
    <Route
      path="/school/attendance"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="attendance" operation="read">
            <Attendance_List />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/attendance/add"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="attendance" operation="add">
            <Attendance_Add />
          </RequirePermission>
        </RequireAuth>
      }
    />

    <Route
      path="/school/attendance/edit/:id"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="classes" operation="edit">
            <Attendance_Edit />
          </RequirePermission>
        </RequireAuth>
      }
    />
  </>
);
