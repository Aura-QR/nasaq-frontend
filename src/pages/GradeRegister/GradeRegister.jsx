import { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { fetchRegisterOptions, fetchRegisterSheet, saveRegisterSheet, approveRegisterSheet, reopenRegisterSheet, fetchClassRegisterReport } from "@/APIs/school/gradeRegister";

const idOf = (x) => String(x?._id || x?.id || x || "");
const mark = (n) => n === null || n === undefined ? "غير مكتمل" : Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

export default function GradeRegister() {
  const navigate = useNavigate();
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
  // Role-aware presentation only. Register API, authorization and calculations stay unchanged.
  const palette = {
    navy: "var(--color-navy, #244a70)",
    dark: "var(--color-navy-deep, #1b3d61)",
    gold: "var(--color-gold, #d3a44f)",
    text: "#173653",
    background: admin ? "#f5f2eb" : "#f5f7fa",
  };
  const panel = { borderRadius: admin ? "13px" : "16px", border: "1px solid #e7eaf0", boxShadow: admin ? "0 2px 9px rgba(27,61,97,.035)" : "0 4px 14px rgba(27,61,97,.045)", backgroundColor: "#fff" };
  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#fff", "& fieldset": { borderColor: "#dfe5ec" }, "&.Mui-focused fieldset": { borderColor: palette.navy } } };
  const actionSx = { borderRadius: "9px", py: .65, px: 1.65, fontWeight: 800, textTransform: "none" };
  const outlinedSx = { ...actionSx, color: palette.navy, borderColor: "#cddbe7", "&:hover": { borderColor: palette.navy, bgcolor: "#f3f7fb" } };
  const headCellSx = { fontWeight: 800, color: palette.text, bgcolor: "#f1f5f9", whiteSpace: "nowrap", borderBottom: "1px solid #dde5ef" };

  return <Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: palette.background, pb: 3 }}>
    <Box sx={{ maxWidth: 1510, mx: "auto", p: { xs: 1.5, sm: 2, md: 2.5 } }}>
      {admin ? (
        <Box sx={{ mb: 1.75, py: 1.3, px: { xs: 1.7, md: 2.3 }, bgcolor: "#fff", borderRadius: "13px", border: "1px solid #e5e5e0", borderRight: "4px solid #d3a44f", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: "#a87d32", fontWeight: 800 }}>الإدارة المدرسية / التقييم والاختبارات</Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 900, color: "#173653", lineHeight: 1.5 }}>السجل السنوي</Typography>
            <Typography sx={{ fontSize: 12, color: "#748294" }}>عرض درجات الطلاب واعتماد السجلات حسب الفصل والمادة</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ ...outlinedSx, fontSize: 12 }}>العودة للوحة التحكم</Button>
        </Box>
      ) : (
        <Box sx={{ borderRadius: "16px", background: "linear-gradient(110deg, #193b5d 0%, #244a70 75%, #315f86 100%)", color: "#fff", py: { xs: 1.5, md: 1.7 }, px: { xs: 2, md: 2.5 }, mb: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#f4ce82" }}>بوابة المعلم</Typography>
            <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: 22, md: 26 }, lineHeight: 1.6 }}>السجل السنوي</Typography>
            <Typography sx={{ fontSize: 12, opacity: .82 }}>درجات طلابك حسب الفصل والمادة</Typography>
          </Box>
          <Button onClick={() => navigate(-1)} sx={{ ...actionSx, bgcolor: "#f4d58d", color: "#1b3d61", fontSize: 12, "&:hover": { bgcolor: "#eac371" } }}>العودة للوحة التحكم</Button>
        </Box>
      )}
      <Paper elevation={0} sx={{ ...panel, p: { xs: 1.6, md: 2 }, mb: 1.75 }}>
        <Typography sx={{ color: palette.text, fontSize: 16, fontWeight: 800, mb: 1.25 }}>اختيار الفصل والمادة</Typography>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.3} alignItems="stretch">
          <TextField sx={fieldSx} select fullWidth label="الفصل" value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectOfferingId(""); setSheet(null); setClassReport(null); }}>
            {classes.map((c) => <MenuItem key={c.classId} value={c.classId}>{c.className}</MenuItem>)}
          </TextField>
          <TextField sx={fieldSx} select fullWidth label="المادة" value={subjectOfferingId} disabled={!classId} onChange={(e) => { setSubjectOfferingId(e.target.value); setSheet(null); }}>
            {offerings.map((o) => <MenuItem key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName} — {o.assessmentType === "final_exam" ? "تقويم ختامي" : "تقويم مستمر"}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={!classId || !subjectOfferingId || loading} onClick={load} sx={{ ...actionSx, minWidth: 118, bgcolor: palette.navy, "&:hover": { bgcolor: palette.dark } }}>عرض السجل</Button>
        </Stack>
      </Paper>
    {admin && <Stack direction="row" gap={1} sx={{ mb: 1.3 }}><Button sx={outlinedSx} variant="outlined" disabled={!classId || busy} onClick={async()=>{setBusy(true);setError("");const r=await fetchClassRegisterReport({classId}); if(r.status === false)setError(r.message); else setClassReport(r.data ?? r);setBusy(false);}}>تقرير درجات الفصل</Button>{classReport && <Button sx={outlinedSx} variant="outlined" onClick={()=>window.print()}>طباعة تقرير الفصل</Button>}</Stack>}
    {classReport && <Paper elevation={0} sx={{...panel,p:2,mb:1.75}}><Typography variant="h6" gutterBottom>تقرير الفصل — {classReport.className}</Typography><TableContainer sx={{ borderRadius: "10px", border: "1px solid #e5eaf0", overflowX: "auto" }}><Table size="small" sx={{ minWidth: 690, "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": { bgcolor: "#fafbfd" }, "& .MuiTableCell-root": { py: .95 } }}><TableHead><TableRow><TableCell sx={headCellSx}>الطالب</TableCell>{(classReport.subjects || []).map(sub=><TableCell key={idOf(sub.subjectOfferingId)}>{sub.subjectName}</TableCell>)}</TableRow></TableHead><TableBody>{(classReport.students || []).map(st=><TableRow key={idOf(st.studentId)}><TableCell>{st.name}</TableCell>{(classReport.subjects || []).map(sub=><TableCell key={idOf(sub.subjectOfferingId)}>{mark(st.totals?.[idOf(sub.subjectOfferingId)])}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer></Paper>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading && <CircularProgress />}
    {sheet && !loading && <Paper elevation={0} sx={{ ...panel, p: {xs:1.5,md:2} }}>
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.2 }}>
        <Box><Typography sx={{ fontSize: 17, fontWeight: 850, color: palette.text }}>{sheet.subjectName} — {sheet.className}</Typography><Typography>{sheet.term?.name} · {approved ? "معتمد" : "مسودة"}</Typography></Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button sx={outlinedSx} variant="outlined" onClick={() => window.print()}>طباعة</Button>
          {!approved && <Button variant="contained" sx={{...actionSx,bgcolor:palette.navy,"&:hover":{bgcolor:palette.dark}}} disabled={busy} onClick={() => submit("save")}>حفظ الدرجات اليدوية</Button>}
          {admin && !approved && <Button disabled={busy || sheet.students?.some((s) => !s.complete)} color="success" variant="contained" sx={actionSx} onClick={() => submit("approve")}>اعتماد السجل</Button>}
          {admin && approved && role !== "MANAGER" && <Button disabled={busy} color="warning" sx={actionSx} onClick={() => submit("reopen")}>إعادة فتح السجل</Button>}
        </Stack>
      </Stack>
      {!approved && <Box sx={{ mb: 1.2 }}>
        <Button sx={outlinedSx} variant="outlined" onClick={() => setWrittenItems(prev => [...prev, { localId: `new-${Date.now()}-${prev.length}`, title: "", maxScore: 10 }])}>إضافة بند تقويم تحريري</Button>
        {[...(sheet.writtenItems || []).filter(item => !writtenItems.some(x => x._id === item._id)).map(item => ({...item, existing: true})), ...writtenItems.filter(item=>!item.remove)].map(item => {
          const key = item._id || item.localId;
          const update = (patch) => setWrittenItems(prev => { const found = prev.some(x => (x._id || x.localId) === key); return found ? prev.map(x => (x._id || x.localId) === key ? {...x, ...patch} : x) : [...prev, { _id: key, ...patch }]; });
          return <Stack key={key} direction={{xs:"column", sm:"row"}} gap={1} sx={{mt:.75}}><TextField size="small" label="اسم البند" defaultValue={item.title} onChange={e => update({title:e.target.value})}/><TextField size="small" label="الدرجة العظمى" type="number" defaultValue={item.maxScore} inputProps={{min:1}} onChange={e => update({maxScore:Number(e.target.value)})}/><Button color="error" onClick={() => update({remove:true})}>حذف البند</Button></Stack>;
        })}
        <Typography sx={{mt:.75}} color="text.secondary">يمكن تسجيل درجات البنود المحفوظة في الجدول، ثم الضغط على حفظ الدرجات اليدوية.</Typography>
      </Box>}
      <TableContainer sx={{ borderRadius: "10px", border: "1px solid #e5eaf0", overflowX: "auto" }}><Table size="small" sx={{ minWidth: 690, "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": { bgcolor: "#fafbfd" }, "& .MuiTableCell-root": { py: .95 } }}><TableHead><TableRow><TableCell sx={headCellSx}>الطالب</TableCell><TableCell sx={headCellSx}>المهام والمشاركة (40)</TableCell><TableCell sx={headCellSx}>التقويم التحريري ({sheet.maxScores?.written ?? (continuous ? 60 : 20)})</TableCell>{(sheet.writtenItems || []).map(item => <TableCell sx={headCellSx} key={item._id}>{item.title} ({item.maxScore})</TableCell>)}{!continuous && <TableCell sx={headCellSx}>اختبار نهاية الفترة (40)</TableCell>}<TableCell sx={headCellSx}>المجموع (100)</TableCell></TableRow></TableHead>
      <TableBody>{(sheet.students || []).map((s) => <TableRow key={idOf(s.studentId)}><TableCell>{s.name}</TableCell><TableCell>{mark(s.performance?.score)}</TableCell><TableCell>{mark(s.written?.score)}</TableCell>{(sheet.writtenItems || []).map(item => <TableCell key={item._id}>{approved ? mark(s.written?.marks?.[item._id]) : <TextField size="small" type="number" sx={{width:95}} inputProps={{min:0,max:item.maxScore}} defaultValue={s.written?.marks?.[item._id] ?? ""} onChange={e => setWrittenMarks(prev => ({...prev,[item._id]:{...prev[item._id],[idOf(s.studentId)]:e.target.value}}))}/>}</TableCell>)}{!continuous && <TableCell>{approved ? mark(s.final?.score) : <TextField size="small" type="number" sx={{ width: 110 }} inputProps={{ min: 0, max: 40, step: "any" }} value={finalMarks[idOf(s.studentId)] ?? (s.final?.source === "manual" ? s.final?.score ?? "" : "")} placeholder={s.final?.source === "electronic" ? String(s.final.score) : "—"} onChange={(e) => setFinalMarks((prev) => ({ ...prev, [idOf(s.studentId)]: e.target.value }))} />}</TableCell>}<TableCell>{s.complete ? mark(s.total) : "غير مكتمل"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <Typography color="text.secondary" sx={{ mt: 1.2, fontSize: 12 }}>تُحسب المشاركة والواجبات والتقويمات الإلكترونية تلقائيًا من بيانات المدرسة. تُستبعد حصص الغياب من حساب نسب المشاركة.</Typography>
    </Paper>}
    </Box>
  </Box>;
}
