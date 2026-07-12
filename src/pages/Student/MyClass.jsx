import {
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { translateGender } from "@/utils/helpers/translateGender";
import Loading from "@/components/Loading";
import { useStudentClass, useStudentMates } from "@/utils/hooks/apis/student/useStudent";

const Profile = () => {

  const { currentClass: item, loading } = useStudentClass();

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
    <Container noSidebar={true}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
      >
        <Back title={"صفي الدراسي"} />
      </Stack>
      {/* Box Content */}
      {item && <Details item={item} />}
      {/* Friends */}
      <MyFriends />
    </Container>
  );
};

const Details = ({ item }) => {
  const data = [
    { key: "السنة الدراسية", value: item?.academicYear || "" },
    { key: "رقم الفصل", value: item?.roomNumber || "لا يوجد" },
    { key: "النوع", value: translateGender(item?.gender, "class") },
    { key: "الحالة", value: item?.isActive == 1 ? "نشط" : "غير نشط" },
    { key: "اقصي سعة للفصل", value: item?.maxCapacity + " طالب" || "لا يوجد" },
    { key: "عدد الطلاب فى الفصل", value: item?.currentEnrollment + " طالب" },
    { key: "عدد الاماكن المتاحة", value: item?.availableSeats + " طالب" },
    { key: "رائد الفصل", value: item?.teacherInChargeId?.name || "لا يوجد", },
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

const MyFriends = () => {
  const { mates: students, loading } = useStudentMates();

   // Show loading state
   if (loading) {
    return <Loading/>;
  }
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={10}
      >
        <Typography variant="h5" fontWeight="bold">
          قائمة زملاء الفصل
        </Typography>
        <Chip
          label={`عدد الطلاب ${students?.length}`}
          color="primary"
          sx={{
            fontWeight: "bold",
            bgcolor: "#3B82F61F",
            color: "text.secondary",
          }}
        />
      </Stack>

      <Divider sx={{ mb: 10 }} />

      {students.length > 0 ? (
        <Grid container spacing={6}>
          {students.map((student) => (
            <Grid item xs={12} sm={6} md={3} lg={2} key={student._id}>
              <Box
                sx={{
                  p: 7,
                  borderRadius: "10px",
                  bgcolor: "#F9FAFB",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #eee",
                  justifyContent: "space-between",
                  transition: ".3s",
                  "&:hover": {
                    bgcolor: "primary.white",
                    translate: "0px -2px",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Stack spacing={0.5}>
                  <Typography
                    fontWeight={600}
                    fontSize={14}
                    color={"primary.secondary"}
                  >{`${student.firstName} ${student.familyName}`}</Typography>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 8,
            color: "text.secondary",
          }}
        >
          <Typography variant="body1" color="text.secondary" mb={1}>
            لا يوجد زملاء فى الفصل
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default Profile;