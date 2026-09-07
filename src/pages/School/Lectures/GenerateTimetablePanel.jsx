import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  AutoAwesomeRounded,
  CheckCircleRounded,
  GroupsRounded,
  PlayArrowRounded,
  RefreshRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import {
  fetchLectureFeasibility,
  generateTimetable,
} from "@/APIs/school/lectures";

const DAY_LABELS = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

const asArray = (value) =>
  Array.isArray(value) ? value : [];

const numberOf = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric
    : 0;
};

const normalizeResult = (result) => {
  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result || {};

  return {
    ...data,
    classes: asArray(data?.classes),
    classPlans: asArray(data?.classPlans),
    problems: asArray(data?.problems),
    workingDays: asArray(
      data?.workingDays
    ),
    placed: numberOf(data?.placed),
    unplaced: numberOf(data?.unplaced),
    written: numberOf(data?.written),
    failed: numberOf(data?.failed),
    deleted: numberOf(data?.deleted),
    skippedClasses: numberOf(
      data?.skippedClasses
    ),
    periodsPerDay: numberOf(
      data?.periodsPerDay
    ),
    slotsPerWeek: numberOf(
      data?.slotsPerWeek
    ),
  };
};

const BLOCKING_PROBLEM_TYPES = new Set([
  "no_working_days",
  "nothing_planned",
  "class_underfilled",
  "class_overbooked",
  "unstaffed_excluded",
  "teacher_overloaded",
]);

const getBlockingProblems = (value) =>
  asArray(value?.problems).filter(
    (problem) =>
      problem?.blocking === true ||
      BLOCKING_PROBLEM_TYPES.has(String(problem?.type || ""))
  );

const getGenerationProblemText = (problem = {}) => {
  const type = String(problem?.type || "");
  const className = problem?.className || "الفصل";
  const teacherName = problem?.teacherName || "المعلم";
  const subjectName = problem?.subjectName || "المادة";
  const required = numberOf(problem?.required ?? problem?.demand ?? problem?.load);
  const capacity = numberOf(problem?.capacity);
  const missing = numberOf(
    problem?.missing ?? Math.max(0, capacity - required)
  );
  const excess = numberOf(
    problem?.excess ?? Math.max(0, required - capacity)
  );
  const omitted = numberOf(problem?.omitted);

  switch (type) {
    case "class_underfilled":
      return `${className}: تم توزيع ${required} من ${capacity} حصة — متبقي ${missing} حصة.`;
    case "class_overbooked":
      return `${className}: الخطة ${required} حصة بينما السعة ${capacity} — زيادة ${excess} حصة.`;
    case "teacher_overloaded":
      return `${teacherName}: النصاب ${required} حصة بينما السعة ${capacity}.`;
    case "unstaffed_excluded":
      return `${className}: تعطيل إدراج المواد بدون معلم سيستبعد ${omitted} حصة من الجدول الرسمي. فعّل «إدراج المواد بدون معلم» أو أسند معلمًا للمادة قبل الاعتماد.`;
    case "subject_unassigned":
      return `${subjectName} في ${className} بدون معلم؛ يمكن معاينتها مؤقتًا بدون معلم.`;
    case "no_working_days":
      return "لا توجد أيام عمل مفعلة في إعدادات المدرسة.";
    case "nothing_planned":
      return "لم يتم تحديد خطة حصص قابلة للتوليد في النطاق الحالي.";
    case "no_slot_left":
      return `${className} — لم توجد خانة مناسبة لمادة ${subjectName}${
        problem?.teacherName ? ` مع ${problem.teacherName}` : ""
      }.`;
    case "search_exhausted":
      return "الخطة مزدحمة جدًا ولم يكتمل البحث عن توزيع مناسب لكل الحصص.";
    default:
      return problem?.message || "ظهرت ملاحظة أثناء إنشاء الجدول. راجع الإعدادات والخطة.";
  }
};

const getSlot = (day, slotNumber) =>
  asArray(day?.slots).find(
    (item) =>
      Number(item?.slot) ===
      Number(slotNumber)
  ) || null;

const getCellContent = (slot) => {
  if (!slot?.subjectOfferingId) {
    return {
      empty: true,
      subject: "—",
      teacher: "حصة فارغة",
    };
  }

  const unstaffed = !String(
    slot?.teacherName || ""
  ).trim();

  return {
    empty: false,
    unstaffed,
    subject:
      slot?.subjectName || "مادة",
    teacher:
      slot?.teacherName ||
      "بدون معلم",
  };
};

const GenerateTimetablePanel = ({
  termId,
  termLabel,
  classId,
  classLabel,
  initialScope = "all",
  onCommitted,
}) => {
  const getInitialScope = () =>
    initialScope === "current" && classId
      ? "current"
      : "all";

  const [scope, setScope] =
    useState(getInitialScope);

  const [onExisting, setOnExisting] =
    useState("skip");

  const [maxSamePerDay, setMaxSamePerDay] =
    useState(1);

  const [includeUnstaffed, setIncludeUnstaffed] =
    useState(true);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [commitLoading, setCommitLoading] =
    useState(false);

  const [preview, setPreview] =
    useState(null);

  const [committed, setCommitted] =
    useState(false);

  const [feasibilityReport, setFeasibilityReport] =
    useState(null);
  const [feasibilityLoading, setFeasibilityLoading] =
    useState(false);
  const [commitConfirmOpen, setCommitConfirmOpen] =
    useState(false);
  const [commitRejection, setCommitRejection] =
    useState(null);

  const effectiveClassIds =
    useMemo(
      () =>
        scope === "current" && classId
          ? [classId]
          : [],
      [scope, classId]
    );

  const loadFeasibility = useCallback(
    async ({ silent = false } = {}) => {
      if (!termId) {
        setFeasibilityReport(null);
        return null;
      }

      if (!silent) setFeasibilityLoading(true);

      try {
        const result = await fetchLectureFeasibility(
          { termId, classIds: effectiveClassIds },
          { force: true }
        );

        if (result?.status === false) {
          if (!silent) {
            toast.error(result?.message || "تعذر فحص جاهزية الجدول");
          }
          setFeasibilityReport(null);
          return null;
        }

        const report = result?.data?.data ?? result?.data ?? result;
        setFeasibilityReport(report);
        return report;
      } finally {
        if (!silent) setFeasibilityLoading(false);
      }
    },
    [termId, effectiveClassIds]
  );

  useEffect(() => {
    setPreview(null);
    setCommitted(false);
    setCommitConfirmOpen(false);
    setCommitRejection(null);
  }, [
    termId,
    classId,
    scope,
    onExisting,
    maxSamePerDay,
    includeUnstaffed,
  ]);

  useEffect(() => {
    const nextScope =
      initialScope === "current" && classId
        ? "current"
        : "all";

    setScope(nextScope);
  }, [initialScope, classId]);

  useEffect(() => {
    if (!classId && scope === "current") {
      setScope("all");
    }
  }, [classId, scope]);

  useEffect(() => {
    loadFeasibility({ silent: true });
  }, [loadFeasibility]);

  const runGenerate = async (mode) => {
    if (!termId) {
      toast.info("اختر الترم أولًا");
      return null;
    }

    const result = await generateTimetable({
      termId,
      classIds: effectiveClassIds,
      mode,
      onExisting,
      maxSamePerDay,
      includeUnstaffed,
    });

    if (result?.status === false) {
      const errorPayload =
        result?.data && typeof result.data === "object"
          ? normalizeResult(result.data)
          : null;

      if (mode === "commit" && errorPayload) {
        return {
          ...errorPayload,
          requestFailed: true,
          requestMessage: result?.message || "تعذر اعتماد الجدول",
        };
      }

      toast.error(
        result?.message ||
          (mode === "commit"
            ? "تعذر اعتماد الجدول"
            : "تعذر إنشاء المعاينة")
      );
      return null;
    }

    return normalizeResult(result?.data);
  };

  const handlePreview = async () => {
    if (previewLoading || commitLoading) {
      return;
    }

    setPreviewLoading(true);
    setCommitted(false);

    try {
      const data = await runGenerate(
        "preview"
      );

      if (!data) return;

      setPreview(data);
      await loadFeasibility({ silent: true });

      const previewBlockers = getBlockingProblems(data);
      const hasIncompletePlan = previewBlockers.some((problem) =>
        ["class_underfilled", "class_overbooked"].includes(String(problem?.type || ""))
      );
      const excludesUnstaffed = previewBlockers.some(
        (problem) => String(problem?.type || "") === "unstaffed_excluded"
      );

      if (hasIncompletePlan) {
        toast.warning(
          "تمت المعاينة كتجربة فقط؛ يجب استكمال خطة جميع الفصول قبل الاعتماد النهائي"
        );
      } else if (excludesUnstaffed) {
        toast.warning(
          "تمت المعاينة، لكن استبعاد المواد بدون معلم يمنع الاعتماد النهائي. فعّل إدراجها أو أسند معلمين لها."
        );
      } else if (data.unplaced > 0) {
        toast.warning(
          `تمت المعاينة: ${data.placed} حصة موزعة و ${data.unplaced} غير موزعة`
        );
      } else {
        toast.success(
          `تمت معاينة الجدول بنجاح — ${data.placed} حصة موزعة`
        );
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || commitLoading || previewLoading) {
      return;
    }

    setCommitConfirmOpen(false);
    setCommitLoading(true);

    try {
      const latestReport = await loadFeasibility({ silent: true });

      if (!latestReport || latestReport?.feasible !== true) {
        setCommitRejection(
          latestReport || {
            problems: [
              {
                type: "feasibility_unavailable",
                blocking: true,
                message: "تعذر التأكد من جاهزية الجدول للاعتماد.",
              },
            ],
          }
        );
        toast.error("لا يمكن اعتماد الجدول قبل اكتمال الجاهزية");
        return;
      }

      const data = await runGenerate("commit");

      if (!data) return;

      const blockingProblems = getBlockingProblems(data);
      const nothingWritten = data.written === 0;
      const generationIncomplete = data.failed > 0 || data.unplaced > 0;
      const rejected =
        data.requestFailed ||
        blockingProblems.length > 0 ||
        nothingWritten ||
        generationIncomplete;

      if (rejected) {
        const fallbackProblem = {
          type: "commit_not_written",
          blocking: true,
          message:
            data.requestMessage ||
            (generationIncomplete
              ? `لم يتم حفظ الجدول لأن المولد لم يستطع إكمال التوزيع بالكامل (${data.unplaced} غير موزعة، ${data.failed} فشل).`
              : "لم يتم حفظ أي حصة. الاعتماد عملية كاملة أو لا تتم؛ راجع قيود المعلمين والخانات ثم أعد المعاينة."),
        };

        const rejectionData = {
          ...data,
          problems:
            blockingProblems.length > 0
              ? data.problems
              : [...data.problems, fallbackProblem],
        };

        setPreview((current) =>
          current
            ? {
                ...current,
                problems: rejectionData.problems.length
                  ? rejectionData.problems
                  : current.problems,
              }
            : rejectionData
        );
        setCommitted(false);
        setCommitRejection(rejectionData);
        toast.error(
          data.requestMessage ||
            (nothingWritten
              ? "لم يتم حفظ الجدول؛ الاعتماد لم يكتمل بالكامل"
              : "رفض الباك إند اعتماد الجدول")
        );
        return;
      }

      setPreview(data);
      setCommitted(true);
      setCommitRejection(null);

      if (data.failed > 0) {
        toast.warning(
          `تم الاعتماد — اتكتب: ${data.written} · اتعارض: ${data.failed}${
            data.deleted > 0 ? ` · اتمسح: ${data.deleted}` : ""
          }`
        );
      } else {
        toast.success(
          `تم اعتماد الجدول — اتكتب: ${data.written} · اتعارض: 0${
            data.deleted > 0 ? ` · اتمسح: ${data.deleted}` : ""
          }`
        );
      }

      await loadFeasibility({ silent: true });

      if (typeof onCommitted === "function") {
        await onCommitted(data);
      }
    } finally {
      setCommitLoading(false);
    }
  };

  const previewBlockingProblems = getBlockingProblems(preview);
  const feasibilityBlockingProblems = getBlockingProblems(feasibilityReport);
  const previewHasIncompletePlans = [
    ...previewBlockingProblems,
    ...feasibilityBlockingProblems,
  ].some((problem) =>
    ["class_underfilled", "class_overbooked"].includes(String(problem?.type || ""))
  );

  const canCommit =
    Boolean(preview) &&
    !committed &&
    preview.unplaced === 0 &&
    preview.failed === 0 &&
    previewBlockingProblems.length === 0 &&
    feasibilityReport?.feasible === true &&
    feasibilityBlockingProblems.length === 0 &&
    !feasibilityLoading;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.1,
        overflow: "hidden",
        border:
          "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        backgroundColor:
          "var(--color-cream)",
        boxShadow:
          "0 12px 28px rgba(18,47,77,0.05)",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        justifyContent="space-between"
        gap={1}
        sx={{
          px: { xs: 1.3, md: 1.7 },
          py: 1.2,
          borderBottom:
            "1px solid rgba(36,74,112,0.07)",
        }}
      >
        <Stack
          direction="row"
          spacing={0.9}
          alignItems="center"
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color:
                "var(--color-gold-dark)",
              backgroundColor:
                "var(--color-gold-soft)",
              borderRadius: "11px",
            }}
          >
            <AutoAwesomeRounded
              sx={{ fontSize: 20 }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: "14px",
                fontWeight: 900,
              }}
            >
              إنشاء الجدول تلقائيًا
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                color:
                  "var(--color-muted)",
                fontSize: "8px",
              }}
            >
              عاين التوزيع أولًا، ثم اعتمده
              كخطوة منفصلة.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.65}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          <Chip
            size="small"
            label={
              termLabel || "الترم الحالي"
            }
            sx={{
              height: 27,
              fontSize: "8px",
              fontWeight: 800,
              color:
                "var(--color-gold-dark)",
              backgroundColor:
                "var(--color-gold-soft)",
            }}
          />

          {classId && (
            <Chip
              size="small"
              icon={<GroupsRounded />}
              label={
                classLabel || "الفصل الحالي"
              }
              sx={{
                height: 27,
                fontSize: "8px",
                fontWeight: 800,
              }}
            />
          )}
        </Stack>
      </Stack>

      <Box
        sx={{
          p: { xs: 1.2, md: 1.5 },
        }}
      >
        <Stack spacing={1.1}>
          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            spacing={1}
            alignItems={{
              xs: "stretch",
              lg: "center",
            }}
            justifyContent="space-between"
          >
            <Stack
              direction="row"
              spacing={0.6}
              useFlexGap
              flexWrap="wrap"
            >
              <Button
                type="button"
                size="small"
                variant={
                  scope === "all"
                    ? "contained"
                    : "outlined"
                }
                onClick={() =>
                  setScope("all")
                }
                sx={{
                  borderRadius: "10px",
                  minHeight: 34,
                  fontSize: "9px",
                  fontWeight: 900,
                  textTransform: "none",
                }}
              >
                كل الفصول
              </Button>

              <Button
                type="button"
                size="small"
                disabled={!classId}
                variant={
                  scope === "current"
                    ? "contained"
                    : "outlined"
                }
                onClick={() =>
                  setScope("current")
                }
                sx={{
                  borderRadius: "10px",
                  minHeight: 34,
                  fontSize: "9px",
                  fontWeight: 900,
                  textTransform: "none",
                }}
              >
                الفصل الحالي
              </Button>
            </Stack>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={0.8}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              sx={{
                "& .MuiInputBase-root": {
                  minHeight: 38,
                  borderRadius: "10px",
                  backgroundColor:
                    "var(--color-white)",
                  fontSize: "9px",
                },
              }}
            >
              <TextField
                select
                size="small"
                label="الحصص الموجودة"
                value={onExisting}
                onChange={(event) =>
                  setOnExisting(
                    event.target.value
                  )
                }
                sx={{ minWidth: 155 }}
              >
                <MenuItem value="skip">
                  تجاهل الفصول التي لها جدول
                </MenuItem>
                <MenuItem value="replace">
                  استبدال الجدول الموجود
                </MenuItem>
              </TextField>

              <TextField
                type="number"
                size="small"
                label="أقصى تكرار للمادة/اليوم"
                value={maxSamePerDay}
                onChange={(event) =>
                  setMaxSamePerDay(
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      ) || 1
                    )
                  )
                }
                inputProps={{
                  min: 1,
                  max: 10,
                  step: 1,
                }}
                sx={{ width: 170 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={
                      includeUnstaffed
                    }
                    onChange={(event) =>
                      setIncludeUnstaffed(
                        event.target.checked
                      )
                    }
                  />
                }
                label="إدراج المواد بدون معلم في الجدول"
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "8.5px",
                    fontWeight: 700,
                  },
                }}
              />
            </Stack>
          </Stack>

          <Alert
            severity="info"
            sx={{
              py: 0.15,
              borderRadius: "11px",
              fontSize: "8px",
              "& .MuiAlert-icon": {
                fontSize: 18,
              },
            }}
          >
            المعاينة لا تحفظ أي حصة ويمكن استخدامها حتى لو كانت الخطة ناقصة.
            الاعتماد النهائي لا يتاح إلا عندما تكون جاهزية جميع الفصول مكتملة 100%.
          </Alert>

          <Stack
            direction="row"
            spacing={0.8}
            useFlexGap
            flexWrap="wrap"
          >
            <Button
              type="button"
              variant="contained"
              startIcon={
                previewLoading ? (
                  <CircularProgress
                    size={15}
                    color="inherit"
                  />
                ) : (
                  <PlayArrowRounded />
                )
              }
              disabled={
                !termId ||
                previewLoading ||
                commitLoading
              }
              onClick={handlePreview}
              sx={{
                minHeight: 38,
                px: 1.6,
                borderRadius: "11px",
                fontSize: "9.5px",
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              {previewLoading
                ? "جاري إنشاء المعاينة..."
                : preview
                ? "إعادة المعاينة"
                : "معاينة الجدول"}
            </Button>

            {preview && (
              <Button
                type="button"
                variant="contained"
                startIcon={
                  commitLoading ? (
                    <CircularProgress
                      size={15}
                      color="inherit"
                    />
                  ) : (
                    <CheckCircleRounded />
                  )
                }
                disabled={
                  !canCommit ||
                  previewLoading ||
                  commitLoading
                }
                onClick={() => setCommitConfirmOpen(true)}
                title={
                  !canCommit
                    ? "لا يمكن اعتماد الجدول قبل معالجة جميع المشاكل الحاجبة في المعاينة وفحص الجاهزية"
                    : ""
                }
                sx={{
                  minHeight: 38,
                  px: 1.6,
                  borderRadius: "11px",
                  fontSize: "9.5px",
                  fontWeight: 900,
                  textTransform: "none",
                }}
              >
                {commitLoading
                  ? "جاري الاعتماد..."
                  : committed
                  ? "تم اعتماد الجدول"
                  : "اعتماد الجدول"}
              </Button>
            )}
          </Stack>

          {preview && (
            <>
              <Stack
                direction="row"
                spacing={0.65}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  icon={
                    <CheckCircleRounded />
                  }
                  label={`تم توزيع ${preview.placed} حصة`}
                  sx={{
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                />

                <Chip
                  size="small"
                  icon={
                    preview.unplaced > 0 ? (
                      <WarningAmberRounded />
                    ) : (
                      <CheckCircleRounded />
                    )
                  }
                  label={`${preview.unplaced} لم تُوزع`}
                  sx={{
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                />

                <Chip
                  size="small"
                  label={`${preview.slotsPerWeek} خانة أسبوعيًا`}
                  sx={{
                    fontSize: "8px",
                    fontWeight: 800,
                  }}
                />

                {preview.skippedClasses > 0 && (
                  <Chip
                    size="small"
                    label={`فصول متسابة: ${preview.skippedClasses}`}
                    sx={{
                      fontSize: "8px",
                      fontWeight: 800,
                    }}
                  />
                )}

                {committed && (
                  <>
                    <Chip
                      size="small"
                      label={`اتكتب: ${preview.written}`}
                      sx={{
                        fontSize: "8px",
                        fontWeight: 900,
                      }}
                    />

                    <Chip
                      size="small"
                      label={`اتعارض: ${preview.failed}`}
                      sx={{
                        fontSize: "8px",
                        fontWeight: 900,
                      }}
                    />

                    {preview.deleted > 0 && (
                      <Chip
                        size="small"
                        label={`اتمسح: ${preview.deleted}`}
                        sx={{
                          fontSize: "8px",
                          fontWeight: 900,
                        }}
                      />
                    )}
                  </>
                )}
              </Stack>

              {previewHasIncompletePlans && (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: "11px",
                    fontSize: "8.5px",
                    fontWeight: 800,
                  }}
                >
                  تنبيه: هذه معاينة تجريبية وتحتوي على خانات فارغة بسبب نقص أو زيادة
                  خطة بعض الفصول. يمكنك مراجعتها، لكن لا يمكن اعتمادها رسميًا قبل
                  مطابقة مجموع الحصص لسعة الأسبوع بالكامل.
                </Alert>
              )}

              {previewBlockingProblems.some(
                (problem) => String(problem?.type || "") === "unstaffed_excluded"
              ) && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "11px",
                    fontSize: "8.5px",
                    fontWeight: 800,
                  }}
                >
                  لا يمكن اعتماد الجدول مع استبعاد المواد التي لا يوجد لها معلم؛
                  لأن ذلك سيترك حصصًا مخططة خارج الجدول الرسمي. فعّل «إدراج المواد
                  بدون معلم» أو أسند معلمًا لكل مادة ثم أعد المعاينة.
                </Alert>
              )}

              {feasibilityReport && feasibilityReport?.feasible !== true && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "11px",
                    fontSize: "8.5px",
                    fontWeight: 800,
                  }}
                >
                  لا يمكن اعتماد الجدول حاليًا لوجود {feasibilityBlockingProblems.length} مشكلة
                  حاجبة في فحص الجاهزية. عالجها ثم أعد المعاينة.
                </Alert>
              )}

              {preview.unplaced > 0 && (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: "11px",
                    fontSize: "8px",
                  }}
                >
                  يوجد {preview.unplaced} حصة لم
                  يتمكن المولد من وضعها. راجع
                  المشاكل ثم أعد المعاينة قبل
                  الاعتماد.
                </Alert>
              )}

              {preview.failed > 0 && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "11px",
                    fontSize: "8px",
                  }}
                >
                  رفضت قاعدة البيانات {preview.failed}
                  حصة بسبب تعارض حدث بعد
                  المعاينة. أعد المعاينة من جديد.
                </Alert>
              )}

              {preview.problems.length > 0 && (
                <Stack spacing={0.6}>
                  {preview.problems.map(
                    (problem, index) => (
                      <Alert
                        key={`${problem?.type || "problem"}-${index}`}
                        severity={
                          problem?.blocking === true ||
                          BLOCKING_PROBLEM_TYPES.has(String(problem?.type || ""))
                            ? "error"
                            : problem?.type === "no_slot_left" ||
                              problem?.type === "search_exhausted"
                            ? "warning"
                            : "info"
                        }
                        sx={{
                          py: 0.1,
                          borderRadius: "10px",
                          fontSize: "8px",
                        }}
                      >
                        {getGenerationProblemText(problem)}
                      </Alert>
                    )
                  )}
                </Stack>
              )}

              <Stack spacing={1}>
                {preview.classes.map(
                  (classItem, classIndex) => {
                    const days = asArray(
                      classItem?.days
                    );

                    const dayKeys =
                      preview.workingDays.length
                        ? preview.workingDays
                        : days
                            .map(
                              (day) =>
                                day?.dayOfWeek
                            )
                            .filter(Boolean);

                    const dayMap = new Map(
                      days.map((day) => [
                        day?.dayOfWeek,
                        day,
                      ])
                    );

                    const slotCount =
                      preview.periodsPerDay ||
                      Math.max(
                        0,
                        ...days.map(
                          (day) =>
                            asArray(day?.slots)
                              .length
                        )
                      );

                    return (
                      <Paper
                        key={
                          classItem?.classId ||
                          `preview-class-${classIndex}`
                        }
                        variant="outlined"
                        sx={{
                          overflow: "hidden",
                          borderRadius: "14px",
                          borderColor:
                            "rgba(36,74,112,0.10)",
                          backgroundColor:
                            "var(--color-white)",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                          sx={{
                            px: 1.2,
                            py: 0.9,
                            borderBottom:
                              "1px solid rgba(36,74,112,0.07)",
                          }}
                        >
                          <Typography
                            sx={{
                              color:
                                "var(--color-navy-deep)",
                              fontSize: "10px",
                              fontWeight: 900,
                            }}
                          >
                            {classItem?.className ||
                              "فصل"}
                          </Typography>

                          <Chip
                            size="small"
                            label={`${numberOf(
                              classItem?.periods
                            )} حصة`}
                            sx={{
                              height: 24,
                              fontSize: "7.5px",
                              fontWeight: 800,
                            }}
                          />
                        </Stack>

                        <TableContainer>
                          <Table
                            size="small"
                            sx={{
                              minWidth: 720,
                              tableLayout:
                                "fixed",
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  align="center"
                                  sx={{
                                    width: 76,
                                    fontSize: "8px",
                                    fontWeight: 900,
                                  }}
                                >
                                  الحصة
                                </TableCell>

                                {dayKeys.map(
                                  (dayKey) => (
                                    <TableCell
                                      key={
                                        dayKey
                                      }
                                      align="center"
                                      sx={{
                                        fontSize:
                                          "8px",
                                        fontWeight:
                                          900,
                                      }}
                                    >
                                      {DAY_LABELS[
                                        dayKey
                                      ] || dayKey}
                                    </TableCell>
                                  )
                                )}
                              </TableRow>
                            </TableHead>

                            <TableBody>
                              {Array.from(
                                {
                                  length:
                                    slotCount,
                                },
                                (_, index) =>
                                  index + 1
                              ).map(
                                (slotNumber) => (
                                  <TableRow
                                    key={
                                      slotNumber
                                    }
                                  >
                                    <TableCell
                                      align="center"
                                      sx={{
                                        fontSize:
                                          "8px",
                                        fontWeight:
                                          900,
                                      }}
                                    >
                                      {slotNumber}
                                    </TableCell>

                                    {dayKeys.map(
                                      (dayKey) => {
                                        const slot =
                                          getSlot(
                                            dayMap.get(
                                              dayKey
                                            ),
                                            slotNumber
                                          );

                                        const cell =
                                          getCellContent(
                                            slot
                                          );

                                        return (
                                          <TableCell
                                            key={`${dayKey}-${slotNumber}`}
                                            align="center"
                                            sx={{
                                              p: 0.65,
                                              verticalAlign:
                                                "middle",
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                minHeight: 48,
                                                px: 0.6,
                                                py: 0.5,
                                                display:
                                                  "flex",
                                                flexDirection:
                                                  "column",
                                                justifyContent:
                                                  "center",
                                                borderRadius:
                                                  "9px",
                                                backgroundColor:
                                                  cell.empty
                                                    ? "rgba(36,74,112,0.025)"
                                                    : cell.unstaffed
                                                    ? "rgba(209,67,67,0.10)"
                                                    : "rgba(251,240,216,0.42)",
                                                border:
                                                  cell.unstaffed
                                                    ? "1px solid rgba(209,67,67,0.20)"
                                                    : "1px solid transparent",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color:
                                                    cell.empty
                                                      ? "var(--color-muted)"
                                                      : cell.unstaffed
                                                      ? "var(--color-danger)"
                                                      : "var(--color-navy-deep)",
                                                  fontSize:
                                                    "8.5px",
                                                  fontWeight:
                                                    cell.empty
                                                      ? 700
                                                      : 900,
                                                }}
                                              >
                                                {cell.subject}
                                              </Typography>

                                              <Typography
                                                sx={{
                                                  mt: 0.15,
                                                  color:
                                                    cell.unstaffed
                                                      ? "var(--color-danger)"
                                                      : "var(--color-muted)",
                                                  fontSize:
                                                    "6.8px",
                                                  fontWeight:
                                                    cell.unstaffed
                                                      ? 800
                                                      : 400,
                                                }}
                                              >
                                                {cell.teacher}
                                              </Typography>
                                            </Box>
                                          </TableCell>
                                        );
                                      }
                                    )}
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    );
                  }
                )}
              </Stack>
            </>
          )}

          {!preview && (
            <Box
              sx={{
                py: 2.6,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                border:
                  "1px dashed rgba(36,74,112,0.12)",
                borderRadius: "13px",
              }}
            >
              <Stack
                spacing={0.5}
                alignItems="center"
              >
                <RefreshRounded
                  sx={{
                    color:
                      "var(--color-muted)",
                    fontSize: 24,
                  }}
                />
                <Typography
                  sx={{
                    color:
                      "var(--color-muted)",
                    fontSize: "8.5px",
                    fontWeight: 700,
                  }}
                >
                  اضغط «معاينة الجدول» لرؤية
                  التوزيع قبل حفظ أي حصة.
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>

      <Dialog
        open={commitConfirmOpen}
        onClose={() => !commitLoading && setCommitConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
          تأكيد الاعتماد النهائي
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: "11px", fontSize: "9px" }}>
            سيتم إنشاء وحفظ الجدول الرسمي في قاعدة البيانات. سيتم فحص الجاهزية مرة
            أخرى قبل الحفظ للتأكد من أن جميع خطط الفصول مكتملة 100%.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCommitConfirmOpen(false)}
            disabled={commitLoading}
            sx={{ fontWeight: 900, textTransform: "none" }}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleCommit}
            disabled={!canCommit || commitLoading}
            startIcon={
              commitLoading ? <CircularProgress size={15} color="inherit" /> : <CheckCircleRounded />
            }
            sx={{ borderRadius: "10px", fontWeight: 900, textTransform: "none" }}
          >
            اعتماد نهائي
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(commitRejection)}
        onClose={() => setCommitRejection(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "var(--color-danger)" }}>
          تعذر اعتماد الجدول
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Alert severity="error" sx={{ borderRadius: "11px", fontSize: "9px" }}>
              لم يتم حفظ الجدول. الاعتماد النهائي عملية كاملة أو لا تتم؛
              عالج مشاكل الخطة أو الإسنادات أو تعارضات التوزيع ثم أعد المعاينة.
            </Alert>

            {getBlockingProblems(commitRejection).map((problem, index) => (
              <Alert
                key={`commit-rejection-${problem?.type || "problem"}-${index}`}
                severity="warning"
                sx={{ borderRadius: "10px", fontSize: "8.5px" }}
              >
                {getGenerationProblemText(problem)}
              </Alert>
            ))}

            {asArray(commitRejection?.classPlans)
              .filter((plan) => plan?.ok === false)
              .map((plan, index) => (
                <Box
                  key={`class-plan-${plan?.classId || index}`}
                  sx={{
                    px: 1.2,
                    py: 0.9,
                    borderRadius: "10px",
                    border: "1px solid rgba(209,67,67,.16)",
                    bgcolor: "rgba(255,240,240,.45)",
                  }}
                >
                  <Typography sx={{ fontSize: "9px", fontWeight: 900, color: "var(--color-navy-deep)" }}>
                    {plan?.name || "فصل"}: {numberOf(plan?.demand)} / {numberOf(plan?.capacity)} حصة
                  </Typography>
                  <Typography sx={{ mt: 0.2, fontSize: "8px", color: "var(--color-danger)" }}>
                    {numberOf(plan?.missing) > 0
                      ? `متبقي ${numberOf(plan?.missing)} حصة`
                      : `زيادة ${numberOf(plan?.excess)} حصة`}
                  </Typography>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCommitRejection(null)}
            variant="contained"
            sx={{ borderRadius: "10px", fontWeight: 900, textTransform: "none" }}
          >
            فهمت
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default GenerateTimetablePanel;
