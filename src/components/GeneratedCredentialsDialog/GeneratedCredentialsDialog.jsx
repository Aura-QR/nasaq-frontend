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
  ContentCopyRounded,
  KeyRounded,
  PersonRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

const copyText = async (value) => {
  const text = String(value || "");

  if (!text) {
    throw new Error("EMPTY_VALUE");
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    await navigator.clipboard.writeText(
      text
    );

    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute(
    "readonly",
    ""
  );

  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(
    textarea
  );

  textarea.select();
  textarea.setSelectionRange(
    0,
    textarea.value.length
  );

  const copied =
    document.execCommand("copy");

  document.body.removeChild(
    textarea
  );

  if (!copied) {
    throw new Error("COPY_FAILED");
  }
};

const CredentialRow = ({
  icon,
  label,
  value,
  onCopy,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.4,
      display: "flex",
      alignItems: "center",
      gap: 1.1,

      border:
        "1px solid rgba(36,74,112,.09)",
      borderRadius: "14px",
      backgroundColor:
        "rgba(255,255,255,.94)",
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,

        color:
          "var(--color-gold-dark)",
        backgroundColor:
          "var(--color-gold-soft)",

        borderRadius: "11px",

        "& svg": {
          fontSize: 20,
        },
      }}
    >
      {icon}
    </Box>

    <Box
      sx={{
        flex: 1,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color:
            "var(--color-muted)",
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
          width: "fit-content",
          maxWidth: "100%",

          color:
            "var(--color-navy-deep)",
          fontSize: {
            xs: "13px",
            sm: "14px",
          },
          fontWeight: 800,
          overflowWrap: "anywhere",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>

    <IconButton
      type="button"
      aria-label={`نسخ ${label}`}
      onClick={onCopy}
      disabled={!value}
      sx={{
        color:
          "var(--color-navy)",
        backgroundColor:
          "rgba(36,74,112,.055)",
        borderRadius: "10px",

        "&:hover": {
          color:
            "var(--color-gold-dark)",
          backgroundColor:
            "var(--color-gold-soft)",
        },
      }}
    >
      <ContentCopyRounded
        sx={{ fontSize: 18 }}
      />
    </IconButton>
  </Paper>
);

const GeneratedCredentialsDialog = ({
  open,
  accountLabel = "الحساب",
  username = "",
  usernameLabel = "اسم المستخدم",
  password = "",
  profileLabel = "فتح الملف",
  onOpenProfile,
  onBackToList,
}) => {
  const handleCopy = async (
    value,
    successMessage
  ) => {
    try {
      await copyText(value);
      toast.success(successMessage);
    } catch {
      toast.error(
        "تعذر النسخ تلقائيًا"
      );
    }
  };

  const handleCopyAll = () =>
    handleCopy(
      `${usernameLabel}: ${username}\nكلمة المرور: ${password}`,
      "تم نسخ بيانات الدخول"
    );

  return (
    <Dialog
      open={Boolean(open)}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown
      onClose={(
        _event,
        reason
      ) => {
        /*
         * لا نغلق الـDialog بالضغط خارجها أو Escape
         * حتى لا تضيع كلمة المرور قبل نسخها.
         */
        if (
          reason ===
            "backdropClick" ||
          reason ===
            "escapeKeyDown"
        ) {
          return;
        }
      }}
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: "20px",
          backgroundColor:
            "var(--color-cream)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          borderBottom:
            "1px solid rgba(36,74,112,.07)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.1}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",

              color: "#18864b",
              backgroundColor:
                "rgba(40,167,69,.10)",
              borderRadius: "13px",

              "& svg": {
                fontSize: 23,
              },
            }}
          >
            <CheckCircleRounded />
          </Box>

          <Box>
           
      
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: "16px !important",
        }}
      >
        <Stack spacing={1.2}>
          <CredentialRow
            icon={<PersonRounded />}
            label={usernameLabel}
            value={username}
            onCopy={() =>
              handleCopy(
                username,
                "تم نسخ اسم المستخدم"
              )
            }
          />

          <CredentialRow
            icon={<KeyRounded />}
            label="كلمة المرور"
            value={password}
            onCopy={() =>
              handleCopy(
                password,
                "تم نسخ كلمة المرور"
              )
            }
          />

          <Box
            sx={{
              px: 1.2,
              py: 1,
              color:
                "var(--color-muted)",
              backgroundColor:
                "rgba(211,164,79,.08)",
              border:
                "1px solid rgba(211,164,79,.16)",
              borderRadius: "12px",
              fontSize: "10px",
              lineHeight: 1.7,
            }}
          >
            كلمة المرور المؤقتة
            تظهر هنا بعد إنشاء الحساب.
            انسخها الآن وشاركها مع
            صاحب الحساب بطريقة آمنة.
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 1.5,
          pt: 0,
          gap: 0.8,
          flexWrap: "wrap",
        }}
      >
        <Button
          type="button"
          onClick={onBackToList}
          sx={{
            minHeight: 40,
            borderRadius: "11px",
            fontWeight: 800,
          }}
        >
          العودة للقائمة
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={
            <ContentCopyRounded />
          }
          onClick={handleCopyAll}
          disabled={
            !username ||
            !password
          }
          sx={{
            minHeight: 40,
            borderRadius: "11px",
            fontWeight: 800,

            "& .MuiButton-startIcon":
              {
                marginLeft: "6px",
                marginRight: 0,
              },
          }}
        >
          نسخ الكل
        </Button>

        <Button
          type="button"
          variant="contained"
          onClick={onOpenProfile}
          sx={{
            minHeight: 40,
            borderRadius: "11px",
            fontWeight: 800,
            background:
              "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
          }}
        >
          {profileLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeneratedCredentialsDialog;
