import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AssessmentRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
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
import { fetchSubjectOfferings } from "@/APIs/school/subjectOfferings";
import { fetchTermsByAcademicYear } from "@/APIs/school/terms";
import {
  addGradesCriteria,
  bulkAddGradesCriteria,
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
  /*
   * The deployed backend does NOT expose GET /subject-offerings.
   * Offerings are listed by term through:
   *   GET /subject-offerings/by-term/:termId
   *
   * Build the catalog from academic years -> terms -> offerings so the
   * grading criteria screen only uses endpoints that actually exist.
   */
  const [subjectsRes, gradesRes, yearsRes] = await Promise.all([
    api
      .get("/subjects/list")
      .catch(() => api.get("/subjects", { params: { page: 1, limit: 1000 } })),
    api.get("/grade-levels", { params: { page: 1, limit: 1000 } }),
    api.get("/academic-years"),
  ]);

  const subjects = extractList(subjectsRes);
  const grades = extractList(gradesRes);
  const years = extractList(yearsRes);

  const subjectMap = mapById(subjects);
  const gradeMap = mapById(grades);
  const yearMap = mapById(years);

  const termGroups = await Promise.all(
    years.map(async (year) => {
      const yearId = idOf(year);
      if (!yearId) return [];

      const response = await fetchTermsByAcademicYear(yearId);
      if (response?.status === false) return [];

      return extractList(response).map((term) => ({
        ...term,
        __academicYearId: yearId,
      }));
    })
  );

  const terms = termGroups.flat();
  const termMap = mapById(terms);

  const offeringGroups = await Promise.all(
    terms.map(async (term) => {
      const termId = idOf(term);
      if (!termId) return [];

      const response = await fetchSubjectOfferings({ termId });
      if (response?.status === false) return [];

      return extractList(response).map((offering) => ({
        ...offering,
        __termId: termId,
      }));
    })
  );

  const seen = new Set();
  const rawOfferings = offeringGroups
    .flat()
    .filter((offering) => {
      const offeringId = idOf(offering);
      if (!offeringId || seen.has(offeringId)) return false;
      seen.add(offeringId);
      return true;
    });

  return rawOfferings
    .map((offering) => {
      const id = idOf(offering);
      const subjectValue = offering?.subjectId || offering?.subject;
      const gradeValue = offering?.gradeLevelId || offering?.gradeLevel;
      const termValue = offering?.termId || offering?.term || offering?.__termId;

      const subject =
        (subjectValue && typeof subjectValue === "object" ? subjectValue : null) ||
        subjectMap.get(idOf(subjectValue));

      const grade =
        (gradeValue && typeof gradeValue === "object" ? gradeValue : null) ||
        gradeMap.get(idOf(gradeValue));

      const term =
        (termValue && typeof termValue === "object" ? termValue : null) ||
        termMap.get(idOf(termValue));

      const yearValue =
        term?.academicYearId ||
        term?.__academicYearId ||
        offering?.academicYearId;

      const year =
        (yearValue && typeof yearValue === "object" ? yearValue : null) ||
        yearMap.get(idOf(yearValue));

      const parts = [
        labelOfSubject(subject || {}),
        labelOfGrade(grade || {}),
        labelOfTerm(term || {}),
        labelOfYear(year || {}),
      ].filter(Boolean);

      return {
        id,
        label: parts.join(" • "),
        gradeLabel: labelOfGrade(grade || {}),
        gradeOrder: Number(grade?.order ?? 999),
        raw: offering,
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => a.gradeOrder - b.gradeOrder || a.label.localeCompare(b.label, "ar"));
};

// Which offerings already have a distribution: those cannot take a second one.
const loadCoveredOfferingIds = async () => {
  const response = await fetchGradesCriteria({ page: 1, limit: 1000 });
  return new Set(extractList(response).map(getCriteriaOfferingId).filter(Boolean));
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
    ["activities", "درجة الأنشطة", 0, 0, 100],
    ["projects", "درجة المشاريع", 0, 0, 100],
    ["projectsCount", "عدد المشاريع", 0, 0, undefined],
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
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      passingGrade: 50, final: 100, activities: 0, projects: 0, projectsCount: 0,
      assignments: 0, assignmentsCount: 0, quizzes: 0, quizzesCount: 0,
    },
  });

  const [offerings, setOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState("");
  const [covered, setCovered] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(() => {
    const preset = searchParams.get("subjectOfferingId");
    return preset ? [preset] : [];
  });
  const [loading, setLoading] = useState(false);

  const values = watch();
  const totalGrades = useMemo(() => totalOf(values), [values]);
  const isTotalValid = totalGrades === 100;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOfferings(true);
      setOfferingsError("");
      try {
        const [loaded, coveredIds] = await Promise.all([
          loadOfferingCatalog(),
          loadCoveredOfferingIds().catch(() => new Set()),
        ]);
        if (!active) return;
        setOfferings(loaded);
        setCovered(coveredIds);
        setSelectedIds((previous) => previous.filter((id) => !coveredIds.has(id)));
        if (searchParams.get("missing") === "1") {
          setSelectedIds(loaded.filter((item) => !coveredIds.has(item.id)).map((item) => item.id));
        }
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

  const missing = useMemo(() => offerings.filter((item) => !covered.has(item.id)), [offerings, covered]);
  const selected = useMemo(() => {
    const chosen = new Set(selectedIds);
    return offerings.filter((item) => chosen.has(item.id));
  }, [offerings, selectedIds]);

  const toggleGrade = (gradeLabel) => {
    const ids = missing.filter((item) => item.gradeLabel === gradeLabel).map((item) => item.id);
    const allIn = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((previous) =>
      allIn ? previous.filter((id) => !ids.includes(id)) : [...new Set([...previous, ...ids])]
    );
  };

  const missingGrades = useMemo(() => {
    const counts = new Map();
    missing.forEach((item) => counts.set(item.gradeLabel, (counts.get(item.gradeLabel) || 0) + 1));
    return Array.from(counts.entries());
  }, [missing]);

  const onSubmit = async (formData) => {
    if (!selectedIds.length) return toast.error("اختر مادة واحدة على الأقل");
    if (!isTotalValid) return toast.error("يجب أن يكون مجموع الدرجات 100 درجة");

    const passingGrade = numberOrZero(formData.passingGrade);
    if (passingGrade < 0 || passingGrade > 100) return toast.error("درجة النجاح يجب أن تكون من 0 إلى 100");

    const weights = {
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
      if (selectedIds.length > 1) {
        const response = await bulkAddGradesCriteria({ ...weights, subjectOfferingIds: selectedIds });
        if (response?.status === false) {
          toast.error(getErrorMessage(response, "حدث خطأ أثناء إضافة توزيعات الدرجات"));
          return;
        }
        const result = unwrap(response) || {};
        toast.success(`تم توزيع الدرجات على ${result.created ?? selectedIds.length} مادة`);
        if (result.alreadyHad) toast.info(`${result.alreadyHad} مادة لديها توزيع سابق ولم يتغير`);
        navigate("/school/gradesCriteria");
        return;
      }

      const response = await addGradesCriteria({ ...weights, subjectOfferingId: selectedIds[0] });
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
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>اختر المواد، ثم وزّع 100 درجة.</Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<SchoolRounded />} title="المواد" description="اختر مادة أو أكثر؛ يُطبّق التوزيع نفسه على كل مادة مختارة، ويمكن تعديل أي مادة لاحقًا بمفردها." />
          {!loadingOfferings && offerings.length > 0 && (
            <Alert severity={missing.length ? "warning" : "success"} sx={{ mb: 1.5 }}
              action={missing.length > 0 && (
                <Button color="inherit" size="small" sx={{ fontWeight: 800 }}
                  onClick={() => setSelectedIds(missing.map((item) => item.id))}>
                  اختيار الكل ({missing.length})
                </Button>
              )}>
              {missing.length
                ? `${missing.length} من أصل ${offerings.length} مادة بدون توزيع درجات، ولا يستطيع المعلمون إنشاء اختبارات لها.`
                : "جميع المواد لديها توزيع درجات."}
            </Alert>
          )}

          {missingGrades.length > 1 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
              {missingGrades.map(([gradeLabel, count]) => {
                const ids = missing.filter((item) => item.gradeLabel === gradeLabel).map((item) => item.id);
                const allIn = ids.every((id) => selectedIds.includes(id));
                return (
                  <Chip key={gradeLabel} clickable onClick={() => toggleGrade(gradeLabel)}
                    label={`${gradeLabel} (${count})`} color={allIn ? "primary" : "default"}
                    variant={allIn ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />
                );
              })}
            </Stack>
          )}

          <Autocomplete multiple disableCloseOnSelect options={offerings} value={selected}
            onChange={(_, value) => setSelectedIds(value.map((item) => item.id))}
            groupBy={(option) => option.gradeLabel}
            getOptionLabel={(option) => option.label}
            getOptionDisabled={(option) => covered.has(option.id)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loadingOfferings || !offerings.length}
            limitTags={6}
            noOptionsText="لا توجد مواد"
            renderOption={(props, option, { selected: isSelected }) => (
              <li {...props} key={option.id}>
                <Checkbox icon={<CheckBoxOutlineBlankRounded fontSize="small" />} checkedIcon={<CheckBoxRounded fontSize="small" />}
                  checked={isSelected} sx={{ ml: 1 }} />
                {option.label}
                {covered.has(option.id) && <Chip size="small" label="لديها توزيع" sx={{ mr: 1, fontSize: 10 }} />}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="المواد"
                placeholder={selected.length ? "" : "اختر مادة أو أكثر"}
                helperText={loadingOfferings ? "جاري تحميل عروض المواد..." : `تم اختيار ${selected.length} مادة — سيُطبّق التوزيع نفسه على جميع المواد المختارة`} />
            )} />
          {selected.length > 0 && (
            <Button size="small" onClick={() => setSelectedIds([])} sx={{ mt: 0.5 }}>مسح الاختيار</Button>
          )}
          {loadingOfferings && <Stack direction="row" gap={1} mt={1}><CircularProgress size={15} /><Typography sx={{ fontSize: 10 }}>جاري التحميل...</Typography></Stack>}
          {offeringsError && <Alert severity="warning" sx={{ mt: 1 }}>{offeringsError}</Alert>}
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading icon={<AssessmentRounded />} title="تفاصيل توزيع الدرجات" description="القيم الصفرية مسموحة، لكن مجموع أوزان الدرجات يجب أن يساوي 100."
            endContent={<Chip label={`${totalGrades} / 100`} sx={{ fontWeight: 800, color: isTotalValid ? "#237449" : "var(--color-danger)" }} />} />
          <GradeInputs register={register} errors={errors} />
          {Number(values?.quizzes || 0) === 0 && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              درجة الاختبارات القصيرة صفر، لذلك لن يتمكن المعلمون من إنشاء «اختبار قصير» لهذه المواد.
            </Alert>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...FORM_CARD_SX, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} disabled={loading || !selectedIds.length || !isTotalValid}>
            {selectedIds.length > 1 ? `حفظ التوزيع لـ ${selectedIds.length} مادة` : "حفظ التوزيع"}
          </Button>
          <Button type="button" variant="outlined" startIcon={<CloseRounded />} onClick={() => navigate("/school/gradesCriteria")} disabled={loading}>إلغاء</Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Add;
