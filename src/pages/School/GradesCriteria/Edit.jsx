import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useGradesCriteria } from "@/utils/hooks/apis/useGradesCriteria";
import { editGradesCriteria } from "@/APIs/school/gradesCriteria";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import Years from "@/utils/constants/Years";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch grades criteria data using the useGradesCriteria custom hook
  const { gradesCriteria, loading: gradesCriteriaLoading } = useGradesCriteria(id);

  // Set default values when grades criteria data is loaded
  useEffect(() => {
    if (gradesCriteria) {
      reset(gradesCriteria);
      setDefaultValues(gradesCriteria);
    }
  }, [gradesCriteria, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);
    
    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, ["subject"]);

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editGradesCriteria(changedData, id);

    if (response.status) {
      toast.success("تم تعديل توزيع الدرجات بنجاح");
      navigate("/school/gradesCriteria/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل توزيع الدرجات!");
    }

    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل توزيع الدرجات"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}> 
          تفاصيل توزيع الدرجات
        (المجموع مئة درجة)</Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
            setValue={setValue}
          />
        )}
      </Box>
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || gradesCriteriaLoading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultValues, setValue }) => {
  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"academicYear"}
          data={Years}
          error={errors.academicYear?.message}
          label={"السنة الدراسية للمادة"}
          required={true}
          defaultValue={defaultValues.academicYear}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <SubjectSelector
          register={register} 
          errors={errors}
          setValue={setValue}
          label="المادة"
          defaultSubjectId={defaultValues.subjectId}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"final"}
          error={errors.final?.message}
          label={"درجة الاختبار النهائي"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.final}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"activities"}
          error={errors.activities?.message}
          label={"درجة اعمال السنة"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.activities}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"projects"}
          error={errors.projects?.message}
          label={"درجة المهام الآدائية"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.projects}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"projectsCount"}
          error={errors.projectsCount?.message}
          label={"عدد المهام الآدائية"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.projectsCount}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"assignments"}
          error={errors.assignments?.message}
          label={"درجة الواجبات"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.assignments}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"assignmentsCount"}
          error={errors.assignmentsCount?.message}
          label={"عدد الواجبات"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.assignmentsCount}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"quizzes"}
          error={errors.quizzes?.message}
          label={"درجة الاختبارات القصيرة"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.quizzes}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"quizzesCount"}
          error={errors.quizzesCount?.message}
          label={"عدد الاختبارات القصيرة"}
          required={true}
          type={"number"}
          defaultValue={defaultValues.quizzesCount}
          valueAsNumber={true}
        />
      </Grid>
    </Grid>
  );
};

export default Edit;