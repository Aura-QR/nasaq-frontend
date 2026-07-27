import {
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import {
  buildStudentPayload,
  toDateInputValue,
} from "@/utils/school/studentData";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^\+?[0-9\s()-]{7,20}$/;

const getInitialForm = (
  student
) => ({
  firstName:
    student?.firstName ||
    "",
  familyName:
    student?.familyName ||
    "",
  fatherName:
    student?.fatherName ||
    "",
  birthDate:
    toDateInputValue(
      student?.birthDate
    ),
  gender:
    student?.gender ||
    "",
  nationality:
    student?.nationality ||
    "",
  academicYear:
    student?.academicYear ||
    "",
  phoneNumber:
    student?.phoneNumber ||
    student?.phone ||
    "",
  email:
    student?.email ||
    "",
  address:
    student?.address ||
    "",
  previousSchool:
    student?.previousSchool ||
    "",
  registrationDate:
    toDateInputValue(
      student?.registrationDate ||
        new Date()
    ),
  notes:
    student?.notes ||
    "",
  classId:
    typeof student?.classId ===
    "string"
      ? student.classId
      : student?.classId?._id ||
        student?.class?._id ||
        "",
  installmentPlanId:
    typeof student?.installmentPlanId ===
    "string"
      ? student.installmentPlanId
      : student
          ?.installmentPlanId
          ?._id ||
        "",
  isActive:
    student?.isActive ??
    student?.active ??
    true,
  password: "",
});

const StudentFormDialog = ({
  open,
  student = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const editing =
    Boolean(student);

  const [form, setForm] =
    useState(
      getInitialForm(
        student
      )
    );

  const [errors, setErrors] =
    useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      getInitialForm(
        student
      )
    );

    setErrors({});
  }, [open, student]);

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

  const validate = () => {
    const nextErrors = {};

    if (
      form.firstName
        .trim().length < 2
    ) {
      nextErrors.firstName =
        "الاسم الأول مطلوب";
    }

    if (
      form.familyName
        .trim().length < 2
    ) {
      nextErrors.familyName =
        "اسم العائلة مطلوب";
    }

    if (!form.birthDate) {
      nextErrors.birthDate =
        "تاريخ الميلاد مطلوب";
    }

    if (!form.gender) {
      nextErrors.gender =
        "النوع مطلوب";
    }

    if (
      !form.academicYear.trim()
    ) {
      nextErrors.academicYear =
        "السنة الدراسية مطلوبة";
    }

    if (
      !EMAIL_PATTERN.test(
        form.email.trim()
      )
    ) {
      nextErrors.email =
        "أدخل بريدًا إلكترونيًا صحيحًا";
    }

    if (
      form.phoneNumber &&
      !PHONE_PATTERN.test(
        form.phoneNumber.trim()
      )
    ) {
      nextErrors.phoneNumber =
        "أدخل رقم هاتف صحيحًا";
    }

    if (
      !editing &&
      form.password.length < 8
    ) {
      nextErrors.password =
        "كلمة المرور يجب ألا تقل عن 8 أحرف";
    }

    if (
      editing &&
      form.password &&
      form.password.length < 8
    ) {
      nextErrors.password =
        "كلمة المرور يجب ألا تقل عن 8 أحرف";
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

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave?.(
      buildStudentPayload(
        form,
        {
          editing,
        }
      )
    );
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root":
      {
        minHeight: 50,
        borderRadius:
          "12px",
        backgroundColor:
          "#fffcf7",
        fontSize:
          "10px",
      },
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
      maxWidth="lg"
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
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        {editing
          ? "تعديل بيانات الطالب"
          : "إضافة طالب جديد"}

        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            minWidth: 38,
            width: 38,
            height: 38,
            borderRadius:
              "10px",
            color: "#7e8791",
          }}
        >
          <CloseRounded />
        </Button>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py:
            "22px !important",
        }}
      >
        <Stack spacing={2}>
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
              البيانات الشخصية
            </Typography>

            <Box
              sx={{
                mt: 1,
                display:
                  "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    md:
                      "repeat(3,minmax(0,1fr))",
                  },
                gap: 1.2,
              }}
            >
              <TextField
                label="الاسم الأول"
                value={
                  form.firstName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "firstName",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.firstName
                  )
                }
                helperText={
                  errors.firstName
                }
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="اسم الأب"
                value={
                  form.fatherName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "fatherName",
                    event.target.value
                  )
                }
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="اسم العائلة"
                value={
                  form.familyName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "familyName",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.familyName
                  )
                }
                helperText={
                  errors.familyName
                }
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="تاريخ الميلاد"
                type="date"
                value={
                  form.birthDate
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "birthDate",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.birthDate
                  )
                }
                helperText={
                  errors.birthDate
                }
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <FormControl
                error={
                  Boolean(
                    errors.gender
                  )
                }
              >
                <InputLabel>
                  النوع
                </InputLabel>

                <Select
                  label="النوع"
                  value={
                    form.gender
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "gender",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  sx={{
                    minHeight: 50,
                    borderRadius:
                      "12px",
                    backgroundColor:
                      "#fffcf7",
                    fontSize:
                      "10px",
                  }}
                >
                  <MenuItem value="male">
                    ذكر
                  </MenuItem>
                  <MenuItem value="female">
                    أنثى
                  </MenuItem>
                </Select>

                {errors.gender && (
                  <Typography
                    sx={{
                      mt: 0.4,
                      mx: 1.7,
                      color:
                        "#d32f2f",
                      fontSize:
                        "8px",
                    }}
                  >
                    {errors.gender}
                  </Typography>
                )}
              </FormControl>

              <TextField
                label="الجنسية"
                value={
                  form.nationality
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "nationality",
                    event.target.value
                  )
                }
                disabled={loading}
                sx={textFieldSx}
              />
            </Box>
          </Box>

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
              بيانات التواصل والدراسة
            </Typography>

            <Box
              sx={{
                mt: 1,
                display:
                  "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    md:
                      "repeat(3,minmax(0,1fr))",
                  },
                gap: 1.2,
              }}
            >
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
                inputProps={{
                  dir: "ltr",
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="رقم الهاتف"
                value={
                  form.phoneNumber
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "phoneNumber",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.phoneNumber
                  )
                }
                helperText={
                  errors.phoneNumber
                }
                inputProps={{
                  dir: "ltr",
                  inputMode:
                    "tel",
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="السنة الدراسية"
                value={
                  form.academicYear
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "academicYear",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.academicYear
                  )
                }
                helperText={
                  errors.academicYear
                }
                placeholder="2026-2027"
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="الفصل (ID)"
                value={
                  form.classId
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "classId",
                    event.target.value
                  )
                }
                helperText="اختياري لحين ربط صفحة الفصول"
                inputProps={{
                  dir: "ltr",
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="خطة التقسيط (ID)"
                value={
                  form.installmentPlanId
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "installmentPlanId",
                    event.target.value
                  )
                }
                helperText="اختياري لحين ربط الخطط المالية"
                inputProps={{
                  dir: "ltr",
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="تاريخ التسجيل"
                type="date"
                value={
                  form.registrationDate
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "registrationDate",
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="المدرسة السابقة"
                value={
                  form.previousSchool
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "previousSchool",
                    event.target.value
                  )
                }
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label="العنوان"
                value={
                  form.address
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
                disabled={loading}
                sx={textFieldSx}
              />

              <TextField
                label={
                  editing
                    ? "كلمة مرور جديدة (اختياري)"
                    : "كلمة المرور"
                }
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
                  errors.password ||
                  (editing
                    ? "اتركها فارغة بدون تغيير"
                    : "")
                }
                disabled={loading}
                sx={textFieldSx}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display:
                "grid",
              gridTemplateColumns:
                {
                  xs: "1fr",
                  md:
                    "minmax(0,2fr) minmax(240px,1fr)",
                },
              gap: 1.2,
            }}
          >
            <TextField
              label="ملاحظات"
              value={
                form.notes
              }
              onChange={(
                event
              ) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              multiline
              minRows={3}
              disabled={loading}
              sx={{
                ...textFieldSx,
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "12px",
                    backgroundColor:
                      "#fffcf7",
                    fontSize:
                      "10px",
                  },
              }}
            />

            <Box
              sx={{
                p: 1.5,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: 1,
                borderRadius:
                  "14px",
                backgroundColor:
                  "#fffcf7",
                border:
                  "1px solid #ded8cd",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      "#122f4d",
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
                  }}
                >
                  حالة الطالب
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    color:
                      "#7e8791",
                    fontSize:
                      "8px",
                  }}
                >
                  {form.isActive
                    ? "الحساب نشط"
                    : "الحساب موقوف"}
                </Typography>
              </Box>

              <Switch
                checked={
                  form.isActive
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "isActive",
                    event.target.checked
                  )
                }
                disabled={loading}
              />
            </Box>
          </Box>
        </Stack>
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
            handleSave
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
              <SaveRounded />
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
          {editing
            ? "حفظ التعديلات"
            : "إضافة الطالب"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentFormDialog;
