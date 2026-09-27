import {
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";

import {
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";

import { Link } from "react-router-dom";

const StudentFormActions = ({
  loading,
  submitLabel = "حفظ الطالب",
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "sticky",
        bottom: 10,
        zIndex: 20,

        p: 1,

        border: "1px solid rgba(36, 74, 112, 0.09)",
        borderRadius: "15px",

        backgroundColor: "rgba(255, 252, 247, 0.94)",

        boxShadow: "0 12px 30px rgba(18, 47, 77, 0.11)",

        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems="center"
        justifyContent="flex-start"
        spacing={1}
      >
        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress
                size={17}
                thickness={5}
                sx={{ color: "inherit" }}
              />
            ) : (
              <SaveRounded />
            )
          }
          sx={{
            width: {
              xs: "100%",
              sm: 160,
            },
            minHeight: 42,

            borderRadius: "12px",

            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

            boxShadow: "0 8px 18px rgba(18, 47, 77, 0.16)",

            fontSize: "11.5px",
            fontWeight: 800,
            textTransform: "none",

            "& .MuiButton-startIcon": {
              marginLeft: "6px",
              marginRight: 0,
            },

            "&:hover": {
              background:
                "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
              transform: "translateY(-1px)",
              boxShadow: "0 11px 23px rgba(18, 47, 77, 0.21)",
            },
          }}
        >
          {loading ? "جاري الحفظ..." : submitLabel}
        </Button>

        <Button
          component={Link}
          to="/users/students"
          variant="outlined"
          startIcon={<CloseRounded />}
          sx={{
            width: {
              xs: "100%",
              sm: 120,
            },
            minHeight: 42,

            borderRadius: "12px",

            color: "var(--color-navy)",
            backgroundColor: "var(--color-white)",
            borderColor: "rgba(36, 74, 112, 0.16)",

            fontSize: "11.5px",
            fontWeight: 800,
            textTransform: "none",

            "& .MuiButton-startIcon": {
              marginLeft: "6px",
              marginRight: 0,
            },

            "&:hover": {
              color: "var(--color-gold-dark)",
              backgroundColor: "var(--color-gold-soft)",
              borderColor: "rgba(211, 164, 79, 0.34)",
            },
          }}
        >
          إلغاء
        </Button>
      </Stack>
    </Paper>
  );
};

export default StudentFormActions;
