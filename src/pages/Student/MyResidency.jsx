import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { UploadFileRounded } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Container from "@/components/Container/Container";
import { fetchMyResidency, isSaudiStudent, uploadMyResidency } from "@/APIs/school/residencyDocuments";
import { ResidencyDocumentCard, ResidencyUploadDialog } from "@/components/Residency/ResidencyParts";

/** يرفع الطالب (ولي الأمر) وثيقة إقامته، فتراجعها المدرسة. */
const MyResidency = () => {
  const { studentProfile } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const r = await fetchMyResidency();
    if (r?.status === false) setError(r.message);
    else {
      setError("");
      setData(r?.data ?? r);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saudi = studentProfile && isSaudiStudent(studentProfile);
  const documents = data?.documents ?? [];
  const latest = documents[0];
  const current = data?.current;

  let state = null;
  if (latest?.status === "pending") state = <Alert severity="info">وثيقتك قيد المراجعة لدى المدرسة.</Alert>;
  else if (latest?.status === "rejected") state = <Alert severity="error">رفضت المدرسة الوثيقة الأخيرة: {latest.rejectionReason}. يرجى رفعها مرة أخرى.</Alert>;
  else if (current?.isExpired) state = <Alert severity="error">انتهت صلاحية وثيقتك. يرجى رفع وثيقة سارية.</Alert>;
  else if (!current) state = <Alert severity="warning">لم تُرفع وثيقة إقامة بعد. يرجى رفع صورة الإقامة أو تأشيرة الزيارة.</Alert>;

  return (
    <Container noSidebar>
      <Box dir="rtl" sx={{ p: { xs: 1, md: 2 }, maxWidth: 820, mx: "auto" }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", border: "1px solid rgba(36, 74, 112, 0.08)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#122f4d" }}>وثيقة الإقامة</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                تطلبها المدرسة للطلاب غير السعوديين، وتراجعها قبل اعتمادها.
              </Typography>
            </Box>
            {!saudi && (
              <Button variant="contained" startIcon={<UploadFileRounded />} onClick={() => setOpen(true)} sx={{ fontWeight: 900, bgcolor: "#244a70" }}>
                رفع وثيقة
              </Button>
            )}
          </Stack>

          {saudi ? (
            <Alert severity="success">لا تلزمك وثيقة إقامة.</Alert>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !data ? (
            <Stack alignItems="center" py={4}><CircularProgress /></Stack>
          ) : (
            <Stack spacing={1.5}>
              {state}
              {documents.map((doc) => (
                <ResidencyDocumentCard key={doc._id} doc={doc} highlight={doc._id === current?._id} />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <ResidencyUploadDialog
        open={open}
        note="تُرسل الوثيقة إلى المدرسة للمراجعة، وتصلك رسالة بالقرار."
        onClose={(saved) => {
          setOpen(false);
          if (saved) load();
        }}
        onSubmit={uploadMyResidency}
      />
    </Container>
  );
};

export default MyResidency;
