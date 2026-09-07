import {
  AddRounded,
  AutoStoriesRounded,
  CheckRounded,
  ChevronLeftRounded,
  CloseRounded,
  DeleteOutlineRounded,
  EditRounded,
  ExpandMoreRounded,
  InfoOutlined,
  MenuBookRounded,
  RefreshRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  bulkCurriculumLessons,
  createCurriculumUnit,
  deleteCurriculumLesson,
  deleteCurriculumUnit,
  fetchCurriculumLessons,
  fetchCurriculumUnits,
  updateCurriculumLesson,
  updateCurriculumUnit,
} from "@/APIs/school/curriculum";
import { fetchSubjectsList } from "@/APIs/school/subjects";
import { fetchGradeLevels } from "@/APIs/school/gradeLevels";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const getName = (value, fallback = "") =>
  String(
    value?.name ||
      value?.subjectName ||
      value?.lessonName ||
      value?.title ||
      value?.label ||
      fallback
  ).trim();

const unwrap = (value) => {
  let current = value;
  for (let index = 0; index < 4; index += 1) {
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

const extractList = (value) => {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  for (const key of [
    "docs",
    "items",
    "results",
    "subjects",
    "gradeLevels",
    "units",
    "lessons",
  ]) {
    if (Array.isArray(data[key])) return data[key];
  }

  return Object.values(data).find(Array.isArray) || [];
};

const numberFrom = (value, keys) => {
  if (!value || typeof value !== "object") return null;
  for (const key of keys) {
    const current = Number(value[key]);
    if (Number.isFinite(current)) return current;
  }
  return null;
};

const normalizeBulkPreview = (response) => {
  const data = unwrap(response) || {};
  const rows =
    ["results", "items", "rows", "lessons", "preview"]
      .map((key) => data?.[key])
      .find(Array.isArray) || [];

  const items = rows.map((row, index) => {
    if (typeof row === "string") {
      return {
        key: `${index}-${row}`,
        name: row,
        skipped: false,
        reason: "",
      };
    }

    const name = String(
      row?.cleanedName ||
        row?.normalizedName ||
        row?.lessonName ||
        row?.name ||
        row?.title ||
        row?.value ||
        row?.cleaned ||
        ""
    ).trim();

    const status = String(
      row?.status || row?.action || row?.result || ""
    ).toLowerCase();

    const skipped =
      Boolean(row?.duplicate || row?.exists || row?.skipped) ||
      ["duplicate", "exists", "existing", "skip", "skipped"].includes(status);

    return {
      key: normalizeId(row) || `${index}-${name}`,
      name,
      skipped,
      reason: String(
        row?.reason ||
          row?.message ||
          (skipped ? "موجود بالفعل" : "")
      ).trim(),
    };
  });

  const createdFromRows = items.filter((item) => !item.skipped).length;
  const skippedFromRows = items.filter((item) => item.skipped).length;

  const created =
    numberFrom(data, [
      "created",
      "createdCount",
      "toCreate",
      "wouldCreate",
      "written",
      "inserted",
      "added",
    ]) ?? createdFromRows;

  const skipped =
    numberFrom(data, [
      "skipped",
      "skippedCount",
      "duplicates",
      "duplicateCount",
      "existing",
    ]) ?? skippedFromRows;

  return {
    raw: data,
    items,
    created,
    skipped,
  };
};


const normalizeLessonPreviewKey = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/^\s*(?:الدرس\s*)?(?:\(?\d+\)?)[\s.\-–—:،)]*/u, "")
    .replace(/(?:\.{2,}|…+)\s*\d+\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const buildSkippedPreviewItems = (sourceText, existingLessons = []) => {
  const existingKeys = new Set(
    (Array.isArray(existingLessons) ? existingLessons : [])
      .map((lesson) => normalizeLessonPreviewKey(getName(lesson)))
      .filter(Boolean)
  );

  const seenInput = new Set();
  const items = [];

  String(sourceText || "")
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .forEach((name, index) => {
      const key = normalizeLessonPreviewKey(name);
      if (!key) return;

      const alreadyExists = existingKeys.has(key);
      const repeatedInInput = seenInput.has(key);

      if (alreadyExists || repeatedInInput) {
        items.push({
          key: `skipped-${index}-${key}`,
          name,
          skipped: true,
          reason: alreadyExists ? "موجود بالفعل" : "مكرر في النص",
        });
      }

      seenInput.add(key);
    });

  return items;
};

const getLessonCount = (unit, loadedLessons) => {
  if (Array.isArray(loadedLessons)) return loadedLessons.length;

  const serverCount = numberFrom(unit, [
    "lessonCount",
    "lessonsCount",
    "totalLessons",
    "lessonsTotal",
  ]);

  return serverCount;
};

const InlineNameEditor = ({
  value,
  saving,
  onChange,
  onSave,
  onCancel,
  ariaLabel,
}) => (
  <Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: 1 }}>
    <TextField
      autoFocus
      fullWidth
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSave();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      inputProps={{ maxLength: 300, "aria-label": ariaLabel }}
      sx={{ maxWidth: 560 }}
    />
    <Tooltip title="حفظ">
      <span>
        <IconButton
          size="small"
          color="success"
          onClick={onSave}
          disabled={saving}
          aria-label="حفظ الاسم"
        >
          {saving ? <CircularProgress size={18} /> : <CheckRounded fontSize="small" />}
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="إلغاء">
      <IconButton
        size="small"
        onClick={onCancel}
        disabled={saving}
        aria-label="إلغاء التعديل"
      >
        <CloseRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

const CurriculumManagement = () => {
  const [loading, setLoading] = useState(true);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");

  const [schoolUnits, setSchoolUnits] = useState([]);
  const [lessonMap, setLessonMap] = useState({});
  const [expandedUnits, setExpandedUnits] = useState(() => new Set());
  const [unitLessonLoading, setUnitLessonLoading] = useState({});
  const [treeLoading, setTreeLoading] = useState(false);

  const [mutationLoading, setMutationLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitName, setUnitName] = useState("");

  const [bulkDialog, setBulkDialog] = useState(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkPreviewing, setBulkPreviewing] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);


  const selectedSubject = useMemo(
    () => schoolSubjects.find((item) => normalizeId(item) === subjectId) || null,
    [schoolSubjects, subjectId]
  );

  const selectedGrade = useMemo(
    () => gradeLevels.find((item) => normalizeId(item) === gradeLevelId) || null,
    [gradeLevels, gradeLevelId]
  );

  const restoreScrollSoon = useCallback((scrollY) => {
    if (!Number.isFinite(scrollY)) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
    });
  }, []);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    const [subjectsResponse, gradesResponse] = await Promise.all([
      fetchSubjectsList({ force: true }),
      fetchGradeLevels({ force: true }),
    ]);

    if (!subjectsResponse?.status) {
      toast.error(subjectsResponse?.message || "تعذر تحميل المواد");
    }
    if (!gradesResponse?.status) {
      toast.error(gradesResponse?.message || "تعذر تحميل الصفوف الدراسية");
    }

    setSchoolSubjects(extractList(subjectsResponse));
    setGradeLevels(extractList(gradesResponse));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  const refreshUnits = useCallback(
    async ({ preserveScroll = false } = {}) => {
      if (!subjectId || !gradeLevelId) {
        setSchoolUnits([]);
        setLessonMap({});
        setExpandedUnits(new Set());
        return [];
      }

      const scrollY = preserveScroll ? window.scrollY : null;
      setTreeLoading(true);
      const response = await fetchCurriculumUnits({ subjectId, gradeLevelId });
      const units = response?.status ? extractList(response) : [];

      if (!response?.status) {
        toast.error(response?.message || "تعذر تحميل وحدات المنهج");
      }

      setSchoolUnits(units);
      setTreeLoading(false);
      restoreScrollSoon(scrollY);
      return units;
    },
    [gradeLevelId, restoreScrollSoon, subjectId]
  );

  useEffect(() => {
    setLessonMap({});
    setExpandedUnits(new Set());
    setEditing(null);
    refreshUnits();
  }, [refreshUnits]);

  const loadLessons = useCallback(async (unitId, { force = false } = {}) => {
    const id = normalizeId(unitId);
    if (!id) return [];

    if (!force && Object.prototype.hasOwnProperty.call(lessonMap, id)) {
      return lessonMap[id] || [];
    }

    setUnitLessonLoading((current) => ({ ...current, [id]: true }));
    const response = await fetchCurriculumLessons(id);
    const lessons = response?.status ? extractList(response) : [];

    setUnitLessonLoading((current) => ({ ...current, [id]: false }));

    if (!response?.status) {
      toast.error(response?.message || "تعذر تحميل دروس الوحدة");
      return [];
    }

    setLessonMap((current) => ({ ...current, [id]: lessons }));
    return lessons;
  }, [lessonMap]);

  const toggleUnit = async (unit) => {
    const id = normalizeId(unit);
    if (!id) return;

    const isOpen = expandedUnits.has(id);
    setExpandedUnits((current) => {
      const next = new Set(current);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });

    if (!isOpen) {
      await loadLessons(id);
    }
  };

  const openCreateUnit = () => {
    if (!subjectId || !gradeLevelId) {
      toast.error("اختر المادة والصف الدراسي أولًا");
      return;
    }
    setUnitName("");
    setUnitDialogOpen(true);
  };

  const createUnit = async () => {
    const name = unitName.trim();
    if (!name || mutationLoading) {
      if (!name) toast.error("اكتب اسم الوحدة");
      return;
    }

    const scrollY = window.scrollY;
    // The backend validates `order` as a non-negative integer. The UI keeps
    // ordering automatic, so derive the next position from the currently
    // loaded units instead of asking the user to type it.
    const nextOrder =
      schoolUnits.reduce((maxOrder, unit, index) => {
        const value = Number(unit?.order);
        const safeOrder = Number.isFinite(value) && value >= 0 ? value : index;
        return Math.max(maxOrder, safeOrder);
      }, -1) + 1;

    setMutationLoading(true);
    const response = await createCurriculumUnit({
      subjectId,
      gradeLevelId,
      name,
      order: nextOrder,
    });
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر إضافة الوحدة");
      return;
    }

    setUnitDialogOpen(false);
    setUnitName("");
    toast.success("تمت إضافة الوحدة");

    const units = await refreshUnits({ preserveScroll: false });
    const createdId = normalizeId(response?.data);
    const createdUnit =
      units.find((item) => normalizeId(item) === createdId) ||
      [...units].reverse().find((item) => getName(item) === name);
    const id = normalizeId(createdUnit);

    if (id) {
      setExpandedUnits((current) => new Set(current).add(id));
      await loadLessons(id, { force: true });
    }
    restoreScrollSoon(scrollY);
  };

  const startRename = (type, item, parentId = "") => {
    setEditing({
      type,
      id: normalizeId(item),
      parentId: normalizeId(parentId),
      value: getName(item),
    });
  };

  const saveRename = async () => {
    if (!editing || mutationLoading) return;
    const value = String(editing.value || "").trim();
    if (!value) {
      toast.error(editing.type === "unit" ? "اكتب اسم الوحدة" : "اكتب اسم الدرس");
      return;
    }

    const scrollY = window.scrollY;
    setMutationLoading(true);
    const response =
      editing.type === "unit"
        ? await updateCurriculumUnit(editing.id, { name: value })
        : await updateCurriculumLesson(editing.id, { name: value });
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حفظ التعديل");
      return;
    }

    if (editing.type === "unit") {
      setSchoolUnits((current) =>
        current.map((item) =>
          normalizeId(item) === editing.id ? { ...item, name: value } : item
        )
      );
    } else {
      setLessonMap((current) => ({
        ...current,
        [editing.parentId]: (current[editing.parentId] || []).map((item) =>
          normalizeId(item) === editing.id ? { ...item, name: value } : item
        ),
      }));
    }

    setEditing(null);
    toast.success(editing.type === "unit" ? "تم تعديل اسم الوحدة" : "تم تعديل اسم الدرس");
    restoreScrollSoon(scrollY);
  };

  const removeUnit = async (unit) => {
    const id = normalizeId(unit);
    if (!id || mutationLoading) return;

    const confirmed = window.confirm(
      `حذف الوحدة «${getName(unit)}» سيحذف دروسها.\nالتحاضير المرتبطة لن تُحذف.\n\nهل تريد المتابعة؟`
    );
    if (!confirmed) return;

    const scrollY = window.scrollY;
    setMutationLoading(true);
    const response = await deleteCurriculumUnit(id);
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حذف الوحدة");
      return;
    }

    setSchoolUnits((current) => current.filter((item) => normalizeId(item) !== id));
    setLessonMap((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setExpandedUnits((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    toast.success("تم حذف الوحدة");
    restoreScrollSoon(scrollY);
  };

  const removeLesson = async (unitId, lesson) => {
    const id = normalizeId(lesson);
    const parentId = normalizeId(unitId);
    if (!id || mutationLoading) return;
    if (!window.confirm(`هل تريد حذف الدرس «${getName(lesson)}»؟`)) return;

    const scrollY = window.scrollY;
    setMutationLoading(true);
    const response = await deleteCurriculumLesson(id);
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حذف الدرس");
      return;
    }

    setLessonMap((current) => ({
      ...current,
      [parentId]: (current[parentId] || []).filter((item) => normalizeId(item) !== id),
    }));
    toast.success("تم حذف الدرس");
    restoreScrollSoon(scrollY);
  };

  const openBulkLessons = (unit) => {
    const id = normalizeId(unit);
    if (!id) return;
    setBulkDialog({ id, name: getName(unit) });
    setBulkText("");
    setBulkPreview(null);
  };

  const closeBulkDialog = () => {
    if (bulkPreviewing || bulkSaving) return;
    setBulkDialog(null);
    setBulkText("");
    setBulkPreview(null);
  };

  const previewBulkLessons = async () => {
    if (!bulkDialog?.id || bulkPreviewing || bulkSaving) return;
    const text = bulkText.trim();
    if (!text) {
      toast.error("الصق أسماء الدروس أولًا — كل سطر = درس");
      return;
    }

    setBulkPreviewing(true);
    const response = await bulkCurriculumLessons(bulkDialog.id, {
      text,
      dryRun: true,
    });
    setBulkPreviewing(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر معاينة الدروس");
      return;
    }

    const normalized = normalizeBulkPreview(response);

    // The backend returns the number of skipped duplicates, but may return
    // `lessons: []` without the skipped lesson names. Reconstruct only the
    // skipped rows for display from the input + lessons already in this unit.
    let existingLessons = lessonMap[bulkDialog.id];
    if (!Array.isArray(existingLessons)) {
      existingLessons = await loadLessons(bulkDialog.id, { force: true });
    }

    const inferredSkippedItems = buildSkippedPreviewItems(text, existingLessons);
    const serverItemKeys = new Set(
      normalized.items
        .map((item) => normalizeLessonPreviewKey(item.name))
        .filter(Boolean)
    );

    const missingSkippedItems = inferredSkippedItems.filter(
      (item) => !serverItemKeys.has(normalizeLessonPreviewKey(item.name))
    );

    const items = [...normalized.items, ...missingSkippedItems];

    setBulkPreview({
      ...normalized,
      items,
      sourceText: text,
    });
    toast.success("المعاينة جاهزة — راجع الأسماء ثم اضغط حفظ");
  };

  const saveBulkLessons = async () => {
    if (!bulkDialog?.id || !bulkPreview || bulkSaving || bulkPreviewing) return;

    const text = bulkText.trim();
    if (!text || text !== bulkPreview.sourceText) {
      toast.info("تم تعديل النص — اعمل معاينة جديدة قبل الحفظ");
      setBulkPreview(null);
      return;
    }

    const scrollY = window.scrollY;
    setBulkSaving(true);
    const response = await bulkCurriculumLessons(bulkDialog.id, {
      text,
      dryRun: false,
    });
    setBulkSaving(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حفظ الدروس");
      return;
    }

    const result = normalizeBulkPreview(response);
    const created = result.created || bulkPreview.created || 0;
    const unitId = bulkDialog.id;

    setBulkDialog(null);
    setBulkText("");
    setBulkPreview(null);
    setExpandedUnits((current) => new Set(current).add(unitId));
    await loadLessons(unitId, { force: true });

    toast.success(`تمت إضافة ${created} ${created === 1 ? "درس" : "دروس"}`);
    restoreScrollSoon(scrollY);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 5 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.6, md: 2.2 },
            mb: 1.5,
            borderRadius: "20px",
            color: "#fff",
            background: "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.2}
          >
            <Stack direction="row" alignItems="center" gap={1.1}>
              <MenuBookRounded />
              <Box>
                <Typography sx={{ fontSize: 21, fontWeight: 900 }}>
                  المناهج والدروس
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,.78)" }}>
                  أدخل وحدات ودروس منهج المدرسة مرة واحدة ليتمكن المعلم من اختيار الدرس أثناء التحضير.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={async () => {
                await loadSetup();
                await refreshUnits({ preserveScroll: true });
              }}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,.4)",
                fontWeight: 900,
                "&:hover": { borderColor: "#fff" },
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2 },
            mb: 1.5,
            border: "1px solid rgba(36,74,112,.1)",
            borderRadius: "18px",
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)", mb: 0.4 }}>
            اختر المادة والصف
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: "var(--color-muted)", mb: 1.4 }}>
            يتغير المنهج المعروض حسب المادة والصف، وتُحمّل دروس كل وحدة عند فتحها فقط.
          </Typography>

          <Grid container spacing={1.2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="المادة"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                {schoolSubjects.map((item) => (
                  <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                    {getName(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="الصف الدراسي"
                value={gradeLevelId}
                onChange={(event) => setGradeLevelId(event.target.value)}
              >
                {gradeLevels.map((item) => (
                  <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                    {getName(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2 },
            border: "1px solid rgba(36,74,112,.1)",
            borderRadius: "18px",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
            mb={1.4}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <AutoStoriesRounded sx={{ color: "var(--color-gold-dark)" }} />
              <Box>
                <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                  {selectedSubject && selectedGrade
                    ? `${getName(selectedSubject)} — ${getName(selectedGrade)}`
                    : "منهج المدرسة"}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: "var(--color-muted)" }}>
                  افتح الوحدة لمشاهدة دروسها، وعدّل الاسم مباشرة دون مغادرة الصفحة.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={openCreateUnit}
              disabled={!subjectId || !gradeLevelId || mutationLoading}
              sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
            >
              وحدة جديدة
            </Button>
          </Stack>

          {treeLoading ? (
            <Box sx={{ minHeight: 180, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : !subjectId || !gradeLevelId ? (
            <Box
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                border: "1px dashed rgba(36,74,112,.18)",
                borderRadius: "14px",
                px: 2,
              }}
            >
              <Box>
                <MenuBookRounded sx={{ fontSize: 34, color: "var(--color-muted)", mb: 0.6 }} />
                <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                  اختر المادة والصف الدراسي أولًا
                </Typography>
                <Typography sx={{ fontSize: 11, color: "var(--color-muted)", mt: 0.5 }}>
                  بعدها ستظهر وحدات المنهج الخاصة بهذا الصف.
                </Typography>
              </Box>
            </Box>
          ) : schoolUnits.length === 0 ? (
            <Box
              sx={{
                minHeight: 200,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                border: "1px dashed rgba(36,74,112,.18)",
                borderRadius: "14px",
                px: 2,
              }}
            >
              <Box>
                <AutoStoriesRounded sx={{ fontSize: 36, color: "var(--color-gold-dark)", mb: 0.7 }} />
                <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                  لا توجد وحدات لهذه المادة بعد
                </Typography>
                <Typography sx={{ fontSize: 11, color: "var(--color-muted)", mt: 0.5, mb: 1.3 }}>
                  ابدأ بإضافة أول وحدة لمنهج هذه المادة والصف.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={openCreateUnit}
                  sx={{ fontWeight: 900, bgcolor: "var(--color-navy)" }}
                >
                  وحدة جديدة
                </Button>
              </Box>
            </Box>
          ) : (
            <Stack spacing={0.9}>
              {schoolUnits.map((unit, index) => {
                const unitId = normalizeId(unit);
                const isExpanded = expandedUnits.has(unitId);
                const lessonsLoaded = Object.prototype.hasOwnProperty.call(lessonMap, unitId);
                const lessons = lessonMap[unitId] || [];
                const lessonCount = getLessonCount(unit, lessonsLoaded ? lessons : null);
                const isEditingUnit = editing?.type === "unit" && editing.id === unitId;

                return (
                  <Paper
                    key={unitId}
                    variant="outlined"
                    sx={{
                      overflow: "hidden",
                      borderRadius: "14px",
                      borderColor: isExpanded
                        ? "rgba(36,74,112,.24)"
                        : "rgba(36,74,112,.12)",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={0.7}
                      sx={{
                        px: { xs: 0.8, md: 1.2 },
                        py: 0.8,
                        bgcolor: isExpanded ? "rgba(36,74,112,.035)" : "#fff",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => toggleUnit(unit)}
                        aria-label={isExpanded ? "إغلاق الوحدة" : "فتح الوحدة"}
                      >
                        {isExpanded ? (
                          <ExpandMoreRounded fontSize="small" />
                        ) : (
                          <ChevronLeftRounded fontSize="small" />
                        )}
                      </IconButton>

                      <Typography
                        sx={{
                          minWidth: 24,
                          fontSize: 11,
                          fontWeight: 900,
                          color: "var(--color-gold-dark)",
                        }}
                      >
                        {index + 1}.
                      </Typography>

                      {isEditingUnit ? (
                        <InlineNameEditor
                          value={editing.value}
                          saving={mutationLoading}
                          onChange={(value) => setEditing((current) => ({ ...current, value }))}
                          onSave={saveRename}
                          onCancel={() => setEditing(null)}
                          ariaLabel="اسم الوحدة"
                        />
                      ) : (
                        <Typography
                          onClick={() => toggleUnit(unit)}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: 900,
                            color: "var(--color-navy-deep)",
                          }}
                        >
                          {getName(unit)}
                        </Typography>
                      )}

                      {!isEditingUnit && (
                        <>
                          <Chip
                            size="small"
                            label={lessonCount === null ? "الدروس عند الفتح" : `${lessonCount} درس`}
                            sx={{ fontWeight: 800, fontSize: 10 }}
                          />
                          <Tooltip title="تعديل اسم الوحدة">
                            <IconButton
                              size="small"
                              onClick={() => startRename("unit", unit)}
                              disabled={mutationLoading}
                              aria-label="تعديل الوحدة"
                            >
                              <EditRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف الوحدة">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeUnit(unit)}
                              disabled={mutationLoading}
                              aria-label="حذف الوحدة"
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: { xs: 1, md: 2 }, pt: 0.5, pb: 1.2 }}>
                        {unitLessonLoading[unitId] ? (
                          <Box sx={{ minHeight: 90, display: "grid", placeItems: "center" }}>
                            <CircularProgress size={22} />
                          </Box>
                        ) : lessons.length === 0 ? (
                          <Alert
                            severity="info"
                            icon={<InfoOutlined />}
                            sx={{ mb: 1, borderRadius: "11px", fontSize: 11 }}
                          >
                            لا توجد دروس داخل هذه الوحدة بعد. أضف الدروس دفعة واحدة من فهرس الكتاب.
                          </Alert>
                        ) : (
                          <Stack spacing={0.45} sx={{ mb: 1 }}>
                            {lessons.map((lesson, lessonIndex) => {
                              const lessonId = normalizeId(lesson);
                              const isEditingLesson =
                                editing?.type === "lesson" && editing.id === lessonId;

                              return (
                                <Stack
                                  key={lessonId}
                                  direction="row"
                                  alignItems="center"
                                  gap={0.7}
                                  sx={{
                                    px: 0.8,
                                    py: 0.55,
                                    minHeight: 42,
                                    borderRadius: "10px",
                                    bgcolor: "rgba(36,74,112,.022)",
                                    "&:hover": { bgcolor: "rgba(36,74,112,.045)" },
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      minWidth: 18,
                                      fontSize: 10,
                                      fontWeight: 900,
                                      color: "var(--color-muted)",
                                    }}
                                  >
                                    {lessonIndex + 1}
                                  </Typography>

                                  {isEditingLesson ? (
                                    <InlineNameEditor
                                      value={editing.value}
                                      saving={mutationLoading}
                                      onChange={(value) => setEditing((current) => ({ ...current, value }))}
                                      onSave={saveRename}
                                      onCancel={() => setEditing(null)}
                                      ariaLabel="اسم الدرس"
                                    />
                                  ) : (
                                    <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>
                                      {getName(lesson)}
                                    </Typography>
                                  )}

                                  {!isEditingLesson && (
                                    <>
                                      <Tooltip title="تعديل اسم الدرس">
                                        <IconButton
                                          size="small"
                                          onClick={() => startRename("lesson", lesson, unitId)}
                                          disabled={mutationLoading}
                                          aria-label="تعديل الدرس"
                                        >
                                          <EditRounded fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="حذف الدرس">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => removeLesson(unitId, lesson)}
                                          disabled={mutationLoading}
                                          aria-label="حذف الدرس"
                                        >
                                          <DeleteOutlineRounded fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                </Stack>
                              );
                            })}
                          </Stack>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddRounded />}
                          onClick={() => openBulkLessons(unit)}
                          disabled={mutationLoading}
                          sx={{ fontWeight: 900 }}
                        >
                          إضافة دروس لهذه الوحدة
                        </Button>
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}

              <Button
                variant="outlined"
                startIcon={<AddRounded />}
                onClick={openCreateUnit}
                disabled={mutationLoading}
                sx={{ alignSelf: "flex-start", mt: 0.4, fontWeight: 900 }}
              >
                وحدة جديدة
              </Button>
            </Stack>
          )}
        </Paper>

        <Dialog
          open={unitDialogOpen}
          onClose={() => !mutationLoading && setUnitDialogOpen(false)}
          fullWidth
          maxWidth="xs"
          dir="rtl"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>إضافة وحدة جديدة</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="اسم الوحدة"
              value={unitName}
              onChange={(event) => setUnitName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  createUnit();
                }
              }}
              inputProps={{ maxLength: 300 }}
              sx={{ mt: 0.6 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setUnitDialogOpen(false)} disabled={mutationLoading}>
              إلغاء
            </Button>
            <Button
              variant="contained"
              onClick={createUnit}
              disabled={mutationLoading || !unitName.trim()}
              sx={{ fontWeight: 900 }}
            >
              {mutationLoading ? <CircularProgress size={18} color="inherit" /> : "إضافة"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(bulkDialog)}
          onClose={closeBulkDialog}
          fullWidth
          maxWidth="sm"
          dir="rtl"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            إضافة دروس — {bulkDialog?.name || "الوحدة"}
          </DialogTitle>
          <DialogContent>
            {!bulkPreview ? (
              <Stack spacing={1.1} sx={{ mt: 0.4 }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "var(--color-navy-deep)" }}>
                  كل سطر = درس
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={9}
                  maxRows={16}
                  placeholder={
                    "المتوسط الحسابي والوسيط والمنوال\nالتمثيل بالأعمدة\nالمدى والمنوال"
                  }
                  value={bulkText}
                  onChange={(event) => {
                    setBulkText(event.target.value);
                    setBulkPreview(null);
                  }}
                />
                <Alert severity="info" icon={<InfoOutlined />} sx={{ borderRadius: "11px" }}>
                  الصق من فهرس الكتاب مباشرة — أرقام الصفحات والنقط الزائدة تُنظَّف قبل الحفظ، وسترى النتيجة في المعاينة أولًا.
                </Alert>
              </Stack>
            ) : (
              <Stack spacing={1.1} sx={{ mt: 0.4 }}>
                <Alert severity="info" sx={{ borderRadius: "11px" }}>
                  سيتم إنشاء <strong>{bulkPreview.created}</strong> درس
                  {bulkPreview.skipped > 0 ? (
                    <> · تخطي <strong>{bulkPreview.skipped}</strong> موجود بالفعل</>
                  ) : null}
                </Alert>

                {bulkPreview.items.length > 0 ? (
                  <Stack spacing={0.55}>
                    {bulkPreview.items.map((item) => (
                      <Stack
                        key={item.key}
                        direction="row"
                        alignItems="center"
                        gap={0.8}
                        sx={{
                          px: 1,
                          py: 0.7,
                          borderRadius: "10px",
                          bgcolor: item.skipped
                            ? "rgba(120,120,120,.06)"
                            : "rgba(27,140,93,.055)",
                        }}
                      >
                        <Typography
                          sx={{
                            width: 22,
                            fontSize: 15,
                            fontWeight: 900,
                            color: item.skipped ? "text.secondary" : "success.main",
                          }}
                        >
                          {item.skipped ? "⊝" : "✓"}
                        </Typography>
                        <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>
                          {item.name || "درس"}
                        </Typography>
                        {item.skipped && (
                          <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                            {item.reason || "موجود بالفعل"}
                          </Typography>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="warning" sx={{ borderRadius: "11px" }}>
                    تمت المعاينة، لكن الخادم لم يُرجع قائمة تفصيلية بالأسماء. راجع الأعداد ثم احفظ إذا كانت صحيحة.
                  </Alert>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 0.6 }}>
            {bulkPreview ? (
              <>
                <Button
                  onClick={() => setBulkPreview(null)}
                  disabled={bulkSaving || bulkPreviewing}
                >
                  رجوع
                </Button>
                <Button
                  variant="contained"
                  onClick={saveBulkLessons}
                  disabled={bulkSaving || bulkPreviewing}
                  sx={{ fontWeight: 900 }}
                >
                  {bulkSaving ? <CircularProgress size={18} color="inherit" /> : "حفظ"}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={closeBulkDialog} disabled={bulkPreviewing || bulkSaving}>
                  إلغاء
                </Button>
                <Button
                  variant="contained"
                  onClick={previewBulkLessons}
                  disabled={bulkPreviewing || bulkSaving || !bulkText.trim()}
                  sx={{ fontWeight: 900 }}
                >
                  {bulkPreviewing ? <CircularProgress size={18} color="inherit" /> : "معاينة"}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CurriculumManagement;
