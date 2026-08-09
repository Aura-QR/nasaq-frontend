import {
  AdminPanelSettingsRounded,
  ArrowBackRounded,
  CheckCircleOutlineRounded,
  LockOutlined,
  ManageAccountsRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormHelperText,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  useState,
} from "react";

import {
  Controller,
  useForm,
} from "react-hook-form";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";

import {
  createManager,
  MANAGER_DEFAULT_PERMISSIONS,
} from "@/APIs/school/managers";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USERNAME_PATTERN =
  /^[a-zA-Z0-9._-]{3,30}$/;

const getResponseMessage = (
  response,
  fallback
) => {
  if (
    typeof response === "string"
  ) {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

const isSuccessfulResponse = (
  response
) =>
  Boolean(response) &&
  typeof response !== "string" &&
  response?.status !== false;

const fieldLabelSx = {
  display: "block",
  mb: 0.7,
  color: "#315E88",
  fontSize: "12px",
  fontWeight: 800,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 50,
    borderRadius: "12px",
    bgcolor: "#FFFFFF",

    "& fieldset": {
      borderColor: "#CDD4DB",
    },

    "&:hover fieldset": {
      borderColor: "#315E88",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#24B998",
      borderWidth: "1.5px",
    },
  },

  "& .MuiOutlinedInput-input": {
    py: 1.3,
    textAlign: "right",
    fontSize: "14px",
  },

  "& .MuiFormHelperText-root": {
    mx: 0.5,
    mt: 0.6,
    textAlign: "right",
    fontSize: "11px",
  },
};

const SchoolManagerAdd = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);



  const {
    control,
    register,
    handleSubmit,
    watch,

    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "MANAGER",
    },
  });

  const selectedRole =
    watch("role");

  const password =
    watch("password");



  const onSubmit = async (
    values
  ) => {
    const role =
      String(values.role)
        .trim()
        .toUpperCase();

    const permissions =
      role === "SUPERVISOR"
        ? ["*"]
        : MANAGER_DEFAULT_PERMISSIONS;

    const payload = {
      username:
        values.username.trim(),

      email:
        values.email
          .trim()
          .toLowerCase(),

      password:
        values.password,

      role,

      permissions,
    };

    setLoading(true);

    const response =
      await createManager(
        payload
      );

    if (
      !isSuccessfulResponse(
        response
      )
    ) {
      toast.error(
        getResponseMessage(
          response,
          "تعذر إنشاء الحساب الإداري"
        )
      );

      setLoading(false);
      return;
    }

    toast.success(
      role === "SUPERVISOR"
        ? "تم إنشاء حساب المشرف بنجاح"
        : "تم إنشاء حساب المدير بنجاح"
    );

    navigate(
      "/school/managers",
      { replace: true }
    );
  };

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(
          onSubmit
        )}
        noValidate
        dir="rtl"
        sx={{
          pb: 4,
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 980,
            mx: "auto",
          }}
        >
          <Button
            type="button"
            startIcon={
              <ArrowBackRounded />
            }
            onClick={() =>
              navigate(
                "/school/managers"
              )
            }
            sx={{
              mb: 1.5,
              px: 0,
              minWidth: 0,
              color: "#315E88",
              fontWeight: 800,

              "&:hover": {
                bgcolor:
                  "transparent",
                color: "#122F4D",
              },
            }}
          >
            العودة إلى الحسابات الإدارية
          </Button>

          <Paper
            elevation={0}
            sx={{
              overflow: "hidden",
              borderRadius: "18px",
              border:
                "1px solid #DED8CD",
              bgcolor: "#FFFFFF",
              boxShadow:
                "0 12px 34px rgba(18, 47, 77, 0.06)",
            }}
          >
            {/* اختيار الدور في أول الكارد */}
            <Box
              sx={{
                px: {
                  xs: 2,
                  md: 2.7,
                },
                py: 1.5,
                display: "flex",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
                gap: 1.5,
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                bgcolor: "#FFFCF7",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#193754",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  نوع الحساب
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: "#7E8791",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  اختر الدور قبل إدخال بيانات الحساب
                </Typography>
              </Box>

              <Controller
                name="role"
                control={control}
                rules={{
                  required:
                    "اختر نوع الحساب الإداري",
                }}
                render={({ field }) => (
                  <Box
                    sx={{
                      width: {
                        xs: "100%",
                        sm: 286,
                      },
                    }}
                  >
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      size="small"
                      value={field.value}
                      onChange={(
                        _event,
                        nextRole
                      ) => {
                        if (nextRole) {
                          field.onChange(
                            nextRole
                          );
                        }
                      }}
                      aria-label="نوع الحساب الإداري"
                      sx={{
                        direction: "rtl",
                        p: 0.35,
                        borderRadius:
                          "12px",
                        bgcolor: "#F0EDE6",
                        border:
                          "1px solid #E3DDD3",

                        "& .MuiToggleButtonGroup-grouped":
                          {
                            minHeight: 38,
                            gap: 0.7,
                            border:
                              "0 !important",
                            borderRadius:
                              "9px !important",
                            color:
                              "#5D6A76",
                            fontSize:
                              "12px",
                            fontWeight:
                              900,
                            textTransform:
                              "none",
                          },

                        "& .MuiToggleButton-root.Mui-selected":
                          {
                            color:
                              "#FFFFFF",
                            bgcolor:
                              "#244A70",
                            boxShadow:
                              "0 4px 12px rgba(36, 74, 112, 0.16)",
                          },

                        "& .MuiToggleButton-root.Mui-selected:hover":
                          {
                            bgcolor:
                              "#1B3D61",
                          },
                      }}
                    >
                      <ToggleButton
                        value="SUPERVISOR"
                        aria-label="مشرف"
                      >
                        <SupervisorAccountRounded
                          sx={{
                            fontSize: 18,
                          }}
                        />
                        مشرف
                      </ToggleButton>

                      <ToggleButton
                        value="MANAGER"
                        aria-label="مدير"
                      >
                        <AdminPanelSettingsRounded
                          sx={{
                            fontSize: 18,
                          }}
                        />
                        مدير
                      </ToggleButton>
                    </ToggleButtonGroup>

                    {errors.role && (
                      <FormHelperText
                        error
                        sx={{
                          mt: 0.5,
                          mx: 0.7,
                        }}
                      >
                        {
                          errors.role
                            .message
                        }
                      </FormHelperText>
                    )}
                  </Box>
                )}
              />
            </Box>

            <Divider />

            <Box
              sx={{
                p: {
                  xs: 2,
                  md: 2.7,
                },
              }}
            >
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                sx={{ mb: 2.3 }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius: "12px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#EEF3F7",
                    color: "#244A70",
                  }}
                >
                  <ManageAccountsRounded
                    sx={{
                      fontSize: 23,
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#122F4D",
                      fontSize: {
                        xs: "18px",
                        md: "20px",
                      },
                      fontWeight: 900,
                    }}
                  >
                    إضافة حساب إداري
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.15,
                      color: "#7E8791",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    أنشئ بيانات دخول جديدة لحساب{" "}
                    {selectedRole ===
                    "SUPERVISOR"
                      ? "مشرف"
                      : "مدير"}
                    .
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  mb: 2.2,
                  px: 1.5,
                  py: 1.1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.9,
                  borderRadius: "11px",
                  bgcolor:
                    selectedRole ===
                    "SUPERVISOR"
                      ? "#FFFAED"
                      : "#F5F8FA",
                  border:
                    selectedRole ===
                    "SUPERVISOR"
                      ? "1px solid #EBD9AA"
                      : "1px solid #DDE4EA",
                }}
              >
                <CheckCircleOutlineRounded
                  sx={{
                    flexShrink: 0,
                    fontSize: 19,
                    color:
                      selectedRole ===
                      "SUPERVISOR"
                        ? "#B78430"
                        : "#315E88",
                  }}
                />

                <Typography
                  sx={{
                    color: "#5D6A76",
                    fontSize: "11px",
                    fontWeight: 700,
                    lineHeight: 1.7,
                  }}
                >
                  {selectedRole ===
                  "SUPERVISOR"
                    ? "سيُنشأ الحساب بصلاحيات تشغيلية كاملة، دون صلاحية رؤية أو إدارة الحسابات الإدارية."
                    : `سيتم تطبيق ${MANAGER_DEFAULT_PERMISSIONS.length} صلاحية إدارية وأكاديمية لدور المدير، دون المالية والمصروفات.`}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr",
                  },
                  gap: 1.7,
                }}
              >
                <Box>
                  <Typography
                    component="label"
                    htmlFor="manager-username"
                    sx={fieldLabelSx}
                  >
                    اسم المستخدم
                  </Typography>

                  <TextField
                    id="manager-username"
                    fullWidth
                    placeholder="مثال: arwaa_admin"
                    autoComplete="username"
                    size="small"
                    error={Boolean(
                      errors.username
                    )}
                    helperText={
                      errors.username
                        ?.message
                    }
                    sx={fieldSx}
                    inputProps={{
                      dir: "ltr",
                      style: {
                        textAlign:
                          "right",
                      },
                    }}
                    {...register(
                      "username",
                      {
                        required:
                          "اسم المستخدم مطلوب",

                        pattern: {
                          value:
                            USERNAME_PATTERN,

                          message:
                            "استخدم من 4 إلى 20 حرفًا إنجليزيًا أو رقمًا",
                        },
                      }
                    )}
                  />
                </Box>

                <Box>
                  <Typography
                    component="label"
                    htmlFor="manager-email"
                    sx={fieldLabelSx}
                  >
                    البريد الإلكتروني
                  </Typography>

                  <TextField
                    id="manager-email"
                    fullWidth
                    placeholder="name@school.com"
                    type="email"
                    autoComplete="email"
                    size="small"
                    error={Boolean(
                      errors.email
                    )}
                    helperText={
                      errors.email
                        ?.message
                    }
                    sx={fieldSx}
                    inputProps={{
                      dir: "ltr",
                      style: {
                        textAlign:
                          "right",
                      },
                    }}
                    {...register(
                      "email",
                      {
                        required:
                          "البريد الإلكتروني مطلوب",

                        pattern: {
                          value:
                            EMAIL_PATTERN,

                          message:
                            "أدخل بريدًا إلكترونيًا صحيحًا",
                        },
                      }
                    )}
                  />
                </Box>

                <Box>
                  <Typography
                    component="label"
                    htmlFor="manager-password"
                    sx={fieldLabelSx}
                  >
                    كلمة المرور
                  </Typography>

                  <TextField
                    id="manager-password"
                    fullWidth
                    placeholder="6 أحرف على الأقل"
                    type="password"
                    autoComplete="new-password"
                    size="small"
                    error={Boolean(
                      errors.password
                    )}
                    helperText={
                      errors.password
                        ?.message
                    }
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <LockOutlined
                          sx={{
                            ml: 1,
                            fontSize: 20,
                            color:
                              "#315E88",
                          }}
                        />
                      ),
                    }}
                    {...register(
                      "password",
                      {
                        required:
                          "كلمة المرور مطلوبة",

                        minLength: {
                          value: 6,

                          message:
                            "كلمة المرور يجب ألا تقل عن 6 أحرف",
                        },

                        maxLength: {
                          value: 100,

                          message:
                            "كلمة المرور يجب ألا تزيد عن 100 حرف",
                        },
                      }
                    )}
                  />
                </Box>

                <Box>
                  <Typography
                    component="label"
                    htmlFor="manager-confirm-password"
                    sx={fieldLabelSx}
                  >
                    تأكيد كلمة المرور
                  </Typography>

                  <TextField
                    id="manager-confirm-password"
                    fullWidth
                    placeholder="أعد كتابة كلمة المرور"
                    type="password"
                    autoComplete="new-password"
                    size="small"
                    error={Boolean(
                      errors
                        .confirmPassword
                    )}
                    helperText={
                      errors
                        .confirmPassword
                        ?.message
                    }
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <LockOutlined
                          sx={{
                            ml: 1,
                            fontSize: 20,
                            color:
                              "#315E88",
                          }}
                        />
                      ),
                    }}
                    {...register(
                      "confirmPassword",
                      {
                        required:
                          "تأكيد كلمة المرور مطلوب",

                        validate: (
                          value
                        ) =>
                          value ===
                            password ||
                          "كلمتا المرور غير متطابقتين",
                      }
                    )}
                  />
                </Box>
              </Box>
              <Divider
                sx={{
                  my: 2.5,
                  borderColor:
                    "#EEE8DE",
                }}
              />

              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                spacing={1.2}
                justifyContent="flex-end"
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() =>
                    navigate(
                      "/school/managers"
                    )
                  }
                  disabled={loading}
                  sx={{
                    minWidth: 112,
                    minHeight: 42,
                    borderRadius: "11px",
                    borderColor:
                      "#C9D3DC",
                    color: "#315E88",
                    fontWeight: 800,

                    "&:hover": {
                      borderColor:
                        "#315E88",
                      bgcolor:
                        "#F5F8FA",
                    },
                  }}
                >
                  إلغاء
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    minWidth: 164,
                    minHeight: 42,
                    borderRadius: "11px",
                    bgcolor: "#244A70",
                    fontWeight: 900,
                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#122F4D",
                      boxShadow: "none",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress
                      size={21}
                      sx={{
                        color: "#FFFFFF",
                      }}
                    />
                  ) : selectedRole ===
                    "SUPERVISOR" ? (
                    "إنشاء حساب مشرف"
                  ) : (
                    "إنشاء حساب مدير"
                  )}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default SchoolManagerAdd;
