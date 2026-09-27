import { Navigate } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";

const IsStudent = ({ children }) => {

    const user = useAuthUser()();
    const hasPermission = user?.user?.role === "STUDENT";
    
  if (hasPermission) {
    return children;
  }

  return <Navigate to="/no-access" replace />;
};

export default IsStudent;
