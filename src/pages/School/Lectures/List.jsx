import { Button, Grid, IconButton, Stack } from "@mui/material";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { AddCircleOutlineOutlined, CalendarMonth, GpsFixed, Person2, Subject } from "@mui/icons-material";
import { deleteLecture } from "@/APIs/school/lectures";
import getArabicDays from "@/utils/helpers/getArabicDays";
import getLectureOrder from "@/utils/helpers/getLectureOrder";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import PaginationControls from "@/components/Pagination";
import { useLectures } from "@/utils/hooks/apis/useLectures";
import usePermissions from "@/utils/hooks/usePermissions";
import { useTeachers } from "@/utils/hooks/apis/useTeachers";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";

const List = () => {
  const headers = ["الفصل", "المعلم", "المادة", "اليوم", "الحصة"];
  const body = ["className", "teacherName", "subject", "day", "slot"];

  const [items, setItems] = useState([]);
    
  // Get Teachers and Subjects
  const { teachers } = useTeachers({ page: 1, limit: 1000 });
  const { subjects } = useSubjects({ page: 1, limit: 1000 });

  // Filter states
  const [classFilter, setClassFilter] = useState("");
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [slot, setSlot] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  // Build filters object
  const filters = {
    page,
    limit,
    teacherId: teacher || undefined,
    classId: classFilter || undefined,
    dayOfWeek: dayOfWeek || undefined,
    slot: slot || undefined,
    subjectId: subject || undefined
  };

  // Call the useLectures custom hook to fetch lectures data
  const { lectures, loading, pagination } = useLectures(filters);

  // Mapped items function
  const mappedItems = (lecturesData) => {
    return lecturesData.map((item) => ({
      id: item._id,
      className: item?.class
        ? `${item?.class?.academicYear} - ${item?.class?.roomNumber} - ${
            item?.class?.gender === "male" ? "بنين" : "بنات"
          }`
        : "",
      teacherName: item?.teacher?.name || "",
      subject: item?.subject?.subjectName + " - " + item?.subject.subjectCode || "",
      day: getArabicDays(item?.dayOfWeek) || "",
      slot: getLectureOrder(item?.slot) || "",
    }));
  };

  // Update items when lectures data changes
  useEffect(() => {
    if (lectures) {
      setItems(mappedItems(lectures));
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [lectures, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, slot, dayOfWeek, subject, teacher, classFilter]);

  // Delete Item
  const handleDelete = async (id, setActive) => {
    const response = await deleteLecture(id);
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
  const permissions = usePermissions("lectures");

  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={teacher}
            onChange={setTeacher}
            label="المعلم"
            icon={Person2}
            allLabel="جميع المعلمين"
            options={teachers.map(item => ({ value: item._id, label: item.name }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ClassFilter
            classId={classFilter}
            setClassId={setClassFilter}
          />
        </Grid> 
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={subject}
            onChange={setSubject}
            label="المادة"
            icon={Subject}
            allLabel="جميع المواد"
            options={subjects.map(item => ({ 
              value: item.id, 
              label: `${item.subjectName} ${item.subjectCode ? "-" : ""} ${item.subjectCode || ""}` 
            }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={slot}
            onChange={setSlot}
            label="الحصة"
            icon={GpsFixed}
            allLabel="جميع الحصص"
            options={Slots.map(item => ({ value: item.id, label: item.name }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={dayOfWeek}
            onChange={setDayOfWeek}
            label="اليوم"
            icon={CalendarMonth}
            allLabel="جميع الايام"
            options={Days.map(item => ({ value: item.id, label: item.day }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Stack direction={"row"} spacing={8} flex={"1"} alignItems={"center"}>
            {permissions.add && <Link to={"add"} style={{width : "100%"}}>
              <Button
                startIcon={<AddCircleOutlineOutlined />}
                variant="contained"
                sx={{ p: "16px 40px", borderRadius: "8px", width : "100%" }}
              >
                إضافة حصة جديد
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
          label="عدد الحصص"
        />
      )}
    </Container>
  );
};

export default List;