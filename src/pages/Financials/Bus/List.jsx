import { AddCircleOutlineOutlined, School } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { enrollBus, unenrollBus } from "@/APIs/financials/bus";
import ClassFilter from "@/components/Filters/ClassFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import PaginationControls from "@/components/Pagination";
import Select from "@/components/Select/Select";
import Table from "@/components/Table/Table";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";
import { useBusCandidates, useBusList } from "@/utils/hooks/apis/financials/useBus";
import usePermissions from "@/utils/hooks/usePermissions";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const serviceTypeMap = {
  pickup: "ذهاب فقط",
  dropoff: "عودة فقط",
  both: "ذهاب وعودة",
};

const formatMoney = (value) => `${Number(value || 0)} جنيه`;

const BusListPage = () => {
  const headers = ["اسم الطالب", "السنة الدراسية", "الفصل", "نوع الخدمة", "حالة الباص", "إجمالي الرسوم", "المدفوع", "المتبقي"];
  const body = ["studentName", "academicYear", "className", "serviceType", "status", "fee", "totalPaid", "remaining"];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const permissions = usePermissions("financial");
  const { installmentPlans } = useInstallmentPlans();

  const filters = useMemo(
    () => ({
      academicYear: academicYear || undefined,
      classId: classId || undefined,
      page,
      limit,
    }),
    [academicYear, classId, page, limit],
  );

  const candidateFilters = useMemo(
    () => ({
      academicYear: academicYear || undefined,
      classId: classId || undefined,
      limit: 500,
    }),
    [academicYear, classId],
  );

  const { busRecords, loading, pagination, refetch } = useBusList(filters);
  const { candidates, refetch: refetchCandidates } = useBusCandidates(candidateFilters);

  useEffect(() => {
    setClassId("");
  }, [academicYear]);

  useEffect(() => {
    setPage(1);
  }, [limit, academicYear, classId]);

  const mappedRecords = (busRecords || []).map((item) => {
    const student = item?.student || {};
    const cls = item?.class || {};
    const bus = item?.bus || {};
    const fee = Number(bus?.discount ? bus?.netFee : bus?.fee || 0);
    const totalPaid = Number(bus?.totalPaid || 0);
    const remaining = Math.max(fee - totalPaid, 0);

    return {
      id: student?._id,
      studentName: student?.name || "—",
      academicYear: item?.academicYear || cls?.academicYear || "—",
      className: cls?.roomNumber
        ? `${cls.roomNumber} - ${translateGender(cls.gender, "class")}`
        : "—",
      serviceType: serviceTypeMap[bus?.serviceType] || "ذهاب وعودة",
      status: statusMap[bus?.status] || "غير مدفوعة",
      fee: formatMoney(fee),
      totalPaid: formatMoney(totalPaid),
      remaining: formatMoney(remaining),
    };
  });

  const planOptions = useMemo(() => {
    return (installmentPlans || []).map((plan) => ({
      ...plan,
      displayName: `${plan.name} (${plan.numberOfInstallments} قسط)${plan.isDefault ? " - افتراضية" : ""}`,
    }));
  }, [installmentPlans]);

  const candidateOptions = useMemo(() => {
    return (candidates || []).map((item) => {
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
  }, [candidates]);

  const handleUnenroll = async (studentId, setActiveDelete) => {
    setActionLoading(true);
    const response = await unenrollBus(studentId);
    if (response.status) {
      toast.success(response.message || "تم إلغاء تسجيل الطالب من خدمة الباص");
      setActiveDelete(false);
      refetch();
      refetchCandidates();
    } else {
      toast.error(response || "حدث خطأ ما أثناء إلغاء التسجيل");
    }
    setActionLoading(false);
  };

  const handleEnroll = async (form) => {
    setActionLoading(true);
    const payload = {
      fee: Number(form.fee),
      serviceType: form.serviceType,
      installmentPlanId: form.installmentPlanId || undefined,
    };

    const response = await enrollBus(form.studentId, payload);
    if (response.status) {
      toast.success(response.message || "تم تسجيل الطالب في خدمة الباص بنجاح");
      setOpenAdd(false);
      refetch();
      refetchCandidates();
    } else {
      toast.error(response || "حدث خطأ ما أثناء تسجيل الطالب في الباص");
    }
    setActionLoading(false);
  };

  return (
    <Container>
      <Grid container mb={8} spacing={{ xs: 4, sm: 6, md: 8 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الدراسية"
            icon={School}
            allLabel="كل السنوات"
            options={Years.map((year) => ({ value: year, label: year }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.25}>
          <ClassFilter classId={classId} setClassId={setClassId} academicYear={academicYear} />
        </Grid>

        <Grid item xs={12} lg={7.5} display="flex" justifyContent={{ xs: "stretch", lg: "flex-end" }}>
          {permissions?.edit && (
            <Button
              startIcon={<AddCircleOutlineOutlined />}
              variant="contained"
              onClick={() => setOpenAdd(true)}
              sx={{ p: "16px 40px", borderRadius: "8px", width: { xs: "100%", lg: "auto" } }}
            >
              إضافة طالب لخدمة الباص
            </Button>
          )}
        </Grid>
      </Grid>

      {!loading && !actionLoading && mappedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-medium text-gray-500">
          لا توجد بيانات باص لعرضها
        </div>
      ) : (
        <Table
          headers={headers}
          data={mappedRecords}
          loading={loading || actionLoading}
          profile={permissions?.read}
          deleteFn={permissions?.edit ? handleUnenroll : undefined}
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
          label="عدد الطلاب"
        />
      )}

      <EnrollBusDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleEnroll}
        loading={actionLoading}
        candidateOptions={candidateOptions}
        planOptions={planOptions}
      />
    </Container>
  );
};

const EnrollBusDialog = ({ open, onClose, onSubmit, loading, candidateOptions, planOptions }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (open) {
      reset({
        studentId: "",
        fee: "",
        serviceType: "both",
        installmentPlanId: "",
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>إضافة طالب إلى خدمة الباص</DialogTitle>
      <DialogContent>
        <Grid container spacing={6} mt={1}>
          <Grid item xs={12}>
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
            <Input
              register={register}
              registerName={"fee"}
              error={errors.fee?.message}
              label={"رسوم الباص"}
              required={true}
              type={"number"}
              valueAsNumber={true}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"serviceType"}
              data={[
                { _id: "pickup", displayName: "ذهاب فقط" },
                { _id: "dropoff", displayName: "عودة فقط" },
                { _id: "both", displayName: "ذهاب وعودة" },
              ]}
              name="displayName"
              error={errors.serviceType?.message}
              label={"نوع خدمة الباص"}
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
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 6, pb: 5 }}>
        <Button variant="outlined" onClick={onClose}>
          إلغاء
        </Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading || candidateOptions.length === 0}>
          إضافة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BusListPage;
