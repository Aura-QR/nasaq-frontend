import {
  CloseRounded,
  PersonAddAltRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordPattern =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const ManagerFormDialog = ({
  open,
  loading = false,
  currentRole,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] =
    useState({
      username: "",
      email: "",
      password: "",
      role: ROLES.MANAGER,
    });

  const [errors, setErrors] =
    useState({});

  const canCreateSupervisor =
    normalizeRole(currentRole) ===
    ROLES.OWNER;

  useEffect(() => {
    if (!open) return;

    setForm({
      username: "",
      email: "",
      password: "",
      role: ROLES.MANAGER,
    });
    setErrors({});
  }, [open]);

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const handleSubmit = () => {
    const nextErrors = {};

    if (
      form.username.trim().length <
      3
    ) {
      nextErrors.username =
        "اسم المستخدم يجب ألا يقل عن 3 أحرف";
    }

    if (
      !emailPattern.test(
        form.email.trim()
      )
    ) {
      nextErrors.email =
        "أدخل بريدًا إلكترونيًا صحيحًا";
    }

    if (
      !passwordPattern.test(
        form.password
      )
    ) {
      nextErrors.password =
        "كلمة المرور 8 أحرف على الأقل وتحتوي على حرف ورقم";
    }

    if (
      form.role ===
        ROLES.SUPERVISOR &&
      !canCreateSupervisor
    ) {
      nextErrors.role =
        "إنشاء مدير مدرسة جديد متاح لمالك المدرسة فقط";
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors)
        .length
    ) {
      return;
    }

    onSubmit?.({
      username:
        form.username.trim(),
      email:
        form.email
          .trim()
          .toLowerCase(),
      password: form.password,
      role: form.role,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading ? undefined : onClose
      }
      fullWidth
      maxWidth="sm"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          fontFamily:
            "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.7,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          color: "#122f4d",
          borderBottom:
            "1px solid #ded8cd",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        إضافة حساب إداري

        <IconButton
          onClick={onClose}
          disabled={loading}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py: "22px !important",
        }}
      >
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2,minmax(0,1fr))",
              },
              gap: 1.5,
            }}
          >
            <TextField
              label="اسم المستخدم"
              value={form.username}
              onChange={(event) =>
                updateField(
                  "username",
                  event.target.value
                )
              }
              error={Boolean(
                errors.username
              )}
              helperText={
                errors.username
              }
              disabled={loading}
            />

            <TextField
              label="البريد الإلكتروني"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              error={Boolean(
                errors.email
              )}
              helperText={errors.email}
              disabled={loading}
              inputProps={{ dir: "ltr" }}
            />

            <TextField
              label="كلمة المرور"
              type="password"
              value={form.password}
              onChange={(event) =>
                updateField(
                  "password",
                  event.target.value
                )
              }
              error={Boolean(
                errors.password
              )}
              helperText={
                errors.password
              }
              disabled={loading}
            />

            <FormControl
              error={Boolean(
                errors.role
              )}
            >
              <InputLabel>
                الدور
              </InputLabel>
              <Select
                label="الدور"
                value={form.role}
                onChange={(event) =>
                  updateField(
                    "role",
                    event.target.value
                  )
                }
                disabled={loading}
              >
                <MenuItem
                  value={ROLES.MANAGER}
                >
                  مساعد إداري
                </MenuItem>
                {canCreateSupervisor && (
                  <MenuItem
                    value={
                      ROLES.SUPERVISOR
                    }
                  >
                    مدير المدرسة
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Typography
            sx={{
              p: 1.2,
              borderRadius: "12px",
              bgcolor: "#FFFCF7",
              border:
                "1px solid #DED8CD",
              color: "#5D6A76",
              fontSize: "10.5px",
              lineHeight: 1.8,
            }}
          >
            صلاحيات المساعد الإداري لا تُحدد لكل حساب على حدة؛ يتم ضبطها مرة واحدة لكل المدرسة من شاشة صلاحيات المساعدين.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          gap: 0.8,
          borderTop:
            "1px solid #ded8cd",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ color: "#7e8791" }}
        >
          إلغاء
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              <PersonAddAltRounded />
            )
          }
          sx={{
            color: "#ffffff",
            bgcolor: "#244a70",
            "&:hover": {
              bgcolor: "#1b3d61",
            },
          }}
        >
          إنشاء الحساب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManagerFormDialog;
