import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  ArrowBackRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  AssignmentRounded,
  EventAvailableRounded,
  FactCheckRounded,
  GradeRounded,
  GroupsRounded,
  HowToRegRounded,
  LibraryBooksRounded,
  LogoutRounded,
  MenuBookRounded,
  QuizRounded,
  RefreshRounded,
  ScheduleRounded,
  SchoolRounded,
  TaskAltRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuthUser,
  useSignOut,
} from "react-auth-kit";

import { useNavigate } from "react-router-dom";

import {
  fetchLectures,
} from "@/APIs/school/lectures";

import {
  fetchPreparations,
} from "@/APIs/school/preparation";

import {
  fetchMyClasses,
} from "@/APIs/school/classes";

import {
  fetchMyTeacherProfile,
} from "@/APIs/users/teachers";

import {
  fetchExams,
} from "@/APIs/school/exams";

import {
  fetchTeacherProjects,
  fetchProjectSubmissions,
} from "@/APIs/school/projects";

import nasaqLogo from "../../images/wadq-logo.png";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const DAY_ALIASES = {
  0: ["sunday", "sun", "الأحد", "الاحد"],
  1: ["monday", "mon", "الإثنين", "الاثنين", "الإثنين"],
  2: ["tuesday", "tue", "الثلاثاء"],
  3: ["wednesday", "wed", "الأربعاء", "الاربعاء"],
  4: ["thursday", "thu", "الخميس"],
  5: ["friday", "fri", "الجمعة"],
  6: ["saturday", "sat", "السبت"],
};

const SLOT_LABELS = {
  1: "الحصة الأولى",
  2: "الحصة الثانية",
  3: "الحصة الثالثة",
  4: "الحصة الرابعة",
  5: "الحصة الخامسة",
  6: "الحصة السادسة",
  7: "الحصة السابعة",
  8: "الحصة الثامنة",
  9: "الحصة التاسعة",
  10: "الحصة العاشرة",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "");

const extractCollection = (response, keys = []) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.docs,
    payload?.items,
    payload?.results,
    payload?.records,
    payload?.data,
    ...keys.map((key) => payload?.[key]),
  ];

  return candidates.find(Array.isArray) || [];
};

const extractEntity = (response) => {
  if (
    !response ||
    typeof response === "string" ||
    response?.status === false
  ) {
    return null;
  }

  const payload = response?.data ?? response;

  return (
    payload?.data?.teacher ||
    payload?.teacher ||
    payload?.data ||
    payload
  );
};

const getDisplayName = (...sources) => {
  const candidates = [];

  sources.filter(Boolean).forEach((source) => {
    candidates.push(
      source,
      source?.user,
      source?.teacher,
      source?.profile,
      source?.account
    );
  });

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const combinedName = [
      candidate?.firstName,
      candidate?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const name = String(
      candidate?.name ||
        candidate?.fullName ||
        candidate?.teacherName ||
        candidate?.username ||
        combinedName ||
        ""
    ).trim();

    if (name && name !== "المعلم") {
      return name;
    }
  }

  return "";
};

const getLectureId = (lecture) =>
  normalizeId(lecture);

const getPreparationId = (preparation) =>
  normalizeId(preparation);

const getPreparationLectureId = (preparation) =>
  normalizeId(
    preparation?.lecture ||
      preparation?.lectureId
  );

const getEntityName = (value) => {
  if (!value || typeof value !== "object") {
    return "";
  }

  return (
    value.subjectName ||
    value.fullName ||
    value.name ||
    value.title ||
    ""
  );
};

const getSubjectData = (lecture) => {
  const offering =
    lecture?.subjectOffering ||
    lecture?.subjectOfferingId ||
    null;

  const subject =
    lecture?.subject ||
    lecture?.subjectId ||
    offering?.subject ||
    offering?.subjectId ||
    null;

  const name =
    getEntityName(subject) ||
    lecture?.subjectName ||
    offering?.subjectName ||
    "مادة غير محددة";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    lecture?.subjectCode ||
    offering?.subjectCode ||
    "";

  return {
    name,
    code,
    label: code ? `${name} - ${code}` : name,
  };
};

const getClassData = (lecture) => {
  const classItem =
    lecture?.class ||
    lecture?.classId ||
    null;

  if (!classItem || typeof classItem !== "object") {
    return {
      name: "فصل غير محدد",
      details: "",
    };
  }

  const grade =
    classItem?.gradeLevelId?.name ||
    classItem?.gradeLevel?.name ||
    classItem?.gradeName ||
    "";

  const room =
    classItem?.roomNumber ||
    classItem?.className ||
    classItem?.name ||
    "";

  const year =
    classItem?.academicYearId?.name ||
    classItem?.academicYear?.name ||
    classItem?.academicYear ||
    "";

  const values = [grade, room]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    );

  return {
    name: values.join(" - ") || "فصل غير محدد",
    details: year,
  };
};

const getClassId = (value) =>
  normalizeId(
    value?.class ||
      value?.classId ||
      value
  );

const getClassStudentCount = (classItem) => {
  const arrayCandidates = [
    classItem?.students,
    classItem?.studentIds,
    classItem?.enrolledStudents,
    classItem?.members,
  ];

  const populated = arrayCandidates.find(Array.isArray);

  if (populated) {
    return populated.length;
  }

  const numberCandidates = [
    classItem?.studentsCount,
    classItem?.studentCount,
    classItem?.totalStudents,
    classItem?.enrolledStudentsCount,
  ];

  const numeric = numberCandidates
    .map(Number)
    .find(Number.isFinite);

  return numeric || 0;
};

const getClassRowData = (classItem) => {
  const classData = getClassData({
    class: classItem,
  });

  return {
    id: getClassId(classItem),
    label: classData.details
      ? `${classData.name} • ${classData.details}`
      : classData.name,
    students: getClassStudentCount(classItem),
  };
};

const formatLocalDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const getSlotNumber = (lecture) => {
  const value = Number(
    lecture?.slot ||
      lecture?.period ||
      lecture?.slotNumber
  );

  return Number.isFinite(value) ? value : 0;
};

const getSlotLabel = (lecture) => {
  const slot = getSlotNumber(lecture);

  return (
    SLOT_LABELS[slot] ||
    (slot ? `الحصة ${slot}` : "حصة غير محددة")
  );
};

const isLectureOnDay = (lecture, date) => {
  const aliases = DAY_ALIASES[date.getDay()] || [];
  const lectureDay = normalizeText(
    lecture?.dayOfWeek || lecture?.day
  );

  return aliases.some(
    (alias) => normalizeText(alias) === lectureDay
  );
};

const getTimestamp = (value) => {
  const dateValue =
    value?.submittedAt ||
    value?.completedAt ||
    value?.gradedAt ||
    value?.updatedAt ||
    value?.createdAt ||
    value?.dueDate ||
    value?.endDate ||
    value?.startDate ||
    value?.date ||
    "";

  const timestamp = new Date(dateValue).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatDateTime = (value) => {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return "بدون تاريخ";
  }

  try {
    return new Intl.DateTimeFormat(DATE_LOCALE, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "بدون تاريخ";
  }
};


const getExamId = (exam) => normalizeId(exam);
const getProjectId = (project) => normalizeId(project);

const EXAM_TYPE_LABELS = {
  final: "اختبار نهائي",
  assignment: "واجب",
  activity: "نشاط",
  quiz: "اختبار قصير",
};

const getEvaluationTitle = (item, fallback) =>
  String(
    item?.title ||
      item?.name ||
      item?.projectTitle ||
      EXAM_TYPE_LABELS[item?.examType] ||
      fallback ||
      ""
  ).trim();

const getStudentName = (value) => {
  const student =
    value?.studentId ||
    value?.student ||
    value;

  if (!student || typeof student !== "object") {
    return "طالب غير محدد";
  }

  const combinedName = [
    student?.firstName,
    student?.familyName || student?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    student?.name ||
    student?.fullName ||
    combinedName ||
    student?.email ||
    "طالب غير محدد"
  );
};

const getStudentId = (value) =>
  normalizeId(
    value?.studentId ||
      value?.student ||
      value
  );

const getEvaluationSubjectLabel = (item) => {
  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    null;

  const subject =
    (offering && typeof offering === "object"
      ? offering?.subjectId || offering?.subject
      : null) ||
    item?.subjectId ||
    item?.subject ||
    null;

  if (!subject || typeof subject !== "object") {
    return (
      item?.subjectName ||
      item?.subjectCode ||
      "مادة غير محددة"
    );
  }

  const name =
    subject?.subjectName ||
    subject?.name ||
    "";
  const code =
    subject?.subjectCode ||
    subject?.code ||
    "";

  return [name, code].filter(Boolean).join(" - ") ||
    "مادة غير محددة";
};

const hasProjectGrade = (submission) =>
  submission?.grade !== undefined &&
  submission?.grade !== null &&
  String(submission.grade).trim() !== "";

const isPendingProjectSubmission = (submission) =>
  Boolean(submission) && !hasProjectGrade(submission);

const loadProjectSubmissionsForDashboard = async (
  projectList
) => {
  const candidates = [...projectList]
    .filter((project) => Boolean(getProjectId(project)))
    .sort(
      (first, second) =>
        getTimestamp(second) - getTimestamp(first)
    )
    .slice(0, 25);

  const results = await Promise.allSettled(
    candidates.map(async (project) => {
      const projectId = getProjectId(project);
      const response = await fetchProjectSubmissions(
        projectId,
        {
          limit: 500,
        }
      );

      const submissions =
        response?.status === false ||
        typeof response === "string"
          ? []
          : extractCollection(response, [
              "submissions",
              "projectSubmissions",
            ]);

      return submissions.map((submission) => ({
        ...submission,
        dashboardProject: project,
      }));
    })
  );

  return results.flatMap((result) =>
    result.status === "fulfilled"
      ? result.value
      : []
  );
};

const resolveTeacherId = (
  authRoot,
  currentUser
) => {
  const candidates = [
    authRoot?.teacherId,
    authRoot?.teacher,
    authRoot?.profile,
    authRoot?.user?.teacherId,
    authRoot?.user?.teacher,
    currentUser?.teacherId,
    currentUser?.teacher,
    currentUser?.profile,
    currentUser?._id,
    currentUser?.id,
  ];

  return (
    candidates
      .map(normalizeId)
      .find(Boolean) || ""
  );
};

const loadPreparationsForTeacher = async (
  teacherId,
  lectures
) => {
  const mainResponse =
    await fetchPreparations({
      teacherId,
      limit: 500,
    });

  let preparationList =
    mainResponse?.status === false
      ? []
      : extractCollection(
          mainResponse,
          ["preparations"]
        );

  if (
    preparationList.length === 0 &&
    lectures.length > 0
  ) {
    const results = await Promise.all(
      lectures.map(async (lecture) => {
        const lectureId = getLectureId(lecture);

        if (!lectureId) {
          return [];
        }

        const primaryResponse =
          await fetchPreparations({
            lectureId,
            limit: 10,
          });

        const primaryList =
          primaryResponse?.status === false
            ? []
            : extractCollection(
                primaryResponse,
                ["preparations"]
              );

        if (primaryList.length > 0) {
          return primaryList;
        }

        // توافق مع النسخ القديمة من الباك التي كانت تستخدم lecture بدل lectureId.
        const legacyResponse =
          await fetchPreparations({
            lecture: lectureId,
            limit: 10,
          });

        return legacyResponse?.status === false
          ? []
          : extractCollection(
              legacyResponse,
              ["preparations"]
            );
      })
    );

    preparationList = results.flat();
  }

  return preparationList;
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const getAuthUser = useAuthUser();
  const signOut = useSignOut();

  const authRoot = getAuthUser?.() || {};
  const currentUser = authRoot?.user || authRoot;

  const teacherId = useMemo(
    () =>
      resolveTeacherId(
        authRoot,
        currentUser
      ),
    [authRoot, currentUser]
  );

  const [teacherProfile, setTeacherProfile] =
    useState(null);

  const [lectures, setLectures] =
    useState([]);
  const [classes, setClasses] =
    useState([]);
  const [preparations, setPreparations] =
    useState([]);
  const [exams, setExams] =
    useState([]);
  const [projects, setProjects] =
    useState([]);
  const [projectSubmissions, setProjectSubmissions] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");

  const teacherName = useMemo(() => {
    const lectureTeacher = lectures
      .map(
        (lecture) =>
          lecture?.teacher ||
          lecture?.teacherId ||
          lecture?.teacherAssignment?.teacher ||
          null
      )
      .find(Boolean);

    return (
      getDisplayName(
        teacherProfile,
        currentUser,
        authRoot,
        lectureTeacher
      ) ||
      currentUser?.email ||
      "المعلم"
    );
  }, [
    teacherProfile,
    currentUser,
    authRoot,
    lectures,
  ]);

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!teacherId) {
        setLectures([]);
        setClasses([]);
        setPreparations([]);
        setExams([]);
        setProjects([]);
        setProjectSubmissions([]);
        setError(
          "تعذر تحديد حساب المعلم الحالي. سجّل الدخول مرة أخرى أو تأكد من وجود معرّف المعلم في بيانات الجلسة."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [
          profileResponse,
          lectureResponse,
          classesResponse,
          examsResponse,
          projectsResponse,
        ] = await Promise.all([
          fetchMyTeacherProfile(),
          fetchLectures(
            {
              teacherId,
              limit: 500,
            },
            {
              force: true,
            }
          ),
          fetchMyClasses(),
          fetchExams({
            page: 1,
            limit: 100,
          }),
          fetchTeacherProjects({
            page: 1,
            limit: 100,
          }),
        ]);

        const profile =
          extractEntity(profileResponse);

        if (profile) {
          setTeacherProfile(profile);
        }

        if (lectureResponse?.status === false) {
          throw new Error(
            lectureResponse?.message ||
              "تعذر تحميل جدول المعلم"
          );
        }

        const lectureList =
          extractCollection(
            lectureResponse,
            ["lectures"]
          );

        const classList =
          classesResponse?.status === false ||
          typeof classesResponse === "string"
            ? []
            : extractCollection(
                classesResponse,
                ["classes"]
              );

        const examList =
          examsResponse?.status === false ||
          typeof examsResponse === "string"
            ? []
            : extractCollection(examsResponse, [
                "exams",
              ]);

        const projectList =
          projectsResponse?.status === false ||
          typeof projectsResponse === "string"
            ? []
            : extractCollection(projectsResponse, [
                "projects",
              ]);

        const [
          preparationList,
          submissionList,
        ] = await Promise.all([
          loadPreparationsForTeacher(
            teacherId,
            lectureList
          ),
          loadProjectSubmissionsForDashboard(
            projectList
          ),
        ]);

        setLectures(lectureList);
        setClasses(classList);
        setPreparations(preparationList);
        setExams(examList);
        setProjects(projectList);
        setProjectSubmissions(submissionList);
      } catch (requestError) {
        setLectures([]);
        setClasses([]);
        setPreparations([]);
        setExams([]);
        setProjects([]);
        setProjectSubmissions([]);
        setError(
          requestError?.message ||
            requestError?.response?.data?.message ||
            "حدث خطأ أثناء تحميل لوحة المعلم"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const preparationByLecture = useMemo(() => {
    const sorted = [...preparations].sort(
      (first, second) =>
        getTimestamp(second) -
        getTimestamp(first)
    );

    const map = new Map();

    sorted.forEach((preparation) => {
      const lectureId =
        getPreparationLectureId(
          preparation
        );

      if (
        lectureId &&
        getPreparationId(preparation) &&
        !map.has(lectureId)
      ) {
        map.set(lectureId, preparation);
      }
    });

    return map;
  }, [preparations]);

  const enrichedLectures = useMemo(
    () =>
      lectures
        .map((lecture) => ({
          ...lecture,
          dashboardPreparation:
            preparationByLecture.get(
              getLectureId(lecture)
            ) ||
            (Array.isArray(
              lecture?.preparation
            )
              ? lecture.preparation[0]
              : lecture?.preparation) ||
            null,
        }))
        .sort(
          (first, second) =>
            getSlotNumber(first) -
            getSlotNumber(second)
        ),
    [lectures, preparationByLecture]
  );

  const today = useMemo(() => new Date(), []);

  const todayLectures = useMemo(
    () =>
      enrichedLectures.filter((lecture) =>
        isLectureOnDay(lecture, today)
      ),
    [enrichedLectures, today]
  );

  const preparedLectures = useMemo(
    () =>
      enrichedLectures.filter((lecture) =>
        Boolean(
          getPreparationId(
            lecture.dashboardPreparation
          )
        )
      ),
    [enrichedLectures]
  );

  const unpreparedLectures = useMemo(
    () =>
      enrichedLectures.filter(
        (lecture) =>
          !getPreparationId(
            lecture.dashboardPreparation
          )
      ),
    [enrichedLectures]
  );

  const completionRate =
    enrichedLectures.length > 0
      ? Math.round(
          (preparedLectures.length /
            enrichedLectures.length) *
            100
        )
      : 0;

  const nextLecture =
    todayLectures[0] || null;

  const nextUnpreparedLecture =
    todayLectures.find(
      (lecture) =>
        !getPreparationId(
          lecture.dashboardPreparation
        )
    ) ||
    unpreparedLectures[0] ||
    null;

  const lectureMap = useMemo(
    () =>
      new Map(
        enrichedLectures
          .map((lecture) => [
            getLectureId(lecture),
            lecture,
          ])
          .filter(([id]) => Boolean(id))
      ),
    [enrichedLectures]
  );

  const recentPreparations = useMemo(
    () =>
      [...preparations]
        .filter((item) =>
          Boolean(getPreparationId(item))
        )
        .sort(
          (first, second) =>
            getTimestamp(second) -
            getTimestamp(first)
        )
        .slice(0, 4)
        .map((preparation) => {
          const lectureId =
            getPreparationLectureId(
              preparation
            );

          const lecture =
            lectureMap.get(lectureId) ||
            (typeof preparation?.lecture ===
            "object"
              ? preparation.lecture
              : null);

          return {
            id: getPreparationId(
              preparation
            ),
            preparation,
            lecture,
          };
        }),
    [preparations, lectureMap]
  );

  const classRows = useMemo(() => {
    const source =
      classes.length > 0
        ? classes
        : enrichedLectures
            .map(
              (lecture) =>
                lecture?.class ||
                lecture?.classId
            )
            .filter(
              (classItem) =>
                classItem &&
                typeof classItem === "object"
            );

    const map = new Map();

    source.forEach((classItem) => {
      const row = getClassRowData(classItem);

      if (!row.id || map.has(row.id)) {
        return;
      }

      map.set(row.id, row);
    });

    return Array.from(map.values());
  }, [classes, enrichedLectures]);


  const pendingProjectCorrections = useMemo(
    () =>
      projectSubmissions
        .filter(isPendingProjectSubmission)
        .map((submission, index) => {
          const project =
            submission?.dashboardProject ||
            submission?.project ||
            submission?.projectId ||
            null;
          const projectId = getProjectId(project);

          return {
            id: `project-${projectId || "unknown"}-${
              getStudentId(submission) || index
            }`,
            type: "project",
            typeLabel: "مشروع",
            title: getEvaluationTitle(
              project,
              "مشروع بدون عنوان"
            ),
            student: getStudentName(submission),
            subject: getEvaluationSubjectLabel(project),
            date:
              submission?.submittedAt ||
              submission?.updatedAt ||
              submission?.createdAt,
            path: projectId
              ? `/teacher/grading/projects?projectId=${projectId}&studentId=${getStudentId(
                  submission
                )}`
              : "/teacher/grading/projects",
          };
        }),
    [projectSubmissions]
  );

  const pendingCorrections = useMemo(
    () =>
      [...pendingProjectCorrections].sort(
        (first, second) =>
          getTimestamp({ date: second.date }) -
          getTimestamp({ date: first.date })
      ),
    [pendingProjectCorrections]
  );

  const recentEvaluations = useMemo(
    () =>
      [
        ...exams.map((exam) => ({
          id: `exam-${getExamId(exam)}`,
          type: "exam",
          typeLabel: "اختبار",
          title: getEvaluationTitle(
            exam,
            "اختبار بدون عنوان"
          ),
          subject: getEvaluationSubjectLabel(exam),
          date:
            exam?.updatedAt ||
            exam?.createdAt ||
            exam?.startDate ||
            exam?.endDate,
          path: getExamId(exam)
            ? `/teacher/grading/exams?examId=${getExamId(exam)}`
            : "/teacher/grading/exams",
        })),
        ...projects.map((project) => ({
          id: `project-${getProjectId(project)}`,
          type: "project",
          typeLabel: "مشروع",
          title: getEvaluationTitle(
            project,
            "مشروع بدون عنوان"
          ),
          subject: getEvaluationSubjectLabel(project),
          date:
            project?.updatedAt ||
            project?.createdAt ||
            project?.dueDate,
          path: getProjectId(project)
            ? `/teacher/projects?projectId=${getProjectId(project)}`
            : "/teacher/projects",
        })),
      ]
        .filter((item) => item.id)
        .sort(
          (first, second) =>
            getTimestamp({ date: second.date }) -
            getTimestamp({ date: first.date })
        )
        .slice(0, 4),
    [exams, projects]
  );

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(
        DATE_LOCALE,
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      ).format(new Date());
    } catch {
      return "اليوم";
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "صباح الخير";
    }

    if (hour < 18) {
      return "مساء الخير";
    }

    return "مساء النور";
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "حصص اليوم",
        value: todayLectures.length,
        helper:
          todayLectures.length > 0
            ? `${todayLectures.filter((lecture) =>
                Boolean(
                  getPreparationId(
                    lecture.dashboardPreparation
                  )
                )
              ).length} منها محضّرة`
            : "لا توجد حصص اليوم",
        icon: <CalendarMonthRounded />,
      },
      {
        title: "إجمالي الحصص",
        value: enrichedLectures.length,
        helper: "في جدولك الدراسي الحالي",
        icon: <ScheduleRounded />,
      },
      {
        title: "حصص محضّرة",
        value: preparedLectures.length,
        helper:
          unpreparedLectures.length > 0
            ? `${unpreparedLectures.length} حصة تحتاج تحضير`
            : "كل الحصص لديها تحضير",
        icon: <EventAvailableRounded />,
      },
      {
        title: "تسليمات تحتاج تصحيح",
        value: pendingProjectCorrections.length,
        helper:
          pendingProjectCorrections.length > 0
            ? "تسليمات مشروعات غير مصححة"
            : "لا توجد تسليمات منتظرة",
        icon: <FactCheckRounded />,
      },
    ],
    [
      todayLectures,
      enrichedLectures.length,
      preparedLectures.length,
      unpreparedLectures.length,
      pendingProjectCorrections.length,
    ]
  );

  const quickTools = useMemo(
    () => [
      {
        title: "جدولي الدراسي",
        description:
          "شاهد جميع حصص الأسبوع والتحضيرات المرتبطة بها",
        icon: <ScheduleRounded />,
        onClick: () =>
          navigate("/teacher/schedule"),
      },
      {
        title: "تسجيل الحضور",
        description: todayLectures.length
          ? "ابدأ تسجيل حضور وغياب طلاب حصص اليوم"
          : "راجع سجلات الحضور والغياب",
        icon: <HowToRegRounded />,
        onClick: () => {
          if (todayLectures[0]) {
            openAttendance(todayLectures[0]);
            return;
          }

          navigate("/teacher/attendance");
        },
      },
      {
        title: "تحضيراتي",
        description:
          "راجع ملفات التحضير الحالية وافتح تفاصيلها",
        icon: <MenuBookRounded />,
        onClick: () =>
          navigate("/school/preparation"),
      },
      {
        title: nextUnpreparedLecture
          ? "إضافة تحضير"
          : "مراجعة التحاضير",
        description: nextUnpreparedLecture
          ? `ابدأ تحضير ${
              getSubjectData(
                nextUnpreparedLecture
              ).name
            } الآن`
          : "كل حصصك الحالية لديها تحضير",
        icon: nextUnpreparedLecture ? (
          <AddRounded />
        ) : (
          <CheckCircleRounded />
        ),
        onClick: () => {
          if (nextUnpreparedLecture) {
            navigate(
              `/school/preparation/add?lectureId=${getLectureId(
                nextUnpreparedLecture
              )}`
            );
            return;
          }

          navigate("/school/preparation");
        },
      },
      {
        title: "تصحيح الاختبارات",
        description: `راجع نتائج ${exams.length} اختبار وعدّل درجات الطلاب`,
        icon: <QuizRounded />,
        onClick: () =>
          navigate("/teacher/grading/exams"),
      },
      {
        title: "تصحيح المشروعات",
        description: `${pendingProjectCorrections.length} تسليم يحتاج تصحيح من ${projects.length} مشروع`,
        icon: <FactCheckRounded />,
        onClick: () =>
          navigate("/teacher/grading/projects"),
      },
      {
        title: "المكتبة",
        description:
          "افتح المصادر والروابط التعليمية المتاحة",
        icon: <LibraryBooksRounded />,
        onClick: () =>
          navigate("/teacher/library"),
      },
      {
        title: "فصولي وطلابي",
        description: `${classRows.length} فصل مرتبط بحسابك`,
        icon: <GroupsRounded />,
        onClick: () =>
          navigate("/teacher/classes"),
      },
    ],
    [
      navigate,
      nextUnpreparedLecture,
      todayLectures,
      exams.length,
      projects.length,
      pendingProjectCorrections.length,
      classRows.length,
    ]
  );

  const openAttendance = (lecture) => {
    const classId = getClassId(lecture);
    const params = new URLSearchParams();

    if (classId) {
      params.set("classId", classId);
    }

    params.set("date", formatLocalDate());

    navigate(
      `/teacher/attendance?${params.toString()}`
    );
  };

  const handleLogout = () => {
    signOut();
    localStorage.removeItem("permissions");
    navigate("/login", {
      replace: true,
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        color: "var(--color-text)",
        backgroundColor: "var(--color-page)",
        backgroundImage: `
          radial-gradient(circle at 8% 8%, rgba(211,164,79,0.07), transparent 24%),
          radial-gradient(circle at 92% 4%, rgba(36,74,112,0.08), transparent 25%)
        `,
      }}
    >
      <Box
        component="main"
        sx={{
          width: "min(100%, 1440px)",
          mx: "auto",
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        {error && (
          <Alert
            severity="error"
            action={
              teacherId ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() =>
                    loadDashboard()
                  }
                >
                  إعادة المحاولة
                </Button>
              ) : null
            }
            sx={{
              mb: 1.5,
              borderRadius: "14px",
              fontSize: "11px",
            }}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            mb: 1.25,
            p: { xs: 1.4, sm: 1.6, md: 1.8 },
            borderRadius: "18px",
            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-deep), var(--color-navy) 58%, var(--color-navy-light))",
            boxShadow:
              "0 18px 42px rgba(18,47,77,0.18)",
            "&::before": {
              content: '\"\"',
              position: "absolute",
              width: 250,
              height: 250,
              top: -155,
              left: -70,
              border:
                "1px solid rgba(242,215,146,0.18)",
              borderRadius: "50%",
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{
              position: "relative",
              zIndex: 2,
              mb: 0,
            }}
          >
            <Box
              sx={{
                height: 36,
                minWidth: { xs: 58, sm: 72 },
                px: { xs: 0.7, sm: 0.9 },
                display: "grid",
                placeItems: "center",
                borderRadius: "11px",
                backgroundColor:
                  "rgba(255,252,247,0.94)",
                border:
                  "1px solid rgba(242,215,146,0.26)",
                boxShadow:
                  "0 8px 20px rgba(8,25,43,0.14)",
              }}
            >
              <Box
                component="img"
                src={nasaqLogo}
                alt="شعار منصة نسق"
                sx={{
                  width: { xs: 50, sm: 62 },
                  height: 29,
                  objectFit: "contain",
                }}
              />
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              gap={0.7}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={0.8}
                sx={{
                  minHeight: 36,
                  px: { xs: 0.55, sm: 0.75 },
                  borderRadius: "11px",
                  backgroundColor:
                    "rgba(255,255,255,0.08)",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    color:
                      "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {String(teacherName)
                    .trim()
                    .charAt(0)}
                </Avatar>

                <Box
                  sx={{
                    display: {
                      xs: "none",
                      sm: "block",
                    },
                    maxWidth: 180,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      color: "var(--color-white)",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    {teacherName}
                  </Typography>
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.62)",
                      fontSize: "7.5px",
                      fontWeight: 700,
                    }}
                  >
                    حساب المعلم
                  </Typography>
                </Box>
              </Stack>

              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    aria-label="تحديث البيانات"
                    disabled={refreshing}
                    onClick={() =>
                      loadDashboard({
                        silent: true,
                      })
                    }
                    sx={{
                      width: 34,
                      height: 34,
                      color: "var(--color-white)",
                      backgroundColor:
                        "rgba(255,255,255,0.08)",
                      border:
                        "1px solid rgba(255,255,255,0.12)",
                      "&:hover": {
                        backgroundColor:
                          "rgba(255,255,255,0.14)",
                      },
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress
                        size={17}
                        color="inherit"
                      />
                    ) : (
                      <RefreshRounded />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="تسجيل الخروج">
                <IconButton
                  aria-label="تسجيل الخروج"
                  onClick={handleLogout}
                  sx={{
                    width: 34,
                    height: 34,
                    color: "#ffd2d2",
                    backgroundColor:
                      "rgba(201,79,79,0.12)",
                    border:
                      "1px solid rgba(255,210,210,0.16)",
                    "&:hover": {
                      backgroundColor:
                        "rgba(201,79,79,0.20)",
                    },
                  }}
                >
                  <LogoutRounded />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
            gap={1.4}
            sx={{
              position: "relative",
              zIndex: 1,
              mt: 1.15,
            }}
          >
            <Box>
              <Chip
                icon={<AutoAwesomeRounded />}
                label="لوحة المعلم"
                size="small"
                sx={{
                  mb: 0.65,
                  color:
                    "var(--color-gold-light)",
                  backgroundColor:
                    "rgba(255,255,255,0.09)",
                  border:
                    "1px solid rgba(242,215,146,0.20)",
                  fontSize: "10px",
                  fontWeight: 800,
                  "& .MuiChip-icon": {
                    color:
                      "var(--color-gold-light)",
                  },
                }}
              />

              <Typography
                component="h1"
                sx={{
                  color: "var(--color-white)",
                  fontSize: {
                    xs: "22px",
                    sm: "27px",
                    md: "30px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.35,
                }}
              >
                {greeting}، {teacherName}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  maxWidth: 620,
                  color:
                    "rgba(255,255,255,0.74)",
                  fontSize: {
                    xs: "10px",
                    sm: "11px",
                  },
                  lineHeight: 1.55,
                }}
              >
                تابع حصصك وتحضيراتك، وابدأ يومك من مكان واحد.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                gap={1}
                sx={{ mt: 1.05 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  disabled={!nextUnpreparedLecture}
                  onClick={() => {
                    if (!nextUnpreparedLecture) {
                      return;
                    }

                    navigate(
                      `/school/preparation/add?lectureId=${getLectureId(
                        nextUnpreparedLecture
                      )}`
                    );
                  }}
                  sx={{
                    minHeight: 37,
                    px: 1.6,
                    borderRadius: "10px",
                    color:
                      "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  {nextUnpreparedLecture
                    ? "ابدأ التحضير"
                    : "كل الحصص محضّرة"}
                </Button>

                <Button
                  variant="outlined"
                  endIcon={<ArrowBackRounded />}
                  onClick={() =>
                    navigate("/teacher/schedule")
                  }
                  sx={{
                    minHeight: 37,
                    px: 1.6,
                    borderRadius: "10px",
                    color: "var(--color-white)",
                    borderColor:
                      "rgba(255,255,255,0.28)",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      borderColor:
                        "var(--color-gold-light)",
                      backgroundColor:
                        "rgba(255,255,255,0.07)",
                    },
                  }}
                >
                  عرض الجدول
                </Button>
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: {
                  xs: "100%",
                  md: 270,
                },
                p: 1.15,
                border:
                  "1px solid rgba(255,255,255,0.14)",
                borderRadius: "14px",
                color: "var(--color-white)",
                backgroundColor:
                  "rgba(255,255,255,0.075)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
              >
                <ScheduleRounded
                  sx={{
                    color:
                      "var(--color-gold-light)",
                    fontSize: 18,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  اليوم الدراسي
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 0.35,
                  color:
                    "rgba(255,255,255,0.68)",
                  fontSize: "10px",
                }}
              >
                {todayLabel}
              </Typography>

              <Divider
                sx={{
                  my: 0.75,
                  borderColor:
                    "rgba(255,255,255,0.12)",
                }}
              />

              {nextLecture ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color:
                          "rgba(255,255,255,0.62)",
                        fontSize: "9px",
                      }}
                    >
                      أول حصة في جدول اليوم
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        mt: 0.35,
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {
                        getSubjectData(nextLecture)
                          .name
                      }
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        mt: 0.25,
                        color:
                          "rgba(255,255,255,0.64)",
                        fontSize: "9px",
                      }}
                    >
                      {getClassData(nextLecture).name}
                    </Typography>
                  </Box>

                  <Chip
                    label={getSlotLabel(nextLecture)}
                    size="small"
                    sx={{
                      flexShrink: 0,
                      color:
                        "var(--color-navy-deep)",
                      backgroundColor:
                        "var(--color-gold-light)",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              ) : (
                <Typography
                  sx={{
                    color:
                      "rgba(255,255,255,0.72)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  لا توجد حصص مسجلة اليوم.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {stats.map((stat) => (
            <Paper
              key={stat.title}
              elevation={0}
              sx={{
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                minWidth: 0,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "16px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 8px 22px rgba(18,47,77,0.05)",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "9.5px",
                    fontWeight: 700,
                  }}
                >
                  {stat.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: {
                      xs: "20px",
                      md: "23px",
                    },
                    fontWeight: 800,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    mt: 0.2,
                    color: "var(--color-muted)",
                    fontSize: "8px",
                  }}
                >
                  {stat.helper}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.20)",
                  borderRadius: "11px",
                  "& svg": {
                    fontSize: 20,
                  },
                }}
              >
                {stat.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
            },
            gap: 1.5,
          }}
        >
          <Stack spacing={1.5}>
            <SectionCard
              title="أدواتك السريعة"
              subtitle="انتقل مباشرة إلى أهم مهام المعلم"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                {quickTools.map((tool) => (
                  <Button
                    key={tool.title}
                    type="button"
                    onClick={tool.onClick}
                    sx={{
                      p: 1.25,
                      minHeight: 78,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "flex-start",
                      gap: 1.2,
                      textAlign: "right",
                      border:
                        "1px solid rgba(36,74,112,0.08)",
                      borderRadius: "14px",
                      color:
                        "var(--color-navy-deep)",
                      backgroundColor:
                        "var(--color-white)",
                      textTransform: "none",
                      "&:hover": {
                        borderColor:
                          "rgba(211,164,79,0.38)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        transform:
                          "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color:
                          "var(--color-gold-dark)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        borderRadius: "11px",
                        "& svg": {
                          fontSize: 20,
                        },
                      }}
                    >
                      {tool.icon}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "11.5px",
                          fontWeight: 800,
                        }}
                      >
                        {tool.title}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.3,
                          color:
                            "var(--color-muted)",
                          fontSize: "8.5px",
                          lineHeight: 1.55,
                        }}
                      >
                        {tool.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </SectionCard>

            <SectionCard
              title="تصحيح المشروعات"
              subtitle="تسليمات الطلاب غير المصححة"
              action={
                <Button
                  type="button"
                  onClick={() =>
                    navigate("/teacher/grading/projects")
                  }
                  endIcon={<ArrowBackRounded />}
                  sx={{
                    color: "var(--color-navy)",
                    fontSize: "8.5px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  كل التسليمات
                </Button>
              }
            >
              <Alert
                severity="info"
                sx={{
                  mb: 0.9,
                  py: 0.15,
                  borderRadius: "10px",
                  fontSize: "8.5px",
                  "& .MuiAlert-icon": {
                    py: 0.45,
                    fontSize: 17,
                  },
                  "& .MuiAlert-message": {
                    py: 0.45,
                  },
                }}
              >
                صفحة تصحيح الاختبارات جاهزة وتقرأ نتائج الطلاب من تفاصيل كل اختبار. إذا لم يُرجع الباك المحاولات ستظهر ملاحظة واضحة بدل بيانات غير صحيحة.
              </Alert>

              {pendingCorrections.length > 0 ? (
                <Stack spacing={0.75}>
                  {pendingCorrections
                    .slice(0, 5)
                    .map((correction) => (
                      <Paper
                        key={correction.id}
                        elevation={0}
                        sx={{
                          p: 1.05,
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr auto",
                            sm: "42px minmax(0,1fr) auto",
                          },
                          alignItems: "center",
                          gap: 1,
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "13px",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            display: {
                              xs: "none",
                              sm: "grid",
                            },
                            placeItems: "center",
                            color: "var(--color-gold-dark)",
                            backgroundColor:
                              "var(--color-gold-soft)",
                            borderRadius: "10px",
                            "& svg": {
                              fontSize: 19,
                            },
                          }}
                        >
                          <AssignmentRounded />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={0.6}
                          >
                            <Chip
                              label={correction.typeLabel}
                              size="small"
                              sx={{
                                height: 20,
                                color: "#8a5f12",
                                backgroundColor: "#fff3d8",
                                fontSize: "7.5px",
                                fontWeight: 800,
                              }}
                            />
                            <Typography
                              noWrap
                              sx={{
                                color:
                                  "var(--color-navy-deep)",
                                fontSize: "10.5px",
                                fontWeight: 800,
                              }}
                            >
                              {correction.title}
                            </Typography>
                          </Stack>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.3,
                              color:
                                "var(--color-muted)",
                              fontSize: "8px",
                            }}
                          >
                            {correction.student} • {correction.subject} • {formatDateTime({
                              date: correction.date,
                            })}
                          </Typography>
                        </Box>

                        <Button
                          type="button"
                          size="small"
                          variant="contained"
                          startIcon={<GradeRounded />}
                          onClick={() =>
                            navigate(correction.path)
                          }
                          sx={{
                            minHeight: 31,
                            px: 1.15,
                            borderRadius: "9px",
                            color: "var(--color-white)",
                            backgroundColor:
                              "var(--color-navy)",
                            fontSize: "8.5px",
                            fontWeight: 800,
                            textTransform: "none",
                            "& .MuiButton-startIcon": {
                              marginLeft: "4px",
                              marginRight: 0,
                            },
                            "& svg": {
                              fontSize:
                                "14px !important",
                            },
                          }}
                        >
                          تصحيح الآن
                        </Button>
                      </Paper>
                    ))}

                  {pendingCorrections.length > 5 && (
                    <Typography
                      sx={{
                        color: "var(--color-muted)",
                        fontSize: "8.5px",
                        fontWeight: 700,
                      }}
                    >
                      يوجد {pendingCorrections.length - 5} تسليم إضافي ينتظر التصحيح.
                    </Typography>
                  )}
                </Stack>
              ) : (
                <EmptyState
                  icon={<TaskAltRounded />}
                  title="لا توجد تسليمات تحتاج تصحيح"
                  description="عند تسليم الطلاب للمشروعات ستظهر التسليمات غير المصححة هنا تلقائيًا."
                />
              )}
            </SectionCard>

            <SectionCard
              title="جدول اليوم"
              subtitle="حصص اليوم وحالة التحضير لكل حصة"
              action={
                <Button
                  endIcon={<ArrowBackRounded />}
                  onClick={() =>
                    navigate("/teacher/schedule")
                  }
                  sx={{
                    color: "var(--color-navy)",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  الجدول كاملًا
                </Button>
              }
            >
              {todayLectures.length > 0 ? (
                <Stack spacing={0.75}>
                  {todayLectures.map((lecture) => {
                    const preparation =
                      lecture.dashboardPreparation;
                    const hasPreparation =
                      Boolean(
                        getPreparationId(
                          preparation
                        )
                      );

                    return (
                      <Paper
                        key={getLectureId(lecture)}
                        elevation={0}
                        sx={{
                          p: 1.1,
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr auto",
                            sm: "105px 1fr auto",
                          },
                          alignItems: "center",
                          gap: 1,
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "13px",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Chip
                          label={getSlotLabel(lecture)}
                          size="small"
                          sx={{
                            display: {
                              xs: "none",
                              sm: "inline-flex",
                            },
                            color:
                              "var(--color-navy-deep)",
                            backgroundColor:
                              "rgba(36,74,112,0.06)",
                            fontSize: "8.5px",
                            fontWeight: 800,
                          }}
                        />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              color:
                                "var(--color-navy-deep)",
                              fontSize: "11.5px",
                              fontWeight: 800,
                            }}
                          >
                            {
                              getSubjectData(lecture)
                                .label
                            }
                          </Typography>
                          <Typography
                            noWrap
                            sx={{
                              mt: 0.25,
                              color:
                                "var(--color-muted)",
                              fontSize: "8.5px",
                            }}
                          >
                            {getClassData(lecture).name} • {getSlotLabel(lecture)}
                          </Typography>
                        </Box>

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="flex-end"
                          flexWrap="wrap"
                          gap={0.65}
                        >
                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            startIcon={<HowToRegRounded />}
                            onClick={() =>
                              openAttendance(lecture)
                            }
                            sx={{
                              minHeight: 31,
                              px: 1,
                              borderRadius: "9px",
                              color: "var(--color-navy)",
                              borderColor:
                                "rgba(36,74,112,0.18)",
                              backgroundColor:
                                "rgba(36,74,112,0.025)",
                              fontSize: "8.5px",
                              fontWeight: 800,
                              textTransform: "none",
                              "& .MuiButton-startIcon": {
                                marginLeft: "4px",
                                marginRight: 0,
                              },
                              "& svg": {
                                fontSize:
                                  "14px !important",
                              },
                            }}
                          >
                            تسجيل الحضور
                          </Button>

                          <Button
                            type="button"
                            size="small"
                            variant={
                              hasPreparation
                                ? "contained"
                                : "outlined"
                            }
                            startIcon={
                              hasPreparation ? (
                                <VisibilityRounded />
                              ) : (
                                <AddRounded />
                              )
                            }
                            onClick={() => {
                              if (hasPreparation) {
                                navigate(
                                  `/school/preparation/edit/${getPreparationId(
                                    preparation
                                  )}`
                                );
                                return;
                              }

                              navigate(
                                `/school/preparation/add?lectureId=${getLectureId(
                                  lecture
                                )}`
                              );
                            }}
                            sx={{
                              minHeight: 31,
                              px: 1,
                              borderRadius: "9px",
                              color: hasPreparation
                                ? "var(--color-white)"
                                : "var(--color-navy)",
                              backgroundColor:
                                hasPreparation
                                  ? "#287a51"
                                  : "transparent",
                              borderColor:
                                "rgba(36,74,112,0.18)",
                              fontSize: "8.5px",
                              fontWeight: 800,
                              textTransform: "none",
                              "& .MuiButton-startIcon": {
                                marginLeft: "4px",
                                marginRight: 0,
                              },
                              "& svg": {
                                fontSize:
                                  "14px !important",
                              },
                            }}
                          >
                            {hasPreparation
                              ? "فتح التحضير"
                              : "إضافة تحضير"}
                          </Button>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <EmptyState
                  icon={<CalendarMonthRounded />}
                  title="لا توجد حصص اليوم"
                  description="يمكنك فتح الجدول الكامل لمراجعة حصص باقي الأسبوع."
                  actionLabel="عرض الجدول"
                  onAction={() =>
                    navigate("/teacher/schedule")
                  }
                />
              )}
            </SectionCard>
          </Stack>

          <Stack spacing={1.5}>
            <SectionCard
              title="آخر التحضيرات"
              subtitle="أحدث الملفات المرتبطة بحصصك"
            >
              {recentPreparations.length > 0 ? (
                <Stack spacing={0.75}>
                  {recentPreparations.map(
                    ({ id, preparation, lecture }) => (
                      <Paper
                        key={id}
                        elevation={0}
                        sx={{
                          p: 1.05,
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "13px",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                color:
                                  "var(--color-navy-deep)",
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              {lecture
                                ? getSubjectData(
                                    lecture
                                  ).label
                                : "تحضير حصة"}
                            </Typography>
                            <Typography
                              noWrap
                              sx={{
                                mt: 0.25,
                                color:
                                  "var(--color-muted)",
                                fontSize: "8px",
                              }}
                            >
                              {lecture
                                ? `${
                                    getClassData(
                                      lecture
                                    ).name
                                  } • ${getSlotLabel(
                                    lecture
                                  )}`
                                : "بيانات الحصة غير مكتملة"}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.25,
                                color:
                                  "var(--color-muted)",
                                fontSize: "7.5px",
                              }}
                            >
                              {formatDateTime(
                                preparation
                              )}
                            </Typography>
                          </Box>

                          <Tooltip title="فتح التحضير">
                            <IconButton
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/school/preparation/edit/${id}`
                                )
                              }
                              sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                color:
                                  "var(--color-navy)",
                                backgroundColor:
                                  "rgba(36,74,112,0.055)",
                                border:
                                  "1px solid rgba(36,74,112,0.08)",
                                borderRadius: "9px",
                              }}
                            >
                              <VisibilityRounded
                                sx={{ fontSize: 17 }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    )
                  )}

                  <Button
                    type="button"
                    onClick={() =>
                      navigate("/school/preparation")
                    }
                    endIcon={<ArrowBackRounded />}
                    sx={{
                      alignSelf: "flex-start",
                      color: "var(--color-navy)",
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    جميع التحضيرات
                  </Button>
                </Stack>
              ) : (
                <EmptyState
                  icon={<MenuBookRounded />}
                  title="لا توجد تحضيرات بعد"
                  description="ابدأ بإضافة تحضير لإحدى حصصك من الجدول."
                  actionLabel="فتح الجدول"
                  onAction={() =>
                    navigate("/teacher/schedule")
                  }
                />
              )}
            </SectionCard>

            <SectionCard
              title="الاختبارات والمشروعات"
              subtitle="ملخص أعمال التقييم الخاصة بفصولك"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 0.8,
                }}
              >
                <Button
                  type="button"
                  onClick={() =>
                    navigate("/teacher/exams")
                  }
                  sx={{
                    p: 1,
                    display: "block",
                    textAlign: "right",
                    border:
                      "1px solid rgba(36,74,112,0.07)",
                    borderRadius: "12px",
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-white)",
                    textTransform: "none",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={0.6}
                  >
                    <QuizRounded
                      sx={{
                        color: "var(--color-navy)",
                        fontSize: 19,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "17px",
                        fontWeight: 800,
                      }}
                    >
                      {exams.length}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    اختباراتي
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      mt: 0.2,
                      color: "var(--color-muted)",
                      fontSize: "7.5px",
                    }}
                  >
                    التصحيح من تفاصيل الاختبار
                  </Typography>
                </Button>

                <Button
                  type="button"
                  onClick={() =>
                    navigate("/teacher/projects")
                  }
                  sx={{
                    p: 1,
                    display: "block",
                    textAlign: "right",
                    border:
                      "1px solid rgba(36,74,112,0.07)",
                    borderRadius: "12px",
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-white)",
                    textTransform: "none",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={0.6}
                  >
                    <AssignmentRounded
                      sx={{
                        color:
                          "var(--color-gold-dark)",
                        fontSize: 19,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "17px",
                        fontWeight: 800,
                      }}
                    >
                      {projects.length}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    مشروعاتي
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      mt: 0.2,
                      color: "var(--color-muted)",
                      fontSize: "7.5px",
                    }}
                  >
                    {pendingProjectCorrections.length} تسليم ينتظر التصحيح
                  </Typography>
                </Button>
              </Box>

              {recentEvaluations.length > 0 && (
                <Stack
                  spacing={0.65}
                  sx={{ mt: 0.9 }}
                >
                  {recentEvaluations.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate(item.path)
                      }
                      sx={{
                        p: 0.75,
                        justifyContent: "flex-start",
                        gap: 0.7,
                        textAlign: "right",
                        borderRadius: "10px",
                        color:
                          "var(--color-navy-deep)",
                        backgroundColor:
                          "rgba(36,74,112,0.025)",
                        textTransform: "none",
                      }}
                    >
                      {item.type === "exam" ? (
                        <QuizRounded
                          sx={{ fontSize: 16 }}
                        />
                      ) : (
                        <AssignmentRounded
                          sx={{ fontSize: 16 }}
                        />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: "8.5px",
                            fontWeight: 800,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          noWrap
                          sx={{
                            color:
                              "var(--color-muted)",
                            fontSize: "7px",
                          }}
                        >
                          {item.typeLabel} • {item.subject}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard
              title="فصولي"
              subtitle="الفصول المسندة إليك وعدد الطلاب"
            >
              {classRows.length > 0 ? (
                <Stack spacing={0.7}>
                  {classRows.slice(0, 5).map((classItem) => (
                    <Paper
                      key={classItem.id}
                      elevation={0}
                      sx={{
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        border:
                          "1px solid rgba(36,74,112,0.07)",
                        borderRadius: "12px",
                        backgroundColor:
                          "var(--color-white)",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.8}
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 31,
                            height: 31,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            color:
                              "var(--color-navy)",
                            backgroundColor:
                              "rgba(36,74,112,0.06)",
                            borderRadius: "9px",
                            "& svg": {
                              fontSize: 17,
                            },
                          }}
                        >
                          <GroupsRounded />
                        </Box>

                        <Typography
                          noWrap
                          sx={{
                            color:
                              "var(--color-navy-deep)",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          {classItem.label}
                        </Typography>
                      </Stack>

                      <Chip
                        label={`${classItem.students} طالب`}
                        size="small"
                        sx={{
                          flexShrink: 0,
                          color: "#287a51",
                          backgroundColor: "#e7f6ed",
                          fontSize: "8px",
                          fontWeight: 800,
                        }}
                      />
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  icon={<GroupsRounded />}
                  title="لا توجد فصول مرتبطة بحسابك"
                  description="ستظهر هنا الفصول المسندة إليك من الإدارة."
                />
              )}
            </SectionCard>

            <Paper
              elevation={0}
              sx={{
                p: 1.7,
                overflow: "hidden",
                borderRadius: "17px",
                color: "var(--color-white)",
                background:
                  "linear-gradient(145deg, var(--color-navy), var(--color-navy-deep))",
                boxShadow:
                  "0 13px 32px rgba(18,47,77,0.14)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Typography
                    sx={{
                      color:
                        "var(--color-gold-light)",
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    اكتمال التحضير
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    {completionRate}%
                  </Typography>
                </Box>

                {completionRate === 100 ? (
                  <CheckCircleRounded
                    sx={{
                      color:
                        "var(--color-gold-light)",
                      fontSize: 30,
                    }}
                  />
                ) : (
                  <WarningAmberRounded
                    sx={{
                      color:
                        "var(--color-gold-light)",
                      fontSize: 30,
                    }}
                  />
                )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.6,
                  color:
                    "rgba(255,255,255,0.68)",
                  fontSize: "9px",
                  lineHeight: 1.6,
                }}
              >
                {enrichedLectures.length === 0
                  ? "لم تتم إضافة حصص إلى جدولك حتى الآن."
                  : unpreparedLectures.length === 0
                  ? "كل حصص جدولك لديها تحضير."
                  : `متبقي ${unpreparedLectures.length} حصة بدون تحضير.`}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{
                  height: 7,
                  mt: 1.4,
                  borderRadius: 999,
                  backgroundColor:
                    "rgba(255,255,255,0.12)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor:
                      "var(--color-gold-light)",
                  },
                }}
              />
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.35, sm: 1.6 },
      border:
        "1px solid rgba(36,74,112,0.08)",
      borderRadius: "17px",
      backgroundColor:
        "var(--color-cream)",
      boxShadow:
        "0 9px 24px rgba(18,47,77,0.055)",
    }}
  >
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      gap={1}
      sx={{ mb: 1.2 }}
    >
      <Box>
        <Typography
          component="h2"
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.2,
            color: "var(--color-muted)",
            fontSize: "8.5px",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Stack>

    {children}
  </Paper>
);

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <Stack
    alignItems="center"
    spacing={0.65}
    sx={{
      minHeight: 145,
      py: 2,
      px: 1,
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        backgroundColor:
          "var(--color-gold-soft)",
        borderRadius: "12px",
        "& svg": {
          fontSize: 22,
        },
      }}
    >
      {icon}
    </Box>

    <Typography
      sx={{
        color: "var(--color-navy-deep)",
        fontSize: "11px",
        fontWeight: 800,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        maxWidth: 330,
        color: "var(--color-muted)",
        fontSize: "8.5px",
        lineHeight: 1.6,
      }}
    >
      {description}
    </Typography>

    {actionLabel && onAction && (
      <Button
        type="button"
        size="small"
        onClick={onAction}
        sx={{
          mt: 0.25,
          color: "var(--color-navy)",
          fontSize: "9px",
          fontWeight: 800,
          textTransform: "none",
        }}
      >
        {actionLabel}
      </Button>
    )}
  </Stack>
);

const DashboardSkeleton = () => (
  <Box
    dir="rtl"
    sx={{
      minHeight: "100vh",
      p: { xs: 1.5, md: 3 },
      backgroundColor: "var(--color-page)",
    }}
  >
    <Box
      sx={{
        width: "min(100%, 1380px)",
        mx: "auto",
      }}
    >
      <Skeleton
        variant="rounded"
        height={235}
        sx={{
          mb: 1.5,
          borderRadius: "22px",
        }}
      />
      <Box
        sx={{
          mb: 1.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1,
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={88}
            sx={{ borderRadius: "16px" }}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.35fr 0.65fr",
          },
          gap: 1.5,
        }}
      >
        <Skeleton
          variant="rounded"
          height={390}
          sx={{ borderRadius: "17px" }}
        />
        <Skeleton
          variant="rounded"
          height={390}
          sx={{ borderRadius: "17px" }}
        />
      </Box>
    </Box>
  </Box>
);

export default TeacherDashboard;
