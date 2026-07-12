import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import { addSubject } from "@/APIs/school/subjects";
import Input from "@/components/Input/Input";

const Add = () => {
  // USE FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);
    const payload = {
      ...data,
      subjectName: data.subjectName?.trim(),
      subjectCode: data.subjectCode?.trim() || undefined,
    };

    const response = await addSubject(payload);
    console.log(response);
    if (response.status) {
      toast.success("تم إضافة المادة بنجاح");
      navigate("/school/subjects");
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"إضافة مادة دراسية"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل المادة
        </Typography>
        <DataInputs register={register} errors={errors} />
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
      <Grid item xs={12} sm={6}>
        <Input
          register={register}
          registerName={"subjectName"}
          error={errors.subjectName?.message}
          label={"اسم المادة"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Input
          register={register}
          registerName={"subjectCode"}
          error={errors.subjectCode?.message}
          label={"كود المادة"}
          type={"text"}
        />
      </Grid>
    </Grid>
  );
};

export default Add;
