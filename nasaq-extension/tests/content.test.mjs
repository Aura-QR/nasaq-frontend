import test from 'node:test';
import assert from 'node:assert/strict';
import { panel, deferred, settle, week, slot, ok, curriculum } from './dom.mjs';

test('missing lesson blocks generation until the user selects a curriculum lesson', async () => {
  const p = await panel(async (base, token, path) => path.startsWith('/preparation/weekly') ? ok(week()) : curriculum(path));
  assert.equal(p.find('.nq-btn-main').disabled, true);
  const select = p.find('.nq-row').querySelector('select'); select.value = 'lesson1'; select.fire('change');
  assert.equal(p.find('.nq-btn-main').disabled, false);
});
test('failed curriculum request is shown as an error, not as an empty curriculum', async () => {
  const p = await panel(async (base, token, path) => path.startsWith('/preparation/weekly') ? ok(week()) :
    { ok: false, status: 403, message: 'صلاحية المنهج غير متاحة' });
  assert.match(p.body.textContent, /صلاحية المنهج غير متاحة/);
  assert.doesNotMatch(p.body.textContent, /لا توجد دروس في المنهج/);
});
test('teacher placeholder clears the previously selected teacher week', async () => {
  const p = await panel(async (base, token, path) => path.includes('teacherId=') ? ok(week([])) :
    ok({ teachers: [{ teacher: { _id: 't1', name: 'معلم' }, total: 1 }] }));
  let picker = p.find('.nq-teacher'); picker.value = 't1'; picker.fire('change'); await settle();
  assert.match(p.body.textContent, /لا توجد حصص/);
  picker = p.find('.nq-teacher'); picker.value = ''; picker.fire('change'); await settle();
  assert.match(p.body.textContent, /اختر معلمًا/); assert.doesNotMatch(p.body.textContent, /لا توجد حصص/);
});
test('closing and reopening while loading does not duplicate the weekly request', async () => {
  const a = deferred(); let call = 0;
  const p = await panel(async () => ++call === 1 ? a.promise : ok(week([])));
  assert.equal(p.find('.nq-week').disabled, true);
  p.find('.nq-fab').fire('click'); p.find('.nq-fab').fire('click'); await settle();
  assert.equal(call, 1);
  a.resolve(ok(week([]))); await settle();
  assert.equal(p.find('.nq-week').disabled, false);
});
test('busy batch locks controls, ignores duplicate start, and retains errors after refresh', async () => {
  const generation = deferred(); let generateCalls = 0;
  const prep = { _id: 'p1', reviewStatus: 'draft', lessonId: 'lesson1', lessonTitle: 'الجمع' };
  const p = await panel(async (base, token, path) => {
    if (path.endsWith('/generation-options')) return ok({ version: 1, resourceTypes: ['homework', 'activity', 'enrichment', 'quiz'], linkedExams: true });
    if (path.startsWith('/preparation/weekly')) return ok(week([slot(prep)]));
    if (path.endsWith('/generate')) { generateCalls++; return generation.promise; }
    if (path.endsWith('/submit')) return { ok: false, status: 400, message: 'يجب إضافة محتوى رقمي واحد على الأقل' };
    return ok(prep);
  });
  const start = p.find('.nq-btn-main'); const first = start.fire('click'); await settle();
  assert.equal(p.find('.nq-week').disabled, true); assert.equal(p.find('.nq-check').disabled, true);
  assert.equal(p.find('.nq-toggle').querySelector('input').disabled, true);
  await start.listeners.click(); assert.equal(generateCalls, 1);
  generation.resolve(ok({ filled: ['warmUp'] })); await first; await settle();
  assert.match(p.body.textContent, /يجب إضافة محتوى رقمي/);
  assert.match(p.body.textContent, /تم توليد 1/);
  assert.equal(p.find('.nq-check').checked, false);
  assert.equal(p.find('.nq-week').disabled, false);
});
test('submitted and approved rows are locked; revision rows require explicit selection', async () => {
  const periods = ['pending', 'approved', 'needs_revision'].map((reviewStatus, i) => ({ ...slot({ _id: `p${i}`, reviewStatus, lessonId: 'lesson1' }), lectureId: `l${i}` }));
  const p = await panel(async () => ok(week(periods)));
  const boxes = p.body.all().filter((node) => node.className === 'nq-check');
  assert.equal(boxes[0].disabled, true); assert.equal(boxes[1].disabled, true);
  assert.equal(boxes[2].disabled, false); assert.equal(boxes[2].checked, false);
  assert.match(p.body.textContent, /قيد المراجعة/); assert.match(p.body.textContent, /معتمدة/);
});
test('changing session before a batch prevents all mutations', async () => {
  let writes = 0;
  const prep = { _id: 'p1', reviewStatus: 'draft', lessonId: 'lesson1' };
  const p = await panel(async (base, token, path, options) => {
    if (options.method) writes++;
    return path.startsWith('/preparation/weekly') ? ok(week([slot(prep)])) : ok(prep);
  });
  p.initialSession.token = 'new-account';
  await p.find('.nq-btn-main').fire('click'); await settle();
  assert.equal(writes, 0);
  assert.match(p.body.textContent, /تغيّر الحساب أو الخادم/);
});
test('week refresh failure removes stale rows and blocks preparation', async () => {
  let fail = false;
  const p = await panel(async (base, token, path) => path.startsWith('/preparation/weekly') ?
    (fail ? { ok: false, status: 0, message: 'offline' } : ok(week())) : curriculum(path));
  fail = true; p.textButton('تحديث').fire('click'); await settle();
  assert.equal(p.find('.nq-row'), undefined); assert.equal(p.find('.nq-btn-main').disabled, true);
  assert.match(p.body.textContent, /offline/);
});

test('late curriculum responses do not populate a different week', async () => {
  const oldLessons = deferred(); let weeklyCalls = 0;
  const p = await panel(async (base, token, path) => {
    if (path.startsWith('/preparation/weekly')) return ok(week([{
      ...slot(), subject: { ...slot().subject, subjectId: ++weeklyCalls === 1 ? 'old-subject' : 'new-subject' },
    }]));
    if (path.includes('old-subject')) return oldLessons.promise;
    return curriculum(path);
  });
  p.textButton('تحديث').fire('click'); await settle();
  oldLessons.resolve(ok([{ _id: 'old-unit', name: 'OLD CURRICULUM' }])); await settle();
  assert.doesNotMatch(p.body.textContent, /OLD CURRICULUM/);
  assert.equal(p.find('.nq-row').querySelector('select').disabled, false);
});

test('missing curriculum permits draft-only saving after additions and both options are turned off', async () => {
  const paths = [];
  const p = await panel(async (base, token, path, options) => {
    paths.push(path);
    if (path.startsWith('/preparation/weekly')) return ok(week());
    if (path.endsWith('/bulk')) {
      assert.equal(options.body.items[0].lessonId, undefined);
      return ok({ results: [{ lectureId: 'l1', preparationId: 'p1', status: 'created' }] });
    }
    return ok([]);
  });
  const homework = p.body.all().find((n) => n.attributes['aria-label'] === 'واجب للحصة 1');
  homework.checked = false; homework.fire('change');
  const toggles = p.body.all().filter((n) => n.className === 'nq-toggle').map((n) => n.querySelector('input'));
  toggles[0].checked = false; toggles[0].fire('change');
  const submit = p.body.all().filter((n) => n.className === 'nq-toggle')[1].querySelector('input');
  submit.checked = false; submit.fire('change');
  assert.equal(p.find('.nq-btn-main').disabled, false);
  await p.find('.nq-btn-main').fire('click'); await settle();
  assert.match(p.body.textContent, /تم إنشاء 1/);
  assert.equal(paths.some((path) => path.endsWith('/generate') || path.endsWith('/submit')), false);
});

test('teacher row and failure links open the teacher editor and hide curriculum administration', async () => {
  const prep = { _id: 'p1', reviewStatus: 'draft', lessonId: 'lesson1', lessonTitle: 'الجمع' };
  const p = await panel(async (base, token, path) => {
    if (path.endsWith('/generation-options')) return ok({ version: 1, resourceTypes: ['homework', 'activity', 'enrichment', 'quiz'], linkedExams: true });
    if (path.startsWith('/preparation/weekly')) return ok(week([slot(prep)]));
    if (path.endsWith('/generate')) return { ok: false, status: 400, message: 'توليد غير متاح' };
    return ok(prep);
  });
  const rowLink = p.find('.nq-row').querySelector('a');
  assert.equal(rowLink.href, '/teacher/preparations/edit/p1');
  assert.equal(p.body.all().some((node) => node.href === '/school/curriculum'), false);
  assert.ok(p.body.all().some((node) => node.href === '/teacher/preparations'));
  await p.find('.nq-btn-main').fire('click'); await settle();
  const failureLink = p.body.all().find((node) => node.tagName === 'a' && node.textContent === 'فتح لإكمال التحضير');
  assert.equal(failureLink.href, '/teacher/preparations/edit/p1');
  assert.equal(p.body.all().some((node) => node.href?.startsWith('/school/')), false);
});
test('administrator links open preparation details and only owners/managers see curriculum administration', async () => {
  for (const role of ['OWNER', 'MANAGER', 'SUPERVISOR']) {
    const p = await panel(async () => ok(week([slot({ _id: 'p1', reviewStatus: 'draft', lessonId: 'lesson1' })])),
      { ok: true, base: 'http://localhost:3000', token: 'fake', role });
    assert.equal(p.find('.nq-row').querySelector('a').href, '/school/preparation/p1');
    assert.equal(p.body.all().some((node) => node.href === '/school/curriculum'), role !== 'SUPERVISOR');
  }
});

test('each lecture has independent additions and selecting exam requires its settings', async () => {
  const p = await panel(async (base, token, path) => path.startsWith('/preparation/weekly') ? ok(week([
    slot({ _id: 'p1', reviewStatus: 'draft', lessonId: 'lesson1' }),
    { ...slot({ _id: 'p2', reviewStatus: 'draft', lessonId: 'lesson1' }), lectureId: 'l2', slot: 2 },
  ])) : curriculum(path));
  let quiz = p.body.all().find(n => n.attributes['aria-label'] === 'امتحان للحصة 1');
  quiz.checked = true; quiz.fire('change');
  assert.equal(p.body.all().find(n => n.attributes['aria-label'] === 'امتحان للحصة 2').checked, false);
  assert.equal(p.find('.nq-btn-main').disabled, true);
  const first = p.body.all().find(n => n.attributes['aria-label'] === 'تاريخ البداية للحصة 1');
  first.value = '2026-10-01'; first.fire('input');
  const last = p.body.all().find(n => n.attributes['aria-label'] === 'تاريخ النهاية للحصة 1');
  last.value = '2026-10-02'; last.fire('input');
  assert.equal(p.find('.nq-btn-main').disabled, false);
  assert.match(p.body.textContent, /اختباراتي/);
});
