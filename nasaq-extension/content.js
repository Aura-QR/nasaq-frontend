/**
 * نسق — تحضير سريع
 *
 * A floating panel on the Nasaq site that prepares a teacher's whole week in
 * one press, each period with its own lesson.
 *
 * ## Why this is small
 *
 * The Madrasati extension this is modelled on is 7,822 lines, and almost all
 * of it is the cost of not owning the site: reading lesson ids out of the DOM,
 * scraping a CSRF token from a fetched page, creating a silent Activity to
 * satisfy a backend rule, an iframe fallback for when the headless path fails.
 *
 * None of that applies here. Nasaq has an API and the teacher is already
 * signed in to it, so this file asks the server what the week is, asks it what
 * the lessons are, and posts the answer back:
 *
 *   GET  /preparation/weekly?weekOf=       the week, with what is already filed
 *   GET  /curriculum/units?subjectId&grade  the school's own units
 *   GET  /curriculum/units/:id/lessons      and their lessons
 *   POST /preparation/bulk                  { items: [{ lectureId, lessonId }] }
 *
 * There is no DOM scraping anywhere in this file, and there must never be: the
 * moment it reads the page instead of the API, it breaks on the next redesign.
 */

(() => {
  'use strict';

  if (window.__nasaqPrepLoaded) return;
  window.__nasaqPrepLoaded = true;

  const DAY_NAMES = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  };

  const api = (path, options = {}) =>
    new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'NASAQ_API', path, pageUrl: location.href, ...options },
        (response) =>
          resolve(
            response || { ok: false, status: 0, message: 'لم يستجب الإضافة' },
          ),
      );
    });

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /** YYYY-MM-DD in local time. toISOString() would shift the day in +03. */
  const dateOnly = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  };

  const state = {
    open: false,
    loading: false,
    weekOf: dateOnly(new Date()),
    week: null,
    /** subjectId|gradeLevelId -> [{ unit, lessons: [...] }] */
    lessonsByPair: new Map(),
    /** lectureId -> lessonId */
    chosen: new Map(),
    /** lectureId -> true */
    ticked: new Set(),
    error: '',
    result: null,
    /** Write the content too, not just file the period. */
    withContent: true,
    /** Send each finished preparation for review at the end. */
    andSubmit: true,
    /** `${done}/${total}` while generation is running, else null. */
    generating: null,
    /*
     * Owner and manager see the week one teacher at a time.
     *
     * /preparation/weekly answers a TEACHER with her own days, and anybody
     * else with one summary row per teacher. Treating that second shape as
     * "no lectures" is what the panel did at first — it printed "368 حصة"
     * and "لا توجد حصص" in the same breath. It is a list to choose from.
     */
    teachers: null,
    teacherId: '',
  };

  const pairKey = (slot) => {
    const subject = slot?.subject;
    const subjectId = subject?.subjectId;
    const gradeId = subject?.gradeLevel?._id;
    return subjectId && gradeId ? `${subjectId}|${gradeId}` : '';
  };

  /** Every slot the teacher could prepare, flattened out of the day grouping. */
  const preparableSlots = () =>
    (state.week?.days || []).flatMap((day) =>
      (day.slots || []).map((slot) => ({ ...slot, dayOfWeek: day.dayOfWeek, date: day.date })),
    );

  // ----------------------------------------------------------------- loading

  async function loadWeek() {
    state.loading = true;
    state.error = '';
    state.result = null;
    render();

    const query = new URLSearchParams({ weekOf: state.weekOf });
    if (state.teacherId) query.set('teacherId', state.teacherId);
    const response = await api(`/preparation/weekly?${query}`);

    if (!response.ok) {
      state.loading = false;
      state.error = response.message;
      render();
      return;
    }

    // The summary shape: pick a teacher, then ask again for their days.
    if (Array.isArray(response.data?.teachers) && !response.data?.days) {
      state.teachers = response.data.teachers;
      state.week = null;
      state.loading = false;
      render();
      return;
    }

    state.week = response.data;
    state.chosen.clear();
    state.ticked.clear();

    // Tick everything that has no preparation yet and could take one. The
    // teacher is here to fill gaps; making her tick twenty rows first is the
    // work this is supposed to remove.
    for (const slot of preparableSlots()) {
      if (slotState(slot) !== 'sent' && pairKey(slot)) state.ticked.add(slot.lectureId);
    }

    state.loading = false;
    render();
    void loadLessons();
  }

  /**
   * The lessons for every distinct subject-and-grade in the week.
   *
   * One request per pair, not per slot: a teacher with six maths periods in
   * one grade needs that curriculum once.
   */
  async function loadLessons() {
    const pairs = new Set(
      preparableSlots().map(pairKey).filter(Boolean),
    );

    for (const key of pairs) {
      if (state.lessonsByPair.has(key)) continue;
      const [subjectId, gradeLevelId] = key.split('|');

      const units = await api(
        `/curriculum/units?subjectId=${subjectId}&gradeLevelId=${gradeLevelId}`,
      );
      if (!units.ok || !Array.isArray(units.data)) {
        state.lessonsByPair.set(key, []);
        render();
        continue;
      }

      const groups = [];
      for (const unit of units.data) {
        const lessons = await api(`/curriculum/units/${unit._id}/lessons`);
        groups.push({
          unit: unit.name,
          lessons: Array.isArray(lessons.data) ? lessons.data : [],
        });
      }
      state.lessonsByPair.set(key, groups);
      render();
    }
  }

  // ------------------------------------------------------------------ saving

  async function prepare() {
    const items = [];
    // Rows that already hold a draft: the bulk would report them as existing
    // and do nothing, so they go straight to being finished.
    const drafts = [];

    for (const slot of preparableSlots()) {
      if (!state.ticked.has(slot.lectureId)) continue;
      if (slotState(slot) === 'draft') {
        drafts.push({
          preparationId: String(slot.preparation._id),
          lessonTitle: slot.preparation.lessonTitle || '',
        });
        continue;
      }
      const lessonId = state.chosen.get(slot.lectureId);
      items.push({ lectureId: slot.lectureId, ...(lessonId ? { lessonId } : {}) });
    }
    if (!items.length && !drafts.length) return;

    state.loading = true;
    state.error = '';
    render();

    const response = items.length
      ? await api('/preparation/bulk', {
          method: 'POST',
          body: { weekOf: state.weekOf, items },
        })
      : { ok: true, data: { created: 0, skipped: 0, results: [] } };

    state.loading = false;

    if (!response.ok) {
      // The server validates every item before writing any of them, so a
      // refusal means nothing was created — say that, or the teacher will
      // press again and wonder why the count did not move.
      state.error = `${response.message} — لم يتم إنشاء أي تحضير.`;
      render();
      return;
    }

    state.result = response.data;
    render();

    if (state.withContent) {
      await fillContent([
        ...(response.data.results || []).filter((r) => r.status === 'created'),
        ...drafts,
      ]);
    }

    await loadWeek();
  }

  /**
   * Write the warm-up, closure and the rest into each preparation just made.
   *
   * One request per preparation, in sequence: each one is a model call that
   * takes seconds, and a school firing twenty-two at once is a queue nobody
   * asked for. Sequential also means a failure is one row, and the count keeps
   * moving so the teacher can see it is working.
   *
   * Only rows that got a lesson — the server refuses the rest, because content
   * written from a subject name alone is filler.
   */
  async function fillContent(rows) {
    /*
     * Only rows that carry a lesson. The server refuses the rest — content
     * written from a subject name alone is filler — and a school that has not
     * imported a curriculum has none of them, which is why pressing the button
     * there returns instantly having only filed drafts.
     */
    const created = (rows || []).filter((row) => row.lessonTitle);
    if (!created.length) {
      state.error =
        'أُنشئت المسودات، ولم يُكتب محتوى: لم تُختر دروس. استوردي منهج المادة أولًا.';
      render();
      return;
    }

    let done = 0;
    const problems = [];
    state.generating = `0/${created.length}`;
    render();

    for (const row of created) {
      const written = await api(`/preparation/${row.preparationId}/generate`, {
        method: 'POST',
      });

      if (!written.ok) {
        problems.push(written.message);
      } else if (state.andSubmit) {
        /*
         * Submitting is the last thing, and it can legitimately refuse.
         *
         * Nasaq will not accept a preparation without a lesson, a digital
         * content item, an assignment and an objective. Generation supplies
         * all four when the school has them — but a school with nothing in
         * its library has no content item to attach, and the refusal says so.
         * The draft stays, complete but for that one thing.
         */
        const sent = await api(`/preparation/${row.preparationId}/submit`, {
          method: 'POST',
        });
        if (!sent.ok) problems.push(sent.message);
      }

      done++;
      state.generating = `${done}/${created.length}`;
      render();
    }

    state.generating = null;
    if (problems.length) {
      // The same reason repeated twenty-two times is one reason.
      const reasons = [...new Set(problems.filter(Boolean))];
      state.error =
        `التحاضير أُنشئت. ${problems.length} منها لم تكتمل: ` +
        reasons.slice(0, 2).join(' — ');
    }
    render();
  }

  // --------------------------------------------------------------- rendering

  let root = null;

  function mount() {
    root = el('div', 'nasaq-prep-root');
    root.dir = 'rtl';
    document.body.appendChild(root);
  }

  /**
   * What state this period is really in.
   *
   * "Prepared" means two different things in Nasaq, and they disagree on a
   * draft: the schedule page paints a lecture green as soon as any
   * preparation exists, while /preparation/weekly counts anything not
   * submitted as missing. A teacher then sees تم التحضير on the timetable and
   * a counter telling her seventeen are outstanding.
   *
   * This panel follows the counter, because that is the one the school's
   * review actually uses — and it names the state instead of hiding it.
   */
  const slotState = (slot) => {
    const status = slot.preparation?.reviewStatus;
    if (!slot.preparation) return 'none';
    if (status === 'draft' || status === 'needs_revision') return 'draft';
    return 'sent';
  };

  function renderSlot(slot) {
    const row = el('div', 'nq-row');
    const key = pairKey(slot);
    const groups = state.lessonsByPair.get(key);
    const status = slotState(slot);
    const done = status === 'sent';
    const unusable = !key;

    const box = el('input');
    box.type = 'checkbox';
    box.className = 'nq-check';
    box.checked = state.ticked.has(slot.lectureId);
    box.disabled = done || unusable;
    box.addEventListener('change', () => {
      if (box.checked) state.ticked.add(slot.lectureId);
      else state.ticked.delete(slot.lectureId);
      renderFooter();
    });
    row.appendChild(box);

    const meta = el('div', 'nq-meta');
    meta.appendChild(
      el('div', 'nq-title', `ح${slot.slot} · ${slot.subject?.name || 'بدون مادة'}`),
    );
    meta.appendChild(
      el(
        'div',
        'nq-sub',
        [slot.class?.name, slot.subject?.gradeLevel?.name].filter(Boolean).join(' · ') ||
          '—',
      ),
    );
    row.appendChild(meta);

    if (done) {
      row.appendChild(el('span', 'nq-tag nq-tag-done', 'مُرسلة'));
      return row;
    }
    // A draft is not finished — it is exactly the row this panel should be
    // able to complete, so it stays tickable and says what it is.
    if (status === 'draft') {
      row.appendChild(
        el(
          'span',
          'nq-tag nq-tag-warn',
          slot.preparation.reviewStatus === 'needs_revision' ? 'تحتاج تعديل' : 'مسودة',
        ),
      );
    }

    if (unusable) {
      // A lecture with no subject offering cannot be matched to a curriculum,
      // and the server would reject it. Show it, greyed, with the reason —
      // silently hiding a slot is how a teacher ends up with a gap she never
      // saw.
      row.appendChild(el('span', 'nq-tag nq-tag-warn', 'بدون مادة أو صف'));
      return row;
    }

    const select = el('select', 'nq-select');
    if (groups === undefined) {
      select.appendChild(new Option('… جارٍ تحميل الدروس', ''));
      select.disabled = true;
    } else if (!groups.length || groups.every((g) => !g.lessons.length)) {
      select.appendChild(new Option('لم يتم إعداد دروس هذه المادة بعد', ''));
      select.disabled = true;
      row.appendChild(el('span', 'nq-tag nq-tag-warn', 'بلا منهج'));
    } else {
      select.appendChild(new Option('بدون درس محدد', ''));
      for (const group of groups) {
        if (!group.lessons.length) continue;
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.unit;
        for (const lesson of group.lessons) {
          const option = new Option(lesson.name, lesson._id);
          option.selected = state.chosen.get(slot.lectureId) === lesson._id;
          optgroup.appendChild(option);
        }
        select.appendChild(optgroup);
      }
      select.addEventListener('change', () => {
        if (select.value) state.chosen.set(slot.lectureId, select.value);
        else state.chosen.delete(slot.lectureId);
      });
    }
    row.appendChild(select);

    return row;
  }

  function renderFooter() {
    const footer = root?.querySelector('.nq-footer');
    if (!footer) return;
    footer.textContent = '';

    const option = (label, key) => {
      const wrap = el('label', 'nq-toggle');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = state[key];
      box.addEventListener('change', () => {
        state[key] = box.checked;
        renderFooter();
      });
      wrap.appendChild(box);
      wrap.appendChild(el('span', null, label));
      return wrap;
    };

    footer.appendChild(option('اكتب المحتوى تلقائيًا', 'withContent'));
    // Only meaningful with the content: a draft with no objectives and no
    // assignment is refused on submit, so offering it alone invites the
    // refusal.
    if (state.withContent) {
      footer.appendChild(option('وأرسلها للمراجعة', 'andSubmit'));
    }

    const count = state.ticked.size;
    const button = el(
      'button',
      'nq-btn nq-btn-main',
      state.generating
        ? `جارٍ الإنهاء… ${state.generating}`
        : `حضّر المحدد (${count})`,
    );
    button.disabled = !count || state.loading || Boolean(state.generating);
    button.addEventListener('click', prepare);
    footer.appendChild(button);
  }

  function render() {
    if (!root) mount();
    root.textContent = '';

    const fab = el('button', 'nq-fab', state.open ? '✕' : 'حضّر أسبوعي');
    fab.title = 'نسق — تحضير سريع';
    fab.addEventListener('click', () => {
      state.open = !state.open;
      render();
      if (state.open && !state.week) void loadWeek();
    });
    root.appendChild(fab);

    if (!state.open) return;

    const panel = el('div', 'nq-panel');

    const head = el('div', 'nq-head');
    head.appendChild(el('div', 'nq-h1', 'تحضير الأسبوع'));
    const weekInput = el('input', 'nq-week');
    weekInput.type = 'date';
    weekInput.value = state.weekOf;
    weekInput.addEventListener('change', () => {
      state.weekOf = weekInput.value || dateOnly(new Date());
      void loadWeek();
    });
    head.appendChild(weekInput);
    panel.appendChild(head);

    const body = el('div', 'nq-body');

    if (state.error) body.appendChild(el('div', 'nq-alert nq-alert-error', state.error));

    if (state.teachers) {
      const picker = el('select', 'nq-select nq-teacher');
      picker.appendChild(new Option('اختر المعلم…', ''));
      for (const row of state.teachers) {
        // The summary nests the person: { teacher: { _id, name }, total, … }.
        const person = row.teacher ?? row;
        const id = String(person._id ?? person.teacherId ?? person.id ?? '');
        const option = new Option(
          `${person.name || 'بدون اسم'} — ${row.missing ?? 0} بدون تحضير`,
          id,
        );
        option.selected = id === state.teacherId;
        picker.appendChild(option);
      }
      picker.addEventListener('change', () => {
        state.teacherId = picker.value;
        if (state.teacherId) void loadWeek();
      });
      body.appendChild(picker);
      // Only until one is chosen; after that the week itself is the answer.
      if (!state.teacherId) {
        body.appendChild(
          el('div', 'nq-empty', 'حسابك يرى المدرسة كلها — اختر معلمًا لعرض أسبوعه.'),
        );
      }
    }

    if (state.result) {
      const { created = 0, skipped = 0 } = state.result;
      body.appendChild(
        el(
          'div',
          'nq-alert nq-alert-ok',
          skipped
            ? `تم إنشاء ${created} تحضير، و${skipped} كان موجودًا`
            : `تم إنشاء ${created} تحضير`,
        ),
      );
    }

    if (state.loading && !state.week) {
      body.appendChild(el('div', 'nq-empty', 'جارٍ التحميل…'));
    } else if (state.week) {
      const stats = state.week.stats || {};
      body.appendChild(
        el(
          'div',
          'nq-stats',
          // Spelled out, because "17 بدون تحضير" beside rows the timetable
          // paints green is the exact confusion this panel caused.
          `${stats.total ?? 0} حصة · ${stats.pending ?? 0} مُرسلة · ` +
            `${stats.draft ?? 0} مسودة · ` +
            `${(stats.total ?? 0) - (stats.draft ?? 0) - (stats.submitted ?? 0)} بلا تحضير`,
        ),
      );

      for (const day of state.week.days || []) {
        if (!day.slots?.length) continue;
        const section = el('div', 'nq-day');
        section.appendChild(
          el('div', 'nq-day-h', `${DAY_NAMES[day.dayOfWeek] || day.dayOfWeek} · ${day.date}`),
        );
        for (const slot of day.slots) {
          section.appendChild(renderSlot({ ...slot, dayOfWeek: day.dayOfWeek, date: day.date }));
        }
        body.appendChild(section);
      }

      if (!(state.week.days || []).some((d) => d.slots?.length)) {
        body.appendChild(el('div', 'nq-empty', 'لا توجد حصص في هذا الأسبوع'));
      }
    }

    panel.appendChild(body);
    panel.appendChild(el('div', 'nq-footer'));
    root.appendChild(panel);
    renderFooter();
  }

  render();
})();
