import {
  Alert,
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
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import StudentForm from "@/components/Students/StudentForm";
import StudentFormActions from "@/components/Students/StudentFormActions";
import GeneratedCredentialsDialog from "@/components/GeneratedCredentialsDialog/GeneratedCredentialsDialog";
import { ResidencyFields } from "@/components/Residency/ResidencyParts";
import { RESIDENCY_EMPTY, residencyProblem, residencyTouched } from "@/components/Residency/residencyConstants";
import { isSaudiStudent, uploadStudentResidency } from "@/APIs/school/residencyDocuments";

import {
  addStudent,
  getStudentResponseId,
} from "@/APIs/school/students";

import {
  fetchBusPlans,
} from "@/APIs/financials/busPlans";

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


const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const serviceTypeLabel = (value) =>
  ({
    pickup: "ذهاب فقط",
    dropoff: "عودة فقط",
    both: "ذهاب وعودة",
  }[value] || "خدمة باص");

const getWarning = (response, key) =>
  response?.data?.[key] ||
  response?.data?.student?.[key] ||
  response?.data?.data?.[key] ||
  response?.student?.[key] ||
  response?.[key] ||
  "";

const getBusEnrollmentWarning = (
  response
) =>
  getWarning(
    response,
    "busEnrollmentWarning"
  );

/*
 * The student is saved even when her financial record could not be built —
 * a missing fee configuration is a finance setup gap, not a failed
 * enrolment. The server used to delete the student instead, so this warning
 * had nothing to report; now it is the only thing telling the office that
 * the record still needs creating.
 */
const getFinancialRecordWarning = (
  response
) =>
  getWarning(
    response,
    "financialRecordWarning"
  );

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      registrationDate: new Date()
        .toISOString()
        .split("T")[0],
      isActive: 1,
      busPlanId: "",
    },
  });

  const [loading, setLoading] =
    useState(false);

  // A non-Saudi student's residency document, uploaded right after the
  // student is created (the document needs the student's id).
  const selectedNationality = watch("nationality");
  const selectedNationalityCode = watch("nationalityCode");
  const needsResidency =
    Boolean(selectedNationality || selectedNationalityCode) &&
    !isSaudiStudent({ nationality: selectedNationality, nationalityCode: selectedNationalityCode });
  const [residencyValues, setResidencyValues] = useState(RESIDENCY_EMPTY);
  const [residencyFiles, setResidencyFiles] = useState([]);
  const [residencyError, setResidencyError] = useState("");

  const [
    busPlans,
    setBusPlans,
  ] = useState([]);

  const [
    busPlansLoading,
    setBusPlansLoading,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadBusPlans = async () => {
      setBusPlansLoading(true);

      try {
        const response =
          await fetchBusPlans();

        if (!mounted) return;

        if (
          response?.status === false
        ) {
          setBusPlans([]);
          return;
        }

        const plans = asArray(
          response?.data ?? response
        );

        setBusPlans(
          plans.filter(
            (plan) =>
              plan?.isActive !==
              false
          )
        );
      } finally {
        if (mounted) {
          setBusPlansLoading(false);
        }
      }
    };

    loadBusPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const busPlanOptions =
    useMemo(
      () =>
        busPlans
          .map((plan) => ({
            id:
              plan?._id ||
              plan?.id,
            label:
              `${plan?.name || "خطة باص"} — ${serviceTypeLabel(
                plan?.serviceType
              )} — ${Number(
                plan?.fee || 0
              ).toLocaleString(
                "ar-SA"
              )} ريال`,
          }))
          .filter(
            (plan) =>
              plan.id
          ),
      [busPlans]
    );

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
    // Optional, but if begun it must be complete — otherwise the student is
    // created and the document silently dropped.
    const withResidency = needsResidency && residencyTouched(residencyValues, residencyFiles);
    if (withResidency) {
      const problem = residencyProblem(residencyValues, residencyFiles);
      if (problem) {
        setResidencyError(problem);
        toast.error(`وثيقة الإقامة: ${problem}`);
        return;
      }
    }

    try {
      setLoading(true);

      const selectedClassId =
        getReferenceId(
          formData?.classId
        );

      const selectedBusPlanId =
        getReferenceId(
          formData?.busPlanId
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

      if (selectedBusPlanId) {
        studentPayload.busPlanId =
          selectedBusPlanId;
      } else {
        delete studentPayload.busPlanId;
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

      const busWarning =
        getBusEnrollmentWarning(
          response
        );

      const financialWarning =
        getFinancialRecordWarning(
          response
        );

      toast.success(
        selectedClassId
          ? "تمت إضافة الطالب وربطه بالفصل وإنشاء بيانات الدخول"
          : "تمت إضافة الطالب وإنشاء بيانات الدخول"
      );

      if (busWarning) {
        toast.warning(
          busWarning
        );
      }

      if (withResidency) {
        const uploaded = await uploadStudentResidency(studentId, residencyValues, residencyFiles);
        if (uploaded?.status === false) {
          toast.warning(
            `تمت إضافة الطالب، لكن تعذر رفع وثيقة الإقامة: ${uploaded.message}. يمكن رفعها من صفحة الطالب.`,
            { autoClose: false }
          );
        } else {
          toast.success("تم رفع وثيقة الإقامة واعتمادها");
          setResidencyValues(RESIDENCY_EMPTY);
          setResidencyFiles([]);
        }
      }

      // Kept open until dismissed: this one needs somebody to act on it, and
      // a notice that disappears by itself is found later at invoicing time.
      if (financialWarning) {
        toast.warning(
          `لم يتم إنشاء السجل المالي للطالب. ${financialWarning}`,
          { autoClose: false }
        );
      }
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
            busPlanOptions={busPlanOptions}
            busPlansLoading={busPlansLoading}
          />

          {needsResidency && (
            <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "20px", border: "1px solid rgba(36, 74, 112, 0.08)" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 16, color: "var(--color-navy-deep)" }}>
                وثيقة الإقامة (اختياري)
              </Typography>
              <Typography sx={{ color: "var(--color-muted)", fontSize: 12, mb: 2 }}>
                إقامة أو تأشيرة زيارة أو جواز سفر للطالب غير السعودي. تُرفع بعد حفظ الطالب وتُعتمد مباشرة، ويمكن رفعها لاحقًا من صفحة الطالب.
              </Typography>
              <ResidencyFields
                values={residencyValues}
                setValues={setResidencyValues}
                files={residencyFiles}
                setFiles={setResidencyFiles}
                setError={setResidencyError}
              />
              {residencyError && <Alert severity="error" sx={{ mt: 1.5 }}>{residencyError}</Alert>}
            </Paper>
          )}

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
