import { CloseRounded, SaveRounded } from "@mui/icons-material";
import {
  Box,
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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  buildClassPayload,
  getClassAcademicYear,
  getClassCapacity,
  getClassGender,
  getClassRoomNumber,
  getClassSubjectIds,
  getClassTeacherId,
  isClassActive,
} from "@/utils/school/classData";
import { getTeacherId, getTeacherName } from "@/utils/school/teacherData";

const getInitialForm = (classItem) => ({
  academicYear:
    classItem && getClassAcademicYear(classItem) !== "—"
      ? getClassAcademicYear(classItem)
      : "",
  gender: getClassGender(classItem),
  subjectIds: getClassSubjectIds(classItem).join("\n"),
  teacherInChargeId: getClassTeacherId(classItem),
  roomNumber:
    classItem && getClassRoomNumber(classItem) !== "—"
      ? getClassRoomNumber(classItem)
      : "",
  maxCapacity: classItem ? String(getClassCapacity(classItem) || "") : "30",
  isActive: classItem ? isClassActive(classItem) : true,
});

const ClassFormDialog = ({
  open,
  classItem = null,
  teachers = [],
  teachersLoading = false,
  loading = false,
  onClose,
  onSave,
}) => {
  const editing = Boolean(classItem);
  const [form, setForm] = useState(getInitialForm(classItem));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(getInitialForm(classItem));
    setErrors({});
  }, [open, classItem]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.academicYear.trim()) nextErrors.academicYear = "السنة الدراسية مطلوبة";
    if (!form.gender) nextErrors.gender = "نوع الفصل مطلوب";
    if (!form.roomNumber.trim()) nextErrors.roomNumber = "رقم الغرفة مطلوب";

    const capacity = Number(form.maxCapacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.maxCapacity = "السعة يجب أن تكون رقمًا صحيحًا أكبر من صفر";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave?.(buildClassPayload(form));
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      minHeight: 50,
      borderRadius: "12px",
      backgroundColor: "#fffcf7",
      fontSize: "10px",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          fontFamily: "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.7,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#122f4d",
          borderBottom: "1px solid #ded8cd",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {editing ? "تعديل بيانات الفصل" : "إضافة فصل جديد"}

        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 38, width: 38, height: 38, borderRadius: "10px", color: "#7e8791" }}
        >
          <CloseRounded />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: "22px !important" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" },
            gap: 1.2,
          }}
        >
          <TextField
            label="السنة الدراسية"
            value={form.academicYear}
            onChange={(event) => updateField("academicYear", event.target.value)}
            error={Boolean(errors.academicYear)}
            helperText={errors.academicYear}
            placeholder="2026-2027"
            disabled={loading}
            sx={fieldSx}
          />

          <FormControl error={Boolean(errors.gender)}>
            <InputLabel>نوع الفصل</InputLabel>
            <Select
              label="نوع الفصل"
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              disabled={loading}
              sx={{ minHeight: 50, borderRadius: "12px", backgroundColor: "#fffcf7", fontSize: "10px" }}
            >
              <MenuItem value="male">بنين</MenuItem>
              <MenuItem value="female">بنات</MenuItem>
              <MenuItem value="mixed">مختلط</MenuItem>
            </Select>
            {errors.gender && (
              <Typography sx={{ mt: 0.4, mx: 1.7, color: "#d32f2f", fontSize: "8px" }}>
                {errors.gender}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="رقم الغرفة"
            value={form.roomNumber}
            onChange={(event) => updateField("roomNumber", event.target.value)}
            error={Boolean(errors.roomNumber)}
            helperText={errors.roomNumber}
            placeholder="A101"
            disabled={loading}
            sx={fieldSx}
          />

          <TextField
            label="السعة القصوى"
            type="number"
            value={form.maxCapacity}
            onChange={(event) => updateField("maxCapacity", event.target.value)}
            error={Boolean(errors.maxCapacity)}
            helperText={errors.maxCapacity}
            inputProps={{ min: 1, step: 1 }}
            disabled={loading}
            sx={fieldSx}
          />

          <FormControl>
            <InputLabel>المعلم المسؤول</InputLabel>
            <Select
              label="المعلم المسؤول"
              value={form.teacherInChargeId}
              onChange={(event) => updateField("teacherInChargeId", event.target.value)}
              disabled={loading || teachersLoading}
              sx={{ minHeight: 50, borderRadius: "12px", backgroundColor: "#fffcf7", fontSize: "10px" }}
            >
              <MenuItem value="">بدون معلم مسؤول</MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={getTeacherId(teacher)} value={getTeacherId(teacher)}>
                  {getTeacherName(teacher)}
                </MenuItem>
              ))}
            </Select>
            <Typography sx={{ mt: 0.4, mx: 1.7, color: "#7e8791", fontSize: "7.5px" }}>
              {teachersLoading ? "جاري تحميل المعلمين..." : "يمكن تغيير المعلم المسؤول لاحقًا."}
            </Typography>
          </FormControl>

          <Box
            sx={{
              p: 1.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderRadius: "13px",
              backgroundColor: "#fffcf7",
              border: "1px solid #ded8cd",
            }}
          >
            <Box>
              <Typography sx={{ color: "#122f4d", fontSize: "10px", fontWeight: 800 }}>
                حالة الفصل
              </Typography>
              <Typography sx={{ mt: 0.2, color: "#7e8791", fontSize: "8px" }}>
                {form.isActive ? "الفصل نشط" : "الفصل موقوف"}
              </Typography>
            </Box>
            <Switch
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              disabled={loading}
            />
          </Box>
        </Box>

        <TextField
          label="معرّفات المواد"
          value={form.subjectIds}
          onChange={(event) => updateField("subjectIds", event.target.value)}
          multiline
          minRows={4}
          placeholder="ضع كل Subject ID في سطر، أو افصل بينها بفاصلة"
          helperText="اختياري مؤقتًا؛ بعد تنفيذ المواد سيتم تحويله إلى Dropdown."
          inputProps={{ dir: "ltr" }}
          disabled={loading}
          sx={{
            mt: 1.2,
            width: "100%",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#fffcf7",
              fontSize: "10px",
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 0.8, borderTop: "1px solid #ded8cd" }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ color: "#7e8791", backgroundColor: "rgba(126,135,145,0.08)" }}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <SaveRounded />
          }
          sx={{ color: "#ffffff", backgroundColor: "#244a70", "&:hover": { backgroundColor: "#1b3d61" } }}
        >
          {editing ? "حفظ التعديلات" : "إضافة الفصل"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassFormDialog;
