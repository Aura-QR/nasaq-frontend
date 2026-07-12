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
import { Add } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { addStudentToClass } from "@/APIs/school/classes";
import { useStudents } from "@/utils/hooks/apis/useStudents";

const StudentsToBeAdded = ({
  academicYear,
  gender,
  classId,
  setItem,
  students,
  setStudents,
}) => {
  // Build filters for students
  const filters = {
    isActive: true,
    gender: gender === "both" ? undefined : gender,
    academicYear,
    classId: "null",
  };

  // Fetch students using custom hook
  const { students: fetchedStudents, loading } = useStudents(filters);
  const [actionLoading, setActionLoading] = useState(false);

  // Update students when fetched
  useEffect(() => {
    if (fetchedStudents) {
      setStudents(fetchedStudents);
    }
  }, [fetchedStudents, setStudents]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((student) =>
    `${student.firstName ?? ""} ${student.familyName ?? ""}`
      .trim()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Handle Add Student to Class
  const handleAddStudent = async (studentId) => {
    setActionLoading(true);
    const res = await addStudentToClass(classId, studentId);
    if (res.status) {
      setItem((prev) => ({
        ...prev,
        students: res.data.students,
      }));
      setStudents((prev) =>
        prev.filter((student) => student._id !== studentId)
      );
      toast.success("تم إضافة الطالب بنجاح!");
    } else {
      toast.error(res || "حدث خطأ ما!");
    }
    setActionLoading(false);
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
          قائمة الطلاب المتاحين للإضافة
        </Typography>
        <Chip
          label={`عدد الطلاب ${students.length}`}
          color="primary"
          sx={{
            fontWeight: "bold",
            bgcolor: "#3B82F61F",
            color: "text.secondary",
          }}
        />
      </Stack>

      <Divider sx={{ mb: 10 }} />

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography color="text.secondary">جاري التحميل...</Typography>
        </Box>
      ) : students.length > 0 ? (
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
                    <Tooltip title="إضافة الطالب إلى الفصل">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleAddStudent(student._id)}
                        disabled={actionLoading}
                      >
                        <Add fontSize="12" />
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
            لا توجد طلاب متاحين للإضافة
          </Typography>
          <Typography variant="caption" color="text.disabled">
            جميع الطلاب المطابقين للمعايير موجودون في فصل بالفعل
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StudentsToBeAdded;
