import {
  CheckCircleRounded,
  PauseCircleRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const SchoolStatusDialog = ({
  open,
  schoolName = "",
  action = "suspend",
  loading = false,
  onClose,
  onConfirm,
}) => {
  const activating =
    action === "activate";

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius:
            "18px",

          overflow:
            "hidden",

          fontFamily:
            "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.8,

          color:
            authColors.navyDeep,

          borderBottom: `1px solid ${authColors.border}`,

          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {activating
          ? "تفعيل المدرسة"
          : "إيقاف المدرسة"}
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py:
            "24px !important",

          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,

            mx: "auto",
            mb: 1.5,

            display: "grid",
            placeItems:
              "center",

            borderRadius:
              "16px",

            color: activating
              ? "#29734A"
              : authColors.danger,

            backgroundColor:
              activating
                ? "rgba(116,201,154,0.16)"
                : "rgba(201,79,79,0.11)",

            "& svg": {
              fontSize: 29,
            },
          }}
        >
          {activating ? (
            <CheckCircleRounded />
          ) : (
            <PauseCircleRounded />
          )}
        </Box>

        <Typography
          sx={{
            color:
              authColors.navyDeep,

            fontSize: "15px",
            fontWeight: 800,
          }}
        >
          {activating
            ? `تفعيل مدرسة "${schoolName}"؟`
            : `إيقاف مدرسة "${schoolName}"؟`}
        </Typography>

        <Typography
          sx={{
            mt: 1,

            color:
              authColors.muted,

            fontSize: "10px",

            lineHeight: 1.8,
          }}
        >
          {activating
            ? "سيتمكن مستخدمو المدرسة من تسجيل الدخول واستخدام النظام مرة أخرى."
            : "لن يتمكن مستخدمو المدرسة من تسجيل الدخول أو استخدام خدمات النظام حتى إعادة التفعيل."}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.6,

          gap: 0.8,

          borderTop: `1px solid ${authColors.border}`,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 40,
            px: 1.8,

            borderRadius:
              "10px",

            color:
              authColors.muted,

            backgroundColor:
              "rgba(126,135,145,0.08)",

            fontSize:
              "10px",

            fontWeight: 800,

            textTransform:
              "none",
          }}
        >
          إلغاء
        </Button>

        <Button
          onClick={
            onConfirm
          }
          disabled={loading}
          sx={{
            minHeight: 40,
            px: 2,

            borderRadius:
              "10px",

            color:
              authColors.white,

            backgroundColor:
              activating
                ? "#29734A"
                : authColors.danger,

            fontSize:
              "10px",

            fontWeight: 800,

            textTransform:
              "none",

            "&:hover": {
              backgroundColor:
                activating
                  ? "#1F5E3C"
                  : "#A93E3E",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={16}
              sx={{
                color:
                  "inherit",
              }}
            />
          ) : activating ? (
            "تأكيد التفعيل"
          ) : (
            "تأكيد الإيقاف"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolStatusDialog;
