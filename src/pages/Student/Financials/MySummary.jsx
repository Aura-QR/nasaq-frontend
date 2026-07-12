import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";
import { useFinancialSummary } from "@/utils/hooks/apis/financials/useFinancialSummary";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
  "not-enrolled": "غير مشترك",
};

const serviceTypeMap = {
  pickup: "ذهاب فقط",
  dropoff: "عودة فقط",
  both: "ذهاب وعودة",
};

const formatMoney = (value) => `${Number(value || 0)} جنيه`;

const countStatuses = (installments = []) => ({
  paid: installments.filter((item) => item?.status === "paid").length,
  pending: installments.filter((item) => item?.status === "pending").length,
  overdue: installments.filter((item) => item?.status === "overdue").length,
});

const SummaryCard = ({ title, status, totalPaid, remaining, counts, note }) => {
  return (
    <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#1E293B]">{title}</h3>
        <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
          {statusMap[status] || "غير مدفوعة"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#9DE2C6] bg-[#E7F8F1] p-3">
          <p className="text-xs font-semibold text-[#0E9F6E]">المدفوع</p>
          <p className="mt-1 text-sm font-bold text-[#065F46]">{formatMoney(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-[#F4B5B5] bg-[#FDECEC] p-3">
          <p className="text-xs font-semibold text-[#D14343]">المتبقي</p>
          <p className="mt-1 text-sm font-bold text-[#991B1B]">{formatMoney(remaining)}</p>
        </div>
        <div className="rounded-2xl bg-[#F9FAFB] p-3 text-xs font-semibold text-[#35413E]">مدفوع: {counts?.paid || 0}</div>
        <div className="rounded-2xl bg-[#F9FAFB] p-3 text-xs font-semibold text-[#35413E]">قيد الانتظار: {counts?.pending || 0}</div>
        <div className="rounded-2xl bg-[#F9FAFB] p-3 text-xs font-semibold text-[#35413E]">متأخر: {counts?.overdue || 0}</div>
      </div>

      {note && <p className="mt-3 text-xs font-medium text-gray-500">{note}</p>}
    </div>
  );
};

const MyFinancialSummary = () => {
  const { financialSummary, loading } = useFinancialSummary();

  if (loading) {
    return <Loading />;
  }

  if (!financialSummary) {
    return (
      <Container noSidebar={true}>
        <Back title={"الملخص المالي"} />
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          لا يوجد ملخص مالي متاح حالياً
        </div>
      </Container>
    );
  }

  const tuition = financialSummary?.tuition || {};
  const bus = financialSummary?.bus || { enrolled: false };
  const trips = financialSummary?.trips || [];

  return (
    <Container noSidebar={true}>
      <Back title={"الملخص المالي"} />

      <div className="mt-6 min-h-[calc(100vh-220px)] space-y-6">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#1E293B]">نظرة عامة</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#BCD7FF] bg-[#EEF5FF] p-4">
              <p className="text-xs font-semibold text-[#0F4C81]">السنة الدراسية</p>
              <p className="mt-2 text-sm font-bold text-[#0B3558]">{financialSummary?.academicYear || "—"}</p>
            </div>
            <div className="rounded-2xl border border-[#9DE2C6] bg-[#E7F8F1] p-4">
              <p className="text-xs font-semibold text-[#0E9F6E]">عدد الرحلات</p>
              <p className="mt-2 text-sm font-bold text-[#065F46]">{trips.length}</p>
            </div>
            <div className="rounded-2xl border border-[#F4B5B5] bg-[#FDECEC] p-4">
              <p className="text-xs font-semibold text-[#D14343]">حالة الباص</p>
              <p className="mt-2 text-sm font-bold text-[#991B1B]">
                {bus?.enrolled ? "مشترك" : "غير مشترك"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SummaryCard
            title="الرسوم الدراسية"
            status={tuition?.status}
            totalPaid={tuition?.totalPaid || 0}
            remaining={tuition?.remaining || 0}
            counts={countStatuses(tuition?.installments || [])}
          />

          <SummaryCard
            title="الباص"
            status={bus?.enrolled ? bus?.status : "not-enrolled"}
            totalPaid={bus?.totalPaid || 0}
            remaining={bus?.remaining || 0}
            counts={countStatuses(bus?.installments || [])}
            note={!bus?.enrolled ? "لم يتم الاشتراك في خدمة الباص" : `نوع الخدمة: ${serviceTypeMap[bus?.serviceType] || "ذهاب وعودة"}`}
          />

          {trips.map((trip) => (
            <SummaryCard
              key={trip?.tripId}
              title={`رحلة: ${trip?.name || "—"}`}
              status={trip?.status}
              totalPaid={trip?.totalPaid || 0}
              remaining={trip?.remaining || 0}
              counts={countStatuses(trip?.installments || [])}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default MyFinancialSummary;
