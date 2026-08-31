import {
  AddRounded,
  AssignmentIndRounded,
  DeleteOutlineRounded,
  MenuBookRounded,
  PersonRounded,
  RefreshRounded,
  SearchRounded,
  UploadFileRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
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
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";

import { api } from "@/APIs/Axios";

import { fetchClassesList } from "@/APIs/school/classes";

import {
  fetchTeachersList,
} from "@/APIs/users/teachers";

import {
  fetchSubjectOfferings as fetchAllSubjectOfferings,
} from "@/APIs/school/subjectOfferings";

import {
  addTeacherAssignment,
  deleteTeacherAssignment,
  fetchLectureFeasibility,
  fetchTeacherAssignments,
} from "@/APIs/school/lectures";

const COLORS = {
  navy: "#122f4d",
  navy2: "#244a70",
  gold: "#b78430",
  goldSoft: "#fbf0d8",
  page: "#ffffff",
  border: "#e1e6eb",
  muted: "#778491",
  green: "#16865f",
  red: "#d14343",
};

const idOf = (value) =>
  String(
    value?._id ||
      value?.id ||
      value ||
      ""
  ).trim();

const unwrap = (value) => {
  let current = value;

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

const LIST_KEYS = [
  "items",
  "results",
  "docs",
  "rows",
  "records",
  "teachers",
  "classes",
  "offerings",
  "subjectOfferings",
  "assignments",
];

const extractList = (value) => {
  const root = unwrap(value);

  if (Array.isArray(root)) {
    return root;
  }

  if (!root || typeof root !== "object") {
    return [];
  }

  for (const key of LIST_KEYS) {
    if (Array.isArray(root?.[key])) {
      return root[key];
    }
  }

  return [];
};

const extractEntity = (value) => {
  const root = unwrap(value);

  if (
    !root ||
    Array.isArray(root) ||
    typeof root !== "object"
  ) {
    return null;
  }

  return (
    root?.academicYear ||
    root?.year ||
    root?.term ||
    root
  );
};

const isFailed = (value) =>
  value?.status === false;

const messageOf = (
  value,
  fallback = "حدث خطأ ما"
) =>
  value?.message ||
  value?.data?.message ||
  value?.error?.message ||
  fallback;

const getTeacherValue = (assignment) =>
  assignment?.teacherId ||
  assignment?.teacher ||
  null;

const teacherNameOf = (value) => {
  const directName =
    value?.name ||
    value?.teacherName ||
    value?.fullName ||
    value?.displayName ||
    value?.label ||
    value?.user?.name ||
    value?.userId?.name ||
    value?.profile?.name;

  if (
    directName &&
    String(directName).trim()
  ) {
    return String(directName).trim();
  }

  const splitName = [
    value?.firstName,
    value?.fatherName,
    value?.familyName,
  ]
    .filter(Boolean)
    .map((part) =>
      String(part).trim()
    )
    .filter(Boolean)
    .join(" ");

  if (splitName) {
    return splitName;
  }

  const nestedSplitName = [
    value?.user?.firstName,
    value?.user?.fatherName,
    value?.user?.familyName,
  ]
    .filter(Boolean)
    .map((part) =>
      String(part).trim()
    )
    .filter(Boolean)
    .join(" ");

  if (nestedSplitName) {
    return nestedSplitName;
  }

  return (
    value?.username ||
    value?.user?.username ||
    value?.email ||
    value?.user?.email ||
    "معلم"
  );
};

const getOfferingValue = (assignment) =>
  assignment?.subjectOfferingId ||
  assignment?.subjectOffering ||
  null;

const getOfferingSubject = (offering) =>
  offering?.subjectId ||
  offering?.subject ||
  offering?.subjectDetails ||
  null;

const getOfferingGrade = (offering) =>
  offering?.gradeLevelId ||
  offering?.gradeLevel ||
  offering?.grade ||
  null;

const subjectNameOf = (offering) => {
  const subject =
    getOfferingSubject(offering);

  return (
    subject?.subjectName ||
    subject?.name ||
    subject?.title ||
    offering?.subjectName ||
    offering?.name ||
    "مادة"
  );
};

const gradeNameOf = (offering) => {
  const grade =
    getOfferingGrade(offering);

  return (
    grade?.name ||
    grade?.gradeName ||
    grade?.title ||
    offering?.gradeName ||
    "صف غير معروف"
  );
};

const offeringLabelOf = (offering) =>
  `${subjectNameOf(offering)} — ${gradeNameOf(
    offering
  )}`;

const termLabelOf = (term) => {
  if (!term) {
    return "";
  }

  if (typeof term !== "object") {
    return "";
  }

  return (
    term?.name ||
    term?.title ||
    term?.label ||
    (term?.order
      ? `الترم ${term.order}`
      : "")
  );
};

const classGradeIdOf = (classItem) =>
  idOf(
    classItem?.gradeLevelId ||
      classItem?.gradeLevel ||
      classItem?.grade
  );

const classLabelOf = (classItem) => {
  if (!classItem) {
    return "كل الفصول";
  }

  const name =
    classItem?.name ||
    classItem?.className ||
    "";

  const room =
    classItem?.roomNumber ||
    "";

  if (
    name &&
    room &&
    name !== room
  ) {
    return `${name} — ${room}`;
  }

  return (
    name ||
    room ||
    "فصل"
  );
};

const assignmentClassValue = (assignment) =>
  assignment?.classId ||
  assignment?.class ||
  null;

const assignmentClassLabel = (
  assignment
) => {
  const value =
    assignmentClassValue(
      assignment
    );

  if (!value) {
    return "كل الفصول";
  }

  if (
    typeof value === "object"
  ) {
    return classLabelOf(value);
  }

  return "فصل محدد";
};

const assignmentOfferingId = (
  assignment
) =>
  idOf(
    getOfferingValue(
      assignment
    )
  );

const AssignmentDialog = ({
  open,
  loading,
  teachers,
  offerings,
  classes,
  terms,
  assignments,
  selectedTermId,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] =
    useState({
      termId: "",
      teacherId: "",
      subjectOfferingId: "",
      classId: "",
    });


  const [liveCapacity, setLiveCapacity] =
    useState({
      loading: false,
      currentLoad: 0,
      projectedLoad: 0,
      capacity: 0,
      addedLoad: 0,
      error: "",
    });

  const defaultTermId = useMemo(
    () => {
      const selectedExists =
        terms.some(
          (item) =>
            item.id ===
            selectedTermId
        );

      if (selectedExists) {
        return selectedTermId;
      }

      return (
        terms.find(
          (item) =>
            item?.status === "active"
        )?.id ||
        terms[0]?.id ||
        ""
      );
    },
    [terms, selectedTermId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      termId: defaultTermId,
      teacherId: "",
      subjectOfferingId: "",
      classId: "",
    });

    setLiveCapacity({
      loading: false,
      currentLoad: 0,
      projectedLoad: 0,
      capacity: 0,
      addedLoad: 0,
      error: "",
    });
  }, [open, defaultTermId]);

  useEffect(() => {
    if (
      open &&
      !form.termId &&
      defaultTermId
    ) {
      setForm((current) => ({
        ...current,
        termId: defaultTermId,
        subjectOfferingId: "",
        classId: "",
      }));
    }
  }, [
    open,
    form.termId,
    defaultTermId,
  ]);

  const filteredOfferings = useMemo(
    () =>
      offerings.filter(
        (item) =>
          !form.termId ||
          item.termId === form.termId
      ),
    [offerings, form.termId]
  );

  const selectedOffering =
    useMemo(
      () =>
        offerings.find(
          (item) =>
            item.id ===
            form.subjectOfferingId
        ) || null,
      [
        form.subjectOfferingId,
        offerings,
      ]
    );

  const selectedGradeId =
    selectedOffering?.gradeLevelId ||
    "";

  const availableClasses =
    useMemo(
      () =>
        classes.filter(
          (item) =>
            !selectedGradeId ||
            item.gradeLevelId ===
              selectedGradeId
        ),
      [
        classes,
        selectedGradeId,
      ]
    );

  const selectedTerm =
    useMemo(
      () =>
        terms.find(
          (item) =>
            item.id === form.termId
        ) || null,
      [terms, form.termId]
    );

  const duplicateAssignment =
    useMemo(() => {
      if (
        !form.teacherId ||
        !form.subjectOfferingId
      ) {
        return null;
      }

      return (
        assignments.find((item) => {
          if (
            item.teacherId !==
              form.teacherId ||
            item.offeringId !==
              form.subjectOfferingId
          ) {
            return false;
          }

          // اختيار "كل الفصول" يتداخل مع أي
          // إسناد موجود لنفس المعلم والمادة.
          if (!form.classId) {
            return true;
          }

          // إسناد عام موجود بالفعل يغطي الفصل
          // المحدد، أو نفس الفصل مسند مسبقًا.
          return (
            !item.classId ||
            item.classId ===
              form.classId
          );
        }) || null
      );
    }, [
      assignments,
      form.teacherId,
      form.subjectOfferingId,
      form.classId,
    ]);

  useEffect(() => {
    if (
      !open ||
      !form.teacherId ||
      !selectedOffering?.termId ||
      duplicateAssignment
    ) {
      setLiveCapacity({
        loading: false,
        currentLoad: 0,
        projectedLoad: 0,
        capacity: 0,
        addedLoad: 0,
        error: "",
      });
      return undefined;
    }

    let active = true;

    setLiveCapacity((current) => ({
      ...current,
      loading: true,
      error: "",
    }));

    const timer = window.setTimeout(async () => {
      const result = await fetchLectureFeasibility(
        {
          termId: selectedOffering.termId,
        },
        { force: true }
      );

      if (!active) return;

      if (result?.status === false) {
        setLiveCapacity({
          loading: false,
          currentLoad: 0,
          projectedLoad: 0,
          capacity: 0,
          addedLoad: 0,
          error:
            result?.message ||
            "تعذر حساب حمل المعلم",
        });
        return;
      }

      const payload = unwrap(result?.data);
      const teacherRow = extractList(
        payload?.teachers || []
      ).find(
        (teacher) =>
          idOf(
            teacher?.teacherId ||
              teacher?.teacher ||
              teacher?._id
          ) === form.teacherId
      );

      const currentLoad = Number(
        teacherRow?.load || 0
      );

      const capacity = Number(
        teacherRow?.capacity ??
          payload?.slotsPerWeek ??
          0
      );

      const periodsPerWeek = Number(
        selectedOffering?.periodsPerWeek || 0
      );

      const affectedClassCount = form.classId
        ? 1
        : Math.max(
            1,
            availableClasses.length
          );

      const addedLoad =
        periodsPerWeek * affectedClassCount;

      const projectedLoad =
        currentLoad + addedLoad;

      setLiveCapacity({
        loading: false,
        currentLoad:
          Number.isFinite(currentLoad)
            ? currentLoad
            : 0,
        projectedLoad:
          Number.isFinite(projectedLoad)
            ? projectedLoad
            : 0,
        capacity:
          Number.isFinite(capacity)
            ? capacity
            : 0,
        addedLoad:
          Number.isFinite(addedLoad)
            ? addedLoad
            : 0,
        error: "",
      });
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    open,
    form.teacherId,
    form.classId,
    selectedOffering,
    availableClasses.length,
    duplicateAssignment,
  ]);

  const projectedOverCapacity =
    liveCapacity.capacity > 0 &&
    liveCapacity.projectedLoad >
      liveCapacity.capacity;

  const valid =
    Boolean(form.termId) &&
    Boolean(form.teacherId) &&
    Boolean(
      form.subjectOfferingId
    ) &&
    !duplicateAssignment &&
    !projectedOverCapacity;

  const handleTermChange = (
    value
  ) => {
    setForm((current) => ({
      ...current,
      termId: value,
      subjectOfferingId: "",
      classId: "",
    }));
  };

  const handleOfferingChange = (
    value
  ) => {
    setForm((current) => ({
      ...current,
      subjectOfferingId: value,
      classId: "",
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "18px",
          direction: "rtl",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 2.6,
          pb: 0.7,
        }}
      >
        <Typography
          component="div"
          sx={{
            color: COLORS.navy,
            fontSize: 21,
            fontWeight: 900,
          }}
        >
          إسناد مادة إلى معلم
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: 0.45,
            color: COLORS.muted,
            fontSize: 11,
            lineHeight: 1.7,
          }}
        >
          اترك الفصل على «كل فصول
          الصف» للإسناد العام، أو
          اختر فصلًا محددًا عند تقسيم
          الصف بين أكثر من معلم.
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          pt: "18px !important",
          pb: 1,
        }}
      >
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="الترم"
            value={form.termId}
            onChange={(event) =>
              handleTermChange(
                event.target.value
              )
            }
            disabled={loading}
            helperText="اختر الترم أولًا حتى تظهر عروض المواد الصحيحة وخطة الحصص الخاصة به."
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  borderRadius:
                    "12px",
                },
            }}
          >
            {terms.map((term) => (
              <MenuItem
                key={term.id}
                value={term.id}
              >
                {term.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="المعلم"
            value={form.teacherId}
            onChange={(event) =>
              setForm(
                (current) => ({
                  ...current,
                  teacherId:
                    event.target
                      .value,
                })
              )
            }
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  borderRadius:
                    "12px",
                },
            }}
          >
            {teachers.map(
              (teacher) => (
                <MenuItem
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.name}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            fullWidth
            label="المادة"
            value={
              form.subjectOfferingId
            }
            onChange={(event) =>
              handleOfferingChange(
                event.target.value
              )
            }
            disabled={
              loading || !form.termId
            }
            helperText={
              form.termId
                ? `${filteredOfferings.length} عرض مادة في ${selectedTerm?.label || "الترم المختار"}`
                : "اختر الترم أولًا"
            }
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  borderRadius:
                    "12px",
                },
            }}
          >
            {filteredOfferings.map(
              (offering) => (
                <MenuItem
                  key={offering.id}
                  value={offering.id}
                >
                  {offering.label}
                  {offering.termLabel
                    ? ` — ${offering.termLabel}`
                    : ""}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            fullWidth
            label="الفصل"
            value={form.classId}
            onChange={(event) =>
              setForm(
                (current) => ({
                  ...current,
                  classId:
                    event.target
                      .value,
                })
              )
            }
            disabled={
              loading ||
              !form.subjectOfferingId
            }
            helperText={
              form.subjectOfferingId
                ? "اختياري — عدم اختيار فصل يعني كل فصول الصف."
                : "اختر المادة أولًا لعرض فصول الصف."
            }
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  borderRadius:
                    "12px",
                },
            }}
          >
            <MenuItem value="">
              كل فصول الصف
            </MenuItem>

            {availableClasses.map(
              (classItem) => (
                <MenuItem
                  key={classItem.id}
                  value={classItem.id}
                >
                  {classItem.name}
                </MenuItem>
              )
            )}
          </TextField>

          {duplicateAssignment ? (
            <Alert
              severity="error"
              sx={{
                borderRadius: "12px",
                fontSize: 9.5,
                fontWeight: 700,
              }}
            >
              {duplicateAssignment.classId
                ? "هذا المعلم لديه إسناد لهذه المادة على هذا الفصل بالفعل."
                : "هذا المعلم لديه إسناد عام لهذه المادة بالفعل ويغطي كل فصول الصف."}
            </Alert>
          ) : null}

          {form.teacherId &&
          form.subjectOfferingId ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                border: `1px solid ${
                  projectedOverCapacity
                    ? "rgba(209,67,67,0.24)"
                    : "rgba(36,74,112,0.09)"
                }`,
                borderRadius: "12px",
                backgroundColor:
                  projectedOverCapacity
                    ? "#fff3f3"
                    : "#f8fafc",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                flexWrap="wrap"
              >
                <Box>
                  <Typography
                    sx={{
                      color: COLORS.muted,
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    حمل المعلم المتوقع بعد الإسناد
                  </Typography>

                  {liveCapacity.loading ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.6}
                      sx={{ mt: 0.5 }}
                    >
                      <CircularProgress
                        size={14}
                        sx={{ color: COLORS.navy }}
                      />
                      <Typography
                        sx={{
                          color: COLORS.muted,
                          fontSize: 9.5,
                        }}
                      >
                        جاري حساب السعة...
                      </Typography>
                    </Stack>
                  ) : liveCapacity.error ? (
                    <Typography
                      sx={{
                        mt: 0.45,
                        color: COLORS.red,
                        fontSize: 9.5,
                        fontWeight: 700,
                      }}
                    >
                      {liveCapacity.error}
                    </Typography>
                  ) : (
                    <Stack
                      direction="row"
                      alignItems="baseline"
                      spacing={0.5}
                      sx={{ mt: 0.35 }}
                    >
                      <Typography
                        sx={{
                          color: projectedOverCapacity
                            ? COLORS.red
                            : COLORS.navy,
                          fontSize: 22,
                          fontWeight: 950,
                          direction: "ltr",
                        }}
                      >
                        {liveCapacity.projectedLoad}/
                        {liveCapacity.capacity}
                      </Typography>

                      <Typography
                        sx={{
                          color: COLORS.muted,
                          fontSize: 8.5,
                        }}
                      >
                        حصة أسبوعيًا
                      </Typography>
                    </Stack>
                  )}
                </Box>

                {!liveCapacity.loading &&
                !liveCapacity.error ? (
                  <Chip
                    size="small"
                    label={
                      projectedOverCapacity
                        ? `زيادة ${
                            liveCapacity.projectedLoad -
                            liveCapacity.capacity
                          }`
                        : `+${liveCapacity.addedLoad} من هذا الإسناد`
                    }
                    sx={{
                      height: 26,
                      color: projectedOverCapacity
                        ? COLORS.red
                        : COLORS.green,
                      bgcolor: projectedOverCapacity
                        ? "#ffe8e8"
                        : "#eaf7f1",
                      fontSize: 9,
                      fontWeight: 850,
                    }}
                  />
                ) : null}
              </Stack>

              {!form.classId &&
              availableClasses.length > 1 ? (
                <Typography
                  sx={{
                    mt: 0.55,
                    color: COLORS.muted,
                    fontSize: 8.5,
                    lineHeight: 1.55,
                  }}
                >
                  لأن الإسناد على «كل فصول الصف»، تم حساب حصص المادة على {availableClasses.length} فصول.
                </Typography>
              ) : null}
            </Paper>
          ) : null}

          {projectedOverCapacity ? (
            <Alert
              severity="error"
              sx={{
                borderRadius: "12px",
                fontSize: 9.5,
                fontWeight: 700,
              }}
            >
              لا يمكن حفظ هذا الإسناد لأنه سيرفع حمل المعلم فوق السعة الأسبوعية.
            </Alert>
          ) : null}

          {form.subjectOfferingId &&
          availableClasses.length ===
            0 ? (
            <Alert
              severity="info"
              sx={{
                borderRadius:
                  "12px",
                fontSize: 11,
              }}
            >
              لا توجد فصول ظاهرة
              لهذا الصف حاليًا. يمكنك
              حفظ الإسناد على «كل
              فصول الصف».
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pt: 1.5,
          pb: 2.5,
          gap: 1,
          justifyContent:
            "flex-start",
        }}
      >
        <Button
          variant="contained"
          onClick={() =>
            onSubmit(form)
          }
          disabled={
            loading || !valid
          }
          sx={{
            minWidth: 145,
            minHeight: 44,
            borderRadius: "11px",
            bgcolor: COLORS.navy,
            fontWeight: 800,
            boxShadow: "none",

            "&:hover": {
              bgcolor:
                COLORS.navy2,
              boxShadow: "none",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : (
            "حفظ الإسناد"
          )}
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 44,
            borderRadius: "11px",
            color: COLORS.navy,
            borderColor:
              COLORS.border,
            fontWeight: 700,
          }}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const AssignmentImportDialog = ({
  open,
  termId,
  onClose,
  onImported,
}) => {
  const [text, setText] =
    useState("");
  const [preview, setPreview] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [
    committing,
    setCommitting,
  ] = useState(false);

  useEffect(() => {
    if (!open) return;

    setText("");
    setPreview(null);
  }, [open, termId]);

  const runImport = async (
    dryRun
  ) => {
    if (!termId) {
      toast.error(
        "اختر الترم أولًا"
      );
      return null;
    }

    if (!text.trim()) {
      toast.error(
        "الصق بيانات الإسنادات أولًا"
      );
      return null;
    }

    const setBusy = dryRun
      ? setLoading
      : setCommitting;

    setBusy(true);

    try {
      const response =
        await api.post(
          "/teacher-assignments/import",
          {
            termId,
            text: text.trim(),
            dryRun,
          }
        );

      const payload =
        unwrap(response?.data) || {};

      if (dryRun) {
        setPreview(payload);

        if (
          Number(
            payload?.errors || 0
          ) > 0
        ) {
          toast.warning(
            "تمت المعاينة ويوجد سطور تحتاج مراجعة"
          );
        } else {
          toast.success(
            "المعاينة جاهزة — راجع الإسنادات ثم أكّد الحفظ"
          );
        }
      }

      return payload;
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          error?.response?.data
            ?.error ||
          error?.message ||
          (dryRun
            ? "تعذر معاينة الإسنادات"
            : "تعذر استيراد الإسنادات")
      );

      return null;
    } finally {
      setBusy(false);
    }
  };

  const handlePreview =
    async () => {
      await runImport(true);
    };

  const handleCommit =
    async () => {
      if (!preview) {
        toast.info(
          "اعمل معاينة للإسنادات أولًا"
        );
        return;
      }

      if (
        Number(
          preview?.errors || 0
        ) > 0
      ) {
        toast.error(
          "صحّح السطور التي بها أخطاء ثم أعد المعاينة قبل الحفظ"
        );
        return;
      }

      const result =
        await runImport(false);

      if (!result) return;

      toast.success(
        `تم استيراد الإسنادات${
          Number(
            result?.written || 0
          )
            ? ` — ${result.written} إسناد محفوظ`
            : ""
        }`
      );

      await onImported?.(
        result
      );

      onClose();
    };

  const rows = Array.isArray(
    preview?.results
  )
    ? preview.results
    : [];

  const hasErrors =
    Number(
      preview?.errors || 0
    ) > 0;

  const getStatusMeta = (
    status
  ) => {
    switch (status) {
      case "assigned":
        return {
          label: "سيتم الإسناد",
          bgcolor:
            "rgba(22,134,95,0.10)",
          color: COLORS.green,
        };

      case "skipped":
        return {
          label: "موجود مسبقًا",
          bgcolor:
            "rgba(183,132,48,0.12)",
          color: COLORS.gold,
        };

      case "error":
        return {
          label: "خطأ",
          bgcolor:
            "rgba(209,67,67,0.10)",
          color: COLORS.red,
        };

      default:
        return {
          label:
            status || "نتيجة",
          bgcolor: "#f2f4f6",
          color: COLORS.muted,
        };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading || committing
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius:
            "18px",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 0.7,
          color: COLORS.navy,
          fontWeight: 900,
          fontSize: 21,
        }}
      >
        استيراد إسنادات المعلمين
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            color: COLORS.muted,
            fontSize: 11,
            lineHeight: 1.8,
            mb: 1.2,
          }}
        >
          الصق ثلاثة أعمدة:
          المعلم، المادة، الصف.
          يمكن كتابة أكثر من صف
          في نفس السطر باستخدام +
          أو /. المعاينة لا تحفظ
          أي شيء.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 1.1,
            mb: 1.2,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius:
              "11px",
            bgcolor:
              "rgba(36,74,112,0.035)",
          }}
        >
          <Typography
            sx={{
              color: COLORS.muted,
              fontSize: 9,
            }}
          >
            الترم
          </Typography>

          <Typography
            sx={{
              color: COLORS.navy,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            سيتم الاستيراد للترم
            المختار في الصفحة
          </Typography>
        </Paper>

        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={11}
          label="الصق الإسنادات"
          placeholder={
            "اروى\tالرياضيات\tالصف الأول متوسط\nهيا الخالدي\tالرياضيات\tالصف الأول متوسط\nفاطمة\tعلوم\tالصف الأول متوسط + الصف الثاني متوسط"
          }
          value={text}
          onChange={(event) => {
            setText(
              event.target.value
            );
            setPreview(null);
          }}
          sx={{
            "& .MuiOutlinedInput-root":
              {
                borderRadius:
                  "13px",
                alignItems:
                  "flex-start",
              },

            "& textarea": {
              fontFamily:
                "inherit",
              fontSize: 13,
              lineHeight: 1.8,
            },
          }}
        />

        {preview ? (
          <Box mt={1.5}>
            <Stack
              direction="row"
              gap={0.7}
              flexWrap="wrap"
              mb={1}
            >
              <Chip
                size="small"
                label={`السطور: ${
                  preview?.totalLines ??
                  rows.length
                }`}
              />

              <Chip
                size="small"
                label={`إسناد: ${
                  preview?.assigned ??
                  0
                }`}
                sx={{
                  bgcolor:
                    "rgba(22,134,95,0.09)",
                  color:
                    COLORS.green,
                }}
              />

              <Chip
                size="small"
                label={`تخطي: ${
                  preview?.skipped ??
                  0
                }`}
                sx={{
                  bgcolor:
                    "rgba(183,132,48,0.11)",
                  color:
                    COLORS.gold,
                }}
              />

              <Chip
                size="small"
                label={`أخطاء: ${
                  preview?.errors ??
                  0
                }`}
                sx={{
                  bgcolor:
                    hasErrors
                      ? "rgba(209,67,67,0.10)"
                      : "rgba(22,134,95,0.08)",
                  color:
                    hasErrors
                      ? COLORS.red
                      : COLORS.green,
                }}
              />
            </Stack>

            {hasErrors ? (
              <Alert
                severity="warning"
                sx={{
                  mb: 1,
                  borderRadius:
                    "11px",
                }}
              >
                يوجد سطر أو أكثر
                يحتاج تصحيح. لو اسم
                المعلم يطابق أكثر من
                شخص، استخدم الاسم
                الكامل.
              </Alert>
            ) : (
              <Alert
                severity="success"
                sx={{
                  mb: 1,
                  borderRadius:
                    "11px",
                }}
              >
                المعاينة سليمة. لم يتم
                حفظ أي إسناد بعد.
              </Alert>
            )}

            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${COLORS.border}`,
                borderRadius:
                  "12px",
                overflow:
                  "hidden",
                maxHeight: 330,
                overflowY:
                  "auto",
              }}
            >
              {rows.length ? (
                rows.map(
                  (
                    row,
                    index
                  ) => {
                    const meta =
                      getStatusMeta(
                        row?.status
                      );

                    return (
                      <Stack
                        key={`assignment-import-${
                          row?.line ??
                          index
                        }-${
                          row?.subjectOfferingId ||
                          ""
                        }-${
                          row?.gradeName ||
                          ""
                        }`}
                        direction={{
                          xs: "column",
                          md: "row",
                        }}
                        alignItems={{
                          xs: "stretch",
                          md: "center",
                        }}
                        gap={1}
                        sx={{
                          px: 1.2,
                          py: 0.9,
                          borderBottom:
                            index <
                            rows.length -
                              1
                              ? `1px solid ${COLORS.border}`
                              : "none",
                        }}
                      >
                        <Typography
                          sx={{
                            minWidth: 36,
                            color:
                              COLORS.muted,
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          #{row?.line ??
                            index + 1}
                        </Typography>

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              color:
                                COLORS.navy,
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            {row?.teacherName ||
                              "—"}{" "}
                            ←{" "}
                            {row?.subjectName ||
                              "—"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.2,
                              color:
                                row?.reason
                                  ? COLORS.red
                                  : COLORS.muted,
                              fontSize: 9.5,
                              lineHeight: 1.5,
                            }}
                          >
                            {row?.reason ||
                              `${
                                row?.gradeName ||
                                "—"
                              }${
                                Number.isFinite(
                                  Number(
                                    row?.periodsPerWeek
                                  )
                                )
                                  ? ` — ${row.periodsPerWeek} حصة أسبوعيًا`
                                  : ""
                              }`}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={
                            meta.label
                          }
                          sx={{
                            bgcolor:
                              meta.bgcolor,
                            color:
                              meta.color,
                            fontWeight: 800,
                            fontSize: 9,
                          }}
                        />
                      </Stack>
                    );
                  }
                )
              ) : (
                <Typography
                  sx={{
                    p: 2,
                    textAlign:
                      "center",
                    color:
                      COLORS.muted,
                    fontSize: 11,
                  }}
                >
                  لا توجد نتائج لعرضها
                </Typography>
              )}
            </Paper>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.2,
          gap: 0.8,
        }}
      >
        <Button
          variant="contained"
          onClick={
            handlePreview
          }
          disabled={
            loading ||
            committing ||
            !termId ||
            !text.trim()
          }
          sx={{
            minHeight: 44,
            borderRadius:
              "11px",
            bgcolor:
              COLORS.navy,
            fontWeight: 900,
            boxShadow: "none",

            "&:hover": {
              bgcolor:
                COLORS.navy2,
              boxShadow:
                "none",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={19}
              color="inherit"
            />
          ) : (
            "معاينة الإسنادات"
          )}
        </Button>

        <Button
          variant="contained"
          onClick={
            handleCommit
          }
          disabled={
            committing ||
            loading ||
            !preview ||
            hasErrors
          }
          sx={{
            minHeight: 44,
            borderRadius:
              "11px",
            bgcolor:
              COLORS.green,
            fontWeight: 900,
            boxShadow: "none",

            "&:hover": {
              bgcolor:
                "#127250",
              boxShadow:
                "none",
            },
          }}
        >
          {committing ? (
            <CircularProgress
              size={19}
              color="inherit"
            />
          ) : (
            "تأكيد وحفظ"
          )}
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          disabled={
            loading ||
            committing
          }
          sx={{
            minHeight: 44,
            borderRadius:
              "11px",
            borderColor:
              "#d7dde3",
            color: COLORS.navy,
            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Assignments = () => {
  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [teachers, setTeachers] =
    useState([]);

  const [offerings, setOfferings] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [terms, setTerms] =
    useState([]);

  const [
    selectedTermId,
    setSelectedTermId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    savingAssignment,
    setSavingAssignment,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    importDialogOpen,
    setImportDialogOpen,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const normalizeTeachers =
    useCallback((rows) => {
      return rows
        .map((item) => ({
          raw: item,
          id: idOf(item),
          name:
            teacherNameOf(item),
        }))
        .filter(
          (item) => item.id
        );
    }, []);

  const normalizeOfferings =
    useCallback((rows) => {
      return rows
        .map((item) => ({
          raw: item,
          id: idOf(item),
          subjectId: idOf(
            getOfferingSubject(
              item
            )
          ),
          gradeLevelId: idOf(
            getOfferingGrade(
              item
            )
          ),
          termId: idOf(
            item?.termId ||
              item?.term
          ),
          termLabel: termLabelOf(
            item?.termId ||
              item?.term
          ),
          periodsPerWeek:
            Number.isFinite(
              Number(
                item?.periodsPerWeek
              )
            )
              ? Number(
                  item?.periodsPerWeek
                )
              : 0,
          subjectName:
            subjectNameOf(item),
          gradeName:
            gradeNameOf(item),
          label:
            offeringLabelOf(
              item
            ),
        }))
        .filter(
          (item) => item.id
        );
    }, []);

  const normalizeTerms =
    useCallback((rows) => {
      return rows
        .map((item) => ({
          raw: item,
          id: idOf(item),
          label:
            termLabelOf(item) ||
            "ترم دراسي",
          status:
            item?.status || "",
          order: Number(
            item?.order || 0
          ),
        }))
        .filter(
          (item) => item.id
        )
        .sort(
          (a, b) =>
            a.order - b.order
        );
    }, []);

  const normalizeClasses =
    useCallback((rows) => {
      return rows
        .map((item) => ({
          raw: item,
          id: idOf(item),
          gradeLevelId:
            classGradeIdOf(item),
          academicYearId:
            idOf(
              item?.academicYearId ||
                item?.academicYear
            ),
          name:
            classLabelOf(item),
        }))
        .filter(
          (item) => item.id
        );
    }, []);

  const loadAssignments =
    useCallback(
      async (termId) => {
        const normalizedTermId =
          idOf(termId);

        if (!normalizedTermId) {
          setAssignments([]);
          return [];
        }

        const result =
          await fetchTeacherAssignments(
            {
              termId:
                normalizedTermId,
            },
            { force: true }
          );

        if (result?.status === false) {
          setAssignments([]);
          throw new Error(
            result?.message ||
              "تعذر تحميل إسنادات المعلمين"
          );
        }

        const rows =
          extractList(result);

        setAssignments(rows);

        return rows;
      },
      []
    );

  const loadPage =
    useCallback(async (
      preferredTermId = ""
    ) => {
      setLoading(true);
      setError("");

      try {
        const [
          teachersResult,
          offeringsResult,
          classesResult,
          activeYearResponse,
        ] = await Promise.all([
          fetchTeachersList(),

          fetchAllSubjectOfferings(
            {},
            {
              forceListEndpoint:
                true,
            }
          ),

          fetchClassesList(),

          api
            .get(
              "/academic-years/active"
            )
            .catch(() => null),
        ]);

        const normalizedOfferingRows =
          offeringsResult?.status ===
            false
            ? []
            : normalizeOfferings(
                extractList(
                  offeringsResult
                )
              );

        let termOptions = [];
        let activeYearId = "";

        try {
          const activeYear =
            extractEntity(
              activeYearResponse?.data
            );

          activeYearId =
            idOf(activeYear);

          if (activeYearId) {
            const termsResponse =
              await api.get(
                `/terms/by-year/${activeYearId}`
              );

            termOptions =
              normalizeTerms(
                extractList(
                  termsResponse?.data
                )
              );
          }
        } catch {
          termOptions = [];
        }

        if (!termOptions.length) {
          const uniqueTerms =
            new Map();

          normalizedOfferingRows.forEach(
            (offering) => {
              if (
                !offering.termId ||
                uniqueTerms.has(
                  offering.termId
                )
              ) {
                return;
              }

              uniqueTerms.set(
                offering.termId,
                {
                  id: offering.termId,
                  label:
                    offering.termLabel ||
                    "ترم دراسي",
                  status: "",
                  order: 0,
                }
              );
            }
          );

          termOptions =
            Array.from(
              uniqueTerms.values()
            );
        }

        const preferredTermExists =
          termOptions.some(
            (item) =>
              item.id ===
              preferredTermId
          );

        const nextSelectedTermId =
          preferredTermExists
            ? preferredTermId
            : termOptions.find(
                (item) =>
                  item.status ===
                  "active"
              )?.id ||
              termOptions[0]?.id ||
              "";

        setSelectedTermId(
          nextSelectedTermId
        );

        let assignmentsResult = {
          status: true,
          data: [],
        };

        if (nextSelectedTermId) {
          assignmentsResult =
            await fetchTeacherAssignments(
              {
                termId:
                  nextSelectedTermId,
              },
              { force: true }
            );
        }

        const failures = [];

        if (
          assignmentsResult?.status ===
          false
        ) {
          failures.push(
            assignmentsResult
              ?.message ||
              "تعذر تحميل الإسنادات"
          );
        }

        if (
          isFailed(
            teachersResult
          )
        ) {
          failures.push(
            messageOf(
              teachersResult,
              "تعذر تحميل المعلمين"
            )
          );
        }

        if (
          offeringsResult?.status ===
          false
        ) {
          failures.push(
            offeringsResult
              ?.message ||
              "تعذر تحميل عروض المواد"
          );
        }

        if (
          isFailed(classesResult)
        ) {
          failures.push(
            messageOf(
              classesResult,
              "تعذر تحميل الفصول"
            )
          );
        }

        setAssignments(
          assignmentsResult
            ?.status === false
            ? []
            : extractList(
                assignmentsResult
              )
        );

        setTeachers(
          teachersResult?.status ===
            false
            ? []
            : normalizeTeachers(
                extractList(
                  teachersResult
                )
              )
        );

        setOfferings(
          normalizedOfferingRows
        );

        setTerms(termOptions);

        const normalizedClassRows =
          classesResult?.status ===
            false
            ? []
            : normalizeClasses(
                extractList(
                  classesResult
                )
              );

        setClasses(
          activeYearId
            ? normalizedClassRows.filter(
                (item) =>
                  !item.academicYearId ||
                  item.academicYearId ===
                    activeYearId
              )
            : normalizedClassRows
        );

        if (failures.length) {
          setError(
            failures.join(" — ")
          );
        }
      } catch (requestError) {
        const message =
          requestError?.message ||
          "تعذر تحميل بيانات الإسنادات";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, [
      normalizeClasses,
      normalizeOfferings,
      normalizeTeachers,
      normalizeTerms,
    ]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const offeringMap = useMemo(
    () =>
      new Map(
        offerings.map(
          (item) => [
            item.id,
            item,
          ]
        )
      ),
    [offerings]
  );

  const normalizedAssignments =
    useMemo(
      () =>
        assignments
          .map((assignment) => {
            const teacherValue =
              getTeacherValue(
                assignment
              );

            const offeringValue =
              getOfferingValue(
                assignment
              );

            const offeringId =
              idOf(
                offeringValue
              );

            const mappedOffering =
              offeringMap.get(
                offeringId
              );

            const rawOffering =
              offeringValue &&
              typeof offeringValue ===
                "object"
                ? offeringValue
                : mappedOffering
                    ?.raw;

            const classValue =
              assignmentClassValue(
                assignment
              );

            return {
              raw: assignment,
              id: idOf(
                assignment
              ),
              teacherId:
                idOf(
                  teacherValue
                ),
              teacherName:
                teacherValue &&
                typeof teacherValue ===
                  "object"
                  ? teacherNameOf(
                      teacherValue
                    )
                  : assignment
                      ?.teacherName ||
                    "—",
              offeringId,
              termId:
                mappedOffering
                  ?.termId ||
                idOf(
                  assignment?.termId ||
                    assignment?.term ||
                    rawOffering?.termId ||
                    rawOffering?.term
                ),
              subjectName:
                mappedOffering
                  ?.subjectName ||
                subjectNameOf(
                  rawOffering ||
                    {}
                ),
              gradeName:
                mappedOffering
                  ?.gradeName ||
                gradeNameOf(
                  rawOffering ||
                    {}
                ),
              classId:
                idOf(
                  classValue
                ),
              className:
                assignmentClassLabel(
                  assignment
                ),
            };
          })
          .filter(
            (item) => item.id
          ),
      [
        assignments,
        offeringMap,
      ]
    );

  const termAssignments =
    useMemo(
      () =>
        normalizedAssignments.filter(
          (item) =>
            !selectedTermId ||
            !item.termId ||
            item.termId ===
              selectedTermId
        ),
      [
        normalizedAssignments,
        selectedTermId,
      ]
    );

  const visibleAssignments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return termAssignments;
      }

      return termAssignments.filter(
        (item) =>
          [
            item.teacherName,
            item.subjectName,
            item.gradeName,
            item.className,
          ].some((value) =>
            String(
              value || ""
            )
              .toLowerCase()
              .includes(query)
          )
      );
    }, [
      termAssignments,
      search,
    ]);

  const statistics = useMemo(
    () => ({
      assignments:
        termAssignments.length,

      teachers: new Set(
        termAssignments
          .map(
            (item) =>
              item.teacherId
          )
          .filter(Boolean)
      ).size,

      classSpecific:
        termAssignments.filter(
          (item) =>
            Boolean(
              item.classId
            )
        ).length,
    }),
    [termAssignments]
  );

  const createAssignment =
    async (form) => {
      if (
        !form.teacherId ||
        !form.subjectOfferingId
      ) {
        toast.error(
          "اختر المعلم والمادة"
        );
        return;
      }

      const duplicate =
        termAssignments.find(
          (item) => {
            if (
              item.teacherId !==
                form.teacherId ||
              item.offeringId !==
                form.subjectOfferingId
            ) {
              return false;
            }

            if (!form.classId) {
              return true;
            }

            return (
              !item.classId ||
              item.classId ===
                form.classId
            );
          }
        );

      if (duplicate) {
        toast.error(
          duplicate.classId
            ? "هذا المعلم لديه إسناد لهذه المادة على هذا الفصل بالفعل"
            : "هذا المعلم لديه إسناد عام لهذه المادة بالفعل"
        );
        return;
      }

      setSavingAssignment(true);

      try {
        const result =
          await addTeacherAssignment(
            {
              teacherId:
                form.teacherId,
              subjectOfferingId:
                form.subjectOfferingId,

              ...(form.classId
                ? {
                    classId:
                      form.classId,
                  }
                : {}),
            }
          );

        if (
          result?.status === false
        ) {
          toast.error(
            result?.message ||
              "تعذر إضافة الإسناد"
          );
          return;
        }

        toast.success(
          "تم حفظ إسناد المعلم بنجاح"
        );

        setDialogOpen(false);

        setSelectedTermId(
          form.termId
        );

        await loadAssignments(
          form.termId
        );
      } catch (requestError) {
        toast.error(
          requestError?.message ||
            "تعذر إضافة الإسناد"
        );
      } finally {
        setSavingAssignment(
          false
        );
      }
    };

  const removeAssignment =
    async (item) => {
      const confirmed =
        window.confirm(
          `هل تريد حذف إسناد ${item.teacherName} لمادة ${item.subjectName}؟`
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(item.id);

      try {
        const result =
          await deleteTeacherAssignment(
            item.id
          );

        if (
          result?.status === false
        ) {
          toast.error(
            result?.message ||
              "تعذر حذف الإسناد"
          );
          return;
        }

        toast.success(
          "تم حذف الإسناد"
        );

        setAssignments(
          (current) =>
            current.filter(
              (assignment) =>
                idOf(
                  assignment
                ) !== item.id
            )
        );
      } finally {
        setDeletingId("");
      }
    };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          py: {
            xs: 1.5,
            md: 2.5,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              px: {
                xs: 1.6,
                md: 2.2,
              },
              py: 1.6,
              mb: 1.5,
              border: `1px solid ${COLORS.border}`,
              borderRadius:
                "18px",
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "stretch",
                md: "center",
              }}
              gap={1.3}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display:
                      "grid",
                    placeItems:
                      "center",
                    borderRadius:
                      "12px",
                    bgcolor:
                      COLORS.goldSoft,
                    color:
                      COLORS.gold,
                    flexShrink: 0,
                  }}
                >
                  <AssignmentIndRounded />
                </Box>

                <Box>
                  <Typography
                    component="h1"
                    sx={{
                      color:
                        COLORS.navy,
                      fontSize: {
                        xs: 20,
                        md: 24,
                      },
                      fontWeight: 900,
                    }}
                  >
                    إسنادات المعلمين
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.15,
                      color:
                        COLORS.muted,
                      fontSize: 10,
                    }}
                  >
                    اربط المعلم بعرض
                    المادة لكل الصف أو
                    لفصل محدد.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                <Button
                  variant="outlined"
                  startIcon={
                    <RefreshRounded />
                  }
                  onClick={() =>
                    loadPage(
                      selectedTermId
                    )
                  }
                  disabled={loading}
                  sx={{
                    borderRadius:
                      "11px",
                    borderColor:
                      COLORS.border,
                    color:
                      COLORS.navy,
                    fontWeight: 800,
                  }}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <UploadFileRounded />
                  }
                  onClick={() =>
                    setImportDialogOpen(
                      true
                    )
                  }
                  disabled={
                    loading ||
                    !selectedTermId
                  }
                  sx={{
                    borderRadius:
                      "11px",
                    borderColor:
                      "rgba(183,132,48,0.42)",
                    color:
                      COLORS.gold,
                    fontWeight: 800,
                    bgcolor:
                      "rgba(251,240,216,0.34)",

                    "&:hover": {
                      borderColor:
                        COLORS.gold,
                      bgcolor:
                        COLORS.goldSoft,
                    },
                  }}
                >
                  استيراد الإسنادات
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    <AddRounded />
                  }
                  onClick={() =>
                    setDialogOpen(
                      true
                    )
                  }
                  disabled={
                    loading ||
                    !teachers.length ||
                    !offerings.length
                  }
                  sx={{
                    borderRadius:
                      "11px",
                    bgcolor:
                      COLORS.navy,
                    fontWeight: 800,
                    boxShadow:
                      "none",

                    "&:hover": {
                      bgcolor:
                        COLORS.navy2,
                      boxShadow:
                        "none",
                    },
                  }}
                >
                  إضافة إسناد
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error ? (
            <Alert
              severity="warning"
              sx={{
                mb: 1.5,
                borderRadius:
                  "13px",
              }}
            >
              {error}
            </Alert>
          ) : null}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.25,
                border: `1px solid ${COLORS.border}`,
                borderRadius:
                  "14px",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
              >
                <AssignmentIndRounded
                  sx={{
                    color:
                      COLORS.navy2,
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      color:
                        COLORS.muted,
                      fontSize: 9.5,
                      fontWeight: 700,
                    }}
                  >
                    إجمالي الإسنادات
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        COLORS.navy,
                      fontSize: 20,
                      fontWeight: 900,
                    }}
                  >
                    {
                      statistics.assignments
                    }
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.25,
                border: `1px solid ${COLORS.border}`,
                borderRadius:
                  "14px",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
              >
                <PersonRounded
                  sx={{
                    color:
                      COLORS.green,
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      color:
                        COLORS.muted,
                      fontSize: 9.5,
                      fontWeight: 700,
                    }}
                  >
                    معلمون لديهم إسناد
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        COLORS.navy,
                      fontSize: 20,
                      fontWeight: 900,
                    }}
                  >
                    {
                      statistics.teachers
                    }
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.25,
                border: `1px solid ${COLORS.border}`,
                borderRadius:
                  "14px",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
              >
                <MenuBookRounded
                  sx={{
                    color:
                      COLORS.gold,
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      color:
                        COLORS.muted,
                      fontSize: 9.5,
                      fontWeight: 700,
                    }}
                  >
                    إسنادات لفصل محدد
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        COLORS.navy,
                      fontSize: 20,
                      fontWeight: 900,
                    }}
                  >
                    {
                      statistics.classSpecific
                    }
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              mb: 1.5,
              p: 1.2,
              border: `1px solid ${COLORS.border}`,
              borderRadius:
                "15px",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              gap={1}
            >
              <TextField
                select
                size="small"
                label="الترم"
                value={
                  selectedTermId
                }
                disabled={
                  loading ||
                  !terms.length
                }
                onChange={async (
                  event
                ) => {
                  const nextTermId =
                    event.target
                      .value || "";

                  setSelectedTermId(
                    nextTermId
                  );

                  setSearch("");

                  try {
                    setLoading(true);
                    setError("");

                    await loadAssignments(
                      nextTermId
                    );
                  } catch (
                    requestError
                  ) {
                    const message =
                      requestError
                        ?.message ||
                      "تعذر تحميل إسنادات الترم";

                    setError(message);
                    toast.error(
                      message
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 240,
                  },

                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "11px",
                    },
                }}
              >
                {terms.map(
                  (term) => (
                    <MenuItem
                      key={term.id}
                      value={term.id}
                    >
                      {term.label}
                    </MenuItem>
                  )
                )}
              </TextField>

              <TextField
                fullWidth
                size="small"
                value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="ابحث بالمعلم أو المادة أو الصف أو الفصل"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded
                      sx={{
                        color:
                          "#8b98a4",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius:
                      "11px",
                  },
              }}
            />
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius:
                "18px",
              overflow: "hidden",
              bgcolor: "#fff",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.4,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
              >
                <Box>
                  <Typography
                    sx={{
                      color:
                        COLORS.navy,
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    الإسنادات المسجلة
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.1,
                      color:
                        COLORS.muted,
                      fontSize: 9.5,
                    }}
                  >
                    الإسنادات المعروضة تخص
                    الترم المختار فقط.
                    «كل الفصول» يعني أن
                    الإسناد يشمل جميع
                    فصول الصف.
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={`${visibleAssignments.length} إسناد`}
                  sx={{
                    bgcolor:
                      "#eef3f7",
                    color:
                      COLORS.navy,
                    fontWeight: 800,
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            {loading ? (
              <Box
                sx={{
                  py: 8,
                  display: "grid",
                  placeItems:
                    "center",
                }}
              >
                <CircularProgress
                  size={30}
                  sx={{
                    color:
                      COLORS.navy,
                  }}
                />
              </Box>
            ) : visibleAssignments
                .length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  px: 2,
                  textAlign:
                    "center",
                }}
              >
                <AssignmentIndRounded
                  sx={{
                    fontSize: 46,
                    color:
                      "#c3cbd3",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    color:
                      COLORS.navy,
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  {search
                    ? "لا توجد إسنادات مطابقة"
                    : "لا توجد إسنادات معلمين في هذا الترم"}
                </Typography>

                {!search ? (
                  <Button
                    variant="contained"
                    startIcon={
                      <AddRounded />
                    }
                    onClick={() =>
                      setDialogOpen(
                        true
                      )
                    }
                    disabled={
                      !teachers.length ||
                      !offerings.length
                    }
                    sx={{
                      mt: 1.5,
                      borderRadius:
                        "11px",
                      bgcolor:
                        COLORS.navy,
                      fontWeight: 800,
                      boxShadow:
                        "none",
                    }}
                  >
                    إضافة أول إسناد
                  </Button>
                ) : null}
              </Box>
            ) : (
              <TableContainer>
                <Table
                  size="small"
                  sx={{
                    minWidth: 760,
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor:
                          "#fafbfd",
                      }}
                    >
                      {[
                        "المعلم",
                        "المادة",
                        "الصف",
                        "الفصل",
                        "",
                      ].map(
                        (
                          header,
                          index
                        ) => (
                          <TableCell
                            key={`${header}-${index}`}
                            align="right"
                            sx={{
                              py: 1.2,
                              color:
                                COLORS.muted,
                              fontSize:
                                10,
                              fontWeight:
                                800,
                              borderBottom: `1px solid ${COLORS.border}`,
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
                    {visibleAssignments.map(
                      (item) => (
                        <TableRow
                          key={
                            item.id
                          }
                          hover
                        >
                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.navy,
                              fontSize:
                                11,
                              fontWeight:
                                800,
                            }}
                          >
                            {
                              item.teacherName
                            }
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.navy,
                              fontSize:
                                11,
                              fontWeight:
                                700,
                            }}
                          >
                            {
                              item.subjectName
                            }
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                COLORS.muted,
                              fontSize:
                                10.5,
                            }}
                          >
                            {
                              item.gradeName
                            }
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            <Chip
                              size="small"
                              label={
                                item.className
                              }
                              sx={{
                                height:
                                  24,
                                bgcolor:
                                  item.classId
                                    ? COLORS.goldSoft
                                    : "#edf6f2",
                                color:
                                  item.classId
                                    ? COLORS.gold
                                    : COLORS.green,
                                fontSize:
                                  9,
                                fontWeight:
                                  800,
                              }}
                            />
                          </TableCell>

                          <TableCell
                            align="left"
                            sx={{
                              width: 60,
                            }}
                          >
                            <Tooltip title="حذف الإسناد">
                              <span>
                                <IconButton
                                  onClick={() =>
                                    removeAssignment(
                                      item
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    item.id
                                  }
                                  sx={{
                                    color:
                                      COLORS.red,
                                    bgcolor:
                                      "#fff2f2",
                                    borderRadius:
                                      "9px",

                                    "&:hover":
                                      {
                                        bgcolor:
                                          "#ffe7e7",
                                      },
                                  }}
                                >
                                  {deletingId ===
                                  item.id ? (
                                    <CircularProgress
                                      size={
                                        18
                                      }
                                      color="inherit"
                                    />
                                  ) : (
                                    <DeleteOutlineRounded fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        <AssignmentImportDialog
          open={
            importDialogOpen
          }
          termId={
            selectedTermId
          }
          onClose={() =>
            setImportDialogOpen(
              false
            )
          }
          onImported={async () => {
            setSearch("");
            await loadAssignments(
              selectedTermId
            );
          }}
        />

        <AssignmentDialog
          open={dialogOpen}
          loading={
            savingAssignment
          }
          teachers={teachers}
          offerings={offerings}
          classes={classes}
          terms={terms}
          assignments={
            termAssignments
          }
          selectedTermId={
            selectedTermId
          }
          onClose={() =>
            setDialogOpen(false)
          }
          onSubmit={
            createAssignment
          }
        />
      </Box>
    </Container>
  );
};

export default Assignments;
