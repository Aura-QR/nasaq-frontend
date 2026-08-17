import {
  AddRounded,
  CalendarMonthRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  MenuBookRounded,
  RefreshRounded,
  SchoolRounded,
  SearchOffRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";

import { api } from "@/APIs/Axios";
import {
  addSubjectOffering,
  copySubjectOfferingsFromYear,
  deleteSubjectOffering,
  fetchSubjectOfferings,
} from "@/APIs/school/subjectOfferings";

const COLORS = {
  navy: "#122f4d",
  navy2: "#244a70",
  gold: "#b78430",
  goldSoft: "#fbf0d8",
  page: "#ffffff",
  border: "#e1e6eb",
  muted: "#778491",
  green: "#16865f",
  red: "#d14343",
};

const idOf = (value) =>
  String(value?._id || value?.id || value || "").trim();

const unwrap = (value) => {
  let current = value;

  for (let index = 0; index < 5; index += 1) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !("data" in current)
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

const LIST_KEYS = [
  "items",
  "results",
  "docs",
  "rows",
  "records",
  "academicYears",
  "years",
  "terms",
  "subjects",
  "gradeLevels",
  "grades",
  "offerings",
  "subjectOfferings",
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

const extractEntity = (value) => {
  const root = unwrap(value);

  if (!root || Array.isArray(root) || typeof root !== "object") {
    return null;
  }

  const candidates = [
    root.academicYear,
    root.year,
    root.term,
    root.subject,
    root.gradeLevel,
    root,
  ];

  return (
    candidates.find(
      (item) => item && typeof item === "object" && idOf(item)
    ) || null
  );
};

const getMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const labelOfSubject = (subject) => {
  const name =
    subject?.subjectName ||
    subject?.name ||
    subject?.title ||
    "مادة غير معروفة";
  const code = subject?.subjectCode || subject?.code || "";

  return code ? `${name} - ${code}` : name;
};

const labelOfGrade = (grade) =>
  grade?.name ||
  grade?.gradeName ||
  grade?.title ||
  "صف غير معروف";

const labelOfTerm = (term) =>
  term?.name || term?.termName || term?.title || "ترم غير معروف";

const normalizeCollection = (items, labelGetter) =>
  items
    .map((item) => ({
      ...item,
      _id: idOf(item),
      label: labelGetter(item),
    }))
    .filter((item) => item._id);

const fetchWithFallback = async (requests, fallbackMessage) => {
  let lastError;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (![400, 404, 405].includes(error?.response?.status)) {
        throw error;
      }
    }
  }

  throw new Error(getMessage(lastError, fallbackMessage));
};

const StatCard = ({ icon, label, value, helper, tone = "blue" }) => {
  const toneMap = {
    blue: { color: COLORS.navy2, bg: "#edf3f8" },
    gold: { color: COLORS.gold, bg: COLORS.goldSoft },
    green: { color: COLORS.green, bg: "#e9f6f0" },
  };
  const selected = toneMap[tone] || toneMap.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 78,
        px: 1.6,
        py: 1.25,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "12px",
          display: "grid",
          placeItems: "center",
          color: selected.color,
          bgcolor: selected.bg,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: COLORS.muted,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            color: COLORS.navy,
            fontWeight: 900,
            fontSize: 23,
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            color: "#9ba5af",
            fontSize: 9.5,
            mt: 0.15,
          }}
        >
          {helper}
        </Typography>
      </Box>
    </Paper>
  );
};

const SubjectOfferingDialog = ({
  open,
  loading,
  subjects,
  gradeLevels,
  terms,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    subjectId: "",
    gradeLevelId: "",
    termId: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      subjectId: initialValues?.subjectId || "",
      gradeLevelId: initialValues?.gradeLevelId || "",
      termId: initialValues?.termId || "",
    });
  }, [open, initialValues]);

  const valid =
    Boolean(form.subjectId) &&
    Boolean(form.gradeLevelId) &&
    Boolean(form.termId);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "18px",
          overflow: "hidden",
          direction: "rtl",
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 2.8, pb: 0.6 }}>
        <Typography
          component="div"
          sx={{
            fontSize: 22,
            fontWeight: 900,
            color: "#111",
          }}
        >
          إضافة عرض مادة
        </Typography>
        <Typography
          component="div"
          sx={{ color: "#555", fontSize: 14, mt: 0.6 }}
        >
          اربط مادة بصف دراسي وترم معين
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: "18px !important", pb: 1 }}>
        <Stack spacing={2.1}>
          <FormControl fullWidth>
            <InputLabel id="offering-subject-label">المادة</InputLabel>
            <Select
              labelId="offering-subject-label"
              value={form.subjectId}
              label="المادة"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subjectId: event.target.value,
                }))
              }
              sx={{ borderRadius: "12px" }}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="offering-grade-label">
              الصف الدراسي
            </InputLabel>
            <Select
              labelId="offering-grade-label"
              value={form.gradeLevelId}
              label="الصف الدراسي"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gradeLevelId: event.target.value,
                }))
              }
              sx={{ borderRadius: "12px" }}
            >
              {gradeLevels.map((grade) => (
                <MenuItem key={grade._id} value={grade._id}>
                  {grade.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="offering-term-label">الترم</InputLabel>
            <Select
              labelId="offering-term-label"
              value={form.termId}
              label="الترم"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  termId: event.target.value,
                }))
              }
              sx={{ borderRadius: "12px" }}
            >
              {terms.map((term) => (
                <MenuItem key={term._id} value={term._id}>
                  {term.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pt: 1.6,
          pb: 2.8,
          gap: 1,
          justifyContent: "flex-start",
        }}
      >
        <Button
          onClick={() => onSubmit(form)}
          disabled={!valid || loading}
          variant="contained"
          sx={{
            minWidth: 150,
            minHeight: 48,
            borderRadius: "12px",
            bgcolor: "#111",
            fontWeight: 800,
            "&:hover": { bgcolor: "#222" },
          }}
        >
          {loading ? (
            <CircularProgress size={21} color="inherit" />
          ) : (
            "إنشاء العرض"
          )}
        </Button>

        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: 88,
            minHeight: 48,
            borderRadius: "12px",
            borderColor: "#d5d8dc",
            color: "#222",
            fontWeight: 700,
          }}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SubjectOfferings = () => {
  const navigate = useNavigate();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const [academicYears, setAcademicYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [terms, setTerms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [offerings, setOfferings] = useState([]);

  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [search, setSearch] = useState("");

  const subjectMap = useMemo(
    () => new Map(subjects.map((item) => [item._id, item])),
    [subjects]
  );
  const gradeMap = useMemo(
    () => new Map(gradeLevels.map((item) => [item._id, item])),
    [gradeLevels]
  );
  const termMap = useMemo(
    () => new Map(terms.map((item) => [item._id, item])),
    [terms]
  );

  const fetchTermsForYear = useCallback(async (yearId) => {
    if (!yearId) return [];

    const response = await fetchWithFallback(
      [
        () => api.get(`/terms/by-year/${yearId}`),
        () => api.get("/terms", { params: { academicYearId: yearId } }),
      ],
      "تعذر تحميل الترمات"
    );

    return normalizeCollection(
      extractList(response?.data),
      labelOfTerm
    ).sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
  }, []);

  const loadTerms = useCallback(async (yearId) => {
    if (!yearId) {
      setTerms([]);
      setSelectedTermId("");
      return [];
    }

    const normalized = await fetchTermsForYear(yearId);

    setTerms(normalized);

    const activeTerm =
      normalized.find((item) => item?.status === "active") ||
      normalized[0] ||
      null;

    setSelectedTermId((current) =>
      normalized.some((item) => item._id === current)
        ? current
        : activeTerm?._id || ""
    );

    return normalized;
  }, [fetchTermsForYear]);

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    setError("");

    try {
      const [yearsResponse, activeResponse, subjectsResponse, gradesResponse] =
        await Promise.all([
          api.get("/academic-years"),
          api.get("/academic-years/active").catch(() => null),
          fetchWithFallback(
            [
              () => api.get("/subjects/list"),
              () => api.get("/subjects", { params: { page: 1, limit: 500 } }),
            ],
            "تعذر تحميل المواد"
          ),
          api.get("/grade-levels", { params: { page: 1, limit: 500 } }),
        ]);

      const years = normalizeCollection(
        extractList(yearsResponse?.data),
        (item) => item?.name || "سنة دراسية"
      );
      const loadedSubjects = normalizeCollection(
        extractList(subjectsResponse?.data),
        labelOfSubject
      );
      const loadedGrades = normalizeCollection(
        extractList(gradesResponse?.data),
        labelOfGrade
      ).sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));

      const activeFromEndpoint = activeResponse
        ? extractEntity(activeResponse?.data)
        : null;
      const active =
        activeFromEndpoint ||
        years.find((item) => item?.status === "active") ||
        years[0] ||
        null;

      setAcademicYears(years);
      setActiveYear(active);
      setSubjects(loadedSubjects);
      setGradeLevels(loadedGrades);
      setSelectedYearId(active?._id || "");

      if (active?._id) {
        await loadTerms(active._id);
      }
    } catch (requestError) {
      const message = getMessage(requestError, "تعذر تحميل بيانات عروض المواد");
      setError(message);
      toast.error(message);
    } finally {
      setLoadingInitial(false);
    }
  }, [loadTerms]);

  const loadOfferings = useCallback(async () => {
    if (!selectedTermId) {
      setOfferings([]);
      return;
    }

    setLoadingOfferings(true);
    setError("");

    const result = await fetchSubjectOfferings({
      termId: selectedTermId,
      gradeLevelId: selectedGradeId || undefined,
    });

    if (result?.status === false) {
      setOfferings([]);
      setError(result?.message || "تعذر تحميل عروض المواد");
      setLoadingOfferings(false);
      return;
    }

    setOfferings(extractList(result?.data));
    setLoadingOfferings(false);
  }, [selectedGradeId, selectedTermId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (loadingInitial) return;
    loadOfferings();
  }, [loadingInitial, loadOfferings]);

  const normalizedOfferings = useMemo(
    () =>
      offerings
        .map((item) => {
          const subjectValue = item?.subjectId || item?.subject;
          const gradeValue = item?.gradeLevelId || item?.gradeLevel;
          const termValue = item?.termId || item?.term;

          const subjectId = idOf(subjectValue);
          const gradeLevelId = idOf(gradeValue);
          const termId = idOf(termValue);

          const subject =
            (subjectValue && typeof subjectValue === "object"
              ? subjectValue
              : null) || subjectMap.get(subjectId);
          const grade =
            (gradeValue && typeof gradeValue === "object"
              ? gradeValue
              : null) || gradeMap.get(gradeLevelId);
          const term =
            (termValue && typeof termValue === "object"
              ? termValue
              : null) || termMap.get(termId);

          return {
            raw: item,
            id: idOf(item),
            subjectId,
            gradeLevelId,
            termId,
            subjectLabel: labelOfSubject(subject || {}),
            subjectCode:
              subject?.subjectCode || subject?.code || item?.subjectCode || "",
            gradeLabel: labelOfGrade(grade || {}),
            termLabel: labelOfTerm(term || {}),
          };
        })
        .filter((item) => item.id),
    [gradeMap, offerings, subjectMap, termMap]
  );

  const visibleOfferings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return normalizedOfferings.filter((item) => {
      if (
        selectedGradeId &&
        item.gradeLevelId &&
        item.gradeLevelId !== selectedGradeId
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      return [
        item.subjectLabel,
        item.subjectCode,
        item.gradeLabel,
        item.termLabel,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [normalizedOfferings, search, selectedGradeId]);

  const statistics = useMemo(
    () => ({
      total: normalizedOfferings.length,
      subjects: new Set(
        normalizedOfferings.map((item) => item.subjectId).filter(Boolean)
      ).size,
      grades: new Set(
        normalizedOfferings.map((item) => item.gradeLevelId).filter(Boolean)
      ).size,
    }),
    [normalizedOfferings]
  );

  const changeYear = async (yearId) => {
    setSelectedYearId(yearId);
    const selected = academicYears.find((item) => item._id === yearId) || null;
    setActiveYear(selected);
    setSelectedGradeId("");
    setOfferings([]);

    try {
      await loadTerms(yearId);
    } catch (requestError) {
      const message = getMessage(requestError, "تعذر تحميل ترمات السنة");
      setError(message);
      toast.error(message);
    }
  };

  const createOffering = async (form) => {
    const moveListToOffering = async () => {
      const filtersChanged =
        form.termId !== selectedTermId ||
        form.gradeLevelId !== selectedGradeId;

      setDialogOpen(false);
      setSearch("");
      setSelectedTermId(form.termId);
      setSelectedGradeId(form.gradeLevelId);

      /*
       * لو الفلاتر اتغيرت، useEffect الخاص بـ loadOfferings
       * هيعمل fetch جديد بعد تحديث الـstate.
       * لو هي نفس الفلاتر، نعمل refresh يدوي فورًا.
       */
      if (!filtersChanged) {
        await loadOfferings();
      }
    };

    const duplicate = normalizedOfferings.some(
      (item) =>
        item.subjectId === form.subjectId &&
        item.gradeLevelId === form.gradeLevelId &&
        item.termId === form.termId
    );

    if (duplicate) {
      toast.info("هذا العرض موجود بالفعل؛ تم فتح مكانه في القائمة");
      await moveListToOffering();
      return;
    }

    setSaving(true);

    try {
      const result = await addSubjectOffering(form);

      if (result?.status === false) {
        const message =
          result?.message ||
          "تعذر إنشاء عرض المادة";

        const isDuplicate =
          /already exists|duplicate|موجود بالفعل/i.test(
            String(message)
          );

        if (isDuplicate) {
          toast.info(
            "عرض المادة موجود بالفعل؛ تم فتح الترم والصف الخاصين به"
          );
          await moveListToOffering();
          return;
        }

        toast.error(message);
        return;
      }

      toast.success("تم إنشاء عرض المادة بنجاح");
      await moveListToOffering();
    } catch (requestError) {
      const message = getMessage(
        requestError,
        "تعذر إنشاء عرض المادة"
      );

      const isDuplicate =
        /already exists|duplicate|موجود بالفعل/i.test(
          String(message)
        );

      if (isDuplicate) {
        toast.info(
          "عرض المادة موجود بالفعل؛ تم فتح الترم والصف الخاصين به"
        );
        await moveListToOffering();
        return;
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const removeOffering = async (item) => {
    const confirmed = window.confirm(
      `هل تريد حذف عرض ${item.subjectLabel} للصف ${item.gradeLabel}؟`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    const result = await deleteSubjectOffering(item.id);
    setDeletingId("");

    if (result?.status === false) {
      toast.error(result?.message || "تعذر حذف عرض المادة");
      return;
    }

    toast.success("تم حذف عرض المادة");
    setOfferings((current) =>
      current.filter((offering) => idOf(offering) !== item.id)
    );
  };

  const copyFromPreviousYear = async () => {
    if (!selectedYearId || academicYears.length < 2) {
      toast.info("لا توجد سنة سابقة متاحة للنسخ");
      return;
    }

    const currentIndex = academicYears.findIndex(
      (item) => item._id === selectedYearId
    );
    const source =
      academicYears[currentIndex + 1] ||
      academicYears.find((item) => item._id !== selectedYearId);

    if (!source?._id || source._id === selectedYearId) {
      toast.info("لا توجد سنة سابقة متاحة للنسخ");
      return;
    }

    let sourceTerms = [];

    try {
      sourceTerms = await fetchTermsForYear(source._id);
    } catch (requestError) {
      toast.error(getMessage(requestError, "تعذر التحقق من ترمات السنة السابقة"));
      return;
    }

    // لا يمكن إنشاء ترمات السنة الجديدة تلقائيًا إذا كانت السنة المصدر نفسها
    // لا تحتوي على ترمات يمكن نسخ هيكلها.
    if (!sourceTerms.length) {
      toast.error(
        `السنة المصدر ${source.label} لا تحتوي على ترمات، لذلك لا يمكن نسخ هيكل الترمات منها.`
      );
      return;
    }

    const targetHasTerms = terms.length > 0;
    const confirmMessage = targetHasTerms
      ? `نسخ عروض المواد من ${source.label} إلى ${activeYear?.label || "السنة الحالية"}؟`
      : `السنة ${activeYear?.label || "الحالية"} لا تحتوي على ترمات. سيتم أولًا نسخ الترمات من ${source.label} ثم نسخ عروض المواد. هل تريد المتابعة؟`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      let targetTerms = terms;

      // لو السنة المستهدفة بدون ترمات، نستخدم endpoint الباك المخصص لنسخ
      // أسماء وهيكل الترمات من السنة السابقة بدل إنشاء تواريخ ثابتة من الفرونت.
      if (!targetHasTerms) {
        toast.info("جاري نسخ ترمات السنة السابقة...");

        await api.post(
          `/terms/copy-from/${selectedYearId}/${source._id}`,
          {}
        );

        targetTerms = await fetchTermsForYear(selectedYearId);

        if (!targetTerms.length) {
          throw new Error("تم طلب نسخ الترمات لكن لم يتم العثور على ترمات في السنة المستهدفة");
        }

        setTerms(targetTerms);

        const activeTargetTerm =
          targetTerms.find((item) => item?.status === "active") ||
          targetTerms[0];

        setSelectedTermId(activeTargetTerm?._id || "");
        setSelectedGradeId("");
      }

      const result = await copySubjectOfferingsFromYear(
        selectedYearId,
        source._id
      );

      if (result?.status === false) {
        toast.error(result?.message || "تعذر نسخ عروض المواد");
        return;
      }

      toast.success(
        targetHasTerms
          ? "تم نسخ عروض المواد بنجاح"
          : "تم نسخ الترمات وعروض المواد بنجاح"
      );

      // لو كان هناك ترم محدد من البداية نحدّث القائمة مباشرة.
      // أما لو أنشأنا الترمات الآن فـ setSelectedTermId سيشغّل loadOfferings تلقائيًا.
      if (targetHasTerms) {
        await loadOfferings();
      } else {
        setOfferings([]);
      }
    } catch (requestError) {
      const message = getMessage(
        requestError,
        "تعذر نسخ ترمات أو عروض المواد من السنة السابقة"
      );
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const dialogDefaults = useMemo(
    () => ({
      subjectId: "",
      gradeLevelId: selectedGradeId || "",
      termId: selectedTermId || terms[0]?._id || "",
    }),
    [selectedGradeId, selectedTermId, terms]
  );

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minHeight: "100%",
          bgcolor: COLORS.page,
          py: { xs: 1.5, md: 2.5 },
          px: { xs: 1.2, md: 2.2 },
        }}
      >
      <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: "20px",
            px: { xs: 1.8, md: 2.5 },
            py: { xs: 1.6, md: 2 },
            mb: 1.6,
            bgcolor: "#fff",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Stack direction="row" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "13px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: COLORS.goldSoft,
                  color: COLORS.gold,
                }}
              >
                <MenuBookRounded />
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: COLORS.navy,
                    fontWeight: 900,
                    fontSize: { xs: 22, md: 27 },
                  }}
                >
                  عروض المواد
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 12 }}>
                  اربط مواد المدرسة بالصفوف الدراسية والترم المناسب
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ContentCopyRounded />}
                onClick={copyFromPreviousYear}
                disabled={saving || academicYears.length < 2}
                sx={{
                  borderRadius: "11px",
                  borderColor: "#d7dde3",
                  color: COLORS.navy,
                  fontWeight: 800,
                }}
              >
                نسخ من سنة سابقة
              </Button>

              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => setDialogOpen(true)}
                disabled={!terms.length || !subjects.length || !gradeLevels.length}
                sx={{
                  borderRadius: "11px",
                  bgcolor: COLORS.navy,
                  fontWeight: 800,
                  boxShadow: "none",
                  "&:hover": { bgcolor: COLORS.navy2, boxShadow: "none" },
                }}
              >
                إضافة عرض مادة
              </Button>

              <Tooltip title="رجوع">
                <Button
                  variant="text"
                  onClick={() => navigate(-1)}
                  sx={{ color: COLORS.muted, minWidth: 44 }}
                >
                  رجوع
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {error ? (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={loadInitial}>
                إعادة المحاولة
              </Button>
            }
            sx={{ borderRadius: "13px", mb: 1.5 }}
          >
            {error}
          </Alert>
        ) : null}

        <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<MenuBookRounded />}
              label="إجمالي العروض"
              value={statistics.total}
              helper="العروض المسجلة في الترم المحدد"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<SchoolRounded />}
              label="الصفوف المرتبطة"
              value={statistics.grades}
              helper="صفوف لديها مواد مفعلة"
              tone="green"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              icon={<CalendarMonthRounded />}
              label="المواد المفعلة"
              value={statistics.subjects}
              helper={activeYear?.label || "السنة الدراسية الحالية"}
              tone="gold"
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            mb: 1.5,
          }}
        >
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={4.5}>
              <TextField
                fullWidth
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المادة أو الصف"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: "#8b98a4" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "11px" },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>السنة الدراسية</InputLabel>
                <Select
                  value={selectedYearId}
                  label="السنة الدراسية"
                  onChange={(event) => changeYear(event.target.value)}
                  sx={{ borderRadius: "11px" }}
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2.2}>
              <FormControl fullWidth size="small">
                <InputLabel>الترم</InputLabel>
                <Select
                  value={selectedTermId}
                  label="الترم"
                  onChange={(event) => {
                    setSelectedTermId(event.target.value);
                    setSelectedGradeId("");
                  }}
                  sx={{ borderRadius: "11px" }}
                >
                  {terms.map((term) => (
                    <MenuItem key={term._id} value={term._id}>
                      {term.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2.2}>
              <FormControl fullWidth size="small">
                <InputLabel>الصف الدراسي</InputLabel>
                <Select
                  value={selectedGradeId}
                  label="الصف الدراسي"
                  onChange={(event) => setSelectedGradeId(event.target.value)}
                  sx={{ borderRadius: "11px" }}
                >
                  <MenuItem value="">كل الصفوف</MenuItem>
                  {gradeLevels.map((grade) => (
                    <MenuItem key={grade._id} value={grade._id}>
                      {grade.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={0.6}>
              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    onClick={loadOfferings}
                    disabled={loadingOfferings || !selectedTermId}
                    sx={{
                      width: 40,
                      height: 40,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "11px",
                    }}
                  >
                    <RefreshRounded />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: "18px",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ px: 2, py: 1.6 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Box>
                <Typography
                  sx={{ color: COLORS.navy, fontWeight: 900, fontSize: 17 }}
                >
                  العروض المسجلة
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 10.5 }}>
                  كل عرض يربط مادة واحدة بصف دراسي وترم
                </Typography>
              </Box>

              <Chip
                label={`${visibleOfferings.length} عرض`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: "#eef3f7", color: COLORS.navy }}
              />
            </Stack>
          </Box>

          <Divider />

          {loadingInitial || loadingOfferings ? (
            <Grid container spacing={1.2} sx={{ p: 1.6 }}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} md={6} key={item}>
                  <Skeleton
                    variant="rounded"
                    height={88}
                    sx={{ borderRadius: "14px" }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : !selectedTermId ? (
            <Box sx={{ py: 8, px: 2, textAlign: "center" }}>
              <CalendarMonthRounded sx={{ fontSize: 44, color: "#c2cad1" }} />
              <Typography sx={{ color: COLORS.navy, fontWeight: 900, mt: 1 }}>
                {terms.length
                  ? "اختر ترمًا لعرض المواد"
                  : "لا توجد ترمات مضافة لهذه السنة الدراسية"}
              </Typography>
              {!terms.length ? (
                <Typography sx={{ color: COLORS.muted, fontSize: 11, mt: 0.5 }}>
                  استخدم «نسخ من سنة سابقة» وسيتم نسخ الترمات أولًا تلقائيًا ثم نسخ عروض المواد.
                </Typography>
              ) : null}
            </Box>
          ) : visibleOfferings.length === 0 ? (
            <Box sx={{ py: 8, px: 2, textAlign: "center" }}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  mx: "auto",
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: COLORS.goldSoft,
                  color: COLORS.gold,
                }}
              >
                {search || selectedGradeId ? (
                  <SearchOffRounded />
                ) : (
                  <MenuBookRounded />
                )}
              </Box>
              <Typography
                sx={{ color: COLORS.navy, fontWeight: 900, mt: 1.2, fontSize: 16 }}
              >
                {search || selectedGradeId
                  ? "لا توجد عروض مطابقة"
                  : "لم تتم إضافة عروض مواد لهذا الترم"}
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 11, mt: 0.4 }}>
                أضف المادة وحدد الصف الدراسي والترم لبدء استخدامها في الإسناد والجدول
              </Typography>
              {!search && !selectedGradeId ? (
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() => setDialogOpen(true)}
                  sx={{
                    mt: 1.8,
                    borderRadius: "11px",
                    bgcolor: COLORS.navy,
                    fontWeight: 800,
                    boxShadow: "none",
                  }}
                >
                  إضافة عرض مادة
                </Button>
              ) : null}
            </Box>
          ) : (
            <Grid container spacing={1.2} sx={{ p: 1.6 }}>
              {visibleOfferings.map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      minHeight: 88,
                      p: 1.4,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      transition: "0.18s ease",
                      "&:hover": {
                        borderColor: "#b9c7d3",
                        boxShadow: "0 8px 22px rgba(18,47,77,.055)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: COLORS.goldSoft,
                        color: COLORS.gold,
                        flexShrink: 0,
                      }}
                    >
                      <MenuBookRounded />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          color: COLORS.navy,
                          fontWeight: 900,
                          fontSize: 14,
                        }}
                      >
                        {item.subjectLabel}
                      </Typography>

                      <Stack direction="row" gap={0.7} mt={0.65} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={item.gradeLabel}
                          sx={{ height: 22, fontSize: 9, fontWeight: 700 }}
                        />
                        <Chip
                          size="small"
                          label={item.termLabel}
                          sx={{
                            height: 22,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: "#edf6f2",
                            color: COLORS.green,
                          }}
                        />
                      </Stack>
                    </Box>

                    <Tooltip title="حذف العرض">
                      <span>
                        <IconButton
                          onClick={() => removeOffering(item)}
                          disabled={deletingId === item.id}
                          sx={{
                            color: COLORS.red,
                            bgcolor: "#fff2f2",
                            borderRadius: "10px",
                            "&:hover": { bgcolor: "#ffe7e7" },
                          }}
                        >
                          {deletingId === item.id ? (
                            <CircularProgress size={19} color="inherit" />
                          ) : (
                            <DeleteOutlineRounded />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>

      <SubjectOfferingDialog
        open={dialogOpen}
        loading={saving}
        subjects={subjects}
        gradeLevels={gradeLevels}
        terms={terms}
        initialValues={dialogDefaults}
        onClose={() => setDialogOpen(false)}
        onSubmit={createOffering}
      />
      </Box>
    </Container>
  );
};

export default SubjectOfferings;
