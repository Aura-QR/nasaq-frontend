import { api } from "../Axios";

const ENDPOINT = "/classes";
const CACHE_TTL = 15_000;
const cache = new Map();
const pending = new Map();

const idOf = (value) =>
  String(value?._id || value?.id || value || "").trim();

const errorMessage = (error, fallback = "حدث خطأ ما") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalize = (response) => {
  const payload = response?.data;
  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
      pagination: payload?.pagination,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination: payload?.pagination || payload?.meta || payload?.paging,
  };
};

const fail = (error, fallback) => ({
  status: false,
  message: errorMessage(error, fallback),
  statusCode: error?.response?.status,
  error,
});

const cached = async (key, request, force = false) => {
  const saved = cache.get(key);
  if (!force && saved && Date.now() - saved.createdAt < CACHE_TTL) {
    return saved.value;
  }
  if (!force && pending.has(key)) return pending.get(key);

  const promise = request()
    .then((value) => {
      if (value?.status !== false) {
        cache.set(key, { value, createdAt: Date.now() });
      }
      return value;
    })
    .finally(() => pending.delete(key));

  pending.set(key, promise);
  return promise;
};

export const invalidateClassesCache = () => cache.clear();

export const buildClassApiPayload = (payload = {}, { allowNullTeacher = false } = {}) => {
  const teacherInChargeId = idOf(payload?.teacherInChargeId);
  const gender = String(payload?.gender || "").trim().toLowerCase();

  const body = {
    name: String(payload?.name || "").trim(),
    gradeLevelId: idOf(payload?.gradeLevelId),
    academicYearId: idOf(payload?.academicYearId),
    gender: gender === "mixed" ? "both" : gender,
    maxCapacity: Number(payload?.maxCapacity),
    roomNumber: String(payload?.roomNumber || "").trim(),
    isActive: payload?.isActive === undefined ? true : Boolean(payload?.isActive),
  };

  if (!body.roomNumber) delete body.roomNumber;
  if (teacherInChargeId) body.teacherInChargeId = teacherInChargeId;
  else if (allowNullTeacher) body.teacherInChargeId = null;

  return body;
};

export const getSchoolClasses = async (filters = {}, { force = false } = {}) => {
  const params = Object.fromEntries(
    Object.entries({
      page: Number(filters?.page || 1),
      limit: Number(filters?.limit || 10),
      academicYearId: idOf(filters?.academicYearId) || undefined,
      gradeLevelId: idOf(filters?.gradeLevelId) || undefined,
    }).filter(([, value]) => value !== undefined && value !== "")
  );

  return cached(
    `classes:list:${JSON.stringify(params)}`,
    async () => {
      try {
        return normalize(await api.get(ENDPOINT, { params }));
      } catch (error) {
        return fail(error, "تعذر تحميل الفصول");
      }
    },
    force
  );
};

export const getSchoolClassesList = async ({ force = false } = {}) =>
  cached(
    "classes:list:simple",
    async () => {
      try {
        return normalize(await api.get(`${ENDPOINT}/list`));
      } catch (error) {
        return fail(error, "تعذر تحميل قائمة الفصول");
      }
    },
    force
  );

export const getSchoolClassById = async (classId, { force = false } = {}) => {
  const id = idOf(classId);
  if (!id) return { status: false, message: "معرّف الفصل غير موجود" };

  return cached(
    `classes:${id}`,
    async () => {
      try {
        return normalize(await api.get(`${ENDPOINT}/${id}`));
      } catch (error) {
        return fail(error, "تعذر تحميل بيانات الفصل");
      }
    },
    force
  );
};

export const getSchoolClassStudents = async (classId, { force = false } = {}) => {
  const id = idOf(classId);
  if (!id) return { status: false, message: "معرّف الفصل غير موجود" };

  return cached(
    `classes:${id}:students`,
    async () => {
      try {
        return normalize(await api.get(`${ENDPOINT}/${id}/students`));
      } catch (error) {
        return fail(error, "تعذر تحميل طلاب الفصل");
      }
    },
    force
  );
};

export const createSchoolClass = async (payload) => {
  try {
    const result = normalize(await api.post(ENDPOINT, buildClassApiPayload(payload)));
    invalidateClassesCache();
    return result;
  } catch (error) {
    return fail(error, "تعذر إضافة الفصل");
  }
};

export const updateSchoolClass = async (classId, payload) => {
  const id = idOf(classId);
  if (!id) return { status: false, message: "معرّف الفصل غير موجود" };

  try {
    const result = normalize(
      await api.patch(`${ENDPOINT}/${id}`, buildClassApiPayload(payload, { allowNullTeacher: true }))
    );
    invalidateClassesCache();
    return result;
  } catch (error) {
    return fail(error, "تعذر تعديل الفصل");
  }
};

export const deleteSchoolClass = async (classId) => {
  const id = idOf(classId);
  if (!id) return { status: false, message: "معرّف الفصل غير موجود" };
  try {
    const result = normalize(await api.delete(`${ENDPOINT}/${id}`));
    invalidateClassesCache();
    return result;
  } catch (error) {
    return fail(error, "تعذر حذف الفصل");
  }
};

export const toggleSchoolClassActive = async (classId) => {
  const id = idOf(classId);
  if (!id) return { status: false, message: "معرّف الفصل غير موجود" };
  try {
    const result = normalize(await api.patch(`${ENDPOINT}/${id}/toggle-active`));
    invalidateClassesCache();
    return result;
  } catch (error) {
    return fail(error, "تعذر تغيير حالة الفصل");
  }
};

export const copyClassesFromYear = async (targetYearId, sourceYearId) => {
  const targetId = idOf(targetYearId);
  const sourceId = idOf(sourceYearId);
  if (!targetId || !sourceId) {
    return { status: false, message: "اختر السنة المصدر والسنة المستهدفة" };
  }
  try {
    const result = normalize(
      await api.post(`${ENDPOINT}/copy-from/${targetId}/${sourceId}`)
    );
    invalidateClassesCache();
    return result;
  } catch (error) {
    return fail(error, "تعذر نسخ الفصول من السنة السابقة");
  }
};

/* Legacy compatibility */
const legacy = async (request, fallback) => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    return errorMessage(error, fallback);
  }
};

export const fetchClasses = (filters = {}) =>
  legacy(() => api.get(ENDPOINT, { params: filters }), "تعذر تحميل الفصول");
export const fetchClassesList = () =>
  legacy(() => api.get(`${ENDPOINT}/list`), "تعذر تحميل قائمة الفصول");
export const fetchSingleClass = (id) =>
  legacy(() => api.get(`${ENDPOINT}/${idOf(id)}`), "تعذر تحميل بيانات الفصل");
export const fetchClassStudents = (classId) =>
  legacy(() => api.get(`${ENDPOINT}/${idOf(classId)}/students`), "تعذر تحميل طلاب الفصل");
export const addClass = (data) =>
  legacy(() => api.post(ENDPOINT, buildClassApiPayload(data)), "تعذر إضافة الفصل");
export const editClass = (data, id) =>
  legacy(
    () => api.patch(`${ENDPOINT}/${idOf(id)}`, buildClassApiPayload(data, { allowNullTeacher: true })),
    "تعذر تعديل الفصل"
  );
export const deleteClass = (id) =>
  legacy(() => api.delete(`${ENDPOINT}/${idOf(id)}`), "تعذر حذف الفصل");
export const toggleActiveClass = (id) =>
  legacy(() => api.patch(`${ENDPOINT}/${idOf(id)}/toggle-active`), "تعذر تغيير حالة الفصل");
export const addStudentToClass = (classId, studentId) =>
  legacy(
    () => api.patch(`${ENDPOINT}/${idOf(classId)}/add-student/${idOf(studentId)}`),
    "تعذر إضافة الطالب إلى الفصل"
  );
export const deleteStudentFromClass = (classId, studentId) =>
  legacy(
    () => api.patch(`${ENDPOINT}/${idOf(classId)}/remove-student/${idOf(studentId)}`),
    "تعذر إزالة الطالب من الفصل"
  );
export const fetchClass = fetchSingleClass;
export const removeStudentFromClass = deleteStudentFromClass;
export const fetchMyClasses = () =>
  legacy(() => api.get(`${ENDPOINT}/my-classes`), "تعذر تحميل فصول المعلم");
export const fetchStudentClass = () =>
  legacy(() => api.get(`${ENDPOINT}/student/me`), "تعذر تحميل فصل الطالب");
export const fetchClassmates = () =>
  legacy(() => api.get(`${ENDPOINT}/student/me/mates`), "تعذر تحميل زملاء الفصل");

export default {
  getSchoolClasses,
  getSchoolClassesList,
  getSchoolClassById,
  getSchoolClassStudents,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
  toggleSchoolClassActive,
  copyClassesFromYear,
  fetchClasses,
  fetchClassesList,
  fetchSingleClass,
  fetchClass,
  fetchClassStudents,
  addClass,
  editClass,
  deleteClass,
  toggleActiveClass,
  addStudentToClass,
  deleteStudentFromClass,
  removeStudentFromClass,
  fetchMyClasses,
  fetchStudentClass,
  fetchClassmates,
};
