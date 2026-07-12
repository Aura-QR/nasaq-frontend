import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Button, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteExpense } from "@/APIs/expenses";
import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Table from "@/components/Table/Table";
import Years from "@/utils/constants/Years";
import { useExpenses } from "@/utils/hooks/apis/expenses/useExpenses";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

const ExpensesListPage = () => {
  const headers = ["اسم المصروف", "التصنيف", "المبلغ", "التاريخ", "السنة الدراسية", "ملاحظات"];
  const body = ["name", "categoryName", "amount", "date", "academicYear", "notes"];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const debouncedName = useDebounce(name, 500);

  const permissions = usePermissions("financial");
  const { categories } = useExpenseCategories();

  const filters = useMemo(
    () => ({
      name: debouncedName.trim() || undefined,
      categoryId: categoryId || undefined,
      academicYear: academicYear || undefined,
      page,
      limit,
    }),
    [debouncedName, categoryId, academicYear, page, limit],
  );

  const { expenses, loading, pagination, setExpenses } = useExpenses(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedName, categoryId, academicYear, limit]);

  const mappedExpenses = (expenses || []).map((item) => ({
    id: item._id,
    name: item.name,
    categoryName: item.categoryId?.name || "—",
    amount: `${item.amount} ريال`,
    date: item.date ? new Date(item.date).toLocaleDateString("ar-EG") : "—",
    academicYear: item.academicYear || "—",
    notes: item.notes || "—",
  }));

  const handleDelete = async (id, setActive) => {
    const response = await deleteExpense(id);
    if (response.status) {
      toast.success("تم حذف المصروف بنجاح");
      setExpenses((prev) => prev.filter((item) => item._id !== id));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف المصروف");
    }
  };

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={3}>
          <SearchFilter
            value={name}
            onChange={setName}
            placeholder="ابحث باسم المصروف"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={categoryId}
            onChange={setCategoryId}
            label="التصنيف"
            allLabel="كل التصنيفات"
            options={(categories || []).map((c) => ({ value: c._id, label: c.name }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            allLabel="كل السنوات"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Stack direction={"row"} spacing={4} justifyContent={{ md: "flex-end" }}>
            {permissions?.add && (
              <Link to={"add"}>
                <Button
                  startIcon={<AddCircleOutlineOutlined />}
                  variant="contained"
                  sx={{ p: "16px 40px", borderRadius: "8px" }}
                >
                  إضافة مصروف
                </Button>
              </Link>
            )}
          </Stack>
        </Grid>
      </Grid>

      {!loading && mappedExpenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد مصروفات لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedExpenses}
          loading={loading}
          edit={permissions?.edit}
          body={body}
          deleteFn={permissions?.delete ? handleDelete : undefined}
        />
      )}

      {pagination && (
        <PaginationControls
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد المصروفات"
        />
      )}
    </Container>
  );
};

export default ExpensesListPage;
