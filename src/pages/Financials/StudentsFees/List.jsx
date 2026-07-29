import {
  AccountBalanceWalletRounded,
  GroupsRounded,
  PaymentsRounded,
  RestartAltRounded,
  SchoolRounded,
  SearchOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { Box, Paper } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import ClassFilter from "@/components/Filters/ClassFilter";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import Table from "@/components/Table/Table";
import {
  EmptyState,
  FilterCard,
  FinancialHeader,
  SectionCard,
  StatCard,
  StatsGrid,
} from "@/components/financial/FinancialShell";
import Years from "@/utils/constants/Years";
import { formatMoney, mapFeeStatus } from "@/utils/financial/financialUtils";
import { translateGender } from "@/utils/helpers/translateGender";
import useDebounce from "@/utils/hooks/useDebounce";
import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
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
  "academicYear",
  "className",
  "tuitionStatus",
  "totalPaid",
  "remaining",
];

const FinancialRecordsListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [studentName, setStudentName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const [tuitionStatus, setTuitionStatus] = useState("");
  const [localPagination, setLocalPagination] = useState(null);

  const debouncedStudentName = useDebounce(studentName, 500);
  const permissions = usePermissions("financial");

  const filters = useMemo(
    () => ({
      studentName: debouncedStudentName.trim() || undefined,
      academicYear: academicYear || undefined,
      classId: classId || undefined,
      tuitionStatus: tuitionStatus || undefined,
      page,
      limit,
    }),
    [debouncedStudentName, academicYear, classId, tuitionStatus, page, limit],
  );

  const { financialRecords = [], loading, pagination } = useFinancialRecords(filters);

  useEffect(() => setClassId(""), [academicYear]);
  useEffect(() => setPage(1), [limit, debouncedStudentName, academicYear, classId, tuitionStatus]);
  useEffect(() => {
    if (pagination) setLocalPagination(pagination);
  }, [pagination]);

  const mappedRecords = financialRecords.map((item) => {
    const student = item?.studentId || item?.student || {};
    const cls = item?.classId || item?.class || {};
    const tuition = item?.tuition || {};
    const effectiveFee = Number(
      tuition?.discount ? tuition?.netFee : tuition?.fee || 0,
    );
    const totalPaid = Number(tuition?.totalPaid || 0);
    const remaining = Math.max(effectiveFee - totalPaid, 0);

    return {
      id: student?._id || student?.id,
      studentName: student?.name || "—",
      academicYear: item?.academicYear || cls?.academicYear || "—",
      className: cls?.roomNumber
        ? `${cls.roomNumber} - ${translateGender(cls.gender, "class")}`
        : "—",
      tuitionStatus: mapFeeStatus(tuition?.status),
      totalPaid: formatMoney(totalPaid),
      remaining: formatMoney(remaining),
      totalPaidRaw: totalPaid,
      remainingRaw: remaining,
    };
  });

  const currentPagination = localPagination || pagination;
  const paidCount = mappedRecords.filter((item) => item.remainingRaw === 0).length;
  const totalPaidPage = mappedRecords.reduce((sum, item) => sum + item.totalPaidRaw, 0);
  const totalRemainingPage = mappedRecords.reduce(
    (sum, item) => sum + item.remainingRaw,
    0,
  );

  const activeFilters = [studentName, academicYear, classId, tuitionStatus].filter(Boolean);
  const resetFilters = () => {
    setStudentName("");
    setAcademicYear("");
    setClassId("");
    setTuitionStatus("");
    setPage(1);
  };

  return (
    <Container>
      <Box dir="rtl" sx={{ width: "100%", minWidth: 0, pb: 4 }}>
        <FinancialHeader
          title="المصروفات الدراسية"
          description="تابع الرسوم والمدفوع والمتبقي لكل طالب."
          count={currentPagination?.totalDocs ?? mappedRecords.length}
        />

        <StatsGrid>
          <StatCard
            label="إجمالي السجلات"
            value={currentPagination?.totalDocs ?? mappedRecords.length}
            icon={<AccountBalanceWalletRounded />}
          />
          <StatCard
            label="مكتملو السداد"
            value={paidCount}
            icon={<PaymentsRounded />}
          />
          <StatCard
            label="المدفوع في الصفحة"
            value={formatMoney(totalPaidPage)}
            icon={<VisibilityRounded />}
          />
          <StatCard
            label="المتبقي في الصفحة"
            value={formatMoney(totalRemainingPage)}
            icon={<GroupsRounded />}
          />
        </StatsGrid>

        <FilterCard
          title="البحث والتصفية"
          description="ابحث باسم الطالب وحدّد السنة والفصل وحالة الرسوم."
          active={activeFilters.length > 0}
          onReset={resetFilters}
          columns="1.35fr 1fr 1fr 1fr"
        >
          <SearchFilter
            value={studentName}
            onChange={setStudentName}
            placeholder="ابحث باسم الطالب..."
          />
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={SchoolRounded}
            allLabel="كل السنوات"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
          <ClassFilter
            classId={classId}
            setClassId={setClassId}
            academicYear={academicYear}
          />
          <SelectFilter
            value={tuitionStatus}
            onChange={setTuitionStatus}
            label="حالة الرسوم"
            icon={AccountBalanceWalletRounded}
            allLabel="كل الحالات"
            options={[
              { value: "unpaid", label: "غير مدفوعة" },
              { value: "partial", label: "جزئية" },
              { value: "paid", label: "مدفوعة" },
            ]}
          />
        </FilterCard>

        <SectionCard
          title="قائمة المصروفات الدراسية"
          description="افتح ملف الطالب لمراجعة الخصم والأقساط وتسجيل الدفعات."
        >
          {!loading && mappedRecords.length === 0 ? (
            <EmptyState
              icon={<SearchOffRounded />}
              title={
                activeFilters.length
                  ? "لا توجد سجلات مطابقة للفلاتر"
                  : "لا توجد سجلات مالية لعرضها"
              }
              description={
                activeFilters.length
                  ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                  : "ستظهر سجلات المصروفات بعد إنشاء البيانات المالية للطلاب."
              }
              actionLabel={activeFilters.length ? "مسح الفلاتر" : undefined}
              onAction={activeFilters.length ? resetFilters : undefined}
            />
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={mappedRecords}
                loading={loading}
                profile={permissions?.read}
                body={BODY}
              />
              {currentPagination && mappedRecords.length > 0 && (
                <PaginationControls
                  pagination={currentPagination}
                  page={page}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
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
