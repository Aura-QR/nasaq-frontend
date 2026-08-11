import { api } from "../Axios";
import { apiError } from "./_helpers";

const E = "/financial/fee-configs";

const normalizeId = (value) =>
  String(value?._id || value?.id || value || "").trim();

const buildPayload = (data = {}, { partial = false } = {}) => {
  const payload = {};

  if (!partial || data.academicYearId !== undefined) {
    payload.academicYearId = normalizeId(data.academicYearId);
  }

  if (!partial || data.gradeLevelId !== undefined) {
    payload.gradeLevelId = normalizeId(data.gradeLevelId);
  }

  if (!partial || data.tuitionFee !== undefined) {
    payload.tuitionFee = Number(data.tuitionFee);
  }

  if (!partial || data.expatriateSurchargePercentage !== undefined) {
    payload.expatriateSurchargePercentage = Number(
      data.expatriateSurchargePercentage,
    );
  }

  return payload;
};

export const fetchFeeConfigs = async () => {
  try {
    return (await api.get(E)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل إعدادات الرسوم");
  }
};

export const fetchSingleFeeConfig = async (id) => {
  try {
    return (await api.get(`${E}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل إعداد الرسوم");
  }
};

export const addFeeConfig = async (data) => {
  try {
    return (await api.post(E, buildPayload(data))).data;
  } catch (e) {
    return apiError(e, "تعذر إضافة إعداد الرسوم");
  }
};

export const editFeeConfig = async (data, id) => {
  try {
    return (await api.patch(`${E}/${id}`, buildPayload(data, { partial: true })))
      .data;
  } catch (e) {
    return apiError(e, "تعذر تعديل إعداد الرسوم");
  }
};

export const deleteFeeConfig = async (id) => {
  try {
    return (await api.delete(`${E}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر حذف إعداد الرسوم");
  }
};

export default {
  fetchFeeConfigs,
  fetchSingleFeeConfig,
  addFeeConfig,
  editFeeConfig,
  deleteFeeConfig,
};
