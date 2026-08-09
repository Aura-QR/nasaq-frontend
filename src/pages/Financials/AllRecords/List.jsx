import {
  Box,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
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

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import PaginationControls from "@/components/Pagination";
import FinancialClassFilter from "@/components/financial/FinancialClassFilter";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";

import {
  EmptyState,
  FilterCard,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";

import { translateGender } from "@/utils/helpers/translateGender";
import {
  formatMoney,
  mapFeeStatus,
} from "@/utils/financial/financialUtils";

import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "اسم الطالب",
  "السنة الدراسية",
  "الفصل",
  "المصروفات الدراسية",
  "المدفوع الدراسي",
  "المتبقي الدراسي",
  "رسوم إضافية",
  "الباص",
  "الرحلات",
];

const BODY = [
  "studentName",
  "academicYearLabel",
  "className",
  "tuitionFee",
  "tuitionPaid",
  "tuitionRemaining",
  "additionalFees",
  "bus",
  "trips",
];

const asArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const numberOf = (...values) => {
  for (const value of values) {
    const numeric = Number(value);

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(numeric)
    ) {
      return numeric;
    }
  }

  return 0;
};

const getStudentName = (student) =>
  student?.name ||
  [
    student?.firstName,
    student?.fatherName,
    student?.familyName,
  ]
    .filter(Boolean)
    .join(" ") ||
  student?.username ||
  student?.email ||
  "—";

const getEffectiveFee = (feeObject) => {
  if (!feeObject) {
    return 0;
  }

  if (
    feeObject?.discount ||
    feeObject?.discountApplied
  ) {
    return numberOf(
      feeObject?.netFee,
      feeObject?.amountAfterDiscount,
      feeObject?.fee,
      feeObject?.amount
    );
  }

  return numberOf(
    feeObject?.netFee,
    feeObject?.fee,
    feeObject?.amount
  );
};

const getAdditionalFeeAmount = (item) =>
  numberOf(
    item?.netFee,
    item?.fee,
    item?.amount,
    item?.additionalFeeId?.amount,
    item?.additionalFee?.amount
  );

const getAdditionalFeePaid = (item) =>
  numberOf(
    item?.totalPaid,
    item?.paidAmount
  );
const mapRecord = (
  item,
  getAcademicYearLabel
) => {
  const student =
    item?.studentId ||
    item?.student ||
    {};

  const cls =
    item?.classId ||
    item?.class ||
    {};

  const tuition =
    item?.tuition || {};

  const bus =
    item?.bus || {};

  const trips =
    asArray(item?.trips);

  const additionalFees =
    asArray(
      item?.additionalFees ||
      item?.additionalFeeAssignments ||
      item?.studentAdditionalFees
    );

  const tuitionFee =
    getEffectiveFee(tuition);

  const tuitionPaid =
    numberOf(
      tuition?.totalPaid,
      tuition?.paidAmount
    );

  const tuitionRemaining =
    Math.max(
      tuitionFee -
        tuitionPaid,
      0
    );

  const additionalTotal =
    additionalFees.reduce(
      (sum, fee) =>
        sum +
        getAdditionalFeeAmount(
          fee
        ),
      0
    );

  const additionalPaid =
    additionalFees.reduce(
      (sum, fee) =>
        sum +
        getAdditionalFeePaid(
          fee
        ),
      0
    );

  const additionalRemaining =
    Math.max(
      additionalTotal -
        additionalPaid,
      0
    );

  const busFee =
    bus?.enrolled
      ? getEffectiveFee(bus)
      : 0;

  const busPaid =
    bus?.enrolled
      ? numberOf(
          bus?.totalPaid,
          bus?.paidAmount
        )
      : 0;

  const tripsFee =
    trips.reduce(
      (sum, trip) =>
        sum +
        getEffectiveFee(trip),
      0
    );

  const tripsPaid =
    trips.reduce(
      (sum, trip) =>
        sum +
        numberOf(
          trip?.totalPaid,
          trip?.paidAmount
        ),
      0
    );

  const academicYearLabel =
    getAcademicYearLabel(
      item?.academicYearId ||
      cls?.academicYearId
    );

  const className =
    cls?.roomNumber
      ? `${cls.roomNumber} - ${
          translateGender(
            cls?.gender,
            "class"
          ) || ""
        }`
      : cls?.name || "—";

  const busText =
    !bus?.enrolled
      ? "غير مشترك"
      : `${mapFeeStatus(
          bus?.status
        )} · ${formatMoney(
          Math.max(
            busFee - busPaid,
            0
          )
        )} متبقي`;

  const tripsRemaining =
    Math.max(
      tripsFee -
        tripsPaid,
      0
    );

  return {
    id:
      student?._id ||
      student?.id ||
      item?._id ||
      item?.id,

    studentName:
      getStudentName(
        student
      ),

    academicYearLabel,
    className,

    tuitionFee:
      formatMoney(
        tuitionFee
      ),

    tuitionPaid:
      formatMoney(
        tuitionPaid
      ),

    tuitionRemaining:
      formatMoney(
        tuitionRemaining
      ),

    additionalFees:
      additionalFees.length
        ? `${additionalFees.length} رسوم · ${formatMoney(
            additionalRemaining
          )} متبقي`
        : "لا توجد",

    bus: busText,

    trips:
      trips.length
        ? `${trips.length} رحلة · ${formatMoney(
            tripsRemaining
          )} متبقي`
        : "لا توجد",

    tuitionFeeRaw:
      tuitionFee,

    tuitionPaidRaw:
      tuitionPaid,

    tuitionRemainingRaw:
      tuitionRemaining,

    additionalTotalRaw:
      additionalTotal,

    additionalPaidRaw:
      additionalPaid,

    busFeeRaw:
      busFee,

    busPaidRaw:
      busPaid,

    tripsFeeRaw:
      tripsFee,

    tripsPaidRaw:
      tripsPaid,
  };
};

const AllFinancialRecordsListPage =
  () => {
    const [
      page,
      setPage,
    ] = useState(1);

    const [
      limit,
      setLimit,
    ] = useState(10);

    const [
      studentName,
      setStudentName,
    ] = useState("");

    const [
      academicYearId,
      setAcademicYearId,
    ] = useState("");

    const [
      classId,
      setClassId,
    ] = useState("");

    const search =
      useDebounce(
        studentName,
        500
      );

    const permissions =
      usePermissions(
        "financial"
      );

    const filters =
      useMemo(
        () => ({
          studentName:
            search.trim() ||
            undefined,
          academicYearId:
            academicYearId ||
            undefined,
          classId:
            classId ||
            undefined,
          page,
          limit,
        }),
        [
          search,
          academicYearId,
          classId,
          page,
          limit,
        ]
      );

    const {
      financialRecords,
      loading,
      pagination,
    } =
      useFinancialRecords(
        filters
      );


    const recordAcademicYearIds =
      useMemo(
        () =>
          asArray(
            financialRecords
          )
            .map(
              (item) =>
                item?.academicYearId ||
                item?.classId
                  ?.academicYearId
            )
            .filter(Boolean),
        [financialRecords]
      );

    const {
      academicYearOptions,
      getAcademicYearLabel,
      loadingAcademicYears,
    } =
      useFinancialAcademicYears(
        recordAcademicYearIds
      );

    useEffect(() => {
      setClassId("");
    }, [academicYearId]);

    useEffect(() => {
      setPage(1);
    }, [
      limit,
      search,
      academicYearId,
      classId,
    ]);

    const rows =
      useMemo(
        () =>
          asArray(
            financialRecords
          ).map(
            (item) =>
              mapRecord(
                item,
                getAcademicYearLabel
              )
          ),
        [
          financialRecords,
          getAcademicYearLabel,
        ]
      );

    const tuitionDue =
      rows.reduce(
        (sum, item) =>
          sum +
          item.tuitionFeeRaw,
        0
      );

    const tuitionPaid =
      rows.reduce(
        (sum, item) =>
          sum +
          item.tuitionPaidRaw,
        0
      );

    const tuitionRemaining =
      rows.reduce(
        (sum, item) =>
          sum +
          item
            .tuitionRemainingRaw,
        0
      );

    const active =
      [
        studentName,
        academicYearId,
        classId,
      ].some(Boolean);

    const reset = () => {
      setStudentName("");
      setAcademicYearId("");
      setClassId("");
      setPage(1);
    };

    return (
      <Container>
        <Box
          dir="rtl"
          sx={{
            pb: 4,
            minWidth: 0,
          }}
        >
          <FinancialHeader
            title="السجلات المالية"
            description="ملف مركزي لكل طالب. المصروفات الدراسية والباص والرحلات والرسوم الإضافية تظل أرصدة مستقلة."
            count={
              pagination?.totalDocs ??
              pagination?.total ??
              rows.length
            }
          />

          <StatsGrid>
            <StatCard
              label="إجمالي السجلات"
              value={
                pagination?.totalDocs ??
                pagination?.total ??
                rows.length
              }
              icon={
                <AccountBalanceWalletRounded />
              }
            />

            <StatCard
              label="المصروفات الدراسية في الصفحة"
              value={formatMoney(
                tuitionDue
              )}
              icon={
                <SchoolRounded />
              }
            />

            <StatCard
              label="المدفوع الدراسي في الصفحة"
              value={formatMoney(
                tuitionPaid
              )}
              icon={
                <PaymentsRounded />
              }
            />

            <StatCard
              label="المتبقي الدراسي في الصفحة"
              value={formatMoney(
                tuitionRemaining
              )}
              icon={
                <VisibilityRounded />
              }
            />
          </StatsGrid>

          <FilterCard
            description="ابحث باسم الطالب أو حدّد السنة والفصل."
            active={active}
            onReset={reset}
          >
            <SearchFilter
              value={
                studentName
              }
              onChange={
                setStudentName
              }
              placeholder="ابحث باسم الطالب..."
            />

            <SelectFilter
              value={
                academicYearId
              }
              onChange={
                setAcademicYearId
              }
              label="السنة الدراسية"
              icon={
                SchoolRounded
              }
              allLabel="كل السنوات"
              options={
                academicYearOptions
              }
              disabled={
                loadingAcademicYears
              }
            />

            <FinancialClassFilter
              classId={classId}
              setClassId={
                setClassId
              }
              academicYearId={
                academicYearId
              }
            />
          </FilterCard>

          <SectionCard
            title="قائمة السجلات"
            description="المبالغ هنا منفصلة حسب الخدمة. افتح ملف الطالب لإدارة المصروفات والأقساط والدفعات."
          >
            {!loading &&
            rows.length === 0 ? (
              <EmptyState
                icon={
                  <SearchOffRounded />
                }
                title={
                  active
                    ? "لا توجد سجلات مطابقة للفلاتر"
                    : "لا توجد سجلات مالية لعرضها"
                }
                description={
                  active
                    ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                    : "ستظهر السجلات بعد إنشاء البيانات المالية للطلاب من الباك."
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
              <Box sx={{ p: 1 }}>
                <Table
                  headers={
                    HEADERS
                  }
                  data={rows}
                  loading={
                    loading
                  }
                  profile={
                    permissions?.read
                  }
                  body={BODY}
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
                      label="عدد السجلات"
                    />
                  )}

                <Stack
                  direction="row"
                  spacing={1}
                  mt={1.5}
                  color="text.secondary"
                  alignItems="center"
                >
                  <GroupsRounded
                    fontSize="small"
                  />

                  <Typography
                    sx={{
                      fontSize:
                        10,
                    }}
                  >
                    اضغط على
                    الطالب لفتح
                    ملفه المالي.
                    لا يتم دمج
                    أرصدة
                    المصروفات
                    والباص
                    والرحلات في
                    رصيد واحد.
                  </Typography>
                </Stack>
              </Box>
            )}
          </SectionCard>
        </Box>
      </Container>
    );
  };

export default AllFinancialRecordsListPage;
