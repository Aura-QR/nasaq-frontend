import { useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { fetchExamReview, saveExamReview } from '@/APIs/school/exams';
export default function EssayReview({ examId, onSaved, reviewRef }) {
  const [mode,setMode]=useState('pending');
  const [data,setData]=useState(null);
  const [edits,setEdits]=useState({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const dirty=Object.keys(edits).length>0;
  const [pendingRequested, setPendingRequested] = useState(false);
  useImperativeHandle(reviewRef, () => ({
    selectPending: () => setPendingRequested(true),
  }), []);
  useEffect(() => {
    if (!pendingRequested || busy) return;
    setPendingRequested(false);
    if (mode === 'pending') return;
    if (dirty && !window.confirm('توجد درجات غير محفوظة. هل تريد المتابعة؟')) return;
    setMode('pending');
  }, [pendingRequested, busy, mode, dirty]);
  const load=useCallback(async()=>{setBusy(true);setError('');try{const r=await fetchExamReview(examId,mode);if(!r.status) throw Error(r.message);setData(r.data);setEdits({});}catch(e){setError(e.message);setData(null);}finally{setBusy(false);}},[examId,mode]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const save=async()=>{const grades=Object.values(edits);if(grades.some(g=>g.earned===''||g.earned==null||!Number.isFinite(Number(g.earned))||Number(g.earned)<0||Number(g.earned)>g.max||!Number.isInteger(Number(g.earned)*4)||g.feedback.length>1000)){setError('تحقّق من الدرجات والملاحظات قبل الحفظ.');return;}setBusy(true);setError('');try{const r=await saveExamReview(examId,grades.map(({studentId,questionId,earned,feedback})=>({studentId,questionId,earned:Number(earned),feedback})));if(!r.status)throw Error(r.message);setMessage(`تم حفظ التصحيح، واكتمل تصحيح ${r.data?.gradedNow?.length ?? 0} طالب`);await load();onSaved?.();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <Paper variant="outlined" sx={{p:2,my:2}}><Stack spacing={2}>
    <Typography fontWeight={800}>تصحيح الإجابات المقالية {data ? `— ${data.pendingCount} بانتظار التصحيح` : ''}</Typography>
    <Stack direction="row" spacing={1}>{[['pending','بانتظار التصحيح'],['all','الكل']].map(([v,label])=><Button key={v} disabled={busy} variant={mode===v?'contained':'outlined'} onClick={()=>{if(!dirty||window.confirm('توجد درجات غير محفوظة. هل تريد المتابعة؟'))setMode(v);}}>{label}</Button>)}</Stack>
    {error&&<Alert severity="error">{error}</Alert>}{message&&<Alert severity="success">{message}</Alert>}{busy&&<Typography>جارٍ التحميل…</Typography>}
    {!busy&&data&&!data.questions?.length&&<Typography>لا توجد إجابات للتصحيح.</Typography>}
    {data?.questions?.map(q=><Box key={q.questionId} sx={{borderTop:'1px solid',borderColor:'divider',pt:2}}><Typography fontWeight={700}>{q.question} ({q.marks} درجات)</Typography>{q.modelAnswer&&<details><summary>الإجابة النموذجية</summary><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{q.modelAnswer}</Typography></details>}{q.answers?.map(a=>{const key=`${q.questionId}:${a.studentId}`;const value=edits[key]??{studentId:a.studentId,questionId:q.questionId,earned:a.earned??'',feedback:a.feedback??'',max:q.marks};const update=patch=>setEdits(old=>({...old,[key]:{...value,...patch}}));return <Paper key={key} variant="outlined" sx={{p:1.5,my:1}}><Typography fontWeight={700}>{a.studentName} — {a.className}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',my:1}}>{a.answer||'—'}</Typography><Stack direction={{xs:'column',sm:'row'}} spacing={1}><TextField disabled={busy} label={`الدرجة من ${q.marks}`} type="number" value={value.earned} inputProps={{min:0,max:q.marks,step:.25}} onChange={e=>update({earned:e.target.value})}/><TextField disabled={busy} fullWidth multiline label="ملاحظة" value={value.feedback} inputProps={{maxLength:1000}} onChange={e=>update({feedback:e.target.value})}/></Stack></Paper>;})}</Box>)}
    <Button variant="contained" disabled={busy||!dirty} onClick={save}>حفظ التصحيح</Button>
  </Stack></Paper>;
}
