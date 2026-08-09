import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

const safeJsonParse = (
  value,
  fallback = null
) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const resolveRole = (authState) => {
  const candidates = [
    authState?.user?.role,
    authState?.admin?.role,
    authState?.data?.user?.role,
    authState?.data?.admin?.role,
    authState?.role,
    localStorage.getItem("role"),
    safeJsonParse(
      localStorage.getItem("user")
    )?.role,
  ];

  return normalizeRole(
    candidates.find(Boolean)
  );
};

const OwnerOnlyRoute = () => {
  const getAuthUser = useAuthUser();
  const authState =
    getAuthUser?.() || {};

  const role =
    resolveRole(authState);

  if (role !== ROLES.OWNER) {
    return (
      <Navigate
        to="/school/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
};

export default OwnerOnlyRoute;
