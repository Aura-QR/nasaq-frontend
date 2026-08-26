import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import EmailRounded from "@mui/icons-material/EmailRounded";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import PinRounded from "@mui/icons-material/PinRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";

import {
  toast,
} from "react-toastify";

import {
  requestPasswordOtp,
  resetPassword,
} from "@/APIs/auth/password";

import AuthLayout, {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

/*
 * استعادة كلمة المرور.
 *
 * الدالتان requestPasswordOtp و resetPassword كانتا موجودتين في
 * APIs/auth/password.js دون أي مستدعٍ، وزر "نسيت كلمة المرور؟" في شاشة
 * الدخول كان بلا onClick — أي أن المستخدم يضغط ولا يحدث شيء.
 *
 * خطوتان لأن الـ API خطوتان: طلب الرمز، ثم تعيين كلمة المرور به.
 */

const ROLES = [
  { value: "TEACHER", label: "معلم" },
  { value: "STUDENT", label: "طالب" },
  { value: "OWNER", label: "مالك المدرسة" },
  { value: "MANAGER", label: "مساعد إداري" },
  { value: "SUPERVISOR", label: "مدير المدرسة" },
];

const STEP_REQUEST = "request";
const STEP_RESET = "reset";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_REQUEST);
  const [loading, setLoading] = useState(false);

  /*
   * البريد والدور مطلوبان في الطلبين معًا، فيُحتفظ بهما بعد الخطوة الأولى
   * بدل مطالبة المستخدم بإعادة إدخالهما.
   */
  const [identity, setIdentity] = useState({
    email: "",
    role: "TEACHER",
    schoolSlug: "",
  });

  const requestForm = useForm({
    defaultValues: {
      email: "",
      schoolSlug: "",
    },
  });

  const resetForm = useForm({
    defaultValues: {
      otp: "",
      newPassword: "",
    },
  });

  const [role, setRole] = useState("TEACHER");

  const onRequest = async (values) => {
    setLoading(true);

    const payload = {
      email: values.email.trim(),
      role,
    };

    /*
     * معرّف المدرسة اختياري، ولا يلزم إلا حين يوجد البريد نفسه في أكثر من
     * مدرسة. إرساله فارغًا يجعل الخادم يبحث في مدرسة اسمها "".
     */
    if (values.schoolSlug?.trim()) {
      payload.schoolSlug = values.schoolSlug.trim();
    }

    const result = await requestPasswordOtp(payload);
    setLoading(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    setIdentity({
      email: payload.email,
      role,
      schoolSlug: payload.schoolSlug || "",
    });

    setStep(STEP_RESET);

    /*
     * الخادم يجيب بنجاح سواء كان البريد مسجلًا أم لا، حتى لا تتحول هذه
     * النقطة إلى وسيلة لاكتشاف عناوين المدرسة. لذا الصياغة "إن كان مسجلًا"
     * وليست "تم الإرسال" — وإلا لأكّدنا ما لم يؤكده الخادم.
     */
    toast.success(
      "إن كان البريد مسجلًا، سيصلك رمز صالح لمدة ١٥ دقيقة"
    );
  };

  const onReset = async (values) => {
    setLoading(true);

    const payload = {
      email: identity.email,
      role: identity.role,
      otp: values.otp.trim(),
      newPassword: values.newPassword,
    };

    if (identity.schoolSlug) {
      payload.schoolSlug = identity.schoolSlug;
    }

    const result = await resetPassword(payload);
    setLoading(false);

    if (!result.status) {
      /*
       * الرمز الخاطئ أو المنتهي هو الفشل المتوقع، ويُصلح بإعادة كتابة
       * الرمز — فلا يُعاد المستخدم إلى الخطوة الأولى.
       */
      toast.error(result.message);
      return;
    }

    toast.success("تم تغيير كلمة المرور. سجّل الدخول بها الآن.");
    navigate("/", { replace: true });
  };

  const onResend = async () => {
    setLoading(true);

    const payload = {
      email: identity.email,
      role: identity.role,
    };

    if (identity.schoolSlug) {
      payload.schoolSlug = identity.schoolSlug;
    }

    const result = await requestPasswordOtp(payload);
    setLoading(false);

    if (result.status) {
      toast.success("أُعيد إرسال الرمز");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AuthLayout
      activeMode="login"
      title="استعادة كلمة المرور"
      description={
        step === STEP_REQUEST
          ? "أدخل بريدك الإلكتروني ونوع حسابك، وسيصلك رمز تحقق."
          : `أدخل الرمز المرسل إلى ${identity.email} وكلمة المرور الجديدة.`
      }
    >
      {step === STEP_REQUEST ? (
        <Box
          component="form"
          onSubmit={requestForm.handleSubmit(onRequest)}
        >
          <Stack spacing={2.25}>
            <AuthField
              label="البريد الإلكتروني"
              type="email"
              placeholder="you@school.com"
              icon={<EmailRounded />}
              autoComplete="email"
              error={requestForm.formState.errors.email}
              registration={requestForm.register("email", {
                required: "البريد الإلكتروني مطلوب",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "صيغة البريد غير صحيحة",
                },
              })}
            />

            <Box>
              <Typography
                component="label"
                sx={{
                  display: "block",
                  mb: 0.75,
                  color: authColors.text,
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                نوع الحساب
              </Typography>

              <Select
                fullWidth
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                sx={{
                  borderRadius: "14px",
                  backgroundColor:
                    "rgba(255,255,255,0.84)",
                }}
              >
                {ROLES.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <AuthField
              label="معرّف المدرسة (اختياري)"
              placeholder="andalus-test"
              icon={<SchoolRounded />}
              registration={requestForm.register(
                "schoolSlug"
              )}
            />

            <Typography
              sx={{
                color: authColors.muted,
                fontSize: "12px",
                lineHeight: 1.7,
              }}
            >
              لا يلزم معرّف المدرسة إلا إذا كان بريدك مسجلًا في أكثر من مدرسة.
            </Typography>

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              sx={{
                minHeight: 54,
                borderRadius: "15px",
                color: "#fff",
                fontWeight: 700,
                backgroundColor: authColors.navy,
                "&:hover": {
                  backgroundColor:
                    authColors.navyDark,
                },
              }}
            >
              {loading
                ? "جارٍ الإرسال…"
                : "إرسال رمز التحقق"}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={resetForm.handleSubmit(onReset)}
        >
          <Stack spacing={2.25}>
            <AuthField
              label="رمز التحقق"
              placeholder="######"
              icon={<PinRounded />}
              inputMode="numeric"
              autoComplete="one-time-code"
              error={resetForm.formState.errors.otp}
              registration={resetForm.register("otp", {
                required: "رمز التحقق مطلوب",
                pattern: {
                  value: /^\d{4,8}$/,
                  message: "الرمز أرقام فقط",
                },
              })}
            />

            <AuthField
              label="كلمة المرور الجديدة"
              type="password"
              placeholder="••••••••"
              icon={<LockResetRounded />}
              autoComplete="new-password"
              error={
                resetForm.formState.errors.newPassword
              }
              registration={resetForm.register(
                "newPassword",
                {
                  required: "كلمة المرور مطلوبة",
                  minLength: {
                    value: 6,
                    message:
                      "كلمة المرور ٦ أحرف على الأقل",
                  },
                }
              )}
            />

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              sx={{
                minHeight: 54,
                borderRadius: "15px",
                color: "#fff",
                fontWeight: 700,
                backgroundColor: authColors.navy,
                "&:hover": {
                  backgroundColor:
                    authColors.navyDark,
                },
              }}
            >
              {loading
                ? "جارٍ الحفظ…"
                : "تعيين كلمة المرور"}
            </Button>

            <Stack
              direction="row"
              justifyContent="space-between"
            >
              <Button
                onClick={onResend}
                disabled={loading}
                sx={{
                  color: authColors.navy,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                إعادة إرسال الرمز
              </Button>

              <Button
                onClick={() => setStep(STEP_REQUEST)}
                disabled={loading}
                sx={{
                  color: authColors.muted,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                تغيير البريد
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
