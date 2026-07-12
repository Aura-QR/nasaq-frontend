import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";
import { useMyTripsOverview } from "@/utils/hooks/apis/financials/useTrips";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const installmentStatusMap = {
  paid: "مدفوع",
  overdue: "متأخر",
  pending: "قيد الانتظار",
};

const formatMoney = (value) => `${Number(value || 0)} جنيه`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
};

const MyTrips = () => {
  const { allTrips, enrolledTrips, loading } = useMyTripsOverview();

  if (loading) {
    return <Loading />;
  }

  return (
    <Container noSidebar={true}>
      <Back title={"رحلاتي"} />

      <div className="mt-6 min-h-[calc(100vh-220px)] space-y-6">
        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1E293B]">كل الرحلات المتاحة</h2>
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
              العدد: {allTrips.length}
            </span>
          </div>

          {allTrips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
              لا توجد رحلات متاحة حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allTrips.map((trip) => (
                <div key={trip?.tripTemplateId} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1E293B]">{trip?.name || "—"}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        trip?.isEnrolled ? "bg-[#E7F8F1] text-[#0E9F6E]" : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {trip?.isEnrolled ? "مشترك" : "غير مشترك"}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-[#6B7280]">{trip?.description || "لا يوجد وصف"}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-[#EEF5FF] px-3 py-2">
                      <p className="text-xs font-semibold text-[#0F4C81]">رسوم الرحلة</p>
                      <p className="mt-1 font-bold text-[#0B3558]">{formatMoney(trip?.fee)}</p>
                    </div>
                    <div className="rounded-xl bg-[#F9FAFB] px-3 py-2">
                      <p className="text-xs font-semibold text-[#374151]">المدفوع</p>
                      <p className="mt-1 font-bold text-[#1F2937]">{formatMoney(trip?.totalPaid)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1E293B]">الرحلات المشترك بها</h2>
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
              العدد: {enrolledTrips.length}
            </span>
          </div>

          {enrolledTrips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
              أنت غير مشترك حالياً في أي رحلة
            </div>
          ) : (
            <div className="space-y-5">
              {enrolledTrips.map((trip) => (
                <div key={trip?.tripId} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1E293B]">{trip?.name || "—"}</h3>
                    <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                      {statusMap[trip?.status] || "غير مدفوعة"}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#BCD7FF] bg-[#EEF5FF] p-3">
                      <p className="text-xs font-semibold text-[#0F4C81]">رسوم الرحلة</p>
                      <p className="mt-1 text-sm font-bold text-[#0B3558]">{formatMoney(trip?.fee)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#9DE2C6] bg-[#E7F8F1] p-3">
                      <p className="text-xs font-semibold text-[#0E9F6E]">إجمالي المدفوع</p>
                      <p className="mt-1 text-sm font-bold text-[#065F46]">{formatMoney(trip?.totalPaid)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#F4B5B5] bg-[#FDECEC] p-3">
                      <p className="text-xs font-semibold text-[#D14343]">المتبقي</p>
                      <p className="mt-1 text-sm font-bold text-[#991B1B]">{formatMoney(trip?.remaining)}</p>
                    </div>
                  </div>

                  {(trip?.installments || []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      لا توجد أقساط لهذه الرحلة
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr>
                            <th className="rounded-r-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">القسط</th>
                            <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المبلغ</th>
                            <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المدفوع</th>
                            <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الاستحقاق</th>
                            <th className="rounded-l-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(trip?.installments || []).map((item) => (
                            <tr key={item?.installmentNumber}>
                              <td className="rounded-r-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm font-semibold text-[#1E293B]">
                                #{item?.installmentNumber}
                              </td>
                              <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                                {formatMoney(item?.amount)}
                              </td>
                              <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                                {formatMoney(item?.paidAmount)}
                              </td>
                              <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                                {formatDate(item?.dueDate)}
                              </td>
                              <td className="rounded-l-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm">
                                <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                                  {installmentStatusMap[item?.status] || "قيد الانتظار"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
};

export default MyTrips;
