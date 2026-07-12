// images
import { useForm } from "react-hook-form";
import Input from "../../components/Input/Input";
import LoginIcon from "../../icons/Login.json"
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuthUser, useIsAuthenticated, useSignIn } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import logo from "@/images/logo.png"
import { loginRequest } from "@/APIs/auth/login";
import { toast } from "react-toastify";


const Login = () => {

    // is Logged in ?
    const isAuthenticated = useIsAuthenticated()
    const user = useAuthUser()()
    const navigate = useNavigate()
    
    useEffect(() => {
      if (isAuthenticated()) {
        const role = user?.user?.role || user?.role

        if (role === "ADMIN") {
          navigate("/users/students")
        } else if (role === "TEACHER") {
          navigate("/school/classes")
        } else {
          navigate("/student-dashboard")
        }
      }
    } , [isAuthenticated , navigate , user])
  
    const { register, handleSubmit, formState: { errors } } = useForm();
  
    // Signing in
    const [loading , setLoading] = useState(false)
  
    const signIn = useSignIn()
    
    const onSubmit = async (data) => {
      setLoading(true)
      const response = await loginRequest(data.email , data.password)
      console.log(response)
      if (response.status) {
        signIn({
          token : response.data.accessToken,
          expiresIn: 36000,
          tokenType : "Bearer",
          authState : {
            token : response.data.accessToken,
            user : response.data.user
          }
        })
        const permissions = response.data.permissions
        localStorage.setItem("permissions",JSON.stringify(permissions))
        toast.success("تم تسجيل الدخول بنجاح. مرحبا بك فى اورا")
        response.data.user.role === "ADMIN" ? navigate("/users/students") : (response.data.user.role === "TEACHER" ? navigate("/school/classes") : navigate("/student-dashboard"))
      } else {
        toast.error(response || "البيانات غير صحيحة يرجي المحاولة مره اخري")
      }       
      setLoading(false)
    }

    // Sign In On Enter
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleSubmit(onSubmit)()
      }
    };

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
      // eslint-disable-next-line
    }, []);
  
  return (
    <Stack width={"100%"} height={"100vh"} flexDirection={"row"} alignItems={"center"} justifyContent={"center"}>
    {/* Logo */}
    <Box position={"absolute"} left={20} top={20}> <img src={logo} alt="logo" width={80} /> </Box>
    {/* Form */}
    <Box flex={1} height={"100%"} bgcolor={"white"} display={"flex"} flexDirection={"column"} alignItems={"center"} justifyContent={"center"}>
      <form>
        {/* Title */}
        <Typography variant="h2" textAlign={"center"} color={"primary.main"}> 
          مرحبا بك فى
        </Typography>
        <Typography variant="h2" textAlign={"center"} color={"text.secondary"} mb={20}> 
          لوحة تحكم اورا
        </Typography>
        {/* Form */}
        <Stack width={{ xs : "300px" , sm : "360px" }} spacing={12} >
          <Input label={"البريد الالكتروني"} required={true} type={"email"} error={errors?.email?.message} register={register} registerName={"email"} />
          <Input label={"كلمة المرور"} required={true} error={errors?.password?.message} type={"password"} register={register} registerName={"password"} />
        </Stack>
        {/* Button */}
        <Button disabled={loading} variant="contained" sx={{p : "15px 0" , borderRadius : "8px" , width : "100%" , my : 20 , height : "58px"}} onClick={handleSubmit(onSubmit)} >
          {loading ?
          <CircularProgress /> : <Typography variant="button" color={"primary.white"} >تسجيل الدخول</Typography>}
        </Button>
      </form>
    </Box>
    {/* Image */}
    <Box flex={1} height={"100%"} bgcolor={"primary.icons"} display={{xs : "none" , md : "flex"}} alignItems={"center"} justifyContent={"center"}>
      <Lottie animationData={LoginIcon} loop={true} />
    </Box>
  </Stack>
  )
}

export default Login
