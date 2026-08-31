import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/schools/me/settings";

const normalizeNationalityCodes = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => {
          if (
            value &&
            typeof value === "object"
          ) {
            return String(
              value?.code ||
                value?.nationalityCode ||
                value?.value ||
                ""
            )
              .trim()
              .toUpperCase();
          }

          return String(value || "")
            .trim()
            .toUpperCase();
        })
        .filter(Boolean)
    )
  );
};

const normalizeTime = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const stringValue = String(value).trim();

  const directMatch =
    stringValue.match(
      /^(\d{2}):(\d{2})/
    );

  if (directMatch) {
    return `${directMatch[1]}:${directMatch[2]}`;
  }

  const isoMatch =
    stringValue.match(
      /T(\d{2}):(\d{2})/
    );

  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`;
  }

  return stringValue;
};

const normalizeWorkSchedule = (
  value
) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    const isWorkingDay =
      Boolean(item?.isWorkingDay);

    return {
      day: String(
        item?.day || ""
      )
        .trim()
        .toLowerCase(),

      isWorkingDay,

      startTime: isWorkingDay
        ? normalizeTime(
            item?.startTime
          )
        : null,

      endTime: isWorkingDay
        ? normalizeTime(
            item?.endTime
          )
        : null,
    };
  });
};

const buildSchoolSettingsPayload = (
  data = {}
) => {
  /*
   * مهم:
   * نبدأ من نسخة كاملة من data حتى لا نسقط
   * أي إعدادات أخرى تستخدم نفس endpoint
   * (الحضور، الشبكة، الموقع... إلخ).
   */
  const payload = {
    ...data,
  };

  /*
   * الـ UI يستخدم localNationalities،
   * بينما الـ backend يستخدم
   * localNationalityCodes.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "localNationalities"
    )
  ) {
    payload.localNationalityCodes =
      normalizeNationalityCodes(
        payload.localNationalities
      );

    delete payload.localNationalities;
  } else if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "localNationalityCodes"
    )
  ) {
    payload.localNationalityCodes =
      normalizeNationalityCodes(
        payload.localNationalityCodes
      );
  }

  /*
   * Timetable settings.
   * لا نحذف الحقلين؛ فقط نطبّع القيم.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "periodsPerDay"
    )
  ) {
    const periodsPerDay = Number(
      payload.periodsPerDay
    );

    payload.periodsPerDay =
      Number.isFinite(periodsPerDay)
        ? periodsPerDay
        : payload.periodsPerDay;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "workSchedule"
    )
  ) {
    payload.workSchedule =
      normalizeWorkSchedule(
        payload.workSchedule
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "workStartTime"
    )
  ) {
    payload.workStartTime =
      normalizeTime(
        payload.workStartTime
      );
  }

  return payload;
};

export const fetchSchoolSettings =
  async () => {
    try {
      const response =
        await api.get(ENDPOINT);

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل إعدادات المدرسة"
      );
    }
  };

export const updateSchoolSettings =
  async (data = {}) => {
    try {
      const payload =
        buildSchoolSettingsPayload(
          data
        );

      const response =
        await api.patch(
          ENDPOINT,
          payload
        );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر حفظ إعدادات المدرسة"
      );
    }
  };

export {
  buildSchoolSettingsPayload,
};

export default {
  fetchSchoolSettings,
  updateSchoolSettings,
};
