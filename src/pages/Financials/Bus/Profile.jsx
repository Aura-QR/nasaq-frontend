import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
  DirectionsBusRounded,
  EventSeatRounded,
  GroupsRounded,
  MailOutlineRounded,
  PaymentsRounded,
  PersonRounded,
  ReceiptLongRounded,
  RemoveCircleOutlineRounded,
  SchoolRounded,
  SwapHorizRounded,
  UndoRounded,
} from "@mui/icons-material";

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
  payBusInstallment,
  refundBusInstallment,
  unenrollBus,
} from "@/APIs/financials/bus";

import {
  applyDiscountToBus,
  removeDiscountFromBus,
} from "@/APIs/financials/discounts";

import {
  fetchBusPlans,
  switchBusPlan,
} from "@/APIs/financials/busPlans";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";

import {
  DialogHeader,
  EmptyState,
  FormActions,
  SectionCard,
  StatCard,
  StatsGrid,
  formFieldsSx,
  pageCardSx,
} from "@/components/financial/FinancialShell";

import { useBus } from "@/utils/hooks/apis/financials/useBus";
import { useDiscounts } from "@/utils/hooks/apis/financials/useDiscounts";
import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";

import { translateGender } from "@/utils/helpers/translateGender";

import {
  formatDate,
  formatMoney,
  getErrorMessage,
  mapBusServiceType,
  mapFeeStatus,
  mapInstallmentStatus,
} from "@/utils/financial/financialUtils";

import usePermissions from "@/utils/hooks/usePermissions";

const OBJECT_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const getEntityName = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const normalized = value.trim();

    if (
      normalized &&
      !OBJECT_ID_PATTERN.test(normalized)
    ) {
      return normalized;
    }

    return "";
  }

  if (typeof value === "object") {
    return String(
      value?.name ||
        value?.title ||
        value?.academicYear ||
        value?.label ||
        ""
    ).trim();
  }

  return "";
};

const getAcademicYearSource = (
  busRecord,
  cls,
  student
) => {
  const enrollment =
    busRecord?.currentEnrollment ||
    busRecord?.enrollment ||
    student?.currentEnrollment ||
    student?.enrollment ||
    student?.activeEnrollment ||
    {};

  const candidates = [
    busRecord?.academicYearId,
    busRecord?.academicYear,
    cls?.academicYearId,
    cls?.academicYear,
    student?.academicYearId,
    student?.academicYear,
    enrollment?.academicYearId,
    enrollment?.academicYear,
  ];

  return (
    candidates.find(Boolean) ||
    null
  );
};

const Detail = ({
  label,
  value,
  icon,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      display: "grid",
      gridTemplateColumns:
        "40px minmax(0,1fr)",
      gap: 1,
      alignItems: "center",
      border:
        "1px solid rgba(36,74,112,.08)",
      borderRadius: "14px",
      bgcolor: "white",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        bgcolor:
          "var(--color-gold-soft)",
        color:
          "var(--color-gold-dark)",
        borderRadius: "12px",
      }}
    >
      {icon}
    </Box>

    <Box minWidth={0}>
      <Typography
        sx={{
          fontSize: 9.5,
          color:
            "var(--color-muted)",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 12,
          color:
            "var(--color-navy-deep)",
          fontWeight: 800,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const BusProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const {
    busRecord,
    loading,
    refetch,
  } = useBus(studentId);

  const permissions =
    usePermissions("financial");

  const {
    discounts = [],
    loading: discountsLoading,
  } = useDiscounts();

  const [
    payOpen,
    setPayOpen,
  ] = useState(false);

  const [
    refundOpen,
    setRefundOpen,
  ] = useState(false);

  const [
    unenrollOpen,
    setUnenrollOpen,
  ] = useState(false);

  const [
    switchOpen,
    setSwitchOpen,
  ] = useState(false);

  const [
    busPlans,
    setBusPlans,
  ] = useState([]);

  const [
    busPlansLoading,
    setBusPlansLoading,
  ] = useState(false);

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    selectedDiscountId,
    setSelectedDiscountId,
  ] = useState("");

  const [
    discountLoading,
    setDiscountLoading,
  ] = useState(false);

  const student =
    busRecord?.student || {};

  const cls =
    busRecord?.class || {};

  const bus =
    busRecord?.bus || {};

  useEffect(() => {
    if (!switchOpen) {
      return;
    }

    let mounted = true;

    const loadBusPlans = async () => {
      setBusPlansLoading(
        true
      );

      try {
        const response =
          await fetchBusPlans();

        if (!mounted) return;

        if (
          response?.status ===
          false
        ) {
          setBusPlans([]);

          toast.error(
            getErrorMessage(
              response,
              "تعذر تحميل خطط الباص"
            )
          );
          return;
        }

        const value =
          response?.data ??
          response;

        const plans =
          Array.isArray(value)
            ? value
            : Array.isArray(
                value?.data
              )
            ? value.data
            : [];

        setBusPlans(
          plans.filter(
            (plan) =>
              plan?.isActive !==
              false
          )
        );
      } finally {
        if (mounted) {
          setBusPlansLoading(
            false
          );
        }
      }
    };

    loadBusPlans();

    return () => {
      mounted = false;
    };
  }, [switchOpen]);


  const academicYearSource =
    getAcademicYearSource(
      busRecord,
      cls,
      student
    );

  const academicYearRawId =
    normalizeId(
      academicYearSource
    );

  const academicYearId =
    OBJECT_ID_PATTERN.test(
      academicYearRawId
    )
      ? academicYearRawId
      : "";

  const {
    getAcademicYearLabel,
  } = useFinancialAcademicYears(
    academicYearId
      ? [academicYearId]
      : []
  );

  const academicYearLabel =
    useMemo(() => {
      const directName =
        getEntityName(
          academicYearSource
        );

      if (directName) {
        return directName;
      }

      if (!academicYearId) {
        return "—";
      }

      const resolved =
        getAcademicYearLabel?.(
          academicYearId
        );

      if (
        resolved &&
        resolved !== "—" &&
        resolved !== academicYearId
      ) {
        return resolved;
      }

      return "—";
    }, [
      academicYearSource,
      academicYearId,
      getAcademicYearLabel,
    ]);

  const activeDiscounts =
    useMemo(
      () =>
        (Array.isArray(discounts)
          ? discounts
          : []
        ).filter(
          (discount) =>
            discount?.isActive !==
            false
        ),
      [discounts]
    );

  const rawBusDiscount =
    bus?.discount ||
    bus?.discountApplied ||
    null;

  const busDiscountId =
    normalizeId(rawBusDiscount);

  const currentDiscount =
    useMemo(() => {
      if (
        rawBusDiscount &&
        typeof rawBusDiscount ===
          "object"
      ) {
        return rawBusDiscount;
      }

      if (!busDiscountId) {
        return null;
      }

      return (
        activeDiscounts.find(
          (discount) =>
            normalizeId(
              discount
            ) === busDiscountId
        ) || null
      );
    }, [
      rawBusDiscount,
      busDiscountId,
      activeDiscounts,
    ]);

  const discountAmount =
    Math.max(
      Number(
        bus?.discountAmount ||
          currentDiscount
            ?.discountAmount ||
          0
      ) ||
        (
          Number(bus?.fee || 0) -
          Number(
            bus?.netFee ??
              bus?.fee ??
              0
          )
        ),
      0
    );

  const installments =
    useMemo(
      () =>
        (
          bus?.installments || []
        ).map((item) => ({
          id:
            item?._id ||
            item?.installmentNumber,

          installmentNumber:
            item?.installmentNumber,

          amountRaw:
            Number(
              item?.amount || 0
            ),

          paidAmountRaw:
            Number(
              item?.paidAmount || 0
            ),

          remainingRaw:
            Math.max(
              Number(
                item?.amount || 0
              ) -
                Number(
                  item?.paidAmount ||
                    0
                ),
              0
            ),

          amount:
            formatMoney(
              item?.amount
            ),

          paidAmount:
            formatMoney(
              item?.paidAmount
            ),

          dueDate:
            formatDate(
              item?.dueDate
            ),

          paymentDate:
            item?.payments?.length
              ? formatDate(
                  item.payments.at(
                    -1
                  )?.paidAt
                )
              : "—",

          statusRaw:
            item?.status,

          status:
            mapInstallmentStatus(
              item?.status
            ),
        })),
      [bus?.installments]
    );

  const pay = async (data) => {
    setSaving(true);

    const response =
      await payBusInstallment(
        studentId,
        {
          installmentNumber:
            Number(
              data.installmentNumber
            ),
          amount: Number(
            data.amount
          ),
          paidAt: data.paidAt,
          notes:
            data.notes ||
            undefined,
        }
      );

    if (response?.status) {
      toast.success(
        response.message ||
          "تم تسجيل دفعة الباص"
      );

      setPayOpen(false);
      setSelected(null);
      await refetch();
    } else {
      toast.error(
        getErrorMessage(
          response,
          "حدث خطأ أثناء تسجيل الدفعة"
        )
      );
    }

    setSaving(false);
  };

  const refund = async (data) => {
    if (!selected) return;

    const amount =
      Number(data.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "أدخل مبلغ استرداد صحيح"
      );
      return;
    }

    if (
      amount >
      selected.paidAmountRaw
    ) {
      toast.error(
        `قيمة الاسترداد لا يمكن أن تتجاوز المدفوع ${formatMoney(
          selected.paidAmountRaw
        )}`
      );
      return;
    }

    if (
      !String(
        data.reason || ""
      ).trim()
    ) {
      toast.error(
        "سبب التصحيح مطلوب"
      );
      return;
    }

    setSaving(true);

    const response =
      await refundBusInstallment(
        studentId,
        selected.installmentNumber,
        {
          installmentNumber:
            Number(
              selected.installmentNumber
            ),
          amount,
          reason: String(
            data.reason
          ).trim(),
        }
      );

    if (response?.status) {
      toast.success(
        response.message ||
          "تم تسجيل استرداد دفعة الباص"
      );

      setRefundOpen(false);
      setSelected(null);
      await refetch();
    } else {
      toast.error(
        getErrorMessage(
          response,
          "تعذر تسجيل استرداد دفعة الباص"
        )
      );
    }

    setSaving(false);
  };

  const applyDiscount =
    async () => {
      if (!selectedDiscountId) {
        toast.error(
          "اختر الخصم أولًا"
        );
        return;
      }

      setDiscountLoading(true);

      const response =
        await applyDiscountToBus(
          studentId,
          {
            discountId:
              selectedDiscountId,
          }
        );

      if (response?.status) {
        toast.success(
          response.message ||
            "تم تطبيق الخصم على الباص بنجاح"
        );

        setSelectedDiscountId(
          ""
        );

        await refetch();
      } else {
        toast.error(
          getErrorMessage(
            response,
            "تعذر تطبيق خصم الباص"
          )
        );
      }

      setDiscountLoading(false);
    };

  const removeDiscount =
    async () => {
      setDiscountLoading(true);

      const response =
        await removeDiscountFromBus(
          studentId
        );

      if (response?.status) {
        toast.success(
          response.message ||
            "تم إزالة خصم الباص بنجاح"
        );

        setSelectedDiscountId(
          ""
        );

        await refetch();
      } else {
        toast.error(
          getErrorMessage(
            response,
            "تعذر إزالة خصم الباص"
          )
        );
      }

      setDiscountLoading(false);
    };


  const changeBusPlan =
    async (data) => {
      const nextBusPlanId =
        normalizeId(
          data?.busPlanId
        );

      if (!nextBusPlanId) {
        toast.error(
          "اختر خطة الباص الجديدة"
        );
        return;
      }

      setSaving(true);

      const payload = {
        busPlanId:
          nextBusPlanId,
      };

      if (academicYearId) {
        payload.academicYearId =
          academicYearId;
      }

      const response =
        await switchBusPlan(
          studentId,
          payload
        );

      if (response?.status) {
        toast.success(
          response?.message ||
            "تم تغيير خطة الباص بنجاح"
        );

        setSwitchOpen(false);
        await refetch();
      } else {
        toast.error(
          getErrorMessage(
            response,
            "تعذر تغيير خطة الباص"
          )
        );
      }

      setSaving(false);
    };

  const unenroll = async () => {
    setSaving(true);

    const response =
      await unenrollBus(
        studentId
      );

    if (response?.status) {
      toast.success(
        response.message ||
          "تم إلغاء الاشتراك"
      );

      navigate(
        "/financial/bus"
      );
    } else {
      toast.error(
        getErrorMessage(
          response,
          "حدث خطأ أثناء إلغاء الاشتراك"
        )
      );
    }

    setSaving(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (!busRecord) {
    return (
      <Container>
        <Back title="ملف الباص" />

        <EmptyState
          icon={
            <DirectionsBusRounded />
          }
          title="لا توجد بيانات باص لهذا الطالب"
          description="لم يتم العثور على اشتراك باص مرتبط بالطالب."
        />
      </Container>
    );
  }

  const fee =
    Number(
      bus?.discount
        ? bus?.netFee
        : bus?.fee || 0
    );

  const paid =
    Number(
      bus?.totalPaid || 0
    );

  const remaining =
    Math.max(
      fee - paid,
      0
    );

  const paidCount =
    installments.filter(
      (item) =>
        item.statusRaw ===
        "paid"
    ).length;

  const hasAnyPayment =
    paid > 0 ||
    installments.some(
      (item) =>
        Number(
          item?.paidAmountRaw ||
            0
        ) > 0
    );

  const currentBusPlanId =
    normalizeId(
      bus?.busPlanId
    );

  const switchPlanOptions =
    busPlans
      .map((plan) => ({
        id:
          plan?._id ||
          plan?.id,
        label:
          `${plan?.name || "خطة باص"} — ${mapBusServiceType(
            plan?.serviceType
          )} — ${formatMoney(
            plan?.fee
          )}`,
      }))
      .filter(
        (plan) =>
          plan.id &&
          plan.id !==
            currentBusPlanId
      );

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <Back title="ملف الباص" />

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mt: 1.25,
            mb: 1.25,
            p: 2,
            background:
              "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.42))",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            gap={1}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems:
                    "center",
                  bgcolor:
                    "var(--color-gold-soft)",
                  color:
                    "var(--color-gold-dark)",
                  borderRadius:
                    "14px",
                }}
              >
                <DirectionsBusRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 800,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  {student?.name ||
                    "ملف الطالب"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 10,
                    color:
                      "var(--color-muted)",
                  }}
                >
                  تفاصيل الاشتراك
                  والأقساط الخاصة
                  بخدمة الباص.
                </Typography>
              </Box>
            </Stack>

            {permissions?.edit &&
              bus?.enrolled && (
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  gap={1}
                >
                  {!hasAnyPayment && (
                    <Button
                      variant="contained"
                      startIcon={
                        <SwapHorizRounded />
                      }
                      onClick={() =>
                        setSwitchOpen(
                          true
                        )
                      }
                      sx={{
                        borderRadius:
                          "12px",
                        fontWeight: 800,
                        textTransform:
                          "none",
                        background:
                          "var(--color-navy)",
                      }}
                    >
                      تغيير الخطة
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={
                      <RemoveCircleOutlineRounded />
                    }
                    onClick={() =>
                      setUnenrollOpen(
                        true
                      )
                    }
                    sx={{
                      borderRadius:
                        "12px",
                      fontWeight: 800,
                    }}
                  >
                    إلغاء الاشتراك
                  </Button>
                </Stack>
              )}
          </Stack>
        </Paper>

        <StatsGrid>
          <StatCard
            label="إجمالي الرسوم"
            value={formatMoney(
              fee
            )}
            icon={
              <AccountBalanceWalletRounded />
            }
          />

          <StatCard
            label="إجمالي المدفوع"
            value={formatMoney(
              paid
            )}
            icon={
              <PaymentsRounded />
            }
          />

          <StatCard
            label="المتبقي"
            value={formatMoney(
              remaining
            )}
            icon={
              <ReceiptLongRounded />
            }
          />

          <StatCard
            label="الأقساط المدفوعة"
            value={`${paidCount}/${installments.length}`}
            icon={
              <EventSeatRounded />
            }
          />
        </StatsGrid>

        <Paper
          elevation={0}
          sx={{
            ...pageCardSx,
            mb: 1.25,
            p: 2,
          }}
        >
          <Typography
            sx={{
              mb: 1.2,
              fontSize: 16,
              fontWeight: 800,
              color:
                "var(--color-navy-deep)",
            }}
          >
            بيانات الطالب والخدمة
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs:
                  "repeat(2,minmax(0,1fr))",
                md:
                  "repeat(3,minmax(0,1fr))",
              },
              gap: 1,
            }}
          >
            <Detail
              label="اسم الطالب"
              value={
                student?.name ||
                "—"
              }
              icon={
                <PersonRounded />
              }
            />

            <Detail
              label="البريد المدرسي"
              value={
                student?.schoolEmail ||
                "—"
              }
              icon={
                <MailOutlineRounded />
              }
            />

            <Detail
              label="الفصل"
              value={
                cls?.roomNumber
                  ? `${
                      cls.roomNumber
                    } - ${translateGender(
                      cls?.gender,
                      "class"
                    )}`
                  : "—"
              }
              icon={
                <GroupsRounded />
              }
            />

            <Detail
              label="السنة الدراسية"
              value={
                academicYearLabel
              }
              icon={
                <SchoolRounded />
              }
            />

            <Detail
              label="خطة الباص"
              value={
                bus?.planName ||
                bus?.busPlanId
                  ?.name ||
                (
                  bus?.busPlanId
                    ? "خطة باص"
                    : "غير مرتبطة بخطة"
                )
              }
              icon={
                <DirectionsBusRounded />
              }
            />

            <Detail
              label="نوع الخدمة"
              value={mapBusServiceType(
                bus?.serviceType
              )}
              icon={
                <DirectionsBusRounded />
              }
            />

            <Detail
              label="حالة السداد"
              value={mapFeeStatus(
                bus?.status
              )}
              icon={
                <AccountBalanceWalletRounded />
              }
            />
          </Box>
        </Paper>

        {bus?.enrolled && (
          <SectionCard
            title="خصم الباص"
            description="طبّق أو أزل خصمًا من رسوم خدمة الباص."
          >
            {rawBusDiscount ? (
              <Paper
                elevation={0}
                sx={{
                  p: 1.35,
                  border:
                    "1px solid rgba(36,74,112,.08)",
                  borderRadius:
                    "14px",
                  bgcolor: "white",
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
                  <Box>
                    <Typography
                      sx={{
                        color:
                          "var(--color-navy-deep)",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {currentDiscount
                        ?.name ||
                        "خصم مطبق"}
                      {currentDiscount
                        ?.percentage
                        ? ` (${currentDiscount.percentage}%)`
                        : ""}
                    </Typography>

                    {discountAmount >
                      0 && (
                      <Typography
                        sx={{
                          mt: 0.2,
                          color:
                            "var(--color-muted)",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        قيمة الخصم:{" "}
                        {formatMoney(
                          discountAmount
                        )}
                      </Typography>
                    )}
                  </Box>

                  {permissions?.edit && (
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={
                        discountLoading
                      }
                      onClick={
                        removeDiscount
                      }
                      sx={{
                        minHeight: 38,
                        borderRadius:
                          "10px",
                        fontWeight: 800,
                      }}
                    >
                      إزالة الخصم
                    </Button>
                  )}
                </Stack>
              </Paper>
            ) : permissions?.edit ? (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                gap={1}
                alignItems={{
                  xs: "stretch",
                  sm: "center",
                }}
              >
                <TextField
                  select
                  size="small"
                  label="اختر الخصم"
                  value={
                    selectedDiscountId
                  }
                  disabled={
                    discountsLoading ||
                    discountLoading
                  }
                  onChange={(event) =>
                    setSelectedDiscountId(
                      event.target.value
                    )
                  }
                  sx={{
                    minWidth: {
                      xs: "100%",
                      sm: 260,
                    },
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "11px",
                      },
                  }}
                >
                  {activeDiscounts.map(
                    (discount) => {
                      const id =
                        normalizeId(
                          discount
                        );

                      if (!id) {
                        return null;
                      }

                      return (
                        <MenuItem
                          key={id}
                          value={id}
                        >
                          {discount?.name ||
                            "خصم"}
                          {discount
                            ?.percentage
                            ? ` (${discount.percentage}%)`
                            : ""}
                        </MenuItem>
                      );
                    }
                  )}
                </TextField>

                <Button
                  variant="contained"
                  disabled={
                    !selectedDiscountId ||
                    discountsLoading ||
                    discountLoading
                  }
                  onClick={
                    applyDiscount
                  }
                  sx={{
                    minHeight: 40,
                    borderRadius:
                      "10px",
                    fontWeight: 800,
                  }}
                >
                  تطبيق الخصم
                </Button>

                {!discountsLoading &&
                  !activeDiscounts.length && (
                    <Typography
                      sx={{
                        color:
                          "var(--color-muted)",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      لا توجد خصومات
                      نشطة متاحة.
                    </Typography>
                  )}
              </Stack>
            ) : (
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 10,
                }}
              >
                لا يوجد خصم مطبق
                على الباص.
              </Typography>
            )}
          </SectionCard>
        )}

        {bus?.enrolled && (
          <SectionCard
            title="أقساط الباص"
            description="راجع مواعيد الاستحقاق وسجّل الدفعات."
          >
            {!installments.length ? (
              <EmptyState
                icon={
                  <ReceiptLongRounded />
                }
                title="لا توجد أقساط لعرضها"
                description="لم يتم إنشاء جدول أقساط لهذا الاشتراك."
              />
            ) : (
              <Box
                sx={{
                  p: 1,
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
                      "0 8px",

                    "& th": {
                      p: 1,
                      bgcolor:
                        "rgba(36,74,112,.045)",
                      fontSize: 10,
                      textAlign:
                        "right",
                    },

                    "& td": {
                      p: 1,
                      bgcolor: "white",
                      borderTop:
                        "1px solid rgba(36,74,112,.08)",
                      borderBottom:
                        "1px solid rgba(36,74,112,.08)",
                      fontSize: 11,
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>القسط</th>
                      <th>المبلغ</th>
                      <th>المدفوع</th>
                      <th>الاستحقاق</th>
                      <th>تاريخ الدفع</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {installments.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td>
                            #
                            {
                              item.installmentNumber
                            }
                          </td>

                          <td>
                            {
                              item.amount
                            }
                          </td>

                          <td>
                            {
                              item.paidAmount
                            }
                          </td>

                          <td>
                            {
                              item.dueDate
                            }
                          </td>

                          <td>
                            {
                              item.paymentDate
                            }
                          </td>

                          <td>
                            <Chip
                              label={
                                item.status
                              }
                              size="small"
                            />
                          </td>

                          <td>
                            {permissions?.edit ? (
                              <Stack
                                direction="row"
                                spacing={
                                  0.75
                                }
                              >
                                {item.statusRaw !==
                                  "paid" && (
                                  <Button
                                    variant="contained"
                                    onClick={() => {
                                      setSelected(
                                        item
                                      );
                                      setPayOpen(
                                        true
                                      );
                                    }}
                                    sx={{
                                      minHeight: 34,
                                      borderRadius:
                                        "9px",
                                      fontSize:
                                        9.5,
                                    }}
                                  >
                                    تسجيل دفعة
                                  </Button>
                                )}

                                {item.paidAmountRaw >
                                  0 && (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={
                                      <UndoRounded />
                                    }
                                    onClick={() => {
                                      setSelected(
                                        item
                                      );
                                      setRefundOpen(
                                        true
                                      );
                                    }}
                                    sx={{
                                      minHeight: 34,
                                      borderRadius:
                                        "9px",
                                      fontSize:
                                        9.5,
                                    }}
                                  >
                                    تصحيح دفعة
                                  </Button>
                                )}

                                {item.statusRaw ===
                                  "paid" &&
                                  item.paidAmountRaw <=
                                    0 &&
                                  "—"}
                              </Stack>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </Box>
              </Box>
            )}
          </SectionCard>
        )}


        <SwitchBusPlanDialog
          open={switchOpen}
          onClose={() =>
            !saving &&
            setSwitchOpen(false)
          }
          onSubmit={
            changeBusPlan
          }
          loading={
            saving ||
            busPlansLoading
          }
          plans={
            switchPlanOptions
          }
        />

        <PayDialog
          open={payOpen}
          onClose={() =>
            !saving &&
            (
              setPayOpen(false),
              setSelected(null)
            )
          }
          item={selected}
          onSubmit={pay}
          loading={saving}
        />

        <RefundBusDialog
          open={refundOpen}
          onClose={() =>
            !saving &&
            (
              setRefundOpen(false),
              setSelected(null)
            )
          }
          item={selected}
          onSubmit={refund}
          loading={saving}
        />

        <ConfirmDialog
          open={unenrollOpen}
          onClose={() =>
            !saving &&
            setUnenrollOpen(false)
          }
          onConfirm={unenroll}
          loading={saving}
        />
      </Box>
    </Container>
  );
};


const SwitchBusPlanDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
  plans,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      busPlanId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        busPlanId: "",
      });
    }
  }, [open, reset]);

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
      <DialogHeader
        icon={<SwapHorizRounded />}
        title="تغيير خطة الباص"
        description="يمكن تغيير الخطة فقط قبل تسجيل أي دفعة على اشتراك الباص."
        loading={loading}
        onClose={onClose}
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
        >
          <Stack spacing={1.5}>
            <TextField
              select
              fullWidth
              label="الخطة الجديدة"
              defaultValue=""
              error={Boolean(
                errors.busPlanId
              )}
              helperText={
                errors.busPlanId
                  ?.message ||
                (
                  plans.length === 0
                    ? "لا توجد خطة أخرى نشطة متاحة."
                    : ""
                )
              }
              {...register(
                "busPlanId",
                {
                  required:
                    "اختر خطة الباص الجديدة",
                }
              )}
            >
              <MenuItem value="">
                اختر الخطة
              </MenuItem>

              {plans.map(
                (plan) => (
                  <MenuItem
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.label}
                  </MenuItem>
                )
              )}
            </TextField>

            <FormActions
              loading={loading}
              onCancel={onClose}
              label="تغيير الخطة"
              disabled={
                plans.length === 0
              }
            />
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const PayDialog = ({
  open,
  onClose,
  item,
  onSubmit,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (item) {
      reset({
        installmentNumber:
          item.installmentNumber,
        amount:
          item.remainingRaw,
        paidAt:
          new Date()
            .toISOString()
            .slice(0, 10),
        notes: "",
      });
    }
  }, [item, reset]);

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
      <DialogHeader
        icon={<PaymentsRounded />}
        title="تسجيل دفعة الباص"
        description={
          item
            ? `القسط رقم ${item.installmentNumber} — ${item.amount}`
            : ""
        }
        loading={loading}
        onClose={onClose}
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
        >
          <input
            type="hidden"
            {...register(
              "installmentNumber",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ المدفوع"
              error={Boolean(
                errors.amount
              )}
              helperText={
                errors.amount
                  ?.message ||
                `المتبقي على القسط: ${
                  item?.remainingRaw ||
                  0
                } جنيه`
              }
              inputProps={{
                min: 1,
                max:
                  item?.remainingRaw ||
                  undefined,
                step: "any",
              }}
              {...register(
                "amount",
                {
                  required:
                    "أدخل مبلغ الدفعة",
                  valueAsNumber:
                    true,
                  min: {
                    value: 1,
                    message:
                      "المبلغ يجب أن يكون أكبر من صفر",
                  },
                  max: {
                    value:
                      item?.remainingRaw ||
                      Number.MAX_SAFE_INTEGER,
                    message: `أقصى مبلغ متاح هو ${
                      item?.remainingRaw ||
                      0
                    } جنيه`,
                  },
                }
              )}
            />

            <Input
              register={register}
              registerName="paidAt"
              error={
                errors.paidAt
                  ?.message
              }
              label="تاريخ الدفع"
              required
              type="date"
            />

            <Input
              register={register}
              registerName="notes"
              label="ملاحظات"
              multiline
              rows={3}
            />
          </Stack>

          <FormActions
            loading={loading}
            onCancel={onClose}
            label="تسجيل الدفع"
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const RefundBusDialog = ({
  open,
  onClose,
  item,
  onSubmit,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (item) {
      reset({
        amount:
          item.paidAmountRaw,
        reason: "",
      });
    }
  }, [item, reset]);

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
      <DialogHeader
        icon={<UndoRounded />}
        title="تصحيح دفعة الباص"
        description={
          item
            ? `القسط رقم ${item.installmentNumber} — المدفوع ${item.paidAmount}`
            : ""
        }
        loading={loading}
        onClose={onClose}
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
        >
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              type="number"
              label="مبلغ الاسترداد"
              error={Boolean(
                errors.amount
              )}
              helperText={
                errors.amount
                  ?.message ||
                `أقصى مبلغ متاح: ${
                  item?.paidAmountRaw ||
                  0
                } جنيه`
              }
              inputProps={{
                min: 1,
                max:
                  item?.paidAmountRaw ||
                  undefined,
                step: "any",
              }}
              {...register(
                "amount",
                {
                  required:
                    "أدخل مبلغ الاسترداد",
                  valueAsNumber:
                    true,
                  min: {
                    value: 1,
                    message:
                      "المبلغ يجب أن يكون أكبر من صفر",
                  },
                  max: {
                    value:
                      item?.paidAmountRaw ||
                      Number.MAX_SAFE_INTEGER,
                    message: `أقصى مبلغ متاح هو ${
                      item?.paidAmountRaw ||
                      0
                    } جنيه`,
                  },
                }
              )}
            />

            <Input
              register={register}
              registerName="reason"
              error={
                errors.reason
                  ?.message
              }
              label="سبب التصحيح"
              required
              multiline
              rows={3}
            />
          </Stack>

          <FormActions
            loading={loading}
            onCancel={onClose}
            label="تسجيل الاسترداد"
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "20px",
        bgcolor:
          "var(--color-cream)",
      },
    }}
  >
    <DialogHeader
      icon={
        <RemoveCircleOutlineRounded />
      }
      title="إلغاء التسجيل من الباص"
      description="سيتم حذف اشتراك الطالب من خدمة الباص."
      loading={loading}
      onClose={onClose}
    />

    <DialogContent sx={{ p: 2 }}>
      <Typography
        sx={{ fontSize: 12 }}
      >
        هل أنت متأكد من إلغاء
        تسجيل الطالب من خدمة
        الباص؟
      </Typography>

      <Stack
        direction="row"
        gap={1}
        mt={2}
      >
        <Button
          disabled={loading}
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            flex: 1,
            borderRadius: "11px",
          }}
        >
          تأكيد الإلغاء
        </Button>

        <Button
          disabled={loading}
          onClick={onClose}
          variant="outlined"
          sx={{
            flex: 1,
            borderRadius: "11px",
          }}
        >
          رجوع
        </Button>
      </Stack>
    </DialogContent>
  </Dialog>
);

export default BusProfilePage;
