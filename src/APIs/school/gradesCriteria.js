import { api } from "../Axios";

const ENDPOINT = "/gradesCriteria";

const normalize = (response) => {
  const payload = response?.data;
  if (payload?.status === false) return payload;
  return payload;
};

const fail = (err, fallback = "حدث خطأ ما") => ({
  status: false,
  message: err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback,
  statusCode: err?.response?.status,
});

export const fetchGradesCriteria = async (filters) => {
  try {
    return normalize(await api.get(ENDPOINT, { params: filters }));
  } catch (err) {
    return fail(err, "تعذر تحميل توزيعات الدرجات");
  }
};

export const fetchSingleGradesCriteria = async (id) => {
  try {
    return normalize(await api.get(`${ENDPOINT}/${id}`));
  } catch (err) {
    return fail(err, "تعذر تحميل توزيع الدرجات");
  }
};

export const addGradesCriteria = async (data) => {
  try {
    return normalize(await api.post(ENDPOINT, data));
  } catch (err) {
    return fail(err, "تعذر إضافة توزيع الدرجات");
  }
};

export const editGradesCriteria = async (data, id) => {
  try {
    return normalize(await api.patch(`${ENDPOINT}/${id}`, data));
  } catch (err) {
    return fail(err, "تعذر تعديل توزيع الدرجات");
  }
};

export const deleteGradesCriteria = async (id) => {
  try {
    return normalize(await api.delete(`${ENDPOINT}/${id}`));
  } catch (err) {
    return fail(err, "تعذر حذف توزيع الدرجات");
  }
};
