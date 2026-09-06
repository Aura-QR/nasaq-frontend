import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import EmailRounded from "@mui/icons-material/EmailRounded";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import PinRounded from "@mui/icons-material/PinRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";

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

const ROLES = [
  { value: "TEACHER", label: "معلم" },
  { value: "STUDENT", label: "طالب" },
  { value: "OWNER", label: "مالك المدرسة" },
  { value: "MANAGER", label: "مساعد إداري" },
  { value: "SUPERVISOR", label: "مدير المدرسة" },
];

const STEP_REQUEST = "request";
const STEP_RESET = "reset";
const OTP_TTL_SECONDS = 15 * 60;

const buildSchoolContext = (
  schoolReference
) => {
  const value = String(
    schoolReference || ""
  ).trim();

  if (!value) {
    return {};
  }

  if (/^[a-f\d]{24}$/i.test(value)) {
    return {
      schoolId: value,
    };
  }

  return {
    schoolSlug: value,
  };
};

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(
    0,
    Number(seconds) || 0
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] =
    useState(STEP_REQUEST);

  const [loading, setLoading] =
    useState(false);

  const [role, setRole] =
    useState("TEACHER");

  const [secondsRemaining, setSecondsRemaining] =
    useState(0);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [identity, setIdentity] =
    useState({
      email: "",
      role: "TEACHER",
      schoolSlug: "",
      schoolId: "",
    });

  const requestForm = useForm({
    defaultValues: {
      email: "",
      schoolReference: "",
    },
  });

  const resetForm = useForm({
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword =
    resetForm.watch("newPassword");

  useEffect(() => {
    if (
      step !== STEP_RESET ||
      secondsRemaining <= 0
    ) {
      return undefined;
    }

    const timer = window.setInterval(
      () => {
        setSecondsRemaining(
          (previous) =>
            Math.max(0, previous - 1)
        );
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, [step, secondsRemaining]);

  const onRequest = async (values) => {
    setLoading(true);

    const schoolContext =
      buildSchoolContext(
        values.schoolReference
      );

    const payload = {
      email: values.email.trim(),
      role,
      ...schoolContext,
    };

    const result =
      await requestPasswordOtp(
        payload
      );

    setLoading(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    setIdentity({
      email: payload.email,
      role,
      schoolSlug:
        payload.schoolSlug || "",
      schoolId:
        payload.schoolId || "",
    });

    resetForm.reset({
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setSecondsRemaining(
      OTP_TTL_SECONDS
    );
    setStep(STEP_RESET);

    toast.success(
      result.message ||
        "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز التحقق إليه خلال لحظات"
    );
  };

  const onReset = async (values) => {
    if (secondsRemaining <= 0) {
      toast.error(
        "انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد"
      );
      return;
    }

    setLoading(true);

    const payload = {
      email: identity.email,
      role: identity.role,
      otp: values.otp.trim(),
      newPassword:
        values.newPassword,
    };

    if (identity.schoolSlug) {
      payload.schoolSlug =
        identity.schoolSlug;
    }

    if (identity.schoolId) {
      payload.schoolId =
        identity.schoolId;
    }

    const result =
      await resetPassword(payload);

    setLoading(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    setSecondsRemaining(0);

    toast.success(
      result.message ||
        "تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن"
    );

    navigate("/login", {
      replace: true,
    });
  };

  const onResend = async () => {
    setLoading(true);

    const payload = {
      email: identity.email,
      role: identity.role,
    };

    if (identity.schoolSlug) {
      payload.schoolSlug =
        identity.schoolSlug;
    }

    if (identity.schoolId) {
      payload.schoolId =
        identity.schoolId;
    }

    const result =
      await requestPasswordOtp(
        payload
      );

    setLoading(false);

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    resetForm.setValue(
      "otp",
      ""
    );

    setSecondsRemaining(
      OTP_TTL_SECONDS
    );

    toast.success(
      result.message ||
        "تم طلب رمز تحقق جديد"
    );
  };

  const handleChangeIdentity = () => {
    setStep(STEP_REQUEST);
    setSecondsRemaining(0);
    resetForm.reset();
  };

  const otpExpired =
    step === STEP_RESET &&
    secondsRemaining <= 0;

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
          noValidate
          onSubmit={requestForm.handleSubmit(
            onRequest
          )}
        >
          <Stack spacing={2.25}>
            <AuthField
              label="البريد الإلكتروني"
              type="email"
              placeholder="you@school.com"
              icon={<EmailRounded />}
              autoComplete="email"
              error={
                requestForm.formState
                  .errors.email?.message
              }
              registration={requestForm.register(
                "email",
                {
                  required:
                    "البريد الإلكتروني مطلوب",
                  pattern: {
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      "صيغة البريد غير صحيحة",
                  },
                }
              )}
            />

            <Box>
              <Typography
                component="label"
                sx={{
                  display: "block",
                  mb: 0.75,
                  color:
                    authColors.text,
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
                  setRole(
                    event.target.value
                  )
                }
                sx={{
                  borderRadius: "14px",
                  backgroundColor:
                    "rgba(255,255,255,0.84)",
                }}
              >
                {ROLES.map(
                  (option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  )
                )}
              </Select>
            </Box>

            <AuthField
              label="المدرسة (اختياري)"
              placeholder="school-slug أو معرّف المدرسة"
              icon={<SchoolRounded />}
              registration={requestForm.register(
                "schoolReference"
              )}
            />

            <Typography
              sx={{
                color:
                  authColors.muted,
                fontSize: "12px",
                lineHeight: 1.7,
              }}
            >
              اترك حقل المدرسة فارغًا إلا إذا كان البريد نفسه مستخدمًا في أكثر من مدرسة.
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
                backgroundColor:
                  authColors.navy,
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
          noValidate
          onSubmit={resetForm.handleSubmit(
            onReset
          )}
        >
          <Stack spacing={2.25}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 1,
                px: 1.5,
                py: 1.15,
                borderRadius: "12px",
                border:
                  "1px solid rgba(36,74,112,0.10)",
                bgcolor:
                  "rgba(36,74,112,0.045)",
              }}
            >
              <Typography
                sx={{
                  color:
                    authColors.muted,
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                صلاحية رمز التحقق
              </Typography>

              <Typography
                component="span"
                dir="ltr"
                sx={{
                  color: otpExpired
                    ? authColors.danger
                    : authColors.navy,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: "15px",
                  fontWeight: 900,
                }}
              >
                {formatCountdown(
                  secondsRemaining
                )}
              </Typography>
            </Box>

            {otpExpired && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                انتهت صلاحية رمز التحقق، اطلب رمزًا جديدًا ثم أكمل تغيير كلمة المرور.
              </Alert>
            )}

            <AuthField
              label="رمز التحقق"
              placeholder="000000"
              icon={<PinRounded />}
              inputMode="numeric"
              autoComplete="one-time-code"
              error={
                resetForm.formState
                  .errors.otp?.message
              }
              registration={resetForm.register(
                "otp",
                {
                  required:
                    "رمز التحقق مطلوب",
                  pattern: {
                    value: /^\d{6}$/,
                    message:
                      "رمز التحقق يجب أن يكون 6 أرقام",
                  },
                }
              )}
            />

            <AuthField
              label="كلمة المرور الجديدة"
              type={
                showNewPassword
                  ? "text"
                  : "password"
              }
              placeholder="••••••••"
              icon={<LockResetRounded />}
              autoComplete="new-password"
              error={
                resetForm.formState
                  .errors.newPassword
                  ?.message
              }
              registration={resetForm.register(
                "newPassword",
                {
                  required:
                    "كلمة المرور مطلوبة",
                  minLength: {
                    value: 6,
                    message:
                      "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                  },
                }
              )}
              endAdornment={
                <IconButton
                  type="button"
                  size="small"
                  onClick={() =>
                    setShowNewPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label="إظهار أو إخفاء كلمة المرور الجديدة"
                  sx={{
                    color:
                      authColors.navyLight,
                  }}
                >
                  {showNewPassword ? (
                    <VisibilityOffRounded fontSize="small" />
                  ) : (
                    <VisibilityRounded fontSize="small" />
                  )}
                </IconButton>
              }
            />

            <AuthField
              label="تأكيد كلمة المرور"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="••••••••"
              icon={<LockResetRounded />}
              autoComplete="new-password"
              error={
                resetForm.formState
                  .errors.confirmPassword
                  ?.message
              }
              registration={resetForm.register(
                "confirmPassword",
                {
                  required:
                    "تأكيد كلمة المرور مطلوب",
                  validate: (value) =>
                    value ===
                      newPassword ||
                    "كلمتا المرور غير متطابقتين",
                }
              )}
              endAdornment={
                <IconButton
                  type="button"
                  size="small"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label="إظهار أو إخفاء تأكيد كلمة المرور"
                  sx={{
                    color:
                      authColors.navyLight,
                  }}
                >
                  {showConfirmPassword ? (
                    <VisibilityOffRounded fontSize="small" />
                  ) : (
                    <VisibilityRounded fontSize="small" />
                  )}
                </IconButton>
              }
            />

            <Button
              fullWidth
              type="submit"
              disabled={
                loading || otpExpired
              }
              sx={{
                minHeight: 54,
                borderRadius: "15px",
                color: "#fff",
                fontWeight: 700,
                backgroundColor:
                  authColors.navy,
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
              alignItems="center"
              gap={1}
            >
              <Button
                type="button"
                onClick={onResend}
                disabled={loading}
                sx={{
                  color:
                    authColors.navy,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform:
                    "none",
                }}
              >
                إعادة إرسال الرمز
              </Button>

              <Button
                type="button"
                onClick={
                  handleChangeIdentity
                }
                disabled={loading}
                sx={{
                  color:
                    authColors.muted,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform:
                    "none",
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
