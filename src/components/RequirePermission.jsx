import {
  Navigate,
  useLocation,
} from "react-router-dom";

import usePermissions from "@/utils/hooks/usePermissions";

const RequirePermission = ({
  module,
  operation,
  children,
}) => {
  const location = useLocation();

  const allowed = usePermissions(
    module,
    operation
  );

  if (!allowed) {
    return (
      <Navigate
        to="/no-access"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default RequirePermission;
