import {
  ApartmentRounded,
  CheckCircleRounded,
  EditRounded,
  PauseCircleRounded,
  RefreshRounded,
  SearchRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
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
  activatePlatformSchool,
  getPlatformSchools,
  suspendPlatformSchool,
  updatePlatformSchool,
} from "@/APIs/platform/schools";

import SchoolEditDialog from "@/components/platform/SchoolEditDialog";
import SchoolStatusDialog from "@/components/platform/SchoolStatusDialog";

import {
  extractSchools,
  formatSchoolDate,
  getSchoolEmail,
  getSchoolId,
  getSchoolName,
  getSchoolPhone,
  getSchoolStatus,
} from "@/utils/platform/platformData";

import {
  authColors,
} from "@/pages/Auth/AuthLayout";

const PlatformSchools = () => {
  const navigate =
    useNavigate();

  const [schools, setSchools] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [error, setError] =
    useState("");

  const [
    selectedSchool,
    setSelectedSchool,
  ] = useState(null);

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

  const loadSchools =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const response =
        await getPlatformSchools();

      if (
        response?.status === false
      ) {
        const message =
          response?.message ||
          "تعذر تحميل المدارس";

        setError(message);
        toast.error(message);
        setLoading(false);

        return;
      }

      setSchools(
        extractSchools(
          response?.data
        )
      );

      setLoading(false);
    }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const filteredSchools =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return schools.filter(
        (school) => {
          const status =
            getSchoolStatus(
              school
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            status ===
              statusFilter;

          const searchableText = [
            getSchoolName(
              school
            ),
            getSchoolEmail(
              school
            ),
            getSchoolPhone(
              school
            ),
            school?.slug,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch
            );

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      schools,
      search,
      statusFilter,
    ]);

  const openEditDialog =
    (school) => {
      setSelectedSchool(
        school
      );

      setEditDialogOpen(
        true
      );
    };

  const openStatusDialog =
    (school) => {
      setSelectedSchool(
        school
      );

      setStatusDialogOpen(
        true
      );
    };

  const handleEditSave =
    async (payload) => {
      const schoolId =
        getSchoolId(
          selectedSchool
        );

      if (!schoolId) {
        toast.error(
          "معرّف المدرسة غير موجود"
        );

        return;
      }

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
      setSelectedSchool(null);
      setEditLoading(false);

      await loadSchools();
    };

  const handleStatusConfirm =
    async () => {
      const schoolId =
        getSchoolId(
          selectedSchool
        );

      const active =
        getSchoolStatus(
          selectedSchool
        ) === "active";

      if (!schoolId) {
        toast.error(
          "معرّف المدرسة غير موجود"
        );

        return;
      }

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
      setSelectedSchool(null);
      setStatusLoading(false);

      await loadSchools();
    };

  return (
    <Box>
      <Box
        sx={{
          p: {
            xs: 2,
            md: 2.4,
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
            "0 10px 28px rgba(36,74,112,0.055)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems:
              "center",

            gap: 1.2,
          }}
        >
          <Box
            sx={{
              width: 45,
              height: 45,

              display: "grid",
              placeItems:
                "center",

              borderRadius:
                "14px",

              color:
                authColors.goldDark,

              backgroundColor:
                authColors.goldSoft,
            }}
          >
            <ApartmentRounded />
          </Box>

          <Box>
            <Typography
              sx={{
                color:
                  authColors.navyDeep,

                fontSize:
                  "15px",

                fontWeight:
                  800,
              }}
            >
              المدارس المسجلة
            </Typography>

            <Typography
              sx={{
                mt: 0.3,

                color:
                  authColors.muted,

                fontSize:
                  "9px",
              }}
            >
              {loading
                ? "جاري التحميل..."
                : `${filteredSchools.length} من ${schools.length} مدرسة`}
            </Typography>
          </Box>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.2}
        >
          <TextField
            size="small"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="ابحث باسم المدرسة أو البريد..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 280,
              },

              "& .MuiOutlinedInput-root":
                {
                  minHeight: 43,

                  borderRadius:
                    "12px",

                  backgroundColor:
                    authColors.cream,

                  fontSize:
                    "11px",
                },
            }}
          />

          <Select
            size="small"
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target.value
              )
            }
            sx={{
              minWidth: 145,
              minHeight: 43,

              borderRadius:
                "12px",

              backgroundColor:
                authColors.cream,

              fontSize:
                "11px",
            }}
          >
            <MenuItem value="all">
              كل الحالات
            </MenuItem>

            <MenuItem value="active">
              النشطة
            </MenuItem>

            <MenuItem value="suspended">
              الموقوفة
            </MenuItem>
          </Select>

          <Button
            onClick={
              loadSchools
            }
            startIcon={
              <RefreshRounded />
            }
            sx={{
              minHeight: 43,
              px: 1.7,

              borderRadius:
                "12px",

              color:
                authColors.navy,

              backgroundColor:
                "rgba(36,74,112,0.07)",

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
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 2,

          overflow: "hidden",

          borderRadius:
            "20px",

          backgroundColor:
            authColors.white,

          border: `1px solid ${authColors.border}`,

          boxShadow:
            "0 12px 30px rgba(36,74,112,0.055)",
        }}
      >
        {error &&
        !loading ? (
          <Box
            sx={{
              minHeight: 340,

              display: "grid",
              placeItems:
                "center",

              p: 3,

              textAlign:
                "center",
            }}
          >
            <Typography>
              {error}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              overflowX:
                "auto",
            }}
          >
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 1030,

                borderCollapse:
                  "collapse",

                "& th": {
                  px: 2,
                  py: 1.5,

                  color:
                    authColors.muted,

                  backgroundColor:
                    "rgba(36,74,112,0.035)",

                  borderBottom: `1px solid ${authColors.border}`,

                  fontSize:
                    "10px",

                  fontWeight:
                    800,

                  textAlign:
                    "right",
                },

                "& td": {
                  px: 2,
                  py: 1.55,

                  color:
                    authColors.text,

                  borderBottom:
                    "1px solid rgba(222,216,205,0.68)",

                  fontSize:
                    "11px",
                },

                "& tbody tr":
                  {
                    cursor:
                      "pointer",

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
                    البريد
                  </Box>

                  <Box component="th">
                    الجوال
                  </Box>

                  <Box component="th">
                    الحالة
                  </Box>

                  <Box component="th">
                    تاريخ التسجيل
                  </Box>

                  <Box
                    component="th"
                    sx={{
                      width: 220,

                      textAlign:
                        "center !important",
                    }}
                  >
                    الإجراءات
                  </Box>
                </Box>
              </Box>

              <Box component="tbody">
                {loading ? (
                  Array.from({
                    length: 6,
                  }).map(
                    (
                      _,
                      index
                    ) => (
                      <Box
                        component="tr"
                        key={index}
                      >
                        {Array.from(
                          {
                            length:
                              6,
                          }
                        ).map(
                          (
                            __,
                            cellIndex
                          ) => (
                            <Box
                              component="td"
                              key={
                                cellIndex
                              }
                            >
                              <Skeleton />
                            </Box>
                          )
                        )}
                      </Box>
                    )
                  )
                ) : filteredSchools.length ? (
                  filteredSchools.map(
                    (
                      school,
                      index
                    ) => {
                      const schoolId =
                        getSchoolId(
                          school
                        );

                      const active =
                        getSchoolStatus(
                          school
                        ) === "active";

                      return (
                        <Box
                          component="tr"
                          key={
                            schoolId ||
                            index
                          }
                          onClick={() =>
                            schoolId &&
                            navigate(
                              `/platform/schools/${schoolId}`
                            )
                          }
                        >
                          <Box component="td">
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,

                                  display:
                                    "grid",

                                  placeItems:
                                    "center",

                                  borderRadius:
                                    "11px",

                                  color:
                                    authColors.goldDark,

                                  backgroundColor:
                                    authColors.goldSoft,
                                }}
                              >
                                <ApartmentRounded />
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    color:
                                      authColors.navyDeep,

                                    fontSize:
                                      "11px",

                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {getSchoolName(
                                    school
                                  )}
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: 0.2,

                                    color:
                                      authColors.muted,

                                    fontSize:
                                      "8px",
                                  }}
                                >
                                  {school?.slug ||
                                    "—"}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>

                          <Box component="td">
                            {getSchoolEmail(
                              school
                            )}
                          </Box>

                          <Box component="td">
                            {getSchoolPhone(
                              school
                            )}
                          </Box>

                          <Box component="td">
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.45,

                                display:
                                  "inline-flex",

                                alignItems:
                                  "center",

                                gap: 0.45,

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
                                  "9px",

                                fontWeight:
                                  800,
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
                          </Box>

                          <Box component="td">
                            {formatSchoolDate(
                              school
                            )}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              width: 220,

                              minWidth:
                                220,

                              px:
                                "18px !important",

                              textAlign:
                                "center !important",
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="center"
                              sx={{
                                gap: 1.35,
                              }}
                            >
                              <Button
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  openEditDialog(
                                    school
                                  );
                                }}
                                startIcon={
                                  <EditRounded />
                                }
                                sx={{
                                  minWidth:
                                    88,

                                  minHeight:
                                    36,

                                  borderRadius:
                                    "10px",

                                  color:
                                    authColors.navy,

                                  backgroundColor:
                                    "rgba(36,74,112,0.08)",

                                  fontSize:
                                    "9px",

                                  fontWeight:
                                    800,

                                  textTransform:
                                    "none",
                                }}
                              >
                                تعديل
                              </Button>

                              <Button
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  openStatusDialog(
                                    school
                                  );
                                }}
                                sx={{
                                  minWidth:
                                    88,

                                  minHeight:
                                    36,

                                  borderRadius:
                                    "10px",

                                  color: active
                                    ? authColors.danger
                                    : "#29734A",

                                  backgroundColor:
                                    active
                                      ? "rgba(201,79,79,0.08)"
                                      : "rgba(116,201,154,0.14)",

                                  fontSize:
                                    "9px",

                                  fontWeight:
                                    800,

                                  textTransform:
                                    "none",
                                }}
                              >
                                {active
                                  ? "إيقاف"
                                  : "تفعيل"}
                              </Button>
                            </Stack>
                          </Box>
                        </Box>
                      );
                    }
                  )
                ) : (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={6}
                      sx={{
                        py:
                          "70px !important",

                        textAlign:
                          "center !important",
                      }}
                    >
                      لا توجد مدارس مطابقة
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <SchoolEditDialog
        open={
          editDialogOpen
        }
        schoolName={
          getSchoolName(
            selectedSchool
          )
        }
        schoolPhone={
          getSchoolPhone(
            selectedSchool
          )
        }
        loading={
          editLoading
        }
        onClose={() => {
          setEditDialogOpen(
            false
          );

          setSelectedSchool(
            null
          );
        }}
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
            selectedSchool
          )
        }
        action={
          getSchoolStatus(
            selectedSchool
          ) === "active"
            ? "suspend"
            : "activate"
        }
        loading={
          statusLoading
        }
        onClose={() => {
          setStatusDialogOpen(
            false
          );

          setSelectedSchool(
            null
          );
        }}
        onConfirm={
          handleStatusConfirm
        }
      />
    </Box>
  );
};

export default PlatformSchools;
