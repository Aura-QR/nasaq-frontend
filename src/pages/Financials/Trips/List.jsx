import {
  AddCircleOutlineRounded,
  AccountBalanceWalletRounded,
  PaymentsRounded,
  TourRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { Box, Button, Paper, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteTrip } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import {
  EmptyState,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
  pageCardSx,
} from "@/components/financial/FinancialShell";
import { formatMoney, mapFeeStatus } from "@/utils/financial/financialUtils";
import { useTrips } from "@/utils/hooks/apis/financials/useTrips";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "اسم الرحلة",
  "الوصف",
  "إجمالي الرسوم",
  "المدفوع",
  "المتبقي",
  "الحالة",
];
const BODY = ["name", "description", "fee", "totalPaid", "remaining", "status"];

const TripsListPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const { trips = [], loading, refetch } = useTrips(studentId);

  const mappedTrips = trips.map((trip) => {
    const effectiveFee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
    const totalPaid = Number(trip?.totalPaid || 0);
    const remaining = Math.max(effectiveFee - totalPaid, 0);
    return {
      id: trip?._id || trip?.id,
      name: trip?.name || "—",
      description: trip?.description || "—",
      fee: formatMoney(effectiveFee),
      totalPaid: formatMoney(totalPaid),
      remaining: formatMoney(remaining),
      status: mapFeeStatus(trip?.status),
      paidRaw: totalPaid,
      remainingRaw: remaining,
    };
  });

  const totalPaid = mappedTrips.reduce((sum, item) => sum + item.paidRaw, 0);
  const totalRemaining = mappedTrips.reduce((sum, item) => sum + item.remainingRaw, 0);
  const paidCount = mappedTrips.filter((item) => item.remainingRaw === 0).length;

  const handleDelete = async (tripId, setActiveDelete) => {
    const response = await deleteTrip(studentId, tripId);
    if (response?.status) {
      toast.success(response?.message || "تم حذف الرحلة بنجاح");
      setActiveDelete(false);
      await refetch();
      return;
    }
    toast.error(response?.message || response || "حدث خطأ أثناء حذف الرحلة");
  };

  const addAction = permissions?.add ? (
    <Button
      type="button"
      onClick={() => navigate(`/financial/records/${studentId}/trips/add`)}
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{
        width: { xs: "100%", sm: 155 },
        minHeight: 42,
        borderRadius: "12px",
        background:
          "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
        fontSize: 12,
        fontWeight: 800,
        textTransform: "none",
      }}
    >
      إضافة رحلة
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, px: 1.5, py: 1.05 }}>
          <Back title="رحلات الطالب" />
        </Paper>

        <FinancialHeader
          title="رحلات الطالب"
          description="تابع رسوم الرحلات والمدفوع والمتبقي والأقساط."
          count={mappedTrips.length}
          actions={addAction}
        />

        <StatsGrid>
          <StatCard label="إجمالي الرحلات" value={mappedTrips.length} icon={<TourRounded />} />
          <StatCard label="الرحلات المسددة" value={paidCount} icon={<PaymentsRounded />} />
          <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} icon={<VisibilityRounded />} />
          <StatCard label="إجمالي المتبقي" value={formatMoney(totalRemaining)} icon={<AccountBalanceWalletRounded />} />
        </StatsGrid>

        <SectionCard
          title="قائمة رحلات الطالب"
          description="افتح الرحلة لتسجيل الدفعات أو مراجعة جدول الأقساط."
        >
          {!loading && mappedTrips.length === 0 ? (
            <EmptyState
              icon={<TourRounded />}
              title="لا توجد رحلات مسجلة لهذا الطالب"
              description="أضف رحلة جديدة للطالب من الزر الموجود أعلى الصفحة."
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mappedTrips}
                loading={loading}
                profile={permissions?.read}
                deleteFn={permissions?.delete ? handleDelete : undefined}
                body={BODY}
              />
            </Box>
          )}
        </SectionCard>
      </Box>
    </Container>
  );
};

export default TripsListPage;
