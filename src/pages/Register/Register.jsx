import {
  AccountCircleOutlined,
  AlternateEmailOutlined,
  ArrowBackRounded,
  BadgeOutlined,
  BusinessOutlined,
  EmailOutlined,
  LinkRounded,
  LockOutlined,
  PhoneOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import registerRequest from "@/APIs/auth/register";

import AuthLayout, {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const USERNAME_PATTERN =
  /^[a-zA-Z0-9._-]{3,30}$/;

const PHONE_PATTERN =
  /^\+?[1-9]\d{7,14}$/;

const getResponseError = (response) => {
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.error ||
    response?.data?.message ||
    "تعذر تسجيل المدرسة"
  );
};

const isSuccessfulResponse = (response) => {
  if (!response) {
    return false;
  }

  if (typeof response === "string") {
    return false;
  }

  return response?.status !== false;
};

const Register = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [
    showOwnerPassword,
    setShowOwnerPassword,
  ] = useState(false);

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
      schoolName: "",
      slug: "",
      schoolEmail: "",
      phone: "",

      ownerName: "",
      ownerUsername: "",
      ownerEmail: "",
      ownerPassword: "",
      confirmOwnerPassword: "",
    },
  });

  const ownerPassword = watch(
    "ownerPassword"
  );

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        schoolName:
          data.schoolName.trim(),

        slug:
          data.slug.trim(),

        schoolEmail:
          data.schoolEmail.trim(),

        phone:
          data.phone.trim(),

        ownerName:
          data.ownerName.trim(),

        ownerUsername:
          data.ownerUsername.trim(),

        ownerEmail:
          data.ownerEmail.trim(),

        ownerPassword:
          data.ownerPassword,
      };

      const response =
        await registerRequest(payload);

      if (
        !isSuccessfulResponse(response)
      ) {
        toast.error(
          getResponseError(response)
        );

        return;
      }

      toast.success(
        response?.message ||
          "تم إنشاء المدرسة وحساب المالك بنجاح"
      );

      navigate("/login", {
        replace: true,

        state: {
          registered: true,

          email:
            payload.ownerEmail,
        },
      });
    } catch (error) {
      console.error(
        "School registration error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء إنشاء المدرسة"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeMode="register"
      title="أنشئ مدرستك في نَسّق"
      description="سجّل بيانات المدرسة وحساب المالك لبدء إدارة المنصة من مكان واحد."
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Stack spacing={2.2}>
          <FormSectionTitle
            title="بيانات المدرسة"
            description="هذه البيانات تُستخدم لإنشاء المدرسة وربط جميع المستخدمين بها."
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
              label="اسم المدرسة"
              type="text"
              placeholder="مثال: مدرسة نَسّق الأهلية"
              autoComplete="organization"
              icon={<BusinessOutlined />}
              error={
                errors.schoolName?.message
              }
              registration={register(
                "schoolName",
                {
                  required:
                    "اسم المدرسة مطلوب",

                  minLength: {
                    value: 3,

                    message:
                      "اسم المدرسة يجب ألا يقل عن 3 أحرف",
                  },
                }
              )}
            />

            <AuthField
              label="معرّف المدرسة"
              type="text"
              placeholder="مثال: nasaq-school"
              autoComplete="off"
              inputMode="text"
              icon={<LinkRounded />}
              error={
                errors.slug?.message
              }
              registration={register(
                "slug",
                {
                  required:
                    "معرّف المدرسة مطلوب",

                  pattern: {
                    value:
                      SLUG_PATTERN,

                    message:
                      "استخدم حروفًا إنجليزية صغيرة وأرقامًا وشرطة فقط",
                  },
                }
              )}
            />

            <AuthField
              label="البريد الإلكتروني للمدرسة"
              type="email"
              placeholder="info@school.com"
              autoComplete="email"
              icon={<EmailOutlined />}
              error={
                errors.schoolEmail
                  ?.message
              }
              registration={register(
                "schoolEmail",
                {
                  required:
                    "البريد الإلكتروني للمدرسة مطلوب",

                  pattern: {
                    value:
                      EMAIL_PATTERN,

                    message:
                      "أدخل بريدًا إلكترونيًا صحيحًا",
                  },
                }
              )}
            />

            <AuthField
              label="رقم هاتف المدرسة"
              type="tel"
              placeholder="+9665xxxxxxxx"
              autoComplete="tel"
              inputMode="tel"
              icon={<PhoneOutlined />}
              error={
                errors.phone?.message
              }
              registration={register(
                "phone",
                {
                  required:
                    "رقم هاتف المدرسة مطلوب",

                  setValueAs: (
                    value
                  ) =>
                    String(
                      value || ""
                    ).replace(
                      /[\s()-]/g,
                      ""
                    ),

                  pattern: {
                    value:
                      PHONE_PATTERN,

                    message:
                      "أدخل رقم هاتف دوليًا صحيحًا",
                  },
                }
              )}
            />
          </Box>

          <Divider
            sx={{
              borderColor:
                "rgba(36,74,112,0.10)",
            }}
          />

          <FormSectionTitle
            title="بيانات مالك المدرسة"
            description="سيتم إنشاء حساب OWNER بهذه البيانات لاستخدام لوحة إدارة المدرسة."
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
              label="اسم المالك"
              type="text"
              placeholder="أدخل الاسم بالكامل"
              autoComplete="name"
              icon={<BadgeOutlined />}
              error={
                errors.ownerName
                  ?.message
              }
              registration={register(
                "ownerName",
                {
                  required:
                    "اسم المالك مطلوب",

                  minLength: {
                    value: 3,

                    message:
                      "اسم المالك يجب ألا يقل عن 3 أحرف",
                  },
                }
              )}
            />

            <AuthField
              label="اسم المستخدم"
              type="text"
              placeholder="مثال: owner_ahmed"
              autoComplete="username"
              icon={
                <AccountCircleOutlined />
              }
              error={
                errors.ownerUsername
                  ?.message
              }
              registration={register(
                "ownerUsername",
                {
                  required:
                    "اسم المستخدم مطلوب",

                  pattern: {
                    value:
                      USERNAME_PATTERN,

                    message:
                      "استخدم من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا",
                  },
                }
              )}
            />

            <AuthField
              label="البريد الإلكتروني للمالك"
              type="email"
              placeholder="owner@school.com"
              autoComplete="email"
              icon={
                <AlternateEmailOutlined />
              }
              error={
                errors.ownerEmail
                  ?.message
              }
              registration={register(
                "ownerEmail",
                {
                  required:
                    "البريد الإلكتروني للمالك مطلوب",

                  pattern: {
                    value:
                      EMAIL_PATTERN,

                    message:
                      "أدخل بريدًا إلكترونيًا صحيحًا",
                  },
                }
              )}
            />

            <Box />

            <AuthField
              label="كلمة مرور المالك"
              type={
                showOwnerPassword
                  ? "text"
                  : "password"
              }
              placeholder="أدخل كلمة المرور"
              autoComplete="new-password"
              icon={<LockOutlined />}
              error={
                errors.ownerPassword
                  ?.message
              }
              registration={register(
                "ownerPassword",
                {
                  required:
                    "كلمة مرور المالك مطلوبة",

                  minLength: {
                    value: 8,

                    message:
                      "كلمة المرور يجب ألا تقل عن 8 أحرف",
                  },
                }
              )}
              endAdornment={
                <IconButton
                  type="button"
                  size="small"
                  onClick={() =>
                    setShowOwnerPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label="إظهار أو إخفاء كلمة مرور المالك"
                  sx={{
                    color:
                      authColors.navyLight,
                  }}
                >
                  {showOwnerPassword ? (
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
                errors
                  .confirmOwnerPassword
                  ?.message
              }
              registration={register(
                "confirmOwnerPassword",
                {
                  required:
                    "تأكيد كلمة المرور مطلوب",

                  validate: (
                    value
                  ) =>
                    value ===
                      ownerPassword ||
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

            color:
              authColors.goldSoft,

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
              transform:
                "translateY(-2px)",

              boxShadow:
                "0 19px 38px rgba(7,22,41,0.30)",

              background: `linear-gradient(
                135deg,
                ${authColors.navy} 0%,
                ${authColors.navyDark} 100%
              )`,
            },

            "&:disabled": {
              color:
                "rgba(255,255,255,0.8)",

              background:
                "#8893A1",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={23}
              sx={{
                color:
                  authColors.goldSoft,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",

                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
              }}
            >
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                إنشاء المدرسة
              </Typography>

              <Box
                sx={{
                  width: 38,
                  height: 38,

                  display: "grid",
                  placeItems: "center",

                  borderRadius: "50%",

                  border: `1px solid ${authColors.gold}`,

                  color:
                    authColors.gold,

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

const FormSectionTitle = ({
  title,
  description,
}) => (
  <Box>
    <Typography
      sx={{
        color:
          authColors.navyDark,

        fontSize: "15px",
        fontWeight: 800,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        mt: 0.35,

        color:
          authColors.muted,

        fontSize: "11px",
        lineHeight: 1.7,
      }}
    >
      {description}
    </Typography>
  </Box>
);

export default Register;
