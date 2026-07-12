import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import { addGradesCriteria } from "@/APIs/school/gradesCriteria";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import Years from "@/utils/constants/Years";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // read exam query params to preselect subject & academic year
  const [searchParams] = useSearchParams();
  const querySubjectId = searchParams.get("subjectId") || "";
  const queryAcademicYear = searchParams.get("academicYear") || "";

  // apply query defaults into form
  useEffect(() => {
    if (querySubjectId) setValue("subjectId", querySubjectId);
    if (queryAcademicYear) setValue("academicYear", queryAcademicYear);
  }, [querySubjectId, queryAcademicYear, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    const response = await addGradesCriteria(data);
    if (response.status) {
      toast.success("تم توزيع درجات المادة بنجاح");
      navigate("/school/gradesCriteria/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة توزيع درجات"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}> 
          تفاصيل توزيع الدرجات
        (المجموع مئة درجة)</Typography>
        <DataInputs register={register} errors={errors} setValue={setValue} defaultSubjectId={querySubjectId} defaultAcademicYear={queryAcademicYear} />
      </Box>
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultSubjectId = "", defaultAcademicYear = "" }) => {
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
          type={"text"}
          defaultValue={defaultAcademicYear}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <SubjectSelector
          register={register} 
          errors={errors} 
          label="المادة"
          required={true}
          defaultSubjectId={defaultSubjectId}
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
          valueAsNumber={true}
        />
      </Grid>
    </Grid>
  );
};

export default Add;