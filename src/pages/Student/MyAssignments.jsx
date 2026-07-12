import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Assignment, Subject, CheckCircle, HourglassEmpty, Error } from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Loading from "@/components/Loading";
import { useStudentExams, useStudentSubjects } from "@/utils/hooks/apis/student/useStudent";
import StatCard from "./components/StatCard";
import AssignmentCard from "./components/AssignmentCard";


// ─── Main Page ────────────────────────────────────────────────────────────────
const MyAssignments = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const navigate = useNavigate();
  const { subjects: mySubjects, loading: loadingSubjects } = useStudentSubjects();
  const { exams, loading: loadingAssignments } = useStudentExams({ examType: "assignment" });

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

  const assignments = useMemo(() => {
    return (exams || []).map((exam) => {
      const subjectId = exam?.gradesCriteria?.subjectId?._id || exam?.subjectId || "";
      const subjectInfo = subjectMap.get(subjectId);
      const fallbackSubjectName = exam?.gradesCriteria?.subjectId?.subjectName || "مادة غير معروفة";
      const subjectName = subjectInfo?.name || fallbackSubjectName;

      let status;
      if (exam?.hasTaken) {
        status = "completed";
      } else if (exam?.status === "expired") {
        status = "overdue";
      } else if (exam?.status === "available") {
        status = "pending";
      } else {
        status = "upcoming";
      }

      return {
        id: exam?._id,
        title: `واجب - ${subjectName}`,
        subject: subjectName,
        subjectId,
        startDate: exam?.startDate ? new Date(exam.startDate).toLocaleDateString("ar-EG") : "غير محدد",
        endDate: exam?.endDate ? new Date(exam.endDate).toLocaleDateString("ar-EG") : "غير محدد",
        duration: exam?.duration ? `${exam.duration} دقيقة` : "غير محدد",
        status,
        hasTaken: exam?.hasTaken,
        apiStatus: exam?.status,
      };
    });
  }, [exams, subjectMap]);

  // Derive unique subjects from data
  const subjects = useMemo(() => {
    return (mySubjects || []).map((subject) => ({
      id: subject?._id,
      name: subject?.subjectCode
        ? `${subject?.subjectName} (${subject?.subjectCode})`
        : subject?.subjectName,
    }));
  }, [mySubjects]);

  // Filter assignments by selected subject
  const statusFilters = [
    { id: "", label: "كل الحالات" },
    { id: "pending", label: "متاح الآن" },
    { id: "upcoming", label: "لم يبدأ بعد" },
    { id: "completed", label: "مكتمل" },
    { id: "overdue", label: "منتهي" },
  ];

  const filtered = useMemo(() => {
    const subjectFiltered = selectedSubject
      ? assignments.filter((a) => a.subjectId === selectedSubject)
      : assignments;

    if (!selectedStatus) return subjectFiltered;
    return subjectFiltered.filter((a) => a.status === selectedStatus);
  }, [assignments, selectedSubject, selectedStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter((a) => a.status === "pending").length,
    upcoming: filtered.filter((a) => a.status === "upcoming").length,
    completed: filtered.filter((a) => a.status === "completed").length,
    overdue: filtered.filter((a) => a.status === "overdue").length,
  }), [filtered]);

  if (loadingSubjects || loadingAssignments) {
    return <Loading />;
  }

  return (
    <Container noSidebar={true}>
      {/* Back */}
      <Back title={"واجباتي"} />

      <div className="mt-6 min-h-[calc(100vh-200px)]">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            count={stats.total}
            label="إجمالي الواجبات"
            colorClass="text-[#318dce]"
            bgClass="bg-[#EEF5FF]"
            borderClass="border-[#BCD7FF]"
            Icon={Assignment}
          />
          <StatCard
            count={stats.pending}
            label="متاح الآن"
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
            borderClass="border-amber-200"
            Icon={HourglassEmpty}
          />
          <StatCard
            count={stats.upcoming}
            label="لم يبدأ بعد"
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            borderClass="border-blue-200"
            Icon={HourglassEmpty}
          />
          <StatCard
            count={stats.completed}
            label="مكتمل"
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            borderClass="border-emerald-200"
            Icon={CheckCircle}
          />
          <StatCard
            count={stats.overdue}
            label="منتهي"
            colorClass="text-red-600"
            bgClass="bg-red-50"
            borderClass="border-red-200"
            Icon={Error}
          />
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-4 flex flex-wrap items-center gap-4">
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
              الكل ({assignments.length})
            </button>

            {subjects.map((s) => {
              const count = assignments.filter((a) => a.subjectId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    selectedSubject === s.id
                      ? "text-white shadow-sm"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={selectedSubject === s.id ? { backgroundColor: "#318dce", borderColor: "#318dce" } : undefined}
                >
                  {s.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <HourglassEmpty className="text-lg" style={{ color: "#318dce" }} />
            <span>تصفية حسب الحالة:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => {
              const count = assignments.filter((a) => a.status === status.id || status.id === "").length;
              return (
                <button
                  key={status.id || "all-status"}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    selectedStatus === status.id
                      ? "text-white shadow-sm"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={
                    selectedStatus === status.id
                      ? { backgroundColor: "#318dce", borderColor: "#318dce" }
                      : undefined
                  }
                >
                  {status.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignments Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <AssignmentCard
                key={item.id}
                item={item}
                actionLabel="ابدأ الواجب"
                actionDisabled={item.status !== "pending"}
                onAction={() =>
                  navigate(`/student-dashboard/assignments/${item.id}/quiz`, {
                    state: { quiz: item },
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-gray-200 bg-white">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF5FF" }}>
              <Assignment className="text-4xl" style={{ color: "#318dce", opacity: 0.5 }} />
            </div>
            <p className="text-base font-semibold text-gray-400">لا توجد واجبات لهذه المادة</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default MyAssignments;
