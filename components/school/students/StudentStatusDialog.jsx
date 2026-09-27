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
  getStudentName,
  isStudentActive,
} from "@/utils/school/studentData";

const StudentStatusDialog = ({
  open,
  student,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const active =
    isStudentActive(
      student
    );

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
          fontFamily:
            "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.4,
          py: 1.7,
          color: "#122f4d",
          borderBottom:
            "1px solid #ded8cd",
          fontSize: "15px",
          fontWeight: 800,
        }}
      >
        {active
          ? "إيقاف الطالب"
          : "تفعيل الطالب"}
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.4,
          py:
            "24px !important",
          textAlign:
            "center",
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            mx: "auto",
            mb: 1.4,
            display: "grid",
            placeItems:
              "center",
            borderRadius:
              "16px",
            color: active
              ? "#c94f4f"
              : "#29734A",
            backgroundColor:
              active
                ? "rgba(201,79,79,0.11)"
                : "rgba(116,201,154,0.16)",
            "& svg": {
              fontSize: 29,
            },
          }}
        >
          {active ? (
            <PauseCircleRounded />
          ) : (
            <CheckCircleRounded />
          )}
        </Box>

        <Typography
          sx={{
            color:
              "#122f4d",
            fontSize:
              "13px",
            fontWeight:
              800,
          }}
        >
          {active
            ? `إيقاف "${getStudentName(
                student
              )}"؟`
            : `تفعيل "${getStudentName(
                student
              )}"؟`}
        </Typography>

        <Typography
          sx={{
            mt: 0.8,
            color:
              "#7e8791",
            fontSize:
              "9px",
            lineHeight: 1.8,
          }}
        >
          {active
            ? "لن يتمكن الطالب من تسجيل الدخول حتى إعادة تفعيل الحساب."
            : "سيتمكن الطالب من تسجيل الدخول واستخدام حسابه مرة أخرى."}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.4,
          py: 1.5,
          gap: 0.8,
          borderTop:
            "1px solid #ded8cd",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
        >
          إلغاء
        </Button>

        <Button
          onClick={
            onConfirm
          }
          disabled={loading}
          sx={{
            color:
              "#ffffff",
            backgroundColor:
              active
                ? "#c94f4f"
                : "#29734A",
            "&:hover": {
              backgroundColor:
                active
                  ? "#a93e3e"
                  : "#1f5e3c",
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
          ) : active ? (
            "تأكيد الإيقاف"
          ) : (
            "تأكيد التفعيل"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentStatusDialog;
