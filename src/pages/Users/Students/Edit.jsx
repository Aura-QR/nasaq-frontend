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
import {
  useEffect,
  useState,
} from "react";
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

import { api } from "@/APIs/Axios";

import { getChangedValues } from "@/utils/helpers/getChangedValues";
import {
  getCurrentEnrollment,
  getStudentClassId,
} from "@/utils/helpers/studentAcademic";
import { useStudent } from "@/utils/hooks/apis/useStudent";


const fetchStudentEnrollmentHistory =
  async (studentId) => {
    if (!studentId) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
      };
    }

    try {
      const response = await api.get(
        `/enrollments/student/${studentId}`
      );

      return response.data;
    } catch (error) {
      return {
        status: false,
        message:
          error?.response?.data?.message ||
          "تعذر تحميل السجل الدراسي للطالب",
      };
    }
  };

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [loading, setLoading] =
    useState(false);

  const [
    enrollmentLoading,
    setEnrollmentLoading,
  ] = useState(true);

  const [
    currentEnrollment,
    setCurrentEnrollment,
  ] = useState(null);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    student,
    loading: studentLoading,
  } = useStudent(id);

  useEffect(() => {
    let active = true;

    const loadEnrollment =
      async () => {
        setEnrollmentLoading(true);

        const response =
          await fetchStudentEnrollmentHistory(
            id
          );

        if (!active) return;

        if (
          response?.status !== false
        ) {
          setCurrentEnrollment(
            getCurrentEnrollment(
              response
            )
          );
        } else {
          setCurrentEnrollment(null);
        }

        setEnrollmentLoading(false);
      };

    loadEnrollment();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      !student ||
      enrollmentLoading
    ) {
      return;
    }

    const formattedStudent = {
      ...student,
      birthDate:
        student.birthDate?.slice(
          0,
          10
        ) || "",
      registrationDate:
        student.registrationDate?.slice(
          0,
          10
        ) || "",
      isActive:
        student.isActive ? 1 : 0,
      classId:
        getStudentClassId(
          student,
          currentEnrollment
        ),
    };

    /*
     * لا نضيف installmentPlanId لأنه لم يعد
     * ضمن Student DTO في الباك الحالي.
     */
    delete formattedStudent.class;
    delete formattedStudent.currentEnrollment;
    delete formattedStudent.enrollment;
    delete formattedStudent.enrollments;
    delete formattedStudent.installmentPlanId;
    delete formattedStudent.academicYear;

    reset(formattedStudent);
    setDefaultValues(
      formattedStudent
    );
  }, [
    student,
    currentEnrollment,
    enrollmentLoading,
    reset,
  ]);

  const onSubmit = async (
    formData
  ) => {
    if (!defaultValues) return;

    try {
      setLoading(true);

      const changedData =
        getChangedValues(
          formData,
          defaultValues,
          [
            "class",
            "currentEnrollment",
            "enrollment",
            "enrollments",
            "academicYear",
            "installmentPlanId",
          ]
        );

      if (
        Object.keys(
          changedData
        ).length === 0
      ) {
        toast.info(
          "لم يتم إجراء أي تغييرات على البيانات"
        );
        return;
      }

      /*
       * ترك الفصل فارغًا لا يرسل classId فارغًا.
       * حذف تسجيل الطالب من الفصل له Endpoint
       * مستقل داخل enrollments.
       */
      if (
        "classId" in changedData &&
        !changedData.classId
      ) {
        delete changedData.classId;
      }

      const response =
        await editStudent(
          changedData,
          id
        );

      if (
        response?.status === false
      ) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء تعديل بيانات الطالب"
        );
        return;
      }

      toast.success(
        "تم تعديل بيانات الطالب بنجاح"
      );

      navigate(
        `/users/students/${id}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل بيانات الطالب"
      );
    } finally {
      setLoading(false);
    }
  };

  const pageLoading =
    studentLoading ||
    enrollmentLoading ||
    !defaultValues;

  return (
    <Container>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Stack spacing={1}>
          <Button
            component={Link}
            to={`/users/students/${id}`}
            startIcon={
              <ArrowForwardIosRounded />
            }
            sx={{
              width: "fit-content",
              minHeight: 34,
              px: 1.1,
              color:
                "var(--color-navy)",
              backgroundColor:
                "rgba(36, 74, 112, 0.045)",
              borderRadius: "10px",
              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "5px",
                  marginRight: 0,
                },

              "& svg": {
                fontSize: "15px",
              },

              "&:hover": {
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
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
              border:
                "1px solid rgba(36, 74, 112, 0.08)",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.38))",
              boxShadow:
                "0 8px 20px rgba(18,47,77,0.05)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
                border:
                  "1px solid rgba(211,164,79,0.21)",
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
                  color:
                    "var(--color-navy-deep)",
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
                  color:
                    "var(--color-muted)",
                  fontSize: "9.5px",
                  lineHeight: 1.5,
                }}
              >
                حدّث البيانات المطلوبة
                ثم احفظ التغييرات.
              </Typography>
            </Box>
          </Paper>

          {pageLoading ? (
            <Stack spacing={1}>
              {[...Array(4)].map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    variant="rounded"
                    height={118}
                    sx={{
                      borderRadius:
                        "16px",
                    }}
                  />
                )
              )}
            </Stack>
          ) : (
            <>
              <StudentForm
                mode="edit"
                register={register}
                errors={errors}
                setValue={setValue}
                defaultValues={
                  defaultValues
                }
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
