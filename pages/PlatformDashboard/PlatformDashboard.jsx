import {
  ApartmentRounded,
  CheckCircleRounded,
  PauseCircleRounded,
  RefreshRounded,
  TrendingUpRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Skeleton,
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
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getSuperAdminDashboard,
} from "@/APIs/platform/dashboard";

import {
  getPlatformSchools,
} from "@/APIs/platform/schools";

import {
  extractSchools,
  formatSchoolDate,
  getSchoolName,
  getSchoolStatus,
  normalizeDashboard,
} from "@/utils/platform/platformData";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const PlatformDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [schools, setSchools] =
    useState([]);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        schoolsResponse,
      ] = await Promise.all([
        getSuperAdminDashboard(),
        getPlatformSchools(),
      ]);

      const dashboardFailed =
        dashboardResponse?.status ===
        false;

      const schoolsFailed =
        schoolsResponse?.status ===
        false;

      if (
        dashboardFailed &&
        schoolsFailed
      ) {
        const message =
          dashboardResponse?.message ||
          schoolsResponse?.message ||
          "تعذر تحميل لوحة المنصة";

        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      setDashboardData(
        dashboardFailed
          ? null
          : dashboardResponse?.data
      );

      setSchools(
        schoolsFailed
          ? []
          : extractSchools(
              schoolsResponse?.data
            )
      );

      setLoading(false);
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboard =
    useMemo(
      () =>
        normalizeDashboard(
          dashboardData,
          schools
        ),
      [dashboardData, schools]
    );

  const stats = [
    {
      label: "إجمالي المدارس",
      value:
        dashboard.totalSchools,
      helper:
        "كل المدارس المسجلة",
      icon:
        <ApartmentRounded />,
    },
    {
      label:
        "المدارس النشطة",
      value:
        dashboard.activeSchools,
      helper:
        "متاحة وتعمل حاليًا",
      icon:
        <CheckCircleRounded />,
    },
    {
      label:
        "المدارس الموقوفة",
      value:
        dashboard.suspendedSchools,
      helper:
        "موقوفة عن استخدام النظام",
      icon:
        <PauseCircleRounded />,
    },
    {
      label:
        "الجديدة هذا الشهر",
      value:
        dashboard.newThisMonth,
      helper:
        "انضمت خلال الشهر الحالي",
      icon:
        <TrendingUpRounded />,
    },
  ];

  if (
    error &&
    !loading
  ) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "grid",
          placeItems: "center",
          p: 3,
          textAlign: "center",
          borderRadius: "18px",
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
              fontSize: "19px",
              fontWeight: 800,
            }}
          >
            تعذر تحميل لوحة المنصة
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color:
                authColors.muted,
              fontSize: "11px",
            }}
          >
            {error}
          </Typography>

          <Button
            onClick={
              loadDashboard
            }
            startIcon={
              <RefreshRounded />
            }
            sx={{
              mt: 2,
              color:
                authColors.white,
              backgroundColor:
                authColors.navy,
              borderRadius: "11px",
              textTransform: "none",
              "& .MuiButton-startIcon":
                {
                  ml: 0.7,
                  mr: 0,
                },
              "&:hover": {
                backgroundColor:
                  authColors.navyDark,
              },
            }}
          >
            إعادة المحاولة
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Compact statistics */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.25,
        }}
      >
        {stats.map(
          (item) => (
            <Box
              key={
                item.label
              }
              sx={{
                minHeight: 88,
                px: 1.45,
                py: 1.3,
                display: "grid",
                gridTemplateColumns:
                  "40px minmax(0, 1fr) auto",
                alignItems: "center",
                columnGap: 1.05,
                borderRadius: "15px",
                backgroundColor:
                  authColors.white,
                border: `1px solid ${authColors.border}`,
                boxShadow:
                  "0 8px 20px rgba(36,74,112,0.045)",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform:
                    "translateY(-2px)",
                  boxShadow:
                    "0 12px 25px rgba(36,74,112,0.08)",
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  color:
                    authColors.goldDark,
                  backgroundColor:
                    authColors.goldSoft,
                  "& svg": {
                    fontSize: 20,
                  },
                }}
              >
                {item.icon}
              </Box>

              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    color:
                      authColors.navyDeep,
                    fontSize: "11px",
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.35,
                    color:
                      authColors.muted,
                    fontSize: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  {item.helper}
                </Typography>
              </Box>

              {loading ? (
                <Skeleton
                  width={30}
                  height={35}
                />
              ) : (
                <Typography
                  sx={{
                    color:
                      authColors.navyDeep,
                    fontSize: "24px",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </Typography>
              )}
            </Box>
          )
        )}
      </Box>

      {/* Recent schools */}
      <Box
        sx={{
          mt: 1.8,
          borderRadius: "18px",
          overflow: "hidden",
          backgroundColor:
            authColors.white,
          border: `1px solid ${authColors.border}`,
          boxShadow:
            "0 10px 26px rgba(36,74,112,0.05)",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2,
              md: 2.4,
            },
            py: 1.65,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  authColors.navyDeep,
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              أحدث المدارس
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                color:
                  authColors.muted,
                fontSize: "9px",
              }}
            >
              آخر المدارس التي انضمت إلى نَسّق
            </Typography>
          </Box>

          <Button
            onClick={() =>
              navigate(
                "/platform/schools"
              )
            }
            sx={{
              minWidth: 0,
              px: 1,
              color:
                authColors.navy,
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            عرض الكل
          </Button>
        </Box>

        <Box
          sx={{
            overflowX: "auto",
          }}
        >
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 680,
              borderCollapse:
                "collapse",

              "& th": {
                px: 2.4,
                py: 1.35,
                color:
                  authColors.muted,
                backgroundColor:
                  "rgba(36,74,112,0.035)",
                borderTop: `1px solid ${authColors.border}`,
                borderBottom: `1px solid ${authColors.border}`,
                fontSize: "9.3px",
                fontWeight: 800,
                textAlign: "right",
              },

              "& td": {
                px: 2.4,
                py: 1.55,
                color:
                  authColors.text,
                borderBottom: `1px solid rgba(222,216,205,0.68)`,
                fontSize: "10.5px",
              },

              "& tbody tr": {
                transition:
                  "background-color 0.2s ease",
              },

              "& tbody tr:hover":
                {
                  backgroundColor:
                    "rgba(36,74,112,0.025)",
                },
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th">
                  المدرسة
                </Box>

                <Box component="th">
                  الحالة
                </Box>

                <Box component="th">
                  تاريخ التسجيل
                </Box>
              </Box>
            </Box>

            <Box component="tbody">
              {loading ? (
                Array.from({
                  length: 4,
                }).map(
                  (_, index) => (
                    <Box
                      component="tr"
                      key={index}
                    >
                      <Box component="td">
                        <Skeleton
                          width={140}
                        />
                      </Box>

                      <Box component="td">
                        <Skeleton
                          width={68}
                        />
                      </Box>

                      <Box component="td">
                        <Skeleton
                          width={90}
                        />
                      </Box>
                    </Box>
                  )
                )
              ) : dashboard
                  .recentSchools
                  .length ? (
                dashboard.recentSchools.map(
                  (school, index) => {
                    const active =
                      getSchoolStatus(
                        school
                      ) === "active";

                    return (
                      <Box
                        component="tr"
                        key={
                          school?._id ||
                          school?.id ||
                          index
                        }
                      >
                        <Box
                          component="td"
                          sx={{
                            fontWeight:
                              "700 !important",
                          }}
                        >
                          {getSchoolName(
                            school
                          )}
                        </Box>

                        <Box component="td">
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.42,
                              display:
                                "inline-flex",
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
                                "8.5px",
                              fontWeight:
                                800,
                            }}
                          >
                            {active
                              ? "نشطة"
                              : "موقوفة"}
                          </Box>
                        </Box>

                        <Box component="td">
                          {formatSchoolDate(
                            school
                          )}
                        </Box>
                      </Box>
                    );
                  }
                )
              ) : (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={3}
                    sx={{
                      py:
                        "42px !important",
                      textAlign:
                        "center !important",
                      color:
                        `${authColors.muted} !important`,
                    }}
                  >
                    لا توجد مدارس مسجلة حتى الآن
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PlatformDashboard;
