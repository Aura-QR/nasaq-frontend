import {
  ArrowBackRounded,
  BadgeRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
  EditRounded,
  EmailRounded,
  GroupsRounded,
  HomeRounded,
  PauseCircleOutlineRounded,
  PhoneRounded,
  RefreshRounded,
  SchoolRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  deleteSchoolStudent,
  getSchoolStudentById,
  toggleSchoolStudentActive,
  updateSchoolStudent,
} from "@/APIs/school/students";

import StudentDeleteDialog from "@/components/school/students/StudentDeleteDialog";
import StudentFormDialog from "@/components/school/students/StudentFormDialog";
import StudentStatusDialog from "@/components/school/students/StudentStatusDialog";

import {
  getStoredPermissions,
  hasPermission,
} from "@/shared/auth/permissions";

import {
  ROLES,
} from "@/shared/auth/roles";

import {
  extractStudent,
  formatStudentDate,
  getStudentAcademicYear,
  getStudentClassName,
  getStudentEmail,
  getStudentName,
  getStudentPhone,
  isStudentActive,
} from "@/utils/school/studentData";

import {
  getSchoolSessionInfo,
} from "@/utils/school/schoolSession";

const InfoCard = ({
  icon,
  label,
  value,
  direction = "rtl",
}) => (
  <Box
    sx={{
      minHeight: 82,
      p: 1.2,
      display: "grid",
      gridTemplateColumns:
        "38px minmax(0,1fr)",
      alignItems:
        "center",
      gap: 0.9,
      borderRadius:
        "14px",
      backgroundColor:
        "#fffcf7",
      border:
        "1px solid rgba(36,74,112,0.08)",
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        display: "grid",
        placeItems:
          "center",
        borderRadius:
          "11px",
        color:
          "#b78430",
        backgroundColor:
          "#fbf0d8",
        "& svg": {
          fontSize: 19,
        },
      }}
    >
      {icon}
    </Box>

    <Box
      sx={{
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color:
            "#7e8791",
          fontSize:
            "7.7px",
          fontWeight:
            700,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        title={
          String(
            value || "—"
          )
        }
        sx={{
          mt: 0.25,
          direction,
          textAlign:
            direction === "ltr"
              ? "left"
              : "right",
          color:
            "#122f4d",
          fontSize:
            "10px",
          fontWeight:
            800,
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const SchoolStudentDetails =
  () => {
    const navigate =
      useNavigate();

    const {
      studentId,
    } = useParams();

    const getAuthUser =
      useAuthUser();

    const authState =
      getAuthUser();

    const {
      role,
    } =
      getSchoolSessionInfo(
        authState
      );

    const permissions =
      authState?.permissions ||
      authState?.user
        ?.permissions ||
      getStoredPermissions();

    const fullAccess =
      [
        ROLES.OWNER,
        ROLES.SUPERVISOR,
      ].includes(role);

    const canUpdate =
      fullAccess ||
      hasPermission(
        permissions,
        "school.students.update"
      );

    const canDelete =
      fullAccess ||
      hasPermission(
        permissions,
        "school.students.delete"
      );

    const [student, setStudent] =
      useState(null);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    const [
      formOpen,
      setFormOpen,
    ] = useState(false);

    const [
      formLoading,
      setFormLoading,
    ] = useState(false);

    const [
      statusOpen,
      setStatusOpen,
    ] = useState(false);

    const [
      statusLoading,
      setStatusLoading,
    ] = useState(false);

    const [
      deleteOpen,
      setDeleteOpen,
    ] = useState(false);

    const [
      deleteLoading,
      setDeleteLoading,
    ] = useState(false);

    const loadStudent =
      useCallback(async () => {
        if (!studentId) {
          setError(
            "معرّف الطالب غير موجود"
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const response =
          await getSchoolStudentById(
            studentId
          );

        if (
          response?.status ===
          false
        ) {
          setError(
            response?.message ||
              "تعذر تحميل بيانات الطالب"
          );
          setLoading(false);
          return;
        }

        setStudent(
          extractStudent(
            response?.data
          )
        );

        setLoading(false);
      }, [studentId]);

    useEffect(() => {
      loadStudent();
    }, [loadStudent]);

    const active =
      useMemo(
        () =>
          isStudentActive(
            student
          ),
        [student]
      );

    const handleSave =
      async (payload) => {
        setFormLoading(true);

        const response =
          await updateSchoolStudent(
            studentId,
            payload
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر تعديل بيانات الطالب"
          );
          setFormLoading(false);
          return;
        }

        toast.success(
          "تم تعديل بيانات الطالب"
        );

        setFormOpen(false);
        setFormLoading(false);
        await loadStudent();
      };

    const handleToggleStatus =
      async () => {
        setStatusLoading(true);

        const response =
          await toggleSchoolStudentActive(
            studentId
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر تغيير حالة الطالب"
          );
          setStatusLoading(false);
          return;
        }

        toast.success(
          active
            ? "تم إيقاف الطالب"
            : "تم تفعيل الطالب"
        );

        setStatusOpen(false);
        setStatusLoading(false);
        await loadStudent();
      };

    const handleDelete =
      async () => {
        setDeleteLoading(true);

        const response =
          await deleteSchoolStudent(
            studentId
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر حذف الطالب"
          );
          setDeleteLoading(false);
          return;
        }

        toast.success(
          "تم حذف الطالب"
        );

        navigate(
          "/school/students",
          {
            replace: true,
          }
        );
      };

    if (loading) {
      return (
        <Box>
          <Skeleton
            height={110}
            sx={{
              borderRadius:
                "17px",
            }}
          />
          <Skeleton
            height={300}
            sx={{
              mt: 1,
              borderRadius:
                "17px",
            }}
          />
        </Box>
      );
    }

    if (
      error ||
      !student
    ) {
      return (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={
                loadStudent
              }
            >
              إعادة المحاولة
            </Button>
          }
        >
          {error ||
            "بيانات الطالب غير موجودة"}
        </Alert>
      );
    }

    const details = [
      {
        label:
          "البريد الإلكتروني",
        value:
          getStudentEmail(
            student
          ),
        icon:
          <EmailRounded />,
        direction: "ltr",
      },
      {
        label:
          "رقم الهاتف",
        value:
          getStudentPhone(
            student
          ),
        icon:
          <PhoneRounded />,
        direction: "ltr",
      },
      {
        label:
          "السنة الدراسية",
        value:
          getStudentAcademicYear(
            student
          ),
        icon:
          <SchoolRounded />,
      },
      {
        label:
          "الفصل",
        value:
          getStudentClassName(
            student
          ),
        icon:
          <GroupsRounded />,
      },
      {
        label:
          "تاريخ الميلاد",
        value:
          formatStudentDate(
            student?.birthDate
          ),
        icon:
          <CalendarMonthRounded />,
      },
      {
        label:
          "تاريخ التسجيل",
        value:
          formatStudentDate(
            student?.registrationDate ||
              student?.createdAt
          ),
        icon:
          <CalendarMonthRounded />,
      },
      {
        label:
          "الجنسية",
        value:
          student?.nationality,
        icon:
          <BadgeRounded />,
      },
      {
        label:
          "العنوان",
        value:
          student?.address,
        icon:
          <HomeRounded />,
      },
      {
        label:
          "المدرسة السابقة",
        value:
          student?.previousSchool,
        icon:
          <SchoolRounded />,
      },
    ];

    return (
      <Box>
        <Box
          sx={{
            p: 1.4,
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
            borderRadius:
              "17px",
            backgroundColor:
              "#ffffff",
            border:
              "1px solid #ded8cd",
            boxShadow:
              "0 8px 22px rgba(36,74,112,0.04)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems:
                  "center",
                borderRadius:
                  "14px",
                color:
                  "#ffffff",
                backgroundColor:
                  "#244a70",
                fontSize:
                  "16px",
                fontWeight:
                  800,
              }}
            >
              {getStudentName(
                student
              )
                .trim()
                .charAt(0)}
            </Box>

            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.7}
              >
                <Typography
                  sx={{
                    color:
                      "#122f4d",
                    fontSize:
                      "18px",
                    fontWeight:
                      800,
                  }}
                >
                  {getStudentName(
                    student
                  )}
                </Typography>

                <Box
                  component="span"
                  sx={{
                    px: 0.8,
                    py: 0.3,
                    borderRadius:
                      "999px",
                    color:
                      active
                        ? "#29734A"
                        : "#A44343",
                    backgroundColor:
                      active
                        ? "rgba(116,201,154,0.17)"
                        : "rgba(201,79,79,0.12)",
                    fontSize:
                      "7.5px",
                    fontWeight:
                      800,
                  }}
                >
                  {active
                    ? "نشط"
                    : "موقوف"}
                </Box>
              </Stack>

              <Typography
                sx={{
                  mt: 0.25,
                  color:
                    "#7e8791",
                  fontSize:
                    "8px",
                }}
              >
                {getStudentAcademicYear(
                  student
                )}{" "}
                •{" "}
                {getStudentClassName(
                  student
                )}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={0.7}
          >
            <Button
              onClick={() =>
                navigate(
                  "/school/students"
                )
              }
              startIcon={
                <ArrowBackRounded />
              }
              sx={{
                color:
                  "#244a70",
                backgroundColor:
                  "rgba(36,74,112,0.07)",
              }}
            >
              العودة للطلاب
            </Button>

            {canUpdate && (
              <>
                <Button
                  onClick={() =>
                    setFormOpen(
                      true
                    )
                  }
                  startIcon={
                    <EditRounded />
                  }
                  sx={{
                    color:
                      "#244a70",
                    backgroundColor:
                      "rgba(36,74,112,0.07)",
                  }}
                >
                  تعديل
                </Button>

                <Button
                  onClick={() =>
                    setStatusOpen(
                      true
                    )
                  }
                  startIcon={
                    <PauseCircleOutlineRounded />
                  }
                  sx={{
                    color:
                      active
                        ? "#c94f4f"
                        : "#29734A",
                    backgroundColor:
                      active
                        ? "rgba(201,79,79,0.08)"
                        : "rgba(116,201,154,0.14)",
                  }}
                >
                  {active
                    ? "إيقاف"
                    : "تفعيل"}
                </Button>
              </>
            )}

            {canDelete && (
              <Button
                onClick={() =>
                  setDeleteOpen(
                    true
                  )
                }
                startIcon={
                  <DeleteOutlineRounded />
                }
                sx={{
                  color:
                    "#c94f4f",
                  backgroundColor:
                    "rgba(201,79,79,0.08)",
                }}
              >
                حذف
              </Button>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius:
              "17px",
            backgroundColor:
              "#ffffff",
            border:
              "1px solid #ded8cd",
            boxShadow:
              "0 8px 22px rgba(36,74,112,0.035)",
          }}
        >
          <Typography
            sx={{
              color:
                "#122f4d",
              fontSize:
                "13px",
              fontWeight:
                800,
            }}
          >
            بيانات الطالب
          </Typography>

          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns:
                {
                  xs: "1fr",
                  sm:
                    "repeat(2,minmax(0,1fr))",
                  lg:
                    "repeat(3,minmax(0,1fr))",
                },
              gap: 0.8,
            }}
          >
            {details.map(
              (item) => (
                <InfoCard
                  key={
                    item.label
                  }
                  {...item}
                />
              )
            )}
          </Box>

          {student?.notes && (
            <Box
              sx={{
                mt: 0.9,
                p: 1.2,
                borderRadius:
                  "13px",
                backgroundColor:
                  "#fffcf7",
                border:
                  "1px solid rgba(36,74,112,0.08)",
              }}
            >
              <Typography
                sx={{
                  color:
                    "#7e8791",
                  fontSize:
                    "7.7px",
                  fontWeight:
                    700,
                }}
              >
                الملاحظات
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color:
                    "#193754",
                  fontSize:
                    "9px",
                  lineHeight: 1.8,
                }}
              >
                {student.notes}
              </Typography>
            </Box>
          )}
        </Box>

        <StudentFormDialog
          open={formOpen}
          student={student}
          loading={
            formLoading
          }
          onClose={() =>
            setFormOpen(
              false
            )
          }
          onSave={
            handleSave
          }
        />

        <StudentStatusDialog
          open={statusOpen}
          student={student}
          loading={
            statusLoading
          }
          onClose={() =>
            setStatusOpen(
              false
            )
          }
          onConfirm={
            handleToggleStatus
          }
        />

        <StudentDeleteDialog
          open={deleteOpen}
          student={student}
          loading={
            deleteLoading
          }
          onClose={() =>
            setDeleteOpen(
              false
            )
          }
          onConfirm={
            handleDelete
          }
        />
      </Box>
    );
  };

export default SchoolStudentDetails;
