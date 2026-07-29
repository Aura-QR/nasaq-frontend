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
  AddCircleOutlineRounded,
  CloseRounded,
  EditNoteRounded,
  GradeRounded,
  InfoOutlined,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useFieldArray,
  useForm,
} from "react-hook-form";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import Input from "@/components/Input/Input";
import Questions from "@/pages/School/Exams/Components/Questions";
import Loading from "@/components/Loading";

import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useExam } from "@/utils/hooks/apis/useExam";

import { editExam } from "@/APIs/school/exams";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";

import MCQExams from "@/utils/constants/MCQExams";
import usePermissions from "@/utils/hooks/usePermissions";

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
    payload?.exam?._id ||
    payload?.exam?.id ||
    ""
  );
};

const getResponseList = (response) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload?.docs ||
    payload?.items ||
    payload?.results ||
    []
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

const createQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

const normalizeQuestion = (
  question = {}
) => ({
  question:
    question?.question || "",
  options: [
    ...(Array.isArray(
      question?.options
    )
      ? question.options
      : []),
    "",
    "",
    "",
    "",
  ].slice(0, 4),
  correctAnswer:
    question?.correctAnswer ||
    "",
});

const validateExamDates = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    return true;
  }

  return (
    new Date(endDate) >=
    new Date(startDate)
  );
};

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
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom:
        "1px solid rgba(36,74,112,0.07)",
    }}
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
);

const GradesCriteriaStatus = ({
  loading,
  hasGradesCriteria,
  subjectId,
  academicYear,
  canAddCriteria,
  navigate,
}) => {
  if (
    !subjectId ||
    !academicYear
  ) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          minHeight: 150,
          p: 2,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border:
            "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          backgroundColor:
            "var(--color-cream)",
        }}
      >
        <Stack
          alignItems="center"
          spacing={0.7}
        >
          <InfoOutlined
            sx={{
              color:
                "var(--color-gold-dark)",
            }}
          />

          <Typography
            sx={{
              color:
                "var(--color-navy-deep)",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            اختر المادة والسنة الدراسية
          </Typography>

          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontSize: "10px",
            }}
          >
            بعد الاختيار سنتحقق من وجود توزيع درجات للمادة.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 1.25,
          minHeight: 150,
          display: "grid",
          placeItems: "center",
          border:
            "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          backgroundColor:
            "var(--color-cream)",
        }}
      >
        <Stack
          alignItems="center"
          spacing={1}
        >
          <CircularProgress
            size={25}
            sx={{
              color:
                "var(--color-gold-dark)",
            }}
          />

          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontSize: "10px",
            }}
          >
            جاري التحقق من توزيع الدرجات...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (hasGradesCriteria) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        minHeight: 190,
        p: 2,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        border:
          "1px solid rgba(211,164,79,0.20)",
        borderRadius: "18px",
        background:
          "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.50))",
      }}
    >
      <Stack
        alignItems="center"
        spacing={0.9}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
            color:
              "var(--color-gold-dark)",
            backgroundColor:
              "var(--color-gold-soft)",
            borderRadius: "15px",
          }}
        >
          <GradeRounded />
        </Box>

        <Typography
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          لا يوجد توزيع درجات لهذه المادة
        </Typography>

        <Typography
          sx={{
            maxWidth: 430,
            color:
              "var(--color-muted)",
            fontSize: "10px",
            lineHeight: 1.7,
          }}
        >
          يجب إضافة توزيع درجات للمادة في السنة المحددة قبل إنشاء الاختبار.
        </Typography>

        {canAddCriteria ? (
          <Button
            type="button"
            onClick={() => {
              const params =
                new URLSearchParams();

              params.set(
                "subjectId",
                subjectId
              );

              params.set(
                "academicYear",
                academicYear
              );

              navigate(
                `/school/gradesCriteria/add?${params.toString()}`
              );
            }}
            variant="contained"
            startIcon={
              <AddCircleOutlineRounded />
            }
            sx={{
              mt: 0.4,
              minHeight: 42,
              px: 2,
              borderRadius: "12px",
              color:
                "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "7px",
                  marginRight: 0,
                },
            }}
          >
            إضافة توزيع درجات
          </Button>
        ) : (
          <Typography
            sx={{
              color:
                "var(--color-danger)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            لا تملك صلاحية إضافة توزيع درجات؛ تواصل مع المسؤول.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};


const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      questions: [
        createQuestion(),
      ],
      classIds: [],
    },
  });

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "questions",
  });

  const [loading, setLoading] =
    useState(false);

  const [
    gradesCriteriaLoading,
    setGradesCriteriaLoading,
  ] = useState(false);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const [subjectId, setSubjectId] =
    useState("");

  const [
    academicYear,
    setAcademicYear,
  ] = useState("");

  const [
    gradesCriteria,
    setGradesCriteria,
  ] = useState([]);

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    exam,
    loading: examLoading,
  } = useExam(id);

  const criteriaPermissions =
    usePermissions(
      "gradesCriteria"
    );

  useEffect(() => {
    if (!exam) {
      return;
    }

    const subjectData =
      exam?.gradesCriteria
        ?.subjectId ||
      exam?.subject ||
      {};

    const normalizedQuestions =
      getArray(
        exam?.questions
      ).map(
        normalizeQuestion
      );

    const normalizedClasses =
      getArray(
        exam?.classIds?.length
          ? exam.classIds
          : exam?.classes
      )
        .map(
          (classItem) =>
            classItem?._id ||
            classItem?.id ||
            classItem
        )
        .filter(Boolean);

    const normalized = {
      ...exam,
      subjectId:
        exam?.subjectId ||
        subjectData?._id ||
        subjectData?.id ||
        "",
      academicYear:
        exam?.academicYear ||
        exam?.gradesCriteria
          ?.academicYear ||
        "",
      classIds:
        normalizedClasses,
      questions:
        normalizedQuestions
          .length > 0
          ? normalizedQuestions
          : [createQuestion()],
      startDate:
        exam?.startDate
          ? String(
              exam.startDate
            ).slice(0, 10)
          : "",
      endDate:
        exam?.endDate
          ? String(
              exam.endDate
            ).slice(0, 10)
          : "",
      duration: Number(
        exam?.duration || 0
      ),
    };

    reset(normalized);
    setDefaultValues(
      normalized
    );
    setSubjectId(
      normalized.subjectId
    );
    setAcademicYear(
      normalized.academicYear
    );
  }, [exam, reset]);

  useEffect(() => {
    if (
      !subjectId ||
      !academicYear
    ) {
      setGradesCriteria([]);
      setGradesCriteriaLoading(
        false
      );
      return;
    }

    let active = true;

    const loadCriteria =
      async () => {
        setGradesCriteriaLoading(
          true
        );

        try {
          const response =
            await fetchGradesCriteria({
              academicYear,
              subjectId,
            });

          if (!active) {
            return;
          }

          if (!response?.status) {
            setGradesCriteria([]);

            toast.error(
              getErrorMessage(
                response,
                "حدث خطأ أثناء جلب توزيع الدرجات"
              )
            );
            return;
          }

          setGradesCriteria(
            getResponseList(
              response
            )
          );
        } catch (error) {
          if (active) {
            setGradesCriteria([]);

            toast.error(
              error?.response?.data
                ?.message ||
                "حدث خطأ أثناء جلب توزيع الدرجات"
            );
          }
        } finally {
          if (active) {
            setGradesCriteriaLoading(
              false
            );
          }
        }
      };

    loadCriteria();

    return () => {
      active = false;
    };
  }, [
    subjectId,
    academicYear,
  ]);

  const hasGradesCriteria =
    useMemo(() => {
      if (
        !subjectId ||
        !academicYear ||
        gradesCriteriaLoading
      ) {
        return null;
      }

      return (
        gradesCriteria.length >
        0
      );
    }, [
      subjectId,
      academicYear,
      gradesCriteria,
      gradesCriteriaLoading,
    ]);

  const addQuestion = () => {
    append(
      createQuestion()
    );
  };

  const onSubmit = async (
    formData
  ) => {
    if (
      hasGradesCriteria !== true
    ) {
      toast.error(
        "يجب إضافة توزيع درجات للمادة قبل حفظ الاختبار"
      );
      return;
    }

    if (
      !validateExamDates(
        formData.startDate,
        formData.endDate
      )
    ) {
      toast.error(
        "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء"
      );
      return;
    }

    const normalizedForm = {
      ...formData,
      duration: Number(
        formData.duration
      ),
    };

    delete normalizedForm.subjectName;

    const changedData =
      getChangedValues(
        normalizedForm,
        defaultValues,
        [
          "classes",
          "gradesCriteria",
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

    setLoading(true);

    try {
      const response =
        await editExam(
          changedData,
          id
        );

      if (!response?.status) {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء تعديل الاختبار"
          )
        );
        return;
      }

      toast.success(
        "تم تعديل الاختبار بنجاح"
      );

      const updatedId =
        getResponseId(
          response
        ) || id;

      navigate(
        `/school/exams/${updatedId}`
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل الاختبار"
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    examLoading &&
    !defaultValues
  ) {
    return <Loading />;
  }

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
          maxWidth: "100%",
          minWidth: 0,
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
            <Back title="تعديل الاختبار" />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              عدّل المواعيد والفصول
              والأسئلة ثم احفظ
              التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={FORM_CARD_SX}
        >
          <SectionHeading
            icon={
              <EditNoteRounded />
            }
            title="تفاصيل الاختبار"
            description="راجع نوع الاختبار والمواعيد والمدة والفصول المستهدفة."
          />

          {defaultValues && (
            <DataInputs
              register={register}
              errors={errors}
              defaultValues={
                defaultValues
              }
              setValue={setValue}
              onAcademicYearChange={
                setAcademicYear
              }
            />
          )}
        </Paper>

        <GradesCriteriaStatus
          loading={
            gradesCriteriaLoading
          }
          hasGradesCriteria={
            hasGradesCriteria
          }
          subjectId={subjectId}
          academicYear={
            academicYear
          }
          canAddCriteria={
            criteriaPermissions.add
          }
          navigate={navigate}
        />

        {hasGradesCriteria ===
          true &&
          defaultValues && (
            <Questions
              fields={fields}
              register={register}
              errors={errors}
              watch={watch}
              remove={remove}
              addQuestion={
                addQuestion
              }
            />
          )}

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
                examLoading ||
                gradesCriteriaLoading ||
                hasGradesCriteria !==
                  true
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
                  sm: 180,
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
                : "حفظ التغييرات"}
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

const DataInputs = ({
  register,
  errors,
  defaultValues,
  setValue,
  onAcademicYearChange,
}) => {
  const [
    selectedClassIds,
    setSelectedClassIds,
  ] = useState(
    defaultValues.classIds ||
      []
  );

  useEffect(() => {
    setSelectedClassIds(
      defaultValues.classIds ||
        []
    );

    setValue(
      "classIds",
      defaultValues.classIds ||
        []
    );
  }, [
    defaultValues,
    setValue,
  ]);

  const handleAcademicYearChange = (
    value
  ) => {
    setValue(
      "academicYear",
      value
    );

    setSelectedClassIds([]);
    setValue(
      "classIds",
      []
    );

    onAcademicYearChange?.(
      value
    );
  };

  return (
    <Grid
      container
      spacing={{
        xs: 1.5,
        md: 2,
      }}
      alignItems="center"
    >
      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <Select
          register={register}
          registerName="examType"
          data={MCQExams}
          name="value"
          error={
            errors.examType
              ?.message
          }
          label="نوع الاختبار"
          required
          defaultValue={
            defaultValues.examType
          }
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <Input
          register={register}
          registerName="startDate"
          error={
            errors.startDate
              ?.message
          }
          label="تاريخ البدء"
          required
          type="date"
          defaultValue={
            defaultValues.startDate
          }
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <Input
          register={register}
          registerName="endDate"
          error={
            errors.endDate
              ?.message
          }
          label="تاريخ الانتهاء"
          required
          type="date"
          defaultValue={
            defaultValues.endDate
          }
        />
      </Grid>

      <Grid
        item
        xs={12}
        sm={6}
        lg={4}
      >
        <Input
          register={register}
          registerName="duration"
          error={
            errors.duration
              ?.message
          }
          label="المدة بالدقائق"
          required
          valueAsNumber
          type="number"
          defaultValue={
            defaultValues.duration
          }
        />
      </Grid>

      <ClassSelectors
        register={register}
        errors={errors}
        selectedClassIds={
          selectedClassIds
        }
        setSelectedClassIds={
          setSelectedClassIds
        }
        defaultAcademicYear={
          defaultValues
            .academicYear
        }
        onAcademicYearChange={
          handleAcademicYearChange
        }
        setValue={setValue}
      />
    </Grid>
  );
};

export default Edit;
