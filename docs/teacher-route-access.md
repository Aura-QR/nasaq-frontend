# Teacher route access

Checked against the frontend route tree and the sibling backend source on 2026-09-09.

## Why the extension links returned 403

`src/routes/index.jsx` wraps `/school/preparation/*` in `ModuleAccessRoute`.
That guard admits school administration roles (OWNER, MANAGER, SUPERVISOR),
and denies TEACHER before individual preparation permissions are considered.
Giving a teacher `school.preparation.update` does not open this administrative route.

The existing teacher editor is `/teacher/preparations/edit/:id` (plural).
For the reported record, use:

`https://nasaqedu.org/teacher/preparations/edit/6aa0f6c0e4b8a9517d3cb562`

The API still verifies authentication, school permissions, and preparation ownership.
A correct route does not grant access to another teacher's preparation.

## Teacher portal pages

All these routes require an authenticated TEACHER session. Page access and API
operation permission are separate: school-configured permissions may restrict
the data or actions available after the page opens.

| Page | Route |
| --- | --- |
| Dashboard | `/teacher/dashboard` |
| Own timetable | `/teacher/schedule` |
| Own classes and their students | `/teacher/classes` |
| Student attendance | `/teacher/attendance` |
| Personal check-in | `/teacher/check-in` |
| Leave and cover duties | `/teacher/duty` |
| Preparations list | `/teacher/preparations` |
| Create preparation | `/teacher/preparations/add` (legacy alias `/teacher/preparation/add`) |
| Edit preparation | `/teacher/preparations/edit/:id` |
| View preparation | `/teacher/preparations/:id` |
| Exams | `/teacher/exams`, `/teacher/exams/add`, `/teacher/exams/edit/:id` |
| Exam grading | `/teacher/grading/exams` |
| Projects and grading | `/teacher/projects`, `/teacher/grading/projects` |
| Library | `/teacher/library` |
| Personal profile | `/teacher/profile` |

The old sidebar URLs `/teacher/students` and `/teacher/lectures` now redirect to
`/teacher/classes` and `/teacher/schedule` respectively.

## Preparation actions

- Backend defaults give teachers preparation read/create/update/delete abilities.
  Effective school permissions can differ from those defaults.
- Creation is restricted to assigned lectures. Reading and changing a preparation
  checks that it belongs to the signed-in teacher.
- Sending for review requires a curriculum lesson, an objective, digital content,
  and an assignment. The backend accepts submission from draft or needs-revision status.
- Teachers cannot approve or review their own preparations. The review endpoint
  rejects TEACHER and STUDENT regardless of their update permission.
- The extension opens pending/approved preparations in the view page and processes
  drafts or explicitly selected needs-revision rows. The frontend editor makes
  pending content read-only. The editor separately allows changes to approved
  content; backend updates reset review status to draft, requiring review again.
- Teachers can read curriculum lessons through the API for lesson selection.
  Importing/managing curriculum in `/school/curriculum` is OWNER/MANAGER only.

## Pages teachers cannot access as administrators

`ModuleAccessRoute` blocks teachers from school-wide students, teachers, subjects,
classes, lectures, attendance, library, grades criteria, exams, projects,
preparation, financial, and expenses modules. This role restriction applies even
if a stored permission array contains the corresponding module permission.

Other explicit role guards block teachers from the school dashboard, subject
offerings administration, terms, school settings, staff attendance administration,
duty administration/reports, manager administration, school role permissions,
academic-year administration/student promotion, and platform administration.
Student portal routes are reserved for STUDENT sessions.

## Fixes and verification

- Extension 1.1.2 uses teacher preparation URLs for teacher sessions, school detail
  URLs for administrators, and hides curriculum management links from teachers.
  Its JWT role decoding is a navigation hint, not an authorization decision.
- Old `/school/preparation` list/add/view/edit links redirect teachers to the
  matching teacher route, preserving query parameters and fragments. No other
  administration module is opened to teachers.
- Teacher sidebar entries now lead to registered teacher routes. Admin-only
  entries that previously appeared based on permission strings have been removed.
- `npm run test:routes` exercises the actual module guard, verifies redirects,
  checks that other roles/modules remain protected, and checks sidebar destinations
  against declared routes.
- `npm run test:extension` covers teacher/admin row links, failure links, and
  curriculum link visibility in addition to preparation workflow regressions.

These checks use local source and simulated sessions. They do not verify the
reported record's ownership, the live account's permissions, or deployment state.
