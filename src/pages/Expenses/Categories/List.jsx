import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { Button, Grid, Stack } from "@mui/material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteExpenseCategory } from "@/APIs/expenses";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useExpenseCategories } from "@/utils/hooks/apis/expenses/useExpenseCategories";
import usePermissions from "@/utils/hooks/usePermissions";

const ExpenseCategoriesListPage = () => {
  const headers = ["اسم التصنيف", "الوصف"];
  const body = ["name", "description"];

  const { categories, loading, setCategories } = useExpenseCategories();
  const permissions = usePermissions("financial");

  const mappedCategories = (categories || []).map((item) => ({
    id: item._id,
    name: item.name,
    description: item.description || "—",
  }));

  const handleDelete = async (id, setActive) => {
    const response = await deleteExpenseCategory(id);
    if (response.status) {
      toast.success("تم حذف التصنيف بنجاح");
      setCategories((prev) => prev.filter((item) => item._id !== id));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما أثناء حذف التصنيف");
    }
  };

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12}>
          <Stack direction={"row"} spacing={8} alignItems={"center"}>
            {permissions?.add && (
              <Link to={"add"}>
                <Button
                  startIcon={<AddCircleOutlineOutlined />}
                  variant="contained"
                  sx={{ p: "16px 40px", borderRadius: "8px" }}
                >
                  إضافة تصنيف
                </Button>
              </Link>
            )}
          </Stack>
        </Grid>
      </Grid>

      {!loading && mappedCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد تصنيفات لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedCategories}
          loading={loading}
          edit={permissions?.edit}
          body={body}
          deleteFn={permissions?.delete ? handleDelete : undefined}
        />
      )}
    </Container>
  );
};

export default ExpenseCategoriesListPage;
