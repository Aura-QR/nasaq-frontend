import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  CloseRounded,
  LibraryAddRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Controller,
  useForm,
} from "react-hook-form";

import { toast } from "react-toastify";

import {
  addLibrary,
} from "@/APIs/school/library";

import {
  fetchAcademicYears,
} from "@/APIs/school/academicYears";

import {
  fetchTermsByAcademicYear,
} from "@/APIs/school/lectures";

import {
  fetchSubjectOfferings,
} from "@/APIs/school/subjectOfferings";

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const extractList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(response?.data)
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  if (
    Array.isArray(
      response?.items
    )
  ) {
    return response.items;
  }

  if (
    Array.isArray(
      response?.docs
    )
  ) {
    return response.docs;
  }

  return [];
};

const getResponseData = (
  response
) =>
  response?.data?.data ||
  response?.data ||
  null;

const getSubjectData = (
  offering
) => {
  const subject =
    offering?.subjectId ||
    offering?.subject;

  return (
    subject &&
    typeof subject === "object"
      ? subject
      : null
  );
};

const getGradeData = (
  offering
) => {
  const grade =
    offering?.gradeLevelId ||
    offering?.gradeLevel;

  return (
    grade &&
    typeof grade === "object"
      ? grade
      : null
  );
};

const getOfferingLabel = (
  offering
) => {
  const subject =
    getSubjectData(offering);

  const grade =
    getGradeData(offering);

  const subjectName =
    subject?.subjectName ||
    subject?.name ||
    offering?.subjectName ||
    "مادة غير محددة";

  const subjectCode =
    subject?.subjectCode ||
    subject?.code ||
    "";

  const gradeName =
    grade?.name ||
    grade?.label ||
    "";

  const subjectLabel =
    subjectCode
      ? `${subjectName} - ${subjectCode}`
      : subjectName;

  return [
    subjectLabel,
    gradeName,
  ]
    .filter(Boolean)
    .join(" — ");
};

const validateUrl = (value) => {
  try {
    const url = new URL(
      String(value || "").trim()
    );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "الرابط يجب أن يبدأ بـ http أو https";
    }

    return true;
  } catch {
    return "أدخل رابطًا صحيحًا";
  }
};

const Add = ({
  setItems,
  setLocalPagination,
  compact = false,
}) => {
  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [terms, setTerms] =
    useState([]);

  const [
    offerings,
    setOfferings,
  ] = useState([]);

  const [
    loadingYears,
    setLoadingYears,
  ] = useState(false);

  const [
    loadingTerms,
    setLoadingTerms,
  ] = useState(false);

  const [
    loadingOfferings,
    setLoadingOfferings,
  ] = useState(false);

  const [setupError, setSetupError] =
    useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      link: "",
      academicYearId: "",
      termId: "",
      subjectOfferingId: "",
    },
  });

  const academicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const termId =
    normalizeId(
      watch("termId")
    );

  /*
   * Load academic years
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoadingYears(true);
      setSetupError("");

      try {
        const response =
          await fetchAcademicYears();

        if (!active) {
          return;
        }

        if (
          response?.status === false
        ) {
          setAcademicYears([]);

          setSetupError(
            response?.message ||
              "تعذر تحميل السنوات الدراسية"
          );

          return;
        }

        setAcademicYears(
          extractList(response)
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setAcademicYears([]);

        setSetupError(
          error?.response?.data
            ?.message ||
            "تعذر تحميل السنوات الدراسية"
        );
      } finally {
        if (active) {
          setLoadingYears(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [open]);

  /*
   * Load terms
   */
  useEffect(() => {
    let active = true;

    setTerms([]);
    setOfferings([]);

    if (!academicYearId) {
      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoadingTerms(true);
      setSetupError("");

      try {
        const response =
          await fetchTermsByAcademicYear(
            academicYearId,
            {
              force: true,
            }
          );

        if (!active) {
          return;
        }

        if (
          response?.status === false
        ) {
          setTerms([]);

          setSetupError(
            response?.message ||
              "تعذر تحميل الترمات"
          );

          return;
        }

        setTerms(
          extractList(response).sort(
            (a, b) =>
              Number(a?.order || 0) -
              Number(b?.order || 0)
          )
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setTerms([]);

        setSetupError(
          error?.response?.data
            ?.message ||
            "تعذر تحميل الترمات"
        );
      } finally {
        if (active) {
          setLoadingTerms(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [academicYearId]);

  /*
   * Load Subject Offerings
   */
  useEffect(() => {
    let active = true;

    setOfferings([]);

    if (!termId) {
      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoadingOfferings(true);
      setSetupError("");

      try {
        const response =
          await fetchSubjectOfferings({
            termId,
          });

        if (!active) {
          return;
        }

        if (
          response?.status === false
        ) {
          setOfferings([]);

          setSetupError(
            response?.message ||
              "تعذر تحميل المواد المفعلة"
          );

          return;
        }

        setOfferings(
          extractList(response)
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setOfferings([]);

        setSetupError(
          error?.response?.data
            ?.message ||
            "تعذر تحميل المواد المفعلة"
        );
      } finally {
        if (active) {
          setLoadingOfferings(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [termId]);

  const offeringOptions =
    useMemo(
      () =>
        offerings
          .map((offering) => ({
            id: normalizeId(
              offering
            ),
            label:
              getOfferingLabel(
                offering
              ),
            raw: offering,
          }))
          .filter(
            (item) => item.id
          ),
      [offerings]
    );

  const handleClose = (
    event,
    reason
  ) => {
    if (
      loading &&
      (
        reason ===
          "backdropClick" ||
        reason ===
          "escapeKeyDown"
      )
    ) {
      return;
    }

    if (!loading) {
      setOpen(false);
    }
  };

  const onSubmit = async (
    values
  ) => {
    const payload = {
      title: String(
        values.title || ""
      ).trim(),

      link: String(
        values.link || ""
      ).trim(),
    };

    const subjectOfferingId =
      normalizeId(
        values.subjectOfferingId
      );

    if (subjectOfferingId) {
      payload.subjectOfferingId =
        subjectOfferingId;
    }

    setLoading(true);

    try {
      const response =
        await addLibrary(payload);

      if (!response?.status) {
        toast.error(
          response?.message ||
            "حدث خطأ أثناء إضافة عنصر المكتبة"
        );

        return;
      }

      toast.success(
        "تم إضافة عنصر المكتبة بنجاح"
      );

      const createdItem =
        getResponseData(
          response
        );

      if (createdItem) {
        const selectedOffering =
          offerings.find(
            (offering) =>
              normalizeId(
                offering
              ) ===
              subjectOfferingId
          );

        const enrichedItem = {
          ...createdItem,

          ...(selectedOffering &&
          !createdItem
            ?.subjectOffering
            ? {
                subjectOffering:
                  selectedOffering,
              }
            : {}),
        };

        setItems?.(
          (previous = []) => [
            enrichedItem,
            ...previous,
          ]
        );
      }

      setLocalPagination?.(
        (previous) => {
          if (!previous) {
            return previous;
          }

          const totalDocs =
            Number(
              previous.totalDocs ||
                0
            ) + 1;

          const limit =
            Number(
              previous.limit ||
                10
            );

          return {
            ...previous,
            totalDocs,
            totalPages:
              Math.max(
                1,
                Math.ceil(
                  totalDocs /
                    limit
                )
              ),
          };
        }
      );

      reset();

      setTerms([]);
      setOfferings([]);

      setOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة عنصر المكتبة"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        variant="contained"
        startIcon={
          <AddCircleOutlineRounded />
        }
        sx={{
          width: {
            xs: "100%",
            sm: compact
              ? 180
              : 185,
          },
          minHeight: 42,
          px: 2,
          borderRadius: "12px",
          color:
            "var(--color-white)",
          background:
            "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
          boxShadow:
            "0 9px 20px rgba(18,47,77,0.16)",
          fontSize: "12px",
          fontWeight: 800,
          textTransform: "none",

          "& .MuiButton-startIcon":
            {
              marginLeft: "7px",
              marginRight: 0,
            },
        }}
      >
        إضافة عنصر جديد
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: "20px",
            backgroundColor:
              "var(--color-cream)",
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{ p: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.5,
              color:
                "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-deep))",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems:
                    "center",
                  color:
                    "var(--color-navy-deep)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  borderRadius:
                    "12px",
                }}
              >
                <LibraryAddRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  إضافة عنصر جديد
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color:
                      "rgba(255,255,255,0.72)",
                    fontSize:
                      "9.5px",
                  }}
                >
                  يمكنك إضافة مصدر عام أو ربطه بمادة مفعلة.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              disabled={loading}
              onClick={() =>
                setOpen(false)
              }
              sx={{
                color:
                  "var(--color-white)",
              }}
            >
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: {
              xs: 1.5,
              sm: 2,
            },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(
              onSubmit
            )}
            noValidate
            sx={{ pt: 1 }}
          >
            {setupError && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
              >
                {setupError}
              </Alert>
            )}

            <Grid
              container
              spacing={1.5}
            >
              <Grid
                item
                xs={12}
                sm={6}
              >
                <Controller
                  name="title"
                  control={control}
                  rules={{
                    required:
                      "عنوان العنصر مطلوب",
                    minLength: {
                      value: 2,
                      message:
                        "العنوان قصير جدًا",
                    },
                  }}
                  render={({
                    field,
                    fieldState,
                  }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="عنوان العنصر"
                      error={
                        !!fieldState.error
                      }
                      helperText={
                        fieldState.error
                          ?.message
                      }
                    />
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
              >
                <Controller
                  name="link"
                  control={control}
                  rules={{
                    required:
                      "رابط العنصر مطلوب",
                    validate:
                      validateUrl,
                  }}
                  render={({
                    field,
                    fieldState,
                  }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="رابط العنصر"
                      placeholder="https://..."
                      error={
                        !!fieldState.error
                      }
                      helperText={
                        fieldState.error
                          ?.message
                      }
                    />
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
              >
                <Controller
                  name="academicYearId"
                  control={control}
                  render={({
                    field,
                  }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="السنة الدراسية"
                      disabled={
                        loadingYears
                      }
                      onChange={(
                        event
                      ) => {
                        field.onChange(
                          event
                        );

                        setValue(
                          "termId",
                          ""
                        );

                        setValue(
                          "subjectOfferingId",
                          ""
                        );
                      }}
                    >
                      <MenuItem value="">
                        بدون تحديد
                      </MenuItem>

                      {academicYears.map(
                        (year) => (
                          <MenuItem
                            key={
                              normalizeId(
                                year
                              )
                            }
                            value={
                              normalizeId(
                                year
                              )
                            }
                          >
                            {year?.name ||
                              year?.title ||
                              "سنة دراسية"}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
              >
                <Controller
                  name="termId"
                  control={control}
                  render={({
                    field,
                  }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="الترم"
                      disabled={
                        !academicYearId ||
                        loadingTerms
                      }
                      onChange={(
                        event
                      ) => {
                        field.onChange(
                          event
                        );

                        setValue(
                          "subjectOfferingId",
                          ""
                        );
                      }}
                    >
                      <MenuItem value="">
                        بدون تحديد
                      </MenuItem>

                      {terms.map(
                        (term) => (
                          <MenuItem
                            key={
                              normalizeId(
                                term
                              )
                            }
                            value={
                              normalizeId(
                                term
                              )
                            }
                          >
                            {term?.name ||
                              `الترم ${term?.order || ""}`}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
              >
                <Controller
                  name="subjectOfferingId"
                  control={control}
                  render={({
                    field,
                  }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="المادة"
                      disabled={
                        !termId ||
                        loadingOfferings
                      }
                      helperText="اختياري — اتركها فارغة لمصدر عام"
                    >
                      <MenuItem value="">
                        مصدر عام
                      </MenuItem>

                      {offeringOptions.map(
                        (option) => (
                          <MenuItem
                            key={
                              option.id
                            }
                            value={
                              option.id
                            }
                          >
                            {
                              option.label
                            }
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>

            {(loadingYears ||
              loadingTerms ||
              loadingOfferings) && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mt: 2 }}
              >
                <CircularProgress
                  size={18}
                />

                <Typography
                  sx={{
                    fontSize:
                      "11px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  جاري تحميل بيانات المواد...
                </Typography>
              </Stack>
            )}

            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={1}
              sx={{ mt: 2.5 }}
            >
              <Button
                type="button"
                disabled={loading}
                onClick={() =>
                  setOpen(false)
                }
              >
                إلغاء
              </Button>

              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  ) : (
                    <SaveRounded />
                  )
                }
                sx={{
                  minWidth: 130,
                  borderRadius:
                    "11px",
                  fontWeight: 800,
                }}
              >
                حفظ
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Add;