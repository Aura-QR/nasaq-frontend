import { Box, Grid, Typography, Paper, Button } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import { addExam } from "@/APIs/school/exams";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import MCQExams from "@/utils/constants/MCQExams";
import AddIcon from "@mui/icons-material/Add";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import Questions from "@/pages/School/Exams/Components/Questions";
import usePermissions from "@/utils/hooks/usePermissions";
import Input from "@/components/Input/Input";

const Add = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
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

  const [loading, setLoading] = useState(false);
  const [gradesCriteriaLoading, setGradesCriteriaLoading] = useState(false);
  const navigate = useNavigate();
  const permissions = usePermissions("gradesCriteria");

  const onSubmit = async (data) => {
    setLoading(true);
    delete data.subjectName; // remove subjectName from data as it is not needed in backend
    const response = await addExam(data);
    if (response.status) {
      toast.success("تم اضافة الامتحان بنجاح");
      navigate("/school/exams/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  const addQuestion = () => {
    append({ question: "", options: ["", "", "", ""], correctAnswer: "" });
  };

  ////  to check if the selected subject and academic year has gradesCriteria or not ////
  ////  can't use useGradesCriterion as it canot be called inside conditional block ////
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradesCriteria, setGradesCriteria] = useState([]);

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

  return (
    <Container>
      <Back title={"إضافة امتحان جديد"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الامتحان
        </Typography>
        <DataInputs
          register={register}
          errors={errors}
          setValue={setValue}
          onSubjectChange={setSubjectId}
          onAcademicYearChange={setAcademicYear}
        />
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
                  const url = `/school/gradesCriteria/add${
                    params.toString() ? `?${params.toString()}` : ""
                  }`;
                  navigate(url);
                }}
                startIcon={
                  <AddIcon
                    sx={{
                      backgroundColor: "primary.main",
                      borderRadius: "50%",
                      scale: "1.3",
                      padding: "2px",
                      marginRight: "4px",
                      color: "white",
                    }}
                  />
                }
                variant="none"
                sx={{
                  p: "18px 18px",
                  borderRadius: "8px",
                  color: "primary.main",
                }}
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
      {hasGradesCriteria === true && (
        <Questions
          fields={fields}
          register={register}
          errors={errors}
          watch={watch}
          remove={remove}
          addQuestion={addQuestion}
        />
      )}

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({
  register,
  errors,
  setValue,
  onSubjectChange,
  onAcademicYearChange,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  const handleSubjectChange = (value) => {
    setValue("subjectId", value);
    if (onSubjectChange) onSubjectChange(value);
  };

  const handleAcademicYearChange = (value) => {
    if (onAcademicYearChange) onAcademicYearChange(value);
  };

  return (
    <Grid container mt={8} spacing={8} alignItems={"center"}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <SubjectSelector
          register={register}
          errors={errors}
          label="المادة"
          required={true}
          onChange={handleSubjectChange}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"examType"}
          data={MCQExams}
          name="value"
          error={errors.examType?.message}
          label={"نوع الامتحان"}
          required={true}
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
        />
      </Grid>
      <ClassSelectors
        register={register}
        errors={errors}
        selectedClassIds={selectedClassIds}
        setSelectedClassIds={setSelectedClassIds}
        onAcademicYearChange={handleAcademicYearChange}
      />
    </Grid>
  );
};

export default Add;
