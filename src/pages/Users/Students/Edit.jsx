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
import { editStudent } from "@/APIs/users/students";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import Status from "@/utils/constants/Status";
import ClassSelector from "@/components/Selector/ClassSelector";
import { useStudent } from "@/utils/hooks/apis/useStudent";
import InstallmentPlanSelector from "@/components/Selector/InstallmentPlanSelector";
import SingleSelect from "@/components/SingleSelect/SingleSelect";
import Countries from "@/utils/constants/Countries";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Reference to default values coming from the API
  const [defaultValues, setDefaultValues] = useState(null);

  // Fetch student data using the useStudent custom hook
  const { student, loading: studentLoading } = useStudent(id);

  // Set default values when student data is loaded
  useEffect(() => {
    if (student) {
      const formattedStudent = {
        ...student,
        birthDate: student.birthDate?.slice(0, 10),
        registrationDate: student.registrationDate?.slice(0, 10),
        isActive: student.isActive ? 1 : 0,
        classId: student?.class?._id || "",
        installmentPlanId:
          typeof student?.installmentPlanId === "object"
            ? student?.installmentPlanId?._id || ""
            : student?.installmentPlanId || "",
      };
      reset(formattedStudent);
      setDefaultValues(formattedStudent);
    }
  }, [student, reset]);

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);
    
    // Get only changed fields
    const changedData = getChangedValues(data, defaultValues, ["class"]);

    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    // Only convert isActive if it was actually changed
    if ("isActive" in changedData) {
      changedData.isActive = changedData.isActive == 1 ? true : false;
    }

    if ("installmentPlanId" in changedData && (!changedData.installmentPlanId || changedData.installmentPlanId === "null")) {
      delete changedData.installmentPlanId;
    }

    const response = await editStudent(changedData, id);

    if (response.status) {
      toast.success("تم تعديل بيانات الطالب بنجاح");
      navigate("/users/students/" + response.data.student._id);
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل بيانات الطالب");
    }

    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل الطالب"} />
      <Box
        bgcolor={"primary.white"}
        p={"32px 16px"}
        borderRadius={"12px"}
        my={8}
      >
        <Typography variant="title" fontWeight={"500"}>
          بيانات الطالب
        </Typography>
        {defaultValues && (
          <DataInputs
            register={register}
            errors={errors}
            defaultValues={defaultValues}
            setValue={setValue}
          />
        )}
      </Box>
      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || studentLoading}
      />
    </Container>
  );
};

const DataInputs = ({
  register,
  errors,
  defaultValues,
  setValue,
}) => {
  const [nationality, setNationality] = useState(null);
  const [nationalityInput, setNationalityInput] = useState("");

  useEffect(() => {
    const nationalityName = defaultValues?.nationality;

    if (!nationalityName) {
      setNationality(null);
      setNationalityInput("");
      return;
    }

    const selectedCountry =
      Countries.find((country) => country.name === nationalityName) || null;

    setNationality(selectedCountry);
    setNationalityInput(nationalityName);
  }, [defaultValues]);

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
        defaultAcademicYear={defaultValues.academicYear}
        defaultGender={defaultValues.gender}
        defaultClassId={defaultValues.classId}
        showGender={true}
        isAcademicYearRequired={true}
        isClassRequired={false}
        gridProps={{ xs: 12, sm: 6, md: 4, lg: 3 }}
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
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <InstallmentPlanSelector
          register={register}
          errors={errors}
          required={false}
          defaultInstallmentPlanId={defaultValues.installmentPlanId || ""}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Select
          register={register}
          registerName={"isActive"}
          data={Status}
          name="label"
          error={errors.isActive?.message}
          label={"الحالة"}
          required={true}
          defaultValue={defaultValues.isActive}
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

export default Edit;