import {
  ClassRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import SelectFilter from "@/components/Filters/SelectFilter";
import { api } from "@/APIs/Axios";
import { translateGender } from "@/utils/helpers/translateGender";

const normalizeId = (
  value
) =>
  String(
    value?._id ||
    value?.id ||
    value ||
    ""
  ).trim();

const extractList = (
  response
) => {
  let payload =
    response?.data ??
    response;

  for (
    let index = 0;
    index < 5;
    index += 1
  ) {
    if (
      !payload ||
      Array.isArray(payload) ||
      typeof payload !==
        "object" ||
      payload.data ===
        undefined
    ) {
      break;
    }

    payload =
      payload.data;
  }

  if (
    Array.isArray(payload)
  ) {
    return payload;
  }

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return [];
  }

  for (const key of [
    "classes",
    "docs",
    "items",
    "results",
    "rows",
    "records",
    "data",
  ]) {
    if (
      Array.isArray(
        payload?.[key]
      )
    ) {
      return payload[key];
    }
  }

  return [];
};

const getClassLabel = (
  item
) => {
  const room =
    item?.roomNumber ||
    item?.name ||
    item?.title ||
    "فصل";

  const gender =
    translateGender(
      item?.gender,
      "class"
    );

  return [
    room,
    gender,
  ]
    .filter(Boolean)
    .join(" - ");
};

const FinancialClassFilter = ({
  classId,
  setClassId,
  academicYearId,
  disabled = false,
}) => {
  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    const loadClasses =
      async () => {
        setLoading(true);

        try {
          const response =
            await api.get(
              "/classes",
              {
                params: {
                  page: 1,
                  limit: 1000,
                  ...(academicYearId
                    ? {
                        academicYearId,
                      }
                    : {}),
                },
              }
            );

          if (!active) {
            return;
          }

          setClasses(
            extractList(
              response
            )
          );
        } catch {
          if (active) {
            setClasses([]);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadClasses();

    return () => {
      active = false;
    };
  }, [academicYearId]);

  const options =
    useMemo(
      () =>
        classes
          .map(
            (item) => ({
              value:
                normalizeId(
                  item
                ),
              label:
                getClassLabel(
                  item
                ),
            })
          )
          .filter(
            (item) =>
              item.value
          ),
      [classes]
    );

  return (
    <SelectFilter
      value={classId}
      onChange={setClassId}
      label="الفصل"
      icon={ClassRounded}
      allLabel="كل الفصول"
      options={options}
      disabled={
        disabled ||
        loading
      }
    />
  );
};

export default FinancialClassFilter;
