import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/APIs/Axios";

const OBJECT_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value?._id ||
      value?.id ||
      value?.value ||
      ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};

const unwrapData = (value) => {
  let current =
    value?.data ?? value;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      current.data === undefined
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

const extractList = (response) => {
  const root =
    unwrapData(response);

  if (Array.isArray(root)) {
    return root;
  }

  if (
    !root ||
    typeof root !== "object"
  ) {
    return [];
  }

  for (const key of [
    "academicYears",
    "years",
    "docs",
    "items",
    "results",
    "records",
    "rows",
    "data",
  ]) {
    if (
      Array.isArray(root?.[key])
    ) {
      return root[key];
    }
  }

  return [];
};

const normalizeYear = (item) => ({
  ...item,
  id: normalizeId(item),
  name:
    item?.name ||
    item?.label ||
    item?.title ||
    "",
});

export const useFinancialAcademicYears = (
  extraAcademicYearIds = []
) => {
  const [
    academicYears,
    setAcademicYears,
  ] = useState([]);

  const [
    loadingAcademicYears,
    setLoadingAcademicYears,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAcademicYears =
      async () => {
        setLoadingAcademicYears(
          true
        );

        try {
          const response =
            await api.get(
              "/academic-years"
            );

          if (!active) {
            return;
          }

          setAcademicYears(
            extractList(response)
              .map(normalizeYear)
              .filter(
                (item) =>
                  item.id &&
                  item.name
              )
          );
        } catch {
          if (active) {
            setAcademicYears([]);
          }
        } finally {
          if (active) {
            setLoadingAcademicYears(
              false
            );
          }
        }
      };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, []);

  const yearMap =
    useMemo(
      () =>
        new Map(
          academicYears.map(
            (item) => [
              item.id,
              item.name,
            ]
          )
        ),
      [academicYears]
    );

  const normalizeExtraIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            (
              Array.isArray(
                extraAcademicYearIds
              )
                ? extraAcademicYearIds
                : [
                    extraAcademicYearIds,
                  ]
            )
              .map(normalizeId)
              .filter(Boolean)
          )
        ),
      [extraAcademicYearIds]
    );

  const options =
    useMemo(() => {
      const normalOptions =
        academicYears.map(
          (item) => ({
            value: item.id,
            label: item.name,
          })
        );

      /*
       * Keep existing financial records filterable even when
       * their academicYearId points to an archived/deleted year.
       * We do NOT call GET /academic-years/:id here because a stale
       * reference correctly returns 404 and only creates noisy requests.
       */
      const missingOptions =
        normalizeExtraIds
          .filter(
            (id) =>
              !yearMap.has(id)
          )
          .map((id) => ({
            value: id,
            label:
              "سنة غير متاحة في الإعدادات",
          }));

      return [
        ...normalOptions,
        ...missingOptions,
      ];
    }, [
      academicYears,
      normalizeExtraIds,
      yearMap,
    ]);

  const getAcademicYearLabel =
    useCallback(
      (academicYearId) => {
        const id =
          normalizeId(
            academicYearId
          );

        if (!id) {
          return "—";
        }

        const label =
          yearMap.get(id);

        if (label) {
          return label;
        }

        return OBJECT_ID_PATTERN.test(
          id
        )
          ? "سنة غير متاحة"
          : "—";
      },
      [yearMap]
    );

  return {
    academicYears,
    academicYearOptions:
      options,
    loadingAcademicYears,
    getAcademicYearLabel,
  };
};

export default useFinancialAcademicYears;
