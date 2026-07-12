import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { addTeacher } from "@/APIs/users/teachers";
import Input from "@/components/Input/Input";
import Status from "@/utils/constants/Status";
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
    data.isActive = data.isActive == 1 ? true : false;
    data.subjectIds = selectedSubjects;
    // API Call
    const response = await addTeacher(data);
    console.log(response);
    if (response.status) {
      toast.success("تم إضافة المعلم بنجاح");
      navigate("/users/teachers/" + response.data.teacher._id);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"إضافة معلم"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المعلم
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
          المواد الدراسية <span style={{ color: "red" }}>*</span>
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
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"name"}
          error={errors.name?.message}
          label={"اسم المعلم"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"email"}
          error={errors.email?.message}
          label={"البريد الإلكتروني"}
          required={true}
          type={"email"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"password"}
          error={errors.password?.message}
          label={"كلمة المرور"}
          required={true}
          type={"password"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"phoneNumber"}
          error={errors.phoneNumber?.message}
          label={"رقم الهاتف"}
          required={true}
          type={"number"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"qualification"}
          error={errors.qualification?.message}
          label={"المؤهل"}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"hireDate"}
          error={errors.hireDate?.message}
          label={"تاريخ التوظيف"}
          type={"date"}
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"experience"}
          error={errors.experience?.message}
          label={"الخبرة"}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"specialization"}
          error={errors.specialization?.message}
          label={"التخصص"}
          type={"text"}
          required={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"address"}
          error={errors.address?.message}
          label={"العنوان"}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
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
