import {
  Route,
} from "react-router-dom";

import {
  studentsRoutes,
} from "./students.routes";

import {
  teachersRoutes,
} from "./teachers.routes";

import {
  subjectsRoutes,
} from "./subjects.routes";

import {
  classesRoutes,
} from "./classes.routes";

import {
  lecturesRoutes,
} from "./lectures.routes";

import {
  attendanceRoutes,
} from "./attendance.routes";

import {
  libraryRoutes,
} from "./library.routes";

import {
  gradesCriteriaRoutes,
} from "./gradesCriteria.routes";

import {
  examsRoutes,
} from "./exams.routes";

import {
  projectsRoutes,
} from "./projects.routes";

import {
  preparationRoutes,
} from "./preparation.routes";

import {
  studentRoutes,
} from "./student.routes";

import {
  financialsRoutes,
} from "./financials.routes";

import {
  expensesRoutes,
} from "./expenses.routes";

import ModuleAccessRoute from "@/shared/guards/ModuleAccessRoute";

const protectModule = (
  module,
  routes
) => (
  <Route
    element={
      <ModuleAccessRoute
        module={module}
      />
    }
  >
    {routes}
  </Route>
);

export const appRoutes = (
  <>
    {protectModule(
      "students",
      studentsRoutes
    )}

    {protectModule(
      "teachers",
      teachersRoutes
    )}

    {protectModule(
      "subjects",
      subjectsRoutes
    )}

    {protectModule(
      "classes",
      classesRoutes
    )}

    {protectModule(
      "lectures",
      lecturesRoutes
    )}

    {protectModule(
      "attendance",
      attendanceRoutes
    )}

    {protectModule(
      "library",
      libraryRoutes
    )}

    {protectModule(
      "gradesCriteria",
      gradesCriteriaRoutes
    )}

    {protectModule(
      "exams",
      examsRoutes
    )}

    {protectModule(
      "projects",
      projectsRoutes
    )}

    {protectModule(
      "preparation",
      preparationRoutes
    )}

    {protectModule(
      "financial",
      financialsRoutes
    )}

    {protectModule(
      "expenses",
      expensesRoutes
    )}

    {studentRoutes}
  </>
);
