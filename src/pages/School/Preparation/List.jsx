import { Button, Grid, IconButton, Stack } from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
// import { School,Subject } from "@mui/icons-material";
// import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import usePermissions from "@/utils/hooks/usePermissions";
import { usePreparations } from "@/utils/hooks/apis/usePreparations";
import { deletePreparation } from "@/APIs/school/preparation";
// import Weeks from "@/utils/constants/Weeks";
// import Semesters from "@/utils/constants/Semesters";
import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";
import { useAuthUser } from "react-auth-kit";
import useDebounce from "@/utils/hooks/useDebounce";
import SearchFilter from "@/components/Filters/SearchFilter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const List = () => {
  const headers = ["الفصل" , "المعلم" , "المادة" , "اليوم" , "الحصة" , "تاريخ الإنشاء"];
  const body = ["name", "teacher" , "subjectName" , "dayOfWeek" , "slot", "createdAt"];

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // Filter states
  const [teacher, setTeacher] = useState("");
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null); // Add this state

  // Debounce search input
  const debouncedSearch = useDebounce(teacher, 1000);

  // Build filters object
  const filters = useMemo(() => ({
      page,
      limit,
      name: debouncedSearch || undefined,
  }), [page, limit, debouncedSearch]);

  const { preparations, loading, pagination } = usePreparations(filters);

  console.log(preparations);

  // Mapped items
  const mappedPreparations = (data) => {
    return data.map((item) => ({
      ...item,
      id: item._id,
      teacher : item?.name,
      subjectName : item?.subject?.subjectName,
      dayOfWeek : Days.find((day) => item.lecture?.dayOfWeek === day.id)?.day,
      slot : Slots.find((slot) => item.lecture?.slot === slot?.id)?.name,
      name: `${item?.academicYear} - ${item?.roomNumber} - ${translateGender(item?.gender, "class")}`,
      createdAt: format(new Date(item.createdAt), "dd MMM, yyyy" , {locale: ar}),
    }));
  };

  // Update items when preparations data changes
  useEffect(() => {
    if (preparations) {
      setItems(mappedPreparations(preparations));
      if(pagination) {
        setLocalPagination(pagination); // Store pagination locally
      }
    }
  }, [preparations,pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearch]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deletePreparation(id);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      // Update local pagination
      setLocalPagination((prevPagination) => ({
        ...prevPagination,
        totalDocs: prevPagination.totalDocs - 1,
      }));
      setActive(false);
    } else {
      toast.error(response);
    }
  };

  // permissions
  const permissions = usePermissions("preparation");

  // gets the logged in user role to show/hide teacher filter if admin
  const isAdmin = useAuthUser()().user.role === "ADMIN";

  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        {isAdmin && (
          <Grid item xs={12} sm={6} lg={!isAdmin? 4 : 3}>
            <SearchFilter
              value={teacher} 
              onChange={setTeacher} 
              placeholder="اسم المعلم..."
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6} lg={!isAdmin? 4 : 3} marginLeft={"auto"}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && (
              <Link to={"add"} style={{ flex: 1 }}>
                <Button
                  startIcon={<AddCircleOutlineOutlined />}
                  variant="contained"
                  sx={{ p: "16px 40px", borderRadius: "8px", width: "100%" }}
                >
                  إضافة تحضير
                </Button>
              </Link>
            )}
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
      />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد التحضيرات"
        />
      )}
    </Container>
  );
};

export default List;
