import { Box, Button, Stack, Typography } from "@mui/material";

const FinancialEmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}) => {
  return (
    <Box
      sx={{
        minHeight: { xs: 250, md: 290 },
        px: 2,
        py: 3,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 64,
            height: 64,
            display: "grid",
            placeItems: "center",
            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",
            border: "1px solid rgba(211,164,79,0.22)",
            borderRadius: "18px",
            "& svg": { fontSize: 30 },
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            color: "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            maxWidth: 410,
            color: "var(--color-muted)",
            fontSize: "10px",
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>

        {actionLabel && onAction && (
          <Button
            type="button"
            onClick={onAction}
            variant="outlined"
            startIcon={actionIcon}
            sx={{
              mt: 0.5,
              minHeight: 42,
              px: 2,
              borderRadius: "12px",
              color: "var(--color-navy)",
              borderColor: "rgba(36,74,112,0.18)",
              fontWeight: 800,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                marginLeft: "6px",
                marginRight: 0,
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default FinancialEmptyState;
