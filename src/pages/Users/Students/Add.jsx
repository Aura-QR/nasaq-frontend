import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  PersonAddAlt1Rounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import StudentForm from "@/components/Students/StudentForm";
import StudentFormActions from "@/components/Students/StudentFormActions";
import GeneratedCredentialsDialog from "@/components/GeneratedCredentialsDialog/GeneratedCredentialsDialog";

import {
  addStudent,
  getStudentResponseId,
} from "@/APIs/school/students";

import {
  generateStudentEmail,
  generateTemporaryPassword,
  getApiResponseMessage,
  getCreatedEntityId,
  isFailedApiResponse,
} from "@/utils/helpers/credentials";

const getReferenceId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id || value?.id || ""
    ).trim();
  }

  return String(value).trim();
};

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      registrationDate: new Date()
        .toISOString()
        .split("T")[0],
      isActive: 1,
    },
  });

  const [loading, setLoading] =
    useState(false);

  const [
    createdCredentials,
    setCreatedCredentials,
  ] = useState(null);

  const navigate = useNavigate();

  const goToStudentProfile = () => {
    const studentId =
      createdCredentials?.studentId;

    navigate(
      studentId
        ? `/users/students/${studentId}`
        : "/users/students",
      {
        replace: true,
      }
    );
  };

  const goToStudentsList = () => {
    navigate(
      "/users/students",
      {
        replace: true,
      }
    );
  };

  const onSubmit = async (
    formData
  ) => {
    try {
      setLoading(true);

      const selectedClassId =
        getReferenceId(
          formData?.classId
        );

      // البريد وكلمة المرور يتم توليدهما تلقائيًا كما كان في الـ flow الأصلي.
      const generatedEmail =
        generateStudentEmail();

      const generatedPassword =
        generateTemporaryPassword();

      /*
       * الـ backend يدعم automatic enrollment عند إرسال classId
       * مع POST /students، لذلك نرسل الفصل في نفس الطلب بدل
       * إنشاء الطالب أولًا ثم عمل POST /enrollments منفصل.
       */
      const studentPayload = {
        ...formData,
        email: generatedEmail,
        password: generatedPassword,
      };

      if (selectedClassId) {
        studentPayload.classId =
          selectedClassId;
      } else {
        delete studentPayload.classId;
      }

      // حقول واجهة قديمة/مساعدة وليست ضمن CreateStudentDto.
      delete studentPayload.academicYear;
      delete studentPayload.installmentPlanId;
      delete studentPayload.class;
      delete studentPayload.currentEnrollment;
      delete studentPayload.enrollment;
      delete studentPayload.enrollments;

      const response =
        await addStudent(
          studentPayload
        );

      if (
        isFailedApiResponse(
          response
        )
      ) {
        toast.error(
          getApiResponseMessage(
            response,
            "حدث خطأ أثناء إضافة الطالب"
          )
        );
        return;
      }

      const studentId =
        getStudentResponseId(
          response
        ) ||
        getCreatedEntityId(
          response,
          "student"
        );

      if (!studentId) {
        toast.error(
          "تم إنشاء الطالب لكن تعذر الحصول على معرّفه"
        );
        return;
      }

      setCreatedCredentials({
        studentId,
        username: generatedEmail,
        password:
          generatedPassword,
      });

      toast.success(
        selectedClassId
          ? "تمت إضافة الطالب وربطه بالفصل وإنشاء بيانات الدخول"
          : "تمت إضافة الطالب وإنشاء بيانات الدخول"
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة الطالب"
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
        autoComplete="off"
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: "fixed",
            top: -10000,
            left: -10000,
            width: 1,
            height: 1,
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <input
            type="text"
            name="nasaq-hidden-username"
            autoComplete="username"
            tabIndex={-1}
          />

          <input
            type="password"
            name="nasaq-hidden-password"
            autoComplete="new-password"
            tabIndex={-1}
          />
        </Box>

        <Stack spacing={1}>
          <Button
            component={Link}
            to="/users/students"
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
            العودة إلى الطلاب
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
              <PersonAddAlt1Rounded />
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
                إضافة طالب جديد
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
                أدخل البيانات الأساسية
                والدراسية لإنشاء حساب
                الطالب، وسيتم إنشاء البريد
                المدرسي وكلمة المرور تلقائيًا.
              </Typography>
            </Box>
          </Paper>

          <StudentForm
            mode="add"
            register={register}
            errors={errors}
            setValue={setValue}
          />

          <StudentFormActions
            loading={loading}
            submitLabel="حفظ الطالب"
          />

          <GeneratedCredentialsDialog
            open={
              Boolean(
                createdCredentials
              )
            }
            accountLabel="حساب الطالب"
            usernameLabel="البريد المدرسي"
            username={
              createdCredentials?.username ||
              ""
            }
            password={
              createdCredentials?.password ||
              ""
            }
            profileLabel="فتح ملف الطالب"
            onOpenProfile={
              goToStudentProfile
            }
            onBackToList={
              goToStudentsList
            }
          />
        </Stack>
      </Box>
    </Container>
  );
};

export default Add;
