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
  EventBusyRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useState,
} from "react";

import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

import Input from "@/components/Input/Input";
import ClassSelector from "@/components/Selector/ClassSelector";
import StudentSelector from "@/components/Selector/StudentSelector";

import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { editAttendance } from "@/APIs/school/attendance";

const normalizeItem = (
  item
) => {
  const student =
    item?.student ||
    (item?.studentId &&
    typeof item.studentId ===
      "object"
      ? item.studentId
      : null);

  const classData =
    item?.class ||
    (item?.classId &&
    typeof item.classId ===
      "object"
      ? item.classId
      : null);

  const academicYearValue =
    item?.academicYear ||
    item?.academicYearId ||
    classData?.academicYear ||
    classData?.academicYearId;

  const academicYear =
    typeof academicYearValue ===
    "string"
      ? academicYearValue
      : academicYearValue?.name ||
        academicYearValue?.label ||
        "";

  return {
    ...item,
    _id:
      item?._id ||
      item?.id,
    id:
      item?._id ||
      item?.id,
    date:
      item?.date
        ? String(
            item.date
          ).split("T")[0]
        : "",
    academicYear,
    class: classData,
    student,
    classId:
      classData?._id ||
      classData?.id ||
      (typeof item?.classId ===
      "string"
        ? item.classId
        : ""),
    studentId:
      student?._id ||
      student?.id ||
      (typeof item?.studentId ===
      "string"
        ? item.studentId
        : ""),
  };
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
    }
  }, [
    item,
    open,
    reset,
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
    formData
  ) => {
    const changedData =
      getChangedValues(
        formData,
        defaultValues,
        [
          "class",
          "student",
        ]
      );

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

    delete changedData
      .academicYear;

    if (
      changedData.date
    ) {
      changedData.date =
        new Date(
          changedData.date
        )
          .toISOString()
          .split("T")[0];
    }

    setLoading(true);

    try {
      const response =
        await editAttendance(
          changedData,
          item?._id ||
            item?.id
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء تعديل الغياب"
        );
        return;
      }

      toast.success(
        "تم تعديل الغياب بنجاح"
      );

      const updatedItem =
        response?.data?.data ||
        response?.data;

      setItems(
        (previousItems) =>
          previousItems.map(
            (currentItem) =>
              (
                currentItem?._id ||
                currentItem?.id
              ) ===
              (
                item?._id ||
                item?.id
              )
                ? {
                    ...currentItem,
                    ...updatedItem,
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
          "حدث خطأ أثناء تعديل الغياب"
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
        maxWidth="sm"
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
                <EventBusyRounded />
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
                  تعديل الغياب
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
                  عدّل الفصل أو الطالب أو تاريخ الغياب.
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
              <DataInputs
                register={register}
                errors={errors}
                setValue={setValue}
                defaultValues={
                  defaultValues
                }
              />
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
                    sm: 170,
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

const DataInputs = ({
  register,
  errors,
  setValue,
  defaultValues,
}) => {
  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState(
    defaultValues.classId ||
      ""
  );

  const handleClassChange = (
    classId
  ) => {
    setSelectedClassId(
      classId
    );

    setValue(
      "classId",
      classId
    );

    setValue(
      "studentId",
      ""
    );
  };

  return (
    <Grid
      container
      spacing={1.5}
    >
      <Grid item xs={12}>
        <ClassSelector
          register={register}
          errors={errors}
          setValue={setValue}
          onClassChange={
            handleClassChange
          }
          defaultAcademicYear={
            defaultValues
              ?.class
              ?.academicYear ||
            defaultValues
              .academicYear ||
            ""
          }
          defaultClassId={
            defaultValues.classId ||
            ""
          }
        />
      </Grid>

      <Grid item xs={12}>
        <StudentSelector
          register={register}
          errors={errors}
          classId={
            selectedClassId
          }
          setValue={setValue}
          defaultStudentId={
            defaultValues
              .studentId ||
            ""
          }
        />
      </Grid>

      <Grid item xs={12}>
        <Input
          register={register}
          registerName="date"
          error={
            errors.date?.message
          }
          label="تاريخ الغياب"
          required
          type="date"
          defaultValue={
            defaultValues.date
          }
        />
      </Grid>
    </Grid>
  );
};

export default Edit;
