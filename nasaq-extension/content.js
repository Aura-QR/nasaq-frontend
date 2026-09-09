(() => {
  'use strict';
  if (window.__nasaqPrepLoaded) return;
  window.__nasaqPrepLoaded = true;
  const C = globalThis.NasaqPrep;
  const DAYS = { sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
    thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' };
  const LABELS = { draft: 'مسودة', needs_revision: 'تحتاج تعديل', pending: 'قيد المراجعة', approved: 'معتمدة', unknown: 'حالة غير معروفة' };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const state = { open: false, loading: false, busy: false, cancel: false, weekOf: today(), week: null,
    teacherId: '', teachers: null, chosen: new Map(), ticked: new Set(), lessons: new Map(),
    error: '', result: null, progress: '', withContent: true, andSubmit: true, session: null, version: 0 };
  const root = document.createElement('div');
  root.className = 'nasaq-prep-root'; root.dir = 'rtl'; document.body.appendChild(root);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, action, disabled = false, cls = 'nq-btn') => {
    const node = el('button', cls, text); node.type = 'button'; node.disabled = disabled;
    node.addEventListener('click', action); return node;
  };
  const link = (text, path) => {
    const node = el('a', 'nq-link', text); node.href = path; node.target = '_blank'; node.rel = 'noopener'; return node;
  };
  const preparationLink = (container, text, preparationId = '', edit = false) => {
    const path = C.preparationPath(state.session?.role, preparationId, edit);
    if (path) container.appendChild(link(text, path));
  };
  const slots = () => (state.week?.days || []).flatMap((day) => (day.slots || []).map((slot) =>
    ({ ...slot, dayOfWeek: day.dayOfWeek, date: day.date })));
  const eligible = (slot) => C.editable(slot) && Boolean(C.pairKey(slot)) && Boolean(slot.lectureId);
  const session = () => new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'NASAQ_SESSION' }, (response) => {
        const error = chrome.runtime.lastError;
        resolve(error || !response ? { ok: false, status: 0,
          message: 'توقفت الإضافة أو تم تحديثها. أعد تحميل صفحة نسق ثم حاول مجددًا.' } : response);
      });
    } catch {
      resolve({ ok: false, status: 0, message: 'أعد تحميل صفحة نسق لتفعيل الإضافة من جديد.' });
    }
  });
  async function api(path, options = {}, expected = state.session) {
    const current = await session();
    if (!current.ok) return current;
    if (!expected || current.base !== expected.base || current.token !== expected.token)
      return C.failure(401, { message: 'تغيّر الحساب أو الخادم. حدّث الأسبوع قبل المتابعة.' });
    // The configured backend permits the frontend origin. Keeping fetch here also
    // lets 90-second AI requests outlive the MV3 service worker's fetch lifetime.
    return C.request(current.base, current.token, path, options);
  }
  async function loadWeek({ preserve = false } = {}) {
    if (state.busy && !preserve) return;
    const version = ++state.version;
    state.loading = true; state.error = ''; state.week = null;
    state.chosen.clear(); state.ticked.clear(); state.lessons.clear();
    if (!preserve) state.result = null;
    render();
    const current = await session();
    if (version !== state.version) return;
    if (!current.ok) {
      state.loading = false; state.error = current.message;
      state.teachers = null; state.teacherId = ''; state.session = null;
      render(); return;
    }
    if (state.session && (current.token !== state.session.token || current.base !== state.session.base)) {
      state.teacherId = ''; state.teachers = null;
    }
    state.session = current;
    const query = new URLSearchParams({ weekOf: state.weekOf });
    if (state.teacherId) query.set('teacherId', state.teacherId);
    const response = await api(`/preparation/weekly?${query}`, {}, current);
    if (version !== state.version) return;
    state.loading = false;
    if (!response.ok) { state.error = response.message; render(); return; }
    if (Array.isArray(response.data?.teachers) && !Array.isArray(response.data?.days)) {
      state.teachers = response.data.teachers; state.teacherId = ''; render(); return;
    }
    if (!Array.isArray(response.data?.days) || response.data.days.some((day) =>
      !Array.isArray(day?.slots) || day.slots.some((slot) => !slot?.lectureId))) {
      state.error = 'بيانات الأسبوع غير مكتملة. تحقّق من إصدار الخادم ثم أعد المحاولة.'; render(); return;
    }
    state.week = response.data;
    for (const slot of slots()) {
      const lesson = C.id(slot.preparation?.lessonId);
      if (lesson) state.chosen.set(slot.lectureId, lesson);
      if (!preserve && eligible(slot) && C.status(slot) !== 'needs_revision') state.ticked.add(slot.lectureId);
    }
    render();
    void loadLessons(version, current);
  }
  async function loadLessons(version, current) {
    for (const key of new Set(slots().filter(eligible).filter((slot) => !C.id(slot.preparation?.lessonId)).map(C.pairKey))) {
      if (version !== state.version) return;
      const [subjectId, gradeLevelId] = key.split('|');
      const units = await api(`/curriculum/units?${new URLSearchParams({ subjectId, gradeLevelId })}`, {}, current);
      if (version !== state.version) return;
      const entry = { groups: [], error: '' };
      if (!units.ok || !Array.isArray(units.data)) entry.error = units.message || 'استجابة المنهج غير صالحة.';
      else for (const unit of units.data) {
        const lessons = await api(`/curriculum/units/${encodeURIComponent(C.id(unit))}/lessons`, {}, current);
        if (version !== state.version) return;
        if (!lessons.ok || !Array.isArray(lessons.data)) { entry.error = lessons.message || 'استجابة الدروس غير صالحة.'; break; }
        entry.groups.push({ unit: unit.name, lessons: lessons.data });
      }
      state.lessons.set(key, entry); render();
      if (units.status === 401 || units.status === 403) break;
    }
  }
  async function prepare() {
    if (state.busy || state.loading || !state.week) return;
    const rows = slots().filter((slot) => eligible(slot) && state.ticked.has(slot.lectureId)).map((slot) => ({
      lectureId: slot.lectureId, preparationId: C.id(slot.preparation), existing: Boolean(slot.preparation),
      originalLessonId: C.id(slot.preparation?.lessonId), lessonId: state.chosen.get(slot.lectureId) || '',
      label: `${DAYS[slot.dayOfWeek] || slot.dayOfWeek} · ح${slot.slot} · ${slot.subject?.name || ''} · ${slot.class?.name || ''}`,
    }));
    if (!rows.length) return;
    if (state.withContent && rows.some((row) => !row.lessonId)) {
      state.error = 'اختر درسًا لكل حصة محددة لتوليد المحتوى. لحفظ مسودات دون دروس، أوقف التوليد والإرسال للمراجعة.';
      render(); return;
    }
    if (state.andSubmit && rows.some((row) => !row.lessonId)) {
      state.error = 'الإرسال يتطلب درسًا ومحتوى رقميًا وتكليفًا وهدفًا. اختر الدروس أو أوقف الإرسال لحفظ المسودات.';
      render(); return;
    }
    const expected = state.session;
    state.busy = true; state.cancel = false; state.error = ''; state.result = null; render();
    try {
      state.result = await C.run({ rows, weekOf: state.weekOf, withContent: state.withContent, andSubmit: state.andSubmit,
        api: (path, options) => api(path, options, expected), cancelled: () => state.cancel,
        progress: (text) => { state.progress = text; render(); } });
    } catch {
      state.error = 'توقفت العملية بشكل غير متوقع. راجع التحاضير المحفوظة قبل إعادة المحاولة.';
    } finally {
      state.busy = false; state.progress = ''; render();
      const error = state.error;
      await loadWeek({ preserve: true });
      if (error) state.error = [error, state.error].filter(Boolean).join(' — ');
      render();
    }
  }
  function renderSlot(slot) {
    const row = el('div', 'nq-row');
    const status = C.status(slot); const busy = state.busy || state.loading;
    const box = el('input', 'nq-check'); box.type = 'checkbox';
    box.checked = state.ticked.has(slot.lectureId); box.disabled = busy || !eligible(slot);
    box.setAttribute('aria-label', `تحديد الحصة ${slot.slot} ${slot.subject?.name || ''} ${slot.class?.name || ''}`);
    box.addEventListener('change', () => {
      if (box.checked) state.ticked.add(slot.lectureId); else state.ticked.delete(slot.lectureId);
      renderFooter();
    });
    row.appendChild(box);
    const meta = el('div', 'nq-meta');
    meta.appendChild(el('div', 'nq-title', `ح${slot.slot} · ${slot.subject?.name || 'بدون مادة'}`));
    meta.appendChild(el('div', 'nq-sub', [slot.class?.name, slot.subject?.gradeLevel?.name].filter(Boolean).join(' · ')));
    row.appendChild(meta);
    if (slot.preparation) {
      row.appendChild(el('span', C.editable(slot) ? 'nq-tag nq-tag-warn' : 'nq-tag nq-tag-done', LABELS[status] || LABELS.unknown));
      preparationLink(row, 'فتح التحضير', C.id(slot.preparation), C.editable(slot));
    }
    if (!C.editable(slot)) return row;
    if (!C.pairKey(slot)) {
      row.appendChild(el('div', 'nq-row-help', 'بدون مادة أو صف — اطلب من الإدارة تصحيح بيانات الحصة.')); return row;
    }
    if (C.id(slot.preparation?.lessonId)) {
      row.appendChild(el('div', 'nq-row-help', `الدرس: ${slot.preparation.lessonTitle || 'درس محفوظ'} — لتغييره افتح التحضير وراجع محتواه.`));
    } else {
      const entry = state.lessons.get(C.pairKey(slot));
      const select = el('select', 'nq-select'); select.setAttribute('aria-label', `درس الحصة ${slot.slot} ${slot.subject?.name || ''}`);
      if (!entry) { select.appendChild(new Option('جارٍ تحميل الدروس…', '')); select.disabled = true; }
      else if (entry.error) {
        select.appendChild(new Option('تعذر تحميل الدروس', '')); select.disabled = true;
        row.appendChild(el('div', 'nq-row-help nq-error-text', `${entry.error} استخدم تحديث الأسبوع لإعادة المحاولة.`));
      } else if (!entry.groups.some((g) => g.lessons.length)) {
        select.appendChild(new Option('لا توجد دروس في المنهج', '')); select.disabled = true;
        row.appendChild(el('div', 'nq-row-help', 'اطلب من الإدارة استيراد منهج هذه المادة والصف. يمكنك حفظ مسودة فقط.'));
      } else {
        select.appendChild(new Option('اختر درسًا…', ''));
        for (const group of entry.groups) {
          const optgroup = el('optgroup'); optgroup.label = group.unit;
          for (const lesson of group.lessons) optgroup.appendChild(new Option(lesson.name, C.id(lesson)));
          select.appendChild(optgroup);
        }
        select.value = state.chosen.get(slot.lectureId) || ''; select.disabled = busy;
        select.addEventListener('change', () => { state.chosen.set(slot.lectureId, select.value); renderFooter(); });
      }
      row.appendChild(select);
    }
    if (status === 'needs_revision') row.appendChild(el('div', 'nq-row-help',
      'راجع ملاحظات المراجع وعدّل التحضير قبل تحديده للإرسال. التوليد يملأ الفراغات فقط.'));
    return row;
  }
  function renderFooter() {
    const footer = root.querySelector('.nq-footer'); if (!footer) return;
    footer.textContent = '';
    const busy = state.busy || state.loading;
    for (const [key, title] of [['withContent', 'اكتب الحقول الفارغة تلقائيًا'], ['andSubmit', 'أرسل التحاضير المكتملة للمراجعة']]) {
      const label = el('label', 'nq-toggle'); const box = el('input'); box.type = 'checkbox'; box.checked = state[key]; box.disabled = busy;
      box.addEventListener('change', () => { state[key] = box.checked; renderFooter(); });
      label.append(box, el('span', null, title)); footer.appendChild(label);
    }
    const selected = slots().filter((slot) => state.ticked.has(slot.lectureId));
    const missing = selected.filter((slot) => !state.chosen.get(slot.lectureId)).length;
    if (missing) footer.appendChild(el('div', 'nq-row-help', `${missing} حصة محددة دون درس. التوليد والإرسال يحتاجان اختيار الدروس.`));
    const progress = el('div', 'nq-progress', state.busy ? state.progress : '');
    progress.setAttribute('role', 'status'); footer.appendChild(progress);
    footer.appendChild(button(`حضّر المحدد (${selected.length})`, prepare,
      busy || !selected.length || ((state.withContent || state.andSubmit) && missing > 0), 'nq-btn nq-btn-main'));
    if (state.busy) footer.appendChild(button(state.cancel ? 'سيتم التوقف بعد الطلب الحالي' : 'إيقاف بعد الطلب الحالي', () => {
      state.cancel = true; renderFooter();
    }, state.cancel));
  }
  function render() {
    const bodyScroll = root.querySelector('.nq-body')?.scrollTop || 0;
    const guideOpen = root.querySelector('.nq-guide')?.open || false;
    root.textContent = '';
    const fab = button(state.open ? 'إغلاق' : 'حضّر أسبوعي', () => {
      state.open = !state.open; render();
      if (state.open && !state.week && !state.loading && !state.busy) void loadWeek();
    }, false, 'nq-fab');
    fab.setAttribute('aria-expanded', String(state.open)); fab.setAttribute('aria-controls', 'nq-panel'); root.appendChild(fab);
    if (!state.open) return;
    const busy = state.loading || state.busy;
    const panel = el('section', 'nq-panel'); panel.id = 'nq-panel'; panel.setAttribute('aria-label', 'تحضير الأسبوع');
    const head = el('div', 'nq-head'); head.appendChild(el('div', 'nq-h1', 'تحضير الأسبوع'));
    const date = el('input', 'nq-week'); date.type = 'date'; date.value = state.weekOf; date.disabled = busy;
    date.setAttribute('aria-label', 'تاريخ داخل الأسبوع المطلوب');
    date.addEventListener('change', () => {
      if (date.value) { state.weekOf = date.value; void loadWeek(); }
      else date.value = state.weekOf;
    });
    head.append(date, button('تحديث', () => void loadWeek(), busy)); panel.appendChild(head);
    const body = el('div', 'nq-body');
    const guide = el('details', 'nq-guide'); guide.appendChild(el('summary', null, 'طريقة الاستخدام وحل المشكلات'));
    guide.open = guideOpen;
    guide.appendChild(el('p', null, '١. اختر الأسبوع والمعلم. ٢. حدّد الحصص واختر درس كل حصة. ٣. اختر حفظ المسودات أو التوليد أو الإرسال. التحاضير المعتمدة والمُرسلة لا تُعدّل هنا.'));
    guide.appendChild(el('p', null, 'الإرسال يحتاج درسًا من المنهج، وهدفًا، ومحتوى رقميًا، وتكليفًا واحدًا على الأقل. افتح التحضير لإكمال النواقص أو مراجعة ملاحظات التعديل.'));
    guide.appendChild(el('p', null, 'التوليد يملأ الفراغات فقط، ويتطلب تفعيل خدمة التوليد على الخادم. افحص المحتوى قبل الإرسال. أوقف خيار الإرسال إذا أردت مراجعته أولًا.'));
    guide.appendChild(el('p', null, 'أبقِ صفحة نسق مفتوحة أثناء التنفيذ. إغلاق اللوحة لا يوقف العمل. الإيقاف ينتظر الطلب الجاري، والدفعات السابقة تظل محفوظة. عند انقطاع الاتصال حدّث الأسبوع قبل إعادة المحاولة.'));
    if (['OWNER', 'MANAGER'].includes(state.session?.role)) guide.appendChild(link('المناهج والدروس', '/school/curriculum'));
    else guide.appendChild(el('p', null, 'استيراد المنهج وإدارته متاحان للمالك والمدير. اطلب منهما إعداد دروس المادة والصف.'));
    preparationLink(guide, state.session?.role === 'TEACHER' ? 'تحضيراتي' : 'كل التحاضير');
    body.appendChild(guide);
    if (state.error) { const alert = el('div', 'nq-alert nq-alert-error', state.error); alert.setAttribute('role', 'alert'); body.appendChild(alert); }
    if (state.teachers) {
      const picker = el('select', 'nq-select nq-teacher'); picker.setAttribute('aria-label', 'المعلم'); picker.disabled = busy;
      picker.appendChild(new Option('اختر المعلم…', ''));
      for (const row of state.teachers) {
        const person = row.teacher ?? row; picker.appendChild(new Option(`${person.name || 'بدون اسم'} · ${row.total ?? 0} حصة`, C.id(person)));
      }
      picker.value = state.teacherId;
      picker.addEventListener('change', () => { state.teacherId = picker.value; void loadWeek(); }); body.appendChild(picker);
      if (!state.teacherId) body.appendChild(el('div', 'nq-empty', state.teachers.length ? 'اختر معلمًا لعرض حصصه.' : 'لا يوجد معلمون لديهم حصص في هذا الأسبوع.'));
    }
    if (state.result) {
      const r = state.result;
      const summary = el('div', 'nq-alert nq-alert-ok',
        `${r.stopped ? 'توقفت العملية. ' : 'انتهت العملية. '}تم إنشاء ${r.created} · موجود مسبقًا ${r.skipped} · حُفظ درس ${r.saved} · تم توليد ${r.generated} · أُرسل ${r.submitted}`);
      summary.setAttribute('role', 'status'); body.appendChild(summary);
      if (r.skipped) body.appendChild(el('div', 'nq-row-help', 'الحصص الموجودة مسبقًا لم تُعدّل. راجع حالتها بعد التحديث وحدّد المسودات المطلوبة.'));
      for (const issue of r.problems) {
        const node = el('div', 'nq-alert nq-alert-error', `${issue.label} — ${issue.stage}: ${issue.message}`);
        if (issue.preparationId) preparationLink(node, state.session?.role === 'TEACHER' ? 'فتح لإكمال التحضير' : 'فتح لمراجعة التحضير', issue.preparationId, true);
        body.appendChild(node);
      }
    }
    if (state.loading) body.appendChild(el('div', 'nq-empty', 'جارٍ تحميل الأسبوع…'));
    else if (state.week) {
      const all = slots(); const counts = {};
      for (const slot of all) counts[C.status(slot)] = (counts[C.status(slot)] || 0) + 1;
      body.appendChild(el('div', 'nq-stats', `${all.length} حصة · ${counts.none || 0} بلا تحضير · ${counts.draft || 0} مسودة · ${counts.needs_revision || 0} تحتاج تعديل · ${counts.pending || 0} قيد المراجعة · ${counts.approved || 0} معتمدة`));
      const actions = el('div', 'nq-actions');
      actions.append(button('تحديد الحصص المتاحة', () => {
        for (const slot of all.filter(eligible)) if (C.status(slot) !== 'needs_revision') state.ticked.add(slot.lectureId);
        render();
      }, busy), button('إلغاء التحديد', () => { state.ticked.clear(); render(); }, busy)); body.appendChild(actions);
      for (const day of state.week.days) {
        if (!day.slots.length) continue;
        const section = el('div', 'nq-day'); section.appendChild(el('div', 'nq-day-h', `${DAYS[day.dayOfWeek] || day.dayOfWeek} · ${day.date}`));
        for (const slot of day.slots) section.appendChild(renderSlot(slot)); body.appendChild(section);
      }
      if (!all.length) body.appendChild(el('div', 'nq-empty', 'لا توجد حصص. تأكد من الأسبوع ومن إعداد الجدول الدراسي لدى الإدارة.'));
    }
    panel.append(body, el('div', 'nq-footer')); root.appendChild(panel); renderFooter(); body.scrollTop = bodyScroll;
  }
  window.addEventListener('beforeunload', (event) => {
    if (state.busy) { event.preventDefault(); event.returnValue = ''; }
  });
  render();
})();
