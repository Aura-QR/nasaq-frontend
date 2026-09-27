import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  getStoredRole,
} from "@/shared/auth/session";

import {
  normalizeRole,
} from "@/shared/auth/roles";

const RoleRoute = ({
  allowedRoles = [],
  redirectTo = "/no-access",
}) => {
  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const role =
    normalizeRole(
      authState?.user?.role ||
        authState?.role ||
        getStoredRole()
    );

  const normalizedAllowedRoles =
    allowedRoles.map(
      normalizeRole
    );

  if (
    !normalizedAllowedRoles.includes(
      role
    )
  ) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
};

export default RoleRoute;
