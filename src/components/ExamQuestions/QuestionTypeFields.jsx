import { Stack, TextField, MenuItem, Button } from '@mui/material';
import { ESSAY_QUESTIONS_ENABLED } from '@/utils/featureFlags';
export default function QuestionTypeFields({ question, onChange }) {
  const type = question.type || 'mcq';
  return <Stack spacing={1} sx={{ mt: 1 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <TextField select fullWidth size="small" label="نوع السؤال" value={type} onChange={e => {
        if (e.target.value === type) return;
        if ((question.question || question.correctAnswer || question.options?.some(Boolean) || question.modelAnswer) && !window.confirm('سيتم حذف الخيارات والإجابة الحالية لهذا السؤال. هل تريد المتابعة؟')) return;
        onChange({ type: e.target.value, options: e.target.value === 'true_false' ? ['صح', 'خطأ'] : e.target.value === 'essay' ? [] : ['', '', '', ''], correctAnswer: '', modelAnswer: '' });
      }}>
        <MenuItem value="mcq">اختيار من متعدد</MenuItem><MenuItem value="true_false">صح أو خطأ</MenuItem>
        {(ESSAY_QUESTIONS_ENABLED || type === 'essay') && <MenuItem value="essay">مقالي</MenuItem>}
      </TextField>
      <TextField fullWidth size="small" type="number" label="الدرجة" value={question.marks ?? ''} inputProps={{ min: 0.25, step: 0.25 }} onChange={e => onChange({ marks: e.target.value })} />
    </Stack>
    {type === 'true_false' && <Stack direction="row" spacing={1}>{['صح', 'خطأ'].map(answer => <Button key={answer} type="button" fullWidth variant={question.correctAnswer === answer ? 'contained' : 'outlined'} onClick={() => onChange({ correctAnswer: answer })}>{answer}</Button>)}</Stack>}
    {type === 'essay' && <TextField multiline minRows={3} label="الإجابة النموذجية (اختيارية)" value={question.modelAnswer || ''} inputProps={{ maxLength: 2000 }} helperText="تظهر لك أثناء التصحيح، وتظهر للطالب بعد تصحيح إجابته" onChange={e => onChange({ modelAnswer: e.target.value })} />}
  </Stack>;
}
