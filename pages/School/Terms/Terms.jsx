import {
  AddRounded,
  CalendarMonthRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  EditRounded,
  EventAvailableRounded,
  RefreshRounded,
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
  IconButton,
  MenuItem,
  Paper,
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

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import { useAcademicYears } from "@/utils/hooks/apis/useAcademicYears";

import {
  addTerm,
  copyTermsFromYear,
  deleteTerm,
  fetchTerms,
  updateTerm,
} from "@/APIs/school/terms";

const STATUS_LABELS = {
  upcoming: "قادم",
  active: "نشط",
  closed: "مغلق",
};

const STATUS_COLORS = {
  upcoming: "warning",
  active: "success",
  closed: "default",
};

const normalizeId = (value) =>
  String(value?._id || value?.id || value || "").trim();

const extractList = (response) => {
  let current = response;

  for (let i = 0; i < 6; i += 1) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, "data")
    ) {
      break;
    }

    current = current.data;
  }

  if (Array.isArray(current)) return current;

  if (current && typeof current === "object") {
    const list = [
      current.docs,
      current.items,
      current.results,
      current.terms,
    ].find(Array.isArray);

    if (list) return list;
  }

  return [];
};

const safeDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const toDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const emptyForm = {
  name: "",
  order: 1,
  startDate: "",
  endDate: "",
  status: "upcoming",
};

const Terms = () => {
  const {
    academicYears = [],
    loadingAcademicYears,
  } = useAcademicYears();

  const [academicYearId, setAcademicYearId] =
    useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState(null);
  const [formData, setFormData] =
    useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [copyOpen, setCopyOpen] = useState(false);
  const [sourceYearId, setSourceYearId] =
    useState("");
  const [copying, setCopying] = useState(false);

  const [deleteItem, setDeleteItem] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  const selectedYear = useMemo(
    () =>
      academicYears.find(
        (year) =>
          normalizeId(year) === academicYearId
      ) || null,
    [academicYears, academicYearId]
  );

  const sourceYearOptions = useMemo(
    () =>
      academicYears.filter(
        (year) =>
          normalizeId(year) !== academicYearId
      ),
    [academicYears, academicYearId]
  );

  useEffect(() => {
    if (
      academicYearId ||
      academicYears.length === 0
    ) {
      return;
    }

    const activeYear =
      academicYears.find(
        (year) => year?.status === "active"
      ) || academicYears[0];

    setAcademicYearId(normalizeId(activeYear));
  }, [academicYears, academicYearId]);

  const loadTerms = useCallback(async () => {
    if (!academicYearId) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetchTerms(academicYearId);

      if (response?.status === false) {
        setItems([]);
        toast.error(
          response?.message ||
            "تعذر تحميل الترمات"
        );
        return;
      }

      const mapped = extractList(response)
        .map((item) => ({
          ...item,
          id: normalizeId(item),
          academicYearId:
            normalizeId(item?.academicYearId) ||
            academicYearId,
        }))
        .filter((item) => item.id)
        .sort(
          (a, b) =>
            Number(a?.order || 0) -
            Number(b?.order || 0)
        );

      setItems(mapped);
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      order: items.length + 1,
    });
    setFormOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item?.name || "",
      order: Number(item?.order || 1),
      startDate: toDateInput(
        item?.startDate
      ),
      endDate: toDateInput(item?.endDate),
      status: item?.status || "upcoming",
    });
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingItem(null);
    setFormData(emptyForm);
  };

  const validateForm = () => {
    if (!academicYearId) {
      return "اختر السنة الدراسية أولًا";
    }

    if (!formData.name.trim()) {
      return "اكتب اسم الترم";
    }

    if (
      !Number.isFinite(Number(formData.order)) ||
      Number(formData.order) < 1
    ) {
      return "ترتيب الترم يجب أن يبدأ من 1";
    }

    if (
      !formData.startDate ||
      !formData.endDate
    ) {
      return "حدد تاريخ البداية والنهاية";
    }

    if (
      new Date(formData.startDate) >
      new Date(formData.endDate)
    ) {
      return "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    }

    return "";
  };

  const handleSave = async () => {
    const validationMessage =
      validateForm();

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const response = editingItem
        ? await updateTerm(
            editingItem.id,
            formData
          )
        : await addTerm({
            academicYearId,
            ...formData,
          });

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر حفظ الترم"
        );
        return;
      }

      toast.success(
        editingItem
          ? "تم تعديل الترم بنجاح"
          : "تم إضافة الترم بنجاح"
      );

      closeFormDialog();
      await loadTerms();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;

    setDeleting(true);

    try {
      const response =
        await deleteTerm(deleteItem.id);

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر حذف الترم"
        );
        return;
      }

      toast.success("تم حذف الترم بنجاح");
      setDeleteItem(null);
      await loadTerms();
    } finally {
      setDeleting(false);
    }
  };

  const openCopyDialog = () => {
    setSourceYearId(
      normalizeId(sourceYearOptions[0])
    );
    setCopyOpen(true);
  };

  const handleCopy = async () => {
    if (!academicYearId || !sourceYearId) {
      toast.error(
        "اختر السنة المصدر"
      );
      return;
    }

    setCopying(true);

    try {
      const response =
        await copyTermsFromYear(
          academicYearId,
          sourceYearId
        );

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر نسخ الترمات"
        );
        return;
      }

      toast.success(
        "تم نسخ الترمات من السنة السابقة بنجاح"
      );

      setCopyOpen(false);
      setSourceYearId("");
      await loadTerms();
    } finally {
      setCopying(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter(
        (item) => item?.status === "active"
      ).length,
      upcoming: items.filter(
        (item) => item?.status === "upcoming"
      ).length,
      closed: items.filter(
        (item) => item?.status === "closed"
      ).length,
    }),
    [items]
  );

  return (
    <Container>
      <Stack spacing={1.5} dir="rtl">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: "18px",
            border:
              "1px solid rgba(36, 74, 112, 0.10)",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.99), rgba(251,240,216,0.45))",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={1.5}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "13px",
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                }}
              >
                <CalendarMonthRounded />
              </Box>

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: {
                      xs: "20px",
                      md: "24px",
                    },
                    fontWeight: 900,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  إدارة الترمات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: "11px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  أضف وعدّل الترمات لكل
                  سنة دراسية أو انسخها من
                  سنة سابقة.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <Button
                variant="outlined"
                startIcon={
                  <ContentCopyRounded />
                }
                disabled={
                  !academicYearId ||
                  sourceYearOptions.length === 0
                }
                onClick={openCopyDialog}
                sx={{
                  borderRadius: "11px",
                  fontWeight: 800,
                }}
              >
                نسخ من سنة سابقة
              </Button>

              <Button
                variant="contained"
                startIcon={<AddRounded />}
                disabled={!academicYearId}
                onClick={openAddDialog}
                sx={{
                  borderRadius: "11px",
                  fontWeight: 800,
                  backgroundColor:
                    "var(--color-navy)",
                }}
              >
                إضافة ترم
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: "16px",
            border:
              "1px solid rgba(36, 74, 112, 0.10)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label="السنة الدراسية"
              value={academicYearId}
              disabled={loadingAcademicYears}
              onChange={(event) =>
                setAcademicYearId(
                  event.target.value
                )
              }
              sx={{
                maxWidth: {
                  md: 420,
                },
              }}
            >
              {academicYears.map((year) => (
                <MenuItem
                  key={normalizeId(year)}
                  value={normalizeId(year)}
                >
                  {year?.name || "—"}
                  {year?.status === "active"
                    ? " - الحالية"
                    : ""}
                </MenuItem>
              ))}
            </TextField>

            <Tooltip title="تحديث">
              <span>
                <IconButton
                  onClick={loadTerms}
                  disabled={
                    loading ||
                    !academicYearId
                  }
                  sx={{
                    border:
                      "1px solid rgba(36, 74, 112, 0.12)",
                    borderRadius: "10px",
                  }}
                >
                  <RefreshRounded />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
        >
          {[
            ["إجمالي الترمات", stats.total],
            ["النشطة", stats.active],
            ["القادمة", stats.upcoming],
            ["المغلقة", stats.closed],
          ].map(([label, value]) => (
            <Paper
              key={label}
              elevation={0}
              sx={{
                flex: 1,
                p: 1.4,
                borderRadius: "14px",
                border:
                  "1px solid rgba(36, 74, 112, 0.08)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "10px",
                  color:
                    "var(--color-muted)",
                  fontWeight: 700,
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: "20px",
                  fontWeight: 900,
                  color:
                    "var(--color-navy-deep)",
                }}
              >
                {value}
              </Typography>
            </Paper>
          ))}
        </Stack>

        {!academicYearId ? (
          <Alert severity="info">
            اختر السنة الدراسية لعرض
            الترمات.
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            borderRadius: "18px",
            border:
              "1px solid rgba(36, 74, 112, 0.10)",
          }}
        >
          <Box
            sx={{
              px: 1.6,
              py: 1.3,
              borderBottom:
                "1px solid rgba(36, 74, 112, 0.08)",
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                color:
                  "var(--color-navy-deep)",
              }}
            >
              ترمات{" "}
              {selectedYear?.name || "السنة"}
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                py: 7,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress size={30} />
            </Box>
          ) : items.length === 0 ? (
            <Box
              sx={{
                py: 7,
                px: 2,
                textAlign: "center",
              }}
            >
              <EventAvailableRounded
                sx={{
                  fontSize: 44,
                  color:
                    "rgba(36, 74, 112, 0.25)",
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  fontWeight: 900,
                  color:
                    "var(--color-navy-deep)",
                }}
              >
                لا توجد ترمات لهذه السنة
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: "11px",
                  color:
                    "var(--color-muted)",
                }}
              >
                أضف ترمًا جديدًا أو انسخ
                الترمات من سنة سابقة.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 760,
                  borderCollapse:
                    "collapse",
                  "& th, & td": {
                    px: 1.5,
                    py: 1.25,
                    textAlign: "right",
                    borderBottom:
                      "1px solid rgba(36, 74, 112, 0.07)",
                  },
                  "& th": {
                    fontSize: "10px",
                    color:
                      "var(--color-muted)",
                    fontWeight: 900,
                    backgroundColor:
                      "rgba(36, 74, 112, 0.035)",
                  },
                  "& td": {
                    fontSize: "12px",
                    color:
                      "var(--color-navy-deep)",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم الترم</th>
                    <th>تاريخ البداية</th>
                    <th>تاريخ النهاية</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.order || "—"}</td>
                      <td>
                        <strong>
                          {item.name || "—"}
                        </strong>
                      </td>
                      <td>
                        {safeDate(
                          item.startDate
                        )}
                      </td>
                      <td>
                        {safeDate(item.endDate)}
                      </td>
                      <td>
                        <Chip
                          size="small"
                          label={
                            STATUS_LABELS[
                              item.status
                            ] ||
                            item.status ||
                            "—"
                          }
                          color={
                            STATUS_COLORS[
                              item.status
                            ] || "default"
                          }
                          variant={
                            item.status ===
                            "active"
                              ? "filled"
                              : "outlined"
                          }
                        />
                      </td>
                      <td>
                        <Stack
                          direction="row"
                          spacing={0.5}
                        >
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              onClick={() =>
                                openEditDialog(
                                  item
                                )
                              }
                            >
                              <EditRounded
                                fontSize="small"
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setDeleteItem(
                                  item
                                )
                              }
                            >
                              <DeleteOutlineRounded
                                fontSize="small"
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>
      </Stack>

      <Dialog
        open={formOpen}
        onClose={closeFormDialog}
        fullWidth
        maxWidth="sm"
        dir="rtl"
      >
        <DialogTitle
          sx={{ fontWeight: 900 }}
        >
          {editingItem
            ? "تعديل الترم"
            : "إضافة ترم جديد"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <TextField
              label="اسم الترم"
              value={formData.name}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              fullWidth
              required
            />

            <TextField
              label="الترتيب"
              type="number"
              inputProps={{ min: 1 }}
              value={formData.order}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  order: event.target.value,
                }))
              }
              fullWidth
              required
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <TextField
                label="تاريخ البداية"
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  setFormData(
                    (previous) => ({
                      ...previous,
                      startDate:
                        event.target.value,
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                required
              />

              <TextField
                label="تاريخ النهاية"
                type="date"
                value={formData.endDate}
                onChange={(event) =>
                  setFormData(
                    (previous) => ({
                      ...previous,
                      endDate:
                        event.target.value,
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                required
              />
            </Stack>

            {editingItem ? (
              <TextField
                select
                label="الحالة"
                value={formData.status}
                onChange={(event) =>
                  setFormData(
                    (previous) => ({
                      ...previous,
                      status:
                        event.target.value,
                    })
                  )
                }
                fullWidth
              >
                <MenuItem value="upcoming">
                  قادم
                </MenuItem>
                <MenuItem value="active">
                  نشط
                </MenuItem>
                <MenuItem value="closed">
                  مغلق
                </MenuItem>
              </TextField>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2 }}
        >
          <Button
            onClick={closeFormDialog}
            disabled={saving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "جارٍ الحفظ..."
              : editingItem
                ? "حفظ التعديل"
                : "إضافة الترم"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={copyOpen}
        onClose={() =>
          !copying && setCopyOpen(false)
        }
        fullWidth
        maxWidth="xs"
        dir="rtl"
      >
        <DialogTitle
          sx={{ fontWeight: 900 }}
        >
          نسخ الترمات من سنة سابقة
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            <Alert severity="info">
              سيتم نسخ هيكل الترمات إلى{" "}
              <strong>
                {selectedYear?.name || "السنة الحالية"}
              </strong>
              .
            </Alert>

            <TextField
              select
              fullWidth
              label="السنة المصدر"
              value={sourceYearId}
              onChange={(event) =>
                setSourceYearId(
                  event.target.value
                )
              }
            >
              {sourceYearOptions.map(
                (year) => (
                  <MenuItem
                    key={normalizeId(year)}
                    value={normalizeId(year)}
                  >
                    {year?.name || "—"}
                  </MenuItem>
                )
              )}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2 }}
        >
          <Button
            onClick={() =>
              setCopyOpen(false)
            }
            disabled={copying}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            startIcon={
              <ContentCopyRounded />
            }
            onClick={handleCopy}
            disabled={
              copying || !sourceYearId
            }
          >
            {copying
              ? "جارٍ النسخ..."
              : "نسخ الترمات"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteItem)}
        onClose={() =>
          !deleting && setDeleteItem(null)
        }
        maxWidth="xs"
        fullWidth
        dir="rtl"
      >
        <DialogTitle
          sx={{ fontWeight: 900 }}
        >
          حذف الترم
        </DialogTitle>

        <DialogContent>
          <Typography>
            هل تريد حذف{" "}
            <strong>
              {deleteItem?.name}
            </strong>
            ؟
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2 }}
        >
          <Button
            onClick={() =>
              setDeleteItem(null)
            }
            disabled={deleting}
          >
            إلغاء
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "جارٍ الحذف..."
              : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Terms;
