import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowForwardRounded,
  CheckRounded,
  ContentCopyRounded,
  EventRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  ReplayRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  fetchHomeworkSubmissions,
  fetchTeacherLessonHomework,
  reviewHomeworkSubmission,
} from "@/APIs/school/homeworkSubmissions";
import { SUBMISSION_STATE, SubmissionFiles } from "@/pages/Student/components/HomeworkHandIn";

/*
 * تسليمات الواجبات — للمعلم.
 *
 * القائمة: واجبات الدروس التي كتبها في التحضير خلال الشهرين الأخيرين، ولكل
 * واجب كم طالبًا سلّم وكم ينتظر المراجعة. التفاصيل: طلاب الفصل كلهم، من سلّم
 * ومن لم يسلّم، وصور الحل، وقبول أو إعادة مع ملاحظة.
 */

const NAVY = "#122f4d";
const GRAY = "#87939e";

const formatDay = (key) => {
  if (!key) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
      .format(new Date(`${key}T00:00:00Z`));
  } catch {
    return key;
  }
};
const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" })
      .format(new Date(iso));
  } catch {
    return "";
  }
};

function HomeworkList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    fetchTeacherLessonHomework().then((r) => {
      if (!r?.status) toast.error(r?.message || "تعذر تحميل الواجبات");
      setRows(r?.status && Array.isArray(r.data) ? r.data : []);
    });
  }, []);

  const shown = useMemo(() => (rows || []).filter((h) => !onlyPending || h.toReview > 0), [rows, onlyPending]);
  const pendingTotal = (rows || []).reduce((n, h) => n + h.toReview, 0);

  return (
    <Box dir="rtl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 900, color: NAVY }}>تسليمات الواجبات</Typography>
          <Typography sx={{ fontSize: 12.5, color: GRAY }}>
            واجبات الدروس التي كتبتها في التحضير، وما سلّمه الطلاب من صور الحل.
          </Typography>
        </Box>
        <Stack direction="row" gap={0.75}>
          <Chip label="الكل" onClick={() => setOnlyPending(false)} color={!onlyPending ? "primary" : "default"} sx={{ fontWeight: 800 }} />
          <Chip
            label={`بانتظار المراجعة${pendingTotal ? ` (${pendingTotal})` : ""}`}
            onClick={() => setOnlyPending(true)}
            color={onlyPending ? "primary" : "default"}
            sx={{ fontWeight: 800 }}
          />
        </Stack>
      </Stack>

      {rows === null ? (
        <Stack gap={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={86} sx={{ borderRadius: "15px" }} />)}</Stack>
      ) : !shown.length ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: "15px", border: "1px solid rgba(18,47,77,.07)" }}>
          <Typography sx={{ fontWeight: 800, color: NAVY }}>
            {onlyPending ? "لا توجد تسليمات بانتظار المراجعة" : "لا توجد واجبات دروس خلال الشهرين الأخيرين"}
          </Typography>
          {!onlyPending && (
            <Typography sx={{ mt: 0.5, fontSize: 12.5, color: GRAY }}>
              عند إضافة واجب لدرس في التحضير يظهر هنا، ويستطيع الطلاب تسليمه من «واجباتي».
            </Typography>
          )}
        </Paper>
      ) : (
        <Stack gap={1}>
          {shown.map((h) => (
            <Paper
              key={h._id}
              elevation={0}
              onClick={() => navigate(`/teacher/homework-submissions/${h._id}`)}
              sx={{ p: 1.5, cursor: "pointer", borderRadius: "15px", border: "1px solid rgba(18,47,77,.07)", "&:hover": { borderColor: "#4e8dcc" } }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, color: NAVY }} noWrap>{h.title || h.lessonTitle}</Typography>
                  <Typography sx={{ fontSize: 12, color: GRAY }}>
                    {[h.className, h.subjectName, h.lessonTitle && `الدرس: ${h.lessonTitle}`].filter(Boolean).join(" · ")}
                  </Typography>
                  {h.dueAt && (
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.25, color: GRAY }}>
                      <EventRounded sx={{ fontSize: 15 }} />
                      <Typography sx={{ fontSize: 12 }}>التسليم: {formatDay(h.dueAt)}</Typography>
                    </Stack>
                  )}
                </Box>
                <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                  <Chip size="small" label={`سلّم ${h.submitted} من ${h.students}`} sx={{ fontWeight: 800 }} />
                  {h.toReview > 0 && <Chip size="small" color="primary" label={`${h.toReview} بانتظار المراجعة`} sx={{ fontWeight: 800 }} />}
                  {h.returned > 0 && <Chip size="small" color="warning" variant="outlined" label={`${h.returned} مُعاد`} />}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "submitted", label: "بانتظار المراجعة" },
  { key: "none", label: "لم يسلّم" },
  { key: "accepted", label: "مقبول" },
  { key: "returned", label: "مُعاد" },
];

function HomeworkDetail({ resourceId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showText, setShowText] = useState(false);
  const [returning, setReturning] = useState(null); // student row
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchHomeworkSubmissions(resourceId).then((r) => {
      if (!r?.status) {
        toast.error(r?.message || "تعذر تحميل التسليمات");
        setData({ homework: null, students: [] });
      } else setData(r.data);
    });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const students = data?.students || [];
  const count = (key) => students.filter((s) => (key === "none" ? !s.submission : s.submission?.status === key)).length;
  const shown = students.filter((s) => filter === "all" || (filter === "none" ? !s.submission : s.submission?.status === filter));
  const handedIn = students.filter((s) => s.submission).length;
  const missingNames = students.filter((s) => !s.submission).map((s) => s.name);

  const review = async (row, status, note = "") => {
    setBusy(true);
    const r = await reviewHomeworkSubmission(resourceId, row.studentId, status, note);
    setBusy(false);
    if (!r?.status) return toast.error(r?.message || "تعذر حفظ المراجعة");
    toast.success(r.message);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.studentId === row.studentId ? { ...s, submission: r.data } : s)),
    }));
    setReturning(null);
  };

  const copyMissing = async () => {
    const hw = data?.homework;
    const text = `لم يسلّم واجب «${hw?.title || hw?.lessonTitle}» (${hw?.className}):\n${missingNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ أسماء من لم يسلّم");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  if (!data) return <Skeleton variant="rounded" height={240} sx={{ borderRadius: "15px" }} />;
  const hw = data.homework;

  return (
    <Box dir="rtl">
      <Button startIcon={<ArrowForwardRounded />} onClick={() => navigate("/teacher/homework-submissions")} sx={{ mb: 1, fontWeight: 800 }}>
        كل الواجبات
      </Button>

      {hw && (
        <Paper elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: "16px", border: "1px solid rgba(18,47,77,.07)" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, color: NAVY }}>{hw.title || hw.lessonTitle}</Typography>
          <Typography sx={{ fontSize: 12.5, color: GRAY }}>
            {[hw.className, hw.subjectName, hw.lessonTitle && `الدرس: ${hw.lessonTitle}`, hw.dueAt && `التسليم: ${formatDay(hw.dueAt)}`].filter(Boolean).join(" · ")}
          </Typography>
          {hw.description && (
            <>
              <Collapse in={showText} collapsedSize={0}>
                <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-line", color: "#4d5b68" }}>{hw.description}</Typography>
              </Collapse>
              <Button size="small" onClick={() => setShowText((v) => !v)} endIcon={showText ? <ExpandLessRounded /> : <ExpandMoreRounded />} sx={{ px: 0, fontWeight: 800 }}>
                {showText ? "إخفاء نص الواجب" : "عرض نص الواجب"}
              </Button>
            </>
          )}
          <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center" sx={{ mt: 1 }}>
            <Chip label={`سلّم ${handedIn} من ${students.length}`} sx={{ fontWeight: 900 }} />
            {missingNames.length > 0 && (
              <Button size="small" startIcon={<ContentCopyRounded />} onClick={copyMissing} sx={{ fontWeight: 800 }}>
                نسخ أسماء من لم يسلّم
              </Button>
            )}
          </Stack>
          <Alert severity="info" sx={{ mt: 1.25, borderRadius: "12px", fontSize: 12 }}>
            القبول هنا لا يغيّر علامة «الواجب» في المتابعة اليومية؛ ضعها من صفحة حضور الطلاب لحصة التسليم.
          </Alert>
        </Paper>
      )}

      <Tabs value={filter} onChange={(_, v) => setFilter(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
        {FILTERS.map((f) => (
          <Tab key={f.key} value={f.key} label={`${f.label} (${f.key === "all" ? students.length : count(f.key)})`} sx={{ fontWeight: 800 }} />
        ))}
      </Tabs>

      <Stack gap={1}>
        {!shown.length && (
          <Typography sx={{ p: 2, textAlign: "center", color: GRAY }}>لا يوجد طلاب في هذا التصنيف</Typography>
        )}
        {shown.map((s) => {
          const sub = s.submission;
          const state = sub ? SUBMISSION_STATE[sub.status] : null;
          return (
            <Paper key={s.studentId} elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: "1px solid rgba(18,47,77,.07)" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                <Box>
                  <Typography sx={{ fontWeight: 900, color: NAVY }}>{s.name}</Typography>
                  {sub && (
                    <Typography sx={{ fontSize: 11.5, color: GRAY }}>
                      سُلّم {formatTime(sub.submittedAt)}{sub.late ? " · بعد موعد التسليم" : ""}
                    </Typography>
                  )}
                </Box>
                {state ? (
                  <Chip size="small" label={state.label} sx={{ fontWeight: 800, color: state.color, backgroundColor: state.background }} />
                ) : (
                  <Chip size="small" label="لم يسلّم" sx={{ fontWeight: 800, color: GRAY }} />
                )}
              </Stack>

              {s.duplicates?.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1, borderRadius: "12px", fontSize: 12.5 }}>
                  {s.duplicates.join(" · ")}
                </Alert>
              )}
              {sub?.note && (
                <Typography sx={{ mt: 1, fontSize: 12.5, color: "#4d5b68" }}>
                  <b>ملاحظة الطالب:</b> {sub.note}
                </Typography>
              )}
              {sub?.files?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <SubmissionFiles files={sub.files} />
                </Box>
              )}
              {sub?.feedback && (
                <Typography sx={{ mt: 1, fontSize: 12.5, color: GRAY }}>
                  <b>ملاحظتك:</b> {sub.feedback}
                </Typography>
              )}

              {sub && (
                <Stack direction="row" gap={0.75} sx={{ mt: 1.25 }}>
                  {sub.status !== "accepted" && (
                    <Button size="small" variant="contained" color="success" startIcon={<CheckRounded />} disabled={busy}
                      onClick={() => review(s, "accepted")} sx={{ borderRadius: "10px", fontWeight: 900 }}>
                      قبول
                    </Button>
                  )}
                  {sub.status !== "returned" && (
                    <Button size="small" variant="outlined" color="warning" startIcon={<ReplayRounded />} disabled={busy}
                      onClick={() => { setReturning(s); setFeedback(""); }} sx={{ borderRadius: "10px", fontWeight: 900 }}>
                      {sub.status === "accepted" ? "إلغاء القبول وإعادته" : "إعادة للتعديل"}
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={!!returning} onClose={() => !busy && setReturning(null)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>إعادة الواجب إلى {returning?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1 }}
            label="ما المطلوب تعديله؟"
            placeholder="مثال: السؤال الثالث غير محلول، والصورة غير واضحة."
            value={feedback}
            inputProps={{ maxLength: 500 }}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Typography sx={{ mt: 1, fontSize: 12, color: GRAY }}>يصل الطالب إشعار بالملاحظة، ويستطيع التسليم مرة أخرى.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setReturning(null)} disabled={busy}>إلغاء</Button>
          <Button variant="contained" color="warning" disabled={busy || !feedback.trim()} onClick={() => review(returning, "returned", feedback.trim())} sx={{ fontWeight: 900 }}>
            إعادة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function TeacherHomeworkSubmissions() {
  const { resourceId } = useParams();
  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      {resourceId ? <HomeworkDetail resourceId={resourceId} /> : <HomeworkList />}
    </Box>
  );
}

