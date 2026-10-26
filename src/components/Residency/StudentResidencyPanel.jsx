import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { CheckRounded, CloseRounded, DeleteOutlineRounded, UploadFileRounded } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  deleteResidencyDocument,
  fetchStudentResidency,
  reviewResidencyDocument,
  uploadStudentResidency,
} from "@/APIs/school/residencyDocuments";
import { RejectDialog, ResidencyDocumentCard, ResidencyUploadDialog } from "./ResidencyParts";

/**
 * وثيقة إقامة الطالب غير السعودي في صفحة الطالب: الوثيقة المعتمدة، وما ينتظر
 * المراجعة، والسجل السابق، مع الرفع والقبول والرفض.
 */
const StudentResidencyPanel = ({ studentId, canEdit }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const r = await fetchStudentResidency(studentId);
    if (r?.status === false) setError(r.message);
    else {
      setError("");
      setData(r?.data ?? r);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) load();
  }, [studentId, load]);

  const decide = async (doc, decision, reason) => {
    setBusy(doc._id);
    const r = await reviewResidencyDocument(doc._id, decision, reason);
    setBusy("");
    if (r?.status === false) return toast.error(r.message);
    toast.success(decision === "approved" ? "تم قبول الوثيقة" : "تم رفض الوثيقة");
    setRejecting(null);
    load();
  };

  const remove = async (doc) => {
    if (!window.confirm("حذف هذه الوثيقة وملفاتها نهائيًا؟")) return;
    setBusy(doc._id);
    const r = await deleteResidencyDocument(doc._id);
    setBusy("");
    if (r?.status === false) return toast.error(r.message);
    toast.success("تم حذف الوثيقة");
    load();
  };

  const documents = data?.documents ?? [];
  const current = data?.current;
  const pending = documents.filter((d) => d.status === "pending");
  const history = documents.filter((d) => d.status !== "pending" && d._id !== current?._id);

  const actionsFor = (doc) =>
    canEdit ? (
      <Stack direction="row" gap={1}>
        {doc.status === "pending" && (
          <>
            <Button size="small" color="success" variant="contained" startIcon={<CheckRounded />} disabled={busy === doc._id} onClick={() => decide(doc, "approved")} sx={{ fontWeight: 800 }}>
              قبول
            </Button>
            <Button size="small" color="error" variant="outlined" startIcon={<CloseRounded />} disabled={busy === doc._id} onClick={() => setRejecting(doc)} sx={{ fontWeight: 800 }}>
              رفض
            </Button>
          </>
        )}
        <Button size="small" color="inherit" startIcon={<DeleteOutlineRounded />} disabled={busy === doc._id} onClick={() => remove(doc)}>
          حذف
        </Button>
      </Stack>
    ) : null;

  return (
    <Paper elevation={0} sx={{ p: { xs: 1.5, md: 1.9 }, border: "1px solid rgba(36, 74, 112, 0.08)", borderRadius: "20px", backgroundColor: "var(--color-cream)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} gap={1} flexWrap="wrap">
        <Box>
          <Typography component="h2" sx={{ color: "var(--color-navy-deep)", fontSize: "16px", fontWeight: 800 }}>
            وثيقة الإقامة
          </Typography>
          <Typography sx={{ color: "var(--color-muted)", fontSize: "11px" }}>
            إقامة أو تأشيرة زيارة أو جواز سفر، للطلاب غير السعوديين.
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<UploadFileRounded />} onClick={() => setUploadOpen(true)} sx={{ fontWeight: 900, bgcolor: "var(--color-navy)" }}>
            رفع وثيقة
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <Stack alignItems="center" py={2}><CircularProgress size={24} /></Stack>}

      {data && (
        <Stack spacing={1.2}>
          {pending.map((doc) => (
            <ResidencyDocumentCard key={doc._id} doc={doc} actions={actionsFor(doc)} />
          ))}
          {current ? (
            <ResidencyDocumentCard doc={current} highlight actions={actionsFor(current)} />
          ) : (
            !pending.length && <Alert severity="warning">لا توجد وثيقة إقامة معتمدة لهذا الطالب.</Alert>
          )}
          {history.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 800, fontSize: 13, color: "var(--color-muted)", pt: 1 }}>الوثائق السابقة</Typography>
              {history.map((doc) => (
                <ResidencyDocumentCard key={doc._id} doc={doc} actions={actionsFor(doc)} />
              ))}
            </>
          )}
        </Stack>
      )}

      <ResidencyUploadDialog
        open={uploadOpen}
        note="الوثيقة التي ترفعها المدرسة تُعتمد مباشرة."
        onClose={(saved) => {
          setUploadOpen(false);
          if (saved) load();
        }}
        onSubmit={(values, files) => uploadStudentResidency(studentId, values, files)}
      />
      <RejectDialog open={!!rejecting} onClose={() => setRejecting(null)} onConfirm={(reason) => decide(rejecting, "rejected", reason)} />
    </Paper>
  );
};

export default StudentResidencyPanel;
