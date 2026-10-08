import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  GradeRounded,
  GroupsRounded,
  HelpOutlineRounded,
  MenuBookRounded,
  PersonRounded,
  SchoolRounded,
  TaskAltRounded,
  TimerRounded,
} from "@mui/icons-material";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Popup from "@/components/Popup/Popup";
import Loading from "@/components/Loading";

import { useExam } from "@/utils/hooks/apis/useExam";
import { deleteExam } from "@/APIs/school/exams";

import MCQExams from "@/utils/constants/MCQExams";
import { translateGender } from "@/utils/helpers/translateGender";
import usePermissions from "@/utils/hooks/usePermissions";

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const getExamTypeLabel = (value) =>
  MCQExams.find(
    (exam) =>
      String(exam.id) ===
      String(value)
  )?.value ||
  value ||
  "—";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "ar-EG"
  );
};

const DetailCard = ({
  icon,
  label,
  value,
  wide = false,
}) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: 82,
      p: 1.25,
      display: "grid",
      gridTemplateColumns:
        "40px minmax(0,1fr)",
      alignItems: "center",
      gap: 1,
      gridColumn: wide
        ? {
            xs: "span 2",
            md: "span 2",
          }
        : "auto",
      border:
        "1px solid rgba(36,74,112,0.08)",
      borderRadius: "14px",
      backgroundColor:
        "var(--color-white)",
      transition:
        "transform 180ms ease, box-shadow 180ms ease",

      "&:hover": {
        transform:
          "translateY(-2px)",
        boxShadow:
          "0 10px 22px rgba(18,47,77,0.08)",
      },
    }}
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
          fontSize: 20,
        },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color:
            "var(--color-muted)",
          fontSize: "9.5px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        title={String(
          value || "—"
        )}
        sx={{
          mt: 0.25,
          color:
            "var(--color-navy-deep)",
          fontSize: "12px",
          fontWeight: 800,
          lineHeight: 1.6,
          overflowWrap:
            "anywhere",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Paper>
);

const Profile = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const {
    exam,
    loading,
  } = useExam(id);

  const [item, setItem] =
    useState(null);

  const [open, setOpen] =
    useState(false);

  const permissions =
    usePermissions("exams");

  useEffect(() => {
    if (exam) {
      setItem(exam);
    }
  }, [exam]);

  const handleDelete =
    async () => {
      try {
        const response =
          await deleteExam(id);

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "تعذر حذف الاختبار"
          );
          return;
        }

        toast.success(
          "تم حذف الاختبار بنجاح"
        );

        navigate(
          "/school/exams"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف الاختبار"
        );
      }
    };

  const subjectData =
    item?.gradesCriteria
      ?.subjectId ||
    item?.subject ||
    {};

  const classes =
    getArray(
      item?.classes?.length
        ? item.classes
        : item?.classIds
    );

  const questions =
    getArray(
      item?.questions
    );

  const subjectLabel = [
    subjectData?.subjectName ||
      subjectData?.name,
    subjectData?.subjectCode ||
      subjectData?.code,
  ]
    .filter(Boolean)
    .join(" - ") || "—";

  const classesLabel =
    classes.length > 0
      ? classes
          .map((classItem) => {
            if (
              typeof classItem ===
              "string"
            ) {
              return classItem;
            }

            return [
              classItem
                ?.academicYear,
              classItem
                ?.roomNumber,
              translateGender(
                classItem?.gender,
                "class"
              ),
            ]
              .filter(Boolean)
              .join(" - ");
          })
          .filter(Boolean)
          .join(" / ")
      : "—";

  const details = useMemo(
    () => {
      if (!item) {
        return [];
      }

      return [
        {
          label: "المادة",
          value: subjectLabel,
          icon:
            <MenuBookRounded />,
        },
        {
          label: "المعلم",
          value:
            item?.createdBy
              ?.name ||
            "—",
          icon:
            <PersonRounded />,
        },
        {
          label:
            "السنة الدراسية",
          value:
            item?.academicYear ||
            item?.gradesCriteria
              ?.academicYear ||
            "—",
          icon:
            <SchoolRounded />,
        },
        {
          label:
            "نوع الاختبار",
          value:
            getExamTypeLabel(
              item?.examType
            ),
          icon:
            <TaskAltRounded />,
        },
        {
          label:
            "عدد الأسئلة",
          value:
            questions.length,
          icon:
            <HelpOutlineRounded />,
        },
        {
          label:
            "درجة الاختبار",
          value: `${
            Number(
              item?.grade || 0
            )
          } درجة`,
          icon:
            <GradeRounded />,
        },
        {
          label:
            "تاريخ البدء",
          value: formatDate(
            item?.startDate
          ),
          icon:
            <CalendarMonthRounded />,
        },
        {
          label:
            "تاريخ الانتهاء",
          value: formatDate(
            item?.endDate
          ),
          icon:
            <CalendarMonthRounded />,
        },
        {
          label: "المدة",
          value:
            item?.duration
              ? `${item.duration} دقيقة`
              : "—",
          icon:
            <TimerRounded />,
        },
        {
          label: "الفصول",
          value: classesLabel,
          icon:
            <GroupsRounded />,
          wide: true,
        },
      ];
    },
    [
      item,
      subjectLabel,
      classesLabel,
      questions.length,
    ]
  );

  if (loading) {
    return <Loading />;
  }

  if (!item) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            minHeight: 300,
            display: "grid",
            placeItems: "center",
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontWeight: 700,
            }}
          >
            لم يتم العثور على بيانات الاختبار
          </Typography>
        </Paper>
      </Container>
    );
  }

  const title = [
    item?.academicYear ||
      item?.gradesCriteria
        ?.academicYear,
    subjectData?.subjectName ||
      subjectData?.name,
    getExamTypeLabel(
      item?.examType
    ),
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
          color:
            "var(--color-text)",
        }}
      >
        <Back title="تفاصيل الاختبار" />

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            mb: 1.25,
            p: {
              xs: 1.5,
              md: 2,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow:
              "0 12px 28px rgba(18,47,77,0.065)",
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
            gap={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "20px",
                    md: "24px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {title ||
                  "تفاصيل الاختبار"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    "var(--color-muted)",
                  fontSize: "10.5px",
                }}
              >
                راجع بيانات الاختبار
                والأسئلة والإجابات
                الصحيحة.
              </Typography>
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              gap={0.8}
              flexWrap="wrap"
            >
              <Chip
                label={`${questions.length} سؤال`}
                sx={{
                  height: 38,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.24)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              />

              {permissions.edit && (
                <Tooltip title="تعديل الاختبار">
                  <IconButton
                    component={Link}
                    to={`/school/exams/edit/${item._id}`}
                    sx={{
                      width: 38,
                      height: 38,
                      color:
                        "var(--color-navy)",
                      backgroundColor:
                        "rgba(36,74,112,0.07)",
                      border:
                        "1px solid rgba(36,74,112,0.10)",
                      borderRadius:
                        "11px",
                    }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {permissions.delete && (
                <Tooltip title="حذف الاختبار">
                  <IconButton
                    onClick={() =>
                      setOpen(true)
                    }
                    sx={{
                      width: 38,
                      height: 38,
                      color:
                        "var(--color-danger)",
                      backgroundColor:
                        "rgba(201,79,79,0.07)",
                      border:
                        "1px solid rgba(201,79,79,0.14)",
                      borderRadius:
                        "11px",
                    }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs:
                "repeat(2, minmax(0,1fr))",
              md:
                "repeat(3, minmax(0,1fr))",
              xl:
                "repeat(5, minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {details.map(
            (detail) => (
              <DetailCard
                key={detail.label}
                {...detail}
              />
            )
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
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
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              pb: 1.25,
              mb: 1.5,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
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
                borderRadius: "12px",
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
                عرض الأسئلة والخيارات والإجابة الصحيحة.
              </Typography>
            </Box>
          </Stack>

          {questions.length >
          0 ? (
            <Stack spacing={1.25}>
              {questions.map(
                (
                  question,
                  questionIndex
                ) => (
                  <Paper
                    key={
                      question?._id ||
                      questionIndex
                    }
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
                        "var(--color-white)",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      spacing={0.8}
                      sx={{
                        mb: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          display:
                            "grid",
                          placeItems:
                            "center",
                          flexShrink: 0,
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
                          pt: 0.45,
                          color:
                            "var(--color-navy-deep)",
                          fontSize:
                            "13px",
                          fontWeight:
                            800,
                          lineHeight: 1.7,
                        }}
                      >
                        {question?.question ||
                          "—"}
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          {
                            xs: "1fr",
                            sm:
                              "repeat(2, minmax(0,1fr))",
                          },
                        gap: 0.8,
                      }}
                    >
                      {getArray(
                        question?.options
                      ).map(
                        (
                          option,
                          optionIndex
                        ) => {
                          const isCorrect =
                            String(
                              option
                            ) ===
                            String(
                              question
                                ?.correctAnswer
                            );

                          return (
                            <Box
                              key={
                                optionIndex
                              }
                              sx={{
                                minHeight:
                                  44,
                                px: 1.2,
                                py: 0.9,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 0.8,
                                color:
                                  isCorrect
                                    ? "#237449"
                                    : "var(--color-text)",
                                backgroundColor:
                                  isCorrect
                                    ? "rgba(116,201,154,0.12)"
                                    : "rgba(36,74,112,0.035)",
                                border:
                                  isCorrect
                                    ? "1px solid rgba(116,201,154,0.30)"
                                    : "1px solid rgba(36,74,112,0.07)",
                                borderRadius:
                                  "11px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  isCorrect
                                    ? 800
                                    : 600,
                              }}
                            >
                              {isCorrect && (
                                <CheckCircleRounded
                                  sx={{
                                    fontSize:
                                      17,
                                  }}
                                />
                              )}

                              <span>
                                {option ||
                                  "—"}
                              </span>
                            </Box>
                          );
                        }
                      )}
                    </Box>
                  </Paper>
                )
              )}
            </Stack>
          ) : (
            <Box
              sx={{
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                color:
                  "var(--color-muted)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              لا توجد أسئلة داخل هذا الاختبار
            </Box>
          )}
        </Paper>

        <Popup
          open={open}
          setOpen={setOpen}
          message="هل أنت متأكد من أنك تريد حذف هذا الاختبار؟"
          type="delete"
          fn={handleDelete}
        />
      </Box>
    </Container>
  );
};

export default Profile;
