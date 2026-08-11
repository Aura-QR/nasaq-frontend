import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  DirectionsBusRounded,
  LocalActivityRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import {
  payTuitionInstallment,
  switchTuitionInstallmentPlan,
} from "@/APIs/financials/financialRecords";

import {
  refundTuitionInstallment,
} from "@/APIs/financials/financialRecordCorrections";

import {
  applyDiscountToTuition,
  removeDiscountFromTuition,
} from "@/APIs/financials/discounts";

import {
  payAdditionalFee,
} from "@/APIs/financials/additionalFees";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";

import {
  translateGender,
} from "@/utils/helpers/translateGender";

import {
  formatDate,
  formatMoney,
  getErrorMessage,
  mapFeeStatus,
} from "@/utils/financial/financialUtils";

import {
  useDiscounts,
} from "@/utils/hooks/apis/financials/useDiscounts";

import {
  useFinancialRecord,
} from "@/utils/hooks/apis/financials/useFinancialRecord";

import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

import usePermissions from "@/utils/hooks/usePermissions";

const numberOf = (...values) => {
  for (const value of values) {
    const numeric =
      Number(value);

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(
        numeric
      )
    ) {
      return numeric;
    }
  }

  return 0;
};

const idOf = (value) => {
  if (
    value &&
    typeof value ===
      "object"
  ) {
    return String(
      value?._id ||
      value?.id ||
      ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};

const asArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const getStudentName = (
  student
) =>
  student?.name ||
  [
    student?.firstName,
    student?.fatherName,
    student?.familyName,
  ]
    .filter(Boolean)
    .join(" ") ||
  student?.username ||
  "—";

const getEffectiveFee = (
  value
) => {
  if (!value) {
    return 0;
  }

  if (
    value?.discount ||
    value?.discountApplied
  ) {
    return numberOf(
      value?.netFee,
      value
        ?.amountAfterDiscount,
      value?.fee,
      value?.amount
    );
  }

  return numberOf(
    value?.netFee,
    value?.fee,
    value?.amount
  );
};

const derivedStatus = (
  installments
) => {
  const rows =
    asArray(
      installments
    );

  if (
    rows.length > 0 &&
    rows.every(
      (item) =>
        item?.status ===
        "paid"
    )
  ) {
    return "paid";
  }

  const hasProgress =
    rows.some(
      (item) =>
        numberOf(
          item?.paidAmount
        ) > 0
    );

  if (hasProgress) {
    return "partial";
  }

  return "unpaid";
};

const statusLabel = (
  status
) =>
  status === "paid"
    ? "مدفوع بالكامل"
    : status ===
        "partial"
      ? "جزئي"
      : "غير مدفوع";

const statusChipSx = (
  status
) => {
  if (status === "paid") {
    return {
      color: "#237449",
      bgcolor:
        "rgba(116,201,154,.16)",
      border:
        "1px solid rgba(116,201,154,.28)",
    };
  }

  if (
    status === "partial"
  ) {
    return {
      color:
        "var(--color-gold-dark)",
      bgcolor:
        "var(--color-gold-soft)",
      border:
        "1px solid rgba(211,164,79,.22)",
    };
  }

  return {
    color:
      "var(--color-muted)",
    bgcolor:
      "rgba(36,74,112,.06)",
    border:
      "1px solid rgba(36,74,112,.10)",
  };
};

const getPaymentEventType = (
  event
) => {
  const type =
    String(
      event?.type ||
      event?.eventType ||
      event?.kind ||
      ""
    ).toLowerCase();

  if (
    type.includes(
      "refund"
    ) ||
    type.includes(
      "reversal"
    ) ||
    numberOf(
      event?.amount
    ) < 0
  ) {
    return "refund";
  }

  return "payment";
};

const getPaymentDate = (
  event
) =>
  event?.refundedAt ||
  event?.paidAt ||
  event?.createdAt ||
  event?.date;

const getEventAmount = (
  event
) =>
  Math.abs(
    numberOf(
      event?.amount,
      event?.paidAmount,
      event?.refundAmount
    )
  );

const getEventText = (
  event
) =>
  event?.reason ||
  event?.notes ||
  event?.note ||
  "—";

const SummaryCell = ({
  label,
  value,
  tone,
}) => (
  <Box
    sx={{
      p: 1.5,
      bgcolor:
        "#fff",
      minWidth: 0,
      ...(tone ===
        "discount"
        ? {
            "& .value":
              {
                color:
                  "#237449",
              },
          }
        : {}),
    }}
  >
    <Typography
      sx={{
        fontSize:
          "10px",
        color:
          "var(--color-muted)",
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>

    <Typography
      className="value"
      sx={{
        mt: 0.4,
        fontSize:
          "17px",
        fontWeight: 800,
        color:
          "var(--color-navy-deep)",
        overflowWrap:
          "anywhere",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const ServiceCard = ({
  title,
  status,
  primary,
  secondary,
  icon,
  onClick,
  disabled,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.4,
      border:
        "1px solid rgba(36,74,112,.09)",
      borderRadius:
        "14px",
      bgcolor: "#fff",
    }}
  >
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      gap={1}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            display:
              "grid",
            placeItems:
              "center",
            borderRadius:
              "11px",
            bgcolor:
              "var(--color-gold-soft)",
            color:
              "var(--color-gold-dark)",
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize:
                "12px",
              fontWeight:
                800,
              color:
                "var(--color-navy-deep)",
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              fontSize:
                "10px",
              color:
                "var(--color-muted)",
            }}
          >
            {secondary}
          </Typography>
        </Box>
      </Stack>

      <Chip
        label={status}
        size="small"
        sx={{
          fontSize:
            "9px",
          fontWeight:
            800,
        }}
      />
    </Stack>

    <Typography
      sx={{
        mt: 1.25,
        fontSize:
          "16px",
        fontWeight:
          800,
        color:
          "var(--color-navy-deep)",
      }}
    >
      {primary}
    </Typography>

    {onClick && (
      <Button
        fullWidth
        variant="outlined"
        onClick={onClick}
        disabled={
          disabled
        }
        sx={{
          mt: 1.25,
          minHeight:
            38,
          borderRadius:
            "10px",
          fontSize:
            "10.5px",
          fontWeight:
            800,
          textTransform:
            "none",
        }}
      >
        فتح السجل
      </Button>
    )}
  </Paper>
);

const FinancialRecordProfilePage =
  () => {
    const {
      studentId,
    } = useParams();

    const [searchParams] =
      useSearchParams();

    const requestedAcademicYearId =
      searchParams.get(
        "academicYearId"
      ) || "";

    const navigate =
      useNavigate();

    const {
      financialRecord,
      loading,
      refetch,
    } =
      useFinancialRecord(
        studentId,
        requestedAcademicYearId
      );

    const permissions =
      usePermissions(
        "financial"
      );

    const {
      getAcademicYearLabel,
    } =
      useFinancialAcademicYears(
        financialRecord
          ?.academicYearId
          ? [
              financialRecord
                .academicYearId,
            ]
          : []
      );

    const [
      payOpen,
      setPayOpen,
    ] = useState(false);

    const [
      refundOpen,
      setRefundOpen,
    ] = useState(false);

    const [
      actionLoading,
      setActionLoading,
    ] = useState(false);

    const [
      selectedInstallment,
      setSelectedInstallment,
    ] = useState(null);

    const [
      selectedDiscountId,
      setSelectedDiscountId,
    ] = useState("");

    const [
      discountLoading,
      setDiscountLoading,
    ] = useState(false);

    const [
      switchPlanOpen,
      setSwitchPlanOpen,
    ] = useState(false);

    const [
      selectedPlanId,
      setSelectedPlanId,
    ] = useState("");

    const [
      switchPlanLoading,
      setSwitchPlanLoading,
    ] = useState(false);

    const [
      additionalPayOpen,
      setAdditionalPayOpen,
    ] = useState(false);

    const [
      selectedAdditionalFee,
      setSelectedAdditionalFee,
    ] = useState(null);

    const [
      additionalPayLoading,
      setAdditionalPayLoading,
    ] = useState(false);

    const {
      discounts,
      loading:
        discountsLoading,
    } = useDiscounts();

    const {
      installmentPlans,
      loading:
        installmentPlansLoading,
    } = useInstallmentPlans();

    const student =
      financialRecord
        ?.studentId ||
      financialRecord
        ?.student ||
      {};

    const cls =
      financialRecord
        ?.classId ||
      financialRecord
        ?.class ||
      {};

    const tuition =
      financialRecord
        ?.tuition ||
      {};

    const installments =
      asArray(
        tuition?.installments
      );

    const originalFee =
      numberOf(
        tuition?.fee,
        tuition?.originalFee,
        tuition?.grossFee
      );

    const netFee =
      getEffectiveFee(
        tuition
      );

    const totalPaid =
      numberOf(
        tuition?.totalPaid,
        tuition?.paidAmount
      );

    const remaining =
      Math.max(
        netFee -
          totalPaid,
        0
      );

    const tuitionStatus =
      derivedStatus(
        installments
      );

    const discount =
      tuition?.discount ||
      null;

    const discountAmount =
      numberOf(
        discount?.discountAmount,
        tuition?.discountAmount,
        Math.max(
          originalFee -
            netFee,
          0
        )
      );

    const academicYearId =
      idOf(
        financialRecord
          ?.academicYearId ||
        cls?.academicYearId
      );

    const academicYearLabel =
      getAcademicYearLabel(
        academicYearId
      );

    const className =
      cls?.roomNumber
        ? `${cls.roomNumber} - ${
            translateGender(
              cls?.gender,
              "class"
            ) || ""
          }`
        : cls?.name ||
          "—";

    const currentPlan =
      financialRecord
        ?.installmentPlanId ||
      financialRecord
        ?.installmentPlan ||
      tuition
        ?.installmentPlanId ||
      null;

    const currentPlanId =
      idOf(currentPlan);

    const planName =
      currentPlan?.name ||
      "—";

    const paymentHistory =
      useMemo(
        () =>
          installments
            .flatMap(
              (
                installment
              ) =>
                asArray(
                  installment
                    ?.payments
                ).map(
                  (
                    event,
                    index
                  ) => ({
                    ...event,
                    installmentNumber:
                      installment
                        ?.installmentNumber,
                    eventKey:
                      event?._id ||
                      `${installment?.installmentNumber}-${index}`,
                  })
                )
            )
            .sort(
              (a, b) =>
                new Date(
                  getPaymentDate(
                    b
                  ) || 0
                ).getTime() -
                new Date(
                  getPaymentDate(
                    a
                  ) || 0
                ).getTime()
            ),
        [installments]
      );

    const additionalFees =
      asArray(
        financialRecord
          ?.additionalFees ||
        financialRecord
          ?.additionalFeeAssignments ||
        financialRecord
          ?.studentAdditionalFees
      );

    const additionalFeeRows =
      additionalFees.map(
        (item) => {
          const source =
            item?.additionalFeeId ||
            item?.additionalFee ||
            item?.feeId ||
            {};

          const amount =
            numberOf(
              item?.netFee,
              item?.fee,
              item?.amount,
              source?.amount
            );

          const paid =
            numberOf(
              item?.totalPaid,
              item?.paidAmount
            );

          return {
            raw: item,
            feeId:
              idOf(source) ||
              idOf(item?.feeId) ||
              idOf(item),
            name:
              item?.name ||
              source?.name ||
              "رسم إضافي",
            amount,
            paid,
            remaining:
              Math.max(
                amount - paid,
                0
              ),
            status:
              item?.status ||
              (amount > 0 &&
              paid >= amount
                ? "paid"
                : paid > 0
                  ? "partial"
                  : "unpaid"),
          };
        }
      );

    const additionalRemaining =
      additionalFees.reduce(
        (sum, item) => {
          const fee =
            numberOf(
              item?.netFee,
              item?.fee,
              item?.amount,
              item
                ?.additionalFeeId
                ?.amount,
              item
                ?.additionalFee
                ?.amount
            );

          const paid =
            numberOf(
              item?.totalPaid,
              item?.paidAmount
            );

          return (
            sum +
            Math.max(
              fee - paid,
              0
            )
          );
        },
        0
      );

    const bus =
      financialRecord
        ?.bus ||
      {};

    const busFee =
      bus?.enrolled
        ? getEffectiveFee(
            bus
          )
        : 0;

    const busPaid =
      bus?.enrolled
        ? numberOf(
            bus?.totalPaid,
            bus?.paidAmount
          )
        : 0;

    const busRemaining =
      Math.max(
        busFee -
          busPaid,
        0
      );

    const trips =
      asArray(
        financialRecord
          ?.trips
      );

    const tripsRemaining =
      trips.reduce(
        (sum, trip) => {
          const fee =
            getEffectiveFee(
              trip
            );

          const paid =
            numberOf(
              trip?.totalPaid,
              trip?.paidAmount
            );

          return (
            sum +
            Math.max(
              fee -
                paid,
              0
            )
          );
        },
        0
      );

    const activeDiscounts =
      asArray(
        discounts
      ).filter(
        (item) =>
          item?.isActive
      );

    const availableInstallmentPlans =
      asArray(
        installmentPlans
      ).filter(
        (item) =>
          item?.isActive !== false &&
          idOf(item) !== currentPlanId
      );

    const selectedPlan =
      availableInstallmentPlans.find(
        (item) =>
          idOf(item) ===
          selectedPlanId
      ) || null;

    const handleOpenPay =
      (installment) => {
        setSelectedInstallment(
          installment
        );
        setPayOpen(true);
      };

    const handleOpenRefund =
      (installment) => {
        setSelectedInstallment(
          installment
        );
        setRefundOpen(
          true
        );
      };

    const handleOpenSwitchPlan =
      () => {
        if (totalPaid > 0) {
          toast.error(
            "لا يمكن تغيير خطة التقسيط بعد تسجيل دفعات"
          );
          return;
        }

        setSelectedPlanId("");
        setSwitchPlanOpen(true);
      };

    const handleSwitchPlan =
      async () => {
        if (
          !studentId ||
          !selectedPlanId
        ) {
          toast.error(
            "اختر خطة تقسيط أولًا"
          );
          return;
        }

        if (!permissions?.edit) {
          toast.error(
            "ليس لديك صلاحية تغيير خطة التقسيط"
          );
          return;
        }

        if (totalPaid > 0) {
          toast.error(
            "لا يمكن تغيير خطة التقسيط بعد تسجيل دفعات"
          );
          return;
        }

        setSwitchPlanLoading(true);

        const response =
          await switchTuitionInstallmentPlan(
            studentId,
            selectedPlanId
          );

        if (response?.status) {
          toast.success(
            response?.message ||
              "تم تغيير خطة التقسيط بنجاح"
          );
          setSwitchPlanOpen(false);
          setSelectedPlanId("");
          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر تغيير خطة التقسيط"
            )
          );
        }

        setSwitchPlanLoading(false);
      };

    const closeDialogs =
      () => {
        setPayOpen(
          false
        );
        setRefundOpen(
          false
        );
        setSelectedInstallment(
          null
        );
      };

    const handlePay =
      async (
        formData
      ) => {
        if (
          !studentId ||
          !selectedInstallment
        ) {
          return;
        }

        if (
          !permissions?.edit
        ) {
          toast.error(
            "ليس لديك صلاحية تسجيل الدفعات"
          );
          return;
        }

        const amount =
          Number(
            formData.amount
          );

        const installmentAmount =
          numberOf(
            selectedInstallment
              ?.amount
          );

        const paidAmount =
          numberOf(
            selectedInstallment
              ?.paidAmount
          );

        const installmentRemaining =
          Math.max(
            installmentAmount -
              paidAmount,
            0
          );

        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          toast.error(
            "أدخل مبلغًا أكبر من صفر"
          );
          return;
        }

        if (
          amount >
          installmentRemaining
        ) {
          toast.error(
            `المبلغ لا يمكن أن يتجاوز المتبقي ${formatMoney(
              installmentRemaining
            )}`
          );
          return;
        }

        setActionLoading(
          true
        );

        const payload = {
          installmentNumber:
            Number(
              selectedInstallment
                ?.installmentNumber
            ),
          amount,
          paidAt:
            formData.paidAt,
          notes:
            formData.notes ||
            undefined,
          ...(academicYearId
            ? {
                academicYearId,
              }
            : {}),
        };

        const response =
          await payTuitionInstallment(
            studentId,
            payload
          );

        if (
          response?.status
        ) {
          toast.success(
            response?.message ||
              "تم تسجيل الدفعة بنجاح"
          );

          closeDialogs();
          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر تسجيل الدفعة"
            )
          );
        }

        setActionLoading(
          false
        );
      };

    const handleRefund =
      async (
        formData
      ) => {
        if (
          !studentId ||
          !selectedInstallment
        ) {
          return;
        }

        if (
          !permissions?.edit
        ) {
          toast.error(
            "ليس لديك صلاحية تصحيح الدفعات"
          );
          return;
        }

        const amount =
          Number(
            formData.amount
          );

        const paidAmount =
          numberOf(
            selectedInstallment
              ?.paidAmount
          );

        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          toast.error(
            "أدخل مبلغ استرداد صحيح"
          );
          return;
        }

        if (
          amount >
          paidAmount
        ) {
          toast.error(
            `قيمة التصحيح لا يمكن أن تتجاوز المدفوع ${formatMoney(
              paidAmount
            )}`
          );
          return;
        }

        if (
          !String(
            formData.reason ||
              ""
          ).trim()
        ) {
          toast.error(
            "سبب التصحيح مطلوب"
          );
          return;
        }

        setActionLoading(
          true
        );

        const response =
          await refundTuitionInstallment(
            studentId,
            selectedInstallment
              ?.installmentNumber,
            {
              installmentNumber:
                Number(
                  selectedInstallment
                    ?.installmentNumber
                ),
              amount,
              reason:
                formData.reason
                  .trim(),
              refundedAt:
                formData.refundedAt ||
                undefined,
              ...(academicYearId
                ? {
                    academicYearId,
                  }
                : {}),
            }
          );

        if (
          response?.status
        ) {
          toast.success(
            response?.message ||
              "تم تسجيل التصحيح بنجاح"
          );

          closeDialogs();
          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر تسجيل التصحيح"
            )
          );
        }

        setActionLoading(
          false
        );
      };

    const handleAdditionalFeePayment =
      async (formData) => {
        if (
          !studentId ||
          !selectedAdditionalFee
        ) {
          return;
        }

        if (!permissions?.edit) {
          toast.error(
            "ليس لديك صلاحية تسجيل سداد الرسوم الإضافية"
          );
          return;
        }

        const amount =
          Number(formData.amount);

        const expectedAmount =
          Number(
            selectedAdditionalFee.remaining
          );

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          toast.error(
            "أدخل مبلغ سداد صحيح"
          );
          return;
        }

        if (
          Math.abs(
            amount - expectedAmount
          ) > 0.000001
        ) {
          toast.error(
            `يجب سداد المبلغ المستحق كاملًا: ${formatMoney(
              expectedAmount
            )}`
          );
          return;
        }

        setAdditionalPayLoading(
          true
        );

        const response =
          await payAdditionalFee(
            studentId,
            selectedAdditionalFee.feeId,
            {
              amount,
              paidAt:
                formData.paidAt,
              notes:
                formData.notes ||
                undefined,
            }
          );

        if (response?.status) {
          toast.success(
            response?.message ||
              "تم تسجيل سداد الرسم الإضافي بنجاح"
          );
          setAdditionalPayOpen(false);
          setSelectedAdditionalFee(null);
          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر تسجيل سداد الرسم الإضافي"
            )
          );
        }

        setAdditionalPayLoading(
          false
        );
      };

    const handleApplyDiscount =
      async () => {
        if (
          !studentId
        ) {
          return;
        }

        if (
          !permissions?.edit
        ) {
          toast.error(
            "ليس لديك صلاحية تعديل الرسوم"
          );
          return;
        }

        if (
          !selectedDiscountId
        ) {
          toast.error(
            "اختر خصمًا أولًا"
          );
          return;
        }

        setDiscountLoading(
          true
        );

        const response =
          await applyDiscountToTuition(
            studentId,
            {
              discountId:
                selectedDiscountId,
              ...(academicYearId
                ? {
                    academicYearId,
                  }
                : {}),
            }
          );

        if (
          response?.status
        ) {
          toast.success(
            response?.message ||
              "تم تطبيق الخصم"
          );

          setSelectedDiscountId(
            ""
          );

          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر تطبيق الخصم"
            )
          );
        }

        setDiscountLoading(
          false
        );
      };

    const handleRemoveDiscount =
      async () => {
        if (
          !studentId
        ) {
          return;
        }

        setDiscountLoading(
          true
        );

        const response =
          await removeDiscountFromTuition(
            studentId,
            academicYearId
              ? {
                  academicYearId,
                }
              : undefined
          );

        if (
          response?.status
        ) {
          toast.success(
            response?.message ||
              "تم إزالة الخصم"
          );

          await refetch();
        } else {
          toast.error(
            getErrorMessage(
              response,
              "تعذر إزالة الخصم"
            )
          );
        }

        setDiscountLoading(
          false
        );
      };

    if (loading) {
      return (
        <Container>
          <Loading />
        </Container>
      );
    }

    if (
      !financialRecord
    ) {
      return (
        <Container>
          <Back title="الملف المالي للطالب" />

          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 4,
              textAlign:
                "center",
              border:
                "1px dashed rgba(36,74,112,.18)",
              borderRadius:
                "16px",
              bgcolor:
                "var(--color-cream)",
            }}
          >
            <Typography
              sx={{
                fontWeight:
                  800,
                color:
                  "var(--color-navy-deep)",
              }}
            >
              لا يوجد سجل
              مالي لهذا
              الطالب
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize:
                  "10px",
                color:
                  "var(--color-muted)",
              }}
            >
              السجل المالي
              لا يتم إنشاؤه
              يدويًا من
              الواجهة.
            </Typography>
          </Paper>
        </Container>
      );
    }

    return (
      <Container>
        <Box
          dir="rtl"
          sx={{
            pb: 4,
          }}
        >
          <Back title="الملف المالي للطالب" />

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              p: {
                xs: 1.5,
                md: 2,
              },
              border:
                "1px solid rgba(36,74,112,.09)",
              borderRadius:
                "18px",
              bgcolor:
                "var(--color-cream)",
              boxShadow:
                "0 12px 28px rgba(18,47,77,.05)",
            }}
          >
            <Stack
              direction={{
                xs:
                  "column",
                md: "row",
              }}
              alignItems={{
                xs:
                  "flex-start",
                md:
                  "center",
              }}
              justifyContent="space-between"
              gap={1.5}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "20px",
                    fontWeight:
                      800,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  {getStudentName(
                    student
                  )}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize:
                      "10.5px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  {academicYearLabel}
                  {" · "}
                  {className}
                  {" · "}
                  خطة:{" "}
                  {planName}
                </Typography>
              </Box>

              <Chip
                label={statusLabel(
                  tuitionStatus
                )}
                sx={{
                  ...statusChipSx(
                    tuitionStatus
                  ),
                  fontWeight:
                    800,
                  fontSize:
                    "10px",
                }}
              />
            </Stack>

            <Box
              sx={{
                mt: 1.7,
                display:
                  "grid",
                gridTemplateColumns:
                  discountAmount >
                  0
                    ? {
                        xs:
                          "1fr",
                        sm:
                          "repeat(2,1fr)",
                        lg:
                          "repeat(4,1fr)",
                      }
                    : {
                        xs:
                          "1fr",
                        sm:
                          "repeat(3,1fr)",
                      },
                gap:
                  "1px",
                bgcolor:
                  "rgba(36,74,112,.10)",
                border:
                  "1px solid rgba(36,74,112,.10)",
                borderRadius:
                  "12px",
                overflow:
                  "hidden",
              }}
            >
              <SummaryCell
                label="الرسوم الأصلية"
                value={formatMoney(
                  originalFee
                )}
              />

              {discountAmount >
                0 && (
                <SummaryCell
                  label={
                    discount
                      ?.name
                      ? `${discount.name}${
                          discount?.percentage
                            ? ` ${discount.percentage}%`
                            : ""
                        }`
                      : "الخصم"
                  }
                  value={`− ${formatMoney(
                    discountAmount
                  )}`}
                  tone="discount"
                />
              )}

              <SummaryCell
                label="صافي المطلوب"
                value={formatMoney(
                  netFee
                )}
              />

              <SummaryCell
                label="المدفوع"
                value={formatMoney(
                  totalPaid
                )}
              />
            </Box>
          </Paper>

          {additionalFeeRows.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 1.25,
                p: { xs: 1.5, md: 2 },
                border: "1px solid rgba(36,74,112,.09)",
                borderRadius: "18px",
                bgcolor: "var(--color-cream)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                gap={1}
                mb={1.25}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--color-navy-deep)",
                    }}
                  >
                    الرسوم الإضافية المستحقة
                  </Typography>
                  <Typography
                    sx={{ mt: 0.25, fontSize: "10px", color: "var(--color-muted)" }}
                  >
                    يتم سداد الرسم الإضافي بالقيمة المستحقة كاملة دون رقم قسط.
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${additionalFeeRows.length} رسوم`}
                />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 720,
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                    "& th": {
                      p: 1,
                      bgcolor: "rgba(36,74,112,.045)",
                      fontSize: "10px",
                      textAlign: "right",
                    },
                    "& td": {
                      p: 1,
                      bgcolor: "white",
                      borderTop: "1px solid rgba(36,74,112,.08)",
                      borderBottom: "1px solid rgba(36,74,112,.08)",
                      fontSize: "11px",
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>الرسم</th>
                      <th>القيمة</th>
                      <th>المدفوع</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalFeeRows.map((item, index) => (
                      <tr key={`${item.feeId}-${index}`}>
                        <td>{item.name}</td>
                        <td>{formatMoney(item.amount)}</td>
                        <td>{formatMoney(item.paid)}</td>
                        <td>{formatMoney(item.remaining)}</td>
                        <td>
                          <Chip
                            size="small"
                            label={mapFeeStatus(item.status)}
                          />
                        </td>
                        <td>
                          {permissions?.edit && item.remaining > 0 ? (
                            <Button
                              variant="contained"
                              onClick={() => {
                                setSelectedAdditionalFee(item);
                                setAdditionalPayOpen(true);
                              }}
                              sx={{
                                minHeight: 34,
                                borderRadius: "9px",
                                fontSize: "9.5px",
                                fontWeight: 800,
                              }}
                            >
                              تسجيل سداد
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Paper>
          )}

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              p: {
                xs: 1.5,
                md: 2,
              },
              border:
                "1px solid rgba(36,74,112,.09)",
              borderRadius:
                "18px",
              bgcolor:
                "var(--color-cream)",
            }}
          >
            <Stack
              direction={{
                xs:
                  "column",
                md: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs:
                  "stretch",
                md:
                  "center",
              }}
              gap={1}
              sx={{
                mb: 1.5,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "16px",
                    fontWeight:
                      800,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  أقساط المصروفات
                  الدراسية
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize:
                      "10px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  الدفع الجزئي
                  مسموح حتى
                  قيمة المتبقي
                  في القسط.
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                alignItems={{
                  xs: "stretch",
                  sm: "center",
                }}
                gap={1}
              >
                <Typography
                  sx={{
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
                    color:
                      "var(--color-muted)",
                  }}
                >
                  المتبقي الكلي:{" "}
                  {formatMoney(
                    remaining
                  )}
                </Typography>

                {permissions?.edit && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={
                      handleOpenSwitchPlan
                    }
                    disabled={
                      totalPaid > 0 ||
                      installmentPlansLoading ||
                      availableInstallmentPlans.length === 0
                    }
                    title={
                      totalPaid > 0
                        ? "لا يمكن تغيير الخطة بعد تسجيل دفعات"
                        : "تغيير خطة التقسيط"
                    }
                    sx={{
                      borderRadius:
                        "10px",
                      fontWeight:
                        800,
                      fontSize:
                        "10px",
                      textTransform:
                        "none",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    تغيير خطة التقسيط
                  </Button>
                )}
              </Stack>
            </Stack>

            {installments.length ===
            0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign:
                    "center",
                  border:
                    "1px dashed rgba(36,74,112,.16)",
                  borderRadius:
                    "14px",
                  color:
                    "var(--color-muted)",
                  fontSize:
                    "11px",
                }}
              >
                لا توجد أقساط
                لعرضها.
              </Box>
            ) : (
              <Stack
                spacing={1}
              >
                {installments.map(
                  (
                    installment
                  ) => {
                    const amount =
                      numberOf(
                        installment
                          ?.amount
                      );

                    const paid =
                      numberOf(
                        installment
                          ?.paidAmount
                      );

                    const installmentRemaining =
                      Math.max(
                        amount -
                          paid,
                        0
                      );

                    const progress =
                      amount >
                      0
                        ? Math.min(
                            100,
                            Math.max(
                              0,
                              (paid /
                                amount) *
                                100
                            )
                          )
                        : 0;

                    const installmentStatus =
                      installment
                        ?.status ===
                      "paid"
                        ? "paid"
                        : paid >
                            0
                          ? "partial"
                          : "unpaid";

                    return (
                      <Paper
                        key={
                          installment
                            ?._id ||
                          installment
                            ?.installmentNumber
                        }
                        elevation={
                          0
                        }
                        sx={{
                          p: 1.25,
                          border:
                            "1px solid rgba(36,74,112,.10)",
                          borderRadius:
                            "13px",
                          bgcolor:
                            "#fff",
                        }}
                      >
                        <Stack
                          direction={{
                            xs:
                              "column",
                            md:
                              "row",
                          }}
                          justifyContent="space-between"
                          alignItems={{
                            xs:
                              "stretch",
                            md:
                              "center",
                          }}
                          gap={1.2}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width:
                                  30,
                                height:
                                  30,
                                borderRadius:
                                  "50%",
                                display:
                                  "grid",
                                placeItems:
                                  "center",
                                bgcolor:
                                  installmentStatus ===
                                  "paid"
                                    ? "rgba(116,201,154,.16)"
                                    : "rgba(36,74,112,.06)",
                                color:
                                  installmentStatus ===
                                  "paid"
                                    ? "#237449"
                                    : "var(--color-muted)",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {
                                installment
                                  ?.installmentNumber
                              }
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    800,
                                  color:
                                    "var(--color-navy-deep)",
                                }}
                              >
                                القسط{" "}
                                {
                                  installment
                                    ?.installmentNumber
                                }
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.2,
                                  fontSize:
                                    "9.5px",
                                  color:
                                    "var(--color-muted)",
                                }}
                              >
                                استحقاق{" "}
                                {formatDate(
                                  installment
                                    ?.dueDate
                                )}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box
                            sx={{
                              minWidth: {
                                md:
                                  180,
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              gap={1}
                            >
                              <Typography
                                sx={{
                                  fontSize:
                                    "10px",
                                  color:
                                    "var(--color-muted)",
                                }}
                              >
                                {formatMoney(
                                  paid
                                )}{" "}
                                من{" "}
                                {formatMoney(
                                  amount
                                )}
                              </Typography>

                              <Chip
                                label={statusLabel(
                                  installmentStatus
                                )}
                                size="small"
                                sx={{
                                  ...statusChipSx(
                                    installmentStatus
                                  ),
                                  fontSize:
                                    "8.5px",
                                  fontWeight:
                                    800,
                                  height:
                                    24,
                                }}
                              />
                            </Stack>

                            <LinearProgress
                              variant="determinate"
                              value={
                                progress
                              }
                              sx={{
                                mt: 0.7,
                                height:
                                  5,
                                borderRadius:
                                  10,
                                bgcolor:
                                  "rgba(36,74,112,.08)",
                                "& .MuiLinearProgress-bar":
                                  {
                                    borderRadius:
                                      10,
                                  },
                              }}
                            />

                            <Typography
                              sx={{
                                mt: 0.45,
                                fontSize:
                                  "9px",
                                color:
                                  "var(--color-muted)",
                              }}
                            >
                              المتبقي:{" "}
                              {formatMoney(
                                installmentRemaining
                              )}
                            </Typography>
                          </Box>

                          <Stack
                            direction={{
                              xs:
                                "column",
                              sm:
                                "row",
                            }}
                            gap={0.75}
                          >
                            {permissions?.edit &&
                              installmentStatus !==
                                "paid" && (
                                <Button
                                  variant="contained"
                                  onClick={() =>
                                    handleOpenPay(
                                      installment
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  sx={{
                                    minWidth:
                                      118,
                                    borderRadius:
                                      "10px",
                                    fontSize:
                                      "10px",
                                    fontWeight:
                                      800,
                                    textTransform:
                                      "none",
                                  }}
                                >
                                  تسجيل دفعة
                                </Button>
                              )}

                            {permissions?.edit &&
                              paid >
                                0 && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() =>
                                    handleOpenRefund(
                                      installment
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  sx={{
                                    minWidth:
                                      118,
                                    borderRadius:
                                      "10px",
                                    fontSize:
                                      "10px",
                                    fontWeight:
                                      800,
                                    textTransform:
                                      "none",
                                  }}
                                >
                                  تصحيح دفعة
                                </Button>
                              )}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  }
                )}
              </Stack>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              p: {
                xs: 1.5,
                md: 2,
              },
              border:
                "1px solid rgba(36,74,112,.09)",
              borderRadius:
                "18px",
              bgcolor:
                "var(--color-cream)",
            }}
          >
            <Typography
              sx={{
                fontSize:
                  "16px",
                fontWeight:
                  800,
                color:
                  "var(--color-navy-deep)",
              }}
            >
              سجل الدفعات
              والتصحيحات
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                mb: 1.5,
                fontSize:
                  "10px",
                color:
                  "var(--color-muted)",
              }}
            >
              سجل موثّق:
              التصحيح لا
              يحذف الدفعة
              الأصلية.
            </Typography>

            {paymentHistory.length ===
            0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign:
                    "center",
                  border:
                    "1px dashed rgba(36,74,112,.16)",
                  borderRadius:
                    "14px",
                  color:
                    "var(--color-muted)",
                  fontSize:
                    "11px",
                }}
              >
                لا توجد دفعات
                مسجلة حتى الآن.
              </Box>
            ) : (
              <Stack
                spacing={0}
              >
                {paymentHistory.map(
                  (event) => {
                    const type =
                      getPaymentEventType(
                        event
                      );

                    const amount =
                      getEventAmount(
                        event
                      );

                    return (
                      <Box
                        key={
                          event.eventKey
                        }
                        sx={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "14px minmax(0,1fr)",
                          gap: 1,
                          py: 1.2,
                          borderBottom:
                            "1px dashed rgba(36,74,112,.12)",
                          "&:last-of-type":
                            {
                              borderBottom:
                                "none",
                            },
                        }}
                      >
                        <Box
                          sx={{
                            width:
                              10,
                            height:
                              10,
                            mt: 0.6,
                            borderRadius:
                              "50%",
                            bgcolor:
                              type ===
                              "refund"
                                ? "#d14343"
                                : "#237449",
                          }}
                        />

                        <Stack
                          direction={{
                            xs:
                              "column",
                            sm:
                              "row",
                          }}
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize:
                                  "11px",
                                fontWeight:
                                  800,
                                color:
                                  "var(--color-navy-deep)",
                              }}
                            >
                              {type ===
                              "refund"
                                ? "تصحيح / استرداد"
                                : "دفعة"}
                              {" · "}
                              القسط{" "}
                              {
                                event
                                  ?.installmentNumber
                              }
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.2,
                                fontSize:
                                  "9.5px",
                                color:
                                  "var(--color-muted)",
                              }}
                            >
                              {getEventText(
                                event
                              )}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              textAlign: {
                                xs:
                                  "right",
                                sm:
                                  "left",
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  "12px",
                                fontWeight:
                                  800,
                                color:
                                  type ===
                                  "refund"
                                    ? "#d14343"
                                    : "#237449",
                              }}
                            >
                              {type ===
                              "refund"
                                ? "−"
                                : "+"}{" "}
                              {formatMoney(
                                amount
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.2,
                                fontSize:
                                  "9px",
                                color:
                                  "var(--color-muted)",
                              }}
                            >
                              {formatDate(
                                getPaymentDate(
                                  event
                                )
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  }
                )}
              </Stack>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              p: {
                xs: 1.5,
                md: 2,
              },
              border:
                "1px solid rgba(36,74,112,.09)",
              borderRadius:
                "18px",
              bgcolor:
                "var(--color-cream)",
            }}
          >
            <Typography
              sx={{
                fontSize:
                  "16px",
                fontWeight:
                  800,
                color:
                  "var(--color-navy-deep)",
              }}
            >
              أرصدة الخدمات
              الأخرى
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                mb: 1.5,
                fontSize:
                  "10px",
                color:
                  "var(--color-muted)",
              }}
            >
              الباص والرحلات
              والرسوم الإضافية
              مستقلة عن رصيد
              المصروفات الدراسية.
            </Typography>

            <Grid
              container
              spacing={1.25}
            >
              <Grid
                item
                xs={12}
                md={4}
              >
                <ServiceCard
                  title="الباص"
                  status={
                    bus?.enrolled
                      ? mapFeeStatus(
                          bus?.status
                        )
                      : "غير مشترك"
                  }
                  primary={
                    bus?.enrolled
                      ? `${formatMoney(
                          busRemaining
                        )} متبقي`
                      : "لا يوجد اشتراك"
                  }
                  secondary={
                    bus?.enrolled
                      ? `المدفوع ${formatMoney(
                          busPaid
                        )}`
                      : "سجل مستقل"
                  }
                  icon={
                    <DirectionsBusRounded />
                  }
                  onClick={
                    permissions?.read
                      ? () =>
                          navigate(
                            `/financial/records/${studentId}/bus`
                          )
                      : undefined
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
              >
                <ServiceCard
                  title="الرحلات"
                  status={`${trips.length} رحلة`}
                  primary={`${formatMoney(
                    tripsRemaining
                  )} متبقي`}
                  secondary="أرصدة الرحلات مستقلة"
                  icon={
                    <LocalActivityRounded />
                  }
                  onClick={
                    permissions?.read
                      ? () =>
                          navigate(
                            `/financial/records/${studentId}/trips`
                          )
                      : undefined
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
              >
                <ServiceCard
                  title="الرسوم الإضافية"
                  status={`${additionalFees.length} رسوم`}
                  primary={`${formatMoney(
                    additionalRemaining
                  )} متبقي`}
                  secondary="كتب / زي / أنشطة وغيرها"
                  icon={
                    <ReceiptLongRounded />
                  }
                  onClick={
                    permissions?.read
                      ? () =>
                          navigate(
                            "/financial/additional-fees"
                          )
                      : undefined
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              mt: 1.25,
              p: {
                xs: 1.5,
                md: 2,
              },
              border:
                "1px solid rgba(36,74,112,.09)",
              borderRadius:
                "18px",
              bgcolor:
                "var(--color-cream)",
            }}
          >
            <Stack
              direction={{
                xs:
                  "column",
                md: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs:
                  "stretch",
                md:
                  "center",
              }}
              gap={1.5}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "14px",
                    fontWeight:
                      800,
                    color:
                      "var(--color-navy-deep)",
                  }}
                >
                  خصم الرسوم
                  الدراسية
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    fontSize:
                      "10px",
                    color:
                      "var(--color-muted)",
                  }}
                >
                  {discountAmount >
                  0
                    ? `الخصم الحالي: ${
                        discount?.name ||
                        "خصم"
                      } · ${formatMoney(
                        discountAmount
                      )}`
                    : "لا يوجد خصم مطبق حاليًا."}
                </Typography>
              </Box>

              {permissions?.edit && (
                <Stack
                  direction={{
                    xs:
                      "column",
                    sm:
                      "row",
                  }}
                  gap={1}
                >
                  {discountAmount <=
                  0 ? (
                    <>
                      <FormControl
                        size="small"
                        sx={{
                          minWidth:
                            240,
                        }}
                      >
                        <InputLabel>
                          اختر خصم
                        </InputLabel>

                        <Select
                          value={
                            selectedDiscountId
                          }
                          label="اختر خصم"
                          onChange={(
                            event
                          ) =>
                            setSelectedDiscountId(
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            discountsLoading ||
                            discountLoading
                          }
                        >
                          {activeDiscounts.map(
                            (
                              item
                            ) => (
                              <MenuItem
                                key={
                                  item
                                    ?._id ||
                                  item?.id
                                }
                                value={
                                  item
                                    ?._id ||
                                  item?.id
                                }
                              >
                                {
                                  item?.name
                                }
                                {item?.percentage
                                  ? ` - ${item.percentage}%`
                                  : ""}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        onClick={
                          handleApplyDiscount
                        }
                        disabled={
                          !selectedDiscountId ||
                          discountLoading
                        }
                        sx={{
                          borderRadius:
                            "10px",
                          fontWeight:
                            800,
                          fontSize:
                            "10px",
                          textTransform:
                            "none",
                        }}
                      >
                        تطبيق الخصم
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={
                        handleRemoveDiscount
                      }
                      disabled={
                        discountLoading
                      }
                      sx={{
                        borderRadius:
                          "10px",
                        fontWeight:
                          800,
                        fontSize:
                          "10px",
                        textTransform:
                          "none",
                      }}
                    >
                      إزالة الخصم
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>

          <Dialog
            open={switchPlanOpen}
            onClose={() => {
              if (!switchPlanLoading) {
                setSwitchPlanOpen(false);
                setSelectedPlanId("");
              }
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                borderRadius: "18px",
                bgcolor: "var(--color-cream)",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 800,
                color: "var(--color-navy-deep)",
              }}
            >
              تغيير خطة التقسيط
            </DialogTitle>

            <DialogContent>
              <Typography
                sx={{
                  mb: 1.5,
                  fontSize: "10.5px",
                  color: "var(--color-muted)",
                }}
              >
                الخطة الحالية: {planName}. عند اختيار خطة مرتبطة بخصم، يقوم النظام بإعادة حساب الرسوم تلقائيًا.
              </Typography>

              <FormControl
                size="small"
                fullWidth
              >
                <InputLabel>
                  الخطة الجديدة
                </InputLabel>
                <Select
                  value={selectedPlanId}
                  label="الخطة الجديدة"
                  onChange={(event) =>
                    setSelectedPlanId(
                      event.target.value
                    )
                  }
                  disabled={
                    installmentPlansLoading ||
                    switchPlanLoading
                  }
                >
                  {availableInstallmentPlans.map(
                    (item) => {
                      const linkedDiscount =
                        item?.linkedDiscountId;
                      const percentage =
                        linkedDiscount &&
                        typeof linkedDiscount === "object"
                          ? linkedDiscount?.percentage
                          : null;

                      return (
                        <MenuItem
                          key={idOf(item)}
                          value={idOf(item)}
                        >
                          {item?.name || "خطة"}
                          {` · ${numberOf(
                            item?.numberOfInstallments
                          )} قسط`}
                          {percentage
                            ? ` · خصم ${percentage}%`
                            : ""}
                        </MenuItem>
                      );
                    }
                  )}
                </Select>
              </FormControl>

              {selectedPlan?.linkedDiscountId &&
                typeof selectedPlan.linkedDiscountId === "object" && (
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: "10px",
                      color: "var(--color-muted)",
                    }}
                  >
                    الخصم المرتبط: {selectedPlan.linkedDiscountId?.name || "خصم"}
                    {selectedPlan.linkedDiscountId?.percentage
                      ? ` (${selectedPlan.linkedDiscountId.percentage}%)`
                      : ""}
                  </Typography>
                )}
            </DialogContent>

            <DialogActions
              sx={{ p: 2, pt: 0 }}
            >
              <Button
                onClick={() => {
                  setSwitchPlanOpen(false);
                  setSelectedPlanId("");
                }}
                disabled={switchPlanLoading}
                sx={{ textTransform: "none" }}
              >
                إلغاء
              </Button>
              <Button
                variant="contained"
                onClick={handleSwitchPlan}
                disabled={
                  !selectedPlanId ||
                  switchPlanLoading
                }
                sx={{
                  borderRadius: "10px",
                  fontWeight: 800,
                  textTransform: "none",
                }}
              >
                {switchPlanLoading
                  ? "جاري التغيير..."
                  : "تأكيد تغيير الخطة"}
              </Button>
            </DialogActions>
          </Dialog>

          <AdditionalFeePayDialog
            open={additionalPayOpen}
            onClose={() => {
              if (!additionalPayLoading) {
                setAdditionalPayOpen(false);
                setSelectedAdditionalFee(null);
              }
            }}
            item={selectedAdditionalFee}
            loading={additionalPayLoading}
            onSubmit={handleAdditionalFeePayment}
          />

          <PayDialog
            open={
              payOpen
            }
            onClose={
              closeDialogs
            }
            installment={
              selectedInstallment
            }
            loading={
              actionLoading
            }
            onSubmit={
              handlePay
            }
            studentName={getStudentName(
              student
            )}
          />

          <RefundDialog
            open={
              refundOpen
            }
            onClose={
              closeDialogs
            }
            installment={
              selectedInstallment
            }
            loading={
              actionLoading
            }
            onSubmit={
              handleRefund
            }
          />
        </Box>
      </Container>
    );
  };

const AdditionalFeePayDialog = ({
  open,
  onClose,
  item,
  loading,
  onSubmit,
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
        amount: item.remaining,
        paidAt: new Date()
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
          borderRadius: "18px",
          bgcolor: "var(--color-cream)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: "var(--color-navy-deep)",
        }}
      >
        تسجيل سداد رسم إضافي
      </DialogTitle>
      <DialogContent>
        <Typography
          sx={{
            mb: 1.5,
            fontSize: "10.5px",
            color: "var(--color-muted)",
          }}
        >
          {item
            ? `${item.name} — المستحق ${formatMoney(item.remaining)}`
            : ""}
        </Typography>

        <Box
          component="form"
          id="additional-fee-payment-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ"
              error={Boolean(errors.amount)}
              helperText={
                errors.amount?.message ||
                "يجب سداد القيمة المستحقة كاملة"
              }
              inputProps={{
                min: item?.remaining || 0,
                max: item?.remaining || undefined,
                step: "any",
              }}
              {...register("amount", {
                required: "أدخل مبلغ السداد",
                valueAsNumber: true,
                validate: (value) =>
                  Math.abs(
                    Number(value) -
                      Number(item?.remaining || 0)
                  ) < 0.000001 ||
                  `المبلغ المطلوب هو ${formatMoney(
                    item?.remaining || 0
                  )}`,
              })}
            />
            <Input
              register={register}
              registerName="paidAt"
              error={errors.paidAt?.message}
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          form="additional-fee-payment-form"
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: "10px",
            fontWeight: 800,
          }}
        >
          {loading
            ? "جاري التسجيل..."
            : "تسجيل السداد"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PayDialog = ({
  open,
  onClose,
  installment,
  loading,
  onSubmit,
  studentName,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {
      errors,
    },
  } = useForm();

  const amount =
    watch("amount");

  const installmentAmount =
    numberOf(
      installment?.amount
    );

  const paidAmount =
    numberOf(
      installment?.paidAmount
    );

  const remaining =
    Math.max(
      installmentAmount -
        paidAmount,
      0
    );

  useEffect(() => {
    if (
      !open ||
      !installment
    ) {
      return;
    }

    reset({
      amount:
        remaining ||
        "",
      paidAt:
        new Date()
          .toISOString()
          .slice(0, 10),
      notes: "",
    });
  }, [
    open,
    installment,
    remaining,
    reset,
  ]);

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius:
            "16px",
        },
      }}
    >
      <DialogTitle>
        تسجيل دفعة —{" "}
        {studentName}
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            mb: 1.5,
            fontSize:
              "10px",
            color:
              "var(--color-muted)",
          }}
        >
          القسط{" "}
          {installment?.installmentNumber}
          {" · "}
          متبقي{" "}
          {formatMoney(
            remaining
          )}
        </Typography>

        <Grid
          container
          spacing={1.5}
        >
          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="amount"
              error={
                errors
                  .amount
                  ?.message
              }
              label="المبلغ المدفوع"
              type="number"
              required
              valueAsNumber
            />

            <Typography
              sx={{
                mt: 0.6,
                fontSize:
                  "9.5px",
                color:
                  "var(--color-muted)",
              }}
            >
              مدفوع بالفعل:{" "}
              {formatMoney(
                paidAmount
              )}{" "}
              من{" "}
              {formatMoney(
                installmentAmount
              )}
            </Typography>

            {Number(
              amount
            ) >
              remaining && (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize:
                    "9.5px",
                  color:
                    "#d14343",
                  fontWeight:
                    700,
                }}
              >
                المبلغ أكبر
                من المتبقي.
              </Typography>
            )}
          </Grid>

          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="paidAt"
              error={
                errors
                  .paidAt
                  ?.message
              }
              label="تاريخ الدفع"
              type="date"
              required
            />
          </Grid>

          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="notes"
              error={
                errors
                  .notes
                  ?.message
              }
              label="ملاحظات (اختياري)"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 2,
        }}
      >
        <Button
          onClick={
            onClose
          }
          disabled={
            loading
          }
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
            !Number(
              amount
            ) ||
            Number(
              amount
            ) <= 0 ||
            Number(
              amount
            ) >
              remaining
          }
        >
          تسجيل الدفعة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RefundDialog = ({
  open,
  onClose,
  installment,
  loading,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {
      errors,
    },
  } = useForm();

  const amount =
    watch("amount");

  const reason =
    watch("reason");

  const paidAmount =
    numberOf(
      installment?.paidAmount
    );

  useEffect(() => {
    if (
      !open ||
      !installment
    ) {
      return;
    }

    reset({
      amount:
        paidAmount ||
        "",
      reason: "",
      refundedAt:
        new Date()
          .toISOString()
          .slice(0, 10),
    });
  }, [
    open,
    installment,
    paidAmount,
    reset,
  ]);

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius:
            "16px",
        },
      }}
    >
      <DialogTitle>
        تصحيح / استرداد
        دفعة
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            mb: 1.5,
            fontSize:
              "10px",
            color:
              "var(--color-muted)",
          }}
        >
          المدفوع على هذا
          القسط:{" "}
          {formatMoney(
            paidAmount
          )}
        </Typography>

        <Grid
          container
          spacing={1.5}
        >
          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="amount"
              error={
                errors
                  .amount
                  ?.message
              }
              label="قيمة التصحيح"
              type="number"
              required
              valueAsNumber
            />
          </Grid>

          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="reason"
              error={
                errors
                  .reason
                  ?.message
              }
              label="سبب التصحيح"
              required
              multiline
              rows={2}
            />
          </Grid>

          <Grid
            item
            xs={12}
          >
            <Input
              register={
                register
              }
              registerName="refundedAt"
              error={
                errors
                  .refundedAt
                  ?.message
              }
              label="تاريخ التصحيح"
              type="date"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 2,
        }}
      >
        <Button
          onClick={
            onClose
          }
          disabled={
            loading
          }
        >
          إلغاء
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit(
            onSubmit
          )}
          disabled={
            loading ||
            !Number(
              amount
            ) ||
            Number(
              amount
            ) <= 0 ||
            Number(
              amount
            ) >
              paidAmount ||
            !String(
              reason ||
                ""
            ).trim()
          }
        >
          تسجيل التصحيح
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialRecordProfilePage;
