import { useEffect, useState } from "react";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import { AddCircleOutlineRounded, CheckroomRounded, DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import { EmptyState, FinancialHeader, SectionCard } from "@/components/financial/FinancialShell";
import { addFeeItem, deleteFeeItem, editFeeItem, fetchFeeItems } from "@/APIs/financials/feeItems";
import usePermissions from "@/utils/hooks/usePermissions";

/*
 * بنود تُباع بالقطعة: الزي المدرسي ١٥٠ ريال، فاثنان ٣٠٠ وأربعة ٦٠٠.
 * تغيير السعر يسري على المبيعات الجديدة فقط؛ ما بيع قبله يبقى بسعره.
 * البيع للطالب من صفحة مصروفاته ← «بيع بند».
 */
const money = (v) => `${Number(v || 0).toLocaleString("ar-SA")} ريال`;
const EMPTY = { name: "", unitPrice: "", description: "" };

export default function FeeItemsListPage() {
  const permissions = usePermissions("financial");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // { id?, name, unitPrice, description }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await fetchFeeItems();
    setItems(Array.isArray(r?.data) ? r.data : []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const price = Number(dialog.unitPrice);
    if (!dialog.name.trim()) return toast.error("اكتب اسم البند");
    if (!(price >= 0) || dialog.unitPrice === "") return toast.error("أدخل سعر القطعة");
    setBusy(true);
    const body = { name: dialog.name.trim(), unitPrice: price, description: dialog.description.trim() };
    const r = dialog.id ? await editFeeItem(dialog.id, body) : await addFeeItem(body);
    setBusy(false);
    if (!r?.status) return toast.error(r?.message || r || "تعذر الحفظ");
    toast.success(r?.message || "تم الحفظ");
    setDialog(null);
    load();
  };

  const toggle = async (item) => {
    const r = await editFeeItem(item._id, { isActive: !item.isActive });
    if (r?.status) load();
    else toast.error(r?.message || r || "تعذر التعديل");
  };

  const remove = async (item) => {
    if (!window.confirm(`حذف «${item.name}»؟`)) return;
    const r = await deleteFeeItem(item._id);
    if (r?.status) {
      toast.success(r?.message || "تم الحذف");
      load();
    } else toast.error(r?.message || r || "تعذر الحذف");
  };

  const action = permissions?.add ? (
    <Button variant="contained" startIcon={<AddCircleOutlineRounded />} onClick={() => setDialog({ ...EMPTY })}
      sx={{ minHeight: 42, borderRadius: "12px", background: "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))", fontWeight: 800 }}>
      إضافة بند
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <FinancialHeader title="البنود بالقطعة" description="بنود تُباع للطالب بالعدد، مثل الزي المدرسي. السعر الجديد يسري على المبيعات القادمة فقط." count={items.length} actions={action} />
        <SectionCard title="قائمة البنود" description="البيع للطالب من صفحة مصروفاته ← «بيع بند».">
          {!loading && items.length === 0 ? (
            <EmptyState icon={<CheckroomRounded />} title="لا توجد بنود حتى الآن" description="أضف بندًا مثل «الزي المدرسي» بسعر القطعة." />
          ) : (
            <Stack gap={1} sx={{ p: 1 }}>
              {items.map((item) => (
                <Paper key={item._id} elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: "1px solid rgba(36,74,112,.08)", opacity: item.isActive ? 1 : 0.6 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
                    <Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{item.name}</Typography>
                        <Chip size="small" label={`${money(item.unitPrice)} للقطعة`} color="primary" variant="outlined" />
                        {!item.isActive && <Chip size="small" label="غير مفعّل" />}
                      </Stack>
                      <Typography sx={{ mt: 0.5, fontSize: 11, color: "var(--color-muted)" }}>
                        {[2, 3, 4].map((n) => `${n} = ${money(item.unitPrice * n)}`).join(" · ")}
                        {item.description ? ` — ${item.description}` : ""}
                      </Typography>
                    </Box>
                    {permissions?.edit && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Tooltip title={item.isActive ? "إيقاف" : "تفعيل"}>
                          <Switch checked={!!item.isActive} onChange={() => toggle(item)} />
                        </Tooltip>
                        <Tooltip title="تعديل">
                          <IconButton onClick={() => setDialog({ id: item._id, name: item.name, unitPrice: String(item.unitPrice), description: item.description || "" })}>
                            <EditRounded />
                          </IconButton>
                        </Tooltip>
                        {permissions?.delete && (
                          <Tooltip title="حذف (للبنود التي لم تُبع)">
                            <IconButton color="error" onClick={() => remove(item)}><DeleteOutlineRounded /></IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Box>

      <Dialog open={!!dialog} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "18px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{dialog?.id ? "تعديل البند" : "إضافة بند"}</DialogTitle>
        {dialog && (
          <DialogContent>
            <TextField fullWidth size="small" label="اسم البند" placeholder="الزي المدرسي" value={dialog.name}
              onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))} sx={{ mt: 0.75, mb: 1.5 }} />
            <TextField fullWidth size="small" type="number" label="سعر القطعة (ريال)" value={dialog.unitPrice}
              onChange={(e) => setDialog((d) => ({ ...d, unitPrice: e.target.value }))} sx={{ mb: 1.5 }} />
            <TextField fullWidth size="small" label="الوصف (اختياري)" value={dialog.description}
              onChange={(e) => setDialog((d) => ({ ...d, description: e.target.value }))} />
            {dialog.id && (
              <Typography sx={{ mt: 1.25, fontSize: 11, color: "var(--color-muted)" }}>
                تغيير السعر يسري على المبيعات الجديدة فقط.
              </Typography>
            )}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} disabled={busy}>إلغاء</Button>
          <Button variant="contained" onClick={save} disabled={busy} sx={{ fontWeight: 800 }}>حفظ</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
