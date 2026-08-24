import {
  Box,
  Button,
  Dialog,
  DialogContent,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  DirectionsBusRounded,
  GroupsRounded,
  PaymentsRounded,
  SchoolRounded,
  SearchOffRounded,
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

import ClassFilter from "@/components/Filters/ClassFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
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

import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";
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

  const {
    installmentPlans = [],
  } = useInstallmentPlans();

  const {
    academicYears = [],
    loadingAcademicYears,
  } = useAcademicYears();

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

  const plans =
    useMemo(
      () =>
        arr(
          installmentPlans
        ).map(
          (plan) => ({
            ...plan,

            displayName:
              `${plan.name} (${plan.numberOfInstallments} قسط)` +
              `${
                plan.isDefault
                  ? " - افتراضية"
                  : ""
              }`,
          })
        ),
      [installmentPlans]
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
      const response =
        await enrollBus(
          data.studentId,
          {
            fee: Number(
              data.fee
            ),

            serviceType:
              data.serviceType,

            installmentPlanId:
              data.installmentPlanId ||
              undefined,
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

  const action =
    permissions?.edit ? (
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
        }}
      >
        إضافة طالب لخدمة الباص
      </Button>
    ) : null;

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
                  permissions?.edit
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
          plans={plans}
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
  plans,
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
        fee: "",
        serviceType:
          "both",
        installmentPlanId:
          "",
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
        title="إضافة طالب إلى خدمة الباص"
        description="حدّد الطالب والرسوم ونوع الخدمة وخطة التقسيط."
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

          <Input
            register={
              register
            }
            registerName="fee"
            error={
              errors.fee
                ?.message
            }
            label="رسوم الباص"
            required
            type="number"
            valueAsNumber
          />

          <Select
            register={
              register
            }
            registerName="serviceType"
            data={[
              {
                _id: "pickup",
                displayName:
                  "ذهاب فقط",
              },
              {
                _id: "dropoff",
                displayName:
                  "عودة فقط",
              },
              {
                _id: "both",
                displayName:
                  "ذهاب وعودة",
              },
            ]}
            name="displayName"
            label="نوع الخدمة"
            required
          />

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
              registerName="installmentPlanId"
              data={plans}
              name="displayName"
              label="خطة التقسيط"
              defaultSelect="كاش بدون تقسيط"
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
              label="إضافة الطالب"
              disabled={
                !candidates.length
              }
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BusListPage;
