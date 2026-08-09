import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import {
  PostAddRounded,
} from "@mui/icons-material";

import {
  useMemo,
  useState,
} from "react";

import {
  Controller,
  useForm,
} from "react-hook-form";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { addAdditionalFee } from "@/APIs/financials/additionalFees";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";

import {
  FormActions,
  formFieldsSx,
  pageCardSx,
} from "@/components/financial/FinancialShell";

import { useStudents } from "@/utils/hooks/apis/useStudents";
import { useClasses } from "@/utils/hooks/apis/useClasses";
import usePermissions from "@/utils/hooks/usePermissions";
import Years from "@/utils/constants/Years";

const TARGET_TYPES = [
  {
    value: "all",
    label: "كل الطلاب",
  },
  {
    value: "student",
    label: "طالب محدد",
  },
  {
    value: "class",
    label: "فصل محدد",
  },
  {
    value: "academicYear",
    label: "سنة دراسية",
  },
];

const getStudentName = (student) =>
  [
    student?.firstName,
    student?.fatherName,
    student?.familyName,
  ]
    .filter(Boolean)
    .join(" ") ||
  student?.name ||
  student?.email ||
  "طالب";

const getClassName = (item) => {
  const academicYear =
    item?.academicYear?.name ||
    item?.academicYear?.title ||
    item?.academicYear ||
    item?.gradeLevel?.name ||
    item?.gradeLevel?.title ||
    "";

  const room =
    item?.roomNumber ||
    item?.name ||
    item?.title ||
    "";

  return (
    [academicYear, room]
      .filter(Boolean)
      .join(" - ") ||
    "فصل"
  );
};

const AdditionalFeesAddPage = () => {
  const navigate = useNavigate();

  const permissions =
    usePermissions("financial");

  const [loading, setLoading] =
    useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      targetType: "all",
      targetId: "",
      targetAcademicYear: "",
    },
  });

  const targetType =
    watch("targetType");

  /*
   * نستخدم نفس hooks الموجودة بالفعل في المشروع.
   * limit مرتفع فقط لتوفير خيارات الاختيار داخل النموذج.
   */
  const {
    students = [],
  } = useStudents({
    page: 1,
    limit: 200,
  });

  const {
    classes = [],
  } = useClasses({
    page: 1,
    limit: 200,
  });

  const studentOptions =
    useMemo(
      () =>
        students
          .map((student) => ({
            value:
              student?._id ||
              student?.id,
            label:
              getStudentName(
                student
              ),
          }))
          .filter(
            (item) =>
              item.value &&
              item.label
          ),
      [students]
    );

  const classOptions =
    useMemo(
      () =>
        classes
          .map((item) => ({
            value:
              item?._id ||
              item?.id,
            label:
              getClassName(
                item
              ),
          }))
          .filter(
            (item) =>
              item.value &&
              item.label
          ),
      [classes]
    );

  const onSubmit = async (
    formData
  ) => {
    if (!permissions?.add) {
      toast.error(
        "ليس لديك صلاحية إضافة الرسوم"
      );
      return;
    }

    const amount = Number(
      formData.amount
    );

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      toast.error(
        "أدخل مبلغًا صحيحًا"
      );
      return;
    }

    if (
      ["student", "class"].includes(
        formData.targetType
      ) &&
      !formData.targetId
    ) {
      toast.error(
        formData.targetType ===
          "student"
          ? "اختر الطالب"
          : "اختر الفصل"
      );
      return;
    }

    if (
      formData.targetType ===
        "academicYear" &&
      !formData.targetAcademicYear
    ) {
      toast.error(
        "اختر السنة الدراسية"
      );
      return;
    }

    const payload = {
      name:
        formData.name?.trim(),
      description:
        formData.description?.trim() ||
        undefined,
      amount,
      targetType:
        formData.targetType,
    };

    if (
      ["student", "class"].includes(
        formData.targetType
      )
    ) {
      payload.targetId =
        formData.targetId;
    }

    if (
      formData.targetType ===
      "academicYear"
    ) {
      payload.targetAcademicYear =
        formData.targetAcademicYear;
    }

    setLoading(true);

    const response =
      await addAdditionalFee(
        payload
      );

    if (response?.status) {
      toast.success(
        response?.message ||
          "تمت إضافة الرسوم بنجاح"
      );

      navigate(
        "/financial/additional-fees"
      );

      setLoading(false);
      return;
    }

    toast.error(
      response?.message ||
        response ||
        "حدث خطأ أثناء إضافة الرسوم"
    );

    setLoading(false);
  };

  return (
    <Container>
      <Box
        component="form"
        onSubmit={handleSubmit(
          onSubmit
        )}
        dir="rtl"
        sx={{ pb: 3 }}
      >
        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            p: 1.4,
          }}
        >
          <Back title="إضافة رسوم" />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            ...formFieldsSx,
            mt: 1.25,
            p: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mb: 1.5,
              pb: 1.25,
              borderBottom:
                "1px solid rgba(36,74,112,.07)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems:
                  "center",
                bgcolor:
                  "var(--color-gold-soft)",
                color:
                  "var(--color-gold-dark)",
                borderRadius:
                  "12px",
              }}
            >
              <PostAddRounded />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 800,
                  color:
                    "var(--color-navy-deep)",
                }}
              >
                تفاصيل الرسوم
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,
                  color:
                    "var(--color-muted)",
                }}
              >
                حدد قيمة الرسم ومن
                سيتم تطبيقه عليه.
              </Typography>
            </Box>
          </Stack>

          <Grid
            container
            spacing={1.5}
          >
            <Grid
              item
              xs={12}
              sm={6}
            >
              <Input
                register={
                  register
                }
                registerName="name"
                error={
                  errors.name
                    ?.message
                }
                label="اسم الرسوم"
                required
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >
              <Input
                register={
                  register
                }
                registerName="amount"
                error={
                  errors.amount
                    ?.message
                }
                label="المبلغ"
                required
                type="number"
                valueAsNumber
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >
              <FormControl
                fullWidth
                required
              >
                <InputLabel>
                  تطبيق الرسوم على
                </InputLabel>

                <Controller
                  name="targetType"
                  control={control}
                  render={({
                    field,
                  }) => (
                    <Select
                      {...field}
                      label="تطبيق الرسوم على"
                    >
                      {TARGET_TYPES.map(
                        (item) => (
                          <MenuItem
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {
                              item.label
                            }
                          </MenuItem>
                        )
                      )}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {targetType ===
              "student" && (
              <Grid
                item
                xs={12}
                sm={6}
              >
                <FormControl
                  fullWidth
                  required
                >
                  <InputLabel>
                    الطالب
                  </InputLabel>

                  <Controller
                    name="targetId"
                    control={
                      control
                    }
                    render={({
                      field,
                    }) => (
                      <Select
                        {...field}
                        label="الطالب"
                      >
                        {studentOptions.map(
                          (
                            item
                          ) => (
                            <MenuItem
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {
                                item.label
                              }
                            </MenuItem>
                          )
                        )}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            )}

            {targetType ===
              "class" && (
              <Grid
                item
                xs={12}
                sm={6}
              >
                <FormControl
                  fullWidth
                  required
                >
                  <InputLabel>
                    الفصل
                  </InputLabel>

                  <Controller
                    name="targetId"
                    control={
                      control
                    }
                    render={({
                      field,
                    }) => (
                      <Select
                        {...field}
                        label="الفصل"
                      >
                        {classOptions.map(
                          (
                            item
                          ) => (
                            <MenuItem
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {
                                item.label
                              }
                            </MenuItem>
                          )
                        )}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            )}

            {targetType ===
              "academicYear" && (
              <Grid
                item
                xs={12}
                sm={6}
              >
                <FormControl
                  fullWidth
                  required
                >
                  <InputLabel>
                    السنة الدراسية
                  </InputLabel>

                  <Controller
                    name="targetAcademicYear"
                    control={
                      control
                    }
                    render={({
                      field,
                    }) => (
                      <Select
                        {...field}
                        label="السنة الدراسية"
                      >
                        {Years.map(
                          (year) => (
                            <MenuItem
                              key={
                                typeof year ===
                                "string"
                                  ? year
                                  : year?.value ||
                                    year?.id ||
                                    year?.name
                              }
                              value={
                                typeof year ===
                                "string"
                                  ? year
                                  : year?.value ||
                                    year?.name ||
                                    year?.label
                              }
                            >
                              {typeof year ===
                              "string"
                                ? year
                                : year?.label ||
                                  year?.name ||
                                  year?.value}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            )}

            <Grid
              item
              xs={12}
            >
              <Input
                register={
                  register
                }
                registerName="description"
                error={
                  errors.description
                    ?.message
                }
                label="الوصف"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mt: 1.25,
            p: 1.4,
          }}
        >
          <FormActions
            loading={loading}
            onCancel={() =>
              navigate(-1)
            }
            label="حفظ الرسوم"
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default AdditionalFeesAddPage;
