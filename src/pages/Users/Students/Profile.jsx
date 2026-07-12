import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import Popup from "@/components/Popup/Popup";
import { Delete, Edit } from "@mui/icons-material";
import { toast } from "react-toastify";
import { deleteStudent } from "@/APIs/users/students";
import { formatDate } from "@/utils/helpers/dateUtils";
import { toggleActiveStudent } from "@/APIs/users/students";
import { useStudent } from "@/utils/hooks/apis/useStudent";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";
import { useInstallmentPlan } from "@/utils/hooks/apis/financials/useInstallmentPlan";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // calling the useStudent hook to fetch the student data
  const { student, setStudent , loading } = useStudent(id);

  // handle delete
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteStudent(id);
    if (res.status) {
      toast.success("تم حذف الطالب بنجاح");
      navigate("/users/students");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف الطالب");
    }
  };

  // Handle Toggle Status
  const [toggleLoading, setToggleLoading] = useState(false);
  const handleToggleStatus = async () => {
    setToggleLoading(true);
    const res = await toggleActiveStudent(id);
    if (res.status) {
      toast.success("تم تغيير حالة الطالب بنجاح");
      setStudent((prev) => ({ ...prev, isActive: !prev.isActive })); // Toggle the status
    } else {
      toast.error(res || "حدث خطأ ما أثناء تغيير حالة الطالب");
    }
    setToggleLoading(false);
  };

  const permissions = usePermissions("students");


  // Show loading state
  if (loading) {
    return <Container>  <Loading/> </Container>;
  }

  // error state if student not found
  if (!student && !loading) {
    return (
      <Container>
        <Typography>لم يتم العثور على بيانات الطالب</Typography>
      </Container>
    );
  }


  return (
    <Container>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Back title={"تفاصيل الطالب"} />
        {/* Status */}
        {permissions.edit && <Tooltip title={"تغيير حالة الطالب"}>
          <Chip
            label={student?.isActive ? "نشط" : "غير نشط"}
            color={student?.isActive ? "success" : "error"}
            sx={{ fontSize: "14px", fontWeight: "bold", px: 2, py: 1, borderRadius: "8px" }}
            onClick={handleToggleStatus}
            clickable
            disabled={toggleLoading}
          />
        </Tooltip>}
      </Stack>
      {/* Box Content */}
      {student && (
        <Details
          item={student}
          setOpen={setOpen}
          permissions={permissions}
        />
      )}
      {/* Popup */}
      <Popup open={open} setOpen={setOpen} message={"هل انت متأكد من انك تريد حذف هذا الطالب؟"} type={"delete"} fn={handleDelete} />
    </Container>
  );
};

const Details = ({ item, setOpen , permissions }) => {
  const currentInstallmentPlanId = item?.installmentPlanId

  const { installmentPlan, loading: installmentPlanLoading } = useInstallmentPlan(currentInstallmentPlanId);

  const data = [
    { key: "الاسم الكامل", value: `${item?.firstName} ${item?.fatherName} ${item?.familyName}`},
    { key: "تاريخ الميلاد", value: item?.birthDate ? formatDate(new Date(item.birthDate), "eee, dd MMM yyyy") : "—"},
    { key: "النوع", value: item?.gender === "male" ? "ولد" : "بنت" },
    { key: "الجنسية", value: item?.nationality },
    { key: "الصف الدراسي", value: item?.academicYear },
    { key: "الفصل", value: item?.class ? `${item?.class?.academicYear} - ${item?.class?.roomNumber} - ${item?.class?.gender === "male" ? "بنين" : "بنات" }` : "لا يوجد" },
    { key: "رقم الهاتف", value: item?.phoneNumber || "لا يوجد" },
    { key: "البريد الإلكتروني", value: item?.email },
    { key: "العنوان", value: item?.address },
    { key: "المدرسة السابقة", value: item?.previousSchool || "لا يوجد" },
    {
      key: "خطة التقسيط",
      value: installmentPlanLoading
        ? "جاري تحميل الخطة..."
        : installmentPlan
        ? `${installmentPlan.name} (${installmentPlan.numberOfInstallments} قسط)`
        : currentInstallmentPlanId
          ? "خطة غير معروفة"
          : "كاش بدون تقسيط",
    },
    { key: "الحالة", value: item?.isActive ? "نشط" : "غير نشط" },
    { key: "تاريخ التسجيل", value: item?.registrationDate ? formatDate(new Date(item.registrationDate), "eee, dd MMM yyyy") : "—" },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0px 1px 2px 0px #0000000D",
        p: 12,
        borderRadius: "16px",
        mt: 10,
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Stack spacing={1}>
          <Typography
            variant="h4"
            fontWeight="bold"
          >{`${item?.firstName} ${item?.fatherName} ${item?.familyName}`}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          {permissions.edit && <Tooltip title={"تعديل بيانات الطالب"}>
            <Link to={`/users/students/edit/${item._id}`}>
              <IconButton color="success" size="large">
                <Edit />
              </IconButton>
            </Link>
          </Tooltip>}
          {permissions.delete && <Tooltip title={"حذف الطالب"}>
            <IconButton
              color="error"
              size="large"
              onClick={() => setOpen(true)}
            >
              <Delete />
            </IconButton>
          </Tooltip>}
        </Stack>
      </Stack>
      <Divider sx={{ my: 10 }} />
      {/* Body */}
      <Grid container spacing={4}>
        {data.map((field, i) => (
          <Grid item xs={12} md={6} lg={4} key={i}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                bgcolor: i % 2 === 0 ? "primary.white" : "white",
                transition: ".5s",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              <Typography
                variant="label"
                color="text.secondary"
                sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}
              >
                {field.key}
              </Typography>
              <Typography
                variant="subtitle"
                sx={{
                  display: "block",
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {field.value}
              </Typography>
            </Box>
          </Grid>
        ))}
        {/* Notes */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              bgcolor: "transparent",
              transition: ".5s",
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <Typography
              variant="label"
              color="text.secondary"
              sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}
            >
              ملاحظات
            </Typography>
            <Typography
              variant="subtitle"
              sx={{ display: "block", fontWeight: 500, color: "text.primary" }}
            >
              {item?.notes || "—"}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Profile;
