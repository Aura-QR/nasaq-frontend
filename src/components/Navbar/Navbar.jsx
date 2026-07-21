import { Box } from "@mui/material";

import afaqLogo from "../../images/afaq-logo.png";

const Navbar = () => {
  return (
    <Box
      component="nav"
      dir="rtl"
      sx={{
        position: "relative",
        zIndex: 20,

        width: "100%",
        minHeight: {
          xs: 76,
          md: 88,
        },

        px: {
          xs: 2,
          sm: 3,
          md: 5,
        },

        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",

        backgroundColor: "rgba(255, 252, 247, 0.92)",

        borderBottom:
          "1px solid rgba(36, 74, 112, 0.08)",

        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",

        boxShadow:
          "0 8px 30px rgba(36, 74, 112, 0.06)",
      }}
    >
      <Box
        component="img"
        src={afaqLogo}
        alt="شعار منصة آفاق"
        sx={{
          display: "block",

          width: {
            xs: 118,
            sm: 135,
            md: 150,
          },

          height: {
            xs: 52,
            sm: 58,
            md: 64,
          },

          objectFit: "contain",
          objectPosition: "right center",

          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
};

export default Navbar;