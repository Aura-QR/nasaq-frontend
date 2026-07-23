import {
  DashboardRounded,
} from "@mui/icons-material";

import {
  Box,
  Typography,
} from "@mui/material";

const SchoolDashboardPage =
  () => {
    return (
      <Box
        dir="rtl"
        sx={{
          minHeight:
            "calc(100vh - 40px)",

          display: "grid",

          placeItems:
            "center",

          p: 3,

          backgroundColor:
            "#f0ede6",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,

            p: {
              xs: 3,
              md: 5,
            },

            textAlign:
              "center",

            borderRadius:
              "22px",

            backgroundColor:
              "#fff",

            border:
              "1px solid #ded8cd",
          }}
        >
          <DashboardRounded
            sx={{
              color:
                "#d3a44f",

              fontSize: 48,
            }}
          />

          <Typography
            sx={{
              mt: 1.5,

              color:
                "#122f4d",

              fontSize: "24px",

              fontWeight:
                800,
            }}
          >
            لوحة المدرسة
          </Typography>

          <Typography
            sx={{
              mt: 1,

              color:
                "#7e8791",

              fontSize: "12px",

              lineHeight: 1.8,
            }}
          >
            دي صفحة تأسيس مؤقتة.
            الخطوة التالية هنبدأ
            Managers & Permissions
            حسب آخر Postman.
          </Typography>
        </Box>
      </Box>
    );
  };

export default SchoolDashboardPage;
