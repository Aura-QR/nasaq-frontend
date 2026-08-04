import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
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
  useState,
} from "react";

import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubjectSelector from "@/components/Selector/SubjectSelector";


import {
  editLibrary,
  fetchLibraryAcademicYears,
} from "@/APIs/school/library";
import { fetchSingleSubject } from "@/APIs/school/subjects";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const getArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const mapAcademicYear = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    "سنة دراسية",
});

const normalizeItem = (item) => ({
  ...item,
  _id: normalizeId(item),
  id: normalizeId(item),
  title: item?.title || "",
  link: item?.link || "",
  subjectId: normalizeId(
    item?.subjectId || item?.subject
  ),
  academicYearId: normalizeId(
    item?.academicYearId ||
      (typeof item?.academicYear === "object"
        ? item.academicYear
        : "")
  ),
});

const getResponseData = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    null;

  return (
    payload?.library ||
    payload?.item ||
    payload?.subject ||
    payload
  );
};

const getErrorMessage = (
  response,
  fallback
) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string"
    ? response
    : fallback);

const Edit = ({
  setItems,
  item,
}) => {
  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [academicYears, setAcademicYears] =
    useState([]);

  const [loadingYears, setLoadingYears] =
    useState(false);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let active = true;

    const loadAcademicYears = async () => {
      setLoadingYears(true);

      const response =
        await fetchLibraryAcademicYears();

      if (!active) {
        return;
      }

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر تحميل السنوات الدراسية"
        );
        setAcademicYears([]);
      } else {
        setAcademicYears(
          getArray(response?.data).map(
            mapAcademicYear
          )
        );
      }

      setLoadingYears(false);
    };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (
      item &&
      open
    ) {
      const normalized =
        normalizeItem(item);

      setDefaultValues(
        normalized
      );

      reset(normalized);

      setValue(
        "subjectId",
        normalized.subjectId,
        {
          shouldDirty: false,
          shouldValidate: false,
        }
      );

      setValue(
        "academicYearId",
        normalized.academicYearId,
        {
          shouldDirty: false,
          shouldValidate: false,
        }
      );
    }
  }, [
    item,
    open,
    reset,
    setValue,
  ]);

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
    formValues
  ) => {
    const nextValues = {
      title: String(
        formValues?.title || ""
      ).trim(),
      link: String(
        formValues?.link || ""
      ).trim(),
      subjectId: normalizeId(
        formValues?.subjectId
      ),
      academicYearId: normalizeId(
        formValues?.academicYearId
      ),
    };

    const changedData = {};

    [
      "title",
      "link",
      "subjectId",
      "academicYearId",
    ].forEach((key) => {
      const previous = String(
        defaultValues?.[key] || ""
      ).trim();
      const next = String(
        nextValues?.[key] || ""
      ).trim();

      if (previous !== next) {
        changedData[key] = next;
      }
    });

    if (
      Object.keys(
        changedData
      ).length === 0
    ) {
      toast.info(
        "لم تحدث أي بيانات للتعديل"
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await editLibrary(
          changedData,
          defaultValues._id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء تعديل عنصر المكتبة"
          )
        );
        return;
      }

      toast.success(
        "تم تعديل العنصر بنجاح"
      );

      const updatedItem =
        getResponseData(response) || {};

      const subjectId = normalizeId(
        updatedItem?.subjectId ||
          changedData?.subjectId ||
          defaultValues?.subjectId
      );

      let subjectData =
        updatedItem?.subject ||
        (updatedItem?.subjectId &&
        typeof updatedItem.subjectId === "object"
          ? updatedItem.subjectId
          : null);

      if (subjectId && !subjectData) {
        const subjectResponse =
          await fetchSingleSubject(
            subjectId,
            { force: true }
          );

        if (subjectResponse?.status !== false) {
          subjectData =
            getResponseData(
              subjectResponse
            );
        }
      }

      const academicYearId = normalizeId(
        updatedItem?.academicYearId ||
          changedData?.academicYearId ||
          defaultValues?.academicYearId
      );

      const academicYearData =
        (updatedItem?.academicYearId &&
        typeof updatedItem.academicYearId ===
          "object"
          ? updatedItem.academicYearId
          : null) ||
        academicYears.find(
          (year) => year.id === academicYearId
        ) ||
        null;

      setItems?.((previousItems) =>
        previousItems.map(
          (currentItem) =>
            normalizeId(currentItem) ===
            normalizeId(defaultValues)
              ? {
                  ...currentItem,
                  ...changedData,
                  ...updatedItem,
                  subjectId,
                  subject:
                    subjectData ||
                    currentItem?.subject,
                  academicYearId,
                  academicYear:
                    academicYearData?.name ||
                    currentItem?.academicYear ||
                    "",
                }
              : currentItem
        )
      );

      setOpen(false);
      setDefaultValues(null);
      reset({});
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل عنصر المكتبة"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        type="button"
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
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            overflow:
              "hidden",
            borderRadius: "20px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 26px 65px rgba(18,47,77,0.22)",
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
            gap={1}
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
                    fontSize:
                      "16px",
                    fontWeight:
                      800,
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
                  عدّل العنوان أو الرابط أو بيانات التصنيف.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              type="button"
              disabled={loading}
              onClick={() =>
                setOpen(false)
              }
              sx={{
                color:
                  "var(--color-white)",
                backgroundColor:
                  "rgba(255,255,255,0.10)",
                borderRadius:
                  "10px",
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

            "& .MuiFormControl-root":
              {
                width: "100%",
                margin: 0,
              },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root":
              {
                minHeight: 48,
                backgroundColor:
                  "var(--color-white)",
                borderRadius:
                  "12px",
              },

            "& .MuiInputLabel-root":
              {
                px: 0.65,
                backgroundColor:
                  "var(--color-cream)",
                fontSize:
                  "10.5px",
                fontWeight:
                  700,
              },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(
              onSubmit
            )}
            noValidate
            sx={{ pt: 0.8 }}
          >
            {defaultValues && (
              <Grid
                container
                spacing={1.5}
              >
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Input
                    register={register}
                    registerName="title"
                    error={
                      errors.title
                        ?.message
                    }
                    label="عنوان العنصر"
                    required
                    type="text"
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Input
                    register={register}
                    registerName="link"
                    error={
                      errors.link
                        ?.message
                    }
                    label="رابط العنصر"
                    required
                    type="text"
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <SubjectSelector
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    registerName="subjectId"
                    valueName="name"
                    label="المادة المرتبط بها العنصر"
                    defaultSubjectId={
                      defaultValues
                        .subjectId
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Select
                    key={`academic-year-${defaultValues.academicYearId}-${academicYears.length}`}
                    register={register}
                    registerName="academicYearId"
                    data={academicYears}
                    name="name"
                    error={
                      errors.academicYearId
                        ?.message
                    }
                    label="السنة الدراسية"
                    defaultValue={
                      defaultValues
                        .academicYearId
                    }
                    disabled={loadingYears}
                    onChange={(value) => {
                      setValue(
                        "academicYearId",
                        value || "",
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      );
                    }}
                  />
                </Grid>
              </Grid>
            )}

            <Stack
              direction={{
                xs: "column-reverse",
                sm: "row",
              }}
              gap={1}
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop:
                  "1px solid rgba(36,74,112,0.08)",
              }}
            >
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <SaveRounded />
                  )
                }
                sx={{
                  width: {
                    xs: "100%",
                    sm: 175,
                  },
                  minHeight: 43,
                  borderRadius:
                    "12px",
                  color:
                    "var(--color-white)",
                  background:
                    "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                  fontSize:
                    "11px",
                  fontWeight:
                    800,
                  textTransform:
                    "none",
                }}
              >
                {loading
                  ? "جاري الحفظ..."
                  : "حفظ التغييرات"}
              </Button>

              <Button
                type="button"
                disabled={loading}
                onClick={() =>
                  setOpen(false)
                }
                variant="outlined"
                startIcon={
                  <CloseRounded />
                }
                sx={{
                  width: {
                    xs: "100%",
                    sm: 125,
                  },
                  minHeight: 43,
                  borderRadius:
                    "12px",
                  color:
                    "var(--color-navy)",
                  borderColor:
                    "rgba(36,74,112,0.18)",
                  fontSize:
                    "11px",
                  fontWeight:
                    800,
                  textTransform:
                    "none",
                }}
              >
                إلغاء
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Edit;
