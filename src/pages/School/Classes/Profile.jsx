import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Popup from "@/components/Popup/Popup";
import { Delete, Edit } from "@mui/icons-material";
import { toast } from "react-toastify";
import { translateGender } from "@/utils/helpers/translateGender";
import {
  deleteClass,
  editClass,
  toggleActiveClass,
} from "@/APIs/school/classes";
import { useClass } from "@/utils/hooks/apis/useClass";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";
import ClassStudentsList from "@/components/ClassLists/ClassStudentsList";
import StudentsToBeAdded from "@/components/ClassLists/StudentsToBeAdded";
import ClassAttendanceList from "@/components/ClassLists/ClassAttendanceList";
import ClassAbsenceList from "@/components/ClassLists/ClassAbsenceList";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState({});

  // Fetch Class Data using custom hook
  const { currentClass, loading } = useClass(id);

  // Update item when currentClass changes
  useEffect(() => {
    if (currentClass) {
      setItem(currentClass);
    }
  }, [currentClass]);

  // Class Students
  const [studentsToBeAdd, setStudentsToBeAdded] = useState([]);

  // Absent Students
  const [absentStudents, setAbsentStudents] = useState([]);

  // handle delete
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteClass(id);
    if (res.status) {
      toast.success("تم حذف الفصل بنجاح");
      navigate("/users/classes");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف الفصل");
    }
  };

  // Handle Toggle Status
  const [toggleLoading, setToggleLoading] = useState(false);
  const handleToggleStatus = async () => {
    setToggleLoading(true);
    const res = await toggleActiveClass(id);
    if (res.status) {
      toast.success("تم تغيير حالة الفصل بنجاح");
      setItem((prev) => ({ ...prev, isActive: !prev.isActive })); // Toggle the status
    } else {
      toast.error(res || "حدث خطأ ما أثناء تغيير حالة الفصل ");
    }
    setToggleLoading(false);
  };

  // Permissions
  const permissions = usePermissions("classes");

  // Show loading state
  if (loading) {
    return <Loading/>;
  }
  
  // If no item found
  if (!item) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 8, lg: 16 },
            borderRadius: "16px",
            borderColor: "primary.border",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Typography color="text.secondary">
            لم يتم العثور على بيانات الفصل
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Back title={"تفاصيل الفصل"} />
        {/* Status */}
        {permissions.edit && 
        <Chip
          label={item?.isActive ? "نشط" : "غير نشط"}
          color={item?.isActive ? "success" : "error"}
          sx={{
            fontSize: "14px",
            fontWeight: "bold",
            px: 2,
            py: 1,
            borderRadius: "8px",
          }}
          onClick={handleToggleStatus}
          clickable
          disabled={toggleLoading}
        />}
      </Stack>
      {/* Box Content */}
      {item && <Details item={item} setOpen={setOpen} permissions={permissions} />}
      {/* Subjects */}
      {item.subjects && permissions.edit && <Subjects subjects={item.subjects} classId={id} setItem={setItem} />}
      {/* Students */}
      {permissions.edit && <Grid container spacing={8}>
        <Grid item xs={12} md={6}>
          {item.students && (
            <ClassStudentsList
              students={item?.students}
              classId={id}
              setItem={setItem}
              setStudentsToBeAdded={setStudentsToBeAdded}
            />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {item.academicYear && item.gender && (
            <StudentsToBeAdded
              academicYear={item.academicYear}
              gender={item.gender}
              classId={id}
              setItem={setItem}
              students={studentsToBeAdd}
              setStudents={setStudentsToBeAdded}
            />
          )}
        </Grid>
      </Grid>}
      {/* Attendance & Absence */}
      <Grid container spacing={8}>
        <Grid item xs={12} md={6}>
          {item.students && (
            <ClassAttendanceList 
              students={item?.students} 
              classId={id}
              absentStudents={absentStudents} 
              setAbsentStudents={setAbsentStudents} 
            />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <ClassAbsenceList 
            classId={id}
            absentStudents={absentStudents} 
            setAbsentStudents={setAbsentStudents} 
          />
        </Grid>
      </Grid>
      {/* Popup */}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذا الفصل"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen , permissions }) => {
  const data = [
    { key: "السنة الدراسية", value: item?.academicYear || "" },
    { key: "رقم الفصل", value: item?.roomNumber || "لا يوجد" },
    { key: "النوع", value: translateGender(item?.gender, "class") },
    { key: "الحالة", value: item?.isActive == 1 ? "نشط" : "غير نشط" },
    { key: "اقصي سعة للفصل", value: item?.maxCapacity + " طالب" || "لا يوجد" },
    { key: "عدد الطلاب فى الفصل", value: item?.students?.length + " طالب" },
    {
      key: "عدد الاماكن المتاحة",
      value: item?.maxCapacity - item?.students?.length + " طالب",
    },
    {
      key: "رائد الفصل",
      value: item?.teacherInCharge?.name || "لا يوجد",
    },
    {
      key: "المواد الدراسية",
      value:
        item?.subjects?.map((sub) => sub.subjectName).join(" - ") || "لا يوجد",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0px 1px 2px 0px #0000000D",
        p: 12,
        borderRadius: "16px",
        mt: 10,
      }}
    >
      <Accordion defaultExpanded>
        <AccordionSummary>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width={"100%"}
          >
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight="bold">
                {`${item?.academicYear} - ${item?.roomNumber} - ${translateGender(
                  item?.gender,
                  "class"
                )}`}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              {permissions.edit && <Tooltip title={"تعديل بيانات الفصل"}>
                <Link to={`/school/classes/edit/${item._id}`}>
                  <IconButton color="success" size="medium">
                    <Edit />
                  </IconButton>
                </Link>
              </Tooltip>}
              {permissions.delete && <Tooltip title={"حذف الفصل"}>
                <IconButton
                  color="error"
                  size="medium"
                  onClick={() => setOpen(true)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>}
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />

          <Grid container spacing={4}>
            {data.map((field, i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "10px",
                    bgcolor: i % 2 === 0 ? "primary.white" : "white",
                    transition: ".5s",
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <Typography
                    variant="label"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}
                  >
                    {field.key}
                  </Typography>
                  <Typography
                    variant="subtitle"
                    sx={{
                      display: "block",
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    {field.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const Subjects = ({ subjects, classId, setItem }) => {
  const [selectedSubjects, setSelectedSubjects] = useState(
    subjects?.map((sub) => sub._id || sub.id)
  );
  const [loading, setLoading] = useState(false);

  // Save Changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Validate Selected Subjects
    if (selectedSubjects?.length === 0) {
      toast.error("يرجى اختيار مادة دراسية واحدة على الأقل");
      return;
    }

    // Check if subjects are the same
    if (
      JSON.stringify(selectedSubjects) ===
      JSON.stringify(subjects.map((sub) => sub._id || sub.id))
    ) {
      toast.info("لا توجد تغييرات لحفظها");
      return;
    }
    setLoading(true);
    // API Call to update subjects
    const response = await editClass({ subjectIds: selectedSubjects }, classId);
    if (response.status) {
      toast.success("تم تعديل مواد الفصل بنجاح");
      setItem((prev) => ({
        ...prev,
        subjects: response.data.subjects,
      }));
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل مواد الفصل!");
    }
    setLoading(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0px 1px 2px 0px #0000000D",
        p: 12,
        borderRadius: "16px",
        mt: 10,
      }}
    >
      <Accordion>
        <AccordionSummary>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width={"100%"}
          >
            <Typography variant="h5" fontWeight="bold">
              المواد الدراسية
            </Typography>
            <Button
              color="primary"
              variant="contained"
              disabled={loading}
              sx={{ p: "8px 20px", borderRadius: "8px" }}
              onClick={e => handleSaveChanges(e)}
            >
              حفظ التغييرات
            </Button>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />
          <SubjectCheckBoxes 
            selectedSubjects={selectedSubjects}
            setSelectedSubjects={setSelectedSubjects}
          />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default Profile;