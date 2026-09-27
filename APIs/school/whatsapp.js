import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/messaging/whatsapp";

/**
 * The school's own WhatsApp number.
 *
 * Credentials used to go out through one number shared by every school, so a
 * parent received their child's password from a number that was not their
 * school's — and one ban would have silenced everyone at once. A school that
 * connects here sends from itself.
 */
export const fetchWhatsappStatus = async () => {
  try {
    const response = await api.get(ENDPOINT);
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر قراءة حالة اتصال واتساب"
    );
  }
};

/** Starts pairing and returns a QR code to render. It expires in under a minute. */
export const connectWhatsapp = async () => {
  try {
    const response = await api.post(
      `${ENDPOINT}/connect`
    );
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر بدء ربط واتساب"
    );
  }
};

export const disconnectWhatsapp = async () => {
  try {
    const response = await api.delete(ENDPOINT);
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر فصل واتساب"
    );
  }
};
