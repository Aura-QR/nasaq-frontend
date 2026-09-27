import { Grid } from "@mui/material";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import Select from "@/components/Select/Select";
import MultiSelect from "@/components/MultiSelect/MultiSelect";

import { translateGender } from "@/utils/helpers/translateGender";
import { useClasses } from "@/utils/hooks/apis/useClasses";

import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/APIs/school/academicYears";

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id || value?.id || ""
    ).trim();
  }

  return String(value).trim();
};

const unwrapData = (response) => {
  let current = response;

  for (let i = 0; i < 5; i += 1) {
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

const extractYears = (response) => {
  const payload = unwrapData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  return (
    payload.academicYears ||
    payload.years ||
    payload.docs ||
    payload.items ||
    payload.results ||
    []
  );
};

const extractActiveYear = (response) => {
  const payload = unwrapData(response);

  if (!payload || Array.isArray(payload)) {
    return null;
  }

  return (
    payload.academicYear ||
    payload.year ||
    payload.item ||
    payload
  );
};

const normalizeYear = (item) => ({
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

const getClassYearId = (item) =>
  normalizeId(
    item?.academicYearId ||
      item?.academicYear
  );

const getClassYearName = (item) => {
  const value =
    item?.academicYearId ||
    item?.academicYear;

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

const getGradeLevelName = (item) => {
  const value =
    item?.gradeLevelId ||
    item?.gradeLevel;

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

const ClassSelectors = ({
  register,
  errors,

  defaultAcademicYear = "",

  selectedClassIds = [],
  setSelectedClassIds,

  onAcademicYearChange,
  setValue,
}) => {
  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [
    academicYearId,
    setAcademicYearId,
  ] = useState("");

  const [
    yearsLoading,
    setYearsLoading,
  ] = useState(true);

  /*
   * تحميل السنوات الدراسية الحقيقية
   * التي أضافها الـ Owner.
   */
  useEffect(() => {
    let mounted = true;

    const loadAcademicYears = async () => {
      setYearsLoading(true);

      try {
        const [
          yearsResponse,
          activeResponse,
        ] = await Promise.all([
          fetchAcademicYears(),
          fetchActiveAcademicYear(),
        ]);

        if (!mounted) return;

        if (
          yearsResponse?.status === false
        ) {
          throw new Error(
            yearsResponse?.message ||
              "تعذر تحميل السنوات الدراسية"
          );
        }

        const years = extractYears(
          yearsResponse
        )
          .map(normalizeYear)
          .filter((item) => item.id);

        setAcademicYears(years);

        /*
         * Edit screen قد يرسل:
         * - AcademicYear ID
         * - AcademicYear object
         * - الاسم القديم للسنة
         */
        const defaultId =
          normalizeId(
            defaultAcademicYear
          );

        const defaultName =
          typeof defaultAcademicYear ===
          "string"
            ? defaultAcademicYear.trim()
            : defaultAcademicYear?.name ||
              defaultAcademicYear?.label ||
              "";

        const matchedDefault =
          years.find(
            (item) =>
              item.id === defaultId ||
              (defaultName &&
                item.name === defaultName)
          ) || null;

        const activeEntity =
          activeResponse?.status === false
            ? null
            : extractActiveYear(
                activeResponse
              );

        const activeId =
          normalizeId(activeEntity);

        const activeYear =
          years.find(
            (item) =>
              item.id === activeId
          ) ||
          years.find(
            (item) =>
              item.status === "active"
          ) ||
          null;

        const selectedYearId =
          matchedDefault?.id ||
          activeYear?.id ||
          "";

        setAcademicYearId(
          selectedYearId
        );

        /*
         * نحط الـMongo ID في الفورم.
         * نخلي academicYear مؤقتًا للتوافق
         * مع صفحات Projects القديمة،
         * ونضيف academicYearId للشكل الصحيح.
         */
        if (selectedYearId) {
          setValue?.(
            "academicYearId",
            selectedYearId
          );

          setValue?.(
            "academicYear",
            selectedYearId
          );
        }
      } catch (error) {
        if (!mounted) return;

        setAcademicYears([]);

        toast.error(
          error?.message ||
            "تعذر تحميل السنوات الدراسية",
          {
            toastId:
              "class-selectors-years",
          }
        );
      } finally {
        if (mounted) {
          setYearsLoading(false);
        }
      }
    };

    loadAcademicYears();

    return () => {
      mounted = false;
    };
  }, [
    defaultAcademicYear,
    setValue,
  ]);

  const academicYearOptions =
    useMemo(
      () =>
        academicYears.map(
          (item) => ({
            id: item.id,
            name:
              item.status === "active"
                ? `${item.name} - الحالية`
                : item.name,
          })
        ),
      [academicYears]
    );

  /*
   * مهم:
   * Backend Classes يستخدم academicYearId.
   */
  const filters = useMemo(
    () => ({
      ...(academicYearId
        ? {
            academicYearId,
          }
        : {}),
    }),
    [academicYearId]
  );

  const {
    classes = [],
    loading,
  } = useClasses(filters);

  const selectedYearName =
    useMemo(
      () =>
        academicYears.find(
          (item) =>
            item.id === academicYearId
        )?.name || "",
      [
        academicYears,
        academicYearId,
      ]
    );

  const mappedClasses =
    useMemo(
      () =>
        classes
          .filter((item) => {
            /*
             * لو الـAPI نفسه لم يفلتر،
             * نعمل safeguard من الفرونت.
             */
            const classYearId =
              getClassYearId(item);

            if (
              academicYearId &&
              classYearId
            ) {
              return (
                classYearId ===
                academicYearId
              );
            }

            return true;
          })
          .map((item) => {
            const id =
              item?._id ||
              item?.id ||
              "";

            const yearName =
              getClassYearName(
                item
              ) ||
              selectedYearName;

            const gradeLevel =
              getGradeLevelName(
                item
              );

            const roomNumber =
              item?.roomNumber ||
              item?.name ||
              "";

            const gender =
              translateGender(
                item?.gender,
                "class"
              );

            const name = [
              yearName,
              gradeLevel,
              roomNumber,
              gender,
            ]
              .filter(Boolean)
              .join(" - ");

            return {
              id,
              name:
                name || "فصل",
            };
          })
          .filter((item) => item.id),
      [
        classes,
        academicYearId,
        selectedYearName,
      ]
    );

  const isClassDisabled =
    loading ||
    !academicYearId ||
    mappedClasses.length === 0;

  const handleClassClick = () => {
    if (!academicYearId) {
      toast.info(
        "برجاء اختيار السنة الدراسية أولاً",
        {
          toastId:
            "select-academic-year-first",
        }
      );

      return;
    }

    if (
      !loading &&
      mappedClasses.length === 0
    ) {
      toast.info(
        "لا توجد فصول في هذه السنة الدراسية",
        {
          toastId:
            "no-classes-for-year",
        }
      );
    }
  };

  const handleAcademicYearChange = (
    value
  ) => {
    const nextYearId =
      normalizeId(value);

    setAcademicYearId(
      nextYearId
    );

    /*
     * الصحيح للباك.
     */
    setValue?.(
      "academicYearId",
      nextYearId,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    /*
     * للتوافق مع Projects Add/Edit
     * الحالية لحين تنظيفها.
     */
    setValue?.(
      "academicYear",
      nextYearId,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    setSelectedClassIds?.([]);

    setValue?.(
      "classIds",
      [],
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    onAcademicYearChange?.(
      nextYearId
    );
  };

  const handleClassChange = (
    ids
  ) => {
    const values =
      Array.isArray(ids)
        ? ids
        : [];

    setSelectedClassIds?.(
      values
    );

    setValue?.(
      "classIds",
      values,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <>
      <Grid
        item
        xs={12}
        sm={6}
        md={4}
        lg={3}
      >
        <Select
          register={register}
          registerName="academicYear"
          data={academicYearOptions}
          name="name"
          error={
            errors?.academicYear
              ?.message ||
            errors?.academicYearId
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
            academicYearOptions.length ===
              0
          }
          required
        />
      </Grid>

      <Grid
        item
        xs={12}
        onClick={
          handleClassClick
        }
      >
        <MultiSelect
          register={register}
          registerName="classIds"
          data={mappedClasses}
          name="name"
          error={
            errors?.classIds?.message
          }
          label="الفصول"
          disabled={
            isClassDisabled
          }
          onChange={
            handleClassChange
          }
          required
          defaultValue={
            selectedClassIds
          }
          selectedValues={
            selectedClassIds
          }
          setSelectedValues={
            setSelectedClassIds
          }
        />
      </Grid>
    </>
  );
};

export default ClassSelectors;