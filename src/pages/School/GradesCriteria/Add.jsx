import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AssessmentRounded,
  CloseRounded,
  SaveRounded,
  SchoolRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import { api } from "@/APIs/Axios";
import {
  addGradesCriteria,
  fetchGradesCriteria,
} from "@/APIs/school/gradesCriteria";

const idOf = (value) =>
  String(value?._id || value?.id || value || "").trim();

const unwrap = (value) => {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || Array.isArray(current) || typeof current !== "object" || !("data" in current)) break;
    current = current.data;
  }
  return current;
};

const LIST_KEYS = [
  "items", "results", "docs", "rows", "records", "list", "data",
  "subjectOfferings", "offerings", "subjects", "gradeLevels", "terms",
  "academicYears", "years",
];

const extractList = (value) => {
  const root = unwrap(value);
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];
  for (const key of LIST_KEYS) {
    if (Array.isArray(root?.[key])) return root[key];
  }
  return [];
};

const labelOfSubject = (item) => {
  const name = item?.subjectName || item?.name || item?.title || "مادة";
  const code = item?.subjectCode || item?.code || "";
  return code ? `${name} - ${code}` : name;
};
const labelOfGrade = (item) => item?.name || item?.gradeName || item?.title || "صف";
const labelOfTerm = (item) => item?.name || item?.termName || item?.title || `الترم ${item?.order || ""}`.trim();
const labelOfYear = (item) => item?.name || item?.title || item?.label || "";

const mapById = (items = []) => new Map(items.map((item) => [idOf(item), item]).filter(([id]) => id));

const getCriteriaOfferingId = (criteria) =>
  idOf(criteria?.subjectOfferingId || criteria?.subjectOffering);

const getResponseId = (response) => {
  const data = unwrap(response);
  return idOf(data?.gradesCriteria || data);
};

const getErrorMessage = (response, fallback) =>
  response?.message || response?.data?.message || (typeof response === "string" ? response : fallback);

const loadOfferingCatalog = async () => {
  const [offeringsRes, subjectsRes, gradesRes, termsRes, yearsRes] = await Promise.all([
    api.get("/subject-offerings", { params: { page: 1, limit: 1000 } }),
    api.get("/subjects/list").catch(() => api.get("/subjects", { params: { page: 1, limit: 1000 } })),
    api.get("/grade-levels", { params: { page: 1, limit: 1000 } }),
    api.get("/terms", { params: { page: 1, limit: 1000 } }),
    api.get("/academic-years"),
  ]);

  const subjects = extractList(subjectsRes);
  const grades = extractList(gradesRes);
  const terms = extractList(termsRes);
  const years = extractList(yearsRes);
  const subjectMap = mapById(subjects);
  const gradeMap = mapById(grades);
  const termMap = mapById(terms);
  const yearMap = mapById(years);

  return extractList(offeringsRes)
    .map((offering) => {
      const id = idOf(offering);
      const subjectValue = offering?.subjectId || offering?.subject;
      const gradeValue = offering?.gradeLevelId || offering?.gradeLevel;
      const termValue = offering?.termId || offering?.term;
      const subject = (subjectValue && typeof subjectValue === "object" ? subjectValue : null) || subjectMap.get(idOf(subjectValue));
      const grade = (gradeValue && typeof gradeValue === "object" ? gradeValue : null) || gradeMap.get(idOf(gradeValue));
      const term = (termValue && typeof termValue === "object" ? termValue : null) || termMap.get(idOf(termValue));
      const yearValue = term?.academicYearId || offering?.academicYearId;
      const year = (yearValue && typeof yearValue === "object" ? yearValue : null) || yearMap.get(idOf(yearValue));
      const parts = [labelOfSubject(subject || {}), labelOfGrade(grade || {}), labelOfTerm(term || {}), labelOfYear(year || {})].filter(Boolean);
      return { id, label: parts.join(" • "), raw: offering };
    })
    .filter((item) => item.id);
};

const GRADE_FIELDS = ["final", "activities", "projects", "assignments", "quizzes"];
const totalOf = (values) => GRADE_FIELDS.reduce((sum, key) => sum + Number(values?.[key] || 0), 0);
const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const FORM_CARD_SX = {
  p: { xs: 1.35, md: 1.8 }, mt: 1.15, border: "1px solid rgba(36,74,112,0.075)",
  borderRadius: "20px", background: "linear-gradient(180deg, rgba(255,252,247,0.98), rgba(255,255,255,0.96))",
  boxShadow: "0 12px 30px rgba(18,47,77,0.055)",
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": { minHeight: 54, backgroundColor: "#fff", borderRadius: "14px", fontSize: "13px" },
};

const SectionHeading = ({ icon, title, description, endContent }) => (
  <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}
    sx={{ pb: 1.2, mb: 1.35, borderBottom: "1px solid rgba(36,74,112,0.065)" }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", color: "var(--color-gold-dark)", backgroundColor: "var(--color-gold-soft)", borderRadius: "13px" }}>{icon}</Box>
      <Box>
        <Typography sx={{ color: "var(--color-navy-deep)", fontSize: { xs: 15, md: 17 }, fontWeight: 900 }}>{title}</Typography>
        <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10.5 }}>{description}</Typography>
      </Box>
    </Stack>
    {endContent}
  </Stack>
);

const GradeInputs = ({ register, errors }) => {
  const fields = [
    ["passingGrade", "درجة النجاح", 50, 0, 100],
    ["final", "درجة الاختبار النهائي", 100, 0, 100],
    ["activities", "درجة أعمال السنة", 0, 0, 100],
    ["projects", "درجة المهام الأدائية", 0, 0, 100],
    ["projectsCount", "عدد المهام الأدائية", 0, 0, undefined],
    ["assignments", "درجة الواجبات", 0, 0, 100],
    ["assignmentsCount", "عدد الواجبات", 0, 0, undefined],
    ["quizzes", "درجة الاختبارات القصيرة", 0, 0, 100],
    ["quizzesCount", "عدد الاختبارات القصيرة", 0, 0, undefined],
  ];
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {fields.map(([name, label, defaultValue, min, max]) => (
        <Grid item xs={12} sm={6} lg={4} key={name}>
          <Input register={register} registerName={name} error={errors?.[name]?.message} label={label} type="number" defaultValue={defaultValue} valueAsNumber
            inputProps={{ min, ...(max !== undefined ? { max } : {}), step: 1 }} />
        </Grid>
      ))}
    </Grid>
  );
};

const Add = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      subjectOfferingId: searchParams.get("subjectOfferingId") || "",
      passingGrade: 50, final: 100, activities: 0, projects: 0, projectsCount: 0,
      assignments: 0, assignmentsCount: 0, quizzes: 0, quizzesCount: 0,
    },
  });

  const [offerings, setOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState("");
  const [existingCriteria, setExistingCriteria] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedOfferingId = idOf(watch("subjectOfferingId"));
  const values = watch();
  const totalGrades = useMemo(() => totalOf(values), [values]);
  const isTotalValid = totalGrades === 100;

  useEffect(() => {
    register("subjectOfferingId", { required: "اختر عرض المادة" });
  }, [register]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOfferings(true);
      setOfferingsError("");
      try {
        const loaded = await loadOfferingCatalog();
        if (!active) return;
        setOfferings(loaded);
        if (!loaded.length) setOfferingsError("لا توجد عروض مواد. أنشئ عروض المواد أولًا.");
      } catch (error) {
        if (!active) return;
        setOfferings([]);
        setOfferingsError(error?.response?.data?.message || error?.message || "تعذر تحميل عروض المواد");
      } finally {
        if (active) setLoadingOfferings(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedOfferingId) {
      setExistingCriteria(null);
      return;
    }
    let active = true;
    (async () => {
      setCheckingExisting(true);
      try {
        const response = await fetchGradesCriteria({ subjectOfferingId: selectedOfferingId, page: 1, limit: 1000 });
        if (!active) return;
        const match = extractList(response).find((item) => getCriteriaOfferingId(item) === selectedOfferingId);
        setExistingCriteria(match || null);
      } catch {
        if (active) setExistingCriteria(null);
      } finally {
        if (active) setCheckingExisting(false);
      }
    })();
    return () => { active = false; };
  }, [selectedOfferingId]);

  const onSubmit = async (formData) => {
    const subjectOfferingId = idOf(formData.subjectOfferingId);
    if (!subjectOfferingId) return toast.error("اختر عرض المادة");
    if (existingCriteria) return toast.info("يوجد توزيع درجات لهذا العرض بالفعل");
    if (!isTotalValid) return toast.error("يجب أن يكون مجموع الدرجات 100 درجة");

    const passingGrade = numberOrZero(formData.passingGrade);
    if (passingGrade < 0 || passingGrade > 100) return toast.error("درجة النجاح يجب أن تكون من 0 إلى 100");

    const payload = {
      subjectOfferingId,
      final: numberOrZero(formData.final),
      assignments: numberOrZero(formData.assignments),
      assignmentsCount: numberOrZero(formData.assignmentsCount),
      activities: numberOrZero(formData.activities),
      projects: numberOrZero(formData.projects),
      projectsCount: numberOrZero(formData.projectsCount),
      quizzes: numberOrZero(formData.quizzes),
      quizzesCount: numberOrZero(formData.quizzesCount),
      passingGrade,
    };

    setLoading(true);
    try {
      const response = await addGradesCriteria(payload);
      if (!response?.status) {
        const message = getErrorMessage(response, "حدث خطأ أثناء إضافة توزيع الدرجات");
        if (/duplicate|already exists|موجود بالفعل|مكرر/i.test(String(message))) toast.info("يوجد توزيع درجات لهذا العرض بالفعل");
        else toast.error(message);
        return;
      }
      toast.success("تم توزيع درجات المادة بنجاح");
      const createdId = getResponseId(response);
      navigate(createdId ? `/school/gradesCriteria/${createdId}` : "/school/gradesCriteria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate dir="rtl" sx={{ width: "100%", pb: 3 }}>
        <Paper elevation={0} sx={{ ...FORM_CARD_SX, mt: 0 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
            <Back title="إضافة توزيع درجات" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>اختر عرض المادة المحدد بالصف والترم، ثم وزّع 100 درجة.</Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<SchoolRounded />} title="عرض المادة" description="كل توزيع درجات مرتبط بعرض مادة واحد، لذلك يمكن لنفس المادة أن يكون لها توزيع مختلف في كل ترم." />
          <TextField select fullWidth label="المادة / الصف / الترم / السنة" value={selectedOfferingId} onChange={(e) => setValue("subjectOfferingId", e.target.value, { shouldDirty: true, shouldValidate: true })}
            disabled={loadingOfferings || !offerings.length} error={Boolean(errors.subjectOfferingId)}
            helperText={errors.subjectOfferingId?.message || (loadingOfferings ? "جاري تحميل عروض المواد..." : `${offerings.length} عرض متاح`)}>
            <MenuItem value="">اختر عرض المادة</MenuItem>
            {offerings.map((item) => <MenuItem value={item.id} key={item.id}>{item.label}</MenuItem>)}
          </TextField>
          {loadingOfferings && <Stack direction="row" gap={1} mt={1}><CircularProgress size={15} /><Typography sx={{ fontSize: 10 }}>جاري التحميل...</Typography></Stack>}
          {offeringsError && <Alert severity="warning" sx={{ mt: 1 }}>{offeringsError}</Alert>}
          {checkingExisting && <Typography sx={{ mt: 1, fontSize: 10, color: "var(--color-muted)" }}>جاري التحقق من وجود توزيع سابق...</Typography>}
          {existingCriteria && <Alert severity="info" sx={{ mt: 1 }}>يوجد توزيع درجات لهذا العرض بالفعل. اختر عرضًا آخر أو عدّل التوزيع الموجود.</Alert>}
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<AssessmentRounded />} title="تفاصيل توزيع الدرجات" description="القيم الصفرية مسموحة، لكن مجموع أوزان الدرجات يجب أن يساوي 100."
            endContent={<Chip label={`${totalGrades} / 100`} sx={{ fontWeight: 800, color: isTotalValid ? "#237449" : "var(--color-danger)" }} />} />
          <GradeInputs register={register} errors={errors} />
        </Paper>

        <Paper elevation={0} sx={{ ...FORM_CARD_SX, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} disabled={loading || checkingExisting || Boolean(existingCriteria) || !selectedOfferingId || !isTotalValid}>حفظ التوزيع</Button>
          <Button type="button" variant="outlined" startIcon={<CloseRounded />} onClick={() => navigate("/school/gradesCriteria")} disabled={loading}>إلغاء</Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Add;
