import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { IconButton, Stack, Typography } from '@mui/material';
import "./Navbar.scss"
import { Person } from '@mui/icons-material';
import logoImg from "@/images/logo.png";
import { useAuthUser } from 'react-auth-kit';



const Navbar = ({active , setActive , noSidebar}) => {
  const authState = useAuthUser()?.();
  const currentUser = authState?.user;

  const roleLabelMap = {
    ADMIN: "مدير النظام",
    TEACHER: "معلم",
    STUDENT: "طالب",
  };

  const displayName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    currentUser?.email?.split("@")[0] ||
    "مستخدم";

  const displayRole = roleLabelMap[currentUser?.role] || "مستخدم النظام";
  
  return (
    <div className='Navbar'>
      <Stack direction={{xs: "row-reverse", sm: "row"}} alignItems={"center"} justifyContent={"space-between"} height={"100%"} px={{xs : 4 , sm : 16}} py={9} spacing={{xs : 4 , md : 12}} >

        {/* Toggle Sidebar */}
        {noSidebar ? <Stack maxWidth={60} mx={"auto"}>
            <img src={logoImg} alt="logo" width={"100%"} />
          </Stack> : <IconButton color='primary' 
        sx={{borderRadius : "8px"}}
        onClick={() => setActive(!active)} 
        >
          <MenuOpenIcon sx={{
            transition : ".5s",
            rotate : active ? "180deg" : "0deg",
          }} />
        </IconButton>}

        {/* Profile */}
        <Stack direction={"row"} spacing={4} alignItems={"center"}>
          <Stack width={{xs : "40px" , sm : "60px"}} height={{xs : "40px" , sm : "60px"}} borderRadius={"50%"} bgcolor={"primary.background"} alignItems={"center"} justifyContent={"center"} color={"primary.main"} fontSize={{xs : "20px" , sm :"24px"}} fontWeight={500}>
            <Person fontSize='30' color='primary' />
          </Stack>
          <Stack display={{xs : "none" , sm : "flex"}} >
            <Typography variant='subtitle'>{displayName}</Typography>
            <Typography variant='body' color={"text.secondary"}> {displayRole} </Typography>
          </Stack>
        </Stack>

      </Stack>  
    </div>
  )
}

export default Navbar
