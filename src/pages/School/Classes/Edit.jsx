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
import { editClass } from "@/APIs/school/classes";
import Years from "@/utils/constants/Years";
import Gender from "@/utils/constants/Gender";
import Status from "@/utils/constants/Status";
import { useClass } from "@/utils/hooks/apis/useClass";
import TeacherInChargeSelector from "@/components/Selector/TeacherInChargeSelector";

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

  // Fetch class data using the useClass custom hook
  const { currentClass, loading: classLoading } = useClass(id);
  console.log(currentClass)

  // Set default values when class data is loaded
  useEffect(() => {
    if (currentClass) {
      const formattedClass = {
        ...currentClass,
        isActive : currentClass.isActive ? 1 : 0,
        teacherInChargeId : currentClass?.teacherInChargeId || currentClass?.teacherInCharge?._id,
        teacherName: currentClass?.teacherInCharge?.name
      };
      reset(formattedClass);
      setDefaultValues(formattedClass);
    }
  }, [currentClass, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);

    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, [
      "subjects",
      "students",
      "teacherInCharge",
    ]);

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    if (changedData.isActive !== undefined) {
      changedData.isActive = changedData.isActive == 1 ? true : false;
    }
    const response = await editClass(changedData, id);
    if (response.status) {
      toast.success("تم تعديل بيانات الفصل بنجاح");
      navigate("/School/classes");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل بيانات الفصل");
    }

    setLoading(false);
  };

  return (
    <Container>
      {/* Back */}
      <Back title={"تعديل الفصل"} />
      {/* Client Data */}
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          بيانات الفصل
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
        loading={loading || classLoading}
      />
    </Container>
  );
};

const DataInputs = ({ register, errors, defaultValues }) => {

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6} md={4}>
        <Select
          register={register}
          registerName={"academicYear"}
          error={errors.academicYear?.message}
          label={"اسم الفصل"}
          required={true}
          data={Years}
          defaultValue={defaultValues.academicYear}
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
          name="label"
          error={errors.gender?.message}
          label={"نوع الفصل"}
          required={true}
          data={Gender}
          defaultValue={defaultValues.gender}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TeacherInChargeSelector register={register} errors={errors} defaultTeacherInChargeId={defaultValues.teacherInChargeId} defaultTeacherInChargeName={defaultValues.teacherName} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Input
          register={register}
          registerName={"maxCapacity"}
          error={errors.maxCapacity?.message}
          label={"اقصي سعة للفصل"}
          required={true}
          type={"number"}
          valueAsNumber={true}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
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
