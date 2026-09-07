import {
  AddCircleOutlineRounded,
  AccountBalanceWalletRounded,
  CheckCircleRounded,
  TourRounded,
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

const HEADERS = [
  "اسم الرحلة",
  "الوصف",
  "رسوم الرحلة",
  "الحالة",
];

const BODY = [
  "name",
  "description",
  "fee",
  "status",
];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const ModuleTripsListPage = () => {
  const navigate = useNavigate();
  const settingsPermissions = usePermissions("financialSettings");

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await fetchTripTemplates();

        if (!active) return;

        if (response?.status === false) {
          toast.error(
            response?.message ||
              "حدث خطأ أثناء جلب الرحلات"
          );
          setTemplates([]);
          return;
        }

        const list = asArray(
          response?.data ?? response
        );

        setTemplates(list);
      } catch (error) {
        if (!active) return;

        console.error(
          "[Trips] fetch templates error:",
          error
        );

        setTemplates([]);

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "حدث خطأ أثناء جلب الرحلات"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const mapped = useMemo(
    () =>
      templates.map((item) => ({
        id: item?._id || item?.id,
        name: item?.name || "—",
        description: item?.description || "—",
        fee: formatMoney(Number(item?.fee || 0)),
        feeRaw: Number(item?.fee || 0),
        isActive: item?.isActive !== false,
        status:
          item?.isActive === false
            ? "غير نشطة"
            : "نشطة",
      })),
    [templates]
  );

  const totalFees = useMemo(
    () =>
      mapped.reduce(
        (sum, item) => sum + item.feeRaw,
        0
      ),
    [mapped]
  );

  const averageFee =
    mapped.length > 0
      ? totalFees / mapped.length
      : 0;

  const activeTrips = mapped.filter(
    (item) => item.isActive
  ).length;

  const addAction = settingsPermissions?.add ? (
    <Button
      type="button"
      onClick={() =>
        navigate("/financial/trips/add")
      }
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{
        width: { xs: "100%", sm: 155 },
        minHeight: 42,
        borderRadius: "12px",
        background: "var(--color-navy)",
        fontSize: 12,
        fontWeight: 800,
        textTransform: "none",
      }}
    >
      إنشاء رحلة
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <FinancialHeader
          title="إدارة الرحلات"
          description="أنشئ الرحلات وعدّل بياناتها وسجّل الطلاب وتابع الرسوم والمدفوعات."
          count={mapped.length}
          actions={addAction}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي الرحلات"
            value={mapped.length}
            icon={<TourRounded />}
          />

          <StatCard
            label="الرحلات النشطة"
            value={activeTrips}
            icon={<CheckCircleRounded />}
          />

          <StatCard
            label="إجمالي رسوم الرحلات"
            value={formatMoney(totalFees)}
            icon={<AccountBalanceWalletRounded />}
          />

          <StatCard
            label="متوسط رسوم الرحلة"
            value={formatMoney(averageFee)}
            icon={<TourRounded />}
          />
        </StatsGrid>

        <SectionCard
          title="قائمة الرحلات"
          description="افتح الرحلة لإضافة الطلاب أو عدّل بيانات الرحلة حسب صلاحياتك."
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
                edit={settingsPermissions?.edit}
               profile={true}
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
