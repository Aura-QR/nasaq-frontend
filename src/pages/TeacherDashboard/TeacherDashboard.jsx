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
  LocationOnRounded,
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
            ? `/school/exams/${getExamId(exam)}`
            : "/teacher/exams",
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
            ? `/school/projects/${getProjectId(project)}`
            : "/school/projects",
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
        title: "حضور الطلاب",
        description: todayLectures.length
          ? "ابدأ تسجيل حضور وغياب طلاب حصص اليوم"
          : "راجع سجلات حضور وغياب الطلاب",
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
        title: "تسجيل حضوري",
        description:
          "سجل حضورك الشخصي باستخدام الموقع الجغرافي وشبكة المدرسة",
        icon: <LocationOnRounded />,
        onClick: () =>
          navigate("/teacher/check-in"),
      },
      {
        title: "تحضيراتي",
        description:
          "راجع ملفات التحضير الحالية وافتح تفاصيلها",
        icon: <MenuBookRounded />,
        onClick: () =>
          navigate("/teacher/preparations"),
      },
      {
        title: "إضافة تحضير",
        description:
          "اختر الحصة من الجدول ثم ابدأ رفع ملف التحضير",
        icon: <AddRounded />,
        onClick: () =>
          navigate(
            "/teacher/schedule?mode=prepare"
          ),
      },
      {
        title: "اختباراتي",
        description: `${exams.length} اختبار • التصحيح من تفاصيل الاختبار`,
        icon: <QuizRounded />,
        onClick: () =>
          navigate("/teacher/exams"),
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
          width: "100%",
          maxWidth: "1680px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          py: { xs: 2, sm: 2.5, md: 3.5 },
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
                  sx={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}
                >
                  إعادة المحاولة
                </Button>
              ) : null
            }
            sx={{
              mb: 2,
              borderRadius: "16px",
              fontSize: "13.5px",
              py: 1,
              px: 2,
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
            mb: { xs: 2, md: 2.5 },
            p: { xs: 2.2, sm: 2.8, md: 3.2 },
            borderRadius: "22px",
            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-deep), var(--color-navy) 58%, var(--color-navy-light))",
            boxShadow:
              "0 18px 42px rgba(18,47,77,0.18)",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 320,
              height: 320,
              top: -180,
              left: -90,
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
            gap={1.5}
            sx={{
              position: "relative",
              zIndex: 2,
              mb: 0,
            }}
          >
            <Box
              sx={{
                height: { xs: 40, sm: 46 },
                minWidth: { xs: 68, sm: 88 },
                px: { xs: 1, sm: 1.25 },
                display: "grid",
                placeItems: "center",
                borderRadius: "13px",
                backgroundColor:
                  "rgba(255,252,247,0.95)",
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
                  width: { xs: 58, sm: 74 },
                  height: { xs: 30, sm: 36 },
                  objectFit: "contain",
                }}
              />
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1.2}
                role="button"
                tabIndex={0}
                aria-label="فتح الملف الشخصي"
                onClick={() => navigate("/teacher/profile")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/teacher/profile");
                  }
                }}
                sx={{
                  minHeight: 44,
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: "14px",
                  backgroundColor:
                    "rgba(255,255,255,0.08)",
                  border:
                    "1px solid rgba(255,255,255,0.14)",
                  cursor: "pointer",
                  transition: "background-color .18s ease, transform .18s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    transform: "translateY(-1px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid rgba(255,223,140,.85)",
                    outlineOffset: 2,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    color:
                      "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    fontSize: "15px",
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
                    maxWidth: 220,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      color: "var(--color-white)",
                      fontSize: "13.5px",
                      fontWeight: 800,
                    }}
                  >
                    {teacherName}
                  </Typography>
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.68)",
                      fontSize: "11.5px",
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
                      width: 42,
                      height: 42,
                      color: "var(--color-white)",
                      backgroundColor:
                        "rgba(255,255,255,0.08)",
                      border:
                        "1px solid rgba(255,255,255,0.14)",
                      "&:hover": {
                        backgroundColor:
                          "rgba(255,255,255,0.16)",
                      },
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress
                        size={20}
                        color="inherit"
                      />
                    ) : (
                      <RefreshRounded sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="تسجيل الخروج">
                <IconButton
                  aria-label="تسجيل الخروج"
                  onClick={handleLogout}
                  sx={{
                    width: 42,
                    height: 42,
                    color: "#ffd2d2",
                    backgroundColor:
                      "rgba(201,79,79,0.14)",
                    border:
                      "1px solid rgba(255,210,210,0.18)",
                    "&:hover": {
                      backgroundColor:
                        "rgba(201,79,79,0.24)",
                    },
                  }}
                >
                  <LogoutRounded sx={{ fontSize: 21 }} />
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
            gap={2}
            sx={{
              position: "relative",
              zIndex: 1,
              mt: { xs: 1.8, md: 2.2 },
            }}
          >
            <Box>
              <Chip
                icon={<AutoAwesomeRounded sx={{ fontSize: "16px !important" }} />}
                label="لوحة المعلم"
                size="small"
                sx={{
                  mb: 1,
                  py: 0.6,
                  px: 0.5,
                  color:
                    "var(--color-gold-light)",
                  backgroundColor:
                    "rgba(255,255,255,0.10)",
                  border:
                    "1px solid rgba(242,215,146,0.24)",
                  fontSize: "12px",
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
                    xs: "24px",
                    sm: "28px",
                    md: "32px",
                    lg: "36px",
                  },
                  fontWeight: 900,
                  lineHeight: 1.3,
                }}
              >
                {greeting}، {teacherName}
              </Typography>

              <Typography
                sx={{
                  mt: 0.6,
                  maxWidth: 720,
                  color:
                    "rgba(255,255,255,0.80)",
                  fontSize: {
                    xs: "13px",
                    sm: "14.5px",
                  },
                  lineHeight: 1.6,
                }}
              >
                تابع حصصك وتحضيراتك، وابدأ يومك من مكان واحد بكل سهولة.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                gap={1.2}
                sx={{ mt: 1.8 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() =>
                    navigate(
                      "/teacher/schedule?mode=prepare"
                    )
                  }
                  sx={{
                    minHeight: 44,
                    px: 2.4,
                    borderRadius: "12px",
                    color:
                      "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-gold-light)",
                    fontSize: "13.5px",
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 6px 16px rgba(211,164,79,0.25)",
                    "&:hover": {
                      backgroundColor: "#e8be6b",
                    },
                  }}
                >
                  اختر حصة للتحضير
                </Button>

                <Button
                  variant="outlined"
                  endIcon={<ArrowBackRounded />}
                  onClick={() =>
                    navigate("/teacher/schedule")
                  }
                  sx={{
                    minHeight: 44,
                    px: 2.2,
                    borderRadius: "12px",
                    color: "var(--color-white)",
                    borderColor:
                      "rgba(255,255,255,0.32)",
                    fontSize: "13.5px",
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      borderColor:
                        "var(--color-gold-light)",
                      backgroundColor:
                        "rgba(255,255,255,0.10)",
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
                  md: 330,
                  lg: 350,
                },
                p: { xs: 1.8, md: 2.2 },
                border:
                  "1px solid rgba(255,255,255,0.16)",
                borderRadius: "18px",
                color: "var(--color-white)",
                backgroundColor:
                  "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <ScheduleRounded
                  sx={{
                    color:
                      "var(--color-gold-light)",
                    fontSize: 22,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  اليوم الدراسي
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 0.5,
                  color:
                    "rgba(255,255,255,0.72)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {todayLabel}
              </Typography>

              <Divider
                sx={{
                  my: 1.2,
                  borderColor:
                    "rgba(255,255,255,0.14)",
                }}
              />

              {nextLecture ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1.2}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color:
                          "rgba(255,255,255,0.65)",
                        fontSize: "11.5px",
                        fontWeight: 600,
                      }}
                    >
                      أول حصة في جدول اليوم
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        mt: 0.4,
                        fontSize: "15px",
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
                        mt: 0.3,
                        color:
                          "rgba(255,255,255,0.70)",
                        fontSize: "12.5px",
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
                      height: 28,
                      color:
                        "var(--color-navy-deep)",
                      backgroundColor:
                        "var(--color-gold-light)",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              ) : (
                <Typography
                  sx={{
                    color:
                      "rgba(255,255,255,0.78)",
                    fontSize: "13.5px",
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
            mb: { xs: 2, md: 3 },
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
          }}
        >
          {stats.map((stat) => (
            <Paper
              key={stat.title}
              elevation={0}
              sx={{
                p: { xs: 1.8, sm: 2.2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                minWidth: 0,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 8px 22px rgba(18,47,77,0.05)",
                transition: "transform .2s ease, box-shadow .2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 28px rgba(18,47,77,0.08)",
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {stat.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.4,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: {
                      xs: "24px",
                      sm: "28px",
                      md: "32px",
                    },
                    fontWeight: 900,
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    mt: 0.4,
                    color: "var(--color-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {stat.helper}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: { xs: 44, sm: 52 },
                  height: { xs: 44, sm: 52 },
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.20)",
                  borderRadius: "14px",
                  "& svg": {
                    fontSize: { xs: 22, sm: 26 },
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
              lg: "minmax(0, 1.4fr) minmax(360px, 0.6fr)",
            },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Stack spacing={{ xs: 2, md: 3 }}>
            <SectionCard
              title="أدواتك السريعة"
              subtitle="انتقل مباشرة إلى أهم مهام المعلم اليومية"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {quickTools.map((tool) => (
                  <Button
                    key={tool.title}
                    type="button"
                    onClick={tool.onClick}
                    sx={{
                      p: 2,
                      minHeight: 88,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "flex-start",
                      gap: 1.5,
                      textAlign: "right",
                      border:
                        "1px solid rgba(36,74,112,0.08)",
                      borderRadius: "16px",
                      color:
                        "var(--color-navy-deep)",
                      backgroundColor:
                        "var(--color-white)",
                      textTransform: "none",
                      transition: "all .2s ease",
                      "&:hover": {
                        borderColor:
                          "rgba(211,164,79,0.42)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        transform:
                          "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(18,47,77,0.06)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color:
                          "var(--color-gold-dark)",
                        backgroundColor:
                          "var(--color-gold-soft)",
                        borderRadius: "13px",
                        "& svg": {
                          fontSize: 24,
                        },
                      }}
                    >
                      {tool.icon}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "14.5px",
                          fontWeight: 800,
                        }}
                      >
                        {tool.title}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.4,
                          color:
                            "var(--color-muted)",
                          fontSize: "12px",
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
                    fontSize: "13px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  كل التسليمات
                </Button>
              }
            >
             
              {pendingCorrections.length > 0 ? (
                <Stack spacing={1.2}>
                  {pendingCorrections
                    .slice(0, 5)
                    .map((correction) => (
                      <Paper
                        key={correction.id}
                        elevation={0}
                        sx={{
                          p: { xs: 1.4, sm: 1.8 },
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr auto",
                            sm: "48px minmax(0,1fr) auto",
                          },
                          alignItems: "center",
                          gap: 1.5,
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "16px",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            display: {
                              xs: "none",
                              sm: "grid",
                            },
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
                          <AssignmentRounded />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={0.8}
                          >
                            <Chip
                              label={correction.typeLabel}
                              size="small"
                              sx={{
                                height: 24,
                                color: "#8a5f12",
                                backgroundColor: "#fff3d8",
                                fontSize: "11.5px",
                                fontWeight: 800,
                              }}
                            />
                            <Typography
                              noWrap
                              sx={{
                                color:
                                  "var(--color-navy-deep)",
                                fontSize: "14.5px",
                                fontWeight: 800,
                              }}
                            >
                              {correction.title}
                            </Typography>
                          </Stack>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.4,
                              color:
                                "var(--color-muted)",
                              fontSize: "12.5px",
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
                            minHeight: 38,
                            px: 1.8,
                            borderRadius: "11px",
                            color: "var(--color-white)",
                            backgroundColor:
                              "var(--color-navy)",
                            fontSize: "12.5px",
                            fontWeight: 800,
                            textTransform: "none",
                            "& .MuiButton-startIcon": {
                              marginLeft: "6px",
                              marginRight: 0,
                            },
                            "& svg": {
                              fontSize: "16px !important",
                            },
                            "&:hover": {
                              backgroundColor: "var(--color-navy-deep)",
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
                        fontSize: "12.5px",
                        fontWeight: 700,
                        pt: 0.5,
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
                    fontSize: "13px",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  الجدول كاملًا
                </Button>
              }
            >
              {todayLectures.length > 0 ? (
                <Stack spacing={1.2}>
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
                          p: { xs: 1.4, sm: 1.8 },
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr auto",
                            sm: "120px 1fr auto",
                          },
                          alignItems: "center",
                          gap: 1.5,
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "16px",
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
                            height: 28,
                            color:
                              "var(--color-navy-deep)",
                            backgroundColor:
                              "rgba(36,74,112,0.06)",
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              color:
                                "var(--color-navy-deep)",
                              fontSize: "15px",
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
                              mt: 0.35,
                              color:
                                "var(--color-muted)",
                              fontSize: "12.5px",
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
                          gap={0.8}
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
                              minHeight: 38,
                              px: 1.5,
                              borderRadius: "11px",
                              color: "var(--color-navy)",
                              borderColor:
                                "rgba(36,74,112,0.22)",
                              backgroundColor:
                                "rgba(36,74,112,0.025)",
                              fontSize: "12.5px",
                              fontWeight: 800,
                              textTransform: "none",
                              "& .MuiButton-startIcon": {
                                marginLeft: "6px",
                                marginRight: 0,
                              },
                              "& svg": {
                                fontSize: "16px !important",
                              },
                              "&:hover": {
                                backgroundColor: "rgba(36,74,112,0.07)",
                                borderColor: "var(--color-navy)",
                              },
                            }}
                          >
                            حضور الطلاب
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
                                  `/teacher/preparations/${getPreparationId(
                                    preparation
                                  )}`
                                );
                                return;
                              }

                              navigate(
                                `/teacher/schedule?mode=prepare`
                              );
                            }}
                            sx={{
                              minHeight: 38,
                              px: 1.5,
                              borderRadius: "11px",
                              color: hasPreparation
                                ? "var(--color-white)"
                                : "var(--color-navy)",
                              backgroundColor:
                                hasPreparation
                                  ? "#287a51"
                                  : "transparent",
                              borderColor:
                                "rgba(36,74,112,0.22)",
                              fontSize: "12.5px",
                              fontWeight: 800,
                              textTransform: "none",
                              "& .MuiButton-startIcon": {
                                marginLeft: "6px",
                                marginRight: 0,
                              },
                              "& svg": {
                                fontSize: "16px !important",
                              },
                              "&:hover": {
                                backgroundColor: hasPreparation
                                  ? "#226744"
                                  : "rgba(36,74,112,0.07)",
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

          <Stack spacing={{ xs: 2, md: 3 }}>
            <SectionCard
              title="آخر التحضيرات"
              subtitle="أحدث الملفات المرتبطة بحصصك"
            >
              {recentPreparations.length > 0 ? (
                <Stack spacing={1.2}>
                  {recentPreparations.map(
                    ({ id, preparation, lecture }) => (
                      <Paper
                        key={id}
                        elevation={0}
                        sx={{
                          p: { xs: 1.4, sm: 1.6 },
                          border:
                            "1px solid rgba(36,74,112,0.07)",
                          borderRadius: "16px",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          gap={1.2}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                color:
                                  "var(--color-navy-deep)",
                                fontSize: "14.5px",
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
                                mt: 0.35,
                                color:
                                  "var(--color-muted)",
                                fontSize: "12.5px",
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
                                mt: 0.35,
                                color:
                                  "var(--color-muted)",
                                fontSize: "11.5px",
                                fontWeight: 600,
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
                                  `/teacher/preparations/${id}`
                                )
                              }
                              sx={{
                                width: 38,
                                height: 38,
                                flexShrink: 0,
                                color:
                                  "var(--color-navy)",
                                backgroundColor:
                                  "rgba(36,74,112,0.055)",
                                border:
                                  "1px solid rgba(36,74,112,0.10)",
                                borderRadius: "11px",
                                "&:hover": {
                                  backgroundColor: "rgba(36,74,112,0.12)",
                                },
                              }}
                            >
                              <VisibilityRounded
                                sx={{ fontSize: 20 }}
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
                      navigate("/teacher/preparations")
                    }
                    endIcon={<ArrowBackRounded />}
                    sx={{
                      alignSelf: "flex-start",
                      color: "var(--color-navy)",
                      fontSize: "13px",
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
                  gap: 1.2,
                }}
              >
                <Button
                  type="button"
                  onClick={() =>
                    navigate("/teacher/exams")
                  }
                  sx={{
                    p: 1.5,
                    display: "block",
                    textAlign: "right",
                    border:
                      "1px solid rgba(36,74,112,0.07)",
                    borderRadius: "15px",
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-white)",
                    textTransform: "none",
                    transition: "all .2s ease",
                    "&:hover": {
                      borderColor: "rgba(36,74,112,0.22)",
                      backgroundColor: "rgba(36,74,112,0.02)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <QuizRounded
                      sx={{
                        color: "var(--color-navy)",
                        fontSize: 24,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "22px",
                        fontWeight: 900,
                      }}
                    >
                      {exams.length}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.6,
                      fontSize: "13.5px",
                      fontWeight: 800,
                    }}
                  >
                    اختباراتي
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      mt: 0.3,
                      color: "var(--color-muted)",
                      fontSize: "11.5px",
                    }}
                  >
                    التصحيح من تفاصيل الاختبار
                  </Typography>
                </Button>

                <Button
                  type="button"
                  onClick={() =>
                    navigate("/school/projects")
                  }
                  sx={{
                    p: 1.5,
                    display: "block",
                    textAlign: "right",
                    border:
                      "1px solid rgba(36,74,112,0.07)",
                    borderRadius: "15px",
                    color: "var(--color-navy-deep)",
                    backgroundColor:
                      "var(--color-white)",
                    textTransform: "none",
                    transition: "all .2s ease",
                    "&:hover": {
                      borderColor: "rgba(211,164,79,0.30)",
                      backgroundColor: "var(--color-gold-soft)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <AssignmentRounded
                      sx={{
                        color:
                          "var(--color-gold-dark)",
                        fontSize: 24,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "22px",
                        fontWeight: 900,
                      }}
                    >
                      {projects.length}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.6,
                      fontSize: "13.5px",
                      fontWeight: 800,
                    }}
                  >
                    مشروعاتي
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      mt: 0.3,
                      color: "var(--color-muted)",
                      fontSize: "11.5px",
                    }}
                  >
                    {pendingProjectCorrections.length} تسليم ينتظر التصحيح
                  </Typography>
                </Button>
              </Box>

              {recentEvaluations.length > 0 && (
                <Stack
                  spacing={1}
                  sx={{ mt: 1.4 }}
                >
                  {recentEvaluations.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate(item.path)
                      }
                      sx={{
                        p: 1.1,
                        justifyContent: "flex-start",
                        gap: 1,
                        textAlign: "right",
                        borderRadius: "12px",
                        color:
                          "var(--color-navy-deep)",
                        backgroundColor:
                          "rgba(36,74,112,0.025)",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "rgba(36,74,112,0.06)",
                        },
                      }}
                    >
                      {item.type === "exam" ? (
                        <QuizRounded
                          sx={{ fontSize: 19 }}
                        />
                      ) : (
                        <AssignmentRounded
                          sx={{ fontSize: 19 }}
                        />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: "13px",
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
                            fontSize: "11.5px",
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
                <Stack spacing={1}>
                  {classRows.slice(0, 5).map((classItem) => (
                    <Paper
                      key={classItem.id}
                      elevation={0}
                      sx={{
                        p: 1.3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.2,
                        border:
                          "1px solid rgba(36,74,112,0.07)",
                        borderRadius: "14px",
                        backgroundColor:
                          "var(--color-white)",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            color:
                              "var(--color-navy)",
                            backgroundColor:
                              "rgba(36,74,112,0.06)",
                            borderRadius: "11px",
                            "& svg": {
                              fontSize: 20,
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
                            fontSize: "13.5px",
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
                          height: 26,
                          color: "#287a51",
                          backgroundColor: "#e7f6ed",
                          fontSize: "11.5px",
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
                p: 2.2,
                overflow: "hidden",
                borderRadius: "20px",
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
                gap={1.5}
              >
                <Box>
                  <Typography
                    sx={{
                      color:
                        "var(--color-gold-light)",
                      fontSize: "12.5px",
                      fontWeight: 800,
                    }}
                  >
                    اكتمال التحضير
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: "26px",
                      fontWeight: 900,
                      lineHeight: 1.1,
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
                      fontSize: 36,
                    }}
                  />
                ) : (
                  <WarningAmberRounded
                    sx={{
                      color:
                        "var(--color-gold-light)",
                      fontSize: 36,
                    }}
                  />
                )}
              </Stack>

              <Typography
                sx={{
                  mt: 0.8,
                  color:
                    "rgba(255,255,255,0.72)",
                  fontSize: "13px",
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
                  height: 9,
                  mt: 1.8,
                  borderRadius: 999,
                  backgroundColor:
                    "rgba(255,255,255,0.14)",
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
      p: { xs: 1.8, sm: 2.4 },
      border:
        "1px solid rgba(36,74,112,0.08)",
      borderRadius: "20px",
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
      gap={1.2}
      sx={{ mb: 1.8 }}
    >
      <Box>
        <Typography
          component="h2"
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "17px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            color: "var(--color-muted)",
            fontSize: "12.5px",
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
    spacing={1}
    sx={{
      minHeight: 170,
      py: 2.5,
      px: 1.5,
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        backgroundColor:
          "var(--color-gold-soft)",
        borderRadius: "15px",
        "& svg": {
          fontSize: 26,
        },
      }}
    >
      {icon}
    </Box>

    <Typography
      sx={{
        color: "var(--color-navy-deep)",
        fontSize: "14.5px",
        fontWeight: 800,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        maxWidth: 380,
        color: "var(--color-muted)",
        fontSize: "12.5px",
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
          mt: 0.5,
          color: "var(--color-navy)",
          fontSize: "12.5px",
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
      p: { xs: 2, md: 4 },
      backgroundColor: "var(--color-page)",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: "1680px",
        mx: "auto",
      }}
    >
      <Skeleton
        variant="rounded"
        height={260}
        sx={{
          mb: 2.5,
          borderRadius: "22px",
        }}
      />
      <Box
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={100}
            sx={{ borderRadius: "18px" }}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.4fr 0.6fr",
          },
          gap: 2.5,
        }}
      >
        <Skeleton
          variant="rounded"
          height={460}
          sx={{ borderRadius: "20px" }}
        />
        <Skeleton
          variant="rounded"
          height={460}
          sx={{ borderRadius: "20px" }}
        />
      </Box>
    </Box>
  </Box>
);

export default TeacherDashboard;
