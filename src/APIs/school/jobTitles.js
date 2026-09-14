import { api } from "@/shared/api/client";
import { getApiError } from "@/shared/api/getApiError";

const ENDPOINT = "/job-titles";

/* The server wraps every body as { status, message, data }. */
const unwrap = (response) => {
  const body = response?.data;
  return body && typeof body === "object" && "data" in body ? body.data : body;
};

const ok = (response) => ({
  status: true,
  message: response?.data?.message,
  data: unwrap(response),
});

export const fetchJobTitles = async () => {
  try {
    return ok(await api.get(ENDPOINT));
  } catch (error) {
    return getApiError(error, "تعذر تحميل المسميات الوظيفية");
  }
};

export const fetchJobTitleTemplates = async () => {
  try {
    return ok(await api.get(`${ENDPOINT}/templates`));
  } catch (error) {
    return getApiError(error, "تعذر تحميل القوالب الجاهزة");
  }
};

/** { name, templateKey? } — or { name, permissions } for a blank or edited start. */
export const createJobTitle = async (payload) => {
  try {
    return ok(await api.post(ENDPOINT, payload));
  } catch (error) {
    return getApiError(error, "تعذر إنشاء المسمى الوظيفي");
  }
};

/** { name?, permissions? } */
export const updateJobTitle = async (id, payload) => {
  try {
    return ok(await api.patch(`${ENDPOINT}/${id}`, payload));
  } catch (error) {
    return getApiError(error, "تعذر حفظ المسمى الوظيفي");
  }
};

export const deleteJobTitle = async (id) => {
  try {
    return ok(await api.delete(`${ENDPOINT}/${id}`));
  } catch (error) {
    return getApiError(error, "تعذر حذف المسمى الوظيفي");
  }
};

/**
 * Give an assistant a title, or clear it with jobTitleId null.
 * type: "admin" for a MANAGER account, "teacher" for a promoted teacher.
 */
export const assignJobTitle = async (accountId, { type, jobTitleId }) => {
  try {
    return ok(
      await api.patch(`${ENDPOINT}/assignments/${accountId}`, {
        type,
        jobTitleId: jobTitleId || null,
      })
    );
  } catch (error) {
    return getApiError(error, "تعذر إسناد المسمى الوظيفي");
  }
};
