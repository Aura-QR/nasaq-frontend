# Nasaq Frontend API Coverage Audit

**Collections audited:**
- [Nasaq_Master_Verification.postman_collection.json](file:///Users/abdelati88/development/nasaq/Nasaq_Master_Verification.postman_collection.json) (189 requests)
- [Nasaq_Teachers_Students_Attendance.postman_collection.json](file:///Users/abdelati88/development/nasaq/Nasaq_Teachers_Students_Attendance.postman_collection.json) (90 requests)

**Total unique routes across both collections: 82**

---

## ✅ Fully Implemented Endpoints (API Layer + UI Pages)

These endpoints have both a frontend API function AND are used in at least one UI page/component.

| # | Route | API File | API Function | UI Usage |
|---|---|---|---|---|
| 1 | `POST /auth/login` | [`login.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/auth/login.js) | `loginRequest` | Login pages |
| 2 | `POST /schools/register` | [`register.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/auth/register.js) | `registerRequest` | Register page |
| 3 | `GET /nationalities` | [`nationalities.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/nationalities.js) | `fetchNationalities` | Student forms |
| 4 | `POST /academic-years` | [`academicYears.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/academicYears.js) | `createAcademicYear` | Academic Years pages |
| 5 | `POST /stages` | [`stages.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/stages.js) | `createStage` | Stages page |
| 6 | `POST /grade-levels` | [`gradeLevels.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/gradeLevels.js) | `createGradeLevel` | GradeLevels page |
| 7 | `POST /terms/bulk` | [`terms.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/terms.js) | `createTermsBulk` | TermsManager component |
| 8 | `POST /classes` | [`classes.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/classes.js) | `createSchoolClass` | SchoolClasses pages |
| 9 | `GET /classes` | [`classes.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/classes.js) | `getSchoolClasses` | Multiple pages |
| 10 | `POST /students` | [`students.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/students.js) | `addStudent` | Users/Students/Add |
| 11 | `PATCH /students/:id` | [`students.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/students.js) | `editStudent` | Student details pages |
| 12 | `GET /students/me` | [`students.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/users/students.js) | `fetchMyStudentProfile` | Student dashboard |
| 13 | `POST /teachers` | [`teachers.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teachers.js) | `createSchoolTeacher` | Users/Teachers pages |
| 14 | `GET /teachers/me` | [`teachers.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teachers.js) | `getCurrentTeacher` | TeacherProfile, TeacherDashboard |
| 15 | `POST /enrollments` | [`enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js) | `createStudentEnrollment` | Enrollment pages |
| 16 | `GET /enrollments/student/:id` | [`enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js) | `fetchStudentEnrollments` | Student details |
| 17 | `POST /subjects` | [`subjects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/subjects.js) | `addSubject` | Subjects pages |
| 18 | `GET /subjects/teacher/me` | [`subjects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/subjects.js) | `fetchMyTeacherSubjects` | TeacherProfile, TeacherLibrary |
| 19 | `POST /subject-offerings` | [`subjectOfferings.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/subjectOfferings.js) | `addSubjectOffering` | SubjectOfferings page |
| 20 | `POST /lectures` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | `addLecture` | Schedule component |
| 21 | `GET /lectures` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | `fetchLectures` | Multiple pages |
| 22 | `GET /lectures/teacher/me` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | via `getCached` | TeacherSchedule |
| 23 | `GET /lectures/student/me` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `fetchStudentLectures` | Student dashboard |
| 24 | `PATCH /lectures/:id` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | `editLecture` | Schedule component |
| 25 | `DELETE /lectures/:id` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | `deleteLecture` | Schedule component |
| 26 | `POST /gradesCriteria` | [`gradesCriteria.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/gradesCriteria.js) | `addGradesCriteria` | Subject pages |
| 27 | `GET /gradesCriteria` | [`gradesCriteria.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/gradesCriteria.js) | `fetchGradesCriteria` | Subject pages |
| 28 | `GET /gradesCriteria/student/me/grades` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `fetchStudentGrades` | Student grades page |
| 29 | `POST /exams` | [`exams.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/exams.js) | `addExam` | TeacherExamAdd |
| 30 | `GET /exams/:id` | [`exams.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/exams.js) | `fetchSingleExam` | Exam pages |
| 31 | `POST /exams/:id/start` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `startStudentExam` | Student QuizPage |
| 32 | `POST /exams/:id/grade` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `gradeStudentExam` | Student QuizPage |
| 33 | `GET /exams/student/me` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `fetchStudentExams` | Student QuizPage |
| 34 | `POST /attendance` | [`attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js) | `addAttendance` | TeacherAttendance page |
| 35 | `GET /attendance` | [`attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js) | `fetchAttendance` | TeacherAttendance page |
| 36 | `PATCH /attendance/:id` | [`attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js) | `editAttendance` | School/Attendance pages |
| 37 | `DELETE /attendance/:id` | [`attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js) | `deleteAttendance` | School/Attendance pages |
| 38 | `GET /attendance/student/me` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | `fetchStudentAttendance` | Student Attendance page |
| 39 | `POST /preparation` | [`preparation.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/preparation.js) | `addPreparation` | TeacherPreparations page |
| 40 | `GET /preparation` | [`preparation.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/preparation.js) | `fetchPreparations` | TeacherPreparations page |
| 41 | `POST /library` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `addLibrary` | Library pages |
| 42 | `GET /library` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `fetchLibraries` | Library pages |
| 43 | `GET /library/list` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `fetchLibraryList` | Library pages |
| 44 | `GET /library/:id` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `fetchSingleLibrary` | Library pages |
| 45 | `PATCH /library/:id` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `editLibrary` | Library pages |
| 46 | `DELETE /library/:id` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | `deleteLibrary` | Library pages |
| 47 | `POST /projects` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `addProject` | TeacherProjects |
| 48 | `GET /projects` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `fetchProjects` | School/Projects pages |
| 49 | `GET /projects/teacher/me` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `fetchTeacherProjects` | TeacherProjects page |
| 50 | `GET /projects/submissions` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `fetchAllProjectSubmissions` | TeacherProjects, TeacherProjectGrading |
| 51 | `PATCH /projects/:id` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `editProject` | TeacherProjects |
| 52 | `DELETE /projects/:id` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `deleteProject` | TeacherProjects |
| 53 | `PATCH /projects/:id/submissions/:id/grade` | [`projects.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/projects.js) | `gradeSubmission` | TeacherProjectGrading |
| 54 | `GET /dashboards/owner` | [`dashboard.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/dashboard.js) | `fetchSchoolDashboard` | SchoolDashboard page |
| 55 | `PATCH /schools/me/settings` | [`schoolSettings.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/schoolSettings.js) + [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `updateSchoolSettings` / `updateTeacherAttendanceSettings` | SchoolSettings page |
| 56 | `POST /financial/fee-configs` | [`feeConfigs.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/feeConfigs.js) | `addFeeConfig` | Financials pages |
| 57 | `PATCH /financial/fee-configs/:id` | [`feeConfigs.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/feeConfigs.js) | `editFeeConfig` | Financials pages |
| 58 | `POST /financial/installment-plans` | [`installmentPlans.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/installmentPlans.js) | `addInstallmentPlan` | Financials pages |
| 59 | `PATCH /financial/installment-plans/:id/set-default` | [`installmentPlans.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/installmentPlans.js) | `setDefaultInstallmentPlan` | Financials pages |
| 60 | `DELETE /financial/installment-plans/:id` | [`installmentPlans.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/installmentPlans.js) | `deleteInstallmentPlan` | Financials pages |
| 61 | `GET /financial/installment-plans` | [`installmentPlans.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/installmentPlans.js) | `fetchInstallmentPlans` | Financials pages |
| 62 | `GET /financial/records` | [`financialRecords.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecords.js) | `fetchFinancialRecords` | Financials pages |
| 63 | `GET /financial/records/:id` | [`financialRecords.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecords.js) | `fetchSingleFinancialRecord` | Student financial profile |
| 64 | `GET /financial/records/:id/summary` | [`financialRecords.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecords.js) | `fetchFinancialSummary` | Financial summary page |
| 65 | `POST /financial/records/:id/tuition/pay` | [`financialRecords.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecords.js) | `payTuitionInstallment` | Financial payment |
| 66 | `PATCH /financial/records/:id/tuition/switch-plan` | [`financialRecords.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecords.js) | `switchTuitionInstallmentPlan` | Financial profile |
| 67 | `POST /financial/records/:id/tuition/installments/1/refund` | [`financialRecordCorrections.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/financialRecordCorrections.js) | `refundTuitionInstallment` | Financial profile |
| 68 | `POST /financial/discounts` | [`discounts.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/discounts.js) | `addDiscount` | Discounts pages |
| 69 | `POST /financial/discounts/apply/tuition/:id` | [`discounts.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/discounts.js) | `applyDiscountToTuition` | Financial profile |
| 70 | `DELETE /financial/discounts/apply/tuition/:id` | [`discounts.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/discounts.js) | `removeDiscountFromTuition` | Financial profile |
| 71 | `POST /financial/records/:id/bus/enroll` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `enrollBus` | Bus pages |
| 72 | `POST /financial/records/:id/bus/pay` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `payBusInstallment` | Bus pages |
| 73 | `POST /financial/records/:id/bus/installments/1/refund` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `refundBusInstallment` | Bus pages |
| 74 | `GET /financial/bus` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `fetchBusList` | Bus pages |
| 75 | `GET /financial/bus/candidates` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `fetchBusCandidates` | Bus pages |
| 76 | `GET /financial/bus/:id` | [`bus.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/bus.js) | `fetchBusRecord` | Bus pages |
| 77 | `GET /financial/additional-fees` | [`additionalFees.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/additionalFees.js) | `fetchAdditionalFees` | Additional fees pages |
| 78 | `POST /financial/additional-fees` | [`additionalFees.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/additionalFees.js) | `addAdditionalFee` | Additional fees pages |
| 79 | `POST /financial/additional-fees/:id/pay/:studentId` | [`additionalFees.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/additionalFees.js) | `payAdditionalFee` | Additional fees pages |
| 80 | `POST /financial/trips` | [`trips.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/trips.js) | `createTripTemplate` | Trips pages |
| 81 | `POST /financial/trips/:id/enroll` | [`trips.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/trips.js) | `enrollStudentInTripTemplate` | Trips pages |
| 82 | `GET /financial/trips/:id/students` | [`trips.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/trips.js) | `fetchTripTemplateStudents` | Trips pages |
| 83 | `POST /financial/records/:id/trips/:id/pay` | [`trips.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/financials/trips.js) | `payTripInstallment` | Trips pages |
| 84 | `POST /terms/copy-from/:id/:id` | [`terms.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/terms.js) | `copyTermsFromYear` | Academic Year setup |
| 85 | `POST /classes/copy-from/:id/:id` | [`classes.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/classes.js) | `copyClassesFromYear` | Academic Year setup |
| 86 | `GET /teacher-attendance/detect-ip` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `detectTeacherAttendanceIp` | TeacherCheckIn |
| 87 | `POST /teacher-attendance/check-in` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `checkInTeacherAttendance` | TeacherCheckIn |
| 88 | `GET /teacher-attendance/me` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `fetchMyTeacherAttendance` | TeacherCheckIn |
| 89 | `GET /teacher-attendance` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `fetchTeacherAttendanceAdmin` | TeacherAttendanceAdmin |
| 90 | `GET /teacher-attendance/absent` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `fetchAbsentTeachers` | TeacherAttendanceAdmin |
| 91 | `POST /teacher-attendance` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `createManualTeacherAttendance` | TeacherAttendanceAdmin |
| 92 | `PATCH /teacher-attendance/:id` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `updateTeacherAttendance` | TeacherAttendanceAdmin |
| 93 | `DELETE /teacher-attendance/:id` | [`teacherAttendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/teacherAttendance.js) | `deleteTeacherAttendance` | TeacherAttendanceAdmin |

---

## ❌ Missing Endpoints — Must Fix

These are confirmed missing from the frontend. For each, I provide the exact fix.

---

### Missing #1: `GET /attendance/lecture/:lectureId/sheet?date=YYYY-MM-DD`

> [!IMPORTANT]
> This is used by the Teacher Attendance workflow (Postman sections 21 & 22). It returns the lecture details, class roster, and today's absences in **one server call** — replacing 3 separate calls the frontend currently makes.

**Backend**: [`attendance.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/attendance/attendance.controller.ts#L62-L71) → `@Get('lecture/:lectureId/sheet')`

**Where to add**: [`APIs/school/attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js)

```diff
+export const fetchLectureAttendanceSheet = async (
+  lectureId,
+  date
+) => {
+  try {
+    const response = await api.get(
+      `${ENDPOINT}/lecture/${lectureId}/sheet`,
+      { params: { date } }
+    );
+    return response.data;
+  } catch (error) {
+    return getErrorMessage(
+      error,
+      "تعذر تحميل ورقة الحضور"
+    );
+  }
+};
```

**UI integration**: Use in [`TeacherAttendance.jsx`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/pages/TeacherAttendance/TeacherAttendance.jsx) to replace the three separate calls (`fetchAttendance` + `getSchoolClassById` + `fetchStudents`) with a single `fetchLectureAttendanceSheet(lectureId, date)` call.

---

### Missing #2: `GET /enrollments/promotion-preview/:targetAcademicYearId`

> [!IMPORTANT]
> Wizard Step 5 — shows which students will be promoted, graduated, or retained. Currently **no UI exists** for this feature.

**Backend**: [`enrollments.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/enrollments/enrollments.controller.ts#L46-L58) → `@Get('promotion-preview/:targetAcademicYearId')`

**Where to add**: [`APIs/school/enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js)

```diff
+export const fetchPromotionPreview = async (
+  targetAcademicYearId,
+  previousAcademicYearId
+) => {
+  if (!targetAcademicYearId) {
+    return {
+      status: false,
+      message: "معرّف السنة الدراسية المستهدفة مطلوب",
+    };
+  }
+
+  try {
+    const response = await api.get(
+      `${ENDPOINT}/promotion-preview/${targetAcademicYearId}`,
+      {
+        params: previousAcademicYearId
+          ? { previousAcademicYearId }
+          : {},
+      }
+    );
+    return response.data;
+  } catch (error) {
+    return getApiError(
+      error,
+      "تعذر تحميل معاينة الترقية"
+    );
+  }
+};
```

---

### Missing #3: `POST /enrollments/bulk-promote/:targetAcademicYearId`

> [!IMPORTANT]
> Wizard Step 5 — executes the actual bulk promotion of students. Without this, the academic year transition wizard is incomplete.

**Backend**: [`enrollments.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/enrollments/enrollments.controller.ts#L60-L69) → `@Post('bulk-promote/:targetAcademicYearId')`

**Where to add**: [`APIs/school/enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js)

```diff
+export const bulkPromoteStudents = async (
+  targetAcademicYearId,
+  { promotions = [], exclusions = [] } = {}
+) => {
+  if (!targetAcademicYearId) {
+    return {
+      status: false,
+      message: "معرّف السنة الدراسية المستهدفة مطلوب",
+    };
+  }
+
+  try {
+    const response = await api.post(
+      `${ENDPOINT}/bulk-promote/${targetAcademicYearId}`,
+      { promotions, exclusions }
+    );
+    return response.data;
+  } catch (error) {
+    return getApiError(
+      error,
+      "تعذر تنفيذ ترقية الطلاب"
+    );
+  }
+};
```

---

### Missing #4: `GET /library/by-subject/:subjectId`

> [!IMPORTANT]
> Returns library resources filtered by subject. The backend supports this but the frontend has no API function for it.

**Backend**: [`library.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/library/library.controller.ts#L65-L69) → `@Get('by-subject/:subjectId')`

**Where to add**: [`APIs/school/library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js)

```diff
+export const fetchLibraryBySubject = async (
+  subjectId
+) => {
+  const id = normalizeId(subjectId);
+
+  if (!id) {
+    return {
+      status: false,
+      message: "معرّف المادة غير موجود",
+    };
+  }
+
+  try {
+    const response = await api.get(
+      `${ENDPOINT}/by-subject/${id}`
+    );
+    return normalizeSuccess(response);
+  } catch (error) {
+    return normalizeFailure(
+      error,
+      "تعذر تحميل مصادر المادة"
+    );
+  }
+};
```

**UI integration**: Use in [`TeacherLibrary.jsx`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/pages/TeacherLibrary/TeacherLibrary.jsx) for the "filter by subject" feature, replacing direct `api.get` calls.

---

### Missing #5: `POST /lectures/copy-from/:targetYearId/:targetTermId/:sourceTermId`

> [!IMPORTANT]
> Wizard Step 7 — copies the weekly timetable from one term to another. Without this, schedule migration during academic year transition must be done manually.

**Backend**: [`lectures.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/lectures/lectures.controller.ts#L96-L104) → `@Post('copy-from/:targetYearId/:targetTermId/:sourceTermId')`

**Where to add**: [`APIs/school/lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js)

```diff
+export const copyLecturesFromTerm = async (
+  targetYearId,
+  targetTermId,
+  sourceTermId
+) => {
+  if (!targetYearId || !targetTermId || !sourceTermId) {
+    return {
+      status: false,
+      message: "بيانات نسخ الجدول غير مكتملة",
+    };
+  }
+
+  try {
+    const response = await api.post(
+      `${ENDPOINT}/copy-from/${targetYearId}/${targetTermId}/${sourceTermId}`
+    );
+    invalidateLecturesCache();
+    return normalizeSuccess(response);
+  } catch (error) {
+    return normalizeFailure(
+      getApiError(error, "تعذر نسخ الجدول"),
+      "تعذر نسخ الجدول"
+    );
+  }
+};
```

---

### Missing #6: `GET /exams/teacher/me`

> [!IMPORTANT]
> Returns the authenticated teacher's own exams. The backend has this endpoint. The frontend `exams.js` has NO function for it. Currently `TeacherExams.jsx` uses `fetchExams({...})` with filters, which doesn't route to the dedicated endpoint.

**Backend**: [`exams.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/exams/exams.controller.ts) → `@Get('teacher/me')`

**Where to add**: [`APIs/school/exams.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/exams.js)

```diff
+export const fetchTeacherExams = async (
+  filters = {}
+) => {
+  try {
+    const response = await api.get(
+      `${ENDPOINT}/teacher/me`,
+      { params: filters }
+    );
+    return response.data;
+  } catch (error) {
+    return getErrorMessage(
+      error,
+      "تعذر تحميل اختبارات المعلم"
+    );
+  }
+};
```

**UI integration**: Replace the `fetchExams({...})` call in [`TeacherExams.jsx`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/pages/TeacherExams/TeacherExams.jsx) with `fetchTeacherExams(filters)`.

---

### Missing #7: `POST /teacher-assignments` and `DELETE /teacher-assignments/:id`

> [!WARNING]
> The frontend only has `GET /teacher-assignments` (declared in `lectures.js` via `fetchTeacherAssignments`). There are **no functions** to create or delete teacher assignments. Pages like TeacherExamAdd and TeacherLibrary use raw `api.get("/teacher-assignments")` calls but never create/delete.

**Backend**: [`teacher-assignments.controller.ts`](file:///Users/abdelati88/development/nasaq/nasaq-backend/src/teacher-assignments/teacher-assignments.controller.ts) → `@Post()` and `@Delete(':id')`

**Where to add**: [`APIs/school/lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) (where `fetchTeacherAssignments` already lives)

```diff
+export const createTeacherAssignment = async (data) => {
+  try {
+    const response = await api.post(
+      "/teacher-assignments",
+      data
+    );
+    return normalizeSuccess(response);
+  } catch (error) {
+    return normalizeFailure(
+      getApiError(error, "تعذر إسناد المعلم"),
+      "تعذر إسناد المعلم"
+    );
+  }
+};
+
+export const deleteTeacherAssignment = async (id) => {
+  const assignmentId = normalizeId(id);
+  if (!assignmentId) {
+    return {
+      status: false,
+      message: "معرّف الإسناد غير موجود",
+    };
+  }
+
+  try {
+    const response = await api.delete(
+      `/teacher-assignments/${assignmentId}`
+    );
+    return normalizeSuccess(response);
+  } catch (error) {
+    return normalizeFailure(
+      getApiError(error, "تعذر حذف إسناد المعلم"),
+      "تعذر حذف إسناد المعلم"
+    );
+  }
+};
```

---

### Missing #8: `GET /gradesCriteria/student/me` and `GET /gradesCriteria/student/me/subjects`

> [!NOTE]
> The frontend has `fetchStudentGrades` (for `/gradesCriteria/student/me/grades`) in `student/index.js`, but the other two student gradesCriteria endpoints have no API functions.

**Backend**: `@Get('student/me')` and `@Get('student/me/subjects')`

**Where to add**: [`APIs/student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js)

```diff
+export const fetchStudentGradesCriteria = async () => {
+  try {
+    const response = await api.get("/gradesCriteria/student/me");
+    return response.data;
+  } catch (error) {
+    return { status: false, message: error?.message || "تعذر تحميل معايير التقييم" };
+  }
+};
+
+export const fetchStudentGradedSubjects = async () => {
+  try {
+    const response = await api.get("/gradesCriteria/student/me/subjects");
+    return response.data;
+  } catch (error) {
+    return { status: false, message: error?.message || "تعذر تحميل مواد التقييم" };
+  }
+};
```

---

## 📊 Summary

| Status | Count | Percentage |
|---|---|---|
| ✅ Fully implemented (API + UI) | **75** | **91.5%** |
| ❌ Missing from API layer entirely | **7 gaps** | **8.5%** |

### Missing Endpoints Summary

| # | Endpoint | File to Fix | Priority |
|---|---|---|---|
| 1 | `GET /attendance/lecture/:lectureId/sheet` | [`attendance.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/attendance.js) | 🔴 High — optimizes teacher workflow |
| 2 | `GET /enrollments/promotion-preview/:id` | [`enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js) | 🔴 High — blocks new year wizard |
| 3 | `POST /enrollments/bulk-promote/:id` | [`enrollments.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/enrollments.js) | 🔴 High — blocks new year wizard |
| 4 | `GET /library/by-subject/:subjectId` | [`library.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/library.js) | 🟡 Medium — convenience endpoint |
| 5 | `POST /lectures/copy-from/:id/:id/:id` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | 🔴 High — blocks new year wizard |
| 6 | `GET /exams/teacher/me` | [`exams.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/exams.js) | 🟡 Medium — currently uses workaround |
| 7 | `POST /teacher-assignments` + `DELETE` | [`lectures.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/school/lectures.js) | 🟡 Medium — admin function |
| 8 | `GET /gradesCriteria/student/me` + `/subjects` | [`student/index.js`](file:///Users/abdelati88/development/nasaq/nasaq-frontend/src/APIs/student/index.js) | 🟢 Low — student view |
