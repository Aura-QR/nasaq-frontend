import { Grid } from "@mui/material";

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

import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/APIs/school/academicYears";

import { translateGender } from "@/utils/helpers/translateGender";

const classesCache = new Map();
const pendingClassRequests = new Map();

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id || value?.id || ""
    ).trim();
  }

  return String(value).trim();
};

const unwrap = (response) => {
  let current = response;

  for (let index = 0; index < 5; index += 1) {
    if (
      current &&
      typeof current === "object" &&
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

const extractCollection = (
  response,
  extraKeys = []
) => {
  const payload = unwrap(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return [];
  }

  const candidates = [
    payload.docs,
    payload.items,
    payload.results,
    payload.records,
    payload.classes,
    payload.academicYears,
    payload.years,
    payload.data,
    ...extraKeys.map(
      (key) => payload?.[key]
    ),
  ];

  return (
    candidates.find(Array.isArray) || []
  );
};

const extractEntity = (response) => {
  const payload = unwrap(response);

  if (
    !payload ||
    Array.isArray(payload) ||
    typeof payload !== "object"
  ) {
    return null;
  }

  return (
    payload.academicYear ||
    payload.year ||
    payload.item ||
    payload
  );
};

const isFailedResponse = (response) =>
  typeof response === "string" ||
  response?.status === false ||
  Number(response?.statusCode) >= 400;

const getErrorMessage = (
  response,
  fallback
) => {
  if (typeof response === "string") {
    return response;
  }

  return (
    response?.message ||
    response?.data?.message ||
    response?.error ||
    fallback
  );
};

const normalizeAcademicYear = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    "سنة دراسية",
  status: String(
    item?.status || ""
  ).toLowerCase(),
});

const getClassAcademicYearEntity = (item) =>
  item?.academicYearId ??
  item?.academicYear ??
  null;

const getClassAcademicYearId = (item) =>
  normalizeId(
    getClassAcademicYearEntity(item)
  );

const getClassAcademicYearName = (item) => {
  const value =
    getClassAcademicYearEntity(item);

  if (
    value &&
    typeof value === "object"
  ) {
    return (
      value?.name ||
      value?.label ||
      value?.title ||
      ""
    );
  }

  return "";
};

const getClassGradeLevelName = (item) => {
  const value =
    item?.gradeLevelId ??
    item?.gradeLevel ??
    null;

  if (
    value &&
    typeof value === "object"
  ) {
    return (
      value?.name ||
      value?.label ||
      value?.title ||
      ""
    );
  }

  return "";
};

const normalizeClass = (item) => ({
  id: normalizeId(item),
  name:
    item?.name ||
    item?.roomNumber ||
    "فصل",
  academicYearId:
    getClassAcademicYearId(item),
  academicYearName:
    getClassAcademicYearName(item),
  gradeLevelName:
    getClassGradeLevelName(item),
  roomNumber:
    item?.roomNumber || "",
  gender:
    item?.gender || "",
});

const normalizeClassesResponse = (
  response
) => {
  if (isFailedResponse(response)) {
    return {
      status: false,
      message: getErrorMessage(
        response,
        "تعذر تحميل الفصول"
      ),
      items: [],
    };
  }

  return {
    status: true,
    items: extractCollection(
      response,
      ["classes"]
    )
      .map(normalizeClass)
      .filter((item) => item.id),
  };
};

const loadClasses = async (filters) => {
  const cacheKey =
    JSON.stringify(filters);

  if (classesCache.has(cacheKey)) {
    return classesCache.get(cacheKey);
  }

  if (
    pendingClassRequests.has(cacheKey)
  ) {
    return pendingClassRequests.get(
      cacheKey
    );
  }

  const hasFilters =
    Object.keys(filters).length > 0;

  const request = (
    hasFilters
      ? fetchClasses(filters)
      : fetchClassesList()
  )
    .then(normalizeClassesResponse)
    .then((result) => {
      if (result.status) {
        classesCache.set(
          cacheKey,
          result
        );
      }

      return result;
    })
    .finally(() => {
      pendingClassRequests.delete(
        cacheKey
      );
    });

  pendingClassRequests.set(
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
  const [academicYearId, setAcademicYearId] =
    useState("");

  const [academicYears, setAcademicYears] =
    useState([]);

  const [yearsLoading, setYearsLoading] =
    useState(showAcademicYear);

  const [gender, setGender] = useState(
    defaultGender || ""
  );

  const [classId, setClassId] = useState(
    defaultClassId || ""
  );

  const [classes, setClasses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const isStudent =
    showGender && showAcademicYear;

  const isAttendance =
    showAcademicYear && !showGender;

  const genderRequired =
    isGenderRequired ?? showGender;

  useEffect(() => {
    setGender(defaultGender || "");
  }, [defaultGender]);

  useEffect(() => {
    setClassId(defaultClassId || "");
  }, [defaultClassId]);

  /*
   * السنوات الدراسية لم تعد Static من utils/constants/Years.
   * المصدر الوحيد الآن هو الباك:
   * GET /academic-years
   * GET /academic-years/active
   */
  useEffect(() => {
    if (!showAcademicYear) {
      setYearsLoading(false);
      return undefined;
    }

    let active = true;

    const loadAcademicYears = async () => {
      setYearsLoading(true);

      const [yearsResponse, activeResponse] =
        await Promise.all([
          fetchAcademicYears(),
          fetchActiveAcademicYear(),
        ]);

      if (!active) return;

      if (isFailedResponse(yearsResponse)) {
        setAcademicYears([]);
        setYearsLoading(false);
        toast.error(
          getErrorMessage(
            yearsResponse,
            "تعذر تحميل السنوات الدراسية"
          ),
          {
            toastId:
              "class-selector-academic-years",
          }
        );
        return;
      }

      const loadedYears = extractCollection(
        yearsResponse,
        ["academicYears", "years"]
      )
        .map(normalizeAcademicYear)
        .filter((item) => item.id);

      setAcademicYears(loadedYears);

      const defaultValue =
        defaultAcademicYear;

      const defaultId =
        normalizeId(defaultValue);

      const defaultName =
        typeof defaultValue === "string"
          ? defaultValue.trim()
          : defaultValue?.name ||
            defaultValue?.label ||
            "";

      const matchedDefault =
        loadedYears.find(
          (item) =>
            item.id === defaultId ||
            (defaultName &&
              item.name === defaultName)
        ) || null;

      const activeEntity =
        isFailedResponse(activeResponse)
          ? null
          : extractEntity(activeResponse);

      const activeId = normalizeId(
        activeEntity
      );

      const activeFromList =
        loadedYears.find(
          (item) => item.id === activeId
        ) ||
        loadedYears.find(
          (item) =>
            item.status === "active"
        ) ||
        null;

      setAcademicYearId((current) => {
        if (
          current &&
          loadedYears.some(
            (item) => item.id === current
          )
        ) {
          return current;
        }

        return (
          matchedDefault?.id ||
          activeFromList?.id ||
          ""
        );
      });

      setYearsLoading(false);
    };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, [
    defaultAcademicYear,
    showAcademicYear,
  ]);

  const academicYearOptions =
    useMemo(
      () =>
        academicYears.map((item) => ({
          id: item.id,
          name:
            item.status === "active"
              ? `${item.name} - الحالية`
              : item.name,
        })),
      [academicYears]
    );

  const filters = useMemo(() => {
    const value = {};

    if (academicYearId) {
      /*
       * الباك الحالي للفصول يعتمد academicYearId
       * وليس academicYear النصية القديمة.
       */
      value.academicYearId =
        academicYearId;
    }

    if (gender) {
      value.gender = gender;
    }

    return value;
  }, [academicYearId, gender]);

  const filtersKey = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);

      const result = await loadClasses(
        filters
      );

      if (!active) return;

      if (!result.status) {
        toast.error(result.message, {
          toastId:
            `class-selector-${filtersKey}`,
        });

        setClasses([]);
        setLoading(false);
        return;
      }

      setClasses(result.items);
      setLoading(false);
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [filtersKey]);

  /*
   * في شاشة التعديل القديمة قد يكون عندنا classId فقط
   * بدون academicYear. نستنتج السنة من الفصل المحدد
   * حتى يظهر الـSelect مضبوط تلقائيًا.
   */
  useEffect(() => {
    if (
      !showAcademicYear ||
      academicYearId ||
      !defaultClassId ||
      classes.length === 0
    ) {
      return;
    }

    const selectedClass = classes.find(
      (item) =>
        item.id ===
        normalizeId(defaultClassId)
    );

    if (
      selectedClass?.academicYearId
    ) {
      setAcademicYearId(
        selectedClass.academicYearId
      );
    }
  }, [
    academicYearId,
    classes,
    defaultClassId,
    showAcademicYear,
  ]);

  const mappedClasses = useMemo(
    () =>
      classes.map((item) => {
        const translatedGender =
          translateGender(
            item.gender,
            "class"
          );

        const label = [
          item.gradeLevelName,
          item.name,
          item.roomNumber &&
          item.roomNumber !== item.name
            ? item.roomNumber
            : "",
          translatedGender,
        ]
          .filter(Boolean)
          .join(" - ");

        return {
          id: item.id,
          name: label || "فصل",
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

    if (showGender && !gender) {
      return true;
    }

    if (
      isAcademicYearRequired &&
      !academicYearId
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
    academicYearId,
  ]);

  const updateFormValue = (
    name,
    value
  ) => {
    setValue?.(name, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
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
    const nextValue =
      normalizeId(value);

    setAcademicYearId(nextValue);

    /*
     * نحافظ على اسم الحقل القديم في الفورم للتوافق مع
     * StudentForm الحالي. students.js لا يرسله للباك أصلًا؛
     * classId هو الذي يحدد تسجيل الطالب.
     */
    updateFormValue(
      "academicYear",
      nextValue
    );

    clearClassSelection();
  };

  const handleGenderChange = (
    value
  ) => {
    setGender(value || "");
    clearClassSelection();
  };

  const handleClassChange = (
    value
  ) => {
    const nextValue = value || "";

    setClassId(nextValue);

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

    onClassChange?.(nextValue);
  };

  const handleClassClick = () => {
    if (isStudent) {
      if (
        !academicYearId ||
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
          "لا توجد فصول مطابقة للسنة والجنس المختارين",
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
      academicYearId &&
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
        <Grid item {...gridProps}>
          <Select
            register={register}
            registerName="academicYear"
            data={academicYearOptions}
            name="name"
            error={
              errors?.academicYear
                ?.message
            }
            label="السنة الدراسية"
            onChange={
              handleAcademicYearChange
            }
            defaultSelect="اختر السنة الدراسية"
            defaultValue={
              academicYearId
            }
            disabled={
              yearsLoading ||
              academicYearOptions.length === 0
            }
            required={
              isAcademicYearRequired
            }
          />
        </Grid>
      )}

      {showGender && (
        <Grid item {...gridProps}>
          <Select
            register={register}
            registerName="gender"
            data={genderOptions}
            name="label"
            error={
              errors?.gender?.message
            }
            label="الجنس"
            onChange={
              handleGenderChange
            }
            defaultValue={gender}
            required={genderRequired}
          />
        </Grid>
      )}

      {showClass && (
        <Grid
          item
          {...gridProps}
          onClick={handleClassClick}
        >
          <Select
            register={register}
            registerName="classId"
            data={mappedClasses}
            name="name"
            error={
              errors?.classId?.message
            }
            label="الفصل"
            disabled={classDisabled}
            onChange={
              handleClassChange
            }
            defaultValue={classId}
            defaultSelect={defaultSelect}
            required={isClassRequired}
          />
        </Grid>
      )}
    </>
  );
};

export default ClassSelector;
