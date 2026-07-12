import { Box, Grid, Typography, Paper, Button } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { usePreparation } from "@/utils/hooks/apis/usePreparation";
import { useAuthUser } from "react-auth-kit";
import { fetchLectures } from "@/APIs/school/lectures";
import { editPreparation } from "@/APIs/school/preparation";
import Loading from "@/components/Loading";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import { translateGender } from "@/utils/helpers/translateGender";
// import Weeks from "@/utils/constants/Weeks";
// import Semesters from "@/utils/constants/Semesters";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // to get the teacher's lectures
  const teacherId = useAuthUser()().user.id; //get logged in teacher's id
  const userRole = useAuthUser()().user.role;
  const [lectures, setLectures] = useState([]);

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch preparation data using the usePreparation custom hook
  const { preparation, loading: preparationLoading } = usePreparation(id);
  console.log(preparation);
  useEffect(() => {
    const fetchData = async () => {
      setLecturesLoading(true);
      
      // If admin, fetch all lectures. If teacher, fetch only their lectures
      const filters = userRole === "ADMIN" ? {} : { teacherId };
      
      const res = await fetchLectures(filters);
      if (res.status) {
        console.log(res);
        setLectures(res.data || []);
      } else {
        toast.error(res || "حدث خطأ ما أثناء جلب المحاضرات !");
        setLectures([]);
      }
      setLecturesLoading(false);
    };

    fetchData();
  }, [teacherId, userRole]); 

  // Set default values when preparation data is loaded
  useEffect(() => {
    if (preparation) {
      // Map the preparation data to match form structure
      const mappedPreparation = {
        // week: preparation.week,
        // semester: preparation.semester,
        lecture: preparation.lecture._id,
        files: preparation.files[0]
      };

      reset(mappedPreparation);
      setDefaultValues(mappedPreparation);

      setUploadedFile(preparation.files[0]);
    }
  }, [preparation, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);
    
    // Check if file was changed (new File uploaded will be instance of File if no new file, it will be an object)
    const fileChanged = data.files instanceof File;

    // Get only changed fields (excluding files, we handle it separately)
    const changedData = getChangedValues(data, defaultValues, ["files"]);
    
    // Add file to changedData if it was changed
    if (fileChanged) {
      changedData.files = data.files;
    }

    // Check if there are any changes
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    let dataToSend;
    if (fileChanged) {
      // Use FormData for file uploads
      const formData = new FormData();
      Object.keys(changedData).forEach((key) => {
        const value = changedData[key];
        formData.append(key, value);
      });
      dataToSend = formData;
    } else {
      // Use regular JSON object if uploaded file not changed
      dataToSend = changedData;
    }
    console.log("changed", changedData);
    console.log("sent", dataToSend)

    const response = await editPreparation(dataToSend, id);

    if (response.status) {
      toast.success("تم تعديل التحضير بنجاح");
      navigate("/school/preparation/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل التحضير!");
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("نوع الملف غير مدعوم. الرجاء رفع ملف PDF فقط.");
      return;
    }

    // Validate file size (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن لا يتجاوز 20 ميجابايت");
      return;
    }

    setUploadedFile(file);
    setValue("files", file); 
  };

  const removeFile = () => {
    setUploadedFile(null);
    setValue("files", null); 
  };

  // no lectures found for this teacher
  if (!lecturesLoading && lectures.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 8, lg: 16 },
          borderRadius: "16px",
          borderColor: "primary.border",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        <Typography color="text.secondary">
          {userRole === "ADMIN" ? "لا توجد محاضرات" : "لا توجد محاضرات لهذا المعلم"}
        </Typography>
      </Paper>
    );
  }

  // Show loading state
  if (lecturesLoading || preparationLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <Back title={"تعديل التحضير"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل التحضير
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            lectures={lectures}
            defaultValues={defaultValues}
          />
        )}
      </Box>

      {/* teacher has lectures - Show preparation Details Form */}
      <Box mb={8} mt={16}>
        <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"}>
          <Box mb={16}>
            <Typography variant="title" fontWeight={"500"}>
              محتوى التحضير
            </Typography>
          </Box>
          <Grid container spacing={8}>
            {!uploadedFile && (
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
                    {...register("files", { required: "يرجى رفع ملف التحضير *"})}                    
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
                      اضغط لرفع التحضير
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      الحد الأقصى: 1 ملف PDF بحجم 20 ميجابايت
                    </Typography>
                  </label>
                </Box>
                {errors.files && (
                  <Typography color="error" variant="caption" mt={2} fontSize={16}>
                    {errors.files.message}
                  </Typography>
                )}
              </Grid>
            )}

            {uploadedFile && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={500} mb={4}>
                   الملف المرفوع
                </Typography>
                <Box>
                  <Box
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
                      {uploadedFile.originalName || uploadedFile.name} 
                      {/* ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB) */}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={removeFile}
                      startIcon={<DeleteOutlineIcon />}
                    >
                      حذف
                    </Button>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, lectures, defaultValues }) => {
  const mappedLectures = lectures.map((lecture) => {
    const slot = Slots.find((slot) => lecture.slot === slot.id).name;
    const day = Days.find((day) => lecture.dayOfWeek === day.id).day;
    const cls = `${lecture.class.academicYear}-${
      lecture.class.roomNumber
    }-${translateGender(lecture.class.gender, "class")}`;
    const subject = `${lecture.subject.subjectName}-${lecture.subject.subjectCode}`;
    return {
      name: `${subject} / يوم ${day} / ${slot} / ${cls}`,
      id: lecture._id,
    };
  });

  return (
    <Grid container mt={8} spacing={8} alignItems={"center"}>
      {/* <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"week"}
          data={Weeks}
          error={errors.week?.message}
          label={"رقم الأسبوع"}
          required={true}
          type={"text"}
          defaultValue={defaultValues.week}
        />
      </Grid> */}
      {/* <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"semester"}
          data={Semesters}
          error={errors.semester?.message}
          label={"الفصل الدراسي"}
          required={true}
          type={"text"}
          defaultValue={defaultValues.semester}
        />
      </Grid> */}
      <Grid item xs={12}>
        <Select
          register={register}
          registerName={"lecture"}
          data={mappedLectures}
          name="name"
          error={errors.lecture?.message}
          label={"الحصة الدراسية"}
          required={true}
          type={"text"}
          defaultValue={defaultValues.lecture}
        />
      </Grid>
    </Grid>
  );
};

export default Edit;
