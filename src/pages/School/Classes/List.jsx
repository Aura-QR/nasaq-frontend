import { Button, Grid, IconButton, Stack } from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined, School } from "@mui/icons-material";
import { deleteClass } from "@/APIs/school/classes";
import { translateGender } from "@/utils/helpers/translateGender";
import MaleIcon from '@mui/icons-material/Male';
import SortIcon from '@mui/icons-material/Sort';
import Status from "@/utils/constants/Status";
import Years from "@/utils/constants/Years";
import Gender from "@/utils/constants/Gender";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import { useClasses } from "@/utils/hooks/apis/useClasses";
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const headers = [
    "اسم الفصل",
    "الرقم",
    "النوع",
    "الاماكن الفارغة",
    "الحالة",
  ];
  const body = [
    "academicYear",
    "roomNumber",
    "gender",
    "availableSeats",
    "isActive",
  ];
  
  const [items, setItems] = useState([]);

  // Filter states
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);
  // Build filters object
  const filters = {
    page,
    limit,
    gender: gender || undefined,
    isActive: status !== "" ? Boolean(Number(status)) : undefined,
    academicYear: academicYear || undefined,
  };

  // Call the useClasses custom hook to fetch classes data
  const { classes, loading, pagination } = useClasses(filters);

  // Mapped items function
  const mappedItems = (classesData) => {
    return classesData.map((item) => ({
      id: item._id,
      academicYear: item.academicYear,
      roomNumber: item.roomNumber,
      gender: translateGender(item.gender, "class"),
      teacherInCharge: item.teacherInCharge?.name,
      maxCapacity: item.maxCapacity,
      studentsCount: item.students.length,
      availableSeats: item.maxCapacity - item.students?.length,
      isActive: item.isActive ? "نشط" : "غير نشط",
    }));
  };

  // Update items when classes data changes
  useEffect(() => {
    if (classes) {
      setItems(mappedItems(classes));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [classes, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, gender, status, academicYear]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteClass(id);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      setLocalPagination((prevPagination) => ({
        ...prevPagination,
        totalDocs: prevPagination.totalDocs - 1,
      }));
      setActive(false);
    } else {
      toast.error("حدث خطأ ما اثناء حذف الفصل");
    }
  };

  const permissions = usePermissions("classes");

  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={School}
            allLabel="جميع السنين"
            options={Years.map(year => ({ value: year, label: year }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={gender}
            onChange={setGender}
            label="نوع الفصل"
            icon={MaleIcon}
            allLabel="الكل"
            options={Gender.map(item => ({ value: item.id, label: item.label }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SelectFilter
            value={status}
            onChange={setStatus}
            label="حالة الفصل"
            icon={SortIcon}
            allLabel="جميع الفصول"
            options={Status.map(item => ({ value: item.id.toString(), label: item.label }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to={"add"}>
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px" }}
              >
                إضافة فصل جديد
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
        body={body}
        deleteFn={permissions.delete ? handleDelete : undefined}
        profile={true}
        schedule={permissions.edit}
      />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد الفصول"
        />
      )}
    </Container>
  );
};

export default List;