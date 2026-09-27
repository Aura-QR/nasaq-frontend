import {
  SchoolRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
} from "react";

import {
  useForm,
} from "react-hook-form";

const FIELD_SX = {
  "& .MuiOutlinedInput-root":
    {
      minHeight: 46,

      borderRadius:
        "12px",

      backgroundColor:
        "#fffcf7",

      "& fieldset": {
        borderColor:
          "rgba(36,74,112,0.15)",
      },

      "&:hover fieldset":
        {
          borderColor:
            "rgba(36,74,112,0.28)",
        },

      "&.Mui-focused fieldset":
        {
          borderColor:
            "#d3a44f",

          borderWidth: 1,
        },
    },

  "& .MuiInputLabel-root":
    {
      fontFamily:
        "Tajawal, Arial, sans-serif",

      fontSize:
        "11px",

      fontWeight: 700,
    },

  "& input, & .MuiSelect-select":
    {
      fontFamily:
        "Tajawal, Arial, sans-serif",

      fontSize:
        "11px",
    },
};

const getId = (
  value
) =>
  String(
    value?._id ||
    value?.id ||
    value ||
    ""
  ).trim();

const getGradeStageId = (
  gradeLevel
) =>
  getId(
    gradeLevel
      ?.stageId ||
    gradeLevel
      ?.stage
  );

const GradeLevelFormDialog = ({
  open,
  gradeLevel = null,
  stages = [],
  gradeLevels = [],
  loading = false,
  defaultOrder = 1,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
    reset,
    watch,
  } = useForm();

  const editingId =
    getId(
      gradeLevel
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      stageId:
        getGradeStageId(
          gradeLevel
        ) || "",

      name:
        gradeLevel?.name ||
        "",

      order:
        gradeLevel?.order ||
        defaultOrder,
    });
  }, [
    open,
    gradeLevel,
    defaultOrder,
    reset,
  ]);

  const selectedStageId =
    watch(
      "stageId"
    );

  const selectedStage =
    useMemo(
      () =>
        stages.find(
          (stage) =>
            getId(stage) ===
            selectedStageId
        ) || null,
      [
        stages,
        selectedStageId,
      ]
    );

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius:
            "18px",

          fontFamily:
            "Tajawal, Arial, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.25,

          borderBottom:
            "1px solid #ded8cd",
        }}
      >
        <Box
          sx={{
            display:
              "flex",

            alignItems:
              "center",

            gap: 0.9,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,

              display:
                "grid",

              placeItems:
                "center",

              color:
                "#b78430",

              backgroundColor:
                "#fbf0d8",

              borderRadius:
                "11px",
            }}
          >
            <SchoolRounded
              sx={{
                fontSize: 20,
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color:
                  "#122f4d",

                fontSize:
                  "15px",

                fontWeight: 800,
              }}
            >
              {gradeLevel
                ? "تعديل الصف الدراسي"
                : "إضافة صف دراسي"}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,

                color:
                  "#7e8791",

                fontSize:
                  "8.5px",
              }}
            >
              اربط الصف بالمرحلة وحدد ترتيبه العام في مسار الترقية.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          pt:
            "22px !important",
        }}
      >
        {stages.length ===
          0 && (
          <Alert
            severity="warning"
            sx={{
              mb: 1.25,

              borderRadius:
                "12px",

              fontSize:
                "10px",
            }}
          >
            أضف مرحلة دراسية أولًا قبل إنشاء الصفوف.
          </Alert>
        )}

        <Box
          component="form"
          id="grade-level-form"
          noValidate
          onSubmit={
            handleSubmit(
              onSubmit
            )
          }
          sx={{
            display:
              "grid",

            gridTemplateColumns:
              {
                xs:
                  "1fr",

                md:
                  "1fr 1fr",
              },

            gap: 1.25,
          }}
        >
          <TextField
            fullWidth
            select
            label="المرحلة الدراسية"
            defaultValue=""
            error={
              Boolean(
                errors
                  ?.stageId
              )
            }
            helperText={
              errors
                ?.stageId
                ?.message
            }
            {...register(
              "stageId",
              {
                required:
                  "اختر المرحلة الدراسية",
              }
            )}
            sx={{
              ...FIELD_SX,

              gridColumn: {
                xs:
                  "auto",

                md:
                  "1 / -1",
              },
            }}
          >
            {stages.map(
              (stage) => (
                <MenuItem
                  key={
                    getId(stage)
                  }
                  value={
                    getId(stage)
                  }
                >
                  {stage?.name}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            fullWidth
            label="اسم الصف الدراسي"
            placeholder="مثال: الصف الأول الابتدائي"
            error={
              Boolean(
                errors?.name
              )
            }
            helperText={
              errors?.name
                ?.message
            }
            {...register(
              "name",
              {
                required:
                  "اسم الصف الدراسي مطلوب",

                minLength: {
                  value: 2,
                  message:
                    "اسم الصف قصير جدًا",
                },

                validate:
                  (value) => {
                    const normalizedName =
                      String(
                        value ||
                        ""
                      )
                        .trim()
                        .toLowerCase();

                    const duplicated =
                      gradeLevels.some(
                        (item) =>
                          getId(item) !==
                            editingId &&
                          getGradeStageId(
                            item
                          ) ===
                            selectedStageId &&
                          String(
                            item?.name ||
                            ""
                          )
                            .trim()
                            .toLowerCase() ===
                            normalizedName
                      );

                    return (
                      !duplicated ||
                      "يوجد صف بنفس الاسم داخل هذه المرحلة"
                    );
                  },
              }
            )}
            sx={FIELD_SX}
          />

          <TextField
            fullWidth
            type="number"
            label="الترتيب العام"
            placeholder="1"
            inputProps={{
              min: 1,
              step: 1,
            }}
            error={
              Boolean(
                errors?.order
              )
            }
            helperText={
              errors?.order
                ?.message ||
              "الترتيب يكون متسلسلًا على كل المراحل"
            }
            {...register(
              "order",
              {
                required:
                  "الترتيب العام مطلوب",

                valueAsNumber:
                  true,

                min: {
                  value: 1,
                  message:
                    "الترتيب يبدأ من 1",
                },

                validate:
                  (value) => {
                    if (
                      !Number.isInteger(
                        value
                      )
                    ) {
                      return "الترتيب يجب أن يكون رقمًا صحيحًا";
                    }

                    const duplicated =
                      gradeLevels.some(
                        (item) =>
                          getId(item) !==
                            editingId &&
                          Number(
                            item?.order
                          ) ===
                            Number(
                              value
                            )
                      );

                    return (
                      !duplicated ||
                      "هذا الترتيب مستخدم لصف دراسي آخر"
                    );
                  },
              }
            )}
            sx={FIELD_SX}
          />

          {selectedStage && (
            <Alert
              severity="info"
              sx={{
                gridColumn: {
                  xs:
                    "auto",

                  md:
                    "1 / -1",
                },

                borderRadius:
                  "12px",

                fontSize:
                  "9.5px",
              }}
            >
              الصف الجديد سيتبع: {selectedStage?.name}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.4,
          py: 1.4,

          gap: 0.7,

          borderTop:
            "1px solid #ded8cd",
        }}
      >
        <Button
          type="button"
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minHeight: 40,

            borderRadius:
              "10px",

            color:
              "#244a70",

            borderColor:
              "rgba(36,74,112,0.18)",

            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          type="submit"
          form="grade-level-form"
          disabled={
            loading ||
            stages.length ===
              0
          }
          variant="contained"
          sx={{
            minHeight: 40,

            px: 2.2,

            borderRadius:
              "10px",

            backgroundColor:
              "#244a70",

            boxShadow:
              "none",

            fontWeight: 800,

            "&:hover": {
              backgroundColor:
                "#1b3d61",

              boxShadow:
                "none",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : gradeLevel ? (
            "حفظ التعديلات"
          ) : (
            "إضافة الصف"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeLevelFormDialog;
