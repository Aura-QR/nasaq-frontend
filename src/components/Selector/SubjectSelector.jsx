import {
  useEffect,
  useMemo,
} from "react";

import Select from "@/components/Select/Select";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";

const normalizeId = (value) => {
  const resolvedValue =
    value?.target?.value ??
    value;

  if (
    resolvedValue &&
    typeof resolvedValue === "object"
  ) {
    return String(
      resolvedValue._id ||
        resolvedValue.id ||
        resolvedValue.value ||
        ""
    ).trim();
  }

  return String(
    resolvedValue || ""
  ).trim();
};

const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.docs)) {
    return value.docs;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

const getSubjectLabel = (item) => {
  const name =
    item?.subjectName ||
    item?.name ||
    item?.label ||
    "مادة";

  const code =
    item?.subjectCode ||
    item?.code ||
    "";

  return code
    ? `${name} - ${code}`
    : name;
};

const SubjectSelector = ({
  register,
  errors,
  setValue,
  data = [],
  loading = false,
  defaultSubjectId = "",
  label = "المادة",
  required = false,
  disabled = false,
  registerName = "subjectOfferingId",
  valueName = "name",
  onChange,
}) => {
  const {
    subjects = [],
    loading: loadingSubjects,
  } = useSubjects({
    page: 1,
    limit: 1000,
  });

  const sourceData =
    getArray(data).length > 0
      ? getArray(data)
      : getArray(subjects);

  const options = useMemo(
    () =>
      sourceData
        .map((item) => {
          const id =
            normalizeId(item);

          if (!id) {
            return null;
          }

          const optionLabel =
            item?.[valueName] ||
            getSubjectLabel(item);

          return {
            ...item,
            _id: id,
            id,
            value: id,
            name: optionLabel,
            label: optionLabel,
            [valueName]: optionLabel,
          };
        })
        .filter(Boolean),
    [sourceData, valueName]
  );

  const normalizedDefaultId =
    normalizeId(
      defaultSubjectId
    );

  useEffect(() => {
    if (
      typeof setValue !==
        "function" ||
      !normalizedDefaultId ||
      options.length === 0
    ) {
      return;
    }

    const exists =
      options.some(
        (item) =>
          normalizeId(item) ===
          normalizedDefaultId
      );

    if (!exists) {
      return;
    }

    setValue(
      registerName,
      normalizedDefaultId,
      {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      }
    );
  }, [
    normalizedDefaultId,
    options,
    registerName,
    setValue,
  ]);

  const handleChange = (value) => {
    const normalizedValue =
      normalizeId(value);

    if (
      typeof setValue ===
      "function"
    ) {
      setValue(
        registerName,
        normalizedValue,
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
    }

    onChange?.(
      normalizedValue
    );
  };

  const isLoading =
    loading ||
    (getArray(data).length === 0 &&
      loadingSubjects);

  return (
    <Select
      key={`${registerName}-${normalizedDefaultId}-${options.length}`}
      register={register}
      registerName={registerName}
      error={
        errors?.[registerName]
          ?.message
      }
      label={label}
      required={required}
      data={options}
      name={valueName}
      disabled={
        disabled ||
        isLoading ||
        options.length === 0
      }
      defaultValue={
        normalizedDefaultId
      }
      onChange={handleChange}
    />
  );
};

export default SubjectSelector;
