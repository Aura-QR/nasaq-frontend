import { FolderCopyOutlined, School } from "@mui/icons-material";
import { Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import ClassFilter from "@/components/Filters/ClassFilter";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Container from "@/components/Container/Container";
import PaginationControls from "@/components/Pagination";
import Table from "@/components/Table/Table";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import { useFinancialRecords } from "@/utils/hooks/apis/financials/useFinancialRecords";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";


const mapFeeStatus = (status) => {
  if (status === "paid") return "مدفوعة";
  if (status === "partial") return "جزئية";
  return "غير مدفوعة";
};

const AllFinancialRecordsListPage = () => {
  const headers = [
    "اسم الطالب",
    "السنة الدراسية",
    "الفصل",
    "الرسوم الدراسية",
    "حالة الباص",
    "عدد الرحلات",
    "المدفوع الكلي",
    "المتبقي الكلي",
  ];
  const body = [
    "studentName",
    "academicYear",
    "className",
    "tuitionStatus",
    "busStatus",
    "tripsCount",
    "totalPaid",
    "remaining",
  ];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [studentName, setStudentName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const debouncedStudentName = useDebounce(studentName, 500);

  const permissions = usePermissions("financial");

  const filters = useMemo(
    () => ({
      studentName: debouncedStudentName.trim() || undefined,
      academicYear: academicYear || undefined,
      classId: classId || undefined,
      page,
      limit,
    }),
    [debouncedStudentName, academicYear, classId, page, limit],
  );

  const { financialRecords, loading, pagination } = useFinancialRecords(filters);

  useEffect(() => {
    setClassId("");
  }, [academicYear]);

  useEffect(() => {
    setPage(1);
  }, [limit, debouncedStudentName, academicYear, classId]);

  const mappedRecords = (financialRecords || []).map((item) => {
    const student = item?.studentId || {};
    const cls = item?.classId || {};

    const tuition = item?.tuition || {};
    const tuitionFee = Number(tuition?.discount ? tuition?.netFee : tuition?.fee || 0);
    const tuitionPaid = Number(tuition?.totalPaid || 0);

    const bus = item?.bus || {};
    const busFee = bus?.enrolled ? Number(bus?.discount ? bus?.netFee : bus?.fee || 0) : 0;
    const busPaid = bus?.enrolled ? Number(bus?.totalPaid || 0) : 0;

    const trips = item?.trips || [];
    const tripsFee = trips.reduce((sum, trip) => {
      return sum + Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
    }, 0);
    const tripsPaid = trips.reduce((sum, trip) => sum + Number(trip?.totalPaid || 0), 0);

    const totalFee = tuitionFee + busFee + tripsFee;
    const totalPaid = tuitionPaid + busPaid + tripsPaid;
    const remaining = Math.max(totalFee - totalPaid, 0);

    return {
      id: student?._id,
      studentName: student?.name || "—",
      academicYear: item?.academicYear || cls?.academicYear || "—",
      className: cls?.roomNumber ? `${cls.roomNumber} - ${translateGender(cls?.gender, "class")}` : "—",
      tuitionStatus: mapFeeStatus(tuition?.status),
      busStatus: bus?.enrolled ? mapFeeStatus(bus?.status) : "غير مشترك",
      tripsCount: `${trips.length} رحلة`,
      totalPaid: `${totalPaid} جنيه`,
      remaining: `${remaining} جنيه`,
    };
  });

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={4}>
          <SearchFilter
            value={studentName}
            onChange={setStudentName}
            placeholder="ابحث باسم الطالب"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={School}
            allLabel="كل السنوات"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ClassFilter classId={classId} setClassId={setClassId} academicYear={academicYear} />
        </Grid>
      </Grid>

      {!loading && mappedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد سجلات مالية شاملة لعرضها
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

      <Stack direction="row" spacing={2} mt={6} alignItems="center" color="text.secondary">
        <FolderCopyOutlined fontSize="small" />
        <span className="text-sm">يمكنك الضغط على أي طالب لعرض ملفه المالي الكامل.</span>
      </Stack>
    </Container>
  );
};

export default AllFinancialRecordsListPage;
