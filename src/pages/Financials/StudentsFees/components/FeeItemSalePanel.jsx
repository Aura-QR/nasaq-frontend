import { useEffect, useState } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel,
  InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography,
} from "@mui/material";
import { CheckroomRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import { fetchFeeItems, sellFeeItem } from "@/APIs/financials/feeItems";

/*
 * بيع بند بالقطعة للطالب (الزي المدرسي ١٥٠ ريال × العدد).
 * يُضاف المبلغ إلى «الرسوم الإضافية المستحقة» ويُسدَّد منها، أو يُسجَّل
 * مسددًا مباشرة. السعر يُثبَّت يوم البيع.
 */
const money = (v) => `${Number(v || 0).toLocaleString("ar-SA")} ريال`;
const today = () => new Date().toISOString().slice(0, 10);

export default function FeeItemSalePanel({ studentId, academicYearId, canEdit, onChanged }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ itemId: "", quantity: 1, paid: false, paidAt: today(), notes: "" });

  useEffect(() => {
    if (!canEdit) return;
    fetchFeeItems().then((r) => setItems(Array.isArray(r?.data) ? r.data.filter((i) => i.isActive) : []));
  }, [canEdit]);

  if (!canEdit || items.length === 0) return null;

  const item = items.find((i) => String(i._id) === form.itemId);
  const quantity = Math.max(1, Math.floor(Number(form.quantity) || 1));
  const total = item ? item.unitPrice * quantity : 0;

  const submit = async () => {
    if (!item) return toast.error("اختر البند");
    setBusy(true);
    const r = await sellFeeItem(item._id, studentId, {
      quantity,
      ...(form.paid ? { paidAt: form.paidAt } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    });
    if (r?.status) {
      toast.success(r?.message || "تم تسجيل البيع");
      setOpen(false);
      setForm({ itemId: "", quantity: 1, paid: false, paidAt: today(), notes: "" });
      await onChanged?.();
    } else toast.error(r?.message || r || "تعذر تسجيل البيع");
    setBusy(false);
  };

  return (
    <Paper elevation={0} sx={{ mt: 1.25, p: { xs: 1.5, md: 2 }, border: "1px solid rgba(36,74,112,.09)", borderRadius: "18px", bgcolor: "var(--color-cream)" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
        <Box>
          <Typography sx={{ fontSize: "14px", fontWeight: 800, color: "var(--color-navy-deep)" }}>بيع بنود بالقطعة</Typography>
          <Typography sx={{ mt: 0.3, fontSize: "10px", color: "var(--color-muted)" }}>
            {items.map((i) => `${i.name} ${money(i.unitPrice)}`).join(" · ")}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<CheckroomRounded />} onClick={() => setOpen(true)} sx={{ borderRadius: "10px", fontWeight: 800, fontSize: "10px" }}>
          بيع بند
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "18px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>بيع بند للطالب</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 0.75, mb: 1.5 }}>
            <InputLabel>البند</InputLabel>
            <Select label="البند" value={form.itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}>
              {items.map((i) => (
                <MenuItem key={i._id} value={String(i._id)}>{i.name} — {money(i.unitPrice)} للقطعة</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth size="small" type="number" label="العدد" inputProps={{ min: 1, max: 100, step: 1 }}
            value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} sx={{ mb: 1.5 }} />
          {item && (
            <Box sx={{ p: 1.25, mb: 1.5, borderRadius: "12px", bgcolor: "var(--color-gold-soft)" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {quantity} × {money(item.unitPrice)} = {money(total)}
              </Typography>
            </Box>
          )}
          <FormControlLabel control={<Checkbox checked={form.paid} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))} />}
            label="تم السداد الآن" />
          {form.paid && (
            <TextField fullWidth size="small" type="date" label="تاريخ السداد" InputLabelProps={{ shrink: true }}
              value={form.paidAt} onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))} sx={{ mt: 1 }} />
          )}
          <TextField fullWidth size="small" label="ملاحظات (اختياري)" value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} sx={{ mt: 1.5 }} />
          {!form.paid && (
            <Typography sx={{ mt: 1, fontSize: 11, color: "var(--color-muted)" }}>
              يُضاف المبلغ إلى الرسوم الإضافية المستحقة، ويُسدَّد منها لاحقًا.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>إلغاء</Button>
          <Button variant="contained" onClick={submit} disabled={busy || !item} sx={{ fontWeight: 800 }}>
            {form.paid ? "تسجيل البيع والسداد" : "إضافة إلى المستحقات"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
