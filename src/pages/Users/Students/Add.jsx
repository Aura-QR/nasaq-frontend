import { Box, Grid, Typography } from "@mui/material";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitSection from "@/components/SubmitSection";
import { toast } from "react-toastify";
import { addStudent } from "@/APIs/users/students";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import Status from "@/utils/constants/Status";
import SingleSelect from "@/components/SingleSelect/SingleSelect";
import Countries from "@/utils/constants/Countries";
import ClassSelector from "@/components/Selector/ClassSelector";
import InstallmentPlanSelector from "@/components/Selector/InstallmentPlanSelector";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      registrationDate: new Date().toISOString().split("T")[0],
      isActive: 1,
    },
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    // Convert isActive to boolean
    data.isActive = data.isActive == 1 ? true : false;
    // Remove classId if empty
    if (!data.classId) {
      delete data.classId;
    }
    // Omit installment plan to allow default system plan
    if (!data.installmentPlanId || data.installmentPlanId === "null") {
      delete data.installmentPlanId;
    }
    const response = await addStudent(data);
    if (response.status) {
      toast.success("تم إضافة الطالب بنجاح");
      navigate("/users/students/" + response.data._id);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة طالب"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل الطالب
        </Typography>
        <DataInputs
          register={register}
          errors={errors}
          setValue={setValue}
        />
      </Box>
      <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} />
    </Container>
  );
};

const DataInputs = ({ register, errors, setValue }) => {
  const [nationality, setNationality] = useState(null);
  const [nationalityInput, setNationalityInput] = useState("");

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"firstName"}
          error={errors.firstName?.message}
          label={"الاسم الأول"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"fatherName"}
          error={errors.fatherName?.message}
          label={"اسم الأب"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"familyName"}
          error={errors.familyName?.message}
          label={"اسم العائلة"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"birthDate"}
          error={errors.birthDate?.message}
          label={"تاريخ الميلاد"}
          required={true}
          type={"date"}
        />
      </Grid>
      {/* ClassSelector with gender and academic year filter */}
      <ClassSelector
        register={register}
        errors={errors}
        setValue={setValue}
        showGender={true}
        isAcademicYearRequired={true}
        isClassRequired={false}
        gridProps={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        defaultSelect="بدون فصل"
      />
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <SingleSelect
          value={nationality}
          onChange={(_, newValue) => {
            setNationality(newValue);
            setValue("nationality", newValue ? newValue.name : "");
          }}
          inputValue={nationalityInput}
          onInputChange={(_, newInputValue) => setNationalityInput(newInputValue)}
          options={Countries}
          label={"الجنسية"}
          placeholder={"ابحث عن الجنسية..."}
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
          registerName={"address"}
          error={errors.address?.message}
          label={"العنوان"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"previousSchool"}
          error={errors.previousSchool?.message}
          label={"المدرسة السابقة"}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Input
          register={register}
          registerName={"registrationDate"}
          error={errors.registrationDate?.message}
          label={"تاريخ التسجيل"}
          type={"date"}
          required={true}
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <InstallmentPlanSelector register={register} errors={errors} required={false} />
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
      <Grid item xs={12}>
        <Input
          register={register}
          registerName={"notes"}
          error={errors.notes?.message}
          label={"ملاحظات"}
          type={"text"}
          multiline={true}
        />
      </Grid>
    </Grid>
  );
};

export default Add;