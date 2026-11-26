export const marksError = questions => {
  const filled = questions.filter(q => q.marks !== '' && q.marks != null);
  if (!filled.length) return '';
  if (filled.length !== questions.length) return 'حدّد درجة كل سؤال، أو امسح جميع الدرجات لتوزيعها بالتساوي';
  if (filled.some(q => !Number.isFinite(Number(q.marks)) || Number(q.marks) < .25 || !Number.isInteger(Number(q.marks) * 4))) return 'يجب أن تكون درجة كل سؤال من مضاعفات ربع درجة، وألا تقل عن ربع درجة';
  return '';
};
export const serializeQuestion = q => ({
  question: q.question.trim(), type: q.type || 'mcq',
  ...(q.marks !== '' && q.marks != null ? { marks: Number(q.marks) } : {}),
  ...(q.type === 'essay' ? { ...(q.modelAnswer?.trim() ? { modelAnswer: q.modelAnswer.trim() } : {}) } : { options: q.type === 'true_false' ? ['صح','خطأ'] : q.options.map(o => o.trim()), correctAnswer: q.correctAnswer.trim() })
});
