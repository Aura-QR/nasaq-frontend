/*
 * Names and boxes for the permission areas, shared by the role tabs and the
 * job-title editor so the two screens never describe an area differently.
 */

export const ENTITY_LABELS = {
  students: "الطلاب",
  teachers: "المعلمون",
  classes: "الفصول",
  subjects: "المواد",
  lectures: "الحصص",
  library: "المكتبة",
  attendance: "حضور الطلاب",
  gradesCriteria: "معايير الدرجات",
  exams: "الاختبارات",
  projects: "المشاريع",
  grades: "الدرجات",
  preparation: "التحضير",
  financial: "المالية",
  financialSettings: "إعدادات المالية",
  expenses: "المصروفات",
  teacherAttendance: "حضور المعلمين",
  duty: "الاحتياطي والمناوبة والاستئذان",
  curriculum: "المناهج والدروس",
  academicStructure: "المراحل والصفوف والترمات",
  academicYears: "السنوات الدراسية",
  schoolSettings: "إعدادات المدرسة",
  messaging: "سجل رسائل واتساب",
  staffAttendance: "حضور الإداريين والمشرفين",
  managers: "المديرون والمساعدون",
  analytics: "التقارير",
  settings: "الإعدادات",
};

export const ACTION_LABELS = {
  read: "عرض",
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
};

export const ACTION_ORDER = [
  "read",
  "add",
  "edit",
  "delete",
];

/*
 * For these areas the server checks only some actions, so only those boxes
 * are shown. The rest stay in the draft untouched and are sent back as they
 * were.
 *
 * - academicStructure / academicYears: anyone can read them (every screen
 *   needs the year, stage and grade lists); deleting a year is owner-only.
 * - schoolSettings: reading is open too — the teacher check-in screen needs it.
 * - messaging: view the delivery log, and retry (تعديل).
 */
export const ENTITY_ACTIONS = {
  academicStructure: ["add", "edit", "delete"],
  academicYears: ["add", "edit"],
  schoolSettings: ["edit"],
  messaging: ["read", "edit"],
};

/*
 * Boxes a job title can never tick — the server forces them off. Creating or
 * editing exams, projects and preparation is a teacher's own work; deleting an
 * academic year is the owner's.
 */
export const TITLE_LOCKED_ACTIONS = {
  exams: ["add", "edit"],
  projects: ["add", "edit"],
  preparation: ["add", "edit"],
  academicYears: ["delete"],
};

/** The boxes shown for one area of a job title. */
export const titleActionKeys = (entity, actions = {}) => {
  const allowed = ENTITY_ACTIONS[entity] || ACTION_ORDER;
  const locked = TITLE_LOCKED_ACTIONS[entity] || [];
  return ACTION_ORDER.filter(
    (action) =>
      allowed.includes(action) &&
      !locked.includes(action) &&
      Object.prototype.hasOwnProperty.call(actions, action)
  );
};
