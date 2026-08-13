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
  EditNoteRounded,
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
  useParams,
  useSearchParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import Select from "@/components/Select/Select";
import Loading from "@/components/Loading";

import Days from "@/utils/constants/Days";
import Slots from "@/utils/constants/Slots";
import { translateGender } from "@/utils/helpers/translateGender";

import {
  fetchClassesList,
  fetchSingleClass,
} from "@/APIs/school/classes";

import { fetchSingleTeacher } from "@/APIs/users/teachers";

import {
  editLecture,
  fetchSingleLecture,
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

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
      payload?.teachers,
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

const getLectureClass = (lecture) =>
  lecture?.classId || lecture?.class || null;

const getLectureOffering = (lecture) =>
  lecture?.subjectOfferingId ||
  lecture?.subjectOffering ||
  null;

const getLectureTeacher = (lecture) =>
  lecture?.teacherId || lecture?.teacher || null;

const getOfferingSubject = (item) =>
  item?.subjectId ||
  item?.subject ||
  item?.subjectDetails ||
  null;

const getOfferingSubjectId = (item) =>
  getId(getOfferingSubject(item));

const getOfferingTermId = (item) =>
  getId(item?.termId || item?.term);

const getAssignmentTeacher = (item) =>
  item?.teacherId || item?.teacher || null;

const getAssignmentOfferingId = (item) =>
  getId(
    item?.subjectOfferingId ||
      item?.subjectOffering
  );

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

const mapTeacher = (item) => ({
  id: getId(item),
  name:
    item?.name ||
    item?.username ||
    item?.email ||
    "معلم",
});

const uniqueById = (items = []) => {
  const result = [];
  const ids = new Set();

  items.forEach((item) => {
    const id = getId(item);

    if (!id || ids.has(id)) {
      return;
    }

    ids.add(id);
    result.push(item);
  });

  return result;
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
      <EditNoteRounded />
    </Box>

    <Box>
      <Typography
        sx={{
          color: "var(--color-navy-deep)",
          fontSize: "16px",
          fontWeight: 800,
        }}
      >
        بيانات الحصة
      </Typography>

      <Typography
        sx={{
          mt: 0.2,
          color: "var(--color-muted)",
          fontSize: "10px",
        }}
      >
        راجع الفصل والترم والمادة المفعلة، ويمكن ترك المعلم بدون إسناد.
      </Typography>
    </Box>
  </Stack>
);

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const isComingFromTeacher =
    searchParams.get("isComingFromTeacher") === "true";

  const isComingFromClass =
    searchParams.get("isComingFromClass") === "true";

  const [pageLoading, setPageLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lectureData, setLectureData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [terms, setTerms] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [message, setMessage] = useState("");


  useEffect(() => {
    let mounted = true;

    const loadLecture = async () => {
      setPageLoading(true);
      setMessage("");

      const [lectureResponse, classesResponse] =
        await Promise.all([
          fetchSingleLecture(id, { force: true }),
          fetchClassesList({ force: true }),
        ]);

      if (!mounted) {
        return;
      }

      if (lectureResponse?.status === false) {
        toast.error(
          lectureResponse?.message ||
            "تعذر تحميل بيانات الحصة"
        );
        setPageLoading(false);
        return;
      }

      const lecture = unwrapData(lectureResponse);

      if (!lecture || typeof lecture !== "object") {
        toast.error("تعذر تحميل بيانات الحصة");
        setPageLoading(false);
        return;
      }

      const lectureClass = getLectureClass(lecture);
      const lectureOffering = getLectureOffering(lecture);
      const lectureTeacher = getLectureTeacher(lecture);

      const classId = getId(lectureClass);
      const offeringId = getId(lectureOffering);
      const teacherId = getId(lectureTeacher);

      const termId = getId(
        lecture?.termId ||
          lecture?.term ||
          lectureOffering?.termId ||
          lectureOffering?.term
      );

      const dayOfWeek = normalizeDay(
        lecture?.dayOfWeek || lecture?.day
      );

      const slot = String(
        Number(lecture?.slot) || ""
      );

      const normalized = {
        classId,
        subjectOfferingId: offeringId,
        termId,
        teacherId,
        dayOfWeek,
        slot,
      };

      setLectureData(lecture);
      setSelectedClassId(classId);
      setSelectedOfferingId(offeringId);
      setSelectedTermId(termId);
      setSelectedTeacherId(teacherId);
      setSelectedDay(dayOfWeek);
      setSelectedSlot(slot);

      reset(normalized);

      if (classesResponse?.status === false) {
        setClasses(
          lectureClass
            ? [mapClass(lectureClass)]
            : []
        );
        setMessage(
          classesResponse?.message ||
            "تعذر تحميل الفصول"
        );
      } else {
        const rows = extractList(classesResponse);
        const withCurrent = lectureClass
          ? uniqueById([lectureClass, ...rows])
          : rows;

        setClasses(
          withCurrent
            .map(mapClass)
            .filter((item) => item.id)
        );
      }

      if (teacherId) {
        if (
          lectureTeacher &&
          typeof lectureTeacher === "object"
        ) {
          setTeachers([mapTeacher(lectureTeacher)]);
        } else {
          const teacherResponse =
            await fetchSingleTeacher(teacherId);

          if (!mounted) {
            return;
          }

          const teacher = unwrapData(teacherResponse);

          if (teacher) {
            setTeachers([mapTeacher(teacher)]);
          }
        }
      }

      setPageLoading(false);
    };

    loadLecture();

    return () => {
      mounted = false;
    };
  }, [id, reset]);

  useEffect(() => {
    let mounted = true;

    const loadClassSetup = async () => {
      if (!selectedClassId || !lectureData) {
        return;
      }

      setSetupLoading(true);

      const classResponse =
        await fetchSingleClass(selectedClassId, {
          force: true,
        });

      if (!mounted) {
        return;
      }

      if (classResponse?.status === false) {
        setClassDetails(null);
        setTerms([]);
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
        setTerms([]);
        setMessage(
          "بيانات الفصل لا تحتوي على السنة الدراسية أو الصف الدراسي"
        );
        setSetupLoading(false);
        return;
      }

      const termsResponse =
        await fetchTermsByAcademicYear(
          academicYearId,
          { force: true }
        );

      if (!mounted) {
        return;
      }

      if (termsResponse?.status === false) {
        setTerms([]);
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

      const lectureTerm =
        lectureData?.termId ||
        lectureData?.term ||
        getLectureOffering(lectureData)?.termId ||
        getLectureOffering(lectureData)?.term;

      const currentTermOption = lectureTerm
        ? mapTerm(lectureTerm)
        : null;

      const termOptions = currentTermOption?.id
        ? uniqueById([
            currentTermOption,
            ...mappedTerms,
          ])
        : mappedTerms;

      setTerms(termOptions);

      const selectedStillValid = termOptions.some(
        (item) => item.id === selectedTermId
      );

      const defaultTerm =
        termOptions.find(
          (item) => item.status === "active"
        ) ||
        termOptions.find(
          (item) => item.status === "upcoming"
        ) ||
        termOptions[0];

      const nextTermId = selectedStillValid
        ? selectedTermId
        : defaultTerm?.id || "";

      setSelectedTermId(nextTermId);
      setValue("termId", nextTermId, {
        shouldValidate: true,
      });

      setMessage(
        nextTermId
          ? ""
          : "لا توجد فصول دراسية مرتبطة بهذه السنة"
      );

      setSetupLoading(false);
    };

    loadClassSetup();

    return () => {
      mounted = false;
    };
  }, [
    selectedClassId,
    lectureData,
    selectedTermId,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadOfferings = async () => {
      const gradeLevelId =
        getGradeLevelId(classDetails);

      if (
        !lectureData ||
        !gradeLevelId ||
        !selectedTermId
      ) {
        setOfferings([]);
        return;
      }

      setSetupLoading(true);

      const teacherId = isComingFromTeacher
        ? selectedTeacherId
        : "";

      const [offeringsResponse, assignmentsResponse] =
        await Promise.all([
          fetchSubjectOfferings(
            {
              gradeLevelId,
              termId: selectedTermId,
            },
            { force: true }
          ),
          fetchTeacherAssignments(
            teacherId
              ? { teacherId }
              : {},
            { force: true }
          ),
        ]);

      if (!mounted) {
        return;
      }

      if (offeringsResponse?.status === false) {
        setOfferings([]);
        setMessage(
          offeringsResponse?.message ||
            "تعذر تحميل المواد المفعلة"
        );
        setSetupLoading(false);
        return;
      }

      const rawOfferings = extractList(
        offeringsResponse
      ).filter((item) => {
        const offeringGradeId =
          getGradeLevelId(item);

        const offeringTermId =
          getOfferingTermId(item);

        const gradeMatches =
          !offeringGradeId ||
          offeringGradeId === gradeLevelId;

        const termMatches =
          !offeringTermId ||
          offeringTermId === selectedTermId;

        return gradeMatches && termMatches;
      });

      const currentOffering =
        getLectureOffering(lectureData);

      const currentOfferingMatches =
        currentOffering &&
        getId(currentOffering) &&
        (!getOfferingTermId(currentOffering) ||
          getOfferingTermId(currentOffering) ===
            selectedTermId) &&
        (!getGradeLevelId(currentOffering) ||
          getGradeLevelId(currentOffering) ===
            gradeLevelId);

      const offeringsWithCurrent =
        currentOfferingMatches
          ? uniqueById([
              currentOffering,
              ...rawOfferings,
            ])
          : rawOfferings;

      const assignments =
        assignmentsResponse?.status === false
          ? []
          : extractList(assignmentsResponse);

      let filtered = offeringsWithCurrent;

      if (teacherId) {
        const teacherAssignments = assignments.filter(
          (item) =>
            getId(getAssignmentTeacher(item)) ===
            teacherId
        );

        const assignedOfferingIds = new Set(
          teacherAssignments
            .map(getAssignmentOfferingId)
            .filter(Boolean)
        );

        filtered = offeringsWithCurrent.filter(
          (item) =>
            assignedOfferingIds.has(getId(item)) ||
            getId(item) === selectedOfferingId
        );
      }

      const mapped = uniqueById(filtered)
        .map(mapOffering)
        .filter((item) => item.id);

      setOfferings(mapped);

      const selectedStillValid = mapped.some(
        (item) => item.id === selectedOfferingId
      );

      const nextOfferingId = selectedStillValid
        ? selectedOfferingId
        : "";

      setSelectedOfferingId(nextOfferingId);
      setValue(
        "subjectOfferingId",
        nextOfferingId,
        { shouldValidate: true }
      );

      setMessage(
        mapped.length > 0
          ? ""
          : teacherId
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
    lectureData,
    classDetails,
    selectedTermId,
    selectedOfferingId,
    selectedTeacherId,
    isComingFromTeacher,
    setValue,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadTeachers = async () => {
      if (!lectureData) {
        return;
      }

      if (isComingFromTeacher) {
        if (!selectedTeacherId) {
          setTeachers([]);
          return;
        }

        const currentTeacher =
          getLectureTeacher(lectureData);

        if (
          currentTeacher &&
          typeof currentTeacher === "object" &&
          getId(currentTeacher) === selectedTeacherId
        ) {
          setTeachers([mapTeacher(currentTeacher)]);
          setValue("teacherId", selectedTeacherId);
          return;
        }

        const response =
          await fetchSingleTeacher(selectedTeacherId);

        if (!mounted) {
          return;
        }

        const teacher = unwrapData(response);

        setTeachers(
          teacher ? [mapTeacher(teacher)] : []
        );
        setValue("teacherId", selectedTeacherId);
        return;
      }

      if (!selectedOfferingId) {
        setTeachers([]);
        setSelectedTeacherId("");
        setValue("teacherId", "");
        return;
      }

      setSetupLoading(true);

      const response =
        await fetchTeacherAssignments(
          {
            subjectOfferingId:
              selectedOfferingId,
          },
          { force: true }
        );

      if (!mounted) {
        return;
      }

      if (response?.status === false) {
        setTeachers([]);
        setMessage(
          response?.message ||
            "تعذر تحميل المعلمين"
        );
        setSetupLoading(false);
        return;
      }

      const rows = extractList(response).filter(
        (item) =>
          getAssignmentOfferingId(item) ===
          selectedOfferingId
      );

      const teacherValues = rows
        .map(getAssignmentTeacher)
        .filter(Boolean);

      const currentTeacher =
        getLectureTeacher(lectureData);

      if (
        currentTeacher &&
        getId(currentTeacher) === selectedTeacherId
      ) {
        teacherValues.unshift(currentTeacher);
      }

      const teacherObjects = [];

      for (const teacherValue of uniqueById(
        teacherValues
      )) {
        if (
          teacherValue &&
          typeof teacherValue === "object"
        ) {
          teacherObjects.push(teacherValue);
          continue;
        }

        const teacherId = getId(teacherValue);

        if (!teacherId) {
          continue;
        }

        const teacherResponse =
          await fetchSingleTeacher(teacherId);

        if (!mounted) {
          return;
        }

        const teacher = unwrapData(teacherResponse);

        if (teacher) {
          teacherObjects.push(teacher);
        }
      }

      const mappedTeachers = uniqueById(
        teacherObjects
      )
        .map(mapTeacher)
        .filter((item) => item.id);

      setTeachers(mappedTeachers);

      const selectedStillValid = mappedTeachers.some(
        (item) => item.id === selectedTeacherId
      );

      const nextTeacherId = selectedStillValid
        ? selectedTeacherId
        : "";

      setSelectedTeacherId(nextTeacherId);
      setValue("teacherId", nextTeacherId, {
        shouldValidate: true,
      });

      if (mappedTeachers.length === 0) {
        setMessage(
          "لا يوجد معلم مسند لهذه المادة حاليًا"
        );
      }

      setSetupLoading(false);
    };

    loadTeachers();

    return () => {
      mounted = false;
    };
  }, [
    lectureData,
    selectedOfferingId,
    selectedTeacherId,
    isComingFromTeacher,
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
        selectedTeacherId,

      dayOfWeek: normalizeDay(
        formData.dayOfWeek || selectedDay
      ),

      slot: Number(
        formData.slot || selectedSlot
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

    try {
      const response = await editLecture(
        payload,
        id
      );

      if (response?.status === false) {
        toast.error(
          response?.message ||
            "تعذر تعديل الحصة"
        );
        return;
      }

      toast.success(
        "تم تعديل بيانات الحصة بنجاح"
      );

      navigate(-1);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "تعذر تعديل الحصة"
      );
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading || !lectureData) {
    return <Loading />;
  }

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
            <Back title="تعديل الحصة" />

            <Typography
              sx={{
                color: "var(--color-muted)",
                fontSize: "10px",
              }}
            >
              عدّل بيانات الحصة واحفظ التغييرات.
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
                key={`day-${selectedDay}`}
                register={register}
                registerName="dayOfWeek"
                error={errors.dayOfWeek?.message}
                label="اليوم"
                required
                data={Days}
                name="day"
                defaultValue={selectedDay}
                disabled={
                  isComingFromClass ||
                  isComingFromTeacher
                }
                onChange={(value) => {
                  setSelectedDay(value || "");
                  updateValue("dayOfWeek", value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`slot-${selectedSlot}`}
                register={register}
                registerName="slot"
                error={errors.slot?.message}
                label="الحصة"
                required
                data={Slots}
                name="name"
                defaultValue={selectedSlot}
                disabled={
                  isComingFromClass ||
                  isComingFromTeacher
                }
                onChange={(value) => {
                  setSelectedSlot(value || "");
                  updateValue("slot", value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`class-${selectedClassId}-${classOptions.length}`}
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
                  isComingFromClass
                }
                onChange={(value) => {
                  const nextValue = value || "";

                  setSelectedClassId(nextValue);
                  setSelectedOfferingId("");
                  setOfferings([]);
                  updateValue("classId", nextValue);
                  updateValue(
                    "subjectOfferingId",
                    ""
                  );

                  if (!isComingFromTeacher) {
                    setSelectedTeacherId("");
                    setTeachers([]);
                    updateValue("teacherId", "");
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`term-${selectedTermId}-${termOptions.length}`}
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
                  termOptions.length === 0
                }
                onChange={(value) => {
                  const nextValue = value || "";

                  setSelectedTermId(nextValue);
                  setSelectedOfferingId("");
                  setOfferings([]);
                  updateValue("termId", nextValue);
                  updateValue(
                    "subjectOfferingId",
                    ""
                  );

                  if (!isComingFromTeacher) {
                    setSelectedTeacherId("");
                    setTeachers([]);
                    updateValue("teacherId", "");
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`offering-${selectedOfferingId}-${offeringOptions.length}`}
                register={register}
                registerName="subjectOfferingId"
                error={
                  errors.subjectOfferingId?.message
                }
                label="المادة"
                required
                data={offeringOptions}
                name="name"
                defaultValue={selectedOfferingId}
                disabled={
                  setupLoading ||
                  !selectedClassId ||
                  !selectedTermId ||
                  offeringOptions.length === 0
                }
                onChange={(value) => {
                  const nextValue = value || "";

                  setSelectedOfferingId(nextValue);
                  updateValue(
                    "subjectOfferingId",
                    nextValue
                  );

                  if (!isComingFromTeacher) {
                    setSelectedTeacherId("");
                    setTeachers([]);
                    updateValue("teacherId", "");
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Select
                key={`teacher-${selectedTeacherId}-${teacherOptions.length}`}
                register={register}
                registerName="teacherId"
                error={errors.teacherId?.message}
                label="المعلم (اختياري)"
                data={teacherOptions}
                name="name"
                defaultValue={selectedTeacherId}
                disabled={
                  setupLoading ||
                  isComingFromTeacher ||
                  !selectedOfferingId ||
                  teacherOptions.length === 0
                }
                onChange={(value) => {
                  setSelectedTeacherId(value || "");
                  updateValue("teacherId", value);
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
                : "حفظ التغييرات"}
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

export default Edit;
