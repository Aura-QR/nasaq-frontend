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
  EventBusyRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

import Input from "@/components/Input/Input";
import ClassSelector from "@/components/Selector/ClassSelector";
import StudentSelector from "@/components/Selector/StudentSelector";

import { addAttendance } from "@/APIs/school/attendance";

const getToday = () =>
  new Date()
    .toISOString()
    .split("T")[0];

const mapAttendanceItem = (
  item
) => ({
  ...item,
  id:
    item?._id ||
    item?.id,
  _id:
    item?._id ||
    item?.id,
  name:
    item?.student?.name ||
    item?.name ||
    "",
  student:
    item?.student,
  studentId:
    item?.studentId ||
    item?.student?._id,
  class:
    item?.class,
  classId:
    item?.classId ||
    item?.class?._id,
  date:
    item?.date,
});

const Add = ({
  setItems,
  setLocalPagination,
  compact = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      date: getToday(),
    },
  });

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

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
    const submissionData = {
      classId:
        formData.classId,
      studentId:
        formData.studentId,
      date: new Date(
        formData.date
      )
        .toISOString()
        .split("T")[0],
    };

    setLoading(true);

    try {
      const response =
        await addAttendance(
          submissionData
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء إضافة الغياب"
        );
        return;
      }

      toast.success(
        "تم إضافة غياب الطالب بنجاح"
      );

      const createdItem =
        response?.data?.data ||
        response?.data;

      if (createdItem) {
        setItems(
          (previousItems) => [
            mapAttendanceItem(
              createdItem
            ),
            ...previousItems,
          ]
        );
      }

      setLocalPagination(
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

      reset({
        date: getToday(),
        classId: "",
        studentId: "",
      });

      setOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة الغياب"
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
                ? 170
                : 180,
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
        إضافة غياب جديد
      </Button>

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
          sx={{
            p: 0,
          }}
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
                  إضافة غياب جديد
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
                  حدّد الفصل والطالب وتاريخ الغياب.
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
            <DataInputs
              register={register}
              errors={errors}
              setValue={setValue}
            />

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
                  : "حفظ الغياب"}
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

const DataInputs = ({
  register,
  errors,
  setValue,
}) => {
  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState("");

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
            getToday()
          }
        />
      </Grid>
    </Grid>
  );
};

export default Add;
