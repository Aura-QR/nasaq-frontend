import {
  AdminPanelSettingsRounded,
  PersonRemoveRounded,
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
  getTeacherName,
  isTeacherManager,
} from "@/utils/school/teacherData";

const TeacherManagerRoleDialog = ({
  open,
  teacher,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const manager =
    isTeacherManager(
      teacher
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
        {manager
          ? "إلغاء دور المدير"
          : "ترقية المعلم إلى مدير"}
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
            color: manager
              ? "#A44343"
              : "#244a70",
            backgroundColor:
              manager
                ? "rgba(201,79,79,0.11)"
                : "#fbf0d8",
            "& svg": {
              fontSize: 29,
            },
          }}
        >
          {manager ? (
            <PersonRemoveRounded />
          ) : (
            <AdminPanelSettingsRounded />
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
          {manager
            ? `إلغاء دور المدير عن "${getTeacherName(
                teacher
              )}"؟`
            : `ترقية "${getTeacherName(
                teacher
              )}" إلى مدير؟`}
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
          {manager
            ? "سيعود الحساب إلى دور المعلم، مع الاحتفاظ ببيانات المعلم الأكاديمية."
            : "سيتم منح الحساب دور المدير، ويمكن ضبط صلاحياته لاحقًا من صفحة المديرين والمشرفين."}
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
              manager
                ? "#c94f4f"
                : "#244a70",
            "&:hover": {
              backgroundColor:
                manager
                  ? "#a93e3e"
                  : "#1b3d61",
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
          ) : manager ? (
            "تأكيد إلغاء الدور"
          ) : (
            "تأكيد الترقية"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherManagerRoleDialog;
