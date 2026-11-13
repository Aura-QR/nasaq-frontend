import { Box } from "@mui/material";

// التقدير colors: one hue family, darkest for the best band, so a printed
// page still reads in grayscale. «غير مجتاز» is the only warm color.
export const RATING_STYLES = {
  excellent: { bg: "#1f4e4a", fg: "#ffffff" },
  very_good: { bg: "#2f6f8f", fg: "#ffffff" },
  good: { bg: "#4f9a7e", fg: "#ffffff" },
  acceptable: { bg: "#e9dcb4", fg: "#5a4a12" },
  failed: { bg: "#f3d6d3", fg: "#8a2a20" },
};

export default function RatingChip({ rating, size = "md" }) {
  if (!rating?.key) return <Box component="span" sx={{ color: "text.disabled" }}>—</Box>;
  const s = RATING_STYLES[rating.key] || RATING_STYLES.acceptable;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        minWidth: size === "sm" ? 58 : 76,
        px: 1.2,
        py: size === "sm" ? 0.2 : 0.45,
        borderRadius: "8px",
        bgcolor: s.bg,
        color: s.fg,
        fontWeight: 700,
        fontSize: size === "sm" ? 12 : 13,
        textAlign: "center",
        whiteSpace: "nowrap",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {rating.label}
    </Box>
  );
}
