import {
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const PHONE_PATTERN =
  /^\+?[0-9\s-]{8,20}$/;

const SchoolEditDialog = ({
  open,
  schoolName = "",
  schoolPhone = "",
  loading = false,
  onClose,
  onSave,
}) => {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [errors, setErrors] =
    useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      String(
        schoolName || ""
      )
    );

    setPhone(
      String(
        schoolPhone === "—"
          ? ""
          : schoolPhone || ""
      )
    );

    setErrors({});
  }, [
    open,
    schoolName,
    schoolPhone,
  ]);

  const validate = () => {
    const nextErrors = {};

    const normalizedName =
      name.trim();

    const normalizedPhone =
      phone.trim();

    if (
      normalizedName.length < 3
    ) {
      nextErrors.name =
        "اسم المدرسة يجب ألا يقل عن 3 أحرف";
    }

    if (!normalizedPhone) {
      nextErrors.phone =
        "رقم الجوال مطلوب";
    } else if (
      !PHONE_PATTERN.test(
        normalizedPhone
      )
    ) {
      nextErrors.phone =
        "أدخل رقم جوال صحيحًا";
    }

    setErrors(nextErrors);

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave?.({
      name: name.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
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

          display: "flex",
          alignItems:
            "center",

          justifyContent:
            "space-between",

          color:
            authColors.navyDeep,

          borderBottom: `1px solid ${authColors.border}`,

          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        تعديل بيانات المدرسة

        <IconButton
          onClick={onClose}
          disabled={loading}
          aria-label="إغلاق"
          sx={{
            color:
              authColors.muted,
          }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py:
            "22px !important",
        }}
      >
        <Stack spacing={2}>
          <TextField
            fullWidth
            autoFocus
            label="اسم المدرسة"
            value={name}
            onChange={(
              event
            ) => {
              setName(
                event.target.value
              );

              if (
                errors.name
              ) {
                setErrors(
                  (
                    previous
                  ) => ({
                    ...previous,
                    name: "",
                  })
                );
              }
            }}
            disabled={loading}
            error={
              Boolean(
                errors.name
              )
            }
            helperText={
              errors.name
            }
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  minHeight: 52,

                  borderRadius:
                    "12px",

                  backgroundColor:
                    authColors.cream,

                  fontSize:
                    "12px",
                },
            }}
          />

          <TextField
            fullWidth
            label="رقم الجوال"
            value={phone}
            onChange={(
              event
            ) => {
              setPhone(
                event.target.value
              );

              if (
                errors.phone
              ) {
                setErrors(
                  (
                    previous
                  ) => ({
                    ...previous,
                    phone: "",
                  })
                );
              }
            }}
            disabled={loading}
            error={
              Boolean(
                errors.phone
              )
            }
            helperText={
              errors.phone ||
              "يمكن كتابة الرقم بصيغة محلية أو دولية"
            }
            inputProps={{
              inputMode:
                "tel",
            }}
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  minHeight: 52,

                  borderRadius:
                    "12px",

                  backgroundColor:
                    authColors.cream,

                  fontSize:
                    "12px",

                  direction:
                    "ltr",
                },
            }}
          />

          <Typography
            sx={{
              color:
                authColors.muted,

              fontSize:
                "9px",

              lineHeight: 1.7,
            }}
          >
            سيتم تحديث اسم المدرسة ورقم الجوال فقط.
          </Typography>
        </Stack>
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
            handleSave
          }
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress
                size={15}
                sx={{
                  color:
                    "inherit",
                }}
              />
            ) : (
              <SaveRounded />
            )
          }
          sx={{
            minHeight: 40,
            px: 2,

            borderRadius:
              "10px",

            color:
              authColors.white,

            backgroundColor:
              authColors.navy,

            fontSize:
              "10px",

            fontWeight: 800,

            textTransform:
              "none",

            "& .MuiButton-startIcon":
              {
                ml: 0.65,
                mr: 0,
              },

            "&:hover": {
              backgroundColor:
                authColors.navyDark,
            },
          }}
        >
          حفظ التعديل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolEditDialog;
