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
  SchoolRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import Loading from "@/components/Loading";
import { editProject } from "@/APIs/school/projects";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useProject } from "@/utils/hooks/apis/useProject";
import usePermissions from "@/utils/hooks/usePermissions";

const getResponseData = (response) =>
  response?.data?.data || response?.data || response;

const getResponseList = (response) => {
  const payload = getResponseData(response);
  if (Array.isArray(payload)) return payload;
  return payload?.docs || payload?.items || payload?.results || [];
};

const getErrorMessage = (response, fallback) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string" ? response : fallback);

const cardSx = {
  mt: 1.25,
  p: { xs: 1.5, md: 2 },
  border: "1px solid rgba(36,74,112,.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream)",
  boxShadow: "0 12px 28px rgba(18,47,77,.06)",
  "& .MuiFormControl-root": { width: "100%", margin: 0 },
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
  },
  "& .MuiInputLabel-root": {
    px: 0.65,
    backgroundColor: "var(--color-cream)",
    fontSize: "10.5px",
    fontWeight: 700,
  },
};

const SectionHeading = ({ icon, title, description }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom: "1px solid rgba(36,74,112,.07)",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        backgroundColor: "var(--color-gold-soft)",
        borderRadius: "12px",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        sx={{
          color: "var(--color-navy-deep)",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          mt: 0.2,
          color: "var(--color-muted)",
          fontSize: "10px",
        }}
      >
        {description}
      </Typography>
    </Box>
  </Stack>
);

const CriteriaStatus = ({
  loading,
  hasCriteria,
  subjectId,
  academicYear,
  canAdd,
  navigate,
}) => {
  if (!subjectId || !academicYear) {
    return (
      <Paper elevation={0} sx={{ ...cardSx, minHeight: 130, display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={0.7}>
          <InfoOutlined sx={{ color: "var(--color-gold-dark)" }} />
          <Typography sx={{ fontWeight: 800, color: "var(--color-navy-deep)" }}>
            اختر المادة والسنة الدراسية
          </Typography>
          <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
            بعد الاختيار سنتحقق من وجود توزيع درجات للمادة.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={0} sx={{ ...cardSx, minHeight: 130, display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={1}>
          <CircularProgress size={25} sx={{ color: "var(--color-gold-dark)" }} />
          <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
            جاري التحقق من توزيع الدرجات...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (hasCriteria) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        ...cardSx,
        minHeight: 180,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        background:
          "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.5))",
      }}
    >
      <Stack alignItems="center" spacing={0.9}>
        <Box
          sx={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",
            borderRadius: "15px",
          }}
        >
          <GradeRounded />
        </Box>
        <Typography sx={{ fontWeight: 800, color: "var(--color-navy-deep)" }}>
          لا يوجد توزيع درجات لهذه المادة
        </Typography>
        <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
          يجب إضافة توزيع درجات للمادة في السنة المحددة قبل حفظ المشروع.
        </Typography>

        {canAdd ? (
          <Button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({
                subjectId,
                academicYear,
              });
              navigate(`/school/gradesCriteria/add?${params.toString()}`);
            }}
            variant="contained"
            startIcon={<AddCircleOutlineRounded />}
            sx={{
              borderRadius: "12px",
              color: "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
              fontWeight: 800,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                marginLeft: "7px",
                marginRight: 0,
              },
            }}
          >
            إضافة توزيع درجات
          </Button>
        ) : (
          <Typography sx={{ color: "var(--color-danger)", fontSize: "10px", fontWeight: 700 }}>
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
    setValue,
  } = useForm({ defaultValues: { classIds: [] } });

  const [loading, setLoading] = useState(false);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [criteria, setCriteria] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const { project, loading: projectLoading } = useProject(id);
  const criteriaPermissions = usePermissions("gradesCriteria");

  useEffect(() => {
    if (!project) return;

    const subjectData = project?.subject || {};
    const classIds = (
      Array.isArray(project?.classes)
        ? project.classes
        : Array.isArray(project?.classIds)
        ? project.classIds
        : []
    )
      .map((item) => item?._id || item?.id || item)
      .filter(Boolean);

    const mapped = {
      ...project,
      subjectId:
        project?.subjectId ||
        subjectData?._id ||
        subjectData?.id ||
        subjectData ||
        "",
      classIds,
      dueDate: project?.dueDate
        ? String(project.dueDate).slice(0, 10)
        : "",
    };

    delete mapped.subject;
    delete mapped.classes;

    reset(mapped);
    setDefaultValues(mapped);
    setSubjectId(mapped.subjectId);
    setAcademicYear(mapped.academicYear || "");
  }, [project, reset]);

  useEffect(() => {
    if (!subjectId || !academicYear) {
      setCriteria([]);
      setCriteriaLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setCriteriaLoading(true);
      try {
        const response = await fetchGradesCriteria({
          academicYear,
          subjectId,
        });

        if (!active) return;

        if (!response?.status) {
          setCriteria([]);
          toast.error(
            getErrorMessage(response, "حدث خطأ أثناء جلب توزيع الدرجات")
          );
          return;
        }

        setCriteria(getResponseList(response));
      } catch (error) {
        if (active) {
          setCriteria([]);
          toast.error(
            error?.response?.data?.message ||
              "حدث خطأ أثناء جلب توزيع الدرجات"
          );
        }
      } finally {
        if (active) setCriteriaLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [subjectId, academicYear]);

  const hasCriteria = useMemo(() => {
    if (!subjectId || !academicYear || criteriaLoading) return null;
    return criteria.length > 0;
  }, [subjectId, academicYear, criteria, criteriaLoading]);

  const onSubmit = async (data) => {
    if (hasCriteria !== true) {
      toast.error("يجب إضافة توزيع درجات للمادة قبل حفظ المشروع");
      return;
    }

    const normalized = {
      ...data,
      classIds: Array.isArray(data.classIds) ? data.classIds : [],
    };

    const changedData = getChangedValues(normalized, defaultValues, [
      "classes",
      "gradesCriteria",
      "files",
      "subject",
    ]);

    if (!Object.keys(changedData).length) {
      toast.info("لم تحدث أي بيانات للتعديل");
      return;
    }

    setLoading(true);

    try {
      const response = await editProject(changedData, id);

      if (!response?.status) {
        toast.error(
          getErrorMessage(response, "حدث خطأ أثناء تعديل المشروع")
        );
        return;
      }

      toast.success("تم تعديل المشروع بنجاح");
      navigate(`/school/projects/${id}`);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء تعديل المشروع"
      );
    } finally {
      setLoading(false);
    }
  };

  if (projectLoading && !defaultValues) return <Loading />;

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
        sx={{ width: "100%", pb: 3 }}
      >
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "16px",
            backgroundColor: "rgba(255,252,247,.9)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="تعديل المشروع" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
              عدّل بيانات المشروع والفصول وموعد التسليم ثم احفظ التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <SectionHeading
            icon={<SchoolRounded />}
            title="المادة والفصول"
            description="راجع المادة والسنة الدراسية والفصول المستهدفة بالمشروع."
          />
          {defaultValues && (
            <Selectors
              register={register}
              errors={errors}
              defaultValues={defaultValues}
              setValue={setValue}
              onSubjectChange={setSubjectId}
              onAcademicYearChange={setAcademicYear}
            />
          )}
        </Paper>

        <CriteriaStatus
          loading={criteriaLoading}
          hasCriteria={hasCriteria}
          subjectId={subjectId}
          academicYear={academicYear}
          canAdd={criteriaPermissions.add}
          navigate={navigate}
        />

        {hasCriteria === true && defaultValues && (
          <Paper elevation={0} sx={cardSx}>
            <SectionHeading
              icon={<EditNoteRounded />}
              title="محتوى المشروع"
              description="عدّل عنوان المشروع ووصفه وآخر موعد للتسليم."
            />
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="title"
                  error={errors.title?.message}
                  label="عنوان المشروع"
                  required
                  defaultValue={defaultValues.title}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName="description"
                  error={errors.description?.message}
                  label="وصف المشروع"
                  required
                  multiline
                  rows={4}
                  defaultValue={defaultValues.description}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <Input
                  register={register}
                  registerName="dueDate"
                  error={errors.dueDate?.message}
                  label="تاريخ التسليم"
                  required
                  type="date"
                  defaultValue={defaultValues.dueDate}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper elevation={0} sx={{ ...cardSx, p: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={
                loading ||
                projectLoading ||
                criteriaLoading ||
                hasCriteria !== true
              }
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                width: { xs: "100%", sm: 180 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
                  marginRight: 0,
                },
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>

            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{
                width: { xs: "100%", sm: 145 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-navy)",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
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

const Selectors = ({
  register,
  errors,
  defaultValues,
  setValue,
  onSubjectChange,
  onAcademicYearChange,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState(
    defaultValues.classIds || []
  );

  useEffect(() => {
    setSelectedClassIds(defaultValues.classIds || []);
    setValue("classIds", defaultValues.classIds || []);
  }, [defaultValues, setValue]);

  const handleSubjectChange = (value) => {
    setValue("subjectId", value);
    onSubjectChange?.(value);
  };

  const handleAcademicYearChange = (value) => {
    setValue("academicYear", value);
    setSelectedClassIds([]);
    setValue("classIds", []);
    onAcademicYearChange?.(value);
  };

  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }} alignItems="center">
      <Grid item xs={12} sm={6} lg={4}>
        <SubjectSelector
          register={register}
          errors={errors}
          label="المادة"
          required
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
