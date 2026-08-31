import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import { generateTimetable } from "@/APIs/school/lectures";

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
    problems: asArray(data?.problems),
    workingDays: asArray(
      data?.workingDays
    ),
    placed: numberOf(data?.placed),
    unplaced: numberOf(data?.unplaced),
    written: data?.written,
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

  return {
    empty: false,
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
  onCommitted,
}) => {
  const [scope, setScope] =
    useState("all");

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

  const effectiveClassIds =
    useMemo(
      () =>
        scope === "current" && classId
          ? [classId]
          : [],
      [scope, classId]
    );

  useEffect(() => {
    setPreview(null);
    setCommitted(false);
  }, [
    termId,
    classId,
    scope,
    onExisting,
    maxSamePerDay,
    includeUnstaffed,
  ]);

  useEffect(() => {
    if (!classId && scope === "current") {
      setScope("all");
    }
  }, [classId, scope]);

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

      if (data.unplaced > 0) {
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
    if (
      !preview ||
      commitLoading ||
      previewLoading
    ) {
      return;
    }

    setCommitLoading(true);

    try {
      const data = await runGenerate(
        "commit"
      );

      if (!data) return;

      setPreview(data);
      setCommitted(true);

      if (data.failed > 0) {
        toast.warning(
          `تم الاعتماد مع ${data.failed} تعارض. أعد المعاينة قبل المحاولة مرة أخرى.`
        );
      } else {
        toast.success(
          `تم اعتماد الجدول — ${numberOf(
            data.written
          )} حصة محفوظة`
        );
      }

      if (
        typeof onCommitted === "function"
      ) {
        await onCommitted(data);
      }
    } finally {
      setCommitLoading(false);
    }
  };

  const canCommit =
    Boolean(preview) &&
    !committed &&
    preview.unplaced === 0 &&
    preview.failed === 0;

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
            المعاينة لا تحفظ أي حصة. زر
            «اعتماد الجدول» يظهر للاستخدام بعد
            نجاح المعاينة فقط.
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
                onClick={handleCommit}
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
                    label={`${preview.skippedClasses} فصل تم تجاهله`}
                    sx={{
                      fontSize: "8px",
                      fontWeight: 800,
                    }}
                  />
                )}

                {committed && (
                  <Chip
                    size="small"
                    label={`${numberOf(
                      preview.written
                    )} حصة محفوظة`}
                    sx={{
                      fontSize: "8px",
                      fontWeight: 900,
                    }}
                  />
                )}
              </Stack>

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
                          problem?.type ===
                            "no_slot_left" ||
                          problem?.type ===
                            "search_exhausted"
                            ? "warning"
                            : "info"
                        }
                        sx={{
                          py: 0.1,
                          borderRadius: "10px",
                          fontSize: "8px",
                        }}
                      >
                        {problem?.type ===
                        "no_slot_left"
                          ? `${problem?.className || "فصل"} — لم توجد خانة مناسبة لمادة ${
                              problem?.subjectName || "مادة"
                            }${
                              problem?.teacherName
                                ? ` مع ${problem.teacherName}`
                                : ""
                            }.`
                          : problem?.type ===
                            "search_exhausted"
                          ? "الخطة مزدحمة جدًا ولم يكتمل البحث عن توزيع مناسب لكل الحصص."
                          : "ظهرت ملاحظة أثناء إنشاء الجدول. راجع الإعدادات والخطة."}
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
                                                    : "rgba(251,240,216,0.42)",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color:
                                                    cell.empty
                                                      ? "var(--color-muted)"
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
                                                    "var(--color-muted)",
                                                  fontSize:
                                                    "6.8px",
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
    </Paper>
  );
};

export default GenerateTimetablePanel;
