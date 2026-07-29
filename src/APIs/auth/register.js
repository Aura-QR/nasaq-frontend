import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/schools/register";

const normalizeText = (value) =>
  String(value || "").trim();

const normalizeEmail = (value) =>
  normalizeText(value).toLowerCase();

const normalizeSlug = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizePhone = (value) =>
  normalizeText(value).replace(/[\s()-]/g, "");

export const registerRequest = async (payload) => {
  try {
    const requestBody = {
      schoolName: normalizeText(
        payload?.schoolName
      ),

      slug: normalizeSlug(
        payload?.slug
      ),

      schoolEmail: normalizeEmail(
        payload?.schoolEmail
      ),

      phone: normalizePhone(
        payload?.phone
      ),

      ownerName: normalizeText(
        payload?.ownerName
      ),

      ownerUsername: normalizeText(
        payload?.ownerUsername
      ).toLowerCase(),

      ownerEmail: normalizeEmail(
        payload?.ownerEmail
      ),

      ownerPassword:
        payload?.ownerPassword || "",
    };

    const response = await api.post(
      ENDPOINT,
      requestBody
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تسجيل المدرسة"
    );
  }
};

export default registerRequest;
