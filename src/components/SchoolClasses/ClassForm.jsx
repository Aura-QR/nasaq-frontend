import {
  AccountTreeRounded,
  InfoOutlined,
  MeetingRoomRounded,
  PersonRounded,
  SaveRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchStages } from "@/APIs/school/stages";
import { fetchGradeLevels } from "@/APIs/school/gradeLevels";
import { fetchTeachersList } from "@/APIs/users/teachers";
import {
  buildClassPayload,
  extractApiList,
  getClassFormValues,
  getEntityId,
} from "@/utils/school/classData";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    borderRadius: "12px",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "rgba(36,74,112,.14)" },
    "&:hover fieldset": { borderColor: "rgba(36,74,112,.28)" },
    "&.Mui-focused fieldset": { borderColor: "#d3a44f", borderWidth: 1 },
  },
  "& .MuiInputLabel-root": { fontFamily: "Tajawal", fontSize: "11px", fontWeight: 700 },
  "& input, & .MuiSelect-select": { fontFamily: "Tajawal", fontSize: "10.5px" },
};

const Section = ({ icon, title, description, children }) => (
  <Paper
    elevation={0}
    sx={{
      mt: 1.1,
      p: { xs: 1.4, md: 1.8 },
      border: "1px solid rgba(36,74,112,.08)",
      borderRadius: "18px",
      backgroundColor: "#fffcf7",
      boxShadow: "0 10px 24px rgba(18,47,77,.05)",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 1.2, mb: 1.4, borderBottom: "1px solid rgba(36,74,112,.07)" }}>
      <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "#b78430", backgroundColor: "#fbf0d8", borderRadius: "12px" }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "#122f4d", fontSize: "15px", fontWeight: 800 }}>{title}</Typography>
        <Typography sx={{ mt: .15, color: "#7e8791", fontSize: "9px" }}>{description}</Typography>
      </Box>
    </Stack>
    {children}
  </Paper>
);

const stageIdOfGrade = (grade) =>
  getEntityId(
    grade?.stageId && typeof grade.stageId === "object"
      ? grade.stageId
      : grade?.stage && typeof grade.stage === "object"
        ? grade.stage
        : grade?.stageId || grade?.stage
  );

const ClassForm = ({ initialData = null, mode = "add", loading = false, onSubmit, onCancel }) => {
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      academicYearId: "",
      stageId: "",
      gradeLevelId: "",
      gender: "",
      teacherInChargeId: "",
      roomNumber: "",
      maxCapacity: 30,
      isActive: true,
    },
  });

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [years, setYears] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const selectedStageId = watch("stageId");
  const selectedGradeId = watch("gradeLevelId");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setOptionsLoading(true);
      const [yearsRes, stagesRes, gradesRes, teachersRes] = await Promise.all([
        fetchAcademicYears(),
        fetchStages(),
        fetchGradeLevels(),
        fetchTeachersList(),
      ]);
      if (!active) return;

      const failures = [yearsRes, stagesRes, gradesRes, teachersRes]
        .filter((res) => res?.status === false)
        .map((res) => res?.message)
        .filter(Boolean);

      setYears(yearsRes?.status === false ? [] : extractApiList(yearsRes, ["academicYears", "years"]));
      setStages((stagesRes?.status === false ? [] : extractApiList(stagesRes, ["stages"]))
        .sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0)));
      setGrades((gradesRes?.status === false ? [] : extractApiList(gradesRes, ["gradeLevels", "grades"]))
        .sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0)));
      setTeachers(teachersRes?.status === false ? [] : extractApiList(teachersRes, ["teachers"]));
      setOptionsError(failures.join(" — "));
      setOptionsLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (optionsLoading) return;

    if (initialData) {
      const values = getClassFormValues(initialData);
      const grade = grades.find((item) => getEntityId(item) === values.gradeLevelId);
      reset({ ...values, stageId: stageIdOfGrade(grade) });
      return;
    }

    const activeYear = years.find((year) => String(year?.status || "").toLowerCase() === "active");
    reset({
      name: "",
      academicYearId: getEntityId(activeYear),
      stageId: "",
      gradeLevelId: "",
      gender: "",
      teacherInChargeId: "",
      roomNumber: "",
      maxCapacity: 30,
      isActive: true,
    });
  }, [initialData, optionsLoading, years, grades, reset]);

  const filteredGrades = useMemo(
    () => grades.filter((grade) => !selectedStageId || stageIdOfGrade(grade) === selectedStageId),
    [grades, selectedStageId]
  );

  useEffect(() => {
    if (!selectedGradeId || !selectedStageId) return;
    const grade = grades.find((item) => getEntityId(item) === selectedGradeId);
    if (grade && stageIdOfGrade(grade) !== selectedStageId) setValue("gradeLevelId", "");
  }, [selectedStageId, selectedGradeId, grades, setValue]);

  if (optionsLoading) {
    return <Stack spacing={1}><Skeleton variant="rounded" height={160} /><Skeleton variant="rounded" height={300} /></Stack>;
  }

  return (
    <Box component="form" noValidate dir="rtl" onSubmit={handleSubmit((values) => onSubmit?.(buildClassPayload(values)))}>
      {optionsError && <Alert severity="warning" sx={{ borderRadius: "13px", fontSize: "9.5px" }}>{optionsError}</Alert>}

      <Section icon={<AccountTreeRounded />} title="الهيكل الأكاديمي" description="اختر السنة والمرحلة والصف الذي يتبع له الفصل.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,minmax(0,1fr))" }, gap: 1.1 }}>
          <Controller name="academicYearId" control={control} rules={{ required: "السنة الدراسية مطلوبة" }} render={({ field }) => (
            <TextField {...field} select label="السنة الدراسية" error={Boolean(errors.academicYearId)} helperText={errors.academicYearId?.message} sx={fieldSx}>
              {years.map((year) => <MenuItem key={getEntityId(year)} value={getEntityId(year)}>{year?.name}{year?.status === "active" ? " — النشطة" : ""}</MenuItem>)}
            </TextField>
          )} />

          <Controller name="stageId" control={control} rules={{ required: "المرحلة الدراسية مطلوبة" }} render={({ field }) => (
            <TextField {...field} select label="المرحلة الدراسية" error={Boolean(errors.stageId)} helperText={errors.stageId?.message} sx={fieldSx}>
              {stages.map((stage) => <MenuItem key={getEntityId(stage)} value={getEntityId(stage)}>{stage?.name}</MenuItem>)}
            </TextField>
          )} />

          <Controller name="gradeLevelId" control={control} rules={{ required: "الصف الدراسي مطلوب" }} render={({ field }) => (
            <TextField {...field} select disabled={!selectedStageId} label="الصف الدراسي" error={Boolean(errors.gradeLevelId)} helperText={errors.gradeLevelId?.message || (!selectedStageId ? "اختر المرحلة أولًا" : "")} sx={fieldSx}>
              {filteredGrades.map((grade) => <MenuItem key={getEntityId(grade)} value={getEntityId(grade)}>{grade?.name}</MenuItem>)}
            </TextField>
          )} />
        </Box>
      </Section>

      <Section icon={<MeetingRoomRounded />} title="بيانات الفصل" description="أدخل اسم الفصل والنوع والغرفة والسعة.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.1 }}>
          <Controller name="name" control={control} rules={{ required: "اسم الفصل مطلوب" }} render={({ field }) => (
            <TextField {...field} label="اسم الفصل" placeholder="مثال: 1/1" error={Boolean(errors.name)} helperText={errors.name?.message} sx={fieldSx} />
          )} />
          <Controller name="gender" control={control} rules={{ required: "نوع الفصل مطلوب" }} render={({ field }) => (
            <TextField {...field} select label="نوع الفصل" error={Boolean(errors.gender)} helperText={errors.gender?.message} sx={fieldSx}>
              <MenuItem value="male">بنين</MenuItem><MenuItem value="female">بنات</MenuItem><MenuItem value="both">مختلط</MenuItem>
            </TextField>
          )} />
          <Controller name="roomNumber" control={control} render={({ field }) => (
            <TextField {...field} label="رقم أو كود الغرفة" placeholder="A-101" helperText="اختياري" sx={fieldSx} />
          )} />
          <Controller name="maxCapacity" control={control} rules={{ required: "السعة مطلوبة", min: { value: 1, message: "السعة أكبر من صفر" }, validate: (value) => Number.isInteger(Number(value)) || "أدخل رقمًا صحيحًا" }} render={({ field }) => (
            <TextField {...field} type="number" label="السعة القصوى" inputProps={{ min: 1, step: 1 }} error={Boolean(errors.maxCapacity)} helperText={errors.maxCapacity?.message} sx={fieldSx} />
          )} />
        </Box>
      </Section>

      <Section icon={<PersonRounded />} title="المعلم والحالة" description="المعلم المسؤول اختياري ويمكن تغييره لاحقًا.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gap: 1.1 }}>
          <Controller name="teacherInChargeId" control={control} render={({ field }) => (
            <TextField {...field} select label="المعلم المسؤول" helperText="اختياري" sx={fieldSx}>
              <MenuItem value="">بدون معلم مسؤول</MenuItem>
              {teachers.map((teacher) => <MenuItem key={getEntityId(teacher)} value={getEntityId(teacher)}>{teacher?.name || teacher?.fullName || teacher?.email}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="isActive" control={control} render={({ field }) => (
            <Paper elevation={0} sx={{ px: 1.3, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(36,74,112,.14)", borderRadius: "12px", backgroundColor: "#fff" }}>
              <Box><Typography sx={{ color: "#122f4d", fontSize: "10px", fontWeight: 800 }}>حالة الفصل</Typography><Typography sx={{ color: "#7e8791", fontSize: "8px" }}>{field.value ? "نشط" : "موقوف"}</Typography></Box>
              <FormControlLabel sx={{ m: 0 }} label="" control={<Switch checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />} />
            </Paper>
          )} />
        </Box>
      </Section>

      <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 1.1, borderRadius: "13px", fontSize: "9.5px" }}>
        المواد لا تُرسل في بيانات الفصل؛ يتم تفعيلها للصف والترم من إدارة المواد. الطلاب يرتبطون بالفصل من خلال التسجيلات السنوية.
      </Alert>

      <Paper elevation={0} sx={{ mt: 1.1, p: 1.2, border: "1px solid rgba(36,74,112,.08)", borderRadius: "16px", backgroundColor: "#fffcf7" }}>
        <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={.8}>
          <Button type="submit" disabled={loading} variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} sx={{ minWidth: { xs: "100%", sm: 180 }, minHeight: 44, borderRadius: "12px", backgroundColor: "#244a70", boxShadow: "none", fontWeight: 800, "&:hover": { backgroundColor: "#1b3d61", boxShadow: "none" } }}>
            {mode === "edit" ? "حفظ التعديلات" : "إضافة الفصل"}
          </Button>
          <Button type="button" disabled={loading} variant="outlined" onClick={onCancel} sx={{ minWidth: { xs: "100%", sm: 120 }, minHeight: 44, borderRadius: "12px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}>إلغاء</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ClassForm;
