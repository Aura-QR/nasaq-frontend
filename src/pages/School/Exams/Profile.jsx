import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Popup from "@/components/Popup/Popup";
import { CheckCircle, Delete, Edit } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useExam } from "@/utils/hooks/apis/useExam";
import { deleteExam } from "@/APIs/school/exams";
import MCQExams from "@/utils/constants/MCQExams";
import { translateGender } from "@/utils/helpers/translateGender";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // calling the usegradesCriteria hook to fetch the grades criteria data
  const { exam, loading: examLoading } = useExam(id);

  // Keep local state for toggle functionality
  const [item, setItem] = useState(null);

  // Update item when student data loads
  useEffect(() => {
    if (exam) {
      setItem(exam);
    }
  }, [exam]);

  // handle delete
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteExam(id);
    if (res.status) {
      toast.success("تم حذف الامتحان بنجاح");
      navigate("/school/exams");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف الامتحان");
    }
  };

  //permissions
  const permissions = usePermissions("exams");

  // Show loading state
  if (examLoading) {
    return <Loading/>;
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
        <Back title={"تفاصيل الامتحان"} />
        {/* Status */}
      </Stack>
      {/* Box Content */}
      {item && <Details item={item} setOpen={setOpen} permissions={permissions}/>}
      {/* Popup */}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذا الامتحان؟"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen, permissions }) => {
  const data = [
    {
      key: "المادة",
      value: `${item.gradesCriteria.subjectId.subjectName} ${item.gradesCriteria.subjectId.subjectCode}`,
    },
    { key: "المعلم", value: item?.createdBy?.name || "-" },
    { key: "السنة الدراسية", value: item.academicYear },
    {
      key: "نوع الامتحان",
      value: MCQExams.find((exam) => exam.id === item.examType).value,
    },
    { key: "عدد الاسئلة", value: item.questions.length },
    { key: "درجة الامتحان", value: item.grade + (item.grade <= 10 ? " درجات" : " درجة ")},
    { key: "تاريخ البدء", value: item.startDate ? new Date(item.startDate).toLocaleDateString("ar-EG") : "-" },
    { key: "تاريخ الانتهاء", value: item.endDate ? new Date(item.endDate).toLocaleDateString("ar-EG") : "-" },
    { key: "المدة", value: item.duration ? `${item.duration} دقيقة` : "-" },
    { key: "الفصول", value: item.classes.map((cls) => `${cls.academicYear} - ${cls.roomNumber} - ${translateGender(cls.gender,"class")}`).join(" / ")  },
  ];

  return (
    <>
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
            {/* Header */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              width={"100%"}
            >
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight="bold">
                  {`${item?.gradesCriteria.academicYear} - ${
                    item?.gradesCriteria.subjectId.subjectName
                  } - ${
                    MCQExams.find((exam) => exam.id === item?.examType).value
                  }`}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2}>
                {permissions.edit && <Tooltip title={"تعديل الامتحان "}>
                  <Link to={`/school/exams/edit/${item._id}`}>
                    <IconButton color="success" size="large">
                      <Edit />
                    </IconButton>
                  </Link>
                </Tooltip>}
                {permissions.delete && <Tooltip title={"حذف الامتحان"}>
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

            {/* Body */}
            <Grid container spacing={4}>
              {data.map((field, i) => {
                // make the classes take up all 12 columns
                const gridProps =
                  field.key === "الفصول"
                    ? { xs: 12, md: 12, lg: 12 }
                    : { xs: 12, md: 6, lg: 4 };
                return (
                  <Grid item xs={12} md={6} lg={4} key={i} {...gridProps}>
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
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* MCQ Questions Section */}
      <DisplayQuestions item={item} />
    </>
  );
};

const DisplayQuestions = ({ item }) => {
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
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            width={"100%"}
          >
            <Typography variant="h5" fontWeight="bold">
              الاسئلة
            </Typography>
            
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />

          {item?.questions && item.questions.length > 0 && (
            <Box>
              <Box
                bgcolor={"primary.white"}
                p={"32px 16px"}
                borderRadius={"12px"}
                my={8}
              >
                {item.questions.map((question, index) => (
                  <Box key={question._id} mb={24}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={6}
                      sx={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "2px solid",
                        borderColor: "primary.border",
                        paddingX: "16px",
                        paddingY: "20px",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={"400"}>
                        {index + 1}
                        {")"} {question.question}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      {question.options?.map((option, optIndex) => (
                        <Grid item xs={12} sm={6} key={optIndex}>
                          <Box
                            sx={{
                              p: 6,
                              bgcolor: "white",
                              borderRadius: "8px",
                              border: "2px solid",
                              borderColor: "primary.border",
                              display: "flex",
                              alignItems: "center",
                              my: 4,
                              mx: 6,
                            }}
                          >
                            <Typography sx={option ? {}: {p:6} } >
                              {option}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Correct Answer Label */}
                    <Box mt={4} mx={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "success.main",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: "16px",
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 16 }} />
                        الإجابة الصحيحة: {question.correctAnswer}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default Profile;