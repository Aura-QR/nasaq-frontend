import { useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import { CloseRounded, EditNoteRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  applyCustomDiscountToTuition, applyDiscountToTuition, removeDiscountFromTuition, removeTuitionDiscountEntry,
} from "@/APIs/financials/discounts";

/*
 * خصومات الرسوم الدراسية.
 *
 * يمكن الجمع بين أكثر من خصم (الإخوة + الطلاب السابقون)، ويُطرح مجموعها من
 * الرسوم. الخصم من القائمة يُعرّف في «إدارة الخصومات» بنسبة أو مبلغ ثابت، و
 * «خصم خاص» يُكتب لطالب بعينه مع سببه.
 */

const money = (v) => `${Number(v || 0).toLocaleString("ar-SA")} ريال`;
const idOf = (v) => String(v?._id || v?.id || v || "");
const labelOf = (d) => (d?.type === "fixed" ? money(d?.amount) : `${Number(d?.percentage || 0)}%`);

/** الخصومات المطبقة، ومنها خصم قديم محفوظ في `discount` وحده. */
const entriesOf = (tuition) => {
  if (Array.isArray(tuition?.discounts) && tuition.discounts.length) return tuition.discounts;
  return tuition?.discount ? [{ ...tuition.discount, _legacy: true }] : [];
};

export default function TuitionDiscountsPanel({ tuition, discounts = [], loadingList, studentId, academicYearId, canEdit, onChanged }) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ type: "fixed", value: "", reason: "" });

  const entries = entriesOf(tuition);
  const total = Number(tuition?.discount?.discountAmount || 0);
  const gross = Number(tuition?.grossFee || tuition?.fee || 0);
  const applied = new Set(entries.map((e) => idOf(e.discountId)).filter(Boolean));
  const available = discounts.filter((d) => !applied.has(idOf(d)));
  const params = academicYearId ? { academicYearId } : undefined;

  const run = async (fn, okMessage) => {
    setBusy(true);
    const r = await fn();
    if (r?.status) {
      toast.success(r?.message || okMessage);
      await onChanged?.();
      setBusy(false);
      return true;
    }
    toast.error(r?.message || r || "حدث خطأ");
    setBusy(false);
    return false;
  };

  const apply = () =>
    run(() => applyDiscountToTuition(studentId, { discountId: selected, ...(params || {}) }), "تم تطبيق الخصم").then(
      (ok) => ok && setSelected(""),
    );

  const remove = (entry) =>
    entry._legacy || !entry._id
      ? run(() => removeDiscountFromTuition(studentId, params), "تم إزالة الخصم")
      : run(() => removeTuitionDiscountEntry(studentId, idOf(entry._id), params), "تم إزالة الخصم");

  const customValue = Number(custom.value) || 0;
  const customOff = custom.type === "fixed" ? Math.min(customValue, gross) : Math.round((gross * Math.min(customValue, 100)) / 100);
  const saveCustom = async () => {
    if (!(customValue > 0)) return toast.error("أدخل قيمة الخصم");
    if (custom.type === "percentage" && customValue > 100) return toast.error("نسبة الخصم لا يمكن أن تتجاوز 100%");
    if (!custom.reason.trim()) return toast.error("اكتب سبب الخصم");
    const ok = await run(
      () => applyCustomDiscountToTuition(studentId, { type: custom.type, value: customValue, reason: custom.reason.trim(), ...(params || {}) }),
      "تم تطبيق الخصم الخاص",
    );
    if (ok) {
      setCustomOpen(false);
      setCustom({ type: "fixed", value: "", reason: "" });
    }
  };

  return (
    <Paper elevation={0} sx={{ mt: 1.25, p: { xs: 1.5, md: 2 }, border: "1px solid rgba(36,74,112,.09)", borderRadius: "18px", bgcolor: "var(--color-cream)" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1.5}>
        <Box>
          <Typography sx={{ fontSize: "14px", fontWeight: 800, color: "var(--color-navy-deep)" }}>خصومات الرسوم الدراسية</Typography>
          <Typography sx={{ mt: 0.3, fontSize: "10px", color: "var(--color-muted)" }}>
            {entries.length
              ? `إجمالي الخصم: ${money(total)}${gross ? ` (${((total / gross) * 100).toFixed(2).replace(/\.00$/, "")}% من الرسوم)` : ""}`
              : "لا يوجد خصم مطبق حاليًا. يمكن الجمع بين أكثر من خصم."}
          </Typography>
        </Box>

        {canEdit && (
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>أضف خصمًا من القائمة</InputLabel>
              <Select value={selected} label="أضف خصمًا من القائمة" onChange={(e) => setSelected(e.target.value)} disabled={loadingList || busy}>
                {available.length === 0 && <MenuItem disabled value="">لا توجد خصومات أخرى متاحة</MenuItem>}
                {available.map((d) => (
                  <MenuItem key={idOf(d)} value={idOf(d)}>{d?.name} — {labelOf(d)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={apply} disabled={!selected || busy} sx={{ borderRadius: "10px", fontWeight: 800, fontSize: "10px" }}>
              تطبيق
            </Button>
            <Button variant="outlined" startIcon={<EditNoteRounded />} onClick={() => setCustomOpen(true)} disabled={busy} sx={{ borderRadius: "10px", fontWeight: 800, fontSize: "10px" }}>
              خصم خاص
            </Button>
          </Stack>
        )}
      </Stack>

      {entries.length > 0 && (
        <Stack gap={0.75} sx={{ mt: 1.25 }}>
          {entries.map((e, i) => (
            <Stack key={idOf(e._id) || i} direction="row" alignItems="center" justifyContent="space-between" gap={1}
              sx={{ p: 1, borderRadius: "12px", bgcolor: "white", border: "1px solid rgba(36,74,112,.08)" }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{e.name}</Typography>
                <Chip size="small" label={e.type === "fixed" ? `مبلغ ثابت ${money(e.amount)}` : `${Number(e.percentage || 0)}%`} />
                {e.custom && <Chip size="small" color="warning" variant="outlined" label="خاص" />}
                {e.reason && <Typography sx={{ fontSize: 11, color: "var(--color-muted)" }}>السبب: {e.reason}</Typography>}
              </Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "var(--color-navy-deep)" }}>− {money(e.discountAmount)}</Typography>
                {canEdit && (
                  <Tooltip title="إزالة هذا الخصم">
                    <span>
                      <IconButton size="small" color="error" onClick={() => remove(e)} disabled={busy}><CloseRounded fontSize="small" /></IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <Dialog open={customOpen} onClose={() => !busy && setCustomOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "18px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>خصم خاص لهذا الطالب</DialogTitle>
        <DialogContent>
          <ToggleButtonGroup exclusive size="small" value={custom.type} onChange={(_, v) => v && setCustom((c) => ({ ...c, type: v }))} sx={{ mb: 1.5, mt: 0.5 }}>
            <ToggleButton value="fixed" sx={{ fontWeight: 800 }}>مبلغ بالريال</ToggleButton>
            <ToggleButton value="percentage" sx={{ fontWeight: 800 }}>نسبة %</ToggleButton>
          </ToggleButtonGroup>
          <TextField fullWidth size="small" type="number" label={custom.type === "fixed" ? "المبلغ (ريال)" : "النسبة (%)"}
            value={custom.value} onChange={(e) => setCustom((c) => ({ ...c, value: e.target.value }))} sx={{ mb: 1.5 }} />
          <TextField fullWidth size="small" multiline minRows={2} label="سبب الخصم" required
            value={custom.reason} onChange={(e) => setCustom((c) => ({ ...c, reason: e.target.value }))} />
          {customValue > 0 && gross > 0 && (
            <Typography sx={{ mt: 1.25, fontSize: 12, color: "var(--color-muted)" }}>
              خصم {money(customOff)} ({((customOff / gross) * 100).toFixed(2).replace(/\.00$/, "")}% من الرسوم {money(gross)})
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCustomOpen(false)} disabled={busy}>إلغاء</Button>
          <Button variant="contained" onClick={saveCustom} disabled={busy} sx={{ fontWeight: 800 }}>تطبيق الخصم</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
