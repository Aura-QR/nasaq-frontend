import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CloseRounded,
  EventNoteRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";

import {
  fetchClassesList,
  fetchSingleClass,
} from "@/APIs/school/classes";

import { fetchSingleTeacher } from "@/APIs/users/teachers";

import {
  addLecture,
  fetchSubjectOfferings,
  fetchTeacherAssignments,
  fetchTermsByAcademicYear,
} from "@/APIs/school/lectures";

const FORM_CARD_SX = {
  mt: 1.25,
  p: { xs: 1.5, md: 2 },
  overflow: "visible",
  border: "1px solid rgba(36,74,112,0.08)",
  borderRadius: "18px",
  backgroundColor: "var(--color-cream)",
  boxShadow: "0 12px 28px rgba(18,47,77,0.06)",

  "& .MuiFormControl-root": {
    width: "100%",
    margin: 0,
  },

  "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "var(--color-white)",
    borderRadius: "12px",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(36,74,112,0.16)",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
    {
      borderColor: "var(--color-gold)",
      borderWidth: "1px",
    },
};

const unwrapData = (response) =>
  response?.data?.data ??
  response?.data ??
  response;

const extractList = (response) => {
  const payload = unwrapData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.results,
      payload?.records,
      payload?.classes,
      payload?.terms,
      payload?.offerings,
      payload?.assignments,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

const getId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const normalizeDay = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getAcademicYearId = (item) =>
  getId(item?.academicYearId || item?.academicYear);

const getGradeLevelId = (item) =>
  getId(item?.gradeLevelId || item?.gradeLevel);

const mapClass = (item) => {
  const academicYear =
    item?.academicYearId?.name ||
    item?.academicYear?.name ||
    (typeof item?.academicYear === "string"
      ? item.academicYear
      : "");

  const className =
    item?.name ||
    item?.roomNumber ||
    "فصل";

  const gender = translateGender(
    item?.gender,
    "class"
  );

  return {
    id: getId(item),
    name:
      [
        academicYear,
        className,
        item?.roomNumber &&
        item.roomNumber !== className
          ? item.roomNumber
          : "",
        gender,
      ]
        .filter(Boolean)
        .join(" - ") || "فصل",
  };
};

const mapTerm = (item) => ({
  id: getId(item),
  name:
    item?.name ||
    `الترم ${item?.order || ""}`,
  order: Number(item?.order) || 0,
  status: item?.status || "",
});

const getOfferingSubject = (item) =>
  item?.subjectId ||
  item?.subject ||
  item?.subjectDetails ||
  null;

const getOfferingSubjectId = (item) =>
  getId(getOfferingSubject(item));

const mapOffering = (item) => {
  const subject = getOfferingSubject(item);

  return {
    id: getId(item),
    subjectId: getOfferingSubjectId(item),
    name:
      subject?.subjectName ||
      subject?.name ||
      item?.subjectName ||
      item?.name ||
      "مادة",
  };
};

const getAssignmentTeacher = (item) =>
  item?.teacherId ||
  item?.teacher ||
  null;

const getAssignmentOfferingId = (item) =>
  getId(
    item?.subjectOfferingId ||
    item?.subjectOffering
  );

const mapTeacher = (item) => ({
  id: getId(item),
  name:
    item?.name ||
    item?.username ||
    item?.email ||
    "معلم",
});

const getLocalTeacherSubjectIds = (teacherId) => {
  if (!teacherId) {
    return [];
  }

  const schoolId =
    localStorage.getItem("schoolId") || "school";

  try {
    const value = JSON.parse(
      localStorage.getItem(
        `nasaq:teacher-subjects:${schoolId}:${teacherId}`
      ) || "[]"
    );

    return Array.isArray(value)
      ? value.map(getId).filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

const getBackendTeacherSubjectIds = (teacher) => {
  const source = Array.isArray(teacher?.subjects)
    ? teacher.subjects
    : Array.isArray(teacher?.subject)
    ? teacher.subject
    : Array.isArray(teacher?.subjectIds)
    ? teacher.subjectIds
    : [];

  return source.map(getId).filter(Boolean);
};

const SectionHeading = () => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      pb: 1.25,
      mb: 1.5,
      borderBottom:
        "1px solid rgba(36,74,112,0.07)",
    }}
  >
    <Box
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
        borderRadius: "12px",
      }}
    >
      <EventNoteRounded />
    </Box>

    <Box>
      <Typography
        sx={{
          color: "var(--color-navy-deep)",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        تفاصيل الحصة
      </Typography>

      <Typography
        sx={{
          mt: 0.2,
          color: "var(--color-muted)",
          fontSize: "10px",
        }}
      >
        اختر الفصل والترم، ثم المادة المفعلة، ويمكن اختيار المعلم إن كان مسندًا إليها.
      </Typography>
    </Box>
  </Stack>
);

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryClassId =
    searchParams.get("classId") || "";

  const queryTeacherId =
    searchParams.get("teacherId") || "";

  const queryDay =
    searchParams.get("day") || "";

  const querySlot =
    searchParams.get("slot") || "";

  const queryTermId =
    searchParams.get("termId") || "";

  const [saving, setSaving] = useState(false);
  const [setupLoading, setSetupLoading] =
    useState(true);

  const [classes, setClasses] = useState([]);
  const [classDetails, setClassDetails] =
    useState(null);

  const [terms, setTerms] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedClassId, setSelectedClassId] =
    useState(queryClassId);

  const [selectedTermId, setSelectedTermId] =
    useState(queryTermId);

  const [
    selectedOfferingId,
    setSelectedOfferingId,
  ] = useState("");

  const [
    selectedTeacherId,
    setSelectedTeacherId,
  ] = useState(queryTeacherId);

  const [
    teacherSubjectIds,
    setTeacherSubjectIds,
  ] = useState([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    setValue("dayOfWeek", queryDay);
    setValue("slot", querySlot);

    if (queryClassId) {
      setValue("classId", queryClassId);
    }

    if (queryTeacherId) {
      setValue("teacherId", queryTeacherId);
    }

    if (queryTermId) {
      setValue("termId", queryTermId);
    }
  }, [
    queryClassId,
    queryDay,
    querySlot,
    queryTeacherId,
    queryTermId,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setSetupLoading(true);

      const classesResponse =
        await fetchClassesList();

      if (!mounted) {
        return;
      }

      if (classesResponse?.status === false) {
        setClasses([]);
        setMessage(
          classesResponse?.message ||
            "تعذر تحميل الفصول"
        );
      } else {
        setClasses(
          extractList(classesResponse)
            .map(mapClass)
            .filter((item) => item.id)
        );
      }

      if (queryTeacherId) {
        const teacherResponse =
          await fetchSingleTeacher(queryTeacherId);

        if (!mounted) {
          return;
        }

        const teacher = unwrapData(teacherResponse);

        const ids = Array.from(
          new Set([
            ...getBackendTeacherSubjectIds(teacher),
            ...getLocalTeacherSubjectIds(
              queryTeacherId
            ),
          ])
        );

        setTeacherSubjectIds(ids);

        if (teacher) {
          setTeachers([mapTeacher(teacher)]);
        }
      }

      setSetupLoading(false);
    };

    loadInitial();

    return () => {
      mounted = false;
    };
  }, [queryTeacherId]);

  useEffect(() => {
    let mounted = true;

    const loadClassSetup = async () => {
      setClassDetails(null);
      setTerms([]);
      setOfferings([]);
      setSelectedTermId(queryTermId);
      setSelectedOfferingId("");
      setValue("termId", queryTermId || "");
      setValue("subjectOfferingId", "");

      if (!selectedClassId) {
        setMessage("");
        return;
      }

      setSetupLoading(true);

      const classResponse =
        await fetchSingleClass(selectedClassId);

      if (!mounted) {
        return;
      }

      if (classResponse?.status === false) {
        setMessage(
          classResponse?.message ||
            "تعذر تحميل بيانات الفصل"
        );
        setSetupLoading(false);
        return;
      }

      const details = unwrapData(classResponse);
      const academicYearId =
        getAcademicYearId(details);
      const gradeLevelId =
        getGradeLevelId(details);

      setClassDetails(details);

      if (!academicYearId || !gradeLevelId) {
        setMessage(
          "بيانات الفصل لا تحتوي على السنة الدراسية أو الصف الدراسي"
        );
        setSetupLoading(false);
        return;
      }

      const termsResponse =
        await fetchTermsByAcademicYear(
          academicYearId
        );

      if (!mounted) {
        return;
      }

      if (termsResponse?.status === false) {
        setMessage(
          termsResponse?.message ||
            "تعذر تحميل الترم"
        );
        setSetupLoading(false);
        return;
      }

      const mappedTerms = extractList(termsResponse)
        .map(mapTerm)
        .filter((item) => item.id)
        .sort((a, b) => a.order - b.order);

      setTerms(mappedTerms);

      const defaultTerm =
        mappedTerms.find(
          (item) => item.id === queryTermId
        ) ||
        mappedTerms.find(
          (item) => item.status === "active"
        ) ||
        mappedTerms.find(
          (item) => item.status === "upcoming"
        ) ||
        mappedTerms[0];

      if (defaultTerm) {
        setSelectedTermId(defaultTerm.id);
        setValue("termId", defaultTerm.id, {
          shouldValidate: true,
        });
        setMessage("");
      } else {
        setMessage(
          "لا توجد فصول دراسية مرتبطة بهذه السنة"
        );
      }

      setSetupLoading(false);
    };

    loadClassSetup();

    return () => {
      mounted = false;
    };
  }, [
    selectedClassId,
    queryTermId,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadOfferings = async () => {
      setOfferings([]);
      setSelectedOfferingId("");
      setValue("subjectOfferingId", "");

      const gradeLevelId =
        getGradeLevelId(classDetails);

      if (!gradeLevelId || !selectedTermId) {
        return;
      }

      setSetupLoading(true);

      const [
        offeringsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetchSubjectOfferings({
          gradeLevelId,
          termId: selectedTermId,
        }),
        fetchTeacherAssignments({
          ...(queryTeacherId
            ? { teacherId: queryTeacherId }
            : {}),
          ...(selectedClassId
            ? { classId: selectedClassId }
            : {}),
        }),
      ]);

      if (!mounted) {
        return;
      }

      if (offeringsResponse?.status === false) {
        setMessage(
          offeringsResponse?.message ||
            "تعذر تحميل المواد المفعلة"
        );
        setSetupLoading(false);
        return;
      }

      const rawOfferings = extractList(
        offeringsResponse
      ).filter(
        (item) =>
          getGradeLevelId(item) === gradeLevelId
      );

      const assignments =
        assignmentsResponse?.status === false
          ? []
          : extractList(assignmentsResponse);

      const teacherAssignments = queryTeacherId
        ? assignments.filter(
            (item) =>
              getId(getAssignmentTeacher(item)) ===
              queryTeacherId
          )
        : assignments;

      const assignedOfferingIds = new Set(
        teacherAssignments
          .map(getAssignmentOfferingId)
          .filter(Boolean)
      );

      let filtered = rawOfferings;

      if (
        queryTeacherId &&
        assignedOfferingIds.size > 0
      ) {
        filtered = rawOfferings.filter((item) =>
          assignedOfferingIds.has(getId(item))
        );
      } else if (
        queryTeacherId &&
        teacherSubjectIds.length > 0
      ) {
        const subjectSet = new Set(
          teacherSubjectIds
        );

        filtered = rawOfferings.filter((item) =>
          subjectSet.has(
            getOfferingSubjectId(item)
          )
        );
      }

      const mapped = filtered
        .map(mapOffering)
        .filter((item) => item.id);

      setOfferings(mapped);

      setMessage(
        mapped.length > 0
          ? ""
          : queryTeacherId
          ? "لا توجد مادة مسندة لهذا المعلم داخل الصف والترم المختارين"
          : "لا توجد مواد مفعلة لهذا الصف داخل الترم المختار"
      );

      setSetupLoading(false);
    };

    loadOfferings();

    return () => {
      mounted = false;
    };
  }, [
    classDetails,
    selectedTermId,
    selectedClassId,
    queryTeacherId,
    teacherSubjectIds,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadTeachers = async () => {
      if (queryTeacherId) {
        return;
      }

      setTeachers([]);
      setSelectedTeacherId("");
      setValue("teacherId", "");

      if (!selectedOfferingId) {
        return;
      }

      const response =
        await fetchTeacherAssignments({
          subjectOfferingId:
            selectedOfferingId,
          ...(selectedClassId
            ? { classId: selectedClassId }
            : {}),
        });

      if (!mounted) {
        return;
      }

      if (response?.status === false) {
        setMessage(
          response?.message ||
            "تعذر تحميل المعلمين"
        );
        return;
      }

      const rows = extractList(response);

      const mappedTeachers = rows
        .filter(
          (item) =>
            getAssignmentOfferingId(item) ===
            selectedOfferingId
        )
        .map(getAssignmentTeacher)
        .filter(
          (teacher) =>
            teacher &&
            typeof teacher === "object"
        )
        .map(mapTeacher)
        .filter((teacher) => teacher.id);

      setTeachers(mappedTeachers);

      if (mappedTeachers.length === 0) {
        setMessage(
          "لا يوجد معلم مسند لهذه المادة حاليًا، ويمكن حفظ الحصة بدون معلم"
        );
      }
    };

    loadTeachers();

    return () => {
      mounted = false;
    };
  }, [
    queryTeacherId,
    selectedOfferingId,
    selectedClassId,
    setValue,
  ]);

  const classOptions = useMemo(
    () => classes,
    [classes]
  );

  const termOptions = useMemo(
    () => terms,
    [terms]
  );

  const offeringOptions = useMemo(
    () => offerings,
    [offerings]
  );

  const teacherOptions = useMemo(
    () => teachers,
    [teachers]
  );

  const updateValue = (name, value) => {
    setValue(name, value || "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (formData) => {
    const payload = {
      classId:
        formData.classId || selectedClassId,

      subjectOfferingId:
        formData.subjectOfferingId ||
        selectedOfferingId,

      termId:
        formData.termId || selectedTermId,

      teacherId:
        formData.teacherId ||
        selectedTeacherId ||
        queryTeacherId,

      dayOfWeek: normalizeDay(
        formData.dayOfWeek || queryDay
      ),

      slot: Number(
        formData.slot || querySlot
      ),
    };

    if (
      !payload.classId ||
      !payload.subjectOfferingId ||
      !payload.termId ||
      !payload.dayOfWeek ||
      !payload.slot
    ) {
      toast.error(
        "أكملي بيانات الحصة المطلوبة"
      );
      return;
    }

    setSaving(true);

    const response = await addLecture(payload);

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر إضافة الحصة"
      );
      setSaving(false);
      return;
    }

    toast.success(
      "تمت إضافة الحصة بنجاح"
    );

    navigate(-1);
  };

  return (
    <Container>
      <Box
        component="form"
        noValidate
        dir="rtl"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ pb: 3 }}
      >
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.25, md: 1.6 },
            py: 1.05,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "rgba(255,252,247,0.9)",
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
          >
            <Back title="إضافة حصة دراسية" />

            <Typography
              sx={{
                color: "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              الحصة ترتبط بترم ومادة مفعلة داخل الصف.
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={FORM_CARD_SX}>
          <SectionHeading />

          {message && (
            <Alert
              severity={
                message.includes("تعذر")
                  ? "error"
                  : "info"
              }
              sx={{
                mb: 1.5,
                borderRadius: "12px",
                fontSize: "10px",
              }}
            >
              {message}
            </Alert>
          )}

          <Grid
            container
            spacing={{ xs: 1.5, md: 2 }}
          >
            <Grid item xs={12} sm={6} lg={4}>
              <Select
                register={register}
                registerName="dayOfWeek"
                error={
                  errors.dayOfWeek?.message
                }
                label="اليوم"
                required
                data={Days}
                name="day"
                defaultValue={queryDay}
                disabled={Boolean(queryDay)}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                register={register}
                registerName="slot"
                error={errors.slot?.message}
                label="الحصة"
                required
                data={Slots}
                name="name"
                defaultValue={querySlot}
                disabled={Boolean(querySlot)}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                register={register}
                registerName="classId"
                error={errors.classId?.message}
                label="الفصل"
                required
                data={classOptions}
                name="name"
                defaultValue={selectedClassId}
                disabled={
                  setupLoading ||
                  Boolean(queryClassId)
                }
                onChange={(value) => {
                  setSelectedClassId(value || "");
                  updateValue("classId", value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`term-${selectedClassId}-${selectedTermId}`}
                register={register}
                registerName="termId"
                error={errors.termId?.message}
                label="الترم"
                required
                data={termOptions}
                name="name"
                defaultValue={selectedTermId}
                disabled={
                  setupLoading ||
                  !selectedClassId ||
                  termOptions.length === 0 ||
                  Boolean(queryTermId)
                }
                onChange={(value) => {
                  setSelectedTermId(value || "");
                  updateValue("termId", value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`offering-${selectedTermId}-${selectedOfferingId}-${offeringOptions.length}`}
                register={register}
                registerName="subjectOfferingId"
                error={
                  errors.subjectOfferingId
                    ?.message
                }
                label="المادة"
                required
                data={offeringOptions}
                name="name"
                defaultValue={
                  selectedOfferingId
                }
                disabled={
                  setupLoading ||
                  !selectedClassId ||
                  !selectedTermId ||
                  offeringOptions.length === 0
                }
                onChange={(value) => {
                  setSelectedOfferingId(
                    value || ""
                  );
                  updateValue(
                    "subjectOfferingId",
                    value
                  );
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`teacher-${selectedOfferingId}-${selectedTeacherId || queryTeacherId}-${teacherOptions.length}`}
                register={register}
                registerName="teacherId"
                error={
                  errors.teacherId?.message
                }
                label="المعلم (اختياري)"
                data={teacherOptions}
                name="name"
                defaultValue={
                  selectedTeacherId ||
                  queryTeacherId
                }
                disabled={
                  setupLoading ||
                  Boolean(queryTeacherId) ||
                  !selectedOfferingId ||
                  teacherOptions.length === 0
                }
                onChange={(value) => {
                  setSelectedTeacherId(
                    value || ""
                  );
                  updateValue(
                    "teacherId",
                    value
                  );
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            px: { xs: 1.25, md: 1.6 },
            py: 1.15,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "16px",
            backgroundColor:
              "var(--color-cream)",
          }}
        >
          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            gap={1}
          >
            <Button
              type="submit"
              disabled={
                saving ||
                setupLoading ||
                offeringOptions.length === 0
              }
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
                fontWeight: 800,
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ الحصة"}
            </Button>

            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outlined"
              startIcon={<CloseRounded />}
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: "12px",
                color: "var(--color-navy)",
                borderColor:
                  "rgba(36,74,112,0.18)",
                fontWeight: 800,
              }}
            >
              إلغاء
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default Add;
