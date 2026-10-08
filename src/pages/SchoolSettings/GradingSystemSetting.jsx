import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { api } from "@/APIs/Axios";

export default function GradingSystemSetting({ canEdit = false }) {
  const [value, setValue] = useState("flexible");
  const [original, setOriginal] = useState("flexible");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { let active = true; api.get("/schools/me/settings").then(({ data }) => {
    const settings = data?.data?.settings || data?.data || data?.settings || data;
    if (active) { const system = settings?.gradingSystem === "ministry" ? "ministry" : "flexible"; setValue(system); setOriginal(system); }
  }).catch((e) => { if (active) setMessage(e?.response?.data?.message || "تعذر قراءة إعدادات نظام الدرجات"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const save = async () => {
    if (!window.confirm("تغيير نظام الدرجات مسموح فقط قبل رصد درجات في العام الدراسي الحالي. هل تريد المتابعة؟")) return;
    setBusy(true); setMessage("");
    try { await api.patch("/schools/me/settings", { gradingSystem: value }); setOriginal(value); setMessage("تم تحديث نظام الدرجات بنجاح. حدّث الصفحة لتطبيق إعدادات القوائم."); }
    catch(e) { setMessage(e?.response?.data?.message || "تعذر تحديث نظام الدرجات"); }
    finally { setBusy(false); }
  };
  return <Paper dir="rtl" sx={{ p: 2, mt: 2, border: "1px solid #e5e9ef", borderRadius: 3 }}>
    <Typography variant="h6" fontWeight="bold" gutterBottom>نظام الدرجات</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>النظام المرن يستخدم معايير الدرجات، أما نظام الوزارة فيستخدم السجل السنوي وتوزيعًا ثابتًا للدرجات.</Typography>
    {message && <Alert severity={message.startsWith("تم ") ? "success" : "warning"} sx={{ mb: 2 }}>{message}</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
      <TextField select size="small" label="نظام الدرجات" value={value} onChange={(e) => setValue(e.target.value)} disabled={loading || busy || !canEdit} sx={{ minWidth: 280 }}>
        <MenuItem value="flexible">مرن (معايير الدرجات)</MenuItem><MenuItem value="ministry">نظام الوزارة (السجل السنوي)</MenuItem>
      </TextField>
      {canEdit && <Button variant="contained" onClick={save} disabled={busy || loading || value === original}>حفظ نظام الدرجات</Button>}
    </Stack>
  </Paper>;
}
