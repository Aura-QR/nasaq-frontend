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
import { EventAvailable } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { deleteAttendance } from "@/APIs/school/attendance";
import { useAttendances } from "@/utils/hooks/apis/useAttendances";
import usePermissions from "@/utils/hooks/usePermissions";

const ClassAbsenceList = ({ classId, absentStudents, setAbsentStudents }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Today Date
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });
  const formatDate = format(new Date(today), "eee, dd-MMM", { locale: ar });

  // Build filters for attendance
  const filters = { classId, date: today };

  // Fetch attendance using custom hook
  const { attendances } = useAttendances(filters);

  const filteredAbsentStudents = (absentStudents || []).filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update absent students when attendances change
  useEffect(() => {
    if (attendances) {
      setAbsentStudents(
        attendances.map(record => ({ 
          ...record.student, 
          id: record._id 
        }))
      );
    }
  }, [attendances, setAbsentStudents]);

  // Handle Delete Absence
  const handleDeleteAbsence = async (id) => {
    setLoading(true);
    const res = await deleteAttendance(id);
    if (res.status) {
      toast.success(`تم تسجيل الحضور بنجاح!`);
      setAbsentStudents((prev) => prev.filter(student => student.id !== id));
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
          غياب اليوم
          <Typography variant="label" display={"block"} color={"text.third"} mt={2}>
            {formatDate}
          </Typography>
        </Typography>
        <Chip
          label={`عدد الطلاب ${absentStudents?.length}`}
          color="primary"
          sx={{
            fontWeight: "bold",
            bgcolor: "#3B82F61F",
            color: "text.secondary",
          }}
        />
      </Stack>

      <Divider sx={{ mb: 10 }} />

      {absentStudents.length > 0 ? (
        <>
          <TextField
            fullWidth
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الطالب..."
            sx={{ mb: 6, bgcolor: "primary.white" }}
          />
          {filteredAbsentStudents.length > 0 ? (
            <Grid container spacing={6}>
              {filteredAbsentStudents.map((student) => (
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
                      <Typography fontWeight={600} fontSize={14} color="primary.secondary">{student.name}</Typography>
                    </Stack>
                    {permissions.add && <Tooltip title="تسجيل الطالب حاضر اليوم">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleDeleteAbsence(student.id)}
                        disabled={loading}
                      >
                        <EventAvailable fontSize="12" />
                      </IconButton>
                    </Tooltip>}
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
                لا توجد نتائج مطابقة
              </Typography>
              <Typography variant="caption" color="text.disabled">
                جرّب البحث باسم آخر
              </Typography>
            </Box>
          )}
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
            لا يوجد طلاب غائبين
          </Typography>
          <Typography variant="caption" color="text.disabled">
            جميع الطلاب حاضرين اليوم
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ClassAbsenceList;