import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { fetchClassAttendanceRegister, fetchClassSummary, fetchRecordClasses } from "@/APIs/school/classRecord";

const C = {
  navy: "#173653", text: "#173653", muted: "#748294", line: "#e5eaf0",
  present: { bg: "#dcefe6", fg: "#1f4e4a" },
  absent: { bg: "#1f4e4a", fg: "#ffffff" },
  excused: { bg: "#2f6f8f", fg: "#ffffff" },
};
const CELL = { present: "ح", absent: "غ", excused: "ع" };
const num = (n, d = 1) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("ar-SA", { maximumFractionDigits: d }));
const WEEKDAY = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const dayHead = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return { wd: WEEKDAY[d.getUTCDay()], dm: `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }; };
const printSx = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };

function Tile({ label, value, hint, tone = "teal" }) {
  const bg = { teal: "#4f9a7e", blue: "#2f6f8f", dark: "#1f4e4a", slate: "#3d6b80" }[tone];
  return (
    <Box sx={{ bgcolor: bg, color: "#fff", borderRadius: "14px", p: 2, minHeight: 96, ...printSx }}>
      <Typography sx={{ fontSize: 13, opacity: 0.9 }}>{label}</Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 900, lineHeight: 1.4 }}>{value}</Typography>
      {hint && <Typography sx={{ fontSize: 11.5, opacity: 0.85 }}>{hint}</Typography>}
    </Box>
  );
}

function Cell({ status }) {
  if (!status) return <Box sx={{ color: "#c0c7d0", textAlign: "center" }}>—</Box>;
  const s = C[status];
  return (
    <Box sx={{ bgcolor: s.bg, color: s.fg, borderRadius: "6px", width: 28, height: 28, mx: "auto", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, ...printSx }}>
      {CELL[status]}
    </Box>
  );
}

export default function ClassRecord() {
  const navigate = useNavigate();
  const getUser = useAuthUser();
  const auth = getUser?.() || {};
  const role = String(auth?.user?.role || auth?.role || "").toUpperCase();
  const teacher = role === "TEACHER";

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState(null);
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetchRecordClasses(teacher).then((r) => {
      if (!active) return;
      if (r.status === false) setError(r.message);
      else { setClasses(r.data); if (r.data.length === 1) setClassId(r.data[0].id); }
    });
    return () => { active = false; };
  }, [teacher]);

  const load = async (range = {}) => {
    if (!classId) return;
    setLoading(true); setError("");
    const [s, g] = await Promise.all([
      fetchClassSummary({ classId }),
      fetchClassAttendanceRegister({ classId, ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) }),
    ]);
    if (s.status === false) setError(s.message); else setSummary(s.data);
    if (g.status === false) setError(g.message); else { setGrid(g.data); setFrom(g.data.from); setTo(g.data.to); }
    setLoading(false);
  };
  useEffect(() => { setSummary(null); setGrid(null); if (classId) load(); /* eslint-disable-next-line */ }, [classId]);

  const className = classes.find((c) => c.id === classId)?.name || summary?.className || "";
  const limitSet = typeof summary?.absenceAlertDays === "number";
  const days = useMemo(() => (grid?.days || []).map((d) => ({ iso: d, ...dayHead(d) })), [grid]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, direction: "rtl", "@media print": { p: 0, "& .no-print": { display: "none !important" } } }}>
      <Stack className="no-print" direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: "#a87d32", fontWeight: 800 }}>{teacher ? "بوابة المعلم" : "الإدارة المدرسية / الخدمات والمتابعة"}</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 900, color: C.text, lineHeight: 1.5 }}>سجل الفصل</Typography>
          <Typography sx={{ fontSize: 12, color: C.muted }}>ملخص الفصل وسجل الحضور والغياب، محسوبان تلقائيًا مما تسجله المدرسة يوميًا</Typography>
        </Box>
        <Stack direction="row" gap={1}>
          {grid && <Button variant="contained" onClick={() => window.print()} sx={{ bgcolor: C.navy, borderRadius: "10px", fontWeight: 800 }}>طباعة</Button>}
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: "10px", fontWeight: 700 }}>رجوع</Button>
        </Stack>
      </Stack>

      <Paper className="no-print" elevation={0} sx={{ border: `1px solid ${C.line}`, borderRadius: "14px", p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.3}>
          <TextField select fullWidth size="small" label="الفصل" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField size="small" type="date" label="من" InputLabelProps={{ shrink: true }} value={from} disabled={!grid} onChange={(e) => setFrom(e.target.value)} />
          <TextField size="small" type="date" label="إلى" InputLabelProps={{ shrink: true }} value={to} disabled={!grid} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outlined" disabled={!classId || loading} onClick={() => load({ from, to })} sx={{ minWidth: 110, borderRadius: "10px", fontWeight: 800 }}>تحديث</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!classId && !error && <Alert severity="info">اختر الفصل لعرض سجله.</Alert>}
      {loading && <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>}

      {!loading && summary && (
        <Paper elevation={0} sx={{ border: `1px solid ${C.line}`, borderRadius: "14px", p: 2, mb: 2, breakInside: "avoid" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 900, color: C.text }}>ملخص الفصل — {className}</Typography>
          <Typography sx={{ fontSize: 12, color: C.muted, mb: 1.5 }}>
            {summary.term?.name ? `${summary.term.name} · ` : ""}{summary.schoolDays} يوم دراسي حتى {summary.to} · {summary.studentCount} طالب/ة
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.3 }}>
            <Tile tone="teal" label="متوسط الحضور" value={summary.attendanceRate === null ? "—" : `${num(summary.attendanceRate)}%`} />
            <Tile tone="slate" label="متوسط الدرجات" value={summary.averageGrade === null ? "—" : `${num(summary.averageGrade)}%`} hint={summary.gradesAvailable ? "من السجل السنوي" : "لا توجد درجات مكتملة بعد"} />
            <Tile tone="blue" label="نسبة النجاح" value={summary.passRate === null ? "—" : `${num(summary.passRate)}%`} hint={summary.passRate === null ? "تظهر عند اكتمال الدرجات" : "من المواد المرصودة"} />
            <Tile tone="dark" label="بلغن حد الغياب" value={limitSet ? num(summary.overLimitCount, 0) : "—"} hint={limitSet ? `الحد: ${summary.absenceAlertDays} أيام بغير عذر` : "لم يُحدَّد حد الغياب في الإعدادات"} />
          </Box>
          {limitSet && summary.overLimit?.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              {summary.overLimit.map((s) => (
                <Box key={s.studentId} sx={{ display: "flex", justifyContent: "space-between", border: `1px solid ${C.line}`, borderRadius: "10px", px: 1.5, py: 1, mb: 0.75, bgcolor: "#fff" }}>
                  <Typography sx={{ fontWeight: 700 }}>● {s.name}</Typography>
                  <Typography sx={{ color: C.muted, fontSize: 13 }}>{s.unexcusedDays} أيام بغير عذر · {s.absentDays} إجمالي الغياب</Typography>
                </Box>
              ))}
            </Box>
          )}
          {!limitSet && !teacher && (
            <Typography sx={{ mt: 1.2, fontSize: 12.5, color: C.muted }}>
              لتفعيل التنبيه التلقائي لمن تبلغ حد الغياب، حدّد عدد الأيام من <Box component="span" sx={{ color: C.navy, fontWeight: 800, cursor: "pointer" }} onClick={() => navigate("/school/settings")}>إعدادات المدرسة</Box>.
            </Typography>
          )}
        </Paper>
      )}

      {!loading && grid && (
        <Paper elevation={0} sx={{ border: `1px solid ${C.line}`, borderRadius: "14px", p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: C.text }}>سجل الحضور والغياب — {className}</Typography>
              <Typography sx={{ fontSize: 12, color: C.muted }}>من {grid.from} إلى {grid.to} · أيام الدراسة فقط (دون العطل والإجازات)</Typography>
            </Box>
            <Stack direction="row" gap={1.5} alignItems="center">
              {["present", "absent", "excused"].map((k) => (
                <Stack key={k} direction="row" gap={0.6} alignItems="center"><Cell status={k} /><Typography sx={{ fontSize: 12.5 }}>{{ present: "حاضر", absent: "غائب", excused: "بعذر" }[k]}</Typography></Stack>
              ))}
            </Stack>
          </Stack>
          {grid.students.length === 0 ? <Alert severity="info">لا يوجد طلاب في هذا الفصل.</Alert> : grid.days.length === 0 ? <Alert severity="info">لا توجد أيام دراسية في هذه المدة.</Alert> : (
            <Box sx={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: "10px", "@media print": { overflow: "visible" } }}>
              <Box component="table" sx={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", fontSize: 13, "& th, & td": { borderBottom: `1px solid ${C.line}`, px: 0.6, py: 0.6, textAlign: "center", whiteSpace: "nowrap" }, "& thead th": { bgcolor: "#f4f7fa", color: C.text, fontWeight: 800, fontSize: 11.5, position: "sticky", top: 0 } }}>
                <thead>
                  <tr>
                    <Box component="th" sx={{ position: "sticky", right: 0, zIndex: 2, textAlign: "right !important", minWidth: 150 }}>الطالب/ة</Box>
                    {days.map((d) => <th key={d.iso}><div>{d.wd}</div><div style={{ fontWeight: 600, color: C.muted }}>{d.dm}</div></th>)}
                    <th>غياب</th><th>بعذر</th><th>النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.students.map((s) => (
                    <Box component="tr" key={s.studentId} sx={s.overLimit ? { "& td": { bgcolor: "#fbf1ef" } } : undefined}>
                      <Box component="td" sx={{ position: "sticky", right: 0, bgcolor: "#fff", zIndex: 1, textAlign: "right !important", fontWeight: 700 }}>
                        {s.name}{s.overLimit && <Box component="span" sx={{ color: "#8a2a20", fontSize: 11, mr: 0.75 }}>· بلغت حد الغياب</Box>}
                      </Box>
                      {days.map((d) => <td key={d.iso}><Cell status={s.cells[d.iso]} /></td>)}
                      <Box component="td" sx={{ fontWeight: 800 }}>{num(s.absentDays, 0)}</Box>
                      <td>{num(s.excusedDays, 0)}</td>
                      <Box component="td" sx={{ fontWeight: 800, color: s.attendanceRate !== null && s.attendanceRate < 75 ? "#8a2a20" : C.text }}>{s.attendanceRate === null ? "—" : `${num(s.attendanceRate)}%`}</Box>
                    </Box>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
