import {
  AdminPanelSettingsRounded,
  ApartmentRounded,
  ArrowBackRounded,
  EmailOutlined,
  LockOutlined,
  SecurityRounded,
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

import {
  useEffect,
  useState,
} from "react";

import {
  useAuthUser,
  useIsAuthenticated,
  useSignIn,
  useSignOut,
} from "react-auth-kit";

import {
  useNavigate,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  toast,
} from "react-toastify";

import {
  platformLoginRequest,
} from "@/APIs/platform/auth";

import {
  clearAuthSession,
} from "@/APIs/Axios";

import {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

import nasaqLogo from "@/images/wadq-logo.png";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const PlatformLogin = () => {
  const navigate =
    useNavigate();

  const signIn =
    useSignIn();

  const signOut =
    useSignOut();

  const isAuthenticated =
    useIsAuthenticated();

  const getAuthUser =
    useAuthUser();

  const [loading, setLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const {
    register,
    handleSubmit,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const authState =
      getAuthUser();

    const role = normalizeRole(
      authState?.user?.role ||
        authState?.role ||
        localStorage.getItem(
          "role"
        )
    );

    if (role === "SUPER_ADMIN") {
      navigate(
        "/platform/dashboard",
        {
          replace: true,
        }
      );
    }
  }, [
    getAuthUser,
    isAuthenticated,
    navigate,
  ]);

  const onSubmit = async (
    data
  ) => {
    try {
      setLoading(true);

      const response =
        await platformLoginRequest(
          data.identifier,
          data.password
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            "بيانات تسجيل الدخول غير صحيحة"
        );

        return;
      }

      const token =
        response?.data
          ?.accessToken;

      const user =
        response?.data?.user;

      const role =
        normalizeRole(
          response?.data?.role ||
            user?.role
        );

      if (
        !token ||
        !user ||
        role !== "SUPER_ADMIN"
      ) {
        toast.error(
          "بيانات حساب مدير المنصة غير مكتملة"
        );

        return;
      }

      /*
       * حذف أي جلسة مدرسة قديمة قبل
       * حفظ جلسة مدير المنصة.
       */
      signOut();
      clearAuthSession();

      const signedIn =
        signIn({
          token,

          expiresIn:
            60 * 10,

          tokenType:
            "Bearer",

          authState: {
            user: {
              ...user,
              role:
                "SUPER_ADMIN",
              schoolId: null,
            },

            role:
              "SUPER_ADMIN",

            permissions: [],

            schoolId: null,
          },
        });

      if (!signedIn) {
        toast.error(
          "تعذر حفظ جلسة مدير المنصة"
        );

        return;
      }

      const storedUser = {
        ...user,
        role: "SUPER_ADMIN",
        schoolId: null,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(
          storedUser
        )
      );

      localStorage.setItem(
        "role",
        "SUPER_ADMIN"
      );

      localStorage.setItem(
        "permissions",
        JSON.stringify([])
      );

      localStorage.removeItem(
        "schoolId"
      );

      toast.success(
        "تم تسجيل الدخول إلى إدارة المنصة"
      );

      navigate(
        "/platform/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Platform login error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        minHeight: "100vh",

        display: "grid",
        placeItems: "center",

        p: {
          xs: 0,
          sm: 2.5,
          md: 4,
        },

        fontFamily:
          "Tajawal, Arial, sans-serif",

        background: `
          radial-gradient(
            circle at 8% 10%,
            rgba(36,74,112,0.16),
            transparent 30%
          ),
          radial-gradient(
            circle at 92% 90%,
            rgba(211,164,79,0.15),
            transparent 26%
          ),
          ${authColors.page}
        `,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1240,

          minHeight: {
            xs: "100vh",
            sm: 680,
          },

          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "1.05fr 0.95fr",
          },

          overflow: "hidden",

          borderRadius: {
            xs: 0,
            sm: "30px",
          },

          backgroundColor:
            authColors.cream,

          border: {
            xs: 0,
            sm:
              "1px solid rgba(255,255,255,0.85)",
          },

          boxShadow: {
            xs: "none",
            sm:
              "0 30px 80px rgba(36,74,112,0.18)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",

            display: {
              xs: "none",
              md: "flex",
            },

            flexDirection:
              "column",

            justifyContent:
              "space-between",

            p: {
              md: 5,
              lg: 7,
            },

            overflow: "hidden",

            color:
              authColors.white,

            background: `
              radial-gradient(
                circle at 15% 15%,
                rgba(242,215,146,0.24),
                transparent 30%
              ),
              radial-gradient(
                circle at 88% 86%,
                rgba(78,125,166,0.72),
                transparent 42%
              ),
              linear-gradient(
                145deg,
                ${authColors.navyDeep} 0%,
                ${authColors.navy} 52%,
                ${authColors.navyLight} 100%
              )
            `,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,

              opacity: 0.18,

              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",

              backgroundSize:
                "28px 28px",
            }}
          />

          <Box
            sx={{
              position:
                "relative",

              zIndex: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1.4}
              alignItems="center"
            >
              <Box
                sx={{
                  position:
                    "relative",

                  width: 74,
                  height: 70,

                  overflow:
                    "hidden",

                  borderRadius:
                    "18px",

                  backgroundColor:
                    authColors.white,

                  border:
                    "1px solid rgba(242,215,146,0.35)",

                  boxShadow:
                    "0 14px 34px rgba(10,32,53,0.28)",
                }}
              >
                <Box
                  component="img"
                  src={nasaqLogo}
                  alt="نَسّق"
                  sx={{
                    position:
                      "absolute",

                    top: -9,
                    left: "50%",

                    width: 138,
                    maxWidth:
                      "none",

                    transform:
                      "translateX(-50%)",

                    objectFit:
                      "contain",
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "25px",

                    fontWeight:
                      800,
                  }}
                >
                  نَسّق
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,

                    color:
                      "rgba(255,255,255,0.62)",

                    fontSize:
                      "11px",
                  }}
                >
                  لوحة إدارة المنصة
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              position:
                "relative",

              zIndex: 2,

              maxWidth: 510,
            }}
          >
            <Box
              sx={{
                width: 62,
                height: 62,

                mb: 2.5,

                display:
                  "grid",

                placeItems:
                  "center",

                borderRadius:
                  "18px",

                color:
                  authColors.goldLight,

                backgroundColor:
                  "rgba(211,164,79,0.16)",

                border:
                  "1px solid rgba(242,215,146,0.24)",

                "& svg": {
                  fontSize: 30,
                },
              }}
            >
              <AdminPanelSettingsRounded />
            </Box>

            <Typography
              component="h1"
              sx={{
                fontSize: {
                  md: "36px",
                  lg: "43px",
                },

                fontWeight:
                  800,

                lineHeight:
                  1.35,
              }}
            >
              إدارة المنصة
              <Box
                component="span"
                sx={{
                  display:
                    "block",

                  color:
                    authColors.goldLight,
                }}
              >
                من مكان واحد
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 2,

                maxWidth: 470,

                color:
                  "rgba(255,255,255,0.67)",

                fontSize:
                  "13px",

                lineHeight:
                  2,
              }}
            >
              تابع المدارس المسجلة،
              وإدارتها، ومراجعة حالة
              المنصة من لوحة مخصصة
              لمدير النظام.
            </Typography>

            <Stack
              spacing={1.3}
              sx={{
                mt: 3.5,
              }}
            >
              {[
                {
                  icon:
                    <ApartmentRounded />,

                  text:
                    "إدارة المدارس والحالات",
                },

                {
                  icon:
                    <SecurityRounded />,

                  text:
                    "دخول منفصل وآمن لمدير المنصة",
                },
              ].map(
                (item) => (
                  <Stack
                    key={
                      item.text
                    }
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,

                        display:
                          "grid",

                        placeItems:
                          "center",

                        borderRadius:
                          "10px",

                        color:
                          authColors.goldLight,

                        backgroundColor:
                          "rgba(255,255,255,0.08)",

                        "& svg": {
                          fontSize:
                            18,
                        },
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Typography
                      sx={{
                        color:
                          "rgba(255,255,255,0.82)",

                        fontSize:
                          "12px",

                        fontWeight:
                          600,
                      }}
                    >
                      {item.text}
                    </Typography>
                  </Stack>
                )
              )}
            </Stack>
          </Box>

          <Typography
            sx={{
              position:
                "relative",

              zIndex: 2,

              color:
                "rgba(255,255,255,0.48)",

              fontSize:
                "10px",
            }}
          >
            وصول مخصص لحساب
            SUPER_ADMIN فقط
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",

            px: {
              xs: 3,
              sm: 6,
              md: 7,
              lg: 9,
            },

            py: {
              xs: 5,
              md: 6,
            },

            display: "flex",
            flexDirection:
              "column",

            justifyContent:
              "center",

            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 460,

              mx: "auto",
            }}
          >
            <Box
              sx={{
                display: {
                  xs: "flex",
                  md: "none",
                },

                justifyContent:
                  "center",

                mb: 4,
              }}
            >
              <Box
                component="img"
                src={nasaqLogo}
                alt="نَسّق"
                sx={{
                  width: 150,
                }}
              />
            </Box>

            <Box
              sx={{
                width: 54,
                height: 54,

                mx: "auto",
                mb: 1.8,

                display:
                  "grid",

                placeItems:
                  "center",

                borderRadius:
                  "17px",

                color:
                  authColors.navy,

                backgroundColor:
                  "rgba(36,74,112,0.08)",

                border:
                  "1px solid rgba(36,74,112,0.1)",

                "& svg": {
                  fontSize: 27,
                },
              }}
            >
              <SecurityRounded />
            </Box>

            <Typography
              component="h1"
              textAlign="center"
              sx={{
                color:
                  authColors.navyDeep,

                fontSize: {
                  xs: "28px",
                  md: "33px",
                },

                fontWeight:
                  800,
              }}
            >
              دخول مدير المنصة
            </Typography>

            <Typography
              textAlign="center"
              sx={{
                mt: 1.2,
                mb: 4,

                color:
                  authColors.muted,

                fontSize:
                  "12px",

                lineHeight:
                  1.9,
              }}
            >
              استخدم بيانات حساب
              السوبر أدمن للوصول إلى
              إدارة منصة نَسّق.
            </Typography>

            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit(
                onSubmit
              )}
            >
              <Stack spacing={2}>
                <AuthField
                  label="البريد الإلكتروني أو اسم المستخدم"
                  type="text"
                  placeholder="أدخل بيانات الحساب"
                  autoComplete="username"
                  icon={
                    <EmailOutlined />
                  }
                  error={
                    errors.identifier
                      ?.message
                  }
                  registration={register(
                    "identifier",
                    {
                      required:
                        "البريد الإلكتروني أو اسم المستخدم مطلوب",

                      minLength: {
                        value: 3,

                        message:
                          "أدخل 3 أحرف على الأقل",
                      },
                    }
                  )}
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
                  icon={
                    <LockOutlined />
                  }
                  error={
                    errors.password
                      ?.message
                  }
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
                          (
                            previous
                          ) =>
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

              <Button
                fullWidth
                type="submit"
                disabled={loading}
                sx={{
                  minHeight: 58,

                  mt: 3.2,
                  px: 2,

                  borderRadius:
                    "15px",

                  color:
                    authColors.goldSoft,

                  background: `linear-gradient(
                    135deg,
                    ${authColors.navyLight} 0%,
                    ${authColors.navyDark} 100%
                  )`,

                  boxShadow:
                    "0 15px 32px rgba(7,22,41,0.24)",

                  textTransform:
                    "none",

                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease",

                  "&:hover": {
                    transform:
                      "translateY(-2px)",

                    boxShadow:
                      "0 19px 38px rgba(7,22,41,0.3)",

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

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "space-between",
                    }}
                  >
                    <Typography
                      sx={{
                        flex: 1,

                        fontSize:
                          "15px",

                        fontWeight:
                          800,
                      }}
                    >
                      تسجيل الدخول
                    </Typography>

                    <Box
                      sx={{
                        width: 38,
                        height: 38,

                        display:
                          "grid",

                        placeItems:
                          "center",

                        borderRadius:
                          "50%",

                        border: `1px solid ${authColors.gold}`,

                        color:
                          authColors.gold,

                        "& svg": {
                          fontSize:
                            20,
                        },
                      }}
                    >
                      <ArrowBackRounded />
                    </Box>
                  </Box>
                )}
              </Button>
            </Box>

            <Button
              type="button"
              onClick={() =>
                navigate("/")
              }
              sx={{
                display: "flex",

                mx: "auto",
                mt: 2,

                color:
                  authColors.muted,

                fontSize:
                  "11px",

                fontWeight:
                  700,

                textTransform:
                  "none",

                "&:hover": {
                  color:
                    authColors.navy,

                  backgroundColor:
                    "transparent",
                },
              }}
            >
              العودة إلى الموقع
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PlatformLogin;
