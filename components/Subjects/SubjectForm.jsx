import {
  Box,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import {
  BadgeOutlined,
  MenuBookRounded,
  SchoolRounded,
} from "@mui/icons-material";

import { Controller } from "react-hook-form";

import Input from "@/components/Input/Input";

const sectionSx = {
  p: {
    xs: 1.25,
    md: 1.5,
  },

  border: "1px solid rgba(36, 74, 112, 0.08)",
  borderRadius: "16px",

  backgroundColor: "var(--color-cream)",
  boxShadow: "0 8px 20px rgba(18, 47, 77, 0.045)",

  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

  "&:hover": {
    transform: "translateY(-1px)",
    borderColor: "rgba(211, 164, 79, 0.18)",
    boxShadow: "0 12px 25px rgba(18, 47, 77, 0.07)",
  },

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 44,
    height: 44,

    backgroundColor: "var(--color-white)",
    borderRadius: "12px",

    transition:
      "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
  },

  "& .MuiInputBase-root:hover, & .MuiOutlinedInput-root:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 5px 13px rgba(18, 47, 77, 0.055)",
  },

  "& .MuiInputBase-input": {
    py: 0.7,
    fontSize: "12px",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.13)",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.24)",
  },

  "& .MuiOutlinedInput-root.Mui-focused": {
    transform: "translateY(-1px)",
    boxShadow: "0 0 0 3px rgba(211, 164, 79, 0.10)",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px",
    borderColor: "var(--color-gold)",
  },

  "& .MuiInputLabel-root": {
    color: "var(--color-muted)",
    fontSize: "10.5px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--color-gold-dark)",
  },

  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",

    "&, & *": {
      animation: "none !important",
      transition: "none !important",
      transform: "none !important",
    },
  },
};

const SubjectForm = ({
  register,
  control,
  errors,
}) => {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.9}
        sx={{ mb: 1.1 }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,

            display: "grid",
            placeItems: "center",
            flexShrink: 0,

            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",

            border: "1px solid rgba(211, 164, 79, 0.21)",
            borderRadius: "10px",

            "& svg": {
              fontSize: 18,
            },
          }}
        >
          <MenuBookRounded />
        </Box>

        <Box>
          <Typography
            component="h2"
            sx={{
              color: "var(--color-navy-deep)",
              fontSize: "14px",
              fontWeight: 800,
              lineHeight: 1.25,
            }}
          >
            بيانات المادة
          </Typography>

          <Typography
            sx={{
              mt: 0.12,
              color: "var(--color-muted)",
              fontSize: "9px",
              lineHeight: 1.45,
            }}
          >
            أدخل بيانات المادة وحدد هل تؤثر على نجاح الطالب وترحيله.
          </Typography>
        </Box>
      </Stack>

      <Grid
        container
        spacing={{
          xs: 1,
          md: 1.15,
        }}
        alignItems="stretch"
        sx={{
          "& > .MuiGrid-item": {
            minHeight: 72,
            display: "flex",
            alignItems: "flex-end",
          },

          "& > .MuiGrid-item > *": {
            width: "100%",
          },
        }}
      >
        <Grid item xs={12} md={7}>
          <Input
            register={register}
            registerName="subjectName"
            error={errors.subjectName?.message}
            label="اسم المادة"
            required
            type="text"
            placeholder="مثال: الرياضيات"
          />
        </Grid>

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              width: "100%",
              position: "relative",
            }}
          >
            <Input
              register={register}
              registerName="subjectCode"
              error={errors.subjectCode?.message}
              label="كود المادة"
              type="text"
              placeholder="مثال: MATH-01"
            />

            <BadgeOutlined
              sx={{
                position: "absolute",
                left: 12,
                bottom: 11,
                zIndex: 2,

                color: "rgba(36, 74, 112, 0.34)",
                fontSize: 19,

                pointerEvents: "none",
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              width: "100%",
              minHeight: 64,
              px: 1.25,
              py: 0.9,

              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,

              border: "1px solid rgba(36, 74, 112, 0.09)",
              borderRadius: "13px",
              backgroundColor: "var(--color-white)",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: "var(--color-navy)",
                  backgroundColor: "rgba(36, 74, 112, 0.07)",
                  borderRadius: "10px",
                  "& svg": { fontSize: 18 },
                }}
              >
                <SchoolRounded />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "11.5px",
                    fontWeight: 800,
                  }}
                >
                  مادة أساسية للنجاح والترحيل
                </Typography>
                <Typography
                  sx={{
                    mt: 0.15,
                    color: "var(--color-muted)",
                    fontSize: "9px",
                    lineHeight: 1.55,
                  }}
                >
                  عند إيقاف الاختيار تصبح المادة اختيارية ولا يمنع الرسوب فيها ترحيل الطالب.
                </Typography>
              </Box>
            </Stack>

            <Controller
              name="isRequiredForPromotion"
              control={control}
              defaultValue
              render={({ field }) => (
                <FormControlLabel
                  sx={{ m: 0, flexShrink: 0 }}
                  control={
                    <Switch
                      checked={field.value !== false}
                      onChange={(_, checked) => field.onChange(checked)}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      color="warning"
                    />
                  }
                  label={field.value !== false ? "أساسية" : "اختيارية"}
                  labelPlacement="start"
                  slotProps={{
                    typography: {
                      sx: {
                        color: field.value !== false
                          ? "var(--color-gold-dark)"
                          : "var(--color-muted)",
                        fontSize: "10px",
                        fontWeight: 800,
                      },
                    },
                  }}
                />
              )}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SubjectForm;
