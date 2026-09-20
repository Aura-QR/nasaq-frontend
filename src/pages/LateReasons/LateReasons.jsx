import { useCallback, useEffect, useState } from "react";

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
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CancelRounded,
  CheckCircleRounded,
  RefreshRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  fetchLateReasons,
  reviewLateReason,
} from "@/APIs/school/teacherAttendance";

/*
 * تأخيرات المعلمين وما قيل فيها.
 *
 * الشرح كان يُخزَّن ولا يُعرض: يرى المدير «٢٠ دقيقة» ويقف عندها، والسبب في
 * حقل لا تعرضه شاشة ولا يُعلَّق عليه قرار. فالمعلم يكتب في فراغ، ثم يتوقف عن
 * الكتابة — وهذه الشاشة هي الطرف الآخر من السؤال.
 *
 * أربع حالات لا ثلاث: «بلا عذر» تأخير لم يُشرح أصلًا، وهو مشكلة أخرى غير
 * التأخير المشروح المنتظر قرارًا، وغالبًا هو ما يبحث عنه المدير.
 */

const STATUSES = [
  { value: "pending", label: "بانتظار القرار", color: "warning" },
  { value: "missing", label: "بلا عذر", color: "error" },
  { value: "accepted", label: "مقبولة", color: "success" },
  { value: "rejected", label: "مرفوضة", color: "error" },
];

const statusMeta = (value) =>
  STATUSES.find((item) => item.value === value) ?? STATUSES[0];

const LateReasons = () => {
  const [status, setStatus] = useState("pending");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verdict, setVerdict] = useState(null); // { row, value }
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchLateReasons({ status, dateFrom, dateTo });

    if (result?.status === false) {
      setError(result.message);
      setRows([]);
      setTotal(0);
    } else {
      const payload = result?.data ?? result;
      setRows(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
    }

    setLoading(false);
  }, [status, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmVerdict = async () => {
    if (!verdict) return;

    setSaving(true);
    const result = await reviewLateReason(
      verdict.row.attendanceId,
      verdict.value,
      note
    );
    setSaving(false);

    if (result?.status === false) {
      toast.error(result.message);
      return;
    }

    toast.success(result?.message || "تم حفظ القرار");
    setVerdict(null);
    setNote("");
    load();
  };

  const rejecting = verdict?.value === "rejected";
  const showingMissing = status === "missing";

  return (
    <Container>
      <Stack spacing={2} sx={{ py: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ScheduleRounded sx={{ color: "var(--color-navy, #244A70)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                أعذار التأخير
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                ما ذكره المعلمون عن تأخيرهم، وقرار المدرسة فيه
              </Typography>
            </Box>
          </Stack>

          <Button
            size="small"
            startIcon={<RefreshRounded />}
            onClick={load}
            sx={{ borderRadius: "10px" }}
          >
            تحديث
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "14px" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ md: "center" }}
          >
            <TextField
              select
              size="small"
              label="الحالة"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              {STATUSES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              size="small"
              label="من"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              label="إلى"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`${total} سجل`} sx={{ fontWeight: 800 }} />
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : rows.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 5, borderRadius: "14px", textAlign: "center" }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              {showingMissing
                ? "كل تأخير في هذه الفترة له عذر مكتوب."
                : status === "pending"
                  ? "لا توجد أعذار تنتظر القرار."
                  : "لا توجد سجلات بهذه الحالة."}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => {
              const meta = statusMeta(
                row.lateReason ? row.lateReasonStatus : "missing"
              );

              return (
                <Paper
                  key={row.attendanceId}
                  variant="outlined"
                  sx={{ p: 1.6, borderRadius: "14px" }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                        {row.teacherName}
                      </Typography>
                      <Chip size="small" label={row.date} />
                      <Chip
                        size="small"
                        color="warning"
                        label={`تأخر ${row.lateMinutes} دقيقة`}
                        sx={{ fontWeight: 800 }}
                      />
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        size="small"
                        color={meta.color}
                        label={meta.label}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>

                    {row.lateReason ? (
                      <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                        {row.lateReason}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{ fontSize: 13, color: "text.secondary" }}
                      >
                        لم يذكر المعلم سببًا لهذا التأخير.
                      </Typography>
                    )}

                    {row.lateReason && row.lateReasonStatus === "pending" ? (
                      <>
                        <Divider />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleRounded />}
                            onClick={() => {
                              setVerdict({ row, value: "accepted" });
                              setNote("");
                            }}
                            sx={{ borderRadius: "10px" }}
                          >
                            قبول العذر
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelRounded />}
                            onClick={() => {
                              setVerdict({ row, value: "rejected" });
                              setNote("");
                            }}
                            sx={{ borderRadius: "10px" }}
                          >
                            رفض
                          </Button>
                        </Stack>
                      </>
                    ) : row.lateReasonStatus ? (
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary" }}
                      >
                        {row.lateReasonReviewedByName
                          ? `راجعه ${row.lateReasonReviewedByName}`
                          : "تمت المراجعة"}
                        {row.lateReasonReviewNote
                          ? ` — ${row.lateReasonReviewNote}`
                          : ""}
                      </Typography>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={Boolean(verdict)}
        onClose={() => (saving ? null : setVerdict(null))}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 16 }}>
          {rejecting ? "رفض عذر التأخير" : "قبول عذر التأخير"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {verdict?.row?.teacherName} · {verdict?.row?.date} · تأخر{" "}
              {verdict?.row?.lateMinutes} دقيقة
            </Typography>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              يصل القرار إلى المعلم فور حفظه، ولا يمكن تغييره بعد ذلك.
            </Alert>

            <TextField
              multiline
              minRows={3}
              size="small"
              label={rejecting ? "سبب الرفض (مطلوب)" : "ملاحظة (اختيارية)"}
              placeholder={
                rejecting
                  ? "مثال: التأخير متكرر هذا الأسبوع"
                  : "تُعرض للمعلم مع القبول"
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
              error={rejecting && !note.trim()}
              helperText={
                rejecting && !note.trim()
                  ? "الرفض يترك أثرًا في سجل المعلم، وبلا سبب يتركه بلا شيء يردّ عليه"
                  : " "
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVerdict(null)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color={rejecting ? "error" : "success"}
            onClick={confirmVerdict}
            disabled={saving || (rejecting && !note.trim())}
            sx={{ borderRadius: "10px" }}
          >
            {saving ? "جارٍ الحفظ…" : rejecting ? "تأكيد الرفض" : "تأكيد القبول"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LateReasons;
