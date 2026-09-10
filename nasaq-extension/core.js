/* Shared rules and workflow, exercised by node regression tests. */
(() => {
  'use strict';
  const DEFAULT_API = 'https://api.nasaqedu.org';
  const LEGACY_APIS = new Set([
    'https://api.nasaq.185.170.196.120.sslip.io',
    'http://api.nasaq.185.170.196.120.sslip.io',
  ]);
  const id = (value) => String(value?._id ?? value ?? '');
  const RESOURCE_LABELS = { enrichment: 'إثراء', homework: 'واجب', quiz: 'امتحان', activity: 'نشاط' };
  const validExamDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const examIssue = (exam) => {
    if (!exam || !['quiz', 'final', 'assignment', 'activity'].includes(exam.examType) ||
        !validExamDate(exam.startDate) || !validExamDate(exam.endDate) || exam.endDate < exam.startDate ||
        !Number.isInteger(exam.duration) || exam.duration < 1 || exam.duration > 240 ||
        !Number.isInteger(exam.questionCount) || exam.questionCount < 1 || exam.questionCount > 20)
      return 'حدد تواريخ الامتحان بالترتيب الصحيح، والمدة من ١ إلى ٢٤٠ دقيقة، وعدد الأسئلة من ١ إلى ٢٠.';
    return '';
  };
  // Navigation hint only. The API verifies the JWT and enforces permissions.
  const sessionRole = (token) => {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return String(JSON.parse(atob(payload)).role || '').trim().toUpperCase();
    } catch { return ''; }
  };
  const preparationPath = (role, preparationId = '', edit = false) => {
    const teacher = role === 'TEACHER';
    if (!teacher && !['OWNER', 'MANAGER', 'SUPERVISOR'].includes(role)) return '';
    const base = teacher ? '/teacher/preparations' : '/school/preparation';
    return preparationId ? `${base}/${teacher && edit ? 'edit/' : ''}${encodeURIComponent(preparationId)}` : base;
  };
  const status = (slot) => slot.preparation?.reviewStatus || (slot.preparation ? 'unknown' : 'none');
  const editable = (slot) => ['none', 'draft', 'needs_revision'].includes(status(slot));
  const pairKey = (slot) => {
    const subject = id(slot.subject?.subjectId);
    const grade = id(slot.subject?.gradeLevel?._id);
    return subject && grade ? `${subject}|${grade}` : '';
  };
  function apiBase(value = DEFAULT_API) {
    let url;
    try { url = new URL(value.trim() || DEFAULT_API); }
    catch { throw new Error('عنوان API غير صالح. أدخل عنوانًا كاملًا يبدأ بـ http:// أو https://.'); }
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((!local && url.origin !== DEFAULT_API && !LEGACY_APIS.has(url.origin)) || !['http:', 'https:'].includes(url.protocol) ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('استخدم عنوان خادم نسق الرسمي أو localhost / 127.0.0.1 مع المنفذ، دون مسار أو بيانات دخول.');
    }
    // Existing installations may still have the previous production API saved.
    return LEGACY_APIS.has(url.origin) ? DEFAULT_API : url.origin;
  }
  const message = (value) => Array.isArray(value) ? value.map(message).filter(Boolean).join(' — ')
    : typeof value === 'string' ? value : '';
  function failure(code, payload, uncertain = false) {
    const guides = {
      401: 'سجّل الدخول مجددًا ثم حدّث الأسبوع.',
      403: 'اطلب من مسؤول المدرسة مراجعة صلاحيات التحضير والمنهج.',
      404: 'حدّث الأسبوع؛ قد يكون السجل حُذف أو عنوان الخادم غير صحيح.',
      409: 'تم تغيير البيانات. حدّث الأسبوع وراجع التحضير قبل المحاولة مجددًا.',
      429: 'انتظر قليلًا قبل إعادة المحاولة.',
    };
    return { ok: false, status: code, uncertain,
      message: [message(payload?.message) || `تعذر تنفيذ الطلب (${code})`, guides[code] ||
        (code >= 500 ? 'تعذر إكمال العملية على الخادم. حدّث الأسبوع للتحقق من المحفوظ.' : ''),
        uncertain ? 'قد يكون الخادم حفظ الطلب. تحقّق من التحضير قبل إعادة المحاولة.' : '',
      ].filter(Boolean).join(' — ') };
  }
  async function request(base, token, path, { method = 'GET', body } = {}) {
    const write = method !== 'GET';
    try {
      const response = await fetch(`${base}${path}`, {
        method, credentials: 'omit', redirect: 'error',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(path.endsWith('/generate') ? 120000 : 30000),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.status === false || payload?.success === false)
        return failure(response.status, payload, write && response.status >= 500);
      if (!payload || typeof payload !== 'object')
        return failure(response.status, { message: 'استجابة غير صالحة. تحقّق من عنوان API في إعدادات الإضافة.' }, write);
      return { ok: true, data: payload.data ?? payload, message: message(payload.message) };
    } catch (error) {
      const timeout = ['TimeoutError', 'AbortError'].includes(error?.name);
      return failure(0, { message: timeout ? 'انتهت مهلة الاتصال.' :
        'تعذر الوصول إلى نسق. تحقّق من الإنترنت وعنوان API وإعدادات CORS على الخادم.' }, write);
    }
  }
  // Never replay ambiguous mutations: a lost response may follow a successful save.
  async function run({ rows, weekOf, withContent, andSubmit, api, progress, cancelled }) {
    const result = { created: 0, skipped: 0, generated: 0, submitted: 0, saved: 0, resourcesAdded: 0, exams: [], problems: [], stopped: false };
    const problem = (row, stage, response) => {
      result.problems.push({ lectureId: row.lectureId, preparationId: row.preparationId,
        label: row.label, stage, message: response.message });
      if (response.uncertain || [0, 401, 403, 429].includes(response.status)) result.stopped = true;
    };
    const fresh = rows.filter((row) => !row.preparationId);
    const requestedRows = rows.filter((row) => row.resourceTypes !== undefined);
    for (const row of requestedRows) {
      if (!Array.isArray(row.resourceTypes) || row.resourceTypes.some((type) => !RESOURCE_LABELS[type])) {
        problem(row, 'الإضافات', { message: 'اختيارات الإضافات غير صالحة.' }); result.stopped = true; return result;
      }
      if (row.resourceTypes.includes('quiz') && examIssue(row.exam)) {
        problem(row, 'إعداد الامتحان', { message: examIssue(row.exam) }); result.stopped = true; return result;
      }
    }
    if (requestedRows.length && (withContent || requestedRows.some((row) => row.resourceTypes.length))) {
      progress('جارٍ التحقق من دعم الإضافات…');
      const capabilities = await api('/preparation/generation-options');
      if (!capabilities.ok || capabilities.data?.version !== 1 ||
          !Object.keys(RESOURCE_LABELS).every((type) => capabilities.data?.resourceTypes?.includes(type)) ||
          (requestedRows.some((row) => row.resourceTypes.includes('quiz')) && !capabilities.data?.linkedExams)) {
        problem({ label: 'خدمة التحضير' }, 'الإضافات', { message: 'تعذر تأكيد دعم اختيارات الإضافات. يجب نشر تحديث الخادم وسير عمل التوليد قبل الاستخدام. ' + (capabilities.message || ''), status: capabilities.status });
        result.stopped = true; return result;
      }
    }
    for (let start = 0; start < fresh.length; start += 40) {
      if (cancelled() || result.stopped) break;
      const batch = fresh.slice(start, start + 40);
      progress(`جارٍ حفظ الحصص ${start + 1}–${start + batch.length}`);
      const response = await api('/preparation/bulk', { method: 'POST', body: {
        weekOf, items: batch.map(({ lectureId, lessonId }) => ({ lectureId, ...(lessonId ? { lessonId } : {}) })),
      } });
      if (!response.ok) {
        problem({ label: `دفعة الحصص ${start + 1}–${start + batch.length}` }, 'الحفظ', response);
        result.stopped = true;
        break;
      }
      const records = response.data?.results;
      if (!Array.isArray(records) || batch.some((row) => !records.some((r) =>
        r?.lectureId === row.lectureId && r.preparationId && ['created', 'skipped'].includes(r.status)))) {
        problem({ label: 'دفعة الحصص' }, 'الحفظ', { message: 'لم يصل تأكيد كامل للحفظ. حدّث الأسبوع للتحقق.', uncertain: true });
        break;
      }
      for (const row of batch) {
        const record = records.find((r) => r.lectureId === row.lectureId);
        row.preparationId = id(record.preparationId);
        if (record.status === 'created') result.created++;
        else { result.skipped++; row.skipped = true; }
      }
    }
    let done = 0;
    for (const row of rows) {
      if (cancelled() || result.stopped) break;
      if (!row.preparationId || row.skipped) continue;
      progress(`جارٍ إكمال الحصص ${++done}/${rows.length}`);
      if (row.existing) {
        const current = await api(`/preparation/${row.preparationId}`);
        if (!current.ok) { problem(row, 'قراءة المسودة', current); continue; }
        if (cancelled()) break;
        if (!['draft', 'needs_revision'].includes(current.data?.reviewStatus)) {
          problem(row, 'قراءة المسودة', { message: 'تغيّرت حالة التحضير. افتحه للمراجعة وحدّث الأسبوع.' });
          continue;
        }
        const currentLesson = id(current.data.lessonId);
        if (currentLesson !== row.originalLessonId) {
          problem(row, 'اختيار الدرس', { message: 'تغيّر درس المسودة. حدّث الأسبوع قبل المتابعة.' });
          continue;
        }
        if (row.lessonId && row.lessonId !== currentLesson) {
          const saved = await api(`/preparation/${row.preparationId}`, { method: 'PATCH', body: { lessonId: row.lessonId } });
          if (!saved.ok) { problem(row, 'حفظ الدرس', saved); continue; }
          result.saved++;
        }
      }
      if (cancelled()) break;
      if (withContent || row.resourceTypes?.length) {
        if (!row.lessonId) {
          problem(row, 'المحتوى', { message: 'المسودة محفوظة دون درس. اختر درسًا أو اطلب استيراد المنهج ثم أعد المحاولة.' });
          continue;
        }
        const generated = await api(`/preparation/${row.preparationId}/generate`, { method: 'POST',
          ...(row.resourceTypes !== undefined ? { body: { resourceTypes: [...row.resourceTypes], includeContent: withContent,
            ...(row.resourceTypes.includes('quiz') ? { exam: { ...row.exam } } : {}) } } : {}) });
        if (!generated.ok) { problem(row, 'توليد المحتوى', generated); continue; }
        result.generated++;
        let incomplete = false;
        for (const type of row.resourceTypes || []) {
          const resource = generated.data?.resourceResults?.find((item) => item.type === type);
          if (!resource || !['created', 'existing'].includes(resource.status)) {
            problem(row, RESOURCE_LABELS[type], { message: resource?.message || 'لم يؤكد الخادم إضافة هذا النوع. افتح التحضير للتحقق ثم أعد المحاولة.' });
            incomplete = true;
          } else {
            if (resource.status === 'created') result.resourcesAdded++;
            if (resource.examId) result.exams.push({ examId: resource.examId, label: row.label });
          }
        }
        if (incomplete) continue;
      }
      if (cancelled()) break;
      if (andSubmit) {
        const submitted = await api(`/preparation/${row.preparationId}/submit`, { method: 'POST' });
        if (!submitted.ok) { problem(row, 'تحضير ناقص', submitted); continue; }
        result.submitted++;
      }
    }
    result.stopped ||= cancelled();
    return result;
  }
  globalThis.NasaqPrep = { DEFAULT_API, RESOURCE_LABELS, examIssue, id, sessionRole, preparationPath, status, editable, pairKey, apiBase, failure, request, run };
})();
