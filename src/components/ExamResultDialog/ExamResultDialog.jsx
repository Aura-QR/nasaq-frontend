import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  CancelRounded,
  CheckCircleRounded,
  CloseRounded,
} from "@mui/icons-material";

import { fetchMyExamResult } from "@/APIs/student";

/**
 * What a student scored on an exam they already sat.
 *
 * The grade existed on the server all along; the only moment it ever
 * reached the student was the screen that appeared the second they
 * pressed "submit". Afterwards the card said "تم إكمال الاختبار" and
 * stopped there, so nobody could answer "what did I get?".
 *
 * The answer breakdown is only kept for papers submitted after the
 * server started storing answers. An older one still has its exact
 * score, so the summary shows and the per-question list is left out
 * rather than faked.
 */
const ExamResultDialog = ({
  open,
  onClose,
  examId,
  examTitle,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  useEffect(() => {
    if (!open || !examId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      const response =
        await fetchMyExamResult(
          examId
        );

      if (cancelled) {
        return;
      }

      if (
        response?.status === false
      ) {
        setError(
          response?.message ||
            "تعذر عرض نتيجة الاختبار"
        );

        setResult(null);
      } else {
        setResult(
          response?.data || null
        );
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, examId]);

  const percentage = Number(
    result?.percentage ?? 0
  );

  const passed = Boolean(
    result?.passed
  );

  const answers = Array.isArray(
    result?.results
  )
    ? result.results
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: "20px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 18,
            color: "#122f4d",
          }}
        >
          نتيجة {examTitle || "الاختبار"}
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="إغلاق"
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Stack
            alignItems="center"
            sx={{ py: 5 }}
          >
            <CircularProgress size={28} />
          </Stack>
        )}

        {!loading && error && (
          <Typography
            sx={{
              py: 4,
              textAlign: "center",
              color: "#7b8794",
            }}
          >
            {error}
          </Typography>
        )}

        {!loading && !error && result && (
          <Stack spacing={2.2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 2,
                borderRadius: "16px",
                backgroundColor: passed
                  ? "#eafaf1"
                  : "#fdecec",
              }}
            >
              <Stack spacing={0.4}>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#6b7785",
                  }}
                >
                  درجتك
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 26,
                    color: passed
                      ? "#1f8a54"
                      : "#c0392b",
                  }}
                >
                  {result.achievedGrade}
                  {" من "}
                  {result.maxGrade}
                </Typography>
              </Stack>

              <Chip
                label={
                  passed
                    ? "ناجح"
                    : "لم تجتز"
                }
                sx={{
                  fontWeight: 800,
                  color: "#fff",
                  backgroundColor: passed
                    ? "#1f8a54"
                    : "#c0392b",
                }}
              />
            </Stack>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.8 }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#6b7785",
                  }}
                >
                  {result.correctAnswers}
                  {" إجابة صحيحة من "}
                  {result.totalQuestions}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#122f4d",
                  }}
                >
                  {percentage}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.min(
                  Math.max(percentage, 0),
                  100
                )}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    "#eef1f4",
                  "& .MuiLinearProgress-bar":
                    {
                      borderRadius: 4,
                      backgroundColor:
                        passed
                          ? "#1f8a54"
                          : "#c0392b",
                    },
                }}
              />
            </Box>

            {answers.length > 0 && (
              <>
                <Divider />

                <Stack spacing={1}>
                  {answers.map(
                    (answer, index) => (
                      <Stack
                        key={
                          answer.questionId ||
                          index
                        }
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        sx={{
                          p: 1.2,
                          borderRadius:
                            "12px",
                          backgroundColor:
                            "#f7f9fb",
                        }}
                      >
                        {answer.isCorrect ? (
                          <CheckCircleRounded
                            sx={{
                              fontSize: 20,
                              color: "#1f8a54",
                            }}
                          />
                        ) : (
                          <CancelRounded
                            sx={{
                              fontSize: 20,
                              color: "#c0392b",
                            }}
                          />
                        )}

                        <Stack
                          spacing={0.3}
                          sx={{ flex: 1 }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#122f4d",
                            }}
                          >
                            السؤال {index + 1}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "#4a5560",
                            }}
                          >
                            إجابتك:{" "}
                            {answer.studentAnswer ||
                              "—"}
                          </Typography>

                          {!answer.isCorrect && (
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#1f8a54",
                              }}
                            >
                              الإجابة الصحيحة:{" "}
                              {answer.correctAnswer ||
                                "—"}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    )
                  )}
                </Stack>
              </>
            )}

            {answers.length === 0 && (
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#7b8794",
                }}
              >
                مراجعة الإجابات غير متاحة
                لهذا الاختبار لأنه سُلّم قبل
                حفظ الإجابات.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExamResultDialog;
