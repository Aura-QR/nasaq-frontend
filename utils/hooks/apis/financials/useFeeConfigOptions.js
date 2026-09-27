import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchAcademicYears } from "@/APIs/school/academicYears";
import { fetchGradeLevels } from "@/APIs/school/gradeLevels";
import { extractApiList, getEntityId } from "@/utils/school/classData";

const labelOf = (item, fallback = "—") =>
  String(item?.name || item?.label || item?.title || fallback).trim();

export const useFeeConfigOptions = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoadingOptions(true);

      const [yearsResponse, gradesResponse] = await Promise.all([
        fetchAcademicYears(),
        fetchGradeLevels(),
      ]);

      if (!active) return;

      const errors = [yearsResponse, gradesResponse]
        .filter((response) => response?.status === false)
        .map((response) => response?.message)
        .filter(Boolean);

      const years =
        yearsResponse?.status === false
          ? []
          : extractApiList(yearsResponse, ["academicYears", "years"]);

      const grades =
        gradesResponse?.status === false
          ? []
          : extractApiList(gradesResponse, ["gradeLevels", "grades"]);

      setAcademicYears(
        [...years].sort((a, b) => {
          const activeDiff =
            Number(String(b?.status || "").toLowerCase() === "active") -
            Number(String(a?.status || "").toLowerCase() === "active");

          if (activeDiff !== 0) return activeDiff;

          return (
            new Date(b?.startDate || 0).getTime() -
            new Date(a?.startDate || 0).getTime()
          );
        }),
      );

      setGradeLevels(
        [...grades].sort(
          (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
        ),
      );

      setOptionsError(errors.join(" — "));
      setLoadingOptions(false);
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const academicYearOptions = useMemo(
    () =>
      academicYears
        .map((item) => ({
          ...item,
          _id: getEntityId(item),
          name: `${labelOf(item)}${
            String(item?.status || "").toLowerCase() === "active"
              ? " — النشطة"
              : ""
          }`,
        }))
        .filter((item) => item._id && item.name),
    [academicYears],
  );

  const gradeLevelOptions = useMemo(
    () =>
      gradeLevels
        .map((item) => ({
          ...item,
          _id: getEntityId(item),
          name: labelOf(item),
        }))
        .filter((item) => item._id && item.name),
    [gradeLevels],
  );

  const activeAcademicYearId = useMemo(
    () =>
      getEntityId(
        academicYears.find(
          (item) => String(item?.status || "").toLowerCase() === "active",
        ),
      ),
    [academicYears],
  );

  const academicYearMap = useMemo(
    () =>
      new Map(
        academicYears.map((item) => [getEntityId(item), labelOf(item)]),
      ),
    [academicYears],
  );

  const gradeLevelMap = useMemo(
    () =>
      new Map(gradeLevels.map((item) => [getEntityId(item), labelOf(item)])),
    [gradeLevels],
  );

  const getAcademicYearLabel = useCallback(
    (value) => {
      if (value && typeof value === "object") return labelOf(value);
      const id = getEntityId(value);
      return academicYearMap.get(id) || String(value || "—");
    },
    [academicYearMap],
  );

  const getGradeLevelLabel = useCallback(
    (value) => {
      if (value && typeof value === "object") return labelOf(value);
      const id = getEntityId(value);
      return gradeLevelMap.get(id) || String(value || "—");
    },
    [gradeLevelMap],
  );

  return {
    academicYears,
    gradeLevels,
    academicYearOptions,
    gradeLevelOptions,
    activeAcademicYearId,
    loadingOptions,
    optionsError,
    getAcademicYearLabel,
    getGradeLevelLabel,
  };
};

export default useFeeConfigOptions;
