import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/platform/schools";

export const getPlatformSchools = async () => {
  try {
    const response = await api.get(ENDPOINT);

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل المدارس"
    );
  }
};

export const getPlatformSchoolById = async (
  schoolId
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/${schoolId}`
    );

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل بيانات المدرسة"
    );
  }
};

export const updatePlatformSchool = async (
  schoolId,
  payload
) => {
  try {
    const response = await api.patch(
      `${ENDPOINT}/${schoolId}`,
      payload
    );

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحديث المدرسة"
    );
  }
};

export const suspendPlatformSchool = async (
  schoolId
) => {
  try {
    const response = await api.patch(
      `${ENDPOINT}/${schoolId}/suspend`
    );

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر إيقاف المدرسة"
    );
  }
};

export const activatePlatformSchool = async (
  schoolId
) => {
  try {
    const response = await api.patch(
      `${ENDPOINT}/${schoolId}/activate`
    );

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تفعيل المدرسة"
    );
  }
};

export default getPlatformSchools;
