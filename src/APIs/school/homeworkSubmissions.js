import { api, API_BASE_URL } from "../Axios";

// تسليم واجبات الدروس: الطالب يرفع صور الحل، والمعلم يقبلها أو يعيدها.
const ok = async (fn, fallback) => {
  try {
    return (await fn()).data;
  } catch (e) {
    return { status: false, message: e?.response?.data?.message || fallback };
  }
};

/** رابط الملف كاملًا: الخادم يعيد مسارًا يبدأ بـ /uploads. */
export const fileHref = (url) => (!url || /^https?:\/\//.test(url) ? url : `${API_BASE_URL}${url}`);

export const submitLessonHomework = (resourceId, files, note, onProgress) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (note) form.append("note", note);
  return ok(
    () => api.post(`/preparation/student/homework/${resourceId}/submission`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    }),
    "تعذر تسليم الواجب",
  );
};
export const withdrawLessonHomework = (resourceId) =>
  ok(() => api.delete(`/preparation/student/homework/${resourceId}/submission`), "تعذر سحب التسليم");

export const fetchTeacherLessonHomework = () => ok(() => api.get("/preparation/teacher/homework"), "تعذر تحميل الواجبات");
export const fetchHomeworkSubmissions = (resourceId) =>
  ok(() => api.get(`/preparation/homework/${resourceId}/submissions`), "تعذر تحميل التسليمات");
export const reviewHomeworkSubmission = (resourceId, studentId, status, feedback) =>
  ok(() => api.patch(`/preparation/homework/${resourceId}/submissions/${studentId}`, { status, feedback }), "تعذر حفظ المراجعة");
