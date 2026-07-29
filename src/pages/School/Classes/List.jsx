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
  CheckCircleRounded,
  EventSeatRounded,
  FileDownloadOutlined,
  MeetingRoomRounded,
  RestartAltRounded,
  SearchOffRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";

import { deleteClass } from "@/APIs/school/classes";
import { useClasses } from "@/utils/hooks/apis/useClasses";
import usePermissions from "@/utils/hooks/usePermissions";
import { translateGender } from "@/utils/helpers/translateGender";

import Status from "@/utils/constants/Status";
import Years from "@/utils/constants/Years";
import Gender from "@/utils/constants/Gender";

import SchoolIcon from "@mui/icons-material/School";
import MaleIcon from "@mui/icons-material/Male";
import SortIcon from "@mui/icons-material/Sort";

const TABLE_HEADERS = [
  "اسم الفصل",
  "الرقم",
  "النوع",
  "الأماكن الفارغة",
  "الحالة",
];

const TABLE_BODY = [
  "name",
  "roomNumber",
  "gender",
  "availableSeats",
  "isActive",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي الفصول",
    icon: <MeetingRoomRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <MeetingRoomRounded />,
  },
  {
    key: "active",
    label: "الفصول النشطة",
    icon: <CheckCircleRounded />,
  },
  {
    key: "availableSeats",
    label: "الأماكن المتاحة",
    icon: <EventSeatRounded />,
  },
];

const mapClasses = (data = []) =>
  data.map((item) => {
    const studentsCount = Array.isArray(item?.students)
      ? item.students.length
      : Number(item?.studentsCount || 0);

    const maxCapacity = Number(item?.maxCapacity || 0);
    const availableSeats = Math.max(0, maxCapacity - studentsCount);
    const academicYear = item?.academicYear || "—";
    const roomNumber = item?.roomNumber || "—";

    return {
      id: item?._id || item?.id,
      name: `${academicYear} - ${roomNumber}`,
      academicYear,
      roomNumber,
      gender: translateGender(item?.gender, "class") || "—",
      teacherInCharge:
        item?.teacherInCharge?.name || item?.teacherInChargeName || "—",
      maxCapacity,
      studentsCount,
      availableSeats,
      isActive: item?.isActive ? "نشط" : "غير نشط",
      rawIsActive: Boolean(item?.isActive),
    };
  });

const List = () => {
  const [items, setItems] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit,
      gender: gender || undefined,
      isActive:
        status !== "" ? Boolean(Number(status)) : undefined,
      academicYear: academicYear || undefined,
    }),
    [page, limit, gender, status, academicYear]
  );

  const { classes, loading, pagination } = useClasses(filters);
  const permissions = usePermissions("classes");

  useEffect(() => {
    setItems(mapClasses(classes || []));
  }, [classes]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(pagination);
    }
  }, [pagination]);

  useEffect(() => {
    setPage(1);
  }, [limit, gender, status, academicYear]);

  const currentPagination = localPagination || pagination;

  const stats = useMemo(
    () => ({
      total: currentPagination?.totalDocs ?? items.length,
      visible: items.length,
      active: items.filter((item) => item.rawIsActive).length,
      availableSeats: items.reduce(
        (total, item) => total + Number(item.availableSeats || 0),
        0
      ),
    }),
    [items, currentPagination]
  );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        "اسم الفصل": item.name,
        "رقم الفصل": item.roomNumber,
        النوع: item.gender,
        "رائد الفصل": item.teacherInCharge,
        "السعة القصوى": item.maxCapacity,
        "عدد الطلاب": item.studentsCount,
        "الأماكن المتاحة": item.availableSeats,
        الحالة: item.isActive,
      })),
    [items]
  );

  const activeFiltersCount = [academicYear, status, gender].filter(Boolean)
    .length;

  const resetFilters = () => {
    setAcademicYear("");
    setStatus("");
    setGender("");
    setPage(1);
  };

  const handleDelete = async (id, setActive) => {
    try {
      const response = await deleteClass(id);

      if (!response?.status) {
        toast.error(response?.message || response || "تعذر حذف الفصل");
        return;
      }

      toast.success("تم حذف الفصل بنجاح");
      setItems((previous) => previous.filter((item) => item.id !== id));

      setLocalPagination((previous) =>
        previous
          ? {
              ...previous,
              totalDocs: Math.max(0, Number(previous.totalDocs || 1) - 1),
            }
          : previous
      );

      setActive(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حذف الفصل"
      );
    }
  };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 4,
          overflowX: "hidden",
          color: "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, sm: 2, md: 2.4 },
            py: { xs: 1.4, md: 1.6 },
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow: "0 10px 24px rgba(18,47,77,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "21px", md: "25px" },
                    fontWeight: 800,
                    lineHeight: 1.3,
                  }}
                >
                  إدارة الفصول
                </Typography>

                <Chip
                  label={currentPagination?.totalDocs ?? items.length}
                  size="small"
                  sx={{
                    height: 26,
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    border: "1px solid rgba(211,164,79,0.24)",
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
                  lineHeight: 1.6,
                }}
              >
                أنشئ الفصول ونظّم السعة والطلاب والجداول من مكان واحد.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
            >
              <CSVLink
                data={csvData}
                filename="classes.csv"
                style={{ textDecoration: "none" }}
              >
                <Button
                  disabled={items.length === 0}
                  variant="outlined"
                  startIcon={<FileDownloadOutlined />}
                  sx={{
                    width: { xs: "100%", sm: 112 },
                    minHeight: 42,
                    borderRadius: "12px",
                    color: "var(--color-navy)",
                    borderColor: "rgba(36,74,112,0.16)",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "7px",
                      marginRight: 0,
                    },
                    "&:hover": {
                      color: "var(--color-gold-dark)",
                      backgroundColor: "var(--color-gold-soft)",
                      borderColor: "rgba(211,164,79,0.42)",
                    },
                  }}
                >
                  تصدير
                </Button>
              </CSVLink>

              {permissions.add && (
                <Button
                  component={Link}
                  to="add"
                  variant="contained"
                  startIcon={<AddCircleOutlineOutlined />}
                  sx={{
                    width: { xs: "100%", sm: 172 },
                    minHeight: 42,
                    borderRadius: "12px",
                    color: "var(--color-white)",
                    background:
                      "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                    boxShadow: "0 9px 20px rgba(18,47,77,0.16)",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "none",
                    "& .MuiButton-startIcon": {
                      marginLeft: "7px",
                      marginRight: 0,
                    },
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                    },
                  }}
                >
                  إضافة فصل جديد
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
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
            minWidth: 0,
          }}
        >
          {STAT_CARDS.map((card) => (
            <Paper
              key={card.key}
              elevation={0}
              sx={{
                minWidth: 0,
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                border: "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                backgroundColor: "var(--color-cream)",
                boxShadow: "0 10px 24px rgba(18,47,77,0.055)",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: "var(--color-muted)",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {card.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "var(--color-navy-deep)",
                    fontSize: "20px",
                    fontWeight: 800,
                  }}
                >
                  {stats[card.key]}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-gold-dark)",
                  backgroundColor: "var(--color-gold-soft)",
                  border: "1px solid rgba(211,164,79,0.22)",
                  borderRadius: "12px",
                  "& svg": { fontSize: 21 },
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            mb: 1.25,
            px: {
              xs: 1.5,
              md: 1.9,
            },
            py: {
              xs: 1.45,
              md: 1.65,
            },
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 9px 22px rgba(18,47,77,0.05)",

            "& .MuiFormControl-root": {
              width: "100%",
              minWidth: 0,
              margin: 0,
            },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
              minHeight: 50,
              height: 50,
              backgroundColor: "var(--color-white)",
              borderRadius: "12px",
              fontSize: "12px",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(36,74,112,0.18)",
            },

            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(36,74,112,0.30)",
            },

            "& .MuiOutlinedInput-root.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(211,164,79,0.10)",
            },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "var(--color-gold)",
            },

            "& .MuiInputLabel-root": {
              px: 0.65,
              color: "var(--color-muted)",
              backgroundColor: "var(--color-cream)",
              fontSize: "10.5px",
              fontWeight: 700,
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: "var(--color-gold-dark)",
            },
          }}
        >
          <Box
            sx={{
              mb: {
                xs: 1.5,
                md: 1.7,
              },
            }}
          >
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1.35,
              }}
            >
              البحث والتصفية
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: "var(--color-muted)",
                fontSize: "9.5px",
                lineHeight: 1.5,
              }}
            >
              استخدم الفلاتر للوصول إلى الفصول بسرعة.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: {
                xs: 1.25,
                md: 1.5,
              },
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
            }}
          >
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

            <SelectFilter
              value={gender}
              onChange={setGender}
              label="نوع الفصل"
              icon={MaleIcon}
              allLabel="الكل"
              options={Gender.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
            />

            <SelectFilter
              value={status}
              onChange={setStatus}
              label="حالة الفصل"
              icon={SortIcon}
              allLabel="جميع الفصول"
              options={Status.map((item) => ({
                value: item.id.toString(),
                label: item.label,
              }))}
            />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflow: "hidden",
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 14px 32px rgba(18,47,77,0.065)",
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 1.9 },
              py: 1.25,
              borderBottom: "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              قائمة الفصول
            </Typography>
            <Typography
              sx={{ mt: 0.25, color: "var(--color-muted)", fontSize: "9.5px" }}
            >
              افتح تفاصيل الفصل أو عدّل بياناته وجدوله حسب صلاحياتك.
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              p: { xs: 0.7, md: 1 },
              overflowX: "auto",
            }}
          >
            {loading || items.length > 0 ? (
              <Table
                headers={TABLE_HEADERS}
                data={items}
                loading={loading}
                edit={permissions.edit}
                body={TABLE_BODY}
                deleteFn={permissions.delete ? handleDelete : undefined}
                profile
                schedule={permissions.edit}
              />
            ) : (
              <Box
                sx={{
                  minHeight: { xs: 170, md: 195 },
                  px: 2,
                  py: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255,255,255,0.58)",
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    mb: 1.15,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    border: "1px solid rgba(211,164,79,0.22)",
                    borderRadius: "15px",
                    "& svg": { fontSize: 27 },
                  }}
                >
                  {activeFiltersCount > 0 ? (
                    <SearchOffRounded />
                  ) : (
                    <MeetingRoomRounded />
                  )}
                </Box>

                <Typography
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {activeFiltersCount > 0
                    ? "لا توجد فصول مطابقة للفلاتر"
                    : "لا توجد فصول حتى الآن"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    maxWidth: 420,
                    color: "var(--color-muted)",
                    fontSize: "10px",
                    lineHeight: 1.7,
                  }}
                >
                  {activeFiltersCount > 0
                    ? "جرّب تغيير خيارات التصفية أو امسح الفلاتر لعرض جميع الفصول."
                    : "أضف أول فصل لبدء تنظيم الطلاب والمواد والجدول الدراسي."}
                </Typography>

                {activeFiltersCount > 0 ? (
                  <Button
                    type="button"
                    onClick={resetFilters}
                    startIcon={<RestartAltRounded />}
                    variant="outlined"
                    sx={{
                      mt: 1.4,
                      minHeight: 38,
                      px: 1.6,
                      borderRadius: "11px",
                      color: "var(--color-navy)",
                      borderColor: "rgba(36,74,112,0.18)",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      textTransform: "none",
                      "& .MuiButton-startIcon": {
                        marginLeft: "6px",
                        marginRight: 0,
                      },
                      "&:hover": {
                        borderColor: "var(--color-gold)",
                        backgroundColor: "var(--color-gold-soft)",
                      },
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : (
                  permissions.add && (
                    <Button
                      component={Link}
                      to="add"
                      startIcon={<AddCircleOutlineOutlined />}
                      variant="contained"
                      sx={{
                        mt: 1.4,
                        minHeight: 38,
                        px: 1.8,
                        borderRadius: "11px",
                        color: "var(--color-white)",
                        background:
                          "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        textTransform: "none",
                        "& .MuiButton-startIcon": {
                          marginLeft: "6px",
                          marginRight: 0,
                        },
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
                        },
                      }}
                    >
                      إضافة أول فصل
                    </Button>
                  )
                )}
              </Box>
            )}

            {!loading && items.length > 0 && currentPagination && (
              <PaginationControls
                pagination={currentPagination}
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                label="عدد الفصول"
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
