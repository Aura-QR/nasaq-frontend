import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteTrip } from "@/APIs/financials/trips";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useTrips } from "@/utils/hooks/apis/financials/useTrips";
import usePermissions from "@/utils/hooks/usePermissions";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const TripsListPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const { trips, loading, refetch } = useTrips(studentId);

  const headers = ["اسم الرحلة", "الوصف", "إجمالي الرسوم", "المدفوع", "المتبقي", "الحالة"];
  const body = ["name", "description", "fee", "totalPaid", "remaining", "status"];

  const mappedTrips = (trips || []).map((trip) => {
    const effectiveFee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
    const totalPaid = Number(trip?.totalPaid || 0);
    const remaining = Math.max(effectiveFee - totalPaid, 0);

    return {
      id: trip?._id,
      name: trip?.name || "—",
      description: trip?.description || "—",
      fee: `${effectiveFee} جنيه`,
      totalPaid: `${totalPaid} جنيه`,
      remaining: `${remaining} جنيه`,
      status: statusMap[trip?.status] || "غير مدفوعة",
    };
  });

  const handleDelete = async (tripId, setActiveDelete) => {
    if (!studentId || !tripId) return;

    const response = await deleteTrip(studentId, tripId);
    if (response.status) {
      toast.success(response.message || "تم حذف الرحلة بنجاح");
      setActiveDelete(false);
      refetch();
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف الرحلة");
    }
  };

  return (
    <Container>
      <Back title={"رحلات الطالب"} />

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent={{ sm: "flex-end" }} mt={8} mb={8}>
        {permissions?.add && (
          <Button
            startIcon={<AddCircleOutlineOutlined />}
            variant="contained"
            onClick={() => navigate(`/financial/records/${studentId}/trips/add`)}
            sx={{ p: "16px 40px", borderRadius: "8px" }}
          >
            إضافة رحلة
          </Button>
        )}
      </Stack>

      {!loading && mappedTrips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد رحلات مسجلة لهذا الطالب
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedTrips}
          loading={loading}
          profile={permissions?.read}
          deleteFn={permissions?.delete ? handleDelete : undefined}
          body={body}
        />
      )}
    </Container>
  );
};

export default TripsListPage;
