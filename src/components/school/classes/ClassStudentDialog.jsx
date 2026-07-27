import { PersonAddAltRounded } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getStudentEmail, getStudentId, getStudentName } from "@/utils/school/studentData";

const ClassStudentDialog = ({
  open,
  students = [],
  existingStudentIds = [],
  loading = false,
  studentsLoading = false,
  onClose,
  onConfirm,
}) => {
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (open) setStudentId("");
  }, [open]);

  const availableStudents = useMemo(() => {
    const existing = new Set(existingStudentIds.filter(Boolean).map(String));
    return students.filter(
      (student) => !existing.has(String(getStudentId(student)))
    );
  }, [students, existingStudentIds]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "18px", fontFamily: "Tajawal, Arial, sans-serif" } }}
    >
      <DialogTitle
        sx={{
          px: 2.4,
          py: 1.7,
          color: "#122f4d",
          borderBottom: "1px solid #ded8cd",
          fontSize: "15px",
          fontWeight: 800,
        }}
      >
        إضافة طالب إلى الفصل
      </DialogTitle>

      <DialogContent sx={{ px: 2.4, py: "24px !important" }}>
        <FormControl fullWidth disabled={loading || studentsLoading}>
          <InputLabel>اختر الطالب</InputLabel>
          <Select
            label="اختر الطالب"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            sx={{ minHeight: 52, borderRadius: "12px", backgroundColor: "#fffcf7", fontSize: "10px" }}
          >
            {availableStudents.map((student) => (
              <MenuItem key={getStudentId(student)} value={getStudentId(student)}>
                {getStudentName(student)} — {getStudentEmail(student)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ mt: 0.8, color: "#7e8791", fontSize: "8px" }}>
          {studentsLoading
            ? "جاري تحميل الطلاب..."
            : availableStudents.length
            ? `${availableStudents.length} طالب متاح للإضافة`
            : "لا يوجد طلاب متاحون للإضافة حاليًا."}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2.4, py: 1.5, gap: 0.8, borderTop: "1px solid #ded8cd" }}>
        <Button onClick={onClose} disabled={loading}>إلغاء</Button>
        <Button
          onClick={() => onConfirm?.(studentId)}
          disabled={loading || !studentId}
          startIcon={
            loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <PersonAddAltRounded />
          }
          sx={{ color: "#ffffff", backgroundColor: "#244a70", "&:hover": { backgroundColor: "#1b3d61" } }}
        >
          إضافة الطالب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassStudentDialog;
