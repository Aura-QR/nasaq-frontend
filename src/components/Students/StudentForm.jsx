import {
  Autocomplete,
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
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
import ClassSelector from "@/components/Selector/ClassSelector";
import InstallmentPlanSelector from "@/components/Selector/InstallmentPlanSelector";

import Status from "@/utils/constants/Status";
import Countries from "@/utils/constants/Countries";

const sectionSx = {
  position: "relative",
  overflow: "visible",

  p: {
    xs: 1.25,
    md: 1.5,
  },

  border: "1px solid rgba(36, 74, 112, 0.08)",
  borderRadius: "16px",

  backgroundColor: "var(--color-cream)",
  boxShadow: "0 8px 20px rgba(18, 47, 77, 0.045)",

  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

  "&:hover": {
    transform: "translateY(-1px)",
    borderColor: "rgba(211, 164, 79, 0.18)",
    boxShadow: "0 12px 25px rgba(18, 47, 77, 0.07)",
  },

  /*
   * عند فتح الجنسية أو التركيز داخل الكارد نرفعه فوق
   * الكروت التالية، حتى لا تختفي القائمة خلفها.
   */
  "&:focus-within": {
    zIndex: 30,
  },

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 44,
    height: 44,

    backgroundColor: "var(--color-white)",
    borderRadius: "12px",

    transition:
      "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
  },

  "& .MuiInputBase-root:hover, & .MuiOutlinedInput-root:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 5px 13px rgba(18, 47, 77, 0.055)",
  },

  "& .MuiInputBase-root.MuiInputBase-multiline": {
    height: "auto",
    minHeight: 86,
    alignItems: "flex-start",
  },

  "& .MuiInputBase-input": {
    py: 0.7,
    fontSize: "12px",
  },

  "& .MuiInputBase-inputMultiline": {
    minHeight: "62px !important",
    py: 0.8,
    lineHeight: 1.7,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.13)",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36, 74, 112, 0.24)",
  },

  "& .MuiOutlinedInput-root.Mui-focused": {
    transform: "translateY(-1px)",
    boxShadow: "0 0 0 3px rgba(211, 164, 79, 0.10)",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderWidth: "1px",
    borderColor: "var(--color-gold)",
  },

  "& .MuiInputLabel-root": {
    color: "var(--color-muted)",
    fontSize: "10.5px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--color-gold-dark)",
  },

  /*
   * منع Chrome من تلوين البريد وكلمة المرور بالأزرق
   * عند الـautofill.
   */
  "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
    {
      WebkitTextFillColor: "var(--color-text) !important",
      WebkitBoxShadow: "0 0 0 1000px #ffffff inset !important",
      boxShadow: "0 0 0 1000px #ffffff inset !important",
      caretColor: "var(--color-text)",
      borderRadius: "inherit",
      transition: "background-color 9999s ease-out 0s",
    },

  "& .MuiOutlinedInput-root:has(input:-webkit-autofill)": {
    backgroundColor: "#ffffff !important",
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
  sx,
  contentSx,
}) => {
  return (
    <Paper
      elevation={0}
      sx={[sectionSx, sx]}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.9}
        sx={{ mb: 1.1 }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,

            display: "grid",
            placeItems: "center",
            flexShrink: 0,

            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",

            border: "1px solid rgba(211, 164, 79, 0.21)",
            borderRadius: "10px",

            "& svg": {
              fontSize: 18,
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
              fontSize: "14px",
              fontWeight: 800,
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.12,
              color: "var(--color-muted)",
              fontSize: "9px",
              lineHeight: 1.45,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Stack>

      <Grid
        container
        spacing={{
          xs: 1,
          md: 1.15,
        }}
        alignItems="stretch"
        sx={[
          {
            /*
             * نوحّد خط بداية ونهاية كل الحقول حتى لو كان
             * كل Component يرسم الـlabel بطريقة مختلفة.
             */
            "& > .MuiGrid-item": {
              minHeight: 72,
              display: "flex",
              alignItems: "flex-end",
            },

            "& > .MuiGrid-item > *": {
              width: "100%",
            },
          },
          contentSx,
        ]}
      >
        {children}
      </Grid>
    </Paper>
  );
};

const NationalitySelect = ({
  register,
  setValue,
  defaultValues,
}) => {
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

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* تسجيل القيمة داخل react-hook-form */}
      <input
        type="hidden"
        {...register("nationality")}
      />

      <Autocomplete
        options={Countries}
        value={nationality}
        inputValue={nationalityInput}
        autoHighlight
        openOnFocus
        fullWidth
        noOptionsText="لا توجد نتائج"
        getOptionLabel={(option) => option?.name || ""}
        isOptionEqualToValue={(option, selectedValue) =>
          option?.name === selectedValue?.name
        }
        onChange={(_, newValue) => {
          setNationality(newValue);

          setValue(
            "nationality",
            newValue ? newValue.name : "",
            {
              shouldDirty: true,
              shouldValidate: true,
            }
          );
        }}
        onInputChange={(_, newInputValue, reason) => {
          setNationalityInput(newInputValue);

          if (reason === "clear") {
            setValue("nationality", "", {
              shouldDirty: true,
            });
          }
        }}
        ListboxProps={{
          sx: {
            maxHeight: 190,
            py: 0.5,

            scrollbarWidth: "thin",
            scrollbarColor:
              "rgba(36,74,112,0.22) transparent",

            "& .MuiAutocomplete-option": {
              minHeight: 38,
              px: 1.4,
              py: 0.6,

              color: "var(--color-text)",
              fontSize: "12px",
              fontWeight: 600,

              borderRadius: "8px",
              mx: 0.5,
            },

            "& .MuiAutocomplete-option[aria-selected='true']": {
              color: "var(--color-navy-deep)",
              backgroundColor:
                "var(--color-gold-soft) !important",
            },

            "& .MuiAutocomplete-option.Mui-focused": {
              backgroundColor:
                "rgba(36,74,112,0.06)",
            },
          },
        }}
        componentsProps={{
          popper: {
            sx: {
              zIndex: 1800,
            },
          },

          paper: {
            sx: {
              mt: 0.6,
              overflow: "hidden",

              border:
                "1px solid rgba(36,74,112,0.10)",
              borderRadius: "12px",

              backgroundColor: "#ffffff",

              boxShadow:
                "0 16px 38px rgba(18,47,77,0.16)",
            },
          },
        }}
        renderInput={(params) => (
          <Box
            sx={{
              width: "100%",
            }}
          >
            <Typography
              component="label"
              sx={{
                minHeight: 18,
                mb: 0.65,

                display: "flex",
                alignItems: "center",
                gap: 0.4,

                color: "var(--color-muted)",
                fontSize: "10.5px",
                fontWeight: 700,
                lineHeight: 1.35,
              }}
            >
              الجنسية
              <Box
                component="span"
                sx={{
                  color: "var(--color-danger)",
                  fontSize: "13px",
                  lineHeight: 1,
                }}
              >
                *
              </Box>
            </Typography>

            <TextField
              {...params}
              placeholder="ابحث عن الجنسية..."
              required
              autoComplete="off"
              inputProps={{
                ...params.inputProps,
                autoComplete: "new-password",
              }}
              sx={{
                "& .MuiInputBase-root": {
                  height: 44,
                  minHeight: 44,
                },
              }}
            />
          </Box>
        )}
      />
    </Box>
  );
};

const StudentForm = ({
  register,
  errors,
  setValue,
  mode = "add",
  defaultValues = null,
}) => {
  const isEdit = mode === "edit";

  return (
    <Stack spacing={1}>
      <FormSection
        icon={<PersonOutlineRounded />}
        title="البيانات الشخصية"
        description="الاسم والجنسية وتاريخ الميلاد."
      >
        {/* توزيع الخمس حقول في صف واحد على الشاشات الكبيرة */}
        <Grid item xs={12} sm={6} lg={2}>
          <Input
            register={register}
            registerName="firstName"
            error={errors.firstName?.message}
            label="الاسم الأول"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={2}>
          <Input
            register={register}
            registerName="fatherName"
            error={errors.fatherName?.message}
            label="اسم الأب"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={2}>
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
          <NationalitySelect
            register={register}
            setValue={setValue}
            defaultValues={defaultValues}
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<ContactPhoneOutlined />}
        title="بيانات التواصل والحساب"
        description="بيانات الدخول والتواصل الأساسية."
      >
        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="phoneNumber"
            error={errors.phoneNumber?.message}
            label="رقم الهاتف"
            required
            type="tel"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="email"
            error={errors.email?.message}
            label="البريد الإلكتروني"
            required
            type="email"
            autoComplete="off"
          />
        </Grid>

        {!isEdit && (
          <Grid item xs={12} sm={6} lg={3}>
            <Input
              register={register}
              registerName="password"
              error={errors.password?.message}
              label="كلمة المرور"
              required
              type="password"
              autoComplete="new-password"
            />
          </Grid>
        )}

        <Grid
          item
          xs={12}
          sm={6}
          lg={isEdit ? 6 : 3}
        >
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
        description="السنة الدراسية والنوع والفصل."
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
        title="التسجيل والرسوم"
        description="تاريخ التسجيل وخطة السداد وحالة الحساب."
      >
        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Input
            register={register}
            registerName="previousSchool"
            error={errors.previousSchool?.message}
            label="المدرسة السابقة"
            type="text"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Input
            register={register}
            registerName="registrationDate"
            error={errors.registrationDate?.message}
            label="تاريخ التسجيل"
            type="date"
            required
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Box sx={{ width: "100%" }}>
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
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          sx={{ display: "flex", alignItems: "flex-end" }}
        >
          <Box sx={{ width: "100%" }}>
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
          </Box>
        </Grid>
      </FormSection>

      <FormSection
        icon={<NotesOutlined />}
        title="ملاحظات إضافية"
        description="أي معلومات أخرى عن الطالب."
        sx={{
          p: {
            xs: 1.05,
            md: 1.2,
          },
        }}
        contentSx={{
          "& > .MuiGrid-item": {
            minHeight: "auto",
          },
        }}
      >
        <Grid item xs={12}>
          <Box sx={{ width: "100%" }}>
            <Typography
              component="label"
              sx={{
                mb: 0.55,
                display: "block",
                color: "var(--color-muted)",
                fontSize: "10.5px",
                fontWeight: 700,
                lineHeight: 1.35,
              }}
            >
              ملاحظات
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="اكتب ملاحظات مختصرة عن الطالب..."
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message}
              {...register("notes")}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: 96,
                  height: "auto",
                  alignItems: "flex-start",
                  p: 1.1,
                },

                "& .MuiInputBase-inputMultiline": {
                  minHeight: "66px !important",
                  maxHeight: 120,
                  py: "0 !important",
                  lineHeight: 1.7,
                  overflowY: "auto !important",
                  resize: "vertical",
                },

                "& .MuiFormHelperText-root": {
                  mt: 0.45,
                  mx: 0.4,
                  fontSize: "9.5px",
                },
              }}
            />
          </Box>
        </Grid>
      </FormSection>
    </Stack>
  );
};

export default StudentForm;
