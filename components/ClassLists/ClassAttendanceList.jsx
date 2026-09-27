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
import { EventBusy } from "@mui/icons-material";
import { useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { addAttendance } from "@/APIs/school/attendance";
import usePermissions from "@/utils/hooks/usePermissions";

const ClassAttendanceList = ({ 
  students, 
  classId, 
  absentStudents, 
  setAbsentStudents 
}) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Today Date
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });
  const formatDate = format(new Date(today), "eee, dd-MMM", { locale: ar });

  // Filter out absent students with useMemo
  const presentStudents = students.filter(
    (student) => !absentStudents.some((absent) => absent._id === student._id)
  );

  const filteredPresentStudents = presentStudents.filter((student) =>
    `${student.firstName ?? ""} ${student.familyName ?? ""}`
      .trim()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Handle Add Absence
  const handleAddAbsence = async (student) => {
    setLoading(true);
    const res = await addAttendance({
      classId,
      studentId: student._id,
      date: today
    });
    if (res.status) {
      toast.success(`تم تسجيل الغياب بنجاح!`);
      const newStudent = {
        name: res.data.student.name,
        id: res.data._id,
        _id: student._id
      };
      setAbsentStudents((prev) => [...prev, newStudent]);
    } else {
      toast.error(res || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  const permissions = usePermissions("attendance");


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
        height: "100%",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={10}
      >
        <Typography variant="h5" fontWeight="bold">
          حضور اليوم
          <Typography variant="label" display={"block"} color={"text.third"} mt={2}>
            {formatDate}
          </Typography>
        </Typography>
        <Chip
          label={`عدد الطلاب ${presentStudents?.length}`}
          color="primary"
          sx={{
            fontWeight: "bold",
            bgcolor: "#3B82F61F",
            color: "text.secondary",
          }}
        />
      </Stack>

      <Divider sx={{ mb: 10 }} />

      {presentStudents.length > 0 ? (
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
            {filteredPresentStudents.length > 0 ? (
              filteredPresentStudents.map((student) => (
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
                    {permissions.add && (
                      <Tooltip title="تسجيل الطالب غائب اليوم">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleAddAbsence(student)}
                          disabled={loading}
                        >
                          <EventBusy fontSize="12" />
                        </IconButton>
                      </Tooltip>
                    )}
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
            لا توجد طلاب حاضرين
          </Typography>
          <Typography variant="caption" color="text.disabled">
            جميع الطلاب تم تسجيل غيابهم اليوم
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ClassAttendanceList;
