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
  FactCheckRounded,
  RefreshRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  fetchObservations,
  reviewObservation,
} from "@/APIs/school/lessonObservations";

/*
 * سجل ما رآه المشرف في الفصول، وردود المعلمين عليه.
 *
 * الملاحظة رواية شخص عن غياب شخص آخر، كُتبت دونه. تسجيلها ثم عدم سماع رد
 * يجعل السجل قائمة اتهامات — فالمعلم يُسأل، والمدرسة تُجيب.
 *
 * «بلا رد» حالة قائمة بذاتها: ملاحظة لم يردّ عليها المعلم أصلًا غير ملاحظة
 * ردّ عليها وتنتظر قرارًا، وهي التي تبقى في السجل بلا مناقشة.
 */

const STATUSES = [
  { value: "", label: "التأخير والغياب" },
  { value: "unexplained", label: "بلا رد" },
  { value: "pending", label: "ردود تنتظر القرار" },
  { value: "late", label: "التأخير فقط" },
  { value: "absent", label: "الغياب فقط" },
  { value: "present", label: "المرور العادي" },
];

const kindLabel = (status) =>
  status === "late" ? "تأخر" : status === "absent" ? "لم يحضر" : "حاضر";

const kindColor = (status) =>
  status === "late" ? "warning" : status === "absent" ? "error" : "success";

const LessonObservations = () => {
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verdict, setVerdict] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchObservations({ status, dateFrom, dateTo });

    if (!result.status) {
      setError(result.message);
      setRows([]);
      setTotal(0);
    } else {
      setRows(result.data?.items ?? []);
      setTotal(result.data?.total ?? 0);
    }

    setLoading(false);
  }, [status, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmVerdict = async () => {
    if (!verdict) return;

    setSaving(true);
    const result = await reviewObservation(
      verdict.row.observationId,
      verdict.value,
      note
    );
    setSaving(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setVerdict(null);
    setNote("");
    load();
  };

  const rejecting = verdict?.value === "rejected";

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
            <FactCheckRounded sx={{ color: "var(--color-navy, #244A70)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                سجل ملاحظات الحصص
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                ما رُصد في جولة الفصول، وردود المعلمين عليه
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
              label="العرض"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              {STATUSES.map((item) => (
                <MenuItem key={item.value || "all"} value={item.value}>
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
            <Chip size="small" label={`${total} ملاحظة`} sx={{ fontWeight: 800 }} />
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
              لا توجد ملاحظات بهذه الحالة.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => (
              <Paper
                key={row.observationId}
                variant="outlined"
                sx={{ p: 1.6, borderRadius: "14px" }}
              >
                <Stack spacing={0.9}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {row.teacherName || "بدون معلم"}
                    </Typography>
                    <Chip
                      size="small"
                      color={kindColor(row.status)}
                      label={
                        row.status === "late" && row.lateMinutes
                          ? `${kindLabel(row.status)} ${row.lateMinutes} دقيقة`
                          : kindLabel(row.status)
                      }
                      sx={{ fontWeight: 800 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {row.date} · {row.className} · الحصة {row.slot}
                    </Typography>
                  </Stack>

                  {row.note ? (
                    <Typography sx={{ fontSize: 13 }}>{row.note}</Typography>
                  ) : null}

                  <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                    {row.subjectName}
                    {row.recordedByName ? ` · سجّله ${row.recordedByName}` : ""}
                  </Typography>

                  {row.reason ? (
                    <>
                      <Divider />
                      <Typography sx={{ fontSize: 13.5 }}>
                        <strong>رد المعلم:</strong> {row.reason}
                      </Typography>

                      {row.reasonStatus === "pending" ? (
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
                            قبول
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
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          {row.reasonStatus === "accepted" ? "قُبل العذر" : "لم يُقبل العذر"}
                          {row.reasonReviewedByName
                            ? ` — ${row.reasonReviewedByName}`
                            : ""}
                          {row.reasonReviewNote ? ` — ${row.reasonReviewNote}` : ""}
                        </Typography>
                      )}
                    </>
                  ) : row.status !== "present" ? (
                    <Typography
                      sx={{ fontSize: 12, color: "warning.dark", fontWeight: 700 }}
                    >
                      لم يردّ المعلم بعد
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ))}
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
          {rejecting ? "رفض العذر" : "قبول العذر"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {verdict?.row?.teacherName} · {verdict?.row?.date} ·{" "}
              {verdict?.row?.className} · الحصة {verdict?.row?.slot}
            </Typography>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              يصل القرار إلى المعلم فور حفظه، ولا يمكن تغييره بعد ذلك.
            </Alert>

            <TextField
              multiline
              minRows={3}
              size="small"
              label={rejecting ? "سبب الرفض (مطلوب)" : "ملاحظة (اختيارية)"}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              error={rejecting && !note.trim()}
              helperText={
                rejecting && !note.trim()
                  ? "الملاحظة أثر في سجل المعلم، ورفض عذره بلا سبب يتركه بلا شيء يردّ عليه"
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

export default LessonObservations;
