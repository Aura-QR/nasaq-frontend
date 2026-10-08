import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AddCircleOutlineRounded,
  AssignmentRounded,
  AttachFileRounded,
  CloseRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  GradeRounded,
  InfoOutlined,
  SaveRounded,
  SchoolRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Input from "@/components/Input/Input";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import { addProject } from "@/APIs/school/projects";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import usePermissions from "@/utils/hooks/usePermissions";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const getResponseData = (response) =>
  response?.data?.data || response?.data || response;

const getResponseId = (response) => {
  const payload = getResponseData(response);
  return (
    payload?._id ||
    payload?.id ||
    payload?.project?._id ||
    payload?.project?.id ||
    ""
  );
};

const getResponseList = (response) => {
  const payload = getResponseData(response);
  if (Array.isArray(payload)) return payload;
  return payload?.docs || payload?.items || payload?.results || [];
};

const getErrorMessage = (response, fallback) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string" ? response : fallback);

const validateFiles = (currentFiles, selectedFiles) => {
  const files = Array.from(selectedFiles || []);

  if (files.some((file) => file.type !== "application/pdf")) {
    return {
      valid: false,
      message: "نوع الملف غير مدعوم. الرجاء رفع ملفات PDF فقط.",
    };
  }

  if (currentFiles.length + files.length > MAX_FILES) {
    return {
      valid: false,
      message: "يمكنك رفع 10 ملفات كحد أقصى",
    };
  }

  if (files.some((file) => file.size > MAX_FILE_SIZE)) {
    return {
      valid: false,
      message: "حجم الملف يجب ألا يتجاوز 20 ميجابايت",
    };
  }

  return { valid: true, files };
};

const SectionHeading = ({ icon, title, description, endContent }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    justifyContent="space-between"
    gap={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom: "1px solid rgba(36,74,112,.07)",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
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
    {endContent}
  </Stack>
);

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
        <Typography
          sx={{
            maxWidth: 430,
            color: "var(--color-muted)",
            fontSize: "10px",
          }}
        >
          يجب إضافة توزيع درجات للمادة في السنة المحددة قبل إنشاء المشروع.
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

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ defaultValues: { classIds: [] } });

  const [loading, setLoading] = useState(false);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [criteria, setCriteria] = useState([]);

  const navigate = useNavigate();
  const criteriaPermissions = usePermissions("gradesCriteria");

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

  const handleFileChange = (event) => {
    const result = validateFiles(uploadedFiles, event.target.files);
    event.target.value = "";

    if (!result.valid) {
      toast.error(result.message);
      return;
    }

    setUploadedFiles((prev) => [...prev, ...result.files]);
  };

  const onSubmit = async (data) => {
    if (hasCriteria !== true) {
      toast.error("يجب إضافة توزيع درجات للمادة قبل حفظ المشروع");
      return;
    }

    const classIds = Array.isArray(data.classIds) ? data.classIds : [];
    if (!classIds.length) {
      toast.error("يرجى اختيار فصل واحد على الأقل");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      ["title", "description", "subjectId", "academicYear", "dueDate"].forEach(
        (key) => formData.append(key, data[key])
      );
      classIds.forEach((classId) => formData.append("classIds[]", classId));
      uploadedFiles.forEach((file) => formData.append("files", file));

      const response = await addProject(formData);

      if (!response?.status) {
        toast.error(getErrorMessage(response, "حدث خطأ أثناء إضافة المشروع"));
        return;
      }

      toast.success("تم إضافة المشروع بنجاح");
      const id = getResponseId(response);
      navigate(id ? `/school/projects/${id}` : "/school/projects");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء إضافة المشروع"
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Back title="إضافة مشروع جديد" />
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
              اختر المادة والفصول ثم أضف وصف المشروع وموعد التسليم والملفات.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <SectionHeading
            icon={<SchoolRounded />}
            title="المادة والفصول"
            description="حدّد المادة والسنة الدراسية والفصول المستهدفة بالمشروع."
          />
          <Selectors
            register={register}
            errors={errors}
            setValue={setValue}
            onSubjectChange={setSubjectId}
            onAcademicYearChange={setAcademicYear}
          />
        </Paper>

        <CriteriaStatus
          loading={criteriaLoading}
          hasCriteria={hasCriteria}
          subjectId={subjectId}
          academicYear={academicYear}
          canAdd={criteriaPermissions.add}
          navigate={navigate}
        />

        {hasCriteria === true && (
          <>
            <Paper elevation={0} sx={cardSx}>
              <SectionHeading
                icon={<AssignmentRounded />}
                title="محتوى المشروع"
                description="اكتب عنوان المشروع ووصفه وحدّد آخر موعد للتسليم."
              />
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                <Grid item xs={12}>
                  <Input
                    register={register}
                    registerName="title"
                    error={errors.title?.message}
                    label="عنوان المشروع"
                    required
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
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionHeading
                icon={<AttachFileRounded />}
                title="الملفات المرفقة"
                description="ملفات PDF فقط، بحد أقصى 10 ملفات و20 ميجابايت لكل ملف."
                endContent={
                  <Typography sx={{ color: "var(--color-navy)", fontSize: "10px", fontWeight: 800 }}>
                    {uploadedFiles.length} / {MAX_FILES}
                  </Typography>
                }
              />

              <Box
                component="label"
                htmlFor="project-files"
                sx={{
                  minHeight: 140,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  cursor:
                    uploadedFiles.length >= MAX_FILES
                      ? "not-allowed"
                      : "pointer",
                  border: "2px dashed rgba(36,74,112,.18)",
                  borderRadius: "16px",
                  backgroundColor: "rgba(36,74,112,.025)",
                }}
              >
                <input
                  id="project-files"
                  type="file"
                  hidden
                  multiple
                  accept="application/pdf,.pdf"
                  disabled={uploadedFiles.length >= MAX_FILES}
                  onChange={handleFileChange}
                />
                <Stack alignItems="center" spacing={0.8}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--color-gold-dark)",
                      backgroundColor: "var(--color-gold-soft)",
                      borderRadius: "14px",
                    }}
                  >
                    <CloudUploadRounded />
                  </Box>
                  <Typography sx={{ fontSize: "12px", fontWeight: 800 }}>
                    اضغط لاختيار ملفات PDF
                  </Typography>
                  <Typography sx={{ color: "var(--color-muted)", fontSize: "9.5px" }}>
                    يمكن اختيار أكثر من ملف في المرة الواحدة
                  </Typography>
                </Stack>
              </Box>

              {!!uploadedFiles.length && (
                <Stack spacing={0.8} sx={{ mt: 1.25 }}>
                  {uploadedFiles.map((file, index) => (
                    <Paper
                      key={`${file.name}-${file.size}-${index}`}
                      elevation={0}
                      sx={{
                        px: 1.2,
                        py: 0.9,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid rgba(36,74,112,.08)",
                        borderRadius: "12px",
                        backgroundColor: "var(--color-white)",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap title={file.name} sx={{ fontSize: "11px", fontWeight: 800 }}>
                          {file.name}
                        </Typography>
                        <Typography sx={{ color: "var(--color-muted)", fontSize: "9px" }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                      <IconButton
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        sx={{
                          color: "var(--color-danger)",
                          backgroundColor: "rgba(201,79,79,.07)",
                          borderRadius: "10px",
                        }}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        )}

        <Paper elevation={0} sx={{ ...cardSx, p: 1.15 }}>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} gap={1}>
            <Button
              type="submit"
              disabled={
                loading || criteriaLoading || hasCriteria !== true
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
              {loading ? "جاري الحفظ..." : "حفظ المشروع"}
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
  setValue,
  onSubjectChange,
  onAcademicYearChange,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState([]);

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
          onChange={handleSubjectChange}
        />
      </Grid>
      <ClassSelectors
        register={register}
        errors={errors}
        selectedClassIds={selectedClassIds}
        setSelectedClassIds={setSelectedClassIds}
        onAcademicYearChange={handleAcademicYearChange}
        setValue={setValue}
      />
    </Grid>
  );
};

export default Add;
