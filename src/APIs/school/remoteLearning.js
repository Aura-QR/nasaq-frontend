import { api } from "../Axios";

// التعليم عن بُعد: أيام الدراسة عن بُعد، وروابط الحصص.
const E = "/remote-learning";
const ok = async (fn, fallback) => {
  try {
    return (await fn()).data;
  } catch (e) {
    return { status: false, message: e?.response?.data?.message || fallback };
  }
};

export const fetchRemoteDays = () => ok(() => api.get(`${E}/days`), "تعذر تحميل أيام التعليم عن بُعد");
export const createRemoteDay = (data) => ok(() => api.post(`${E}/days`, data), "تعذر حفظ أيام التعليم عن بُعد");
export const deleteRemoteDay = (id) => ok(() => api.delete(`${E}/days/${id}`), "تعذر الإلغاء");
export const fetchTeacherLinks = () => ok(() => api.get(`${E}/teachers`), "تعذر تحميل روابط المعلمين");
export const setTeacherLink = (id, meetingUrl) => ok(() => api.put(`${E}/teachers/${id}/meeting-url`, { meetingUrl }), "تعذر حفظ الرابط");
export const setMyMeetingUrl = (meetingUrl) => ok(() => api.put(`${E}/me/meeting-url`, { meetingUrl }), "تعذر حفظ الرابط");
export const setLessonLink = (lectureId, date, joinUrl) => ok(() => api.put(`${E}/lessons/${lectureId}/link`, { date, joinUrl }), "تعذر حفظ رابط الحصة");
export const fetchMyRemoteLessons = (date) => ok(() => api.get(`${E}/me/lessons`, { params: date ? { date } : {} }), "تعذر تحميل حصص اليوم");
export const fetchMyMeetingUrl = () => ok(() => api.get(`${E}/me/meeting-url`), "تعذر تحميل الرابط");
export const fetchRemoteDayPlan = (date) => ok(() => api.get(`${E}/day-plan`, { params: { date } }), "تعذر تحميل حصص اليوم");
