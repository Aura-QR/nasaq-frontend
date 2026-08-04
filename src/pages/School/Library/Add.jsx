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
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubjectSelector from "@/components/Selector/SubjectSelector";


import {
  addLibrary,
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
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.docs)) {
    return value.docs;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

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

const Add = ({
  setItems,
  setLocalPagination,
  compact = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      link: "",
      subjectId: "",
      academicYearId: "",
    },
  });

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [academicYears, setAcademicYears] =
    useState([]);

  const [loadingYears, setLoadingYears] =
    useState(false);

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

  const academicYearMap = useMemo(
    () =>
      new Map(
        academicYears.map((item) => [
          item.id,
          item,
        ])
      ),
    [academicYears]
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
    formValues
  ) => {
    const submissionData = {
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

    if (!submissionData.subjectId) {
      delete submissionData.subjectId;
    }

    if (!submissionData.academicYearId) {
      delete submissionData.academicYearId;
    }

    setLoading(true);

    try {
      const response =
        await addLibrary(
          submissionData
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة عنصر المكتبة"
          )
        );
        return;
      }

      toast.success(
        "تم إضافة عنصر المكتبة بنجاح"
      );

      const createdItem =
        getResponseData(response);

      if (createdItem) {
        const subjectId = normalizeId(
          createdItem?.subjectId ||
            submissionData.subjectId
        );

        let subjectData =
          createdItem?.subject ||
          (createdItem?.subjectId &&
          typeof createdItem.subjectId === "object"
            ? createdItem.subjectId
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
          createdItem?.academicYearId ||
            submissionData.academicYearId
        );

        const academicYearData =
          (createdItem?.academicYearId &&
          typeof createdItem.academicYearId ===
            "object"
            ? createdItem.academicYearId
            : null) ||
          academicYearMap.get(academicYearId) ||
          null;

        const normalizedItem = {
          ...createdItem,
          subjectId,
          subject:
            subjectData ||
            createdItem?.subject,
          academicYearId,
          academicYear:
            academicYearData?.name ||
            createdItem?.academicYear ||
            "",
        };

        setItems?.(
          (previousItems) => [
            normalizedItem,
            ...previousItems,
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

          const currentLimit =
            Number(
              previous.limit ||
                10
            );

          return {
            ...previous,
            totalDocs,
            totalPages:
              Math.ceil(
                totalDocs /
                  currentLimit
              ),
          };
        }
      );

      reset();
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
            sm:
              compact
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
                <LibraryAddRounded />
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
                  أضف رابطًا أو مصدرًا تعليميًا إلى المكتبة.
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
                  label="المادة المرتبط بها العنصر"
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
              >
                <Select
                  register={register}
                  registerName="academicYearId"
                  data={academicYears}
                  name="name"
                  error={
                    errors.academicYearId
                      ?.message
                  }
                  label="السنة الدراسية"
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

                  "& .MuiButton-startIcon":
                    {
                      marginLeft:
                        "7px",
                      marginRight:
                        0,
                    },
                }}
              >
                {loading
                  ? "جاري الحفظ..."
                  : "حفظ العنصر"}
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

                  "& .MuiButton-startIcon":
                    {
                      marginLeft:
                        "7px",
                      marginRight:
                        0,
                    },
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

export default Add;
