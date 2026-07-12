import { Navigate } from "react-router-dom";
import usePermissions from "@/utils/hooks/usePermissions";

const RequirePermission = ({ module, operation, children }) => {
  const hasPermission = usePermissions(module, operation);

  // null = permissions missing entirely (e.g. token expired, stale session)
  if (hasPermission === null) {
    return <Navigate to="/" replace />;
  }

  if (hasPermission) {
    return children;
  }

  return <Navigate to="/no-access" replace />;
};

export default RequirePermission;
