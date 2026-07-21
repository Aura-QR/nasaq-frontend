import {
  ArrowBackRounded,
  EmailOutlined,
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuthUser,
  useIsAuthenticated,
  useSignIn,
} from "react-auth-kit";

import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { loginRequest } from "@/APIs/auth/login";

import AuthLayout, {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

const ONBOARDING_COMPLETE_KEY =
  "wadq_onboarding_completed";

/*
 * مؤقتًا، بعد إكمال الـOnboarding نرجع إلى الهوم.
 * عند تجهيز Teacher Dashboard غيّري القيمة إلى:
 * "/teacher/dashboard"
 */
const TEACHER_HOME_PATH = "/";

const getOnboardingStatus = () => {
  try {
    const savedStatus = localStorage.getItem(
      ONBOARDING_COMPLETE_KEY
    );

    if (!savedStatus) {
      return false;
    }

    const parsedStatus =
      JSON.parse(savedStatus);

    return parsedStatus?.completed === true;
  } catch (error) {
    console.error(
      "Unable to read onboarding status:",
      error
    );

    return false;
  }
};

const Login = () => {
  const navigate = useNavigate();

  const signIn = useSignIn();
  const isAuthenticated = useIsAuthenticated();
  const getAuthUser = useAuthUser();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(true);

  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const navigateByRole = useCallback(
    (role) => {
      if (role === "ADMIN") {
        navigate("/users/students", {
          replace: true,
        });

        return;
      }

      if (role === "TEACHER") {
        const hasCompletedOnboarding =
          getOnboardingStatus();

        navigate(
          hasCompletedOnboarding
            ? TEACHER_HOME_PATH
            : "/onboarding",
          {
            replace: true,
          }
        );

        return;
      }

      navigate("/student-dashboard", {
        replace: true,
      });
    },
    [navigate]
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const currentUser = getAuthUser();

    const role =
      currentUser?.user?.role ||
      currentUser?.role;

    if (!role) {
      return;
    }

    navigateByRole(role);
  }, [
    getAuthUser,
    isAuthenticated,
    navigateByRole,
  ]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const response = await loginRequest(
        data.email.trim(),
        data.password
      );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "البيانات غير صحيحة، يرجى المحاولة مرة أخرى"
        );

        return;
      }

      const token =
        response?.data?.accessToken;

      const user =
        response?.data?.user;

      const permissions =
        response?.data?.permissions || [];

      if (!token || !user) {
        toast.error(
          "بيانات تسجيل الدخول غير مكتملة"
        );

        return;
      }

      const signedIn = signIn({
        token,

        /*
         * تذكرني:
         * 30 يومًا لو مفعلة.
         * 10 ساعات لو غير مفعلة.
         */
        expiresIn: rememberMe
          ? 60 * 24 * 30
          : 600,

        tokenType: "Bearer",

        authState: {
          token,
          user,
        },
      });

      if (!signedIn) {
        toast.error(
          "تعذر حفظ جلسة تسجيل الدخول"
        );

        return;
      }

      localStorage.setItem(
        "permissions",
        JSON.stringify(permissions)
      );

      toast.success(
        "تم تسجيل الدخول بنجاح"
      );

      navigateByRole(user.role);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeMode="login"
      title="مرحبًا بك في وَدْق"
      description="سجّل الدخول وابدأ تنظيم يومك الدراسي والوصول إلى حصصك وخططك."
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack spacing={2.2}>
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
            label="كلمة المرور"
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="أدخل كلمة المرور"
            autoComplete="current-password"
            icon={<LockOutlined />}
            error={errors.password?.message}
            registration={register(
              "password",
              {
                required:
                  "كلمة المرور مطلوبة",

                minLength: {
                  value: 6,

                  message:
                    "كلمة المرور يجب ألا تقل عن 6 أحرف",
                },
              }
            )}
            endAdornment={
              <IconButton
                type="button"
                size="small"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label="إظهار أو إخفاء كلمة المرور"
                sx={{
                  color:
                    authColors.navyLight,
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
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mt: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <Checkbox
              size="small"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(
                  event.target.checked
                )
              }
              inputProps={{
                "aria-label":
                  "تذكر تسجيل الدخول",
              }}
              sx={{
                p: 0.4,

                color: authColors.gold,

                "&.Mui-checked": {
                  color:
                    authColors.goldDark,
                },
              }}
            />

            <Typography
              sx={{
                color: authColors.muted,
                fontSize: "11px",
              }}
            >
              تذكرني
            </Typography>
          </Stack>

          <Button
            type="button"
            onClick={() =>
              navigate("/forgot-password")
            }
            sx={{
              p: 0,
              minWidth: 0,

              color: authColors.navy,

              fontSize: "11px",
              fontWeight: 700,
              textTransform: "none",

              "&:hover": {
                color:
                  authColors.goldDark,

                backgroundColor:
                  "transparent",
              },
            }}
          >
            نسيت كلمة المرور؟
          </Button>
        </Stack>

        <Button
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            minHeight: 58,
            mt: 3,
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

              background: "#8893A1",
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
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                تسجيل الدخول
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

export default Login;
