import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AssessmentRounded,
  CloseRounded,
  SaveRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubjectSelector from "@/components/Selector/SubjectSelector";

import { addGradesCriteria } from "@/APIs/school/gradesCriteria";
import Years from "@/utils/constants/Years";

const getResponseData = (response) =>
  response?.data?.data ||
  response?.data ||
  response;

const getResponseId = (response) => {
  const payload =
    getResponseData(response);

  return (
    payload?._id ||
    payload?.id ||
    payload?.gradesCriteria?._id ||
    payload?.gradesCriteria?.id ||
    ""
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

const GRADE_FIELDS = [
  "final",
  "activities",
  "projects",
  "assignments",
  "quizzes",
];

const calculateTotal = (values) =>
  GRADE_FIELDS.reduce(
    (total, field) =>
      total +
      Number(values?.[field] || 0),
    0
  );

const normalizePassingGrade = (value) => {
  if (
    value === "" ||
    value === undefined ||
    value === null ||
    Number.isNaN(value)
  ) {
    return 50;
  }

  return Number(value);
};

const isValidPassingGrade = (value) =>
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;

const FORM_CARD_SX = {
  p: {
    xs: 1.5,
    md: 2,
  },
  mt: 1.25,
  overflow: "visible",
  border:
    "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor:
    "var(--color-cream)",
  boxShadow:
    "0 12px 28px rgba(18,47,77,0.06)",

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root":
    {
      minHeight: 48,
      backgroundColor:
        "var(--color-white)",
      borderRadius: "12px",
    },

  "& .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.16)",
    },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "rgba(36,74,112,0.28)",
    },

  "& .MuiOutlinedInput-root.Mui-focused":
    {
      boxShadow:
        "0 0 0 3px rgba(211,164,79,0.10)",
    },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor:
        "var(--color-gold)",
      borderWidth: "1px",
    },

  "& .MuiInputLabel-root": {
    px: 0.65,
    color:
      "var(--color-muted)",
    backgroundColor:
      "var(--color-cream)",
    fontSize: "10.5px",
    fontWeight: 700,
  },
};

const SectionHeading = ({
  icon,
  title,
  description,
  endContent,
}) => (
  <Stack
    direction={{
      xs: "column",
      sm: "row",
    }}
    alignItems={{
      xs: "stretch",
      sm: "center",
    }}
    justifyContent="space-between"
    gap={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom:
        "1px solid rgba(36,74,112,0.07)",
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
          placeItems: "center",
          flexShrink: 0,
          color:
            "var(--color-gold-dark)",
          backgroundColor:
            "var(--color-gold-soft)",
          border:
            "1px solid rgba(211,164,79,0.22)",
          borderRadius: "12px",

          "& svg": {
            fontSize: 21,
          },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            color:
              "var(--color-muted)",
            fontSize: "10px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>

    {endContent}
  </Stack>
);


const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      passingGrade: 50,
    },
  });

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const querySubjectId =
    searchParams.get(
      "subjectId"
    ) || "";

  const queryAcademicYear =
    searchParams.get(
      "academicYear"
    ) || "";

  useEffect(() => {
    if (querySubjectId) {
      setValue(
        "subjectId",
        querySubjectId
      );
    }

    if (queryAcademicYear) {
      setValue(
        "academicYear",
        queryAcademicYear
      );
    }
  }, [
    querySubjectId,
    queryAcademicYear,
    setValue,
  ]);

  const watchedValues =
    watch();

  const totalGrades =
    useMemo(
      () =>
        calculateTotal(
          watchedValues
        ),
      [watchedValues]
    );

  const isTotalValid =
    totalGrades === 100;

  const onSubmit = async (
    formData
  ) => {
    if (!isTotalValid) {
      toast.error(
        "يجب أن يكون مجموع الدرجات 100 درجة"
      );
      return;
    }

    const passingGrade =
      normalizePassingGrade(
        formData.passingGrade
      );

    if (
      !isValidPassingGrade(
        passingGrade
      )
    ) {
      toast.error(
        "درجة النجاح يجب أن تكون من 0 إلى 100"
      );
      return;
    }

    const payload = {
      ...formData,
      passingGrade,
    };

    setLoading(true);

    try {
      const response =
        await addGradesCriteria(
          payload
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إضافة توزيع الدرجات"
          )
        );
        return;
      }

      toast.success(
        "تم توزيع درجات المادة بنجاح"
      );

      const createdId =
        getResponseId(
          response
        );

      navigate(
        createdId
          ? `/school/gradesCriteria/${createdId}`
          : "/school/gradesCriteria"
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة توزيع الدرجات"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(
          onSubmit
        )}
        noValidate
        dir="rtl"
        sx={{
          width: "100%",
          pb: 3,
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.05,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "rgba(255,252,247,0.9)",
            boxShadow:
              "0 8px 20px rgba(18,47,77,0.04)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="إضافة توزيع درجات" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              اختر المادة والسنة ثم
              وزّع 100 درجة على
              البنود.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <SchoolRounded />
            }
            title="المادة والسنة الدراسية"
            description="حدّد المادة والسنة التي سيطبق عليها توزيع الدرجات."
          />

          <Grid
            container
            spacing={{
              xs: 1.5,
              md: 2,
            }}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Select
                register={register}
                registerName="academicYear"
                data={Years}
                error={
                  errors
                    .academicYear
                    ?.message
                }
                label="السنة الدراسية للمادة"
                required
                defaultValue={
                  queryAcademicYear
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <SubjectSelector
                register={register}
                errors={errors}
                label="المادة"
                required
                defaultSubjectId={
                  querySubjectId
                }
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <AssessmentRounded />
            }
            title="تفاصيل توزيع الدرجات"
            description="حدّد درجة النجاح ثم وزّع بنود التقييم بحيث يكون مجموعها 100 درجة؛ درجة النجاح لا تدخل في المجموع."
            endContent={
              <Chip
                label={`${totalGrades} / 100`}
                sx={{
                  minWidth: 88,
                  height: 34,
                  color:
                    isTotalValid
                      ? "#237449"
                      : "var(--color-danger)",
                  backgroundColor:
                    isTotalValid
                      ? "rgba(116,201,154,0.16)"
                      : "rgba(201,79,79,0.08)",
                  border:
                    isTotalValid
                      ? "1px solid rgba(116,201,154,0.28)"
                      : "1px solid rgba(201,79,79,0.18)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              />
            }
          />

          <GradeInputs
            register={register}
            errors={errors}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: {
              xs: 1.25,
              md: 1.6,
            },
            py: 1.15,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.05)",
          }}
        >
          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            gap={1}
          >
            <Button
              type="submit"
              disabled={
                loading ||
                !isTotalValid
              }
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
                  sm: 200,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "7px",
                    marginRight: 0,
                  },
              }}
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ توزيع الدرجات"}
            </Button>

            <Button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              variant="outlined"
              startIcon={
                <CloseRounded />
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: 145,
                },
                minHeight: 44,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.18)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "7px",
                    marginRight: 0,
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

const GradeInputs = ({
  register,
  errors,
  defaultValues = {},
}) => (
  <Grid
    container
    spacing={{
      xs: 1.5,
      md: 2,
    }}
  >
    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="passingGrade"
        error={errors.passingGrade?.message}
        label="درجة النجاح"
        type="number"
        defaultValue={
          defaultValues.passingGrade ?? 50
        }
        valueAsNumber
        inputProps={{
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="final"
        error={errors.final?.message}
        label="درجة الاختبار النهائي"
        required
        type="number"
        defaultValue={defaultValues.final}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="activities"
        error={errors.activities?.message}
        label="درجة أعمال السنة"
        required
        type="number"
        defaultValue={defaultValues.activities}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="projects"
        error={errors.projects?.message}
        label="درجة المهام الأدائية"
        required
        type="number"
        defaultValue={defaultValues.projects}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="projectsCount"
        error={errors.projectsCount?.message}
        label="عدد المهام الأدائية"
        required
        type="number"
        defaultValue={defaultValues.projectsCount}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="assignments"
        error={errors.assignments?.message}
        label="درجة الواجبات"
        required
        type="number"
        defaultValue={defaultValues.assignments}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="assignmentsCount"
        error={errors.assignmentsCount?.message}
        label="عدد الواجبات"
        required
        type="number"
        defaultValue={defaultValues.assignmentsCount}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="quizzes"
        error={errors.quizzes?.message}
        label="درجة الاختبارات القصيرة"
        required
        type="number"
        defaultValue={defaultValues.quizzes}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} lg={4}>
      <Input
        register={register}
        registerName="quizzesCount"
        error={errors.quizzesCount?.message}
        label="عدد الاختبارات القصيرة"
        required
        type="number"
        defaultValue={defaultValues.quizzesCount}
        valueAsNumber
      />
    </Grid>
  </Grid>
);

export default Add;
