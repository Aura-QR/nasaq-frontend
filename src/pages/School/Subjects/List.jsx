import { Button, Grid, IconButton, Stack} from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { deleteSubject } from "@/APIs/school/subjects";
import useDebounce from "@/utils/hooks/useDebounce";
import SearchFilter from "@/components/Filters/SearchFilter";
import PaginationControls from "@/components/Pagination";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const headers = ["اسم المادة", "كود المادة"];
  const body = ["subjectName", "subjectCode"];

  const [items, setItems] = useState([]);

  // Filter states
  const [searchSubjectName, setSearchSubjectName] = useState("");
  const [searchSubjectCode, setSearchSubjectCode] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [localPagination, setLocalPagination] = useState(null);

  // Debounce search input
  const debouncedSearchName = useDebounce(searchSubjectName, 1000);
  const debouncedSearchCode = useDebounce(searchSubjectCode, 1000);

  // Build filters object
  const filters = { 
    page,
    limit,
    subjectName: debouncedSearchName || undefined, 
    subjectCode: debouncedSearchCode || undefined
  };

  // call the useSubjects hook to fetch subjects
  const { subjects, loading, pagination } = useSubjects(filters);
  
  // Mapped items
  const mappedItems = (data) => {
    return data.map((subject) => ({
      id: subject._id,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
    }));
  };

  // Update items when subjects data changes
  useEffect(() => {
    if (subjects) {
      setItems(mappedItems(subjects));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [subjects, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearchName, debouncedSearchCode]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteSubject(id);
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
  const permissions = usePermissions("subjects");

  return (
    <Container>
      {/* Filter */}
      <Grid
        container
        mb={8}
        spacing={{ xs: 4, sm: 6, md: 15 }}
        alignItems={"center"}
      >
        <Grid item xs={12} sm={6} md={3}>
          <SearchFilter
            value={searchSubjectName}
            onChange={setSearchSubjectName}
            placeholder="اسم المادة..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SearchFilter
            value={searchSubjectCode}
            onChange={setSearchSubjectCode}
            placeholder="كود المادة كامل..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} marginLeft={"auto"}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to="add">
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px" }}
              >
                إضافة مادة جديدة
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
      />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد المواد"
        />
      )}
    </Container>
  );
};

export default List;