import {
  Box,
  Typography,
} from "@mui/material";

const StudentDashboardPage =
  () => {
    return (
      <Box
        dir="rtl"
        sx={{
          minHeight:
            "100vh",

          display: "grid",
          placeItems:
            "center",

          p: 3,

          backgroundColor:
            "#f0ede6",
        }}
      >
        <Typography
          sx={{
            color:
              "#122f4d",

            fontSize: "24px",

            fontWeight: 800,
          }}
        >
          لوحة الطالب
        </Typography>
      </Box>
    );
  };

export default StudentDashboardPage;
