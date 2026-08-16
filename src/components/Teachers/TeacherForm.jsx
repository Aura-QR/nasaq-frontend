import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ContactPhoneOutlined,
  MenuBookRounded,
  PersonOutlineRounded,
  SchoolOutlined,
} from "@mui/icons-material";

import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";

import Status from "@/utils/constants/Status";

const sectionSx = {
  p: {
    xs: 1.25,
    md: 1.5,
  },

  overflow: "visible",

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

  "&:focus-within": {
    zIndex: 20,
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

  "& .MuiInputBase-input": {
    py: 0.7,
    fontSize: "12px",
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

  "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
    {
      WebkitTextFillColor: "var(--color-text) !important",
      WebkitBoxShadow: "0 0 0 1000px #ffffff inset !important",
      boxShadow: "0 0 0 1000px #ffffff inset !important",
      caretColor: "var(--color-text)",
      borderRadius: "inherit",
      transition: "background-color 9999s ease-out 0s",
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
  contentSx,
}) => {
  return (
    <Paper elevation={0} sx={sectionSx}>
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

const TeacherForm = ({
  register,
  errors,
  mode = "add",
  defaultValues = null,
  selectedSubjects = [],
  setSelectedSubjects,
  showSubjects = false,
}) => {
  const isEdit = mode === "edit";

  return (
    <Stack spacing={1}>
      <FormSection
        icon={<PersonOutlineRounded />}
        title="البيانات الأساسية"
        description="اسم المعلم وبيانات التواصل، وسيتم إنشاء كلمة مرور تلقائيًا بعد الحفظ."
      >
        <Grid item xs={12} sm={6} lg={4}>
          <Input
            register={register}
            registerName="name"
            error={errors.name?.message}
            label="اسم المعلم"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
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

        <Grid item xs={12} sm={6} lg={4}>
          <Input
            register={register}
            registerName="phoneNumber"
            error={errors.phoneNumber?.message}
            label="رقم الهاتف"
            required
            type="tel"
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<SchoolOutlined />}
        title="البيانات المهنية"
        description="المؤهل والتخصص والخبرة وتاريخ التوظيف."
      >
        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="qualification"
            error={errors.qualification?.message}
            label="المؤهل"
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="specialization"
            error={errors.specialization?.message}
            label="التخصص"
            required
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="experience"
            error={errors.experience?.message}
            label="سنوات الخبرة"
            type="number"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Input
            register={register}
            registerName="hireDate"
            error={errors.hireDate?.message}
            label="تاريخ التوظيف"
            type="date"
          />
        </Grid>
      </FormSection>

      <FormSection
        icon={<ContactPhoneOutlined />}
        title="العنوان والحالة"
        description="العنوان الحالي وحالة حساب المعلم."
      >
        <Grid item xs={12} sm={8}>
          <Input
            register={register}
            registerName="address"
            error={errors.address?.message}
            label="العنوان"
            type="text"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
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

      {showSubjects && (
        <FormSection
          icon={<MenuBookRounded />}
          title="المواد الدراسية"
          description="اختر مادة دراسية واحدة على الأقل."
          contentSx={{
            "& > .MuiGrid-item": {
              minHeight: "auto",
            },
          }}
        >
          <Grid item xs={12}>
            <Box
              sx={{
                width: "100%",
                p: {
                  xs: 1,
                  md: 1.2,
                },

                border: "1px solid rgba(36, 74, 112, 0.08)",
                borderRadius: "13px",

                backgroundColor: "var(--color-white)",

                "& label": {
                  fontSize: "11px",
                },
              }}
            >
              <SubjectCheckBoxes
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
              />
            </Box>
          </Grid>
        </FormSection>
      )}
    </Stack>
  );
};

export default TeacherForm;
