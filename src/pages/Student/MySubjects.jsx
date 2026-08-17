import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardRounded,
  AutoStoriesRounded,
  ChevronLeftRounded,
  MenuBookRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import Container from "@/components/Container/Container";

import {
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  green: "#43a978",
  greenLight: "#eaf8f1",

  orange: "#e69a43",
  orangeLight: "#fff3e4",

  purple: "#8068c9",
  purpleLight: "#f3efff",

  pink: "#d77993",
  pinkLight: "#fff0f4",
};

const SUBJECT_STYLES = [
  {
    color: COLORS.blue,
    background: COLORS.blueLight,
    border: "#d9eafb",
  },
  {
    color: COLORS.green,
    background: COLORS.greenLight,
    border: "#d7eee3",
  },
  {
    color: COLORS.orange,
    background: COLORS.orangeLight,
    border: "#f4e0c6",
  },
  {
    color: COLORS.purple,
    background: COLORS.purpleLight,
    border: "#e3dcfb",
  },
  {
    color: COLORS.pink,
    background: COLORS.pinkLight,
    border: "#f2dde4",
  },
];

// =====================================================
// HELPERS
// =====================================================

const getNestedSubject = (item) => {
  if (!item) {
    return {};
  }

  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering ||
    item;

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    item?.subjectId ||
    item?.subject ||
    item;

  return {
    offering,
    subject,
  };
};

const getSubjectName = (item) => {
  const {
    offering,
    subject,
  } = getNestedSubject(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectName ||
      offering?.subjectName ||
      "مادة دراسية"
    );
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    offering?.subjectName ||
    item?.subjectName ||
    item?.name ||
    "مادة دراسية"
  );
};

const getSubjectCode = (item) => {
  const {
    offering,
    subject,
  } = getNestedSubject(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectCode ||
      offering?.subjectCode ||
      ""
    );
  }

  return (
    subject?.subjectCode ||
    subject?.code ||
    offering?.subjectCode ||
    item?.subjectCode ||
    item?.code ||
    ""
  );
};

const getSubjectId = (item) => {
  if (!item) {
    return "";
  }

  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    item?.offering;

  if (
    typeof offering === "string"
  ) {
    return offering;
  }

  return (
    offering?._id ||
    offering?.id ||
    item?.subjectOfferingId?._id ||
    item?.subjectOfferingId?.id ||
    item?._id ||
    item?.id ||
    ""
  );
};

const getClassName = (
  studentProfile,
) => {
  if (!studentProfile) {
    return "";
  }

  const classData =
    studentProfile?.classId ||
    studentProfile?.class ||
    studentProfile
      ?.currentEnrollment
      ?.classId ||
    studentProfile
      ?.currentEnrollment
      ?.class;

  if (
    !classData ||
    typeof classData === "string"
  ) {
    return "";
  }

  return (
    classData?.name ||
    classData?.className ||
    (classData?.roomNumber
      ? `الفصل ${classData.roomNumber}`
      : "")
  );
};

// =====================================================
// COMPONENT
// =====================================================

const MySubjects = () => {
  const navigate = useNavigate();

  const outletContext =
    useOutletContext() || {};

  const studentProfile =
    outletContext?.studentProfile ||
    null;

  const {
    subjects,
    loading,
  } = useStudentSubjects();

  const subjectList =
    Array.isArray(subjects)
      ? subjects
      : [];

  const totalSubjects =
    subjectList.length;

  const className =
    getClassName(
      studentProfile,
    );

  const hasClass =
    Boolean(
      studentProfile?.classId ||
        studentProfile?.class ||
        studentProfile
          ?.currentEnrollment
          ?.classId ||
        studentProfile
          ?.currentEnrollment
          ?.class,
    );

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <Container
        noSidebar={true}
      >
        <Stack spacing={1.5}>
          <Skeleton
            variant="rounded"
            height={105}
            sx={{
              borderRadius:
                "22px",
            }}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  md: "repeat(3,1fr)",
                  lg: "repeat(4,1fr)",
                },

              gap: 1.2,
            }}
          >
            {[
              1,
              2,
              3,
              4,
            ].map(
              (item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={165}
                  sx={{
                    borderRadius:
                      "20px",
                  }}
                />
              ),
            )}
          </Box>
        </Stack>
      </Container>
    );
  }

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
        {/* ===============================================
            PAGE HEADER
        =============================================== */}

        <Paper
          elevation={0}
          sx={{
            mb: 2,

            px: {
              xs: 1.6,
              sm: 2.1,
              md: 2.5,
            },

            py: {
              xs: 1.6,
              md: 1.9,
            },

            display: "flex",

            alignItems: {
              xs: "flex-start",
              sm: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: 1.5,

            borderRadius:
              "22px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 62%,#f2f7fc 100%)",

            boxShadow:
              "0 10px 28px rgba(18,47,77,.045)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.1}
          >
            {/* BACK */}

            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard",
                )
              }
              sx={{
                width: 42,
                height: 42,

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

            {/* ICON */}

            <Box
              sx={{
                width: 46,
                height: 46,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                placeItems:
                  "center",

                borderRadius:
                  "14px",

                color:
                  COLORS.blue,

                backgroundColor:
                  COLORS.blueLight,
              }}
            >
              <AutoStoriesRounded
                sx={{
                  fontSize: 23,
                }}
              />
            </Box>

            {/* TITLE */}

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
                موادي الدراسية
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color:
                    "#909ba6",

                  fontSize: {
                    xs: "9px",
                    md: "10px",
                  },
                }}
              >
                تصفح موادك وتابع
                مستواك الدراسي
              </Typography>
            </Box>
          </Stack>

          {/* CLASS */}

          {className && (
            <Chip
              icon={
                <SchoolRounded />
              }
              label={
                className
              }
              sx={{
                height: 33,

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f5f8fa",

                border:
                  "1px solid rgba(36,74,112,.07)",

                fontSize:
                  "9px",

                fontWeight: 800,

                "& .MuiChip-icon":
                  {
                    color:
                      COLORS.gold,

                    fontSize:
                      "17px",
                  },
              }}
            />
          )}
        </Paper>

        {/* ===============================================
            SUMMARY
        =============================================== */}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
            },

            gap: 1,

            mb: 2,
          }}
        >
          {/* TOTAL */}

          <Paper
            elevation={0}
            sx={{
              p: 1.3,

              display: "flex",

              alignItems:
                "center",

              gap: 1,

              borderRadius:
                "16px",

              border:
                "1px solid rgba(18,47,77,.05)",

              backgroundColor:
                "#fff",
            }}
          >
            <Box
              sx={{
                width: 41,
                height: 41,

                display: "grid",

                placeItems:
                  "center",

                flexShrink: 0,

                borderRadius:
                  "12px",

                color:
                  COLORS.blue,

                backgroundColor:
                  COLORS.blueLight,
              }}
            >
              <MenuBookRounded
                sx={{
                  fontSize: 21,
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize:
                    "19px",

                  lineHeight: 1,

                  fontWeight: 900,
                }}
              >
                {totalSubjects}
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,

                  color:
                    "#929da7",

                  fontSize: "8px",
                }}
              >
                إجمالي المواد
              </Typography>
            </Box>
          </Paper>

          {/* CLASS STATUS */}

          <Paper
            elevation={0}
            sx={{
              p: 1.3,

              display: {
                xs: "none",
                sm: "flex",
              },

              alignItems:
                "center",

              gap: 1,

              borderRadius:
                "16px",

              border:
                "1px solid rgba(18,47,77,.05)",

              backgroundColor:
                "#fff",
            }}
          >
            <Box
              sx={{
                width: 41,
                height: 41,

                display: "grid",

                placeItems:
                  "center",

                flexShrink: 0,

                borderRadius:
                  "12px",

                color: hasClass
                  ? COLORS.green
                  : COLORS.orange,

                backgroundColor:
                  hasClass
                    ? COLORS.greenLight
                    : COLORS.orangeLight,
              }}
            >
              <SchoolRounded
                sx={{
                  fontSize: 21,
                }}
              />
            </Box>

            <Box>
              <Typography
                noWrap
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize:
                    "11px",

                  fontWeight: 900,
                }}
              >
                {className ||
                  (hasClass
                    ? "الفصل الدراسي"
                    : "غير مسجل بفصل")}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,

                  color:
                    "#929da7",

                  fontSize: "8px",
                }}
              >
                الفصل الحالي
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* ===============================================
            SUBJECTS
        =============================================== */}

        {subjectList.length >
        0 ? (
          <>
            <Typography
              sx={{
                mb: 1,

                color:
                  COLORS.deepNavy,

                fontSize: {
                  xs: "14px",
                  md: "16px",
                },

                fontWeight: 900,
              }}
            >
              المواد المسجلة
            </Typography>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                    md: "repeat(3,minmax(0,1fr))",
                    lg: "repeat(4,minmax(0,1fr))",
                  },

                gap: {
                  xs: 1,
                  md: 1.2,
                },
              }}
            >
              {subjectList.map(
                (
                  subject,
                  index,
                ) => {
                  const style =
                    SUBJECT_STYLES[
                      index %
                        SUBJECT_STYLES.length
                    ];

                  const id =
                    getSubjectId(
                      subject,
                    );

                  const name =
                    getSubjectName(
                      subject,
                    );

                  const code =
                    getSubjectCode(
                      subject,
                    );

                  return (
                    <Paper
                      key={
                        id ||
                        `${name}-${index}`
                      }
                      elevation={0}
                      onClick={() => {
                        if (!id) {
                          return;
                        }

                        navigate(
                          `/student-dashboard/subjects/${id}`,
                        );
                      }}
                      sx={{
                        position:
                          "relative",

                        overflow:
                          "hidden",

                        minHeight:
                          165,

                        p: 1.6,

                        cursor: id
                          ? "pointer"
                          : "default",

                        borderRadius:
                          "20px",

                        border: `1px solid ${style.border}`,

                        backgroundColor:
                          "#fff",

                        transition:
                          "transform .2s ease, box-shadow .2s ease",

                        "&:hover":
                          id
                            ? {
                                transform:
                                  "translateY(-4px)",

                                boxShadow:
                                  "0 14px 30px rgba(18,47,77,.08)",
                              }
                            : {},
                      }}
                    >
                      {/* DECORATION */}

                      <Box
                        sx={{
                          position:
                            "absolute",

                          width: 100,
                          height: 100,

                          left: -45,
                          bottom: -55,

                          borderRadius:
                            "50%",

                          backgroundColor:
                            style.background,
                        }}
                      />

                      {/* ICON */}

                      <Box
                        sx={{
                          width: 47,
                          height: 47,

                          display:
                            "grid",

                          placeItems:
                            "center",

                          mb: 1.3,

                          borderRadius:
                            "14px",

                          color:
                            style.color,

                          backgroundColor:
                            style.background,
                        }}
                      >
                        <MenuBookRounded
                          sx={{
                            fontSize:
                              24,
                          }}
                        />
                      </Box>

                      {/* NAME */}

                      <Typography
                        noWrap
                        sx={{
                          color:
                            COLORS.deepNavy,

                          fontSize:
                            "12px",

                          fontWeight:
                            900,
                        }}
                      >
                        {name}
                      </Typography>

                      {/* CODE */}

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.35,

                          color:
                            "#929da7",

                          fontSize:
                            "8px",
                        }}
                      >
                        {code ||
                          "مادة دراسية"}
                      </Typography>

                      {/* FOOTER */}

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          position:
                            "absolute",

                          right: 1.6,
                          left: 1.4,
                          bottom: 1.3,
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              style.color,

                            fontSize:
                              "8px",

                            fontWeight:
                              800,
                          }}
                        >
                          عرض التفاصيل
                        </Typography>

                        <Box
                          sx={{
                            width: 29,
                            height: 29,

                            display:
                              "grid",

                            placeItems:
                              "center",

                            borderRadius:
                              "9px",

                            color:
                              style.color,

                            backgroundColor:
                              style.background,
                          }}
                        >
                          <ChevronLeftRounded
                            sx={{
                              fontSize:
                                17,
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  );
                },
              )}
            </Box>
          </>
        ) : (
          /* =============================================
             EMPTY STATE
          ============================================= */

          <Paper
            elevation={0}
            sx={{
              minHeight: {
                xs: 300,
                md: 360,
              },

              px: 2,
              py: 5,

              display: "grid",

              placeItems:
                "center",

              textAlign:
                "center",

              borderRadius:
                "24px",

              border:
                "1px dashed rgba(36,74,112,.14)",

              background:
                "linear-gradient(145deg,#ffffff,#f8fbfd)",
            }}
          >
            <Box>
              <Box
                sx={{
                  width: 82,
                  height: 82,

                  mx: "auto",
                  mb: 1.5,

                  display: "grid",

                  placeItems:
                    "center",

                  borderRadius:
                    "24px",

                  color:
                    hasClass
                      ? COLORS.blue
                      : COLORS.orange,

                  backgroundColor:
                    hasClass
                      ? COLORS.blueLight
                      : COLORS.orangeLight,
                }}
              >
                {hasClass ? (
                  <MenuBookRounded
                    sx={{
                      fontSize:
                        40,
                    }}
                  />
                ) : (
                  <SchoolRounded
                    sx={{
                      fontSize:
                        40,
                    }}
                  />
                )}
              </Box>

              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "15px",
                    md: "17px",
                  },

                  fontWeight: 900,
                }}
              >
                {hasClass
                  ? "لا توجد مواد دراسية حتى الآن"
                  : "لم يتم تسجيلك في فصل بعد"}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 410,

                  mt: 0.6,

                  color:
                    "#8d99a5",

                  fontSize: {
                    xs: "9px",
                    md: "10px",
                  },

                  lineHeight: 1.8,
                }}
              >
                {hasClass
                  ? "ستظهر المواد هنا تلقائيًا بمجرد إضافتها إلى فصلك الدراسي."
                  : "ستظهر موادك الدراسية هنا تلقائيًا بعد تسجيلك في أحد الفصول."}
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default MySubjects;