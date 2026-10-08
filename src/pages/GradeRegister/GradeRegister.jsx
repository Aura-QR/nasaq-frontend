import { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { fetchRegisterOptions, fetchRegisterSheet, saveRegisterSheet, approveRegisterSheet, reopenRegisterSheet, fetchClassRegisterReport } from "@/APIs/school/gradeRegister";

const idOf = (x) => String(x?._id || x?.id || x || "");
const mark = (n) => n === null || n === undefined ? "غير مكتمل" : Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

export default function GradeRegister() {
  const getUser = useAuthUser();
  const auth = getUser?.() || {};
  const role = String(auth?.user?.role || auth?.role || "").toUpperCase();
  const admin = ["OWNER", "SUPERVISOR", "MANAGER"].includes(role);
  // From GET /grade-register/options: only the classes the user can open,
  // each with its own grade's registered subjects for the current term.
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [subjectOfferingId, setSubjectOfferingId] = useState("");
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finalMarks, setFinalMarks] = useState({});
  const [writtenItems, setWrittenItems] = useState([]);
  const [writtenMarks, setWrittenMarks] = useState({});
  const [classReport, setClassReport] = useState(null);
  useEffect(() => {
    let active = true;
    fetchRegisterOptions().then((response) => {
      if (!active) return;
      if (response?.status === false) { setError(response.message); return; }
      setClasses((response?.data ?? response)?.classes || []);
    });
    return () => { active = false; };
  }, []);
  const offerings = classes.find((c) => c.classId === classId)?.subjects || [];
  const load = async () => {
    if (!classId || !subjectOfferingId) return;
    setLoading(true); setError("");
    const response = await fetchRegisterSheet({ classId, subjectOfferingId });
    if (response?.status === false) { setError(response.message); setSheet(null); }
    else { setSheet(response?.data ?? response); setFinalMarks({}); setWrittenItems([]); setWrittenMarks({}); }
    setLoading(false);
  };
  const marksOf = (itemId) => Object.entries(writtenMarks[itemId] || {}).map(([studentId, score]) => ({ studentId, score: score === "" ? null : Number(score) }));
  const submit = async (mode) => {
    setBusy(true); setError("");
    const base = { classId, subjectOfferingId };
    let response;
    if (mode === "save") {
      if (Object.values(finalMarks).some(x => x !== "" && (!Number.isFinite(Number(x)) || Number(x) < 0 || Number(x) > 40))) { setError("درجة اختبار نهاية الفترة يجب أن تكون بين 0 و40");setBusy(false);return; }
      if (writtenItems.some(x => !x.remove && (!x._id && !x.title?.trim() || x.maxScore !== undefined && (!(Number(x.maxScore) > 0))))) { setError("حدد اسم البند والدرجة العظمى الصحيحة");setBusy(false);return; }
      response = await saveRegisterSheet({ ...base, finalMarks: Object.entries(finalMarks).map(([studentId, score]) => ({ studentId, score: score === "" ? null : Number(score) })),
        writtenItems: [
          ...writtenItems.map(item => ({ ...(item._id ? { _id: item._id } : {}), ...(item.remove ? { remove: true } : { ...(item.title !== undefined ? { title: item.title } : {}), ...(item.maxScore !== undefined ? { maxScore: Number(item.maxScore) } : {}), marks: marksOf(item._id || item.localId) }) })),
          // Marks typed for a saved item whose title and out-of were not touched.
          ...Object.keys(writtenMarks).filter(id => !writtenItems.some(item => (item._id || item.localId) === id)).map(id => ({ _id: id, marks: marksOf(id) })),
        ] });
    } else if (mode === "approve") {
      if (!window.confirm("هل تريد اعتماد السجل السنوي؟ بعد الاعتماد، ستُقفل المتابعة اليومية لهذه المادة والفصل.")) { setBusy(false); return; }
      response = await approveRegisterSheet(base);
    } else {
      if (!window.confirm("هل تريد إعادة فتح السجل للتعديل؟")) { setBusy(false); return; }
      response = await reopenRegisterSheet(base);
    }
    if (response?.status === false) setError(response.message);
    else await load();
    setBusy(false);
  };
  const approved = sheet?.status === "approved";
  const continuous = sheet?.assessmentType === "continuous";
  return <Box dir="rtl" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1350, mx: "auto" }}>
    <Typography variant="h4" fontWeight="bold" gutterBottom>السجل السنوي</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>عرض درجات الطلاب حسب الفصل والمادة، واعتماد السجل بعد اكتمال التقييم.</Typography>
    <Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: "column", md: "row" }} gap={2}>
      <TextField select fullWidth label="الفصل" value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectOfferingId(""); setSheet(null); setClassReport(null); }}>
        {classes.map((c) => <MenuItem key={c.classId} value={c.classId}>{c.className}</MenuItem>)}
      </TextField>
      <TextField select fullWidth label="المادة" value={subjectOfferingId} disabled={!classId} onChange={(e) => { setSubjectOfferingId(e.target.value); setSheet(null); }}>
        {offerings.map((o) => <MenuItem key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName} — {o.assessmentType === "final_exam" ? "تقويم ختامي" : "تقويم مستمر"}</MenuItem>)}
      </TextField>
      <Button variant="contained" disabled={!classId || !subjectOfferingId || loading} onClick={load} sx={{ minWidth: 140 }}>عرض السجل</Button>
    </Stack></Paper>
    {admin && <Stack direction="row" gap={1} sx={{ mb: 2 }}><Button variant="outlined" disabled={!classId || busy} onClick={async()=>{setBusy(true);setError("");const r=await fetchClassRegisterReport({classId}); if(r.status === false)setError(r.message); else setClassReport(r.data ?? r);setBusy(false);}}>تقرير درجات الفصل</Button>{classReport && <Button variant="outlined" onClick={()=>window.print()}>طباعة تقرير الفصل</Button>}</Stack>}
    {classReport && <Paper sx={{p:2,mb:2}}><Typography variant="h6" gutterBottom>تقرير الفصل — {classReport.className}</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>الطالب</TableCell>{(classReport.subjects || []).map(sub=><TableCell key={idOf(sub.subjectOfferingId)}>{sub.subjectName}</TableCell>)}</TableRow></TableHead><TableBody>{(classReport.students || []).map(st=><TableRow key={idOf(st.studentId)}><TableCell>{st.name}</TableCell>{(classReport.subjects || []).map(sub=><TableCell key={idOf(sub.subjectOfferingId)}>{mark(st.totals?.[idOf(sub.subjectOfferingId)])}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer></Paper>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading && <CircularProgress />}
    {sheet && !loading && <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Box><Typography variant="h6">{sheet.subjectName} — {sheet.className}</Typography><Typography>{sheet.term?.name} · {approved ? "معتمد" : "مسودة"}</Typography></Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => window.print()}>طباعة</Button>
          {!approved && <Button disabled={busy} onClick={() => submit("save")}>حفظ الدرجات اليدوية</Button>}
          {admin && !approved && <Button disabled={busy || sheet.students?.some((s) => !s.complete)} color="success" variant="contained" onClick={() => submit("approve")}>اعتماد السجل</Button>}
          {admin && approved && role !== "MANAGER" && <Button disabled={busy} color="warning" onClick={() => submit("reopen")}>إعادة فتح السجل</Button>}
        </Stack>
      </Stack>
      {!approved && <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => setWrittenItems(prev => [...prev, { localId: `new-${Date.now()}-${prev.length}`, title: "", maxScore: 10 }])}>إضافة بند تقويم تحريري</Button>
        {[...(sheet.writtenItems || []).filter(item => !writtenItems.some(x => x._id === item._id)).map(item => ({...item, existing: true})), ...writtenItems.filter(item=>!item.remove)].map(item => {
          const key = item._id || item.localId;
          const update = (patch) => setWrittenItems(prev => { const found = prev.some(x => (x._id || x.localId) === key); return found ? prev.map(x => (x._id || x.localId) === key ? {...x, ...patch} : x) : [...prev, { _id: key, ...patch }]; });
          return <Stack key={key} direction={{xs:"column", sm:"row"}} gap={1} sx={{mt:1}}><TextField size="small" label="اسم البند" defaultValue={item.title} onChange={e => update({title:e.target.value})}/><TextField size="small" label="الدرجة العظمى" type="number" defaultValue={item.maxScore} inputProps={{min:1}} onChange={e => update({maxScore:Number(e.target.value)})}/><Button color="error" onClick={() => update({remove:true})}>حذف البند</Button></Stack>;
        })}
        <Typography sx={{mt:1}} color="text.secondary">يمكن تسجيل درجات البنود المحفوظة في الجدول، ثم الضغط على حفظ الدرجات اليدوية.</Typography>
      </Box>}
      <TableContainer><Table size="small"><TableHead><TableRow><TableCell>الطالب</TableCell><TableCell>المهام والمشاركة (40)</TableCell><TableCell>التقويم التحريري ({sheet.maxScores?.written ?? (continuous ? 60 : 20)})</TableCell>{(sheet.writtenItems || []).map(item => <TableCell key={item._id}>{item.title} ({item.maxScore})</TableCell>)}{!continuous && <TableCell>اختبار نهاية الفترة (40)</TableCell>}<TableCell>المجموع (100)</TableCell></TableRow></TableHead>
      <TableBody>{(sheet.students || []).map((s) => <TableRow key={idOf(s.studentId)}><TableCell>{s.name}</TableCell><TableCell>{mark(s.performance?.score)}</TableCell><TableCell>{mark(s.written?.score)}</TableCell>{(sheet.writtenItems || []).map(item => <TableCell key={item._id}>{approved ? mark(s.written?.marks?.[item._id]) : <TextField size="small" type="number" sx={{width:95}} inputProps={{min:0,max:item.maxScore}} defaultValue={s.written?.marks?.[item._id] ?? ""} onChange={e => setWrittenMarks(prev => ({...prev,[item._id]:{...prev[item._id],[idOf(s.studentId)]:e.target.value}}))}/>}</TableCell>)}{!continuous && <TableCell>{approved ? mark(s.final?.score) : <TextField size="small" type="number" sx={{ width: 110 }} inputProps={{ min: 0, max: 40, step: "any" }} value={finalMarks[idOf(s.studentId)] ?? (s.final?.source === "manual" ? s.final?.score ?? "" : "")} placeholder={s.final?.source === "electronic" ? String(s.final.score) : "—"} onChange={(e) => setFinalMarks((prev) => ({ ...prev, [idOf(s.studentId)]: e.target.value }))} />}</TableCell>}<TableCell>{s.complete ? mark(s.total) : "غير مكتمل"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <Typography color="text.secondary" sx={{ mt: 2, fontSize: 13 }}>تُحسب المشاركة والواجبات والتقويمات الإلكترونية تلقائيًا من بيانات المدرسة. تُستبعد حصص الغياب من حساب نسب المشاركة.</Typography>
    </Paper>}
  </Box>;
}
