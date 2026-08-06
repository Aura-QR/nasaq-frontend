import {
  AddRounded,
  ArrowBackRounded,
  AutoStoriesRounded,
  CalendarMonthRounded,
  CloseRounded,
  ContentCopyRounded,
  FilterAltOffRounded,
  LaunchRounded,
  LibraryBooksRounded,
  LinkRounded,
  MenuBookRounded,
  RefreshRounded,
  SchoolRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import nasaqLogo from "@/images/wadq-logo.png";
import {
  addLibrary,
  fetchLibraries,
  fetchLibraryAcademicYears,
} from "@/APIs/school/library";
import {
  fetchMyTeacherSubjects,
} from "@/APIs/school/subjects";
import { TEACHER_UI } from "@/shared/ui/teacherUi";

const COLORS = {
  navy: "#173f65",
  navyDark: "#122f4d",
  navySoft: "#eef3f7",
  gold: "#c89224",
  goldSoft: "#fff3d8",
  green: "#18865d",
  greenSoft: "#eaf7f1",
  red: "#d14343",
  muted: "#8996a5",
  border: "#e1e7ec",
  page: "#ffffff",
};

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const unwrap = (response) => {
  let current = response;

  for (let index = 0; index < 6; index += 1) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !("data" in current)
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

const extractCollection = (response, extraKeys = []) => {
  const payload = unwrap(response);

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const keys = [
    ...extraKeys,
    "items",
    "docs",
    "results",
    "records",
    "libraries",
    "library",
    "subjects",
    "academicYears",
    "years",
  ];

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getMessage = (response, fallback) =>
  response?.message ||
  response?.data?.message ||
  (typeof response === "string" ? response : fallback);

const entityName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return "";

  return String(
    value?.name ||
      value?.title ||
      value?.label ||
      value?.subjectName ||
      value?.yearName ||
      ""
  ).trim();
};

const subjectCode = (value) =>
  String(
    value?.subjectCode || value?.code || ""
  ).trim();

const normalizeUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

const mapSubjectOption = (subject, index) => ({
  id: normalizeId(subject),
  name:
    subject?.subjectName ||
    subject?.name ||
    subject?.title ||
    `مادة ${index + 1}`,
  code: subjectCode(subject),
  raw: subject,
});

const mapYearOption = (year, index) => ({
  id: normalizeId(year),
  name:
    year?.name ||
    year?.title ||
    year?.label ||
    `سنة دراسية ${index + 1}`,
  status: String(year?.status || "").toLowerCase(),
  raw: year,
});

const StatCard = ({ title, value, helper, icon, tone = "blue" }) => {
  const tones = {
    blue: { color: COLORS.navy, bg: COLORS.navySoft },
    gold: { color: COLORS.gold, bg: COLORS.goldSoft },
    green: { color: COLORS.green, bg: COLORS.greenSoft },
  };
  const selected = tones[tone] || tones.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: COLORS.muted, fontSize: 10, fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography sx={{ color: COLORS.navyDark, fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
          {value}
        </Typography>
        <Typography noWrap sx={{ color: "#a0aab5", fontSize: 8.5, mt: 0.25 }}>
          {helper}
        </Typography>
      </Box>

      <Box
        sx={{
          ...TEACHER_UI.statIcon,
          display: "grid",
          placeItems: "center",
          color: selected.color,
          bgcolor: selected.bg,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

const LoadingView = () => (
  <Box sx={{ ...TEACHER_UI.page }}>
    <Box sx={{ ...TEACHER_UI.container }}>
      <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />
      <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item}>
            <Skeleton variant="rounded" height={76} sx={{ borderRadius: 2.4 }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2.5, mt: 1.2 }} />
    </Box>
  </Box>
);

const TeacherLibrary = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    link: "",
    subjectId: "",
    academicYearId: "",
  });

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const yearMap = useMemo(
    () => new Map(years.map((year) => [year.id, year])),
    [years]
  );

  const normalizeItem = useCallback(
    (item) => {
      const rawSubject =
        item?.subject ||
        (item?.subjectId && typeof item.subjectId === "object"
          ? item.subjectId
          : null) ||
        item?.subjectDetails ||
        null;
      const rawYear =
        item?.academicYear ||
        (item?.academicYearId && typeof item.academicYearId === "object"
          ? item.academicYearId
          : null) ||
        item?.year ||
        null;

      const subjectId = normalizeId(item?.subjectId || item?.subject);
      const yearId = normalizeId(
        item?.academicYearId || item?.academicYear || item?.yearId || item?.year
      );
      const resolvedSubject = rawSubject || subjectMap.get(subjectId)?.raw || null;
      const resolvedYear = rawYear || yearMap.get(yearId)?.raw || null;

      const title = String(
        item?.title || item?.name || item?.label || "مصدر تعليمي"
      ).trim();
      const link = normalizeUrl(item?.link || item?.url || item?.resourceUrl);
      const subjectName =
        entityName(resolvedSubject) ||
        subjectMap.get(subjectId)?.name ||
        "مصدر عام";
      const code =
        subjectCode(resolvedSubject) || subjectMap.get(subjectId)?.code || "";
      const yearName =
        entityName(resolvedYear) || yearMap.get(yearId)?.name || "كل السنوات";

      return {
        id: normalizeId(item),
        title,
        link,
        subjectId,
        subjectName,
        subjectCode: code,
        yearId,
        yearName,
        termName:
          entityName(item?.termId || item?.term) ||
          String(item?.termName || "").trim(),
        createdAt: item?.createdAt || item?.updatedAt || "",
        raw: item,
      };
    },
    [subjectMap, yearMap]
  );

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      try {
        const [libraryResponse, subjectsResponse, yearsResponse] =
          await Promise.all([
            fetchLibraries({ page: 1, limit: 500 }),
            fetchMyTeacherSubjects(),
            fetchLibraryAcademicYears(),
          ]);

        if (isFailedResponse(libraryResponse)) {
          throw new Error(
            getMessage(libraryResponse, "تعذر تحميل عناصر المكتبة")
          );
        }

        const subjectOptions = isFailedResponse(subjectsResponse)
          ? []
          : extractCollection(subjectsResponse, ["teacherSubjects"])
              .map(mapSubjectOption)
              .filter((subject) => subject.id);

        const yearOptions = isFailedResponse(yearsResponse)
          ? []
          : extractCollection(yearsResponse, ["academicYears"])
              .map(mapYearOption)
              .filter((year) => year.id);

        setSubjects(
          Array.from(new Map(subjectOptions.map((item) => [item.id, item])).values())
        );
        setYears(
          Array.from(new Map(yearOptions.map((item) => [item.id, item])).values())
        );
        setItems(extractCollection(libraryResponse, ["libraries", "library"]));
      } catch (requestError) {
        const message = requestError?.message || "تعذر تحميل المكتبة";
        setItems([]);
        setError(message);
        toast.error(message, { toastId: "teacher-library-load-error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!dialogOpen || form.academicYearId) return;

    const activeYear =
      years.find((year) => year.status === "active") || years[0];

    if (activeYear?.id) {
      setForm((current) => ({
        ...current,
        academicYearId: activeYear.id,
      }));
    }
  }, [dialogOpen, form.academicYearId, years]);

  const normalizedItems = useMemo(
    () => items.map(normalizeItem).filter((item) => item.id || item.link),
    [items, normalizeItem]
  );

  const availableSubjects = useMemo(() => {
    const map = new Map(subjects.map((subject) => [subject.id, subject]));

    normalizedItems.forEach((item) => {
      if (!item.subjectId || map.has(item.subjectId)) return;
      map.set(item.subjectId, {
        id: item.subjectId,
        name: item.subjectName,
        code: item.subjectCode,
      });
    });

    return Array.from(map.values());
  }, [normalizedItems, subjects]);

  const availableYears = useMemo(() => {
    const map = new Map(years.map((year) => [year.id, year]));

    normalizedItems.forEach((item) => {
      if (!item.yearId || map.has(item.yearId)) return;
      map.set(item.yearId, {
        id: item.yearId,
        name: item.yearName,
      });
    });

    return Array.from(map.values());
  }, [normalizedItems, years]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedItems.filter((item) => {
      const haystack = [
        item.title,
        item.subjectName,
        item.subjectCode,
        item.yearName,
        item.termName,
        item.link,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (subjectFilter === "all" || item.subjectId === subjectFilter) &&
        (yearFilter === "all" || item.yearId === yearFilter)
      );
    });
  }, [normalizedItems, search, subjectFilter, yearFilter]);

  const subjectCount = new Set(
    normalizedItems.map((item) => item.subjectId).filter(Boolean)
  ).size;
  const yearCount = new Set(
    normalizedItems.map((item) => item.yearId).filter(Boolean)
  ).size;

  const resetDialog = () => {
    setForm({
      title: "",
      link: "",
      subjectId: "",
      academicYearId: "",
    });
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    resetDialog();
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const link = normalizeUrl(form.link);

    if (!title) {
      toast.error("اكتب عنوان المصدر");
      return;
    }

    if (!link) {
      toast.error("اكتب رابط المصدر");
      return;
    }

    setSaving(true);

    try {
      const response = await addLibrary({
        title,
        link,
        subjectId: form.subjectId || undefined,
        academicYearId: form.academicYearId || undefined,
      });

      if (isFailedResponse(response)) {
        throw new Error(getMessage(response, "تعذر مشاركة المصدر"));
      }

      toast.success("تمت مشاركة المصدر بنجاح");
      setDialogOpen(false);
      resetDialog();
      await loadData({ silent: true });
    } catch (requestError) {
      toast.error(requestError?.message || "تعذر مشاركة المصدر");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async (link) => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setYearFilter("all");
  };

  if (loading) return <LoadingView />;

  return (
    <Box sx={{ ...TEACHER_UI.page }} dir="rtl">
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 220,
              height: 220,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
              left: -70,
              top: -110,
            }}
          />

          <Stack direction="row" alignItems="center" gap={1.3} sx={{ zIndex: 1 }}>
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                ...TEACHER_UI.heroLogo,
                objectFit: "contain",
                bgcolor: "#fff",
                p: 0.45,
              }}
            />
            <Box>
              <Chip
                icon={<LibraryBooksRounded />}
                label="بوابة المعلم"
                size="small"
                sx={{
                  height: 23,
                  mb: 0.45,
                  color: "#ffdf8c",
                  bgcolor: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,223,140,.25)",
                  fontSize: 8,
                  fontWeight: 900,
                }}
              />
              <Typography sx={{ ...TEACHER_UI.heroTitle }}>
                المكتبة التعليمية
              </Typography>
              <Typography
                sx={{
                  ...TEACHER_UI.heroSubtitle,
                  color: "rgba(255,255,255,.72)",
                }}
              >
                افتح المصادر التعليمية وشارك روابط مفيدة مع طلاب المدرسة
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={0.8} sx={{ zIndex: 1 }}>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => navigate("/teacher/dashboard")}
              sx={{
                ...TEACHER_UI.button,
                color: "#fff",
                border: "1px solid rgba(255,255,255,.25)",
              }}
            >
              لوحة التحكم
            </Button>
            <Tooltip title="تحديث البيانات">
              <IconButton
                onClick={() => loadData({ silent: true })}
                disabled={refreshing}
                sx={{
                  width: 36,
                  height: 36,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 1.8,
                }}
              >
                {refreshing ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <RefreshRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<AddRounded />}
              onClick={() => setDialogOpen(true)}
              sx={{
                ...TEACHER_UI.button,
                color: COLORS.navyDark,
                bgcolor: "#ffdc83",
                "&:hover": { bgcolor: "#f5ca5c" },
              }}
            >
              مشاركة مصدر
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Paper
            elevation={0}
            sx={{
              mt: 1,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: "1px solid #f0d9ad",
              bgcolor: "#fff9ec",
              color: "#7a5815",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {error}
          </Paper>
        )}

        <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="إجمالي المصادر"
              value={normalizedItems.length}
              helper="كل المصادر المتاحة في المكتبة"
              icon={<LibraryBooksRounded fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="المواد المرتبطة"
              value={subjectCount}
              helper="مواد لديها مصادر تعليمية"
              icon={<MenuBookRounded fontSize="small" />}
              tone="gold"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="السنوات الدراسية"
              value={yearCount}
              helper="سنوات مرتبطة بالمصادر"
              icon={<CalendarMonthRounded fontSize="small" />}
              tone="green"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="النتائج الظاهرة"
              value={filteredItems.length}
              helper="حسب البحث والفلاتر الحالية"
              icon={<AutoStoriesRounded fontSize="small" />}
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.section,
            mt: 1.1,
            border: `1px solid ${COLORS.border}`,
            bgcolor: "#fff",
          }}
        >
          <Grid container spacing={0.9} alignItems="center">
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث بعنوان المصدر أو المادة أو السنة"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: COLORS.muted }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    ...TEACHER_UI.field,
                    fontSize: 12,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={5} lg={2.5}>
              <FormControl fullWidth size="small">
                <Select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  sx={{ ...TEACHER_UI.field, fontSize: 11.5 }}
                >
                  <MenuItem value="all">كل المواد</MenuItem>
                  {availableSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {[subject.name, subject.code].filter(Boolean).join(" - ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={5} lg={2.5}>
              <FormControl fullWidth size="small">
                <Select
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                  sx={{ ...TEACHER_UI.field, fontSize: 11.5 }}
                >
                  <MenuItem value="all">كل السنوات</MenuItem>
                  {availableYears.map((year) => (
                    <MenuItem key={year.id} value={year.id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2} lg={1}>
              <Tooltip title="مسح الفلاتر">
                <IconButton
                  onClick={clearFilters}
                  sx={{
                    width: "100%",
                    height: TEACHER_UI.field.minHeight || 40,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 2,
                    color: COLORS.navy,
                  }}
                >
                  <FilterAltOffRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.section,
            mt: 1.1,
            border: `1px solid ${COLORS.border}`,
            bgcolor: "#fff",
            minHeight: 260,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.1 }}
          >
            <Box>
              <Typography sx={{ color: COLORS.navyDark, fontSize: 15, fontWeight: 900 }}>
                المصادر التعليمية
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 9 }}>
                افتح المصدر في تبويب جديد أو انسخ رابطه
              </Typography>
            </Box>
            <Chip
              label={`${filteredItems.length} مصدر`}
              size="small"
              sx={{ bgcolor: COLORS.navySoft, color: COLORS.navy, fontWeight: 900 }}
            />
          </Stack>

          {filteredItems.length === 0 ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ minHeight: 190, textAlign: "center" }}
            >
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2.2,
                  color: COLORS.gold,
                  bgcolor: COLORS.goldSoft,
                }}
              >
                <LibraryBooksRounded />
              </Box>
              <Typography sx={{ color: COLORS.navyDark, fontSize: 13, fontWeight: 900 }}>
                لا توجد مصادر مطابقة
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 9.5 }}>
                غيّر البحث أو الفلاتر، أو شارك مصدرًا جديدًا
              </Typography>
              <Button
                startIcon={<AddRounded />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  ...TEACHER_UI.button,
                  bgcolor: COLORS.goldSoft,
                  color: COLORS.gold,
                }}
              >
                مشاركة مصدر
              </Button>
            </Stack>
          ) : (
            <Grid container spacing={1}>
              {filteredItems.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id || item.link}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.3,
                      minHeight: 132,
                      borderRadius: 2.4,
                      border: `1px solid ${COLORS.border}`,
                      bgcolor: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform .18s ease, box-shadow .18s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 24px rgba(18,47,77,.07)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          borderRadius: 1.8,
                          color: COLORS.gold,
                          bgcolor: COLORS.goldSoft,
                        }}
                      >
                        <LinkRounded />
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          noWrap
                          sx={{ color: COLORS.navyDark, fontSize: 12.5, fontWeight: 900 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          noWrap
                          sx={{ color: COLORS.muted, fontSize: 8.5, mt: 0.35 }}
                        >
                          {item.link || "رابط غير متاح"}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.8 }}>
                          <Chip
                            label={
                              [item.subjectName, item.subjectCode]
                                .filter(Boolean)
                                .join(" - ")
                            }
                            size="small"
                            sx={{
                              height: 22,
                              bgcolor: COLORS.navySoft,
                              color: COLORS.navy,
                              fontSize: 8,
                              fontWeight: 800,
                            }}
                          />
                          <Chip
                            label={item.yearName}
                            size="small"
                            sx={{
                              height: 22,
                              bgcolor: COLORS.greenSoft,
                              color: COLORS.green,
                              fontSize: 8,
                              fontWeight: 800,
                            }}
                          />
                          {item.termName && (
                            <Chip
                              label={item.termName}
                              size="small"
                              sx={{
                                height: 22,
                                bgcolor: COLORS.goldSoft,
                                color: COLORS.gold,
                                fontSize: 8,
                                fontWeight: 800,
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Button
                        startIcon={<LaunchRounded />}
                        disabled={!item.link}
                        onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
                        sx={{
                          ...TEACHER_UI.button,
                          minWidth: 104,
                          color: "#fff",
                          bgcolor: COLORS.navy,
                          "&:hover": { bgcolor: COLORS.navyDark },
                        }}
                      >
                        فتح المصدر
                      </Button>

                      <Tooltip title="نسخ الرابط">
                        <span>
                          <IconButton
                            disabled={!item.link}
                            onClick={() => copyLink(item.link)}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.7,
                              color: COLORS.navy,
                              bgcolor: COLORS.navySoft,
                            }}
                          >
                            <ContentCopyRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: "rtl",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 1.8,
                  color: COLORS.gold,
                  bgcolor: COLORS.goldSoft,
                }}
              >
                <LibraryBooksRounded />
              </Box>
              <Box>
                <Typography sx={{ color: COLORS.navyDark, fontSize: 15, fontWeight: 900 }}>
                  مشاركة مصدر تعليمي
                </Typography>
                <Typography sx={{ color: COLORS.muted, fontSize: 9 }}>
                  أضف عنوان المصدر والرابط واربطه بالمادة المناسبة
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={closeDialog} disabled={saving}>
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.4} sx={{ pt: 0.4 }}>
            <TextField
              label="عنوان المصدر"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              fullWidth
              autoFocus
            />

            <TextField
              label="رابط المصدر"
              value={form.link}
              onChange={(event) =>
                setForm((current) => ({ ...current, link: event.target.value }))
              }
              placeholder="https://example.com/resource"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkRounded />
                  </InputAdornment>
                ),
              }}
            />

            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>المادة</InputLabel>
                  <Select
                    label="المادة"
                    value={form.subjectId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subjectId: event.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">مصدر عام</MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {[subject.name, subject.code].filter(Boolean).join(" - ")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>السنة الدراسية</InputLabel>
                  <Select
                    label="السنة الدراسية"
                    value={form.academicYearId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        academicYearId: event.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">كل السنوات</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {year.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeDialog} disabled={saving} color="inherit">
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={
              saving ? <CircularProgress size={17} color="inherit" /> : <AddRounded />
            }
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              bgcolor: COLORS.navy,
              "&:hover": { bgcolor: COLORS.navyDark },
            }}
          >
            {saving ? "جاري الحفظ..." : "مشاركة المصدر"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherLibrary;
