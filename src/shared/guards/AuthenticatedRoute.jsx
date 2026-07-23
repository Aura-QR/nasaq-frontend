import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useIsAuthenticated,
} from "react-auth-kit";

const AuthenticatedRoute = ({
  loginPath = "/login",
}) => {
  const location =
    useLocation();

  const isAuthenticated =
    useIsAuthenticated();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
};

export default AuthenticatedRoute;
