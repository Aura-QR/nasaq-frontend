import {
  AddCircleOutlineRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  EventRepeatRounded,
  StarRounded,
} from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteInstallmentPlan } from "@/APIs/financials/installmentPlans";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import {
  EmptyState,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "اسم الخطة",
  "عدد الأقساط",
  "افتراضية",
  "الحالة",
];

const BODY = [
  "name",
  "numberOfInstallments",
  "isDefault",
  "isActive",
];

const InstallmentPlansListPage =
  () => {
    const {
      installmentPlans = [],
      loading,
      setInstallmentPlans,
    } = useInstallmentPlans();

    // صلاحيات إعدادات الأسعار والخطط
    const permissions =
      usePermissions(
        "financialSettings"
      );

    const mappedPlans =
      installmentPlans.map(
        (item) => ({
          id:
            item?._id ||
            item?.id,

          name:
            item?.name || "—",

          numberOfInstallments:
            `${Number(
              item?.numberOfInstallments ||
                0
            )} قسط`,

          isDefault:
            item?.isDefault
              ? "نعم"
              : "لا",

          isActive:
            item?.isActive
              ? "نشطة"
              : "غير نشطة",
        })
      );

    const activeCount =
      installmentPlans.filter(
        (item) =>
          item?.isActive
      ).length;

    const defaultPlan =
      installmentPlans.find(
        (item) =>
          item?.isDefault
      );

    const totalInstallments =
      installmentPlans.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.numberOfInstallments ||
              0
          ),
        0
      );

    const handleDelete =
      async (
        id,
        setActive
      ) => {
        if (
          !permissions?.delete
        ) {
          toast.error(
            "ليس لديك صلاحية حذف خطة التقسيط"
          );
          return;
        }

        const response =
          await deleteInstallmentPlan(
            id
          );

        if (
          response?.status
        ) {
          toast.success(
            response?.message ||
              "تم حذف خطة التقسيط بنجاح"
          );

          setInstallmentPlans(
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
            "حدث خطأ أثناء حذف خطة التقسيط"
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
              sm: 185,
            },
            minHeight: 42,
            borderRadius:
              "12px",
            background:
              "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
            boxShadow:
              "0 9px 20px rgba(18,47,77,.16)",
            fontSize: 12,
            fontWeight: 800,
            textTransform:
              "none",
          }}
        >
          إضافة خطة تقسيط
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
            title="خطط التقسيط"
            description="أنشئ خطط الأقساط وحدّد مواعيد الاستحقاق والخطة الافتراضية."
            count={
              installmentPlans.length
            }
            actions={
              addAction
            }
          />

          <StatsGrid>
            <StatCard
              label="إجمالي الخطط"
              value={
                installmentPlans.length
              }
              icon={
                <EventRepeatRounded />
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
              label="الخطة الافتراضية"
              value={
                defaultPlan?.name ||
                "لا توجد"
              }
              icon={
                <StarRounded />
              }
            />

            <StatCard
              label="إجمالي الأقساط"
              value={
                totalInstallments
              }
              icon={
                <CalendarMonthRounded />
              }
            />
          </StatsGrid>

          <SectionCard
            title="قائمة خطط التقسيط"
            description="افتح الخطة لتعديل مواعيد الاستحقاق أو تعيينها افتراضية."
          >
            {!loading &&
            mappedPlans.length ===
              0 ? (
              <EmptyState
                icon={
                  <EventRepeatRounded />
                }
                title="لا توجد خطط تقسيط حتى الآن"
                description="أضف أول خطة لتوزيع الرسوم على مواعيد استحقاق محددة."
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
                  data={
                    mappedPlans
                  }
                  loading={
                    loading
                  }
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

export default InstallmentPlansListPage;