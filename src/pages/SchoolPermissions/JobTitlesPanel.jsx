import {
  AddRounded,
  BadgeRounded,
  DeleteOutlineRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createJobTitle,
  deleteJobTitle,
  fetchJobTitleTemplates,
  fetchJobTitles,
  updateJobTitle,
} from "@/APIs/school/jobTitles";

import { ACTION_LABELS, ENTITY_LABELS, titleActionKeys } from "./permissionLabels";

const BLANK_TEMPLATE = "blank";

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const countEnabled = (permissions) =>
  Object.entries(permissions || {}).reduce(
    (total, [entity, actions]) =>
      total + titleActionKeys(entity, actions).filter((action) => actions?.[action]).length,
    0
  );

/*
 * «المسميات الوظيفية» — a school's named permission sets for its assistants.
 *
 * An assistant with a title logs in with the title's boxes instead of the
 * «المساعدون الإداريون» tab. Titles are assigned per account on the
 * «المديرون والمساعدون» page.
 */
const JobTitlesPanel = () => {
  const navigate = useNavigate();

  const [titles, setTitles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPermissions, setDraftPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTemplate, setCreateTemplate] = useState("finance");
  const [creating, setCreating] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = useMemo(
    () => titles.find((title) => title.id === selectedId) || null,
    [titles, selectedId]
  );

  const select = useCallback((title) => {
    setSelectedId(title?.id || "");
    setDraftName(title?.name || "");
    setDraftPermissions(clone(title?.permissions));
  }, []);

  const load = useCallback(
    async (keepId) => {
      setLoading(true);
      const [titlesResponse, templatesResponse] = await Promise.all([
        fetchJobTitles(),
        fetchJobTitleTemplates(),
      ]);
      setLoading(false);

      if (titlesResponse?.status === false) {
        if (!titlesResponse?.silent) toast.error(titlesResponse.message);
        return;
      }
      const list = Array.isArray(titlesResponse?.data) ? titlesResponse.data : [];
      setTitles(list);
      if (templatesResponse?.status !== false && Array.isArray(templatesResponse?.data)) {
        setTemplates(templatesResponse.data);
      }
      select(list.find((title) => title.id === keepId) || list[0] || null);
    },
    [select]
  );

  useEffect(() => {
    load();
  }, [load]);

  const isDirty =
    Boolean(selected) &&
    (draftName.trim() !== selected.name ||
      JSON.stringify(draftPermissions) !== JSON.stringify(selected.permissions));

  const toggle = (entity, action) => {
    setDraftPermissions((current) => ({
      ...current,
      [entity]: { ...(current?.[entity] || {}), [action]: !current?.[entity]?.[action] },
    }));
  };

  const save = async () => {
    if (!selected) return;
    if (!draftName.trim()) {
      toast.error("اكتب اسم المسمى الوظيفي");
      return;
    }
    setSaving(true);
    const response = await updateJobTitle(selected.id, {
      name: draftName.trim(),
      permissions: draftPermissions,
    });
    setSaving(false);
    if (response?.status === false) {
      if (!response?.silent) toast.error(response.message);
      return;
    }
    toast.success("تم حفظ المسمى الوظيفي. يسري على المساعدين عند تسجيل دخولهم القادم.");
    await load(selected.id);
  };

  const openCreate = () => {
    const first = templates.find((template) => !titles.some((title) => title.name === template.name));
    setCreateTemplate(first?.key || BLANK_TEMPLATE);
    setCreateName(first?.name || "");
    setCreateOpen(true);
  };

  const chooseTemplate = (key) => {
    setCreateTemplate(key);
    const template = templates.find((item) => item.key === key);
    // Follow the template's name unless the owner already typed their own.
    const typedOwn = createName && !templates.some((item) => item.name === createName);
    if (!typedOwn) setCreateName(template?.name || "");
  };

  const create = async () => {
    if (!createName.trim()) {
      toast.error("اكتب اسم المسمى الوظيفي");
      return;
    }
    setCreating(true);
    const response = await createJobTitle({
      name: createName.trim(),
      ...(createTemplate !== BLANK_TEMPLATE ? { templateKey: createTemplate } : {}),
    });
    setCreating(false);
    if (response?.status === false) {
      if (!response?.silent) toast.error(response.message);
      return;
    }
    toast.success("تم إنشاء المسمى الوظيفي. عدّل صلاحياته إن احتجت ثم أسنده للمساعدين.");
    setCreateOpen(false);
    await load(response?.data?.id);
  };

  const remove = async () => {
    if (!selected) return;
    setDeleting(true);
    const response = await deleteJobTitle(selected.id);
    setDeleting(false);
    if (response?.status === false) {
      if (!response?.silent) toast.error(response.message);
      return;
    }
    toast.success("تم حذف المسمى الوظيفي");
    setDeleteOpen(false);
    await load();
  };

  const selectedTemplate = templates.find((template) => template.key === createTemplate);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        gap={1.2}
        mb={1.4}
      >
        <Box>
          <Typography sx={{ color: "#122F4D", fontSize: "17px", fontWeight: 900 }}>
            المسميات الوظيفية
          </Typography>
          <Typography sx={{ mt: 0.35, color: "#7E8791", fontSize: "11px", fontWeight: 600 }}>
            لكل مسمى صلاحياته. أسند المسمى لكل مساعد من صفحة «المديرون والمساعدون».
          </Typography>
        </Box>

        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate("/school/managers")}
            sx={{ minHeight: 42, borderRadius: "12px", fontWeight: 900, color: "#244A70", borderColor: "#C9D3DC" }}
          >
            إسناد للمساعدين
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={openCreate}
            disabled={loading}
            sx={{
              minHeight: 42,
              borderRadius: "12px",
              fontWeight: 900,
              bgcolor: "#244A70",
              "&:hover": { bgcolor: "#1B3A59" },
              "& .MuiButton-startIcon": { ml: 0.65, mr: 0 },
            }}
          >
            إضافة مسمى
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 1.4, borderRadius: "12px", fontSize: "11px" }}>
        المساعد الذي له مسمى يحصل على صلاحيات المسمى فقط. المساعد بدون مسمى يبقى على صلاحيات تبويب
        «المساعدون الإداريون». أي تغيير يسري عند تسجيل دخول المساعد القادم.
      </Alert>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      ) : titles.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: "center", borderRadius: "14px", border: "1px dashed #D9CFBD", bgcolor: "#FFFFFF" }}
        >
          <BadgeRounded sx={{ fontSize: 40, color: "#B78430" }} />
          <Typography sx={{ mt: 1, color: "#122F4D", fontWeight: 900 }}>لا توجد مسميات وظيفية بعد</Typography>
          <Typography sx={{ mt: 0.5, color: "#7E8791", fontSize: "12px" }}>
            ابدأ من قالب جاهز: المالية، وكيل شؤون الطلاب، وكيل شؤون المعلمين، أو المسؤول الأكاديمي.
          </Typography>
          <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate} sx={{ mt: 2, borderRadius: "12px", fontWeight: 900 }}>
            إضافة أول مسمى
          </Button>
        </Paper>
      ) : (
        <>
          <Stack direction="row" gap={0.8} flexWrap="wrap" mb={1.4}>
            {titles.map((title) => (
              <Chip
                key={title.id}
                clickable
                onClick={() => select(title)}
                label={`${title.name} · ${title.assignedCount} مساعد`}
                sx={{
                  height: 34,
                  px: 0.6,
                  borderRadius: "10px",
                  fontWeight: 900,
                  fontSize: "11px",
                  bgcolor: title.id === selectedId ? "#244A70" : "#FFFFFF",
                  color: title.id === selectedId ? "#FFFFFF" : "#244A70",
                  border: "1px solid #C9D3DC",
                  "&:hover": { bgcolor: title.id === selectedId ? "#1B3A59" : "#EEF3F7" },
                }}
              />
            ))}
          </Stack>

          {selected && (
            <Paper elevation={0} sx={{ p: { xs: 1.3, md: 1.8 }, borderRadius: "16px", border: "1px solid #E5E0D7", bgcolor: "#FFFFFF" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                gap={1.2}
                mb={1.4}
              >
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <TextField
                    size="small"
                    label="اسم المسمى"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    inputProps={{ maxLength: 60 }}
                    sx={{ minWidth: 220 }}
                  />
                  <Chip
                    size="small"
                    label={`${countEnabled(draftPermissions)} صلاحية مفعّلة`}
                    sx={{ bgcolor: "#EAF7F1", color: "#0E7A5E", fontWeight: 900, fontSize: "9px" }}
                  />
                  <Chip
                    size="small"
                    label={`مُسند إلى ${selected.assignedCount} مساعد`}
                    sx={{ bgcolor: "#EEF3F7", color: "#315E88", fontWeight: 900, fontSize: "9px" }}
                  />
                  {isDirty && (
                    <Chip
                      size="small"
                      label="تعديلات غير محفوظة"
                      sx={{ bgcolor: "#FBF0D8", color: "#B78430", fontWeight: 900, fontSize: "9px" }}
                    />
                  )}
                </Stack>

                <Stack direction="row" gap={1}>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => setDeleteOpen(true)}
                    disabled={saving}
                    sx={{ borderRadius: "12px", fontWeight: 900, "& .MuiButton-startIcon": { ml: 0.65, mr: 0 } }}
                  >
                    حذف
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveRounded />}
                    onClick={save}
                    disabled={!isDirty || saving}
                    sx={{ borderRadius: "12px", fontWeight: 900, "& .MuiButton-startIcon": { ml: 0.65, mr: 0 } }}
                  >
                    حفظ المسمى
                  </Button>
                </Stack>
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2,minmax(0,1fr))" }, gap: 1.1 }}>
                {Object.entries(draftPermissions).map(([entity, actions]) => {
                  const keys = titleActionKeys(entity, actions);
                  if (!keys.length) return null;
                  return (
                    <Paper key={entity} elevation={0} sx={{ p: 1.35, borderRadius: "14px", border: "1px solid #E5E0D7", bgcolor: "#FFFFFF" }}>
                      <Typography sx={{ mb: 0.85, color: "#193754", fontSize: "12px", fontWeight: 900 }}>
                        {ENTITY_LABELS[entity] || entity}
                      </Typography>
                      <Stack direction="row" gap={0.6} flexWrap="wrap">
                        {keys.map((action) => (
                          <FormControlLabel
                            key={`${entity}-${action}`}
                            control={
                              <Checkbox
                                size="small"
                                checked={Boolean(actions?.[action])}
                                onChange={() => toggle(entity, action)}
                                disabled={saving}
                              />
                            }
                            label={ACTION_LABELS[action] || action}
                            sx={{
                              m: 0,
                              px: 0.7,
                              py: 0.15,
                              borderRadius: "9px",
                              bgcolor: "#FFFCF7",
                              border: "1px solid #E2E7EB",
                              "& .MuiFormControlLabel-label": { color: "#315E88", fontSize: "10px", fontWeight: 800 },
                            }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>
          )}
        </>
      )}

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>إضافة مسمى وظيفي</DialogTitle>
        <DialogContent>
          <Stack spacing={1.6} mt={0.6}>
            <TextField
              select
              label="ابدأ من"
              value={createTemplate}
              onChange={(event) => chooseTemplate(event.target.value)}
              fullWidth
            >
              {templates.map((template) => (
                <MenuItem key={template.key} value={template.key}>
                  قالب: {template.name}
                </MenuItem>
              ))}
              <MenuItem value={BLANK_TEMPLATE}>بدون قالب (كل الصلاحيات مقفولة)</MenuItem>
            </TextField>

            {selectedTemplate && (
              <Typography sx={{ color: "#7E8791", fontSize: "12px", lineHeight: 1.8 }}>
                {selectedTemplate.description}
              </Typography>
            )}

            <TextField
              label="اسم المسمى"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              inputProps={{ maxLength: 60 }}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={create}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={15} color="inherit" /> : <AddRounded />}
          >
            إنشاء
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>حذف «{selected?.name}»؟</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "13px", color: "#4D637A" }}>
            {selected?.assignedCount
              ? `هذا المسمى مُسند إلى ${selected.assignedCount} من المساعدين. غيّر مسمّاهم أولًا من صفحة «المديرون والمساعدون» ثم احذفه.`
              : "لن يتأثر أي مساعد، لأن المسمى غير مُسند لأحد."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            إلغاء
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={remove}
            disabled={deleting || Boolean(selected?.assignedCount)}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobTitlesPanel;
