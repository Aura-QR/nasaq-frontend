import { api } from "../Axios";
import { apiError } from "./_helpers";
const E="/financial/records";
export const fetchFinancialRecords=async(filters={})=>{try{return(await api.get(E,{params:filters})).data}catch(e){return apiError(e,"تعذر تحميل السجلات المالية")}};
export const fetchSingleFinancialRecord=async(id)=>{try{return(await api.get(`${E}/${id}`)).data}catch(e){return apiError(e,"تعذر تحميل الملف المالي")}};
export const fetchMyFinancialRecord=async()=>{try{return(await api.get(`${E}/me`)).data}catch(e){return apiError(e,"تعذر تحميل الملف المالي")}};
export const fetchFinancialSummary=async(id)=>{try{return(await api.get(id?`${E}/${id}/summary`:`${E}/me/summary`)).data}catch(e){return apiError(e,"تعذر تحميل الملخص المالي")}};
export const fetchMyTripsOverview=async()=>{try{return(await api.get(`${E}/me/trips`)).data}catch(e){return apiError(e,"تعذر تحميل ملخص الرحلات")}};
export const payTuitionInstallment=async(id,data)=>{try{return(await api.post(`${E}/${id}/tuition/pay`,data)).data}catch(e){return apiError(e,"تعذر تسجيل دفعة المصروفات")}};
export const switchTuitionInstallmentPlan=async(id,installmentPlanId)=>{try{return(await api.patch(`${E}/${id}/tuition/switch-plan`,{installmentPlanId})).data}catch(e){return apiError(e,"تعذر تغيير خطة التقسيط")}};
/**
 * Void a payment recorded by mistake. `target` addresses the entry:
 * { section: "tuition"|"bus"|"trip"|"additionalFee", tripId?, additionalFeeId?,
 *   installmentNumber?, paymentIndex, expectedAmount, reason, academicYearId? }
 */
export const voidPayment=async(studentId,target)=>{try{return(await api.post(`${E}/${studentId}/payments/void`,target)).data}catch(e){return apiError(e,"تعذر إلغاء الدفعة")}};
export default {voidPayment,fetchFinancialRecords,fetchSingleFinancialRecord,fetchMyFinancialRecord,fetchFinancialSummary,fetchMyTripsOverview,payTuitionInstallment,switchTuitionInstallmentPlan};
