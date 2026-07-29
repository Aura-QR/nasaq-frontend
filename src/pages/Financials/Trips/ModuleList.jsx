import {
  AddCircleOutlineRounded,
  AccountBalanceWalletRounded,
  TourRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { fetchTripTemplates } from "@/APIs/financials/trips";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import {
  EmptyState,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";
import { formatMoney } from "@/utils/financial/financialUtils";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = ["اسم الرحلة", "الوصف", "رسوم الرحلة"];
const BODY = ["name", "description", "fee"];

const ModuleTripsListPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions("financial");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const response = await fetchTripTemplates();
      if (!active) return;
      if (response?.status) {
        setTemplates(response?.data || []);
      } else {
        toast.error(response?.message || response || "حدث خطأ أثناء جلب الرحلات");
        setTemplates([]);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const mapped = templates.map((item) => ({
    id: item?._id || item?.id,
    name: item?.name || "—",
    description: item?.description || "—",
    fee: formatMoney(item?.fee),
    feeRaw: Number(item?.fee || 0),
  }));

  const totalFees = mapped.reduce((sum, item) => sum + item.feeRaw, 0);
  const averageFee = mapped.length ? totalFees / mapped.length : 0;

  const addAction = permissions?.add ? (
    <Button
      type="button"
      onClick={() => navigate("/financial/trips/add")}
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{ width: { xs: "100%", sm: 155 }, minHeight: 42, borderRadius: "12px", background: "var(--color-navy)", fontSize: 12, fontWeight: 800, textTransform: "none" }}
    >
      إنشاء رحلة
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <FinancialHeader
          title="إدارة الرحلات"
          description="أنشئ الرحلات وسجّل الطلاب وتابع الرسوم والمدفوعات."
          count={mapped.length}
          actions={addAction}
        />

        <StatsGrid>
          <StatCard label="إجمالي الرحلات" value={mapped.length} icon={<TourRounded />} />
          <StatCard label="الظاهر في الصفحة" value={mapped.length} icon={<VisibilityRounded />} />
          <StatCard label="إجمالي رسوم الرحلات" value={formatMoney(totalFees)} icon={<AccountBalanceWalletRounded />} />
          <StatCard label="متوسط رسوم الرحلة" value={formatMoney(averageFee)} icon={<TourRounded />} />
        </StatsGrid>

        <SectionCard
          title="قائمة الرحلات"
          description="افتح الرحلة لإضافة الطلاب أو مراجعة الرسوم والمدفوعات."
        >
          {!loading && mapped.length === 0 ? (
            <EmptyState
              icon={<TourRounded />}
              title="لا توجد رحلات حتى الآن"
              description="أنشئ أول رحلة ثم أضف الطلاب المشتركين بها."
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mapped}
                loading={loading}
                profile={permissions?.read}
                body={BODY}
              />
            </Box>
          )}
        </SectionCard>
      </Box>
    </Container>
  );
};

export default ModuleTripsListPage;
