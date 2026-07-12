import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "@/components/Popup/Popup";
import {
  Delete,
  Download,
  Edit,
  PictureAsPdf,
  CloudUpload,
  Assignment,
  Star,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "@/utils/hooks/apis/useProject";
import { deleteProject } from "@/APIs/school/projects";
import {
  removeFileFromProject,
  addFilesToProject,
  fetchProjectSubmissions,
  gradeSubmission,
} from "@/APIs/school/projects";
import { translateGender } from "@/utils/helpers/translateGender";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { project, loading: projectLoading } = useProject(id);

  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deleteProject(id);
    if (res.status) {
      toast.success("تم حذف المشروع بنجاح");
      navigate("/school/projects");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف المشروع");
    }
  };

  //permissions
  const permissions = usePermissions("projects");

  if (projectLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Back title={"تفاصيل المشروع"} />
      </Stack>
      {project && (
        <Details item={project} setOpen={setOpen} permissions={permissions} />
      )}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذا المشروع؟"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen, permissions }) => {
  const data = [
    {
      key: "عنوان المشروع",
      value: item.title,
    },
    {
      key: "المادة",
      value: `${item.subject.subjectName} ${item.subject.subjectCode}`,
    },
    { key: "السنة الدراسية", value: item?.academicYear },
    {
      key: "تاريخ التسليم",
      value: format(new Date(item.dueDate), "eee, d MMM yyyy", { locale: ar }),
    },
    {
      key: "درجة المشروع",
      value: item.grade + (item.grade <= 10 ? " درجات" : " درجة "),
    },
    {
      key: "الفصول",
      value: item.classes
        .map(
          (cls) =>
            `${cls.academicYear} - ${cls.roomNumber} - ${translateGender(
              cls.gender,
              "class"
            )}`
        )
        .join(" / "),
    },
  ];

  return (
    <>
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
        <Accordion defaultExpanded>
          <AccordionSummary>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              width={"100%"}
            >
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight="bold">
                  {item?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${item?.academicYear} - ${item?.subject.subjectName}`}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2}>
                {permissions.edit && <Tooltip title={"تعديل المشروع"}>
                  <Link to={`/school/projects/edit/${item._id}`}>
                    <IconButton color="success" size="large">
                      <Edit />
                    </IconButton>
                  </Link>
                </Tooltip>}
                {permissions.delete && (
                  <Tooltip title={"حذف المشروع"}>
                    <IconButton
                      color="error"
                      size="large"
                      onClick={() => setOpen(true)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Divider sx={{ my: 10 }} />

            <Grid container spacing={4}>
              {data.map((field, i) => {
                const gridProps =
                  field.key === "الفصول"
                    ? { xs: 12, md: 12, lg: 12 }
                    : { xs: 12, md: 6, lg: 4 };
                return (
                  <Grid item xs={12} md={6} lg={4} key={i} {...gridProps}>
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
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Description Section */}
      <Description item={item} />

      {/* Files Section */}
      <Files item={item} permissions={permissions} />

      {/* Submissions Section */}
      <Submissions item={item} />
    </>
  );
};

const Description = ({ item }) => {
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
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight="bold">
            وصف المشروع
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
          >
            {item?.description}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const Files = ({ item, permissions }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState(null);

  const currentFileCount = item?.files?.length || 0;
  const canAddFiles = currentFileCount < 10;

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    // Check if adding these files would exceed the limit
    if (currentFileCount + files.length > 10) {
      toast.error("لا يمكن رفع أكثر من 10 ملفات");
      return;
    }

    // Check individual file size (20MB each)
    const oversizedFiles = files.filter((file) => file.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("حجم الملف يجب أن لا يتجاوز 20 ميجابايت");
      return;
    }

    setUploading(true);
    const res = await addFilesToProject(item._id, files);

    if (res.status) {
      toast.success("تم رفع الملفات بنجاح");
      window.location.reload();
    } else {
      toast.error(res || "حدث خطأ أثناء رفع الملفات");
    }

    setUploading(false);
    event.target.value = null; // Reset input
  };

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
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight="bold">
            الملفات المرفقة ({currentFileCount}/10)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />
          <Grid container spacing={4}>
            {item?.files?.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  item={file}
                  index={index}
                  projectId={item._id}
                  permissions={permissions}
                  totalFiles={currentFileCount}
                />
              </Grid>
            ))}

            {/* Upload New File Card */}
            {permissions.edit && canAddFiles && (
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Stack
                  borderRadius={"20px"}
                  border={"2px dashed"}
                  pt={24}
                  p={12}
                  width={"100%"}
                  height={"100%"}
                  overflow={"hidden"}
                  borderColor={"primary.main"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.3s",
                    bgcolor: "rgba(59, 130, 246, 0.05)",
                    "&:hover": {
                      bgcolor: "rgba(59, 130, 246, 0.1)",
                      transform: "translateY(-4px)",
                    },
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    ref={fileInputRef}
                  />

                  <Stack
                    width={64}
                    height={64}
                    borderRadius={"50%"}
                    bgcolor={"primary.main"}
                    alignItems={"center"}
                    justifyContent={"center"}
                  >
                    <CloudUpload sx={{ fontSize: 30, color: "white" }} />
                  </Stack>

                  <Typography
                    fontWeight={600}
                    fontSize={16}
                    mt={4}
                    textAlign={"center"}
                    color={"primary.main"}
                  >
                    {uploading ? "جاري الرفع..." : "رفع ملفات جديدة"}
                  </Typography>

                  <Typography
                    fontSize={12}
                    mt={2}
                    textAlign={"center"}
                    color={"text.secondary"}
                  >
                    {`يمكنك رفع ${10 - currentFileCount} ملف`}
                  </Typography>
                </Stack>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const Card = ({ item, index, projectId, permissions, totalFiles }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteFile = async () => {

    console.log("Deleting file:", item);
    setDeleting(true);
    const res = await removeFileFromProject(projectId, item.filename);

    if (res.status) {
      toast.success("تم حذف الملف بنجاح");
      window.location.reload();
      setDeleteOpen(false);
    } else {
      toast.error(res || "حدث خطأ أثناء حذف الملف");
    }

    setDeleting(false);
  };

  return (
    <>
      <Stack
        borderRadius={"20px"}
        border={"1px solid"}
        pt={24}
        p={12}
        width={"100%"}
        overflow={"hidden"}
        borderColor={"primary.border"}
        alignItems={"center"}
        position={"relative"}
      >
        {/* Delete Button */}
        {permissions.delete && (
          <Tooltip
            title={"حذف الملف"}
            arrow
          >
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 18,
                right: 20,
                bgcolor: "error.main",
                color: "white",
                "&:hover": {
                  bgcolor: "error.dark",
                },
                width: 28,
                height: 28,
                cursor: totalFiles <= 1 ? "not-allowed" : "pointer",
              }}
              onClick={() => totalFiles > 1 && setDeleteOpen(true)}
              disabled={totalFiles <= 1}
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Icon */}
        <Stack
          width={64}
          height={64}
          borderRadius={"50%"}
          bgcolor={"#3B82F626"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <PictureAsPdf sx={{ fontSize: 30, color: "primary.main" }} />
        </Stack>

        {/* Title */}
        <Typography
          fontWeight={600}
          fontSize={16}
          mt={4}
          textAlign={"center"}
          color={"secondary"}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            px: 2,
          }}
        >
          {item.filename || `ملف ${index + 1}`}
        </Typography>

        {/* Open Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download />}
          href={item.url}
          target="_blank"
          download
          fullWidth
          sx={{ py: 6, mt: 4, borderRadius: "12px" }}
        >
          تحميل الملف
        </Button>
      </Stack>

      <Popup
        open={deleteOpen}
        setOpen={setDeleteOpen}
        message={`هل أنت متأكد من حذف الملف "${item.filename}"؟`}
        type={"delete"}
        fn={handleDeleteFile}
        loading={deleting}
      />
    </>
  );
};

// ── Submissions ─────────────────────────────────────────────────────────────
const Submissions = ({ item }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchProjectSubmissions(item._id);
      if (res?.status) {
        setSubmissions(res.data || []);
      } else {
        toast.error(res || "حدث خطأ أثناء جلب التسليمات");
      }
      setLoading(false);
    };
    load();
  }, [item._id]);

  const handleGrade = async (studentId) => {
    const val = gradeInputs[studentId];
    if (val === undefined || val === "") {
      toast.error("يرجى إدخال الدرجة");
      return;
    }
    const grade = Number(val);
    if (isNaN(grade) || grade < 0 || grade > item.grade) {
      toast.error(`يجب أن تكون الدرجة بين 0 و ${item.grade}`);
      return;
    }
    setGradingId(studentId);
    const res = await gradeSubmission(item._id, studentId, grade);
    if (res?.status) {
      toast.success("تم تسجيل الدرجة بنجاح");
      setSubmissions((prev) =>
        prev.map((s) =>
          (s.student?._id || s.studentId?._id || s.studentId) === studentId
            ? { ...s, achievedGrade: grade }
            : s
        )
      );
      setGradeInputs((prev) => ({ ...prev, [studentId]: "" }));
    } else {
      toast.error(res || "حدث خطأ أثناء تسجيل الدرجة");
    }
    setGradingId(null);
  };

  const handleFileDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "file";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noreferrer");
    }
  };

  const submitted = submissions.length;
  const graded = submissions.filter(
    (s) => s.achievedGrade !== null && s.achievedGrade !== undefined
  ).length;
  const pending = submitted - graded;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF5FF" }}>
            <Assignment style={{ color: "#318dce", fontSize: 20 }} />
          </div>
          <h2 className="text-base font-bold text-[#1E293B]">تسليمات الطلاب</h2>
        </div>

        {!loading && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEF5FF] text-[#318dce]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#318dce]" />
              {submitted} سلّم
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {graded} صُحِّح
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {pending} بانتظار
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#318dce] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Assignment className="text-gray-400" style={{ fontSize: 28 }} />
            </div>
            <p className="text-sm font-semibold text-gray-400">لا توجد تسليمات حتى الآن</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((sub, i) => {
              const studentId = sub.student?._id || sub.studentId?._id || sub.studentId;
              const studentName = sub.student?.name || sub.studentId?.name || sub.studentName || `طالب ${i + 1}`;
              const isGraded = sub.achievedGrade !== null && sub.achievedGrade !== undefined;
              const filesArr = Array.isArray(sub.files) ? sub.files : [];
              const isGradingThis = gradingId === studentId;
              const initials = studentName.trim().split(" ").slice(0, 2).map((w) => w[0]).join("");

              return (
                <div
                  key={studentId || i}
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                    isGraded ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Colored top strip */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: isGraded ? "#10b981" : "#318dce" }}
                  />

                  <div className="p-4 flex flex-col gap-3">
                    {/* Student row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                          style={{ backgroundColor: isGraded ? "#10b981" : "#318dce" }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E293B]">{studentName}</p>
                          <p className="text-xs text-gray-400">{filesArr.length} ملف مرفق</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {isGraded ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <Star style={{ fontSize: 13 }} />
                          {sub.achievedGrade} / {item.grade}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          بانتظار التصحيح
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100" />

                    {/* Files */}
                    {filesArr.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {filesArr.map((file, fi) => {
                          const fixedUrl = file.url?.replace(/\[object(?:%20|\s)Object\]/g, studentId);
                          return (
                          <button
                            key={fi}
                            onClick={() => handleFileDownload(fixedUrl, file.filename || file.originalName || `ملف ${fi + 1}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#318dce] hover:text-[#318dce] hover:bg-[#EEF5FF] transition-colors duration-200"
                          >
                            <Download style={{ fontSize: 14 }} />
                            {file.filename || file.originalName || `ملف ${fi + 1}`}
                          </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Grade input row */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden flex-1 max-w-[200px] focus-within:border-[#318dce] transition-colors">
                        <span className="px-3 text-xs font-semibold text-gray-400 bg-gray-50 border-r border-gray-200 h-9 flex items-center whitespace-nowrap">
                          / {item.grade}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={item.grade}
                          step={0.5}
                          placeholder="الدرجة"
                          value={gradeInputs[studentId] ?? (isGraded ? sub.achievedGrade : "")}
                          onChange={(e) =>
                            setGradeInputs((prev) => ({ ...prev, [studentId]: e.target.value }))
                          }
                          className="flex-1 px-3 py-2 text-sm font-bold text-[#1E293B] bg-white outline-none min-w-0"
                        />
                      </div>

                      <button
                        disabled={isGradingThis}
                        onClick={() => handleGrade(studentId)}
                        className="h-9 px-5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: isGraded ? "#10b981" : "#318dce" }}
                      >
                        {isGradingThis ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isGraded ? (
                          "تعديل"
                        ) : (
                          "تصحيح"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
