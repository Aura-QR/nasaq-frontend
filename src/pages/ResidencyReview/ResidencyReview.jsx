import { Alert, Box, Button, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import { CheckRounded, CloseRounded } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import { fetchResidencyQueue, reviewResidencyDocument } from "@/APIs/school/residencyDocuments";
import { RejectDialog, ResidencyDocumentCard } from "@/components/Residency/ResidencyParts";
import usePermissions from "@/utils/hooks/usePermissions";

const TABS = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "المقبولة" },
  { value: "rejected", label: "المرفوضة" },
];

/** الوثائق التي رفعها الطلاب وتنتظر قرار المدرسة، والقرارات السابقة. */
const ResidencyReview = () => {
  const permissions = usePermissions("students");
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [rejecting, setRejecting] = useState(null);

  const load = useCallback(async () => {
    setItems(null);
    const r = await fetchResidencyQueue(status);
    if (r?.status === false) {
      setError(r.message);
      setItems([]);
    } else {
      setError("");
      setItems(r?.data ?? r ?? []);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (doc, decision, reason) => {
    setBusy(doc._id);
    const r = await reviewResidencyDocument(doc._id, decision, reason);
    setBusy("");
    if (r?.status === false) return toast.error(r.message);
    toast.success(decision === "approved" ? "تم قبول الوثيقة" : "تم رفض الوثيقة");
    setRejecting(null);
    load();
  };

  return (
    <Container>
      <Box dir="rtl" sx={{ p: { xs: 1, md: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>مراجعة وثائق الإقامة</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          الوثائق التي رفعها الطلاب غير السعوديين من التطبيق أو الموقع.
        </Typography>

        <Tabs value={status} onChange={(_, v) => setStatus(v)} sx={{ mb: 2 }}>
          {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label} sx={{ fontWeight: 800 }} />)}
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {items === null ? (
          <Stack alignItems="center" py={6}><CircularProgress /></Stack>
        ) : items.length === 0 ? (
          <Alert severity="info">{status === "pending" ? "لا توجد وثائق بانتظار المراجعة." : "لا توجد وثائق."}</Alert>
        ) : (
          <Stack spacing={1.5}>
            {items.map((doc) => (
              <Box key={doc._id}>
                <Stack direction="row" gap={1} alignItems="baseline" mb={0.5} flexWrap="wrap">
                  <Typography sx={{ fontWeight: 900 }}>
                    {doc.student ? (
                      <Link to={`/users/students/${doc.student._id}`} style={{ color: "inherit" }}>{doc.student.name}</Link>
                    ) : "طالب محذوف"}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    {[doc.student?.className, doc.student?.nationality].filter(Boolean).join(" · ")}
                  </Typography>
                </Stack>
                <ResidencyDocumentCard
                  doc={doc}
                  actions={
                    doc.status === "pending" && permissions.edit ? (
                      <Stack direction="row" gap={1}>
                        <Button size="small" color="success" variant="contained" startIcon={<CheckRounded />} disabled={busy === doc._id} onClick={() => decide(doc, "approved")} sx={{ fontWeight: 800 }}>
                          قبول
                        </Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<CloseRounded />} disabled={busy === doc._id} onClick={() => setRejecting(doc)} sx={{ fontWeight: 800 }}>
                          رفض
                        </Button>
                      </Stack>
                    ) : null
                  }
                />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      <RejectDialog open={!!rejecting} onClose={() => setRejecting(null)} onConfirm={(reason) => decide(rejecting, "rejected", reason)} />
    </Container>
  );
};

export default ResidencyReview;
