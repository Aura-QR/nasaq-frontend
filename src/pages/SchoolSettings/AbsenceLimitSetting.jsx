import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Switch, FormControlLabel, TextField, Typography } from "@mui/material";
import { api } from "@/APIs/Axios";

/**
 * حد الغياب: the number of unexcused days in the term at which the school's
 * admins and the family are alerted. Empty turns the alert off.
 */
export default function AbsenceLimitSetting({ canEdit = false, field = "absenceAlertDays", title = "حد غياب الطلاب" }) {
  const [value, setValue] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/schools/me/settings")
      .then(({ data }) => {
        const settings = data?.data?.settings || data?.data || data?.settings || data;
        const v = typeof settings?.[field] === "number" ? String(settings[field]) : "";
        if (active) { setValue(v); setOriginal(v); }
      })
      .catch((e) => { if (active) setMessage(e?.response?.data?.message || "تعذر قراءة حد الغياب"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [field]);

  const invalid = value !== "" && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 60);

  const save = async () => {
    setBusy(true); setMessage("");
    try {
      await api.patch("/schools/me/settings", { [field]: value === "" ? null : Number(value) });
      setOriginal(value);
      setMessage(value === "" ? "تم إيقاف تنبيه حد الغياب." : `تم حفظ حد الغياب: ${value} أيام بغير عذر في الفصل الدراسي.`);
    } catch (e) {
      setMessage(e?.response?.data?.message || "تعذر حفظ حد الغياب");
    } finally { setBusy(false); }
  };

  return (
    <Paper dir="rtl" sx={{ p: 2, mt: 2, border: "1px solid #e5e9ef", borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {field === "teacherAbsenceAlertDays" ? "عند بلوغ المعلم هذا العدد من أيام الغياب بغير عذر مقبول خلال الفصل الدراسي، يصل تنبيه تلقائي إلى الإدارة." : "عند بلوغ غياب الطالب بغير عذر هذا العدد من الأيام في الفصل الدراسي، يصل تنبيه تلقائي إلى إدارة المدرسة وإلى ولي الأمر، ويظهر الطالب في «سجل الفصل». اترك الحقل فارغًا لإيقاف التنبيه."}
      </Typography>
      {message && <Alert severity={message.startsWith("تم ") ? "success" : "warning"} sx={{ mb: 2 }}>{message}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "flex-start" }}>
        {field === "teacherAbsenceAlertDays" && <FormControlLabel label="تفعيل التنبيه" control={<Switch checked={value !== ""} disabled={loading || busy || !canEdit} onChange={e => setValue(e.target.checked ? original || "5" : "")} />} />}
        <TextField
          size="small" label="عدد الأيام بغير عذر" value={value} placeholder="مثال: 5"
          onChange={(e) => setValue(e.target.value.trim())}
          disabled={loading || busy || !canEdit}
          error={invalid} helperText={invalid ? "أدخل عددًا من 1 إلى 60" : " "}
          inputProps={{ inputMode: "numeric" }} sx={{ minWidth: 220 }}
        />
        {canEdit && <Button variant="contained" onClick={save} disabled={busy || loading || invalid || value === original}>حفظ حد الغياب</Button>}
      </Stack>
    </Paper>
  );
}
