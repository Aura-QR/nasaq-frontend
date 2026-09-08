# نسق — تحضير سريع

A Chrome extension that prepares a teacher's whole week from inside Nasaq, one
period per lesson, in a single press.

---

## Install

1. Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked** → choose this folder
4. Open Nasaq and sign in. A **حضّر أسبوعي** button appears at the bottom-left.

The API address can be changed from the extension's popup; it defaults to the
production one.

---

## What it does

```
حضّر أسبوعي
   └── the week, with what is already filed          GET  /preparation/weekly
   └── the school's own lessons for each subject     GET  /curriculum/units
       and grade in it                               GET  /curriculum/units/:id/lessons
   └── one lesson per period, one press              POST /preparation/bulk
   └── and each one finished                         POST /preparation/:id/generate
   └── and sent for review                           POST /preparation/:id/submit
```

**اكتب التمهيد والإغلاق والأهداف تلقائيًا** is on by default. After the
periods are filed, the extension asks the server to write each one's warm-up,
closure, vocabulary, thinking skills, objectives, strategies and aids — one
request per preparation, in sequence, with the count moving as it goes.

It only does this for periods that got a lesson; the server refuses the rest,
because content written from a subject name alone is filler. And it never
overwrites anything a teacher has already written — only blanks are filled, so
running it again is safe.

**وأرسلها للمراجعة** then sends each finished preparation on. Nasaq accepts a
submit only with a lesson, a digital content item, an assignment and an
objective — generation supplies all four when the school has them. A school
with an empty library has no content item to attach, so that submit is refused
and the panel says why; the draft stays, complete but for that one thing.

Requires `AI_WEBHOOK_URL` on the server (see
`nasaq-backend/docs/SETUP-Lesson-Content.md`). Without it the periods are still
filed; only the writing is skipped.

Everything with no preparation yet is ticked for you — a teacher opens this to
fill gaps, and making her tick twenty rows first is the work it exists to
remove.

**Owner and manager** see one row per teacher and pick whose week to prepare.
A teacher always gets her own.

---

## Why it is 400 lines and not 7,800

The Madrasati extension this is modelled on spends almost all of its size on
the cost of not owning the site: reading lesson ids out of the DOM, scraping a
CSRF token from a fetched page, creating a silent Activity to satisfy a backend
rule, an iframe fallback for when the headless path fails.

None of that applies here. Nasaq has an API and the teacher is already signed
in to it, so this asks the server what the week is and posts the answer back.

**There is no DOM scraping in this extension, and there must not be.** The
moment it reads the page instead of the API it starts breaking on redesigns,
which is the entire failure mode it was built to avoid.

### The session

The frontend keeps its JWT in a cookie named `_auth`. The extension reads that
cookie and uses it. It never asks for a password and never stores one, and when
the teacher signs out of Nasaq it stops working too.

### Why requests go through the service worker

A content script's `fetch` is bound by the page's CORS, so a call from the
Nasaq site to the API host would be refused. `background.js` has
`host_permissions` and is not. It does nothing else.

---

## What a row can say

| | |
|---|---|
| a lesson dropdown | ready to prepare — options grouped by unit |
| **محضّرة** | already filed this week; the checkbox is off |
| **بلا منهج** | this subject and grade have no imported curriculum yet |
| **بدون مادة أو صف** | the lecture has no subject offering, so the server would refuse it |

The last two are shown rather than hidden. A slot that quietly disappears is a
gap nobody sees until the week is over.

---

## Before it is useful: import a curriculum

A lesson dropdown can only offer what the school has imported. Until an owner
or manager has been to **الإدارة الأكاديمية ← المناهج والدروس** and pressed
**استيراد منهج جاهز** for a subject and grade, every row for that pair reads
*لم يتم إعداد دروس هذه المادة بعد*.

Preparing still works without it — the period is filed with no lesson attached
— but the lesson, and the objectives the school wrote on it, are the reason to
use this at all.

---

## Limits worth knowing

- **40 periods per press.** The server caps a bulk there.
- **One preparation per period per week.** A second press reports those as
  already existing rather than creating duplicates.
- **A wrong lesson fails the whole press.** The server validates every item
  before writing any of them, deliberately, so a mistake on the last row does
  not leave the first twenty behind. The panel says nothing was created.
- A picked lesson brings the objectives the school wrote on it. That is the
  difference between this and typing a title.
