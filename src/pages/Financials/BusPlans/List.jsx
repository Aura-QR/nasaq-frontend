import {
  AddCircleOutlineRounded,
  AltRouteRounded,
  CheckCircleRounded,
  DirectionsBusRounded,
  PaymentsRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
} from "@mui/material";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  deactivateBusPlan,
  fetchBusPlans,
} from "@/APIs/financials/busPlans";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";

import {
  EmptyState,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";

import {
  formatMoney,
  getErrorMessage,
  mapBusServiceType,
} from "@/utils/financial/financialUtils";

import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "اسم الخطة",
  "نوع الخدمة",
  "الرسوم",
  "خطة التقسيط",
  "عدد المشتركين",
  "الحالة",
];

const BODY = [
  "name",
  "serviceType",
  "fee",
  "installmentPlan",
  "enrolledCount",
  "status",
];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const getInstallmentPlanLabel = (value) => {
  if (!value) {
    return "دفعة واحدة";
  }

  if (typeof value === "object") {
    const name =
      value?.name ||
      value?.title ||
      "خطة تقسيط";

    const count =
      value?.numberOfInstallments ||
      value?.installmentsCount;

    return count
      ? `${name} (${count} قسط)`
      : name;
  }

  return "خطة تقسيط مرتبطة";
};

const BusPlansListPage = () => {
  const navigate = useNavigate();
  const settingsPermissions =
    usePermissions("financialSettings");

  const [plans, setPlans] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadPlans = async () => {
    setLoading(true);

    try {
      const response =
        await fetchBusPlans();

      if (response?.status === false) {
        toast.error(
          getErrorMessage(
            response,
            "تعذر تحميل خطط الباص"
          )
        );
        setPlans([]);
        return;
      }

      setPlans(
        asArray(
          response?.data ?? response
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const rows = useMemo(
    () =>
      plans.map((plan) => ({
        id:
          plan?._id ||
          plan?.id,
        name:
          plan?.name ||
          "—",
        serviceType:
          mapBusServiceType(
            plan?.serviceType
          ),
        fee:
          formatMoney(
            Number(
              plan?.fee || 0
            )
          ),
        feeRaw:
          Number(
            plan?.fee || 0
          ),
        installmentPlan:
          getInstallmentPlanLabel(
            plan?.installmentPlanId
          ),
        enrolledCount:
          plan?.enrolledCount ===
            undefined ||
          plan?.enrolledCount ===
            null
            ? "—"
            : Number(
                plan?.enrolledCount ||
                  0
              ),
        isActive:
          plan?.isActive !== false,
        status:
          plan?.isActive === false
            ? "غير نشطة"
            : "نشطة",
      })),
    [plans]
  );

  const totalFees = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum + row.feeRaw,
        0
      ),
    [rows]
  );

  const activeCount =
    rows.filter(
      (row) =>
        row.isActive
    ).length;

  const installmentCount =
    plans.filter(
      (plan) =>
        Boolean(
          plan?.installmentPlanId
        )
    ).length;

  const handleDeactivate =
    async (
      id,
      setActiveDelete
    ) => {
      const response =
        await deactivateBusPlan(
          id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "تعذر إيقاف خطة الباص"
          )
        );
        return;
      }

      toast.success(
        response?.message ||
          "تم إيقاف خطة الباص بنجاح"
      );

      setActiveDelete(false);

      setPlans(
        (previous) =>
          previous.filter(
            (plan) =>
              (plan?._id ||
                plan?.id) !== id
          )
      );
    };

  const addAction =
    settingsPermissions?.add ? (
      <Button
        type="button"
        onClick={() =>
          navigate(
            "/financial/bus-plans/add"
          )
        }
        variant="contained"
        startIcon={
          <AddCircleOutlineRounded />
        }
        sx={{
          minHeight: 42,
          px: 2,
          borderRadius:
            "12px",
          background:
            "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
          fontWeight: 800,
          textTransform:
            "none",
        }}
      >
        إضافة خطة باص
      </Button>
    ) : null;

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <FinancialHeader
          title="خطط الباص"
          description="أنشئ خطط الباص وحدّد نوع الخدمة والسعر وخطة التقسيط لكل خطة."
          count={
            rows.length
          }
          actions={addAction}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي الخطط"
            value={
              rows.length
            }
            icon={
              <DirectionsBusRounded />
            }
          />

          <StatCard
            label="الخطط النشطة"
            value={
              activeCount
            }
            icon={
              <CheckCircleRounded />
            }
          />

          <StatCard
            label="خطط بالتقسيط"
            value={
              installmentCount
            }
            icon={
              <PaymentsRounded />
            }
          />

          <StatCard
            label="إجمالي أسعار الخطط"
            value={formatMoney(
              totalFees
            )}
            icon={
              <AltRouteRounded />
            }
          />
        </StatsGrid>

        <SectionCard
          title="قائمة خطط الباص"
          description="تعديل السعر أو خطة التقسيط يطبق على التسجيلات الجديدة فقط."
        >
          {!loading &&
          rows.length === 0 ? (
            <EmptyState
              icon={
                <DirectionsBusRounded />
              }
              title="لا توجد خطط باص حتى الآن"
              description="أنشئ أول خطة وحدّد اتجاه الخدمة ورسومها."
            />
          ) : (
            <Box
              sx={{
                p: {
                  xs: 0.7,
                  md: 1,
                },
              }}
            >
              <Table
                headers={
                  HEADERS
                }
                data={rows}
                body={BODY}
                loading={loading}
                edit={
                  settingsPermissions?.edit
                }
                deleteFn={
                  settingsPermissions?.delete
                    ? handleDeactivate
                    : undefined
                }
              />
            </Box>
          )}
        </SectionCard>
      </Box>
    </Container>
  );
};

export default BusPlansListPage;
