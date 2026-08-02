import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  CalendarMonthOutlined,
  DeleteOutlineRounded,
  EditRounded,
  EmailOutlined,
  HomeOutlined,
  LocalPhoneOutlined,
  MenuBookRounded,
  PersonOutlineRounded,
  SchoolOutlined,
  ToggleOnRounded,
  WorkHistoryOutlined,
} from "@mui/icons-material";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Popup from "@/components/Popup/Popup";
import SubjectCheckBoxes from "@/components/Selector/SubjectCheckBoxes";

import {
  deleteTeacher,
  editTeacher,
  toggleActiveTeacher,
} from "@/APIs/users/teachers";

import { formatDate } from "@/utils/helpers/dateUtils";
import { useTeacher } from "@/utils/hooks/apis/useTeacher";
import usePermissions from "@/utils/hooks/usePermissions";

const hasSubjectField = (
  teacher
) =>
  Boolean(
    teacher &&
      typeof teacher === "object" &&
      (
        Object.prototype.hasOwnProperty.call(
          teacher,
          "subjects"
        ) ||
        Object.prototype.hasOwnProperty.call(
          teacher,
          "subject"
        ) ||
        Object.prototype.hasOwnProperty.call(
          teacher,
          "subjectIds"
        )
      )
  );

const getSubjects = (
  teacher
) => {
  if (
    Array.isArray(
      teacher?.subjects
    )
  ) {
    return teacher.subjects;
  }

  if (
    Array.isArray(
      teacher?.subject
    )
  ) {
    return teacher.subject;
  }

  if (
    Array.isArray(
      teacher?.subjectIds
    )
  ) {
    return teacher.subjectIds.map(
      (subject) =>
        typeof subject ===
          "object"
          ? subject
          : {
              _id: subject,
            }
    );
  }

  return [];
};

const getSubjectId = (
  subject
) =>
  typeof subject ===
    "string"
    ? subject
    : subject?._id ||
      subject?.id ||
      "";

const getTeacherSubjectsStorageKey = (
  teacherId
) => {
  const schoolId =
    localStorage.getItem(
      "schoolId"
    ) || "school";

  return `nasaq:teacher-subjects:${schoolId}:${teacherId}`;
};

const readStoredTeacherSubjectIds = (
  teacherId
) => {
  if (!teacherId) {
    return [];
  }

  try {
    const stored =
      JSON.parse(
        localStorage.getItem(
          getTeacherSubjectsStorageKey(
            teacherId
          )
        ) || "[]"
      );

    return Array.isArray(stored)
      ? Array.from(
          new Set(
            stored
              .map(
                (value) =>
                  String(
                    value || ""
                  ).trim()
              )
              .filter(Boolean)
          )
        )
      : [];
  } catch {
    return [];
  }
};

const storeTeacherSubjectIds = (
  teacherId,
  subjectIds
) => {
  if (!teacherId) {
    return;
  }

  const normalizedIds =
    Array.from(
      new Set(
        (
          Array.isArray(
            subjectIds
          )
            ? subjectIds
            : []
        )
          .map(
            (value) =>
              String(
                value || ""
              ).trim()
          )
          .filter(Boolean)
      )
    );

  localStorage.setItem(
    getTeacherSubjectsStorageKey(
      teacherId
    ),
    JSON.stringify(
      normalizedIds
    )
  );
};

const clearStoredTeacherSubjectIds = (
  teacherId
) => {
  if (!teacherId) {
    return;
  }

  localStorage.removeItem(
    getTeacherSubjectsStorageKey(
      teacherId
    )
  );
};

const getSubjectName = (
  subject
) =>
  subject?.subjectName ||
  subject?.name ||
  subject?.title ||
  "";

const getSubjectsSummary = (
  teacher
) => {
  if (
    !hasSubjectField(
      teacher
    )
  ) {
    return {
      available: false,
      count: null,
      label:
        "بيانات المواد غير متاحة من الخادم",
    };
  }

  const subjects =
    getSubjects(
      teacher
    );

  const names =
    subjects
      .map(
        getSubjectName
      )
      .filter(Boolean);

  if (names.length) {
    return {
      available: true,
      count:
        subjects.length,
      label:
        names.join(" - "),
    };
  }

  if (subjects.length) {
    return {
      available: true,
      count:
        subjects.length,
      label: `${subjects.length} مادة مرتبطة`,
    };
  }

  return {
    available: true,
    count: 0,
    label: "بدون مواد",
  };
};

const infoCardSx = {
  p: 1.4,
  minHeight: 86,

  display: "flex",
  alignItems: "flex-start",
  gap: 1.05,

  border:
    "1px solid rgba(36, 74, 112, 0.075)",
  borderRadius: "15px",

  backgroundColor:
    "var(--color-white)",

  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

  "&:hover": {
    transform: "translateY(-2px)",
    borderColor:
      "rgba(211, 164, 79, 0.22)",
    boxShadow:
      "0 10px 22px rgba(18, 47, 77, 0.07)",
  },
};

const DetailCard = ({
  icon,
  label,
  value,
}) => (
  <Paper elevation={0} sx={infoCardSx}>
    <Box
      sx={{
        width: 36,
        height: 36,

        display: "grid",
        placeItems: "center",
        flexShrink: 0,

        color:
          "var(--color-gold-dark)",
        backgroundColor:
          "var(--color-gold-soft)",

        border:
          "1px solid rgba(211, 164, 79, 0.20)",
        borderRadius: "11px",

        "& svg": {
          fontSize: 19,
        },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color:
            "var(--color-muted)",
          fontSize: "9.5px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.55,
          overflow: "hidden",

          color:
            "var(--color-navy-deep)",
          fontSize: "12.5px",
          fontWeight: 800,
          lineHeight: 1.6,

          textOverflow: "ellipsis",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Paper>
);

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    teacher,
    loading: teacherLoading,
    error: teacherError,
  } = useTeacher(id);

  const [item, setItem] =
    useState(null);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [
    toggleLoading,
    setToggleLoading,
  ] = useState(false);

  useEffect(() => {
    if (!teacher) {
      return;
    }

    const teacherId =
      teacher?._id ||
      teacher?.id ||
      id;

    const backendSubjectIds =
      getSubjects(
        teacher
      )
        .map(
          getSubjectId
        )
        .filter(Boolean);

    if (
      hasSubjectField(
        teacher
      )
    ) {
      storeTeacherSubjectIds(
        teacherId,
        backendSubjectIds
      );

      setItem(
        teacher
      );

      return;
    }

    const storedSubjectIds =
      readStoredTeacherSubjectIds(
        teacherId
      );

    setItem({
      ...teacher,
      ...(storedSubjectIds.length
        ? {
            subjectIds:
              storedSubjectIds,
            __subjectsSource:
              "local",
          }
        : {}),
    });
  }, [
    teacher,
    id,
  ]);

  const teacherPermissions =
    usePermissions("teachers");

  const lecturePermissions =
    usePermissions("lectures");

  const handleDelete = async () => {
    try {
      const response =
        await deleteTeacher(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء حذف المعلم"
        );
        return;
      }

      clearStoredTeacherSubjectIds(
        id
      );

      toast.success(
        "تم حذف المعلم بنجاح"
      );

      navigate("/users/teachers", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء حذف المعلم"
      );
    }
  };

  const handleToggleStatus =
    async () => {
      try {
        setToggleLoading(true);

        const response =
          await toggleActiveTeacher(id);

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "تعذر تغيير حالة المعلم"
          );
          return;
        }

        const updatedTeacher =
          response?.data?.teacher ||
          response?.data;

        setItem((previous) => ({
          ...previous,
          ...(updatedTeacher &&
          typeof updatedTeacher ===
            "object"
            ? updatedTeacher
            : {}),
          isActive:
            typeof updatedTeacher?.isActive ===
              "boolean"
              ? updatedTeacher.isActive
              : !previous.isActive,
        }));

        toast.success(
          "تم تغيير حالة المعلم بنجاح"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "تعذر تغيير حالة المعلم"
        );
      } finally {
        setToggleLoading(false);
      }
    };

  if (teacherLoading) {
    return (
      <Container>
        <Stack spacing={1.3}>
          <Skeleton
            variant="rounded"
            height={138}
            sx={{
              borderRadius: "20px",
            }}
          />

          <Grid container spacing={1.2}>
            {[...Array(8)].map(
              (_, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  lg={4}
                  key={index}
                >
                  <Skeleton
                    variant="rounded"
                    height={86}
                    sx={{
                      borderRadius:
                        "15px",
                    }}
                  />
                </Grid>
              )
            )}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!item) {
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
            {teacherError ||
              "لم يتم العثور على بيانات المعلم"}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Stack spacing={1.3}>
        <TeacherHeader
          teacher={item}
          permissions={
            teacherPermissions
          }
          toggleLoading={
            toggleLoading
          }
          onToggleStatus={
            handleToggleStatus
          }
          onDelete={() =>
            setDeleteOpen(true)
          }
          canViewSchedule={
            lecturePermissions.read
          }
        />

        <TeacherDetails
          teacher={item}
        />

        <TeacherSubjects
          teacher={item}
          setTeacher={setItem}
          permissions={
            teacherPermissions
          }
        />
      </Stack>

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message={`هل أنت متأكد من حذف المعلم «${item.name}»؟`}
        type="delete"
        fn={handleDelete}
      />
    </Container>
  );
};

const TeacherHeader = ({
  teacher,
  permissions,
  toggleLoading,
  onToggleStatus,
  onDelete,
  canViewSchedule,
}) => {
  const subjectSummary =
    getSubjectsSummary(
      teacher
    );

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.7,
          md: 2.1,
        },

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
        gap: 2,

        border:
          "1px solid rgba(36, 74, 112, 0.08)",
        borderRadius: "20px",

        background:
          "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.48))",

        boxShadow:
          "0 12px 28px rgba(18, 47, 77, 0.07)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.4}
      >
        <Avatar
          src={
            teacher?.avatar ||
            teacher?.avatarUrl ||
            teacher?.photo ||
            undefined
          }
          alt={
            teacher?.name ||
            "المعلم"
          }
          sx={{
            width: 58,
            height: 58,

            color:
              "var(--color-navy-deep)",
            backgroundColor:
              "var(--color-gold-soft)",

            border:
              "1px solid rgba(211, 164, 79, 0.26)",

            fontSize: "21px",
            fontWeight: 800,
          }}
        >
          {String(
            teacher.name || "م"
          )
            .trim()
            .charAt(0)}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            gap={0.8}
          >
            <Typography
              component="h1"
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: {
                  xs: "20px",
                  md: "25px",
                },
                fontWeight: 800,
              }}
            >
              {teacher.name}
            </Typography>

            <Chip
              label={
                teacher.isActive
                  ? "معلم نشط"
                  : "غير نشط"
              }
              size="small"
              sx={{
                color:
                  teacher.isActive
                    ? "#287a51"
                    : "var(--color-danger)",

                backgroundColor:
                  teacher.isActive
                    ? "rgba(116, 201, 154, 0.16)"
                    : "rgba(201, 79, 79, 0.10)",

                border: `1px solid ${
                  teacher.isActive
                    ? "rgba(116, 201, 154, 0.24)"
                    : "rgba(201, 79, 79, 0.18)"
                }`,

                fontSize: "9.5px",
                fontWeight: 800,
              }}
            />
          </Stack>

          <Typography
            sx={{
              mt: 0.45,

              color:
                "var(--color-muted)",
              fontSize: "10.5px",
            }}
          >
            {teacher.specialization ||
              "بدون تخصص"}
            {" • "}
            {subjectSummary.available
              ? `${subjectSummary.count} مادة`
              : "المواد غير متاحة"}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
        sx={{
          flexShrink: 0,
        }}
      >
        {canViewSchedule && (
          <Button
            component={Link}
            to={`/users/teachers/${teacher._id}/schedule`}
            variant="outlined"
            startIcon={
              <CalendarMonthOutlined />
            }
            sx={{
              minHeight: 42,
              px: 1.7,

              borderRadius: "12px",

              color:
                "var(--color-navy)",
              borderColor:
                "rgba(36, 74, 112, 0.16)",

              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "6px",
                  marginRight: 0,
                },
            }}
          >
            الجدول الدراسي
          </Button>
        )}

        {permissions.edit && (
          <>
            <Button
              type="button"
              disabled={toggleLoading}
              onClick={
                onToggleStatus
              }
              startIcon={
                <ToggleOnRounded />
              }
              variant="outlined"
              sx={{
                minHeight: 42,
                px: 1.7,

                borderRadius: "12px",

                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36, 74, 112, 0.16)",

                fontSize: "11px",
                fontWeight: 800,
                textTransform:
                  "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "6px",
                    marginRight: 0,
                  },
              }}
            >
              تغيير الحالة
            </Button>

            <Button
              component={Link}
              to={`/users/teachers/edit/${teacher._id}`}
              startIcon={
                <EditRounded />
              }
              variant="contained"
              sx={{
                minHeight: 42,
                px: 1.9,

                borderRadius: "12px",

                color:
                  "var(--color-white)",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

                boxShadow:
                  "0 8px 18px rgba(18, 47, 77, 0.16)",

                fontSize: "11px",
                fontWeight: 800,
                textTransform:
                  "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "6px",
                    marginRight: 0,
                  },
              }}
            >
              تعديل البيانات
            </Button>
          </>
        )}

        {permissions.delete && (
          <Tooltip title="حذف المعلم">
            <IconButton
              type="button"
              onClick={onDelete}
              sx={{
                width: 42,
                height: 42,

                color:
                  "var(--color-danger)",
                backgroundColor:
                  "rgba(201, 79, 79, 0.07)",

                border:
                  "1px solid rgba(201, 79, 79, 0.13)",
                borderRadius: "12px",

                "&:hover": {
                  color:
                    "var(--color-white)",
                  backgroundColor:
                    "var(--color-danger)",
                },
              }}
            >
              <DeleteOutlineRounded />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};

const TeacherDetails = ({
  teacher,
}) => {
  const subjectSummary =
    getSubjectsSummary(
      teacher
    );

  const data = [
    {
      label: "رقم الهاتف",
      value:
        teacher.phoneNumber ||
        "لا يوجد",
      icon: <LocalPhoneOutlined />,
    },
    {
      label: "البريد الإلكتروني",
      value: teacher.email || "—",
      icon: <EmailOutlined />,
    },
    {
      label: "المؤهل",
      value:
        teacher.qualification ||
        "لا يوجد",
      icon: <SchoolOutlined />,
    },
    {
      label: "التخصص",
      value:
        teacher.specialization ||
        "لا يوجد",
      icon: <PersonOutlineRounded />,
    },
    {
      label: "سنوات الخبرة",
      value:
        teacher.experience !==
          undefined &&
        teacher.experience !== ""
          ? `${teacher.experience} سنوات`
          : "لا يوجد",
      icon: <WorkHistoryOutlined />,
    },
    {
      label: "تاريخ التوظيف",
      value: teacher.hireDate
        ? formatDate(
            new Date(
              teacher.hireDate
            ),
            "eee, dd MMM yyyy"
          )
        : "—",
      icon: <CalendarMonthOutlined />,
    },
    {
      label: "العنوان",
      value:
        teacher.address ||
        "لا يوجد",
      icon: <HomeOutlined />,
    },
    {
      label: "المواد الدراسية",
      value:
        subjectSummary.label,
      icon: <MenuBookRounded />,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.5,
          md: 1.9,
        },

        border:
          "1px solid rgba(36, 74, 112, 0.08)",
        borderRadius: "20px",

        backgroundColor:
          "var(--color-cream)",

        boxShadow:
          "0 10px 24px rgba(18, 47, 77, 0.055)",
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="h2"
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          بيانات المعلم
        </Typography>

        <Typography
          sx={{
            mt: 0.25,
            color:
              "var(--color-muted)",
            fontSize: "9.5px",
          }}
        >
          البيانات المهنية وبيانات
          التواصل الخاصة بالمعلم.
        </Typography>
      </Box>

      <Grid container spacing={1.2}>
        {data.map((field) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={4}
            key={field.label}
          >
            <DetailCard
              {...field}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

const TeacherSubjects = ({
  teacher,
  setTeacher,
  permissions,
}) => {
  const { id } = useParams();

  const subjects =
    getSubjects(
      teacher
    );

  const subjectsAvailable =
    hasSubjectField(
      teacher
    );

  const originalIds = useMemo(
    () =>
      subjects
        .map(
          getSubjectId
        )
        .filter(Boolean),
    [
      JSON.stringify(
        subjects
      ),
    ]
  );

  const [
    selectedSubjects,
    setSelectedSubjects,
  ] = useState(originalIds);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setSelectedSubjects(originalIds);
  }, [originalIds]);

  const handleSaveChanges =
    async () => {
      if (
        selectedSubjects.length === 0
      ) {
        toast.error(
          "يرجى اختيار مادة دراسية واحدة على الأقل"
        );
        return;
      }

      const normalizedCurrent = [
        ...selectedSubjects,
      ].sort();

      const normalizedOriginal = [
        ...originalIds,
      ].sort();

      if (
        JSON.stringify(
          normalizedCurrent
        ) ===
        JSON.stringify(
          normalizedOriginal
        )
      ) {
        toast.info(
          "لا توجد تغييرات لحفظها"
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await editTeacher(
            {
              subjectIds:
                selectedSubjects,
            },
            id
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "حدث خطأ أثناء تعديل مواد المعلم"
          );
          return;
        }

        const updatedTeacher =
          response?.data?.teacher ||
          response?.data;

        const responseHasSubjects =
          hasSubjectField(
            updatedTeacher
          );

        storeTeacherSubjectIds(
          id,
          selectedSubjects
        );

        setTeacher((previous) => ({
          ...previous,
          ...(updatedTeacher &&
          typeof updatedTeacher ===
            "object"
            ? updatedTeacher
            : {}),
          ...(responseHasSubjects
            ? {}
            : {
                subjectIds:
                  selectedSubjects,
                __subjectsSource:
                  "local",
              }),
        }));

        toast.success(
          "تم تعديل مواد المعلم بنجاح"
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء تعديل مواد المعلم"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.5,
          md: 1.9,
        },

        border:
          "1px solid rgba(36, 74, 112, 0.08)",
        borderRadius: "20px",

        backgroundColor:
          "var(--color-cream)",

        boxShadow:
          "0 10px 24px rgba(18, 47, 77, 0.055)",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
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
              fontSize: "16px",
              fontWeight: 800,
            }}
          >
            المواد الدراسية
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color:
                "var(--color-muted)",
              fontSize: "9.5px",
            }}
          >
            المواد التي يستطيع المعلم
            تدريسها داخل المنصة.
          </Typography>
        </Box>

        {permissions.edit && (
          <Button
            type="button"
            disabled={loading}
            onClick={
              handleSaveChanges
            }
            variant="contained"
            sx={{
              minHeight: 40,
              px: 1.8,

              borderRadius: "12px",

              color:
                "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            {loading
              ? "جاري الحفظ..."
              : "حفظ المواد"}
          </Button>
        )}
      </Stack>

      {!subjectsAvailable && (
        <Alert
          severity="info"
          sx={{
            mb: 1,
            borderRadius:
              "12px",
            fontSize:
              "9.5px",
            "& .MuiAlert-message":
              {
                py: 0.25,
              },
          }}
        >
          الخادم لم يُرجع المواد المرتبطة بهذا المعلم.
          يمكنك اختيار المواد وحفظها، لكن قد لا تظهر أسماؤها بعد تحديث الصفحة حتى يدعمها الـAPI.
        </Alert>
      )}

      <Box
        sx={{
          p: 1.1,

          border:
            "1px solid rgba(36, 74, 112, 0.08)",
          borderRadius: "14px",

          backgroundColor:
            "var(--color-white)",
        }}
      >
        <SubjectCheckBoxes
          selectedSubjects={
            selectedSubjects
          }
          setSelectedSubjects={
            setSelectedSubjects
          }
        />
      </Box>
    </Paper>
  );
};

export default Profile;
