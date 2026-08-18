import { AddCircleOutlineOutlined, GroupsRounded, PaymentsRounded } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Stack, Typography, Box } from "@mui/material";
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
import { translateGender } from "@/utils/helpers/translateGender";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const ModuleTripsProfilePage = () => {
  const { tripTemplateId } = useParams();
  const navigate = useNavigate();
  const { installmentPlans } = useInstallmentPlans();

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

  const filters = useMemo(
    () => ({
      page,
      limit,
    }),
    [page, limit],
  );

  const candidateFilters = useMemo(
    () => ({
      limit: 500,
    }),
    [],
  );

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const fetchData = async () => {
    if (!tripTemplateId) return;

    setLoading(true);
    const [templateRes, studentsRes, candidatesRes] = await Promise.all([
      fetchTripTemplate(tripTemplateId),
      fetchTripTemplateStudents(tripTemplateId, filters),
      fetchTripTemplateCandidates(tripTemplateId, candidateFilters),
    ]);

    if (templateRes.status) {
      setTemplate(templateRes.data || null);
    } else {
      toast.error(templateRes || "حدث خطأ ما أثناء جلب بيانات الرحلة");
      setTemplate(null);
    }

    if (studentsRes.status) {
      setStudents(studentsRes.data || []);
      setPagination(
        studentsRes.totalDocs !== undefined && studentsRes.totalPages !== undefined
          ? { totalDocs: studentsRes.totalDocs, totalPages: studentsRes.totalPages }
          : null,
      );
    } else {
      toast.error(studentsRes || "حدث خطأ ما أثناء جلب طلاب الرحلة");
      setStudents([]);
      setPagination(null);
    }

    if (candidatesRes.status) {
      setCandidates(candidatesRes.data || []);
    } else {
      toast.error(candidatesRes || "حدث خطأ ما أثناء جلب الطلاب المتاحين");
      setCandidates([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripTemplateId, filters, candidateFilters]);

  const planOptions = (installmentPlans || []).map((plan) => ({
    ...plan,
    displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${plan.isDefault ? " - افتراضية" : ""}`,
  }));

  const candidateOptions = (candidates || []).map((item) => {
    const student = item?.student || {};
    const cls = item?.class || {};
    const classLabel = cls?.roomNumber
      ? `${cls.roomNumber} - ${translateGender(cls.gender, "class")}`
      : "بدون فصل";

    return {
      _id: student?._id,
      displayName: `${student?.name || "طالب"} (${classLabel})`,
    };
  }).filter((item) => item._id);

  const displayedStudents = useMemo(() => {
    const query = searchName.trim().toLowerCase();
    if (!query) return students;

    return (students || []).filter((item) => {
      const studentName = item?.student?.name || "";
      return studentName.toLowerCase().includes(query);
    });
  }, [students, searchName]);

  const handleRemove = async (studentId) => {
    if (!tripTemplateId || !studentId) return;

    setActionLoading(true);
    const response = await removeStudentFromTripTemplate(tripTemplateId, studentId);
    if (response.status) {
      toast.success(response.message || "تم إزالة الطالب من الرحلة بنجاح");
      await fetchData();
    } else {
      toast.error(response || "حدث خطأ ما أثناء إزالة الطالب من الرحلة");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (!template) {
    return (
      <Container>
        <Back title={"تفاصيل الرحلة"} />
        <Typography mt={8}>لا توجد بيانات لهذه الرحلة</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Back title={"تفاصيل الرحلة"} />

      <Paper
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, rgba(255,252,247,0.99), rgba(251,240,216,0.45))",
          border: "1px solid rgba(36,74,112,0.10)",
          boxShadow: "0 12px 28px rgba(18,47,77,0.055)",
          p: { xs: 1.5, md: 2 },
          borderRadius: "20px",
          mt: 1.5,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5} mb={1.5}>
          <Stack spacing={1}>
            <Typography sx={{ color: "var(--color-navy-deep)", fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}>{template?.name || "—"}</Typography>
            <Typography sx={{ color: "var(--color-muted)", fontSize: 10.5 }}>{template?.description || "لا يوجد وصف للرحلة"}</Typography>
          </Stack>
          <Box
            sx={{
              alignSelf: { xs: "flex-start", md: "center" },
              px: 1.4,
              py: 0.8,
              borderRadius: "999px",
              bgcolor: "rgba(36,74,112,0.055)",
              color: "var(--color-navy)",
              border: "1px solid rgba(36,74,112,0.10)",
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            المعرّف: {template?._id || "—"}
          </Box>
        </Stack>

        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}>
            <StatCard icon={<PaymentsRounded />} label="رسوم الرحلة" value={`${Number(template?.fee || 0).toLocaleString("ar-EG")} جنيه`} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard icon={<GroupsRounded />} label="عدد الطلاب المشتركين" value={String(template?.enrolledCount || 0)} />
          </Grid>
        </Grid>
      </Paper>

      <Box
        mt={1.5}
        mb={1.5}
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Stack maxWidth={430} width="100%">
          <SearchFilter
            value={searchName}
            onChange={setSearchName}
            placeholder="ابحث باسم الطالب"
          />
        </Stack>

        <Button
          startIcon={<AddCircleOutlineOutlined />}
          variant="contained"
          onClick={() => setOpenAdd(true)}
          sx={{
            minHeight: 46,
            px: 2.3,
            py: 1,
            borderRadius: "12px",
            width: { xs: "100%", sm: "auto" },
            fontSize: 11,
            fontWeight: 800,
            textTransform: "none",
            background: "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
            boxShadow: "0 9px 20px rgba(18,47,77,0.14)",
          }}
        >
          إضافة طالب إلى الرحلة
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "var(--color-cream)",
          border: "1px solid rgba(36,74,112,0.10)",
          boxShadow: "0 12px 28px rgba(18,47,77,0.055)",
          p: { xs: 1.1, md: 1.4 },
          borderRadius: "20px",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.2 }}>
          <Box>
            <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 16, fontWeight: 900 }}>طلاب الرحلة</Typography>
            <Typography sx={{ mt: 0.15, color: "var(--color-muted)", fontSize: 9.5 }}>إدارة الطلاب المسجلين ومتابعة حالة السداد.</Typography>
          </Box>
          <Box sx={{ px: 1.2, py: 0.55, borderRadius: "999px", color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", border: "1px solid rgba(211,164,79,0.22)", fontSize: 9, fontWeight: 900 }}>
            {displayedStudents.length} طالب
          </Box>
        </Stack>

        {displayedStudents.length === 0 ? (
          <Box sx={{ minHeight: 210, display: "grid", placeItems: "center", textAlign: "center", border: "1px dashed rgba(36,74,112,0.15)", borderRadius: "16px", bgcolor: "rgba(36,74,112,0.025)" }}>
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 14, fontWeight: 900 }}>
                {searchName ? "لا يوجد طلاب مطابقون للبحث" : "لا يوجد طلاب في الرحلة حتى الآن"}
              </Typography>
              <Typography sx={{ mt: 0.5, color: "var(--color-muted)", fontSize: 10 }}>
                {searchName ? "غيّر عبارة البحث أو امسحها." : "أضف أول طالب إلى الرحلة من الزر بالأعلى."}
              </Typography>
            </Box>
          </Box>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="rounded-r-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الطالب</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الفصل</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الحالة</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المدفوع</th>
                  <th className="bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">المتبقي</th>
                  <th className="rounded-l-xl bg-[#F9FAFB] px-3 py-3 text-right text-xs font-bold text-[#35413E]">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((item) => {
                  const student = item?.student || {};
                  const cls = item?.class || {};
                  const trip = item?.trip || {};
                  const effectiveFee = Number(trip?.discount ? trip?.netFee : trip?.fee || 0);
                  const totalPaid = Number(trip?.totalPaid || 0);
                  const remaining = Math.max(effectiveFee - totalPaid, 0);

                  return (
                    <tr key={student?._id}>
                      <td className="rounded-r-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm font-semibold text-[#1E293B]">
                        {student?.name || "—"}
                      </td>
                      <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                        {cls?.roomNumber ? `${cls?.roomNumber} - ${translateGender(cls?.gender, "class")}` : "—"}
                      </td>
                      <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trip?.status === "paid" ? "bg-[#E7F8F1] text-[#0E9F6E]" : trip?.status === "partial" ? "bg-[#EEF5FF] text-[#1D4ED8]" : "bg-[#FDECEC] text-[#D14343]"}`}>
                          {statusMap[trip?.status] || "غير مدفوعة"}
                        </span>
                      </td>
                      <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                        {totalPaid} جنيه
                      </td>
                      <td className="border border-r-0 border-l-0 border-[#E5E7EB] bg-white px-3 py-3 text-sm text-[#374151]">
                        {remaining} جنيه
                      </td>
                      <td className="rounded-l-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm">
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <Button
                            variant="contained"
                            onClick={() => navigate(`/financial/records/${student?._id}/trips/${trip?._id}`)}
                            sx={{ minWidth: 120 }}
                          >
                              التفاصيل
                            </Button>

                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleRemove(student?._id)}
                              disabled={actionLoading}
                              sx={{ minWidth: 120 }}
                            >
                              إزالة
                            </Button>
                        </Stack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Paper>

      {pagination && (
        <PaginationControls
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد الطلاب"
        />
      )}

      <EnrollDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
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
    </Container>
  );
};

const StatCard = ({ icon, label, value }) => {
  return (
    <Box
      sx={{
        p: 1.4,
        minHeight: 78,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        borderRadius: "15px",
        bgcolor: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(36,74,112,0.09)",
      }}
    >
      <Box>
        <Typography sx={{ color: "var(--color-muted)", fontWeight: 800, fontSize: 10 }}>{label}</Typography>
        <Typography sx={{ mt: 0.3, display: "block", fontWeight: 900, fontSize: 18, color: "var(--color-navy-deep)" }}>{value}</Typography>
      </Box>
      <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", border: "1px solid rgba(211,164,79,0.22)", borderRadius: "12px", "& svg": { fontSize: 20 } }}>
        {icon}
      </Box>
    </Box>
  );
};

const EnrollDialog = ({
  open,
  onClose,
  tripTemplateId,
  onDone,
  loading,
  setActionLoading,
  candidateOptions,
  planOptions,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      studentId: "",
      installmentPlanId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        studentId: "",
        installmentPlanId: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (formData) => {
    if (!tripTemplateId) return;

    setActionLoading(true);
    const response = await enrollStudentInTripTemplate(tripTemplateId, {
      studentId: formData.studentId,
      installmentPlanId: formData.installmentPlanId || undefined,
    });

    if (response.status) {
      toast.success(response.message || "تم إضافة الطالب إلى الرحلة بنجاح");
      await onDone();
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة الطالب إلى الرحلة");
    }
    setActionLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", bgcolor: "var(--color-cream)" } }}
    >
      <DialogTitle sx={{ px: 2.5, pt: 2.2, pb: 1.2 }}>
        <Typography variant="h6" fontWeight={700}>إضافة طالب إلى الرحلة</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 2.2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"studentId"}
              data={candidateOptions}
              name="displayName"
              error={errors.studentId?.message}
              label={"الطالب"}
              required={true}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"installmentPlanId"}
              data={planOptions}
              name="displayName"
              error={errors.installmentPlanId?.message}
              label={"خطة التقسيط"}
              defaultSelect="كاش بدون تقسيط"
            />
          </Grid>

          {candidateOptions.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                لا يوجد طلاب متاحون للإضافة حالياً.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          pb: 1.8,
          pt: 1.2,
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
        }}
      >
        <Button variant="outlined" onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>
          إلغاء
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || candidateOptions.length === 0}
          sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 140 }, px: 4 }}
        >
          إضافة الطالب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModuleTripsProfilePage;
