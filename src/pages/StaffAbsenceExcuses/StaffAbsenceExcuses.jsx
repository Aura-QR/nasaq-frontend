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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AttachFileRounded,
  CheckCircleRounded,
  CloseRounded,
  EventAvailableRounded,
  EventBusyRounded,
  PersonAddAltRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import { API_BASE_URL } from "@/APIs/Axios";
import {
  createStaffAbsenceExcuse,
  fetchStaffAbsenceExcuses,
  fetchStaffDirectory,
  markStaffAbsenceExcusePresent,
  reviewStaffAbsenceExcuse,
  uploadStaffAbsenceExcuseAttachment,
} from "@/APIs/school/staffAttendance";

const STATES = [
  { value: "pending", label: "قيد المراجعة", color: "warning" },
  { value: "accepted", label: "مقبول", color: "success" },
  { value: "rejected", label: "مرفوض", color: "error" },
  { value: "marked_present", label: "سُجِّل حضورًا", color: "info" },
];

const normalizeId = (value) => {
  if (value && typeof value === "object") return String(value._id || value.id || "").trim();
  return String(value || "").trim();
};

const extractList = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.items || data?.docs || data?.staff || [];
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

const StaffAbsenceExcuses = () => {
  const getAuthUser = useAuthUser();
  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;
  const currentUserId = normalizeId(currentUser);

  const [status, setStatus] = useState("pending");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [staffId, setStaffId] = useState("");
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [checkInAt, setCheckInAt] = useState("");
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStaffId, setCreateStaffId] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [createAttachment, setCreateAttachment] = useState(null);
  const [createAttachmentPath, setCreateAttachmentPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const availableStaff = useMemo(
    () => staff.filter((item) => normalizeId(item) !== currentUserId),
    [staff, currentUserId]
  );

  const loadDirectory = useCallback(async () => {
    const result = await fetchStaffDirectory();
    if (result?.status === false) {
      toast.error(result?.message || "تعذر تحميل قائمة الموظفين");
      setStaff([]);
      return;
    }
    setStaff(extractList(result));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchStaffAbsenceExcuses({ status, from, to, staffId });
    if (result?.status === false) {
      setRows([]);
      toast.error(result?.message || "تعذر تحميل أعذار الغياب");
    } else {
      setRows(extractList(result));
    }
    setLoading(false);
  }, [status, from, to, staffId]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    load();
  }, [load]);

  const closeDecision = () => {
    if (saving) return;
    setDecision(null);
    setNote("");
    setCheckInAt("");
  };

  const confirmDecision = async () => {
    if (!decision) return;
    if (decision.verdict === "rejected" && !note.trim()) {
      toast.error("ملاحظة الرفض مطلوبة");
      return;
    }

    setSaving(true);
    const result = decision.verdict === "present"
      ? await markStaffAbsenceExcusePresent(decision.row.id, { checkInAt, note })
      : await reviewStaffAbsenceExcuse(decision.row.id, decision.verdict, note);
    setSaving(false);

    if (result?.status === false) {
      if (Number(result?.statusCode) === 409) {
        toast.info(result?.message || "تمت مراجعة هذا العذر بالفعل");
        closeDecision();
        load();
        return;
      }
      toast.error(result?.message || "تعذر حفظ القرار");
      return;
    }

    toast.success(result?.message || "تم حفظ القرار");
    closeDecision();
    load();
  };

  const resetCreate = () => {
    if (creating || uploading) return;
    setCreateOpen(false);
    setCreateStaffId("");
    setCreateDate("");
    setCreateReason("");
    setCreateAttachment(null);
    setCreateAttachmentPath("");
  };

  const pickAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCreateAttachment(file);
    setCreateAttachmentPath("");
    setUploading(true);
    const result = await uploadStaffAbsenceExcuseAttachment(file);
    setUploading(false);

    if (result?.status !== false && result?.data?.attachment) {
      setCreateAttachmentPath(result.data.attachment);
      toast.success("تم رفع المرفق");
    } else {
      setCreateAttachment(null);
      setCreateAttachmentPath("");
      toast.warning(`${result?.message || "تعذر رفع المرفق"} — يمكنك المتابعة بدون مرفق`);
    }
  };

  const createExcuse = async () => {
    if (!createStaffId || !createDate || !createReason.trim()) {
      toast.error("الموظف والتاريخ وسبب الغياب مطلوبة");
      return;
    }

    setCreating(true);
    const result = await createStaffAbsenceExcuse({
      staffId: createStaffId,
      date: createDate,
      reason: createReason.trim(),
      attachment: createAttachmentPath || undefined,
    });
    setCreating(false);

    if (result?.status === false) {
      toast.error(result?.message || "تعذر تسجيل عذر الغياب");
      return;
    }

    toast.success(result?.message || "تم تسجيل عذر الغياب واعتماده");
    resetCreate();
    setStatus("accepted");
    await loadDirectory();
  };

  return (
    <Container>
      <Stack spacing={2} sx={{ py: 2 }} dir="rtl">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventBusyRounded sx={{ color: "#244A70" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>أعذار غياب الموظفين</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>مراجعة الأعذار أو تسجيل عذر نيابةً عن الموظف</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<PersonAddAltRounded />} onClick={() => setCreateOpen(true)}>
              تسجيل عذر لموظف
            </Button>
            <Button startIcon={<RefreshRounded />} onClick={load} disabled={loading}>تحديث</Button>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "14px" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1}>
            <TextField select size="small" label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
              {STATES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>
            <TextField type="date" size="small" label="من" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="إلى" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select size="small" label="الموظف" value={staffId} onChange={(e) => setStaffId(e.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="">الكل</MenuItem>
              {staff.map((item) => (
                <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                  {item.fullName || item.name || item.username || "موظف"}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
        ) : !rows.length ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: "14px" }}>
            <Typography color="text.secondary">لا توجد أعذار بهذه الحالة.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => {
              const state = STATES.find((item) => item.value === row.status) || STATES[0];
              return (
                <Paper key={row.id} variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{row.staffName || "موظف"}</Typography>
                      <Chip size="small" label={row.date} />
                      <Chip size="small" variant="outlined" label={row.role === "STAFF" ? "موظف خدمات" : row.role === "SUPERVISOR" ? "مشرف/ة" : "إداري/ة"} />
                      {row.enteredBySchool ? <Chip size="small" variant="outlined" label="سجّلته الإدارة" /> : null}
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip size="small" color={state.color} label={state.label} sx={{ fontWeight: 800 }} />
                    </Stack>
                    <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{row.reason}</Typography>
                    {row.recordedByName ? <Typography sx={{ fontSize: 12, color: "text.secondary" }}>سجّله: {row.recordedByName}</Typography> : null}
                    {row.reviewNote ? <Alert severity={row.status === "rejected" ? "error" : "info"}>{row.reviewNote}</Alert> : null}
                    {row.attachment ? (
                      <Button component="a" href={resolveAttachmentUrl(row.attachment)} target="_blank" rel="noopener noreferrer" size="small" sx={{ alignSelf: "flex-start" }}>
                        عرض المرفق
                      </Button>
                    ) : null}
                    {row.status === "pending" ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => setDecision({ row, verdict: "accepted" })}>قبول</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<CloseRounded />} onClick={() => setDecision({ row, verdict: "rejected" })}>رفض</Button>
                        <Button size="small" variant="outlined" color="info" startIcon={<EventAvailableRounded />} onClick={() => setDecision({ row, verdict: "present" })}>تسجيل حضور</Button>
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Dialog open={Boolean(decision)} onClose={closeDecision} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>
          {decision?.verdict === "rejected" ? "رفض عذر الغياب" : decision?.verdict === "present" ? "تسجيل حضور" : "قبول عذر الغياب"}
        </DialogTitle>
        <DialogContent>
          {decision?.verdict === "rejected" ? (
            <TextField autoFocus fullWidth multiline minRows={3} value={note} onChange={(e) => setNote(e.target.value)} label="ملاحظة الرفض" required sx={{ mt: 1 }} />
          ) : decision?.verdict === "present" ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography>سيُسجَّل حضور {decision?.row?.staffName} ليوم {decision?.row?.date} ويُغلق العذر.</Typography>
              <TextField type="time" size="small" label="وقت الحضور (اختياري)" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)} InputLabelProps={{ shrink: true }} helperText="إن تُرك فارغًا يُعتمد وقت بداية الدوام." />
              <TextField fullWidth multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} label="ملاحظة (اختياري)" />
            </Stack>
          ) : (
            <Typography sx={{ mt: 1 }}>تأكيد قبول عذر {decision?.row?.staffName} ليوم {decision?.row?.date}؟</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDecision} disabled={saving}>إلغاء</Button>
          <Button variant="contained" onClick={confirmDecision} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "تأكيد"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={resetCreate} dir="rtl" fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>تسجيل عذر لموظف</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField select label="الموظف" value={createStaffId} onChange={(e) => setCreateStaffId(e.target.value)} required>
              {availableStaff.map((item) => (
                <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                  {item.fullName || item.name || item.username || "موظف"}
                </MenuItem>
              ))}
            </TextField>
            <TextField type="date" label="التاريخ" value={createDate} onChange={(e) => setCreateDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
            <TextField multiline minRows={4} label="سبب الغياب" value={createReason} onChange={(e) => setCreateReason(e.target.value)} required inputProps={{ maxLength: 1000 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button component="label" variant="outlined" startIcon={createAttachmentPath ? <CheckCircleRounded /> : <AttachFileRounded />} disabled={uploading || creating}>
                {uploading ? "جارٍ رفع المرفق..." : createAttachmentPath ? "تم إرفاق الملف" : "مرفق اختياري"}
                <input hidden type="file" accept="image/*,application/pdf" onChange={pickAttachment} />
              </Button>
              {createAttachment ? <Typography noWrap sx={{ maxWidth: 220, fontSize: 12 }}>{createAttachment.name}</Typography> : null}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetCreate} disabled={creating || uploading}>إلغاء</Button>
          <Button variant="contained" onClick={createExcuse} disabled={creating || uploading}>
            {creating ? "جارٍ الحفظ..." : "تسجيل واعتماد العذر"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffAbsenceExcuses;
