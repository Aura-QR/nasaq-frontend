import {
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { Class } from "@mui/icons-material";

import SelectFilter from "@/components/Filters/SelectFilter";

import {
  fetchClasses,
  fetchClassesList,
} from "@/APIs/school/classes";

import { translateGender } from "@/utils/helpers/translateGender";

const classesCache = new Map();
const pendingRequests = new Map();

const isMongoId = (
  value
) =>
  /^[a-f\d]{24}$/i.test(
    String(value || "")
  );

const extractItems = (
  response
) => {
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

  const items = Array.isArray(
    payload
  )
    ? payload
    : Array.isArray(payload?.docs)
    ? payload.docs
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(
        payload?.classes
      )
    ? payload.classes
    : [];

  return {
    status: true,
    items,
  };
};

const getAcademicYearLabel = (
  item
) => {
  const year =
    item?.academicYear ??
    item?.academicYearId;

  if (
    typeof year === "string"
  ) {
    return year;
  }

  return (
    year?.name ||
    year?.label ||
    ""
  );
};

const normalizeClass = (
  item
) => ({
  id:
    item?._id ||
    item?.id ||
    "",
  academicYear:
    getAcademicYearLabel(
      item
    ),
  name:
    item?.name ||
    item?.roomNumber ||
    "فصل",
  roomNumber:
    item?.roomNumber ||
    "",
  gender:
    item?.gender ||
    "",
});

const requestClasses = async (
  academicYear
) => {
  const cacheKey =
    academicYear || "all";

  if (
    classesCache.has(cacheKey)
  ) {
    return classesCache.get(
      cacheKey
    );
  }

  if (
    pendingRequests.has(
      cacheKey
    )
  ) {
    return pendingRequests.get(
      cacheKey
    );
  }

  const request = (
    isMongoId(academicYear)
      ? fetchClasses({
          academicYearId:
            academicYear,
        })
      : fetchClassesList()
  )
    .then(extractItems)
    .then((result) => {
      if (!result.status) {
        return result;
      }

      const filteredItems =
        academicYear &&
        !isMongoId(
          academicYear
        )
          ? result.items.filter(
              (item) =>
                getAcademicYearLabel(
                  item
                ) === academicYear
            )
          : result.items;

      const value = {
        status: true,
        items:
          filteredItems
            .map(normalizeClass)
            .filter(
              (item) =>
                Boolean(item.id)
            ),
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

const ClassFilter = ({
  classId,
  setClassId,
  academicYear,
}) => {
  const [classes, setClasses] =
    useState([]);

  const [
    loadingClasses,
    setLoadingClasses,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchClassesData =
      async () => {
        setLoadingClasses(true);

        const result =
          await requestClasses(
            academicYear
          );

        if (!active) return;

        if (!result.status) {
          toast.error(
            result.message,
            {
              toastId:
                `classes-${academicYear || "all"}`,
            }
          );

          setClasses([]);
          setLoadingClasses(false);
          return;
        }

        setClasses(
          result.items
        );

        setLoadingClasses(false);
      };

    fetchClassesData();

    return () => {
      active = false;
    };
  }, [academicYear]);

  return (
    <SelectFilter
      value={classId}
      onChange={setClassId}
      label="الفصل"
      icon={Class}
      allLabel="جميع الفصول"
      disabled={loadingClasses}
      options={classes.map(
        (item) => {
          const gender =
            translateGender(
              item.gender,
              "classes"
            );

          return {
            value: item.id,
            label: [
              item.academicYear,
              item.name,
              item.roomNumber &&
              item.roomNumber !==
                item.name
                ? item.roomNumber
                : "",
              gender,
            ]
              .filter(Boolean)
              .join(" - "),
          };
        }
      )}
    />
  );
};

export default ClassFilter;
