import {
  Box,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
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

import {
  formatMoney,
  mapFeeStatus,
} from "@/utils/financial/financialUtils";

import { translateGender } from "@/utils/helpers/translateGender";
import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

const HEADERS = [
  "اسم الطالب",
  "السنة الدراسية",
  "الفصل",
  "حالة الرسوم",
  "إجمالي المدفوع",
  "المتبقي",
];

const BODY = [
  "studentName",
  "academicYearLabel",
  "className",
  "status",
  "totalPaid",
  "remaining",
];

const STATUS_OPTIONS = [
  {
    value: "paid",
    label: "مدفوعة بالكامل",
  },
  {
    value: "partial",
    label: "جزئية",
  },
  {
    value: "unpaid",
    label: "غير مدفوعة",
  },
];

const asArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

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
  student?.email ||
  "—";

const getEffectiveFee = (
  tuition
) => {
  if (!tuition) {
    return 0;
  }

  if (
    tuition?.discount ||
    tuition?.discountApplied
  ) {
    return numberOf(
      tuition?.netFee,
      tuition
        ?.amountAfterDiscount,
      tuition?.fee
    );
  }

  return numberOf(
    tuition?.netFee,
    tuition?.fee
  );
};
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
    item?.tuition ||
    {};

  const effectiveFee =
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
      effectiveFee -
        totalPaid,
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
      : cls?.name ||
        "—";

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

    status:
      mapFeeStatus(
        tuition?.status
      ),

    statusRaw:
      tuition?.status ||
      "unpaid",

    totalPaid:
      formatMoney(
        totalPaid
      ),

    remaining:
      formatMoney(
        remaining
      ),

    totalPaidRaw:
      totalPaid,

    remainingRaw:
      remaining,
  };
};

const FinancialRecordsListPage =
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

    const [
      tuitionStatus,
      setTuitionStatus,
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
          page,
          limit,

          studentName:
            search.trim() ||
            undefined,

          academicYearId:
            academicYearId ||
            undefined,

          classId:
            classId ||
            undefined,

          tuitionStatus:
            tuitionStatus ||
            undefined,
        }),
        [
          page,
          limit,
          search,
          academicYearId,
          classId,
          tuitionStatus,
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
      tuitionStatus,
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

    const totalPaid =
      rows.reduce(
        (sum, item) =>
          sum +
          item.totalPaidRaw,
        0
      );

    const totalRemaining =
      rows.reduce(
        (sum, item) =>
          sum +
          item.remainingRaw,
        0
      );

    const fullyPaid =
      rows.filter(
        (item) =>
          item.statusRaw ===
          "paid"
      ).length;

    const active =
      [
        studentName,
        academicYearId,
        classId,
        tuitionStatus,
      ].some(Boolean);

    const reset = () => {
      setStudentName("");
      setAcademicYearId("");
      setClassId("");
      setTuitionStatus("");
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
            title="المصروفات الدراسية"
            description="تابع الرسوم والمدفوع والمتبقي لكل طالب."
            count={
              pagination
                ?.totalDocs ??
              pagination?.total ??
              rows.length
            }
          />

          <StatsGrid>
            <StatCard
              label="إجمالي السجلات"
              value={
                pagination
                  ?.totalDocs ??
                pagination
                  ?.total ??
                rows.length
              }
              icon={
                <AccountBalanceWalletRounded />
              }
            />

            <StatCard
              label="مكتملو السداد"
              value={
                fullyPaid
              }
              icon={
                <PaymentsRounded />
              }
            />

            <StatCard
              label="المدفوع في الصفحة"
              value={formatMoney(
                totalPaid
              )}
              icon={
                <VisibilityRounded />
              }
            />

            <StatCard
              label="المتبقي في الصفحة"
              value={formatMoney(
                totalRemaining
              )}
              icon={
                <GroupsRounded />
              }
            />
          </StatsGrid>

          <FilterCard
            description="ابحث باسم الطالب وحدد السنة والفصل وحالة الرسوم."
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

            <SelectFilter
              value={
                tuitionStatus
              }
              onChange={
                setTuitionStatus
              }
              label="حالة الرسوم"
              icon={
                AccountBalanceWalletRounded
              }
              allLabel="كل الحالات"
              options={
                STATUS_OPTIONS
              }
            />
          </FilterCard>

          <SectionCard
            title="قائمة المصروفات الدراسية"
            description="افتح ملف الطالب لمراجعة الخصم والأقساط وتسجيل الدفعات."
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
                    : "ستظهر سجلات المصروفات بعد إنشاء السجل المالي للطالب."
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
                  body={
                    BODY
                  }
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
              </Box>
            )}
          </SectionCard>
        </Box>
      </Container>
    );
  };

export default FinancialRecordsListPage;
