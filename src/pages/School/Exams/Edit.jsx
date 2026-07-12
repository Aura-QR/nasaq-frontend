import { Box, Grid, Typography, Paper, Button } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useExam } from "@/utils/hooks/apis/useExam";
import { editExam } from "@/APIs/school/exams";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import MCQExams from "@/utils/constants/MCQExams";
import AddIcon from "@mui/icons-material/Add";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import Questions from "@/pages/School/Exams/Components/Questions";
import usePermissions from "@/utils/hooks/usePermissions";
import Input from "@/components/Input/Input";

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
        { question: "", options: ["", "", "", ""], correctAnswer: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const addQuestion = () => {
    append({ question: "", options: ["", "", "", ""], correctAnswer: "" });
  };

  const [loading, setLoading] = useState(false);
  const [gradesCriteriaLoading, setGradesCriteriaLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const permissions = usePermissions("gradesCriteria");

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch exam data using the useExam custom hook
  const { exam, loading: examLoading } = useExam(id);

  ////  to check if the selected subject and academic year has gradesCriteria or not ////
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradesCriteria, setGradesCriteria] = useState([]);

  // Set default values when exam data is loaded
  useEffect(() => {
    if (exam) {
      // Map the exam type to the format used in the select
      const mappedExam = {
        ...exam,
        // eslint-disable-next-line no-unused-vars
        questions: exam.questions?.map(({ _id, ...q }) => q) || [],
        startDate: exam.startDate ? exam.startDate.slice(0, 10) : "",
        endDate: exam.endDate ? exam.endDate.slice(0, 10) : "",
      };

      reset(mappedExam);
      setDefaultValues(mappedExam);

      // Set initial subjectId and academicYear for gradesCriteria check
      setSubjectId(mappedExam.subjectId);
      setAcademicYear(mappedExam.academicYear);
    }
  }, [exam, reset]);

  useEffect(() => {
    // Only fetch when both are selected
    if (!subjectId || !academicYear) {
      setGradesCriteria([]);
      return;
    }

    const fetchData = async () => {
      setGradesCriteriaLoading(true);
      const res = await fetchGradesCriteria({ academicYear, subjectId });
      if (res.status) {
        setGradesCriteria(res.data || []);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب توزيعات الدرجات !");
        setGradesCriteria([]);
      }
      setGradesCriteriaLoading(false);
    };

    fetchData();
  }, [subjectId, academicYear]);

  const hasGradesCriteria = useMemo(() => {
    if (!gradesCriteriaLoading) {
      if (!subjectId || !academicYear) {
        return null; // Not determined yet
      }
      // Academic year and subject has gradesCriteria
      if (gradesCriteria.length !== 0) {
        return true;
      }
    }
    return false;
  }, [subjectId, academicYear, gradesCriteria, gradesCriteriaLoading]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);

    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, [
      "classes",
      "gradesCriteria",
    ]);

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editExam(changedData, id);

    if (response.status) {
      toast.success("تم تعديل الامتحان بنجاح");
      navigate("/school/exams/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل الامتحان!");
    }

    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل الامتحان"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الامتحان
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
            setValue={setValue}
            onAcademicYearChange={setAcademicYear}
          />
        )}
      </Box>

      {/* MCQ Questions Section */}
      {/* No gradesCriteria found */}
      {hasGradesCriteria === false && subjectId && academicYear && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 8, lg: 16 },
            borderRadius: "16px",
            borderColor: "primary.border",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            flexDirection: "column",
          }}
        >
          {permissions.add ? (
            <>
              <Typography color="text.secondary">
                لا يوجد توزيع درجات لهذة المادة في هذة السنة الدراسية, برجاء
                اضافة واحدة
              </Typography>
              <Button
                onClick={() => {
                  // build query params for subjectId and academic year to be passed to gradesCriteria/add
                  const params = new URLSearchParams();
                  if (subjectId) params.set("subjectId", subjectId);
                  if (academicYear) params.set("academicYear", academicYear);
                  const url = `/school/gradesCriteria/add${params.toString() ? `?${params.toString()}` : ""}`;
                  navigate(url);
                }}
                startIcon={
                  <AddIcon
                    sx={{ backgroundColor: "primary.main", borderRadius: "50%", scale: "1.3", padding: "2px", marginRight: "4px", color: "white",}}
                  />
                }
                variant="none"
                sx={{ p: "18px 18px", borderRadius: "8px", color: "primary.main",}}
              >
                اضافة توزيع درجات جديد
              </Button>
            </>
          ) : (
            <Typography color="text.secondary">
              ليس لديك صلاحية لأضافة توزيع درجات برجاء التواصل مع المسؤول
            </Typography>
          )}
        </Paper>
      )}

      {/* GradesCriteria found */}
      {hasGradesCriteria === true && defaultValues && (
        <Questions
          fields={fields}
          register={register}
          errors={errors}
          watch={watch}
          remove={remove}
          addQuestion={addQuestion}
          defaultValues={defaultValues}
        />
      )}

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || examLoading}
      />
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
  const [selectedClassIds, setSelectedClassIds] = useState(
    defaultValues.classIds
  );

  // Update when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      setSelectedClassIds(defaultValues.classIds);
      setValue("classIds", defaultValues.classIds);
    }
  }, [defaultValues, setValue]);

  const handleAcademicYearChange = (value) => {
    setValue("academicYear", value);
    setSelectedClassIds([]);
    setValue("classIds", []);
    if (onAcademicYearChange) onAcademicYearChange(value);
  };

  return (
    <Grid container mt={8} spacing={8} alignItems={"center"}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"examType"}
          data={MCQExams}
          name="value"
          error={errors.examType?.message}
          label={"نوع الامتحان"}
          required={true}
          defaultValue={defaultValues.examType}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"startDate"}
          error={errors.startDate?.message}
          label={"تاريخ البدء"}
          required={true}
          type={"date"}
          defaultValue={defaultValues.startDate?.slice(0, 10)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"endDate"}
          error={errors.endDate?.message}
          label={"تاريخ الانتهاء"}
          required={true}
          type={"date"}
          defaultValue={defaultValues.endDate?.slice(0, 10)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"duration"}
          error={errors.duration?.message}
          label={"المدة بالدقائق"}
          required={true}
          valueAsNumber={true}
          type={"number"}
          defaultValue={defaultValues.duration}
        />
      </Grid>
      <ClassSelectors
        register={register}
        errors={errors}
        selectedClassIds={selectedClassIds}
        setSelectedClassIds={setSelectedClassIds}
        defaultAcademicYear={defaultValues.academicYear}
        onAcademicYearChange={handleAcademicYearChange}
        setValue={setValue}
      />
    </Grid>
  );
};

export default Edit;
