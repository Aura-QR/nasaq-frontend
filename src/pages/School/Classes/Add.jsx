import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import Input from "@/components/Input/Input";
import { addClass } from "@/APIs/school/classes";
import Years from "@/utils/constants/Years";
import Status from "@/utils/constants/Status";
import Gender from "@/utils/constants/Gender";
import TeacherInChargeSelector from "@/components/Selector/TeacherInChargeSelector";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";
const Add = () => {
  // USE FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Selected Subject
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Handle Submit
  const onSubmit = async (data) => {
    // Validate Selected Subjects
    if (selectedSubjects.length === 0) {
      toast.error("يرجى اختيار مادة دراسية واحدة على الأقل");
      return;
    }
    setLoading(true);
    // Adjust Data
    data.maxCapacity = parseInt(data.maxCapacity);
    data.isActive = data.isActive == 1 ? true : false;
    data.subjectIds = selectedSubjects;
    // API Call
    const response = await addClass(data);
    console.log(response);
    if (response.status) {
      toast.success("تم إضافة الفصل بنجاح");
      navigate("/school/classes/");
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"إضافة فصل"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الفصل
        </Typography>
        <DataInputs register={register} errors={errors} />
      </Box>
      {/* Subjects */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          المواد الدراسية
        </Typography>
        <SubjectCheckBoxes
          selectedSubjects={selectedSubjects}
          setSelectedSubjects={setSelectedSubjects}
        />
      </Box>
      {/* Submit */}
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors }) => {
  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"academicYear"}
          data={Years}
          error={errors.academicYear?.message}
          label={"السنة الدراسية"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Input
          register={register}
          registerName={"roomNumber"}
          error={errors.roomNumber?.message}
          label={"رقم الفصل"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"gender"}
          data={Gender}
          name="label"
          error={errors.gender?.message}
          label={"نوع الفصل"}
          required={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TeacherInChargeSelector register={register} errors={errors} />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Input
          register={register}
          registerName={"maxCapacity"}
          error={errors.maxCapacity?.message}
          label={"اقصي سعة للفصل"}
          required={true}
          type={"number"}
          defaultValue={20}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"isActive"}
          data={Status}
          defaultValue={1}
          name="label"
          error={errors.isActive?.message}
          label={"الحالة"}
          required={true}
        />
      </Grid>
    </Grid>
  );
};

export default Add;
