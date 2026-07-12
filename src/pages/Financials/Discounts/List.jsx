import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Button, Grid, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteDiscount } from "@/APIs/financials/discounts";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useDiscounts } from "@/utils/hooks/apis/financials/useDiscounts";
import usePermissions from "@/utils/hooks/usePermissions";

const DiscountsListPage = () => {
  const headers = ["اسم الخصم", "نسبة الخصم", "الحالة"];
  const body = ["name", "percentage", "isActive"];

  const { discounts, loading, setDiscounts } = useDiscounts();
  const permissions = usePermissions("financial");

  const mappedDiscounts = (discounts || []).map((item) => ({
    id: item._id,
    name: item.name,
    percentage: `${item.percentage}%`,
    isActive: item.isActive ? "نشط" : "غير نشط",
  }));

  const handleDelete = async (id, setActive) => {
    const response = await deleteDiscount(id);
    if (response.status) {
      toast.success("تم حذف الخصم بنجاح");
      setDiscounts((prev) => prev.filter((item) => item._id !== id));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف الخصم");
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
                  إضافة خصم
                </Button>
              </Link>
            )}
          </Stack>
        </Grid>
      </Grid>

      {!loading && mappedDiscounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد خصومات لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedDiscounts}
          loading={loading}
          edit={permissions?.edit}
          body={body}
          deleteFn={permissions?.delete ? handleDelete : undefined}
        />
      )}
    </Container>
  );
};

export default DiscountsListPage;
