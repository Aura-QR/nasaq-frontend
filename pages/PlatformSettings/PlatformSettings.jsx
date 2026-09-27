import {
  SettingsRounded,
} from "@mui/icons-material";

import {
  Box,
  Typography,
} from "@mui/material";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const PlatformSettings = () => {
  return (
    <Box
      sx={{
        maxWidth: 720,

        p: {
          xs: 2.5,
          md: 3,
        },

        display: "flex",
        alignItems: "center",
        gap: 1.6,

        borderRadius: "18px",

        backgroundColor:
          authColors.white,

        border: `1px solid ${authColors.border}`,

        boxShadow:
          "0 10px 26px rgba(36,74,112,0.05)",
      }}
    >
      <Box
        sx={{
          width: 50,
          height: 50,

          flexShrink: 0,

          display: "grid",
          placeItems: "center",

          borderRadius: "15px",

          color:
            authColors.navy,

          backgroundColor:
            "rgba(36,74,112,0.08)",

          "& svg": {
            fontSize: 25,
          },
        }}
      >
        <SettingsRounded />
      </Box>

      <Box>
        <Typography
          sx={{
            color:
              authColors.navyDeep,

            fontSize: "17px",
            fontWeight: 800,
          }}
        >
          إعدادات المنصة
        </Typography>

        <Typography
          sx={{
            mt: 0.5,

            color:
              authColors.muted,

            fontSize: "10px",
            lineHeight: 1.7,
          }}
        >
          هذه الصفحة غير مفعّلة حاليًا لعدم توفر Endpoints خاصة بإعدادات المنصة.
        </Typography>
      </Box>
    </Box>
  );
};

export default PlatformSettings;
