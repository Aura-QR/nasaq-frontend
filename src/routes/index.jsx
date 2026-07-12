import { studentsRoutes } from "./students.routes";
import { teachersRoutes } from "./teachers.routes";
import { subjectsRoutes } from "./subjects.routes";
import { classesRoutes } from "./classes.routes";
import { lecturesRoutes } from "./lectures.routes";
import { attendanceRoutes } from "./attendance.routes";
import { libraryRoutes } from "./library.routes";
import { gradesCriteriaRoutes } from "./gradesCriteria.routes";
import { examsRoutes } from "./exams.routes";
import { projectsRoutes } from "./projects.routes";
import { preparationRoutes } from "./preparation.routes";
import { studentRoutes } from "./student.routes";
import { financialsRoutes } from "./financials.routes";
import { expensesRoutes } from "./expenses.routes";

export const appRoutes = (
  <>
    {studentsRoutes}
    {teachersRoutes}
    {subjectsRoutes}
    {classesRoutes}
    {lecturesRoutes}
    {attendanceRoutes}
    {libraryRoutes}
    {gradesCriteriaRoutes}
    {examsRoutes}
    {projectsRoutes}
    {preparationRoutes}
    {financialsRoutes}
    {expensesRoutes}
    {studentRoutes}
  </>
);
