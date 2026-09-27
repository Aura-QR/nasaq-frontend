import {
  CheckCircleRounded,
  ContentCopyRounded,
  LockResetRounded,
  VisibilityOffRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

const MIN_PASSWORD_LENGTH = 6;

const getSubmitErrorMessage = (response) => {
  if (response?.statusCode === 404) {
    return "الحساب غير موجود — حدّث الصفحة";
  }

  if (response?.statusCode === 400) {
    return (
      response?.message ||
      "تعذر تعيين كلمة المرور"
    );
  }

  if (!response?.statusCode) {
    return (
      response?.message ||
      "تعذر الاتصال بالخادم — حاول مرة أخرى"
    );
  }

  return (
    response?.message ||
    "تعذر تعيين كلمة المرور"
  );
};

const AdminSetPasswordDialog = ({
  open,
  name = "",
  subjectId = "",
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] =
    useState("generate");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [generatedPassword, setGeneratedPassword] =
    useState("");

  const [copyState, setCopyState] =
    useState("idle");

  useEffect(() => {
    if (!open) return;

    setMode("generate");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
    setError("");
    setSuccess(false);
    setGeneratedPassword("");
    setCopyState("idle");
  }, [open, subjectId]);

  const handleDialogClose = (
    _event,
    reason
  ) => {
    if (
      reason === "backdropClick" ||
      reason === "escapeKeyDown" ||
      success ||
      loading
    ) {
      return;
    }

    onClose?.();
  };

  const handleCancel = () => {
    if (!loading && !success) {
      onClose?.();
    }
  };

  const handleDone = () => {
    if (success) {
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    const manual =
      mode === "manual";

    if (
      manual &&
      password.length <
        MIN_PASSWORD_LENGTH
    ) {
      setError(
        "كلمة المرور يجب ألا تقل عن 6 أحرف"
      );
      return;
    }

    setLoading(true);
    setError("");

    const response =
      await onSubmit?.(
        manual
          ? { password }
          : {}
      );

    setLoading(false);

    if (
      !response ||
      response?.status === false
    ) {
      setError(
        getSubmitErrorMessage(
          response
        )
      );
      return;
    }

    setGeneratedPassword(
      typeof response?.data
        ?.password === "string"
        ? response.data.password
        : ""
    );

    if (manual) {
      setPassword("");
    }

    setCopyState("idle");
    setSuccess(true);
  };

  const handleCopy = async () => {
    if (!generatedPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedPassword
      );
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={
        handleDialogClose
      }
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border:
            "1px solid rgba(36,74,112,0.10)",
          boxShadow:
            "0 22px 55px rgba(18,47,77,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.4,
          py: 1.8,
          color: "#122f4d",
          fontSize: "15px",
          fontWeight: 900,
          borderBottom:
            "1px solid rgba(222,216,205,0.7)",
        }}
      >
        تعيين كلمة مرور — {name || "الحساب"}
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.4,
          py: "22px !important",
        }}
      >
        {success ? (
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <CheckCircleRounded
                sx={{
                  color: "#29734A",
                  fontSize: 26,
                }}
              />

              <Typography
                sx={{
                  color: "#122f4d",
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                تم تعيين كلمة المرور لـ {name || "الحساب"}
              </Typography>
            </Stack>

            {generatedPassword ? (
              <>
                <Box
                  sx={{
                    px: 1.7,
                    py: 1.35,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 1.2,
                    direction: "ltr",
                    borderRadius:
                      "14px",
                    color: "#102a43",
                    backgroundColor:
                      "#f7f9fb",
                    border:
                      "1px solid #cfd8e3",
                  }}
                >
                  <Typography
                    component="code"
                    sx={{
                      minWidth: 0,
                      overflowWrap:
                        "anywhere",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: {
                        xs: "19px",
                        sm: "23px",
                      },
                      fontWeight: 900,
                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    {generatedPassword}
                  </Typography>

                  <Button
                    type="button"
                    onClick={handleCopy}
                    startIcon={
                      <ContentCopyRounded />
                    }
                    sx={{
                      flexShrink: 0,
                      minHeight: 38,
                      color:
                        copyState ===
                        "success"
                          ? "#29734A"
                          : copyState ===
                              "error"
                            ? "#A44343"
                            : "#244a70",
                      backgroundColor:
                        copyState ===
                        "success"
                          ? "rgba(41,115,74,0.10)"
                          : copyState ===
                              "error"
                            ? "rgba(164,67,67,0.10)"
                            : "rgba(36,74,112,0.08)",
                      fontWeight: 800,
                    }}
                  >
                    {copyState ===
                    "success"
                      ? "تم النسخ"
                      : copyState ===
                          "error"
                        ? "تعذر النسخ"
                        : "نسخ"}
                  </Button>
                </Box>

                <Alert
                  severity="warning"
                  icon={
                    <WarningAmberRounded />
                  }
                  sx={{
                    borderRadius:
                      "12px",
                    fontWeight: 800,
                    alignItems:
                      "center",
                  }}
                >
                  اكتبها أو انسخها الآن — لن تظهر مرة أخرى.
                </Alert>
              </>
            ) : (
              <Alert
                severity="success"
                sx={{
                  borderRadius:
                    "12px",
                  fontWeight: 800,
                }}
              >
                تم حفظ كلمة المرور الجديدة بنجاح.
              </Alert>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                alignItems:
                  "center",
                gap: 1,
                color: "#244a70",
              }}
            >
              <LockResetRounded />

              <Typography
                sx={{
                  color: "#5f6973",
                  fontSize: "10.5px",
                  fontWeight: 700,
                }}
              >
                اختر طريقة تعيين كلمة المرور الجديدة.
              </Typography>
            </Box>

            <RadioGroup
              value={mode}
              onChange={(event) => {
                setMode(
                  event.target.value
                );
                setError("");
              }}
            >
              <FormControlLabel
                value="generate"
                control={<Radio />}
                label="توليد كلمة مرور تلقائية"
              />

              <FormControlLabel
                value="manual"
                control={<Radio />}
                label="كتابة كلمة مرور"
              />
            </RadioGroup>

            {mode === "manual" && (
              <TextField
                autoFocus
                fullWidth
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                label="كلمة المرور"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );
                  setError("");
                }}
                error={
                  password.length > 0 &&
                  password.length <
                    MIN_PASSWORD_LENGTH
                }
                helperText={
                  password.length > 0 &&
                  password.length <
                    MIN_PASSWORD_LENGTH
                    ? "الحد الأدنى 6 أحرف"
                    : "6 أحرف على الأقل"
                }
                inputProps={{
                  autoComplete:
                    "new-password",
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={
                          showPassword
                            ? "إخفاء كلمة المرور"
                            : "إظهار كلمة المرور"
                        }
                      >
                        <IconButton
                          type="button"
                          edge="end"
                          aria-label={
                            showPassword
                              ? "إخفاء كلمة المرور"
                              : "إظهار كلمة المرور"
                          }
                          onClick={() =>
                            setShowPassword(
                              (value) =>
                                !value
                            )
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius:
                    "12px",
                  fontWeight: 700,
                }}
              >
                {error}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.4,
          py: 1.7,
          gap: 0.8,
          borderTop:
            "1px solid rgba(222,216,205,0.7)",
        }}
      >
        {success ? (
          <Button
            type="button"
            variant="contained"
            onClick={handleDone}
            sx={{
              minWidth: 92,
              backgroundColor:
                "#244a70",
            }}
          >
            تم
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                color: "#5f6973",
              }}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              variant="contained"
              onClick={handleSubmit}
              disabled={
                loading ||
                (mode === "manual" &&
                  password.length <
                    MIN_PASSWORD_LENGTH)
              }
              startIcon={
                loading ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : undefined
              }
              sx={{
                minWidth: 92,
                backgroundColor:
                  "#244a70",
              }}
            >
              حفظ
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminSetPasswordDialog;
