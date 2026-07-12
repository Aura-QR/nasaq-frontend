import { School } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import SearchFilter from "@/components/Filters/SearchFilter";
import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import Table from "@/components/Table/Table";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import useDebounce from "@/utils/hooks/useDebounce";
import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
import usePermissions from "@/utils/hooks/usePermissions";


const FinancialRecordsListPage = () => {
  const headers = ["اسم الطالب", "السنة الدراسية", "الفصل", "حالة الرسوم", "إجمالي المدفوع", "المتبقي"];
  const body = ["studentName", "academicYear", "className", "tuitionStatus", "totalPaid", "remaining"];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [studentName, setStudentName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const [tuitionStatus, setTuitionStatus] = useState("");
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

  const { financialRecords, loading, pagination } = useFinancialRecords(filters);

  useEffect(() => {
    setClassId("");
  }, [academicYear]);

  useEffect(() => {
    setPage(1);
  }, [limit, debouncedStudentName, academicYear, classId, tuitionStatus]);

  const mapStatus = (status) => {
    if (status === "paid") return "مدفوعة";
    if (status === "partial") return "جزئية";
    return "غير مدفوعة";
  };

  const mappedRecords = (financialRecords || []).map((item) => {
    const student = item?.studentId || {};
    const cls = item?.classId || {};
    const tuition = item?.tuition || {};
    const effectiveFee = tuition?.discount ? tuition?.netFee : tuition?.fee;
    const totalPaid = Number(tuition?.totalPaid || 0);
    const remaining = Math.max(Number(effectiveFee || 0) - totalPaid, 0);

    return {
      id: student?._id,
      studentName: student?.name || "—",
      academicYear: item?.academicYear || cls?.academicYear || "—",
      className: cls?.roomNumber
        ? `${cls.roomNumber} - ${translateGender(cls.gender, "class")}`
        : "—",
      tuitionStatus: mapStatus(tuition?.status),
      totalPaid: `${totalPaid} جنيه`,
      remaining: `${remaining} جنيه`,
    };
  });

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <SearchFilter
            value={studentName}
            onChange={setStudentName}
            placeholder="ابحث باسم الطالب"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={School}
            allLabel="كل السنوات"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ClassFilter classId={classId} setClassId={setClassId} academicYear={academicYear} />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <SelectFilter
            value={tuitionStatus}
            onChange={setTuitionStatus}
            label="حالة الرسوم"
            allLabel="كل الحالات"
            options={[
              { value: "unpaid", label: "غير مدفوعة" },
              { value: "partial", label: "جزئية" },
              { value: "paid", label: "مدفوعة" },
            ]}
          />
        </Grid>
      </Grid>

      {!loading && mappedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد سجلات مالية لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedRecords}
          loading={loading}
          profile={permissions?.read}
          body={body}
        />
      )}

      {pagination && (
        <PaginationControls
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد السجلات"
        />
      )}
    </Container>
  );
};

export default FinancialRecordsListPage;
