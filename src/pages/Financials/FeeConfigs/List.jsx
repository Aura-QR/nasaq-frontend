import {
  AddCircleOutlineRounded,
  AccountBalanceWalletRounded,
  CalendarMonthRounded,
  PriceCheckRounded,
  SettingsRounded,
} from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteFeeConfig } from "@/APIs/financials/feeConfigs";
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
import { useFeeConfigs } from "@/utils/hooks/apis/financials/useFeeConfigs";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = ["السنة الدراسية", "الرسوم السنوية"];
const BODY = ["academicYear", "tuitionFee"];

const FeeConfigsListPage = () => {
  const { feeConfigs = [], loading, setFeeConfigs } = useFeeConfigs();
  const permissions = usePermissions("financial");

  const mappedFeeConfigs = feeConfigs.map((item) => ({
    id: item?._id || item?.id,
    academicYear: item?.academicYear || "—",
    tuitionFee: formatMoney(item?.tuitionFee),
    tuitionFeeRaw: Number(item?.tuitionFee || 0),
  }));

  const totalFees = mappedFeeConfigs.reduce(
    (sum, item) => sum + item.tuitionFeeRaw,
    0,
  );

  const averageFee = mappedFeeConfigs.length
    ? totalFees / mappedFeeConfigs.length
    : 0;

  const highestFee = mappedFeeConfigs.reduce(
    (max, item) => Math.max(max, item.tuitionFeeRaw),
    0,
  );

  const handleDelete = async (id, setActive) => {
    const response = await deleteFeeConfig(id);

    if (response?.status) {
      toast.success(response?.message || "تم حذف إعداد الرسوم بنجاح");
      setFeeConfigs((previous) =>
        previous.filter((item) => (item?._id || item?.id) !== id),
      );
      setActive(false);
      return;
    }

    toast.error(response?.message || response || "حدث خطأ أثناء حذف إعداد الرسوم");
  };

  const addAction = permissions?.add ? (
    <Button
      component={Link}
      to="add"
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{
        width: { xs: "100%", sm: 190 },
        minHeight: 42,
        borderRadius: "12px",
        color: "var(--color-white)",
        background:
          "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
        boxShadow: "0 9px 20px rgba(18,47,77,.16)",
        fontSize: 12,
        fontWeight: 800,
        textTransform: "none",
      }}
    >
      إضافة إعداد رسوم
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ width: "100%", minWidth: 0, pb: 4 }}>
        <FinancialHeader
          title="إعدادات الرسوم الدراسية"
          description="حدّد الرسوم السنوية لكل سنة دراسية من مكان واحد."
          count={feeConfigs.length}
          actions={addAction}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي الإعدادات"
            value={feeConfigs.length}
            icon={<SettingsRounded />}
          />
          <StatCard
            label="إجمالي الرسوم"
            value={formatMoney(totalFees)}
            icon={<AccountBalanceWalletRounded />}
          />
          <StatCard
            label="متوسط الرسوم"
            value={formatMoney(averageFee)}
            icon={<PriceCheckRounded />}
          />
          <StatCard
            label="أعلى رسوم سنوية"
            value={formatMoney(highestFee)}
            icon={<CalendarMonthRounded />}
          />
        </StatsGrid>

        <SectionCard
          title="قائمة إعدادات الرسوم"
          description="عدّل قيمة الرسوم أو احذف الإعداد حسب صلاحياتك."
        >
          {!loading && mappedFeeConfigs.length === 0 ? (
            <EmptyState
              icon={<AccountBalanceWalletRounded />}
              title="لا توجد إعدادات رسوم حتى الآن"
              description="أضف أول إعداد رسوم لربط السنة الدراسية بقيمة المصروفات السنوية."
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mappedFeeConfigs}
                loading={loading}
                edit={permissions?.edit}
                body={BODY}
                deleteFn={permissions?.delete ? handleDelete : undefined}
              />
            </Box>
          )}
        </SectionCard>
      </Box>
    </Container>
  );
};

export default FeeConfigsListPage;
