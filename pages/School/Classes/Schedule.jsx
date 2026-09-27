import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
  RefreshRounded,
  SchoolRounded,
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
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Popup from "@/components/Popup/Popup";

import {
  getSchoolClassById,
} from "@/APIs/school/classes";

import {
  deleteLecture,
  fetchLectures,
} from "@/APIs/school/lectures";

import {
  deletePreparation,
  fetchPreparations,
} from "@/APIs/school/preparation";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";

import {
  extractClass,
  getClassAcademicYear,
  getClassDisplayName,
  getClassGenderLabel,
  getClassGradeLevelName,
  getEntityId,
} from "@/utils/school/classData";

import usePermissions from "@/utils/hooks/usePermissions";

const MIN_LECTURES_PER_DAY = 6;

const getId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const extractLectures = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.lectures,
      payload?.results,
      payload?.records,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const getLectureId = (lecture) =>
  getId(lecture);

const getSubjectName = (subject) => {
  if (!subject || typeof subject !== "object") {
    return "";
  }

  return (
    subject.subjectName ||
    subject.name ||
    subject.title ||
    ""
  );
};

const getLectureSubjectName = (lecture) => {
  const subjectOffering =
    lecture?.subjectOfferingId ||
    lecture?.subjectOffering ||
    null;

  return (
    getSubjectName(lecture?.subject) ||
    getSubjectName(lecture?.subjectId) ||
    getSubjectName(subjectOffering?.subjectId) ||
    getSubjectName(subjectOffering?.subject) ||
    lecture?.subjectName ||
    subjectOffering?.subjectName ||
    "مادة غير محددة"
  );
};

const getLectureTeacherName = (lecture) => {
  const teacher =
    lecture?.teacherId ||
    lecture?.teacher ||
    null;

  if (teacher && typeof teacher === "object") {
    return (
      teacher.name ||
      teacher.username ||
      teacher.fullName ||
      "معلم غير محدد"
    );
  }

  return (
    lecture?.teacherName ||
    "معلم غير محدد"
  );
};

const normalizeDay = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getMatchingDay = (value) => {
  const normalizedValue = normalizeDay(value);

  return Days.find((day) =>
    [day?.id, day?.day, day?.value]
      .filter(Boolean)
      .some(
        (candidate) =>
          normalizeDay(candidate) ===
          normalizedValue
      )
  );
};

const getPreparationItem = (preparation) =>
  Array.isArray(preparation)
    ? preparation[0]
    : preparation;

const getPreparationId = (preparation) =>
  getId(getPreparationItem(preparation));

const ClassSchedule = () => {
  const { id } = useParams();

  const [classItem, setClassItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadClass = async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getSchoolClassById(
            id,
            { force: true }
          );

        if (!active) {
          return;
        }

        if (response?.status === false) {
          setClassItem(null);
          setError(
            response?.message ||
              "تعذر تحميل بيانات الفصل"
          );
          return;
        }

        const nextClass =
          extractClass(response);

        if (!nextClass) {
          setClassItem(null);
          setError(
            "لم يتم العثور على بيانات الفصل"
          );
          return;
        }

        setClassItem(nextClass);
      } catch (requestError) {
        if (active) {
          setClassItem(null);
          setError(
            requestError?.response?.data
              ?.message ||
              "تعذر تحميل بيانات الفصل"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadClass();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container>
        <Stack spacing={1}>
          <Skeleton
            variant="rounded"
            height={96}
            sx={{ borderRadius: "18px" }}
          />

          <Skeleton
            variant="rounded"
            height={520}
            sx={{ borderRadius: "18px" }}
          />
        </Stack>
      </Container>
    );
  }

  if (error || !classItem) {
    return (
      <Container>
        <Alert
          severity="error"
          sx={{ borderRadius: "14px" }}
        >
          {error || "الفصل غير موجود"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Schedule classData={classItem} />
    </Container>
  );
};

const Schedule = ({ classData }) => {
  const navigate = useNavigate();

  const classId =
    getEntityId(classData);

  const [lectures, setLectures] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [selectedLectureId, setSelectedLectureId] =
    useState(null);

  const lecturePermissions =
    usePermissions("lectures");

  const fetchScheduleData =
    useCallback(
      async ({
        force = false,
        silent = false,
      } = {}) => {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const [
            response,
            preparationsResponse,
          ] = await Promise.all([
            fetchLectures(
              { classId },
              { force }
            ),
            fetchPreparations({
              page: 1,
              limit: 1000,
            }),
          ]);

          if (response?.status === false) {
            const message =
              response?.message ||
              "تعذر تحميل الجدول الدراسي";

            setLectures([]);
            setError(message);

            toast.error(message, {
              toastId:
                "class-schedule-load-error",
            });
            return;
          }

          const preparations =
            preparationsResponse?.status ===
            false
              ? []
              : extractLectures(
                  preparationsResponse
                );

          const preparationByLecture =
            new Map(
              preparations
                .map((preparation) => [
                  getId(
                    preparation?.lecture ||
                    preparation?.lectureId
                  ),
                  preparation,
                ])
                .filter(
                  ([lectureId]) =>
                    Boolean(lectureId)
                )
            );

          const nextLectures =
            extractLectures(
              response
            ).map((lecture) => ({
              ...lecture,
              preparation:
                getPreparationItem(
                  lecture?.preparation
                ) ||
                preparationByLecture.get(
                  getLectureId(
                    lecture
                  )
                ) ||
                null,
            }));

          setLectures(
            nextLectures
          );
        } catch (requestError) {
          const message =
            requestError?.response?.data
              ?.message ||
            "تعذر تحميل الجدول الدراسي";

          setLectures([]);
          setError(message);

          toast.error(message, {
            toastId:
              "class-schedule-load-error",
          });
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [classId]
    );

  useEffect(() => {
    if (classId) {
      fetchScheduleData({
        force: true,
      });
    }
  }, [classId, fetchScheduleData]);

  const weeklySchedule =
    useMemo(() => {
      const schedule = Slots.map(
        (slot) => {
          const row = {
            time: slot.name,
          };

          Days.forEach((day) => {
            row[day.day] = null;
          });

          return row;
        }
      );

      lectures.forEach((lecture) => {
        const day = getMatchingDay(
          lecture?.dayOfWeek ||
            lecture?.day
        );

        const slotIndex =
          Number(lecture?.slot) - 1;

        if (
          !day ||
          slotIndex < 0 ||
          slotIndex >= schedule.length
        ) {
          return;
        }

        schedule[slotIndex][day.day] = {
          id: getLectureId(lecture),
          subject:
            getLectureSubjectName(lecture),
          teacherName:
            getLectureTeacherName(lecture),
          preparation:
            lecture?.preparation,
        };
      });

      return schedule;
    }, [lectures]);

  const lecturesCountByDay =
    useMemo(() => {
      const counts = Object.fromEntries(
        Days.map((day) => [
          day.id,
          0,
        ])
      );

      lectures.forEach((lecture) => {
        const day = getMatchingDay(
          lecture?.dayOfWeek ||
            lecture?.day
        );

        if (day) {
          counts[day.id] =
            (counts[day.id] || 0) + 1;
        }
      });

      return counts;
    }, [lectures]);

  const preparationCount =
    useMemo(
      () =>
        lectures.filter((lecture) =>
          Boolean(
            getPreparationId(
              lecture?.preparation
            )
          )
        ).length,
      [lectures]
    );

  const handleDeleteLecture =
    async () => {
      if (!selectedLectureId) {
        return;
      }

      try {
        const response =
          await deleteLecture(
            selectedLectureId
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              "تعذر حذف الحصة"
          );
          return;
        }

        setLectures((previous) =>
          previous.filter(
            (lecture) =>
              getLectureId(lecture) !==
              selectedLectureId
          )
        );

        setDeleteOpen(false);
        setSelectedLectureId(null);

        toast.success(
          "تم حذف الحصة بنجاح"
        );
      } catch (requestError) {
        toast.error(
          requestError?.response?.data
            ?.message ||
            "تعذر حذف الحصة"
        );
      }
    };

  if (loading) {
    return (
      <Stack spacing={1}>
        <Skeleton
          variant="rounded"
          height={92}
          sx={{ borderRadius: "18px" }}
        />

        <Skeleton
          variant="rounded"
          height={520}
          sx={{ borderRadius: "18px" }}
        />
      </Stack>
    );
  }

  return (
    <Box dir="rtl" sx={{ pb: 4 }}>
      <Stack spacing={1.25}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 1.9 },
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            alignItems: {
              xs: "stretch",
              md: "center",
            },
            justifyContent:
              "space-between",
            gap: 1.2,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.06)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
                border:
                  "1px solid rgba(211,164,79,0.22)",
                borderRadius: "12px",
              }}
            >
              <CalendarMonthRounded />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "19px",
                    md: "22px",
                  },
                  fontWeight: 800,
                }}
              >
                الجدول الدراسي الأسبوعي
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color:
                    "var(--color-muted)",
                  fontSize: "10px",
                }}
              >
                {getClassDisplayName(classData)}
                {getClassGradeLevelName(classData)
                  ? ` — ${getClassGradeLevelName(classData)}`
                  : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={0.8}
            sx={{ flexWrap: "wrap" }}
          >
            <Chip
              size="small"
              label={`${lectures.length} حصة`}
              sx={{
                height: 30,
                color:
                  "var(--color-navy)",
                backgroundColor:
                  "rgba(36,74,112,0.07)",
                fontSize: "9px",
                fontWeight: 800,
              }}
            />

            <Chip
              size="small"
              label={`${preparationCount} تحضير`}
              sx={{
                height: 30,
                color: "#287a51",
                backgroundColor:
                  "rgba(116,201,154,0.15)",
                fontSize: "9px",
                fontWeight: 800,
              }}
            />

            <Chip
              size="small"
              label={
                [
                  getClassAcademicYear(classData),
                  getClassGenderLabel(classData),
                ]
                  .filter(Boolean)
                  .join(" — ") ||
                "بيانات الفصل"
              }
              sx={{
                height: 30,
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
                fontSize: "8.5px",
                fontWeight: 800,
              }}
            />

            <Button
              type="button"
              disabled={refreshing}
              onClick={() =>
                fetchScheduleData({
                  force: true,
                  silent: true,
                })
              }
              variant="outlined"
              startIcon={<RefreshRounded />}
              sx={{
                minHeight: 40,
                px: 1.4,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.16)",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {refreshing
                ? "جاري التحديث..."
                : "تحديث"}
            </Button>

            <Button
              type="button"
              variant="outlined"
              startIcon={<SchoolRounded />}
              onClick={() =>
                navigate(
                  `/school/classes/${classId}`
                )
              }
              sx={{
                minHeight: 40,
                px: 1.4,
                borderRadius: "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.16)",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              تفاصيل الفصل
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            action={
              <Button
                type="button"
                size="small"
                onClick={() =>
                  fetchScheduleData({
                    force: true,
                  })
                }
              >
                إعادة المحاولة
              </Button>
            }
            sx={{
              borderRadius: "14px",
              fontSize: "10px",
            }}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 0.8, md: 1.2 },
            overflow: "hidden",
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.055)",
          }}
        >
          <Box
            sx={{
              overflowX: "auto",
              pb: 0.5,
              scrollbarWidth: "thin",
              scrollbarColor:
                "rgba(36,74,112,0.22) transparent",
              "&::-webkit-scrollbar": {
                height: 7,
              },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: 999,
                backgroundColor:
                  "rgba(36,74,112,0.20)",
              },
            }}
          >
            <Box
              sx={{
                minWidth: 1040,
                display: "grid",
                gridTemplateColumns:
                  `110px repeat(${Days.length}, minmax(176px, 1fr))`,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <ScheduleHeaderCell>
                الوقت
              </ScheduleHeaderCell>

              {Days.map((day) => {
                const count =
                  lecturesCountByDay[
                    day.id
                  ] || 0;

                return (
                  <ScheduleHeaderCell
                    key={day.id}
                  >
                    <Stack
                      alignItems="center"
                      spacing={0.3}
                    >
                      <Typography
                        sx={{
                          fontSize: "11.5px",
                          fontWeight: 800,
                        }}
                      >
                        {day.day}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.35}
                      >
                        <Typography
                          sx={{
                            color:
                              "var(--color-muted)",
                            fontSize: "8px",
                            fontWeight: 700,
                          }}
                        >
                          {count} حصة
                        </Typography>

                        {count <
                          MIN_LECTURES_PER_DAY && (
                          <Tooltip title="عدد حصص اليوم أقل من ست حصص">
                            <WarningAmberRounded
                              sx={{
                                color:
                                  "var(--color-danger)",
                                fontSize: 13,
                              }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </ScheduleHeaderCell>
                );
              })}

              {weeklySchedule.map(
                (slot, slotIndex) => (
                  <ScheduleRow
                    key={slotIndex}
                    slot={slot}
                    slotIndex={slotIndex}
                    classId={classId}
                    permissions={
                      lecturePermissions
                    }
                    navigate={navigate}
                    onDelete={(lectureId) => {
                      setSelectedLectureId(
                        lectureId
                      );
                      setDeleteOpen(true);
                    }}
                    onPreparationDeleted={(
                      lectureId
                    ) => {
                      setLectures((previous) =>
                        previous.map(
                          (lecture) =>
                            getLectureId(
                              lecture
                            ) === lectureId
                              ? {
                                  ...lecture,
                                  preparation:
                                    null,
                                }
                              : lecture
                        )
                      );
                    }}
                  />
                )
              )}
            </Box>
          </Box>
        </Paper>
      </Stack>

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message="هل أنت متأكد من حذف هذه الحصة؟"
        type="delete"
        fn={handleDeleteLecture}
      />
    </Box>
  );
};

const ScheduleHeaderCell = ({ children }) => (
  <Box
    sx={{
      minHeight: 58,
      display: "grid",
      placeItems: "center",
      px: 0.7,
      color:
        "var(--color-navy-deep)",
      background:
        "linear-gradient(135deg, #f5f7fb, #e9eef5)",
      borderBottom:
        "1px solid rgba(36,74,112,0.08)",
      borderLeft:
        "1px solid rgba(36,74,112,0.07)",
      textAlign: "center",
      fontSize: "11.5px",
      fontWeight: 800,
    }}
  >
    {children}
  </Box>
);

const ScheduleRow = ({
  slot,
  slotIndex,
  classId,
  permissions,
  navigate,
  onDelete,
  onPreparationDeleted,
}) => (
  <>
    <Box
      sx={{
        minHeight: 132,
        display: "grid",
        placeItems: "center",
        px: 0.7,
        color:
          "var(--color-navy-deep)",
        backgroundColor:
          "rgba(36,74,112,0.045)",
        borderBottom:
          "1px solid rgba(36,74,112,0.07)",
        borderLeft:
          "1px solid rgba(36,74,112,0.07)",
        fontSize: "11px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {slot.time}
    </Box>

    {Days.map((day) => {
      const lesson = slot[day.day];
      const hasLesson =
        Boolean(lesson?.id);

      return (
        <Box
          key={day.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (
              hasLesson &&
              permissions.edit
            ) {
              navigate(
                `/school/lectures/edit/${lesson.id}?isComingFromClass=true`
              );
              return;
            }

            if (
              !hasLesson &&
              permissions.add
            ) {
              navigate(
                `/school/lectures/add?classId=${classId}&day=${day.id}&slot=${
                  slotIndex + 1
                }`
              );
            }
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          sx={{
            position: "relative",
            minHeight: 132,
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: hasLesson
              ? "var(--color-white)"
              : "rgba(36,74,112,0.025)",
            borderBottom:
              "1px solid rgba(36,74,112,0.07)",
            borderLeft:
              "1px solid rgba(36,74,112,0.07)",
            cursor:
              hasLesson || permissions.add
                ? "pointer"
                : "default",
            transition:
              "background-color 180ms ease, box-shadow 180ms ease",
            "&:hover": {
              backgroundColor: hasLesson
                ? "rgba(251,240,216,0.52)"
                : permissions.add
                ? "rgba(36,74,112,0.045)"
                : undefined,
              boxShadow:
                hasLesson || permissions.add
                  ? "inset 0 0 0 2px rgba(211,164,79,0.15)"
                  : "none",
            },
          }}
        >
          {hasLesson ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={0.65}
              sx={{ width: "100%" }}
            >
              <Typography
                title={lesson.subject}
                sx={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "12px",
                  fontWeight: 800,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lesson.subject}
              </Typography>

              <Chip
                label={lesson.teacherName}
                size="small"
                sx={{
                  maxWidth: "100%",
                  height: 24,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(36,74,112,0.065)",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />

              <LecturePreparation
                lectureId={lesson.id}
                preparation={
                  lesson.preparation
                }
                onDeleted={() =>
                  onPreparationDeleted?.(
                    lesson.id
                  )
                }
              />

              {permissions.delete && (
                <Tooltip title="حذف الحصة">
                  <IconButton
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(lesson.id);
                    }}
                    sx={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      width: 30,
                      height: 30,
                      color:
                        "var(--color-danger)",
                      backgroundColor:
                        "rgba(201,79,79,0.07)",
                      border:
                        "1px solid rgba(201,79,79,0.12)",
                      borderRadius: "9px",
                      "&:hover": {
                        color: "#ffffff",
                        backgroundColor:
                          "var(--color-danger)",
                      },
                    }}
                  >
                    <DeleteOutlineRounded
                      sx={{ fontSize: 17 }}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ) : permissions.add ? (
            <Stack
              alignItems="center"
              spacing={0.45}
              sx={{
                color:
                  "var(--color-muted)",
              }}
            >
              <AddRounded
                sx={{ fontSize: 20 }}
              />

              <Typography
                sx={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                }}
              >
                إضافة حصة
              </Typography>
            </Stack>
          ) : null}
        </Box>
      );
    })}
  </>
);

const LecturePreparation = ({
  lectureId,
  preparation,
  onDeleted,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo =
    encodeURIComponent(
      `${location.pathname}${location.search}`
    );

  const permissions =
    usePermissions("preparation");

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const preparationItem =
    getPreparationItem(preparation);

  const preparationId =
    getId(preparationItem);

  const handleDelete = async () => {
    if (!preparationId) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await deletePreparation(
          preparationId
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            "تعذر حذف التحضير"
        );
        return;
      }

      setDeleteOpen(false);

      toast.success(
        "تم حذف التحضير بنجاح"
      );

      onDeleted?.();
    } catch (requestError) {
      toast.error(
        requestError?.response?.data
          ?.message ||
          "تعذر حذف التحضير"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {preparationId ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{ width: "100%" }}
        >
          {permissions.edit && (
            <Button
              type="button"
              size="small"
              variant="contained"
              startIcon={
                <VisibilityRounded />
              }
              onClick={(event) => {
                event.stopPropagation();
                navigate(
                  `/school/preparation/edit/${preparationId}?returnTo=${returnTo}`
                );
              }}
              sx={{
                minHeight: 30,
                px: 1,
                borderRadius: "9px",
                color:
                  "var(--color-white)",
                backgroundColor: "#287a51",
                fontSize: "9px",
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
              التحضير
            </Button>
          )}

          {permissions.delete && (
            <Tooltip title="حذف التحضير">
              <IconButton
                type="button"
                disabled={loading}
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteOpen(true);
                }}
                sx={{
                  width: 30,
                  height: 30,
                  color:
                    "var(--color-danger)",
                  backgroundColor:
                    "rgba(201,79,79,0.06)",
                  border:
                    "1px solid rgba(201,79,79,0.12)",
                  borderRadius: "9px",
                }}
              >
                <DeleteOutlineRounded
                  sx={{ fontSize: 16 }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ) : permissions.add ? (
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={(event) => {
            event.stopPropagation();
            navigate(
              `/school/preparation/add?lectureId=${lectureId}&returnTo=${returnTo}`
            );
          }}
          sx={{
            minHeight: 30,
            px: 1,
            borderRadius: "9px",
            color:
              "var(--color-navy)",
            borderColor:
              "rgba(36,74,112,0.18)",
            fontSize: "9px",
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
          إضافة تحضير
        </Button>
      ) : null}

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message="هل أنت متأكد من حذف هذا التحضير؟"
        type="delete"
        fn={handleDelete}
      />
    </>
  );
};

export default ClassSchedule;
