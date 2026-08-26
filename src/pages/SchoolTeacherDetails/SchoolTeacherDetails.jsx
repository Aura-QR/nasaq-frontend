import {
  AdminPanelSettingsRounded,
  ArrowBackRounded,
  BadgeRounded,
  CalendarMonthRounded,
  DeleteOutlineRounded,
  EditRounded,
  EmailRounded,
  HomeRounded,
  MenuBookRounded,
  PauseCircleOutlineRounded,
  PhoneRounded,
  SchoolRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
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
  deleteSchoolTeacher,
  getSchoolTeacherById,
  toggleSchoolTeacherActive,
  updateSchoolTeacher,
} from "@/APIs/school/teachers";

import {
  demoteTeacherFromManager,
  promoteTeacherToManager,
} from "@/APIs/school/managers";

import TeacherDeleteDialog from "@/components/school/teachers/TeacherDeleteDialog";
import TeacherFormDialog from "@/components/school/teachers/TeacherFormDialog";
import TeacherManagerRoleDialog from "@/components/school/teachers/TeacherManagerRoleDialog";
import TeacherStatusDialog from "@/components/school/teachers/TeacherStatusDialog";

import {
  getStoredPermissions,
  hasPermission,
} from "@/shared/auth/permissions";

import {
  ROLES,
} from "@/shared/auth/roles";

import {
  extractTeacher,
  formatTeacherDate,
  getTeacherEmail,
  getTeacherExperience,
  getTeacherName,
  getTeacherPhone,
  getTeacherQualification,
  getTeacherSpecialization,
  getTeacherSubjectNames,
  isTeacherActive,
  isTeacherManager,
} from "@/utils/school/teacherData";

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

const SchoolTeacherDetails =
  () => {
    const navigate =
      useNavigate();

    const {
      teacherId,
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
        "school.teachers.update"
      );

    const canDelete =
      fullAccess ||
      hasPermission(
        permissions,
        "school.teachers.delete"
      );

    const canManageRole =
      fullAccess;

    const [teacher, setTeacher] =
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
      managerRoleOpen,
      setManagerRoleOpen,
    ] = useState(false);

    const [
      managerRoleLoading,
      setManagerRoleLoading,
    ] = useState(false);

    const [
      deleteOpen,
      setDeleteOpen,
    ] = useState(false);

    const [
      deleteLoading,
      setDeleteLoading,
    ] = useState(false);

    const loadTeacher =
      useCallback(async () => {
        if (!teacherId) {
          setError(
            "معرّف المعلم غير موجود"
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const response =
          await getSchoolTeacherById(
            teacherId
          );

        if (
          response?.status ===
          false
        ) {
          setError(
            response?.message ||
              "تعذر تحميل بيانات المعلم"
          );
          setLoading(false);
          return;
        }

        setTeacher(
          extractTeacher(
            response?.data
          )
        );

        setLoading(false);
      }, [teacherId]);

    useEffect(() => {
      loadTeacher();
    }, [loadTeacher]);

    const handleSave =
      async (payload) => {
        setFormLoading(true);

        const response =
          await updateSchoolTeacher(
            teacherId,
            payload
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر تعديل بيانات المعلم"
          );
          setFormLoading(false);
          return;
        }

        toast.success(
          "تم تعديل بيانات المعلم"
        );

        setFormOpen(false);
        setFormLoading(false);
        await loadTeacher();
      };

    const handleToggleStatus =
      async () => {
        const active =
          isTeacherActive(
            teacher
          );

        setStatusLoading(true);

        const response =
          await toggleSchoolTeacherActive(
            teacherId
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر تغيير حالة المعلم"
          );
          setStatusLoading(false);
          return;
        }

        toast.success(
          active
            ? "تم إيقاف المعلم"
            : "تم تفعيل المعلم"
        );

        setStatusOpen(false);
        setStatusLoading(false);
        await loadTeacher();
      };

    const handleToggleManagerRole =
      async () => {
        const manager =
          isTeacherManager(
            teacher
          );

        setManagerRoleLoading(
          true
        );

        const response =
          manager
            ? await demoteTeacherFromManager(
                teacherId
              )
            : await promoteTeacherToManager(
                teacherId
              );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              (manager
                ? "تعذر إلغاء دور المدير"
                : "تعذر ترقية المعلم")
          );
          setManagerRoleLoading(
            false
          );
          return;
        }

        toast.success(
          manager
            ? "تم إلغاء دور المدير"
            : "تمت ترقية المعلم إلى مدير"
        );

        setManagerRoleOpen(
          false
        );
        setManagerRoleLoading(
          false
        );
        await loadTeacher();
      };

    const handleDelete =
      async () => {
        setDeleteLoading(true);

        const response =
          await deleteSchoolTeacher(
            teacherId
          );

        if (
          response?.status ===
          false
        ) {
          toast.error(
            response?.message ||
              "تعذر حذف المعلم"
          );
          setDeleteLoading(false);
          return;
        }

        toast.success(
          "تم حذف المعلم"
        );

        navigate(
          "/school/teachers",
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
            height={320}
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
      !teacher
    ) {
      return (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={
                loadTeacher
              }
            >
              إعادة المحاولة
            </Button>
          }
        >
          {error ||
            "بيانات المعلم غير موجودة"}
        </Alert>
      );
    }

    const active =
      isTeacherActive(
        teacher
      );

    const manager =
      isTeacherManager(
        teacher
      );

    const subjectNames =
      getTeacherSubjectNames(
        teacher
      );

    const details = [
      {
        label:
          "البريد الإلكتروني",
        value:
          getTeacherEmail(
            teacher
          ),
        icon:
          <EmailRounded />,
        direction: "ltr",
      },
      {
        label:
          "رقم الهاتف",
        value:
          getTeacherPhone(
            teacher
          ),
        icon:
          <PhoneRounded />,
        direction: "ltr",
      },
      {
        label:
          "المؤهل",
        value:
          getTeacherQualification(
            teacher
          ),
        icon:
          <WorkspacePremiumRounded />,
      },
      {
        label:
          "الخبرة",
        value:
          getTeacherExperience(
            teacher
          ),
        icon:
          <BadgeRounded />,
      },
      {
        label:
          "التخصص",
        value:
          getTeacherSpecialization(
            teacher
          ),
        icon:
          <SchoolRounded />,
      },
      {
        label:
          "تاريخ التعيين",
        value:
          formatTeacherDate(
            teacher?.hireDate
          ),
        icon:
          <CalendarMonthRounded />,
      },
      {
        label:
          "عدد المواد",
        value:
          subjectNames.length,
        icon:
          <MenuBookRounded />,
      },
      {
        label:
          "الدور الإداري",
        value:
          manager
            ? "مساعد إداري"
            : "معلم",
        icon:
          <AdminPanelSettingsRounded />,
      },
      {
        label:
          "العنوان",
        value:
          teacher?.address,
        icon:
          <HomeRounded />,
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
              {getTeacherName(
                teacher
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
                  {getTeacherName(
                    teacher
                  )}
                </Typography>

                <Chip
                  size="small"
                  label={
                    active
                      ? "نشط"
                      : "موقوف"
                  }
                  sx={{
                    height: 23,
                    color:
                      active
                        ? "#29734A"
                        : "#A44343",
                    backgroundColor:
                      active
                        ? "rgba(116,201,154,0.17)"
                        : "rgba(201,79,79,0.12)",
                    fontSize:
                      "7.2px",
                    fontWeight:
                      800,
                  }}
                />

                {manager && (
                  <Chip
                    size="small"
                    label="مساعد إداري"
                    sx={{
                      height: 23,
                      color:
                        "#8a5a00",
                      backgroundColor:
                        "#fbf0d8",
                      fontSize:
                        "7.2px",
                      fontWeight:
                        800,
                    }}
                  />
                )}
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
                {getTeacherSpecialization(
                  teacher
                )}{" "}
                •{" "}
                {getTeacherQualification(
                  teacher
                )}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={0.65}
          >
            <Button
              onClick={() =>
                navigate(
                  "/school/teachers"
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
              العودة للمعلمين
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

            {canManageRole && (
              <Button
                onClick={() =>
                  setManagerRoleOpen(
                    true
                  )
                }
                startIcon={
                  <AdminPanelSettingsRounded />
                }
                sx={{
                  color:
                    manager
                      ? "#A44343"
                      : "#8a5a00",
                  backgroundColor:
                    manager
                      ? "rgba(201,79,79,0.08)"
                      : "#fbf0d8",
                }}
              >
                {manager
                  ? "إلغاء الإدارة"
                  : "ترقية إلى مدير"}
              </Button>
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
            بيانات المعلم
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
              المواد المسندة
            </Typography>

            {subjectNames.length ? (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.6}
                sx={{
                  mt: 0.7,
                }}
              >
                {subjectNames.map(
                  (
                    subject,
                    index
                  ) => (
                    <Chip
                      key={`${subject}-${index}`}
                      label={subject}
                      sx={{
                        color:
                          "#244a70",
                        backgroundColor:
                          "rgba(36,74,112,0.07)",
                        fontSize:
                          "7.5px",
                        fontWeight:
                          700,
                      }}
                    />
                  )
                )}
              </Stack>
            ) : (
              <Typography
                sx={{
                  mt: 0.45,
                  color:
                    "#7e8791",
                  fontSize:
                    "8.5px",
                }}
              >
                لا توجد مواد مسندة لهذا المعلم.
              </Typography>
            )}
          </Box>
        </Box>

        <TeacherFormDialog
          open={formOpen}
          teacher={teacher}
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

        <TeacherStatusDialog
          open={statusOpen}
          teacher={teacher}
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

        <TeacherManagerRoleDialog
          open={
            managerRoleOpen
          }
          teacher={teacher}
          loading={
            managerRoleLoading
          }
          onClose={() =>
            setManagerRoleOpen(
              false
            )
          }
          onConfirm={
            handleToggleManagerRole
          }
        />

        <TeacherDeleteDialog
          open={deleteOpen}
          teacher={teacher}
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

export default SchoolTeacherDetails;
