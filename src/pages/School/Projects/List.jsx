import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AddCircleOutlineOutlined,
  AssignmentRounded,
  FileDownloadOutlined,
  GroupsRounded,
  MenuBookRounded,
  RestartAltRounded,
  SearchOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { format, isValid } from "date-fns";
import { ar } from "date-fns/locale";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import PaginationControls from "@/components/Pagination";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useProjects } from "@/utils/hooks/apis/useProjects";
import usePermissions from "@/utils/hooks/usePermissions";
import { deleteProject } from "@/APIs/school/projects";
import Years from "@/utils/constants/Years";
import { translateGender } from "@/utils/helpers/translateGender";
import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";

const HEADERS = [
  "عنوان المشروع",
  "المادة",
  "السنة الدراسية",
  "الفصول",
  "تاريخ التسليم",
];

const BODY = [
  "title",
  "subject",
  "academicYear",
  "classes",
  "dueDate",
];

const getArray = (value) => (Array.isArray(value) ? value : []);

const formatDueDate = (value) => {
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

const mapProjects = (data = []) =>
  getArray(data).map((item) => {
    const subjectData = item?.subject || {};
    const subjectName =
      subjectData?.subjectName ||
      subjectData?.name ||
      item?.subjectName ||
      "—";
    const subjectCode =
      subjectData?.subjectCode ||
      subjectData?.code ||
      item?.subjectCode ||
      "";
    const classes = getArray(
      item?.classes?.length ? item.classes : item?.classIds
    );

    return {
      id: item?._id || item?.id,
      title: item?.title || "—",
      subjectId:
        subjectData?._id ||
        subjectData?.id ||
        item?.subjectId ||
        "",
      subject: subjectCode
        ? `${subjectName} - ${subjectCode}`
        : subjectName,
      academicYear: item?.academicYear || "—",
      classes: classes.length
        ? classes.map(getClassLabel).filter(Boolean).join(" / ")
        : "—",
      classIds: classes
        .map((cls) => cls?._id || cls?.id || cls)
        .filter(Boolean),
      dueDate: formatDueDate(item?.dueDate),
    };
  });

const List = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit,
      academicYear: academicYear || undefined,
      subjectId: subject || undefined,
      classIds: classFilter || undefined,
    }),
    [page, limit, academicYear, subject, classFilter]
  );

  const { projects, loading, pagination } = useProjects(filters);
  const { subjects = [], loading: loadingSubjects } = useSubjects({
    page: 1,
    limit: 1000,
  });
  const permissions = usePermissions("projects");

  useEffect(() => {
    setItems(mapProjects(projects));
  }, [projects]);

  useEffect(() => {
    if (pagination) setLocalPagination(pagination);
  }, [pagination]);

  useEffect(() => {
    setPage(1);
  }, [limit, academicYear, subject, classFilter]);

  const currentPagination = localPagination || pagination;
  const activeFiltersCount = [subject, academicYear, classFilter].filter(
    Boolean
  ).length;

  const stats = useMemo(
    () => ({
      total: currentPagination?.totalDocs ?? items.length,
      visible: items.length,
      subjects: new Set(items.map((item) => item.subjectId).filter(Boolean))
        .size,
      classes: new Set(items.flatMap((item) => item.classIds)).size,
    }),
    [items, currentPagination]
  );

  const subjectOptions = getArray(subjects).map((item) => {
    const id = item?._id || item?.id;
    const name = item?.subjectName || item?.name || "—";
    const code = item?.subjectCode || item?.code || "";
    return { value: id, label: code ? `${name} - ${code}` : name };
  });

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        "عنوان المشروع": item.title,
        المادة: item.subject,
        "السنة الدراسية": item.academicYear,
        الفصول: item.classes,
        "تاريخ التسليم": item.dueDate,
      })),
    [items]
  );

  const resetFilters = () => {
    setSubject("");
    setAcademicYear("");
    setClassFilter("");
    setPage(1);
  };

  const handleDelete = async (id, setActive) => {
    try {
      const response = await deleteProject(id);

      if (!response?.status) {
        toast.error(
          response?.message || response || "تعذر حذف المشروع"
        );
        return;
      }

      toast.success("تم حذف المشروع بنجاح");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setLocalPagination((prev) =>
        prev
          ? {
              ...prev,
              totalDocs: Math.max(0, Number(prev.totalDocs || 1) - 1),
            }
          : prev
      );
      setActive(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء حذف المشروع"
      );
    }
  };

  const showEmptyState = !loading && items.length === 0;
  const hasFilters = activeFiltersCount > 0;

  const statCards = [
    ["إجمالي المشاريع", stats.total, <AssignmentRounded />],
    ["الظاهر في الصفحة", stats.visible, <VisibilityRounded />],
    ["المواد في الصفحة", stats.subjects, <MenuBookRounded />],
    ["الفصول المرتبطة", stats.classes, <GroupsRounded />],
  ];

  return (
    <Container>
      <Box dir="rtl" sx={{ width: "100%", minWidth: 0, pb: 4, overflowX: "hidden" }}>
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 2.4 },
            py: 1.5,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.42))",
            boxShadow: "0 10px 24px rgba(18,47,77,.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "21px", md: "25px" },
                    fontWeight: 800,
                  }}
                >
                  إدارة المشاريع
                </Typography>
                <Chip
                  label={currentPagination?.totalDocs ?? items.length}
                  size="small"
                  sx={{
                    height: 26,
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    border: "1px solid rgba(211,164,79,.24)",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Typography
                sx={{
                  mt: 0.45,
                  color: "var(--color-muted)",
                  fontSize: "11px",
                }}
              >
                أنشئ المشاريع واربطها بالمواد والفصول وتابع التسليمات والدرجات.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Box
                component={CSVLink}
                data={csvData}
                filename="projects.csv"
                sx={{ textDecoration: "none" }}
              >
                <Button
                  disabled={!items.length}
                  variant="outlined"
                  startIcon={<FileDownloadOutlined />}
                  sx={{
                    width: { xs: "100%", sm: 112 },
                    minHeight: 42,
                    borderRadius: "12px",
                    color: "var(--color-navy)",
                    borderColor: "rgba(36,74,112,.16)",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "7px",
                      marginRight: 0,
                    },
                  }}
                >
                  تصدير
                </Button>
              </Box>

              {permissions.add && (
                <Button
                  component={Link}
                  to="add"
                  variant="contained"
                  startIcon={<AddCircleOutlineOutlined />}
                  sx={{
                    width: { xs: "100%", sm: 170 },
                    minHeight: 42,
                    borderRadius: "12px",
                    color: "var(--color-white)",
                    background:
                      "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "7px",
                      marginRight: 0,
                    },
                  }}
                >
                  إضافة مشروع
                </Button>
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
              lg: "repeat(4,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          {statCards.map(([label, value, icon]) => (
            <Paper
              key={label}
              elevation={0}
              sx={{
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(36,74,112,.08)",
                borderRadius: "18px",
                backgroundColor: "var(--color-cream)",
                boxShadow: "0 10px 24px rgba(18,47,77,.055)",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.4,
                    color: "var(--color-navy-deep)",
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {value}
                </Typography>
              </Box>
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
            </Paper>
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 1.9 },
            py: 1.55,
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 9px 22px rgba(18,47,77,.05)",
            "& .MuiFormControl-root": { width: "100%", margin: 0 },
            "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
              minHeight: 50,
              height: 50,
              backgroundColor: "var(--color-white)",
              borderRadius: "12px",
            },
            "& .MuiInputLabel-root": {
              px: 0.65,
              backgroundColor: "var(--color-cream)",
              fontSize: "10.5px",
              fontWeight: 700,
            },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                sx={{
                  color: "var(--color-navy-deep)",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                البحث والتصفية
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  color: "var(--color-muted)",
                  fontSize: "9.5px",
                }}
              >
                استخدم المادة والسنة والفصل للوصول إلى المشروع المطلوب.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={!activeFiltersCount}
              onClick={resetFilters}
              startIcon={<RestartAltRounded />}
              sx={{
                minHeight: 36,
                px: 1.2,
                borderRadius: "11px",
                color: "var(--color-navy)",
                backgroundColor: "rgba(36,74,112,.055)",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon": {
                  marginLeft: "5px",
                  marginRight: 0,
                },
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                lg: "repeat(3,minmax(0,1fr))",
              },
              gap: 1.5,
            }}
          >
            <SelectFilter
              value={subject}
              onChange={setSubject}
              label="المادة"
              icon={SubjectIcon}
              allLabel="جميع المواد"
              disabled={loadingSubjects}
              options={subjectOptions}
            />
            <SelectFilter
              value={academicYear}
              onChange={setAcademicYear}
              label="السنة الدراسية"
              icon={SchoolIcon}
              allLabel="جميع السنين"
              options={Years.map((year) => ({
                value: year,
                label: year,
              }))}
            />
            <ClassFilter
              classId={classFilter}
              setClassId={setClassFilter}
              academicYear={academicYear}
            />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(36,74,112,.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 14px 32px rgba(18,47,77,.065)",
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 1.9 },
              py: 1.25,
              borderBottom: "1px solid rgba(36,74,112,.07)",
            }}
          >
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              قائمة المشاريع
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح تفاصيل المشروع أو عدّل بياناته حسب صلاحياتك.
            </Typography>
          </Box>

          {showEmptyState ? (
            <Box
              sx={{
                minHeight: { xs: 250, md: 290 },
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                p: 2,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    borderRadius: "18px",
                  }}
                >
                  {hasFilters ? <SearchOffRounded /> : <AssignmentRounded />}
                </Box>
                <Typography
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  {hasFilters
                    ? "لا توجد مشاريع مطابقة للفلاتر"
                    : "لا توجد مشاريع حتى الآن"}
                </Typography>
                <Typography
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "10px",
                  }}
                >
                  {hasFilters
                    ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                    : "أضف أول مشروع لبدء استقبال تسليمات الطلاب."}
                </Typography>
                {hasFilters ? (
                  <Button
                    type="button"
                    onClick={resetFilters}
                    variant="outlined"
                    startIcon={<RestartAltRounded />}
                    sx={{
                      mt: 0.5,
                      borderRadius: "12px",
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : (
                  permissions.add && (
                    <Button
                      component={Link}
                      to="add"
                      variant="contained"
                      startIcon={<AddCircleOutlineOutlined />}
                      sx={{
                        mt: 0.5,
                        borderRadius: "12px",
                        color: "var(--color-white)",
                        background:
                          "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                        fontWeight: 800,
                        textTransform: "none",
                      }}
                    >
                      إضافة أول مشروع
                    </Button>
                  )
                )}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: { xs: 0.7, md: 1 } }}>
              <Table
                headers={HEADERS}
                data={items}
                loading={loading}
                edit={permissions.edit}
                profile
                body={BODY}
                deleteFn={permissions.delete ? handleDelete : undefined}
              />
              {currentPagination && items.length > 0 && (
                <PaginationControls
                  pagination={currentPagination}
                  page={page}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                  label="عدد المشاريع"
                />
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
