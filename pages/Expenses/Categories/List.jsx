import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  CategoryRounded,
  DescriptionRounded,
  NotesRounded,
} from "@mui/icons-material";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteExpenseCategory } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";

import FinancialPageHeader from "@/components/financial/FinancialPageHeader";
import FinancialStatCard from "@/components/financial/FinancialStatCard";
import FinancialEmptyState from "@/components/financial/FinancialEmptyState";

import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = ["اسم التصنيف", "الوصف"];
const BODY = ["name", "description"];

const ExpenseCategoriesListPage = () => {
  const {
    categories = [],
    loading,
    setCategories,
  } = useExpenseCategories();

  const permissions = usePermissions("expenses");

  const mappedCategories = categories.map((item) => ({
    id: item?._id || item?.id,
    name: item?.name || "—",
    description: item?.description || "—",
  }));

  const withDescription = categories.filter(
    (item) => Boolean(item?.description?.trim())
  ).length;

  const withoutDescription = categories.length - withDescription;

  const handleDelete = async (id, setActive) => {
    const response = await deleteExpenseCategory(id);

    if (response?.status) {
      toast.success("تم حذف التصنيف بنجاح");
      setCategories((previous) =>
        previous.filter((item) => (item?._id || item?.id) !== id)
      );
      setActive(false);
    } else {
      toast.error(
        response?.message ||
          response ||
          "حدث خطأ ما أثناء حذف التصنيف"
      );
    }
  };

  const addAction = permissions?.add ? (
    <Button
      component={Link}
      to="add"
      variant="contained"
      startIcon={<AddCircleOutlineRounded />}
      sx={{
        width: { xs: "100%", sm: 170 },
        minHeight: 42,
        borderRadius: "12px",
        color: "var(--color-white)",
        background:
          "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
        boxShadow: "0 9px 20px rgba(18,47,77,0.16)",
        fontSize: "12px",
        fontWeight: 800,
        textTransform: "none",
      }}
    >
      إضافة تصنيف
    </Button>
  ) : null;

  return (
    <Container>
      <Box dir="rtl" sx={{ width: "100%", minWidth: 0, pb: 4 }}>
        <FinancialPageHeader
          title="تصنيفات المصروفات"
          description="أنشئ تصنيفات واضحة لتنظيم المصروفات داخل المدرسة."
          count={categories.length}
          actions={addAction}
        />

        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0,1fr))",
              md: "repeat(3, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <FinancialStatCard
            label="إجمالي التصنيفات"
            value={categories.length}
            icon={<CategoryRounded />}
          />
          <FinancialStatCard
            label="تصنيفات لها وصف"
            value={withDescription}
            icon={<DescriptionRounded />}
          />
          <FinancialStatCard
            label="تصنيفات بدون وصف"
            value={withoutDescription}
            icon={<NotesRounded />}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 14px 32px rgba(18,47,77,0.065)",
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 1.9 },
              py: 1.25,
              borderBottom: "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              قائمة التصنيفات
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              عدّل التصنيف أو احذفه حسب صلاحياتك.
            </Typography>
          </Box>

          {!loading && mappedCategories.length === 0 ? (
            <FinancialEmptyState
              icon={<CategoryRounded />}
              title="لا توجد تصنيفات حتى الآن"
              description="أضف أول تصنيف لاستخدامه عند تسجيل المصروفات."
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mappedCategories}
                loading={loading}
                edit={permissions?.edit}
                body={BODY}
                deleteFn={permissions?.delete ? handleDelete : undefined}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ExpenseCategoriesListPage;
