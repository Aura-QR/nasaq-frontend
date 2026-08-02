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
  EditRounded,
  RefreshRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Popup from "@/components/Popup/Popup";

import {
  deleteLecture,
  fetchLectures,
} from "@/APIs/school/lectures";

import { deletePreparation } from "@/APIs/school/preparation";

import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import { translateGender } from "@/utils/helpers/translateGender";
import usePermissions from "@/utils/hooks/usePermissions";
import { useTeacher } from "@/utils/hooks/apis/useTeacher";

const SCHEDULE_CACHE_TTL =
  15_000;

const scheduleCache =
  new Map();

const schedulePending =
  new Map();

const extractLectures = (
  response
) => {
  const data =
    response?.data ??
    response;

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  return (
    [
      data?.docs,
      data?.items,
      data?.lectures,
      data?.results,
      data?.records,
      data?.data,
    ].find(
      Array.isArray
    ) || []
  );
};

const getLectureId = (
  lecture
) =>
  lecture?._id ||
  lecture?.id ||
  "";

const getLectureSubjectName = (
  lecture
) =>
  lecture?.subject
    ?.subjectName ||
  lecture?.subject?.name ||
  lecture?.subjectId
    ?.subjectName ||
  lecture?.subjectId?.name ||
  lecture?.subjectOffering
    ?.subject?.name ||
  lecture?.subjectOfferingId
    ?.subjectId?.name ||
  "مادة غير محددة";

const getLectureClass = (
  lecture
) =>
  lecture?.class ||
  lecture?.classId ||
  null;

const fetchTeacherLectures =
  async (
    teacherId,
    {
      force = false,
    } = {}
  ) => {
    const key =
      String(
        teacherId || ""
      );

    if (!key) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
        data: [],
      };
    }

    const cached =
      scheduleCache.get(
        key
      );

    if (
      !force &&
      cached &&
      Date.now() -
        cached.createdAt <
        SCHEDULE_CACHE_TTL
    ) {
      return cached.value;
    }

    if (
      !force &&
      schedulePending.has(
        key
      )
    ) {
      return schedulePending.get(
        key
      );
    }

    const request =
      fetchLectures({
        teacherId:
          key,
      })
        .then((response) => {
          if (
            response?.status ===
              false
          ) {
            return response;
          }

          const value = {
            status: true,
            message:
              response?.message ||
              "Success",
            data:
              extractLectures(
                response
              ),
          };

          scheduleCache.set(
            key,
            {
              value,
              createdAt:
                Date.now(),
            }
          );

          return value;
        })
        .finally(() => {
          schedulePending.delete(
            key
          );
        });

    schedulePending.set(
      key,
      request
    );

    return request;
  };

const invalidateTeacherSchedule =
  (teacherId) => {
    scheduleCache.delete(
      String(
        teacherId || ""
      )
    );
  };


const TeacherSchedule = () => {
  const { id } = useParams();

  const {
    teacher,
    loading,
  } = useTeacher(id);

  if (loading) {
    return (
      <Container>
        <Skeleton
          variant="rounded"
          height={520}
          sx={{
            borderRadius: "20px",
          }}
        />
      </Container>
    );
  }

  if (!teacher) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            minHeight: 220,
            display: "grid",
            placeItems: "center",
            borderRadius: "18px",
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-navy-deep)",
              fontWeight: 800,
            }}
          >
            لم يتم العثور على بيانات المعلم
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Schedule
        teacherData={teacher}
      />
    </Container>
  );
};

const Schedule = ({
  teacherData,
}) => {
  const [lectures, setLectures] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [
    selectedLectureId,
    setSelectedLectureId,
  ] = useState(null);

  const navigate = useNavigate();

  const lecturePermissions =
    usePermissions("lectures");

  const fetchScheduleData =
    useCallback(
      async ({
        force = false,
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await fetchTeacherLectures(
              teacherData._id,
              {
                force,
              }
            );

          if (
            response?.status ===
              false
          ) {
            const message =
              response?.message ||
              "حدث خطأ أثناء جلب الجدول الدراسي";

            setLectures([]);
            setError(
              message
            );

            toast.error(
              message,
              {
                toastId:
                  "teacher-schedule-load-error",
              }
            );

            return;
          }

          setLectures(
            extractLectures(
              response
            )
          );
        } catch (requestError) {
          const message =
            requestError?.response
              ?.data?.message ||
            "حدث خطأ أثناء جلب الجدول الدراسي";

          setLectures([]);
          setError(
            message
          );

          toast.error(
            message,
            {
              toastId:
                "teacher-schedule-load-error",
            }
          );
        } finally {
          setLoading(false);
        }
      },
      [
        teacherData._id,
      ]
    );

  useEffect(() => {
    if (
      teacherData?._id
    ) {
      fetchScheduleData();
    }
  }, [
    teacherData?._id,
    fetchScheduleData,
  ]);

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

      lectures.forEach(
        (lecture) => {
          const dayValue =
            String(
              lecture?.dayOfWeek ||
              lecture?.day ||
              ""
            )
              .trim()
              .toLowerCase();

          const day =
            Days.find(
              (item) =>
                [
                  item?.id,
                  item?.day,
                  item?.value,
                ]
                  .filter(Boolean)
                  .some(
                    (value) =>
                      String(
                        value
                      )
                        .trim()
                        .toLowerCase() ===
                      dayValue
                  )
            );

          const slotIndex =
            Number(
              lecture.slot
            ) - 1;

          if (
            !day ||
            slotIndex < 0 ||
            slotIndex >=
              schedule.length
          ) {
            return;
          }

          const classItem =
            getLectureClass(
              lecture
            );

          const classYear =
            classItem
              ?.academicYear
              ?.name ||
            classItem
              ?.academicYearId
              ?.name ||
            classItem
              ?.gradeLevelId
              ?.name ||
            classItem
              ?.academicYear ||
            "";

          const roomNumber =
            classItem
              ?.roomNumber ||
            classItem?.name ||
            "";

          const genderLabel =
            classItem?.gender
              ? translateGender(
                  classItem.gender,
                  "class"
                )
              : "";

          const classInfo =
            [
              classYear,
              roomNumber,
              genderLabel,
            ]
              .filter(Boolean)
              .join(" - ");

          schedule[slotIndex][
            day.day
          ] = {
            id:
              getLectureId(
                lecture
              ),
            subject:
              getLectureSubjectName(
                lecture
              ),
            info:
              classInfo ||
              "بدون فصل",
            preparation:
              lecture.preparation,
          };
        }
      );

      return schedule;
    }, [lectures]);

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
              "حدث خطأ أثناء حذف الحصة"
          );
          return;
        }

        setLectures(
          (previous) =>
            previous.filter(
              (lecture) =>
                getLectureId(
                  lecture
                ) !==
                selectedLectureId
            )
        );

        invalidateTeacherSchedule(
          teacherData._id
        );

        setDeleteOpen(false);
        setSelectedLectureId(
          null
        );

        toast.success(
          "تم حذف الحصة بنجاح"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف الحصة"
        );
      }
    };

  if (loading) {
    return (
      <Stack spacing={1}>
        <Skeleton
          variant="rounded"
          height={92}
          sx={{
            borderRadius: "18px",
          }}
        />

        <Skeleton
          variant="rounded"
          height={480}
          sx={{
            borderRadius: "18px",
          }}
        />
      </Stack>
    );
  }

  const preparationCount =
    lectures.filter(
      (lecture) => {
        const preparation =
          Array.isArray(
            lecture?.preparation
          )
            ? lecture.preparation[0]
            : lecture?.preparation;

        return Boolean(
          preparation?._id ||
          preparation?.id
        );
      }
    ).length;

  return (
    <>
      <Stack spacing={1.25}>
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.5,
              md: 1.9,
            },

            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
            justifyContent:
              "space-between",
            gap: 1.2,

            border:
              "1px solid rgba(36, 74, 112, 0.08)",
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
                width: 40,
                height: 40,

                display: "grid",
                placeItems: "center",

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

            <Box>
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
                أ/ {teacherData.name}
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
                fontSize:
                  "9px",
                fontWeight:
                  800,
              }}
            />

            <Chip
              size="small"
              label={`${preparationCount} تحضير`}
              sx={{
                height: 30,
                color:
                  "#287a51",
                backgroundColor:
                  "rgba(116,201,154,0.15)",
                fontSize:
                  "9px",
                fontWeight:
                  800,
              }}
            />

            <Button
              type="button"
              onClick={() =>
                fetchScheduleData({
                  force: true,
                })
              }
              variant="outlined"
              startIcon={
                <RefreshRounded />
              }
              sx={{
                minHeight: 40,
                px: 1.4,
                borderRadius:
                  "12px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.16)",
                fontSize:
                  "10px",
                fontWeight:
                  800,
                textTransform:
                  "none",
              }}
            >
              تحديث
            </Button>

            <Button
              component={Link}
              to={`/users/teachers/${teacherData._id}`}
              variant="outlined"
              sx={{
                minHeight: 40,
                px: 1.6,

                borderRadius: "12px",

                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36, 74, 112, 0.16)",

                fontSize: "11px",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              تفاصيل المعلم
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
              borderRadius:
                "14px",
              fontSize:
                "10px",
            }}
          >
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 0.8,
              md: 1.2,
            },

            overflow: "hidden",

            border:
              "1px solid rgba(36, 74, 112, 0.08)",
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

              "&::-webkit-scrollbar":
                {
                  height: 7,
                },

              "&::-webkit-scrollbar-thumb":
                {
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
                  "110px repeat(5, minmax(176px, 1fr))",

                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "14px",

                overflow: "hidden",
              }}
            >
              <ScheduleHeaderCell>
                الوقت
              </ScheduleHeaderCell>

              {Days.map((day) => (
                <ScheduleHeaderCell
                  key={day.id}
                >
                  {day.day}
                </ScheduleHeaderCell>
              ))}

              {weeklySchedule.map(
                (slot, slotIndex) => (
                  <ScheduleRow
                    key={slotIndex}
                    slot={slot}
                    slotIndex={
                      slotIndex
                    }
                    teacherData={
                      teacherData
                    }
                    permissions={
                      lecturePermissions
                    }
                    navigate={
                      navigate
                    }
                    onDelete={(
                      lectureId
                    ) => {
                      setSelectedLectureId(
                        lectureId
                      );
                      setDeleteOpen(
                        true
                      );
                    }}
                    onPreparationDeleted={(
                      lectureId
                    ) => {
                      setLectures(
                        (
                          previous
                        ) =>
                          previous.map(
                            (
                              lecture
                            ) =>
                              getLectureId(
                                lecture
                              ) ===
                              lectureId
                                ? {
                                    ...lecture,
                                    preparation:
                                      null,
                                  }
                                : lecture
                          )
                      );

                      invalidateTeacherSchedule(
                        teacherData._id
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
    </>
  );
};

const ScheduleHeaderCell = ({
  children,
}) => (
  <Box
    sx={{
      minHeight: 52,

      display: "grid",
      placeItems: "center",

      color:
        "var(--color-navy-deep)",
      background:
        "linear-gradient(135deg, #f5f7fb, #e9eef5)",

      borderBottom:
        "1px solid rgba(36,74,112,0.08)",
      borderLeft:
        "1px solid rgba(36,74,112,0.07)",

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
  teacherData,
  permissions,
  navigate,
  onDelete,
  onPreparationDeleted,
}) => {
  return (
    <>
      <Box
        sx={{
          minHeight: 126,

          display: "grid",
          placeItems: "center",

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
        const lesson =
          slot[day.day];

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
                  `/school/lectures/edit/${lesson.id}?isComingFromTeacher=true`
                );
                return;
              }

              if (
                !hasLesson &&
                permissions.add
              ) {
                navigate(
                  `/school/lectures/add?teacherId=${teacherData._id}&day=${day.id}&slot=${
                    slotIndex + 1
                  }`
                );
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
            sx={{
              position: "relative",
              minHeight: 126,
              p: 1,

              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",

              backgroundColor:
                hasLesson
                  ? "var(--color-white)"
                  : "rgba(36,74,112,0.025)",

              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
              borderLeft:
                "1px solid rgba(36,74,112,0.07)",

              cursor:
                hasLesson ||
                permissions.add
                  ? "pointer"
                  : "default",

              transition:
                "background-color 180ms ease, box-shadow 180ms ease",

              "&:hover": {
                backgroundColor:
                  hasLesson
                    ? "rgba(251,240,216,0.52)"
                    : permissions.add
                    ? "rgba(36,74,112,0.045)"
                    : undefined,
                boxShadow:
                  hasLesson ||
                  permissions.add
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
                sx={{
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    maxWidth: "100%",
                    overflow: "hidden",

                    color:
                      "var(--color-navy-deep)",
                    fontSize: "12px",
                    fontWeight: 800,

                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {lesson.subject}
                </Typography>

                <Chip
                  label={lesson.info}
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

                    "& .MuiChip-label":
                      {
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      },
                  }}
                />

                <LecturePreparation
                  lectureId={
                    lesson.id
                  }
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
                        onDelete(
                          lesson.id
                        );
                      }}
                      sx={{
                        position:
                          "absolute",
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
                        borderRadius:
                          "9px",

                        "&:hover": {
                          color: "#ffffff",
                          backgroundColor:
                            "var(--color-danger)",
                        },
                      }}
                    >
                      <DeleteOutlineRounded
                        sx={{
                          fontSize: 17,
                        }}
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
                  sx={{
                    fontSize: 20,
                  }}
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
};

const LecturePreparation = ({
  lectureId,
  preparation,
  onDeleted,
}) => {
  const navigate = useNavigate();

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const permissions =
    usePermissions("preparation");

  const preparationItem =
    Array.isArray(preparation)
      ? preparation[0]
      : preparation;

  const hasPreparation =
    Boolean(preparationItem?._id);

  const handleDelete =
    async () => {
      if (!preparationItem?._id) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await deletePreparation(
            preparationItem._id
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              "حدث خطأ أثناء حذف التحضير"
          );
          return;
        }

        setDeleteDialogOpen(
          false
        );

        toast.success(
          "تم حذف التحضير بنجاح"
        );

        onDeleted?.();
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف التحضير"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      {hasPreparation ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{
            width: "100%",
          }}
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
                  `/school/preparation/edit/${preparationItem._id}`
                );
              }}
              sx={{
                minHeight: 30,
                px: 1,

                borderRadius: "9px",

                color:
                  "var(--color-white)",
                backgroundColor:
                  "#287a51",

                fontSize: "9px",
                fontWeight: 800,
                textTransform:
                  "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "4px",
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
                  setDeleteDialogOpen(
                    true
                  );
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
                  sx={{
                    fontSize: 16,
                  }}
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
              `/school/preparation/add?lectureId=${lectureId}`
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

            "& .MuiButton-startIcon":
              {
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
        open={deleteDialogOpen}
        setOpen={
          setDeleteDialogOpen
        }
        message="هل أنت متأكد من حذف هذا التحضير؟"
        type="delete"
        fn={handleDelete}
      />
    </>
  );
};

export default TeacherSchedule;
