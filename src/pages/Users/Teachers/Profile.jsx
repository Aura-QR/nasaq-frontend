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
import { deleteTeacher } from "@/APIs/users/teachers";
import { editTeacher, toggleActiveTeacher } from "@/APIs/users/teachers";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";
import { formatDate } from "@/utils/helpers/dateUtils";
import { useTeacher } from "@/utils/hooks/apis/useTeacher";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use the useTeacher custom hook to fetch teacher data
  const { teacher, loading: teacherLoading } = useTeacher(id);
  
  // Keep local state for toggle functionality
  const [item, setItem] = useState(null);

  // Update item when teacher data loads
  useEffect(() => {
    if (teacher) {
      setItem(teacher);
    }
  }, [teacher]);

  // handle delete
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteTeacher(id);
    if (res.status) {
      toast.success("تم حذف المعلم بنجاح");
      navigate("/users/teachers");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف المعلم");
    }
  };

  // Handle Toggle Status
  const [toggleLoading, setToggleLoading] = useState(false);
  const handleToggleStatus = async () => {
    setToggleLoading(true);
    const res = await toggleActiveTeacher(id);
    if (res.status) {
      toast.success("تم تغيير حالة المعلم بنجاح");
      setItem((prev) => ({ ...prev, isActive: !prev.isActive }));
    } else {
      toast.error(res || "حدث خطأ ما أثناء تغيير حالة المعلم ");
    }
    setToggleLoading(false);
  };

  //permissions
  const teachersPermissions = usePermissions("teachers");
  const subjectsPermissions = usePermissions("subjects");

  // Show loading state
  if (teacherLoading) {
    return <Loading/>;
  }

  // error state if teacher not found
  if (!item) {
    return (
      <Container>
        <Typography>لم يتم العثور على بيانات المعلم</Typography>
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
        <Back title={"تفاصيل المعلم"} />
        {/* Status */}
        {teachersPermissions.edit && <Chip
          label={item?.isActive ? "نشط" : "غير نشط"}
          color={item?.isActive ? "success" : "error"}
          sx={{ fontSize: "14px", fontWeight: "bold", px: 2, py: 1, borderRadius: "8px"}}
          onClick={handleToggleStatus}
          clickable
          disabled={toggleLoading}
        />}
      </Stack>
      {/* Box Content */}
      <Details item={item} setOpen={setOpen} teachersPermissions={teachersPermissions}/>
      {/* Subjects */}
      {item.subjects && <Subjects subjects={item.subjects} setItem={setItem} subjectsPermissions={subjectsPermissions}/>}
      {/* Popup */}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذا المعلم"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen, teachersPermissions }) => {
  const data = [
    { key: "اسم المعلم", value: item?.name || "" },
    { key: "رقم الهاتف", value: item?.phoneNumber || "لا يوجد" },
    { key: "البريد الإلكتروني", value: item?.email },
    { key: "الحالة", value: item?.isActive ? "نشط" : "غير نشط" },
    { key: "المؤهل", value: item?.qualification || "لا يوجد" },
    {
      key: "تاريخ التوظيف",
      value: item?.hireDate ? formatDate(new Date(item.hireDate), "eee, dd MMM yyyy") : "—",
    },
    { key: "العنوان", value: item?.address || "لا يوجد" },
    { key: "التخصص", value: item?.specialization || "لا يوجد" },
    { key: "الخبرة", value: item?.experience ? item.experience + " سنوات" : "لا يوجد" },
    {
      key: "المواد الدراسية",
      value: item?.subjects?.map((sub) => sub.subjectName).join(" - ") || "لا يوجد",
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
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 4, sm: 0 }}
            justifyContent={"space-between"}
            alignItems={{ xs: "flex-start", sm: "center" }}
            width={"100%"}
          >
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight="bold">
                {item?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item?.specialization}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              {teachersPermissions.edit&&<Tooltip title={"تعديل بيانات المعلم"}>
                <Link to={`/users/teachers/edit/${item._id}`}>
                  <IconButton color="success" size="large">
                    <Edit />
                  </IconButton>
                </Link>
              </Tooltip>}
              {teachersPermissions.delete &&<Tooltip title={"حذف المعلم"}>
                <IconButton
                  color="error"
                  size="large"
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

const Subjects = ({ subjects, setItem, subjectsPermissions }) => {
  const { id } = useParams();
  const [selectedSubjects, setSelectedSubjects] = useState(
    subjects?.map((sub) => sub._id || sub.id)
  );
  const [loading, setLoading] = useState(false);

  // Save Changes
  const handleSaveChanges = async (e) => {
    e.stopPropagation();

    // Validate Selected Subjects
    if (selectedSubjects.length === 0) {
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
    const response = await editTeacher({ subjectIds: selectedSubjects }, id);
    if (response.status) {
      toast.success("تم تعديل مواد المعلم بنجاح");
      setItem((prev) => ({
        ...prev,
        subjects: response.data.teacher.subjects,
      }));
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل مواد المعلم!");
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
            mb={2}
            width={"100%"}
          >
            <Typography variant="h5" fontWeight="bold">
              المواد الدراسية
            </Typography>
            {subjectsPermissions.edit && <Button
              color="primary"
              variant="contained"
              disabled={loading}
              sx={{ p: "8px 20px", borderRadius: "8px" }}
              onClick={(e) => handleSaveChanges(e)}
            >
              حفظ التغييرات
            </Button>}
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