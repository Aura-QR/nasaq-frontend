import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import Select from "@/components/Select/Select";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { editTeacher } from "@/APIs/users/teachers";
import Status from "@/utils/constants/Status";
import {useTeacher} from "@/utils/hooks/apis/useTeacher"

const Edit = () => {
  // USE FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch teacher data using the useTeacher custom hook
  const { teacher, loading: teacherLoading } = useTeacher(id);

  // set default values when teacher data is loaded
  useEffect(() => {
    if (teacher) {
      const formattedTeacher = {
      ...teacher,
      hireDate : teacher.hireDate ? new Date(teacher.hireDate).toISOString().split("T")[0] : "",
      isActive : teacher.isActive ? 1 : 0
      }
      reset(formattedTeacher);
      setDefaultValues(formattedTeacher);
    } 
  }, [teacher, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);

    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, ["subjects"]);
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }
    
    // Only convert isActive if it was actually changed
    if ("isActive" in changedData) {
      changedData.isActive = changedData.isActive == 1 ? true : false;
    }

    const response = await editTeacher(changedData, id);
    if (response.status) {
      toast.success("تم تعديل بيانات المعلم بنجاح");
      navigate("/users/teachers/" + response.data.teacher._id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل بيانات المعلم!");
    }

    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"تعديل المعلم"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          بيانات المعلم
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
          />
        )}
      </Box>
      {/* Submit */}
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || teacherLoading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultValues }) => {
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
          defaultValue={defaultValues.isActive}
          name="label"
          error={errors.isActive?.message}
          label={"الحالة"}
          required={true}
        />
      </Grid>
    </Grid>
  );
};

export default Edit;
