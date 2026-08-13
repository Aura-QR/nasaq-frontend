import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Assignment,
  CheckCircle,
  Error,
  HourglassEmpty,
  Subject,
} from "@mui/icons-material";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Loading from "@/components/Loading";

import {
  useStudentExams,
  useStudentSubjects,
} from "@/utils/hooks/apis/student/useStudent";

import StatCard from "./components/StatCard";
import AssignmentCard from "./components/AssignmentCard";


// ======================================================
// Helpers
// ======================================================

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id ||
      value?.id ||
      ""
    ).trim();
  }

  return String(value).trim();
};


const getExamSubject = (exam) => {
  /*
   * نحاول نجيب المادة من كل الأماكن المحتملة
   * لأن الـ API ممكن يرجع:
   *
   * gradesCriteria.subjectOfferingId.subjectId
   * subjectOffering.subjectId
   * subjectOfferingId.subjectId
   * gradesCriteria.subjectId
   * subjectId
   */

  const offeringFromCriteria =
    exam?.gradesCriteria?.subjectOfferingId ||
    exam?.gradesCriteria?.subjectOffering;

  const offering =
    exam?.subjectOffering ||
    exam?.subjectOfferingId ||
    offeringFromCriteria;

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    exam?.gradesCriteria?.subjectId ||
    exam?.subjectId ||
    exam?.subject ||
    null;

  return subject;
};


const getSubjectId = (exam) => {
  const subject = getExamSubject(exam);

  return normalizeId(subject);
};


const getSubjectName = (exam) => {
  const subject = getExamSubject(exam);

  return (
    subject?.subjectName ||
    subject?.name ||
    exam?.subjectName ||
    exam?.gradesCriteria?.subjectName ||
    "مادة غير معروفة"
  );
};


const getStudentExamStatus = (exam) => {
  /*
   * الأول نعتمد على hasTaken
   */

  if (exam?.hasTaken) {
    return "completed";
  }

  const apiStatus = String(
    exam?.status || ""
  ).toLowerCase();


  /*
   * الحالات اللي ممكن يرجعها الـ Backend
   */

  if (
    apiStatus === "expired" ||
    apiStatus === "ended" ||
    apiStatus === "overdue"
  ) {
    return "overdue";
  }

  if (
    apiStatus === "available" ||
    apiStatus === "active"
  ) {
    return "pending";
  }

  if (
    apiStatus === "upcoming" ||
    apiStatus === "not_started"
  ) {
    return "upcoming";
  }


  /*
   * Fallback:
   * لو الـ Backend مرجعش status
   * نحسبها من startDate / endDate
   */

  const now = new Date();

  const startDate = exam?.startDate
    ? new Date(exam.startDate)
    : null;

  const endDate = exam?.endDate
    ? new Date(exam.endDate)
    : null;


  if (
    startDate &&
    !Number.isNaN(startDate.getTime()) &&
    now < startDate
  ) {
    return "upcoming";
  }


  if (
    endDate &&
    !Number.isNaN(endDate.getTime()) &&
    now > endDate
  ) {
    return "overdue";
  }


  /*
   * لو الامتحان داخل الفترة
   */

  if (
    startDate &&
    endDate &&
    now >= startDate &&
    now <= endDate
  ) {
    return "pending";
  }


  /*
   * default
   */

  return "upcoming";
};


// ======================================================
// Main Component
// ======================================================

const MyExams = () => {

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");


  const navigate = useNavigate();


  // ====================================================
  // Subjects
  // ====================================================

  const {
    subjects: mySubjects,
    loading: loadingSubjects,
  } = useStudentSubjects();


  // ====================================================
  // Quizzes
  //
  // GET /exams/me?examType=quiz
  // ====================================================

  const {
    exams: quizExamsRaw,
    loading: loadingQuizExams,
  } = useStudentExams({
    examType: "quiz",
  });


  // ====================================================
  // Final Exams
  //
  // GET /exams/me?examType=final
  // ====================================================

  const {
    exams: finalExamsRaw,
    loading: loadingFinalExams,
  } = useStudentExams({
    examType: "final",
  });


  // ====================================================
  // Merge quiz + final
  // ====================================================

  const exams = useMemo(() => {

    const quizList =
      Array.isArray(quizExamsRaw)
        ? quizExamsRaw
        : [];

    const finalList =
      Array.isArray(finalExamsRaw)
        ? finalExamsRaw
        : [];


    /*
     * بنعمل Map علشان لو نفس الامتحان
     * جه بالخطأ في endpointين مايتكررش.
     */

    const examsMap = new Map();


    [...finalList, ...quizList].forEach(
      (exam) => {

        const id = normalizeId(exam);

        if (!id) {
          return;
        }

        examsMap.set(id, exam);
      }
    );


    return Array.from(
      examsMap.values()
    );

  }, [
    quizExamsRaw,
    finalExamsRaw,
  ]);


  // ====================================================
  // Subject Map
  // ====================================================

  const subjectMap = useMemo(() => {

    const map = new Map();


    (mySubjects || []).forEach(
      (subject) => {

        const subjectId =
          normalizeId(subject);

        if (!subjectId) {
          return;
        }


        map.set(
          subjectId,
          {
            name:
              subject?.subjectName ||
              subject?.name ||
              "مادة غير معروفة",

            code:
              subject?.subjectCode ||
              subject?.code ||
              "",
          }
        );
      }
    );


    return map;

  }, [mySubjects]);


  // ====================================================
  // Normalize Exams
  // ====================================================

  const studentExams = useMemo(() => {

    return (exams || []).map(
      (exam) => {

        const subjectId =
          getSubjectId(exam);


        const subjectInfo =
          subjectMap.get(subjectId);


        const fallbackSubjectName =
          getSubjectName(exam);


        const subjectName =
          subjectInfo?.name ||
          fallbackSubjectName;


        const examType =
          exam?.examType ||
          exam?.type ||
          "quiz";


        const examTypeLabel =
          examType === "final"
            ? "اختبار نهائي"
            : "كويز";


        const status =
          getStudentExamStatus(exam);


        return {

          id: normalizeId(exam),

          title:
            `${examTypeLabel} - ${subjectName}`,

          subject:
            subjectName,

          subjectId,

          examType,


          startDate:
            exam?.startDate
              ? new Date(
                  exam.startDate
                ).toLocaleDateString(
                  "ar-EG"
                )
              : "غير محدد",


          endDate:
            exam?.endDate
              ? new Date(
                  exam.endDate
                ).toLocaleDateString(
                  "ar-EG"
                )
              : "غير محدد",


          duration:
            exam?.duration
              ? `${exam.duration} دقيقة`
              : "غير محدد",


          status,

          hasTaken:
            Boolean(exam?.hasTaken),

          apiStatus:
            exam?.status || "",


          /*
           * نخلي الـ original object موجود
           * لو احتجناه في صفحة الحل.
           */

          rawExam: exam,
        };
      }
    );

  }, [
    exams,
    subjectMap,
  ]);


  // ====================================================
  // Subjects Filter
  // ====================================================

  const subjects = useMemo(() => {

    return (mySubjects || [])
      .map((subject) => {

        const id =
          normalizeId(subject);

        const name =
          subject?.subjectName ||
          subject?.name ||
          "مادة";


        const code =
          subject?.subjectCode ||
          subject?.code ||
          "";


        return {
          id,

          name: code
            ? `${name} (${code})`
            : name,
        };
      })
      .filter(
        (subject) =>
          Boolean(subject.id)
      );

  }, [mySubjects]);


  // ====================================================
  // Status Filters
  // ====================================================

  const statusFilters = [

    {
      id: "",
      label: "كل الحالات",
    },

    {
      id: "pending",
      label: "متاح الآن",
    },

    {
      id: "upcoming",
      label: "لم يبدأ بعد",
    },

    {
      id: "completed",
      label: "مكتمل",
    },

    {
      id: "overdue",
      label: "منتهي",
    },
  ];


  // ====================================================
  // Filter By Subject
  // ====================================================

  const examsAfterSubjectFilter =
    useMemo(() => {

      if (!selectedSubject) {
        return studentExams;
      }


      return studentExams.filter(
        (exam) =>
          exam.subjectId ===
          selectedSubject
      );

    }, [
      studentExams,
      selectedSubject,
    ]);


  // ====================================================
  // Final Filter
  // ====================================================

  const filtered = useMemo(() => {

    if (!selectedStatus) {
      return examsAfterSubjectFilter;
    }


    return examsAfterSubjectFilter.filter(
      (exam) =>
        exam.status ===
        selectedStatus
    );

  }, [
    examsAfterSubjectFilter,
    selectedStatus,
  ]);


  // ====================================================
  // Stats
  // ====================================================

  const stats = useMemo(
    () => ({

      total:
        filtered.length,

      pending:
        filtered.filter(
          (exam) =>
            exam.status ===
            "pending"
        ).length,

      upcoming:
        filtered.filter(
          (exam) =>
            exam.status ===
            "upcoming"
        ).length,

      completed:
        filtered.filter(
          (exam) =>
            exam.status ===
            "completed"
        ).length,

      overdue:
        filtered.filter(
          (exam) =>
            exam.status ===
            "overdue"
        ).length,

    }),
    [filtered]
  );


  // ====================================================
  // Loading
  // ====================================================

  if (
    loadingSubjects ||
    loadingQuizExams ||
    loadingFinalExams
  ) {
    return <Loading />;
  }


  // ====================================================
  // Render
  // ====================================================

  return (
    <Container noSidebar={true}>

      <Back title="اختباراتي" />


      <div className="mt-6 min-h-[calc(100vh-200px)]">

        {/* =============================================
            Stats
        ============================================== */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

          <StatCard
            count={stats.total}
            label="إجمالي الاختبارات"
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


        {/* =============================================
            Subject Filter
        ============================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-4 flex flex-wrap items-center gap-4">

          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">

            <Subject
              className="text-lg"
              style={{
                color: "#318dce",
              }}
            />

            <span>
              تصفية حسب المادة:
            </span>

          </div>


          <div className="flex flex-wrap gap-2">

            {/* ALL */}

            <button
              type="button"
              onClick={() =>
                setSelectedSubject("")
              }
              className={`
                px-4
                py-1.5
                rounded-full
                text-sm
                font-semibold
                border
                transition-all
                duration-200

                ${
                  selectedSubject === ""
                    ? "text-white shadow-sm"
                    : "bg-white text-gray-600 border-gray-200"
                }
              `}
              style={
                selectedSubject === ""
                  ? {
                      backgroundColor:
                        "#318dce",

                      borderColor:
                        "#318dce",
                    }
                  : undefined
              }
            >
              الكل ({studentExams.length})
            </button>


            {/* Subjects */}

            {subjects.map(
              (subject) => {

                const count =
                  studentExams.filter(
                    (exam) =>
                      exam.subjectId ===
                      subject.id
                  ).length;


                return (
                  <button
                    type="button"
                    key={subject.id}
                    onClick={() =>
                      setSelectedSubject(
                        subject.id
                      )
                    }
                    className={`
                      px-4
                      py-1.5
                      rounded-full
                      text-sm
                      font-semibold
                      border
                      transition-all
                      duration-200

                      ${
                        selectedSubject ===
                        subject.id
                          ? "text-white shadow-sm"
                          : "bg-white text-gray-600 border-gray-200"
                      }
                    `}
                    style={
                      selectedSubject ===
                      subject.id
                        ? {
                            backgroundColor:
                              "#318dce",

                            borderColor:
                              "#318dce",
                          }
                        : undefined
                    }
                  >
                    {subject.name} ({count})
                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* =============================================
            Status Filter
        ============================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">

          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">

            <HourglassEmpty
              className="text-lg"
              style={{
                color: "#318dce",
              }}
            />

            <span>
              تصفية حسب الحالة:
            </span>

          </div>


          <div className="flex flex-wrap gap-2">

            {statusFilters.map(
              (status) => {

                /*
                 * نحسب الحالة على المادة
                 * المختارة فقط.
                 */

                const count =
                  status.id === ""
                    ? examsAfterSubjectFilter.length
                    : examsAfterSubjectFilter.filter(
                        (exam) =>
                          exam.status ===
                          status.id
                      ).length;


                return (
                  <button
                    type="button"
                    key={
                      status.id ||
                      "all-status"
                    }
                    onClick={() =>
                      setSelectedStatus(
                        status.id
                      )
                    }
                    className={`
                      px-4
                      py-1.5
                      rounded-full
                      text-sm
                      font-semibold
                      border
                      transition-all
                      duration-200

                      ${
                        selectedStatus ===
                        status.id
                          ? "text-white shadow-sm"
                          : "bg-white text-gray-600 border-gray-200"
                      }
                    `}
                    style={
                      selectedStatus ===
                      status.id
                        ? {
                            backgroundColor:
                              "#318dce",

                            borderColor:
                              "#318dce",
                          }
                        : undefined
                    }
                  >
                    {status.label} ({count})
                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* =============================================
            Exams Grid
        ============================================== */}

        {filtered.length > 0 ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {filtered.map(
              (item) => (

                <AssignmentCard
                  key={item.id}
                  item={item}

                  actionLabel={
                    item.examType === "final"
                      ? "ابدأ الاختبار"
                      : "ابدأ الكويز"
                  }

                  actionDisabled={
                    item.status !==
                    "pending"
                  }

                  onAction={() => {

                    /*
                     * حاليًا بنستخدم نفس صفحة الحل.
                     *
                     * بعد ما نتأكد من Network
                     * هنشوف هل الصفحة بتستخدم
                     * POST /exams/:id/start
                     * ولا محتاجة تعديل.
                     */

                    navigate(
                      `/student-dashboard/exams/${item.id}/quiz`,
                      {
                        state: {

                          quiz: item,

                          exam: item,

                          examType:
                            item.examType,

                          rawExam:
                            item.rawExam,
                        },
                      }
                    );
                  }}
                />

              )
            )}

          </div>

        ) : (

          <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-gray-200 bg-white">

            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor:
                  "#EEF5FF",
              }}
            >
              <Assignment
                className="text-4xl"
                style={{
                  color: "#318dce",
                  opacity: 0.5,
                }}
              />
            </div>


            <p className="text-base font-semibold text-gray-400">

              {selectedSubject
                ? "لا توجد اختبارات لهذه المادة"
                : "لا توجد اختبارات متاحة"}

            </p>

          </div>

        )}

      </div>

    </Container>
  );
};


export default MyExams;