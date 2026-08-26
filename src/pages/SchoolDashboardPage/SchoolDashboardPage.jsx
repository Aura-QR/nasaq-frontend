import {
  ArrowBackRounded,
  GroupsRounded,
  MenuBookRounded,
  RefreshRounded,
  SchoolRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSchoolDashboard,
} from "@/APIs/school/dashboard";

import {
  ROLES,
} from "@/shared/auth/roles";

import {
  getStoredPermissions,
  hasPermission,
} from "@/shared/auth/permissions";

import {
  extractDashboardMetrics,
} from "@/utils/school/dashboardData";

import {
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const formatMetric = (
  value
) =>
  value === null ||
  value === undefined
    ? "—"
    : new Intl.NumberFormat(
        "ar-EG"
      ).format(value);

const MetricCard = ({
  title,
  value,
  icon,
  loading,
}) => (
  <Box
    sx={{
      minHeight: 66,
      px: 1,
      py: 0.85,

      display: "flex",
      alignItems:
        "center",

      gap: 0.75,

      borderRadius:
        "13px",

      backgroundColor:
        "#ffffff",

      border:
        "1px solid #ded8cd",

      boxShadow:
        "0 6px 16px rgba(36,74,112,0.03)",

      transition:
        "transform 0.2s ease, border-color 0.2s ease",

      "&:hover": {
        transform:
          "translateY(-2px)",

        borderColor:
          "rgba(211,164,79,0.48)",
      },
    }}
  >
    <Box
      sx={{
        width: 34,
        height: 34,

        flexShrink: 0,

        display: "grid",
        placeItems:
          "center",

        borderRadius:
          "10px",

        color:
          "#b78430",

        backgroundColor:
          "#fbf0d8",

        "& svg": {
          fontSize: 17,
        },
      }}
    >
      {icon}
    </Box>

    <Box
      sx={{
        minWidth: 0,
      }}
    >
      <Typography
        noWrap
        sx={{
          color:
            "#7e8791",

          fontSize:
            "7.2px",

          fontWeight:
            700,
        }}
      >
        {title}
      </Typography>

      {loading ? (
        <Skeleton
          width={38}
          height={22}
        />
      ) : (
        <Typography
          sx={{
            mt: 0.05,

            color:
              "#122f4d",

            fontSize:
              "16px",

            fontWeight:
              800,

            lineHeight: 1.15,
          }}
        >
          {formatMetric(
            value
          )}
        </Typography>
      )}
    </Box>
  </Box>
);

const SchoolDashboardPage =
  () => {
    const navigate =
      useNavigate();

    const getAuthUser =
      useAuthUser();

    const authState =
      getAuthUser();

    const {
      role,
    } =
      getSchoolSessionInfo(
        authState
      );

    const canManageManagers =
      [
        ROLES.OWNER,
        ROLES.SUPERVISOR,
      ].includes(role);

    const permissions =
      authState?.permissions ||
      authState?.user
        ?.permissions ||
      getStoredPermissions();

    const canReadStudents =
      canManageManagers ||
      hasPermission(
        permissions,
        "school.students.read"
      );

    const canReadTeachers =
      canManageManagers ||
      hasPermission(
        permissions,
        "school.teachers.read"
      );

    const canReadClasses =
      canManageManagers ||
      hasPermission(
        permissions,
        "school.classes.read"
      );

    const [
      dashboardData,
      setDashboardData,
    ] = useState(null);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    const loadDashboard =
      useCallback(async () => {
        if (!role) {
          return;
        }

        setLoading(true);
        setError("");

        const response =
          await getSchoolDashboard(
            role
          );

        if (
          response?.status ===
          false
        ) {
          setError(
            response?.message ||
              "تعذر تحميل بيانات لوحة المدرسة"
          );

          setLoading(false);
          return;
        }

        setDashboardData(
          response?.data
        );

        setLoading(false);
      }, [role]);

    useEffect(() => {
      loadDashboard();
    }, [loadDashboard]);

    const metrics =
      useMemo(
        () =>
          extractDashboardMetrics(
            dashboardData
          ),
        [dashboardData]
      );

    const metricCards = [
      {
        title:
          "إجمالي الطلاب",

        value:
          metrics.students,

        icon:
          <GroupsRounded />,
      },

      {
        title:
          "إجمالي المعلمين",

        value:
          metrics.teachers,

        icon:
          <SchoolRounded />,
      },

      {
        title:
          "إجمالي الفصول",

        value:
          metrics.classes,

        icon:
          <MenuBookRounded />,
      },

      {
        title:
          "إجمالي المواد",

        value:
          metrics.subjects,

        icon:
          <MenuBookRounded />,
      },
    ];

    const operations = [
      ...(canManageManagers
        ? [
            {
              title:
                "المديرون والمساعدون",

              description:
                "إدارة الحسابات الإدارية وتوزيع الصلاحيات.",

              icon:
                <SupervisorAccountRounded />,

              action: () =>
                navigate(
                  "/school/managers"
                ),

              available: true,
            },
          ]
        : []),

      {
        title: "الطلاب",

        description:
          "إدارة ملفات الطلاب وحالتهم الدراسية.",

        icon:
          <GroupsRounded />,

        action: () =>
          navigate(
            "/school/students"
          ),

        available:
          canReadStudents,
      },

      {
        title:
          "المعلمون",

        description:
          "إدارة المعلمين والمواد المرتبطة بهم.",

        icon:
          <SchoolRounded />,

        action: () =>
          navigate(
            "/school/teachers"
          ),

        available:
          canReadTeachers,
      },

      {
        title:
          "الفصول",

        description:
          "إنشاء الفصول وتعيين المعلمين وتنظيم الطلاب.",

        icon:
          <MenuBookRounded />,

        action: () =>
          navigate(
            "/school/classes"
          ),

        available:
          canReadClasses,
      },
    ];

    return (
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          sx={{
            mb: 0.75,
          }}
        >
          <IconButton
            onClick={
              loadDashboard
            }
            disabled={loading}
            aria-label="تحديث لوحة المدرسة"
            sx={{
              width: 32,
              height: 32,

              color:
                "#244a70",

              backgroundColor:
                "#ffffff",

              border:
                "1px solid #ded8cd",

              "&:hover": {
                backgroundColor:
                  "#fffcf7",
              },
            }}
          >
            {loading ? (
              <CircularProgress
                size={14}
                sx={{
                  color:
                    "inherit",
                }}
              />
            ) : (
              <RefreshRounded
                sx={{
                  fontSize:
                    17,
                }}
              />
            )}
          </IconButton>
        </Stack>

        {error && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={
                  loadDashboard
                }
              >
                إعادة المحاولة
              </Button>
            }
            sx={{
              mb: 0.8,

              borderRadius:
                "12px",

              fontSize:
                "8.5px",
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display:
              "grid",

            gridTemplateColumns:
              {
                xs: "1fr",
                sm:
                  "repeat(2,minmax(0,1fr))",
                lg:
                  "repeat(4,minmax(0,1fr))",
              },

            gap: 0.7,
          }}
        >
          {metricCards.map(
            (card) => (
              <MetricCard
                key={
                  card.title
                }
                {...card}
                loading={
                  loading
                }
              />
            )
          )}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mt: 1.2,
            mb: 0.65,
            px: 0.15,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  "#122f4d",

                fontSize:
                  "12.5px",

                fontWeight:
                  800,
              }}
            >
              أقسام الإدارة
            </Typography>

            <Typography
              sx={{
                mt: 0.1,

                color:
                  "#7e8791",

                fontSize:
                  "7.8px",
              }}
            >
              اختصارات سريعة للعمليات الأساسية.
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display:
              "grid",

            gridTemplateColumns:
              {
                xs: "1fr",
                sm:
                  "repeat(2,minmax(0,1fr))",
                lg:
                  "repeat(4,minmax(0,1fr))",
              },

            gap: 0.85,
          }}
        >
          {operations.map(
            (card) => (
              <Box
                key={
                  card.title
                }
                role={
                  card.available
                    ? "button"
                    : undefined
                }
                tabIndex={
                  card.available
                    ? 0
                    : -1
                }
                onClick={
                  card.available
                    ? card.action
                    : undefined
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    card.available &&
                    [
                      "Enter",
                      " ",
                    ].includes(
                      event.key
                    )
                  ) {
                    card.action();
                  }
                }}
                sx={{
                  minHeight:
                    112,

                  p: 1.25,

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  borderRadius:
                    "15px",

                  cursor:
                    card.available
                      ? "pointer"
                      : "default",

                  backgroundColor:
                    "#ffffff",

                  border:
                    card.available
                      ? "1px solid rgba(211,164,79,0.48)"
                      : "1px solid #ded8cd",

                  boxShadow:
                    card.available
                      ? "0 8px 20px rgba(36,74,112,0.04)"
                      : "none",

                  transition:
                    "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",

                  "&:hover": {
                    transform:
                      card.available
                        ? "translateY(-3px)"
                        : "none",

                    borderColor:
                      card.available
                        ? "#d3a44f"
                        : "#ded8cd",

                    boxShadow:
                      card.available
                        ? "0 11px 24px rgba(36,74,112,0.065)"
                        : "none",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,

                      display:
                        "grid",

                      placeItems:
                        "center",

                      borderRadius:
                        "10px",

                      color:
                        "#b78430",

                      backgroundColor:
                        "#fbf0d8",

                      "& svg": {
                        fontSize:
                          19,
                      },
                    }}
                  >
                    {card.icon}
                  </Box>

                  {card.available ? (
                    <ArrowBackRounded
                      sx={{
                        color:
                          "#244a70",

                        fontSize:
                          17,
                      }}
                    />
                  ) : (
                    <Chip
                      label="المرحلة التالية"
                      size="small"
                      sx={{
                        height: 21,

                        color:
                          "#7e8791",

                        backgroundColor:
                          "rgba(126,135,145,0.08)",

                        fontSize:
                          "6.8px",

                        fontWeight:
                          700,
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  sx={{
                    mt: 0.9,

                    color:
                      "#122f4d",

                    fontSize:
                      "11.5px",

                    fontWeight:
                      800,
                  }}
                >
                  {card.title}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,

                    color:
                      "#7e8791",

                    fontSize:
                      "7.8px",

                    lineHeight:
                      1.65,
                  }}
                >
                  {card.description}
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>
    );
  };

export default SchoolDashboardPage;
