import {
  Box,
  Button,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  GroupsRounded,
  PaymentsRounded,
  PostAddRounded,
  PriceChangeRounded,
} from "@mui/icons-material";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";

import {
  EmptyState,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";

import { deleteAdditionalFee } from "@/APIs/financials/additionalFees";
import { useAdditionalFees } from "@/utils/hooks/apis/financials/useAdditionalFees";
import usePermissions from "@/utils/hooks/usePermissions";
import { formatMoney } from "@/utils/financial/financialUtils";

const TABLE_HEADERS = [
  "اسم الرسم",
  "المبلغ",
  "تطبيق على",
  "الوصف",
];

const TABLE_BODY = [
  "name",
  "amount",
  "target",
  "description",
];

const TARGET_LABELS = {
  school: "كل الطلاب",
  all: "كل الطلاب", // توافق مع البيانات القديمة إن وجدت
  student: "طالب محدد",
  class: "فصل محدد",
  academicYear: "سنة دراسية",
};

const getTargetLabel = (item) => {
  const typeLabel =
    TARGET_LABELS[item?.targetType] ||
    "غير محدد";

  if (
    item?.targetType ===
    "academicYear"
  ) {
    return item?.targetAcademicYear
      ? `${typeLabel}: ${item.targetAcademicYear}`
      : typeLabel;
  }

  const target =
    item?.targetId;

  if (
    target &&
    typeof target === "object"
  ) {
    const targetName =
      target?.name ||
      [
        target?.firstName,
        target?.fatherName,
        target?.familyName,
      ]
        .filter(Boolean)
        .join(" ") ||
      target?.roomNumber ||
      target?.email;

    if (targetName) {
      return `${typeLabel}: ${targetName}`;
    }
  }

  return typeLabel;
};

const AdditionalFeesListPage = () => {
  const {
    additionalFees = [],
    loading,
    error,
    setAdditionalFees,
  } = useAdditionalFees();

  const permissions =
    usePermissions("financial");

  const rows = additionalFees.map(
    (item) => ({
      id: item?._id || item?.id,
      name: item?.name || "—",
      amount: formatMoney(
        Number(item?.amount || 0)
      ),
      target: getTargetLabel(item),
      description:
        item?.description || "—",
    })
  );

  const totalAmount =
    additionalFees.reduce(
      (sum, item) =>
        sum +
        Number(item?.amount || 0),
      0
    );

  const allStudentsCount =
    additionalFees.filter(
      (item) =>
        ["school", "all"].includes(
          item?.targetType
        )
    ).length;

  const targetedCount =
    additionalFees.length -
    allStudentsCount;

  const handleDelete = async (
    id,
    setOpen
  ) => {
    if (!permissions?.delete) {
      toast.error(
        "ليس لديك صلاحية حذف الرسوم الإضافية"
      );
      return;
    }

    const response =
      await deleteAdditionalFee(id);

    if (response?.status) {
      toast.success(
        response?.message ||
          "تم حذف الرسم الإضافي بنجاح"
      );

      setAdditionalFees(
        (previous) =>
          previous.filter(
            (item) =>
              (item?._id ||
                item?.id) !== id
          )
      );

      setOpen?.(false);
      return;
    }

    toast.error(
      response?.message ||
        response ||
        "حدث خطأ أثناء حذف الرسم الإضافي"
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
          minHeight: 42,
          borderRadius: "12px",
          background:
            "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
          fontWeight: 800,
          textTransform: "none",
        }}
      >
        إضافة رسوم
      </Button>
    ) : null;

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <FinancialHeader
          title="الرسوم الإضافية"
          description="أنشئ الرسوم الإضافية وحدد الطلاب المستهدفين بها."
          count={additionalFees.length}
          actions={addAction}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي الرسوم"
            value={
              additionalFees.length
            }
            icon={
              <PostAddRounded />
            }
          />

          <StatCard
            label="إجمالي القيم"
            value={formatMoney(
              totalAmount
            )}
            icon={
              <PaymentsRounded />
            }
          />

          <StatCard
            label="على كل الطلاب"
            value={
              allStudentsCount
            }
            icon={
              <GroupsRounded />
            }
          />

          <StatCard
            label="رسوم موجهة"
            value={
              targetedCount
            }
            icon={
              <PriceChangeRounded />
            }
          />
        </StatsGrid>

        <SectionCard
          title="قائمة الرسوم الإضافية"
          description="تُنشأ الرسوم هنا ثم يوزعها النظام على الطلاب المستهدفين."
        >
          {!loading &&
          rows.length === 0 ? (
            <EmptyState
              icon={
                <PostAddRounded />
              }
              title={
                error ||
                "لا توجد رسوم إضافية حتى الآن"
              }
              description="أضف أول رسم وحدد هل يطبق على كل الطلاب أو طالب أو فصل أو سنة دراسية."
            />
          ) : (
            <Box sx={{ p: 1 }}>
              <Table
                headers={
                  TABLE_HEADERS
                }
                data={rows}
                loading={loading}
                body={TABLE_BODY}
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

export default AdditionalFeesListPage;
