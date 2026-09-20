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
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AttachFileRounded,
  CheckCircleRounded,
  CancelRounded,
  EventBusyRounded,
  RefreshRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  fetchAbsenceExcuses,
  reviewAbsenceExcuse,
} from "@/APIs/school/absenceExcuses";

/*
 * أعذار الغياب — ما ترد به الأسرة، وقرار المدرسة فيه.
 *
 * إشعار الغياب يطلب بيان السبب وإرفاق العذر الطبي. هذه الشاشة هي الطرف الآخر
 * من الطلب: بدونها كانت المدرسة تسأل ولا تسمع، والأسرة تكتب ولا تُجاب — وهو
 * أسوأ من ألا تسأل، لأنه يُعلّم الناس تجاهل ما يصلهم.
 *
 * تفتح على «قيد المراجعة» لأنها قائمة تُفرَّغ لا تُتصفَّح.
 */

const STATUSES = [
  { value: "pending", label: "قيد المراجعة", color: "warning" },
  { value: "accepted", label: "مقبولة", color: "success" },
  { value: "rejected", label: "مرفوضة", color: "error" },
];

const statusMeta = (value) =>
  STATUSES.find((item) => item.value === value) ?? STATUSES[0];

const AbsenceExcuses = () => {
  const [status, setStatus] = useState("pending");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // القرار يُتخذ في نافذة لا في السطر: الرفض يلزمه سبب مكتوب، وسطر الجدول
  // لا يتسع لحقل نص يُقرأ قبل الضغط.
  const [verdict, setVerdict] = useState(null); // { row, value }
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchAbsenceExcuses({ status, from, to, limit: 50 });

    if (!result.status) {
      setError(result.message);
      setRows([]);
    } else {
      setRows(result.data?.items ?? []);
      setTotal(result.data?.total ?? 0);
    }

    setLoading(false);
  }, [status, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const openVerdict = (row, value) => {
    setVerdict({ row, value });
    setNote("");
  };

  const confirmVerdict = async () => {
    if (!verdict) return;

    setSaving(true);
    const result = await reviewAbsenceExcuse(
      verdict.row.attendanceId,
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
            <EventBusyRounded sx={{ color: "var(--color-navy, #244A70)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                أعذار الغياب
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                ما ترد به الأسرة على إشعار الغياب، وقرار المدرسة فيه
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

        <Paper
          variant="outlined"
          sx={{ p: 1.5, borderRadius: "14px" }}
        >
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
              sx={{ minWidth: 170 }}
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
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              label="إلى"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              size="small"
              label={`${total} عذر`}
              sx={{ fontWeight: 800 }}
            />
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
              {status === "pending"
                ? "لا توجد أعذار تنتظر المراجعة."
                : "لا توجد أعذار بهذه الحالة."}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => {
              const meta = statusMeta(row.excuseStatus);

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
                        {row.studentName}
                      </Typography>
                      {row.className ? (
                        <Chip size="small" label={row.className} />
                      ) : null}
                      <Chip
                        size="small"
                        label={`غياب ${row.date}`}
                        color="default"
                      />
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        size="small"
                        color={meta.color}
                        label={meta.label}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>

                    <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {row.excuse}
                    </Typography>

                    {row.excuseAttachment ? (
                      <Link
                        href={row.excuseAttachment}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          width: "fit-content",
                        }}
                      >
                        <AttachFileRounded sx={{ fontSize: 14 }} />
                        فتح العذر الطبي
                      </Link>
                    ) : (
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary" }}
                      >
                        بلا مرفق
                      </Typography>
                    )}

                    {row.excuseStatus === "pending" ? (
                      <>
                        <Divider />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleRounded />}
                            onClick={() => openVerdict(row, "accepted")}
                            sx={{ borderRadius: "10px" }}
                          >
                            قبول
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelRounded />}
                            onClick={() => openVerdict(row, "rejected")}
                            sx={{ borderRadius: "10px" }}
                          >
                            رفض
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary" }}
                      >
                        {row.excuseReviewedByName
                          ? `راجعه ${row.excuseReviewedByName}`
                          : "تمت المراجعة"}
                        {row.excuseReviewNote
                          ? ` — ${row.excuseReviewNote}`
                          : ""}
                      </Typography>
                    )}
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
          {rejecting ? "رفض العذر" : "قبول العذر"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {verdict?.row?.studentName} · غياب {verdict?.row?.date}
            </Typography>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              يصل القرار إلى ولي الأمر فور حفظه، ولا يمكن تغييره بعد ذلك.
            </Alert>

            <TextField
              multiline
              minRows={3}
              size="small"
              label={rejecting ? "سبب الرفض (مطلوب)" : "ملاحظة (اختيارية)"}
              placeholder={
                rejecting
                  ? "مثال: التقرير الطبي لا يغطي هذا التاريخ"
                  : "تُعرض لولي الأمر مع القبول"
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
              error={rejecting && !note.trim()}
              helperText={
                rejecting && !note.trim()
                  ? "الرفض بلا سبب يترك الأسرة بلا شيء تردّ عليه"
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

export default AbsenceExcuses;
