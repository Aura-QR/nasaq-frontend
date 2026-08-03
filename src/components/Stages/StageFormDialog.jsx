import {
  AccountTreeRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
} from "react";

import {
  useForm,
} from "react-hook-form";

const FIELD_SX = {
  "& .MuiOutlinedInput-root":
    {
      minHeight: 46,

      borderRadius:
        "12px",

      backgroundColor:
        "#fffcf7",

      "& fieldset": {
        borderColor:
          "rgba(36,74,112,0.15)",
      },

      "&:hover fieldset": {
        borderColor:
          "rgba(36,74,112,0.28)",
      },

      "&.Mui-focused fieldset":
        {
          borderColor:
            "#d3a44f",

          borderWidth: 1,
        },
    },

  "& .MuiInputLabel-root":
    {
      fontFamily:
        "Tajawal, Arial, sans-serif",

      fontSize:
        "11px",

      fontWeight: 700,
    },

  "& input": {
    fontFamily:
      "Tajawal, Arial, sans-serif",

    fontSize:
      "11px",
  },
};

const StageFormDialog = ({
  open,
  stage = null,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
    reset,
  } = useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name:
        stage?.name ||
        "",

      order:
        stage?.order ||
        "",
    });
  }, [
    open,
    stage,
    reset,
  ]);

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
          pb: 1.25,

          borderBottom:
            "1px solid #ded8cd",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems:
              "center",
            gap: 0.9,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,

              display:
                "grid",

              placeItems:
                "center",

              color:
                "#b78430",

              backgroundColor:
                "#fbf0d8",

              borderRadius:
                "11px",
            }}
          >
            <AccountTreeRounded
              sx={{
                fontSize: 20,
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color:
                  "#122f4d",

                fontSize:
                  "15px",

                fontWeight: 800,
              }}
            >
              {stage
                ? "تعديل المرحلة"
                : "إضافة مرحلة دراسية"}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,

                color:
                  "#7e8791",

                fontSize:
                  "8.5px",
              }}
            >
              أدخل اسم المرحلة وترتيب ظهورها.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          pt:
            "22px !important",
        }}
      >
        <Box
          component="form"
          id="stage-form"
          noValidate
          onSubmit={
            handleSubmit(
              onSubmit
            )
          }
          sx={{
            display:
              "grid",

            gap: 1.25,
          }}
        >
          <TextField
            fullWidth
            label="اسم المرحلة"
            placeholder="مثال: المرحلة الابتدائية"
            error={
              Boolean(
                errors?.name
              )
            }
            helperText={
              errors?.name
                ?.message
            }
            {...register(
              "name",
              {
                required:
                  "اسم المرحلة مطلوب",

                minLength: {
                  value: 2,
                  message:
                    "اسم المرحلة قصير جدًا",
                },
              }
            )}
            sx={FIELD_SX}
          />

          <TextField
            fullWidth
            type="number"
            label="ترتيب العرض"
            placeholder="1"
            inputProps={{
              min: 1,
              step: 1,
            }}
            error={
              Boolean(
                errors?.order
              )
            }
            helperText={
              errors?.order
                ?.message
            }
            {...register(
              "order",
              {
                required:
                  "ترتيب العرض مطلوب",

                valueAsNumber:
                  true,

                min: {
                  value: 1,
                  message:
                    "الترتيب يبدأ من 1",
                },

                validate:
                  (value) =>
                    Number.isInteger(
                      value
                    ) ||
                    "الترتيب يجب أن يكون رقمًا صحيحًا",
              }
            )}
            sx={FIELD_SX}
          />
        </Box>
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
            minHeight: 40,

            borderRadius:
              "10px",

            color:
              "#244a70",

            borderColor:
              "rgba(36,74,112,0.18)",

            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          type="submit"
          form="stage-form"
          disabled={loading}
          variant="contained"
          sx={{
            minHeight: 40,

            px: 2.2,

            borderRadius:
              "10px",

            backgroundColor:
              "#244a70",

            boxShadow:
              "none",

            fontWeight: 800,

            "&:hover": {
              backgroundColor:
                "#1b3d61",

              boxShadow:
                "none",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : stage ? (
            "حفظ التعديلات"
          ) : (
            "إضافة المرحلة"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StageFormDialog;
