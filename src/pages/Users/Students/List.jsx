import { Button, Grid, IconButton, Stack} from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined, Sort} from "@mui/icons-material";
import SchoolIcon from '@mui/icons-material/School';
import { deleteStudent } from "@/APIs/users/students";
import { format } from "date-fns";
import useDebounce from "@/utils/hooks/useDebounce";
import Status from "@/utils/constants/Status";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import PaginationControls from "@/components/Pagination";
import { useStudents } from "@/utils/hooks/apis/useStudents";
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const headers = [
    "اسم الطالب",
    "تاريخ الميلاد",
    "السنة الدراسية",
    "الفصل",
    "رقم الهاتف",
    "الحالة",
  ];
  const body = [
    "name",
    "birthdate",
    "academicYear",
    "roomNumber",
    "phone",
    "status",
  ];

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // Filter states
  const [studentClass, setStudentClass] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [limit, setLimit] = useState(10);
  
  // Debounce search input
  const debouncedSearch = useDebounce(search, 1000);
  
  // Build filters object
  const filters = useMemo(() => ({
    page,
    limit,
    name: debouncedSearch || undefined,
    isActive: status !== "" ? Boolean(Number(status)) : undefined,
    academicYear: academicYear || undefined,
    classId: studentClass || undefined,
  }), [page, limit, debouncedSearch, status, academicYear, studentClass]);

  // Use the useStudents custom hook to fetch students
  const { students, loading, pagination , setPagination } = useStudents(filters);

  // Mapped items
  const mapppedStudents = (data) => {
    return data.map((item) => ({
      id: item._id,
      birthdate: format(new Date(item.birthDate), "dd/MM/yyyy"),
      name: item.firstName + " " + item.fatherName + " " + item.familyName,
      academicYear: item.academicYear,
      phone: item.phoneNumber,
      status: item.isActive ? "نشط" : "غير نشط",
      roomNumber: item?.class
        ? `${item?.class?.roomNumber} - ${translateGender(item?.class?.gender, "class")}`
        : "لا يوجد",
    }));
  };

  // Update items when students data changes
  useEffect(() => {
    if (students) {
      setItems(mapppedStudents(students));
    }
  }, [students]);

  // Reset class filter when academic year changes
  useEffect(() => {
    setStudentClass("");
  }, [academicYear]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearch, status, academicYear, studentClass]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteStudent(id);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      setPagination((prevPagination) => ({
        ...prevPagination,
        totalDocs: prevPagination.totalDocs - 1,
      }));
      setActive(false);
    } else {
      toast.error(response);
    }
  };

  // Permissions
  const permissions = usePermissions("students");

  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"} >
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="اسم الطالب..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SelectFilter
            value={status}
            onChange={setStatus}
            label="حالة الطالب"
            icon={Sort}
            allLabel="جميع الطلاب"
            options={Status.map((item) => ({
              value: item.id.toString(),
              label: item.label,
            }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={SchoolIcon}
            allLabel="جميع السنين"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <ClassFilter
            classId={studentClass}
            setClassId={setStudentClass}
            academicYear={academicYear}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to={"add"} style={{ flex: 1 }}>
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px", width: "100%" }}
              >
                إضافة طالب جديد
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
      <Table headers={headers} data={items} loading={loading} edit={permissions.edit} profile={true} body={body} deleteFn={permissions.delete ? handleDelete : undefined} />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد الطلاب"
        />
      )}
    </Container>
  );
};

export default List;