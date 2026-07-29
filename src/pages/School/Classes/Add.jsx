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
  ErrorOutlineRounded,
  MenuBookRounded,
  MeetingRoomRounded,
  RefreshRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Input from "@/components/Input/Input";
import TeacherInChargeSelector from "@/components/Selector/TeacherInChargeSelector";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";

import { addClass } from "@/APIs/school/classes";
import { fetchSubjectsList } from "@/APIs/school/subjects";
import Years from "@/utils/constants/Years";
import Status from "@/utils/constants/Status";
import Gender from "@/utils/constants/Gender";

const FORM_CARD_SX = {
  p: { xs: 1.5, md: 2 },
  mt: 1.25,
  border: "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream)",
  boxShadow: "0 12px 28px rgba(18,47,77,0.06)",
  "& .MuiFormControl-root": { width: "100%", margin: 0 },
  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 46,
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36,74,112,0.13)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--color-gold)",
    borderWidth: "1px",
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
      borderBottom: "1px solid rgba(36,74,112,0.07)",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "var(--color-gold-dark)",
        backgroundColor: "var(--color-gold-soft)",
        border: "1px solid rgba(211,164,79,0.22)",
        borderRadius: "12px",
        "& svg": { fontSize: 21 },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
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
        sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "10px" }}
      >
        {description}
      </Typography>
    </Box>
  </Stack>
);

const extractSubjects = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.docs || payload?.items || payload?.subjects || [];
};

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectsState, setSubjectsState] = useState({
    loading: true,
    error: "",
    count: 0,
  });
  const navigate = useNavigate();

  const loadSubjects = async () => {
    setSubjectsState({ loading: true, error: "", count: 0 });

    try {
      const response = await fetchSubjectsList();

      if (response?.status === false) {
        setSubjectsState({
          loading: false,
          error: response?.message || "تعذر تحميل المواد الدراسية",
          count: 0,
        });
        return;
      }

      const availableSubjects = extractSubjects(response);

      setSubjectsState({
        loading: false,
        error: "",
        count: availableSubjects.length,
      });
    } catch (error) {
      setSubjectsState({
        loading: false,
        error:
          error?.response?.data?.message || "تعذر تحميل المواد الدراسية",
        count: 0,
      });
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const onSubmit = async (formData) => {
    if (selectedSubjects.length === 0) {
      toast.error("يرجى اختيار مادة دراسية واحدة على الأقل");
      return;
    }

    const maxCapacity = Number(formData.maxCapacity);
    if (!Number.isFinite(maxCapacity) || maxCapacity <= 0) {
      toast.error("يرجى إدخال سعة صحيحة للفصل");
      return;
    }

    setLoading(true);

    try {
      const response = await addClass({
        ...formData,
        maxCapacity,
        isActive: String(formData.isActive) === "1",
        subjectIds: selectedSubjects,
      });

      if (!response?.status) {
        toast.error(
          response?.message || response || "حدث خطأ أثناء إضافة الفصل"
        );
        return;
      }

      toast.success("تم إضافة الفصل بنجاح");
      navigate("/school/classes");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء إضافة الفصل"
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
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 3,
          color: "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor: "rgba(255,252,247,0.9)",
            boxShadow: "0 8px 20px rgba(18,47,77,0.04)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Back title="إضافة فصل جديد" />
            <Typography
              sx={{ color: "var(--color-muted)", fontSize: "10px" }}
            >
              أدخل بيانات الفصل ثم اختر المواد واحفظ التغييرات.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading
            icon={<MeetingRoomRounded />}
            title="تفاصيل الفصل"
            description="أدخل بيانات الفصل الأساسية والسعة ورائد الفصل."
          />
          <DataInputs register={register} errors={errors} />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...FORM_CARD_SX,
            p: { xs: 1.4, md: 1.75 },
          }}
        >
          <SectionHeading
            icon={<MenuBookRounded />}
            title="المواد الدراسية"
            description="اختر مادة واحدة على الأقل لربطها بالفصل."
          />

          {subjectsState.loading ? (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ minHeight: 78 }}
            >
              <CircularProgress size={18} sx={{ color: "var(--color-gold-dark)" }} />
              <Typography
                sx={{ color: "var(--color-muted)", fontSize: "10.5px" }}
              >
                جاري تحميل المواد الدراسية...
              </Typography>
            </Stack>
          ) : subjectsState.error ? (
            <Box
              sx={{
                minHeight: 104,
                px: 1.5,
                py: 1.4,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.25,
                border: "1px solid rgba(201,79,79,0.15)",
                borderRadius: "13px",
                backgroundColor: "rgba(201,79,79,0.045)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "var(--color-danger)",
                    backgroundColor: "rgba(201,79,79,0.09)",
                    borderRadius: "11px",
                  }}
                >
                  <ErrorOutlineRounded sx={{ fontSize: 21 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: "var(--color-navy-deep)",
                      fontSize: "11.5px",
                      fontWeight: 800,
                    }}
                  >
                    تعذر تحميل المواد
                  </Typography>
                  <Typography
                    sx={{ mt: 0.15, color: "var(--color-muted)", fontSize: "9.5px" }}
                  >
                    {subjectsState.error}
                  </Typography>
                </Box>
              </Stack>

              <Button
                type="button"
                onClick={loadSubjects}
                startIcon={<RefreshRounded />}
                variant="outlined"
                sx={{
                  minHeight: 38,
                  px: 1.4,
                  borderRadius: "11px",
                  color: "var(--color-navy)",
                  borderColor: "rgba(36,74,112,0.18)",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                }}
              >
                إعادة المحاولة
              </Button>
            </Box>
          ) : subjectsState.count === 0 ? (
            <Box
              sx={{
                minHeight: 118,
                px: 1.5,
                py: 1.5,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.4,
                border: "1px dashed rgba(211,164,79,0.34)",
                borderRadius: "14px",
                backgroundColor: "rgba(251,240,216,0.28)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.1}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    border: "1px solid rgba(211,164,79,0.22)",
                    borderRadius: "12px",
                  }}
                >
                  <MenuBookRounded sx={{ fontSize: 22 }} />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "var(--color-navy-deep)",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    لا توجد مواد دراسية متاحة
                  </Typography>
                  <Typography
                    sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "9.5px" }}
                  >
                    أضف المواد أولًا ثم ارجع لإنشاء الفصل وربطها به.
                  </Typography>
                </Box>
              </Stack>

              <Button
                component={Link}
                to="/school/subjects/add"
                startIcon={<AddCircleOutlineRounded />}
                variant="contained"
                sx={{
                  minHeight: 39,
                  px: 1.55,
                  flexShrink: 0,
                  borderRadius: "11px",
                  color: "var(--color-white)",
                  background:
                    "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  textTransform: "none",
                  "& .MuiButton-startIcon": {
                    marginLeft: "6px",
                    marginRight: 0,
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                  },
                }}
              >
                إضافة مادة جديدة
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                p: { xs: 0.85, md: 1 },
                border: "1px solid rgba(36,74,112,0.08)",
                borderRadius: "13px",
                backgroundColor: "var(--color-white)",
                "& label": { fontSize: "11px" },
              }}
            >
              <SubjectCheckBoxes
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
              />

              <Typography
                sx={{
                  mt: 0.75,
                  color: "var(--color-muted)",
                  fontSize: "9.5px",
                }}
              >
                تم اختيار {selectedSubjects.length} من {subjectsState.count} مادة.
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: { xs: 1.25, md: 1.6 },
            py: 1.15,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 10px 24px rgba(18,47,77,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-start"
            gap={1}
          >
            <Button
              type="submit"
              disabled={
                loading ||
                subjectsState.loading ||
                subjectsState.count === 0 ||
                Boolean(subjectsState.error)
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
                width: { xs: "100%", sm: 170 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                boxShadow: "0 9px 20px rgba(18,47,77,0.16)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
                  marginRight: 0,
                },
                "&:hover": {
                  background:
                    "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                },
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ الفصل"}
            </Button>

            <Button
              type="button"
              disabled={loading}
              variant="outlined"
              startIcon={<CloseRounded />}
              onClick={() => navigate("/school/classes")}
              sx={{
                width: { xs: "100%", sm: 135 },
                minHeight: 44,
                borderRadius: "12px",
                color: "var(--color-navy)",
                borderColor: "rgba(36,74,112,0.18)",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "7px",
                  marginRight: 0,
                },
                "&:hover": {
                  borderColor: "var(--color-gold)",
                  backgroundColor: "var(--color-gold-soft)",
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

const DataInputs = ({ register, errors }) => (
  <Grid container spacing={{ xs: 1.5, md: 2 }}>
    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="academicYear"
        data={Years}
        error={errors.academicYear?.message}
        label="السنة الدراسية"
        required
        type="text"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Input
        register={register}
        registerName="roomNumber"
        error={errors.roomNumber?.message}
        label="رقم الفصل"
        required
        type="text"
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="gender"
        data={Gender}
        name="label"
        error={errors.gender?.message}
        label="نوع الفصل"
        required
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <TeacherInChargeSelector register={register} errors={errors} />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Input
        register={register}
        registerName="maxCapacity"
        error={errors.maxCapacity?.message}
        label="أقصى سعة للفصل"
        required
        type="number"
        defaultValue={20}
        valueAsNumber
      />
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Select
        register={register}
        registerName="isActive"
        data={Status}
        defaultValue={1}
        name="label"
        error={errors.isActive?.message}
        label="الحالة"
        required
      />
    </Grid>
  </Grid>
);

export default Add;
