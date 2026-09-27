import { useEffect, useState } from "react";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/APIs/school/academicYears";

const unwrap = (response) => {
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

const extractList = (response) => {
  const payload = unwrap(response);

  if (Array.isArray(payload)) return payload;

  return (
    payload?.academicYears ||
    payload?.years ||
    payload?.docs ||
    payload?.items ||
    payload?.results ||
    []
  );
};

const normalizeId = (value) =>
  String(
    value?._id ||
      value?.id ||
      value ||
      ""
  ).trim();

export const useAcademicYears = () => {
  const [academicYears, setAcademicYears] =
    useState([]);

  const [
    activeAcademicYear,
    setActiveAcademicYear,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const [
        yearsResponse,
        activeResponse,
      ] = await Promise.all([
        fetchAcademicYears(),
        fetchActiveAcademicYear(),
      ]);

      if (!mounted) return;

      const years = extractList(
        yearsResponse
      )
        .map((item) => ({
          ...item,
          id: normalizeId(item),
          name:
            item?.name ||
            item?.label ||
            item?.title ||
            "",
          status: String(
            item?.status || ""
          ).toLowerCase(),
        }))
        .filter(
          (item) =>
            item.id && item.name
        );

      setAcademicYears(years);

      const activePayload =
        unwrap(activeResponse);

      const active =
        activePayload?.academicYear ||
        activePayload?.year ||
        activePayload?.item ||
        activePayload ||
        years.find(
          (item) =>
            item.status === "active"
        ) ||
        null;

      setActiveAcademicYear(
        active || null
      );

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    academicYears,
    activeAcademicYear,
    loadingAcademicYears: loading,
  };
};

export default useAcademicYears;