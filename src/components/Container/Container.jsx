import { Box, Stack } from "@mui/material";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { useState, useEffect } from "react";
import Footer from "../Footer/Footer";

const Container = ({children , noSidebar}) => {
  // Check if screen is small/medium on initial load
  const [active, setActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });

  // Update sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setActive(true); // Auto-open on large screens
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Stack direction={"row"} minHeight={"100vh"} >
      {!noSidebar && <Sidebar active={active} setActive={setActive} />}
      <Stack direction={"column"} flex={1} width={"100%"} justifyContent={"start"} position={"relative"} pb={20} > 
        <Navbar noSidebar={noSidebar} setActive={setActive} active={active} />
        <Box p={"16px 32px 16px 24px"}>{children}</Box>
        <Footer />
      </Stack>
    </Stack>
  );
};

export default Container;