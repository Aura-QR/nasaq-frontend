import { Button, Stack } from "@mui/material"
import { useAuthUser, useIsAuthenticated, useSignOut } from "react-auth-kit"
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const NoAccess = () => {
  const user = useAuthUser()();
  const isauth = useIsAuthenticated()()
  const signOut = useSignOut()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut();
    const cookieOptions = { domain: window.location.hostname };
    Cookies.remove("_auth", cookieOptions);
    Cookies.remove("_auth_state", cookieOptions);
    Cookies.remove("_auth_storage", cookieOptions);
    Cookies.remove("_auth_type", cookieOptions);
    localStorage.removeItem("permissions");
    navigate("/");
  };

  console.log(user.user.role , isauth)
  return (
    <Stack justifyContent="center" alignItems="center" height="100vh" fontSize={24} fontWeight="bold" color="error.main">
        لا تملك صلاحية الوصول إلى هذه الصفحة
        <Button href="/" variant="outlined" color="success" sx={{ mt: 3, py: 8 , px: 16 }}>العودة إلى الصفحة الرئيسية</Button>
        <Button onClick={handleSignOut} variant="contained" color="error" sx={{ mt: 2, py: 8 , px: 16 }}>تسجيل الخروج</Button>
    </Stack>
  )
}

export default NoAccess