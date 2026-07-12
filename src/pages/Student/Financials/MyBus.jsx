import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";
import { useMyBus } from "@/utils/hooks/apis/financials/useBus";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const serviceTypeMap = {
  pickup: "ذهاب فقط",
  dropoff: "عودة فقط",
  both: "ذهاب وعودة",
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

const MyBus = () => {
  const { busRecord, loading } = useMyBus();

  if (loading) {
    return <Loading />;
  }

  if (!busRecord) {
    return (
      <Container noSidebar={true}>
        <Back title={"خطة الباص"} />
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          لا توجد بيانات باص متاحة حالياً
        </div>
      </Container>
    );
  }

  const student = busRecord?.student || {};
  const bus = busRecord?.bus || {};

  if (!bus?.enrolled) {
    return (
      <Container noSidebar={true}>
        <Back title={"خطة الباص"} />
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          أنت غير مشترك حالياً في خدمة الباص
        </div>
      </Container>
    );
  }

  const fee = Number(bus?.discount ? bus?.netFee : bus?.fee || 0);
  const totalPaid = Number(bus?.totalPaid || 0);
  const remaining = Math.max(fee - totalPaid, 0);
  const installments = bus?.installments || [];

  return (
    <Container noSidebar={true}>
      <Back title={"خطة الباص"} />

      <div className="mt-6 min-h-[calc(100vh-220px)] space-y-6">
        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
              الطالب: {student?.name || "—"}
            </span>
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
              الحالة: {statusMap[bus?.status] || "غير مدفوعة"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#BCD7FF] bg-[#EEF5FF] p-4">
              <p className="text-xs font-semibold text-[#0F4C81]">نوع الخدمة</p>
              <p className="mt-2 text-xl font-bold text-[#0B3558]">{serviceTypeMap[bus?.serviceType] || "ذهاب وعودة"}</p>
            </div>
            <div className="rounded-2xl border border-[#BCD7FF] bg-[#EEF5FF] p-4">
              <p className="text-xs font-semibold text-[#0F4C81]">إجمالي رسوم الباص</p>
              <p className="mt-2 text-xl font-bold text-[#0B3558]">{formatMoney(fee)}</p>
            </div>
            <div className="rounded-2xl border border-[#9DE2C6] bg-[#E7F8F1] p-4">
              <p className="text-xs font-semibold text-[#0E9F6E]">إجمالي المدفوع</p>
              <p className="mt-2 text-xl font-bold text-[#065F46]">{formatMoney(totalPaid)}</p>
            </div>
            <div className="rounded-2xl border border-[#F4B5B5] bg-[#FDECEC] p-4">
              <p className="text-xs font-semibold text-[#D14343]">المتبقي</p>
              <p className="mt-2 text-xl font-bold text-[#991B1B]">{formatMoney(remaining)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1E293B]">أقساط الباص</h2>
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
              عدد الأقساط: {installments.length}
            </span>
          </div>

          {installments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
              لا توجد أقساط لعرضها
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
                  {installments.map((item) => (
                    <tr key={item?._id || item?.installmentNumber}>
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
        </section>
      </div>
    </Container>
  );
};

export default MyBus;
