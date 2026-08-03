import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const GradeLevelDeleteDialog = ({
  open,
  gradeLevel,
  loading = false,
  onClose,
  onConfirm,
}) => (
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
        color:
          "#122f4d",

        borderBottom:
          "1px solid #ded8cd",

        fontSize:
          "15px",

        fontWeight: 800,
      }}
    >
      حذف الصف الدراسي
    </DialogTitle>

    <DialogContent
      sx={{
        pt:
          "22px !important",
      }}
    >
      <Typography
        sx={{
          color:
            "#193754",

          fontSize:
            "11px",

          lineHeight: 1.9,
        }}
      >
        هل تريد حذف الصف «{gradeLevel?.name || "هذا الصف"}»؟ قد يرفض الخادم الحذف إذا كان الصف مرتبطًا بفصول أو طلاب.
      </Typography>
    </DialogContent>

    <DialogActions
      sx={{
        px: 2.4,
        py: 1.4,

        gap: 0.7,

        borderTop:
          "1px solid #ded8cd",
      }}
    >
      <Button
        type="button"
        onClick={onClose}
        disabled={loading}
        variant="outlined"
        sx={{
          borderRadius:
            "10px",
        }}
      >
        إلغاء
      </Button>

      <Button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        variant="contained"
        color="error"
        sx={{
          minWidth: 92,

          borderRadius:
            "10px",
        }}
      >
        {loading ? (
          <CircularProgress
            size={16}
            color="inherit"
          />
        ) : (
          "حذف"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

export default GradeLevelDeleteDialog;
