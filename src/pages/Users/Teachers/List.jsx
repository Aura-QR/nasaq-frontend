import { Button, Grid, IconButton, Stack} from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined, Sort } from "@mui/icons-material";
import { deleteTeacher } from "@/APIs/users/teachers";
import useDebounce from "@/utils/hooks/useDebounce";
import Status from "@/utils/constants/Status";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import { useTeachers } from "@/utils/hooks/apis/useTeachers"; 
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const headers = [
    "اسم المعلم",
    "رقم الهاتف",
    "البريد الالكتروني",
    "المواد الدراسية",
    "الحالة",
  ];
  const body = ["name", "phone", "email", "subjects", "status"];

  const [items, setItems] = useState([]);

  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [localPagination, setLocalPagination] = useState(null);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 1000);

  // Build filters object
  const filters = {
    page,
    limit,
    name: debouncedSearch || undefined,
    isActive: status !== "" ? Boolean(Number(status)) : undefined,
  };

  // Use the useTeachers hook to fetch teachers data
  const { teachers, loading, pagination } = useTeachers(filters);

  // Mapped items
  const mappedTeachers = (data) => {
    return data.map((item) => ({
      id: item._id,
      name: item.name,
      email: item.email,
      phone: item.phoneNumber,
      status: item.isActive ? "نشط" : "غير نشط",
      subjects: item?.subject?.map((sub) => sub.subjectName).join(" - ") || "لا يوجد"
    }));
  };

  // Update items when teachers data changes
  useEffect(() => {
    if (teachers) {
      setItems(mappedTeachers(teachers));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [teachers, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearch, status]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteTeacher(id);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      setLocalPagination((prevPagination) => ({
        ...prevPagination,
        totalDocs: prevPagination.totalDocs - 1,
      }));
      setActive(false);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
  };

  //permissions
  const permissions = usePermissions("teachers");

  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 15 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={3}>
          <SearchFilter 
            value={search} 
            onChange={setSearch} 
            placeholder="اسم المعلم..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={status}
            onChange={setStatus}
            label="حالة المعلم"
            icon={Sort}
            allLabel="جميع المعلمين"
            options={Status.map(item => ({ value: item.id.toString(), label: item.label }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} marginLeft={"auto"}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to={"add"}>
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px"}}
              >
                إضافة معلم جديد
              </Button>
            </Link>}
            <CSVLink data={items.length > 0 ? items : []}>
              <IconButton color="primary">
                <SaveAltIcon />
              </IconButton>
            </CSVLink>
          </Stack>
        </Grid>
      </Grid>
      {/* Table */}
      <Table 
        headers={headers} 
        data={items} 
        loading={loading} 
        edit={permissions.edit} 
        profile={true} 
        body={body} 
        deleteFn={permissions.delete ? handleDelete : undefined} 
        schedule={true}
      />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد المعلمين"
        />
      )}
    </Container>
  );
};

export default List;