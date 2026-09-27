import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuthUser,
  useIsAuthenticated,
} from "react-auth-kit";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const getStoredRole = () =>
  normalizeRole(
    localStorage.getItem("role")
  );

const SuperAdminRoute = () => {
  const location = useLocation();

  const isAuthenticated =
    useIsAuthenticated();

  const getAuthUser =
    useAuthUser();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/platform/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  const authState =
    getAuthUser();

  const role = normalizeRole(
    authState?.user?.role ||
      authState?.role ||
      authState?.roleName ||
      getStoredRole()
  );

  if (role !== "SUPER_ADMIN") {
    return (
      <Navigate
        to="/no-access"
        replace
      />
    );
  }

  return <Outlet />;
};

export default SuperAdminRoute;
