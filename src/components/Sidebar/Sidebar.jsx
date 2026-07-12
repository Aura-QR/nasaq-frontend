import "./Sidebar.scss";
import { Link, useNavigate } from "react-router-dom";
import { Stack, Typography, Collapse } from "@mui/material";
import { ExpandMore, ExpandLess, Logout } from "@mui/icons-material";
import {
  ReceiptLong,
  ViewList,
  AccountBalanceWallet,
  FolderCopyOutlined,
  LocalOffer,
  DirectionsBus,
  Route,
  MoneyOff,
  Category as CategoryIcon,
} from "@mui/icons-material";
import logoImg from "@/images/logo.png";
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
import { useState, useRef } from "react";
import HoverLottie from "../HoverLottie";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { toast } from "react-toastify";
import usePermissions from "@/utils/hooks/usePermissions";
import Cookies from 'js-cookie';

const Sidebar = ({ active }) => {
  const permissions = usePermissions();
  const user = useAuthUser()().user;
  const isTeacher = user?.role === "TEACHER";
  const sidebarRef = useRef(null);

  const categories = [
    {
      title: "الأفراد",
      items: [
        {
          name: "إدارة الطلاب",
          icon: userIcon,
          to: "/users/students",
          show: permissions?.students?.read,
        },
        {
          name: "إدارة المعلمين",
          icon: teacherIcon,
          to: "/users/teachers",
          show: permissions?.teachers?.read,
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
          show: permissions?.subjects?.read,
        },
        {
          name: "إدارة الفصول",
          icon: userIcon,
          to: "/school/classes",
          show: permissions?.classes?.read,
        },
        {
          name: "إدارة الحصص",
          icon: lectureIcon,
          to: "/school/lectures",
          show: permissions?.lectures?.read,
        },
      ],
    },
    {
      title: "التقييم والامتحانات",
      items: [
        {
          name: "إدارة توزيع الدرجات",
          icon: gradesCriteriaIcon,
          to: "/school/gradesCriteria",
          show: permissions?.gradesCriteria?.read,
        },
        {
          name: "إدارة الامتحانات",
          icon: examsIcon,
          to: "/school/exams",
          show: permissions?.exams?.read,
        },
        {
          name: "إدارة المشروعات",
          icon: projectsIcon,
          to: "/school/projects",
          show: permissions?.projects?.read,
        },
      ],
    },
    {
      title: "الخدمات والمتابعة",
      items: [
        {
          name: "إدارة الغيابات",
          icon: absenceIcon,
          to: "/school/attendance",
          show: permissions?.attendance?.read,
        },
        {
          name: "ادارة التحضير",
          icon: preparationIcon,
          to: `/school/preparation`,
          show: permissions?.preparation?.read,
        },
        {
          name: "إدارة المكتبة",
          icon: booksIcon,
          to: "/school/library",
          show: permissions?.library?.read,
        },
      ],
    },
    {
      title: "الماليات و الحسابات",
      items: [
        {
          name: "السجلات المالية",
          Icon: FolderCopyOutlined,
          iconType: "mui",
          to: "/financial/all-records",
          show: permissions?.financial?.read,
        },
        {
          name: "مصاريف الطلاب",
          Icon: AccountBalanceWallet,
          iconType: "mui",
          to: "/financial/records",
          show: permissions?.financial?.read,
        },
        {
          name: "الباص",
          Icon: DirectionsBus,
          iconType: "mui",
          to: "/financial/bus",
          show: permissions?.financial?.read,
        },
        {
          name: "الرحلات",
          Icon: Route,
          iconType: "mui",
          to: "/financial/trips",
          show: permissions?.financial?.read,
        },
        {
          name: "إعدادات الرسوم",
          Icon: ReceiptLong,
          iconType: "mui",
          to: "/financial/fee-configs",
          show: permissions?.financial?.read,
        },
        {
          name: "خطط التقسيط",
          Icon: ViewList,
          iconType: "mui",
          to: "/financial/installment-plans",
          show: permissions?.financial?.read,
        },
        {
          name: "الخصومات",
          Icon: LocalOffer,
          iconType: "mui",
          to: "/financial/discounts",
          show: permissions?.financial?.read,
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
          show: permissions?.financial?.read,
        },
        {
          name: "تصنيفات المصروفات",
          Icon: CategoryIcon,
          iconType: "mui",
          to: "/expenses/categories",
          show: permissions?.financial?.read,
        },
      ],
    },
  ];

  // Add teacher schedule if applicable
  if (isTeacher) {
    categories.push({
      title: "المعلم",
      items: [
        {
          name: "جدولي",
          icon: scheduleIcon,
          to: `/users/teachers/${user?.id}/schedule`,
          show: true,
        },
      ],
    });
  }

  const navigate = useNavigate();
  const signOut = useSignOut();

  const handleSignOut = () => {
    toast.info("تم تسجيل خروجك بنجاح , وداعا محمد سامي");
    signOut();
    const cookieOptions = { domain: window.location.hostname };
    Cookies.remove('_auth', cookieOptions);
    Cookies.remove('_auth_state', cookieOptions);
    Cookies.remove('_auth_storage', cookieOptions);
    Cookies.remove('_auth_type', cookieOptions);
    localStorage.removeItem('permissions');
    navigate("/");
  };


  return (
    <>
      <div
        ref={sidebarRef}
        className={`sideContainer${active ? ' sidebar-open' : ''}`}
        style={{ maxWidth: active ? 250 : 0 }}
      >
        <div className="sidebar">
          <Stack maxWidth={100} mx={"auto"} mt={6} mb={20}>
            <img src={logoImg} alt="logo" width={"100%"} />
          </Stack>

          <div className="sidebar-content">
            <Stack spacing={2}>
              {categories.map((category, idx) => (
                <Category key={idx} category={category} />
              ))}
            </Stack>
          </div>

          <Stack
            direction={"row"}
            spacing={2}
            onClick={handleSignOut}
            className="logout-container"
            sx={{
              mt: "auto",
              py: "20px",
              ml: "20px",
              color: "primary.main",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: ".5s",
              flexShrink: 0,
              "&:hover": {
                color: "error.main",
              },
            }}
          >
            <Logout className="logout-icon"/>
            <Typography variant="subtitle" className="logout-button">تسجيل خروج</Typography>
          </Stack>
        </div>
      </div>
    </>
  );
};

const Category = ({ category }) => {
  // Filter items that should be shown
  const visibleItems = category.items.filter((item) => item.show);

  const isActiveCategory = visibleItems.some(
    (item) => item.to && window.location.pathname === item.to
  );

  const [open, setOpen] = useState(isActiveCategory);

  // Don't render category if no visible items
  if (visibleItems.length === 0) return null;

  return (
    <div className="category">
      <div className="category-header" onClick={() => setOpen(!open)}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 15 }}>
          {category.title}
        </Typography>
        {open ? (
          <ExpandLess fontSize="small" />
        ) : (
          <ExpandMore fontSize="small" />
        )}
      </div>
      <Collapse in={open}>
        <Stack spacing={1} mt={1}>
          {visibleItems.map((item, i) => (
            <Item key={i} element={item} />
          ))}
        </Stack>
      </Collapse>
    </div>
  );
};

const Item = ({ element }) => {
  const [active, setActive] = useState(false);
  const IconComponent = element.Icon;

  return (
    <Link
      to={element.to}
      className={`item ${
        window.location.pathname === element.to && element.to !== "" && "active"
      }`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <Stack
        alignItems={"center"}
        justifyContent={"center"}
        width={"30px"}
        height={"30px"}
        bgcolor={"white"}
        borderRadius={"50%"}
      >
        {element.iconType === "mui" && IconComponent ? (
          <IconComponent sx={{ fontSize: 18 }} />
        ) : (
          <HoverLottie icon={element.icon} w={25} h={25} play={active} />
        )}
      </Stack>
      <p>{element.name}</p>
    </Link>
  );
};

export default Sidebar;