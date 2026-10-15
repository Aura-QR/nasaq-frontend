import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Paper, Select, Stack, Switch, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { AddAPhotoOutlined, AddRounded, ArrowDownwardRounded, ArrowUpwardRounded, DeleteOutlineRounded, EditOutlined, CampaignRounded, ImageOutlined } from "@mui/icons-material";
import usePermissions from "@/utils/hooks/usePermissions";
import Container from "@/components/Container/Container";
import { announcementMediaUrl, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, setAnnouncementStatus, updateAnnouncementOrder, uploadAnnouncementFile } from "@/APIs/school/announcements";
import { AnnouncementCard } from "@/components/Announcements/AnnouncementCarousel";

const types = { honor_roll: "الطلاب المتميزون", program: "إعلان برنامج", video: "فيديو توعوي" };
const statuses = { all: "الكل", live: "ظاهر الآن", scheduled: "مجدول", expired: "منتهي", paused: "موقوف" };
const audienceNames = { STUDENT: "الطلاب", TEACHER: "المعلمون", ADMIN: "الإدارة" };
// Rows are matched by key, not index, so a photo still uploading lands on its own student after a row above is removed.
let rowSeq = 0;
const studentRow = (student = {}) => ({ name: "", className: "", note: "", photoUrl: null, ...student, rowKey: `row-${++rowSeq}` });
// Focusable, unlike `hidden`, so the picker works from the keyboard.
const fileInputSx = { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };
const blank = () => ({ type: "program", title: "", body: "", imageUrl: null, students: [], cta: { label: "", url: "" }, video: { url: "" }, startsAt: "", endsAt: "", audiences: ["STUDENT", "TEACHER", "ADMIN"], isActive: true, durationSeconds: "" });
const dateValue = value => value ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "";
const errorMessage = error => error?.response?.data?.message || error?.message || "تعذر إتمام العملية";
const toPayload = form => {
  // Only a program shows a picture now; an honor roll's students carry their own photos.
  const payload = { type: form.type, title: form.title.trim(), body: form.body || null, imageUrl: form.type === "program" ? form.imageUrl || null : null, audiences: form.audiences, isActive: form.isActive, startsAt: form.startsAt || undefined, endsAt: form.endsAt || null, durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null };
  if (form.type === "honor_roll") payload.students = form.students.filter(x => x.name?.trim() || x.studentId).map(x => ({ ...(x.studentId ? { studentId: x.studentId } : {}), ...(x.name?.trim() ? { name: x.name.trim() } : {}), ...(x.className ? { className: x.className } : {}), ...(x.note ? { note: x.note } : {}), ...(x.photoUrl ? { photoUrl: x.photoUrl } : {}) }));
  if (form.type === "program") payload.cta = form.cta?.label && form.cta?.url ? form.cta : null;
  if (form.type === "video") payload.video = form.video?.url ? { url: form.video.url.trim() } : null;
  return payload;
};
export default function AnnouncementsManagement() {
  const permissions = usePermissions("announcements");
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [progress, setProgress] = useState(0);
  const [previewVariant, setPreviewVariant] = useState("teacher");
  const update = (name, value) => setForm(f => ({ ...f, [name]: value }));
  const updateStudent = (rowKey, patch) => setForm(f => ({ ...f, students: f.students.map(x => x.rowKey === rowKey ? { ...x, ...patch } : x) }));
  const reload = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetchAnnouncements(); setList(Array.isArray(response) ? response : []); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { reload(); }, [reload]);
  const openNew = () => { setForm(blank()); setEditing("new"); setError(""); };
  const openEdit = item => { setForm({ ...blank(), ...item, students: (item.students || []).map(studentRow), startsAt: dateValue(item.startsAt), endsAt: dateValue(item.endsAt), durationSeconds: item.durationSeconds || "", cta: item.cta || { label: "", url: "" }, video: item.video || { url: "" } }); setEditing(item.id); setError(""); };
  const submit = async () => { setSaving(true); setError(""); try { const payload = toPayload(form); if (!payload.title) throw Error("اكتب عنوان الإعلان"); if (!payload.audiences.length) throw Error("اختر جمهورًا واحدًا على الأقل"); if (payload.type === "honor_roll" && !payload.students.length) throw Error("أضف اسم طالب واحد على الأقل"); if (payload.type === "video" && !payload.video?.url) throw Error("ضع رابط الفيديو"); if (editing === "new") await createAnnouncement(payload); else await updateAnnouncement(editing, payload); setEditing(null); await reload(); } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); } };
  const upload = async (file, key, apply) => { if (!file) return; setError(""); if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 5 * 1024 * 1024) { setError("يُقبل JPG أو PNG أو WEBP بحجم لا يزيد عن 5 ميجابايت"); return; } setUploading(key); setProgress(0); try { const data = await uploadAnnouncementFile(file, ev => setProgress(Math.round(100 * ev.loaded / (ev.total || file.size)))); apply(data.url); } catch (e) { setError(errorMessage(e)); } finally { setUploading(null); } };
  const pickFile = (key, apply) => e => { upload(e.target.files?.[0], key, apply); e.target.value = ""; };
  const toggle = async item => { try { await setAnnouncementStatus(item.id, !item.isActive); await reload(); } catch (e) { setError(errorMessage(e)); } };
  const remove = async item => { if (!window.confirm(`حذف الإعلان «${item.title}» نهائيًا؟`)) return; try { await deleteAnnouncement(item.id); await reload(); } catch (e) { setError(errorMessage(e)); } };
  const move = async (item, delta) => { const index = list.findIndex(x => x.id === item.id); const other = index + delta; if (other < 0 || other >= list.length) return; const reordered = [...list]; [reordered[index], reordered[other]] = [reordered[other], reordered[index]]; setList(reordered); try { await updateAnnouncementOrder(reordered.map(x => x.id)); await reload(); } catch (e) { setError(errorMessage(e)); await reload(); } };
  const visible = list.filter(x => (status === "all" || x.status === status) && (typeFilter === "all" || x.type === typeFilter));
  return <Container><Box dir="rtl" sx={{ p: { xs: 1, md: 2 }, maxWidth: 1200, mx: "auto" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
      <Box><Typography variant="h4" sx={{ fontWeight: 900, color: "#193957" }}>الإعلانات</Typography><Typography color="text.secondary">نظّم المحتوى الذي يظهر في لوحات المدرسة، المعلمين والطلاب</Typography></Box>
      {permissions.add && <Button onClick={openNew} variant="contained" startIcon={<AddRounded />} sx={{ bgcolor: "#244a70", borderRadius: 2, fontWeight: 800 }}>إعلان جديد</Button>}
    </Stack>
    {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} gap={2}><Tabs value={status} onChange={(_, value) => setStatus(value)} variant="scrollable" scrollButtons="auto" sx={{ flex: 1 }}>{Object.entries(statuses).map(([k, v]) => <Tab key={k} value={k} label={v} />)}</Tabs><Select size="small" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="all">كل الأنواع</MenuItem>{Object.entries(types).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</Select></Stack></Paper>
    {loading ? <Stack alignItems="center" py={5}><CircularProgress /></Stack> : !visible.length ? <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 3 }}><CampaignRounded sx={{ fontSize: 44, color: "#cba458" }} /><Typography mt={1}>لا توجد إعلانات بعد</Typography></Paper> : <Stack spacing={1.5}>{visible.map(item => <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}><Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} gap={2}><Box sx={{ minWidth: 0, flex: 1 }}><Stack direction="row" flexWrap="wrap" gap={1} mb={1}><Chip size="small" label={types[item.type]} /><Chip size="small" color={item.status === "live" ? "success" : "default"} label={statuses[item.status] || item.status} /></Stack><Typography fontWeight={900}>{item.title}</Typography><Typography color="text.secondary" variant="body2">{(item.audiences || []).map(x => audienceNames[x]).filter(Boolean).join(" • ") || "—"}</Typography></Box><Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">{permissions.edit && <><IconButton onClick={() => move(item, -1)} disabled={list.indexOf(item) === 0} aria-label="رفع الأولوية"><ArrowUpwardRounded /></IconButton><IconButton onClick={() => move(item, 1)} disabled={list.indexOf(item) === list.length - 1} aria-label="خفض الأولوية"><ArrowDownwardRounded /></IconButton><Switch checked={!!item.isActive} onChange={() => toggle(item)} inputProps={{ "aria-label": "إظهار الإعلان" }} /><IconButton onClick={() => openEdit(item)} aria-label="تعديل الإعلان"><EditOutlined /></IconButton></>}{permissions.delete && <IconButton onClick={() => remove(item)} color="error" aria-label="حذف الإعلان"><DeleteOutlineRounded /></IconButton>}</Stack></Stack></Paper>)}</Stack>}
    <Dialog open={!!editing} onClose={() => !saving && setEditing(null)} maxWidth="md" fullWidth dir="rtl"><DialogTitle sx={{ fontWeight: 900 }}>{editing === "new" ? "إضافة إعلان" : "تعديل الإعلان"}</DialogTitle><DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Tabs value={form.type} onChange={(_, v) => update("type", v)} variant="fullWidth">{Object.entries(types).map(([k, v]) => <Tab key={k} value={k} label={v} />)}</Tabs>
      <TextField fullWidth label="عنوان الإعلان" required value={form.title} onChange={e => update("title", e.target.value)} />
      <TextField fullWidth multiline rows={2} label="الوصف (اختياري)" value={form.body || ""} onChange={e => update("body", e.target.value)} />
      {form.type === "program" && <Box>
        <Typography fontWeight={800}>صورة الإعلان (اختياري)</Typography>
        <Typography variant="body2" color="text.secondary" mb={1.2}>تظهر كاملة وواضحة بجانب النص، ويستطيع المستخدم تكبيرها بالضغط عليها.</Typography>
        {form.imageUrl ? <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
          <Box component="img" src={announcementMediaUrl(form.imageUrl)} alt="صورة الإعلان" sx={{ width: 168, height: 96, objectFit: "contain", borderRadius: 2, border: "1px solid #dce7f2", bgcolor: "#f3f7fb" }} />
          <Stack direction="row" gap={1}>
            <Button component="label" variant="outlined" size="small" disabled={!!uploading}>استبدال الصورة<Box component="input" type="file" accept="image/jpeg,image/png,image/webp" sx={fileInputSx} onChange={pickFile("cover", url => update("imageUrl", url))} /></Button>
            <Button color="error" size="small" onClick={() => update("imageUrl", null)}>إزالة</Button>
          </Stack>
        </Stack> : <Button component="label" variant="outlined" startIcon={<ImageOutlined />} disabled={!!uploading}>رفع صورة<Box component="input" type="file" accept="image/jpeg,image/png,image/webp" sx={fileInputSx} onChange={pickFile("cover", url => update("imageUrl", url))} /></Button>}
        {uploading === "cover" && <Typography variant="body2" mt={1}>جارٍ رفع الصورة... {progress}%</Typography>}
      </Box>}
      {form.type === "honor_roll" && <Box>
        <Typography fontWeight={800}>الطلاب المتميزون</Typography>
        <Typography variant="body2" color="text.secondary" mb={1.2}>أضف صورة لكل طالب لتظهر داخل إطار ذهبي بجانب اسمه، وبدون صورة يظهر الحرف الأول من اسمه.</Typography>
        <Stack spacing={1}>{form.students.map(student => <Paper key={student.rowKey} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
          <Stack alignItems="center" sx={{ flexShrink: 0 }}>
            <Box component="label" title="صورة الطالب" sx={{ position: "relative", width: 64, height: 64, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", cursor: uploading ? "default" : "pointer", boxSizing: "border-box", bgcolor: "#f3f7fb", border: student.photoUrl ? "3px solid #e0b45c" : "2px dashed #b9cde0", "&:focus-within": { outline: "2px solid #377bb5", outlineOffset: 2 } }}>
              {student.photoUrl ? <Box component="img" src={announcementMediaUrl(student.photoUrl)} alt={student.name || "صورة الطالب"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <AddAPhotoOutlined sx={{ color: "#7b98b3" }} />}
              {uploading === student.rowKey && <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.75)" }}><CircularProgress size={30} variant="determinate" value={progress} /></Box>}
              <Box component="input" type="file" accept="image/jpeg,image/png,image/webp" aria-label={`صورة ${student.name || "الطالب"}`} disabled={!!uploading} sx={fileInputSx} onChange={pickFile(student.rowKey, url => updateStudent(student.rowKey, { photoUrl: url }))} />
            </Box>
            {student.photoUrl ? <Button size="small" color="error" sx={{ minWidth: 0, py: 0, fontSize: 11 }} onClick={() => updateStudent(student.rowKey, { photoUrl: null })}>إزالة الصورة</Button> : <Typography variant="caption" color="text.secondary">صورة</Typography>}
          </Stack>
          <TextField size="small" fullWidth label="اسم الطالب" value={student.name || ""} onChange={e => updateStudent(student.rowKey, { name: e.target.value })} />
          <TextField size="small" label="الفصل" value={student.className || ""} onChange={e => updateStudent(student.rowKey, { className: e.target.value })} sx={{ minWidth: { sm: 110 } }} />
          <TextField size="small" fullWidth label="سبب التميز" placeholder="الأول على الصف" value={student.note || ""} onChange={e => updateStudent(student.rowKey, { note: e.target.value })} />
          <IconButton onClick={() => update("students", form.students.filter(x => x.rowKey !== student.rowKey))} aria-label="حذف الطالب" sx={{ alignSelf: "center" }}><DeleteOutlineRounded /></IconButton>
        </Stack></Paper>)}</Stack>
        <Button startIcon={<AddRounded />} sx={{ mt: 1 }} onClick={() => update("students", [...form.students, studentRow()])}>إضافة طالب</Button>
      </Box>}
      {form.type === "program" && <Stack direction={{ xs: "column", md: "row" }} gap={1}><TextField fullWidth label="نص الزر (اختياري)" value={form.cta?.label || ""} onChange={e => update("cta", { ...form.cta, label: e.target.value })} /><TextField fullWidth label="رابط الزر" placeholder="/student/library أو https://..." value={form.cta?.url || ""} onChange={e => update("cta", { ...form.cta, url: e.target.value })} /></Stack>}
      {form.type === "video" && <TextField fullWidth label="رابط الفيديو HTTPS" placeholder="https://youtu.be/..." value={form.video?.url || ""} onChange={e => update("video", { url: e.target.value })} />}
      <Divider /><Typography fontWeight={800}>يظهر لـ</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{Object.entries(audienceNames).map(([key, label]) => <FormControlLabel key={key} label={label} control={<Checkbox checked={form.audiences.includes(key)} onChange={(_, checked) => update("audiences", checked ? [...form.audiences, key] : form.audiences.filter(x => x !== key))} />} />)}</Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2}><TextField fullWidth type="date" label="يبدأ في" InputLabelProps={{ shrink: true }} value={form.startsAt || ""} onChange={e => update("startsAt", e.target.value)} /><TextField fullWidth type="date" label="ينتهي في (اتركه فارغًا للاستمرار)" InputLabelProps={{ shrink: true }} value={form.endsAt || ""} onChange={e => update("endsAt", e.target.value)} /></Stack>
      <Stack direction="row" alignItems="center" gap={2}><TextField size="small" type="number" label="مدة العرض بالثواني" inputProps={{ min: 2 }} value={form.durationSeconds} onChange={e => update("durationSeconds", e.target.value)} /><FormControlLabel label="إظهار الإعلان" control={<Switch checked={!!form.isActive} onChange={(_, c) => update("isActive", c)} />} /></Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}><Typography fontWeight={800}>معاينة</Typography><ToggleButtonGroup size="small" exclusive value={previewVariant} onChange={(_, v) => v && setPreviewVariant(v)} aria-label="شكل المعاينة"><ToggleButton value="teacher">لوحة المعلمين</ToggleButton><ToggleButton value="student">لوحة الطلاب والإدارة</ToggleButton></ToggleButtonGroup></Stack>
      <Box sx={{ borderRadius: "20px", overflow: "hidden", border: previewVariant === "teacher" ? "1px solid rgba(245,217,148,.85)" : "1px solid #dce9f6" }}><AnnouncementCard variant={previewVariant} slide={toPayload(form)} /></Box>
    </Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setEditing(null)} disabled={saving}>إلغاء</Button><Button variant="contained" disabled={saving || !!uploading} onClick={submit}>{saving ? "جارٍ الحفظ..." : "حفظ الإعلان"}</Button></DialogActions></Dialog>
  </Box></Container>;
}
