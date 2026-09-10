# نسق — تحضير سريع (1.2.0)

Chrome extension for the Nasaq weekly preparation workflow. It uses the API;
there is no scraping of the frontend's DOM. The backend contract was checked
against `D:\Work\Aura\nasaq-backend`.

## Install / update

1. Open `chrome://extensions` and enable Developer mode.
2. Load unpacked → select `nasaq-extension`. For an existing installation, click Reload.
3. Open or reload `https://nasaqedu.org`, sign in, and click **حضّر أسبوعي** at the bottom left.
4. For local development, open the frontend at `http://localhost:5000` or
   `http://localhost:5173` (also supports `127.0.0.1`). In the popup, set the API
   to the actual backend origin, usually `http://localhost:3000`.

The API defaults to `https://api.nasaqedu.org`.
Saved settings using the old HTTP or HTTPS `api.nasaq.185.170.196.120.sslip.io`
origin automatically resolve to the new HTTPS API; local development settings are preserved.
Settings accept that official origin or an HTTP(S) localhost / 127.0.0.1 origin
with a port. Credentials, paths, queries, fragments, and other hosts are rejected.
The supplied `logo/nasaq logo.jpeg` is used for the toolbar/extension icon and popup branding.
A new production domain requires updating the trusted origins in the code and manifest.
After changing the API, refresh the week inside the panel.

Preparation links follow the signed-in role: teachers use
`/teacher/preparations/edit/:id` for completion and `/teacher/preparations/:id`
for viewing. School administrators open `/school/preparation/:id` for review.
Curriculum administration links are shown only to owners and managers.
The frontend also redirects old school preparation links to the teacher portal
for teacher sessions; this compatibility fix requires deploying the frontend.
See [teacher route access](../docs/teacher-route-access.md) for the full route audit.

## دليل المستخدم

1. اختر تاريخًا داخل الأسبوع المطلوب. حساب المعلم يعرض أسبوعه؛ حساب الإدارة
   يعرض قائمة المعلمين أولًا. الرجوع إلى «اختر المعلم» يمسح الأسبوع السابق.
2. الحصص الجديدة والمسودات متاحة للتحديد. التحاضير التي تحتاج تعديلًا لا تُحدّد
   تلقائيًا: افتحها، واقرأ ملاحظات المراجع، وأجرِ التعديلات أولًا.
3. اختر درسًا لكل حصة. إذا كانت المسودة بلا درس، يُحفظ اختيارك عليها قبل التوليد.
   الدرس المحفوظ يظهر باسمه؛ لتغييره افتح محرر التحضير وراجع محتواه المرتبط.
4. لكل حصة، اختر **إثراء / واجب / امتحان / نشاط**. يمكن الجمع بينها أو إلغاء الجميع.
   الواجب محدد افتراضيًا للحصص الجديدة فقط؛ المسودات الموجودة تبدأ دون إضافات محددة.
   إلغاء الاختيار لا يحذف شيئًا موجودًا. النوع الموجود لا يُضاف مرة ثانية.
5. عند اختيار **امتحان**، حدد نوعه وتاريخ البداية والنهاية والمدة وعدد الأسئلة.
   يُنشأ امتحان فعلي مثل لوحة التحكم، ويظهر في **اختباراتي** مع رابط لمراجعته.
   الأسئلة اختيار من متعدد، والدرجة تُحسب من توزيع درجات المدرسة، والفصل والمادة من الحصة.
   المدة من ١ إلى ٢٤٠ دقيقة، والأسئلة من ١ إلى ٢٠؛ يمكن أن يبدأ وينتهي في اليوم نفسه.
   **يُتاح للطلاب وفق التواريخ المحددة حتى قبل اكتمال التحضير.** اختر موعدًا
   يسمح لك بمراجعة الأسئلة أولًا. إنشاء الامتحان متاح من حساب المعلم صاحب الحصة فقط.
6. اختر العمل المطلوب:
   - **حفظ المسودات فقط:** ألغِ إضافات الحصص وأوقف التوليد وتأكيد الاكتمال. يمكن الحفظ دون دروس.
   - **توليد للمراجعة الشخصية:** شغّل التوليد وأوقف تأكيد الاكتمال.
   - **إضافات فقط:** اخترها لكل حصة وأوقف كتابة حقول التحضير؛ اختر درسًا لكل حصة.
   - **توليد وتأكيد:** شغّل الخيارين بعد اختيار الدروس.
   - **تأكيد محتوى مكتمل سابقًا:** ألغِ الإضافات وأوقف التوليد وشغّل تأكيد الاكتمال.
7. اضغط **حضّر المحدد**. تظل النتائج والأخطاء ظاهرة بعد تحديث البيانات التلقائي،
   مع رابط لفتح كل تحضير يحتاج استكمالًا. حدّد المسودات المطلوبة صراحةً للمحاولة مجددًا.

التحضير القابل للإرسال يحتاج درسًا من المنهج، وهدفًا، ومحتوى رقميًا، وتكليفًا
واحدًا على الأقل. التوليد يملأ الحقول الفارغة فقط؛ لا يصحح نصًا موجودًا تلقائيًا.
يظل قرار قبول الإرسال والتحقق من الصلاحيات لدى الخادم.

## الأخطاء والإرشادات

| الحالة | التصرف |
| --- | --- |
| لا توجد حصص / معلمون | تحقق من الأسبوع واطلب من الإدارة مراجعة الجدول. |
| الحصة بدون مادة أو صف | صحح عرض المادة والصف في الجدول لدى الإدارة. |
| لا توجد دروس | الإدارة الأكاديمية ← المناهج والدروس ← استيراد المنهج للمادة والصف؛ أو احفظ مسودة فقط. |
| تعذر تحميل المنهج | يظهر خطأ الطلب الحقيقي؛ استخدم «تحديث» بعد حل الاتصال أو الصلاحية. |
| التوليد غير مفعّل | يراجع مسؤول الخادم إعدادات AI_ENABLED وAI_WEBHOOK_URL وخدمة التوليد. المسودات المحفوظة تبقى. |
| تعذر تأكيد دعم الإضافات | انشر تحديث الخادم واستورد سير عمل n8n المحدث ثم أعد المحاولة. الإضافة تتوقف قبل إنشاء مسودات جديدة. |
| لا يوجد توزيع درجات / وزن الامتحان صفر | تطلب من الإدارة إعداد توزيع درجات المادة لهذا النوع؛ يُحفظ بقية المحتوى الناجح ويؤجل الإرسال. |
| فشل توليد إضافة أو أسئلة امتحان | راجع الخطأ، ثم أعد تحديد الحصة والإضافة المطلوبة. لا تُكرّر الأنواع المحفوظة ولا يُرسل التحضير تلقائيًا مع فشل إضافة مطلوبة. |
| نقص محتوى رقمي أو تكليف أو هدف | افتح التحضير من رابط الخطأ وأضف المطلوب، ثم أعد الإرسال دون توليد إذا اكتمل المحتوى. |
| انتهت الجلسة / تغيّر الحساب | سجّل الدخول وحدّث الأسبوع. تتوقف الدفعة قبل الطلب التالي. |
| 403 | اطلب مراجعة صلاحيات القراءة والإنشاء والتعديل والمنهج لدى مسؤول المدرسة. |
| 409 | حدّث الأسبوع وراجع تغييرات التحضير قبل المحاولة. |
| 429 | انتظر قبل المحاولة مجددًا؛ تتوقف الدفعة. |
| مهلة / انقطاع / خطأ خادم أثناء الحفظ | قد يكون الطلب حُفظ بالفعل. تتوقف المعالجة عند نتيجة غير مؤكدة؛ حدّث الأسبوع وافتح التحضير للتحقق. لا تعيد الإضافة الطلب تلقائيًا. |
| الإضافة لا تستجيب بعد تحديثها | أعد تحميل صفحة نسق. |

## Execution and recovery

- New preparations are created in sequential batches of at most 40. A later
  batch failure does not erase earlier saves; the result reports confirmed counts.
- Existing drafts are read again before changes. A changed lesson or submitted
  status is reported instead of being overwritten using the old selection.
- Bulk records reported as already existing are left alone until refreshed and
  explicitly selected. This avoids modifying another tab's newly created work.
- Week, teacher, selections and operation options are locked during a run.
- **إيقاف بعد الطلب الحالي** stops before the next request. It does not roll back
  completed requests or abort a save that may already have reached the server.
- Closing the panel leaves work running. Keep the Nasaq tab open; closing or
  reloading the tab ends its workflow. The extension warns on navigation while
  busy, but does not persist/resume jobs after page/browser closure.
- Results survive the automatic refresh and panel close/reopen, but are cleared
  by a manual refresh, week/teacher change, new run, or page reload.
- Concurrent writes still need backend enforcement. The draft re-read reduces
  stale updates; it is not an atomic lock against edits from other clients.

## API and session design

`background.js` validates the actual message sender and reads the `_auth` cookie
for that page. Credentials are returned only to the extension's isolated content
script and held in memory, never written to extension storage or page scripts.
Each API request checks the current session and API origin against the loaded week.

Requests execute in the content script with the backend's existing frontend CORS
support. This avoids the MV3 worker's 30-second fetch-response lifetime, which is
shorter than the backend generation timeout of 90 seconds. Generation receives a
120-second client timeout; ordinary requests receive 30 seconds. Redirects are
rejected. If deploying different CORS settings, allow the frontend origin and the
Authorization, Accept and Content-Type headers. Browser mixed-content restrictions
still apply when selecting an HTTP backend from an HTTPS page.

See Chrome's [service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
and [cross-origin request rules](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests).

| Request | Purpose |
| --- | --- |
| GET /preparation/weekly?weekOf=&teacherId= | Teacher summary or individual week |
| GET /curriculum/units?subjectId=&gradeLevelId= | School curriculum units |
| GET /curriculum/units/:id/lessons | Lessons grouped by unit |
| POST /preparation/bulk | Create up to 40 individual lesson selections |
| GET /preparation/:id | Recheck an existing draft |
| PATCH /preparation/:id | Attach a selected lesson to a lessonless draft |
| GET /preparation/generation-options | Verify selected-addition and linked-exam support before mutation |
| POST /preparation/:id/generate | Fill blanks and/or generate selected resources with optional exam settings |
| POST /preparation/:id/submit | Verify the four completion requirements and mark the preparation finished |

## Verification

Version 1.2.0 requires the matching backend changes in `nasaq-backend` and the
updated `n8n/nasaq-lesson-content.json` workflow. Deploy/import both before
reloading the extension. See the backend's `docs/SETUP-Lesson-Content.md` for
the request contract and required unique indexes. The capability endpoint
confirms backend support; malformed/missing workflow additions still surface
as individual errors and prevent submission of that preparation.

From the frontend root:

```powershell
npm run test:extension
npx eslint nasaq-extension --ext js,mjs --max-warnings 0
npm run build
```

Tests cover batch boundaries, partial failures, duplicate starts, cancellation,
existing-draft lesson saves, protected statuses, submit-only mode, stale curriculum
responses, account changes, missing lessons, malformed responses and persistent
row errors. DOM tests use a simulated DOM; visual layout, actual Chrome extension
loading, real authentication/CORS, and live AI generation require a browser smoke test.

Browser smoke test: load the extension, open a teacher week, save one draft,
attach a lesson, generate without submitting, review the content, then submit.
Repeat with an owner/manager teacher selector and at a narrow viewport. Verify
logout, offline recovery, a missing curriculum, cancellation and a rejected submit.
Also select different additions on two lessons; try none and additions-only.
Create a future-dated exam, open its result link, verify questions, class and
grade in the dashboard, then repeat generation and confirm there is one exam.
Check missing grade criteria and invalid dates, and verify that successful
resources remain available when another requested addition fails.
