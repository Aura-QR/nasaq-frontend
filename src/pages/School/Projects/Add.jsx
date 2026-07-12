import { Box, Grid, Typography, Paper, Button } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Input from "@/components/Input/Input";
import SubjectSelector from "@/components/Selector/SubjectSelector";
import { addProject } from "@/APIs/school/projects";
import ClassSelectors from "@/components/Selector/ClassSelectors";
import AddIcon from "@mui/icons-material/Add";
import { fetchGradesCriteria } from "@/APIs/school/gradesCriteria";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import usePermissions from "@/utils/hooks/usePermissions";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [gradesCriteriaLoading, setGradesCriteriaLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();

  const permissions = usePermissions("gradesCriteria");

  const onSubmit = async (data) => {
    setLoading(true);
    console.log(data);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("subjectId", data.subjectId);
    formData.append("academicYear", data.academicYear);
    formData.append("dueDate", data.dueDate);

    // Append class IDs
    data.classIds.forEach((classId) => {
      formData.append("classIds[]", classId);
    });

    // Append files
    uploadedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await addProject(formData);
    if (response.status) {
      toast.success("تم اضافة المشروع بنجاح");
      navigate("/school/projects/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types
    const allowedTypes = ["application/pdf"];
    const invalidTypeFiles = files.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidTypeFiles.length > 0) {
      toast.error("نوع الملف غير مدعوم. الرجاء رفع ملفات PDF فقط.");
      return;
    }

    // Validate file count
    if (uploadedFiles.length + files.length > 10) {
      toast.error("يمكنك رفع 10 ملفات كحد أقصى");
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter((file) => file.size > 20 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("حجم الملف يجب أن لا يتجاوز 20 ميجابايت");
      return;
    }

    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  ////  to check if the selected subject and academic year has gradesCriteria or not ////
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradesCriterion, setGradesCriterion] = useState([]);

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

  return (
    <Container>
      <Back title={"إضافة مشروع جديد"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المشروع
        </Typography>
        <DataInputs
          register={register}
          errors={errors}
          setValue={setValue}
          onSubjectChange={setSubjectId}
          onAcademicYearChange={setAcademicYear}
        />
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

      {/* GradesCriteria found - Show Project Details Form */}
      {hasGradesCriteria === true && (
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
                />
              </Grid>

              <Grid item xs={12} mt={6}>
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor: "primary.border",
                    borderRadius: "12px",
                    p: 8,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    "&:hover": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="file-upload"
                    accept="application/pdf"
                  />
                  <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
                    <CloudUploadIcon
                      sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.primary"
                      fontWeight={500}
                    >
                      اضغط لرفع الملفات
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      الحد الأقصى: 10 ملفات، 20 ميجابايت لكل ملف
                    </Typography>
                  </label>
                </Box>
              </Grid>

              {uploadedFiles.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={500} mb={4}>
                    الملفات المرفوعة ({uploadedFiles.length}/10)
                  </Typography>
                  <Box>
                    {uploadedFiles.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 4,
                          mb: 2,
                          bgcolor: "grey.50",
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography variant="body2">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeFile(index)}
                          startIcon={<DeleteOutlineIcon />}
                        >
                          حذف
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
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
