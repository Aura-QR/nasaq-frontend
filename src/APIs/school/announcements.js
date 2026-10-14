import { api, API_BASE_URL } from "@/APIs/Axios";

const BASE = "/announcements";
const unwrap = (response) => response.data?.data ?? response.data;
export const fetchAnnouncementFeed = async () => unwrap(await api.get(`${BASE}/feed`));
export const fetchAnnouncements = async (params = {}) => unwrap(await api.get(BASE, { params }));
export const fetchAnnouncement = async (id) => unwrap(await api.get(`${BASE}/${id}`));
export const uploadAnnouncementFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(await api.post(`${BASE}/uploads`, formData, { onUploadProgress }));
};
export const createAnnouncement = async (payload) => unwrap(await api.post(BASE, payload));
export const updateAnnouncement = async (id, payload) => unwrap(await api.patch(`${BASE}/${id}`, payload));
export const setAnnouncementStatus = async (id, isActive) => unwrap(await api.patch(`${BASE}/${id}/status`, { isActive }));
export const updateAnnouncementOrder = async (ids) => unwrap(await api.put(`${BASE}/order`, { ids }));
export const deleteAnnouncement = async (id) => unwrap(await api.delete(`${BASE}/${id}`));
export const announcementMediaUrl = (path) => !path ? "" : /^https?:\/\//i.test(path) ? path : `${new URL(API_BASE_URL).origin}/${String(path).replace(/^\/+/, "")}`;
