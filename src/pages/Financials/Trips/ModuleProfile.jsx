import {
  AddCircleOutlineOutlined,
  GroupsRounded,
  LuggageRounded,
  PaymentsRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import {
  enrollStudentInTripTemplate,
  fetchTripTemplate,
  fetchTripTemplateCandidates,
  fetchTripTemplateStudents,
  removeStudentFromTripTemplate,
} from "@/APIs/financials/trips";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import SearchFilter from "@/components/Filters/SearchFilter";
import Loading from "@/components/Loading";
import PaginationControls from "@/components/Pagination";
import Select from "@/components/Select/Select";

import { translateGender } from "@/utils/helpers/translateGender";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const cardSx = {
  border: "1px solid rgba(36,74,112,.08)",
  borderRadius: "18px",
  bgcolor: "rgba(255,255,255,.96)",
  boxShadow: "0 8px 22px rgba(18,47,77,.05)",
};

const StatItem = ({
  label,
  value,
  icon,
}) => (
  <Paper
    elevation={0}
    sx={{
      ...cardSx,
      p: 1.4,
      display: "flex",
      alignItems: "center",
      gap: 1.1,
      minHeight: 84,
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        bgcolor: "var(--color-gold-soft)",
        border: "1px solid rgba(211,164,79,.20)",
        borderRadius: "13px",
        "& svg": { fontSize: 22 },
      }}
    >
      {icon}
    </Box>

    <Box minWidth={0}>
      <Typography
        sx={{
          color: "var(--color-muted)",
          fontSize: 9.5,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.2,
          color: "var(--color-navy-deep)",
          fontSize: 17,
          fontWeight: 900,
          lineHeight: 1.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const ModuleTripsProfilePage = () => {
  const { tripTemplateId } = useParams();
  const navigate = useNavigate();
  const { installmentPlans } =
    useInstallmentPlans();

  const [template, setTemplate] =
    useState(null);
  const [students, setStudents] =
    useState([]);
  const [candidates, setCandidates] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);
  const [openAdd, setOpenAdd] =
    useState(false);
  const [page, setPage] =
    useState(1);
  const [limit, setLimit] =
    useState(10);
  const [
    pagination,
    setPagination,
  ] = useState(null);
  const [
    searchName,
    setSearchName,
  ] = useState("");

  const filters = useMemo(
    () => ({ page, limit }),
    [page, limit]
  );

  const candidateFilters =
    useMemo(
      () => ({ limit: 500 }),
      []
    );

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const fetchData = async () => {
    if (!tripTemplateId) return;

    setLoading(true);

    const [
      templateRes,
      studentsRes,
      candidatesRes,
    ] = await Promise.all([
      fetchTripTemplate(
        tripTemplateId
      ),
      fetchTripTemplateStudents(
        tripTemplateId,
        filters
      ),
      fetchTripTemplateCandidates(
        tripTemplateId,
        candidateFilters
      ),
    ]);

    if (templateRes.status) {
      setTemplate(
        templateRes.data || null
      );
    } else {
      toast.error(
        templateRes ||
          "حدث خطأ ما أثناء جلب بيانات الرحلة"
      );
      setTemplate(null);
    }

    if (studentsRes.status) {
      setStudents(
        studentsRes.data || []
      );

      setPagination(
        studentsRes.totalDocs !==
          undefined &&
          studentsRes.totalPages !==
            undefined
          ? {
              totalDocs:
                studentsRes.totalDocs,
              totalPages:
                studentsRes.totalPages,
            }
          : null
      );
    } else {
      toast.error(
        studentsRes ||
          "حدث خطأ ما أثناء جلب طلاب الرحلة"
      );
      setStudents([]);
      setPagination(null);
    }

    if (candidatesRes.status) {
      setCandidates(
        candidatesRes.data || []
      );
    } else {
      toast.error(
        candidatesRes ||
          "حدث خطأ ما أثناء جلب الطلاب المتاحين"
      );
      setCandidates([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tripTemplateId,
    filters,
    candidateFilters,
  ]);

  const planOptions = (
    installmentPlans || []
  ).map((plan) => ({
    ...plan,
    displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${
      plan.isDefault
        ? " - افتراضية"
        : ""
    }`,
  }));

  const candidateOptions = (
    candidates || []
  )
    .map((item) => {
      const student =
        item?.student || {};
      const cls = item?.class || {};

      const classLabel =
        cls?.roomNumber
          ? `${cls.roomNumber} - ${translateGender(
              cls.gender,
              "class"
            )}`
          : "بدون فصل";

      return {
        _id: student?._id,
        displayName: `${
          student?.name || "طالب"
        } (${classLabel})`,
      };
    })
    .filter((item) => item._id);

  const displayedStudents =
    useMemo(() => {
      const query =
        searchName
          .trim()
          .toLowerCase();

      if (!query) return students;

      return (
        students || []
      ).filter((item) => {
        const studentName =
          item?.student?.name || "";

        return studentName
          .toLowerCase()
          .includes(query);
      });
    }, [students, searchName]);

  const handleRemove =
    async (studentId) => {
      if (
        !tripTemplateId ||
        !studentId
      ) {
        return;
      }

      setActionLoading(true);

      const response =
        await removeStudentFromTripTemplate(
          tripTemplateId,
          studentId
        );

      if (response.status) {
        toast.success(
          response.message ||
            "تم إزالة الطالب من الرحلة بنجاح"
        );
        await fetchData();
      } else {
        toast.error(
          response ||
            "حدث خطأ ما أثناء إزالة الطالب من الرحلة"
        );
      }

      setActionLoading(false);
    };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (!template) {
    return (
      <Container>
        <Back title="تفاصيل الرحلة" />
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mt: 1.25,
            p: 2,
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontWeight: 700,
            }}
          >
            لا توجد بيانات لهذه الرحلة
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <Back title="تفاصيل الرحلة" />

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mt: 1.1,
            mb: 1.15,
            p: {
              xs: 1.5,
              md: 1.8,
            },
            background:
              "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))",
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
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color:
                    "var(--color-gold-dark)",
                  bgcolor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,.22)",
                  borderRadius:
                    "14px",
                }}
              >
                <LuggageRounded />
              </Box>

              <Box minWidth={0}>
                <Typography
                  component="h1"
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: {
                      xs: 20,
                      md: 24,
                    },
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  {template?.name ||
                    "—"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color:
                      "var(--color-muted)",
                    fontSize: 10,
                  }}
                >
                  {template?.description ||
                    "—"}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label={`المعرّف: ${
                template?._id ||
                "—"
              }`}
              sx={{
                alignSelf: {
                  xs: "flex-start",
                  sm: "center",
                },
                maxWidth: "100%",
                color:
                  "var(--color-navy)",
                bgcolor:
                  "rgba(36,74,112,.055)",
                border:
                  "1px solid rgba(36,74,112,.09)",
                fontWeight: 800,
                fontSize: 9,
              }}
            />
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.15,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <StatItem
            label="رسوم الرحلة"
            value={`${Number(
              template?.fee || 0
            )} ريال`}
            icon={<PaymentsRounded />}
          />

          <StatItem
            label="عدد الطلاب المشتركين"
            value={String(
              template?.enrolledCount ||
                0
            )}
            icon={<GroupsRounded />}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mb: 1.15,
            p: 1.1,
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
          >
            <Box
              sx={{
                width: {
                  xs: "100%",
                  sm: 420,
                },
                maxWidth: "100%",
              }}
            >
              <SearchFilter
                value={searchName}
                onChange={
                  setSearchName
                }
                placeholder="ابحث باسم الطالب"
              />
            </Box>

            <Button
              startIcon={
                <AddCircleOutlineOutlined />
              }
              variant="contained"
              onClick={() =>
                setOpenAdd(true)
              }
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius:
                  "11px",
                fontSize: 11,
                fontWeight: 900,
                whiteSpace:
                  "nowrap",
              }}
            >
              إضافة طالب إلى الرحلة
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: {
              xs: 1.15,
              md: 1.4,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                طلاب الرحلة
              </Typography>

              <Typography
                sx={{
                  mt: 0.1,
                  color:
                    "var(--color-muted)",
                  fontSize: 9.5,
                }}
              >
                إدارة الطلاب المسجلين
                ومتابعة حالة السداد.
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${displayedStudents.length} طالب`}
              sx={{
                bgcolor:
                  "var(--color-gold-soft)",
                color:
                  "var(--color-gold-dark)",
                fontWeight: 900,
                fontSize: 9,
              }}
            />
          </Stack>

          {displayedStudents.length ===
          0 ? (
            <Box
              sx={{
                py: 5,
                textAlign: "center",
                border:
                  "1px dashed rgba(36,74,112,.14)",
                borderRadius:
                  "14px",
                bgcolor:
                  "rgba(36,74,112,.02)",
              }}
            >
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                لا يوجد طلاب مطابقين
                لبحث الاسم
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 820,
                  borderCollapse:
                    "separate",
                  borderSpacing:
                    "0 7px",

                  "& th": {
                    px: 1.2,
                    py: 1.1,
                    bgcolor:
                      "rgba(36,74,112,.045)",
                    color:
                      "var(--color-navy)",
                    fontSize: 9.5,
                    fontWeight: 900,
                    textAlign:
                      "right",
                  },

                  "& td": {
                    px: 1.2,
                    py: 1.05,
                    bgcolor:
                      "rgba(255,255,255,.98)",
                    borderTop:
                      "1px solid rgba(36,74,112,.08)",
                    borderBottom:
                      "1px solid rgba(36,74,112,.08)",
                    color:
                      "var(--color-navy-deep)",
                    fontSize: 10.5,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>الفصل</th>
                    <th>الحالة</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedStudents.map(
                    (item) => {
                      const student =
                        item?.student ||
                        {};
                      const cls =
                        item?.class || {};
                      const trip =
                        item?.trip || {};

                      const effectiveFee =
                        Number(
                          trip?.discount
                            ? trip?.netFee
                            : trip?.fee ||
                                0
                        );

                      const totalPaid =
                        Number(
                          trip?.totalPaid ||
                            0
                        );

                      const remaining =
                        Math.max(
                          effectiveFee -
                            totalPaid,
                          0
                        );

                      return (
                        <tr
                          key={
                            student?._id
                          }
                        >
                          <td
                            style={{
                              fontWeight:
                                800,
                            }}
                          >
                            {student?.name ||
                              "—"}
                          </td>

                          <td>
                            {cls?.roomNumber
                              ? `${cls.roomNumber} - ${translateGender(
                                  cls?.gender,
                                  "class"
                                )}`
                              : "—"}
                          </td>

                          <td>
                            <Chip
                              size="small"
                              label={
                                statusMap[
                                  trip
                                    ?.status
                                ] ||
                                "غير مدفوعة"
                              }
                              sx={{
                                height: 24,
                                fontSize:
                                  9,
                                fontWeight:
                                  900,
                                bgcolor:
                                  trip?.status ===
                                  "paid"
                                    ? "#E7F8F1"
                                    : trip?.status ===
                                        "partial"
                                      ? "#EEF5FF"
                                      : "#FDECEC",
                                color:
                                  trip?.status ===
                                  "paid"
                                    ? "#0E9F6E"
                                    : trip?.status ===
                                        "partial"
                                      ? "#1D4ED8"
                                      : "#D14343",
                              }}
                            />
                          </td>

                          <td>
                            {totalPaid} ريال
                          </td>

                          <td>
                            {remaining} ريال
                          </td>

                          <td>
                            <Stack
                              direction="row"
                              spacing={0.7}
                            >
                              <Button
                                variant="contained"
                                onClick={() =>
                                  navigate(
                                    `/financial/records/${student?._id}/trips/${trip?._id}`
                                  )
                                }
                                sx={{
                                  minHeight: 34,
                                  px: 1.6,
                                  borderRadius:
                                    "9px",
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                }}
                              >
                                التفاصيل
                              </Button>

                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() =>
                                  handleRemove(
                                    student?._id
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                sx={{
                                  minHeight: 34,
                                  px: 1.6,
                                  borderRadius:
                                    "9px",
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                }}
                              >
                                إزالة
                              </Button>
                            </Stack>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>

        {pagination && (
          <Box sx={{ mt: 1 }}>
            <PaginationControls
              pagination={
                pagination
              }
              page={page}
              onPageChange={
                setPage
              }
              limit={limit}
              onLimitChange={
                setLimit
              }
              label="عدد الطلاب"
            />
          </Box>
        )}

        <EnrollDialog
          open={openAdd}
          onClose={() =>
            setOpenAdd(false)
          }
          tripTemplateId={
            tripTemplateId
          }
          onDone={async () => {
            setOpenAdd(false);
            await fetchData();
          }}
          loading={actionLoading}
          setActionLoading={
            setActionLoading
          }
          candidateOptions={
            candidateOptions
          }
          planOptions={
            planOptions
          }
        />
      </Box>
    </Container>
  );
};

const EnrollDialog = ({
  open,
  onClose,
  tripTemplateId,
  onDone,
  loading,
  setActionLoading,
  candidateOptions,
  planOptions,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      studentId: "",
      installmentPlanId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        studentId: "",
        installmentPlanId: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (
    formData
  ) => {
    if (!tripTemplateId) return;

    setActionLoading(true);

    const response =
      await enrollStudentInTripTemplate(
        tripTemplateId,
        {
          studentId:
            formData.studentId,
          installmentPlanId:
            formData.installmentPlanId ||
            undefined,
        }
      );

    if (response.status) {
      toast.success(
        response.message ||
          "تم إضافة الطالب إلى الرحلة بنجاح"
      );

      await onDone();
    } else {
      toast.error(
        response ||
          "حدث خطأ ما أثناء إضافة الطالب إلى الرحلة"
      );
    }

    setActionLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: "20px",
          bgcolor:
            "var(--color-cream)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.2,
          pt: 2,
          pb: 1,
          color:
            "var(--color-navy-deep)",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        إضافة طالب إلى الرحلة
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.2,
          pt: "8px !important",
          pb: 1.5,
        }}
      >
        <Grid
          container
          spacing={1.25}
        >
          <Grid
            item
            xs={12}
            sm={6}
          >
            <Select
              register={register}
              registerName="studentId"
              data={
                candidateOptions
              }
              name="displayName"
              error={
                errors.studentId
                  ?.message
              }
              label="الطالب"
              required
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
          >
            <Select
              register={register}
              registerName="installmentPlanId"
              data={planOptions}
              name="displayName"
              error={
                errors
                  .installmentPlanId
                  ?.message
              }
              label="خطة التقسيط"
              defaultSelect="كاش بدون تقسيط"
            />
          </Grid>

          {candidateOptions.length ===
            0 && (
            <Grid item xs={12}>
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 10,
                }}
              >
                لا يوجد طلاب متاحون
                للإضافة حالياً.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.2,
          pb: 2,
          pt: 1,
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            minHeight: 38,
            borderRadius: "10px",
            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(
            onSubmit
          )}
          disabled={
            loading ||
            candidateOptions.length ===
              0
          }
          sx={{
            minHeight: 38,
            px: 2.5,
            borderRadius: "10px",
            fontWeight: 900,
          }}
        >
          إضافة الطالب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModuleTripsProfilePage;
