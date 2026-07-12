import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import { editSubject } from "@/APIs/school/subjects";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useSubject } from "@/utils/hooks/apis/useSubject";

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
  const { subject, loading: subjectLoading } = useSubject(id);

  // set default values when subject data is loaded
  useEffect(() => {
    if (subject) {
      reset(subject);
      setDefaultValues(subject);
    } 
  }, [subject, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);

    const normalizedData = {
      ...data,
      subjectName: data.subjectName?.trim(),
      subjectCode: data.subjectCode?.trim() || undefined,
    };

    // Get only changed fields
    const changedData = getChangedValues(normalizedData, defaultValues , ["classIds"]);
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editSubject(changedData, id);
    console.log(response);
    if (response.status) {
      toast.success("تم تعديل بيانات المادة بنجاح");
      navigate("/School/subjects");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل بيانات المادة");
    }

    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"تعديل المادة"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          بيانات المادة
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
        loading={loading || subjectLoading}
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

export default Edit;
