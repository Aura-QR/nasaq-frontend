import {
  AddRounded,
  AutoStoriesRounded,
  CloudDownloadRounded,
  DeleteOutlineRounded,
  EditRounded,
  MenuBookRounded,
  RefreshRounded,
  SchoolRounded,
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
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  createCurriculumLesson,
  createCurriculumUnit,
  deleteCurriculumLesson,
  deleteCurriculumUnit,
  fetchCatalogSubjects,
  fetchCatalogSubjectUnits,
  fetchCurriculumLessons,
  fetchCurriculumUnits,
  importSchoolCurriculum,
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

  for (const key of ["docs", "items", "results", "subjects", "gradeLevels", "units", "lessons"]) {
    if (Array.isArray(data[key])) return data[key];
  }

  return Object.values(data).find(Array.isArray) || [];
};

const CurriculumManagement = () => {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [catalogSubjects, setCatalogSubjects] = useState([]);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [catalogSubjectId, setCatalogSubjectId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [catalogUnits, setCatalogUnits] = useState([]);
  const [schoolUnits, setSchoolUnits] = useState([]);
  const [lessonMap, setLessonMap] = useState({});
  const [treeLoading, setTreeLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [editor, setEditor] = useState(null);

  const loadSetup = useCallback(async () => {
    setLoading(true);

    const [catalogResponse, subjectsResponse, gradesResponse] = await Promise.all([
      fetchCatalogSubjects({ page: 1, limit: 100 }),
      fetchSubjectsList({ force: true }),
      fetchGradeLevels({ force: true }),
    ]);

    let catalogue = catalogResponse?.status ? extractList(catalogResponse) : [];
    const totalPages = Number(catalogResponse?.pagination?.totalPages || 1);

    if (catalogResponse?.status && totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          fetchCatalogSubjects({ page: index + 2, limit: 100 })
        )
      );

      catalogue = [
        ...catalogue,
        ...rest.flatMap((response) =>
          response?.status ? extractList(response) : []
        ),
      ];
    }

    setCatalogSubjects(catalogue);
    setSchoolSubjects(extractList(subjectsResponse));
    setGradeLevels(extractList(gradesResponse));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!catalogSubjectId) {
        setCatalogUnits([]);
        return;
      }

      const response = await fetchCatalogSubjectUnits(catalogSubjectId);
      if (!active) return;
      setCatalogUnits(response?.status ? extractList(response) : []);
    };

    run();
    return () => {
      active = false;
    };
  }, [catalogSubjectId]);

  const refreshSchoolTree = useCallback(async () => {
    if (!subjectId || !gradeLevelId) {
      setSchoolUnits([]);
      setLessonMap({});
      return;
    }

    setTreeLoading(true);
    const unitsResponse = await fetchCurriculumUnits({ subjectId, gradeLevelId });
    const units = unitsResponse?.status ? extractList(unitsResponse) : [];
    setSchoolUnits(units);

    const entries = await Promise.all(
      units.map(async (unit) => {
        const unitId = normalizeId(unit);
        const response = await fetchCurriculumLessons(unitId);
        return [unitId, response?.status ? extractList(response) : []];
      })
    );

    setLessonMap(Object.fromEntries(entries));
    setTreeLoading(false);
  }, [subjectId, gradeLevelId]);

  useEffect(() => {
    refreshSchoolTree();
  }, [refreshSchoolTree]);

  const objectiveLines = (value) =>
    String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const openUnitEditor = (unit = null) => {
    if (!subjectId || !gradeLevelId) {
      toast.error("اختر مادة المدرسة والصف الدراسي أولًا");
      return;
    }

    setEditor({
      type: "unit",
      mode: unit ? "edit" : "create",
      id: normalizeId(unit),
      name: getName(unit),
      order: Number(unit?.order || 0),
      parentId: "",
      objectives: "",
    });
  };

  const openLessonEditor = (unitId, lesson = null) => {
    setEditor({
      type: "lesson",
      mode: lesson ? "edit" : "create",
      id: normalizeId(lesson),
      parentId: normalizeId(unitId),
      name: getName(lesson),
      order: Number(lesson?.order || 0),
      objectives: Array.isArray(lesson?.objectives)
        ? lesson.objectives.join("\n")
        : "",
    });
  };

  const saveEditor = async () => {
    if (!editor || mutationLoading) return;

    const name = String(editor.name || "").trim();
    if (!name) {
      toast.error(editor.type === "unit" ? "اكتب اسم الوحدة" : "اكتب اسم الدرس");
      return;
    }

    setMutationLoading(true);
    let response;

    if (editor.type === "unit") {
      response = editor.mode === "create"
        ? await createCurriculumUnit({
            subjectId,
            gradeLevelId,
            name,
            order: Number(editor.order || 0),
          })
        : await updateCurriculumUnit(editor.id, {
            name,
            order: Number(editor.order || 0),
          });
    } else {
      const payload = {
        name,
        order: Number(editor.order || 0),
        objectives: objectiveLines(editor.objectives),
      };

      response = editor.mode === "create"
        ? await createCurriculumLesson(editor.parentId, payload)
        : await updateCurriculumLesson(editor.id, payload);
    }

    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حفظ بيانات المنهج");
      return;
    }

    setEditor(null);
    toast.success(editor.type === "unit" ? "تم حفظ الوحدة" : "تم حفظ الدرس");
    await refreshSchoolTree();
  };

  const removeUnit = async (unit) => {
    const id = normalizeId(unit);
    if (!id || mutationLoading) return;
    if (!window.confirm(`حذف الوحدة «${getName(unit)}»؟`)) return;

    setMutationLoading(true);
    const response = await deleteCurriculumUnit(id);
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حذف الوحدة");
      return;
    }

    toast.success("تم حذف الوحدة");
    await refreshSchoolTree();
  };

  const removeLesson = async (lesson) => {
    const id = normalizeId(lesson);
    if (!id || mutationLoading) return;
    if (!window.confirm(`حذف الدرس «${getName(lesson)}»؟`)) return;

    setMutationLoading(true);
    const response = await deleteCurriculumLesson(id);
    setMutationLoading(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر حذف الدرس");
      return;
    }

    toast.success("تم حذف الدرس");
    await refreshSchoolTree();
  };

  const handleImport = async () => {
    if (!catalogSubjectId || !subjectId || !gradeLevelId) {
      toast.error("اختر مادة المنهج والمادة المدرسية والصف الدراسي");
      return;
    }

    setImporting(true);
    const response = await importSchoolCurriculum({
      catalogSubjectId,
      subjectId,
      gradeLevelId,
    });
    setImporting(false);

    if (!response?.status) {
      toast.error(response?.message || "تعذر استيراد المنهج");
      return;
    }

    const result = response?.data || {};
    toast.success(
      `تم استيراد المنهج بنجاح${
        result?.createdUnits !== undefined
          ? ` — ${result.createdUnits} وحدة و ${result.createdLessons || 0} درس`
          : ""
      }`
    );
    await refreshSchoolTree();
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
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2 },
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
            gap={1}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <MenuBookRounded />
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
                  إعداد منهج المدرسة
                </Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>
                  استورد المنهج الوطني إلى مادة وصف دراسي داخل المدرسة قبل بدء التحضير.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={loadSetup}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,.4)", fontWeight: 900 }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        {!catalogSubjects.length && (
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "14px" }}>
            كتالوج المنهج الوطني فارغ حاليًا. يلزم إعداد بيانات المنصة أولًا قبل أن تتمكن المدرسة من الاستيراد.
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid rgba(36,74,112,.1)", borderRadius: "18px" }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
            <CloudDownloadRounded sx={{ color: "var(--color-gold-dark)" }} />
            <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
              استيراد المنهج
            </Typography>
          </Stack>

          <Grid container spacing={1.2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="مادة المنهج الوطني"
                value={catalogSubjectId}
                onChange={(event) => setCatalogSubjectId(event.target.value)}
              >
                {catalogSubjects.map((item) => (
                  <MenuItem key={normalizeId(item)} value={normalizeId(item)}>
                    {getName(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="مادة المدرسة"
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
            <Grid item xs={12} md={4}>
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

          {catalogSubjectId && (
            <Box mt={1.5}>
              <Typography sx={{ fontSize: 11, color: "var(--color-muted)", mb: 0.6 }}>
                محتوى المادة في الكتالوج: {catalogUnits.length} وحدة
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {catalogUnits.slice(0, 12).map((unit) => (
                  <Chip key={normalizeId(unit)} size="small" label={getName(unit)} />
                ))}
              </Stack>
            </Box>
          )}

          <Button
            variant="contained"
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadRounded />}
            disabled={importing || !catalogSubjectId || !subjectId || !gradeLevelId}
            onClick={handleImport}
            sx={{ mt: 2, fontWeight: 900, bgcolor: "var(--color-navy)" }}
          >
            استيراد / استكمال المنهج
          </Button>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, mt: 1.5, border: "1px solid rgba(36,74,112,.1)", borderRadius: "18px" }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1.2}>
            <SchoolRounded sx={{ color: "var(--color-gold-dark)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                المنهج الموجود في المدرسة
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: "var(--color-muted)" }}>
                اختر مادة المدرسة والصف أعلاه لمراجعة الوحدات والدروس المستوردة.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRounded />}
              disabled={!subjectId || !gradeLevelId || mutationLoading}
              onClick={() => openUnitEditor()}
              sx={{ fontWeight: 900 }}
            >
              إضافة وحدة
            </Button>
          </Stack>

          {treeLoading ? (
            <CircularProgress size={24} />
          ) : schoolUnits.length ? (
            <Stack spacing={1}>
              {schoolUnits.map((unit) => {
                const unitId = normalizeId(unit);
                const lessons = lessonMap[unitId] || [];
                return (
                  <Paper key={unitId} variant="outlined" sx={{ p: 1.2, borderRadius: "14px" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Stack direction="row" alignItems="center" gap={0.7}>
                        <AutoStoriesRounded fontSize="small" />
                        <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>
                          {getName(unit)}
                        </Typography>
                        <Chip size="small" label={`${lessons.length} درس`} />
                      </Stack>
                      <Stack direction="row" alignItems="center" gap={0.3}>
                        <Button
                          size="small"
                          startIcon={<AddRounded />}
                          onClick={() => openLessonEditor(unitId)}
                          disabled={mutationLoading}
                          sx={{ fontWeight: 900 }}
                        >
                          درس
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => openUnitEditor(unit)}
                          disabled={mutationLoading}
                          aria-label="تعديل الوحدة"
                        >
                          <EditRounded fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeUnit(unit)}
                          disabled={mutationLoading}
                          aria-label="حذف الوحدة"
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    {lessons.length > 0 && (
                      <>
                        <Divider sx={{ my: 0.8 }} />
                        <Stack spacing={0.55}>
                          {lessons.map((lesson) => (
                            <Stack
                              key={normalizeId(lesson)}
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              gap={0.7}
                              sx={{
                                px: 0.8,
                                py: 0.45,
                                borderRadius: "10px",
                                bgcolor: "rgba(36,74,112,.025)",
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>
                                  {getName(lesson)}
                                </Typography>
                                {Array.isArray(lesson?.objectives) && lesson.objectives.length > 0 && (
                                  <Typography sx={{ fontSize: 9.5, color: "var(--color-muted)" }}>
                                    {lesson.objectives.length} هدف مقترح
                                  </Typography>
                                )}
                              </Box>
                              <Stack direction="row" gap={0.25}>
                                <IconButton
                                  size="small"
                                  onClick={() => openLessonEditor(unitId, lesson)}
                                  disabled={mutationLoading}
                                  aria-label="تعديل الدرس"
                                >
                                  <EditRounded fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeLesson(lesson)}
                                  disabled={mutationLoading}
                                  aria-label="حذف الدرس"
                                >
                                  <DeleteOutlineRounded fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          ) : subjectId && gradeLevelId ? (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              لا توجد وحدات لهذه المادة والصف بعد. اختر المادة المناظرة من الكتالوج واضغط استيراد.
            </Alert>
          ) : (
            <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>
              اختر مادة المدرسة والصف لعرض المنهج الحالي.
            </Typography>
          )}
        </Paper>

        <Dialog
          open={Boolean(editor)}
          onClose={() => !mutationLoading && setEditor(null)}
          fullWidth
          maxWidth="sm"
          dir="rtl"
        >
          <DialogTitle sx={{ fontWeight: 900 }}>
            {editor?.type === "unit"
              ? editor?.mode === "edit" ? "تعديل الوحدة" : "إضافة وحدة"
              : editor?.mode === "edit" ? "تعديل الدرس" : "إضافة درس"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                label={editor?.type === "unit" ? "اسم الوحدة" : "اسم الدرس"}
                value={editor?.name || ""}
                onChange={(event) =>
                  setEditor((current) => current ? { ...current, name: event.target.value } : current)
                }
                inputProps={{ maxLength: 300 }}
              />
              <TextField
                fullWidth
                type="number"
                label="الترتيب"
                value={editor?.order ?? 0}
                onChange={(event) =>
                  setEditor((current) => current ? { ...current, order: Math.max(0, Number(event.target.value || 0)) } : current)
                }
                inputProps={{ min: 0 }}
              />
              {editor?.type === "lesson" && (
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="الأهداف المقترحة — هدف في كل سطر"
                  value={editor?.objectives || ""}
                  onChange={(event) =>
                    setEditor((current) => current ? { ...current, objectives: event.target.value } : current)
                  }
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditor(null)}
              disabled={mutationLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              onClick={saveEditor}
              disabled={mutationLoading}
              sx={{ fontWeight: 900 }}
            >
              {mutationLoading ? <CircularProgress size={18} color="inherit" /> : "حفظ"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CurriculumManagement;
