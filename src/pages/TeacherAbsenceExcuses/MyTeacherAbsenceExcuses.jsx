import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  AttachFileRounded,
  CheckCircleRounded,
  EventBusyRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  fetchPendingTeacherAbsenceExcuses,
  submitTeacherAbsenceExcuse,
  uploadTeacherAbsenceExcuseAttachment,
} from "@/APIs/school/teacherAttendance";

const DATE_LOCALE = "ar-EG-u-nu-latn";

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

const MyTeacherAbsenceExcuses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPath, setAttachmentPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadDays = useCallback(async () => {
    setLoading(true);
    const response = await fetchPendingTeacherAbsenceExcuses({ days: 14 });
    if (response?.status) {
      setDays(Array.isArray(response?.data) ? response.data : []);
    } else {
      setDays([]);
      toast.error(response?.message || "تعذر تحميل أيام الغياب");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  const closeDialog = () => {
    if (sending || uploading) return;
    setSelectedDay(null);
    setReason("");
    setReasonError("");
    setAttachment(null);
    setAttachmentPath("");
  };

  const openDay = (day) => {
    setSelectedDay(day);
    setReason("");
    setReasonError("");
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

    const response = await uploadTeacherAbsenceExcuseAttachment(file);
    setUploading(false);

    if (response?.status && response?.data?.attachment) {
      setAttachmentPath(response.data.attachment);
      toast.success("تم رفع المرفق");
      return;
    }

    // The API explicitly allows sending the excuse without an attachment.
    setAttachment(null);
    setAttachmentPath("");
    toast.warning(
      `${response?.message || "تعذر رفع المرفق"} — يمكنك إرسال العذر بدون مرفق`
    );
  };

  const sendExcuse = async () => {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setReasonError("اكتب سبب الغياب");
      return;
    }

    setSending(true);
    const response = await submitTeacherAbsenceExcuse({
      date: selectedDay?.date,
      reason: cleanReason,
      attachment: attachmentPath || undefined,
    });
    setSending(false);

    if (response?.status) {
      toast.success(response?.message || "تم إرسال عذر الغياب إلى إدارة المدرسة");
      closeDialog();
      await loadDays();
      return;
    }

    if (Number(response?.statusCode) === 409) {
      toast.info(response?.message || "تم إرسال عذر عن هذا اليوم بالفعل");
      closeDialog();
      await loadDays();
      return;
    }

    toast.error(response?.message || "تعذر إرسال عذر الغياب");
  };

  const subtitle = useMemo(() => {
    if (loading) return "جارٍ تحميل أيام الغياب...";
    if (!days.length) return "لا توجد أيام غياب تحتاج عذرًا خلال آخر 14 يومًا";
    return `لديك ${days.length} ${days.length === 1 ? "يوم غياب يحتاج عذرًا" : "أيام غياب تحتاج عذرًا"}`;
  }, [days.length, loading]);

  return (
    <Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: "#f7f5ef", p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1050, mx: "auto" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton onClick={() => navigate("/teacher/dashboard")} sx={{ bgcolor: "#fff" }}>
              <ArrowBackRounded />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "#12385b" }}>
                غيابي وأعذاري
              </Typography>
              <Typography sx={{ mt: 0.4, color: "#6f7c88", fontSize: 14 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<RefreshRounded />}
            onClick={loadDays}
            disabled={loading}
            sx={{ fontWeight: 800, borderRadius: 2.5 }}
          >
            تحديث
          </Button>
        </Stack>

        {loading ? (
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: "center" }}>
            <CircularProgress size={30} />
          </Paper>
        ) : !days.length ? (
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center", border: "1px solid #ece7db" }}>
            <CheckCircleRounded sx={{ fontSize: 54, color: "#23a69a", mb: 1.5 }} />
            <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#12385b" }}>
              لا يوجد غياب يحتاج عذرًا حاليًا
            </Typography>
            <Typography sx={{ color: "#77838e", mt: 0.8 }}>
              ستظهر هنا أيام الغياب غير المبررة خلال آخر 14 يومًا.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              اختر يوم الغياب ثم اضغط «تقديم عذر». المرفق الطبي اختياري.
            </Alert>

            {days.map((day) => (
              <Paper
                key={day.date}
                sx={{
                  p: 2.2,
                  borderRadius: 3.5,
                  border: "1px solid #ece3cf",
                  boxShadow: "0 7px 22px rgba(23, 47, 71, 0.05)",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#fff2df",
                        color: "#bd7a13",
                      }}
                    >
                      <EventBusyRounded />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: "#173e61" }}>
                        غياب بدون عذر
                      </Typography>
                      <Typography sx={{ color: "#6f7c88", fontSize: 13.5, mt: 0.3 }}>
                        {formatDate(day.date)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={() => openDay(day)}
                    sx={{ fontWeight: 900, borderRadius: 2.5, px: 3, bgcolor: "#23a69a" }}
                  >
                    تقديم عذر
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog open={Boolean(selectedDay)} onClose={closeDialog} fullWidth maxWidth="xs" dir="rtl" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 900, color: "#12385b" }}>
          تقديم عذر غياب
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#64727f", fontSize: 13.5, mb: 1.5 }}>
            يوم الغياب: <strong>{formatDate(selectedDay?.date)}</strong>
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError("");
            }}
            placeholder="مثال: وعكة صحية"
            inputProps={{ maxLength: 1000 }}
            error={Boolean(reasonError)}
            helperText={reasonError || "يُرسل العذر مرة واحدة ولا يمكن تعديله بعد الإرسال."}
          />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={attachmentPath ? <CheckCircleRounded /> : <AttachFileRounded />}
              disabled={uploading || sending}
              sx={{ fontWeight: 800, borderRadius: 2.5 }}
            >
              {uploading ? "جارٍ رفع الملف..." : attachmentPath ? "تم إرفاق الملف" : "إرفاق ملف اختياري"}
              <input hidden type="file" accept="image/*,application/pdf" onChange={pickAttachment} />
            </Button>
            {attachment ? (
              <Typography noWrap sx={{ maxWidth: 150, color: "#7b8791", fontSize: 11.5 }}>
                {attachment.name}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={sending || uploading} sx={{ fontWeight: 800 }}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={sendExcuse}
            disabled={sending || uploading}
            sx={{ fontWeight: 900, bgcolor: "#23a69a" }}
          >
            {sending ? "جارٍ الإرسال..." : "إرسال العذر"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTeacherAbsenceExcuses;
