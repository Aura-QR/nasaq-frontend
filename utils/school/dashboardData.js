const normalizeKey = (
  value
) =>
  String(value || "")
    .replace(
      /[\s_-]/g,
      ""
    )
    .toLowerCase();

const toMetricNumber = (
  value
) => {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim() !== "" &&
    Number.isFinite(
      Number(value)
    )
  ) {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const objectCandidates = [
      value.total,
      value.count,
      value.totalCount,
      value.value,
      value.length,
      value.active,
    ];

    for (
      const candidate of
      objectCandidates
    ) {
      const parsed =
        toMetricNumber(
          candidate
        );

      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
};

const findMetric = (
  source,
  aliases
) => {
  const normalizedAliases =
    new Set(
      aliases.map(
        normalizeKey
      )
    );

  const queue = [source];
  const visited =
    new Set();

  while (queue.length) {
    const current =
      queue.shift();

    if (
      current === null ||
      current === undefined
    ) {
      continue;
    }

    if (
      typeof current !==
      "object"
    ) {
      continue;
    }

    if (
      visited.has(current)
    ) {
      continue;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach(
        (item) =>
          queue.push(item)
      );

      continue;
    }

    for (
      const [
        key,
        value,
      ] of Object.entries(
        current
      )
    ) {
      if (
        normalizedAliases.has(
          normalizeKey(key)
        )
      ) {
        const metric =
          toMetricNumber(
            value
          );

        if (metric !== null) {
          return metric;
        }
      }

      if (
        value &&
        typeof value ===
          "object"
      ) {
        queue.push(value);
      }
    }
  }

  return null;
};

export const unwrapDashboardPayload =
  (payload) => {
    let current = payload;

    for (
      let index = 0;
      index < 6;
      index += 1
    ) {
      if (
        !current ||
        typeof current !==
          "object" ||
        Array.isArray(current)
      ) {
        break;
      }

      const next =
        current.data ??
        current.result ??
        current.payload ??
        current.response;

      if (
        !next ||
        next === current
      ) {
        break;
      }

      current = next;
    }

    return current;
  };

export const extractDashboardMetrics =
  (payload) => {
    const data =
      unwrapDashboardPayload(
        payload
      );

    return {
      students: findMetric(
        data,
        [
          "totalStudents",
          "studentsCount",
          "studentCount",
          "studentsTotal",
          "students",
        ]
      ),

      teachers: findMetric(
        data,
        [
          "totalTeachers",
          "teachersCount",
          "teacherCount",
          "teachersTotal",
          "teachers",
        ]
      ),

      classes: findMetric(
        data,
        [
          "totalClasses",
          "classesCount",
          "classCount",
          "classesTotal",
          "classes",
        ]
      ),

      subjects: findMetric(
        data,
        [
          "totalSubjects",
          "subjectsCount",
          "subjectCount",
          "subjectsTotal",
          "subjects",
        ]
      ),
    };
  };
