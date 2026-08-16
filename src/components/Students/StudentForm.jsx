import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ContactPhoneOutlined,
  NotesOutlined,
  PaymentsOutlined,
  PersonOutlineRounded,
  SchoolOutlined,
} from "@mui/icons-material";

import { useEffect, useState } from "react";

import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SingleSelect from "@/components/SingleSelect/SingleSelect";
import ClassSelector from "@/components/Selector/ClassSelector";
import InstallmentPlanSelector from "@/components/Selector/InstallmentPlanSelector";

import Status from "@/utils/constants/Status";
import Countries from "@/utils/constants/Countries";

const sectionSx = {
  p: {
    xs: 1.6,
    md: 2,
  },

  border: "1px solid rgba(36, 74, 112, 0.08)",
  borderRadius: "18px",

  backgroundColor: "var(--color-cream)",

  boxShadow: "0 10px 24px rgba(18, 47, 77, 0.055)",

  transition:
    "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",

  "&:hover": {
    transform: "translateY(-2px)",
    borderColor: "rgba(211, 164, 79, 0.20)",
    boxShadow: "0 15px 30px rgba(18, 47, 77, 0.085)",
  },

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "var(--color-white)",
    borderRadius: "13px",

    transition:
      "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
  },

  "& .MuiInputBase-root:hover, & .MuiOutlinedInput-root:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 7px 16px rgba(18, 47, 77, 0.065)",
  },

  "& .MuiOutlinedInput-root.Mui-focused": {
    transform: "translateY(-1px)",
    boxShadow: "0 0 0 3px rgba(211, 164, 79, 0.11)",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.13)",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.25)",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px",
    borderColor: "var(--color-gold)",
  },

  "& .MuiInputLabel-root": {
    color: "var(--color-muted)",
    fontSize: "11px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--color-gold-dark)",
  },

  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",

    "&, & *": {
      animation: "none !important",
      transition: "none !important",
      transform: "none !important",
    },
  },
};

const FormSection = ({
  icon,
  title,
  description,
  children,
}) => (
  <Paper elevation={0} sx={sectionSx}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      sx={{
        mb: 1.7,
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

          border: "1px solid rgba(211, 164, 79, 0.23)",
          borderRadius: "12px",

          "& svg": {
            fontSize: 21,
          },
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          component="h2"
          sx={{
            color: "var(--color-navy-deep)",
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.35,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            color: "var(--color-muted)",
            fontSize: "9.5px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>

    <Grid
      container
      spacing={{
        xs: 1.4,
        md: 1.6,
      }}
    >
      {children}
    </Grid>
  </Paper>
);

const StudentForm = ({
  register,
  errors,
  setValue,
  mode = "add",
  defaultValues = null,
}) => {
  const isEdit = mode === "edit";

  const [nationality, setNationality] = useState(null);
  const [nationalityInput, setNationalityInput] = useState("");

  useEffect(() => {
    const nationalityName = defaultValues?.nationality;

    if (!nationalityName) {
      setNationality(null);
      setNationalityInput("");
      return;
    }

    const selectedCountry =
      Countries.find(
        (country) => country.name === nationalityName
      ) || null;

    setNationality(selectedCountry);
    setNationalityInput(nationalityName);
  }, [defaultValues]);

  const handleNationalityChange = (_, newValue) => {
    setNationality(newValue);

    setValue(
      "nationality",
      newValue ? newValue.name : "",
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <Stack spacing={1.5}>
      <FormSection
        icon={<PersonOutlineRounded />}
        title="البيانات الشخصية"
        description="أدخل الاسم والجنسية وتاريخ الميلاد."
      >
        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="firstName"
            error={errors.firstName?.message}
            label="الاسم الأول"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="fatherName"
            error={errors.fatherName?.message}
            label="اسم الأب"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="familyName"
            error={errors.familyName?.message}
            label="اسم العائلة"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="birthDate"
            error={errors.birthDate?.message}
            label="تاريخ الميلاد"
            required
            type="date"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <SingleSelect
            value={nationality}
            onChange={handleNationalityChange}
            inputValue={nationalityInput}
            onInputChange={(_, newInputValue) =>
              setNationalityInput(newInputValue)
            }
            options={Countries}
            label="الجنسية"
            placeholder="ابحث عن الجنسية..."
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<ContactPhoneOutlined />}
        title="بيانات التواصل والحساب"
        description="أدخل رقم الهاتف والعنوان فقط؛ البريد المدرسي وكلمة المرور سيتم إنشاؤهما تلقائيًا بعد الحفظ."
      >
        <Grid item xs={12} sm={6} lg={isEdit ? 4 : 6}>
          <Input
            register={register}
            registerName="phoneNumber"
            error={errors.phoneNumber?.message}
            label="رقم الهاتف"
            required
            type="tel"
          />
        </Grid>

        {isEdit && (
          <Grid item xs={12} sm={6} lg={4}>
            <Input
              register={register}
              registerName="email"
              error={errors.email?.message}
              label="البريد المدرسي"
              required
              type="email"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} lg={isEdit ? 4 : 6}>
          <Input
            register={register}
            registerName="address"
            error={errors.address?.message}
            label="العنوان"
            required
            type="text"
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<SchoolOutlined />}
        title="البيانات الدراسية"
        description="حدّد السنة الدراسية والنوع والفصل."
      >
        <ClassSelector
          register={register}
          errors={errors}
          setValue={setValue}
          showGender
          isAcademicYearRequired
          isClassRequired={false}
          gridProps={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
          {...(isEdit
            ? {
                defaultAcademicYear:
                  defaultValues?.academicYear,
                defaultGender:
                  defaultValues?.gender,
                defaultClassId:
                  defaultValues?.classId,
              }
            : {
                defaultSelect: "بدون فصل",
              })}
        />
      </FormSection>

      <FormSection
        icon={<PaymentsOutlined />}
        title="بيانات التسجيل والرسوم"
        description="إعدادات التسجيل وخطة السداد وحالة الحساب."
      >
        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="previousSchool"
            error={errors.previousSchool?.message}
            label="المدرسة السابقة"
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="registrationDate"
            error={errors.registrationDate?.message}
            label="تاريخ التسجيل"
            type="date"
            required
            {...(!isEdit
              ? {
                  defaultValue: new Date()
                    .toISOString()
                    .split("T")[0],
                }
              : {})}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <InstallmentPlanSelector
            register={register}
            errors={errors}
            required={false}
            {...(isEdit
              ? {
                  defaultInstallmentPlanId:
                    defaultValues?.installmentPlanId || "",
                }
              : {})}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Select
            register={register}
            registerName="isActive"
            data={Status}
            name="label"
            error={errors.isActive?.message}
            label="الحالة"
            required
            defaultValue={
              isEdit ? defaultValues?.isActive : 1
            }
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<NotesOutlined />}
        title="ملاحظات إضافية"
        description="أي معلومات أخرى تحتاج الإدارة إلى معرفتها."
      >
        <Grid item xs={12}>
          <Input
            register={register}
            registerName="notes"
            error={errors.notes?.message}
            label="ملاحظات"
            type="text"
            multiline
          />
        </Grid>
      </FormSection>
    </Stack>
  );
};

export default StudentForm;
