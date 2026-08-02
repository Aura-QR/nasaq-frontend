import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  BadgeOutlined,
  CalendarMonthOutlined,
  DeleteOutlineRounded,
  EditRounded,
  EmailOutlined,
  HomeOutlined,
  LocalPhoneOutlined,
  PersonOutlineRounded,
  SchoolOutlined,
  ToggleOnRounded,
} from "@mui/icons-material";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Popup from "@/components/Popup/Popup";

import {
  deleteStudent,
  toggleActiveStudent,
} from "@/APIs/users/students";

import { api } from "@/APIs/Axios";

import { formatDate } from "@/utils/helpers/dateUtils";
import { useStudent } from "@/utils/hooks/apis/useStudent";
import usePermissions from "@/utils/hooks/usePermissions";
import {
  getCurrentEnrollment,
  getStudentAcademicYearLabel,
  getStudentClassLabel,
  mergeStudentEnrollment,
} from "@/utils/helpers/studentAcademic";


const fetchStudentEnrollmentHistory =
  async (studentId) => {
    if (!studentId) {
      return {
        status: false,
        message:
          "معرّف الطالب غير موجود",
      };
    }

    try {
      const response = await api.get(
        `/enrollments/student/${studentId}`
      );

      return response.data;
    } catch (error) {
      return {
        status: false,
        message:
          error?.response?.data?.message ||
          "تعذر تحميل السجل الدراسي للطالب",
      };
    }
  };

const infoCardSx = {
  p: 1.5,
  minHeight: 88,

  display: "flex",
  alignItems: "flex-start",
  gap: 1.1,

  border: "1px solid rgba(36, 74, 112, 0.075)",
  borderRadius: "15px",

  backgroundColor: "var(--color-white)",

  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

  "&:hover": {
    transform: "translateY(-2px)",
    borderColor: "rgba(211, 164, 79, 0.22)",
    boxShadow: "0 10px 22px rgba(18, 47, 77, 0.07)",
  },
};

const DetailCard = ({
  icon,
  label,
  value,
}) => (
  <Paper elevation={0} sx={infoCardSx}>
    <Box
      sx={{
        width: 36,
        height: 36,

        display: "grid",
        placeItems: "center",
        flexShrink: 0,

        color: "var(--color-gold-dark)",
        backgroundColor: "var(--color-gold-soft)",

        border: "1px solid rgba(211, 164, 79, 0.20)",
        borderRadius: "11px",

        "& svg": {
          fontSize: 19,
        },
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-muted)",
          fontSize: "9.5px",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.55,
          overflow: "hidden",

          color: "var(--color-navy-deep)",
          fontSize: "12.5px",
          fontWeight: 800,
          lineHeight: 1.6,

          textOverflow: "ellipsis",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Paper>
);

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    student,
    setStudent,
    loading,
  } = useStudent(id);

  const [
    currentEnrollment,
    setCurrentEnrollment,
  ] = useState(null);

  const [
    enrollmentLoading,
    setEnrollmentLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    const loadEnrollment =
      async () => {
        setEnrollmentLoading(true);

        const response =
          await fetchStudentEnrollmentHistory(
            id
          );

        if (!active) return;

        setCurrentEnrollment(
          response?.status === false
            ? null
            : getCurrentEnrollment(
                response
              )
        );

        setEnrollmentLoading(false);
      };

    loadEnrollment();

    return () => {
      active = false;
    };
  }, [id]);

  const displayStudent =
    useMemo(
      () =>
        mergeStudentEnrollment(
          student,
          currentEnrollment
        ),
      [
        student,
        currentEnrollment,
      ]
    );

  const permissions =
    usePermissions("students");

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [toggleLoading, setToggleLoading] =
    useState(false);

  const handleDelete = async () => {
    try {
      const response = await deleteStudent(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء حذف الطالب"
        );
        return;
      }

      toast.success("تم حذف الطالب بنجاح");

      navigate("/users/students", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء حذف الطالب"
      );
    }
  };

  const handleToggleStatus = async () => {
    try {
      setToggleLoading(true);

      const response =
        await toggleActiveStudent(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر تغيير حالة الطالب"
        );
        return;
      }

      setStudent((previous) => ({
        ...previous,
        isActive: !previous.isActive,
      }));

      toast.success(
        "تم تغيير حالة الطالب بنجاح"
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "تعذر تغيير حالة الطالب"
      );
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading || enrollmentLoading) {
    return (
      <Container>
        <Stack spacing={1.4}>
          <Skeleton
            variant="rounded"
            height={145}
            sx={{ borderRadius: "20px" }}
          />
          <Grid container spacing={1.3}>
            {[...Array(9)].map((_, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                lg={4}
                key={index}
              >
                <Skeleton
                  variant="rounded"
                  height={88}
                  sx={{
                    borderRadius: "15px",
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            minHeight: 220,
            display: "grid",
            placeItems: "center",
            borderRadius: "18px",
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-navy-deep)",
              fontWeight: 800,
            }}
          >
            لم يتم العثور على بيانات الطالب
          </Typography>
        </Paper>
      </Container>
    );
  }

  const fullName = [
    displayStudent.firstName,
    displayStudent.fatherName,
    displayStudent.familyName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Container>
      <Stack spacing={1.5}>
        <Back title="تفاصيل الطالب" />

        <StudentHeader
          student={displayStudent}
          fullName={fullName}
          permissions={permissions}
          toggleLoading={toggleLoading}
          onToggleStatus={handleToggleStatus}
          onDelete={() => setDeleteOpen(true)}
        />

        <StudentDetails
          student={displayStudent}
        />
      </Stack>

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message={`هل أنت متأكد من حذف الطالب «${fullName}»؟`}
        type="delete"
        fn={handleDelete}
      />
    </Container>
  );
};

const StudentHeader = ({
  student,
  fullName,
  permissions,
  toggleLoading,
  onToggleStatus,
  onDelete,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: {
        xs: 1.7,
        md: 2.2,
      },

      display: "flex",
      flexDirection: {
        xs: "column",
        md: "row",
      },
      alignItems: {
        xs: "stretch",
        md: "center",
      },
      justifyContent: "space-between",
      gap: 2,

      border: "1px solid rgba(36, 74, 112, 0.08)",
      borderRadius: "20px",

      background:
        "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.48))",

      boxShadow: "0 12px 28px rgba(18, 47, 77, 0.07)",
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.4}
    >
      <Avatar
        sx={{
          width: 58,
          height: 58,

          color: "var(--color-navy-deep)",
          backgroundColor: "var(--color-gold-soft)",

          border: "1px solid rgba(211, 164, 79, 0.26)",

          fontSize: "21px",
          fontWeight: 800,
        }}
      >
        {fullName.charAt(0)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={0.8}
        >
          <Typography
            component="h1"
            sx={{
              color: "var(--color-navy-deep)",
              fontSize: {
                xs: "20px",
                md: "25px",
              },
              fontWeight: 800,
            }}
          >
            {fullName}
          </Typography>

          <Chip
            label={
              student.isActive
                ? "طالب نشط"
                : "غير نشط"
            }
            size="small"
            sx={{
              color: student.isActive
                ? "#287a51"
                : "var(--color-danger)",

              backgroundColor: student.isActive
                ? "rgba(116, 201, 154, 0.16)"
                : "rgba(201, 79, 79, 0.10)",

              border: `1px solid ${
                student.isActive
                  ? "rgba(116, 201, 154, 0.24)"
                  : "rgba(201, 79, 79, 0.18)"
              }`,

              fontSize: "9.5px",
              fontWeight: 800,
            }}
          />
        </Stack>

        <Typography
          sx={{
            mt: 0.45,
            color: "var(--color-muted)",
            fontSize: "10.5px",
          }}
        >
          {getStudentAcademicYearLabel(
            student
          )}
          {" • "}
          {getStudentClassLabel(
            student
          ) === "لا يوجد"
            ? "بدون فصل"
            : `الفصل ${getStudentClassLabel(
                student
              )}`}
        </Typography>
      </Box>
    </Stack>

    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={1}
      sx={{
        flexShrink: 0,
      }}
    >
      {permissions.edit && (
        <>
          <Button
            type="button"
            disabled={toggleLoading}
            onClick={onToggleStatus}
            startIcon={<ToggleOnRounded />}
            variant="outlined"
            sx={{
              minHeight: 42,
              px: 1.7,

              borderRadius: "12px",

              color: "var(--color-navy)",
              borderColor: "rgba(36, 74, 112, 0.16)",

              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon": {
                marginLeft: "6px",
                marginRight: 0,
              },
            }}
          >
            تغيير الحالة
          </Button>

          <Button
            component={Link}
            to={`/users/students/edit/${student._id}`}
            startIcon={<EditRounded />}
            variant="contained"
            sx={{
              minHeight: 42,
              px: 1.9,

              borderRadius: "12px",

              color: "var(--color-white)",
              background:
                "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

              boxShadow: "0 8px 18px rgba(18, 47, 77, 0.16)",

              fontSize: "11px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon": {
                marginLeft: "6px",
                marginRight: 0,
              },
            }}
          >
            تعديل البيانات
          </Button>
        </>
      )}

      {permissions.delete && (
        <Tooltip title="حذف الطالب">
          <IconButton
            type="button"
            onClick={onDelete}
            sx={{
              width: 42,
              height: 42,

              color: "var(--color-danger)",
              backgroundColor: "rgba(201, 79, 79, 0.07)",

              border: "1px solid rgba(201, 79, 79, 0.13)",
              borderRadius: "12px",

              "&:hover": {
                color: "var(--color-white)",
                backgroundColor: "var(--color-danger)",
              },
            }}
          >
            <DeleteOutlineRounded />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  </Paper>
);

const StudentDetails = ({ student }) => {
  const classValue =
    getStudentClassLabel(
      student
    );

  const academicYearValue =
    getStudentAcademicYearLabel(
      student
    );

  const data = [
    {
      label: "تاريخ الميلاد",
      value: student.birthDate
        ? formatDate(
            new Date(
              student.birthDate
            ),
            "eee, dd MMM yyyy"
          )
        : "—",
      icon: <CalendarMonthOutlined />,
    },
    {
      label: "النوع",
      value:
        student.gender === "male"
          ? "ولد"
          : student.gender === "female"
          ? "بنت"
          : "—",
      icon: <PersonOutlineRounded />,
    },
    {
      label: "الجنسية",
      value:
        student.nationality ||
        "—",
      icon: <BadgeOutlined />,
    },
    {
      label: "السنة الدراسية",
      value:
        academicYearValue,
      icon: <SchoolOutlined />,
    },
    {
      label: "الفصل",
      value: classValue,
      icon: <SchoolOutlined />,
    },
    {
      label: "رقم الهاتف",
      value:
        student.phoneNumber ||
        student.phone ||
        "لا يوجد",
      icon: <LocalPhoneOutlined />,
    },
    {
      label: "البريد الإلكتروني",
      value:
        student.email ||
        "—",
      icon: <EmailOutlined />,
    },
    {
      label: "العنوان",
      value:
        student.address ||
        "—",
      icon: <HomeOutlined />,
    },
    {
      label: "المدرسة السابقة",
      value:
        student.previousSchool ||
        "لا يوجد",
      icon: <SchoolOutlined />,
    },
    {
      label: "تاريخ التسجيل",
      value:
        student.registrationDate
          ? formatDate(
              new Date(
                student.registrationDate
              ),
              "eee, dd MMM yyyy"
            )
          : "—",
      icon: <CalendarMonthOutlined />,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.5,
          md: 1.9,
        },

        border:
          "1px solid rgba(36, 74, 112, 0.08)",
        borderRadius: "20px",
        backgroundColor:
          "var(--color-cream)",
        boxShadow:
          "0 10px 24px rgba(18, 47, 77, 0.055)",
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="h2"
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          بيانات الطالب
        </Typography>

        <Typography
          sx={{
            mt: 0.25,
            color:
              "var(--color-muted)",
            fontSize: "9.5px",
          }}
        >
          البيانات الشخصية والدراسية
          وبيانات التواصل.
        </Typography>
      </Box>

      <Grid
        container
        spacing={1.2}
      >
        {data.map((field) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={4}
            key={field.label}
          >
            <DetailCard
              {...field}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <DetailCard
            icon={
              <BadgeOutlined />
            }
            label="ملاحظات"
            value={
              student.notes ||
              "—"
            }
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Profile;
