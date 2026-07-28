import "./Sidebar.scss";

import {
  Collapse,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWallet,
  Category as CategoryIcon,
  DirectionsBus,
  ExpandLess,
  ExpandMore,
  FolderCopyOutlined,
  LocalOffer,
  Logout,
  MoneyOff,
  ReceiptLong,
  Route,
  ViewList,
} from "@mui/icons-material";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import { toast } from "react-toastify";
import Cookies from "js-cookie";

import nasaqLogo from "@/images/wadq-logo.png";

import userIcon from "@/icons/user.json";
import teacherIcon from "@/icons/teacher.json";
import subjectIcon from "@/icons/subject.json";
import booksIcon from "@/icons/books.json";
import lectureIcon from "@/icons/Lecture.json";
import absenceIcon from "@/icons/absence.json";
import gradesCriteriaIcon from "@/icons/gradesCriteria.json";
import examsIcon from "@/icons/exams.json";
import projectsIcon from "@/icons/projects.json";
import scheduleIcon from "@/icons/schedule.json";
import preparationIcon from "@/icons/preparation.json";

import HoverLottie from "../HoverLottie";
import usePermissions from "@/utils/hooks/usePermissions";

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
        (candidate.role ||
          candidate.email ||
          candidate.username ||
          candidate.name ||
          candidate.fullName)
    ) || {}
  );
};

const getDisplayName = (user) => {
  const emailName = user?.email
    ? String(user.email).split("@")[0]
    : "";

  return String(
    user?.username ||
      user?.name ||
      user?.fullName ||
      user?.ownerName ||
      user?.firstName ||
      emailName ||
      "المستخدم"
  ).trim();
};

const ROLE_LABELS = {
  OWNER: "مالك المدرسة",
  SUPERVISOR: "مشرف المدرسة",
  MANAGER: "مدير المدرسة",
  TEACHER: "معلم",
  STUDENT: "طالب",
  SUPER_ADMIN: "مدير المنصة",
};

const Sidebar = ({ active }) => {
  /*
   * نظام الصلاحيات الجديد يخزن الصلاحيات كمصفوفة:
   * ["school.students.read", ...]
   *
   * نطلب صلاحيات كل قسم منفصلة حتى يظل تصميم
   * الـSidebar القديم كما هو بدون أي تغيير بصري.
   */
  const studentsPermissions =
    usePermissions("students");

  const teachersPermissions =
    usePermissions("teachers");

  const subjectsPermissions =
    usePermissions("subjects");

  const classesPermissions =
    usePermissions("classes");

  const lecturesPermissions =
    usePermissions("lectures");

  const gradesCriteriaPermissions =
    usePermissions("gradesCriteria");

  const examsPermissions =
    usePermissions("exams");

  const projectsPermissions =
    usePermissions("projects");

  const attendancePermissions =
    usePermissions("attendance");

  const preparationPermissions =
    usePermissions("preparation");

  const libraryPermissions =
    usePermissions("library");

  const financialPermissions =
    usePermissions("financial");

  const expensesPermissions =
    usePermissions("expenses");

  const getAuthUser = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const authState = getAuthUser?.() || {};
  const user = getAuthenticatedUser(authState);

  const role = normalizeRole(
    user?.role || authState?.role
  );

  const displayName = getDisplayName(user);

  const roleLabel =
    ROLE_LABELS[role] || "مستخدم";

  const userId =
    user?._id ||
    user?.id ||
    user?.userId ||
    "";

  const isTeacher = role === "TEACHER";

  const categories = useMemo(() => {
    const baseCategories = [
      {
        title: "الأفراد",
        items: [
          {
            name: "إدارة الطلاب",
            icon: userIcon,
            to: "/users/students",
            show: studentsPermissions.read,
          },
          {
            name: "إدارة المعلمين",
            icon: teacherIcon,
            to: "/users/teachers",
            show: teachersPermissions.read,
          },
        ],
      },
      {
        title: "الإدارة الأكاديمية",
        items: [
          {
            name: "إدارة المواد",
            icon: subjectIcon,
            to: "/school/subjects",
            show: subjectsPermissions.read,
          },
          {
            name: "إدارة الفصول",
            icon: userIcon,
            to: "/school/classes",
            show: classesPermissions.read,
          },
          {
            name: "إدارة الحصص",
            icon: lectureIcon,
            to: "/school/lectures",
            show: lecturesPermissions.read,
          },
        ],
      },
      {
        title: "التقييم والاختبارات",
        items: [
          {
            name: "توزيع الدرجات",
            icon: gradesCriteriaIcon,
            to: "/school/gradesCriteria",
            show: gradesCriteriaPermissions.read,
          },
          {
            name: "إدارة الاختبارات",
            icon: examsIcon,
            to: "/school/exams",
            show: examsPermissions.read,
          },
          {
            name: "إدارة المشروعات",
            icon: projectsIcon,
            to: "/school/projects",
            show: projectsPermissions.read,
          },
        ],
      },
      {
        title: "الخدمات والمتابعة",
        items: [
          {
            name: "إدارة الحضور",
            icon: absenceIcon,
            to: "/school/attendance",
            show: attendancePermissions.read,
          },
          {
            name: "إدارة التحضير",
            icon: preparationIcon,
            to: "/school/preparation",
            show: preparationPermissions.read,
          },
          {
            name: "إدارة المكتبة",
            icon: booksIcon,
            to: "/school/library",
            show: libraryPermissions.read,
          },
        ],
      },
      {
        title: "الماليات والحسابات",
        items: [
          {
            name: "السجلات المالية",
            Icon: FolderCopyOutlined,
            iconType: "mui",
            to: "/financial/all-records",
            show: financialPermissions.read,
          },
          {
            name: "مصاريف الطلاب",
            Icon: AccountBalanceWallet,
            iconType: "mui",
            to: "/financial/records",
            show: financialPermissions.read,
          },
          {
            name: "الباص",
            Icon: DirectionsBus,
            iconType: "mui",
            to: "/financial/bus",
            show: financialPermissions.read,
          },
          {
            name: "الرحلات",
            Icon: Route,
            iconType: "mui",
            to: "/financial/trips",
            show: financialPermissions.read,
          },
          {
            name: "إعدادات الرسوم",
            Icon: ReceiptLong,
            iconType: "mui",
            to: "/financial/fee-configs",
            show: financialPermissions.read,
          },
          {
            name: "خطط التقسيط",
            Icon: ViewList,
            iconType: "mui",
            to: "/financial/installment-plans",
            show: financialPermissions.read,
          },
          {
            name: "الخصومات",
            Icon: LocalOffer,
            iconType: "mui",
            to: "/financial/discounts",
            show: financialPermissions.read,
          },
        ],
      },
      {
        title: "المصروفات",
        items: [
          {
            name: "المصروفات",
            Icon: MoneyOff,
            iconType: "mui",
            to: "/expenses",
            show: expensesPermissions.read,
          },
          {
            name: "تصنيفات المصروفات",
            Icon: CategoryIcon,
            iconType: "mui",
            to: "/expenses/categories",
            show: expensesPermissions.read,
          },
        ],
      },
    ];

    if (isTeacher) {
      baseCategories.push({
        title: "المعلم",
        items: [
          {
            name: "جدولي",
            icon: scheduleIcon,
            to: `/users/teachers/${userId}/schedule`,
            show: true,
          },
        ],
      });
    }

    return baseCategories;
  }, [
    isTeacher,
    userId,
    studentsPermissions.read,
    teachersPermissions.read,
    subjectsPermissions.read,
    classesPermissions.read,
    lecturesPermissions.read,
    gradesCriteriaPermissions.read,
    examsPermissions.read,
    projectsPermissions.read,
    attendancePermissions.read,
    preparationPermissions.read,
    libraryPermissions.read,
    financialPermissions.read,
    expensesPermissions.read,
  ]);

  const handleSignOut = () => {
    toast.info(
      `تم تسجيل خروجك بنجاح، وداعًا ${displayName}`
    );

    signOut();

    [
      "_auth",
      "_auth_state",
      "_auth_storage",
      "_auth_type",
    ].forEach((cookieName) => {
      Cookies.remove(cookieName, { path: "/" });
      Cookies.remove(cookieName, {
        path: "/",
        domain: window.location.hostname,
      });
    });

    localStorage.removeItem("permissions");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  return (
    <div
      ref={sidebarRef}
      className={`sideContainer${
        active ? " sidebar-open" : ""
      }`}
      style={{ maxWidth: active ? 280 : 0 }}
      dir="rtl"
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img
            src={nasaqLogo}
            alt="شعار منصة نَسّق"
          />

          <div>
            <strong>لوحة الإدارة</strong>
            <small>نَسّق لإدارة المنصة</small>
          </div>
        </div>

        <div className="sidebar-content">
          <Stack spacing={1.2}>
            {categories.map((category) => (
              <Category
                key={category.title}
                category={category}
                pathname={location.pathname}
              />
            ))}
          </Stack>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user__avatar">
              {displayName.charAt(0) || "م"}
            </span>

            <span className="sidebar-user__copy">
              <strong>{displayName}</strong>
              <small>{roleLabel}</small>
            </span>
          </div>

          <button
            type="button"
            className="logout-container"
            onClick={handleSignOut}
          >
            <Logout className="logout-icon" />
            <span className="logout-button">
              تسجيل الخروج
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
};

const Category = ({ category, pathname }) => {
  const visibleItems = category.items.filter(
    (item) => item.show
  );

  const isActiveCategory = visibleItems.some(
    (item) =>
      item.to &&
      (pathname === item.to ||
        pathname.startsWith(`${item.to}/`))
  );

  const [open, setOpen] = useState(
    isActiveCategory
  );

  useEffect(() => {
    if (isActiveCategory) {
      setOpen(true);
    }
  }, [isActiveCategory]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="category">
      <button
        type="button"
        className="category-header"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        aria-expanded={open}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: "13px",
          }}
        >
          {category.title}
        </Typography>

        {open ? (
          <ExpandLess fontSize="small" />
        ) : (
          <ExpandMore fontSize="small" />
        )}
      </button>

      <Collapse in={open}>
        <Stack spacing={0.7} mt={0.8}>
          {visibleItems.map((item) => (
            <Item key={item.to} element={item} />
          ))}
        </Stack>
      </Collapse>
    </section>
  );
};

const Item = ({ element }) => {
  const [hovered, setHovered] =
    useState(false);
  const IconComponent = element.Icon;

  return (
    <NavLink
      to={element.to}
      className={({ isActive }) =>
        `item${isActive ? " active" : ""}`
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="item-icon">
        {element.iconType === "mui" &&
        IconComponent ? (
          <IconComponent sx={{ fontSize: 19 }} />
        ) : (
          <HoverLottie
            icon={element.icon}
            w={25}
            h={25}
            play={hovered}
          />
        )}
      </span>

      <span className="item-label">
        {element.name}
      </span>
    </NavLink>
  );
};

export default Sidebar;
