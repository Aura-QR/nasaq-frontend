import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  CategoryRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  RestartAltRounded,
  SchoolRounded,
  SearchOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteExpense } from "@/APIs/expenses";

import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Table from "@/components/Table/Table";

import FinancialPageHeader from "@/components/financial/FinancialPageHeader";
import FinancialStatCard from "@/components/financial/FinancialStatCard";
import FinancialEmptyState from "@/components/financial/FinancialEmptyState";

import Years from "@/utils/constants/Years";
import { useExpenses } from "@/utils/hooks/apis/expenses/useExpenses";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";
import {
  formatDate,
  formatMoney,
} from "@/utils/financial/financialUtils";

const HEADERS = [
  "اسم المصروف",
  "التصنيف",
  "المبلغ",
  "التاريخ",
  "السنة الدراسية",
  "ملاحظات",
];

const BODY = [
  "name",
  "categoryName",
  "amount",
  "date",
  "academicYear",
  "notes",
];



const getCategoryItems = (value, depth = 0) => {
  if (!value || depth > 5) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "object") {
    return [];
  }

  for (const key of [
    "docs",
    "items",
    "results",
    "categories",
    "data",
  ]) {
    const items = getCategoryItems(
      value?.[key],
      depth + 1
    );

    if (items.length > 0) {
      return items;
    }
  }

  return [];
};

const normalizeCategoryOptions = (value) =>
  getCategoryItems(value)
    .map((item) => {
      const id =
        item?._id ||
        item?.id ||
        item?.value ||
        "";

      const label =
        item?.name ||
        item?.label ||
        item?.title ||
        "";

      if (!id || !label) {
        return null;
      }

      return {
        ...item,
        _id: String(id),
        id: String(id),
        value: String(id),
        name: String(label),
        label: String(label),
      };
    })
    .filter(Boolean);

const ExpensesListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [localPagination, setLocalPagination] = useState(null);

  const debouncedName = useDebounce(name, 500);
  const permissions = usePermissions("expenses");
  const { categories = [] } = useExpenseCategories();

  const categoryOptions = useMemo(
    () => normalizeCategoryOptions(categories),
    [categories]
  );

  const filters = useMemo(
    () => ({
      name: debouncedName.trim() || undefined,
      categoryId: categoryId || undefined,
      academicYear: academicYear || undefined,
      page,
      limit,
    }),
    [debouncedName, categoryId, academicYear, page, limit]
  );

  const {
    expenses = [],
    loading,
    pagination,
    setExpenses,
  } = useExpenses(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedName, categoryId, academicYear, limit]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(pagination);
    }
  }, [pagination]);

  const mappedExpenses = useMemo(
    () =>
      expenses.map((item) => ({
        id: item?._id || item?.id,
        name: item?.name || "—",
        categoryName: item?.categoryId?.name || "—",
        amount: formatMoney(item?.amount),
        amountRaw: Number(item?.amount || 0),
        date: formatDate(item?.date),
        academicYear: item?.academicYear || "—",
        notes: item?.notes || "—",
      })),
    [expenses]
  );

  const currentPagination = localPagination || pagination;

  const stats = useMemo(
    () => ({
      total: currentPagination?.totalDocs ?? mappedExpenses.length,
      visible: mappedExpenses.length,
      totalAmount: mappedExpenses.reduce(
        (sum, item) => sum + item.amountRaw,
        0
      ),
      categoriesCount: new Set(
        expenses
          .map((item) => item?.categoryId?._id || item?.categoryId?.id)
          .filter(Boolean)
      ).size,
    }),
    [mappedExpenses, expenses, currentPagination]
  );

  const activeFiltersCount = [name, categoryId, academicYear].filter(Boolean).length;

  const resetFilters = () => {
    setName("");
    setCategoryId("");
    setAcademicYear("");
    setPage(1);
  };

  const handleDelete = async (id, setActive) => {
    if (!permissions?.delete) {
      toast.error(
        "ليس لديك صلاحية حذف المصروفات"
      );
      return;
    }

    const response = await deleteExpense(id);

    if (response?.status) {
      toast.success("تم حذف المصروف بنجاح");
      setExpenses((previous) =>
        previous.filter((item) => (item?._id || item?.id) !== id)
      );
      setLocalPagination((previous) =>
        previous
          ? {
              ...previous,
              totalDocs: Math.max(Number(previous.totalDocs || 1) - 1, 0),
            }
          : previous
      );
      setActive(false);
    } else {
      toast.error(
        response?.message ||
          response ||
          "حدث خطأ ما أثناء حذف المصروف"
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
        width: { xs: "100%", sm: 165 },
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
      إضافة مصروف
    </Button>
  ) : null;

  const showEmptyState = !loading && mappedExpenses.length === 0;

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 4,
          overflowX: "hidden",
        }}
      >
        <FinancialPageHeader
          title="إدارة المصروفات"
          description="سجّل مصروفات المدرسة وتابع تصنيفاتها وقيمتها والسنة الدراسية."
          count={currentPagination?.totalDocs ?? mappedExpenses.length}
          actions={addAction}
        />

        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0,1fr))",
              lg: "repeat(4, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <FinancialStatCard
            label="إجمالي المصروفات"
            value={stats.total}
            icon={<ReceiptLongRounded />}
          />
          <FinancialStatCard
            label="الظاهر في الصفحة"
            value={stats.visible}
            icon={<VisibilityRounded />}
          />
          <FinancialStatCard
            label="إجمالي مبالغ الصفحة"
            value={formatMoney(stats.totalAmount)}
            icon={<PaymentsRounded />}
          />
          <FinancialStatCard
            label="التصنيفات في الصفحة"
            value={stats.categoriesCount}
            icon={<CategoryRounded />}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 1.9 },
            py: 1.45,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 9px 22px rgba(18,47,77,0.05)",
            "& .MuiFormControl-root": {
              width: "100%",
              minWidth: 0,
              margin: 0,
            },
            "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
              minHeight: 50,
              height: 50,
              backgroundColor: "var(--color-white)",
              borderRadius: "12px",
            },
            "& .MuiInputLabel-root": {
              px: 0.65,
              backgroundColor: "var(--color-cream)",
              fontSize: "10.5px",
              fontWeight: 700,
            },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.35 }}
          >
            <Box>
              <Typography
                sx={{
                  color: "var(--color-navy-deep)",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                البحث والتصفية
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  color: "var(--color-muted)",
                  fontSize: "9.5px",
                }}
              >
                ابحث بالاسم أو حدّد التصنيف والسنة الدراسية.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={activeFiltersCount === 0}
              onClick={resetFilters}
              variant="text"
              startIcon={<RestartAltRounded />}
              sx={{
                minHeight: 36,
                px: 1.2,
                color: "var(--color-navy)",
                backgroundColor: "rgba(36,74,112,0.055)",
                border: "1px solid rgba(36,74,112,0.075)",
                borderRadius: "11px",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0,1fr))",
                lg: "1.2fr 1fr 1fr",
              },
              gap: 1.5,
              minWidth: 0,
              "& > *": { minWidth: 0 },
            }}
          >
            <SearchFilter
              value={name}
              onChange={setName}
              placeholder="ابحث باسم المصروف..."
            />

            <SelectFilter
              value={categoryId}
              onChange={setCategoryId}
              label="التصنيف"
              icon={CategoryRounded}
              allLabel="كل التصنيفات"
              options={categoryOptions.map((category) => ({
                value: category._id,
                label: category.name,
              }))}
            />

            <SelectFilter
              value={academicYear}
              onChange={setAcademicYear}
              label="السنة الدراسية"
              icon={SchoolRounded}
              allLabel="كل السنوات"
              options={Years.map((year) => ({ value: year, label: year }))}
            />
          </Box>
        </Paper>

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
              سجل المصروفات
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              عدّل المصروف أو احذفه حسب صلاحياتك.
            </Typography>
          </Box>

          {showEmptyState ? (
            <FinancialEmptyState
              icon={activeFiltersCount ? <SearchOffRounded /> : <ReceiptLongRounded />}
              title={
                activeFiltersCount
                  ? "لا توجد مصروفات مطابقة للفلاتر"
                  : "لا توجد مصروفات حتى الآن"
              }
              description={
                activeFiltersCount
                  ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                  : "أضف أول مصروف ليظهر في سجل المصروفات."
              }
              actionLabel={activeFiltersCount ? "مسح الفلاتر" : undefined}
              actionIcon={activeFiltersCount ? <RestartAltRounded /> : undefined}
              onAction={activeFiltersCount ? resetFilters : undefined}
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mappedExpenses}
                loading={loading}
                edit={permissions?.edit}
                body={BODY}
                deleteFn={permissions?.delete ? handleDelete : undefined}
              />

              {currentPagination && mappedExpenses.length > 0 && (
                <PaginationControls
                  pagination={currentPagination}
                  page={page}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                  label="عدد المصروفات"
                />
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ExpensesListPage;
