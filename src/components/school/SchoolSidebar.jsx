import {
  AccountBalanceWalletRounded,
  AccountTreeRounded,
  AssessmentRounded,
  AssignmentRounded,
  AutoStoriesRounded,
  CategoryRounded,
  DashboardRounded,
  DirectionsBusRounded,
  EventNoteRounded,
  FactCheckRounded,
  FolderCopyOutlined,
  GroupsRounded,
  LibraryBooksRounded,
  LocalOfferRounded,
  LogoutRounded,
  MenuBookRounded,
  MenuOpenRounded,
  MeetingRoomRounded,
  MoneyOffRounded,
  ReceiptLongRounded,
  RouteRounded,
  SchoolRounded,
  SupervisorAccountRounded,
  ViewListRounded,
} from "@mui/icons-material";

import {
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import nasaqLogo from "@/images/wadq-logo.png";

import {
  clearAuthSession,
} from "@/shared/auth/session";

import {
  ROLES,
} from "@/shared/auth/roles";

import usePermissions from "@/utils/hooks/usePermissions";

import {
  getSchoolRoleLabel,
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const SIDEBAR_WIDTH = 280;

const NAVIGATION_SECTIONS = [
  {
    title: "الأفراد",

    items: [
      {
        label: "الطلاب",
        path: "/users/students",
        icon: <GroupsRounded />,
        module: "students",
      },
      {
        label: "المعلمون",
        path: "/users/teachers",
        icon: <SchoolRounded />,
        module: "teachers",
      },
    ],
  },

  {
    title: "الإدارة الأكاديمية",

    items: [
      {
        label: "المواد",
        path: "/school/subjects",
        icon: <MenuBookRounded />,
        module: "subjects",
      },
      {
        label: "الفصول",
        path: "/school/classes",
        icon: <MeetingRoomRounded />,
        module: "classes",
      },
      {
        label: "الحصص",
        path: "/school/lectures",
        icon: <EventNoteRounded />,
        module: "lectures",
      },
    ],
  },

  {
    title: "التقييم والاختبارات",

    items: [
      {
        label: "توزيع الدرجات",
        path: "/school/gradesCriteria",
        icon: <AssessmentRounded />,
        module: "gradesCriteria",
      },
      {
        label: "الاختبارات",
        path: "/school/exams",
        icon: <FactCheckRounded />,
        module: "exams",
      },
      {
        label: "المشروعات",
        path: "/school/projects",
        icon: <AccountTreeRounded />,
        module: "projects",
      },
    ],
  },

  {
    title: "الخدمات والمتابعة",

    items: [
      {
        label: "الحضور",
        path: "/school/attendance",
        icon: <AssignmentRounded />,
        module: "attendance",
      },
      {
        label: "التحضير",
        path: "/school/preparation",
        icon: <AutoStoriesRounded />,
        module: "preparation",
      },
      {
        label: "المكتبة",
        path: "/school/library",
        icon: <LibraryBooksRounded />,
        module: "library",
      },
    ],
  },

  {
    title: "الماليات والحسابات",

    items: [
      {
        label: "السجلات المالية",
        path: "/financial/all-records",
        icon: <FolderCopyOutlined />,
        module: "financial",
      },
      {
        label: "مصاريف الطلاب",
        path: "/financial/records",
        icon: <AccountBalanceWalletRounded />,
        module: "financial",
      },
      {
        label: "الباص",
        path: "/financial/bus",
        icon: <DirectionsBusRounded />,
        module: "financial",
      },
      {
        label: "الرحلات",
        path: "/financial/trips",
        icon: <RouteRounded />,
        module: "financial",
      },
      {
        label: "إعدادات الرسوم",
        path: "/financial/fee-configs",
        icon: <ReceiptLongRounded />,
        module: "financial",
      },
      {
        label: "خطط التقسيط",
        path: "/financial/installment-plans",
        icon: <ViewListRounded />,
        module: "financial",
      },
      {
        label: "الخصومات",
        path: "/financial/discounts",
        icon: <LocalOfferRounded />,
        module: "financial",
      },
    ],
  },

  {
    title: "المصروفات",

    items: [
      {
        label: "المصروفات",
        path: "/expenses",
        icon: <MoneyOffRounded />,
        module: "expenses",
      },
      {
        label: "تصنيفات المصروفات",
        path: "/expenses/categories",
        icon: <CategoryRounded />,
        module: "expenses",
      },
    ],
  },
];

const SchoolSidebar = ({
  onClose,
  mobile = false,
}) => {
  const navigate =
    useNavigate();

  const signOut =
    useSignOut();

  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser();

  const {
    role,
    email,
    displayName,
    schoolName,
  } =
    getSchoolSessionInfo(
      authState
    );

  const canManageManagers =
    role === ROLES.OWNER;

  const modulePermissions = {
    students:
      usePermissions(
        "students"
      ),

    teachers:
      usePermissions(
        "teachers"
      ),

    subjects:
      usePermissions(
        "subjects"
      ),

    classes:
      usePermissions(
        "classes"
      ),

    lectures:
      usePermissions(
        "lectures"
      ),

    gradesCriteria:
      usePermissions(
        "gradesCriteria"
      ),

    exams:
      usePermissions(
        "exams"
      ),

    projects:
      usePermissions(
        "projects"
      ),

    attendance:
      usePermissions(
        "attendance"
      ),

    preparation:
      usePermissions(
        "preparation"
      ),

    library:
      usePermissions(
        "library"
      ),

    financial:
      usePermissions(
        "financial"
      ),

    expenses:
      usePermissions(
        "expenses"
      ),
  };

  const visibleSections =
    NAVIGATION_SECTIONS
      .map((section) => ({
        ...section,

        items:
          section.items.filter(
            (item) =>
              modulePermissions[
                item.module
              ]?.read
          ),
      }))
      .filter(
        (section) =>
          section.items.length > 0
      );

  const handleLogout = () => {
    signOut();
    clearAuthSession();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <Box
      dir="rtl"
      sx={{
        width:
          SIDEBAR_WIDTH,

        height:
          "100%",

        display:
          "flex",

        flexDirection:
          "column",

        overflow:
          "hidden",

        color:
          "#ffffff",

        background:
          "linear-gradient(180deg, #193f64 0%, #244f78 100%)",

        fontFamily:
          "Tajawal, Arial, sans-serif",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          pt: 1.75,
          pb: 1.35,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.9}
            sx={{
              minWidth: 0,
            }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                width: 54,
                height: 54,
                flexShrink: 0,
                objectFit:
                  "contain",
                p: 0.4,
                borderRadius:
                  "15px",
                backgroundColor:
                  "#ffffff",
                boxShadow:
                  "0 8px 18px rgba(7,22,41,0.16)",
              }}
            />

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize:
                    "20px",
                  fontWeight:
                    800,
                  lineHeight:
                    1.15,
                }}
              >
                نَسّق
              </Typography>

              <Typography
                noWrap
                title={
                  schoolName
                }
                sx={{
                  mt: 0.25,
                  maxWidth:
                    150,
                  color:
                    "rgba(255,255,255,0.68)",
                  fontSize:
                    "8px",
                  fontWeight:
                    700,
                }}
              >
                {schoolName}
              </Typography>
            </Box>
          </Stack>

          {mobile && (
            <IconButton
              onClick={
                onClose
              }
              aria-label="إغلاق القائمة"
              sx={{
                color:
                  "#ffffff",
              }}
            >
              <MenuOpenRounded />
            </IconButton>
          )}
        </Stack>

        <Divider
          sx={{
            mt: 1.6,
            borderColor:
              "rgba(255,255,255,0.12)",
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY:
            "auto",
          overflowX:
            "hidden",
          px: 1.45,
          pb: 1,
          scrollbarWidth:
            "thin",
          "&::-webkit-scrollbar":
            {
              width: 5,
            },
          "&::-webkit-scrollbar-thumb":
            {
              borderRadius:
                "10px",
              backgroundColor:
                "rgba(255,255,255,0.18)",
            },
        }}
      >
        <Stack spacing={1.15}>
          <Box>
            <SidebarLink
              item={{
                label:
                  "لوحة المدرسة",
                path:
                  "/school/dashboard",
                icon:
                  <DashboardRounded />,
              }}
              mobile={
                mobile
              }
              onClose={
                onClose
              }
            />

            {canManageManagers && (
              <SidebarLink
                item={{
                  label:
                    "المديرون والمشرفون",
                  path:
                    "/school/managers",
                  icon:
                    <SupervisorAccountRounded />,
                }}
                mobile={
                  mobile
                }
                onClose={
                  onClose
                }
              />
            )}
          </Box>

          {visibleSections.map(
            (section) => (
              <Box
                key={
                  section.title
                }
              >
                <Typography
                  sx={{
                    px: 1.2,
                    mb: 0.55,
                    color:
                      "rgba(242,215,146,0.86)",
                    fontSize:
                      "8px",
                    fontWeight:
                      800,
                  }}
                >
                  {section.title}
                </Typography>

                <Stack
                  spacing={0.45}
                >
                  {section.items.map(
                    (item) => (
                      <SidebarLink
                        key={
                          item.path
                        }
                        item={
                          item
                        }
                        mobile={
                          mobile
                        }
                        onClose={
                          onClose
                        }
                      />
                    )
                  )}
                </Stack>
              </Box>
            )
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          p: 1.35,
          pt: 0.65,
        }}
      >
        <Box
          sx={{
            p: 1.2,
            borderRadius:
              "15px",
            backgroundColor:
              "rgba(255,255,255,0.075)",
            border:
              "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              "0 10px 22px rgba(7,22,41,0.1)",
          }}
        >
          <Typography
            noWrap
            title={
              displayName
            }
            sx={{
              color:
                "#ffffff",
              fontSize:
                "9.5px",
              fontWeight:
                800,
            }}
          >
            {displayName}
          </Typography>

          {email &&
            email !==
              displayName && (
              <Typography
                noWrap
                title={email}
                sx={{
                  mt: 0.2,
                  color:
                    "rgba(255,255,255,0.65)",
                  direction:
                    "ltr",
                  textAlign:
                    "right",
                  fontSize:
                    "7.5px",
                }}
              >
                {email}
              </Typography>
            )}

          <Typography
            sx={{
              mt: 0.35,
              color:
                "#f2d792",
              fontSize:
                "7.5px",
              fontWeight:
                700,
            }}
          >
            {getSchoolRoleLabel(
              role
            )}
          </Typography>

          <Box
            component="button"
            type="button"
            onClick={
              handleLogout
            }
            sx={{
              width: "100%",
              minHeight:
                38,
              mt: 1,
              px: 1,
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: 0.65,
              border: 0,
              borderRadius:
                "11px",
              cursor:
                "pointer",
              color:
                "#ffffff",
              backgroundColor:
                "rgba(255,255,255,0.08)",
              fontFamily:
                "inherit",
              fontSize:
                "8.5px",
              fontWeight:
                800,
              transition:
                "background-color 0.2s ease",
              "&:hover": {
                backgroundColor:
                  "rgba(255,255,255,0.14)",
              },
              "& svg": {
                fontSize:
                  16,
              },
            }}
          >
            <LogoutRounded />
            تسجيل الخروج
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const SidebarLink = ({
  item,
  mobile,
  onClose,
}) => (
  <Box
    component={NavLink}
    to={item.path}
    onClick={
      mobile
        ? onClose
        : undefined
    }
    sx={{
      minHeight: 46,
      px: 1.45,
      display:
        "flex",
      alignItems:
        "center",
      gap: 1,
      borderRadius:
        "14px",
      color:
        "rgba(255,255,255,0.77)",
      textDecoration:
        "none",
      fontSize:
        "9.5px",
      fontWeight:
        800,
      transition:
        "all 0.2s ease",
      "& svg": {
        fontSize:
          18,
      },
      "&:hover": {
        color:
          "#ffffff",
        backgroundColor:
          "rgba(255,255,255,0.08)",
        transform:
          "translateX(-2px)",
      },
      "&.active": {
        color:
          "#173c5d",
        backgroundColor:
          "#f3d78b",
        boxShadow:
          "0 10px 24px rgba(7,22,41,0.18)",
      },
    }}
  >
    {item.icon}
    {item.label}
  </Box>
);

export {
  SIDEBAR_WIDTH,
};

export default SchoolSidebar;
