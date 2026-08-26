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
  Divider,
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
  Tooltip,
  Typography,
} from "@mui/material";

import {
  ArrowBackRounded,
  CheckCircleRounded,
  GroupsRounded,
  RefreshRounded,
  SchoolRounded,
  UpgradeRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";

import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/APIs/school/academicYears";

import {
  bulkPromoteStudents,
  fetchPromotionPreview,
} from "@/APIs/school/promotion";

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        value.value ||
        ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};

const unwrapData = (value) => {
  let current = value;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    if (
      current &&
      typeof current ===
        "object" &&
      !Array.isArray(current) &&
      current.data !== undefined
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
};

const extractList = (
  value,
  keys = []
) => {
  const current =
    unwrapData(value);

  if (
    Array.isArray(current)
  ) {
    return current;
  }

  if (
    !current ||
    typeof current !==
      "object"
  ) {
    return [];
  }

  const candidates = [
    current.docs,
    current.items,
    current.results,
    current.rows,
    current.records,
    current.academicYears,
    current.years,
    current.students,
    ...keys.map(
      (key) => current?.[key]
    ),
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
};

const isFailedResponse = (
  response
) =>
  typeof response ===
    "string" ||
  response?.status === false ||
  Number(
    response?.statusCode || 0
  ) >= 400;

const getErrorMessage = (
  response,
  fallback
) => {
  if (
    typeof response ===
    "string"
  ) {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    response?.error ||
    fallback
  );
};

const getYearName = (
  year
) =>
  year?.name ||
  year?.label ||
  year?.title ||
  "سنة دراسية";

const getClassName = (
  classItem
) => {
  if (!classItem) {
    return "—";
  }

  const name =
    classItem?.name ||
    classItem?.className ||
    classItem?.title ||
    "";

  const gradeName =
    classItem?.gradeName ||
    classItem?.gradeLevelName ||
    classItem?.gradeLevel?.name ||
    classItem?.gradeLevelId?.name ||
    "";

  const roomNumber =
    classItem?.roomNumber ||
    "";

  const parts = [
    gradeName,
    name,
    roomNumber
      ? `غرفة ${roomNumber}`
      : "",
  ]
    .filter(Boolean)
    .filter(
      (
        item,
        index,
        array
      ) =>
        array.indexOf(item) ===
        index
    );

  return (
    parts.join(" - ") ||
    "فصل دراسي"
  );
};

const getTargetClassId = (
  classItem
) =>
  normalizeId(
    classItem
  );

const getStudentId = (
  row
) =>
  normalizeId(
    row?.studentId ||
      row?.student ||
      row
  );

const getStudentName = (
  row,
  index = 0
) =>
  row?.studentName ||
  row?.name ||
  row?.student?.name ||
  `طالب ${index + 1}`;

const getSubjectResults = (
  row
) =>
  Array.isArray(
    row?.subjectResults
  )
    ? row.subjectResults
    : [];

const isGraduatingStudent = (
  row
) =>
  row?.isGraduating === true;

const canStudentBePromoted = (
  row
) =>
  !isGraduatingStudent(row) &&
  Array.isArray(
    row?.availableTargetClasses
  ) &&
  row.availableTargetClasses
    .length > 0;

const EXCLUSION_REASONS = [
  {
    value: "graduated",
    label: "متخرج",
  },
  {
    value: "transferred",
    label: "انتقل لمدرسة أخرى",
  },
  {
    value: "withdrawn",
    label: "منسحب / مستبعد",
  },
];

const getDefaultExclusionReason = (
  student
) =>
  isGraduatingStudent(student)
    ? "graduated"
    : "withdrawn";

const getExecutionErrorText = (
  error,
  index
) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.message ||
    error?.error ||
    error?.reason ||
    error?.studentName ||
    `تعذر تحديث الطالب ${index + 1}`
  );
};

const getDefaultTargetClassId = (
  row
) =>
  getTargetClassId(
    row
      ?.availableTargetClasses?.[0]
  );

const Promotion = () => {
  const navigate =
    useNavigate();

  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [
    sourceYearId,
    setSourceYearId,
  ] = useState("");

  const [
    targetYearId,
    setTargetYearId,
  ] = useState("");

  const [
    preview,
    setPreview,
  ] = useState(null);

  const [
    choices,
    setChoices,
  ] = useState({});

  const [
    loadingYears,
    setLoadingYears,
  ] = useState(true);

  const [
    loadingPreview,
    setLoadingPreview,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    executionErrors,
    setExecutionErrors,
  ] = useState([]);

  const students =
    useMemo(
      () =>
        Array.isArray(
          preview?.students
        )
          ? preview.students
          : [],
      [preview]
    );

  const selectedSourceYear =
    useMemo(
      () =>
        academicYears.find(
          (item) =>
            normalizeId(item) ===
            sourceYearId
        ) || null,
      [
        academicYears,
        sourceYearId,
      ]
    );

  const selectedTargetYear =
    useMemo(
      () =>
        academicYears.find(
          (item) =>
            normalizeId(item) ===
            targetYearId
        ) || null,
      [
        academicYears,
        targetYearId,
      ]
    );

  const summary =
    useMemo(() => {
      const passed =
        students.filter(
          (item) =>
            item?.overallPassed ===
            true
        ).length;

      const failed =
        students.filter(
          (item) =>
            item?.overallPassed ===
            false
        ).length;

      const graduating =
        students.filter(
          isGraduatingStudent
        ).length;

      const promotable =
        students.filter(
          canStudentBePromoted
        ).length;

      const selected =
        students.filter(
          (item) => {
            const studentId =
              getStudentId(item);

            return (
              choices?.[
                studentId
              ]?.included ===
              true
            );
          }
        ).length;

      return {
        total:
          students.length,
        passed,
        failed,
        graduating,
        promotable,
        selected,
      };
    }, [
      students,
      choices,
    ]);

  const buildChoices = useCallback(
    (previewStudents) => {
      const next = {};

      previewStudents.forEach(
        (student) => {
          const studentId =
            getStudentId(
              student
            );

          if (!studentId) {
            return;
          }

          const eligible =
            canStudentBePromoted(
              student
            );

          next[studentId] = {
            included:
              eligible &&
              student?.overallPassed ===
                true,
            targetClassId:
              eligible
                ? getDefaultTargetClassId(
                    student
                  )
                : "",
            exclusionReason:
              getDefaultExclusionReason(
                student
              ),
          };
        }
      );

      return next;
    },
    []
  );

  const loadYears =
    useCallback(async () => {
      setLoadingYears(true);
      setPageError("");

      try {
        const [
          yearsResponse,
          activeResponse,
        ] =
          await Promise.all([
            fetchAcademicYears(),
            fetchActiveAcademicYear(),
          ]);

        if (
          isFailedResponse(
            yearsResponse
          )
        ) {
          throw new Error(
            getErrorMessage(
              yearsResponse,
              "تعذر تحميل السنوات الدراسية"
            )
          );
        }

        const years =
          extractList(
            yearsResponse,
            [
              "academicYears",
              "years",
            ]
          );

        setAcademicYears(
          years
        );

        const activeYear =
          isFailedResponse(
            activeResponse
          )
            ? null
            : unwrapData(
                activeResponse
              );

        const activeId =
          normalizeId(
            activeYear
          );

        const activeFromList =
          years.find(
            (item) =>
              normalizeId(
                item
              ) === activeId
          ) ||
          years.find(
            (item) =>
              item?.status ===
              "active"
          ) ||
          null;

        const archivedYears =
          years.filter(
            (item) =>
              item?.status ===
              "archived"
          );

        const defaultSource =
          archivedYears[
            archivedYears.length -
              1
          ] ||
          years.find(
            (item) =>
              normalizeId(
                item
              ) !==
              normalizeId(
                activeFromList
              )
          ) ||
          null;

        setTargetYearId(
          normalizeId(
            activeFromList
          )
        );

        setSourceYearId(
          normalizeId(
            defaultSource
          )
        );
      } catch (
        requestError
      ) {
        setAcademicYears(
          []
        );

        setPageError(
          requestError
            ?.message ||
            "حدث خطأ أثناء تحميل السنوات الدراسية"
        );
      } finally {
        setLoadingYears(
          false
        );
      }
    }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const loadPreview =
    useCallback(async () => {
      if (
        !sourceYearId ||
        !targetYearId
      ) {
        setPageError(
          "اختر السنة المصدر والسنة الهدف أولًا"
        );
        return;
      }

      if (
        sourceYearId ===
        targetYearId
      ) {
        setPageError(
          "السنة المصدر والسنة الهدف يجب أن تكونا مختلفتين"
        );
        return;
      }

      setLoadingPreview(
        true
      );
      setPageError("");
      setExecutionErrors([]);

      try {
        const response =
          await fetchPromotionPreview(
            targetYearId,
            sourceYearId
          );

        if (
          isFailedResponse(
            response
          )
        ) {
          throw new Error(
            getErrorMessage(
              response,
              "تعذر تحميل معاينة الترقية"
            )
          );
        }

        const data =
          unwrapData(
            response
          ) || {};

        const previewStudents =
          Array.isArray(
            data?.students
          )
            ? data.students
            : [];

        setPreview({
          ...data,
          students:
            previewStudents,
        });

        setChoices(
          buildChoices(
            previewStudents
          )
        );
      } catch (
        requestError
      ) {
        setPreview(null);
        setChoices({});

        setPageError(
          requestError
            ?.message ||
            "حدث خطأ أثناء تحميل معاينة الترقية"
        );
      } finally {
        setLoadingPreview(
          false
        );
      }
    }, [
      sourceYearId,
      targetYearId,
      buildChoices,
    ]);

  const updateIncluded = (
    student,
    checked
  ) => {
    const studentId =
      getStudentId(student);

    if (
      !studentId ||
      !canStudentBePromoted(
        student
      )
    ) {
      return;
    }

    setChoices(
      (current) => ({
        ...current,
        [studentId]: {
          ...(current?.[
            studentId
          ] || {}),
          included: checked,
          targetClassId:
            current?.[
              studentId
            ]?.targetClassId ||
            getDefaultTargetClassId(
              student
            ),
          exclusionReason:
            current?.[
              studentId
            ]?.exclusionReason ||
            getDefaultExclusionReason(
              student
            ),
        },
      })
    );
  };

  const updateTargetClass = (
    studentId,
    value
  ) => {
    setChoices(
      (current) => ({
        ...current,
        [studentId]: {
          ...(current?.[
            studentId
          ] || {}),
          targetClassId:
            normalizeId(value),
        },
      })
    );
  };

  const updateExclusionReason = (
    studentId,
    value
  ) => {
    const allowed =
      EXCLUSION_REASONS.some(
        (item) =>
          item.value === value
      );

    if (!allowed) {
      return;
    }

    setChoices(
      (current) => ({
        ...current,
        [studentId]: {
          ...(current?.[
            studentId
          ] || {}),
          exclusionReason: value,
        },
      })
    );
  };

  const payload =
    useMemo(() => {
      const promotions = [];
      const excludedStudents = [];

      students.forEach(
        (student) => {
          const studentId =
            getStudentId(
              student
            );

          if (!studentId) {
            return;
          }

          const choice =
            choices?.[
              studentId
            ] || {};

          const eligible =
            canStudentBePromoted(
              student
            );

          if (
            eligible &&
            choice.included ===
              true &&
            normalizeId(
              choice.targetClassId
            )
          ) {
            promotions.push({
              studentId,
              targetClassId:
                normalizeId(
                  choice.targetClassId
                ),
            });

            return;
          }

          excludedStudents.push({
            studentId,
            reason:
              choice.exclusionReason ||
              getDefaultExclusionReason(
                student
              ),
          });
        }
      );

      return {
        previousAcademicYearId:
          sourceYearId,
        promotions,
        excludedStudents,
      };
    }, [
      students,
      choices,
      sourceYearId,
    ]);

  const invalidSelectedCount =
    useMemo(
      () =>
        students.filter(
          (student) => {
            const studentId =
              getStudentId(
                student
              );

            const choice =
              choices?.[
                studentId
              ];

            return (
              choice?.included ===
                true &&
              !normalizeId(
                choice
                  ?.targetClassId
              )
            );
          }
        ).length,
      [
        students,
        choices,
      ]
    );

  const openConfirmation =
    () => {
      if (
        !payload.promotions.length &&
        !payload.excludedStudents.length
      ) {
        toast.info(
          "لا توجد تغييرات جاهزة للتنفيذ"
        );
        return;
      }

      if (
        invalidSelectedCount
      ) {
        toast.error(
          "اختر فصل السنة الجديدة لكل طالب محدد"
        );
        return;
      }

      setConfirmOpen(true);
    };

  const handleBulkPromote =
    async () => {
      if (
        !payload.promotions.length &&
        !payload.excludedStudents.length
      ) {
        return;
      }

      setSubmitting(true);

      try {
        const response =
          await bulkPromoteStudents(
            targetYearId,
            payload
          );

        if (
          isFailedResponse(
            response
          )
        ) {
          throw new Error(
            getErrorMessage(
              response,
              "تعذر تنفيذ ترقية الطلاب"
            )
          );
        }

        setConfirmOpen(
          false
        );

        const resultData =
          unwrapData(response) || {};

        const responseErrors =
          Array.isArray(
            resultData?.errors
          )
            ? resultData.errors
            : [];

        setExecutionErrors(
          responseErrors
        );

        const promotedCount =
          Number(
            resultData?.promotedCount ??
              resultData?.createdCount ??
              resultData?.promoted ??
              payload.promotions.length
          ) || 0;

        const excludedUpdated =
          Number(
            resultData?.excludedUpdated ??
              payload.excludedStudents.length
          ) || 0;

        if (responseErrors.length) {
          toast.warning(
            `تمت العملية: ${promotedCount} ترقية، ${excludedUpdated} تحديث استبعاد، ويوجد ${responseErrors.length} خطأ يحتاج مراجعة`
          );
        } else {
          toast.success(
            `تمت ترقية ${promotedCount} طالب وتحديث حالة ${excludedUpdated} طالب مستبعد`
          );
        }

        await loadPreview();

        if (responseErrors.length) {
          setExecutionErrors(
            responseErrors
          );
        }
      } catch (
        requestError
      ) {
        toast.error(
          requestError
            ?.message ||
            "حدث خطأ أثناء ترقية الطلاب"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  const resetPreview = () => {
    setPreview(null);
    setChoices({});
    setPageError("");
    setExecutionErrors([]);
  };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          pb: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 2,
              md: 2.5,
            },
            borderRadius:
              "22px",
            color: "#fff",
            background:
              "linear-gradient(120deg, #173B5E 0%, #244F78 58%, #2C5C87 100%)",
            boxShadow:
              "0 18px 45px rgba(18,47,77,.16)",
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
            gap={1.5}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.3}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  display:
                    "grid",
                  placeItems:
                    "center",
                  borderRadius:
                    "14px",
                  color:
                    "#122F4D",
                  backgroundColor:
                    "#F2D792",
                }}
              >
                <UpgradeRounded />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 21,
                      md: 26,
                    },
                    fontWeight:
                      900,
                  }}
                >
                  ترقية الطلاب
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color:
                      "rgba(255,255,255,.72)",
                    fontSize:
                      "12px",
                  }}
                >
                  راجع نتيجة
                  كل طالب وحدد
                  فصل السنة
                  الجديدة قبل
                  التنفيذ.
                </Typography>
              </Box>
            </Stack>

            <Button
              type="button"
              variant="outlined"
              startIcon={
                <ArrowBackRounded />
              }
              onClick={() =>
                navigate(
                  "/school/academic-years"
                )
              }
              sx={{
                minHeight: 42,
                px: 1.6,
                color: "#fff",
                borderColor:
                  "rgba(255,255,255,.28)",
                borderRadius:
                  "12px",
                fontWeight:
                  800,
                textTransform:
                  "none",
                "&:hover": {
                  borderColor:
                    "rgba(255,255,255,.55)",
                  backgroundColor:
                    "rgba(255,255,255,.07)",
                },
                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "6px",
                    marginRight: 0,
                  },
              }}
            >
              السنوات الدراسية
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.4,
            p: {
              xs: 1.5,
              md: 2,
            },
            border:
              "1px solid rgba(36,74,112,.10)",
            borderRadius:
              "18px",
            backgroundColor:
              "#fff",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            gap={1.2}
            alignItems={{
              xs: "stretch",
              lg: "center",
            }}
          >
            <TextField
              select
              size="small"
              label="السنة المصدر"
              value={
                sourceYearId
              }
              disabled={
                loadingYears
              }
              onChange={(
                event
              ) => {
                setSourceYearId(
                  event.target
                    .value
                );
                resetPreview();
              }}
              sx={{
                minWidth: {
                  xs: "100%",
                  lg: 240,
                },
                "& .MuiOutlinedInput-root":
                  {
                    minHeight: 44,
                    borderRadius:
                      "12px",
                  },
              }}
            >
              {academicYears.map(
                (year) => (
                  <MenuItem
                    key={
                      normalizeId(
                        year
                      )
                    }
                    value={
                      normalizeId(
                        year
                      )
                    }
                    disabled={
                      normalizeId(
                        year
                      ) ===
                      targetYearId
                    }
                  >
                    {getYearName(
                      year
                    )}
                    {year?.status ===
                    "active"
                      ? " - الحالية"
                      : ""}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              select
              size="small"
              label="السنة الهدف"
              value={
                targetYearId
              }
              disabled={
                loadingYears
              }
              onChange={(
                event
              ) => {
                setTargetYearId(
                  event.target
                    .value
                );
                resetPreview();
              }}
              sx={{
                minWidth: {
                  xs: "100%",
                  lg: 240,
                },
                "& .MuiOutlinedInput-root":
                  {
                    minHeight: 44,
                    borderRadius:
                      "12px",
                  },
              }}
            >
              {academicYears.map(
                (year) => (
                  <MenuItem
                    key={
                      normalizeId(
                        year
                      )
                    }
                    value={
                      normalizeId(
                        year
                      )
                    }
                    disabled={
                      normalizeId(
                        year
                      ) ===
                      sourceYearId
                    }
                  >
                    {getYearName(
                      year
                    )}
                    {year?.status ===
                    "active"
                      ? " - الحالية"
                      : ""}
                  </MenuItem>
                )
              )}
            </TextField>

            <Button
              type="button"
              variant="contained"
              disabled={
                loadingYears ||
                loadingPreview ||
                !sourceYearId ||
                !targetYearId ||
                sourceYearId ===
                  targetYearId
              }
              startIcon={
                loadingPreview ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <RefreshRounded />
                )
              }
              onClick={
                loadPreview
              }
              sx={{
                minHeight: 44,
                px: 2.3,
                borderRadius:
                  "12px",
                backgroundColor:
                  "#244A70",
                boxShadow:
                  "none",
                fontWeight:
                  900,
                textTransform:
                  "none",
                "&:hover": {
                  backgroundColor:
                    "#1B3D61",
                  boxShadow:
                    "none",
                },
                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "6px",
                    marginRight: 0,
                  },
              }}
            >
              تحميل المعاينة
            </Button>
          </Stack>

          <Typography
            sx={{
              mt: 1,
              color:
                "#7B8794",
              fontSize:
                "11px",
            }}
          >
            المعاينة تحسب
            النجاح لكل مادة
            وتعرض الفصول
            المتاحة في السنة
            الهدف قبل تنفيذ
            أي ترقية.
          </Typography>
        </Paper>

        {pageError && (
          <Alert
            severity="warning"
            sx={{
              mt: 1.2,
              borderRadius:
                "14px",
            }}
          >
            {pageError}
          </Alert>
        )}

        {executionErrors.length > 0 && (
          <Alert
            severity="warning"
            sx={{
              mt: 1.2,
              borderRadius:
                "14px",
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "11px",
              }}
            >
              تمت العملية مع أخطاء تحتاج مراجعة:
            </Typography>

            <Stack
              spacing={0.35}
              sx={{ mt: 0.6 }}
            >
              {executionErrors
                .slice(0, 6)
                .map(
                  (
                    error,
                    index
                  ) => (
                    <Typography
                      key={index}
                      sx={{
                        fontSize:
                          "10px",
                      }}
                    >
                      •{" "}
                      {getExecutionErrorText(
                        error,
                        index
                      )}
                    </Typography>
                  )
                )}
            </Stack>
          </Alert>
        )}

        {loadingYears ? (
          <Box
            sx={{
              minHeight: 260,
              display: "grid",
              placeItems:
                "center",
            }}
          >
            <CircularProgress
              size={30}
              sx={{
                color:
                  "#244A70",
              }}
            />
          </Box>
        ) : academicYears.length <
          2 ? (
          <Alert
            severity="info"
            sx={{
              mt: 1.2,
              borderRadius:
                "14px",
            }}
          >
            يلزم وجود سنتين
            دراسيتين على الأقل
            لاستخدام الترقية:
            سنة مصدر وسنة هدف.
          </Alert>
        ) : null}

        {preview && (
          <>
            <Box
              sx={{
                mt: 1.4,
                display:
                  "grid",
                gridTemplateColumns:
                  {
                    xs: "repeat(2, minmax(0,1fr))",
                    md: "repeat(3, minmax(0,1fr))",
                    xl: "repeat(6, minmax(0,1fr))",
                  },
                gap: 1,
              }}
            >
              {[
                {
                  label:
                    "إجمالي الطلاب",
                  value:
                    summary.total,
                  icon:
                    <GroupsRounded />,
                  color:
                    "#244A70",
                },
                {
                  label:
                    "ناجحون",
                  value:
                    summary.passed,
                  icon:
                    <CheckCircleRounded />,
                  color:
                    "#25865A",
                },
                {
                  label:
                    "غير مجتازين",
                  value:
                    summary.failed,
                  icon:
                    <WarningAmberRounded />,
                  color:
                    "#C44545",
                },
                {
                  label:
                    "متخرجون",
                  value:
                    summary.graduating,
                  icon:
                    <SchoolRounded />,
                  color:
                    "#7C5CBE",
                },
                {
                  label:
                    "قابلون للترقية",
                  value:
                    summary.promotable,
                  icon:
                    <UpgradeRounded />,
                  color:
                    "#B9821D",
                },
                {
                  label:
                    "محددون الآن",
                  value:
                    summary.selected,
                  icon:
                    <CheckCircleRounded />,
                  color:
                    "#25865A",
                },
              ].map(
                (item) => (
                  <Paper
                    key={
                      item.label
                    }
                    elevation={0}
                    sx={{
                      p: 1.4,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: 1,
                      border:
                        "1px solid rgba(36,74,112,.08)",
                      borderRadius:
                        "16px",
                      backgroundColor:
                        "#fff",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color:
                            "#7B8794",
                          fontSize:
                            "10px",
                          fontWeight:
                            800,
                        }}
                      >
                        {
                          item.label
                        }
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.2,
                          color:
                            "#122F4D",
                          fontSize:
                            "24px",
                          fontWeight:
                            900,
                        }}
                      >
                        {
                          item.value
                        }
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        display:
                          "grid",
                        placeItems:
                          "center",
                        borderRadius:
                          "11px",
                        color:
                          item.color,
                        backgroundColor:
                          `${item.color}12`,
                        "& svg":
                          {
                            fontSize:
                              21,
                          },
                      }}
                    >
                      {
                        item.icon
                      }
                    </Box>
                  </Paper>
                )
              )}
            </Box>

            <Alert
              severity="info"
              sx={{
                mt: 1.2,
                borderRadius:
                  "14px",
              }}
            >
              يمكن للإدارة ترقية
              الطالب غير المجتاز
              يدويًا إذا كان له فصل
              متاح في السنة الجديدة.
              لن يتم تحديده تلقائيًا؛
              فعّل خانة الترقية بنفسك.
              الطلاب غير المرقّين
              سيظهر لهم سبب استبعاد.
            </Alert>

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                mt: 1.2,
                border:
                  "1px solid rgba(36,74,112,.09)",
                borderRadius:
                  "18px",
                overflowX:
                  "auto",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 1250,
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        "#F7F9FB",
                    }}
                  >
                    {[
                      "ترقية",
                      "الطالب",
                      "الفصل الحالي",
                      "النتيجة",
                      "تفاصيل المواد",
                      "الصف التالي",
                      "فصل السنة الجديدة",
                      "سبب الاستبعاد",
                    ].map(
                      (
                        header
                      ) => (
                        <TableCell
                          key={
                            header
                          }
                          align="right"
                          sx={{
                            py: 1.3,
                            color:
                              "#52606D",
                            fontWeight:
                              900,
                            fontSize:
                              "11px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            header
                          }
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map(
                    (
                      student,
                      index
                    ) => {
                      const studentId =
                        getStudentId(
                          student
                        );

                      const choice =
                        choices?.[
                          studentId
                        ] || {};

                      const graduating =
                        isGraduatingStudent(
                          student
                        );

                      const eligible =
                        canStudentBePromoted(
                          student
                        );

                      const subjectResults =
                        getSubjectResults(
                          student
                        );

                      const failedRequired =
                        subjectResults.filter(
                          (
                            subject
                          ) =>
                            subject?.isRequiredForPromotion !==
                              false &&
                            subject?.passed ===
                              false
                        );

                      const targetClasses =
                        Array.isArray(
                          student?.availableTargetClasses
                        )
                          ? student.availableTargetClasses
                          : [];

                      return (
                        <TableRow
                          key={
                            studentId ||
                            index
                          }
                          hover
                          sx={{
                            "&:last-child td":
                              {
                                borderBottom: 0,
                              },
                          }}
                        >
                          <TableCell
                            align="right"
                          >
                            <Tooltip
                              title={
                                eligible
                                  ? student?.overallPassed ===
                                      false
                                    ? "ترقية يدوية رغم أن الطالب غير مجتاز"
                                    : "تضمين الطالب في الترقية"
                                  : graduating
                                    ? "طالب متخرج"
                                    : "لا يوجد فصل هدف متاح"
                              }
                            >
                              <span>
                                <Checkbox
                                  checked={
                                    choice.included ===
                                    true
                                  }
                                  disabled={
                                    !eligible
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateIncluded(
                                      student,
                                      event
                                        .target
                                        .checked
                                    )
                                  }
                                  sx={{
                                    color:
                                      "rgba(36,74,112,.3)",
                                    "&.Mui-checked":
                                      {
                                        color:
                                          "#25865A",
                                      },
                                  }}
                                />
                              </span>
                            </Tooltip>
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            <Typography
                              sx={{
                                color:
                                  "#122F4D",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  900,
                              }}
                            >
                              {getStudentName(
                                student,
                                index
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            <Typography
                              sx={{
                                color:
                                  "#52606D",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {getClassName(
                                student?.currentClass
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            {graduating ? (
                              <Chip
                                size="small"
                                label="متخرج"
                                sx={{
                                  color:
                                    "#6247A6",
                                  backgroundColor:
                                    "rgba(124,92,190,.10)",
                                  fontWeight:
                                    900,
                                }}
                              />
                            ) : student?.overallPassed ===
                              true ? (
                              <Chip
                                size="small"
                                label="ناجح"
                                sx={{
                                  color:
                                    "#237449",
                                  backgroundColor:
                                    "rgba(37,134,90,.10)",
                                  fontWeight:
                                    900,
                                }}
                              />
                            ) : (
                              <Stack
                                direction="row"
                                gap={0.5}
                                flexWrap="wrap"
                              >
                                <Chip
                                  size="small"
                                  label="غير مجتاز"
                                  sx={{
                                    color:
                                      "#A93434",
                                    backgroundColor:
                                      "rgba(196,69,69,.10)",
                                    fontWeight:
                                      900,
                                  }}
                                />

                                {choice.included ===
                                  true && (
                                  <Chip
                                    size="small"
                                    label="ترقية يدوية"
                                    sx={{
                                      color:
                                        "#9A6B12",
                                      backgroundColor:
                                        "#FFF3D8",
                                      fontWeight:
                                        900,
                                    }}
                                  />
                                )}
                              </Stack>
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              maxWidth:
                                330,
                            }}
                          >
                            {subjectResults.length ? (
                              <Stack
                                direction="row"
                                gap={0.5}
                                flexWrap="wrap"
                              >
                                {subjectResults.map(
                                  (
                                    subject,
                                    subjectIndex
                                  ) => (
                                    <Tooltip
                                      key={
                                        normalizeId(
                                          subject?.subjectId
                                        ) ||
                                        subjectIndex
                                      }
                                      title={`درجة النجاح: ${
                                        subject?.passingGrade ??
                                        "—"
                                      }${
                                        subject?.isRequiredForPromotion ===
                                        false
                                          ? " • مادة غير مؤثرة على الترقية"
                                          : ""
                                      }`}
                                    >
                                      <Chip
                                        size="small"
                                        label={`${subject?.subjectName || "مادة"}: ${
                                          subject?.finalGrade ??
                                          "—"
                                        }`}
                                        sx={{
                                          height:
                                            25,
                                          color:
                                            subject?.passed ===
                                            false
                                              ? "#A93434"
                                              : "#237449",
                                          backgroundColor:
                                            subject?.passed ===
                                            false
                                              ? "rgba(196,69,69,.08)"
                                              : "rgba(37,134,90,.08)",
                                          border:
                                            subject?.isRequiredForPromotion ===
                                            false
                                              ? "1px dashed rgba(36,74,112,.18)"
                                              : "none",
                                          fontSize:
                                            "9px",
                                          fontWeight:
                                            800,
                                        }}
                                      />
                                    </Tooltip>
                                  )
                                )}
                              </Stack>
                            ) : (
                              <Typography
                                sx={{
                                  color:
                                    "#9AA6B2",
                                  fontSize:
                                    "10px",
                                }}
                              >
                                لا توجد
                                نتائج مواد
                              </Typography>
                            )}

                            {failedRequired.length >
                              0 && (
                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color:
                                    "#A93434",
                                  fontSize:
                                    "9px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                مواد إلزامية
                                غير مجتازة:{" "}
                                {failedRequired
                                  .map(
                                    (
                                      item
                                    ) =>
                                      item?.subjectName
                                  )
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    "، "
                                  )}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            <Typography
                              sx={{
                                color:
                                  graduating
                                    ? "#6247A6"
                                    : "#52606D",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {graduating
                                ? "نهاية المرحلة"
                                : student
                                    ?.suggestedNextGrade
                                    ?.name ||
                                  "—"}
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            {eligible ? (
                              <TextField
                                select
                                size="small"
                                value={
                                  choice.targetClassId ||
                                  ""
                                }
                                disabled={
                                  choice.included !==
                                  true
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateTargetClass(
                                    studentId,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                sx={{
                                  minWidth:
                                    185,
                                  "& .MuiOutlinedInput-root":
                                    {
                                      minHeight:
                                        38,
                                      borderRadius:
                                        "10px",
                                    },
                                }}
                              >
                                {targetClasses.map(
                                  (
                                    classItem
                                  ) => (
                                    <MenuItem
                                      key={
                                        getTargetClassId(
                                          classItem
                                        )
                                      }
                                      value={
                                        getTargetClassId(
                                          classItem
                                        )
                                      }
                                    >
                                      {getClassName(
                                        classItem
                                      )}
                                    </MenuItem>
                                  )
                                )}
                              </TextField>
                            ) : (
                              <Typography
                                sx={{
                                  color:
                                    "#9AA6B2",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    700,
                                }}
                              >
                                {graduating
                                  ? "لا يحتاج فصلًا جديدًا"
                                  : "لا يوجد فصل متاح"}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            {choice.included ===
                            true ? (
                              <Typography
                                sx={{
                                  color:
                                    "#9AA6B2",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    700,
                                }}
                              >
                                —
                              </Typography>
                            ) : (
                              <TextField
                                select
                                size="small"
                                value={
                                  choice.exclusionReason ||
                                  getDefaultExclusionReason(
                                    student
                                  )
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateExclusionReason(
                                    studentId,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                sx={{
                                  minWidth:
                                    175,
                                  "& .MuiOutlinedInput-root":
                                    {
                                      minHeight:
                                        38,
                                      borderRadius:
                                        "10px",
                                    },
                                }}
                              >
                                {EXCLUSION_REASONS.map(
                                  (
                                    reason
                                  ) => (
                                    <MenuItem
                                      key={
                                        reason.value
                                      }
                                      value={
                                        reason.value
                                      }
                                    >
                                      {
                                        reason.label
                                      }
                                    </MenuItem>
                                  )
                                )}
                              </TextField>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {!students.length && (
              <Paper
                elevation={0}
                sx={{
                  mt: 1.2,
                  minHeight:
                    220,
                  display:
                    "grid",
                  placeItems:
                    "center",
                  border:
                    "1px solid rgba(36,74,112,.08)",
                  borderRadius:
                    "18px",
                  backgroundColor:
                    "#fff",
                }}
              >
                <Stack
                  alignItems="center"
                  spacing={0.7}
                >
                  <GroupsRounded
                    sx={{
                      color:
                        "#B9821D",
                      fontSize:
                        36,
                    }}
                  />
                  <Typography
                    sx={{
                      color:
                        "#122F4D",
                      fontWeight:
                        900,
                    }}
                  >
                    لا يوجد طلاب
                    في معاينة
                    الترقية
                  </Typography>
                </Stack>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{
                mt: 1.3,
                p: {
                  xs: 1.5,
                  md: 1.8,
                },
                display:
                  "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
                gap: 1.3,
                border:
                  "1px solid rgba(211,164,79,.24)",
                borderRadius:
                  "18px",
                backgroundColor:
                  "rgba(242,215,146,.10)",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      "#122F4D",
                    fontSize:
                      "13px",
                    fontWeight:
                      900,
                  }}
                >
                  جاهز للترقية:{" "}
                  {
                    payload
                      .promotions
                      .length
                  }{" "}
                  طالب
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color:
                      "#7B8794",
                    fontSize:
                      "10px",
                  }}
                >
                  المستبعدون:{" "}
                  {
                    payload
                      .excludedStudents
                      .length
                  }{" "}
                  • الاستبعاد لا
                  يعيد تسجيل
                  الطالب تلقائيًا
                  في نفس الصف.
                </Typography>
              </Box>

              <Button
                type="button"
                variant="contained"
                startIcon={
                  <UpgradeRounded />
                }
                disabled={
                  submitting ||
                  (
                    !payload.promotions
                      .length &&
                    !payload
                      .excludedStudents
                      .length
                  ) ||
                  invalidSelectedCount >
                    0
                }
                onClick={
                  openConfirmation
                }
                sx={{
                  minHeight: 44,
                  px: 2.4,
                  color:
                    "#122F4D",
                  backgroundColor:
                    "#F2D792",
                  borderRadius:
                    "12px",
                  boxShadow:
                    "none",
                  fontWeight:
                    900,
                  textTransform:
                    "none",
                  "&:hover": {
                    backgroundColor:
                      "#E8C96F",
                    boxShadow:
                      "none",
                  },
                  "& .MuiButton-startIcon":
                    {
                      marginLeft:
                        "6px",
                      marginRight:
                        0,
                    },
                }}
              >
                تنفيذ الترقية
              </Button>
            </Paper>
          </>
        )}

        <Dialog
          open={confirmOpen}
          onClose={() => {
            if (!submitting) {
              setConfirmOpen(
                false
              );
            }
          }}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius:
                "20px",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight:
                900,
              color:
                "#122F4D",
            }}
          >
            تأكيد ترقية
            الطلاب
          </DialogTitle>

          <DialogContent>
            <Stack
              spacing={1.2}
            >
              <Alert
                severity="warning"
                sx={{
                  borderRadius:
                    "12px",
                }}
              >
                سيتم إنشاء
                تسجيلات جديدة
                للطلاب في السنة
                الهدف. سجلات
                السنة السابقة
                تظل محفوظة.
              </Alert>

              <Typography
                sx={{
                  color:
                    "#52606D",
                  fontSize:
                    "12px",
                }}
              >
                من{" "}
                <strong>
                  {getYearName(
                    selectedSourceYear
                  )}
                </strong>{" "}
                إلى{" "}
                <strong>
                  {getYearName(
                    selectedTargetYear
                  )}
                </strong>
              </Typography>

              <Divider />

              <Typography
                sx={{
                  color:
                    "#122F4D",
                  fontSize:
                    "13px",
                  fontWeight:
                    900,
                }}
              >
                سيتم ترقية{" "}
                {
                  payload
                    .promotions
                    .length
                }{" "}
                طالب
              </Typography>

              <Typography
                sx={{
                  color:
                    "#7B8794",
                  fontSize:
                    "11px",
                }}
              >
                وسيتم إرسال{" "}
                {
                  payload
                    .excludedStudents
                    .length
                }{" "}
                طالب ضمن قائمة
                الاستبعاد.
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 2.5,
              gap: 1,
            }}
          >
            <Button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                setConfirmOpen(
                  false
                )
              }
              sx={{
                borderRadius:
                  "10px",
                fontWeight:
                  800,
                textTransform:
                  "none",
              }}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              variant="contained"
              disabled={
                submitting
              }
              startIcon={
                submitting ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <UpgradeRounded />
                )
              }
              onClick={
                handleBulkPromote
              }
              sx={{
                borderRadius:
                  "10px",
                backgroundColor:
                  "#244A70",
                boxShadow:
                  "none",
                fontWeight:
                  900,
                textTransform:
                  "none",
                "&:hover": {
                  backgroundColor:
                    "#1B3D61",
                  boxShadow:
                    "none",
                },
                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "6px",
                    marginRight: 0,
                  },
              }}
            >
              تأكيد التنفيذ
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Promotion;
