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
  CloseRounded,
  EditRounded,
  LibraryBooksRounded,
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
  editLibrary,
  fetchSingleLibrary,
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

  return [];
};

const extractEntity = (
  response
) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  return (
    payload?.library ||
    payload?.item ||
    payload
  );
};

const getOfferingObject = (
  item
) => {
  if (
    item?.subjectOffering &&
    typeof item.subjectOffering ===
      "object"
  ) {
    return item.subjectOffering;
  }

  if (
    item?.subjectOfferingId &&
    typeof item
      .subjectOfferingId ===
      "object"
  ) {
    return item.subjectOfferingId;
  }

  return null;
};

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

  return [
    subjectCode
      ? `${subjectName} - ${subjectCode}`
      : subjectName,

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

const Edit = ({
  setItems,
  item,
}) => {
  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    loadingItem,
    setLoadingItem,
  ] = useState(false);

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

  const itemId =
    normalizeId(item);

  const academicYearId =
    normalizeId(
      watch("academicYearId")
    );

  const termId =
    normalizeId(
      watch("termId")
    );

  const subjectOfferingId =
    normalizeId(
      watch(
        "subjectOfferingId"
      )
    );

  /*
   * عند فتح Edit:
   * GET /library/:id
   */
  useEffect(() => {
    if (!open || !itemId) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoadingItem(true);
      setLoadingYears(true);
      setSetupError("");

      try {
        const [
          itemResponse,
          yearsResponse,
        ] = await Promise.all([
          fetchSingleLibrary(
            itemId
          ),
          fetchAcademicYears(),
        ]);

        if (!active) {
          return;
        }

        if (
          !itemResponse?.status
        ) {
          setSetupError(
            itemResponse?.message ||
              "تعذر تحميل بيانات العنصر"
          );

          return;
        }

        const current =
          extractEntity(
            itemResponse
          );

        const offering =
          getOfferingObject(
            current
          );

        const currentOfferingId =
          normalizeId(
            current
              ?.subjectOfferingId ||
              offering
          );

        const currentTermId =
          normalizeId(
            current?.termId ||
              offering?.termId
          );

        const currentYearId =
          normalizeId(
            current
              ?.academicYearId ||
              current
                ?.academicYear ||
              current?.termId
                ?.academicYearId ||
              offering?.termId
                ?.academicYearId
          );

        reset({
          title:
            current?.title || "",
          link:
            current?.link || "",
          academicYearId:
            currentYearId,
          termId:
            currentTermId,
          subjectOfferingId:
            currentOfferingId,
        });

        if (
          yearsResponse?.status ===
          false
        ) {
          setAcademicYears([]);
        } else {
          setAcademicYears(
            extractList(
              yearsResponse
            )
          );
        }
      } catch (error) {
        if (active) {
          setSetupError(
            error?.response?.data
              ?.message ||
              "تعذر تحميل بيانات العنصر"
          );
        }
      } finally {
        if (active) {
          setLoadingItem(false);
          setLoadingYears(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    open,
    itemId,
    reset,
  ]);

  /*
   * Terms
   */
  useEffect(() => {
    let active = true;

    if (!academicYearId) {
      setTerms([]);

      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoadingTerms(true);

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
          return;
        }

        setTerms(
          extractList(response).sort(
            (a, b) =>
              Number(a?.order || 0) -
              Number(b?.order || 0)
          )
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
   * Subject Offerings
   */
  useEffect(() => {
    let active = true;

    if (!termId) {
      setOfferings([]);

      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoadingOfferings(true);

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
          return;
        }

        setOfferings(
          extractList(response)
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
            (option) =>
              option.id
          ),
      [offerings]
    );

  const currentOfferingExists =
    offeringOptions.some(
      (option) =>
        option.id ===
        subjectOfferingId
    );

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

      /*
       * لو فارغة نرسل null
       * لفك الارتباط.
       */
      subjectOfferingId:
        normalizeId(
          values.subjectOfferingId
        ) || null,
    };

    setLoading(true);

    try {
      const response =
        await editLibrary(
          payload,
          itemId
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            "حدث خطأ أثناء تعديل العنصر"
        );

        return;
      }

      toast.success(
        "تم تعديل العنصر بنجاح"
      );

      const updatedItem =
        extractEntity(
          response
        );

      const selectedOffering =
        offerings.find(
          (offering) =>
            normalizeId(
              offering
            ) ===
            normalizeId(
              values
                .subjectOfferingId
            )
        );

      setItems?.(
        (previous = []) =>
          previous.map(
            (current) => {
              if (
                normalizeId(
                  current
                ) !== itemId
              ) {
                return current;
              }

              return {
                ...current,
                ...updatedItem,

                subjectOfferingId:
                  updatedItem
                    ?.subjectOfferingId ??
                  payload
                    .subjectOfferingId,

                subjectOffering:
                  selectedOffering ||
                  updatedItem
                    ?.subjectOffering ||
                  null,
              };
            }
          )
      );

      setOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل العنصر"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        type="button"
        aria-label="تعديل العنصر"
        onClick={() =>
          setOpen(true)
        }
        sx={{
          width: 36,
          height: 36,
          color:
            "var(--color-navy)",
          backgroundColor:
            "rgba(36,74,112,0.07)",
          border:
            "1px solid rgba(36,74,112,0.10)",
          borderRadius: "10px",

          "&:hover": {
            color:
              "var(--color-gold-dark)",
            backgroundColor:
              "var(--color-gold-soft)",
          },
        }}
      >
        <EditRounded fontSize="small" />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => {
          if (!loading) {
            setOpen(false);
          }
        }}
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
                <LibraryBooksRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  تعديل عنصر المكتبة
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
                  عدّل بيانات المصدر أو المادة المرتبطة به.
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
          sx={{ p: 2 }}
        >
          {loadingItem ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: 220,
              }}
            >
              <CircularProgress />
            </Stack>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmit(
                onSubmit
              )}
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
                          fieldState
                            .error
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
                        error={
                          !!fieldState.error
                        }
                        helperText={
                          fieldState
                            .error
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
                          (
                            year
                          ) => (
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
                        {field.value &&
                          !terms.some(
                            (term) =>
                              normalizeId(
                                term
                              ) ===
                              field.value
                          ) && (
                            <MenuItem
                              value={
                                field.value
                              }
                            >
                              الترم الحالي
                            </MenuItem>
                          )}

                        <MenuItem value="">
                          بدون تحديد
                        </MenuItem>

                        {terms.map(
                          (
                            term
                          ) => (
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
                      >
                        {field.value &&
                          !currentOfferingExists && (
                            <MenuItem
                              value={
                                field.value
                              }
                            >
                              المادة الحالية
                            </MenuItem>
                          )}

                        <MenuItem value="">
                          مصدر عام
                        </MenuItem>

                        {offeringOptions.map(
                          (
                            option
                          ) => (
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
                  variant="contained"
                  disabled={loading}
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
                  حفظ التعديلات
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Edit;