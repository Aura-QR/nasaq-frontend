import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CheckCircleRounded,
  CloseRounded,
  ContentCopyRounded,
  KeyRounded,
  PersonRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

const copyText = async (value, successMessage) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("تعذر النسخ تلقائيًا، انسخ البيانات يدويًا");
  }
};

const CredentialRow = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      border: "1px solid rgba(36,74,112,0.10)",
      borderRadius: "14px",
      backgroundColor: "var(--color-white)",
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      gap={1}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 38,
            height: 38,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",
            borderRadius: "11px",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "var(--color-muted)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            {label}
          </Typography>

          <Typography
            dir="ltr"
            sx={{
              mt: 0.25,
              color: "var(--color-navy-deep)",
              fontSize: "13px",
              fontWeight: 800,
              wordBreak: "break-all",
              textAlign: "left",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>

      <Button
        type="button"
        variant="outlined"
        startIcon={<ContentCopyRounded />}
        onClick={() => copyText(value, `تم نسخ ${label}`)}
        sx={{
          minWidth: 90,
          borderRadius: "10px",
          color: "var(--color-navy)",
          borderColor: "rgba(36,74,112,0.18)",
          fontWeight: 800,
          textTransform: "none",
        }}
      >
        نسخ
      </Button>
    </Stack>
  </Paper>
);

const CredentialsDialog = ({
  open,
  title = "تم إنشاء الحساب بنجاح",
  email = "",
  password = "",
  onDone,
}) => {
  const copyAll = () =>
    copyText(
      `اسم المستخدم: ${email}\nكلمة المرور: ${password}`,
      "تم نسخ بيانات الدخول كاملة"
    );

  return (
    <Dialog
      open={open}
      onClose={onDone}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: "20px",
          backgroundColor: "var(--color-cream)",
        },
      }}
    >
      <DialogTitle component="div" sx={{ p: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{
            px: 2,
            py: 1.5,
            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-deep))",
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <CheckCircleRounded />
            <Typography sx={{ fontSize: "16px", fontWeight: 800 }}>
              {title}
            </Typography>
          </Stack>

          <IconButton
            type="button"
            onClick={onDone}
            sx={{ color: "inherit" }}
          >
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Typography
          sx={{
            mb: 1.5,
            color: "var(--color-muted)",
            fontSize: "11px",
            lineHeight: 1.7,
          }}
        >
          انسخ بيانات الدخول وسلمها لصاحب الحساب. كلمة المرور تظهر هنا بعد الإنشاء لتسهيل تسليمها.
        </Typography>

        <Stack spacing={1}>
          <CredentialRow
            label="اسم المستخدم"
            value={email}
            icon={<PersonRounded />}
          />
          <CredentialRow
            label="كلمة المرور"
            value={password}
            icon={<KeyRounded />}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Button
          type="button"
          variant="outlined"
          startIcon={<ContentCopyRounded />}
          onClick={copyAll}
          sx={{
            borderRadius: "11px",
            color: "var(--color-navy)",
            borderColor: "rgba(36,74,112,0.18)",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          نسخ بيانات الدخول كاملة
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={onDone}
          sx={{
            borderRadius: "11px",
            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          تم
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CredentialsDialog;
