import { api } from "../Axios";
import { apiError } from "./_helpers";

// بنود تُباع بالقطعة (الزي المدرسي…)، تُسعّر من الإعدادات.
const E = "/financial/fee-items";

export const fetchFeeItems = async () => {
  try { return (await api.get(E)).data; } catch (e) { return apiError(e, "تعذر تحميل البنود"); }
};
export const addFeeItem = async (data) => {
  try { return (await api.post(E, data)).data; } catch (e) { return apiError(e, "تعذر إضافة البند"); }
};
export const editFeeItem = async (id, data) => {
  try { return (await api.patch(`${E}/${id}`, data)).data; } catch (e) { return apiError(e, "تعذر تعديل البند"); }
};
export const deleteFeeItem = async (id) => {
  try { return (await api.delete(`${E}/${id}`)).data; } catch (e) { return apiError(e, "تعذر حذف البند"); }
};
export const sellFeeItem = async (itemId, studentId, data) => {
  try { return (await api.post(`${E}/${itemId}/sell/${studentId}`, data)).data; } catch (e) { return apiError(e, "تعذر تسجيل البيع"); }
};
export const cancelFeeItemSale = async (studentId, saleId, params) => {
  try { return (await api.delete(`${E}/sales/${studentId}/${saleId}`, { params })).data; } catch (e) { return apiError(e, "تعذر إلغاء البيع"); }
};
