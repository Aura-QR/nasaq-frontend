import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  DeleteOutlineRounded,
  HelpOutlineRounded,
} from "@mui/icons-material";

import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";

const Questions = ({
  fields,
  register,
  errors,
  watch,
  remove,
  addQuestion,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        p: {
          xs: 1.5,
          md: 2,
        },
        border:
          "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        backgroundColor:
          "var(--color-cream)",
        boxShadow:
          "0 12px 28px rgba(18,47,77,0.06)",

        "& .MuiFormControl-root": {
          width: "100%",
          margin: 0,
        },

        "& .MuiInputBase-root, & .MuiOutlinedInput-root":
          {
            backgroundColor:
              "var(--color-white)",
            borderRadius: "12px",
          },

        "& .MuiOutlinedInput-notchedOutline":
          {
            borderColor:
              "rgba(36,74,112,0.16)",
          },

        "& .MuiInputLabel-root": {
          px: 0.65,
          backgroundColor:
            "var(--color-cream)",
          fontSize: "10.5px",
          fontWeight: 700,
        },
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        justifyContent="space-between"
        gap={1}
        sx={{
          pb: 1.25,
          mb: 1.5,
          borderBottom:
            "1px solid rgba(36,74,112,0.07)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              color:
                "var(--color-gold-dark)",
              backgroundColor:
                "var(--color-gold-soft)",
              border:
                "1px solid rgba(211,164,79,0.22)",
              borderRadius: "12px",

              "& svg": {
                fontSize: 21,
              },
            }}
          >
            <HelpOutlineRounded />
          </Box>

          <Box>
            <Typography
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              أسئلة الاختبار
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color:
                  "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              أضف السؤال والخيارات ثم
              حدّد الإجابة الصحيحة.
            </Typography>
          </Box>
        </Stack>

        <Button
          type="button"
          onClick={addQuestion}
          variant="outlined"
          startIcon={
            <AddCircleOutlineRounded />
          }
          sx={{
            minHeight: 40,
            px: 1.8,
            borderRadius: "11px",
            color:
              "var(--color-navy)",
            borderColor:
              "rgba(36,74,112,0.18)",
            backgroundColor:
              "var(--color-white)",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "none",

            "& .MuiButton-startIcon":
              {
                marginLeft: "6px",
                marginRight: 0,
              },

            "&:hover": {
              color:
                "var(--color-gold-dark)",
              backgroundColor:
                "var(--color-gold-soft)",
              borderColor:
                "rgba(211,164,79,0.32)",
            },
          }}
        >
          إضافة سؤال
        </Button>
      </Stack>

      <Stack spacing={1.25}>
        {fields.map(
          (field, questionIndex) => {
            const options =
              watch(
                `questions.${questionIndex}.options`
              ) || [
                "",
                "",
                "",
                "",
              ];

            const availableOptions =
              options.filter(
                (option) =>
                  String(
                    option || ""
                  ).trim()
              );

            const correctAnswerDisabled =
              !String(
                options[0] || ""
              ).trim() ||
              !String(
                options[1] || ""
              ).trim();

            return (
              <Paper
                key={field.id}
                elevation={0}
                sx={{
                  p: {
                    xs: 1.25,
                    md: 1.5,
                  },
                  border:
                    "1px solid rgba(36,74,112,0.08)",
                  borderRadius:
                    "15px",
                  backgroundColor:
                    "rgba(255,255,255,0.58)",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  sx={{
                    mb: 1.5,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.8}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display:
                          "grid",
                        placeItems:
                          "center",
                        color:
                          "var(--color-gold-dark)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        borderRadius:
                          "9px",
                        fontSize:
                          "11px",
                        fontWeight:
                          800,
                      }}
                    >
                      {questionIndex +
                        1}
                    </Box>

                    <Typography
                      sx={{
                        color:
                          "var(--color-navy-deep)",
                        fontSize:
                          "13px",
                        fontWeight:
                          800,
                      }}
                    >
                      السؤال{" "}
                      {questionIndex +
                        1}
                    </Typography>
                  </Stack>

                  {fields.length >
                    1 && (
                    <IconButton
                      type="button"
                      onClick={() =>
                        remove(
                          questionIndex
                        )
                      }
                      aria-label={`حذف السؤال ${
                        questionIndex +
                        1
                      }`}
                      sx={{
                        width: 36,
                        height: 36,
                        color:
                          "var(--color-danger)",
                        backgroundColor:
                          "rgba(201,79,79,0.07)",
                        border:
                          "1px solid rgba(201,79,79,0.12)",
                        borderRadius:
                          "10px",

                        "&:hover": {
                          backgroundColor:
                            "rgba(201,79,79,0.13)",
                        },
                      }}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <Grid
                  container
                  spacing={{
                    xs: 1.25,
                    md: 1.5,
                  }}
                >
                  <Grid
                    item
                    xs={12}
                  >
                    <Input
                      register={
                        register
                      }
                      registerName={`questions.${questionIndex}.question`}
                      error={
                        errors
                          .questions?.[
                          questionIndex
                        ]?.question
                          ?.message
                      }
                      label="نص السؤال"
                      required
                      multiline
                    />
                  </Grid>

                  {[0, 1, 2, 3].map(
                    (optionIndex) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        key={
                          optionIndex
                        }
                      >
                        <Input
                          register={
                            register
                          }
                          registerName={`questions.${questionIndex}.options.${optionIndex}`}
                          error={
                            errors
                              .questions?.[
                              questionIndex
                            ]?.options?.[
                              optionIndex
                            ]?.message
                          }
                          label={`الخيار ${
                            optionIndex +
                            1
                          }`}
                          required={
                            optionIndex <
                            2
                          }
                        />
                      </Grid>
                    )
                  )}

                  <Grid
                    item
                    xs={12}
                  >
                    <Select
                      register={
                        register
                      }
                      registerName={`questions.${questionIndex}.correctAnswer`}
                      data={
                        availableOptions
                      }
                      error={
                        errors
                          .questions?.[
                          questionIndex
                        ]
                          ?.correctAnswer
                          ?.message
                      }
                      label="الإجابة الصحيحة"
                      required
                      defaultSelect="اختر الإجابة الصحيحة"
                      disabled={
                        correctAnswerDisabled
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
            );
          }
        )}
      </Stack>

      <Button
        type="button"
        onClick={addQuestion}
        variant="contained"
        startIcon={
          <AddCircleOutlineRounded />
        }
        sx={{
          mt: 1.5,
          minHeight: 42,
          px: 2,
          borderRadius: "12px",
          color:
            "var(--color-white)",
          background:
            "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
          fontSize: "11px",
          fontWeight: 800,
          textTransform: "none",

          "& .MuiButton-startIcon":
            {
              marginLeft: "7px",
              marginRight: 0,
            },
        }}
      >
        إضافة سؤال جديد
      </Button>
    </Paper>
  );
};

export default Questions;
