import { Box, Button, Chip, CircularProgress, DialogTitle, IconButton, Paper, Stack, Typography } from "@mui/material";
import { CloseRounded, RestartAltRounded, SaveRounded } from "@mui/icons-material";

export const pageCardSx = {
  border: "1px solid rgba(36,74,112,.08)", borderRadius: "18px",
  backgroundColor: "var(--color-cream)", boxShadow: "0 12px 28px rgba(18,47,77,.06)"
};

export const formFieldsSx = {
  "& .MuiFormControl-root": { width: "100%", minWidth: 0, m: 0 },
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": { minHeight: 48, backgroundColor: "var(--color-white)", borderRadius: "12px" },
  "& .MuiInputLabel-root": { px: .65, backgroundColor: "var(--color-cream)", fontSize: "10.5px", fontWeight: 700 }
};

export const FinancialHeader = ({ title, description, count, actions }) => (
  <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, px: { xs: 1.5, md: 2.4 }, py: 1.55, background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.42))" }}>
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.5}>
      <Box minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={.8}>
          <Typography component="h1" sx={{ color: "var(--color-navy-deep)", fontSize: { xs: 21, md: 25 }, fontWeight: 800 }}>{title}</Typography>
          {count !== undefined && <Chip label={count} size="small" sx={{ height: 26, color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", fontSize: 10, fontWeight: 800 }} />}
        </Stack>
        <Typography sx={{ mt: .35, color: "var(--color-muted)", fontSize: 11 }}>{description}</Typography>
      </Box>
      {actions && <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ width: { xs: "100%", sm: "auto" } }}>{actions}</Stack>}
    </Stack>
  </Paper>
);

export const StatCard = ({ label, value, icon }) => (
  <Paper elevation={0} sx={{ ...pageCardSx, p: 1.3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
    <Box minWidth={0}><Typography sx={{ color: "var(--color-muted)", fontSize: 11, fontWeight: 700 }}>{label}</Typography><Typography sx={{ mt: .35, color: "var(--color-navy-deep)", fontSize: 19, fontWeight: 800, overflowWrap: "anywhere" }}>{value}</Typography></Box>
    <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", borderRadius: "12px", flexShrink: 0 }}>{icon}</Box>
  </Paper>
);

export const StatsGrid = ({ children }) => <Box sx={{ mb: 1.25, display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))" }, gap: 1 }}>{children}</Box>;

export const FilterCard = ({ title="البحث والتصفية", description, active=false, onReset, children, columns="1.35fr 1fr 1fr" }) => (
  <Paper elevation={0} sx={{ ...pageCardSx, ...formFieldsSx, mb: 1.25, px: { xs: 1.5, md: 1.9 }, py: 1.45 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} sx={{ mb: 1.3 }}>
      <Box><Typography sx={{ color: "var(--color-navy-deep)", fontSize: 15, fontWeight: 800 }}>{title}</Typography><Typography sx={{ mt: .2, color: "var(--color-muted)", fontSize: 9.5 }}>{description}</Typography></Box>
      <Button disabled={!active} onClick={onReset} startIcon={<RestartAltRounded />} sx={{ minHeight: 36, color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.055)", borderRadius: "11px", fontSize: 10, fontWeight: 800 }}>مسح الفلاتر</Button>
    </Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: columns }, gap: 1.5, "&>*": { minWidth: 0 } }}>{children}</Box>
  </Paper>
);

export const SectionCard = ({ title, description, children }) => (
  <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
    <Box sx={{ px: { xs: 1.5, md: 1.9 }, py: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}><Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>{title}</Typography><Typography sx={{ mt: .2, color: "var(--color-muted)", fontSize: 9.5 }}>{description}</Typography></Box>
    {children}
  </Paper>
);

export const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <Box sx={{ minHeight: 280, display: "grid", placeItems: "center", textAlign: "center", p: 3 }}>
    <Stack alignItems="center" spacing={1}><Box sx={{ width: 64, height: 64, display: "grid", placeItems: "center", color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", borderRadius: "18px" }}>{icon}</Box><Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>{title}</Typography><Typography sx={{ maxWidth: 410, color: "var(--color-muted)", fontSize: 10 }}>{description}</Typography>{actionLabel && <Button variant="outlined" onClick={onAction} sx={{ mt: .5, borderRadius: "12px", color: "var(--color-navy)", fontWeight: 800 }}>{actionLabel}</Button>}</Stack>
  </Box>
);

export const DialogHeader = ({ icon, title, description, loading, onClose }) => (
  <DialogTitle component="div" sx={{ p: 0 }}><Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, color: "white", background: "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-deep))" }}><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "var(--color-navy-deep)", bgcolor: "var(--color-gold-soft)", borderRadius: "12px" }}>{icon}</Box><Box><Typography sx={{ fontSize: 16, fontWeight: 800 }}>{title}</Typography><Typography sx={{ color: "rgba(255,255,255,.72)", fontSize: 9.5 }}>{description}</Typography></Box></Stack><IconButton disabled={loading} onClick={onClose} sx={{ color: "white", bgcolor: "rgba(255,255,255,.1)" }}><CloseRounded /></IconButton></Stack></DialogTitle>
);

export const FormActions = ({ loading, onCancel, label="حفظ", disabled=false }) => (
  <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1} sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(36,74,112,.08)" }}><Button type="submit" disabled={loading||disabled} variant="contained" startIcon={loading?<CircularProgress size={16} color="inherit"/>:<SaveRounded/>} sx={{ width: { xs: "100%", sm: 180 }, minHeight: 43, borderRadius: "12px", background: "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))", fontWeight: 800 }}>{loading?"جاري الحفظ...":label}</Button><Button type="button" disabled={loading} onClick={onCancel} variant="outlined" startIcon={<CloseRounded/>} sx={{ width: { xs: "100%", sm: 125 }, minHeight: 43, borderRadius: "12px", color: "var(--color-navy)", fontWeight: 800 }}>إلغاء</Button></Stack>
);
