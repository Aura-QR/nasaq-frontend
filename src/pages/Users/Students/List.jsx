import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineOutlined,
  CheckCircleRounded,
  FileDownloadOutlined,
  Groups2Rounded,
  PeopleAltRounded,
  SchoolRounded,
  SortRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";

import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import PaginationControls from "@/components/Pagination";

import { deleteStudent } from "@/APIs/users/students";
import { useStudents } from "@/utils/hooks/apis/useStudents";
import useDebounce from "@/utils/hooks/useDebounce";
import usePermissions from "@/utils/hooks/usePermissions";

import Status from "@/utils/constants/Status";
import Years from "@/utils/constants/Years";

const getCurrentEnrollment = (student) => {
  const direct =
    student?.currentEnrollment ||
    student?.latestEnrollment ||
    student?.enrollment;

  if (direct) return direct;

  if (
    Array.isArray(
      student?.enrollments
    ) &&
    student.enrollments.length
  ) {
    return [...student.enrollments].sort(
      (first, second) => {
        const firstDate =
          new Date(
            first?.enrolledAt ||
              first?.createdAt ||
              0
          ).getTime() || 0;

        const secondDate =
          new Date(
            second?.enrolledAt ||
              second?.createdAt ||
              0
          ).getTime() || 0;

        return secondDate - firstDate;
      }
    )[0];
  }

  return null;
};

const getStudentClass = (student) => {
  const enrollment =
    getCurrentEnrollment(
      student
    );

  const candidates = [
    student?.class,
    typeof student?.classId ===
      "object"
      ? student.classId
      : null,
    enrollment?.class,
    typeof enrollment?.classId ===
      "object"
      ? enrollment.classId
      : null,
  ].filter(Boolean);

  return candidates[0] || null;
};

const getStudentAcademicYearLabel = (
  student
) => {
  const enrollment =
    getCurrentEnrollment(
      student
    );

  const classData =
    getStudentClass(student);

  const candidates = [
    student?.academicYear,
    student?.academicYearId,
    enrollment?.academicYear,
    enrollment?.academicYearId,
    classData?.academicYear,
    classData?.academicYearId,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      !/^[a-f\d]{24}$/i.test(
        candidate
      )
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {
      const value =
        candidate.name ||
        candidate.label ||
        candidate.year;

      if (value) return value;
    }
  }

  return "—";
};

const getStudentClassLabel = (
  student
) => {
  const classData =
    getStudentClass(student);

  if (!classData) {
    return "لا يوجد";
  }

  const className =
    classData.name ||
    classData.roomNumber ||
    classData.className ||
    "";

  const gender =
    classData.gender === "male"
      ? "بنين"
      : classData.gender ===
        "female"
      ? "بنات"
      : classData.gender === "both"
      ? "مشترك"
      : "";

  if (!className) {
    return "فصل مسجل";
  }

  return [
    className,
    gender,
  ]
    .filter(Boolean)
    .join(" - ");
};

const TABLE_HEADERS = [
  "اسم الطالب",
  "تاريخ الميلاد",
  "السنة الدراسية",
  "الفصل",
  "رقم الهاتف",
  "الحالة",
];

const TABLE_BODY = [
  "name",
  "birthdate",
  "academicYear",
  "roomNumber",
  "phone",
  "status",
];

const safeFormatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : format(date, "dd/MM/yyyy");
};

const mapStudents = (data = []) =>
  data.map((item) => ({
    id: item._id || item.id,
    birthdate: safeFormatDate(
      item.birthDate
    ),
    name: [
      item.firstName,
      item.fatherName,
      item.familyName,
    ]
      .filter(Boolean)
      .join(" "),
    academicYear:
      getStudentAcademicYearLabel(
        item
      ),
    phone:
      item.phoneNumber ||
      item.phone ||
      "—",
    status: item.isActive
      ? "نشط"
      : "غير نشط",
    roomNumber:
      getStudentClassLabel(
        item
      ),
  }));

const STAT_CARDS = [
  {
    key: "total",
    label: "إجمالي الطلاب",
    icon: <PeopleAltRounded />,
  },
  {
    key: "visible",
    label: "الظاهر في الصفحة",
    icon: <Groups2Rounded />,
  },
  {
    key: "active",
    label: "الطلاب النشطون",
    icon: <CheckCircleRounded />,
  },
  {
    key: "classes",
    label: "الفصول الظاهرة",
    icon: <SchoolRounded />,
  },
];

const List = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [studentClass, setStudentClass] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(search, 700);

  const filters = useMemo(
    () => ({
      page,
      limit,
      name: debouncedSearch || undefined,
      isActive:
        status !== ""
          ? Boolean(Number(status))
          : undefined,
      classId: studentClass || undefined,
    }),
    [
      page,
      limit,
      debouncedSearch,
      status,
      academicYear,
      studentClass,
    ]
  );

  const {
    students,
    loading,
    pagination,
    setPagination,
  } = useStudents(filters);

  const permissions = usePermissions("students");

  useEffect(() => {
    setItems(mapStudents(students));
  }, [students]);

  useEffect(() => {
    setStudentClass("");
  }, [academicYear]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    debouncedSearch,
    status,
    academicYear,
    studentClass,
  ]);

  const activeFiltersCount = [
    search,
    status,
    academicYear,
    studentClass,
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    const activeStudents = items.filter(
      (item) => item.status === "نشط"
    ).length;

    const visibleClasses = new Set(
      items
        .map((item) => item.roomNumber)
        .filter(
          (value) =>
            value && value !== "لا يوجد" && value !== "—"
        )
    ).size;

    return {
      total: pagination?.totalDocs ?? items.length,
      visible: items.length,
      active: activeStudents,
      classes: visibleClasses,
    };
  }, [items, pagination]);

  const csvData = useMemo(
    () =>
      items.map(
        ({
          name,
          birthdate,
          academicYear: year,
          roomNumber,
          phone,
          status: studentStatus,
        }) => ({
          "اسم الطالب": name,
          "تاريخ الميلاد": birthdate,
          "السنة الدراسية": year,
          الفصل: roomNumber,
          "رقم الهاتف": phone,
          الحالة: studentStatus,
        })
      ),
    [items]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setAcademicYear("");
    setStudentClass("");
    setPage(1);
  };

  const handleDelete = async (id, setActive) => {
    try {
      const response = await deleteStudent(id);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "تعذر حذف الطالب"
        );
        return;
      }

      toast.success("تم حذف الطالب بنجاح");

      setItems((previousItems) =>
        previousItems.filter((item) => item.id !== id)
      );

      setPagination((previousPagination) => ({
        ...previousPagination,
        totalDocs: Math.max(
          0,
          (previousPagination?.totalDocs || 1) - 1
        ),
      }));

      setActive(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء حذف الطالب"
      );
    }
  };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
          color: "var(--color-text)",

          "@media (prefers-reduced-motion: reduce)": {
            "&, & *": {
              transition: "none !important",
              animation: "none !important",
              transform: "none !important",
            },
          },
        }}
      >
      <Paper
  elevation={0}
  sx={{
    mb: 1.25,

    px: {
      xs: 1.7,
      sm: 2,
      md: 2.4,
    },

    py: {
      xs: 1.4,
      md: 1.6,
    },

    border:
      "1px solid rgba(36, 74, 112, 0.08)",

    borderRadius: "18px",

    background:
      "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",

    boxShadow:
      "0 10px 24px rgba(18,47,77,0.06)",

    transition:
      "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",

    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: "rgba(211,164,79,0.22)",
      boxShadow:
        "0 16px 34px rgba(18,47,77,0.10)",
    },
  }}
>
  <Stack
    direction={{
      xs: "column",
      sm: "row",
    }}
    alignItems={{
      xs: "stretch",
      sm: "center",
    }}
    justifyContent="space-between"
    spacing={1.5}
  >
    {/* عنوان الصفحة */}
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.8}
      >
        <Typography
          component="h1"
          sx={{
            color: "var(--color-navy-deep)",

            fontSize: {
              xs: "21px",
              md: "25px",
            },

            fontWeight: 800,
            lineHeight: 1.3,
          }}
        >
          إدارة الطلاب
        </Typography>

        <Chip
          label={pagination?.totalDocs ?? items.length}
          size="small"
          sx={{
            height: 26,

            color: "var(--color-gold-dark)",
            backgroundColor:
              "var(--color-gold-soft)",

            border:
              "1px solid rgba(211,164,79,0.24)",

            fontSize: "10px",
            fontWeight: 800,

            "& .MuiChip-label": {
              px: 1,
            },
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
        عرض بيانات الطلاب وإدارتها والبحث عنها من مكان واحد.
      </Typography>
    </Box>

    {/* الأزرار */}
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      alignItems="center"
      justifyContent="flex-start"
      gap={1.25}
      sx={{
        width: {
          xs: "100%",
          sm: "auto",
        },
        flexShrink: 0,
      }}
    >
      <Box
        component={CSVLink}
        data={csvData}
        filename="students.csv"
        sx={{
          width: {
            xs: "100%",
            sm: "auto",
          },
          display: "inline-flex",
          textDecoration: "none",
        }}
      >
        <Button
          disabled={items.length === 0}
          variant="outlined"
          startIcon={<FileDownloadOutlined />}
          sx={{
            width: {
              xs: "100%",
              sm: 112,
            },
            minHeight: 42,
            px: 1.8,

            borderRadius: "12px",

            color: "var(--color-navy)",
            backgroundColor: "rgba(255, 252, 247, 0.84)",
            borderColor: "rgba(36, 74, 112, 0.16)",

            boxShadow: "none",

            transition:
              "transform 180ms ease, box-shadow 180ms ease, color 180ms ease, background-color 180ms ease, border-color 180ms ease",

            fontSize: "12px",
            fontWeight: 800,
            whiteSpace: "nowrap",
            textTransform: "none",

            "& .MuiButton-startIcon": {
              marginLeft: "7px",
              marginRight: 0,
            },

            "& svg": {
              fontSize: "18px",
            },

            "&:hover": {
              color: "var(--color-gold-dark)",
              backgroundColor: "var(--color-gold-soft)",
              borderColor: "rgba(211, 164, 79, 0.42)",
              boxShadow: "0 7px 16px rgba(18, 47, 77, 0.08)",
              transform: "translateY(-1px)",
            },

            "&.Mui-disabled": {
              color: "rgba(126, 135, 145, 0.65)",
              backgroundColor: "rgba(240, 237, 230, 0.64)",
              borderColor: "rgba(36, 74, 112, 0.08)",
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
            width: {
              xs: "100%",
              sm: 178,
            },
            minHeight: 42,
            px: 2,

            borderRadius: "12px",

            color: "var(--color-white)",
            background:
              "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",

            boxShadow: "0 9px 20px rgba(18, 47, 77, 0.16)",

            transition:
              "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",

            fontSize: "12px",
            fontWeight: 800,
            whiteSpace: "nowrap",
            textTransform: "none",

            "& .MuiButton-startIcon": {
              marginLeft: "7px",
              marginRight: 0,
            },

            "& svg": {
              fontSize: "19px",
            },

            "&:hover": {
              background:
                "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
              boxShadow: "0 12px 24px rgba(18, 47, 77, 0.21)",
              transform: "translateY(-1px)",
            },
          }}
        >
          إضافة طالب جديد
        </Button>
      )}
    </Stack>
  </Stack>
</Paper>

        <Box
          sx={{
            mb: 1.75,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {STAT_CARDS.map((card) => (
            <Paper
              key={card.key}
              elevation={0}
              sx={{
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                border: "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                backgroundColor: "var(--color-cream)",
                boxShadow:
                  "0 10px 24px rgba(18,47,77,0.055)",

                transition:
                  "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, background-color 200ms ease",

                "& .stats-card-icon": {
                  transition:
                    "transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease",
                },

                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(211,164,79,0.25)",
                  backgroundColor: "var(--color-white)",
                  boxShadow:
                    "0 17px 32px rgba(18,47,77,0.11)",
                },

                "&:hover .stats-card-icon": {
                  transform: "scale(1.08) rotate(-4deg)",
                  backgroundColor: "rgba(242,215,146,0.58)",
                  boxShadow:
                    "0 8px 16px rgba(211,164,79,0.16)",
                },
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
                  {card.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "var(--color-navy-deep)",
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {stats[card.key]}
                </Typography>
              </Box>

              <Box
                className="stats-card-icon"
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: "var(--color-gold-dark)",
                  backgroundColor: "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.22)",
                  borderRadius: "14px",
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
            mb: 1.25,
            px: {
              xs: 1.5,
              md: 1.75,
            },
            py: {
              xs: 1.4,
              md: 1.55,
            },

            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 9px 22px rgba(18,47,77,0.05)",

            transition:
              "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",

            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: "rgba(36,74,112,0.13)",
              boxShadow:
                "0 15px 30px rgba(18,47,77,0.085)",
            },

            "& .MuiFormControl-root": {
              width: "100%",
              margin: 0,
            },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
              minHeight: 48,
              height: 48,
              backgroundColor: "var(--color-white)",
              borderRadius: "13px",
              fontSize: "12px",

              transition:
                "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
            },

            "& .MuiInputBase-root:hover, & .MuiOutlinedInput-root:hover": {
              transform: "translateY(-1px)",
              backgroundColor: "rgba(255,255,255,0.98)",
              boxShadow:
                "0 7px 16px rgba(18,47,77,0.07)",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(36,74,112,0.13)",
            },

            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(36,74,112,0.25)",
            },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "var(--color-gold)",
            },

            "& .MuiOutlinedInput-root.Mui-focused": {
              transform: "translateY(-1px)",
              boxShadow:
                "0 0 0 3px rgba(211,164,79,0.12)",
            },

            /*
             * نخلي عناوين الفلاتر فوق الإطار بوضوح
             * بدل ما خط الـOutlinedInput يعدّي من خلالها.
             */
            "& .MuiInputLabel-root": {
              top: 0,
              right: 14,
              left: "auto",

              px: 0.7,

              color: "var(--color-muted)",
              backgroundColor: "var(--color-cream)",

              fontSize: "11px",
              fontWeight: 700,
              lineHeight: 1.4,

              transform:
                "translateY(-50%) scale(0.92)",
              transformOrigin: "top right",

              zIndex: 2,
              pointerEvents: "none",

              transition:
                "color 180ms ease, background-color 180ms ease",
            },

            "& .MuiInputLabel-root.MuiInputLabel-shrink": {
              transform:
                "translateY(-50%) scale(0.92)",
            },

            "& .MuiInputLabel-root.Mui-focused": {
              color: "var(--color-gold-dark)",
              backgroundColor: "var(--color-cream)",
            },

            /*
             * نلغي فتحة الـlegend لأن العنوان أصبح له
             * خلفية مستقلة فوق الإطار.
             */
            "& .MuiOutlinedInput-notchedOutline legend": {
              width: 0,
              maxWidth: 0,
              padding: 0,
            },

            "& .MuiInputBase-input": {
              py: 0.8,
              px: 1.5,
              fontSize: "12px",
            },

            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              minHeight: "unset !important",
              py: "0 !important",
            },

            "& .MuiSvgIcon-root": {
              fontSize: "20px",
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            gap={1}
            sx={{
              mb: 1.25,
            }}
          >
            <Box>
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
                استخدم الفلاتر للوصول إلى الطلاب بسرعة.
              </Typography>
            </Box>

          
          </Stack>

          <Grid
            container
            spacing={{
              xs: 1.5,
              md: 1.35,
            }}
            alignItems="center"
            sx={{
              pt: 0.8,
            }}
          >
            <Grid item xs={12} sm={6} lg={3}>
              <SearchFilter
                value={search}
                onChange={setSearch}
                placeholder="ابحث باسم الطالب..."
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <SelectFilter
                value={status}
                onChange={setStatus}
                label="حالة الطالب"
                icon={SortRounded}
                allLabel="جميع الحالات"
                options={Status.map((item) => ({
                  value: item.id.toString(),
                  label: item.label,
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <SelectFilter
                value={academicYear}
                onChange={setAcademicYear}
                label="السنة الدراسية"
                icon={SchoolRounded}
                allLabel="جميع السنوات"
                options={Years.map((year) => ({
                  value: year,
                  label: year,
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <ClassFilter
                classId={studentClass}
                setClassId={setStudentClass}
                academicYear={academicYear}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor: "var(--color-cream)",
            boxShadow: "0 14px 32px rgba(18,47,77,0.065)",

            transition:
              "box-shadow 220ms ease, border-color 220ms ease",

            "&:hover": {
              borderColor: "rgba(36,74,112,0.13)",
              boxShadow:
                "0 18px 38px rgba(18,47,77,0.09)",
            },
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 1.25,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Typography
              sx={{
                color: "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              قائمة الطلاب
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              يمكنك عرض الملف أو تعديل البيانات أو حذف الطالب حسب صلاحياتك.
            </Typography>
          </Box>

          <Box
            sx={{
              p: { xs: 1, md: 1.5 },
              overflowX: "auto",
            }}
          >
            <Table
              headers={TABLE_HEADERS}
              data={items}
              loading={loading}
              edit={permissions.edit}
              profile
              body={TABLE_BODY}
              deleteFn={
                permissions.delete
                  ? handleDelete
                  : undefined
              }
            />
          </Box>

          {pagination && (
            <Box
              sx={{
                px: { xs: 1.5, md: 2.5 },
                py: 1.5,
                borderTop:
                  "1px solid rgba(36,74,112,0.07)",
              }}
            >
              <PaginationControls
                pagination={pagination}
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                label="عدد الطلاب"
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
