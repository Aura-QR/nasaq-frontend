import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  getStoredPermissions,
  hasAllPermissions,
  hasAnyPermission,
} from "@/shared/auth/permissions";

const PermissionRoute = ({
  permissions = [],
  requireAll = false,
  redirectTo = "/no-access",
}) => {
  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const currentPermissions =
    authState?.permissions ||
    authState?.user
      ?.permissions ||
    getStoredPermissions();

  const allowed =
    requireAll
      ? hasAllPermissions(
          currentPermissions,
          permissions
        )
      : hasAnyPermission(
          currentPermissions,
          permissions
        );

  if (!allowed) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
};

export default PermissionRoute;
