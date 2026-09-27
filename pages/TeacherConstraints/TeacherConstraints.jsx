import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  BlockRounded,
  EventBusyRounded,
  RestartAltRounded,
  SaveRounded,
  SearchRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";

import { api } from "@/APIs/Axios";
import {
  clearTeacherConstraint,
  fetchTeacherConstraints,
  saveTeacherConstraint,
} from "@/APIs/school/teacherConstraints";

import {
  dayStateOf,
  fromUnavailable,
  isSlotBlocked,
  toUnavailable,
  toggleSlot as toggleSlotIn,
  toggleWholeDay as toggleWholeDayIn,
} from "@/shared/timetable/teacherAvailability";

/*
 * متى لا يجوز جدولة المعلم.
 *
 * مولّد الجدول يقرأ هذه القيود منذ كُتب، ويعاملها قواعد لا تفضيلات: الخانة
 * المحجوبة لا تُعرض على المولّد أبدًا مهما كانت مناسبة. غير أنه لم تكن هناك
 * شاشة تضبطها، فكان معلم يداوم يومين في الأسبوع يُجدَّل على الخمسة، ثم
 * تُصحَّح حصصه يدويًا كل ترم.
 *
 * الشبكة هي الواجهة كلها: معلم في كل صف، ويوم في كل عمود، والخانة تُنقر
 * فتُحجب. والقيود لكل ترم على حدة لأن نصاب المعلم يُعاد ترتيبه مع كل ترم.
 */

const COLORS = {
  navy: "#244a70",
  navyDeep: "#122f4d",
  muted: "#7e8791",
  red: "#c0392b",
  green: "#18865d",
};

const DAYS = [
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الاثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
  { key: "saturday", label: "السبت" },
];

const idOf = (value) =>
  String(value?._id || value?.id || value || "").trim();

const unwrap = (value) => {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
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

const extractList = (value) => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["items", "docs", "results", "records", "data"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const TeacherConstraints = () => {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  const [search, setSearch] = useState("");

  /** الأيام العاملة وعدد حصص كل يوم، من إعدادات المدرسة. */
  const [capacity, setCapacity] = useState(null);

  /*
   * القيود قيد التحرير: { teacherId: { day: number[] } }
   *
   * مصفوفة فارغة تعني اليوم كله، وغياب المفتاح يعني أن اليوم متاح. وهو
   * الشكل نفسه الذي يقبله الخادم، فلا تحويل بين ما تراه وما يُحفظ.
   */
  const [draft, setDraft] = useState({});
  const [saved, setSaved] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const workingDays = useMemo(() => {
    const configured = capacity?.workingDays;
    if (!Array.isArray(configured) || configured.length === 0) {
      return DAYS.slice(0, 5).map((day) => day.key);
    }
    return DAYS.map((day) => day.key).filter((key) =>
      configured.includes(key)
    );
  }, [capacity]);

  const periodsOf = useCallback(
    (day) =>
      Number(
        capacity?.periodsByDay?.[day] ?? capacity?.periodsPerDay ?? 7
      ) || 7,
    [capacity]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [yearsResponse, activeResponse, teachersResponse] =
        await Promise.all([
          api.get("/academic-years"),
          api.get("/academic-years/active").catch(() => null),
          api.get("/teachers", { params: { page: 1, limit: 500 } }),
        ]);

      const loadedYears = extractList(yearsResponse?.data).map((item) => ({
        _id: idOf(item),
        name: item?.name || "سنة دراسية",
      }));

      const loadedTeachers = extractList(teachersResponse?.data)
        .map((item) => ({
          _id: idOf(item),
          name: item?.name || item?.fullName || "معلم",
        }))
        .filter((item) => item._id)
        .sort((first, second) =>
          String(first.name).localeCompare(String(second.name), "ar")
        );

      setYears(loadedYears);
      setTeachers(loadedTeachers);

      const activeYearId =
        idOf(unwrap(activeResponse?.data)) || loadedYears[0]?._id || "";
      setSelectedYearId(activeYearId);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "تعذر تحميل البيانات الأساسية"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!selectedYearId) {
      setTerms([]);
      setSelectedTermId("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await api.get(`/terms/by-year/${selectedYearId}`);
        if (cancelled) return;

        const loaded = extractList(response?.data)
          .map((item) => ({
            _id: idOf(item),
            name: item?.name || "ترم",
            status: item?.status,
            order: Number(item?.order || 0),
          }))
          .sort((first, second) => first.order - second.order);

        setTerms(loaded);

        const active =
          loaded.find((item) => item.status === "active") || loaded[0];
        setSelectedTermId(active?._id || "");
      } catch {
        if (!cancelled) setTerms([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedYearId]);

  /*
   * القيود وسعة الأسبوع معًا.
   *
   * السعة تأتي من فحص الجاهزية لأنها المصدر نفسه الذي يبني عليه المولّد
   * شبكته. لو رسمنا هنا ثمانية أعمدة والمدرسة تعمل ستًّا، لحجب مدير حصصًا
   * لا وجود لها.
   */
  const loadTerm = useCallback(async () => {
    if (!selectedTermId) {
      setDraft({});
      setSaved({});
      setCapacity(null);
      return;
    }

    setLoading(true);

    const [constraintsResult, capacityResponse] = await Promise.all([
      fetchTeacherConstraints(selectedTermId),
      api
        .get("/lectures/feasibility", { params: { termId: selectedTermId } })
        .catch(() => null),
    ]);

    if (constraintsResult?.status === false) {
      setError(constraintsResult?.message || "تعذر تحميل قيود المعلمين");
      setLoading(false);
      return;
    }

    setError("");

    const payload = unwrap(capacityResponse?.data);
    setCapacity(
      payload
        ? {
            workingDays: payload.workingDays,
            periodsByDay: payload.periodsByDay,
            periodsPerDay: payload.periodsPerDay,
          }
        : null
    );

    const rows = Array.isArray(constraintsResult?.data)
      ? constraintsResult.data
      : extractList(constraintsResult?.data);

    const next = {};
    for (const row of rows) {
      const teacherId = idOf(row?.teacherId);
      if (!teacherId) continue;

      next[teacherId] = fromUnavailable(row?.unavailable);
    }

    setSaved(next);
    setDraft(next);
    setLoading(false);
  }, [selectedTermId]);

  useEffect(() => {
    loadTerm();
  }, [loadTerm]);

  const blocksOf = useCallback(
    (teacherId) => draft[teacherId] ?? {},
    [draft]
  );

  const toggleWholeDay = (teacherId, day) => {
    setDraft((current) => ({
      ...current,
      [teacherId]: toggleWholeDayIn(current[teacherId], day),
    }));
  };

  const toggleSlot = (teacherId, day, slot) => {
    setDraft((current) => ({
      ...current,
      [teacherId]: toggleSlotIn(current[teacherId], day, slot),
    }));
  };

  const isDirty = useCallback(
    (teacherId) =>
      JSON.stringify(draft[teacherId] ?? {}) !==
      JSON.stringify(saved[teacherId] ?? {}),
    [draft, saved]
  );

  const save = async (teacher) => {
    const blocks = blocksOf(teacher._id);
    const unavailable = toUnavailable(blocks);

    setSavingId(teacher._id);

    // مجموعة فارغة تعني «لا قيود»، وحذف السجل أنظف من تخزين صفٍّ فارغ —
    // غير أن غيابه أصلًا ليس خطأً يستحق رسالة.
    const result =
      unavailable.length === 0
        ? await clearTeacherConstraint(teacher._id, selectedTermId).then(
            (response) =>
              response?.status === false &&
              /لا توجد قيود/.test(String(response?.message))
                ? { status: true, message: "تم مسح القيود" }
                : response
          )
        : await saveTeacherConstraint({
            teacherId: teacher._id,
            termId: selectedTermId,
            unavailable,
          });

    setSavingId("");

    if (result?.status === false) {
      toast.error(result?.message || "تعذر حفظ القيود");
      return;
    }

    setSaved((current) => ({ ...current, [teacher._id]: blocks }));
    toast.success(`تم حفظ قيود ${teacher.name}`);
  };

  const reset = (teacherId) => {
    setDraft((current) => ({
      ...current,
      [teacherId]: saved[teacherId] ?? {},
    }));
  };

  const visibleTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((teacher) =>
      String(teacher.name).toLowerCase().includes(term)
    );
  }, [teachers, search]);

  const constrainedCount = useMemo(
    () =>
      Object.values(saved).filter(
        (blocks) => Object.keys(blocks ?? {}).length > 0
      ).length,
    [saved]
  );

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.6, md: 2.2 },
            mb: 1.6,
            borderRadius: "16px",
            border: "1px solid rgba(36,74,112,0.08)",
            backgroundColor: "var(--color-cream, #fffcf7)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.2}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  color: COLORS.navy,
                  backgroundColor: "#eef3f7",
                }}
              >
                <EventBusyRounded />
              </Box>

              <Box>
                <Typography
                  sx={{ fontWeight: 900, fontSize: 17, color: COLORS.navyDeep }}
                >
                  أوقات عدم إتاحة المعلمين
                </Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.muted }}>
                  حدّد الأيام والحصص التي لا يُجدَّل فيها المعلم. المولّد
                  يلتزم بها التزامًا تامًا.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" gap={0.8} flexWrap="wrap">
              <TextField
                select
                size="small"
                label="السنة الدراسية"
                value={selectedYearId}
                onChange={(event) => setSelectedYearId(event.target.value)}
                sx={{ minWidth: 165 }}
              >
                {years.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="الترم"
                value={selectedTermId}
                onChange={(event) => setSelectedTermId(event.target.value)}
                sx={{ minWidth: 150 }}
              >
                {terms.map((term) => (
                  <MenuItem key={term._id} value={term._id}>
                    {term.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                placeholder="ابحث باسم المعلم"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchRounded
                      sx={{ fontSize: 18, color: COLORS.muted, ml: 0.6 }}
                    />
                  ),
                }}
                sx={{ minWidth: 190 }}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.4, borderColor: "rgba(36,74,112,0.07)" }} />

          <Stack direction="row" gap={0.8} flexWrap="wrap">
            <Chip
              size="small"
              label={`${teachers.length} معلم`}
              sx={{ fontWeight: 800, bgcolor: "#eef3f7", color: COLORS.navy }}
            />
            <Chip
              size="small"
              label={`${constrainedCount} عليهم قيود`}
              sx={{
                fontWeight: 800,
                bgcolor: constrainedCount ? "#fff3d8" : "#f1f3f5",
                color: constrainedCount ? "#9a6a1e" : COLORS.muted,
              }}
            />
            <Chip
              size="small"
              label={`${workingDays.length} أيام عمل`}
              sx={{ fontWeight: 800, bgcolor: "#edf6f2", color: COLORS.green }}
            />
          </Stack>
        </Paper>

        <Alert severity="info" sx={{ mb: 1.6, borderRadius: "12px", fontSize: 12 }}>
          اضغط على اسم اليوم لحجبه بالكامل، أو على رقم الحصة لحجبها وحدها.
          القيود تخص هذا الترم فقط، ولا تنتقل إلى الترم التالي.
        </Alert>

        {error ? (
          <Alert severity="warning" sx={{ borderRadius: "12px" }}>
            {error}
          </Alert>
        ) : loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={26} />
          </Stack>
        ) : !selectedTermId ? (
          <Alert severity="info" sx={{ borderRadius: "12px" }}>
            اختر الترم لعرض المعلمين.
          </Alert>
        ) : visibleTeachers.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: "12px" }}>
            لا يوجد معلمون مطابقون.
          </Alert>
        ) : (
          <Stack gap={1.1}>
            {visibleTeachers.map((teacher) => {
              const blocks = blocksOf(teacher._id);
              const dirty = isDirty(teacher._id);
              const blockedDays = Object.keys(blocks).length;

              return (
                <Paper
                  key={teacher._id}
                  elevation={0}
                  sx={{
                    p: { xs: 1.2, md: 1.6 },
                    borderRadius: "14px",
                    border: dirty
                      ? "1px solid rgba(201,146,36,0.5)"
                      : "1px solid rgba(36,74,112,0.08)",
                    backgroundColor: "#fff",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={0.8}
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 13.5,
                          color: COLORS.navyDeep,
                        }}
                      >
                        {teacher.name}
                      </Typography>

                      {blockedDays > 0 && (
                        <Chip
                          size="small"
                          icon={<BlockRounded sx={{ fontSize: 13 }} />}
                          label={`${blockedDays} يوم مقيّد`}
                          sx={{
                            height: 22,
                            fontSize: 9.5,
                            fontWeight: 800,
                            bgcolor: "#fff3d8",
                            color: "#9a6a1e",
                          }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" gap={0.6}>
                      {dirty && (
                        <Button
                          size="small"
                          startIcon={<RestartAltRounded />}
                          onClick={() => reset(teacher._id)}
                          sx={{ fontWeight: 800, fontSize: 11 }}
                        >
                          تراجع
                        </Button>
                      )}

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          savingId === teacher._id ? (
                            <CircularProgress size={13} color="inherit" />
                          ) : (
                            <SaveRounded />
                          )
                        }
                        disabled={!dirty || savingId === teacher._id}
                        onClick={() => save(teacher)}
                        sx={{
                          fontWeight: 900,
                          fontSize: 11,
                          bgcolor: COLORS.navy,
                          "&:hover": { bgcolor: COLORS.navyDeep },
                        }}
                      >
                        حفظ
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ overflowX: "auto" }}>
                    <Stack direction="row" gap={0.8} sx={{ minWidth: 640 }}>
                      {workingDays.map((day) => {
                        const meta = DAYS.find((item) => item.key === day);
                        const state = dayStateOf(blocks, day);
                        const slots = blocks[day] ?? [];

                        return (
                          <Box
                            key={day}
                            sx={{
                              flex: 1,
                              minWidth: 112,
                              borderRadius: "10px",
                              p: 0.7,
                              border: "1px solid rgba(36,74,112,0.08)",
                              backgroundColor:
                                state === "all"
                                  ? "#fdeaea"
                                  : state === "some"
                                    ? "#fff8ec"
                                    : "#fbfcfd",
                            }}
                          >
                            <Tooltip
                              title={
                                state === "all"
                                  ? "اليوم محجوب بالكامل — اضغط لإتاحته"
                                  : "اضغط لحجب اليوم بالكامل"
                              }
                            >
                              <Box
                                onClick={() => toggleWholeDay(teacher._id, day)}
                                sx={{
                                  cursor: "pointer",
                                  textAlign: "center",
                                  py: 0.4,
                                  mb: 0.6,
                                  borderRadius: "7px",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  color:
                                    state === "all" ? COLORS.red : COLORS.navy,
                                  backgroundColor:
                                    state === "all"
                                      ? "rgba(192,57,43,0.10)"
                                      : "rgba(36,74,112,0.05)",
                                }}
                              >
                                {meta?.label || day}
                              </Box>
                            </Tooltip>

                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={0.35}
                              justifyContent="center"
                            >
                              {Array.from(
                                { length: periodsOf(day) },
                                (_, index) => index + 1
                              ).map((slot) => {
                                const blocked = isSlotBlocked(
                                  blocks,
                                  day,
                                  slot
                                );

                                return (
                                  <Box
                                    key={slot}
                                    onClick={() =>
                                      toggleSlot(teacher._id, day, slot)
                                    }
                                    sx={{
                                      width: 22,
                                      height: 22,
                                      display: "grid",
                                      placeItems: "center",
                                      cursor: "pointer",
                                      borderRadius: "6px",
                                      fontSize: 9.5,
                                      fontWeight: 800,
                                      userSelect: "none",
                                      color: blocked ? "#fff" : COLORS.muted,
                                      backgroundColor: blocked
                                        ? COLORS.red
                                        : "#eef1f4",
                                    }}
                                  >
                                    {slot}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export default TeacherConstraints;
