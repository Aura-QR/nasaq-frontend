import { Box, Grid, Typography, Paper, Button } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Input from "@/components/Input/Input";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import { editProject } from "@/APIs/school/projects";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import AddIcon from "@mui/icons-material/Add";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useProject } from "@/utils/hooks/apis/useProject";
import usePermissions from "@/utils/hooks/usePermissions";
import Loading from "@/components/Loading";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [gradesCriteriaLoading, setGradesCriteriaLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const permissions = usePermissions("gradesCriteria");

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch project data
  const { project, loading: projectLoading } = useProject(id);

  ////  to check if the selected subject and academic year has gradesCriteria or not ////
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradesCriterion, setGradesCriterion] = useState([]);

  // Set default values when project data is loaded
  useEffect(() => {
    if (project) {
      // eslint-disable-next-line no-unused-vars
      const { subject, classes, ...rest } = project;
      const mapped = {
        ...rest,
        subjectId: subject?._id || subject,
        classIds: classes?.map((c) => c._id || c) || [],
        dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
      };

      reset(mapped);
      setDefaultValues(mapped);
      setSubjectId(mapped.subjectId);
      setAcademicYear(mapped.academicYear);
    }
  }, [project, reset]);

  useEffect(() => {
    if (!subjectId || !academicYear) {
      setGradesCriterion([]);
      return;
    }

    const fetchData = async () => {
      setGradesCriteriaLoading(true);
      const res = await fetchGradesCriteria({ academicYear, subjectId });
      if (res.status) {
        setGradesCriterion(res.data || []);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب توزيعات الدرجات !");
        setGradesCriterion([]);
      }
      setGradesCriteriaLoading(false);
    };

    fetchData();
  }, [subjectId, academicYear]);

  const hasGradesCriteria = useMemo(() => {
    if (!gradesCriteriaLoading) {
      if (!subjectId || !academicYear) {
        return null;
      }
      if (gradesCriterion.length !== 0) {
        return true;
      }
    }
    return false;
  }, [subjectId, academicYear, gradesCriterion, gradesCriteriaLoading]);

  const onSubmit = async (data) => {
    setLoading(true);

    const changedData = getChangedValues(data, defaultValues, [
      "classes",
      "gradesCriteria",
      "files",
    ]);

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editProject(changedData, id);

    if (response.status) {
      toast.success("تم تعديل المشروع بنجاح");
      navigate("/school/projects/" + id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل المشروع!");
    }

    setLoading(false);
  };

  if (projectLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <Back title={"تعديل المشروع"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المشروع
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
            setValue={setValue}
            onSubjectChange={setSubjectId}
            onAcademicYearChange={setAcademicYear}
          />
        )}
      </Box>

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
                  const params = new URLSearchParams();
                  if (subjectId) params.set("subjectId", subjectId);
                  if (academicYear) params.set("academicYear", academicYear);
                  const url = `/school/gradesCriteria/add${params.toString() ? `?${params.toString()}` : ""}`;
                  navigate(url);
                }}
                startIcon={
                  <AddIcon
                    sx={{ backgroundColor: "primary.main", borderRadius: "50%", scale: "1.3", padding: "2px", marginRight: "4px", color: "white" }}
                  />
                }
                variant="none"
                sx={{ p: "18px 18px", borderRadius: "8px", color: "primary.main" }}
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

      {/* GradesCriteria found - Show Project Details Form */}
      {hasGradesCriteria === true && defaultValues && (
        <Box mb={8} mt={16}>
          <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"}>
            <Box mb={16}>
              <Typography variant="title" fontWeight={"500"}>
                محتوى المشروع
              </Typography>
            </Box>
            <Grid container spacing={8}>
              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="title"
                  error={errors.title?.message}
                  label="عنوان المشروع"
                  required={true}
                  defaultValue={defaultValues.title}
                />
              </Grid>

              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="description"
                  error={errors.description?.message}
                  label="وصف المشروع"
                  required={true}
                  multiline={true}
                  rows={4}
                  defaultValue={defaultValues.description}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Input
                  register={register}
                  registerName="dueDate"
                  error={errors.dueDate?.message}
                  label="تاريخ التسليم"
                  required={true}
                  type="date"
                  defaultValue={defaultValues.dueDate}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || projectLoading}
      />
    </Container>
  );
};

const DataInputs = ({
  register,
  errors,
  defaultValues,
  setValue,
  onSubjectChange,
  onAcademicYearChange,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState(
    defaultValues.classIds
  );

  useEffect(() => {
    if (defaultValues) {
      setSelectedClassIds(defaultValues.classIds);
      setValue("classIds", defaultValues.classIds);
    }
  }, [defaultValues, setValue]);

  const handleSubjectChange = (value) => {
    setValue("subjectId", value);
    if (onSubjectChange) onSubjectChange(value);
  };

  const handleAcademicYearChange = (value) => {
    setValue("academicYear", value);
    setSelectedClassIds([]);
    setValue("classIds", []);
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
          defaultSubjectId={defaultValues.subjectId}
          onChange={handleSubjectChange}
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
