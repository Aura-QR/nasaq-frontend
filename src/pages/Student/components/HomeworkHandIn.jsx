import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateRounded,
  CheckCircleRounded,
  CloseRounded,
  HourglassTopRounded,
  PictureAsPdfRounded,
  ReplayRounded,
  UploadFileRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { fileHref, submitLessonHomework, withdrawLessonHomework } from "@/APIs/school/homeworkSubmissions";

/*
 * «سلّم الواجب» — تحت كل واجب درس في «واجباتي».
 *
 * الطالب يحل في دفتره، يصوّر الصفحات ويرفعها، فيراها المعلم ويقبلها أو
 * يعيدها مع ملاحظة. بعد القبول لا يُعدَّل التسليم.
 */

const MAX_FILES = 6;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

export const SUBMISSION_STATE = {
  submitted: { label: "تم التسليم، بانتظار المراجعة", color: "#4e8dcc", background: "#edf6ff", Icon: HourglassTopRounded },
  accepted: { label: "قُبل الواجب", color: "#2f9e6a", background: "#e9f7ef", Icon: CheckCircleRounded },
  returned: { label: "أُعيد للتعديل", color: "#d76760", background: "#fff0ef", Icon: ReplayRounded },
};

/** صورة الهاتف الكبيرة تُصغَّر قبل الرفع، فيكون أسرع على الإنترنت الضعيف. */
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 2.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function SubmissionFiles({ files = [] }) {
  if (!files.length) return null;
  return (
    <Stack direction="row" gap={0.75} flexWrap="wrap">
      {files.map((f, i) =>
        f.mimetype === "application/pdf" ? (
          <Chip
            key={i}
            component="a"
            href={fileHref(f.url)}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            icon={<PictureAsPdfRounded />}
            label={f.name || `ملف ${i + 1}`}
            sx={{ maxWidth: 220, fontWeight: 700 }}
          />
        ) : (
          <Box
            key={i}
            component="a"
            href={fileHref(f.url)}
            target="_blank"
            rel="noopener noreferrer"
            title={f.name}
            sx={{
              width: 64,
              height: 64,
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid rgba(18,47,77,.12)",
              backgroundColor: "#f3f5f7",
              display: "block",
            }}
          >
            <img src={fileHref(f.url)} alt={f.name || `صفحة ${i + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        ),
      )}
    </Stack>
  );
}

export default function HomeworkHandIn({ item, onChange }) {
  const submission = item.submission;
  const state = submission ? SUBMISSION_STATE[submission.status] : null;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(null);
  const input = useRef(null);

  const openDialog = () => {
    setPicked([]);
    setNote(submission?.status === "returned" ? "" : submission?.note || "");
    setProgress(null);
    setOpen(true);
  };

  const add = async (list) => {
    const chosen = [];
    for (const raw of Array.from(list || [])) {
      if (!ACCEPT.split(",").includes(raw.type)) {
        toast.error(`«${raw.name}»: يُقبل الصور وملفات PDF فقط`);
        continue;
      }
      const file = await shrink(raw);
      if (file.size > MAX_BYTES) {
        toast.error(`«${raw.name}» أكبر من 10 ميجابايت`);
        continue;
      }
      chosen.push({ file, preview: file.type.startsWith("image/") && !/hei[cf]/.test(file.type) ? URL.createObjectURL(file) : null });
    }
    setPicked((prev) => {
      const next = [...prev, ...chosen];
      if (next.length > MAX_FILES) toast.info(`الحد الأقصى ${MAX_FILES} ملفات`);
      return next.slice(0, MAX_FILES);
    });
    if (input.current) input.current.value = "";
  };

  const send = async () => {
    if (!picked.length) return toast.error("أضف صورة الحل أو ملف PDF");
    setProgress(0);
    const res = await submitLessonHomework(item._id, picked.map((p) => p.file), note.trim(), setProgress);
    setProgress(null);
    if (!res?.status) return toast.error(res?.message || "تعذر تسليم الواجب");
    toast.success(res.message || "تم تسليم الواجب");
    setOpen(false);
    onChange?.(item._id, res.data);
  };

  const withdraw = async () => {
    if (!window.confirm("سحب التسليم؟ ستُحذف الصور المرفوعة.")) return;
    const res = await withdrawLessonHomework(item._id);
    if (!res?.status) return toast.error(res?.message || "تعذر سحب التسليم");
    toast.success(res.message || "تم سحب التسليم");
    onChange?.(item._id, null);
  };

  return (
    <Box sx={{ mt: 1.25, pt: 1.25, borderTop: "1px dashed rgba(18,47,77,.12)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        {state ? (
          <Chip
            size="small"
            icon={<state.Icon sx={{ fontSize: 16, color: `${state.color} !important` }} />}
            label={`${state.label}${submission.late ? " · متأخر" : ""}`}
            sx={{ fontWeight: 800, color: state.color, backgroundColor: state.background }}
          />
        ) : (
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#87939e" }}>
            حُلّ الواجب في دفترك، ثم صوّره وسلّمه هنا.
          </Typography>
        )}
        <Stack direction="row" gap={0.75}>
          {submission?.status === "submitted" && (
            <Button size="small" color="inherit" onClick={withdraw} sx={{ fontWeight: 800, color: "#87939e" }}>
              سحب التسليم
            </Button>
          )}
          {submission?.status !== "accepted" && (
            <Button
              size="small"
              variant={submission ? "outlined" : "contained"}
              startIcon={<UploadFileRounded />}
              onClick={openDialog}
              sx={{ borderRadius: "10px", fontWeight: 900 }}
            >
              {!submission ? "سلّم الواجب" : submission.status === "returned" ? "أعد التسليم" : "تعديل التسليم"}
            </Button>
          )}
        </Stack>
      </Stack>

      {submission?.feedback && (
        <Alert
          severity={submission.status === "returned" ? "warning" : "success"}
          sx={{ mt: 1, borderRadius: "12px", fontSize: 12.5 }}
        >
          <b>ملاحظة المعلم:</b> {submission.feedback}
        </Alert>
      )}

      {submission?.files?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <SubmissionFiles files={submission.files} />
        </Box>
      )}

      <Dialog open={open} onClose={() => progress === null && setOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle sx={{ fontWeight: 900 }}>
          تسليم: {item.title}
        </DialogTitle>
        <DialogContent>
          {submission && (
            <Alert severity="info" sx={{ mb: 1.5, borderRadius: "12px", fontSize: 12.5 }}>
              الملفات الجديدة تحل محل ما سلّمته سابقًا.
            </Alert>
          )}
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => add(e.target.files)}
          />
          <Box
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              add(e.dataTransfer.files);
            }}
            sx={{
              p: 2.5,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "14px",
              border: "2px dashed #b7c9dc",
              backgroundColor: "#f7fafd",
              "&:hover": { backgroundColor: "#eef4fa" },
            }}
          >
            <AddPhotoAlternateRounded sx={{ fontSize: 38, color: "#4e8dcc" }} />
            <Typography sx={{ fontWeight: 900, color: "#122f4d" }}>أضف صور صفحات الحل</Typography>
            <Typography sx={{ fontSize: 12, color: "#87939e" }}>
              صور أو PDF، حتى {MAX_FILES} ملفات، وكل ملف أقل من 10 ميجابايت
            </Typography>
          </Box>

          {picked.length > 0 && (
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
              {picked.map((p, i) => (
                <Box key={i} sx={{ position: "relative", width: 84, height: 84, borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(18,47,77,.12)", backgroundColor: "#f3f5f7", display: "grid", placeItems: "center" }}>
                  {p.preview ? (
                    <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Stack alignItems="center" sx={{ px: 0.5 }}>
                      <PictureAsPdfRounded sx={{ color: "#d76760" }} />
                      <Typography sx={{ fontSize: 9, textAlign: "center", wordBreak: "break-all" }} noWrap>{p.file.name}</Typography>
                    </Stack>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setPicked((prev) => prev.filter((_, j) => j !== i))}
                    sx={{ position: "absolute", top: 2, left: 2, p: 0.25, backgroundColor: "rgba(255,255,255,.9)", "&:hover": { backgroundColor: "#fff" } }}
                    aria-label="إزالة"
                  >
                    <CloseRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}

          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1.5 }}
            label="ملاحظة للمعلم (اختياري)"
            value={note}
            inputProps={{ maxLength: 500 }}
            onChange={(e) => setNote(e.target.value)}
          />
          {progress !== null && (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 7 }} />
              <Typography sx={{ mt: 0.5, fontSize: 12, color: "#87939e" }}>جارٍ الرفع… {progress}%</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={progress !== null} color="inherit">
            إلغاء
          </Button>
          <Button variant="contained" onClick={send} disabled={progress !== null || !picked.length} sx={{ borderRadius: "10px", fontWeight: 900 }}>
            تسليم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
