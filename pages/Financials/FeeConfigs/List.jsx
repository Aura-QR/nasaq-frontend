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
import { useFeeConfigOptions } from "@/utils/hooks/apis/financials/useFeeConfigOptions";
import { useFeeConfigs } from "@/utils/hooks/apis/financials/useFeeConfigs";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "السنة الدراسية",
  "الصف الدراسي",
  "الرسوم السنوية",
  "زيادة غير المحليين",
];

const BODY = [
  "academicYear",
  "gradeLevel",
  "tuitionFee",
  "expatriateSurchargePercentage",
];

const FeeConfigsListPage = () => {
  const {
    feeConfigs = [],
    loading,
    setFeeConfigs,
  } = useFeeConfigs();

  const {
    getAcademicYearLabel,
    getGradeLevelLabel,
  } = useFeeConfigOptions();

  // صلاحيات إعدادات الأسعار والخطط
  const permissions = usePermissions(
    "financialSettings"
  );

  const mappedFeeConfigs =
    feeConfigs.map((item) => ({
      id:
        item?._id ||
        item?.id,

      academicYear:
        getAcademicYearLabel(
          item?.academicYearId ??
            item?.academicYear
        ),

      gradeLevel:
        getGradeLevelLabel(
          item?.gradeLevelId ??
            item?.gradeLevel
        ),

      tuitionFee:
        formatMoney(
          item?.tuitionFee
        ),

      tuitionFeeRaw:
        Number(
          item?.tuitionFee || 0
        ),

      expatriateSurchargePercentage:
        `${Number(
          item?.expatriateSurchargePercentage ||
            0
        )}%`,
    }));

  const totalFees =
    mappedFeeConfigs.reduce(
      (sum, item) =>
        sum +
        item.tuitionFeeRaw,
      0
    );

  const averageFee =
    mappedFeeConfigs.length
      ? totalFees /
        mappedFeeConfigs.length
      : 0;

  const highestFee =
    mappedFeeConfigs.reduce(
      (max, item) =>
        Math.max(
          max,
          item.tuitionFeeRaw
        ),
      0
    );

  const handleDelete = async (
    id,
    setActive
  ) => {
    if (!permissions?.delete) {
      toast.error(
        "ليس لديك صلاحية حذف إعداد الرسوم"
      );
      return;
    }

    const response =
      await deleteFeeConfig(id);

    if (response?.status) {
      toast.success(
        response?.message ||
          "تم حذف إعداد الرسوم بنجاح"
      );

      setFeeConfigs(
        (previous) =>
          previous.filter(
            (item) =>
              (item?._id ||
                item?.id) !==
              id
          )
      );

      setActive?.(false);
      return;
    }

    toast.error(
      response?.message ||
        response ||
        "حدث خطأ أثناء حذف إعداد الرسوم"
    );
  };

  const addAction =
    permissions?.add ? (
      <Button
        component={Link}
        to="add"
        variant="contained"
        startIcon={
          <AddCircleOutlineRounded />
        }
        sx={{
          width: {
            xs: "100%",
            sm: 190,
          },
          minHeight: 42,
          borderRadius: "12px",
          color:
            "var(--color-white)",
          background:
            "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
          boxShadow:
            "0 9px 20px rgba(18,47,77,.16)",
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
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
          pb: 4,
        }}
      >
        <FinancialHeader
          title="إعدادات الرسوم الدراسية"
          description="حدّد الرسوم السنوية ونسبة زيادة غير المحليين لكل سنة وصف دراسي."
          count={
            feeConfigs.length
          }
          actions={addAction}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي الإعدادات"
            value={
              feeConfigs.length
            }
            icon={
              <SettingsRounded />
            }
          />

          <StatCard
            label="إجمالي الرسوم"
            value={formatMoney(
              totalFees
            )}
            icon={
              <AccountBalanceWalletRounded />
            }
          />

          <StatCard
            label="متوسط الرسوم"
            value={formatMoney(
              averageFee
            )}
            icon={
              <PriceCheckRounded />
            }
          />

          <StatCard
            label="أعلى رسوم سنوية"
            value={formatMoney(
              highestFee
            )}
            icon={
              <CalendarMonthRounded />
            }
          />
        </StatsGrid>

        <SectionCard
          title="قائمة إعدادات الرسوم"
          description="كل إعداد مرتبط بسنة دراسية وصف محدد، مع نسبة زيادة الطلاب غير المحليين."
        >
          {!loading &&
          mappedFeeConfigs.length ===
            0 ? (
            <EmptyState
              icon={
                <AccountBalanceWalletRounded />
              }
              title="لا توجد إعدادات رسوم حتى الآن"
              description="أضف إعداد رسوم للسنة والصف قبل إلحاق الطلاب بالفصول."
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
                headers={HEADERS}
                data={
                  mappedFeeConfigs
                }
                loading={loading}
                edit={
                  permissions?.edit
                }
                body={BODY}
                deleteFn={
                  permissions?.delete
                    ? handleDelete
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

export default FeeConfigsListPage;