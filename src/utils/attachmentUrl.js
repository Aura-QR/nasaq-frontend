import { API_BASE_URL } from "@/APIs/Axios";

/**
 * The address of an uploaded file — a medical note, an excuse photo.
 *
 * The server stores a path such as `/uploads/absence-excuses/x.jpg`, and the
 * file lives on the API host. Used as an href unchanged, the browser opens it
 * on the web app's own host, which knows no such page and redirects to the
 * home screen — the reviewer saw the app "throw them out" instead of the note.
 */
export const resolveAttachmentUrl = (attachment) => {
  if (!attachment) return "";
  const value = String(attachment).trim();
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value, `${API_BASE_URL}/`).href;
  } catch {
    return value;
  }
};

export default resolveAttachmentUrl;
