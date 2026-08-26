import {
  CloseRounded,
  PersonAddAltRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordPattern =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const getPermissionLabel = (
  permission
) => {
  const labels = {
    students: "الطلاب",
    teachers: "المعلمون",
    classes: "الفصول",
    subjects: "المواد",
    attendance: "الحضور",
    lectures: "الحصص",
    exams: "الاختبارات",
    gradesCriteria:
      "معايير الدرجات",
    projects: "المشاريع",
    preparation: "التحضير",
    library: "المكتبة",
    financial: "المالية",
    expenses: "المصروفات",
    managers: "المديرون",
    analytics: "التقارير",
    settings: "الإعدادات",
  };

  const actions = {
    read: "عرض",
    create: "إضافة",
    update: "تعديل",
    delete: "حذف",
    manage: "إدارة",
  };

  const parts =
    String(
      permission || ""
    ).split(".");

  return `${
    labels[parts[1]] ||
    parts[1] ||
    permission
  }${
    parts[2]
      ? ` — ${
          actions[
            parts[2]
          ] || parts[2]
        }`
      : ""
  }`;
};

const ManagerFormDialog = ({
  open,
  loading = false,
  currentRole,
  permissions = [],
  permissionsLoading = false,
  onClose,
  onSubmit,
}) => {
  const [
    form,
    setForm,
  ] = useState({
    username: "",
    email: "",
    password: "",
    role:
      ROLES.MANAGER,
    permissions: [],
  });

  const [errors, setErrors] =
    useState({});

  const normalizedCurrentRole =
    normalizeRole(
      currentRole
    );

  const canCreateSupervisor =
    normalizedCurrentRole ===
    ROLES.OWNER;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      username: "",
      email: "",
      password: "",
      role:
        ROLES.MANAGER,
      permissions: [],
    });

    setErrors({});
  }, [open]);

  const sortedPermissions =
    useMemo(
      () =>
        [...permissions].sort(
          (first, second) =>
            String(first).localeCompare(
              String(second)
            )
        ),
      [permissions]
    );

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    if (errors[field]) {
      setErrors(
        (previous) => ({
          ...previous,
          [field]: "",
        })
      );
    }
  };

  const togglePermission = (
    permission
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        permissions:
          previous.permissions.includes(
            permission
          )
            ? previous.permissions.filter(
                (item) =>
                  item !==
                  permission
              )
            : [
                ...previous.permissions,
                permission,
              ],
      })
    );
  };

  const validate = () => {
    const nextErrors = {};

    if (
      form.username
        .trim().length < 3
    ) {
      nextErrors.username =
        "اسم المستخدم يجب ألا يقل عن 3 أحرف";
    }

    if (
      !emailPattern.test(
        form.email.trim()
      )
    ) {
      nextErrors.email =
        "أدخل بريدًا إلكترونيًا صحيحًا";
    }

    if (
      !passwordPattern.test(
        form.password
      )
    ) {
      nextErrors.password =
        "كلمة المرور 8 أحرف على الأقل وتحتوي على حرف ورقم";
    }

    setErrors(
      nextErrors
    );

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };

  const handleSubmit =
    () => {
      if (!validate()) {
        return;
      }

      onSubmit?.({
        username:
          form.username.trim(),

        email:
          form.email.trim(),

        password:
          form.password,

        role:
          form.role,

        permissions:
          form.role ===
          ROLES.SUPERVISOR
            ? ["*"]
            : form.permissions,
      });
    };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius:
            "20px",

          fontFamily:
            "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.7,

          display: "flex",
          alignItems:
            "center",

          justifyContent:
            "space-between",

          color: "#122f4d",

          borderBottom:
            "1px solid #ded8cd",

          fontSize:
            "16px",

          fontWeight:
            800,
        }}
      >
        إضافة حساب إداري

        <IconButton
          onClick={onClose}
          disabled={loading}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py:
            "22px !important",
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns:
              {
                xs: "1fr",
                md:
                  "repeat(2,minmax(0,1fr))",
              },

            gap: 1.5,
          }}
        >
          <TextField
            label="اسم المستخدم"
            value={
              form.username
            }
            onChange={(
              event
            ) =>
              updateField(
                "username",
                event.target.value
              )
            }
            error={
              Boolean(
                errors.username
              )
            }
            helperText={
              errors.username
            }
            disabled={loading}
          />

          <TextField
            label="البريد الإلكتروني"
            value={
              form.email
            }
            onChange={(
              event
            ) =>
              updateField(
                "email",
                event.target.value
              )
            }
            error={
              Boolean(
                errors.email
              )
            }
            helperText={
              errors.email
            }
            disabled={loading}
            inputProps={{
              dir: "ltr",
            }}
          />

          <TextField
            label="كلمة المرور"
            type="password"
            value={
              form.password
            }
            onChange={(
              event
            ) =>
              updateField(
                "password",
                event.target.value
              )
            }
            error={
              Boolean(
                errors.password
              )
            }
            helperText={
              errors.password
            }
            disabled={loading}
          />

          <FormControl>
            <InputLabel>
              الدور
            </InputLabel>

            <Select
              label="الدور"
              value={
                form.role
              }
              onChange={(
                event
              ) =>
                updateField(
                  "role",
                  event.target.value
                )
              }
              disabled={loading}
            >
              <MenuItem
                value={
                  ROLES.MANAGER
                }
              >
                مساعد إداري
              </MenuItem>

              {canCreateSupervisor && (
                <MenuItem
                  value={
                    ROLES.SUPERVISOR
                  }
                >
                  مدير المدرسة
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            mt: 2,

            p: 1.6,

            borderRadius:
              "16px",

            backgroundColor:
              "#fffcf7",

            border:
              "1px solid #ded8cd",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "#122f4d",

                  fontSize:
                    "12px",

                  fontWeight:
                    800,
                }}
              >
                الصلاحيات
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,

                  color:
                    "#7e8791",

                  fontSize:
                    "8.5px",
                }}
              >
                {form.role ===
                ROLES.SUPERVISOR
                  ? "يحصل على صلاحيات كاملة داخل المدرسة."
                  : "صلاحيات المساعد الإداري معرّفة على مستوى المدرسة من صفحة الصلاحيات."}
              </Typography>
            </Box>

            <Chip
              label={
                form.role ===
                ROLES.SUPERVISOR
                  ? "صلاحيات كاملة"
                  : `${form.permissions.length} صلاحية`
              }
              size="small"
              sx={{
                color:
                  "#244a70",

                backgroundColor:
                  "#fbf0d8",

                fontSize:
                  "8px",

                fontWeight:
                  800,
              }}
            />
          </Stack>

          {form.role ===
          ROLES.MANAGER ? (
            permissionsLoading ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  mt: 2,
                }}
              >
                <CircularProgress
                  size={18}
                />

                <Typography
                  sx={{
                    color:
                      "#7e8791",

                    fontSize:
                      "9px",
                  }}
                >
                  جاري تحميل الصلاحيات...
                </Typography>
              </Stack>
            ) : sortedPermissions.length ? (
              <Box
                sx={{
                  mt: 1.4,

                  display:
                    "grid",

                  gridTemplateColumns:
                    {
                      xs: "1fr",
                      sm:
                        "repeat(2,minmax(0,1fr))",
                      md:
                        "repeat(3,minmax(0,1fr))",
                    },

                  gap: 0.7,
                }}
              >
                {sortedPermissions.map(
                  (
                    permission
                  ) => (
                    <FormControlLabel
                      key={
                        permission
                      }
                      control={
                        <Checkbox
                          checked={form.permissions.includes(
                            permission
                          )}
                          onChange={() =>
                            togglePermission(
                              permission
                            )
                          }
                          size="small"
                        />
                      }
                      label={getPermissionLabel(
                        permission
                      )}
                      sx={{
                        m: 0,
                        p: 0.7,

                        borderRadius:
                          "10px",

                        backgroundColor:
                          "#ffffff",

                        border:
                          "1px solid rgba(36,74,112,0.08)",

                        "& .MuiFormControlLabel-label":
                          {
                            color:
                              "#193754",

                            fontSize:
                              "8.5px",

                            fontWeight:
                              700,
                          },
                      }}
                    />
                  )
                )}
              </Box>
            ) : (
              <Typography
                sx={{
                  mt: 1.5,

                  color:
                    "#7e8791",

                  fontSize:
                    "9px",
                }}
              >
                لم يُرجع الخادم قائمة صلاحيات بعد. يمكن إنشاء المدير بدون صلاحيات ثم تعديلها لاحقًا.
              </Typography>
            )
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,

          gap: 0.8,

          borderTop:
            "1px solid #ded8cd",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color:
              "#7e8791",

            backgroundColor:
              "rgba(126,135,145,0.08)",
          }}
        >
          إلغاء
        </Button>

        <Button
          onClick={
            handleSubmit
          }
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress
                size={16}
                sx={{
                  color:
                    "inherit",
                }}
              />
            ) : (
              <PersonAddAltRounded />
            )
          }
          sx={{
            color:
              "#ffffff",

            backgroundColor:
              "#244a70",

            "&:hover": {
              backgroundColor:
                "#1b3d61",
            },
          }}
        >
          إنشاء الحساب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManagerFormDialog;
