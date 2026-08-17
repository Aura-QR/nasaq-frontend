import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
  AddCardRounded,
  AutoStoriesRounded,
  CheckCircleRounded,
  ClassRounded,
  GroupsRounded,
  HowToRegRounded,
  PaymentsRounded,
  PersonAddAlt1Rounded,
  PersonRounded,
  QuizRounded,
  RefreshRounded,
  SchoolRounded,
  TrendingDownRounded,
  TrendingUpRounded,
  VisibilityRounded,
  AddCircleOutlineRounded,
  EditRounded,
  SecurityRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuthUser,
} from "react-auth-kit";

import Container from "@/components/Container/Container";
import { fetchSchoolDashboard } from "@/APIs/dashboard";
import { formatMoney } from "@/utils/financial/financialUtils";

const COLORS = {
  navyDark: "var(--color-navy-dark, #1b3d61)",
  gold: "var(--color-gold, #d3a44f)",
  muted: "var(--color-muted, #7b8794)",
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const getAuthenticatedUser = (authState) => {
  const candidates = [
    authState?.user,
    authState?.admin,
    authState?.data?.user,
    authState?.data?.admin,
    authState?.data?.data?.user,
    authState?.data?.data?.admin,
    authState,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.role ||
          candidate.email ||
          candidate.username ||
          candidate.name
        )
    ) || {}
  );
};

const parseStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
};

const displayNumber = (value) =>
  Number(value || 0).toLocaleString("ar-EG");

const displayMoney = (value) =>
  formatMoney(Number(value || 0));

const displaySignedMoney = (value) => {
  const amount = Number(value || 0);
  const absoluteAmount = formatMoney(Math.abs(amount));

  if (amount < 0) {
    return `-${absoluteAmount}`;
  }

  return absoluteAmount;
};

const roleTitle = (role) => {
  if (role === "MANAGER") {
    return "لوحة المدير";
  }

  if (role === "SUPERVISOR") {
    return "لوحة المشرف";
  }

  return "لوحة مالك المدرسة";
};

const OPERATION_ALIASES = {
  read: ["read", "view"],
  add: ["add", "create"],
  edit: ["edit", "update"],
  delete: ["delete", "remove"],
};

const normalizePermissions = (permissions = []) =>
  Array.isArray(permissions)
    ? permissions
        .map((permission) =>
          String(permission || "")
            .trim()
            .replace(/^school\./, "")
        )
        .filter(Boolean)
    : [];

const hasPermission = (
  permissions,
  module,
  operation = "read"
) => {
  if (
    permissions.includes("*") ||
    permissions.includes("school.*")
  ) {
    return true;
  }

  if (
    permissions.includes(`${module}.manage`)
  ) {
    return true;
  }

  const aliases =
    OPERATION_ALIASES[operation] || [operation];

  return aliases.some((alias) =>
    permissions.includes(`${module}.${alias}`)
  );
};

const StatCard = ({
  label,
  value,
  helper,
  icon,
  valueColor,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.6,
      minHeight: 112,
      borderRadius: "18px",
      border: "1px solid rgba(36,74,112,0.08)",
      background: "linear-gradient(145deg,#fffdf9,#fff)",
      boxShadow: "0 10px 24px rgba(18,47,77,0.05)",
    }}
  >
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      gap={1.5}
    >
      <Box>
        <Typography
          sx={{
            color: COLORS.muted,
            fontSize: "11px",
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.4,
            color: valueColor || COLORS.navyDark,
            fontSize: {
              xs: "22px",
              md: "25px",
            },
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>

        {helper && (
          <Typography
            sx={{
              mt: 0.65,
              color: COLORS.muted,
              fontSize: "9.5px",
            }}
          >
            {helper}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          color: COLORS.gold,
          background: "rgba(211,164,79,0.12)",
          border: "1px solid rgba(211,164,79,0.20)",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Paper>
);

const Section = ({
  title,
  description,
  children,
}) => (
  <Paper
    elevation={0}
    sx={{
      mt: 1.2,
      borderRadius: "20px",
      border: "1px solid rgba(36,74,112,0.075)",
      background: "rgba(255,253,249,0.98)",
      overflow: "hidden",
      boxShadow: "0 12px 28px rgba(18,47,77,0.045)",
    }}
  >
    <Box
      sx={{
        px: 1.8,
        py: 1.45,
        borderBottom: "1px solid rgba(36,74,112,0.06)",
      }}
    >
      <Typography
        sx={{
          color: COLORS.navyDark,
          fontSize: "16px",
          fontWeight: 900,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          sx={{
            mt: 0.35,
            color: COLORS.muted,
            fontSize: "10px",
          }}
        >
          {description}
        </Typography>
      )}
    </Box>

    <Box sx={{ p: 1.6 }}>
      {children}
    </Box>
  </Paper>
);

const QuickAction = ({
  to,
  icon,
  title,
  description,
}) => (
  <Button
    component={Link}
    to={to}
    variant="outlined"
    fullWidth
    sx={{
      minHeight: 76,
      p: 1.2,
      justifyContent: "flex-start",
      borderRadius: "14px",
      borderColor: "rgba(36,74,112,0.12)",
      color: COLORS.navyDark,
      backgroundColor: "#fff",
      textTransform: "none",
      "&:hover": {
        borderColor: "rgba(211,164,79,0.5)",
        backgroundColor: "rgba(211,164,79,0.05)",
      },
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      gap={1.1}
      width="100%"
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          display: "grid",
          placeItems: "center",
          color: COLORS.gold,
          background: "rgba(211,164,79,0.11)",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Typography
          sx={{
            fontSize: "11.5px",
            fontWeight: 900,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            fontSize: "9px",
            color: COLORS.muted,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  </Button>
);

const ManagerPermissionCard = ({
  label,
  module,
  permissions,
  icon,
}) => {
  const canRead =
    hasPermission(
      permissions,
      module,
      "read"
    );

  const canAdd =
    hasPermission(
      permissions,
      module,
      "add"
    );

  const canEdit =
    hasPermission(
      permissions,
      module,
      "edit"
    );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        minHeight: 118,
        borderRadius: "16px",
        border: "1px solid rgba(36,74,112,0.09)",
        backgroundColor: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
      >
        <Box>
          <Typography
            sx={{
              color: COLORS.navyDark,
              fontWeight: 900,
              fontSize: "12px",
            }}
          >
            {label}
          </Typography>

          <Stack
            direction="row"
            gap={0.6}
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            {canRead && (
              <Chip
                icon={<VisibilityRounded />}
                label="عرض"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "9px",
                }}
              />
            )}

            {canAdd && (
              <Chip
                icon={<AddCircleOutlineRounded />}
                label="إضافة"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "9px",
                }}
              />
            )}

            {canEdit && (
              <Chip
                icon={<EditRounded />}
                label="تعديل"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "9px",
                }}
              />
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: COLORS.gold,
            background:
              "rgba(211,164,79,0.11)",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
};

const SchoolDashboard = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};
  const authUser = getAuthenticatedUser(authState);
  const storedUser = parseStoredUser();

  const role = normalizeRole(
    authUser?.role ||
      authState?.role ||
      localStorage.getItem("role") ||
      storedUser?.role
  );

  const displayName = String(
    authUser?.username ||
      authUser?.name ||
      authUser?.fullName ||
      storedUser?.username ||
      storedUser?.name ||
      storedUser?.email?.split("@")?.[0] ||
      "المستخدم"
  ).trim();

  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const response =
      await fetchSchoolDashboard(role);

    if (response?.status) {
      setDashboard(
        response?.data || {}
      );
    } else {
      setDashboard({});
      setError(
        response?.message ||
        "تعذر تحميل لوحة التحكم"
      );
    }

    setLoading(false);
  }, [role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const managerPermissions = useMemo(
    () =>
      normalizePermissions(
        dashboard?.permissions || []
      ),
    [dashboard]
  );

  const school =
    dashboard?.school || {};

  const counts =
    dashboard?.counts || {};

  const financialSummary =
    dashboard?.financialSummary || {};

  const attendanceToday =
    Number(
      dashboard?.attendanceToday || 0
    );

  const netIncome =
    Number(
      financialSummary?.netIncome || 0
    );

  const ownerQuickActions = [
    {
      to: "/users/students/add",
      title: "إضافة طالب",
      description: "إنشاء حساب طالب جديد",
      icon: <PersonAddAlt1Rounded />,
    },
    {
      to: "/users/teachers/add",
      title: "إضافة معلم",
      description: "إضافة معلم للمدرسة",
      icon: <PersonRounded />,
    },
    {
      to: "/financial/records",
      title: "مصاريف الطلاب",
      description: "فتح السجلات الدراسية والمدفوعات",
      icon: <PaymentsRounded />,
    },
    {
      to: "/financial/additional-fees/add",
      title: "إضافة رسوم",
      description: "إنشاء رسوم إضافية جديدة",
      icon: <AddCardRounded />,
    },
    {
      to: "/school/exams/add",
      title: "إنشاء اختبار",
      description: "إضافة اختبار جديد",
      icon: <QuizRounded />,
    },
    {
      to: "/school/attendance",
      title: "إدارة الحضور",
      description: "فتح سجل الحضور والمتابعة",
      icon: <HowToRegRounded />,
    },
    {
      to: "/school/managers",
      title: "المديرون والمشرفون",
      description: "إدارة الحسابات الإدارية",
      icon: <GroupsRounded />,
    },
  ];

  const managerQuickActions = [
    {
      to: "/users/students",
      title: "إدارة الطلاب",
      description: "عرض وإدارة الطلاب",
      icon: <GroupsRounded />,
      show: hasPermission(
        managerPermissions,
        "students",
        "read"
      ),
    },
    {
      to: "/users/students/add",
      title: "إضافة طالب",
      description: "إنشاء حساب طالب جديد",
      icon: <PersonAddAlt1Rounded />,
      show: hasPermission(
        managerPermissions,
        "students",
        "add"
      ),
    },
    {
      to: "/users/teachers",
      title: "إدارة المعلمين",
      description: "عرض وإدارة المعلمين",
      icon: <SchoolRounded />,
      show: hasPermission(
        managerPermissions,
        "teachers",
        "read"
      ),
    },
    {
      to: "/users/teachers/add",
      title: "إضافة معلم",
      description: "إضافة معلم للمدرسة",
      icon: <PersonRounded />,
      show: hasPermission(
        managerPermissions,
        "teachers",
        "add"
      ),
    },
    {
      to: "/school/classes",
      title: "إدارة الفصول",
      description: "عرض الفصول الدراسية",
      icon: <ClassRounded />,
      show: hasPermission(
        managerPermissions,
        "classes",
        "read"
      ),
    },
    {
      to: "/school/subjects",
      title: "إدارة المواد",
      description: "عرض المواد الدراسية",
      icon: <AutoStoriesRounded />,
      show: hasPermission(
        managerPermissions,
        "subjects",
        "read"
      ),
    },
    {
      to: "/school/exams",
      title: "إدارة الاختبارات",
      description: "عرض الاختبارات",
      icon: <QuizRounded />,
      show: hasPermission(
        managerPermissions,
        "exams",
        "read"
      ),
    },
    {
      to: "/school/attendance",
      title: "إدارة الحضور",
      description: "فتح سجل الحضور والمتابعة",
      icon: <HowToRegRounded />,
      show: hasPermission(
        managerPermissions,
        "attendance",
        "read"
      ),
    },
  ].filter(
    (item) => item.show
  );

  const managerPermissionStats = useMemo(() => {
    const readModules = new Set();
    const addModules = new Set();
    const editModules = new Set();

    managerPermissions.forEach(
      (permission) => {
        const [
          module,
          operation,
        ] = permission.split(".");

        if (
          !module ||
          !operation
        ) {
          return;
        }

        if (
          ["read", "view"].includes(
            operation
          )
        ) {
          readModules.add(module);
        }

        if (
          ["add", "create"].includes(
            operation
          )
        ) {
          addModules.add(module);
        }

        if (
          ["edit", "update"].includes(
            operation
          )
        ) {
          editModules.add(module);
        }
      }
    );

    return {
      total:
        managerPermissions.length,
      read:
        readModules.size,
      add:
        addModules.size,
      edit:
        editModules.size,
    };
  }, [managerPermissions]);

  if (loading) {
    return (
      <Container>
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minHeight: "65vh",
          }}
        >
          <CircularProgress />

          <Typography
            sx={{
              mt: 1.5,
              color: COLORS.muted,
              fontSize: "11px",
            }}
          >
            جاري تحميل لوحة التحكم...
          </Typography>
        </Stack>
      </Container>
    );
  }

  const isManager =
    role === "MANAGER";

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 1.5,
              md: 2.2,
            },
            py: 1.8,
            borderRadius: "20px",
            border:
              "1px solid rgba(36,74,112,0.075)",
            background:
              "linear-gradient(135deg,#fffdf8,rgba(251,240,216,0.34))",
            boxShadow:
              "0 12px 28px rgba(18,47,77,0.045)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Stack
                direction="row"
                gap={0.8}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    color:
                      COLORS.navyDark,
                    fontWeight: 900,
                    fontSize: {
                      xs: "23px",
                      md: "29px",
                    },
                  }}
                >
                  {roleTitle(role)}
                </Typography>

                {!isManager &&
                  school?.name && (
                    <Chip
                      label={school.name}
                      size="small"
                      sx={{
                        backgroundColor:
                          "rgba(211,164,79,0.12)",
                        color:
                          COLORS.navyDark,
                        fontWeight: 800,
                      }}
                    />
                  )}

                {!isManager &&
                  school?.subscriptionStatus && (
                    <Chip
                      icon={
                        <CheckCircleRounded />
                      }
                      label={
                        school.subscriptionStatus ===
                        "active"
                          ? "الاشتراك نشط"
                          : school.subscriptionStatus
                      }
                      size="small"
                      sx={{
                        backgroundColor:
                          school.subscriptionStatus ===
                          "active"
                            ? "rgba(36,185,152,0.10)"
                            : "rgba(211,164,79,0.12)",
                        color:
                          school.subscriptionStatus ===
                          "active"
                            ? "#0E7A5E"
                            : COLORS.navyDark,
                        fontWeight: 800,
                      }}
                    />
                  )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.45,
                  color: COLORS.muted,
                  fontSize: "10.5px",
                }}
              >
                أهلاً {displayName}،{" "}
                {isManager
                  ? "اللوحة تعرض الوظائف المتاحة حسب صلاحيات حسابك."
                  : "نظرة سريعة على حالة المدرسة اليوم."}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                <RefreshRounded />
              }
              onClick={
                loadDashboard
              }
              sx={{
                minHeight: 42,
                borderRadius: "12px",
                borderColor:
                  "rgba(36,74,112,0.15)",
                color:
                  COLORS.navyDark,
                fontWeight: 800,
                textTransform:
                  "none",
              }}
            >
              تحديث البيانات
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Paper
            elevation={0}
            sx={{
              mt: 1.3,
              p: 1.2,
              borderRadius:
                "14px",
              border:
                "1px solid rgba(211,77,77,0.20)",
              backgroundColor:
                "rgba(211,77,77,0.05)",
            }}
          >
            <Typography
              sx={{
                color:
                  COLORS.navyDark,
                fontSize:
                  "10.5px",
                fontWeight: 700,
              }}
            >
              {error}
            </Typography>
          </Paper>
        )}

        {isManager ? (
          <>
            <Grid
              container
              spacing={1.2}
              sx={{ mt: 0.2 }}
            >
              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="إجمالي الصلاحيات"
                  value={displayNumber(
                    managerPermissionStats.total
                  )}
                  helper="الصلاحيات الممنوحة لحسابك"
                  icon={
                    <SecurityRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="الأقسام المتاحة"
                  value={displayNumber(
                    managerPermissionStats.read
                  )}
                  helper="عدد الأقسام المتاحة للعرض"
                  icon={
                    <VisibilityRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="صلاحيات الإضافة"
                  value={displayNumber(
                    managerPermissionStats.add
                  )}
                  helper="الأقسام المسموح بالإضافة فيها"
                  icon={
                    <AddCircleOutlineRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="صلاحيات التعديل"
                  value={displayNumber(
                    managerPermissionStats.edit
                  )}
                  helper="الأقسام المسموح بتعديلها"
                  icon={
                    <EditRounded />
                  }
                />
              </Grid>
            </Grid>

            <Section
              title="إجراءات سريعة"
              description="الروابط التالية تظهر فقط حسب الصلاحيات الممنوحة لحساب المدير."
            >
              <Grid
                container
                spacing={1}
              >
                {managerQuickActions.map(
                  (action) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={action.to}
                    >
                      <QuickAction
                        {...action}
                      />
                    </Grid>
                  )
                )}
              </Grid>
            </Section>

            <Section
              title="صلاحيات المدير"
              description="ملخص واضح للصلاحيات التي يرجعها Dashboard API لهذا الحساب."
            >
              <Grid
                container
                spacing={1}
              >
                {[
                  {
                    label: "الطلاب",
                    module: "students",
                    icon: <GroupsRounded />,
                  },
                  {
                    label: "المعلمون",
                    module: "teachers",
                    icon: <SchoolRounded />,
                  },
                  {
                    label: "الفصول",
                    module: "classes",
                    icon: <ClassRounded />,
                  },
                  {
                    label: "المواد",
                    module: "subjects",
                    icon: <AutoStoriesRounded />,
                  },
                  {
                    label: "الاختبارات",
                    module: "exams",
                    icon: <QuizRounded />,
                  },
                  {
                    label: "الحضور",
                    module: "attendance",
                    icon: <HowToRegRounded />,
                  },
                ]
                  .filter((item) =>
                    hasPermission(
                      managerPermissions,
                      item.module,
                      "read"
                    ) ||
                    hasPermission(
                      managerPermissions,
                      item.module,
                      "add"
                    ) ||
                    hasPermission(
                      managerPermissions,
                      item.module,
                      "edit"
                    )
                  )
                  .map((item) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={
                        item.module
                      }
                    >
                      <ManagerPermissionCard
                        {...item}
                        permissions={
                          managerPermissions
                        }
                      />
                    </Grid>
                  ))}
              </Grid>
            </Section>


          </>
        ) : (
          <>
            <Grid
              container
              spacing={1.2}
              sx={{ mt: 0.2 }}
            >
              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="إجمالي الطلاب"
                  value={displayNumber(
                    counts?.students
                  )}
                  helper="كل الطلاب المسجلين"
                  icon={
                    <GroupsRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="الطلاب النشطون"
                  value={displayNumber(
                    counts?.activeStudents
                  )}
                  helper="الحسابات النشطة"
                  icon={
                    <CheckCircleRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="المعلمون"
                  value={displayNumber(
                    counts?.teachers
                  )}
                  helper="إجمالي المعلمين"
                  icon={
                    <SchoolRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="الفصول"
                  value={displayNumber(
                    counts?.classes
                  )}
                  helper="إجمالي الفصول"
                  icon={
                    <ClassRounded />
                  }
                />
              </Grid>
            </Grid>

            <Grid
              container
              spacing={1.2}
              sx={{ mt: 0.1 }}
            >
              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="إجمالي الإيرادات"
                  value={displayMoney(
                    financialSummary?.totalRevenue
                  )}
                  helper="الإيرادات المسجلة"
                  icon={
                    <PaymentsRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="إجمالي المصروفات"
                  value={displayMoney(
                    financialSummary?.totalExpenses
                  )}
                  helper="المصروفات التشغيلية"
                  icon={
                    <TrendingDownRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="صافي الدخل"
                  value={displaySignedMoney(
                    netIncome
                  )}
                  helper={
                    netIncome < 0
                      ? "المصروفات أعلى من الإيرادات"
                      : "الإيرادات بعد خصم المصروفات"
                  }
                  valueColor={
                    netIncome < 0
                      ? "#d94c4c"
                      : netIncome > 0
                      ? "#0E7A5E"
                      : COLORS.navyDark
                  }
                  icon={
                    netIncome < 0
                      ? <TrendingDownRounded />
                      : <TrendingUpRounded />
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  label="الحضور اليوم"
                  value={displayNumber(
                    attendanceToday
                  )}
                  helper="عدد سجلات الحضور اليوم"
                  icon={
                    <HowToRegRounded />
                  }
                />
              </Grid>
            </Grid>

        

            <Section
              title="حالة المدرسة"
              description="معلومات الحساب والمدرسة المتاحة من لوحة بيانات المالك."
            >
              <Grid
                container
                spacing={1}
              >
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <StatCard
                    label="اسم المدرسة"
                    value={
                      school?.name ||
                      "—"
                    }
                    helper={
                      school?.slug ||
                      ""
                    }
                    icon={
                      <SchoolRounded />
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <StatCard
                    label="حالة المدرسة"
                    value={
                      school?.isActive
                        ? "نشطة"
                        : "غير نشطة"
                    }
                    icon={
                      <CheckCircleRounded />
                    }
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <StatCard
                    label="حالة الاشتراك"
                    value={
                      school?.subscriptionStatus === "active"
                        ? "نشط"
                        : school?.subscriptionStatus || "—"
                    }
                    icon={
                      <AccountBalanceWalletRounded />
                    }
                  />
                </Grid>
              </Grid>
            </Section>
          </>
        )}
      </Box>
    </Container>
  );
};

export default SchoolDashboard;
