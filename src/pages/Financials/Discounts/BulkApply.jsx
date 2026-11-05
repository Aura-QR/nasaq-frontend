import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography,
} from "@mui/material";
import { GroupAddRounded } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { pageCardSx } from "@/components/financial/FinancialShell";
import { applyDiscountBulk, fetchDiscounts } from "@/APIs/financials/discounts";
import { fetchFinancialRecords } from "@/APIs/financials/financialRecords";
import { discountLabel } from "./DiscountFields";

/*
 * تطبيق خصم على عدة طلاب دفعة واحدة، مثل خصم «الطلاب السابقون» لكل طالب
 * درس في المدرسة العام الماضي. الطالب الذي لديه الخصم يظهر «مطبق» ولا يُحدَّد.
 */
const idOf = (v) => String(v?._id || v?.id || v || "");
const money = (v) => `${Number(v || 0).toLocaleString("ar-SA")} ريال`;
const appliedIds = (r) => {
  const t = r?.tuition || {};
  const list = Array.isArray(t.discounts) && t.discounts.length ? t.discounts : t.discount ? [t.discount] : [];
  return new Set(list.map((d) => idOf(d.discountId)).filter(Boolean));
};

export default function DiscountsBulkApplyPage() {
  const [params] = useSearchParams();
  const [discounts, setDiscounts] = useState([]);
  const [discountId, setDiscountId] = useState(params.get("discount") || "");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    const [d, r] = await Promise.all([fetchDiscounts(), fetchFinancialRecords({ page: 1, limit: 1000 })]);
    setDiscounts((Array.isArray(d?.data) ? d.data : []).filter((x) => x.isActive));
    const rows = r?.data?.items || r?.data?.data || r?.data || [];
    setRecords(Array.isArray(rows) ? rows : []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const discount = discounts.find((d) => idOf(d) === discountId);
  const classes = useMemo(() => {
    const map = new Map();
    records.forEach((r) => r.classId && map.set(idOf(r.classId), r.classId?.name || r.classId?.roomNumber || "فصل"));
    return [...map.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), "ar"));
  }, [records]);

  const rows = useMemo(() => {
    const q = search.trim();
    return records
      .filter((r) => !classId || idOf(r.classId) === classId)
      .filter((r) => !q || String(r.studentId?.name || "").includes(q))
      .map((r) => ({
        studentId: idOf(r.studentId),
        name: r.studentId?.name || "—",
        className: r.classId?.name || "",
        gross: Number(r.tuition?.grossFee || r.tuition?.fee || 0),
        has: discountId ? appliedIds(r).has(discountId) : false,
        others: (Array.isArray(r.tuition?.discounts) && r.tuition.discounts.length ? r.tuition.discounts : r.tuition?.discount ? [r.tuition.discount] : [])
          .filter((d) => idOf(d.discountId) !== discountId).map((d) => d.name),
      }))
      .sort((a, b) => a.className.localeCompare(b.className, "ar") || a.name.localeCompare(b.name, "ar"));
  }, [records, classId, search, discountId]);

  const selectable = rows.filter((r) => !r.has);
  const allPicked = selectable.length > 0 && selectable.every((r) => picked.has(r.studentId));
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setPicked((p) => {
    const n = new Set(p);
    selectable.forEach((r) => (allPicked ? n.delete(r.studentId) : n.add(r.studentId)));
    return n;
  });

  const apply = async () => {
    if (!discount) return toast.error("اختر الخصم");
    const ids = [...picked];
    if (!ids.length) return toast.error("اختر طالبًا واحدًا على الأقل");
    if (!window.confirm(`تطبيق «${discount.name}» (${discountLabel(discount)}) على ${ids.length} طالب؟`)) return;
    setBusy(true);
    const r = await applyDiscountBulk(discountId, { studentIds: ids });
    setBusy(false);
    if (!r?.status) return toast.error(r?.message || r || "تعذر التطبيق");
    toast.success(r.message);
    setResult(r.message);
    setPicked(new Set());
    load();
  };

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, p: 1.4 }}><Back title="تطبيق خصم على عدة طلاب" /></Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={1.25}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>الخصم</InputLabel>
              <Select label="الخصم" value={discountId} onChange={(e) => { setDiscountId(e.target.value); setPicked(new Set()); }}>
                {discounts.map((d) => <MenuItem key={idOf(d)} value={idOf(d)}>{d.name} — {discountLabel(d)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>الفصل</InputLabel>
              <Select label="الفصل" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <MenuItem value="">كل الفصول</MenuItem>
                {classes.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="بحث بالاسم" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
          </Stack>
          <Typography sx={{ mt: 1.25, fontSize: 11, color: "var(--color-muted)" }}>
            حدّد الطلاب ثم اضغط «تطبيق». الخصم يُضاف إلى أي خصم آخر لدى الطالب، والأقساط تُعاد موازنتها تلقائيًا.
          </Typography>
          {result && <Alert severity="success" sx={{ mt: 1.25 }} onClose={() => setResult(null)}>{result}</Alert>}
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, p: 1.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1} sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Checkbox checked={allPicked} indeterminate={!allPicked && selectable.some((r) => picked.has(r.studentId))} onChange={toggleAll} disabled={!discountId || !selectable.length} />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {classId ? "تحديد كل طلاب الفصل" : "تحديد الكل"} ({selectable.length})
              </Typography>
              <Chip size="small" label={`المحدد: ${picked.size}`} color={picked.size ? "primary" : "default"} />
            </Stack>
            <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <GroupAddRounded />}
              onClick={apply} disabled={busy || !discountId || !picked.size} sx={{ borderRadius: "10px", fontWeight: 800 }}>
              تطبيق على المحددين ({picked.size})
            </Button>
          </Stack>

          {!discountId && <Alert severity="info">اختر الخصم أولًا.</Alert>}
          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
          ) : discountId && (
            <Stack gap={0.5}>
              {rows.map((r) => (
                <Stack key={r.studentId} direction="row" alignItems="center" gap={1}
                  sx={{ px: 1, py: 0.5, borderRadius: "10px", bgcolor: picked.has(r.studentId) ? "var(--color-gold-soft)" : "white", border: "1px solid rgba(36,74,112,.06)" }}>
                  <Checkbox size="small" checked={r.has || picked.has(r.studentId)} disabled={r.has} onChange={() => toggle(r.studentId)} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{r.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: "var(--color-muted)" }}>
                      {r.className} · الرسوم {money(r.gross)}{r.others.length ? ` · خصومات أخرى: ${r.others.join("، ")}` : ""}
                    </Typography>
                  </Box>
                  {r.has && <Chip size="small" color="success" variant="outlined" label="مطبق" />}
                </Stack>
              ))}
              {!rows.length && <Typography sx={{ p: 2, textAlign: "center", color: "var(--color-muted)" }}>لا يوجد طلاب مطابقون.</Typography>}
            </Stack>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
