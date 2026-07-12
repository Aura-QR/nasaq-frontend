import { Button, Grid, Stack } from "@mui/material";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import usePermissions from "@/utils/hooks/usePermissions";
import { useFeeConfigs } from "@/utils/hooks/apis/financials/useFeeConfigs";
import { deleteFeeConfig } from "@/APIs/financials/feeConfigs";

const FeeConfigsListPage = () => {
  const headers = ["السنة الدراسية", "الرسوم السنوية"];
  const body = ["academicYear", "tuitionFee"];

  const { feeConfigs, loading, setFeeConfigs } = useFeeConfigs();
  const permissions = usePermissions("financial");

  const mappedFeeConfigs = (feeConfigs || []).map((item) => ({
    id: item._id,
    academicYear: item.academicYear,
    tuitionFee: `${item.tuitionFee} جنيه`,
  }));

  const handleDelete = async (id, setActive) => {
    const response = await deleteFeeConfig(id);
    if (response.status) {
      toast.success("تم حذف إعداد الرسوم بنجاح");
      setFeeConfigs((prev) => prev.filter((item) => item._id !== id));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف إعداد الرسوم");
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
                  إضافة إعداد رسوم
                </Button>
              </Link>
            )}
          </Stack>
        </Grid>
      </Grid>

      {!loading && mappedFeeConfigs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد إعدادات رسوم لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedFeeConfigs}
          loading={loading}
          edit={permissions?.edit}
          body={body}
          deleteFn={permissions?.delete ? handleDelete : undefined}
        />
      )}
    </Container>
  );
};

export default FeeConfigsListPage;
