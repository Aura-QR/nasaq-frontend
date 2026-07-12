
import { MenuBook } from "@mui/icons-material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Loading from "@/components/Loading";
import { useGradesCriteria, useStudentSubjects } from "@/utils/hooks/apis/student/useStudent";
import SubjectCard from "./components/SubjectCard";

const MySubjects = () => {
  const { subjects, loading } = useStudentSubjects();
  const { grades } = useGradesCriteria({ subjectId: "69cf7e96dc270ea66e61ca48" });
  console.log(grades)

  if (loading) return <Loading />;

  return (
    <Container noSidebar={true}>
      <Back title={"موادي الدراسية"} />

      <div className="mt-6 min-h-[calc(100vh-200px)]">
        {/* Stat */}
        <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-[#BCD7FF] bg-[#EEF5FF] px-5 py-3">
          <MenuBook className="text-[#318dce]" />
          <span className="text-sm font-semibold text-[#318dce]">
            إجمالي المواد:{" "}
            <span className="text-lg font-bold">{subjects?.length ?? 0}</span>
          </span>
        </div>

        {/* Grid */}
        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((subject, index) => (
              <SubjectCard key={subject._id} subject={subject} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <MenuBook style={{ fontSize: 64 }} />
            <p className="text-lg font-semibold">لا توجد مواد دراسية حتى الآن</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default MySubjects;