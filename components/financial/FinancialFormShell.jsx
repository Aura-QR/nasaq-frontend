import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";
import Back from "@/components/Back/Back";

const FinancialFormShell = ({
  backTitle,
  helperText,
  sectionIcon,
  sectionTitle,
  sectionDescription,
  children,
  loading,
  submitLabel = "حفظ",
  onCancel,
}) => {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 1.25, md: 1.6 },
          py: 1.05,
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "16px",
          backgroundColor: "rgba(255,252,247,0.9)",
          boxShadow: "0 8px 20px rgba(18,47,77,0.04)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={1}
        >
          <Back title={backTitle} />
          <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
            {helperText}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          p: { xs: 1.5, md: 2 },
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          backgroundColor: "var(--color-cream)",
          boxShadow: "0 12px 28px rgba(18,47,77,0.06)",
          "& .MuiFormControl-root": {
            width: "100%",
            margin: 0,
          },
          "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
            minHeight: 48,
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
          },
          "& .MuiInputLabel-root": {
            px: 0.65,
            backgroundColor: "var(--color-cream)",
            fontSize: "10.5px",
            fontWeight: 700,
          },
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
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              color: "var(--color-gold-dark)",
              backgroundColor: "var(--color-gold-soft)",
              borderRadius: "12px",
            }}
          >
            {sectionIcon}
          </Box>

          <Box>
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              {sectionTitle}
            </Typography>
            <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "10px" }}>
              {sectionDescription}
            </Typography>
          </Box>
        </Stack>

        {children}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          px: { xs: 1.25, md: 1.6 },
          py: 1.15,
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "16px",
          backgroundColor: "var(--color-cream)",
          boxShadow: "0 10px 24px rgba(18,47,77,0.05)",
        }}
      >
        <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />
            }
            sx={{
              width: { xs: "100%", sm: 180 },
              minHeight: 44,
              borderRadius: "12px",
              color: "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            {loading ? "جاري الحفظ..." : submitLabel}
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={onCancel}
            variant="outlined"
            startIcon={<CloseRounded />}
            sx={{
              width: { xs: "100%", sm: 145 },
              minHeight: 44,
              borderRadius: "12px",
              color: "var(--color-navy)",
              borderColor: "rgba(36,74,112,0.18)",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            إلغاء
          </Button>
        </Stack>
      </Paper>
    </>
  );
};

export default FinancialFormShell;
