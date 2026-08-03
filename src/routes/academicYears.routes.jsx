import {
  Route,
} from "react-router-dom";

import AcademicYearsList from "@/pages/AcademicYears/List";
import AcademicYearAdd from "@/pages/AcademicYears/Add";
import AcademicYearDetails from "@/pages/AcademicYears/Details";

import RoleRoute from "@/shared/guards/RoleRoute";

import {
  ROLES,
} from "@/shared/auth/roles";

export const academicYearsRoutes = (
  <Route
    element={
      <RoleRoute
        allowedRoles={[
          ROLES.OWNER,
          ROLES.SUPERVISOR,
        ]}
      />
    }
  >
    <Route
      path="/school/academic-years"
      element={
        <AcademicYearsList />
      }
    />

    <Route
      path="/school/academic-years/add"
      element={
        <AcademicYearAdd />
      }
    />

    <Route
      path="/school/academic-years/:id"
      element={
        <AcademicYearDetails />
      }
    />
  </Route>
);
