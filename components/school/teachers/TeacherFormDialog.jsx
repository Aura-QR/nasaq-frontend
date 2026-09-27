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
  buildTeacherPayload,
  getTeacherSubjectOfferingIds,
  toTeacherDateInput,
} from "@/utils/school/teacherData";

import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^\+?[0-9\s()-]{7,20}$/;

const getInitialForm = (
  teacher
) => ({
  name:
    teacher?.name ||
    teacher?.fullName ||
    "",
  email:
    teacher?.email ||
    "",
  phoneNumber:
    teacher?.phoneNumber ||
    teacher?.phone ||
    "",
  subjectOfferingIds:
    getTeacherSubjectOfferingIds(
      teacher
    ),
  qualification:
    teacher?.qualification ||
    "",
  experience:
    teacher?.experience ||
    "",
  specialization:
    teacher?.specialization ||
    "",
  hireDate:
    toTeacherDateInput(
      teacher?.hireDate ||
        new Date()
    ),
  address:
    teacher?.address ||
    "",
  isActive:
    teacher?.isActive ??
    teacher?.active ??
    true,
  password: "",
});

const TeacherFormDialog = ({
  open,
  teacher = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const editing =
    Boolean(teacher);

  const [form, setForm] =
    useState(
      getInitialForm(
        teacher
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
        teacher
      )
    );

    setErrors({});
  }, [open, teacher]);

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
      form.name
        .trim().length < 3
    ) {
      nextErrors.name =
        "اسم المعلم مطلوب";
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

    if (!form.hireDate) {
      nextErrors.hireDate =
        "تاريخ التعيين مطلوب";
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
      buildTeacherPayload(
        form,
        {
          editing,
        }
      )
    );
  };

  const fieldSx = {
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
          ? "تعديل بيانات المعلم"
          : "إضافة معلم جديد"}

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
              البيانات الأساسية
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
                label="اسم المعلم"
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.name
                  )
                }
                helperText={
                  errors.name
                }
                disabled={loading}
                sx={fieldSx}
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
                inputProps={{
                  dir: "ltr",
                }}
                disabled={loading}
                sx={fieldSx}
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
                sx={fieldSx}
              />

              <TextField
                label="المؤهل"
                value={
                  form.qualification
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "qualification",
                    event.target.value
                  )
                }
                placeholder="بكالوريوس تربية"
                disabled={loading}
                sx={fieldSx}
              />

              <TextField
                label="الخبرة"
                value={
                  form.experience
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "experience",
                    event.target.value
                  )
                }
                placeholder="5 سنوات"
                disabled={loading}
                sx={fieldSx}
              />

              <TextField
                label="التخصص"
                value={
                  form.specialization
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "specialization",
                    event.target.value
                  )
                }
                placeholder="تعليم ثانوي"
                disabled={loading}
                sx={fieldSx}
              />

              <TextField
                label="تاريخ التعيين"
                type="date"
                value={
                  form.hireDate
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "hireDate",
                    event.target.value
                  )
                }
                error={
                  Boolean(
                    errors.hireDate
                  )
                }
                helperText={
                  errors.hireDate
                }
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
                sx={fieldSx}
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
                sx={fieldSx}
              />

              <Box
                sx={{
                  p: 1.4,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 1,
                  borderRadius:
                    "13px",
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
                    حالة المعلم
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
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
              },
              gap: 1.2,
            }}
          >
            <TextField
              label="العنوان"
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              multiline
              minRows={2}
              disabled={loading}
              sx={fieldSx}
            />

            <Box
              sx={{
                p: 1.5,
                borderRadius: "14px",
                backgroundColor: "#fffcf7",
                border: "1px solid #ded8cd",
              }}
            >
              <Typography
                sx={{
                  mb: 1,
                  color: "#122f4d",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                المواد الدراسية المسندة للمعلم
              </Typography>

              <SubjectCheckBoxes
                selectedSubjects={
                  form.subjectOfferingIds || []
                }
                setSelectedSubjects={(value) =>
                  updateField(
                    "subjectOfferingIds",
                    value
                  )
                }
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
            : "إضافة المعلم"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherFormDialog;
