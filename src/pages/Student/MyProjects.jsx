import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Assignment, HourglassEmpty, Subject, CheckCircle } from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Loading from "@/components/Loading";
import { useStudentProjects, useStudentSubjects } from "@/utils/hooks/apis/student/useStudent";
import { fetchProjectSubmission } from "@/APIs/student";
import StatCard from "./components/StatCard";
import ProjectCard from "./components/ProjectCard";

const MyProjects = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const navigate = useNavigate();
  const { subjects: mySubjects, loading: loadingSubjects } = useStudentSubjects();
  const { projects, loading: loadingProjects } = useStudentProjects();

  // Fetch all submissions in parallel once projects are loaded
  useEffect(() => {
    if (!projects?.length) return;
    const fetchAll = async () => {
      setLoadingSubmissions(true);
      const results = await Promise.all(
        projects.map(async (p) => {
          const res = await fetchProjectSubmission(p._id);
          return { id: p._id, data: res?.status ? res.data : null };
        })
      );
      const map = {};
      results.forEach(({ id, data }) => { map[id] = data; });
      setSubmissions(map);
      setLoadingSubmissions(false);
    };
    fetchAll();
  }, [projects]);

  const subjectMap = useMemo(() => {
    const map = new Map();
    (mySubjects || []).forEach((subject) => {
      map.set(subject?._id, {
        name: subject?.subjectName || "مادة غير معروفة",
        code: subject?.subjectCode || "",
      });
    });
    return map;
  }, [mySubjects]);

  const mappedProjects = useMemo(() => {
    return (projects || []).map((project) => {
      const subjectId = project?.subjectId?._id || project?.subjectId || project?.subject?._id || "";
      const subjectInfo = subjectMap.get(subjectId);
      const fallbackSubjectName =
        project?.subjectId?.subjectName || project?.subject?.subjectName || "مادة غير معروفة";
      const subjectName = subjectInfo?.name || fallbackSubjectName;

      const due = project?.dueDate ? new Date(project.dueDate) : null;
      const isOverdue = due && due < new Date();

      const filesCount = project?.files?.length || 0;
      const filesLabel = filesCount === 1 ? "1 ملف مرفق" : `${filesCount} ملفات مرفقة`;

      const sub = submissions[project._id];
      const isGraded = sub && sub.achievedGrade !== null && sub.achievedGrade !== undefined;
      const isSubmitted = sub && Array.isArray(sub.files) && sub.files.length > 0;

      let status;
      if (isGraded) status = "graded";
      else if (isSubmitted) status = "submitted";
      else if (isOverdue) status = "overdue";
      else status = "pending";

      return {
        id: project?._id,
        title: project?.title || `مشروع - ${subjectName}`,
        subject: subjectName,
        subjectId,
        startDate: project?.createdAt
          ? new Date(project.createdAt).toLocaleDateString("ar-EG")
          : "غير محدد",
        endDate: due ? due.toLocaleDateString("ar-EG") : "غير محدد",
        filesLabel,
        status,
        achievedGrade: sub?.achievedGrade ?? null,
        maxGrade: sub?.maxGrade ?? null,
      };
    });
  }, [projects, subjectMap, submissions]);

  const subjects = useMemo(() => {
    return (mySubjects || []).map((subject) => ({
      id: subject?._id,
      name: subject?.subjectCode
        ? `${subject?.subjectName} (${subject?.subjectCode})`
        : subject?.subjectName,
    }));
  }, [mySubjects]);

  const filtered = useMemo(() => {
    if (!selectedSubject) return mappedProjects;
    return mappedProjects.filter((p) => p.subjectId === selectedSubject);
  }, [mappedProjects, selectedSubject]);

  const stats = useMemo(() => ({
    total: mappedProjects.length,
    pending: mappedProjects.filter((p) => p.status === "pending" || p.status === "overdue").length,
    submitted: mappedProjects.filter((p) => p.status === "submitted").length,
    graded: mappedProjects.filter((p) => p.status === "graded").length,
  }), [mappedProjects]);

  if (loadingSubjects || loadingProjects) {
    return <Loading />;
  }

  return (
    <Container noSidebar={true}>
      <Back title={"مشاريعي"} />

      <div className="mt-6 min-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            count={stats.total}
            label="إجمالي المشاريع"
            colorClass="text-[#318dce]"
            bgClass="bg-[#EEF5FF]"
            borderClass="border-[#BCD7FF]"
            Icon={Assignment}
          />
          <StatCard
            count={stats.pending}
            label="لم يُسلَّم"
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
            borderClass="border-amber-200"
            Icon={HourglassEmpty}
          />
          <StatCard
            count={stats.submitted}
            label="بانتظار التصحيح"
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            borderClass="border-blue-200"
            Icon={HourglassEmpty}
          />
          <StatCard
            count={stats.graded}
            label="تم التصحيح"
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            borderClass="border-emerald-200"
            Icon={CheckCircle}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Subject className="text-lg" style={{ color: "#318dce" }} />
            <span>تصفية حسب المادة:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject("")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                selectedSubject === ""
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
              style={selectedSubject === "" ? { backgroundColor: "#318dce", borderColor: "#318dce" } : undefined}
            >
              الكل ({mappedProjects.length})
            </button>

            {subjects.map((subject) => {
              const count = mappedProjects.filter((p) => p.subjectId === subject.id).length;
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    selectedSubject === subject.id
                      ? "text-white shadow-sm"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={
                    selectedSubject === subject.id
                      ? { backgroundColor: "#318dce", borderColor: "#318dce" }
                      : undefined
                  }
                >
                  {subject.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <ProjectCard
                key={item.id}
                item={item}
                loadingSubmission={loadingSubmissions}
                onAction={() =>
                  navigate(`/student-dashboard/projects/${item.id}`, {
                    state: {
                      project: projects.find((p) => p._id === item.id),
                      subjectName: item.subject,
                    },
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-gray-200 bg-white">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#EEF5FF" }}
            >
              <Assignment className="text-4xl" style={{ color: "#318dce", opacity: 0.5 }} />
            </div>
            <p className="text-base font-semibold text-gray-400">لا توجد مشاريع لهذه المادة</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default MyProjects;