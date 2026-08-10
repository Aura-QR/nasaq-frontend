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
  AssignmentTurnedInRounded,
  DeleteOutlineRounded,
  EditRounded,
  FactCheckRounded,
  GradeRounded,
  MenuBookRounded,
  NumbersRounded,
  QuizRounded,
  SchoolRounded,
  TaskAltRounded,
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

import { useGradesCriteria } from "@/utils/hooks/apis/useGradesCriteria";
import { deleteGradesCriteria } from "@/APIs/school/gradesCriteria";
import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { api } from "@/APIs/Axios";
import usePermissions from "@/utils/hooks/usePermissions";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value?._id ||
      value?.id ||
      ""
    ).trim();
  }

  return String(value || "").trim();
};

const unwrapData = (response) =>
  response?.data?.data ??
  response?.data ??
  response;

const findFirstArray = (
  value,
  depth = 0
) => {
  if (depth > 8) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  const priorityKeys = [
    "data",
    "subjects",
    "academicYears",
    "years",
    "docs",
    "items",
    "results",
    "rows",
    "records",
    "list",
  ];

  for (const key of priorityKeys) {
    if (!(key in value)) {
      continue;
    }

    const found =
      findFirstArray(
        value[key],
        depth + 1
      );

    if (found.length) {
      return found;
    }
  }

  for (const nested of Object.values(
    value
  )) {
    const found =
      findFirstArray(
        nested,
        depth + 1
      );

    if (found.length) {
      return found;
    }
  }

  return [];
};

const getSubjectObject = (criteria) => {
  const candidates = [
    criteria?.subject,
    criteria?.subjectId,
    criteria?.subjectOffering
      ?.subjectId,
    criteria?.subjectOffering
      ?.subject,
    (
      criteria?.subjectOfferingId &&
      typeof criteria
        .subjectOfferingId ===
        "object"
        ? criteria
            .subjectOfferingId
            ?.subjectId
        : null
    ),
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value ===
          "object"
    ) || null
  );
};

const getSubjectId = (criteria) =>
  normalizeId(
    criteria?.subjectId ||
    criteria?.subject ||
    criteria?.subjectOffering
      ?.subjectId ||
    criteria?.subjectOffering
      ?.subject ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria
        .subjectOfferingId ===
        "object"
        ? criteria
            .subjectOfferingId
            ?.subjectId
        : ""
    )
  );

const formatSubject = (subject) => {
  if (!subject) {
    return "";
  }

  if (
    typeof subject === "string"
  ) {
    return subject;
  }

  const name =
    subject?.subjectName ||
    subject?.name ||
    subject?.title ||
    subject?.label ||
    "";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    "";

  return [name, code]
    .filter(Boolean)
    .join(" - ");
};

const getAcademicYearObject = (
  criteria
) => {
  const candidates = [
    criteria?.academicYearId,
    criteria?.academicYear,
    criteria?.subjectOffering
      ?.academicYearId,
    (
      criteria?.subjectOfferingId &&
      typeof criteria
        .subjectOfferingId ===
        "object"
        ? criteria
            .subjectOfferingId
            ?.academicYearId
        : null
    ),
  ];

  return (
    candidates.find(
      (value) =>
        value &&
        typeof value ===
          "object"
    ) || null
  );
};

const getAcademicYearId = (
  criteria
) =>
  normalizeId(
    criteria?.academicYearId ||
    (
      criteria?.academicYear &&
      typeof criteria
        .academicYear ===
        "object"
        ? criteria
            .academicYear
        : ""
    ) ||
    criteria?.subjectOffering
      ?.academicYearId ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria
        .subjectOfferingId ===
        "object"
        ? criteria
            .subjectOfferingId
            ?.academicYearId
        : ""
    )
  );

const formatAcademicYear = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return (
    value?.name ||
    value?.academicYear ||
    value?.label ||
    value?.title ||
    ""
  );
};

const getTermId = (criteria) =>
  normalizeId(
    criteria?.termId ||
    criteria?.term ||
    criteria?.subjectOffering
      ?.termId ||
    criteria?.subjectOffering
      ?.term ||
    (
      criteria?.subjectOfferingId &&
      typeof criteria
        .subjectOfferingId ===
        "object"
        ? criteria
            .subjectOfferingId
            ?.termId
        : ""
    )
  );

const DetailCard = ({
  icon,
  label,
  value,
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
        noWrap
        title={String(
          value || "—"
        )}
        sx={{
          mt: 0.25,
          color:
            "var(--color-navy-deep)",
          fontSize: "12px",
          fontWeight: 800,
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
    gradesCriteria,
    loading,
  } = useGradesCriteria(id);

  const [item, setItem] =
    useState(null);

  const [
    subjectLabel,
    setSubjectLabel,
  ] = useState("");

  const [
    academicYearLabel,
    setAcademicYearLabel,
  ] = useState("");

  const [open, setOpen] =
    useState(false);

  const permissions =
    usePermissions(
      "gradesCriteria"
    );

  useEffect(() => {
    if (gradesCriteria) {
      setItem(
        gradesCriteria
      );
    }
  }, [gradesCriteria]);

  /*
   * Grades Criteria موجودة في المشروع بأكثر من shape:
   *
   * New:
   *   subjectId + academicYearId
   *
   * Legacy:
   *   subjectOfferingId + subjectOffering.subjectId + termId
   *
   * لذلك صفحة التفاصيل تحل اسم المادة والسنة من الشكلين
   * بدل الاعتماد على item.subject / item.academicYear فقط.
   */
  useEffect(() => {
    if (!item) {
      setSubjectLabel("");
      setAcademicYearLabel("");
      return;
    }

    let active = true;

    const resolveRelations =
      async () => {
        const inlineSubject =
          getSubjectObject(item);

        const inlineSubjectLabel =
          formatSubject(
            inlineSubject
          );

        if (inlineSubjectLabel) {
          setSubjectLabel(
            inlineSubjectLabel
          );
        } else {
          setSubjectLabel("");
        }

        const inlineYear =
          getAcademicYearObject(
            item
          );

        const inlineYearLabel =
          formatAcademicYear(
            inlineYear
          );

        if (inlineYearLabel) {
          setAcademicYearLabel(
            inlineYearLabel
          );
        } else if (
          typeof item?.academicYear ===
            "string" &&
          item.academicYear.trim()
        ) {
          setAcademicYearLabel(
            item.academicYear.trim()
          );
        } else {
          setAcademicYearLabel("");
        }

        let years = [];

        try {
          const yearsResponse =
            await fetchAcademicYears();

          years =
            findFirstArray(
              yearsResponse
            );
        } catch {
          years = [];
        }

        if (!active) {
          return;
        }

        // Resolve subject if API returned only an ID.
        if (!inlineSubjectLabel) {
          const subjectId =
            getSubjectId(item);

          if (subjectId) {
            try {
              const responses =
                await Promise.allSettled([
                  api.get(
                    "/subjects/list"
                  ),
                  api.get(
                    "/subjects",
                    {
                      params: {
                        page: 1,
                        limit: 1000,
                      },
                    }
                  ),
                ]);

              if (!active) {
                return;
              }

              const subjects =
                responses.flatMap(
                  (result) =>
                    result.status ===
                    "fulfilled"
                      ? findFirstArray(
                          result.value
                        )
                      : []
                );

              const subject =
                subjects.find(
                  (candidate) =>
                    normalizeId(
                      candidate
                    ) === subjectId
                );

              const label =
                formatSubject(
                  subject
                );

              if (label) {
                setSubjectLabel(
                  label
                );
              }
            } catch {
              // Keep the inline fallback.
            }
          }
        }

        let yearId =
          getAcademicYearId(item);

        // Legacy criteria may know only the term through subjectOffering.
        if (!yearId) {
          const termId =
            getTermId(item);

          if (termId) {
            try {
              const termResponse =
                await api.get(
                  `/terms/${termId}`
                );

              if (!active) {
                return;
              }

              const term =
                unwrapData(
                  termResponse
                );

              yearId =
                normalizeId(
                  term?.academicYearId ||
                  term?.academicYear
                );

              const populatedYear =
                term?.academicYearId &&
                typeof term
                  .academicYearId ===
                  "object"
                  ? term
                      .academicYearId
                  : term?.academicYear &&
                    typeof term
                      .academicYear ===
                      "object"
                  ? term
                      .academicYear
                  : null;

              const populatedLabel =
                formatAcademicYear(
                  populatedYear
                );

              if (
                populatedLabel
              ) {
                setAcademicYearLabel(
                  populatedLabel
                );
              }
            } catch {
              // The page still shows all grade values even if relation lookup fails.
            }
          }
        }

        if (
          yearId &&
          active
        ) {
          const year =
            years.find(
              (candidate) =>
                normalizeId(
                  candidate
                ) === yearId
            );

          const label =
            formatAcademicYear(
              year
            );

          if (label) {
            setAcademicYearLabel(
              label
            );
          }
        }
      };

    resolveRelations();

    return () => {
      active = false;
    };
  }, [item]);

  const handleDelete =
    async () => {
      try {
        const response =
          await deleteGradesCriteria(
            id
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "تعذر حذف توزيع الدرجات"
          );
          return;
        }

        toast.success(
          "تم حذف توزيع الدرجات بنجاح"
        );

        navigate(
          "/school/gradesCriteria"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف توزيع الدرجات"
        );
      }
    };

  const details = useMemo(() => {
    if (!item) {
      return [];
    }

    const gradeValue = (
      value
    ) =>
      `${Number(
        value || 0
      )} درجة`;

    return [
      {
        label: "المادة",
        value:
          subjectLabel || "—",
        icon:
          <MenuBookRounded />,
      },
      {
        label:
          "السنة الدراسية",
        value:
          academicYearLabel ||
          "—",
        icon:
          <SchoolRounded />,
      },
      {
        label: "درجة النجاح",
        value: gradeValue(
          item?.passingGrade ?? 50
        ),
        icon: <GradeRounded />,
      },
      {
        label:
          "الاختبار النهائي",
        value: gradeValue(
          item?.final
        ),
        icon: <GradeRounded />,
      },
      {
        label:
          "أعمال السنة",
        value: gradeValue(
          item?.activities
        ),
        icon:
          <FactCheckRounded />,
      },
      {
        label:
          "المهام الأدائية",
        value: gradeValue(
          item?.projects
        ),
        icon:
          <TaskAltRounded />,
      },
      {
        label:
          "عدد المهام الأدائية",
        value: Number(
          item?.projectsCount ||
            0
        ),
        icon:
          <NumbersRounded />,
      },
      {
        label: "الواجبات",
        value: gradeValue(
          item?.assignments
        ),
        icon:
          <AssignmentTurnedInRounded />,
      },
      {
        label:
          "عدد الواجبات",
        value: Number(
          item?.assignmentsCount ||
            0
        ),
        icon:
          <NumbersRounded />,
      },
      {
        label:
          "الاختبارات القصيرة",
        value: gradeValue(
          item?.quizzes
        ),
        icon: <QuizRounded />,
      },
      {
        label:
          "عدد الاختبارات القصيرة",
        value: Number(
          item?.quizzesCount ||
            0
        ),
        icon:
          <NumbersRounded />,
      },
    ];
  }, [
    item,
    subjectLabel,
    academicYearLabel,
  ]);

  const totalGrades =
    useMemo(
      () =>
        [
          item?.final,
          item?.activities,
          item?.projects,
          item?.assignments,
          item?.quizzes,
        ].reduce(
          (total, value) =>
            total +
            Number(value || 0),
          0
        ),
      [item]
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
            لم يتم العثور على توزيع الدرجات
          </Typography>
        </Paper>
      </Container>
    );
  }

  const title = [
    academicYearLabel,
    subjectLabel,
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
        <Back title="تفاصيل توزيع الدرجات" />

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
                }}
              >
                {title || "توزيع الدرجات"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    "var(--color-muted)",
                  fontSize: "10.5px",
                }}
              >
                راجع تفاصيل توزيع
                درجات المادة وعدد
                الأنشطة المطلوبة.
              </Typography>
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              gap={0.8}
              flexWrap="wrap"
            >
              <Chip
                label={`${totalGrades} / 100`}
                sx={{
                  height: 38,
                  color:
                    totalGrades ===
                    100
                      ? "#237449"
                      : "var(--color-danger)",
                  backgroundColor:
                    totalGrades ===
                    100
                      ? "rgba(116,201,154,0.16)"
                      : "rgba(201,79,79,0.08)",
                  border:
                    totalGrades ===
                    100
                      ? "1px solid rgba(116,201,154,0.28)"
                      : "1px solid rgba(201,79,79,0.18)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              />

              {permissions.edit && (
                <Tooltip title="تعديل توزيع الدرجات">
                  <IconButton
                    component={Link}
                    to={`/school/gradesCriteria/edit/${item._id}`}
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
                <Tooltip title="حذف توزيع الدرجات">
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

        <Popup
          open={open}
          setOpen={setOpen}
          message="هل أنت متأكد من أنك تريد حذف توزيع الدرجات هذا؟"
          type="delete"
          fn={handleDelete}
        />
      </Box>
    </Container>
  );
};

export default Profile;
