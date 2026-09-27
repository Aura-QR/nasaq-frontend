import { Box, Paper, Typography } from "@mui/material";

const FinancialStatCard = ({ label, value, icon, helper }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.3,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        border: "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        backgroundColor: "var(--color-cream)",
        boxShadow: "0 10px 24px rgba(18,47,77,0.055)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 17px 32px rgba(18,47,77,0.10)",
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "var(--color-muted)",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>

        <Typography
          title={String(value)}
          sx={{
            mt: 0.4,
            color: "var(--color-navy-deep)",
            fontSize: "20px",
            fontWeight: 800,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </Typography>

        {helper && (
          <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "8.5px" }}>
            {helper}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "var(--color-gold-dark)",
          backgroundColor: "var(--color-gold-soft)",
          border: "1px solid rgba(211,164,79,0.22)",
          borderRadius: "12px",
          "& svg": { fontSize: 21 },
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

export default FinancialStatCard;
