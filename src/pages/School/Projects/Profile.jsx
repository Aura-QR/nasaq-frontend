import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AssignmentRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  DownloadRounded,
  EditRounded,
  GradeRounded,
  GroupsRounded,
  MenuBookRounded,
  PendingActionsRounded,
  PictureAsPdfRounded,
  SchoolRounded,
  StarRounded,
} from "@mui/icons-material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { format, isValid } from "date-fns";
import { ar } from "date-fns/locale";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Popup from "@/components/Popup/Popup";
import Loading from "@/components/Loading";
import { useProject } from "@/utils/hooks/apis/useProject";
import {
  addFilesToProject,
  deleteProject,
  fetchProjectSubmissions,
  gradeSubmission,
  removeFileFromProject,
} from "@/APIs/school/projects";
import { translateGender } from "@/utils/helpers/translateGender";
import usePermissions from "@/utils/hooks/usePermissions";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const getArray = (value) => (Array.isArray(value) ? value : []);

const getResponseData = (response) =>
  response?.data?.data || response?.data || response;

const getResponseList = (response) => {
  const payload = getResponseData(response);
  if (Array.isArray(payload)) return payload;
  return payload?.docs || payload?.items || payload?.results || [];
};

const getErrorMessage = (response, fallback) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string" ? response : fallback);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (!isValid(date)) return "—";
  return format(date, "eee، d MMM yyyy", { locale: ar });
};

const getClassLabel = (item) => {
  if (!item) return "—";
  if (typeof item === "string") return item;
  return [
    item?.academicYear,
    item?.roomNumber,
    translateGender(item?.gender, "class"),
  ]
    .filter(Boolean)
    .join(" - ");
};

const SectionHeader = ({ icon, title, description, endContent }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "stretch", sm: "center" }}
    justifyContent="space-between"
    gap={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom: "1px solid rgba(36,74,112,.07)",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          color: "var(--color-gold-dark)",
          backgroundColor: "var(--color-gold-soft)",
          borderRadius: "12px",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            color: "var(--color-navy-deep)",
            fontSize: "16px",
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>
        {!!description && (
          <Typography
            sx={{
              mt: 0.2,
              color: "var(--color-muted)",
              fontSize: "10px",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
    {endContent}
  </Stack>
);

const DetailCard = ({ icon, label, value, wide }) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: 82,
      p: 1.25,
      display: "grid",
      gridTemplateColumns: "40px minmax(0,1fr)",
      alignItems: "center",
      gap: 1,
      gridColumn: wide ? { xs: "span 2", md: "span 2" } : "auto",
      border: "1px solid rgba(36,74,112,.08)",
      borderRadius: "14px",
      backgroundColor: "var(--color-white)",
      transition: "transform .18s ease, box-shadow .18s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 10px 22px rgba(18,47,77,.08)",
      },
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        backgroundColor: "var(--color-gold-soft)",
        borderRadius: "12px",
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
        title={String(value || "—")}
        sx={{
          mt: 0.25,
          color: "var(--color-navy-deep)",
          fontSize: "12px",
          fontWeight: 800,
          lineHeight: 1.6,
          overflowWrap: "anywhere",
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
  const { project, loading } = useProject(id);
  const [item, setItem] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const permissions = usePermissions("projects");

  useEffect(() => {
    if (project) setItem(project);
  }, [project]);

  const handleDelete = async () => {
    try {
      const response = await deleteProject(id);

      if (!response?.status) {
        toast.error(getErrorMessage(response, "تعذر حذف المشروع"));
        return;
      }

      toast.success("تم حذف المشروع بنجاح");
      navigate("/school/projects");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء حذف المشروع"
      );
    }
  };

  if (loading) return <Loading />;

  if (!item) {
    return (
      <Container>
        <Paper
          elevation={0}
          sx={{
            minHeight: 300,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
          }}
        >
          <Typography sx={{ color: "var(--color-muted)", fontWeight: 700 }}>
            لم يتم العثور على بيانات المشروع
          </Typography>
        </Paper>
      </Container>
    );
  }

  const subject = item?.subject || {};
  const subjectLabel = [
    subject?.subjectName || subject?.name,
    subject?.subjectCode || subject?.code,
  ]
    .filter(Boolean)
    .join(" - ") || "—";

  const classes = getArray(
    item?.classes?.length ? item.classes : item?.classIds
  );
  const classesLabel = classes.length
    ? classes.map(getClassLabel).filter(Boolean).join(" / ")
    : "—";

  const details = [
    ["المادة", subjectLabel, <MenuBookRounded />],
    ["السنة الدراسية", item?.academicYear || "—", <SchoolRounded />],
    ["تاريخ التسليم", formatDate(item?.dueDate), <CalendarMonthRounded />],
    ["درجة المشروع", `${Number(item?.grade || 0)} درجة`, <GradeRounded />],
    ["الفصول", classesLabel, <GroupsRounded />, true],
  ];

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Back title="تفاصيل المشروع" />

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            mb: 1.25,
            p: { xs: 1.5, md: 2 },
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.42))",
            boxShadow: "0 12px 28px rgba(18,47,77,.065)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  color: "var(--color-navy-deep)",
                  fontSize: { xs: "20px", md: "24px" },
                  fontWeight: 800,
                }}
              >
                {item?.title || "تفاصيل المشروع"}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: "var(--color-muted)",
                  fontSize: "10.5px",
                }}
              >
                {`${item?.academicYear || "—"} - ${subjectLabel}`}
              </Typography>
            </Box>

            <Stack direction="row" gap={0.8} flexWrap="wrap">
              <Chip
                label={`${getArray(item?.files).length} ملف`}
                sx={{
                  height: 38,
                  color: "var(--color-navy)",
                  backgroundColor: "var(--color-gold-soft)",
                  border: "1px solid rgba(211,164,79,.24)",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              />

              {permissions.edit && (
                <Tooltip title="تعديل المشروع">
                  <IconButton
                    component={Link}
                    to={`/school/projects/edit/${item._id}`}
                    sx={{
                      width: 38,
                      height: 38,
                      color: "var(--color-navy)",
                      backgroundColor: "rgba(36,74,112,.07)",
                      borderRadius: "11px",
                    }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {permissions.delete && (
                <Tooltip title="حذف المشروع">
                  <IconButton
                    onClick={() => setDeleteOpen(true)}
                    sx={{
                      width: 38,
                      height: 38,
                      color: "var(--color-danger)",
                      backgroundColor: "rgba(201,79,79,.07)",
                      borderRadius: "11px",
                    }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              md: "repeat(3,minmax(0,1fr))",
              xl: "repeat(5,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {details.map(([label, value, icon, wide]) => (
            <DetailCard
              key={label}
              label={label}
              value={value}
              icon={icon}
              wide={wide}
            />
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            p: { xs: 1.5, md: 2 },
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 12px 28px rgba(18,47,77,.06)",
          }}
        >
          <SectionHeader
            icon={<AssignmentRounded />}
            title="وصف المشروع"
            description="التعليمات والتفاصيل المطلوبة من الطلاب."
          />
          <Typography
            sx={{
              color: "var(--color-text)",
              fontSize: "12px",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
            }}
          >
            {item?.description || "لا يوجد وصف للمشروع."}
          </Typography>
        </Paper>

        <FilesSection item={item} permissions={permissions} />
        <SubmissionsSection item={item} />

        <Popup
          open={deleteOpen}
          setOpen={setDeleteOpen}
          message="هل أنت متأكد من أنك تريد حذف هذا المشروع؟"
          type="delete"
          fn={handleDelete}
        />
      </Box>
    </Container>
  );
};

const FilesSection = ({ item, permissions }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const files = getArray(item?.files);
  const count = files.length;
  const canAdd = count < MAX_FILES;

  const validate = (selected) => {
    const newFiles = Array.from(selected || []);

    if (newFiles.some((file) => file.type !== "application/pdf")) {
      return "نوع الملف غير مدعوم. الرجاء رفع ملفات PDF فقط.";
    }

    if (count + newFiles.length > MAX_FILES) {
      return "لا يمكن رفع أكثر من 10 ملفات";
    }

    if (newFiles.some((file) => file.size > MAX_FILE_SIZE)) {
      return "حجم الملف يجب ألا يتجاوز 20 ميجابايت";
    }

    return null;
  };

  const handleUpload = async (event) => {
    const newFiles = Array.from(event.target.files || []);
    const errorMessage = validate(newFiles);
    event.target.value = "";

    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    if (!newFiles.length) return;

    setUploading(true);
    try {
      const response = await addFilesToProject(item._id, newFiles);

      if (!response?.status) {
        toast.error(getErrorMessage(response, "حدث خطأ أثناء رفع الملفات"));
        return;
      }

      toast.success("تم رفع الملفات بنجاح");
      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء رفع الملفات"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.25,
        p: { xs: 1.5, md: 2 },
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "18px",
        backgroundColor: "var(--color-cream)",
        boxShadow: "0 12px 28px rgba(18,47,77,.06)",
      }}
    >
      <SectionHeader
        icon={<PictureAsPdfRounded />}
        title={`الملفات المرفقة (${count}/${MAX_FILES})`}
        description="ملفات PDF المرفقة بتعليمات المشروع."
        endContent={
          permissions.edit && canAdd ? (
            <Button
              component="label"
              variant="outlined"
              disabled={uploading}
              startIcon={
                uploading ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <CloudUploadRounded />
                )
              }
              sx={{
                minHeight: 40,
                borderRadius: "11px",
                color: "var(--color-navy)",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "6px",
                  marginRight: 0,
                },
              }}
            >
              {uploading ? "جاري الرفع..." : "رفع ملفات"}
              <input
                ref={inputRef}
                type="file"
                hidden
                multiple
                accept="application/pdf,.pdf"
                onChange={handleUpload}
              />
            </Button>
          ) : null
        }
      />

      {files.length ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              lg: "repeat(3,minmax(0,1fr))",
              xl: "repeat(4,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {files.map((file, index) => (
            <FileCard
              key={file?._id || file?.filename || index}
              file={file}
              index={index}
              projectId={item._id}
              permissions={permissions}
              totalFiles={count}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            minHeight: 160,
            display: "grid",
            placeItems: "center",
            color: "var(--color-muted)",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          لا توجد ملفات مرفقة
        </Box>
      )}
    </Paper>
  );
};

const FileCard = ({
  file,
  index,
  projectId,
  permissions,
  totalFiles,
}) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const filename =
    file?.filename || file?.originalName || `ملف ${index + 1}`;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await removeFileFromProject(
        projectId,
        file.filename
      );

      if (!response?.status) {
        toast.error(getErrorMessage(response, "حدث خطأ أثناء حذف الملف"));
        return;
      }

      toast.success("تم حذف الملف بنجاح");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء حذف الملف"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          minHeight: 168,
          p: 1.3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          position: "relative",
          border: "1px solid rgba(36,74,112,.08)",
          borderRadius: "15px",
          backgroundColor: "var(--color-white)",
        }}
      >
        {permissions.delete && (
          <Tooltip
            title={
              totalFiles <= 1
                ? "لا يمكن حذف الملف الوحيد"
                : "حذف الملف"
            }
          >
            <span>
              <IconButton
                disabled={totalFiles <= 1}
                onClick={() => setOpen(true)}
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  width: 32,
                  height: 32,
                  color: "var(--color-danger)",
                  backgroundColor: "rgba(201,79,79,.07)",
                  borderRadius: "9px",
                }}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Box
          sx={{
            width: 52,
            height: 52,
            mt: 1,
            display: "grid",
            placeItems: "center",
            color: "var(--color-gold-dark)",
            backgroundColor: "var(--color-gold-soft)",
            borderRadius: "15px",
          }}
        >
          <PictureAsPdfRounded />
        </Box>

        <Typography
          noWrap
          title={filename}
          sx={{
            width: "100%",
            textAlign: "center",
            color: "var(--color-navy-deep)",
            fontSize: "11px",
            fontWeight: 800,
          }}
        >
          {filename}
        </Typography>

        <Button
          component="a"
          href={file?.url}
          target="_blank"
          rel="noreferrer"
          download
          fullWidth
          variant="outlined"
          startIcon={<DownloadRounded />}
          sx={{
            minHeight: 38,
            borderRadius: "10px",
            color: "var(--color-navy)",
            fontSize: "10px",
            fontWeight: 800,
            textTransform: "none",
            "& .MuiButton-startIcon": {
              marginLeft: "6px",
              marginRight: 0,
            },
          }}
        >
          تحميل الملف
        </Button>
      </Paper>

      <Popup
        open={open}
        setOpen={setOpen}
        message={`هل أنت متأكد من حذف الملف "${filename}"؟`}
        type="delete"
        fn={handleDelete}
        loading={deleting}
      />
    </>
  );
};

const SubmissionsSection = ({ item }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchProjectSubmissions(item._id);

        if (!active) return;

        if (!response?.status) {
          setSubmissions([]);
          toast.error(
            getErrorMessage(response, "حدث خطأ أثناء جلب التسليمات")
          );
          return;
        }

        setSubmissions(getResponseList(response));
      } catch (error) {
        if (active) {
          setSubmissions([]);
          toast.error(
            error?.response?.data?.message ||
              "حدث خطأ أثناء جلب التسليمات"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [item._id]);

  const maxGrade = Number(item?.grade || 0);
  const submitted = submissions.length;
  const graded = submissions.filter(
    (sub) =>
      sub?.achievedGrade !== null &&
      sub?.achievedGrade !== undefined
  ).length;
  const pending = submitted - graded;

  const handleGrade = async (studentId) => {
    const value = gradeInputs[studentId];

    if (value === undefined || value === "") {
      toast.error("يرجى إدخال الدرجة");
      return;
    }

    const grade = Number(value);
    if (Number.isNaN(grade) || grade < 0 || grade > maxGrade) {
      toast.error(`يجب أن تكون الدرجة بين 0 و ${maxGrade}`);
      return;
    }

    setGradingId(studentId);

    try {
      const response = await gradeSubmission(item._id, studentId, grade);

      if (!response?.status) {
        toast.error(
          getErrorMessage(response, "حدث خطأ أثناء تسجيل الدرجة")
        );
        return;
      }

      toast.success("تم تسجيل الدرجة بنجاح");
      setSubmissions((prev) =>
        prev.map((sub) =>
          (sub?.student?._id ||
            sub?.studentId?._id ||
            sub?.studentId) === studentId
            ? { ...sub, achievedGrade: grade }
            : sub
        )
      );
      setGradeInputs((prev) => ({ ...prev, [studentId]: "" }));
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء تسجيل الدرجة"
      );
    } finally {
      setGradingId(null);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename || "file";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noreferrer");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        border: "1px solid rgba(36,74,112,.08)",
        borderRadius: "18px",
        backgroundColor: "var(--color-cream)",
        boxShadow: "0 12px 28px rgba(18,47,77,.06)",
      }}
    >
      <SectionHeader
        icon={<AssignmentRounded />}
        title="تسليمات الطلاب"
        description="راجع الملفات المسلّمة وسجّل درجات الطلاب."
        endContent={
          !loading ? (
            <Stack direction="row" gap={0.6} flexWrap="wrap">
              <Chip label={`${submitted} سلّم`} size="small" />
              <Chip
                label={`${graded} صُحّح`}
                size="small"
                sx={{
                  color: "#237449",
                  backgroundColor: "rgba(116,201,154,.15)",
                }}
              />
              <Chip
                label={`${pending} بانتظار`}
                size="small"
                sx={{
                  color: "var(--color-gold-dark)",
                  backgroundColor: "var(--color-gold-soft)",
                }}
              />
            </Stack>
          ) : null
        }
      />

      {loading ? (
        <Box sx={{ minHeight: 180, display: "grid", placeItems: "center" }}>
          <CircularProgress
            size={28}
            sx={{ color: "var(--color-gold-dark)" }}
          />
        </Box>
      ) : !submissions.length ? (
        <Box
          sx={{
            minHeight: 180,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Stack alignItems="center" spacing={0.7}>
            <Box
              sx={{
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                color: "var(--color-gold-dark)",
                backgroundColor: "var(--color-gold-soft)",
                borderRadius: "15px",
              }}
            >
              <PendingActionsRounded />
            </Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 800 }}>
              لا توجد تسليمات حتى الآن
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={1}>
          {submissions.map((sub, index) => {
            const studentId =
              sub?.student?._id ||
              sub?.studentId?._id ||
              sub?.studentId;
            const studentName =
              sub?.student?.name ||
              sub?.studentId?.name ||
              sub?.studentName ||
              `طالب ${index + 1}`;
            const isGraded =
              sub?.achievedGrade !== null &&
              sub?.achievedGrade !== undefined;
            const files = getArray(sub?.files);
            const isGrading = gradingId === studentId;
            const initials = studentName
              .trim()
              .split(" ")
              .slice(0, 2)
              .map((word) => word[0])
              .join("");

            return (
              <Paper
                key={studentId || index}
                elevation={0}
                sx={{
                  overflow: "hidden",
                  border: isGraded
                    ? "1px solid rgba(116,201,154,.28)"
                    : "1px solid rgba(36,74,112,.08)",
                  borderRadius: "15px",
                  backgroundColor: isGraded
                    ? "rgba(116,201,154,.045)"
                    : "var(--color-white)",
                }}
              >
                <Box
                  sx={{
                    height: 4,
                    backgroundColor: isGraded
                      ? "var(--color-success)"
                      : "var(--color-navy-light)",
                  }}
                />

                <Box sx={{ p: 1.35 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: "grid",
                          placeItems: "center",
                          color: "white",
                          backgroundColor: isGraded
                            ? "var(--color-success)"
                            : "var(--color-navy-light)",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        {initials || "ط"}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "12px", fontWeight: 800 }}>
                          {studentName}
                        </Typography>
                        <Typography
                          sx={{
                            color: "var(--color-muted)",
                            fontSize: "9px",
                          }}
                        >
                          {files.length} ملف مرفق
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      icon={
                        isGraded ? <StarRounded /> : <PendingActionsRounded />
                      }
                      label={
                        isGraded
                          ? `${sub.achievedGrade} / ${maxGrade}`
                          : "بانتظار التصحيح"
                      }
                      sx={{
                        alignSelf: { xs: "flex-start", sm: "center" },
                        color: isGraded
                          ? "#237449"
                          : "var(--color-gold-dark)",
                        backgroundColor: isGraded
                          ? "rgba(116,201,154,.15)"
                          : "var(--color-gold-soft)",
                        fontSize: "9px",
                        fontWeight: 800,
                        "& .MuiChip-icon": {
                          color: "inherit",
                          fontSize: 15,
                        },
                      }}
                    />
                  </Stack>

                  {!!files.length && (
                    <Box
                      sx={{
                        mt: 1.1,
                        pt: 1.1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.7,
                        borderTop: "1px solid rgba(36,74,112,.06)",
                      }}
                    >
                      {files.map((file, fileIndex) => {
                        const fixedUrl = file?.url?.replace(
                          /\[object(?:%20|\s)Object\]/g,
                          studentId
                        );
                        const filename =
                          file?.filename ||
                          file?.originalName ||
                          `ملف ${fileIndex + 1}`;

                        return (
                          <Button
                            type="button"
                            key={fileIndex}
                            onClick={() => downloadFile(fixedUrl, filename)}
                            variant="outlined"
                            startIcon={<DownloadRounded />}
                            sx={{
                              minHeight: 34,
                              borderRadius: "9px",
                              color: "var(--color-navy)",
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "none",
                              "& .MuiButton-startIcon": {
                                marginLeft: "5px",
                                marginRight: 0,
                              },
                            }}
                          >
                            {filename}
                          </Button>
                        );
                      })}
                    </Box>
                  )}

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    gap={0.8}
                    sx={{
                      mt: 1.1,
                      pt: 1.1,
                      borderTop: "1px solid rgba(36,74,112,.06)",
                    }}
                  >
                    <TextField
                      type="number"
                      value={
                        gradeInputs[studentId] ??
                        (isGraded ? sub.achievedGrade : "")
                      }
                      onChange={(event) =>
                        setGradeInputs((prev) => ({
                          ...prev,
                          [studentId]: event.target.value,
                        }))
                      }
                      placeholder="الدرجة"
                      inputProps={{ min: 0, max: maxGrade, step: 0.5 }}
                      size="small"
                      sx={{
                        width: { xs: "100%", sm: 180 },
                        "& .MuiOutlinedInput-root": {
                          minHeight: 40,
                          borderRadius: "10px",
                          backgroundColor: "var(--color-white)",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <Typography
                            sx={{
                              ml: 0.7,
                              color: "var(--color-muted)",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            / {maxGrade}
                          </Typography>
                        ),
                      }}
                    />

                    <Button
                      type="button"
                      disabled={isGrading}
                      onClick={() => handleGrade(studentId)}
                      variant="contained"
                      startIcon={
                        isGrading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : isGraded ? (
                          <CheckCircleRounded />
                        ) : (
                          <GradeRounded />
                        )
                      }
                      sx={{
                        minHeight: 40,
                        borderRadius: "10px",
                        color: "white",
                        backgroundColor: isGraded
                          ? "var(--color-success)"
                          : "var(--color-navy)",
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "none",
                        "& .MuiButton-startIcon": {
                          marginLeft: "6px",
                          marginRight: 0,
                        },
                      }}
                    >
                      {isGraded ? "تعديل الدرجة" : "تسجيل الدرجة"}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

export default Profile;
