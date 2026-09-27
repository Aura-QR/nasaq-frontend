import {
  useEffect,
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
  HourglassBottomRounded,
  MenuBookRounded,
  PendingActionsRounded,
  SchoolRounded,
  TuneRounded,
} from "@mui/icons-material";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import {
  useStudentProjects,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

import {
  fetchProjectSubmission,
} from "@/APIs/student";

import ProjectCard from "./components/ProjectCard";

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
// SUBJECT HELPERS
// =====================================================

const getSubjectEntity = (item) => {
  if (!item) {
    return null;
  }

  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering;

  if (
    offering &&
    typeof offering === "object"
  ) {
    return (
      offering?.subjectId ||
      offering?.subject ||
      offering
    );
  }

  return (
    item?.subjectId ||
    item?.subject ||
    item
  );
};

const getSubjectId = (item) => {
  const subject =
    getSubjectEntity(item);

  return (
    normalizeId(subject) ||
    normalizeId(
      item?.subjectId
    )
  );
};

const getSubjectName = (item) => {
  const subject =
    getSubjectEntity(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectName ||
      "مادة غير معروفة"
    );
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    "مادة غير معروفة"
  );
};

const getSubjectCode = (item) => {
  const subject =
    getSubjectEntity(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectCode ||
      ""
    );
  }

  return (
    subject?.subjectCode ||
    subject?.code ||
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
    classData?.gender === "female"
  ) {
    values.push("بنات");
  }

  if (
    classData?.gender === "male"
  ) {
    values.push("بنين");
  }

  return values.join(" • ");
};

// =====================================================
// DATE
// =====================================================

const formatDate = (value) => {
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

const MyProjects = () => {
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
    submissions,
    setSubmissions,
  ] = useState({});

  const [
    loadingSubmissions,
    setLoadingSubmissions,
  ] = useState(false);

  // ===================================================
  // API
  // ===================================================

  const {
    subjects: mySubjects,
    loading:
      loadingSubjects,
  } = useStudentSubjects();

  const {
    projects,
    loading:
      loadingProjects,
  } = useStudentProjects();

  const subjectsList =
    Array.isArray(
      mySubjects
    )
      ? mySubjects
      : [];

  const projectsList =
    Array.isArray(projects)
      ? projects
      : [];

  // ===================================================
  // SUBMISSIONS
  // ===================================================

  useEffect(() => {
    if (
      !projectsList.length
    ) {
      setSubmissions({});
      return;
    }

    let mounted = true;

    const fetchAll =
      async () => {
        setLoadingSubmissions(
          true
        );

        try {
          const results =
            await Promise.allSettled(
              projectsList.map(
                async (
                  project
                ) => {
                  const projectId =
                    normalizeId(
                      project
                    );

                  if (!projectId) {
                    return {
                      id: "",
                      data: null,
                    };
                  }

                  const res =
                    await fetchProjectSubmission(
                      projectId
                    );

                  return {
                    id: projectId,

                    data:
                      res?.status
                        ? res?.data ||
                          null
                        : null,
                  };
                }
              )
            );

          if (!mounted) {
            return;
          }

          const map = {};

          results.forEach(
            (result) => {
              if (
                result.status !==
                "fulfilled"
              ) {
                return;
              }

              const {
                id,
                data,
              } = result.value;

              if (id) {
                map[id] =
                  data;
              }
            }
          );

          setSubmissions(map);
        } catch (error) {
          console.error(
            "Project submissions:",
            error
          );

          if (mounted) {
            setSubmissions({});
          }
        } finally {
          if (mounted) {
            setLoadingSubmissions(
              false
            );
          }
        }
      };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [projects]);

  // ===================================================
  // SUBJECT MAP
  // ===================================================

  const subjectMap =
    useMemo(() => {
      const map =
        new Map();

      subjectsList.forEach(
        (subject) => {
          const id =
            getSubjectId(
              subject
            );

          if (!id) {
            return;
          }

          map.set(id, {
            name:
              getSubjectName(
                subject
              ),

            code:
              getSubjectCode(
                subject
              ),
          });
        }
      );

      return map;
    }, [subjectsList]);

  // ===================================================
  // PROJECTS
  // ===================================================

  const mappedProjects =
    useMemo(() => {
      return projectsList.map(
        (project) => {
          const id =
            normalizeId(
              project
            );

          const subjectId =
            getSubjectId(
              project
            );

          const subjectInfo =
            subjectMap.get(
              subjectId
            );

          const subjectName =
            subjectInfo?.name ||
            getSubjectName(
              project
            );

          const dueDate =
            project?.dueDate
              ? new Date(
                  project.dueDate
                )
              : null;

          const isValidDueDate =
            dueDate &&
            !Number.isNaN(
              dueDate.getTime()
            );

          const isOverdue =
            isValidDueDate &&
            dueDate.getTime() <
              Date.now();

          const filesCount =
            Array.isArray(
              project?.files
            )
              ? project.files
                  .length
              : 0;

          const filesLabel =
            filesCount === 1
              ? "1 ملف مرفق"
              : `${filesCount} ملفات مرفقة`;

          const submission =
            submissions[id];

          const isGraded =
            submission &&
            submission
              ?.achievedGrade !==
              null &&
            submission
              ?.achievedGrade !==
              undefined;

          const isSubmitted =
            submission &&
            Array.isArray(
              submission?.files
            ) &&
            submission.files
              .length > 0;

          let status =
            "pending";

          if (isGraded) {
            status =
              "graded";
          } else if (
            isSubmitted
          ) {
            status =
              "submitted";
          } else if (
            isOverdue
          ) {
            status =
              "overdue";
          }

          return {
            id,

            title:
              project?.title ||
              `مشروع - ${subjectName}`,

            subject:
              subjectName,

            subjectId,

            startDate:
              formatDate(
                project?.createdAt
              ),

            endDate:
              isValidDueDate
                ? formatDate(
                    dueDate
                  )
                : "غير محدد",

            filesLabel,

            status,

            achievedGrade:
              submission
                ?.achievedGrade ??
              null,

            maxGrade:
              submission
                ?.maxGrade ??
              project?.maxGrade ??
              null,

            rawProject:
              project,

            submission,
          };
        }
      );
    }, [
      projectsList,
      subjectMap,
      submissions,
    ]);

  // ===================================================
  // SUBJECT FILTERS
  // ===================================================

  const subjects =
    useMemo(() => {
      return subjectsList
        .map(
          (subject) => {
            const id =
              getSubjectId(
                subject
              );

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

              name: code
                ? `${name} (${code})`
                : name,
            };
          }
        )
        .filter(
          (subject) =>
            Boolean(
              subject.id
            )
        );
    }, [subjectsList]);

  // ===================================================
  // FILTER
  // ===================================================

  const filtered =
    useMemo(() => {
      if (
        !selectedSubject
      ) {
        return mappedProjects;
      }

      return mappedProjects.filter(
        (project) =>
          project.subjectId ===
          selectedSubject
      );
    }, [
      mappedProjects,
      selectedSubject,
    ]);

  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(
      () => ({
        total:
          mappedProjects.length,

        pending:
          mappedProjects.filter(
            (project) =>
              project.status ===
                "pending" ||
              project.status ===
                "overdue"
          ).length,

        submitted:
          mappedProjects.filter(
            (project) =>
              project.status ===
              "submitted"
          ).length,

        graded:
          mappedProjects.filter(
            (project) =>
              project.status ===
              "graded"
          ).length,
      }),
      [mappedProjects]
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
    loadingProjects
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
            height={64}
            sx={{
              borderRadius:
                "17px",
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
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 65%,#f3efff 100%)",

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
                  COLORS.purple,

                backgroundColor:
                  COLORS.purpleLight,
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
                مشاريعي
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
                تابع مشاريعك
                وتسليماتك ونتائجك
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
              label={`${stats.total} مشاريع`}
              color={
                COLORS.blue
              }
              background={
                COLORS.blueLight
              }
            />

            <HeaderBadge
              icon={
                HourglassBottomRounded
              }
              label={`${stats.pending} لم يُسلّم`}
              color={
                COLORS.orange
              }
              background={
                COLORS.orangeLight
              }
            />

            <HeaderBadge
              icon={
                PendingActionsRounded
              }
              label={`${stats.submitted} بانتظار التصحيح`}
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
              label={`${stats.graded} تم التصحيح`}
              color={
                COLORS.green
              }
              background={
                COLORS.greenLight
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
              تصفية المشاريع
            </Typography>
          </Stack>

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
                md: 230,
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

          {/* QUICK SUBJECTS */}

          <Box
            sx={{
              display: "flex",

              flexWrap: "wrap",

              gap: 0.5,

              flex: 1,
            }}
          >
            <FilterChip
              active={
                selectedSubject ===
                ""
              }
              label="الكل"
              count={
                mappedProjects.length
              }
              onClick={() =>
                setSelectedSubject(
                  ""
                )
              }
            />

            {subjects.map(
              (subject) => {
                const count =
                  mappedProjects.filter(
                    (project) =>
                      project.subjectId ===
                      subject.id
                  ).length;

                return (
                  <FilterChip
                    key={
                      subject.id
                    }
                    active={
                      selectedSubject ===
                      subject.id
                    }
                    label={
                      subject.name
                    }
                    count={
                      count
                    }
                    onClick={() =>
                      setSelectedSubject(
                        subject.id
                      )
                    }
                  />
                );
              }
            )}
          </Box>

          <Typography
            sx={{
              color:
                "#99a3ac",

              fontSize:
                "7.5px",

              whiteSpace:
                "nowrap",
            }}
          >
            {filtered.length} نتيجة
          </Typography>
        </Paper>

        {/* =============================================
            PROJECTS
        ============================================= */}

        {filtered.length > 0 ? (
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
                  قائمة المشاريع
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
                  تابع تفاصيل
                  المشروع وموعد
                  التسليم
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
                  <ProjectCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    loadingSubmission={
                      loadingSubmissions
                    }
                    onAction={() =>
                      navigate(
                        `/student-dashboard/projects/${item.id}`,
                        {
                          state: {
                            project:
                              item.rawProject,

                            subjectName:
                              item.subject,
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
          <EmptyProjects
            filtering={
              Boolean(
                selectedSubject
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
    icon={<Icon />}
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

const EmptyProjects = ({
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

      placeItems:
        "center",

      textAlign:
        "center",

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
            COLORS.purple,

          backgroundColor:
            COLORS.purpleLight,
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
          ? "لا توجد مشاريع لهذه المادة"
          : "لا توجد مشاريع حاليًا"}
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
          ? "جرّب اختيار مادة أخرى لعرض المشاريع الخاصة بها."
          : "عند إضافة مشروع جديد لموادك سيظهر هنا تلقائيًا مع موعد التسليم."}
      </Typography>
    </Box>
  </Paper>
);

export default MyProjects;