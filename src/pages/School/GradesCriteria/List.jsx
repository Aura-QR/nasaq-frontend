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
import { useGrdaesCriterion } from "@/utils/hooks/apis/useGradesCriterion";
import { deleteGradesCriteria } from "@/APIs/school/gradesCriteria";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import usePermissions from "@/utils/hooks/usePermissions";
const List = () => {
  const headers = [
    "المادة",
    "السنة الدراسية",
    "الاختبار النهائي",
    "المهام الآدائية",
    "الواجبات",
    "الاختبارات القصيرة",
    "اعمال السنة",
  ];
  const body = [
    "subject",
    "academicYear",
    "final",
    "projects",
    "assignments",
    "quizzes",
    "activities",
  ];

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // Filter states
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  // Build filters object
  const filters = useMemo(() => ({
    page,
    limit,
    academicYear: academicYear || undefined,
    subjectId: subject || undefined,
  }), [page, limit, subject, academicYear]);

  // Use the useGradesCriterion custom hook to fetch gradesCriterion
  const { gradesCriterion, loading, pagination } = useGrdaesCriterion(filters);

  // Mapped items
  const mapppedGradesCriterion = (data) => {
    return data.map((item) => ({ 
      final: item.final + (item.final <= 10 ? " درجات" : " درجة"),
      projects: item.projects + (item.projects <= 10 ? " درجات" : " درجة"),
      assignments: item.assignments + (item.assignments <= 10 ? " درجات" : " درجة"),
      quizzes: item.quizzes + (item.quizzes <= 10 ? " درجات" : " درجة"),
      activities: item.activities + (item.activities <= 10 ? " درجات" : " درجة"),
      academicYear: item.academicYear,
      id: item._id,
      subject: item.subject.subjectName + " " + item.subject.subjectCode,
    }));
  };

  // Update items when gradesCriterion data changes
  useEffect(() => {
    if (gradesCriterion) {
      setItems(mapppedGradesCriterion(gradesCriterion));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [gradesCriterion, pagination]);

  // Fetch subjects for filter using custom useSubjects hook
  const { subjects, loading: loadingSubjects } = useSubjects();

  // Map subjects to display both name and code
  const mappedSubjects = subjects.map((item) => ({
    id: item._id || item.id,
    subjectName: item.subjectCode 
    ? `${item.subjectName} - ${item.subjectCode}` 
    : item.subjectName,
  }));

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, academicYear, subject]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteGradesCriteria(id);
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

  const permissions = usePermissions("gradesCriteria");

  return (
    <Container>
      {/* Filter */}
      <Grid
        container
        mb={8}
        spacing={{ xs: 4, sm: 6, md: 8 }}
        alignItems={"center"}
      >
        <Grid item xs={12} sm={6} md={4} lg={4}>
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
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الأكاديمية"
            icon={School}
            allLabel="جميع السنين"
            options={Years.map(year => ({ value: year, label: year }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to={"add"} style={{ flex: 1 }}>
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px", width: "100%" }}
              >
                إضافة توزيع الدرجات
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
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد توزيعات الدرجات"
        />
      )}
    </Container>
  );
};

export default List;