import {
  DeleteOutlineRounded,
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

const SchoolConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel =
    "تأكيد",
  loading = false,
  danger = false,
  onClose,
  onConfirm,
}) => {
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

          color:
            "#122f4d",

          borderBottom:
            "1px solid #ded8cd",

          fontSize:
            "15px",

          fontWeight:
            800,
        }}
      >
        {title}
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
            width: 56,
            height: 56,

            mx: "auto",
            mb: 1.3,

            display: "grid",
            placeItems:
              "center",

            borderRadius:
              "16px",

            color: danger
              ? "#c94f4f"
              : "#244a70",

            backgroundColor:
              danger
                ? "rgba(201,79,79,0.11)"
                : "rgba(36,74,112,0.08)",

            "& svg": {
              fontSize: 29,
            },
          }}
        >
          <DeleteOutlineRounded />
        </Box>

        <Typography
          sx={{
            color:
              "#193754",

            fontSize:
              "10px",

            lineHeight: 1.8,
          }}
        >
          {message}
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
              danger
                ? "#c94f4f"
                : "#244a70",

            "&:hover": {
              backgroundColor:
                danger
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
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolConfirmDialog;
