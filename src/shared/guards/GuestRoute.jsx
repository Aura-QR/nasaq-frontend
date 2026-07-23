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
    authState?.user?.role ||
    authState?.role ||
    getStoredRole();

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
