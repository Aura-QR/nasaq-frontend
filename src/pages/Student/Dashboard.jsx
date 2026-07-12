import { 
  Groups,
  MenuBook,
  CalendarMonth,
  Description,
  Dashboard as DashboardIcon,
  Assignment,
  LocalLibrary,
  AssignmentTurnedIn,
  Event,
  Download,
  AccountBalanceWallet,
  DirectionsBus,
  Route,
  Logout
} from "@mui/icons-material";
import avatarImg from "@/images/avatar.png";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useStudent } from "@/utils/hooks/apis/useStudent";
import { useStudentExams, useStudentProjects, useStudentSubjects } from "@/utils/hooks/apis/student/useStudent";
import Loading from "@/components/Loading";
import Container from "@/components/Container/Container";
import Cookies from "js-cookie";

const Dashboard = () => {

  const userData = useAuthUser()();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    const cookieOptions = { domain: window.location.hostname };
    Cookies.remove("_auth", cookieOptions);
    Cookies.remove("_auth_state", cookieOptions);
    Cookies.remove("_auth_storage", cookieOptions);
    Cookies.remove("_auth_type", cookieOptions);
    localStorage.removeItem("permissions");
    navigate("/");
  };
  
  const { student, loading } = useStudent(userData?.user?.id);
  const { subjects: mySubjects, loading: loadingSubjects } = useStudentSubjects();
  const { exams: quizExamsRaw, loading: loadingExams } = useStudentExams({ examType: "quiz" });
  const { projects: projectsRaw, loading: loadingProjects } = useStudentProjects();
  const { exams: assignmentsRaw, loading: loadingAssignments } = useStudentExams({ examType: "assignment" });

  const user = {
    name: student?.name || "طالب",
    grade: student?.academicYear || "الصف العاشر",
    id: student?.schoolEmail?.split("@")[0] || "123456"
  };

  // Build subject lookup map
  const subjectMap = useMemo(() => {
    const map = new Map();
    (mySubjects || []).forEach((s) => {
      map.set(s._id, s.subjectName || "مادة غير معروفة");
    });
    return map;
  }, [mySubjects]);

  // Map & slice: upcoming quizzes (pending only, latest 2)
  const upcomingExams = useMemo(() => {
    return (quizExamsRaw || [])
      .slice(0, 2)
      .map((exam) => {
        const subjectId = exam?.subjectId || exam?.gradesCriteria?.subjectId?._id || "";
        const subjectName = subjectMap.get(subjectId) || exam?.gradesCriteria?.subjectId?.subjectName || "مادة غير معروفة";
        return {
          id: exam._id,
          title: `كويز - ${subjectName}`,
          subject: subjectName,
          startDate: exam?.createdAt ? new Date(exam.createdAt).toLocaleDateString("ar-EG") : "غير محدد",
          endDate: exam?.updatedAt ? new Date(exam.updatedAt).toLocaleDateString("ar-EG") : "غير محدد",
          duration: `${exam?.questions?.length || 0} سؤال`,
        };
      });
  }, [quizExamsRaw, subjectMap]);

  // Map & slice: projects (latest 2)
  const projects = useMemo(() => {
    return (projectsRaw || [])
      .slice(0, 2)
      .map((project) => {
        const subjectId = project?.subjectId || project?.subject?._id || "";
        const subjectName = subjectMap.get(subjectId) || project?.subject?.subjectName || "مادة غير معروفة";
        const firstFile = project?.files?.[0];
        return {
          id: project._id,
          subject: subjectName,
          title: project?.title || `مشروع - ${subjectName}`,
          fileUrl: firstFile?.url || null,
          fileName: firstFile?.name || firstFile?.originalName || null,
          filesCount: project?.files?.length || 0,
          dueDate: project?.dueDate ? new Date(project.dueDate).toLocaleDateString("ar-EG") : "غير محدد",
        };
      });
  }, [projectsRaw, subjectMap]);

  // Map & slice: assignments (pending only, latest 2)
  const assignments = useMemo(() => {
    return (assignmentsRaw || [])
      .slice(0, 2)
      .map((exam) => {
        const subjectId = exam?.subjectId || exam?.gradesCriteria?.subjectId?._id || "";
        const subjectName = subjectMap.get(subjectId) || exam?.gradesCriteria?.subjectId?.subjectName || "مادة غير معروفة";
        return {
          id: exam._id,
          title: `واجب - ${subjectName}`,
          subject: subjectName,
          startDate: exam?.createdAt ? new Date(exam.createdAt).toLocaleDateString("ar-EG") : "غير محدد",
          endDate: exam?.updatedAt ? new Date(exam.updatedAt).toLocaleDateString("ar-EG") : "غير محدد",
          duration: `${exam?.questions?.length || 0} سؤال`,
        };
      });
  }, [assignmentsRaw, subjectMap]);

  const dashboardCards = [
    {
      title: "صفي",
      icon: Groups, 
      bgColor: "bg-blue-50", 
      iconColor: "text-blue-500",
      path: "/student-dashboard/my-class"
    },
    { 
      title: "موادي", 
      icon: MenuBook, 
      bgColor: "bg-purple-50", 
      iconColor: "text-purple-600",
      path: "/student-dashboard/subjects"
    },
    { 
      title: "جدولي", 
      icon: CalendarMonth, 
      bgColor: "bg-orange-50", 
      iconColor: "text-orange-600",
      path: "/student-dashboard/schedule"
    },
    { 
      title: "الامتحانات", 
      icon: Description, 
      bgColor: "bg-pink-50", 
      iconColor: "text-pink-600",
      path: "/student-dashboard/exams"
    },
    { 
      title: "المشاريع", 
      icon: DashboardIcon, 
      bgColor: "bg-indigo-50", 
      iconColor: "text-indigo-600",
      path: "/student-dashboard/projects"
    },
    { 
      title: "الواجبات", 
      icon: Assignment, 
      bgColor: "bg-pink-50", 
      iconColor: "text-pink-600",
      path: "/student-dashboard/assignments"
    },
    { 
      title: "المكتبة", 
      icon: LocalLibrary, 
      bgColor: "bg-teal-50", 
      iconColor: "text-teal-600",
      path: "/student-dashboard/library"
    },
    { 
      title: "الحضور", 
      icon: AssignmentTurnedIn, 
      bgColor: "bg-green-50", 
      iconColor: "text-green-600",
      path: "/student-dashboard/attendance"
    },
    {
      title: "المالية",
      icon: AccountBalanceWallet,
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
      path: "/student-dashboard/financials/my-record"
    },
    {
      title: "خطة الباص",
      icon: DirectionsBus,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      path: "/student-dashboard/financials/my-bus"
    },
    {
      title: "رحلاتي",
      icon: Route,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      path: "/student-dashboard/financials/my-trips"
    }
  ];

  if (loading || loadingSubjects || loadingExams || loadingProjects || loadingAssignments) {
    return <Loading />;
  }

  return (
    <Container noSidebar={true}>
      <div className="min-h-screen p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-200">
              <img src={avatarImg} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-3xl mb-2 font-bold text-[#1E293B]">
                مرحباً بعودتك، {user.name}!
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-300">
                    {user.grade}
                </p>
                <p className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-300">
                    الرقم التعريفي: {user.id}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <Logout className="text-xl" />
            تسجيل خروج
          </button>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              to={card.path}
              className="rounded-3xl border border-gray-200 shadow-sm bg-white/80 hover:bg-white hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="flex flex-col items-center justify-center p-6">
                <div className={`w-[60px] h-[60px] rounded-3xl ${card.bgColor} flex items-center justify-center mb-3`}>
                  <card.icon className={`text-[30px] ${card.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold text-[#1E293B] text-center">
                  {card.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Exams, Projects, and Assignments Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Upcoming Exams */}
          <div className="rounded-2xl bg-white shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-red-500 rounded"></div>
              <h2 className="text-xl font-bold text-[#1E293B]">الامتحانات القادمة</h2>
            </div>

            <div className="space-y-4">
              {upcomingExams.length > 0 ? upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Description className="text-2xl text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#1E293B] mb-1">{exam.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{exam.subject}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600"><span className="font-medium">يبدأ في:</span> {exam.startDate}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">ينتهي في:</span> {exam.endDate}</p>
                      <p className="text-sm font-medium text-red-600"><span className="font-medium">عدد الأسئلة:</span> {exam.duration}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">لا توجد اختبارات قادمة</p>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="rounded-2xl bg-white shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-indigo-500 rounded"></div>
              <h2 className="text-xl font-bold text-[#1E293B]">المشاريع</h2>
            </div>

            <div className="space-y-4">
              {projects.length > 0 ? projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <p className="text-[0.7rem] uppercase font-semibold text-indigo-500 mb-1">{project.subject}</p>
                  <h3 className="text-base font-semibold text-[#1E293B] mb-3">{project.title}</h3>

                  {/* Download File — only if the project has an attached file */}
                  {project.fileUrl ? (
                    <a
                      href={project.fileUrl}
                      download={project.fileName}
                      className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors mb-3"
                    >
                      <Download className="text-indigo-600 text-xl" />
                      <p className="text-sm font-medium text-indigo-600 truncate flex-1 min-w-0">
                        {project.fileName}
                      </p>
                    </a>
                  ) : project.filesCount > 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 mb-3">
                      <Download className="text-indigo-400 text-xl" />
                      <p className="text-sm text-indigo-500">{project.filesCount} ملف مرفق</p>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Event className="text-base" />
                    <span>الموعد النهائي: {project.dueDate}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">لا توجد مشاريع حالياً</p>
              )}
            </div>
          </div>

          {/* Assignments */}
          <div className="rounded-2xl bg-white shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-pink-500 rounded"></div>
              <h2 className="text-xl font-bold text-[#1E293B]">الواجبات</h2>
            </div>

            <div className="space-y-4">
              {assignments.length > 0 ? assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                    <Assignment className="text-2xl text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#1E293B] mb-1">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{assignment.subject}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600"><span className="font-medium">يبدأ في:</span> {assignment.startDate}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">ينتهي في:</span> {assignment.endDate}</p>
                      <p className="text-sm font-medium text-pink-600"><span className="font-medium">عدد الأسئلة:</span> {assignment.duration}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">لا توجد واجبات قادمة</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Dashboard;
