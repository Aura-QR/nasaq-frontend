import { PersonRemoveRounded } from "@mui/icons-material";
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
import { getStudentName } from "@/utils/school/studentData";

const ClassStudentRemoveDialog = ({ open, student, loading = false, onClose, onConfirm }) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    fullWidth
    maxWidth="xs"
    PaperProps={{ sx: { borderRadius: "18px", fontFamily: "Tajawal, Arial, sans-serif" } }}
  >
    <DialogTitle
      sx={{
        px: 2.4,
        py: 1.7,
        color: "#122f4d",
        borderBottom: "1px solid #ded8cd",
        fontSize: "15px",
        fontWeight: 800,
      }}
    >
      إزالة الطالب من الفصل
    </DialogTitle>

    <DialogContent sx={{ px: 2.4, py: "24px !important", textAlign: "center" }}>
      <Box
        sx={{
          width: 58,
          height: 58,
          mx: "auto",
          mb: 1.4,
          display: "grid",
          placeItems: "center",
          borderRadius: "16px",
          color: "#A44343",
          backgroundColor: "rgba(201,79,79,0.11)",
          "& svg": { fontSize: 29 },
        }}
      >
        <PersonRemoveRounded />
      </Box>

      <Typography sx={{ color: "#122f4d", fontSize: "13px", fontWeight: 800 }}>
        إزالة "{getStudentName(student)}"؟
      </Typography>
      <Typography sx={{ mt: 0.8, color: "#7e8791", fontSize: "9px", lineHeight: 1.8 }}>
        سيتم فك ارتباط الطالب بهذا الفصل دون حذف حساب الطالب.
      </Typography>
    </DialogContent>

    <DialogActions sx={{ px: 2.4, py: 1.5, gap: 0.8, borderTop: "1px solid #ded8cd" }}>
      <Button onClick={onClose} disabled={loading}>إلغاء</Button>
      <Button
        onClick={onConfirm}
        disabled={loading}
        sx={{ color: "#ffffff", backgroundColor: "#c94f4f", "&:hover": { backgroundColor: "#a93e3e" } }}
      >
        {loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : "تأكيد الإزالة"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ClassStudentRemoveDialog;
