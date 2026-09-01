import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CheckCircleRounded,
  ErrorOutlineRounded,
  FactCheckRounded,
  GroupsRounded,
  RefreshRounded,
  SchoolRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchLectureFeasibility,
} from "@/APIs/school/lectures";

const asArray = (value) =>
  Array.isArray(value) ? value : [];

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
};

const boundedPercent = (value, capacity) => {
  const current = asNumber(value);
  const max = asNumber(capacity);

  if (max <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.min(
    100,
    Math.max(0, (current / max) * 100)
  );
};

const getProblemText = (problem = {}) => {
  const type = String(problem?.type || "")
    .trim()
    .toLowerCase();

  const className =
    problem?.className ||
    problem?.class?.name ||
    "الفصل";

  const teacherName =
    problem?.teacherName ||
    problem?.teacher?.name ||
    "المعلم";

  const subjectName =
    problem?.subjectName ||
    problem?.subject?.name ||
    "المادة";

  const required = asNumber(
    problem?.required ??
      problem?.demand ??
      problem?.load
  );

  const capacity = asNumber(
    problem?.capacity
  );

  const periodsPerWeek = asNumber(
    problem?.periodsPerWeek
  );

  const overBy =
    required > capacity
      ? required - capacity
      : 0;

  switch (type) {
    case "no_working_days":
      return "لا توجد أيام عمل مفعلة في جدول دوام المدرسة. فعّل يوم عمل واحدًا على الأقل من إعدادات المدرسة.";

    case "nothing_planned":
      return "لم يتم تحديد عدد الحصص الأسبوعية لأي مادة في هذا الترم. حدّد خطة الحصص أولًا من عروض المواد.";

    case "class_overbooked":
      return `${className}: يحتاج ${required} حصة أسبوعيًا بينما السعة ${capacity}${
        overBy
          ? ` — زيادة ${overBy} حصة`
          : ""
      }.`;

    case "teacher_overloaded":
      return `${teacherName}: مسند له ${required} حصة أسبوعيًا بينما السعة ${capacity}${
        overBy
          ? ` — زيادة ${overBy} حصة`
          : ""
      }.`;

    case "subject_unassigned": {
      const count = asNumber(problem?.count);

      if (count > 0) {
        return `${count} ${count === 1 ? "مادة بدون معلم" : "مواد بدون معلم"} — ستُجدول كفراغات ظاهرة حتى يتم إسناد معلم.`;
      }

      return `${subjectName} في ${className} بدون معلم${
        periodsPerWeek
          ? ` (${periodsPerWeek} حصص أسبوعيًا)`
          : ""
      }. ستظهر الحصص كفراغات حتى يتم إسناد معلم.`;
    }

    case "assignment_shared": {
      const teacherCount = asNumber(problem?.teacherCount);
      const countText = teacherCount > 0 ? ` (${teacherCount} معلمين)` : "";

      return `${className}: يوجد أكثر من معلم على نفس الصف بدون تحديد الفصول لكل معلم${countText}. راجع الإسنادات لتجنب تقسيم غير مقصود.`;
    }

    default:
      return "توجد ملاحظة تحتاج مراجعة قبل اعتماد الجدول.";
  }
};

const SummaryCard = ({
  label,
  value,
  helper,
  danger = false,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      minWidth: 0,
      border:
        danger
          ? "1px solid rgba(209,67,67,0.22)"
          : "1px solid rgba(36,74,112,0.08)",
      borderRadius: "14px",
      backgroundColor:
        danger
          ? "rgba(255,240,240,0.72)"
          : "var(--color-white)",
    }}
  >
    <Typography
      sx={{
        color: "var(--color-muted)",
        fontSize: "9px",
        fontWeight: 800,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.25,
        color:
          danger
            ? "var(--color-danger)"
            : "var(--color-navy-deep)",
        fontSize: "20px",
        fontWeight: 950,
        lineHeight: 1.15,
      }}
    >
      {value}
    </Typography>

    {helper ? (
      <Typography
        sx={{
          mt: 0.3,
          color: "var(--color-muted)",
          fontSize: "8.5px",
          lineHeight: 1.55,
        }}
      >
        {helper}
      </Typography>
    ) : null}
  </Paper>
);

const CapacityRow = ({
  icon,
  name,
  value,
  capacity,
  free,
  ok,
}) => {
  const current = asNumber(value);
  const max = asNumber(capacity);
  const remaining = asNumber(
    free,
    max - current
  );

  return (
    <Box
      sx={{
        px: 1.15,
        py: 1,
        border:
          ok === false
            ? "1px solid rgba(209,67,67,0.18)"
            : "1px solid rgba(36,74,112,0.07)",
        borderRadius: "13px",
        backgroundColor:
          ok === false
            ? "rgba(255,240,240,0.55)"
            : "var(--color-white)",
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
        gap={0.7}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.65}
          sx={{ minWidth: 0 }}
        >
          {icon}

          <Typography
            sx={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color:
                "var(--color-navy-deep)",
              fontSize: "10.5px",
              fontWeight: 850,
            }}
          >
            {name || "—"}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.65}
          sx={{
            minWidth: {
              xs: 0,
              sm: 210,
            },
          }}
        >
          <Typography
            sx={{
              minWidth: 58,
              color:
                ok === false
                  ? "var(--color-danger)"
                  : "var(--color-navy)",
              fontSize: "10px",
              fontWeight: 900,
              textAlign: "left",
              direction: "ltr",
            }}
          >
            {current}/{max}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={boundedPercent(
              current,
              max
            )}
            sx={{
              flex: 1,
              height: 7,
              borderRadius: 99,
              backgroundColor:
                "rgba(36,74,112,0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 99,
                backgroundColor:
                  ok === false
                    ? "var(--color-danger)"
                    : "#27966f",
              },
            }}
          />

          <Typography
            sx={{
              minWidth: 66,
              color:
                remaining < 0
                  ? "var(--color-danger)"
                  : "var(--color-muted)",
              fontSize: "8.5px",
              fontWeight: 800,
              textAlign: "left",
            }}
          >
            {remaining < 0
              ? `زيادة ${Math.abs(
                  remaining
                )}`
              : `متاح ${remaining}`}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

const FeasibilityPanel = ({
  termId,
  termLabel = "",
  classId = "",
  classLabel = "",
}) => {
  const [scope, setScope] =
    useState("all");

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!classId && scope === "current") {
      setScope("all");
    }
  }, [classId, scope]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!termId) {
        setData(null);
        setError("");
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      setError("");

      try {
        const response =
          await fetchLectureFeasibility(
            {
              termId,
              classIds:
                scope === "current" &&
                classId
                  ? [classId]
                  : [],
            },
            {
              force: true,
            }
          );

        if (response?.status === false) {
          setData(null);
          setError(
            response?.message ||
              "تعذر فحص قابلية الجدول"
          );
          return;
        }

        setData(
          response?.data?.data ??
            response?.data ??
            response
        );
      } catch (requestError) {
        setData(null);
        setError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "تعذر فحص قابلية الجدول"
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [termId, classId, scope]
  );

  useEffect(() => {
    load();
  }, [load]);

  const problems = useMemo(
    () => asArray(data?.problems),
    [data]
  );

  const blockingProblems =
    useMemo(
      () =>
        problems.filter(
          (item) =>
            item?.blocking === true
        ),
      [problems]
    );

  const warningProblems =
    useMemo(
      () =>
        problems.filter(
          (item) =>
            item?.blocking !== true
        ),
      [problems]
    );

  const teachers = useMemo(
    () => asArray(data?.teachers),
    [data]
  );

  // Backend already sends teachers heaviest first.
  // Do not sort here.
  const classes = useMemo(
    () => asArray(data?.classes),
    [data]
  );

  const unassignedSubjects =
    useMemo(
      () =>
        asArray(
          data?.unassignedSubjects
        ),
      [data]
    );

  const workingDays = asArray(
    data?.workingDays
  );

  const periodsPerDay = asNumber(
    data?.periodsPerDay,
    7
  );

  const slotsPerWeek = asNumber(
    data?.slotsPerWeek
  );

  const feasible =
    data?.feasible === true;

  if (!termId) {
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 1.1,
          p: 1.4,
          border:
            "1px solid rgba(36,74,112,0.08)",
          borderRadius: "16px",
          backgroundColor:
            "var(--color-cream)",
        }}
      >
        <Stack
          direction="row"
          spacing={0.8}
          alignItems="center"
        >
          <FactCheckRounded
            sx={{
              color:
                "var(--color-gold-dark)",
            }}
          />
          <Box>
            <Typography
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: "12px",
                fontWeight: 900,
              }}
            >
              فحص قابلية الجدول
            </Typography>
            <Typography
              sx={{
                mt: 0.1,
                color:
                  "var(--color-muted)",
                fontSize: "9px",
              }}
            >
              اختر فصلًا وترمًا أولًا لعرض
              نتيجة الفحص.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.1,
        overflow: "hidden",
        border:
          feasible && data
            ? "1px solid rgba(39,150,111,0.22)"
            : data
            ? "1px solid rgba(209,67,67,0.2)"
            : "1px solid rgba(36,74,112,0.08)",
        borderRadius: "18px",
        backgroundColor:
          "var(--color-cream)",
        boxShadow:
          "0 8px 20px rgba(18,47,77,0.045)",
      }}
    >
      <Box
        sx={{
          px: { xs: 1.3, md: 1.6 },
          py: 1.15,
          background:
            "linear-gradient(135deg, rgba(36,74,112,0.035), rgba(255,255,255,0.92))",
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
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.85}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                borderRadius: "11px",
                color:
                  feasible && data
                    ? "#1f805f"
                    : data
                    ? "var(--color-danger)"
                    : "var(--color-gold-dark)",
                backgroundColor:
                  feasible && data
                    ? "rgba(39,150,111,0.1)"
                    : data
                    ? "rgba(209,67,67,0.08)"
                    : "var(--color-gold-soft)",
              }}
            >
              {feasible && data ? (
                <CheckCircleRounded />
              ) : data ? (
                <ErrorOutlineRounded />
              ) : (
                <FactCheckRounded />
              )}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                gap={0.6}
              >
                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  فحص قابلية الجدول
                </Typography>

                {termLabel ? (
                  <Chip
                    size="small"
                    label={termLabel}
                    sx={{
                      height: 23,
                      color:
                        "var(--color-gold-dark)",
                      backgroundColor:
                        "var(--color-gold-soft)",
                      fontSize: "8px",
                      fontWeight: 800,
                    }}
                  />
                ) : null}
              </Stack>

              <Typography
                sx={{
                  mt: 0.15,
                  color:
                    "var(--color-muted)",
                  fontSize: "9px",
                  lineHeight: 1.55,
                }}
              >
                {scope === "current" &&
                classId
                  ? `النطاق: ${
                      classLabel ||
                      "الفصل الحالي"
                    }`
                  : "النطاق: كل الفصول النشطة في الترم"}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            gap={0.65}
          >
            <Button
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
                minHeight: 34,
                borderRadius: "10px",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              كل الفصول
            </Button>

            {classId ? (
              <Button
                size="small"
                variant={
                  scope === "current"
                    ? "contained"
                    : "outlined"
                }
                onClick={() =>
                  setScope("current")
                }
                sx={{
                  minHeight: 34,
                  borderRadius:
                    "10px",
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform:
                    "none",
                  boxShadow: "none",
                }}
              >
                الفصل الحالي
              </Button>
            ) : null}

            <Button
              size="small"
              variant="outlined"
              startIcon={
                loading ? (
                  <CircularProgress
                    size={13}
                    color="inherit"
                  />
                ) : (
                  <RefreshRounded />
                )
              }
              onClick={() => load()}
              disabled={loading}
              sx={{
                minHeight: 34,
                borderRadius: "10px",
                color:
                  "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.15)",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "none",
                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "5px",
                    marginRight: 0,
                  },
              }}
            >
              تحديث الفحص
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Divider
        sx={{
          borderColor:
            "rgba(36,74,112,0.07)",
        }}
      />

      <Box
        sx={{
          p: { xs: 1.3, md: 1.6 },
        }}
      >
        {loading && !data ? (
          <Box
            sx={{
              py: 4,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress
              size={28}
              sx={{
                color:
                  "var(--color-navy)",
              }}
            />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: "12px",
              fontSize: "10px",
            }}
          >
            {error}
          </Alert>
        ) : data ? (
          <Stack spacing={1.25}>
            <Alert
              severity={
                feasible
                  ? "success"
                  : "error"
              }
              icon={
                feasible ? (
                  <CheckCircleRounded />
                ) : (
                  <WarningAmberRounded />
                )
              }
              sx={{
                borderRadius: "13px",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {feasible
                ? "الجدول قابل للتنفيذ وفق الخطة والإسنادات الحالية."
                : `الجدول غير قابل للتنفيذ حاليًا — ${blockingProblems.length} مشكلة مانعة.`}
            </Alert>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 0.8,
              }}
            >
              <SummaryCard
                label="السعة الأسبوعية"
                value={slotsPerWeek}
                helper={`${workingDays.length} أيام × ${periodsPerDay} حصص`}
                danger={
                  slotsPerWeek <= 0
                }
              />

              <SummaryCard
                label="الحصص المطلوبة"
                value={asNumber(
                  data?.totalPeriodsNeeded
                )}
                helper="حسب خطة عروض المواد"
              />

              <SummaryCard
                label="الحصص الموجودة"
                value={asNumber(
                  data?.existingLectures
                )}
                helper="المسجلة حاليًا"
              />

              <SummaryCard
                label="مواد بدون معلم"
                value={
                  unassignedSubjects.length
                }
                helper="تحتاج مراجعة الإسنادات"
                danger={
                  unassignedSubjects.length >
                  0
                }
              />
            </Box>

            {!data?.scheduleConfigured ? (
              <Alert
                severity="warning"
                sx={{
                  borderRadius:
                    "12px",
                  fontSize: "9.5px",
                }}
              >
                جدول الدوام التفصيلي غير
                مضبوط؛ السعة قد تعتمد على
                أيام العمل الافتراضية.
              </Alert>
            ) : null}

            {problems.length > 0 ? (
              <Box>
                <Typography
                  sx={{
                    mb: 0.65,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  المشاكل والملاحظات
                </Typography>

                <Stack spacing={0.6}>
                  {problems.map(
                    (
                      problem,
                      index
                    ) => (
                      <Alert
                        key={`problem-${
                          problem?.type ||
                          "unknown"
                        }-${index}`}
                        severity={
                          problem?.blocking
                            ? "error"
                            : "warning"
                        }
                        sx={{
                          py: 0.25,
                          borderRadius:
                            "11px",
                          fontSize:
                            "9.5px",
                          lineHeight: 1.6,
                        }}
                      >
                        {getProblemText(
                          problem
                        )}
                      </Alert>
                    )
                  )}
                </Stack>
              </Box>
            ) : null}

            {teachers.length > 0 ? (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.55}
                  sx={{ mb: 0.65 }}
                >
                  <GroupsRounded
                    sx={{
                      fontSize: 17,
                      color:
                        "var(--color-gold-dark)",
                    }}
                  />
                  <Typography
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "11px",
                      fontWeight: 900,
                    }}
                  >
                    أحمال المعلمين
                  </Typography>
                </Stack>

                <Stack spacing={0.55}>
                  {teachers.map(
                    (
                      teacher,
                      index
                    ) => (
                      <CapacityRow
                        key={
                          teacher?.teacherId ||
                          teacher?._id ||
                          `teacher-${index}`
                        }
                        icon={
                          <GroupsRounded
                            sx={{
                              fontSize:
                                16,
                              color:
                                "var(--color-navy-light)",
                            }}
                          />
                        }
                        name={
                          teacher?.name ||
                          teacher?.teacherName ||
                          "معلم"
                        }
                        value={
                          teacher?.load
                        }
                        capacity={
                          teacher?.capacity
                        }
                        free={
                          teacher?.free
                        }
                        ok={
                          teacher?.ok
                        }
                      />
                    )
                  )}
                </Stack>
              </Box>
            ) : null}

            {classes.length > 0 ? (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.55}
                  sx={{ mb: 0.65 }}
                >
                  <SchoolRounded
                    sx={{
                      fontSize: 17,
                      color:
                        "var(--color-gold-dark)",
                    }}
                  />
                  <Typography
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: "11px",
                      fontWeight: 900,
                    }}
                  >
                    سعة الفصول
                  </Typography>
                </Stack>

                <Stack spacing={0.55}>
                  {classes.map(
                    (
                      classItem,
                      index
                    ) => (
                      <CapacityRow
                        key={
                          classItem?.classId ||
                          classItem?._id ||
                          `class-${index}`
                        }
                        icon={
                          <SchoolRounded
                            sx={{
                              fontSize:
                                16,
                              color:
                                "var(--color-navy-light)",
                            }}
                          />
                        }
                        name={
                          classItem?.name ||
                          classItem?.className ||
                          "فصل"
                        }
                        value={
                          classItem?.demand
                        }
                        capacity={
                          classItem?.capacity
                        }
                        free={
                          classItem?.free
                        }
                        ok={
                          classItem?.ok
                        }
                      />
                    )
                  )}
                </Stack>
              </Box>
            ) : null}

            {unassignedSubjects.length >
            0 ? (
              <Box>
                <Typography
                  sx={{
                    mb: 0.65,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                >
                  مواد بدون معلم
                </Typography>

                <Stack spacing={0.55}>
                  {unassignedSubjects.map(
                    (
                      item,
                      index
                    ) => (
                      <Box
                        key={`${item?.subjectOfferingId || "offering"}-${
                          item?.classId ||
                          item?.className ||
                          "class"
                        }-${index}`}
                        sx={{
                          px: 1.1,
                          py: 0.9,
                          border:
                            "1px solid rgba(211,164,79,0.2)",
                          borderRadius:
                            "11px",
                          backgroundColor:
                            "rgba(251,240,216,0.45)",
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "var(--color-navy-deep)",
                            fontSize:
                              "9.5px",
                            fontWeight:
                              850,
                          }}
                        >
                          {item?.subjectName ||
                            "مادة"}{" "}
                          —{" "}
                          {item?.className ||
                            "فصل"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.15,
                            color:
                              "var(--color-muted)",
                            fontSize:
                              "8.5px",
                          }}
                        >
                          {asNumber(
                            item?.periodsPerWeek
                          )}{" "}
                          حصص أسبوعيًا
                        </Typography>
                      </Box>
                    )
                  )}
                </Stack>
              </Box>
            ) : null}

            {warningProblems.length >
              0 &&
            blockingProblems.length ===
              0 ? (
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: "8.5px",
                }}
              >
                توجد ملاحظات غير مانعة؛
                يمكنك تنفيذ الجدول بعد
                مراجعتها.
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Box>
    </Paper>
  );
};

export default FeasibilityPanel;
