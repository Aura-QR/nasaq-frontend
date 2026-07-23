import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuthUser,
  useIsAuthenticated,
} from "react-auth-kit";

import {
  getRoleHomePath,
} from "@/app/roleRedirects";

import {
  getStoredRole,
} from "@/shared/auth/session";

import {
  normalizeRole,
} from "@/shared/auth/roles";

const resolveAuthRole = (
  authState
) =>
  normalizeRole(
    authState?.user?.role ||
      authState?.role ||
      authState?.user?.user?.role ||
      getStoredRole()
  );

const GuestRoute = () => {
  const isAuthenticated =
    useIsAuthenticated();

  const getAuthUser =
    useAuthUser();

  if (!isAuthenticated()) {
    return <Outlet />;
  }

  const authState =
    getAuthUser();

  const role =
    resolveAuthRole(
      authState
    );

  if (!role) {
    return <Outlet />;
  }

  return (
    <Navigate
      to={
        getRoleHomePath(
          role
        )
      }
      replace
    />
  );
};

export default GuestRoute;
