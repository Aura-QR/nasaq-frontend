import {
  AddCircleOutlineRounded,
  AccountBalanceWalletRounded,
  GroupsRounded,
  PaymentsRounded,
  PersonAddAltRounded,
  SearchOffRounded,
  TourRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  DialogHeader,
  EmptyState,
  FormActions,
  StatCard,
  StatsGrid,
  pageCardSx,
} from "@/components/financial/FinancialShell";
import { formatMoney, mapFeeStatus } from "@/utils/financial/financialUtils";
import { translateGender } from "@/utils/helpers/translateGender";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const ModuleTripsProfilePage = () => {
  const { tripTemplateId } = useParams();
  const navigate = useNavigate();
  const { installmentPlans = [] } = useInstallmentPlans();

  const [template, setTemplate] = useState(null);
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [searchName, setSearchName] = useState("");

  const filters = useMemo(() => ({ page, limit }), [page, limit]);
  const candidateFilters = useMemo(() => ({ limit: 500 }), []);

  const fetchData = async () => {
    if (!tripTemplateId) return;
    setLoading(true);
    const [templateRes, studentsRes, candidatesRes] = await Promise.all([
      fetchTripTemplate(tripTemplateId),
      fetchTripTemplateStudents(tripTemplateId, filters),
      fetchTripTemplateCandidates(tripTemplateId, candidateFilters),
    ]);

    if (templateRes?.status) setTemplate(templateRes?.data || null);
    else {
      toast.error(templateRes?.message || templateRes || "حدث خطأ أثناء جلب بيانات الرحلة");
      setTemplate(null);
    }

    if (studentsRes?.status) {
      setStudents(studentsRes?.data || []);
      setPagination(
        studentsRes?.totalDocs !== undefined
          ? {
              totalDocs: studentsRes.totalDocs,
              totalPages: studentsRes.totalPages,
              page: studentsRes.page,
              limit,
            }
          : null,
      );
    } else {
      toast.error(studentsRes?.message || studentsRes || "حدث خطأ أثناء جلب طلاب الرحلة");
      setStudents([]);
      setPagination(null);
    }

    if (candidatesRes?.status) setCandidates(candidatesRes?.data || []);
    else {
      toast.error(candidatesRes?.message || candidatesRes || "حدث خطأ أثناء جلب الطلاب المتاحين");
      setCandidates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripTemplateId, filters, candidateFilters]);

  useEffect(() => setPage(1), [limit]);

  const planOptions = installmentPlans.map((plan) => ({
    ...plan,
    displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${plan.isDefault ? " - افتراضية" : ""}`,
  }));

  const candidateOptions = candidates
    .map((item) => {
      const student = item?.student || {};
      const cls = item?.class || {};
      const classLabel = cls?.roomNumber
        ? `${cls.roomNumber} - ${translateGender(cls.gender, "class")}`
        : "بدون فصل";
      return {
        _id: student?._id || student?.id,
        displayName: `${student?.name || "طالب"} (${classLabel})`,
      };
    })
    .filter((item) => item._id);

  const displayedStudents = useMemo(() => {
    const query = searchName.trim().toLowerCase();
    if (!query) return students;
    return students.filter((item) =>
      String(item?.student?.name || "").toLowerCase().includes(query),
    );
  }, [students, searchName]);

  const totals = useMemo(
    () =>
      displayedStudents.reduce(
        (result, item) => {
          const trip = item?.trip || {};
          const fee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
          const paid = Number(trip?.totalPaid || 0);
          result.paid += paid;
          result.remaining += Math.max(fee - paid, 0);
          return result;
        },
        { paid: 0, remaining: 0 },
      ),
    [displayedStudents],
  );

  const handleRemove = async (studentId) => {
    setActionLoading(true);
    try {
      const response = await removeStudentFromTripTemplate(tripTemplateId, studentId);
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء إزالة الطالب من الرحلة");
        return;
      }
      toast.success(response?.message || "تم إزالة الطالب من الرحلة بنجاح");
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!template) {
    return (
      <Container>
        <Back title="تفاصيل الرحلة" />
        <EmptyState icon={<TourRounded />} title="لا توجد بيانات لهذه الرحلة" description="تعذر العثور على الرحلة المطلوبة." />
      </Container>
    );
  }

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, px: 1.5, py: 1.05, mb: 1.25 }}>
          <Back title="تفاصيل الرحلة" />
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 2 }, background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.42))" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
            <Box>
              <Typography component="h1" sx={{ color: "var(--color-navy-deep)", fontSize: 24, fontWeight: 800 }}>
                {template?.name || "تفاصيل الرحلة"}
              </Typography>
              <Typography sx={{ mt: 0.25, color: "var(--color-muted)", fontSize: 10 }}>
                {template?.description || "إدارة الطلاب المشتركين ورسوم الرحلة."}
              </Typography>
            </Box>
            <Chip label={`المعرّف: ${template?._id || "—"}`} size="small" sx={{ alignSelf: { xs: "flex-start", md: "center" }, color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.07)", fontWeight: 800 }} />
          </Stack>
        </Paper>

        <StatsGrid>
          <StatCard label="رسوم الرحلة" value={formatMoney(template?.fee)} icon={<AccountBalanceWalletRounded />} />
          <StatCard label="عدد المشتركين" value={template?.enrolledCount ?? students.length} icon={<GroupsRounded />} />
          <StatCard label="المدفوع في الصفحة" value={formatMoney(totals.paid)} icon={<PaymentsRounded />} />
          <StatCard label="المتبقي في الصفحة" value={formatMoney(totals.remaining)} icon={<TourRounded />} />
        </StatsGrid>

        <Paper elevation={0} sx={{ ...pageCardSx, mb: 1.25, p: { xs: 1.5, md: 1.8 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1.25}>
            <Box sx={{ width: { xs: "100%", md: 390 } }}>
              <SearchFilter value={searchName} onChange={setSearchName} placeholder="ابحث باسم الطالب..." />
            </Box>
            <Button type="button" onClick={() => setOpenAdd(true)} variant="contained" startIcon={<AddCircleOutlineRounded />} sx={{ minHeight: 42, borderRadius: "12px", background: "var(--color-navy)", fontSize: 11, fontWeight: 800, textTransform: "none" }}>
              إضافة طالب إلى الرحلة
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...pageCardSx, overflow: "hidden" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1} sx={{ px: 1.7, py: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 800 }}>طلاب الرحلة</Typography>
              <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5 }}>راجع حالة الدفع وافتح ملف الرحلة لكل طالب.</Typography>
            </Box>
            <Chip label={`العدد الحالي: ${displayedStudents.length}`} size="small" sx={{ color: "var(--color-navy)", bgcolor: "rgba(36,74,112,.07)", fontWeight: 800 }} />
          </Stack>

          {displayedStudents.length === 0 ? (
            <EmptyState
              icon={searchName ? <SearchOffRounded /> : <GroupsRounded />}
              title={searchName ? "لا يوجد طلاب مطابقون للبحث" : "لا يوجد طلاب في الرحلة"}
              description={searchName ? "جرّب البحث باسم آخر." : "أضف أول طالب إلى الرحلة."}
            />
          ) : (
            <Box sx={{ p: 1, overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", minWidth: 850, borderCollapse: "separate", borderSpacing: "0 8px", "& th": { px: 1.2, py: 1, color: "var(--color-muted)", bgcolor: "rgba(36,74,112,.045)", fontSize: 10, fontWeight: 800, textAlign: "right" }, "& td": { px: 1.2, py: 1, color: "var(--color-text)", bgcolor: "var(--color-white)", borderTop: "1px solid rgba(36,74,112,.08)", borderBottom: "1px solid rgba(36,74,112,.08)", fontSize: 11 } }}>
                <thead><tr><th>الطالب</th><th>الفصل</th><th>الحالة</th><th>المدفوع</th><th>المتبقي</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {displayedStudents.map((item) => {
                    const student = item?.student || {};
                    const cls = item?.class || {};
                    const trip = item?.trip || {};
                    const fee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
                    const paid = Number(trip?.totalPaid || 0);
                    const remaining = Math.max(fee - paid, 0);
                    return (
                      <tr key={student?._id || student?.id}>
                        <td>{student?.name || "—"}</td>
                        <td>{cls?.roomNumber ? `${cls.roomNumber} - ${translateGender(cls?.gender, "class")}` : "—"}</td>
                        <td><Chip label={mapFeeStatus(trip?.status)} size="small" sx={{ height: 26, fontSize: 9, fontWeight: 800 }} /></td>
                        <td>{formatMoney(paid)}</td>
                        <td>{formatMoney(remaining)}</td>
                        <td>
                          <Stack direction="row" gap={0.8}>
                            <Button type="button" onClick={() => navigate(`/financial/records/${student?._id}/trips/${trip?._id}`)} variant="contained" sx={{ minHeight: 34, borderRadius: "9px", fontSize: 9.5, fontWeight: 800, textTransform: "none" }}>التفاصيل</Button>
                            <Button type="button" onClick={() => handleRemove(student?._id)} disabled={actionLoading} variant="outlined" color="error" sx={{ minHeight: 34, borderRadius: "9px", fontSize: 9.5, fontWeight: 800, textTransform: "none" }}>إزالة</Button>
                          </Stack>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>
          )}

          {pagination && students.length > 0 && (
            <Box sx={{ p: 1 }}>
              <PaginationControls pagination={pagination} page={page} onPageChange={setPage} limit={limit} onLimitChange={setLimit} label="عدد الطلاب" />
            </Box>
          )}
        </Paper>

        <EnrollDialog
          open={openAdd}
          onClose={() => !actionLoading && setOpenAdd(false)}
          tripTemplateId={tripTemplateId}
          onDone={async () => {
            setOpenAdd(false);
            await fetchData();
          }}
          loading={actionLoading}
          setActionLoading={setActionLoading}
          candidateOptions={candidateOptions}
          planOptions={planOptions}
        />
      </Box>
    </Container>
  );
};

const EnrollDialog = ({ open, onClose, tripTemplateId, onDone, loading, setActionLoading, candidateOptions, planOptions }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { studentId: "", installmentPlanId: "" } });
  useEffect(() => {
    if (open) reset({ studentId: "", installmentPlanId: "" });
  }, [open, reset]);

  const onSubmit = async (formValues) => {
    setActionLoading(true);
    try {
      const response = await enrollStudentInTripTemplate(tripTemplateId, {
        studentId: formValues.studentId,
        installmentPlanId: formValues.installmentPlanId || undefined,
      });
      if (!response?.status) {
        toast.error(response?.message || response || "حدث خطأ أثناء إضافة الطالب إلى الرحلة");
        return;
      }
      toast.success(response?.message || "تم إضافة الطالب إلى الرحلة بنجاح");
      await onDone();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { overflow: "hidden", borderRadius: "20px", bgcolor: "var(--color-cream)" } }}>
      <DialogHeader icon={<PersonAddAltRounded />} title="إضافة طالب إلى الرحلة" description="اختر الطالب وخطة التقسيط المناسبة." loading={loading} onClose={onClose} />
      <DialogContent sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={1.5}>
            <Select register={register} registerName="studentId" data={candidateOptions} name="displayName" error={errors.studentId?.message} label="الطالب" required />
            <Select register={register} registerName="installmentPlanId" data={planOptions} name="displayName" error={errors.installmentPlanId?.message} label="خطة التقسيط" defaultSelect="كاش بدون تقسيط" />
            {candidateOptions.length === 0 && (
              <Typography sx={{ color: "var(--color-muted)", fontSize: 10 }}>لا يوجد طلاب متاحون للإضافة حالياً.</Typography>
            )}
          </Stack>
          <FormActions loading={loading} onCancel={onClose} label="إضافة الطالب" disabled={candidateOptions.length === 0} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleTripsProfilePage;
