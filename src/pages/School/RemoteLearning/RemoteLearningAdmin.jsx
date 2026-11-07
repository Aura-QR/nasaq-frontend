import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton, Paper, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import { DeleteOutlineRounded, LaptopChromebookRounded, LinkRounded, SaveRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import {
  createRemoteDay, deleteRemoteDay, fetchRemoteDays, fetchTeacherLinks, setTeacherLink,
} from "@/APIs/school/remoteLearning";
import { fetchStages } from "@/APIs/school/stages";

/*
 * التعليم عن بُعد — صفحة الإدارة.
 *
 * تحدد الإدارة أيام الدراسة عن بُعد (للمدرسة كلها أو لمراحل محددة)، فيُشعَر
 * الطلاب والمعلمون، وتظهر لكل طالب حصص يومه مع زر «انضم للحصة». رابط كل حصة
 * هو الرابط الثابت للمعلم (Teams أو Zoom أو Meet) ما لم يضع المعلم رابطًا خاصًا
 * بالحصة. في تلك الأيام يستطيع المعلم تسجيل حضوره من خارج المدرسة.
 */
const today = () => new Date().toLocaleDateString("en-CA");
const fmt = (d) => {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  } catch {
    return d;
  }
};
const card = { p: 2, mt: 1.25, borderRadius: "18px", border: "1px solid rgba(36,74,112,.09)", bgcolor: "white" };

export default function RemoteLearningAdmin() {
  const [days, setDays] = useState([]);
  const [stages, setStages] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ startDate: today(), endDate: today(), stageIds: [], note: "" });
  const [links, setLinks] = useState({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [d, s, t] = await Promise.all([fetchRemoteDays(), fetchStages(), fetchTeacherLinks()]);
    setDays(Array.isArray(d?.data) ? d.data : []);
    const st = s?.data?.items || s?.data || [];
    setStages(Array.isArray(st) ? st : []);
    const tl = Array.isArray(t?.data) ? t.data : [];
    setTeachers(tl);
    setLinks(Object.fromEntries(tl.map((x) => [x._id, x.meetingUrl || ""])));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const missing = useMemo(() => teachers.filter((t) => !t.meetingUrl).length, [teachers]);

  const toggleStage = (id) =>
    setForm((f) => ({ ...f, stageIds: f.stageIds.includes(id) ? f.stageIds.filter((x) => x !== id) : [...f.stageIds, id] }));

  const addDays = async () => {
    if (!form.startDate) return toast.error("اختر تاريخ البداية");
    const scope = form.stageIds.length ? stages.filter((s) => form.stageIds.includes(String(s._id))).map((s) => s.name).join("، ") : "المدرسة كلها";
    if (!window.confirm(`التعليم عن بُعد من ${fmt(form.startDate)} إلى ${fmt(form.endDate || form.startDate)} — ${scope}؟ سيُرسل إشعار للطلاب والمعلمين.`)) return;
    setBusy(true);
    const r = await createRemoteDay({ ...form, endDate: form.endDate || form.startDate, note: form.note.trim() || undefined });
    setBusy(false);
    if (!r?.status) return toast.error(r?.message || "تعذر الحفظ");
    toast.success(r.message);
    load();
  };

  const removeDay = async (d) => {
    if (!window.confirm(`إلغاء التعليم عن بُعد (${fmt(d.startDate)}${d.endDate !== d.startDate ? ` – ${fmt(d.endDate)}` : ""})؟`)) return;
    const r = await deleteRemoteDay(d._id);
    if (r?.status) { toast.success(r.message); load(); } else toast.error(r?.message || "تعذر الإلغاء");
  };

  const saveLink = async (t) => {
    const value = (links[t._id] || "").trim();
    if (value && !/^https:\/\/\S{8,}$/.test(value)) return toast.error("الرابط يجب أن يبدأ بـ https://");
    const r = await setTeacherLink(t._id, value);
    if (r?.status) { toast.success(r.message); setTeachers((p) => p.map((x) => (x._id === t._id ? { ...x, meetingUrl: value } : x))); }
    else toast.error(r?.message || "تعذر الحفظ");
  };

  if (loading) return <Container><Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack></Container>;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ ...card, mt: 0 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "13px", bgcolor: "#EDF6FF", color: "#244A70" }}><LaptopChromebookRounded /></Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#122F4D" }}>التعليم عن بُعد</Typography>
              <Typography sx={{ fontSize: 11, color: "#83909D" }}>
                حدد أيام الدراسة عن بُعد، فيرى كل طالب حصص يومه مع زر «انضم للحصة»، ويسجّل المعلمون حضورهم من خارج المدرسة.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={card}>
          <Typography sx={{ fontSize: 15, fontWeight: 900, mb: 1.25 }}>تحديد أيام التعليم عن بُعد</Typography>
          <Stack direction={{ xs: "column", md: "row" }} gap={1.25}>
            <TextField size="small" type="date" label="من" InputLabelProps={{ shrink: true }} value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))} />
            <TextField size="small" type="date" label="إلى" InputLabelProps={{ shrink: true }} value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            <TextField size="small" label="ملاحظة (اختياري)" placeholder="بسبب الأحوال الجوية" value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} sx={{ flex: 1 }} />
          </Stack>
          <Typography sx={{ mt: 1.25, fontSize: 12, fontWeight: 800 }}>المراحل</Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            <FormControlLabel control={<Checkbox checked={!form.stageIds.length} onChange={() => setForm((f) => ({ ...f, stageIds: [] }))} />} label="المدرسة كلها" />
            {stages.map((s) => (
              <FormControlLabel key={s._id} control={<Checkbox checked={form.stageIds.includes(String(s._id))} onChange={() => toggleStage(String(s._id))} />} label={s.name} />
            ))}
          </Stack>
          <Button variant="contained" onClick={addDays} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            sx={{ mt: 1, borderRadius: "11px", fontWeight: 800 }}>
            حفظ وإشعار الطلاب والمعلمين
          </Button>

          {days.length > 0 && (
            <Stack gap={0.75} sx={{ mt: 2 }}>
              {days.map((d) => {
                const past = d.endDate < today();
                return (
                  <Stack key={d._id} direction="row" alignItems="center" justifyContent="space-between" gap={1}
                    sx={{ p: 1, borderRadius: "12px", border: "1px solid rgba(36,74,112,.08)", opacity: past ? 0.55 : 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        {fmt(d.startDate)}{d.endDate !== d.startDate ? ` ← ${fmt(d.endDate)}` : ""}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#83909D" }}>
                        {d.stageNames?.length ? d.stageNames.join("، ") : "المدرسة كلها"}{d.note ? ` · ${d.note}` : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      {past && <Chip size="small" label="انتهى" />}
                      <Tooltip title="إلغاء"><IconButton color="error" onClick={() => removeDay(d)}><DeleteOutlineRounded /></IconButton></Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={card}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 900 }}>روابط حصص المعلمين</Typography>
            {missing > 0 && <Chip size="small" color="warning" label={`${missing} معلم بدون رابط`} />}
          </Stack>
          <Alert severity="info" sx={{ mb: 1.25, borderRadius: "12px", fontSize: 12 }}>
            لكل معلم رابط اجتماع ثابت (Teams أو Zoom أو Google Meet) يُستخدم لكل حصصه في أيام التعليم عن بُعد. يستطيع المعلم إضافته بنفسه من لوحته.
            في Teams: فعّلوا دخول الضيوف أو ألغوا «غرفة الانتظار» حتى يدخل الطلاب دون حسابات Microsoft.
          </Alert>
          <Stack gap={0.75}>
            {teachers.map((t) => (
              <Stack key={t._id} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1}
                sx={{ p: 1, borderRadius: "12px", border: "1px solid rgba(36,74,112,.06)" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, minWidth: 200 }}>{t.name}</Typography>
                <TextField size="small" fullWidth placeholder="https://teams.microsoft.com/l/meetup-join/..." value={links[t._id] ?? ""}
                  onChange={(e) => setLinks((p) => ({ ...p, [t._id]: e.target.value }))} inputProps={{ dir: "ltr" }} />
                <Stack direction="row" gap={0.5}>
                  {t.meetingUrl && <Tooltip title="فتح الرابط"><IconButton component="a" href={t.meetingUrl} target="_blank" rel="noopener noreferrer"><LinkRounded /></IconButton></Tooltip>}
                  <Button size="small" variant="outlined" onClick={() => saveLink(t)} disabled={(links[t._id] ?? "") === (t.meetingUrl || "")}
                    sx={{ borderRadius: "10px", fontWeight: 800, whiteSpace: "nowrap" }}>حفظ</Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
