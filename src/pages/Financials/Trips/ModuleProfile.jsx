import { AddCircleOutlineOutlined } from "@mui/icons-material";
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
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px 0px #0000000D",
          p: 12,
          borderRadius: "16px",
          mt: 8,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3} mb={4}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>{template?.name || "—"}</Typography>
            <Typography color="text.secondary">{template?.description || "—"}</Typography>
          </Stack>
          <Box
            sx={{
              alignSelf: { xs: "flex-start", md: "center" },
              px: 3,
              py: 1.5,
              borderRadius: "999px",
              bgcolor: "#F3F4F6",
              color: "#374151",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            المعرّف: {template?._id || "—"}
          </Box>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <StatCard label="رسوم الرحلة" value={`${Number(template?.fee || 0)} جنيه`} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard label="عدد الطلاب المشتركين" value={String(template?.enrolledCount || 0)} />
          </Grid>
        </Grid>
      </Paper>

      <Box
        mt={8}
        mb={8}
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Stack maxWidth={400} width="100%">
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
          sx={{ px: 8, py: 8, borderRadius: "8px", width: { xs: "100%", sm: "auto" } }}
        >
          إضافة طالب إلى الرحلة
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px 0px #0000000D",
          p: 12,
          borderRadius: "16px",
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1E293B]">طلاب الرحلة</h2>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#374151]">
            العدد الحالي: {displayedStudents.length}
          </span>
        </div>

        {displayedStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
            لا يوجد طلاب مطابقين لبحث الاسم
          </div>
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

const StatCard = ({ label, value }) => {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "10px",
        bgcolor: "primary.white",
        transition: ".5s",
        "&:hover": { bgcolor: "grey.100" },
      }}
    >
      <Typography variant="label" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}>
        {label}
      </Typography>
      <Typography variant="subtitle" sx={{ display: "block", fontWeight: 500, color: "text.primary" }}>
        {value}
      </Typography>
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
      PaperProps={{ sx: { borderRadius: "14px" } }}
    >
      <DialogTitle sx={{ px: 6, pt: 5, pb: 6 }}>
        <Typography variant="h6" fontWeight={700}>إضافة طالب إلى الرحلة</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 6, pt: 2, pb: 6 }}>
        <Grid container spacing={4}>
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
          px: 6,
          pb: 5,
          pt: 1,
          gap: 2,
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
