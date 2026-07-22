import {
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  ManageAccountsRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import StudentForm from "@/components/Students/StudentForm";
import StudentFormActions from "@/components/Students/StudentFormActions";

import { editStudent } from "@/APIs/users/students";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useStudent } from "@/utils/hooks/apis/useStudent";

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    student,
    loading: studentLoading,
  } = useStudent(id);

  useEffect(() => {
    if (!student) return;

    const formattedStudent = {
      ...student,
      birthDate: student.birthDate?.slice(0, 10) || "",
      registrationDate:
        student.registrationDate?.slice(0, 10) || "",
      isActive: student.isActive ? 1 : 0,
      classId: student?.class?._id || "",
      installmentPlanId:
        typeof student?.installmentPlanId === "object"
          ? student.installmentPlanId?._id || ""
          : student?.installmentPlanId || "",
    };

    reset(formattedStudent);
    setDefaultValues(formattedStudent);
  }, [student, reset]);

  const onSubmit = async (formData) => {
    if (!defaultValues) return;

    try {
      setLoading(true);

      const changedData = getChangedValues(
        formData,
        defaultValues,
        ["class"]
      );

      if (Object.keys(changedData).length === 0) {
        toast.info("لم يتم إجراء أي تغييرات على البيانات");
        return;
      }

      if ("isActive" in changedData) {
        changedData.isActive = changedData.isActive == 1;
      }

      if (
        "classId" in changedData &&
        !changedData.classId
      ) {
        delete changedData.classId;
      }

      if (
        "installmentPlanId" in changedData &&
        (!changedData.installmentPlanId ||
          changedData.installmentPlanId === "null")
      ) {
        delete changedData.installmentPlanId;
      }

      const response = await editStudent(
        changedData,
        id
      );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء تعديل بيانات الطالب"
        );
        return;
      }

      toast.success("تم تعديل بيانات الطالب بنجاح");

      const studentId =
        response?.data?.student?._id || id;

      navigate(
        `/users/students/${studentId}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء تعديل بيانات الطالب"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack spacing={1}>
          <Button
            component={Link}
            to={`/users/students/${id}`}
            startIcon={<ArrowForwardIosRounded />}
            sx={{
              width: "fit-content",
              minHeight: 34,
              px: 1.1,

              color: "var(--color-navy)",
              backgroundColor: "rgba(36, 74, 112, 0.045)",
              borderRadius: "10px",

              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon": {
                marginLeft: "5px",
                marginRight: 0,
              },

              "& svg": {
                fontSize: "15px",
              },

              "&:hover": {
                color: "var(--color-gold-dark)",
                backgroundColor: "var(--color-gold-soft)",
              },
            }}
          >
            العودة إلى تفاصيل الطالب
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 1.25,
                md: 1.5,
              },

              display: "flex",
              alignItems: "center",
              gap: 1,

              border: "1px solid rgba(36, 74, 112, 0.08)",
              borderRadius: "16px",

              background:
                "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.38))",

              boxShadow: "0 8px 20px rgba(18,47,77,0.05)",
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

                border: "1px solid rgba(211,164,79,0.21)",
                borderRadius: "12px",

                "& svg": {
                  fontSize: 21,
                },
              }}
            >
              <ManageAccountsRounded />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color: "var(--color-navy-deep)",
                  fontSize: {
                    xs: "19px",
                    md: "22px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.25,
                }}
              >
                تعديل بيانات الطالب
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: "var(--color-muted)",
                  fontSize: "9.5px",
                  lineHeight: 1.5,
                }}
              >
                حدّث البيانات المطلوبة ثم احفظ التغييرات.
              </Typography>
            </Box>
          </Paper>

          {studentLoading || !defaultValues ? (
            <Stack spacing={1}>
              {[...Array(4)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={118}
                  sx={{
                    borderRadius: "16px",
                  }}
                />
              ))}
            </Stack>
          ) : (
            <>
              <StudentForm
                mode="edit"
                register={register}
                errors={errors}
                setValue={setValue}
                defaultValues={defaultValues}
              />

              <StudentFormActions
                loading={loading}
                submitLabel="حفظ التعديلات"
              />
            </>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Edit;
