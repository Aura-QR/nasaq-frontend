import {
  Grid,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "react-toastify";

import Select from "@/components/Select/Select";

import {
  fetchClasses,
  fetchClassesList,
} from "@/APIs/school/classes";

import { translateGender } from "@/utils/helpers/translateGender";
import Years from "@/utils/constants/Years";

const classesCache = new Map();
const pendingRequests = new Map();

const normalizeResponse = (response) => {
  if (
    !response ||
    response?.status === false
  ) {
    return {
      status: false,
      message:
        response?.message ||
        "تعذر تحميل الفصول",
      items: [],
    };
  }

  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.docs)
    ? payload.docs
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.classes)
    ? payload.classes
    : [];

  return {
    status: true,
    items,
  };
};

const getClassAcademicYear = (item) => {
  const value =
    item?.academicYear ??
    item?.academicYearId;

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.name ||
    value?.label ||
    ""
  );
};

const normalizeClass = (item) => ({
  id:
    item?._id ||
    item?.id ||
    "",
  name:
    item?.name ||
    item?.roomNumber ||
    "فصل",
  academicYear:
    getClassAcademicYear(item),
  roomNumber:
    item?.roomNumber ||
    "",
  gender:
    item?.gender ||
    "",
});

const loadClasses = async (filters) => {
  const cacheKey =
    JSON.stringify(filters);

  if (classesCache.has(cacheKey)) {
    return classesCache.get(cacheKey);
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const hasFilters =
    Object.keys(filters).length > 0;

  const request = (
    hasFilters
      ? fetchClasses(filters)
      : fetchClassesList()
  )
    .then(normalizeResponse)
    .then((result) => {
      if (!result.status) {
        return result;
      }

      const value = {
        status: true,
        items: result.items
          .map(normalizeClass)
          .filter((item) => item.id),
      };

      classesCache.set(
        cacheKey,
        value
      );

      return value;
    })
    .finally(() => {
      pendingRequests.delete(
        cacheKey
      );
    });

  pendingRequests.set(
    cacheKey,
    request
  );

  return request;
};

const ClassSelector = ({
  register,
  errors,
  setValue,

  defaultAcademicYear = "",
  defaultGender = "",
  defaultClassId = "",

  onClassChange,

  isClassRequired = true,
  isAcademicYearRequired = false,
  isGenderRequired,

  showClass = true,
  showAcademicYear = true,
  showGender = false,

  defaultSelect = "جميع الفصول",

  gridProps = {
    xs: 12,
  },
}) => {
  const [
    academicYear,
    setAcademicYear,
  ] = useState(
    defaultAcademicYear || ""
  );

  const [
    gender,
    setGender,
  ] = useState(
    defaultGender || ""
  );

  const [
    classId,
    setClassId,
  ] = useState(
    defaultClassId || ""
  );

  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const isStudent =
    showGender &&
    showAcademicYear;

  const isAttendance =
    showAcademicYear &&
    !showGender;

  const genderRequired =
    isGenderRequired ??
    showGender;

  useEffect(() => {
    setAcademicYear(
      defaultAcademicYear || ""
    );
  }, [defaultAcademicYear]);

  useEffect(() => {
    setGender(
      defaultGender || ""
    );
  }, [defaultGender]);

  useEffect(() => {
    setClassId(
      defaultClassId || ""
    );
  }, [defaultClassId]);

  const filters = useMemo(() => {
    const value = {};

    if (academicYear) {
      value.academicYear =
        academicYear;
    }

    if (gender) {
      value.gender =
        gender;
    }

    return value;
  }, [
    academicYear,
    gender,
  ]);

  const filtersKey =
    useMemo(
      () =>
        JSON.stringify(filters),
      [filters]
    );

  useEffect(() => {
    let active = true;

    const fetchData =
      async () => {
        setLoading(true);

        const result =
          await loadClasses(
            filters
          );

        if (!active) {
          return;
        }

        if (!result.status) {
          toast.error(
            result.message,
            {
              toastId:
                `class-selector-${filtersKey}`,
            }
          );

          setClasses([]);
          setLoading(false);
          return;
        }

        setClasses(
          result.items
        );

        setLoading(false);
      };

    fetchData();

    return () => {
      active = false;
    };
  }, [filtersKey]);

  const mappedClasses =
    useMemo(
      () =>
        classes.map((item) => {
          const translatedGender =
            translateGender(
              item.gender,
              "class"
            );

          const label = [
            item.academicYear,
            item.name,
            item.roomNumber &&
            item.roomNumber !==
              item.name
              ? item.roomNumber
              : "",
            translatedGender,
          ]
            .filter(Boolean)
            .join(" - ");

          return {
            id: item.id,
            name:
              label ||
              "فصل",
          };
        }),
      [classes]
    );

  const classDisabled = useMemo(() => {
    if (
      loading ||
      mappedClasses.length === 0
    ) {
      return true;
    }

    if (
      showGender &&
      !gender
    ) {
      return true;
    }

    if (
      isAcademicYearRequired &&
      !academicYear
    ) {
      return true;
    }

    return false;
  }, [
    loading,
    mappedClasses.length,
    showGender,
    gender,
    isAcademicYearRequired,
    academicYear,
  ]);

  const updateFormValue = (
    name,
    value
  ) => {
    setValue?.(
      name,
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const clearClassSelection = () => {
    setClassId("");

    updateFormValue(
      "classId",
      ""
    );

    if (isAttendance) {
      updateFormValue(
        "studentId",
        ""
      );
    }

    onClassChange?.("");
  };

  const handleAcademicYearChange = (
    value
  ) => {
    setAcademicYear(
      value || ""
    );

    clearClassSelection();
  };

  const handleGenderChange = (
    value
  ) => {
    setGender(
      value || ""
    );

    clearClassSelection();
  };

  const handleClassChange = (
    value
  ) => {
    const nextValue =
      value || "";

    setClassId(
      nextValue
    );

    updateFormValue(
      "classId",
      nextValue
    );

    if (isAttendance) {
      updateFormValue(
        "studentId",
        ""
      );
    }

    onClassChange?.(
      nextValue
    );
  };

  const handleClassClick = () => {
    if (isStudent) {
      if (
        !academicYear ||
        !gender
      ) {
        toast.info(
          "برجاء اختيار السنة الدراسية والجنس أولًا",
          {
            toastId:
              "select-year-gender-first",
          }
        );

        return;
      }

      if (
        !loading &&
        classes.length === 0
      ) {
        toast.info(
          "لا توجد فصول مطابقة للاختيارات",
          {
            toastId:
              "no-matching-classes",
          }
        );
      }

      return;
    }

    if (
      isAttendance &&
      academicYear &&
      !loading &&
      classes.length === 0
    ) {
      toast.info(
        "لا توجد فصول في هذه السنة الدراسية",
        {
          toastId:
            "no-classes-in-year",
        }
      );
    }
  };

  const genderOptions = [
    {
      id: "male",
      label: "ولد",
    },
    {
      id: "female",
      label: "بنت",
    },
  ];

  return (
    <>
      {showAcademicYear && (
        <Grid
          item
          {...gridProps}
        >
          <Select
            register={register}
            registerName="academicYear"
            data={Years}
            error={
              errors?.academicYear
                ?.message
            }
            label="السنة الدراسية"
            onChange={
              handleAcademicYearChange
            }
            defaultSelect="جميع السنين"
            defaultValue={
              academicYear
            }
            required={
              isAcademicYearRequired
            }
          />
        </Grid>
      )}

      {showGender && (
        <Grid
          item
          {...gridProps}
        >
          <Select
            register={register}
            registerName="gender"
            data={genderOptions}
            name="label"
            error={
              errors?.gender
                ?.message
            }
            label="الجنس"
            onChange={
              handleGenderChange
            }
            defaultValue={
              gender
            }
            required={
              genderRequired
            }
          />
        </Grid>
      )}

      {showClass && (
        <Grid
          item
          {...gridProps}
          onClick={
            handleClassClick
          }
        >
          <Select
            register={register}
            registerName="classId"
            data={
              mappedClasses
            }
            name="name"
            error={
              errors?.classId
                ?.message
            }
            label="الفصل"
            disabled={
              classDisabled
            }
            onChange={
              handleClassChange
            }
            defaultValue={
              classId
            }
            defaultSelect={
              defaultSelect
            }
            required={
              isClassRequired
            }
          />
        </Grid>
      )}
    </>
  );
};

export default ClassSelector;
