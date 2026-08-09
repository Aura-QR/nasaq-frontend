import { Box, Button } from "@mui/material";
import { AddCircleOutlineRounded, AccountBalanceWalletRounded, GroupsRounded, AttachMoneyRounded } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { EmptyState, FinancialHeader, SectionCard, StatCard, StatsGrid } from "@/components/financial/FinancialShell";
import { deleteAdditionalFee } from "@/APIs/financials/additionalFees";
import { useAdditionalFees } from "@/utils/hooks/apis/financials/useAdditionalFees";
import usePermissions from "@/utils/hooks/usePermissions";
import { formatMoney } from "@/utils/financial/financialUtils";

const headers = ["اسم الرسوم", "المبلغ", "الوصف", "نوع الاستهداف"];
const body = ["name", "amount", "description", "targetTypeLabel"];

const targetLabels = {
  student: "طالب محدد",
  class: "فصل محدد",
  academicYear: "سنة دراسية",
  school: "جميع طلاب المدرسة",
  all: "الجميع (المدرسة)",
};

const AdditionalFeesListPage = () => {
  const { fees = [], loading, setFees } = useAdditionalFees();
  const permissions = usePermissions("financial");

  const rows = fees.map((i) => ({
    id: i?._id || i?.id,
    name: i?.name || "—",
    amount: formatMoney(Number(i?.amount || 0)),
    description: i?.description || "—",
    targetTypeLabel: targetLabels[i?.targetType] || i?.targetType || "—",
  }));

  const totalAmount = fees.reduce((sum, item) => sum + Number(item?.amount || 0), 0);

  const del = async (id, setOpen) => {
    const r = await deleteAdditionalFee(id);
    if (r?.status) {
      toast.success("تم حذف الرسوم الإضافية بنجاح");
      setFees((prev) => prev.filter((item) => (item?._id || item?.id) !== id));
      if (setOpen) setOpen(false);
    } else {
      toast.error(typeof r === "string" ? r : r?.message || "حدث خطأ أثناء حذف الرسوم الإضافية");
    }
  };

  const action = permissions?.add ? (
    <Button
      component={Link}
      to="add"
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{
        minHeight: 42,
        borderRadius: "12px",
        background: "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
        fontWeight: 800,
      }}
    >
      إضافة رسوم إضافية
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <FinancialHeader
          title="إدارة الرسوم الإضافية"
          description="إضافة وتتبع الرسوم الإضافية المخصصة للطلاب أو الفصول أو المدرسة."
          count={fees.length}
          actions={action}
        />
        <StatsGrid>
          <StatCard label="إجمالي الرسوم الإضافية" value={fees.length} icon={<AccountBalanceWalletRounded />} />
          <StatCard label="إجمالي المبالغ" value={formatMoney(totalAmount)} icon={<AttachMoneyRounded />} />
          <StatCard label="نطاق الاستهداف" value="طلاب / فصول / مدرسة" icon={<GroupsRounded />} />
        </StatsGrid>
        <SectionCard title="قائمة الرسوم الإضافية" description="استعرض التفاصيل أو احذف الرسوم المضافة.">
          {!loading && rows.length === 0 ? (
            <EmptyState
              icon={<AccountBalanceWalletRounded />}
              title="لا توجد رسوم إضافية حتى الآن"
              description="أضف رسوماً إضافية جديدة وتعيينها للطلاب أو الفصول."
            />
          ) : (
            <Box sx={{ p: 1 }}>
              <Table
                headers={headers}
                data={rows}
                loading={loading}
                body={body}
                deleteFn={permissions?.delete ? del : undefined}
              />
            </Box>
          )}
        </SectionCard>
      </Box>
    </Container>
  );
};

export default AdditionalFeesListPage;
