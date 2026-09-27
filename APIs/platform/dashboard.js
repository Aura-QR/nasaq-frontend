import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/dashboards/super-admin";

export const getSuperAdminDashboard = async () => {
  try {
    const response = await api.get(ENDPOINT);

    return {
      status: true,
      data: response.data,
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل إحصائيات المنصة"
    );
  }
};

export default getSuperAdminDashboard;
