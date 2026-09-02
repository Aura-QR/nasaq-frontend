import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  DirectionsBusRounded,
  GroupsRounded,
  PaymentsRounded,
  SchoolRounded,
  SearchOffRounded,
  SettingsRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import {
  enrollBus,
  unenrollBus,
} from "@/APIs/financials/bus";

import {
  fetchBusPlans,
} from "@/APIs/financials/busPlans";

import ClassFilter from "@/components/Filters/ClassFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import Select from "@/components/Select/Select";
import Table from "@/components/Table/Table";

import {
  DialogHeader,
  EmptyState,
  FilterCard,
  FinancialHeader,
  FormActions,
  SectionCard,
  StatCard,
  StatsGrid,
  formFieldsSx,
} from "@/components/financial/FinancialShell";

import { translateGender } from "@/utils/helpers/translateGender";

import {
  formatMoney,
  getErrorMessage,
  mapBusServiceType,
  mapFeeStatus,
} from "@/utils/financial/financialUtils";

import {
  useBusCandidates,
  useBusList,
} from "@/utils/hooks/apis/financials/useBus";
import { useAcademicYears } from "@/utils/hooks/apis/useAcademicYears";
import usePermissions from "@/utils/hooks/usePermissions";

const headers = [
  "اسم الطالب",
  "السنة الدراسية",
  "الفصل",
  "خطة الباص",
  "نوع الخدمة",
  "حالة الباص",
  "إجمالي الرسوم",
  "المدفوع",
  "المتبقي",
];

const body = [
  "studentName",
  "academicYear",
  "className",
  "planName",
  "serviceType",
  "status",
  "fee",
  "totalPaid",
  "remaining",
];

const arr = (value) =>
  Array.isArray(value) ? value : [];

const normalizeEntityId = (value) => {
  if (!value) return "";

  if (
    typeof value === "object"
  ) {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const getAcademicYearLabel = (
  value,
  academicYears = []
) => {
  if (!value) return "—";

  if (
    typeof value === "object"
  ) {
    return (
      value?.name ||
      value?.label ||
      value?.title ||
      "—"
    );
  }

  const rawValue =
    String(value).trim();

  if (!rawValue) {
    return "—";
  }

  const matchedYear =
    academicYears.find(
      (year) =>
        normalizeEntityId(year) ===
        rawValue
    );

  if (matchedYear) {
    return (
      matchedYear?.name ||
      matchedYear?.label ||
      matchedYear?.title ||
      "—"
    );
  }

  const looksLikeMongoId =
    /^[a-f\d]{24}$/i.test(
      rawValue
    );

  return looksLikeMongoId
    ? "—"
    : rawValue;
};

const mapRow = (
  item,
  academicYears = []
) => {
  const student =
    item?.student || {};

  const cls =
    item?.class || {};

  const bus =
    item?.bus || {};

  const fee = Number(
    bus?.discount
      ? bus?.netFee
      : bus?.fee || 0
  );

  const paid = Number(
    bus?.totalPaid || 0
  );

  const remaining =
    Math.max(
      fee - paid,
      0
    );

  return {
    id:
      student?._id ||
      student?.id,

    studentName:
      student?.name ||
      [
        student?.firstName,
        student?.fatherName,
        student?.familyName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "—",

    academicYear:
      getAcademicYearLabel(
        item?.academicYear ||
          item?.academicYearId ||
          cls?.academicYear ||
          cls?.academicYearId ||
          student?.academicYear ||
          student?.academicYearId ||
          student?.class?.academicYear ||
          student?.class?.academicYearId ||
          student?.classId?.academicYear ||
          student?.classId?.academicYearId,
        academicYears
      ),

    className:
      cls?.roomNumber ||
      cls?.name
        ? `${
            cls?.roomNumber ||
            cls?.name
          } - ${translateGender(
            cls?.gender,
            "class"
          )}`
        : "—",

    planName:
      bus?.planName ||
      bus?.busPlanId?.name ||
      (
        bus?.busPlanId
          ? "خطة باص"
          : "غير مرتبطة بخطة"
      ),

    serviceType:
      mapBusServiceType(
        bus?.serviceType
      ),

    status:
      mapFeeStatus(
        bus?.status
      ),

    fee:
      formatMoney(fee),

    totalPaid:
      formatMoney(paid),

    remaining:
      formatMoney(
        remaining
      ),

    remainingRaw:
      remaining,
  };
};

const BusListPage = () => {
  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(10);

  /*
   * yearId is the AcademicYear Mongo ID used by ClassFilter.
   * The Bus endpoints still expect academicYear as the year name string.
   */
  const [
    yearId,
    setYearId,
  ] = useState("");

  const [
    classId,
    setClassId,
  ] = useState("");

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const permissions =
    usePermissions(
      "financial"
    );

  const [
    busPlans,
    setBusPlans,
  ] = useState([]);

  const [
    loadingBusPlans,
    setLoadingBusPlans,
  ] = useState(true);

  const {
    academicYears = [],
    loadingAcademicYears,
  } = useAcademicYears();

  useEffect(() => {
    let mounted = true;

    const loadBusPlans = async () => {
      setLoadingBusPlans(true);

      try {
        const response =
          await fetchBusPlans();

        if (!mounted) {
          return;
        }

        if (
          response?.status === false
        ) {
          setBusPlans([]);

          toast.error(
            getErrorMessage(
              response,
              "تعذر تحميل خطط الباص"
            ),
            {
              toastId:
                "bus-plans-load",
            }
          );

          return;
        }

        const payload =
          response?.data ??
          response;

        const list =
          Array.isArray(payload)
            ? payload
            : Array.isArray(
                payload?.data
              )
            ? payload.data
            : [];

        setBusPlans(
          list.filter(
            (plan) =>
              plan?.isActive !==
              false
          )
        );
      } finally {
        if (mounted) {
          setLoadingBusPlans(
            false
          );
        }
      }
    };

    loadBusPlans();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedYearName =
    useMemo(
      () =>
        academicYears.find(
          (year) =>
            normalizeEntityId(
              year
            ) ===
            normalizeEntityId(
              yearId
            )
        )?.name || "",
      [
        academicYears,
        yearId,
      ]
    );

  const academicYearOptions =
    useMemo(
      () =>
        academicYears.map(
          (year) => ({
            value:
              normalizeEntityId(
                year
              ),
            label:
              year.status ===
              "active"
                ? `${year.name} - الحالية`
                : year.name,
          })
        ),
      [academicYears]
    );

  /*
   * Bus API uses academicYear as a string.
   */
  const filters =
    useMemo(
      () => ({
        academicYear:
          selectedYearName ||
          undefined,

        classId:
          classId ||
          undefined,

        page,
        limit,
      }),
      [
        selectedYearName,
        classId,
        page,
        limit,
      ]
    );

  const candidateFilters =
    useMemo(
      () => ({
        academicYear:
          selectedYearName ||
          undefined,

        classId:
          classId ||
          undefined,

        limit: 500,
      }),
      [
        selectedYearName,
        classId,
      ]
    );

  const {
    busRecords,
    loading,
    pagination,
    refetch,
  } = useBusList(
    filters
  );

  const {
    candidates,
    refetch:
      refetchCandidates,
  } = useBusCandidates(
    candidateFilters
  );

  useEffect(() => {
    setClassId("");
  }, [yearId]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    yearId,
    classId,
  ]);

  const rows =
    useMemo(
      () =>
        arr(busRecords).map(
          (item) =>
            mapRow(
              item,
              academicYears
            )
        ),
      [
        busRecords,
        academicYears,
      ]
    );

  const remaining =
    rows.reduce(
      (sum, item) =>
        sum +
        item.remainingRaw,
      0
    );

  const paidCount =
    rows.filter(
      (item) =>
        item.remainingRaw === 0
    ).length;

  const busPlanOptions =
    useMemo(
      () =>
        arr(
          busPlans
        )
          .filter(
            (plan) =>
              plan?.isActive !==
              false
          )
          .map((plan) => {
            const id =
              plan?._id ||
              plan?.id;

            const serviceLabel =
              mapBusServiceType(
                plan?.serviceType
              );

            const installmentLabel =
              plan?.installmentPlanId
                ? (
                    typeof plan
                      .installmentPlanId ===
                    "object"
                      ? plan
                          .installmentPlanId
                          ?.name ||
                        "تقسيط"
                      : "تقسيط"
                  )
                : "دفعة واحدة";

            return {
              ...plan,
              _id: id,
              displayName:
                `${plan?.name || "خطة باص"} — ${serviceLabel} — ${formatMoney(
                  plan?.fee
                )} — ${installmentLabel}`,
            };
          })
          .filter(
            (plan) =>
              plan?._id
          ),
      [busPlans]
    );

  const candidateOptions =
    useMemo(
      () =>
        arr(
          candidates
        )
          .map((item) => {
            const student =
              item?.student ||
              {};

            const cls =
              item?.class ||
              {};

            const className =
              cls?.roomNumber ||
              cls?.name;

            const classLabel =
              className
                ? `${className} - ${translateGender(
                    cls?.gender,
                    "class"
                  )}`
                : "بدون فصل";

            return {
              _id:
                student?._id ||
                student?.id,

              displayName:
                `${
                  student?.name ||
                  [
                    student?.firstName,
                    student?.fatherName,
                    student?.familyName,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  "طالب"
                } (${classLabel})`,
            };
          })
          .filter(
            (item) =>
              item._id
          ),
      [candidates]
    );

  const refresh = () =>
    Promise.all([
      refetch(),
      refetchCandidates(),
    ]);

  const unenroll = async (
    id,
    setActive
  ) => {
    setActionLoading(true);

    try {
      const response =
        await unenrollBus(
          id
        );

      if (response?.status) {
        toast.success(
          response.message ||
            "تم إلغاء التسجيل من الباص"
        );

        setActive(false);

        await refresh();
      } else {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء إلغاء التسجيل"
          )
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const enroll = async (
    data
  ) => {
    setActionLoading(true);

    try {
      /*
       * "بدون باص" = لا يوجد تسجيل ولا API call.
       */
      if (!data?.busPlanId) {
        setOpen(false);

        toast.info(
          "تم الإبقاء على الطالب بدون خدمة باص"
        );

        return;
      }

      const response =
        await enrollBus(
          data.studentId,
          {
            busPlanId:
              data.busPlanId,
          }
        );

      if (response?.status) {
        toast.success(
          response.message ||
            "تم تسجيل الطالب في خدمة الباص"
        );

        setOpen(false);

        await refresh();
      } else {
        toast.error(
          getErrorMessage(
            response,
            "حدث خطأ أثناء التسجيل"
          )
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const reset = () => {
    setYearId("");
    setClassId("");
    setPage(1);
  };

  const active =
    Boolean(
      yearId ||
      classId
    );

  const action = (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      gap={1}
      sx={{
        width: {
          xs: "100%",
          sm: "auto",
        },
      }}
    >
      {permissions?.read && (
        <Button
          type="button"
          href="/financial/bus-plans"
          variant="outlined"
          startIcon={
            <SettingsRounded />
          }
          sx={{
            minHeight: 42,
            borderRadius:
              "12px",
            color:
              "var(--color-navy)",
            borderColor:
              "rgba(36,74,112,.18)",
            fontWeight: 800,
            textTransform:
              "none",
          }}
        >
          خطط الباص
        </Button>
      )}

      {permissions?.add && (
        <Button
          onClick={() =>
            setOpen(true)
          }
          variant="contained"
          startIcon={
            <AddCircleOutlineRounded />
          }
          sx={{
            minHeight: 42,
            borderRadius:
              "12px",
            background:
              "linear-gradient(135deg,var(--color-navy-light),var(--color-navy-dark))",
            fontWeight: 800,
            textTransform:
              "none",
          }}
        >
          تحديد خطة باص لطالب
        </Button>
      )}
    </Stack>
  );

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <FinancialHeader
          title="إدارة خدمة الباص"
          description="سجّل الطلاب في خدمة الباص وتابع الرسوم والأقساط."
          count={
            pagination
              ?.totalDocs ??
            rows.length
          }
          actions={action}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي المشتركين"
            value={
              pagination
                ?.totalDocs ??
              rows.length
            }
            icon={
              <GroupsRounded />
            }
          />

          <StatCard
            label="الظاهر في الصفحة"
            value={
              rows.length
            }
            icon={
              <VisibilityRounded />
            }
          />

          <StatCard
            label="مكتملو السداد"
            value={
              paidCount
            }
            icon={
              <PaymentsRounded />
            }
          />

          <StatCard
            label="المتبقي في الصفحة"
            value={formatMoney(
              remaining
            )}
            icon={
              <DirectionsBusRounded />
            }
          />
        </StatsGrid>

        <FilterCard
          title="تصفية الطلاب"
          description="حدّد السنة الدراسية والفصل."
          active={active}
          onReset={reset}
          columns="repeat(2,minmax(0,1fr))"
        >
          <SelectFilter
            value={
              yearId
            }
            onChange={
              setYearId
            }
            label="السنة الدراسية"
            icon={
              SchoolRounded
            }
            allLabel="كل السنوات"
            disabled={
              loadingAcademicYears
            }
            options={
              academicYearOptions
            }
          />

          <ClassFilter
            classId={
              classId
            }
            setClassId={
              setClassId
            }
            academicYear={
              yearId
            }
          />
        </FilterCard>

        <SectionCard
          title="الطلاب المشتركون"
          description="افتح ملف الطالب لمراجعة الأقساط أو تسجيل دفعة."
        >
          {!loading &&
          !actionLoading &&
          rows.length === 0 ? (
            <EmptyState
              icon={
                active ? (
                  <SearchOffRounded />
                ) : (
                  <DirectionsBusRounded />
                )
              }
              title={
                active
                  ? "لا توجد بيانات مطابقة للفلاتر"
                  : "لا توجد بيانات باص حتى الآن"
              }
              description={
                active
                  ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                  : "أضف أول طالب إلى خدمة الباص."
              }
              actionLabel={
                active
                  ? "مسح الفلاتر"
                  : undefined
              }
              onAction={
                active
                  ? reset
                  : undefined
              }
            />
          ) : (
            <Box
              sx={{ p: 1 }}
            >
              <Table
                headers={
                  headers
                }
                data={
                  rows
                }
                loading={
                  loading ||
                  actionLoading
                }
                profile={
                  permissions?.read
                }
                deleteFn={
                  permissions?.delete
                    ? unenroll
                    : undefined
                }
                body={body}
              />

              {pagination &&
                rows.length >
                  0 && (
                  <PaginationControls
                    pagination={
                      pagination
                    }
                    page={
                      page
                    }
                    onPageChange={
                      setPage
                    }
                    limit={
                      limit
                    }
                    onLimitChange={
                      setLimit
                    }
                    label="عدد الطلاب"
                  />
                )}
            </Box>
          )}
        </SectionCard>

        <EnrollDialog
          open={open}
          onClose={() =>
            setOpen(false)
          }
          onSubmit={
            enroll
          }
          loading={
            actionLoading
          }
          candidates={
            candidateOptions
          }
          busPlans={
            busPlanOptions
          }
          loadingBusPlans={
            loadingBusPlans
          }
        />
      </Box>
    </Container>
  );
};

const EnrollDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
  candidates,
  busPlans,
  loadingBusPlans,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } = useForm();

  useEffect(() => {
    if (open) {
      reset({
        studentId: "",
        busPlanId: "",
      });
    }
  }, [
    open,
    reset,
  ]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          overflow:
            "hidden",
          borderRadius:
            "20px",
          bgcolor:
            "var(--color-cream)",
        },
      }}
    >
      <DialogHeader
        icon={
          <DirectionsBusRounded />
        }
        title="تحديد خطة الباص للطالب"
        description="اختر الطالب ثم اختر خطة باص جاهزة. بدون باص لا يرسل أي طلب للسيرفر."
        loading={loading}
        onClose={
          onClose
        }
      />

      <DialogContent
        sx={{
          ...formFieldsSx,
          p: 2,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(
            onSubmit
          )}
          sx={{
            display:
              "grid",
            gridTemplateColumns:
              {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
              },
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              gridColumn: {
                sm: "1/-1",
              },
            }}
          >
            <Select
              register={
                register
              }
              registerName="studentId"
              data={
                candidates
              }
              name="displayName"
              error={
                errors
                  .studentId
                  ?.message
              }
              label="الطالب"
              required
            />
          </Box>

          <Box
            sx={{
              gridColumn: {
                sm: "1/-1",
              },
            }}
          >
            <Select
              register={
                register
              }
              registerName="busPlanId"
              data={
                busPlans
              }
              name="displayName"
              label="خطة الباص"
              defaultSelect="بدون باص"
              disabled={
                loadingBusPlans
              }
            />
          </Box>

          <Box
            sx={{
              gridColumn: {
                sm: "1/-1",
              },
            }}
          >
            <FormActions
              loading={
                loading
              }
              onCancel={
                onClose
              }
              label="حفظ اختيار الباص"
              disabled={
                !candidates.length ||
                loadingBusPlans
              }
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BusListPage;
