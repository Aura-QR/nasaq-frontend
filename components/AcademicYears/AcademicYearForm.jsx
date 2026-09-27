import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarMonthRounded,
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(36,74,112,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(36,74,112,0.28)" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--color-gold)",
      borderWidth: 1,
    },
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Tajawal, Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
  },
  "& input": {
    fontFamily: "Tajawal, Arial, sans-serif",
    fontSize: "12px",
  },
};

const AcademicYearForm = ({
  register,
  errors,
  loading = false,
  mode = "add",
  onCancel,
}) => (
  <Stack spacing={1.25}>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.4, md: 1.8 },
        border: "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        backgroundColor: "var(--color-cream)",
        boxShadow: "0 12px 28px rgba(18,47,77,0.055)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          pb: 1.25,
          mb: 1.5,
          borderBottom: "1px solid rgba(36,74,112,0.07)",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",
            borderRadius: "12px",
          }}
        >
          <CalendarMonthRounded />
        </Box>

        <Box>
          <Typography
            sx={{
              color: "var(--color-navy-deep)",
              fontSize: "16px",
              fontWeight: 800,
            }}
          >
            بيانات السنة الدراسية
          </Typography>
          <Typography
            sx={{ mt: 0.15, color: "var(--color-muted)", fontSize: "9.5px" }}
          >
            حدّد اسم السنة وتاريخ البداية والنهاية.
          </Typography>
        </Box>
      </Stack>

      {mode === "add" && (
        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "12px", fontSize: "10px" }}>
          إنشاء سنة جديدة يجعلها السنة النشطة ويؤرشف السنة النشطة الحالية تلقائيًا.
        </Alert>
      )}

      <Grid container spacing={{ xs: 1.25, md: 1.6 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="اسم السنة الدراسية"
            placeholder="مثال: 2027/2028"
            error={Boolean(errors?.name)}
            helperText={errors?.name?.message}
            {...register("name", {
              required: "اسم السنة الدراسية مطلوب",
              minLength: { value: 4, message: "اكتب اسمًا واضحًا للسنة" },
            })}
            sx={fieldSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="تاريخ البداية"
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors?.startDate)}
            helperText={errors?.startDate?.message}
            {...register("startDate", { required: "تاريخ البداية مطلوب" })}
            sx={fieldSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="تاريخ النهاية"
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors?.endDate)}
            helperText={errors?.endDate?.message}
            {...register("endDate", { required: "تاريخ النهاية مطلوب" })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>
    </Paper>

    <Paper
      elevation={0}
      sx={{
        px: { xs: 1.25, md: 1.5 },
        py: 1.15,
        border: "1px solid rgba(36,74,112,0.08)",
        borderRadius: "16px",
        backgroundColor: "var(--color-cream)",
      }}
    >
      <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />
          }
          sx={{
            minHeight: 44,
            px: 2.5,
            borderRadius: "12px",
            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          {loading
            ? "جاري الحفظ..."
            : mode === "edit"
            ? "حفظ التعديلات"
            : "إنشاء السنة"}
        </Button>

        <Button
          type="button"
          variant="outlined"
          disabled={loading}
          onClick={onCancel}
          startIcon={<CloseRounded />}
          sx={{
            minHeight: 44,
            px: 2.2,
            borderRadius: "12px",
            color: "var(--color-navy)",
            borderColor: "rgba(36,74,112,0.18)",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          إلغاء
        </Button>
      </Stack>
    </Paper>
  </Stack>
);

export default AcademicYearForm;
