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
  CloudUploadRounded,
  OpenInNewRounded,
} from "@mui/icons-material";

import { useState } from "react";
import { toast } from "react-toastify";

import { openResidencyFile } from "@/APIs/school/residencyDocuments";

import { RESIDENCY_TYPES, STATUS_META, formatDay } from "./residencyConstants";

const MAX_FILES = 2;
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

const EMPTY = { type: "iqama", otherTypeLabel: "", documentNumber: "", issueDate: "", expiryDate: "" };

/**
 * نموذج رفع وثيقة إقامة، يستخدمه الطالب والمدرسة.
 * onSubmit(values, files) يعيد استجابة الخادم.
 */
export const ResidencyUploadDialog = ({ open, onClose, onSubmit, title = "رفع وثيقة إقامة", note }) => {
  const [values, setValues] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const close = () => {
    if (saving) return;
    setValues(EMPTY);
    setFiles([]);
    setError("");
    onClose();
  };

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const tooBig = picked.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      setError(`حجم الملف «${tooBig.name}» أكبر من 10 ميجابايت`);
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const submit = async () => {
    if (!files.length) return setError("يرجى إرفاق صورة الوثيقة");
    if (values.type === "other" && !values.otherTypeLabel.trim()) return setError("يرجى كتابة اسم الوثيقة");
    if (values.issueDate && values.expiryDate && values.expiryDate <= values.issueDate) {
      return setError("تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار");
    }
    setSaving(true);
    setError("");
    const response = await onSubmit(values, files);
    setSaving(false);
    if (response?.status === false) {
      setError(response.message || "تعذر رفع الوثيقة");
      return;
    }
    toast.success("تم رفع الوثيقة");
    setValues(EMPTY);
    setFiles([]);
    onClose(true);
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {note && <Alert severity="info">{note}</Alert>}
          <TextField select label="نوع الوثيقة" value={values.type} onChange={set("type")} fullWidth>
            {RESIDENCY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          {values.type === "other" && (
            <TextField label="اسم الوثيقة" value={values.otherTypeLabel} onChange={set("otherTypeLabel")} inputProps={{ maxLength: 60 }} fullWidth />
          )}
          <TextField label="رقم الوثيقة (اختياري)" value={values.documentNumber} onChange={set("documentNumber")} inputProps={{ maxLength: 40 }} fullWidth />
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField type="date" label="تاريخ الإصدار (اختياري)" value={values.issueDate} onChange={set("issueDate")} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField type="date" label="تاريخ الانتهاء (اختياري)" value={values.expiryDate} onChange={set("expiryDate")} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>

          <Box>
            <Button component="label" variant="outlined" startIcon={<CloudUploadRounded />} disabled={files.length >= MAX_FILES} sx={{ fontWeight: 800 }}>
              إرفاق صورة أو PDF
              <input hidden type="file" accept={ACCEPT} multiple onChange={pickFiles} />
            </Button>
            <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.7 }}>
              ملفان بحد أقصى (وجه الوثيقة وظهرها)، وحجم كل ملف حتى 10 ميجابايت.
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" mt={1}>
              {files.map((f, i) => (
                <Chip key={i} icon={<AttachFileRounded />} label={f.name} onDelete={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
              ))}
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={submit} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontWeight: 900 }}>
          رفع الوثيقة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ResidencyFileButtons = ({ files = [] }) => {
  const open = async (url) => {
    const r = await openResidencyFile(url);
    if (r?.status === false && !r.silent) toast.error(r.message);
  };
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {files.map((f, i) => (
        <Button key={f.url} size="small" variant="outlined" startIcon={<OpenInNewRounded />} onClick={() => open(f.url)} sx={{ fontWeight: 800 }}>
          {files.length > 1 ? `الملف ${i + 1}` : "عرض الملف"}
        </Button>
      ))}
    </Stack>
  );
};

/** بطاقة وثيقة واحدة: النوع والرقم والتواريخ والحالة والملفات. */
export const ResidencyDocumentCard = ({ doc, actions, highlight = false }) => {
  const meta = STATUS_META[doc.status] || STATUS_META.pending;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: highlight ? "success.main" : undefined }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
        <Typography sx={{ fontWeight: 900 }}>{doc.typeLabel}</Typography>
        <Stack direction="row" gap={0.7}>
          {doc.status === "approved" && doc.isExpired && <Chip size="small" color="error" label="منتهية" />}
          <Chip size="small" color={meta.color} label={meta.label} />
        </Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={{ xs: 0.5, sm: 2.5 }} sx={{ fontSize: 14 }} mb={1}>
        <span>رقم الوثيقة: <b>{doc.documentNumber || "—"}</b></span>
        <span>الإصدار: <b>{formatDay(doc.issueDate)}</b></span>
        <span>الانتهاء: <b>{formatDay(doc.expiryDate)}</b></span>
      </Stack>
      <Typography color="text.secondary" sx={{ fontSize: 12, mb: 1 }}>
        رُفعت في {formatDay(doc.createdAt)} {doc.uploadedByRole === "STUDENT" ? "بواسطة الطالب" : "بواسطة المدرسة"}
      </Typography>
      {doc.status === "rejected" && doc.rejectionReason && (
        <Alert severity="error" sx={{ mb: 1 }}>سبب الرفض: {doc.rejectionReason}</Alert>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
        <ResidencyFileButtons files={doc.files} />
        {actions}
      </Stack>
    </Paper>
  );
};

/** نافذة سبب الرفض. */
export const RejectDialog = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = async () => {
    setSaving(true);
    await onConfirm(reason.trim());
    setSaving(false);
    setReason("");
  };
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle sx={{ fontWeight: 900 }}>رفض الوثيقة</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ fontSize: 14, mb: 1.5 }}>يظهر السبب للطالب ليرفع الوثيقة مرة أخرى.</Typography>
        <TextField autoFocus label="سبب الرفض" value={reason} onChange={(e) => setReason(e.target.value)} multiline minRows={2} inputProps={{ maxLength: 300 }} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button color="error" variant="contained" onClick={confirm} disabled={saving || !reason.trim()} sx={{ fontWeight: 900 }}>رفض</Button>
      </DialogActions>
    </Dialog>
  );
};
