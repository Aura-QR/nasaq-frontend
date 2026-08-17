import {
  AddRounded,
  CalendarMonthRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  EditRounded,
  PlaylistAddRounded,
  RefreshRounded,
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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

import {
  toast,
} from "react-toastify";

import {
  copyTermsFromYear,
  createTerm,
  createTermsBulk,
  deleteTerm,
  fetchTermsByAcademicYear,
  updateTerm,
} from "@/APIs/school/terms";

import {
  extractApiList,
  formatAcademicDate,
  getEntityId,
  getTermStatusLabel,
  sortTerms,
  toInputDate,
} from "@/utils/school/academicYearData";

const FIELD_SX = {
  "& .MuiOutlinedInput-root":
    {
      minHeight: 42,

      borderRadius:
        "12px",

      backgroundColor:
        "#fffcf7",
    },

  "& input, & .MuiSelect-select":
    {
      fontSize:
        "10.5px",
    },
};

const getStatusSx = (
  status
) => {
  if (
    status === "active"
  ) {
    return {
      color:
        "#29734A",

      backgroundColor:
        "rgba(116,201,154,0.16)",

      border:
        "1px solid rgba(116,201,154,0.22)",
    };
  }

  if (
    status === "closed"
  ) {
    return {
      color:
        "#6f7882",

      backgroundColor:
        "rgba(126,135,145,0.10)",

      border:
        "1px solid rgba(126,135,145,0.12)",
    };
  }

  return {
    color:
      "#8a5a00",

    backgroundColor:
      "#fbf0d8",

    border:
      "1px solid rgba(211,164,79,0.18)",
  };
};

const initialTerm = {
  name: "",
  order: 1,
  startDate: "",
  endDate: "",
  status:
    "upcoming",
};

const TermFormDialog = ({
  open,
  term,
  loading,
  onClose,
  onSave,
}) => {
  const [
    form,
    setForm,
  ] = useState(
    initialTerm
  );

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      name:
        term?.name ||
        "",

      order:
        term?.order ||
        1,

      startDate:
        toInputDate(
          term?.startDate
        ),

      endDate:
        toInputDate(
          term?.endDate
        ),

      status:
        term?.status ||
        "upcoming",
    });

    setError("");
  }, [
    open,
    term,
  ]);

  const submit = () => {
    if (
      !form.name.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      setError(
        "أكمل بيانات الترم المطلوبة"
      );

      return;
    }

    if (
      form.endDate <
      form.startDate
    ) {
      setError(
        "تاريخ النهاية يجب أن يكون بعد البداية"
      );

      return;
    }

    setError("");

    onSave({
      ...form,

      order:
        Number(
          form.order
        ),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius:
            "18px",
        },
      }}
    >
      <DialogTitle
        sx={{
          color:
            "#122f4d",

          fontWeight: 800,
        }}
      >
        {term
          ? "تعديل الترم"
          : "إضافة ترم جديد"}
      </DialogTitle>

      <DialogContent
        sx={{
          pt:
            "18px !important",
        }}
      >
        <Box
          sx={{
            display:
              "grid",

            gridTemplateColumns:
              {
                xs:
                  "1fr",

                md:
                  "2fr 1fr",
              },

            gap: 1,
          }}
        >
          <TextField
            fullWidth
            label="اسم الترم"
            value={
              form.name
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  name:
                    event.target
                      .value,
                })
              )
            }
            sx={FIELD_SX}
          />

          <TextField
            fullWidth
            type="number"
            label="الترتيب"
            value={
              form.order
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  order:
                    event.target
                      .value,
                })
              )
            }
            sx={FIELD_SX}
          />

          <TextField
            fullWidth
            type="date"
            label="تاريخ البداية"
            InputLabelProps={{
              shrink: true,
            }}
            value={
              form.startDate
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  startDate:
                    event.target
                      .value,
                })
              )
            }
            sx={FIELD_SX}
          />

          <TextField
            fullWidth
            type="date"
            label="تاريخ النهاية"
            InputLabelProps={{
              shrink: true,
            }}
            value={
              form.endDate
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  endDate:
                    event.target
                      .value,
                })
              )
            }
            sx={FIELD_SX}
          />

          {term && (
            <TextField
              fullWidth
              select
              label="الحالة"
              value={
                form.status
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    status:
                      event.target
                        .value,
                  })
                )
              }
              sx={FIELD_SX}
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
          )}
        </Box>

        {error && (
          <Typography
            color="error.main"
            sx={{
              mt: 1,

              fontSize:
                "10px",

              fontWeight: 700,
            }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.4,
          py: 1.4,

          gap: 0.7,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius:
              "10px",
          }}
        >
          إلغاء
        </Button>

        <Button
          onClick={submit}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius:
              "10px",

            backgroundColor:
              "#244a70",

            "&:hover": {
              backgroundColor:
                "#1b3d61",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            "حفظ"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BulkDialog = ({
  open,
  loading,
  onClose,
  onSave,
}) => {
  const createRow = (
    order
  ) => ({
    name:
      `الترم ${order}`,

    order,

    startDate: "",

    endDate: "",
  });

  const [
    rows,
    setRows,
  ] = useState([
    createRow(1),
    createRow(2),
    createRow(3),
  ]);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setRows([
      createRow(1),
      createRow(2),
      createRow(3),
    ]);

    setError("");
  }, [open]);

  const update = (
    index,
    field,
    value
  ) =>
    setRows(
      (
        previous
      ) =>
        previous.map(
          (
            row,
            rowIndex
          ) =>
            rowIndex ===
            index
              ? {
                  ...row,

                  [field]:
                    value,
                }
              : row
        )
    );

  const submit = () => {
    const invalid =
      rows.some(
        (row) =>
          !row.name.trim() ||
          !row.startDate ||
          !row.endDate ||
          row.endDate <
            row.startDate
      );

    if (invalid) {
      setError(
        "أكمل بيانات كل الترمات وتأكد من التواريخ"
      );

      return;
    }

    setError("");

    onSave(
      rows.map(
        (row) => ({
          ...row,

          order:
            Number(
              row.order
            ),
        })
      )
    );
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius:
            "18px",
        },
      }}
    >
      <DialogTitle
        sx={{
          color:
            "#122f4d",

          fontWeight: 800,
        }}
      >
        إنشاء الترمات دفعة واحدة
      </DialogTitle>

      <DialogContent
        sx={{
          pt:
            "18px !important",
        }}
      >
        <Stack spacing={1}>
          {rows.map(
            (
              row,
              index
            ) => (
              <Paper
                key={
                  index
                }
                elevation={0}
                sx={{
                  p: 1,

                  border:
                    "1px solid #ded8cd",

                  borderRadius:
                    "13px",

                  backgroundColor:
                    "#fffcf7",
                }}
              >
                <Box
                  sx={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      {
                        xs:
                          "1fr",

                        md:
                          "1.2fr .65fr 1fr 1fr",
                      },

                    gap: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    label="اسم الترم"
                    value={
                      row.name
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        index,
                        "name",
                        event
                          .target
                          .value
                      )
                    }
                    sx={FIELD_SX}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="الترتيب"
                    value={
                      row.order
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        index,
                        "order",
                        event
                          .target
                          .value
                      )
                    }
                    sx={FIELD_SX}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="البداية"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={
                      row.startDate
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        index,
                        "startDate",
                        event
                          .target
                          .value
                      )
                    }
                    sx={FIELD_SX}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="النهاية"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={
                      row.endDate
                    }
                    onChange={(
                      event
                    ) =>
                      update(
                        index,
                        "endDate",
                        event
                          .target
                          .value
                      )
                    }
                    sx={FIELD_SX}
                  />
                </Box>
              </Paper>
            )
          )}

          <Button
            type="button"
            startIcon={
              <AddRounded />
            }
            onClick={() =>
              setRows(
                (
                  previous
                ) => [
                  ...previous,

                  createRow(
                    previous.length +
                      1
                  ),
                ]
              )
            }
            sx={{
              width:
                "fit-content",

              color:
                "#244a70",

              fontWeight: 800,
            }}
          >
            إضافة ترم آخر
          </Button>

          {error && (
            <Typography
              color="error.main"
              sx={{
                fontSize:
                  "10px",
              }}
            >
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.4,
          py: 1.4,

          gap: 0.7,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius:
              "10px",
          }}
        >
          إلغاء
        </Button>

        <Button
          onClick={submit}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius:
              "10px",

            backgroundColor:
              "#244a70",

            "&:hover": {
              backgroundColor:
                "#1b3d61",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            "إنشاء الترمات"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TermsManager = ({
  academicYearId,
  previousYears = [],
  onTermsChange,
}) => {
  const [
    terms,
    setTerms,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    formDialog,
    setFormDialog,
  ] = useState({
    open: false,
    term: null,
  });

  const [
    bulkOpen,
    setBulkOpen,
  ] = useState(false);

  const [
    copyOpen,
    setCopyOpen,
  ] = useState(false);

  const [
    sourceYearId,
    setSourceYearId,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const load =
    useCallback(
      async ({
        force = false,
      } = {}) => {
        setLoading(true);
        setError("");

        const response =
          await fetchTermsByAcademicYear(
            academicYearId,
            {
              force,
            }
          );

        if (
          response?.status ===
            false
        ) {
          setTerms([]);

          setError(
            response?.message ||
            "تعذر تحميل الترمات"
          );

          setLoading(false);

          return;
        }

        const next =
          sortTerms(
            extractApiList(
              response
            )
          );

        setTerms(next);

        onTermsChange?.(
          next
        );

        setLoading(false);
      },
      [
        academicYearId,
        onTermsChange,
      ]
    );

  useEffect(() => {
    load();
  }, [load]);

  const filteredTerms =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return terms.filter(
          (term) => {
            const matchesSearch =
              !normalizedSearch ||
              String(
                term?.name ||
                ""
              )
                .toLowerCase()
                .includes(
                  normalizedSearch
                );

            const matchesStatus =
              !statusFilter ||
              term?.status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );
      },
      [
        terms,
        search,
        statusFilter,
      ]
    );

  const activeCount =
    useMemo(
      () =>
        terms.filter(
          (term) =>
            term?.status ===
            "active"
        ).length,
      [terms]
    );

  const saveTerm =
    async (values) => {
      setActionLoading(
        true
      );

      const editing =
        formDialog.term;

      const response =
        editing
          ? await updateTerm(
              getEntityId(
                editing
              ),
              values
            )
          : await createTerm({
              ...values,

              academicYearId,
            });

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر حفظ الترم"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        editing
          ? "تم تعديل الترم"
          : "تمت إضافة الترم"
      );

      setFormDialog({
        open: false,
        term: null,
      });

      setActionLoading(
        false
      );

      load({
        force: true,
      });
    };

  const saveBulk =
    async (rows) => {
      setActionLoading(
        true
      );

      const response =
        await createTermsBulk(
          academicYearId,
          rows
        );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر إنشاء الترمات"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        "تم إنشاء الترمات بنجاح"
      );

      setBulkOpen(false);

      setActionLoading(
        false
      );

      load({
        force: true,
      });
    };

  const copyTerms =
    async () => {
      setActionLoading(
        true
      );

      const response =
        await copyTermsFromYear(
          academicYearId,
          sourceYearId
        );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر نسخ الترمات"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        "تم نسخ هيكل الترمات"
      );

      setCopyOpen(false);
      setSourceYearId("");

      setActionLoading(
        false
      );

      load({
        force: true,
      });
    };

  const removeTerm =
    async () => {
      setActionLoading(
        true
      );

      const response =
        await deleteTerm(
          getEntityId(
            deleteTarget
          )
        );

      if (
        response?.status ===
          false
      ) {
        toast.error(
          response?.message ||
          "تعذر حذف الترم"
        );

        setActionLoading(
          false
        );

        return;
      }

      toast.success(
        "تم حذف الترم"
      );

      setDeleteTarget(
        null
      );

      setActionLoading(
        false
      );

      load({
        force: true,
      });
    };

  return (
    <Paper
      elevation={0}
      sx={{
        overflow:
          "hidden",

        border:
          "1px solid #ded8cd",

        borderRadius:
          "18px",

        backgroundColor:
          "#ffffff",
      }}
    >
      <Box
        sx={{
          p: {
            xs: 1.25,
            md: 1.5,
          },

          borderBottom:
            "1px solid #ded8cd",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          justifyContent="space-between"
          gap={1}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.7}
            >
              <Typography
                sx={{
                  color:
                    "#122f4d",

                  fontSize:
                    "17px",

                  fontWeight: 800,
                }}
              >
                إدارة الترمات
              </Typography>

              <Chip
                size="small"
                label={
                  terms.length
                }
                sx={{
                  color:
                    "#b78430",

                  backgroundColor:
                    "#fbf0d8",

                  fontWeight: 800,
                }}
              />
            </Stack>

            <Typography
              sx={{
                mt: 0.2,

                color:
                  "#7e8791",

                fontSize:
                  "9px",
              }}
            >
              إضافة وتعديل الترمات المرتبطة بهذه السنة الدراسية.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            gap={0.7}
          >
            <Button
              type="button"
              variant="outlined"
              startIcon={
                <RefreshRounded />
              }
              onClick={() =>
                load({
                  force: true,
                })
              }
              sx={{
                minHeight: 40,

                borderRadius:
                  "11px",

                color:
                  "#244a70",

                borderColor:
                  "rgba(36,74,112,0.18)",

                fontSize:
                  "9px",

                fontWeight: 800,

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              تحديث
            </Button>

            <Tooltip
              title={
                terms.length > 0
                  ? "يوجد ترمات بالفعل لهذه السنة. استخدم إضافة ترم/إنشاء دفعة، أو احذف الترمات الحالية أولًا إذا أردت النسخ من سنة سابقة."
                  : !previousYears.length
                  ? "لا توجد سنوات سابقة متاحة للنسخ."
                  : "نسخ هيكل الترمات من سنة سابقة"
              }
            >
              <span>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={
                    <ContentCopyRounded />
                  }
                  disabled={
                    !previousYears.length ||
                    terms.length > 0
                  }
                  onClick={() =>
                    setCopyOpen(
                      true
                    )
                  }
                  sx={{
                    minHeight: 40,

                    borderRadius:
                      "11px",

                    color:
                      "#244a70",

                    borderColor:
                      "rgba(36,74,112,0.18)",

                    fontSize:
                      "9px",

                    fontWeight: 800,

                    "& .MuiButton-startIcon":
                      {
                        ml: 0.55,
                        mr: 0,
                      },
                  }}
                >
                  نسخ من سنة سابقة
                </Button>
              </span>
            </Tooltip>

            <Button
              type="button"
              variant="outlined"
              startIcon={
                <PlaylistAddRounded />
              }
              onClick={() =>
                setBulkOpen(
                  true
                )
              }
              sx={{
                minHeight: 40,

                borderRadius:
                  "11px",

                color:
                  "#244a70",

                borderColor:
                  "rgba(36,74,112,0.18)",

                fontSize:
                  "9px",

                fontWeight: 800,

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              إنشاء دفعة
            </Button>

            <Button
              type="button"
              variant="contained"
              startIcon={
                <AddRounded />
              }
              onClick={() =>
                setFormDialog({
                  open: true,
                  term: null,
                })
              }
              sx={{
                minHeight: 40,

                px: 1.8,

                borderRadius:
                  "11px",

                color:
                  "#ffffff",

                backgroundColor:
                  "#244a70",

                boxShadow:
                  "none",

                fontSize:
                  "9px",

                fontWeight: 800,

                "&:hover": {
                  backgroundColor:
                    "#1b3d61",

                  boxShadow:
                    "none",
                },

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              إضافة ترم
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 1.1,

          borderBottom:
            "1px solid #ded8cd",

          backgroundColor:
            "#ffffff",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          gap={1}
        >
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="ابحث باسم الترم..."
            InputProps={{
              startAdornment:
                (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
            }}
            sx={FIELD_SX}
          />

          <TextField
            select
            size="small"
            label="الحالة"
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
            sx={{
              width: {
                xs: "100%",
                md: 210,
              },

              ...FIELD_SX,
            }}
          >
            <MenuItem value="">
              كل الحالات
            </MenuItem>

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

          <Stack
            direction="row"
            alignItems="center"
            gap={0.6}
            sx={{
              flexShrink: 0,
            }}
          >
            <Chip
              size="small"
              label={`الإجمالي: ${terms.length}`}
              sx={{
                color:
                  "#244a70",

                backgroundColor:
                  "rgba(36,74,112,0.07)",

                fontSize:
                  "8px",

                fontWeight: 800,
              }}
            />

            <Chip
              size="small"
              label={`النشطة: ${activeCount}`}
              sx={{
                ...getStatusSx(
                  "active"
                ),

                fontSize:
                  "8px",

                fontWeight: 800,
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {terms.length > 0 && (
        <Alert
          severity="info"
          sx={{
            mx: 1.1,
            mt: 1.1,
            mb: 0,
            borderRadius: "12px",
            fontSize: "9.5px",
          }}
        >
          هذه السنة تحتوي على ترمات بالفعل، لذلك تم تعطيل النسخ من سنة سابقة.
          استخدم "إضافة ترم" أو "إنشاء دفعة"، أو احذف الترمات الحالية أولًا إذا أردت نسخ هيكل سنة أخرى بالكامل.
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() =>
                load({
                  force: true,
                })
              }
            >
              إعادة المحاولة
            </Button>
          }
          sx={{
            m: 1.1,

            borderRadius:
              "12px",
          }}
        >
          {error}
        </Alert>
      )}

      {!loading &&
      filteredTerms.length ===
        0 ? (
        <Box
          sx={{
            minHeight: 260,

            display:
              "grid",

            placeItems:
              "center",

            p: 3,

            textAlign:
              "center",
          }}
        >
          <Box>
            <CalendarMonthRounded
              sx={{
                fontSize: 46,

                color:
                  "#d3a44f",
              }}
            />

            <Typography
              sx={{
                mt: 1,

                color:
                  "#122f4d",

                fontSize:
                  "14px",

                fontWeight: 800,
              }}
            >
              {terms.length
                ? "لا توجد ترمات مطابقة"
                : "لا توجد ترمات في هذه السنة"}
            </Typography>

            <Typography
              sx={{
                mt: 0.35,

                color:
                  "#7e8791",

                fontSize:
                  "9.5px",
              }}
            >
              {terms.length
                ? "غيّر البحث أو فلتر الحالة."
                : "أضف ترمًا أو أنشئ الترمات دفعة واحدة."}
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              display: {
                xs:
                  "none",

                md:
                  "block",
              },
            }}
          >
            <Table
              sx={{
                tableLayout:
                  "fixed",
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor:
                      "#f1f5fa",
                  }}
                >
                  <TableCell
                    align="right"
                    sx={{
                      width:
                        "9%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    الترتيب
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      width:
                        "23%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    اسم الترم
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width:
                        "22%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    تاريخ البداية
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width:
                        "22%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    تاريخ النهاية
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width:
                        "14%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    الحالة
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width:
                        "10%",

                      color:
                        "#244a70",

                      fontSize:
                        "9px",

                      fontWeight: 800,
                    }}
                  >
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading
                  ? [...Array(3)].map(
                      (
                        _,
                        rowIndex
                      ) => (
                        <TableRow
                          key={
                            rowIndex
                          }
                        >
                          {[...Array(6)].map(
                            (
                              __,
                              cellIndex
                            ) => (
                              <TableCell
                                key={
                                  cellIndex
                                }
                              >
                                <Skeleton
                                  height={28}
                                />
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      )
                    )
                  : filteredTerms.map(
                      (
                        term
                      ) => (
                        <TableRow
                          key={
                            getEntityId(
                              term
                            )
                          }
                          hover
                          sx={{
                            "&:last-child td":
                              {
                                borderBottom:
                                  0,
                              },
                          }}
                        >
                          <TableCell
                            align="right"
                            sx={{
                              color:
                                "#7e8791",

                              fontSize:
                                "9px",

                              fontWeight: 700,
                            }}
                          >
                            {term?.order}
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            <Typography
                              sx={{
                                color:
                                  "#122f4d",

                                fontSize:
                                  "10.5px",

                                fontWeight: 800,
                              }}
                            >
                              {term?.name}
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              color:
                                "#193754",

                              fontSize:
                                "9px",

                              fontWeight: 700,
                            }}
                          >
                            {formatAcademicDate(
                              term?.startDate
                            )}
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              color:
                                "#193754",

                              fontSize:
                                "9px",

                              fontWeight: 700,
                            }}
                          >
                            {formatAcademicDate(
                              term?.endDate
                            )}
                          </TableCell>

                          <TableCell
                            align="center"
                          >
                            <Chip
                              size="small"
                              label={
                                getTermStatusLabel(
                                  term?.status
                                )
                              }
                              sx={{
                                ...getStatusSx(
                                  term?.status
                                ),

                                minWidth: 68,

                                fontSize:
                                  "8px",

                                fontWeight: 800,
                              }}
                            />
                          </TableCell>

                          <TableCell
                            align="center"
                          >
                            <Stack
                              direction="row"
                              justifyContent="center"
                              gap={0.45}
                            >
                              <Tooltip title="تعديل">
                                <IconButton
                                  type="button"
                                  onClick={() =>
                                    setFormDialog({
                                      open: true,
                                      term,
                                    })
                                  }
                                  sx={{
                                    width: 32,
                                    height: 32,

                                    color:
                                      "#244a70",

                                    backgroundColor:
                                      "rgba(36,74,112,0.08)",
                                  }}
                                >
                                  <EditRounded
                                    sx={{
                                      fontSize: 16,
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="حذف">
                                <IconButton
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget(
                                      term
                                    )
                                  }
                                  sx={{
                                    width: 32,
                                    height: 32,

                                    color:
                                      "#c94f4f",

                                    backgroundColor:
                                      "rgba(201,79,79,0.09)",
                                  }}
                                >
                                  <DeleteOutlineRounded
                                    sx={{
                                      fontSize: 16,
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            spacing={0.8}
            sx={{
              display: {
                xs:
                  "flex",

                md:
                  "none",
              },

              p: 1,
            }}
          >
            {loading
              ? [...Array(3)].map(
                  (
                    _,
                    index
                  ) => (
                    <Skeleton
                      key={index}
                      variant="rounded"
                      height={132}
                      sx={{
                        borderRadius:
                          "14px",
                      }}
                    />
                  )
                )
              : filteredTerms.map(
                  (
                    term
                  ) => (
                    <Paper
                      key={
                        getEntityId(
                          term
                        )
                      }
                      elevation={0}
                      sx={{
                        p: 1.15,

                        border:
                          "1px solid rgba(36,74,112,0.09)",

                        borderRadius:
                          "14px",

                        backgroundColor:
                          "#ffffff",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Box>
                          <Typography
                            sx={{
                              color:
                                "#122f4d",

                              fontSize:
                                "13px",

                              fontWeight: 800,
                            }}
                          >
                            {term?.order}.{" "}
                            {term?.name}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.3,

                              color:
                                "#7e8791",

                              fontSize:
                                "8.5px",
                            }}
                          >
                            {formatAcademicDate(
                              term?.startDate
                            )}
                            {" — "}
                            {formatAcademicDate(
                              term?.endDate
                            )}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={
                            getTermStatusLabel(
                              term?.status
                            )
                          }
                          sx={{
                            ...getStatusSx(
                              term?.status
                            ),

                            fontSize:
                              "8px",

                            fontWeight: 800,
                          }}
                        />
                      </Stack>

                      <Stack
                        direction="row"
                        gap={0.6}
                        sx={{
                          mt: 1.1,

                          pt: 0.9,

                          borderTop:
                            "1px solid rgba(36,74,112,0.07)",
                        }}
                      >
                        <Button
                          type="button"
                          size="small"
                          startIcon={
                            <EditRounded />
                          }
                          onClick={() =>
                            setFormDialog({
                              open: true,
                              term,
                            })
                          }
                          sx={{
                            color:
                              "#244a70",

                            fontWeight: 800,
                          }}
                        >
                          تعديل
                        </Button>

                        <Button
                          type="button"
                          size="small"
                          color="error"
                          startIcon={
                            <DeleteOutlineRounded />
                          }
                          onClick={() =>
                            setDeleteTarget(
                              term
                            )
                          }
                          sx={{
                            fontWeight: 800,
                          }}
                        >
                          حذف
                        </Button>
                      </Stack>
                    </Paper>
                  )
                )}
          </Stack>
        </>
      )}

      <TermFormDialog
        open={
          formDialog.open
        }
        term={
          formDialog.term
        }
        loading={
          actionLoading
        }
        onClose={() =>
          setFormDialog({
            open: false,
            term: null,
          })
        }
        onSave={
          saveTerm
        }
      />

      <BulkDialog
        open={
          bulkOpen
        }
        loading={
          actionLoading
        }
        onClose={() =>
          setBulkOpen(
            false
          )
        }
        onSave={
          saveBulk
        }
      />

      <Dialog
        open={
          copyOpen
        }
        onClose={
          actionLoading
            ? undefined
            : () =>
                setCopyOpen(
                  false
                )
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius:
              "18px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color:
              "#122f4d",

            fontWeight: 800,
          }}
        >
          نسخ الترمات من سنة سابقة
        </DialogTitle>

        <DialogContent
          sx={{
            pt:
              "18px !important",
          }}
        >
          <TextField
            fullWidth
            select
            label="السنة المصدر"
            value={
              sourceYearId
            }
            onChange={(
              event
            ) =>
              setSourceYearId(
                event.target
                  .value
              )
            }
            sx={FIELD_SX}
          >
            {previousYears.map(
              (
                year
              ) => (
                <MenuItem
                  key={
                    getEntityId(
                      year
                    )
                  }
                  value={
                    getEntityId(
                      year
                    )
                  }
                >
                  {year?.name}
                </MenuItem>
              )
            )}
          </TextField>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.4,
            py: 1.4,

            gap: 0.7,
          }}
        >
          <Button
            onClick={() =>
              setCopyOpen(
                false
              )
            }
            disabled={
              actionLoading
            }
            variant="outlined"
            sx={{
              borderRadius:
                "10px",
            }}
          >
            إلغاء
          </Button>

          <Button
            onClick={
              copyTerms
            }
            disabled={
              actionLoading ||
              !sourceYearId
            }
            variant="contained"
            sx={{
              borderRadius:
                "10px",

              backgroundColor:
                "#244a70",

              "&:hover": {
                backgroundColor:
                  "#1b3d61",
              },
            }}
          >
            {actionLoading ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              "نسخ الترمات"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={
          Boolean(
            deleteTarget
          )
        }
        onClose={
          actionLoading
            ? undefined
            : () =>
                setDeleteTarget(
                  null
                )
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius:
              "18px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color:
              "#122f4d",

            fontWeight: 800,
          }}
        >
          حذف الترم
        </DialogTitle>

        <DialogContent
          sx={{
            pt:
              "18px !important",
          }}
        >
          <Typography
            sx={{
              color:
                "#193754",

              fontSize:
                "11px",

              lineHeight: 1.9,
            }}
          >
            هل تريد حذف "{deleteTarget?.name}"؟ لا يمكن التراجع عن العملية.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.4,
            py: 1.4,

            gap: 0.7,
          }}
        >
          <Button
            onClick={() =>
              setDeleteTarget(
                null
              )
            }
            disabled={
              actionLoading
            }
            variant="outlined"
            sx={{
              borderRadius:
                "10px",
            }}
          >
            إلغاء
          </Button>

          <Button
            onClick={
              removeTerm
            }
            disabled={
              actionLoading
            }
            color="error"
            variant="contained"
            sx={{
              borderRadius:
                "10px",
            }}
          >
            {actionLoading ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              "حذف"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TermsManager;
