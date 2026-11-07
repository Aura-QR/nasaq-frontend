import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Collapse, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { EditRounded, LaptopChromebookRounded, VideocamRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import { fetchMyMeetingUrl, fetchMyRemoteLessons, setLessonLink, setMyMeetingUrl } from "@/APIs/school/remoteLearning";

/*
 * «حصص اليوم عن بُعد» — للطالب والمعلم.
 *
 * يظهر فقط في يوم تعليم عن بُعد: الطالب يرى حصصه وزر «انضم للحصة»، والمعلم
 * يرى حصصه وأي حصة بلا رابط. المعلم يرى دائمًا (حتى في الأيام العادية) خانة
 * «رابط حصتي الثابت» ليجهّزه مسبقًا.
 */
const isLink = (v) => /^https:\/\/\S{8,}$/.test(v.trim());
const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());

export default function RemoteLessonsCard({ role }) {
  const isTeacher = role === "TEACHER";
  const [data, setData] = useState(null);
  const [myLink, setMyLink] = useState("");
  const [savedLink, setSavedLink] = useState("");
  const [editing, setEditing] = useState(null); // lectureId
  const [lessonUrl, setLessonUrl] = useState("");

  const load = async () => {
    const r = await fetchMyRemoteLessons(todayKey());
    setData(r?.status ? r.data : null);
  };
  useEffect(() => {
    load();
    if (isTeacher) fetchMyMeetingUrl().then((r) => { const v = r?.data?.meetingUrl || ""; setMyLink(v); setSavedLink(v); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMyLink = async () => {
    if (myLink.trim() && !isLink(myLink)) return toast.error("الرابط يجب أن يبدأ بـ https://");
    const r = await setMyMeetingUrl(myLink.trim());
    if (r?.status) { toast.success(r.message); setSavedLink(myLink.trim()); load(); } else toast.error(r?.message || "تعذر الحفظ");
  };

  const saveLessonLink = async (lectureId) => {
    if (lessonUrl.trim() && !isLink(lessonUrl)) return toast.error("الرابط يجب أن يبدأ بـ https://");
    const r = await setLessonLink(lectureId, data.date, lessonUrl.trim());
    if (r?.status) { toast.success(r.message); setEditing(null); load(); } else toast.error(r?.message || "تعذر الحفظ");
  };

  const remote = data?.remote && data.lessons?.length > 0;
  if (!isTeacher && !remote) return null;

  return (
    <Paper elevation={0} sx={{ mb: 1.5, p: { xs: 1.5, md: 2 }, borderRadius: "18px", border: remote ? "2px solid #4E8DCC" : "1px solid rgba(36,74,112,.09)", bgcolor: remote ? "#F4F9FF" : "white" }} dir="rtl">
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: remote ? 1.25 : 0.75 }}>
        <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "12px", bgcolor: "#EDF6FF", color: "#244A70" }}>
          <LaptopChromebookRounded />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: "#122F4D" }}>
            {remote ? "حصص اليوم عن بُعد" : "التعليم عن بُعد"}
          </Typography>
          {remote && data.note && <Typography sx={{ fontSize: 11, color: "#83909D" }}>{data.note}</Typography>}
        </Box>
        {remote && <Chip size="small" color="primary" label={`${data.lessons.length} حصة`} />}
      </Stack>

      {remote && (
        <Stack gap={0.75}>
          {data.lessons.map((l) => (
            <Box key={l.lectureId} sx={{ p: 1.1, borderRadius: "12px", bgcolor: "white", border: "1px solid rgba(36,74,112,.08)" }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 900 }}>الحصة {l.slot} · {l.subjectName}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#83909D" }}>{isTeacher ? l.className : l.teacherName}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {l.joinUrl ? (
                    <Button variant="contained" startIcon={<VideocamRounded />} component="a" href={l.joinUrl} target="_blank" rel="noopener noreferrer"
                      sx={{ borderRadius: "10px", fontWeight: 900 }}>
                      {isTeacher ? "ابدأ الحصة" : "انضم للحصة"}
                    </Button>
                  ) : (
                    <Chip size="small" color="warning" label={isTeacher ? "لا يوجد رابط" : "الرابط لم يُضف بعد"} />
                  )}
                  {isTeacher && (
                    <Tooltip title="رابط خاص بهذه الحصة اليوم">
                      <IconButton size="small" onClick={() => { setEditing(editing === l.lectureId ? null : l.lectureId); setLessonUrl(l.linkSource === "lesson" ? l.joinUrl : ""); }}>
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
              {isTeacher && (
                <Collapse in={editing === l.lectureId} unmountOnExit>
                  <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="رابط خاص بهذه الحصة (اتركه فارغًا لاستخدام رابطك الثابت)" value={lessonUrl}
                      onChange={(e) => setLessonUrl(e.target.value)} inputProps={{ dir: "ltr" }} />
                    <Button variant="outlined" onClick={() => saveLessonLink(l.lectureId)} sx={{ borderRadius: "10px", fontWeight: 800 }}>حفظ</Button>
                  </Stack>
                </Collapse>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {isTeacher && (
        <Box sx={{ mt: remote ? 1.5 : 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>رابط حصتي الثابت</Typography>
          <Stack direction="row" gap={1}>
            <TextField size="small" fullWidth placeholder="https://teams.microsoft.com/l/meetup-join/..." value={myLink}
              onChange={(e) => setMyLink(e.target.value)} inputProps={{ dir: "ltr" }} />
            <Button variant="outlined" onClick={saveMyLink} disabled={myLink.trim() === savedLink} sx={{ borderRadius: "10px", fontWeight: 800 }}>حفظ</Button>
          </Stack>
          {!savedLink && (
            <Alert severity="info" sx={{ mt: 1, borderRadius: "12px", fontSize: 11.5 }}>
              أنشئ اجتماعًا ثابتًا في Teams أو Zoom أو Google Meet والصق رابطه هنا مرة واحدة، فيُستخدم لكل حصصك في أيام التعليم عن بُعد.
              في Teams: اسمح بدخول الضيوف أو ألغِ «غرفة الانتظار».
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}
