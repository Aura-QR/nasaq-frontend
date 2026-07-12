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
import TaskIcon from '@mui/icons-material/Task';
import Years from "@/utils/constants/Years";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useExams } from "@/utils/hooks/apis/useExams";
import { deleteExam } from "@/APIs/school/exams";
import ClassFilter from "@/components/Filters/ClassFilter";
import MCQExams from "@/utils/constants/MCQExams";
import usePermissions from "@/utils/hooks/usePermissions";
const List = () => {
  const headers = [
    "المادة",
    "المعلم",
    "السنة الدراسية",
    "نوع الامتحان",
    "تاريخ البدء",
    "تاريخ الانتهاء",
    "المدة (دقيقة)",
  ];
  const body = [
    "subjectId",
    "createdBy",
    "academicYear",
    "examType",
    "startDate",
    "endDate",
    "duration",
  ];

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  // Filter states
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [examType, setExamType] = useState("");
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  // Build filters object
  const filters = useMemo(() => ({
    page,
    limit,
    academicYear: academicYear || undefined,
    subjectId: subject || undefined,
    classIds: classFilter || undefined,
    examType: examType || undefined,
  }), [page, limit, subject, academicYear, classFilter, examType]);

  // Use the useExam custom hook to fetch exam data
  console.log(filters)
  const { exams, loading, pagination } = useExams(filters);

  // Mapped items
  const mapppedExams = (data) => {
    return data.map((item) => ({
        examType: MCQExams.find(exam => exam.id === item.examType).value,
        academicYear: item.academicYear,
        createdBy: item?.createdBy?.name || "-",
        id: item._id,
        subjectId: `${item.gradesCriteria.subjectId.subjectName} ${item.gradesCriteria.subjectId.subjectCode}`,
        startDate: item.startDate ? new Date(item.startDate).toLocaleDateString("ar-EG") : "-",
        endDate: item.endDate ? new Date(item.endDate).toLocaleDateString("ar-EG") : "-",
        duration: item.duration ?? "-",
    }));
  };
  
  // Update items when exam data changes
  useEffect(() => {
    if (exams) {
      setItems(mapppedExams(exams));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [exams, pagination]);

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
    const response = await deleteExam(id);
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
  const permissions = usePermissions("exams");

  return (
    <Container>
      {/* Filter */}
      <Grid
        container
        mb={8}
        spacing={{ xs: 4, sm: 6, md: 8 }}
        alignItems={"center"}
      >
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
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
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الأكاديمية"
            icon={School}
            allLabel="جميع السنين"
            options={Years.map(year => ({ value: year, label: year }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <ClassFilter
            classId={classFilter}
            setClassId={setClassFilter}
            academicYear={academicYear}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SelectFilter
            value={examType}
            onChange={setExamType}
            label="نوع الامتحان"
            icon={TaskIcon}
            allLabel="جميع الامتحانات"
            options={MCQExams.map(year => ({ value: year.id, label: year.value }))}
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
                إضافة امتحان 
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
          label="عدد الامتحانات"
        />
      )}
    </Container>
  );
};

export default List;