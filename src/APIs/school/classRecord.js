import { api } from "../Axios";

const result = (error) => ({ status: false, message: error?.response?.data?.message || error?.message || "تعذر إتمام العملية", statusCode: error?.response?.status });
const unwrap = (r) => r?.data?.data ?? r?.data;
const listOf = (x) => (Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.items) ? x.items : Array.isArray(x?.classes) ? x.classes : []);

export const fetchClassAttendanceRegister = async (params) => { try { return { status: true, data: unwrap(await api.get("/class-record/attendance", { params })) }; } catch (error) { return result(error); } };
export const fetchClassSummary = async (params) => { try { return { status: true, data: unwrap(await api.get("/class-record/summary", { params })) }; } catch (error) { return result(error); } };

/** The classes this user may open: every class for the school's admins, her own for a teacher. */
export const fetchRecordClasses = async (teacher) => {
  try {
    const raw = unwrap(await api.get(teacher ? "/lectures/teacher/me/classes" : "/classes", { params: teacher ? {} : { limit: 200 } }));
    const seen = new Map();
    for (const c of listOf(raw)) {
      const klass = c?.classId && typeof c.classId === "object" ? c.classId : c;
      const id = String(klass?._id || klass?.id || c?.classId || "");
      if (id && !seen.has(id)) seen.set(id, { id, name: klass?.name || c?.className || "" });
    }
    return { status: true, data: [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "ar")) };
  } catch (error) { return result(error); }
};
