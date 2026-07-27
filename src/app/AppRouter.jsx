import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Home from "@/pages/Home/Home";
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import Onboarding from "@/pages/Onboarding/Onboarding";
import NoAccess from "@/pages/Others/NoAccess";
import TeacherDashboard from "@/pages/TeacherDashboard/TeacherDashboard";

import PlatformDashboard from "@/pages/PlatformDashboard/PlatformDashboard";
import PlatformSchools from "@/pages/PlatformSchools/PlatformSchools";
import PlatformSchoolDetails from "@/pages/PlatformSchoolDetails/PlatformSchoolDetails";

import SchoolDashboardPage from "@/pages/SchoolDashboardPage/SchoolDashboardPage";
import SchoolManagers from "@/pages/SchoolManagers/SchoolManagers";
import SchoolStudents from "@/pages/SchoolStudents/SchoolStudents";
import SchoolStudentDetails from "@/pages/SchoolStudentDetails/SchoolStudentDetails";
import SchoolTeachers from "@/pages/SchoolTeachers/SchoolTeachers";
import SchoolTeacherDetails from "@/pages/SchoolTeacherDetails/SchoolTeacherDetails";
import SchoolClasses from "@/pages/SchoolClasses/SchoolClasses";
import SchoolClassDetails from "@/pages/SchoolClassDetails/SchoolClassDetails";
import StudentDashboardPage from "@/pages/StudentDashboardPage/StudentDashboardPage";

import PlatformLayout from "@/layouts/PlatformLayout/PlatformLayout";
import SchoolLayout from "@/layouts/SchoolLayout/SchoolLayout";

import AuthenticatedRoute from "@/shared/guards/AuthenticatedRoute";
import GuestRoute from "@/shared/guards/GuestRoute";
import RoleRoute from "@/shared/guards/RoleRoute";
import PermissionRoute from "@/shared/guards/PermissionRoute";

import {
  ROLES,
  SCHOOL_ADMIN_ROLES,
} from "@/shared/auth/roles";

import {
  appRoutes,
} from "@/routes";

const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      <Route
        path="/no-access"
        element={<NoAccess />}
      />

      <Route
        path="/platform/login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        element={<GuestRoute />}
      >
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Route>

      <Route
        element={
          <AuthenticatedRoute loginPath="/login" />
        }
      >
        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.SUPER_ADMIN,
              ]}
            />
          }
        >
          <Route
            path="/platform"
            element={
              <PlatformLayout />
            }
          >
            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={
                <PlatformDashboard />
              }
            />

            <Route
              path="schools"
              element={
                <PlatformSchools />
              }
            />

            <Route
              path="schools/:schoolId"
              element={
                <PlatformSchoolDetails />
              }
            />
          </Route>
        </Route>

        <Route
          element={
            <RoleRoute
              allowedRoles={
                SCHOOL_ADMIN_ROLES
              }
            />
          }
        >
          <Route
            path="/school"
            element={
              <SchoolLayout />
            }
          >
            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={
                <SchoolDashboardPage />
              }
            />

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
                path="managers"
                element={
                  <SchoolManagers />
                }
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permissions={[
                    "school.students.read",
                  ]}
                />
              }
            >
              <Route
                path="students"
                element={
                  <SchoolStudents />
                }
              />

              <Route
                path="students/:studentId"
                element={
                  <SchoolStudentDetails />
                }
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permissions={[
                    "school.teachers.read",
                  ]}
                />
              }
            >
              <Route
                path="teachers"
                element={
                  <SchoolTeachers />
                }
              />

              <Route
                path="teachers/:teacherId"
                element={
                  <SchoolTeacherDetails />
                }
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permissions={[
                    "school.classes.read",
                  ]}
                />
              }
            >
              <Route
                path="classes"
                element={
                  <SchoolClasses />
                }
              />

              <Route
                path="classes/:classId"
                element={
                  <SchoolClassDetails />
                }
              />
            </Route>
          </Route>
        </Route>

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.TEACHER,
              ]}
            />
          }
        >
          <Route
            path="/teacher/dashboard"
            element={
              <TeacherDashboard />
            }
          />
        </Route>

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                ROLES.STUDENT,
              ]}
            />
          }
        >
          <Route
            path="/student/dashboard"
            element={
              <StudentDashboardPage />
            }
          />
        </Route>

        {appRoutes}
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRouter;
