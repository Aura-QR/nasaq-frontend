import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { useState } from "react";
import { toast } from "react-toastify";
import { deleteStudentFromClass } from "@/APIs/school/classes";

const ClassStudentsList = ({ students, classId, setItem, setStudentsToBeAdded }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((student) =>
    `${student.firstName ?? ""} ${student.familyName ?? ""}`
      .trim()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Handle Delete Student from Class
  const handleDeleteStudent = async (student) => {
    setLoading(true);
    const res = await deleteStudentFromClass(classId, student._id);
    if (res.status) {
      setItem((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s._id !== student._id),
      }));
      setStudentsToBeAdded((prev) => [...prev, student]);
      toast.success(`تم حذف الطالب بنجاح!`);
    } else {
      toast.error(res || "حدث خطأ ما!");
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
        minHeight: "250px",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={10}
      >
        <Typography variant="h5" fontWeight="bold">
          قائمة طلاب الفصل
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
        <>
          <TextField
            fullWidth
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الطالب..."
            sx={{ mb: 6, bgcolor: "primary.white" }}
          />
          <Grid container spacing={6}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Grid item xs={6} key={student._id}>
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
                      <Typography fontWeight={600} fontSize={14} color="primary.secondary">{`${student.firstName} ${student.fatherName} ${student.familyName}`}</Typography>
                    </Stack>
                    <Tooltip title="حذف الطالب من الفصل">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteStudent(student)}
                        disabled={loading}
                      >
                        <DeleteOutline fontSize="12" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
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
                    لا توجد نتائج مطابقة
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    جرّب البحث باسم آخر
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
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
            لا توجد طلاب فى الفصل
          </Typography>
          <Typography variant="caption" color="text.disabled">
            اضف بعض الطلاب ليظهروا
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ClassStudentsList;
