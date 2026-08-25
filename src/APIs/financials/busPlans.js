import { api } from "../Axios";
import { apiError } from "./_helpers";

const E = "/financial/bus-plans";
const BUS = "/financial/bus";

export const fetchBusPlans = async () => {
  try {
    return (await api.get(E)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل خطط الباص");
  }
};

export const fetchBusPlan = async (id) => {
  try {
    return (await api.get(`${E}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل خطة الباص");
  }
};

export const createBusPlan = async (data) => {
  try {
    return (await api.post(E, data)).data;
  } catch (e) {
    return apiError(e, "تعذر إنشاء خطة الباص");
  }
};

export const updateBusPlan = async (id, data) => {
  try {
    return (await api.patch(`${E}/${id}`, data)).data;
  } catch (e) {
    return apiError(e, "تعذر تعديل خطة الباص");
  }
};

export const deactivateBusPlan = async (id) => {
  try {
    return (await api.delete(`${E}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر إيقاف خطة الباص");
  }
};


export const switchBusPlan = async (
  studentId,
  data
) => {
  try {
    return (
      await api.patch(
        `${BUS}/${studentId}/switch-plan`,
        data
      )
    ).data;
  } catch (e) {
    return apiError(
      e,
      "تعذر تغيير خطة الباص"
    );
  }
};

export default {
  fetchBusPlans,
  fetchBusPlan,
  createBusPlan,
  updateBusPlan,
  deactivateBusPlan,
  switchBusPlan,
};
