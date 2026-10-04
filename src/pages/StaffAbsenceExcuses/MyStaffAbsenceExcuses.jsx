import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AttachFileRounded,
  CheckCircleRounded,
  EventBusyRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/APIs/Axios";
import {
  fetchMyStaffAbsenceExcuses,
  fetchPendingStaffAbsenceExcuses,
  submitStaffAbsenceExcuse,
  uploadStaffAbsenceExcuseAttachment,
} from "@/APIs/school/staffAttendance";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const STATES = {
  pending: { label: "قيد المراجعة", color: "warning" },
  accepted: { label: "مقبول", color: "success" },
  rejected: { label: "مرفوض", color: "error" },
  marked_present: { label: "سُجِّل حضورًا", color: "info" },
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const resolveAttachmentUrl = (attachment) => {
  if (!attachment) return "";
  const value = String(attachment).trim();
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value, `${API_BASE_URL}/`).href;
  } catch {
    return value;
  }
};

const extractList = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.items || data?.docs || [];
};

const MyStaffAbsenceExcuses = () => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [excuses, setExcuses] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPath, setAttachmentPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pendingResult, excusesResult] = await Promise.all([
      fetchPendingStaffAbsenceExcuses({ days: 14 }),
      fetchMyStaffAbsenceExcuses(),
    ]);

    if (pendingResult?.status === false) {
      toast.error(pendingResult?.message || "تعذر تحميل أيام الغياب");
      setDays([]);
    } else {
      setDays(extractList(pendingResult));
    }

    if (excusesResult?.status === false) {
      toast.error(excusesResult?.message || "تعذر تحميل أعذار الغياب");
      setExcuses([]);
    } else {
      setExcuses(extractList(excusesResult));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialog = () => {
    if (sending || uploading) return;
    setSelectedDay(null);
    setReason("");
    setAttachment(null);
    setAttachmentPath("");
  };

  const pickAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAttachment(file);
    setAttachmentPath("");
    setUploading(true);
    const result = await uploadStaffAbsenceExcuseAttachment(file);
    setUploading(false);

    if (result?.status !== false && result?.data?.attachment) {
      setAttachmentPath(result.data.attachment);
      toast.success("تم رفع المرفق");
    } else {
      setAttachment(null);
      setAttachmentPath("");
      toast.warning(`${result?.message || "تعذر رفع المرفق"} — يمكنك إرسال العذر بدون مرفق`);
    }
  };

  const sendExcuse = async () => {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      toast.error("اكتب سبب الغياب");
      return;
    }

    setSending(true);
    const result = await submitStaffAbsenceExcuse({
      date: selectedDay?.date,
      reason: cleanReason,
      attachment: attachmentPath || undefined,
    });
    setSending(false);

    if (result?.status === false) {
      toast.error(result?.message || "تعذر إرسال عذر الغياب");
      return;
    }

    toast.success(result?.message || "تم إرسال عذر الغياب إلى إدارة المدرسة");
    closeDialog();
    await load();
  };

  const subtitle = useMemo(() => {
    if (loading) return "جارٍ تحميل بيانات الغياب...";
    if (!days.length) return "لا توجد أيام غياب تحتاج إلى توضيح";
    return `لديك ${days.length} ${days.length === 1 ? "يوم غياب يحتاج إلى توضيح" : "أيام غياب تحتاج إلى توضيح"}`;
  }, [days.length, loading]);

  return (
    <Box dir="rtl" sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f7f5ef" }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#173e61" }}>أعذار الغياب</Typography>
            <Typography sx={{ color: "#6f7c88", mt: .4 }}>{subtitle}</Typography>
          </Box>
          <Button startIcon={<RefreshRounded />} onClick={load} disabled={loading}>تحديث</Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <EventBusyRounded sx={{ color: "#bd7a13" }} />
            <Typography sx={{ fontWeight: 900 }}>أيام غياب تحتاج إلى توضيح</Typography>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={26} /></Stack>
          ) : !days.length ? (
            <Alert severity="success">لا توجد أيام غياب تحتاج إلى توضيح حاليًا.</Alert>
          ) : (
            <Stack spacing={1}>
              {days.map((day) => (
                <Paper key={day.date} variant="outlined" sx={{ p: 1.4, borderRadius: 2.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
                    <Typography sx={{ fontWeight: 800 }}>{formatDate(day.date)}</Typography>
                    <Button variant="contained" size="small" onClick={() => setSelectedDay(day)} sx={{ bgcolor: "#23a69a", fontWeight: 800 }}>
                      توضيح السبب
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 900, mb: 1.5 }}>أعذاري السابقة</Typography>
          {!loading && !excuses.length ? (
            <Typography color="text.secondary">لا توجد أعذار مسجلة.</Typography>
          ) : (
            <Stack spacing={1}>
              {excuses.map((row) => {
                const state = STATES[row.status] || STATES.pending;
                return (
                  <Paper key={row.id || `${row.date}-${row.submittedAt}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                    <Stack spacing={.8}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 900 }}>{formatDate(row.date)}</Typography>
                        <Chip size="small" color={state.color} label={state.label} sx={{ fontWeight: 800 }} />
                        {row.enteredBySchool ? <Chip size="small" variant="outlined" label="سجّلته الإدارة" /> : null}
                      </Stack>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.reason}</Typography>
                      {row.reviewNote ? <Alert severity={row.status === "rejected" ? "error" : "info"}>{row.reviewNote}</Alert> : null}
                      {row.attachment ? (
                        <Button component="a" href={resolveAttachmentUrl(row.attachment)} target="_blank" rel="noopener noreferrer" size="small" sx={{ alignSelf: "flex-start" }}>
                          عرض المرفق
                        </Button>
                      ) : null}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>

      <Dialog open={Boolean(selectedDay)} onClose={closeDialog} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>توضيح سبب الغياب</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1.5, color: "text.secondary" }}>{formatDate(selectedDay?.date)}</Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            label="سبب الغياب"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            inputProps={{ maxLength: 1000 }}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Button component="label" variant="outlined" startIcon={attachmentPath ? <CheckCircleRounded /> : <AttachFileRounded />} disabled={uploading || sending}>
              {uploading ? "جارٍ رفع المرفق..." : attachmentPath ? "تم إرفاق الملف" : "إرفاق ملف اختياري"}
              <input hidden type="file" accept="image/*,application/pdf" onChange={pickAttachment} />
            </Button>
            {attachment ? <Typography noWrap sx={{ maxWidth: 160, fontSize: 12 }}>{attachment.name}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={sending || uploading}>إلغاء</Button>
          <Button variant="contained" onClick={sendExcuse} disabled={sending || uploading} sx={{ bgcolor: "#23a69a" }}>
            {sending ? "جارٍ الإرسال..." : "إرسال العذر"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyStaffAbsenceExcuses;
