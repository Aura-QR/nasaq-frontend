import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Popup from "@/components/Popup/Popup";
import { Delete, Edit } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useGradesCriteria } from "@/utils/hooks/apis/useGradesCriteria";
import { deleteGradesCriteria } from "@/APIs/school/gradesCriteria";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // calling the usegradesCriteria hook to fetch the grades criteria data
  const { gradesCriteria, loading: gradesCriteriaLoading } =
    useGradesCriteria(id);

  // Keep local state for toggle functionality
  const [item, setItem] = useState(null);

  // Update item when student data loads
  useEffect(() => {
    if (gradesCriteria) {
      setItem(gradesCriteria);
    }
  }, [gradesCriteria]);

  // handle delete
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteGradesCriteria(id);
    if (res.status) {
      toast.success("تم حذف توزيع الدرجات بنجاح");
      navigate("/school/gradesCriteria");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف توزيع الدرجات");
    }
  };

  //permissions
  const permissions = usePermissions("gradesCriteria");

  // Show loading state
  if (gradesCriteriaLoading) {
    return <Loading />;
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
        <Back title={"تفاصيل توزيع الدرجات"} />
        {/* Status */}
      </Stack>
      {/* Box Content */}
      {item && <Details item={item} setOpen={setOpen} permissions={permissions} />}
      {/* Popup */}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف توزيع الدرجات هذا؟"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen, permissions }) => {
  console.log(item)
  const data = [
    { key: "المادة", value: `${item?.subject.subjectName} ${item?.subject.subjectCode}`},
    { key: "السنة الدراسية", value: item?.academicYear },
    { key: "درجة الاختبار النهائي", value: item?.final + (item.final <= 10 ? " درجات" : " درجة") },
    { key: "درجة اعمال السنة", value: item?.activities + (item.activities <= 10 ? " درجات" : " درجة") },
    { key: "درجة المهام الآدائية", value: item?.projects + (item.projects <= 10 ? " درجات" : " درجة") },
    { key: "عدد المهام الآدائية", value: item?.projectsCount || 1},
    { key: "درجة الواجبات", value: item?.assignments + (item.assignments <= 10 ? " درجات" : " درجة") },
    { key: "عدد الواجبات", value: item?.assignmentsCount || 1},
    { key: "درجة الاختبارات القصيرة", value: item?.quizzes + (item.quizzes <= 10 ? " درجات" : " درجة") },
    { key: "عدد الاختبارات القصيرة", value: item?.quizzesCount || 1},
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
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Stack spacing={1}>
          <Typography
            variant="h4"
            fontWeight="bold"
          >{`${item?.academicYear} - ${item?.subject.subjectName}`}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          {permissions.edit && <Tooltip title={"تعديل توزيع درجات المادة"}>
            <Link to={`/school/gradesCriteria/edit/${item._id}`}>
              <IconButton color="success" size="large">
                <Edit />
              </IconButton>
            </Link>
          </Tooltip>}
          {permissions.delete && <Tooltip title={"حذف توزيع درجات المادة"}>
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
      <Divider sx={{ my: 10 }} />
      {/* Body */}
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
    </Paper>
  );
};

export default Profile;
