import {
  ApartmentRounded,
  ArrowBackRounded,
  BadgeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  ContentCopyRounded,
  EditRounded,
  EmailRounded,
  LinkRounded,
  PauseCircleRounded,
  PhoneRounded,
  RefreshRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
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
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  activatePlatformSchool,
  getPlatformSchoolById,
  suspendPlatformSchool,
  updatePlatformSchool,
} from "@/APIs/platform/schools";

import SchoolEditDialog from "@/components/platform/SchoolEditDialog";
import SchoolStatusDialog from "@/components/platform/SchoolStatusDialog";

import {
  formatSchoolDate,
  getSchoolEmail,
  getSchoolId,
  getSchoolName,
  getSchoolPhone,
  getSchoolStatus,
  unwrapPayload,
} from "@/utils/platform/platformData";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const extractSchool = (
  payload
) => {
  const data =
    unwrapPayload(payload);

  return (
    data?.school ||
    data?.tenant ||
    data?.record ||
    data ||
    null
  );
};

const InfoCard = ({
  icon,
  label,
  value,
  copyable = false,
  valueDirection = "rtl",
  statusTone,
}) => {
  const displayValue =
    value || "—";

  const handleCopy =
    async () => {
      if (
        !copyable ||
        !value ||
        value === "—"
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          String(value)
        );

        toast.success(
          "تم النسخ"
        );
      } catch {
        toast.error(
          "تعذر نسخ القيمة"
        );
      }
    };

  return (
    <Box
      sx={{
        minHeight: 86,
        p: 1.35,

        display: "grid",

        gridTemplateColumns:
          "38px minmax(0, 1fr) auto",

        alignItems: "center",
        gap: 1,

        borderRadius: "14px",

        backgroundColor:
          statusTone === "active"
            ? "rgba(116,201,154,0.08)"
            : statusTone === "suspended"
            ? "rgba(201,79,79,0.055)"
            : authColors.cream,

        border:
          statusTone === "active"
            ? "1px solid rgba(116,201,154,0.22)"
            : statusTone === "suspended"
            ? "1px solid rgba(201,79,79,0.17)"
            : "1px solid rgba(36,74,112,0.075)",

        transition:
          "border-color 0.2s ease, transform 0.2s ease",

        "&:hover": {
          transform:
            "translateY(-2px)",

          borderColor:
            "rgba(211,164,79,0.42)",
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,

          display: "grid",
          placeItems: "center",

          borderRadius: "11px",

          color:
            statusTone === "active"
              ? "#29734A"
              : statusTone === "suspended"
              ? authColors.danger
              : authColors.goldDark,

          backgroundColor:
            statusTone === "active"
              ? "rgba(116,201,154,0.17)"
              : statusTone === "suspended"
              ? "rgba(201,79,79,0.11)"
              : authColors.goldSoft,

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
              authColors.muted,

            fontSize: "8.5px",
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>

        <Typography
          title={String(
            displayValue
          )}
          sx={{
            mt: 0.35,

            overflow: "hidden",

            textOverflow:
              "ellipsis",

            whiteSpace:
              "nowrap",

            direction:
              valueDirection,

            textAlign:
              valueDirection ===
              "ltr"
                ? "left"
                : "right",

            color:
              authColors.navyDeep,

            fontSize: "11px",
            fontWeight: 800,
          }}
        >
          {displayValue}
        </Typography>
      </Box>

      {copyable &&
        value &&
        value !== "—" && (
          <IconButton
            onClick={
              handleCopy
            }
            aria-label={`نسخ ${label}`}
            sx={{
              width: 30,
              height: 30,

              color:
                authColors.navy,

              backgroundColor:
                "rgba(36,74,112,0.055)",

              "& svg": {
                fontSize: 15,
              },
            }}
          >
            <ContentCopyRounded />
          </IconButton>
        )}
    </Box>
  );
};

const PlatformSchoolDetails =
  () => {
    const navigate =
      useNavigate();

    const {
      schoolId,
    } = useParams();

    const [school, setSchool] =
      useState(null);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    const [
      editDialogOpen,
      setEditDialogOpen,
    ] = useState(false);

    const [
      editLoading,
      setEditLoading,
    ] = useState(false);

    const [
      statusDialogOpen,
      setStatusDialogOpen,
    ] = useState(false);

    const [
      statusLoading,
      setStatusLoading,
    ] = useState(false);

    const loadSchool =
      useCallback(async () => {
        if (!schoolId) {
          setError(
            "معرّف المدرسة غير موجود"
          );

          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const response =
          await getPlatformSchoolById(
            schoolId
          );

        if (
          response?.status === false
        ) {
          setError(
            response?.message ||
              "تعذر تحميل بيانات المدرسة"
          );

          setLoading(false);
          return;
        }

        setSchool(
          extractSchool(
            response?.data
          )
        );

        setLoading(false);
      }, [schoolId]);

    useEffect(() => {
      loadSchool();
    }, [loadSchool]);

    const active =
      useMemo(
        () =>
          getSchoolStatus(
            school
          ) === "active",
        [school]
      );

    const handleEditSave =
      async (payload) => {
        setEditLoading(true);

        const response =
          await updatePlatformSchool(
            schoolId,
            payload
          );

        if (
          response?.status === false
        ) {
          toast.error(
            response?.message ||
              "تعذر تعديل بيانات المدرسة"
          );

          setEditLoading(false);
          return;
        }

        toast.success(
          "تم تعديل بيانات المدرسة بنجاح"
        );

        setEditDialogOpen(false);
        setEditLoading(false);

        await loadSchool();
      };

    const handleStatusConfirm =
      async () => {
        setStatusLoading(true);

        const response =
          active
            ? await suspendPlatformSchool(
                schoolId
              )
            : await activatePlatformSchool(
                schoolId
              );

        if (
          response?.status === false
        ) {
          toast.error(
            response?.message ||
              "تعذر تغيير حالة المدرسة"
          );

          setStatusLoading(false);
          return;
        }

        toast.success(
          active
            ? "تم إيقاف المدرسة"
            : "تم تفعيل المدرسة"
        );

        setStatusDialogOpen(false);
        setStatusLoading(false);

        await loadSchool();
      };

    if (loading) {
      return (
        <Box>
          <Skeleton
            height={112}
            sx={{
              borderRadius:
                "18px",
            }}
          />

          <Skeleton
            height={260}
            sx={{
              mt: 1.5,

              borderRadius:
                "18px",
            }}
          />
        </Box>
      );
    }

    if (
      error ||
      !school
    ) {
      return (
        <Box
          sx={{
            minHeight: 340,

            display: "grid",

            placeItems:
              "center",

            p: 3,

            textAlign:
              "center",

            borderRadius:
              "18px",

            backgroundColor:
              authColors.white,

            border: `1px solid ${authColors.border}`,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  authColors.navyDeep,

                fontSize:
                  "19px",

                fontWeight:
                  800,
              }}
            >
              تعذر فتح المدرسة
            </Typography>

            <Typography
              sx={{
                mt: 1,

                color:
                  authColors.muted,

                fontSize:
                  "11px",
              }}
            >
              {error ||
                "بيانات المدرسة غير موجودة"}
            </Typography>

            <Stack
              direction="row"
              justifyContent="center"
              spacing={1}
              sx={{
                mt: 2,
              }}
            >
              <Button
                onClick={() =>
                  navigate(
                    "/platform/schools"
                  )
                }
                startIcon={
                  <ArrowBackRounded />
                }
              >
                العودة
              </Button>

              <Button
                onClick={
                  loadSchool
                }
                startIcon={
                  <RefreshRounded />
                }
              >
                إعادة المحاولة
              </Button>
            </Stack>
          </Box>
        </Box>
      );
    }

    const details = [
      {
        label:
          "البريد الإلكتروني",

        value:
          getSchoolEmail(
            school
          ),

        icon:
          <EmailRounded />,

        copyable: true,

        valueDirection:
          "ltr",
      },

      {
        label:
          "رقم الجوال",

        value:
          getSchoolPhone(
            school
          ),

        icon:
          <PhoneRounded />,

        copyable: true,

        valueDirection:
          "ltr",
      },

      {
        label:
          "رابط المدرسة",

        value:
          school?.slug ||
          "—",

        icon:
          <LinkRounded />,

        copyable: true,

        valueDirection:
          "ltr",
      },

      {
        label:
          "تاريخ التسجيل",

        value:
          formatSchoolDate(
            school
          ),

        icon:
          <CalendarMonthRounded />,
      },

      {
        label:
          "معرّف المدرسة",

        value:
          getSchoolId(
            school
          ) || "—",

        icon:
          <BadgeRounded />,

        copyable: true,

        valueDirection:
          "ltr",
      },

      {
        label:
          "الحالة الحالية",

        value:
          active
            ? "نشطة"
            : "موقوفة",

        icon: active
          ? <CheckCircleRounded />
          : <PauseCircleRounded />,

        statusTone:
          active
            ? "active"
            : "suspended",
      },
    ];

    return (
      <Box>
        <Box
          sx={{
            px: {
              xs: 1.8,
              md: 2.2,
            },

            py: {
              xs: 1.65,
              md: 1.8,
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

            gap: 1.5,

            borderRadius:
              "18px",

            backgroundColor:
              authColors.white,

            border: `1px solid ${authColors.border}`,

            boxShadow:
              "0 9px 25px rgba(36,74,112,0.05)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,

                flexShrink: 0,

                display: "grid",

                placeItems:
                  "center",

                borderRadius:
                  "15px",

                color:
                  authColors.goldDark,

                backgroundColor:
                  authColors.goldSoft,

                "& svg": {
                  fontSize: 25,
                },
              }}
            >
              <ApartmentRounded />
            </Box>

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.1}
                sx={{
                  flexWrap:
                    "wrap",

                  rowGap: 0.6,
                }}
              >
                <Typography
                  sx={{
                    color:
                      authColors.navyDeep,

                    fontSize: {
                      xs: "18px",
                      md: "21px",
                    },

                    fontWeight:
                      800,

                    lineHeight:
                      1.25,
                  }}
                >
                  {getSchoolName(
                    school
                  )}
                </Typography>

                <Box
                  component="span"
                  sx={{
                    px: 0.9,
                    py: 0.35,

                    display:
                      "inline-flex",

                    alignItems:
                      "center",

                    gap: 0.4,

                    borderRadius:
                      "999px",

                    color: active
                      ? "#29734A"
                      : "#A44343",

                    backgroundColor:
                      active
                        ? "rgba(116,201,154,0.17)"
                        : "rgba(201,79,79,0.12)",

                    fontSize:
                      "8px",

                    fontWeight:
                      800,

                    "& svg": {
                      fontSize:
                        11,
                    },
                  }}
                >
                  {active ? (
                    <CheckCircleRounded />
                  ) : (
                    <PauseCircleRounded />
                  )}

                  {active
                    ? "نشطة"
                    : "موقوفة"}
                </Box>
              </Stack>

              <Typography
                sx={{
                  mt: 0.35,

                  direction:
                    "ltr",

                  textAlign:
                    "right",

                  color:
                    authColors.muted,

                  fontSize:
                    "8.5px",
                }}
              >
                {school?.slug ||
                  "تفاصيل المدرسة"}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={0.8}
          >
            <Button
              onClick={() =>
                navigate(
                  "/platform/schools"
                )
              }
              startIcon={
                <ArrowBackRounded />
              }
              sx={{
                minHeight: 40,
                px: 1.45,

                borderRadius:
                  "10px",

                color:
                  authColors.navy,

                backgroundColor:
                  "rgba(36,74,112,0.06)",

                fontSize:
                  "9.5px",

                fontWeight:
                  800,

                textTransform:
                  "none",

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              العودة للمدارس
            </Button>

            <Button
              onClick={() =>
                setEditDialogOpen(
                  true
                )
              }
              startIcon={
                <EditRounded />
              }
              sx={{
                minHeight: 40,
                px: 1.45,

                borderRadius:
                  "10px",

                color:
                  authColors.navy,

                backgroundColor:
                  "rgba(36,74,112,0.085)",

                fontSize:
                  "9.5px",

                fontWeight:
                  800,

                textTransform:
                  "none",

                "& .MuiButton-startIcon":
                  {
                    ml: 0.55,
                    mr: 0,
                  },
              }}
            >
              تعديل البيانات
            </Button>

            <Button
              onClick={() =>
                setStatusDialogOpen(
                  true
                )
              }
              sx={{
                minHeight: 40,
                px: 1.55,

                borderRadius:
                  "10px",

                color: active
                  ? authColors.danger
                  : "#29734A",

                backgroundColor:
                  active
                    ? "rgba(201,79,79,0.09)"
                    : "rgba(116,201,154,0.15)",

                fontSize:
                  "9.5px",

                fontWeight:
                  800,

                textTransform:
                  "none",
              }}
            >
              {active
                ? "إيقاف المدرسة"
                : "تفعيل المدرسة"}
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 1.5,

            p: {
              xs: 1.6,
              md: 1.9,
            },

            borderRadius:
              "18px",

            backgroundColor:
              authColors.white,

            border: `1px solid ${authColors.border}`,

            boxShadow:
              "0 9px 25px rgba(36,74,112,0.045)",
          }}
        >
          <Box
            sx={{
              mb: 1.35,
            }}
          >
            <Typography
              sx={{
                color:
                  authColors.navyDeep,

                fontSize:
                  "14px",

                fontWeight:
                  800,
              }}
            >
              بيانات المدرسة
            </Typography>

            <Typography
              sx={{
                mt: 0.25,

                color:
                  authColors.muted,

                fontSize:
                  "8.5px",
              }}
            >
              المعلومات الأساسية وحالة الحساب
            </Typography>
          </Box>

          <Box
            sx={{
              display:
                "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",

                  sm:
                    "repeat(2,minmax(0,1fr))",

                  lg:
                    "repeat(3,minmax(0,1fr))",
                },

              gap: 1.05,
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
        </Box>

        <SchoolEditDialog
          open={
            editDialogOpen
          }
          schoolName={
            getSchoolName(
              school
            )
          }
          schoolPhone={
            getSchoolPhone(
              school
            )
          }
          loading={
            editLoading
          }
          onClose={() =>
            setEditDialogOpen(
              false
            )
          }
          onSave={
            handleEditSave
          }
        />

        <SchoolStatusDialog
          open={
            statusDialogOpen
          }
          schoolName={
            getSchoolName(
              school
            )
          }
          action={
            active
              ? "suspend"
              : "activate"
          }
          loading={
            statusLoading
          }
          onClose={() =>
            setStatusDialogOpen(
              false
            )
          }
          onConfirm={
            handleStatusConfirm
          }
        />
      </Box>
    );
  };

export default PlatformSchoolDetails;
