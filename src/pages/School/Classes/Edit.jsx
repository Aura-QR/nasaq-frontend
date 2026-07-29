import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CloseRounded,
  EditNoteRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import TeacherInChargeSelector from "@/components/Selector/TeacherInChargeSelector";
import Loading from "@/components/Loading";

import { editClass } from "@/APIs/school/classes";
import { useClass } from "@/utils/hooks/apis/useClass";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import Years from "@/utils/constants/Years";
import Gender from "@/utils/constants/Gender";
import Status from "@/utils/constants/Status";

const FORM_CARD_SX = {
  p: { xs: 1.5, md: 2 },
  mt: 1.25,
  border: "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream)",
  boxShadow: "0 12px 28px rgba(18,47,77,0.06)",
  "& .MuiFormControl-root": { width: "100%", margin: 0 },
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 46,
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36,74,112,0.13)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--color-gold)",
    borderWidth: "1px",
  },
};

const SectionHeading = ({ icon, title, description }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom: "1px solid rgba(36,74,112,0.07)",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "var(--color-gold-dark)",
        backgroundColor: "var(--color-gold-soft)",
        border: "1px solid rgba(211,164,79,0.22)",
        borderRadius: "12px",
        "& svg": { fontSize: 21 },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-navy-deep)",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "10px" }}
      >
        {description}
      </Typography>
    </Box>
  </Stack>
);

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentClass, loading: classLoading } = useClass(id);

  useEffect(() => {
    if (!currentClass) return;

    const formattedClass = {
      ...currentClass,
      isActive: currentClass.isActive ? 1 : 0,
      maxCapacity: Number(currentClass.maxCapacity || 0),
      teacherInChargeId:
        currentClass?.teacherInChargeId || currentClass?.teacherInCharge?._id,
      teacherName: currentClass?.teacherInCharge?.name,
    };

    reset(formattedClass);
    setDefaultValues(formattedClass);
  }, [currentClass, reset]);

  const onSubmit = async (formData) => {
    if (!defaultValues) return;

    setLoading(true);

    try {
      const normalizedData = {
        ...formData,
        maxCapacity: Number(formData.maxCapacity),
        isActive: Number(formData.isActive),
      };

      const normalizedDefaults = {
        ...defaultValues,
        maxCapacity: Number(defaultValues.maxCapacity),
        isActive: Number(defaultValues.isActive),
      };

      if (
        !Number.isFinite(normalizedData.maxCapacity) ||
        normalizedData.maxCapacity <= 0
      ) {
        toast.error("يرجى إدخال سعة صحيحة للفصل");
        return;
      }

      const changedData = getChangedValues(
        normalizedData,
        normalizedDefaults,
        ["subjects", "students", "teacherInCharge"]
      );

      if (Object.keys(changedData).length === 0) {
        toast.info("لم يتم تغيير أي بيانات");
        return;
      }

      if (changedData.isActive !== undefined) {
        changedData.isActive = Number(changedData.isActive) === 1;
      }

      if (changedData.maxCapacity !== undefined) {
        changedData.maxCapacity = Number(changedData.maxCapacity);
      }

      const response = await editClass(changedData, id);

      if (!response?.status) {
        toast.error(
          response?.message || response || "حدث خطأ أثناء تعديل بيانات الفصل"
        );
        return;
      }

      toast.success("تم تعديل بيانات الفصل بنجاح");
      navigate("/school/classes");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء تعديل بيانات الفصل"
      );
    } finally {
      setLoading(false);
    }
  };

  if (classLoading && !defaultValues) {
    return <Loading />;
  }

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 3,
          color: "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor: "rgba(255,252,247,0.9)",
            boxShadow: "0 8px 20px rgba(18,47,77,0.04)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="تعديل الفصل" />
            <Typography
              sx={{ color: "var(--color-muted)", fontSize: "10px" }}
            >
              عدّل البيانات المطلوبة ثم احفظ التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading
            icon={<EditNoteRounded />}
            title="بيانات الفصل"
            description="عدّل السنة الدراسية والسعة ورائد الفصل والحالة."
          />

          {defaultValues && (
            <DataInputs
              register={register}
              errors={errors}
              defaultValues={defaultValues}
            />
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: { xs: 1.25, md: 1.6 },
            py: 1.15,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 10px 24px rgba(18,47,77,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-start"
            gap={1}
          >
            <Button
              type="submit"
              disabled={loading || classLoading}
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: { xs: "100%", sm: 180 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                boxShadow: "0 9px 20px rgba(18,47,77,0.16)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
                  marginRight: 0,
                },
                "&:hover": {
                  background:
                    "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                },
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>

            <Button
              type="button"
              disabled={loading}
              variant="outlined"
              startIcon={<CloseRounded />}
              onClick={() => navigate("/school/classes")}
              sx={{
                width: { xs: "100%", sm: 135 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-navy)",
                borderColor: "rgba(36,74,112,0.18)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
                  marginRight: 0,
                },
                "&:hover": {
                  borderColor: "var(--color-gold)",
                  backgroundColor: "var(--color-gold-soft)",
                },
              }}
            >
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultValues }) => (
  <Grid container spacing={{ xs: 1.5, md: 2 }}>
    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="academicYear"
        error={errors.academicYear?.message}
        label="السنة الدراسية"
        required
        data={Years}
        defaultValue={defaultValues.academicYear}
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Input
        register={register}
        registerName="roomNumber"
        error={errors.roomNumber?.message}
        label="رقم الفصل"
        required
        type="text"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="gender"
        name="label"
        error={errors.gender?.message}
        label="نوع الفصل"
        required
        data={Gender}
        defaultValue={defaultValues.gender}
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <TeacherInChargeSelector
        register={register}
        errors={errors}
        defaultTeacherInChargeId={defaultValues.teacherInChargeId}
        defaultTeacherInChargeName={defaultValues.teacherName}
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Input
        register={register}
        registerName="maxCapacity"
        error={errors.maxCapacity?.message}
        label="أقصى سعة للفصل"
        required
        type="number"
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="isActive"
        data={Status}
        defaultValue={defaultValues.isActive}
        name="label"
        error={errors.isActive?.message}
        label="الحالة"
        required
      />
    </Grid>
  </Grid>
);

export default Edit;
