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
  CheckCircleRounded,
  DoNotDisturbOnRounded,
  RefreshRounded,
  ScheduleRounded,
  TourRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import { fetchRound, recordObservation } from "@/APIs/school/lessonObservations";

/*
 * جولة الفصول.
 *
 * المشرف يمرّ على الفصول فيرى من تأخر ومن لم يحضر حصته. قبل هذه الشاشة كان
 * ما يراه يعيش في ذاكرته أو على ورقة، ولا يصل إلى المعلم ولا يبقى في سجل.
 *
 * حصص اليوم مرتَّبة بالحصة ثم الفصل — وهو ترتيب المشي في الممر، لا ترتيب
 * قاعدة البيانات.
 */

const STATUS_META = {
  present: { label: "حاضر", color: "success", Icon: CheckCircleRounded },
  late: { label: "متأخر", color: "warning", Icon: ScheduleRounded },
  absent: { label: "غائب", color: "error", Icon: DoNotDisturbOnRounded },
};

const today = () => new Date().toISOString().slice(0, 10);

/** "HH:mm" الآن — ما كان المشرف سيقرؤه على ساعته. */
const clockNow = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
};

const ClassRound = () => {
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  // الغياب والتأخير يُفتح لهما نموذج: الدقائق وساعة المرور والملاحظة لا
  // تُكتب في سطر جدول، و«عدّينا ١١:١٥» هي الحقيقة التي سيقبلها المعلم أو
  // يعترض عليها.
  const [form, setForm] = useState(null);
  const [lateMinutes, setLateMinutes] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchRound(date);

    if (!result.status) {
      setError(result.message);
      setData(null);
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => data?.items ?? [], [data]);

  const bySlot = useMemo(() => {
    const groups = new Map();
    for (const item of items) {
      if (!groups.has(item.slot)) groups.set(item.slot, []);
      groups.get(item.slot).push(item);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [items]);

  const save = async (item, status, extra = {}) => {
    setSaving(item.lectureId);

    const result = await recordObservation({
      lectureId: item.lectureId,
      date,
      status,
      ...extra,
    });

    setSaving("");

    if (!result.status) {
      toast.error(result.message);
      return false;
    }

    toast.success(result.message);
    load();
    return true;
  };

  const openForm = (item, status) => {
    setForm({ item, status });
    setLateMinutes(status === "late" ? "5" : "");
    setObservedAt(clockNow());
    setNote("");
  };

  const confirmForm = async () => {
    if (!form) return;

    const done = await save(form.item, form.status, {
      ...(form.status === "late" ? { lateMinutes } : {}),
      observedAt,
      note,
    });

    if (done) setForm(null);
  };

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
            <TourRounded sx={{ color: "var(--color-navy, #244A70)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                جولة الفصول
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                سجّل ما رأيته في كل حصة — يصل إلى المعلم ويبقى في السجل
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              size="small"
              startIcon={<RefreshRounded />}
              onClick={load}
              sx={{ borderRadius: "10px" }}
            >
              تحديث
            </Button>
          </Stack>
        </Stack>

        {data ? (
          <Paper variant="outlined" sx={{ p: 1.4, borderRadius: "14px" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={`${data.visited} من ${data.total} حصة تم المرور عليها`}
                sx={{ fontWeight: 800 }}
              />
              {data.late > 0 ? (
                <Chip size="small" color="warning" label={`${data.late} تأخير`} />
              ) : null}
              {data.absent > 0 ? (
                <Chip size="small" color="error" label={`${data.absent} غياب`} />
              ) : null}
              {data.termName ? (
                <Chip size="small" variant="outlined" label={data.termName} />
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : items.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 5, borderRadius: "14px", textAlign: "center" }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              لا توجد حصص في هذا اليوم.
            </Typography>
          </Paper>
        ) : (
          bySlot.map(([slot, rows]) => (
            <Box key={slot}>
              <Typography
                sx={{ fontWeight: 900, fontSize: 13, mb: 0.8, color: "text.secondary" }}
              >
                الحصة {slot}
              </Typography>

              <Stack spacing={1}>
                {rows.map((item) => {
                  const meta = item.observation
                    ? STATUS_META[item.observation.status]
                    : null;
                  const busy = saving === item.lectureId;

                  return (
                    <Paper
                      key={item.lectureId}
                      variant="outlined"
                      sx={{
                        p: 1.4,
                        borderRadius: "12px",
                        borderColor: meta
                          ? undefined
                          : "var(--color-border, #DED8CD)",
                        bgcolor: item.observation ? "rgba(0,0,0,0.015)" : undefined,
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        alignItems={{ md: "center" }}
                      >
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                              {item.className}
                            </Typography>
                            {item.roomNumber ? (
                              <Chip size="small" label={item.roomNumber} />
                            ) : null}
                            <Typography sx={{ fontSize: 13 }}>
                              {item.subjectName}
                            </Typography>
                          </Stack>

                          <Typography
                            sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.3 }}
                          >
                            {item.teacherName || "بدون معلم"}
                            {/* الحصة التي أعادت الإدارة إسنادها ليست غيابًا
                                يُبلَّغ عنه — ومن غير هذا يُكتب على معلم
                                رُفعت عنه الحصة أصلًا. */}
                            {item.coveredBy ? ` · يغطيها ${item.coveredBy}` : ""}
                          </Typography>

                          {item.observation ? (
                            <Typography
                              sx={{ fontSize: 12, color: "text.secondary", mt: 0.4 }}
                            >
                              {item.observation.note ||
                                (item.observation.status === "late"
                                  ? `تأخر ${item.observation.lateMinutes ?? "—"} دقيقة`
                                  : "")}
                              {item.observation.recordedByName
                                ? ` — سجّله ${item.observation.recordedByName}`
                                : ""}
                            </Typography>
                          ) : null}
                        </Box>

                        {meta ? (
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <Chip
                              size="small"
                              color={meta.color}
                              icon={<meta.Icon />}
                              label={meta.label}
                              sx={{ fontWeight: 800 }}
                            />
                            <Button
                              size="small"
                              onClick={() => openForm(item, "late")}
                              sx={{ fontSize: 11 }}
                            >
                              تعديل
                            </Button>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={0.7}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              disabled={busy}
                              onClick={() => save(item, "present", { observedAt: clockNow() })}
                              sx={{ borderRadius: "9px", minWidth: 74 }}
                            >
                              حاضر
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              disabled={busy}
                              onClick={() => openForm(item, "late")}
                              sx={{ borderRadius: "9px", minWidth: 74 }}
                            >
                              متأخر
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={busy}
                              onClick={() => openForm(item, "absent")}
                              sx={{ borderRadius: "9px", minWidth: 74 }}
                            >
                              غائب
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          ))
        )}
      </Stack>

      <Dialog
        open={Boolean(form)}
        onClose={() => setForm(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 16 }}>
          {form?.status === "late" ? "تسجيل تأخر" : "تسجيل عدم حضور"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {form?.item?.className} · {form?.item?.subjectName} · الحصة{" "}
              {form?.item?.slot}
              {form?.item?.teacherName ? ` · ${form.item.teacherName}` : ""}
            </Typography>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              يصل الإشعار إلى المعلم فور الحفظ، ويمكنه بيان السبب.
            </Alert>

            <Stack direction="row" spacing={1}>
              {form?.status === "late" ? (
                <TextField
                  type="number"
                  size="small"
                  label="دقائق التأخير"
                  value={lateMinutes}
                  onChange={(event) => setLateMinutes(event.target.value)}
                  inputProps={{ min: 0, max: 300 }}
                  sx={{ width: 140 }}
                />
              ) : null}

              <TextField
                type="time"
                size="small"
                label="وقت المرور"
                value={observedAt}
                onChange={(event) => setObservedAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Stack>

            <TextField
              multiline
              minRows={2}
              size="small"
              label="ملاحظة (اختيارية)"
              placeholder="مثال: الفصل بدون معلم والطالبات في الممر"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForm(null)}>إلغاء</Button>
          <Button
            variant="contained"
            color={form?.status === "late" ? "warning" : "error"}
            onClick={confirmForm}
            disabled={Boolean(saving)}
            sx={{ borderRadius: "10px" }}
          >
            {saving ? "جارٍ الحفظ…" : "تسجيل"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassRound;
