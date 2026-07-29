import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const FinancialPageHeader = ({
  title,
  description,
  count,
  actions,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.25,
        px: { xs: 1.5, sm: 2, md: 2.4 },
        py: { xs: 1.4, md: 1.6 },
        border: "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        background:
          "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
        boxShadow: "0 10px 24px rgba(18,47,77,0.06)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Typography
              component="h1"
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: { xs: "21px", md: "25px" },
                fontWeight: 800,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>

            {count !== undefined && count !== null && (
              <Chip
                label={count}
                size="small"
                sx={{
                  height: 26,
                  color: "var(--color-gold-dark)",
                  backgroundColor: "var(--color-gold-soft)",
                  border: "1px solid rgba(211,164,79,0.24)",
                  fontSize: "10px",
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>

          {description && (
            <Typography
              sx={{
                mt: 0.45,
                color: "var(--color-muted)",
                fontSize: "11px",
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {actions && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems="center"
            gap={1.25}
            sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default FinancialPageHeader;
