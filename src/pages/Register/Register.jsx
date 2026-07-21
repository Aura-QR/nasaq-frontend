import {
  ArrowBackRounded,
  EmailOutlined,
  LockOutlined,
  PersonOutline,
  PhoneOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AuthLayout, {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

const REGISTER_DRAFT_KEY = "wadq_registration_draft";
const ONBOARDING_DRAFT_KEY = "wadq_onboarding_draft";

const Register = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    watch,

    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: "TEACHER",
      };

      /*
       * عند ربط API التسجيل:
       *
       * const response =
       *   await registerRequest(payload);
       *
       * لو الـAPI يرجع Token، احفظه هنا باستخدام react-auth-kit
       * قبل الانتقال إلى /onboarding.
       */

      console.log(
        "Teacher registration payload:",
        payload
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 800)
      );

      window.localStorage.setItem(
        REGISTER_DRAFT_KEY,
        JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
        })
      );

      /*
       * ابدأ Onboarding جديد دائمًا للحساب الجديد.
       */
      window.localStorage.removeItem(
        ONBOARDING_DRAFT_KEY
      );

      toast.success(
        "تم إنشاء حساب المعلم بنجاح"
      );

      navigate("/onboarding", {
        replace: true,
        state: {
          teacherName: payload.name,
        },
      });
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      toast.error(
        "حدث خطأ أثناء إنشاء الحساب"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeMode="register"
      title="ابدأ رحلتك مع نَسّق"
      description="أنشئ حساب معلم وابدأ تنظيم حصصك وخططك ومهامك من مكان واحد."
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack spacing={1.8}>
          <AuthField
            label="الاسم بالكامل"
            type="text"
            placeholder="أدخل الاسم بالكامل"
            autoComplete="name"
            icon={<PersonOutline />}
            error={errors.name?.message}
            registration={register("name", {
              required:
                "الاسم بالكامل مطلوب",

              minLength: {
                value: 3,

                message:
                  "الاسم يجب ألا يقل عن 3 أحرف",
              },
            })}
          />

          <AuthField
            label="البريد الإلكتروني"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            icon={<EmailOutlined />}
            error={errors.email?.message}
            registration={register("email", {
              required:
                "البريد الإلكتروني مطلوب",

              pattern: {
                value:
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                message:
                  "أدخل بريدًا إلكترونيًا صحيحًا",
              },
            })}
          />

          <AuthField
            label="رقم الجوال"
            type="tel"
            placeholder="05xxxxxxxx"
            autoComplete="tel"
            inputMode="tel"
            icon={<PhoneOutlined />}
            error={errors.phone?.message}
            registration={register("phone", {
              required: "رقم الجوال مطلوب",

              pattern: {
                value:
                  /^(?:05\d{8}|\+9665\d{8})$/,

                message:
                  "أدخل رقم جوال سعودي صحيحًا",
              },
            })}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },

              gap: 1.8,
            }}
          >
            <AuthField
              label="كلمة المرور"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="أدخل كلمة المرور"
              autoComplete="new-password"
              icon={<LockOutlined />}
              error={errors.password?.message}
              registration={register("password", {
                required:
                  "كلمة المرور مطلوبة",

                minLength: {
                  value: 8,

                  message:
                    "كلمة المرور يجب ألا تقل عن 8 أحرف",
                },
              })}
              endAdornment={
                <IconButton
                  type="button"
                  size="small"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label="إظهار أو إخفاء كلمة المرور"
                  sx={{
                    color: authColors.navyLight,
                  }}
                >
                  {showPassword ? (
                    <VisibilityOffOutlined fontSize="small" />
                  ) : (
                    <VisibilityOutlined fontSize="small" />
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
              placeholder="أعد كتابة كلمة المرور"
              autoComplete="new-password"
              icon={<LockOutlined />}
              error={
                errors.confirmPassword?.message
              }
              registration={register(
                "confirmPassword",
                {
                  required:
                    "تأكيد كلمة المرور مطلوب",

                  validate: (value) =>
                    value === password ||
                    "كلمتا المرور غير متطابقتين",
                }
              )}
              endAdornment={
                <IconButton
                  type="button"
                  size="small"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label="إظهار أو إخفاء تأكيد كلمة المرور"
                  sx={{
                    color: authColors.navyLight,
                  }}
                >
                  {showConfirmPassword ? (
                    <VisibilityOffOutlined fontSize="small" />
                  ) : (
                    <VisibilityOutlined fontSize="small" />
                  )}
                </IconButton>
              }
            />
          </Box>
        </Stack>

        <Button
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            minHeight: 58,
            mt: 2.8,
            px: 2,

            borderRadius: "15px",

            color: authColors.goldSoft,

            background: `linear-gradient(
              135deg,
              ${authColors.navyLight} 0%,
              ${authColors.navyDark} 100%
            )`,

            boxShadow:
              "0 15px 32px rgba(7,22,41,0.24)",

            textTransform: "none",

            transition:
              "transform 0.2s ease, box-shadow 0.2s ease",

            "&:hover": {
              transform: "translateY(-2px)",

              boxShadow:
                "0 19px 38px rgba(7,22,41,0.30)",

              background: `linear-gradient(
                135deg,
                ${authColors.navy} 0%,
                ${authColors.navyDark} 100%
              )`,
            },

            "&:disabled": {
              color: "rgba(255,255,255,0.8)",
              background: "#8893A1",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={23}
              sx={{
                color: authColors.goldSoft,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",

                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                إنشاء حساب معلم
              </Typography>

              <Box
                sx={{
                  width: 38,
                  height: 38,

                  display: "grid",
                  placeItems: "center",

                  borderRadius: "50%",

                  border: `1px solid ${authColors.gold}`,

                  color: authColors.gold,

                  "& svg": {
                    fontSize: 20,
                  },
                }}
              >
                <ArrowBackRounded />
              </Box>
            </Box>
          )}
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default Register;
