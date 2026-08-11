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
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";
import { api } from "@/APIs/Axios";
import { editGradesCriteria, fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { useGradesCriteria } from "@/utils/hooks/apis/useGradesCriteria";

const idOf = (value) => String(value?._id || value?.id || value || "").trim();
const unwrap = (value) => {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || Array.isArray(current) || typeof current !== "object" || !("data" in current)) break;
    current = current.data;
  }
  return current;
};
const LIST_KEYS = ["items", "results", "docs", "rows", "records", "list", "data", "subjectOfferings", "offerings", "subjects", "gradeLevels", "terms", "academicYears", "years"];
const extractList = (value) => {
  const root = unwrap(value);
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];
  for (const key of LIST_KEYS) if (Array.isArray(root?.[key])) return root[key];
  return [];
};
const mapById = (items = []) => new Map(items.map((item) => [idOf(item), item]).filter(([id]) => id));
const labelOfSubject = (item) => { const name = item?.subjectName || item?.name || item?.title || "مادة"; const code = item?.subjectCode || item?.code || ""; return code ? `${name} - ${code}` : name; };
const labelOfGrade = (item) => item?.name || item?.gradeName || item?.title || "صف";
const labelOfTerm = (item) => item?.name || item?.termName || item?.title || `الترم ${item?.order || ""}`.trim();
const labelOfYear = (item) => item?.name || item?.title || item?.label || "";
const getCriteriaOfferingId = (criteria) => idOf(criteria?.subjectOfferingId || criteria?.subjectOffering);
const getErrorMessage = (response, fallback) => response?.message || response?.data?.message || (typeof response === "string" ? response : fallback);
const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const loadOfferingCatalog = async () => {
  const [offeringsRes, subjectsRes, gradesRes, termsRes, yearsRes] = await Promise.all([
    api.get("/subject-offerings", { params: { page: 1, limit: 1000 } }),
    api.get("/subjects/list").catch(() => api.get("/subjects", { params: { page: 1, limit: 1000 } })),
    api.get("/grade-levels", { params: { page: 1, limit: 1000 } }),
    api.get("/terms", { params: { page: 1, limit: 1000 } }),
    api.get("/academic-years"),
  ]);
  const subjectMap = mapById(extractList(subjectsRes));
  const gradeMap = mapById(extractList(gradesRes));
  const termMap = mapById(extractList(termsRes));
  const yearMap = mapById(extractList(yearsRes));
  return extractList(offeringsRes).map((offering) => {
    const id = idOf(offering);
    const subjectValue = offering?.subjectId || offering?.subject;
    const gradeValue = offering?.gradeLevelId || offering?.gradeLevel;
    const termValue = offering?.termId || offering?.term;
    const subject = (subjectValue && typeof subjectValue === "object" ? subjectValue : null) || subjectMap.get(idOf(subjectValue));
    const grade = (gradeValue && typeof gradeValue === "object" ? gradeValue : null) || gradeMap.get(idOf(gradeValue));
    const term = (termValue && typeof termValue === "object" ? termValue : null) || termMap.get(idOf(termValue));
    const yearValue = term?.academicYearId || offering?.academicYearId;
    const year = (yearValue && typeof yearValue === "object" ? yearValue : null) || yearMap.get(idOf(yearValue));
    return { id, label: [labelOfSubject(subject || {}), labelOfGrade(grade || {}), labelOfTerm(term || {}), labelOfYear(year || {})].filter(Boolean).join(" • "), raw: offering };
  }).filter((item) => item.id);
};

const GRADE_FIELDS = ["final", "activities", "projects", "assignments", "quizzes"];
const PAYLOAD_FIELDS = ["subjectOfferingId", ...GRADE_FIELDS, "projectsCount", "assignmentsCount", "quizzesCount", "passingGrade"];
const totalOf = (values) => GRADE_FIELDS.reduce((sum, key) => sum + Number(values?.[key] || 0), 0);
const toForm = (criteria = {}) => ({
  subjectOfferingId: getCriteriaOfferingId(criteria),
  final: numberOrZero(criteria?.final), activities: numberOrZero(criteria?.activities), projects: numberOrZero(criteria?.projects), projectsCount: numberOrZero(criteria?.projectsCount),
  assignments: numberOrZero(criteria?.assignments), assignmentsCount: numberOrZero(criteria?.assignmentsCount), quizzes: numberOrZero(criteria?.quizzes), quizzesCount: numberOrZero(criteria?.quizzesCount),
  passingGrade: criteria?.passingGrade === undefined || criteria?.passingGrade === null ? 50 : numberOrZero(criteria?.passingGrade),
});
const normalizePayload = (values = {}) => ({
  subjectOfferingId: idOf(values.subjectOfferingId),
  final: numberOrZero(values.final), assignments: numberOrZero(values.assignments), assignmentsCount: numberOrZero(values.assignmentsCount), activities: numberOrZero(values.activities),
  projects: numberOrZero(values.projects), projectsCount: numberOrZero(values.projectsCount), quizzes: numberOrZero(values.quizzes), quizzesCount: numberOrZero(values.quizzesCount), passingGrade: numberOrZero(values.passingGrade),
});
const samePayload = (a, b) => PAYLOAD_FIELDS.every((key) => String(a?.[key] ?? "") === String(b?.[key] ?? ""));

const FORM_CARD_SX = {
  p: { xs: 1.35, md: 1.8 }, mt: 1.15, border: "1px solid rgba(36,74,112,0.075)", borderRadius: "20px",
  background: "linear-gradient(180deg, rgba(255,252,247,0.98), rgba(255,255,255,0.96))", boxShadow: "0 12px 30px rgba(18,47,77,0.055)",
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": { minHeight: 54, backgroundColor: "#fff", borderRadius: "14px", fontSize: "13px" },
};
const SectionHeading = ({ icon, title, description, endContent }) => (
  <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1} sx={{ pb: 1.2, mb: 1.35, borderBottom: "1px solid rgba(36,74,112,0.065)" }}>
    <Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", color: "var(--color-gold-dark)", backgroundColor: "var(--color-gold-soft)", borderRadius: "13px" }}>{icon}</Box><Box><Typography sx={{ color: "var(--color-navy-deep)", fontSize: { xs: 15, md: 17 }, fontWeight: 900 }}>{title}</Typography><Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10.5 }}>{description}</Typography></Box></Stack>{endContent}
  </Stack>
);
const GradeInputs = ({ register, errors, defaults }) => {
  const fields = [
    ["passingGrade", "درجة النجاح", 50, 0, 100], ["final", "درجة الاختبار النهائي", 0, 0, 100], ["activities", "درجة أعمال السنة", 0, 0, 100],
    ["projects", "درجة المهام الأدائية", 0, 0, 100], ["projectsCount", "عدد المهام الأدائية", 0, 0, undefined], ["assignments", "درجة الواجبات", 0, 0, 100],
    ["assignmentsCount", "عدد الواجبات", 0, 0, undefined], ["quizzes", "درجة الاختبارات القصيرة", 0, 0, 100], ["quizzesCount", "عدد الاختبارات القصيرة", 0, 0, undefined],
  ];
  return <Grid container spacing={{ xs: 1.5, md: 2 }}>{fields.map(([name, label, fallback, min, max]) => <Grid item xs={12} sm={6} lg={4} key={name}><Input register={register} registerName={name} error={errors?.[name]?.message} label={label} type="number" defaultValue={defaults?.[name] ?? fallback} valueAsNumber inputProps={{ min, ...(max !== undefined ? { max } : {}), step: 1 }} /></Grid>)}</Grid>;
};

const Edit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { gradesCriteria, loading: criteriaLoading } = useGradesCriteria(id);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({ defaultValues: toForm() });
  const [defaultValues, setDefaultValues] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { register("subjectOfferingId", { required: "اختر عرض المادة" }); }, [register]);

  useEffect(() => {
    if (!gradesCriteria) return;
    const normalized = toForm(gradesCriteria);
    reset(normalized);
    setDefaultValues(normalized);
  }, [gradesCriteria, reset]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOfferings(true);
      try {
        const loaded = await loadOfferingCatalog();
        if (!active) return;
        const currentId = getCriteriaOfferingId(gradesCriteria);
        if (currentId && !loaded.some((item) => item.id === currentId)) {
          const offering = gradesCriteria?.subjectOffering || (gradesCriteria?.subjectOfferingId && typeof gradesCriteria.subjectOfferingId === "object" ? gradesCriteria.subjectOfferingId : null);
          loaded.unshift({ id: currentId, label: offering ? `${labelOfSubject(offering?.subjectId || {})} • ${labelOfGrade(offering?.gradeLevelId || {})} • ${labelOfTerm(offering?.termId || {})}` : `عرض المادة ${currentId.slice(-6)}` });
        }
        setOfferings(loaded);
      } catch (error) {
        if (active) setOfferingsError(error?.response?.data?.message || error?.message || "تعذر تحميل عروض المواد");
      } finally {
        if (active) setLoadingOfferings(false);
      }
    })();
    return () => { active = false; };
  }, [gradesCriteria]);

  const values = watch();
  const totalGrades = useMemo(() => totalOf(values), [values]);
  const isTotalValid = totalGrades === 100;
  const selectedOfferingId = idOf(watch("subjectOfferingId"));

  const onSubmit = async (formData) => {
    const payload = normalizePayload(formData);
    if (!payload.subjectOfferingId) return toast.error("اختر عرض المادة");
    if (!isTotalValid) return toast.error("يجب أن يكون مجموع الدرجات 100 درجة");
    if (payload.passingGrade < 0 || payload.passingGrade > 100) return toast.error("درجة النجاح يجب أن تكون من 0 إلى 100");

    if (defaultValues && payload.subjectOfferingId !== idOf(defaultValues.subjectOfferingId)) {
      const response = await fetchGradesCriteria({ subjectOfferingId: payload.subjectOfferingId, page: 1, limit: 1000 });
      const duplicate = extractList(response).find((item) => getCriteriaOfferingId(item) === payload.subjectOfferingId && idOf(item) !== id);
      if (duplicate) return toast.info("يوجد توزيع درجات لهذا العرض بالفعل");
    }

    if (defaultValues && samePayload(payload, normalizePayload(defaultValues))) return toast.info("لم تحدث أي بيانات للتعديل");

    setLoading(true);
    try {
      const response = await editGradesCriteria(payload, id);
      if (!response?.status) return toast.error(getErrorMessage(response, "حدث خطأ أثناء تعديل توزيع الدرجات"));
      toast.success("تم تعديل توزيع الدرجات بنجاح");
      navigate(`/school/gradesCriteria/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (criteriaLoading || !defaultValues) return <Loading />;

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate dir="rtl" sx={{ width: "100%", pb: 3 }}>
        <Paper elevation={0} sx={{ ...FORM_CARD_SX, mt: 0 }}><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}><Back title="تعديل توزيع الدرجات" /><Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>التوزيع مرتبط بعرض مادة محدد بالصف والترم.</Typography></Stack></Paper>
        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<SchoolRounded />} title="عرض المادة" description="يمكن تغيير العرض إذا لم يكن له توزيع درجات آخر." />
          <TextField select fullWidth label="المادة / الصف / الترم / السنة" value={selectedOfferingId} onChange={(e) => setValue("subjectOfferingId", e.target.value, { shouldDirty: true, shouldValidate: true })} disabled={loadingOfferings || !offerings.length} error={Boolean(errors.subjectOfferingId)} helperText={errors.subjectOfferingId?.message || (loadingOfferings ? "جاري تحميل عروض المواد..." : `${offerings.length} عرض متاح`)}>
            <MenuItem value="">اختر عرض المادة</MenuItem>{offerings.map((item) => <MenuItem value={item.id} key={item.id}>{item.label}</MenuItem>)}
          </TextField>
          {offeringsError && <Alert severity="warning" sx={{ mt: 1 }}>{offeringsError}</Alert>}
        </Paper>
        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<AssessmentRounded />} title="تفاصيل توزيع الدرجات" description="القيم الصفرية مسموحة، لكن مجموع أوزان الدرجات يجب أن يساوي 100." endContent={<Chip label={`${totalGrades} / 100`} sx={{ fontWeight: 800, color: isTotalValid ? "#237449" : "var(--color-danger)" }} />} />
          <GradeInputs register={register} errors={errors} defaults={defaultValues} />
        </Paper>
        <Paper elevation={0} sx={{ ...FORM_CARD_SX, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} disabled={loading || !selectedOfferingId || !isTotalValid}>حفظ التعديلات</Button>
          <Button type="button" variant="outlined" startIcon={<CloseRounded />} onClick={() => navigate(`/school/gradesCriteria/${id}`)} disabled={loading}>إلغاء</Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Edit;
