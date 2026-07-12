import { Button, Grid, IconButton, Stack} from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { School, Subject } from "@mui/icons-material";
import Years from "@/utils/constants/Years";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useProjects } from "@/utils/hooks/apis/useProjects";
import { deleteProject } from "@/APIs/school/projects";
import ClassFilter from "@/components/Filters/ClassFilter";
import { translateGender } from "@/utils/helpers/translateGender";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const headers = [
    "عنوان المشروع",
    "المادة",
    "السنة الدراسية",
    "الفصول",
    "تاريخ التسليم",
  ];
  const body = [
    "title",
    "subjectId",
    "academicYear",
    "classIds",
    "dueDate",
  ];

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // Filter states
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);
  
  // Build filters object
  const filters = useMemo(() => ({
    page,
    limit,
    academicYear: academicYear || undefined,
    subjectId: subject || undefined,
    classIds: classFilter || undefined,
  }), [page, limit, subject, academicYear, classFilter]);

  const { projects, loading, pagination } = useProjects(filters);

  // Mapped items
  const mappedProjects = (data) => {
    return data.map((item) => ({
        title: item.title,
        description: item.description,
        classIds: item.classes.map(cls => `${cls.academicYear} - ${cls.roomNumber} - ${translateGender(cls.gender, "class")}`).join(", "),
        academicYear: item.academicYear,
        dueDate: format(new Date(item.dueDate), "eee, d MMM yyyy", { locale: ar }),
        id: item._id,
        subjectId: `${item.subject.subjectName} ${item.subject.subjectCode}`,
    }));
  };
  
  // Update items when project data changes
  useEffect(() => {
    if (projects) {
      setItems(mappedProjects(projects));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [projects, pagination]);

  // Fetch subjects for filter using custom useSubjects hook
  const { subjects, loading: loadingSubjects } = useSubjects();

  // Map subjects to display both name and code
  const mappedSubjects = subjects.map((item) => ({
    id: item._id || item.id,
    subjectName: item.subjectCode 
    ? `${item.subjectName} ${item.subjectCode}` 
    : item.subjectName,
  }));

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, academicYear, subject, classFilter]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteProject(id);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      setLocalPagination((prevPagination) => ({
        ...prevPagination,
        totalDocs: prevPagination.totalDocs - 1,
      }));
      setActive(false);
    } else {
      toast.error(response);
    }
  };

  //permissions
  const permissions = usePermissions("projects");

  return (
    <Container>
      {/* Filter */}
      <Grid
        container
        mb={8}
        spacing={{ xs: 4, sm: 6, md: 8 }}
        alignItems={"center"}
      >
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <SelectFilter
            value={subject}
            onChange={setSubject}
            label="المادة"
            icon={Subject}
            allLabel="جميع المواد"
            disabled={loadingSubjects}
            options={mappedSubjects.map(item => ({ 
              value: item.id, 
              label: item.subjectName 
            }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الأكاديمية"
            icon={School}
            allLabel="جميع السنين"
            options={Years.map(year => ({ value: year, label: year }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ClassFilter
            classId={classFilter}
            setClassId={setClassFilter}
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
                إضافة مشروع
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
      />
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد المشاريع"
        />
      )}
    </Container>
  );
};

export default List;