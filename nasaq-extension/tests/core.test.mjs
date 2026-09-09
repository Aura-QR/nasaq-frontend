import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import '../core.js';
const C = globalThis.NasaqPrep;
const ok = (data = {}) => ({ ok: true, data });
const fresh = (n = 1) => Array.from({ length: n }, (_, i) => ({ lectureId: `l${i}`, lessonId: `lesson${i}`, label: `row ${i}` }));
const draft = (extra = {}) => ({ lectureId: 'l1', preparationId: 'p1', lessonId: 'lesson1', originalLessonId: 'lesson1', existing: true, label: 'row', ...extra });
const bulk = (options) => ok({ results: options.body.items.map((r) => ({ lectureId: r.lectureId, preparationId: `p-${r.lectureId}`, status: 'created' })) });
const run = (rows, api, extra = {}) => C.run({ rows, api, weekOf: '2026-09-06', withContent: true, andSubmit: true,
  progress: () => {}, cancelled: () => false, ...extra });

test('API destinations reject credentials, paths, queries and unapproved hosts', () => {
  assert.equal(C.apiBase('http://localhost:3000/'), 'http://localhost:3000');
  assert.equal(C.apiBase(''), C.DEFAULT_API);
  for (const url of ['https://evil.example', `${C.DEFAULT_API}/api`, `${C.DEFAULT_API}?q=1`,
    'https://user:pass@api.nasaqedu.org', 'file:///etc/passwd']) assert.throws(() => C.apiBase(url));
});
test('old saved production origins resolve to the new HTTPS API without changing local settings', () => {
  assert.equal(C.DEFAULT_API, 'https://api.nasaqedu.org');
  assert.equal(C.apiBase('https://api.nasaqedu.org/'), C.DEFAULT_API);
  for (const scheme of ['http', 'https']) {
    const legacy = `${scheme}://api.nasaq.185.170.196.120.sslip.io`;
    assert.equal(C.apiBase(`${legacy}/`), C.DEFAULT_API);
    assert.throws(() => C.apiBase(`${legacy}/unexpected-path`));
    assert.throws(() => C.apiBase(`${legacy}?unexpected=query`));
  }
  assert.equal(C.apiBase('http://localhost:3000/'), 'http://localhost:3000');
});
test('pending, approved and unknown preparation states are never editable', () => {
  for (const reviewStatus of ['pending', 'approved', 'unexpected']) assert.equal(C.editable({ preparation: { reviewStatus } }), false);
  assert.equal(C.editable({ preparation: {} }), false);
  assert.equal(C.editable({ preparation: { reviewStatus: 'needs_revision' } }), true);
});
test('81 new periods are split into 40/40/1 while preserving target week', async () => {
  const sizes = [];
  const result = await run(fresh(81), async (path, options) => {
    assert.equal(path, '/preparation/bulk'); assert.equal(options.body.weekOf, '2026-09-06');
    sizes.push(options.body.items.length); return bulk(options);
  }, { withContent: false, andSubmit: false });
  assert.deepEqual(sizes, [40, 40, 1]); assert.equal(result.created, 81);
});
test('a missing draft lesson is PATCHed before generating and submitting', async () => {
  const calls = [];
  const result = await run([draft({ originalLessonId: '' })], async (path, options) => {
    calls.push([path, options?.method || 'GET']);
    if (!options) return ok({ reviewStatus: 'draft', lessonId: null });
    if (options.method === 'PATCH') assert.deepEqual(options.body, { lessonId: 'lesson1' });
    return ok();
  });
  assert.deepEqual(calls.map((r) => r[1]), ['GET', 'PATCH', 'POST', 'POST']);
  assert.equal(result.saved, 1); assert.equal(result.generated, 1); assert.equal(result.submitted, 1);
});
test('failed lesson save prevents generation and submission', async () => {
  const calls = [];
  const result = await run([draft({ originalLessonId: '' })], async (path, options) => {
    calls.push(path); return !options ? ok({ reviewStatus: 'draft' }) : C.failure(400, { message: 'الدرس غير صالح' });
  });
  assert.equal(calls.length, 2); assert.equal(result.problems[0].stage, 'حفظ الدرس');
});
test('submit-only mode does not generate content', async () => {
  const paths = [];
  const result = await run([draft()], async (path, options) => {
    paths.push(path); return !options ? ok({ reviewStatus: 'draft', lessonId: { _id: 'lesson1' } }) : ok();
  }, { withContent: false });
  assert.deepEqual(paths, ['/preparation/p1', '/preparation/p1/submit']); assert.equal(result.submitted, 1);
});
test('skipped bulk records are never mutated using stale lesson selections', async () => {
  const result = await run(fresh(), async (path) => {
    assert.equal(path, '/preparation/bulk');
    return ok({ results: [{ lectureId: 'l0', preparationId: 'existing', status: 'skipped' }] });
  });
  assert.equal(result.skipped, 1); assert.equal(result.generated, 0);
});
test('generation failure stays associated with its row and other rows continue', async () => {
  const result = await run(fresh(2), async (path, options) => {
    if (path.endsWith('/bulk')) return bulk(options);
    if (path === '/preparation/p-l0/generate') return C.failure(400, { message: 'التوليد غير مفعّل' });
    assert.notEqual(path, '/preparation/p-l0/submit'); return ok();
  });
  assert.equal(result.problems[0].lectureId, 'l0'); assert.equal(result.submitted, 1);
});
test('submission error preserves successful generation and direct preparation link data', async () => {
  const result = await run(fresh(), async (path, options) => path.endsWith('/bulk') ? bulk(options) :
    path.endsWith('/submit') ? C.failure(400, { message: 'يجب إضافة محتوى رقمي واحد على الأقل' }) : ok());
  assert.equal(result.generated, 1); assert.equal(result.submitted, 0);
  assert.equal(result.problems[0].preparationId, 'p-l0'); assert.match(result.problems[0].message, /محتوى رقمي/);
});
test('unknown write outcome stops processing and never promises that nothing was created', async () => {
  let calls = 0;
  const result = await run(fresh(41), async () => { calls++; return C.failure(0, { message: 'انقطع الاتصال' }, true); });
  assert.equal(calls, 1); assert.equal(result.stopped, true); assert.match(result.problems[0].message, /قد يكون الخادم حفظ/);
});
test('partial batch success remains counted after a later batch fails', async () => {
  let calls = 0;
  const result = await run(fresh(41), async (path, options) => ++calls === 1 ? bulk(options) : C.failure(400, { message: 'حصة غير صالحة' }));
  assert.equal(result.created, 40); assert.equal(result.stopped, true); assert.equal(calls, 2);
});
test('incomplete bulk confirmation is treated as uncertain and not generated', async () => {
  let calls = 0;
  const result = await run(fresh(2), async () => { calls++; return ok({ results: [] }); });
  assert.equal(calls, 1); assert.equal(result.stopped, true); assert.match(result.problems[0].message, /تأكيد كامل/);
});
test('cancellation waits for current request and does not start another batch', async () => {
  let stop = false; let calls = 0;
  const result = await run(fresh(41), async (path, options) => { calls++; stop = true; return bulk(options); }, { cancelled: () => stop });
  assert.equal(calls, 1); assert.equal(result.created, 40); assert.equal(result.stopped, true);
});
test('expired sessions and rate limits stop subsequent generation requests', async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const result = await run(fresh(2), async (path, options) => {
      calls++; return path.endsWith('/bulk') ? bulk(options) : C.failure(status, {});
    });
    assert.equal(calls, 2); assert.equal(result.stopped, true);
  }
});
test('draft changed to pending or changed lesson is not overwritten', async () => {
  for (const data of [{ reviewStatus: 'pending', lessonId: 'lesson1' }, { reviewStatus: 'draft', lessonId: 'other' }]) {
    let calls = 0;
    const result = await run([draft()], async () => { calls++; return ok(data); });
    assert.equal(calls, 1); assert.equal(result.problems.length, 1);
  }
});
test('transport normalizes validation arrays and treats HTML writes as uncertain', async () => {
  const fetchOriginal = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: ['first', 'second'] }), { status: 400 });
    assert.match((await C.request(C.DEFAULT_API, 'fake', '/preparation/bulk', { method: 'POST' })).message, /first — second/);
    globalThis.fetch = async () => new Response('<html>proxy error</html>', { status: 200 });
    assert.equal((await C.request(C.DEFAULT_API, 'fake', '/preparation/bulk', { method: 'POST' })).uncertain, true);
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    assert.equal((await C.request(C.DEFAULT_API, 'fake', '/preparation/bulk', { method: 'POST' })).uncertain, true);
  } finally { globalThis.fetch = fetchOriginal; }
});
test('generation timeout is longer than the backend 90-second timeout', async () => {
  const timeouts = [];
  const sandbox = vm.createContext({ URL, AbortSignal: { timeout: (ms) => { timeouts.push(ms); return undefined; } },
    fetch: async () => ({ ok: true, json: async () => ({ status: true, data: {} }) }) });
  vm.runInContext(readFileSync(new URL('../core.js', import.meta.url), 'utf8'), sandbox);
  await sandbox.NasaqPrep.request(C.DEFAULT_API, 'fake', '/preparation/p1/generate', { method: 'POST' });
  await sandbox.NasaqPrep.request(C.DEFAULT_API, 'fake', '/preparation/weekly');
  assert.deepEqual(timeouts, [120000, 30000]);
});
test('background ignores claimed page URLs and rejects untrusted senders before reading credentials', async () => {
  let listener; let cookieReads = 0;
  const sandbox = vm.createContext({ URL, importScripts: () => {}, NasaqPrep: C, chrome: {
    runtime: { id: 'extension-id', onMessage: { addListener: (cb) => { listener = cb; } } },
    storage: { sync: { get: async () => ({}) } }, cookies: { get: async () => { cookieReads++; return { value: 'fake-session' }; } },
  } });
  vm.runInContext(readFileSync(new URL('../background.js', import.meta.url), 'utf8'), sandbox);
  const denied = await new Promise((resolve) => listener({ type: 'NASAQ_SESSION', pageUrl: 'http://localhost:5000' },
    { id: 'extension-id', tab: {}, url: 'https://evil.example' }, resolve));
  assert.equal(denied.status, 403); assert.equal(cookieReads, 0);
  const allowed = await new Promise((resolve) => listener({ type: 'NASAQ_SESSION' },
    { id: 'extension-id', tab: {}, url: 'http://localhost:5000/school/preparation' }, resolve));
  assert.equal(allowed.ok, true); assert.equal(cookieReads, 1);
  const production = await new Promise((resolve) => listener({ type: 'NASAQ_SESSION' },
    { id: 'extension-id', tab: {}, url: 'https://nasaqedu.org/school/preparation' }, resolve));
  assert.equal(production.ok, true); assert.equal(production.base, 'https://api.nasaqedu.org');
  assert.equal(cookieReads, 2);
  const oldHost = await new Promise((resolve) => listener({ type: 'NASAQ_SESSION' },
    { id: 'extension-id', tab: {}, url: 'https://nasaq.185.170.196.120.sslip.io/' }, resolve));
  assert.equal(oldHost.status, 403); assert.equal(cookieReads, 2);
});

test('cancellation during generation does not submit after that request finishes', async () => {
  let stop = false; const paths = [];
  const result = await run(fresh(), async (path, options) => {
    paths.push(path);
    if (path.endsWith('/bulk')) return bulk(options);
    stop = true; return ok();
  }, { cancelled: () => stop });
  assert.equal(result.generated, 1); assert.equal(result.submitted, 0);
  assert.equal(paths.some((path) => path.endsWith('/submit')), false);
});

test('session role is a navigation hint and malformed tokens cannot select admin links', () => {
  const token = `header.${Buffer.from(JSON.stringify({ role: 'TEACHER' })).toString('base64url')}.signature`;
  assert.equal(C.sessionRole(token), 'TEACHER');
  assert.equal(C.sessionRole('invalid'), '');
  assert.equal(C.preparationPath(''), '');
  assert.equal(C.preparationPath('STUDENT'), '');
  assert.equal(C.preparationPath('SUPER_ADMIN'), '');
});
test('preparation navigation follows the frontend role portals', () => {
  assert.equal(C.preparationPath('TEACHER'), '/teacher/preparations');
  assert.equal(C.preparationPath('TEACHER', 'p1', true), '/teacher/preparations/edit/p1');
  assert.equal(C.preparationPath('TEACHER', 'p1'), '/teacher/preparations/p1');
  for (const role of ['OWNER', 'MANAGER', 'SUPERVISOR']) {
    assert.equal(C.preparationPath(role, 'p1', true), '/school/preparation/p1');
  }
});

test('per-lesson additions and exam settings are sent independently', async () => {
  const exam = { startDate: '2026-10-01', endDate: '2026-10-02', duration: 25, questionCount: 3, examType: 'quiz' };
  const rows = fresh(2).map((row, i) => ({ ...row, resourceTypes: i ? ['quiz', 'activity'] : ['enrichment'], ...(i ? { exam } : {}) }));
  const bodies = [];
  const result = await run(rows, async (path, options) => {
    if (path.endsWith('/generation-options')) return ok({ version: 1, linkedExams: true, resourceTypes: Object.keys(C.RESOURCE_LABELS) });
    if (path.endsWith('/bulk')) return bulk(options);
    if (path.endsWith('/generate')) {
      bodies.push(options.body);
      return ok({ resourceResults: options.body.resourceTypes.map((type) => ({ type, status: 'created', ...(type === 'quiz' ? { examId: 'exam1' } : {}) })) });
    }
    return ok();
  }, { withContent: false });
  assert.deepEqual(bodies[0], { resourceTypes: ['enrichment'], includeContent: false });
  assert.deepEqual(bodies[1], { resourceTypes: ['quiz', 'activity'], includeContent: false, exam });
  assert.equal(result.resourcesAdded, 3); assert.equal(result.exams[0].examId, 'exam1'); assert.equal(result.submitted, 2);
});
test('explicit no-additions selection never falls back to automatic homework', async () => {
  const result = await run([{ ...fresh()[0], resourceTypes: [] }], async (path, options) => {
    if (path.endsWith('/generation-options')) return ok({ version: 1, resourceTypes: Object.keys(C.RESOURCE_LABELS) });
    if (path.endsWith('/bulk')) return bulk(options);
    assert.deepEqual(options.body, { resourceTypes: [], includeContent: true });
    return ok({ resourceResults: [] });
  }, { andSubmit: false });
  assert.equal(result.resourcesAdded, 0);
});
test('unsupported server stops before creating preparations or invoking legacy generation', async () => {
  const calls = [];
  const result = await run([{ ...fresh()[0], resourceTypes: ['activity'] }], async (path) => {
    calls.push(path); return C.failure(404, {});
  });
  assert.deepEqual(calls, ['/preparation/generation-options']); assert.equal(result.stopped, true);
});
test('partial addition failure prevents submission and keeps successful additions visible', async () => {
  const paths = [];
  const result = await run([{ ...fresh()[0], resourceTypes: ['activity', 'enrichment'] }], async (path, options) => {
    paths.push(path);
    if (path.endsWith('/generation-options')) return ok({ version: 1, resourceTypes: Object.keys(C.RESOURCE_LABELS) });
    if (path.endsWith('/bulk')) return bulk(options);
    return ok({ resourceResults: [{ type: 'activity', status: 'created' }, { type: 'enrichment', status: 'failed', message: 'تعذر توليد الإثراء' }] });
  });
  assert.equal(result.resourcesAdded, 1); assert.equal(result.generated, 1); assert.equal(result.submitted, 0);
  assert.equal(result.problems[0].stage, 'إثراء'); assert.equal(paths.some((path) => path.endsWith('/submit')), false);
});
test('exam settings are required and validated before any API request', async () => {
  let calls = 0;
  for (const exam of [undefined, { examType: 'quiz', startDate: '2026-02-30', endDate: '2026-03-01', duration: 30, questionCount: 5 }]) {
    const result = await run([{ ...fresh()[0], resourceTypes: ['quiz'], exam }], async () => { calls++; return ok(); });
    assert.equal(calls, 0); assert.equal(result.stopped, true);
  }
});
