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
  isSessionExpiring,
} from "@/shared/api/client";

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

  /*
   * A session that is on its way out is not a session to redirect away from.
   *
   * react-auth-kit answers from its own in-memory copy, which survives the
   * cookie being cleared. Without this check it reported the user as signed in
   * while the interceptor was sending them to /login, so this guard bounced
   * them back to the dashboard, which reissued the failing requests — the
   * flicker was that round trip repeating.
   */
  if (
    isSessionExpiring() ||
    !isAuthenticated()
  ) {
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
