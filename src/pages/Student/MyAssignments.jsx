import {
  useMemo,
  useState,
} from "react";

import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardRounded,
  AssignmentRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  EventAvailableRounded,
  HourglassBottomRounded,
  MenuBookRounded,
  SchoolRounded,
  TuneRounded,
} from "@mui/icons-material";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import {
  useStudentExams,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

import AssignmentCard from "./components/AssignmentCard";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  purple: "#8068c9",
  purpleLight: "#f3efff",

  orange: "#e69a43",
  orangeLight: "#fff3e4",

  green: "#43a978",
  greenLight: "#eaf8f1",

  red: "#d76760",
  redLight: "#fff0ef",

  gray: "#87939e",
};

// =====================================================
// STATUS
// =====================================================

const STATUS_UI = {
  pending: {
    label: "متاح الآن",
    color: COLORS.orange,
    background: COLORS.orangeLight,
    icon: EventAvailableRounded,
  },

  upcoming: {
    label: "لم يبدأ بعد",
    color: COLORS.purple,
    background: COLORS.purpleLight,
    icon: HourglassBottomRounded,
  },

  completed: {
    label: "مكتمل",
    color: COLORS.green,
    background: COLORS.greenLight,
    icon: CheckCircleRounded,
  },

  overdue: {
    label: "منتهي",
    color: COLORS.red,
    background: COLORS.redLight,
    icon: ErrorOutlineRounded,
  },
};

// =====================================================
// HELPERS
// =====================================================

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

// =====================================================
// SUBJECT / SUBJECT OFFERING
// =====================================================

const getSubjectOfferingEntity = (
  item
) => {
  if (!item) {
    return null;
  }

  return (
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering ||
    item?.gradesCriteria
      ?.subjectOfferingId ||
    item?.gradesCriteria
      ?.subjectOffering ||
    null
  );
};

const getSubjectOfferingId = (
  item
) => {
  if (!item) {
    return "";
  }

  const offering =
    getSubjectOfferingEntity(item);

  const offeringId =
    normalizeId(offering);

  if (offeringId) {
    return offeringId;
  }

  /*
   * Student subjects endpoint may return the SubjectOffering
   * itself as the row:
   * {
   *   _id,
   *   subjectId,
   *   termId / gradeLevelId / academicYearId
   * }
   */
  const looksLikeOffering =
    Boolean(item?.subjectId) &&
    Boolean(
      item?.termId ||
        item?.gradeLevelId ||
        item?.academicYearId
    );

  return looksLikeOffering
    ? normalizeId(item)
    : "";
};

const getSubjectEntity = (
  item
) => {
  if (!item) {
    return null;
  }

  const offering =
    getSubjectOfferingEntity(item);

  if (
    offering &&
    typeof offering === "object"
  ) {
    return (
      offering?.subjectId ||
      offering?.subject ||
      null
    );
  }

  return (
    item?.gradesCriteria
      ?.subjectId ||
    item?.subjectId ||
    item?.subject ||
    null
  );
};

const getSubjectId = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  return normalizeId(subject);
};

const getSubjectName = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  if (
    subject &&
    typeof subject === "object"
  ) {
    return (
      subject?.subjectName ||
      subject?.name ||
      item?.subjectName ||
      item?.gradesCriteria
        ?.subjectName ||
      "مادة غير معروفة"
    );
  }

  return (
    item?.subjectName ||
    item?.gradesCriteria
      ?.subjectName ||
    "مادة غير معروفة"
  );
};

const getSubjectCode = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  if (
    subject &&
    typeof subject === "object"
  ) {
    return (
      subject?.subjectCode ||
      subject?.code ||
      item?.subjectCode ||
      ""
    );
  }

  return (
    item?.subjectCode ||
    ""
  );
};

// =====================================================
// CLASS
// =====================================================

const getClassName = (
  studentProfile
) => {
  const classData =
    studentProfile?.class ||
    studentProfile?.classId ||
    studentProfile
      ?.currentEnrollment
      ?.class ||
    studentProfile
      ?.currentEnrollment
      ?.classId;

  if (
    !classData ||
    typeof classData === "string"
  ) {
    return "";
  }

  const values = [];

  if (classData?.name) {
    values.push(
      classData.name
    );
  }

  if (
    classData?.roomNumber
  ) {
    values.push(
      `فصل ${classData.roomNumber}`
    );
  }

  if (
    classData?.gender ===
    "female"
  ) {
    values.push("بنات");
  }

  if (
    classData?.gender ===
    "male"
  ) {
    values.push("بنين");
  }

  return values.join(" • ");
};

// =====================================================
// STATUS HELPER
// =====================================================

const getAssignmentStatus = (
  exam
) => {
  if (exam?.hasTaken) {
    return "completed";
  }

  const apiStatus =
    String(
      exam?.status || ""
    ).toLowerCase();

  if (
    [
      "expired",
      "ended",
      "overdue",
    ].includes(apiStatus)
  ) {
    return "overdue";
  }

  if (
    [
      "available",
      "active",
    ].includes(apiStatus)
  ) {
    return "pending";
  }

  if (
    [
      "upcoming",
      "not_started",
    ].includes(apiStatus)
  ) {
    return "upcoming";
  }

  const now = new Date();

  const startDate =
    exam?.startDate
      ? new Date(
          exam.startDate
        )
      : null;

  const endDate =
    exam?.endDate
      ? new Date(
          exam.endDate
        )
      : null;

  if (
    startDate &&
    !Number.isNaN(
      startDate.getTime()
    ) &&
    now < startDate
  ) {
    return "upcoming";
  }

  if (
    endDate &&
    !Number.isNaN(
      endDate.getTime()
    ) &&
    now > endDate
  ) {
    return "overdue";
  }

  if (
    startDate &&
    endDate &&
    !Number.isNaN(
      startDate.getTime()
    ) &&
    !Number.isNaN(
      endDate.getTime()
    ) &&
    now >= startDate &&
    now <= endDate
  ) {
    return "pending";
  }

  return "upcoming";
};

const formatDate = (
  value
) => {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

// =====================================================
// MAIN
// =====================================================

const MyAssignments = () => {
  const navigate = useNavigate();

  const outletContext =
    useOutletContext() || {};

  const studentProfile =
    outletContext?.studentProfile ||
    null;

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  // ===================================================
  // API
  // ===================================================

  const {
    subjects: mySubjects,
    loading:
      loadingSubjects,
  } = useStudentSubjects();

  const {
    exams,
    loading:
      loadingAssignments,
  } = useStudentExams();

  const subjectsList =
    Array.isArray(
      mySubjects
    )
      ? mySubjects
      : [];

  const examsList =
    useMemo(() => {
      const list =
        Array.isArray(exams)
          ? exams
          : [];

      return list.filter(
        (exam) =>
          String(
            exam?.examType ||
              exam?.type ||
              ""
          )
            .trim()
            .toLowerCase() ===
          "assignment"
      );
    }, [exams]);

  // ===================================================
  // SUBJECT MAP
  //
  // Primary key = subjectOfferingId.
  // Secondary key = subjectId as a defensive fallback.
  // ===================================================

  const subjectMap =
    useMemo(() => {
      const map = new Map();

      subjectsList.forEach(
        (subject) => {
          const offeringId =
            getSubjectOfferingId(
              subject
            );

          const subjectId =
            getSubjectId(subject);

          const info = {
            name:
              getSubjectName(
                subject
              ),

            code:
              getSubjectCode(
                subject
              ),

            offeringId,

            subjectId,
          };

          if (offeringId) {
            map.set(
              `offering:${offeringId}`,
              info
            );
          }

          if (subjectId) {
            map.set(
              `subject:${subjectId}`,
              info
            );
          }
        }
      );

      return map;
    }, [subjectsList]);

  // ===================================================
  // ASSIGNMENTS
  // ===================================================

  const assignments =
    useMemo(() => {
      return examsList.map(
        (exam) => {
          const subjectOfferingId =
            getSubjectOfferingId(
              exam
            );

          const subjectId =
            getSubjectId(exam);

          const subjectInfo =
            (
              subjectOfferingId
                ? subjectMap.get(
                    `offering:${subjectOfferingId}`
                  )
                : null
            ) ||
            (
              subjectId
                ? subjectMap.get(
                    `subject:${subjectId}`
                  )
                : null
            );

          const subjectName =
            subjectInfo?.name ||
            getSubjectName(exam);

          const status =
            getAssignmentStatus(
              exam
            );

          return {
            id:
              normalizeId(exam),

            title:
              exam?.title ||
              `واجب - ${subjectName}`,

            subject:
              subjectName,

            subjectOfferingId,

            subjectId,

            startDate:
              formatDate(
                exam?.startDate
              ),

            endDate:
              formatDate(
                exam?.endDate
              ),

            duration:
              Number(exam?.duration) > 0
                ? `${exam.duration} دقيقة`
                : "غير محدد",

            status,

            hasTaken:
              Boolean(
                exam?.hasTaken
              ),

            apiStatus:
              exam?.status,

            examType:
              String(
                exam?.examType ||
                  exam?.type ||
                  "assignment"
              )
                .trim()
                .toLowerCase(),

            rawExam: exam,
          };
        }
      );
    }, [
      examsList,
      subjectMap,
    ]);

  // ===================================================
  // SUBJECT FILTERS
  // ===================================================

  const subjects =
    useMemo(() => {
      const seen = new Set();

      return subjectsList
        .map(
          (subject) => {
            const offeringId =
              getSubjectOfferingId(
                subject
              );

            const subjectId =
              getSubjectId(
                subject
              );

            const id =
              offeringId ||
              subjectId;

            const name =
              getSubjectName(
                subject
              );

            const code =
              getSubjectCode(
                subject
              );

            return {
              id,

              offeringId,

              subjectId,

              name: code
                ? `${name} (${code})`
                : name,
            };
          }
        )
        .filter((subject) => {
          if (!subject.id) {
            return false;
          }

          if (
            seen.has(subject.id)
          ) {
            return false;
          }

          seen.add(subject.id);

          return true;
        });
    }, [subjectsList]);

  // ===================================================
  // FILTER
  // ===================================================

  const afterSubjectFilter =
    useMemo(() => {
      if (
        !selectedSubject
      ) {
        return assignments;
      }

      return assignments.filter(
        (assignment) =>
          assignment.subjectOfferingId ===
            selectedSubject ||
          (
            !assignment.subjectOfferingId &&
            assignment.subjectId ===
              selectedSubject
          )
      );
    }, [
      assignments,
      selectedSubject,
    ]);

  const filtered =
    useMemo(() => {
      if (
        !selectedStatus
      ) {
        return afterSubjectFilter;
      }

      return afterSubjectFilter.filter(
        (assignment) =>
          assignment.status ===
          selectedStatus
      );
    }, [
      afterSubjectFilter,
      selectedStatus,
    ]);

  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(
      () => ({
        total:
          assignments.length,

        pending:
          assignments.filter(
            (item) =>
              item.status ===
              "pending"
          ).length,

        upcoming:
          assignments.filter(
            (item) =>
              item.status ===
              "upcoming"
          ).length,

        completed:
          assignments.filter(
            (item) =>
              item.status ===
              "completed"
          ).length,

        overdue:
          assignments.filter(
            (item) =>
              item.status ===
              "overdue"
          ).length,
      }),
      [assignments]
    );

  const className =
    getClassName(
      studentProfile
    );

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loadingSubjects ||
    loadingAssignments
  ) {
    return (
      <Container
        noSidebar={true}
      >
        <Stack spacing={1.4}>
          <Skeleton
            variant="rounded"
            height={110}
            sx={{
              borderRadius:
                "22px",
            }}
          />

          <Skeleton
            variant="rounded"
            height={68}
            sx={{
              borderRadius:
                "18px",
            }}
          />

          <Skeleton
            variant="rounded"
            height={340}
            sx={{
              borderRadius:
                "22px",
            }}
          />
        </Stack>
      </Container>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Container
      noSidebar={true}
    >
      <Box
        dir="rtl"
        sx={{
          width: "100%",
        }}
      >
        {/* =============================================
            HEADER
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.5,

            px: {
              xs: 1.4,
              sm: 1.8,
              md: 2.2,
            },

            py: {
              xs: 1.3,
              md: 1.5,
            },

            display: "flex",

            alignItems: {
              xs: "flex-start",
              lg: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              lg: "row",
            },

            gap: 1.3,

            borderRadius:
              "22px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 65%,#fff7ea 100%)",

            boxShadow:
              "0 10px 28px rgba(18,47,77,.045)",
          }}
        >
          {/* TITLE */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard"
                )
              }
              sx={{
                width: 41,
                height: 41,

                borderRadius:
                  "13px",

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f2f6fa",

                border:
                  "1px solid rgba(36,74,112,.06)",

                "&:hover": {
                  backgroundColor:
                    "#e8f0f7",
                },
              }}
            >
              <ArrowForwardRounded />
            </IconButton>

            <Box
              sx={{
                width: 45,
                height: 45,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                placeItems:
                  "center",

                borderRadius:
                  "14px",

                color:
                  COLORS.orange,

                backgroundColor:
                  COLORS.orangeLight,
              }}
            >
              <AssignmentRounded
                sx={{
                  fontSize: 22,
                }}
              />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "18px",
                    md: "21px",
                  },

                  fontWeight: 900,
                }}
              >
                واجباتي
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color:
                    "#909ba6",

                  fontSize: {
                    xs: "8px",
                    md: "9px",
                  },
                }}
              >
                تابع واجباتك
                ومواعيد التسليم
                بسهولة
              </Typography>
            </Box>
          </Stack>

          {/* HEADER STATS */}

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              width: {
                xs: "100%",
                lg: "auto",
              },

              flexWrap: "wrap",

              gap: 0.6,
            }}
          >
            <HeaderBadge
              icon={
                AssignmentRounded
              }
              label={`${stats.total} واجبات`}
              color={
                COLORS.blue
              }
              background={
                COLORS.blueLight
              }
            />

            <HeaderBadge
              icon={
                EventAvailableRounded
              }
              label={`${stats.pending} متاح الآن`}
              color={
                COLORS.orange
              }
              background={
                COLORS.orangeLight
              }
            />

            <HeaderBadge
              icon={
                HourglassBottomRounded
              }
              label={`${stats.upcoming} قادم`}
              color={
                COLORS.purple
              }
              background={
                COLORS.purpleLight
              }
            />

            <HeaderBadge
              icon={
                CheckCircleRounded
              }
              label={`${stats.completed} مكتمل`}
              color={
                COLORS.green
              }
              background={
                COLORS.greenLight
              }
            />

            <HeaderBadge
              icon={
                ErrorOutlineRounded
              }
              label={`${stats.overdue} منتهي`}
              color={
                COLORS.red
              }
              background={
                COLORS.redLight
              }
            />

            {className && (
              <HeaderBadge
                icon={
                  SchoolRounded
                }
                label={
                  className
                }
                color={
                  COLORS.navy
                }
                background="#f5f7f9"
                iconColor={
                  COLORS.gold
                }
              />
            )}
          </Stack>
        </Paper>

        {/* =============================================
            FILTER
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.5,

            p: {
              xs: 1.1,
              sm: 1.25,
            },

            display: "flex",

            alignItems: {
              xs: "stretch",
              md: "center",
            },

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1,

            borderRadius:
              "17px",

            border:
              "1px solid rgba(18,47,77,.055)",

            backgroundColor:
              "#fff",

            boxShadow:
              "0 5px 16px rgba(18,47,77,.025)",
          }}
        >
          {/* FILTER TITLE */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
          >
            <TuneRounded
              sx={{
                color:
                  COLORS.blue,

                fontSize: 18,
              }}
            />

            <Typography
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize:
                  "9px",

                fontWeight: 900,

                whiteSpace:
                  "nowrap",
              }}
            >
              تصفية الواجبات
            </Typography>
          </Stack>

          {/* SUBJECT */}

          <Select
            size="small"
            value={
              selectedSubject
            }
            onChange={(event) =>
              setSelectedSubject(
                event.target.value
              )
            }
            displayEmpty
            sx={{
              minWidth: {
                xs: "100%",
                md: 210,
              },

              height: 38,

              borderRadius:
                "11px",

              backgroundColor:
                "#f8fafb",

              color:
                COLORS.navy,

              fontSize: "8px",

              fontWeight: 800,

              "& fieldset": {
                borderColor:
                  "rgba(36,74,112,.08)",
              },

              "&:hover fieldset":
                {
                  borderColor:
                    "rgba(36,74,112,.15) !important",
                },
            }}
          >
            <MenuItem
              value=""
              sx={{
                fontSize: "9px",
              }}
            >
              كل المواد
            </MenuItem>

            {subjects.map(
              (subject) => (
                <MenuItem
                  key={
                    subject.id
                  }
                  value={
                    subject.id
                  }
                  sx={{
                    fontSize:
                      "9px",
                  }}
                >
                  {subject.name}
                </MenuItem>
              )
            )}
          </Select>

          {/* STATUS FILTER */}

          <Box
            sx={{
              display: "flex",

              alignItems:
                "center",

              flexWrap: "wrap",

              gap: 0.5,

              flex: 1,
            }}
          >
            <FilterChip
              active={
                selectedStatus ===
                ""
              }
              label="الكل"
              count={
                afterSubjectFilter.length
              }
              onClick={() =>
                setSelectedStatus(
                  ""
                )
              }
            />

            {Object.entries(
              STATUS_UI
            ).map(
              ([
                statusId,
                status,
              ]) => {
                const count =
                  afterSubjectFilter.filter(
                    (assignment) =>
                      assignment.status ===
                      statusId
                  ).length;

                return (
                  <FilterChip
                    key={
                      statusId
                    }
                    active={
                      selectedStatus ===
                      statusId
                    }
                    label={
                      status.label
                    }
                    count={
                      count
                    }
                    onClick={() =>
                      setSelectedStatus(
                        statusId
                      )
                    }
                  />
                );
              }
            )}
          </Box>

          {/* RESULTS */}

          <Typography
            sx={{
              color:
                "#99a3ac",

              fontSize: "7.5px",

              whiteSpace:
                "nowrap",
            }}
          >
            {filtered.length} نتيجة
          </Typography>
        </Paper>

        {/* =============================================
            CONTENT
        ============================================= */}

        {filtered.length >
        0 ? (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: 0.9,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      COLORS.deepNavy,

                    fontSize: {
                      xs: "13px",
                      md: "15px",
                    },

                    fontWeight: 900,
                  }}
                >
                  قائمة الواجبات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.1,

                    color:
                      "#98a2ac",

                    fontSize:
                      "7.5px",
                  }}
                >
                  اضغط على الواجب
                  لعرض التفاصيل
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                    lg: "repeat(3,minmax(0,1fr))",
                    xl: "repeat(4,minmax(0,1fr))",
                  },

                gap: 1,
              }}
            >
              {filtered.map(
                (item) => (
                  <AssignmentCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    actionLabel={
                      item.status ===
                      "completed"
                        ? "تم تسليم الواجب"
                        : item.status ===
                            "overdue"
                          ? "انتهى الواجب"
                          : item.status ===
                              "upcoming"
                            ? "لم يبدأ بعد"
                            : "ابدأ الواجب"
                    }
                    actionDisabled={
                      item.status !==
                      "pending"
                    }
                    onAction={() =>
                      navigate(
                        `/student-dashboard/assignments/${item.id}/quiz`,
                        {
                          state: {
                            quiz:
                              item,

                            assignment:
                              item,

                            rawExam:
                              item.rawExam,
                          },
                        }
                      )
                    }
                  />
                )
              )}
            </Box>
          </>
        ) : (
          <EmptyAssignments
            total={
              assignments.length
            }
            filtering={
              Boolean(
                selectedSubject ||
                  selectedStatus
              )
            }
          />
        )}
      </Box>
    </Container>
  );
};

// =====================================================
// HEADER BADGE
// =====================================================

const HeaderBadge = ({
  icon: Icon,
  label,
  color,
  background,
  iconColor,
}) => (
  <Chip
    icon={
      <Icon />
    }
    label={label}
    sx={{
      height: 32,

      color,

      backgroundColor:
        background,

      border:
        "1px solid rgba(36,74,112,.055)",

      fontSize: "7.5px",

      fontWeight: 900,

      "& .MuiChip-label": {
        px: 0.9,
      },

      "& .MuiChip-icon": {
        mr: 0.5,
        ml: -0.1,

        color:
          iconColor ||
          color,

        fontSize: "15px",
      },
    }}
  />
);

// =====================================================
// FILTER CHIP
// =====================================================

const FilterChip = ({
  active,
  label,
  count,
  onClick,
}) => (
  <Chip
    onClick={onClick}
    label={`${label} (${count})`}
    sx={{
      height: 31,

      cursor: "pointer",

      color: active
        ? "#fff"
        : COLORS.navy,

      backgroundColor:
        active
          ? COLORS.navy
          : "#f7f9fb",

      border:
        active
          ? "1px solid #244a70"
          : "1px solid rgba(36,74,112,.07)",

      fontSize: "7.5px",

      fontWeight: 800,

      "& .MuiChip-label": {
        px: 1,
      },

      "&:hover": {
        backgroundColor:
          active
            ? "#1b3d61"
            : "#f0f4f7",
      },
    }}
  />
);

// =====================================================
// EMPTY
// =====================================================

const EmptyAssignments = ({
  total,
  filtering,
}) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: {
        xs: 290,
        md: 340,
      },

      px: 2,
      py: 4,

      display: "grid",

      placeItems: "center",

      textAlign: "center",

      borderRadius:
        "22px",

      border:
        "1px dashed rgba(36,74,112,.14)",

      background:
        "linear-gradient(145deg,#ffffff,#f9fbfd)",
    }}
  >
    <Box>
      <Box
        sx={{
          width: 76,
          height: 76,

          mx: "auto",
          mb: 1.3,

          display: "grid",

          placeItems:
            "center",

          borderRadius:
            "22px",

          color:
            COLORS.orange,

          backgroundColor:
            COLORS.orangeLight,
        }}
      >
        <AssignmentRounded
          sx={{
            fontSize: 36,
          }}
        />
      </Box>

      <Typography
        sx={{
          color:
            COLORS.deepNavy,

          fontSize: {
            xs: "14px",
            md: "16px",
          },

          fontWeight: 900,
        }}
      >
        {filtering
          ? "لا توجد واجبات مطابقة"
          : "لا توجد واجبات حاليًا"}
      </Typography>

      <Typography
        sx={{
          maxWidth: 410,

          mt: 0.5,

          color:
            "#8d99a5",

          fontSize: {
            xs: "8px",
            md: "9px",
          },

          lineHeight: 1.8,
        }}
      >
        {filtering
          ? "جرّب تغيير المادة أو حالة الواجب لعرض نتائج أخرى."
          : total === 0
            ? "عند إضافة واجبات جديدة لموادك ستظهر هنا تلقائيًا."
            : "لا توجد واجبات في هذا القسم حاليًا."}
      </Typography>
    </Box>
  </Paper>
);

export default MyAssignments;