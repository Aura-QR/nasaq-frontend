import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { CheckCircleRounded, CloseRounded, EventAvailableRounded, EventBusyRounded, RefreshRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import { fetchTeacherAbsenceExcuses, markTeacherAbsenceExcusePresent, reviewTeacherAbsenceExcuse } from "@/APIs/school/teacherAttendance";
import { resolveAttachmentUrl } from "@/utils/attachmentUrl";


const STATES = [
  { value: "pending", label: "بانتظار القرار", color: "warning" },
  { value: "accepted", label: "مقبولة", color: "success" },
  { value: "rejected", label: "مرفوضة", color: "error" },
  // The teacher was not absent: her attendance was recorded for that day.
  { value: "marked_present", label: "سُجّلت حاضرة", color: "info" },
];

const TeacherAbsenceExcuses = () => {
  const [status, setStatus] = useState("pending");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [checkInAt, setCheckInAt] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => { setDecision(null); setNote(""); setCheckInAt(""); };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const result = await fetchTeacherAbsenceExcuses({ status, from, to });
    if (result?.status === false) {
      setRows([]); setError(result?.message || "تعذر تحميل الأعذار");
    } else {
      const data = result?.data ?? result;
      setRows(Array.isArray(data) ? data : (data?.items || []));
    }
    setLoading(false);
  }, [status, from, to]);

  useEffect(() => { load(); }, [load]);

  const confirm = async () => {
    if (!decision) return;
    if (decision.verdict === "rejected" && !note.trim()) {
      toast.error("اذكر سبب رفض العذر"); return;
    }
    setSaving(true);
    const result = decision.verdict === "present"
      ? await markTeacherAbsenceExcusePresent(decision.row.id, { checkInAt, note })
      : await reviewTeacherAbsenceExcuse(decision.row.id, decision.verdict, note);
    setSaving(false);
    if (result?.status === false) {
      // Already ruled on by someone else: not a failure, the list is stale.
      if (result?.statusCode === 409) { toast.info(result.message); close(); load(); return; }
      toast.error(result?.message || "تعذر حفظ القرار"); return;
    }
    toast.success(result?.message || "تم حفظ القرار");
    close(); load();
  };

  return (
    <Container>
      <Stack spacing={2} sx={{ py: 2 }} dir="rtl">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventBusyRounded sx={{ color: "#244A70" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>أعذار غياب المعلمين</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>مراجعة أسباب الغياب والمرفقات واتخاذ القرار</Typography>
            </Box>
          </Stack>
          <Button size="small" startIcon={<RefreshRounded />} onClick={load}>تحديث</Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "14px" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField select size="small" label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
              {STATES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>
            <TextField type="date" size="small" label="من" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="إلى" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack> : !rows.length ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: "14px" }}>
            <Typography color="text.secondary">لا توجد أعذار بهذه الحالة.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => {
              const state = STATES.find((item) => item.value === row.status) || STATES[0];
              return <Paper key={row.id} variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{row.teacherName || "معلم"}</Typography>
                    <Chip size="small" label={row.date} />
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip size="small" color={state.color} label={state.label} sx={{ fontWeight: 800 }} />
                  </Stack>
                  <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{row.reason}</Typography>
                  {row.attachment ? <Button component="a" href={resolveAttachmentUrl(row.attachment)} target="_blank" rel="noopener noreferrer" size="small" sx={{ alignSelf: "flex-start" }}>عرض المرفق</Button> : null}
                  {row.reviewNote ? <Alert severity={row.status === "rejected" ? "error" : "info"}>{row.reviewNote}</Alert> : null}
                  {row.status === "pending" ? <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => setDecision({ row, verdict: "accepted" })}>قبول</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<CloseRounded />} onClick={() => setDecision({ row, verdict: "rejected" })}>رفض</Button>
                    <Button size="small" variant="outlined" color="info" startIcon={<EventAvailableRounded />} onClick={() => setDecision({ row, verdict: "present" })}>كانت حاضرة</Button>
                  </Stack> : null}
                </Stack>
              </Paper>;
            })}
          </Stack>
        )}
      </Stack>

      <Dialog open={Boolean(decision)} onClose={() => !saving && close()} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>
          {decision?.verdict === "rejected" ? "رفض عذر الغياب"
            : decision?.verdict === "present" ? "تسجيل حضور المعلم"
            : "قبول عذر الغياب"}
        </DialogTitle>
        <DialogContent>
          {decision?.verdict === "rejected" ? (
            <TextField autoFocus fullWidth multiline minRows={3} value={note} onChange={(e) => setNote(e.target.value)} label="سبب الرفض" required inputProps={{ maxLength: 1000 }} sx={{ mt: 1 }} />
          ) : decision?.verdict === "present" ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 14 }}>
                يُسجَّل حضور {decision?.row?.teacherName} ليوم {decision?.row?.date} ويُغلق العذر، فلا يُحتسب هذا اليوم غيابًا.
              </Typography>
              <TextField type="time" size="small" label="وقت الحضور (اختياري)" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)} InputLabelProps={{ shrink: true }} helperText="إن تُرك فارغًا يُعتمد وقت بداية الدوام، فلا يُسجَّل تأخير." />
              <TextField fullWidth multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} label="ملاحظة (اختياري)" placeholder="مثال: رحلة مدرسية مع الطالبات" inputProps={{ maxLength: 1000 }} />
            </Stack>
          ) : (
            <Typography>تأكيد قبول عذر {decision?.row?.teacherName} ليوم {decision?.row?.date}؟</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>إلغاء</Button>
          <Button variant="contained" color={decision?.verdict === "rejected" ? "error" : decision?.verdict === "present" ? "info" : "success"} onClick={confirm} disabled={saving}>{saving ? "جارٍ الحفظ..." : "تأكيد"}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
export default TeacherAbsenceExcuses;
