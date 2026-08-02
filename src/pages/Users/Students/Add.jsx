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

import { addStudent } from "@/APIs/users/students";
import { fetchSingleClass } from "@/APIs/school/classes";
import {
  createStudentEnrollment,
  fetchActiveAcademicYear,
  fetchStudentEnrollments,
} from "@/APIs/school/enrollments";

const getCreatedStudentId = (response) => {
  const candidates = [
    response?.data?.student,
    response?.data?.data?.student,
    response?.student,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    const id =
      candidate?._id ||
      candidate?.id;

    if (id) return id;
  }

  return "";
};


const getReferenceId = (value) => {
  if (!value) return "";

  if (
    typeof value === "object"
  ) {
    return (
      value._id ||
      value.id ||
      ""
    );
  }

  const stringValue =
    String(value).trim();

  return /^[a-f\d]{24}$/i.test(
    stringValue
  )
    ? stringValue
    : "";
};

const unwrapResponseData = (
  response
) => {
  let current = response;

  for (
    let index = 0;
    index < 5;
    index += 1
  ) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !==
        "object" ||
      !Object.prototype.hasOwnProperty.call(
        current,
        "data"
      )
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

const extractItems = (
  response
) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    unwrapResponseData(
      response
    ),
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      const possibleArrays = [
        candidate.docs,
        candidate.items,
        candidate.results,
        candidate.enrollments,
        candidate.data,
      ];

      const found =
        possibleArrays.find(
          Array.isArray
        );

      if (found) {
        return found;
      }
    }
  }

  return [];
};

const getEnrollmentClassId = (
  enrollment
) =>
  getReferenceId(
    enrollment?.classId
  ) ||
  getReferenceId(
    enrollment?.class
  );

const hasClassEnrollment = (
  response,
  classId
) =>
  extractItems(response).some(
    (enrollment) =>
      getEnrollmentClassId(
        enrollment
      ) === classId
  );

const resolveAcademicYearId =
  async (classId) => {
    const classResponse =
      await fetchSingleClass(
        classId
      );

    if (
      classResponse?.status !==
      false
    ) {
      const classData =
        unwrapResponseData(
          classResponse
        );

      const classYearId =
        getReferenceId(
          classData?.academicYearId
        ) ||
        getReferenceId(
          classData?.academicYear
        );

      if (classYearId) {
        return classYearId;
      }
    }

    const activeYearResponse =
      await fetchActiveAcademicYear();

    if (
      activeYearResponse?.status ===
      false
    ) {
      return "";
    }

    const activeYear =
      unwrapResponseData(
        activeYearResponse
      );

    return getReferenceId(
      activeYear
    );
  };

const ensureStudentEnrollment =
  async ({
    studentId,
    classId,
  }) => {
    if (
      !studentId ||
      !classId
    ) {
      return {
        status: true,
        created: false,
      };
    }

    const historyResponse =
      await fetchStudentEnrollments(
        studentId
      );

    if (
      historyResponse?.status !==
        false &&
      hasClassEnrollment(
        historyResponse,
        classId
      )
    ) {
      return {
        status: true,
        created: false,
      };
    }

    const academicYearId =
      await resolveAcademicYearId(
        classId
      );

    if (!academicYearId) {
      return {
        status: false,
        message:
          "تمت إضافة الطالب، لكن تعذر تحديد السنة الدراسية لربطه بالفصل.",
      };
    }

    const enrollmentResponse =
      await createStudentEnrollment({
        studentId,
        classId,
        academicYearId,
      });

    if (
      enrollmentResponse?.status ===
      false
    ) {
      return {
        status: false,
        message:
          enrollmentResponse?.message ||
          "تمت إضافة الطالب، لكن تعذر ربطه بالفصل.",
      };
    }

    return {
      status: true,
      created: true,
    };
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

  const navigate = useNavigate();

  const onSubmit = async (
    formData
  ) => {
    try {
      setLoading(true);

      const payload = {
        ...formData,
        isActive:
          formData.isActive === true ||
          formData.isActive === 1 ||
          formData.isActive === "1" ||
          formData.isActive === "true",
      };

      /*
       * الحقول القديمة لا نرسلها للباك.
       * classId يظل موجودًا لأنه يستخدم
       * في التسجيل التلقائي داخل الفصل.
       */
      delete payload.academicYear;
      delete payload.installmentPlanId;
      delete payload.class;
      delete payload.currentEnrollment;
      delete payload.enrollment;
      delete payload.enrollments;

      if (!payload.classId) {
        delete payload.classId;
      }

      if (!payload.password) {
        delete payload.password;
      }

      const response =
        await addStudent(payload);

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "حدث خطأ أثناء إضافة الطالب"
        );
        return;
      }

      const studentId =
        getCreatedStudentId(
          response
        );

      if (!studentId) {
        toast.warning(
          "تمت إضافة الطالب، لكن تعذر فتح ملفه تلقائيًا."
        );

        navigate(
          "/users/students",
          {
            replace: true,
          }
        );

        return;
      }

      const enrollmentResult =
        await ensureStudentEnrollment({
          studentId,
          classId:
            payload.classId ||
            "",
        });

      if (
        !enrollmentResult.status
      ) {
        toast.warning(
          enrollmentResult.message
        );
      } else if (
        payload.classId
      ) {
        toast.success(
          "تمت إضافة الطالب وربطه بالفصل بنجاح"
        );
      } else {
        toast.success(
          "تمت إضافة الطالب بنجاح"
        );
      }

      navigate(
        `/users/students/${studentId}`,
        {
          replace: true,
        }
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
                الطالب.
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
        </Stack>
      </Box>
    </Container>
  );
};

export default Add;
