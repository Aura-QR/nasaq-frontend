import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

/*
 * وثائق إقامة الطلاب غير السعوديين.
 * يرفعها الطالب (ولي الأمر) فتنتظر مراجعة المدرسة، أو ترفعها المدرسة فتُعتمد مباشرة.
 * الملفات لا تُفتح برابط عام، بل عبر الخادم مع تسجيل الدخول (fetchResidencyFile).
 */

const call = async (request, fallback) => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    return getApiError(error, fallback);
  }
};

const toFormData = (values = {}, files = []) => {
  const form = new FormData();
  ["type", "otherTypeLabel", "documentNumber", "issueDate", "expiryDate"].forEach((key) => {
    const value = values[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      form.append(key, String(value).trim());
    }
  });
  files.forEach((file) => form.append("files", file));
  return form;
};

export const fetchStudentResidency = (studentId) =>
  call(() => api.get(`/students/${studentId}/residency-documents`), "تعذر تحميل وثائق الإقامة");

export const uploadStudentResidency = (studentId, values, files) =>
  call(() => api.post(`/students/${studentId}/residency-documents`, toFormData(values, files)), "تعذر رفع الوثيقة");

export const fetchResidencyQueue = (status = "pending") =>
  call(() => api.get("/residency-documents", { params: { status } }), "تعذر تحميل الوثائق");

export const reviewResidencyDocument = (documentId, decision, reason) =>
  call(
    () => api.patch(`/residency-documents/${documentId}/review`, decision === "rejected" ? { decision, reason } : { decision }),
    "تعذر حفظ القرار"
  );

export const deleteResidencyDocument = (documentId) =>
  call(() => api.delete(`/residency-documents/${documentId}`), "تعذر حذف الوثيقة");

export const fetchMyResidency = () =>
  call(() => api.get("/students/me/residency-documents"), "تعذر تحميل وثائق الإقامة");

export const uploadMyResidency = (values, files) =>
  call(() => api.post("/students/me/residency-documents", toFormData(values, files)), "تعذر رفع الوثيقة");

/** يفتح ملف الوثيقة في نافذة جديدة بعد تحميله مع رمز الدخول. */
export const openResidencyFile = async (url) => {
  // تُفتح النافذة قبل الانتظار، وإلا منعها المتصفح كنافذة منبثقة.
  const tab = window.open("", "_blank");
  try {
    const response = await api.get(url, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    if (tab) tab.location.href = objectUrl;
    else window.location.href = objectUrl;
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return { status: true };
  } catch (error) {
    tab?.close();
    return getApiError(error, "تعذر فتح الملف");
  }
};

/** الطالب السعودي لا يحتاج وثيقة إقامة. */
export const isSaudiStudent = (student) =>
  String(student?.nationalityCode || "").toUpperCase() === "SA" ||
  /سعود/.test(String(student?.nationality || ""));
