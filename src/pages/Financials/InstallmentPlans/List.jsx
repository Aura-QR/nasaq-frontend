import { Button, Grid, Stack } from "@mui/material";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { deleteInstallmentPlan } from "@/APIs/financials/installmentPlans";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";
import usePermissions from "@/utils/hooks/usePermissions";

const InstallmentPlansListPage = () => {
  const headers = ["اسم الخطة", "عدد الأقساط", "افتراضية", "الحالة"];
  const body = ["name", "numberOfInstallments", "isDefault", "isActive"];

  const { installmentPlans, loading, setInstallmentPlans } = useInstallmentPlans();
  const permissions = usePermissions("financial");

  const mappedInstallmentPlans = (installmentPlans || []).map((item) => ({
    id: item._id,
    name: item.name,
    numberOfInstallments: `${item.numberOfInstallments} قسط`,
    isDefault: item.isDefault ? "نعم" : "لا",
    isActive: item.isActive ? "نشطة" : "غير نشطة",
  }));

  const handleDelete = async (id, setActive) => {
    const response = await deleteInstallmentPlan(id);
    if (response.status) {
      toast.success("تم حذف خطة التقسيط بنجاح");
      setInstallmentPlans((prev) => prev.filter((item) => item._id !== id));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف خطة التقسيط");
    }
  };

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12}>
          <Stack direction={"row"} spacing={8} alignItems={"center"}>
            {permissions?.add && (
              <Link to={"add"}>
                <Button
                  startIcon={<AddCircleOutlineOutlined />}
                  variant="contained"
                  sx={{ p: "16px 40px", borderRadius: "8px" }}
                >
                  إضافة خطة تقسيط
                </Button>
              </Link>
            )}
          </Stack>
        </Grid>
      </Grid>

      {!loading && mappedInstallmentPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد خطط تقسيط لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedInstallmentPlans}
          loading={loading}
          edit={permissions?.edit}
          body={body}
          deleteFn={permissions?.delete ? handleDelete : undefined}
        />
      )}
    </Container>
  );
};

export default InstallmentPlansListPage;
