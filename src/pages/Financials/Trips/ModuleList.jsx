import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchTripTemplates } from "@/APIs/financials/trips";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import usePermissions from "@/utils/hooks/usePermissions";

const ModuleTripsListPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  const headers = ["اسم الرحلة", "الوصف", "رسوم الرحلة"];
  const body = ["name", "description", "fee"];

  const fetchData = async () => {
    setLoading(true);
    const response = await fetchTripTemplates();
    if (response.status) {
      setTemplates(response.data || []);
    } else {
      toast.error(response || "حدث خطأ ما أثناء جلب الرحلات");
      setTemplates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mapped = (templates || []).map((item) => ({
    id: item?._id,
    name: item?.name || "—",
    description: item?.description || "—",
    fee: `${Number(item?.fee || 0)} جنيه`,
  }));

  return (
    <Container>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent={{ sm: "flex-end" }} mt={8} mb={8}>
        {permissions?.add && (
          <Button
            startIcon={<AddCircleOutlineOutlined />}
            variant="contained"
            onClick={() => navigate("/financial/trips/add")}
            sx={{ p: "16px 40px", borderRadius: "8px" }}
          >
            إنشاء رحلة
          </Button>
        )}
      </Stack>

      {!loading && mapped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد رحلات لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mapped}
          loading={loading}
          profile={permissions?.read}
          body={body}
        />
      )}
    </Container>
  );
};

export default ModuleTripsListPage;
