export const unwrapPayload = (
  payload
) => {
  let current = payload;

  for (let index = 0; index < 4; index += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      "data" in current &&
      current.data !== current
    ) {
      current = current.data;
    } else {
      break;
    }
  }

  return current;
};

export const extractSchools = (
  payload
) => {
  const data =
    unwrapPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data?.schools,
    data?.items,
    data?.results,
    data?.docs,
    data?.tenants,
    data?.records,
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
};

export const getSchoolId = (
  school
) =>
  school?._id ||
  school?.id ||
  school?.schoolId ||
  school?.tenantId ||
  "";

export const getSchoolName = (
  school
) =>
  school?.schoolName ||
  school?.name ||
  school?.title ||
  "مدرسة بدون اسم";

export const getSchoolEmail = (
  school
) =>
  school?.schoolEmail ||
  school?.email ||
  school?.contactEmail ||
  "—";

export const getSchoolPhone = (
  school
) =>
  school?.phone ||
  school?.phoneNumber ||
  school?.mobile ||
  "—";

export const getSchoolStatus = (
  school
) => {
  const rawStatus = String(
    school?.status ||
      school?.tenantStatus ||
      school?.state ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    school?.isActive === false ||
    school?.active === false ||
    school?.isSuspended === true ||
    [
      "suspended",
      "inactive",
      "disabled",
      "blocked",
    ].includes(rawStatus)
  ) {
    return "suspended";
  }

  return "active";
};

export const formatSchoolDate = (
  school
) => {
  const rawDate =
    school?.createdAt ||
    school?.registrationDate ||
    school?.registeredAt ||
    school?.created_at;

  if (!rawDate) {
    return "—";
  }

  const date =
    new Date(rawDate);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(rawDate);
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
};

const readNumber = (
  sources,
  keys,
  fallback = 0
) => {
  for (const source of sources) {
    if (
      !source ||
      typeof source !== "object"
    ) {
      continue;
    }

    for (const key of keys) {
      const value =
        source?.[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const number =
          Number(value);

        if (
          !Number.isNaN(number)
        ) {
          return number;
        }
      }
    }
  }

  return fallback;
};

export const normalizeDashboard = (
  dashboardPayload,
  schools = []
) => {
  const data =
    unwrapPayload(
      dashboardPayload
    ) || {};

  const metrics =
    data?.metrics ||
    data?.stats ||
    data?.overview ||
    data?.summary ||
    {};

  const schoolMetrics =
    metrics?.schools ||
    data?.schools ||
    {};

  const sources = [
    metrics,
    schoolMetrics,
    data,
  ];

  const activeFromList =
    schools.filter(
      (school) =>
        getSchoolStatus(
          school
        ) === "active"
    ).length;

  const suspendedFromList =
    schools.filter(
      (school) =>
        getSchoolStatus(
          school
        ) === "suspended"
    ).length;

  const now = new Date();

  const newThisMonthFromList =
    schools.filter(
      (school) => {
        const rawDate =
          school?.createdAt ||
          school?.registrationDate ||
          school?.registeredAt ||
          school?.created_at;

        if (!rawDate) {
          return false;
        }

        const date =
          new Date(rawDate);

        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          date.getMonth() ===
            now.getMonth() &&
          date.getFullYear() ===
            now.getFullYear()
        );
      }
    ).length;

  return {
    totalSchools:
      readNumber(
        sources,
        [
          "totalSchools",
          "schoolsCount",
          "totalTenants",
          "total",
          "count",
        ],
        schools.length
      ),

    activeSchools:
      readNumber(
        sources,
        [
          "activeSchools",
          "activeSchoolsCount",
          "activeTenants",
          "active",
        ],
        activeFromList
      ),

    suspendedSchools:
      readNumber(
        sources,
        [
          "suspendedSchools",
          "suspendedSchoolsCount",
          "inactiveSchools",
          "suspendedTenants",
          "suspended",
          "inactive",
        ],
        suspendedFromList
      ),

    newThisMonth:
      readNumber(
        sources,
        [
          "newSchoolsThisMonth",
          "schoolsThisMonth",
          "newThisMonth",
          "monthlyRegistrations",
        ],
        newThisMonthFromList
      ),

    recentSchools:
      extractSchools(
        data?.recentSchools ||
          data?.latestSchools ||
          data?.recentTenants
      ).length
        ? extractSchools(
            data?.recentSchools ||
              data?.latestSchools ||
              data?.recentTenants
          )
        : schools.slice(0, 5),
  };
};
