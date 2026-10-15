import { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Typography, Button } from "@mui/material";
import { ArrowBackIosNewRounded, ArrowForwardIosRounded, CampaignRounded, EmojiEventsRounded, PlayCircleOutlineRounded, ArrowOutwardRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { announcementMediaUrl, fetchAnnouncementFeed } from "@/APIs/school/announcements";

const LABELS = { honor_roll: "لوحة التميز", program: "إعلانات المدرسة", video: "فيديو توعوي" };
const CARD_COLORS = {
  teacher: { foreground: "#fff", secondary: "#d5e5f3", muted: "rgba(255,255,255,.15)", accent: "#f5d994" },
  student: { foreground: "#123859", secondary: "#6686a3", muted: "#fff", accent: "#377bb5" },
};

export function AnnouncementCard({ slide, compact = false, variant, onVideoEnded, onVideoPlayingChange }) {
  const navigate = useNavigate();
  const mode = variant || (compact ? "teacher" : "student");
  const teacher = mode === "teacher";
  const studentMode = mode === "student";
  const c = CARD_COLORS[teacher ? "teacher" : "student"];
  const image = announcementMediaUrl(slide.imageUrl);
  const video = slide.video;
  const Icon = slide.type === "honor_roll" ? EmojiEventsRounded : slide.type === "video" ? PlayCircleOutlineRounded : CampaignRounded;
  const students = slide.students || [];
  const shownStudents = students.slice(0, teacher ? 2 : 4);
  const rest = Math.max(0, students.length - shownStudents.length);
  const openCTA = () => {
    const url = slide.cta?.url;
    if (!url) return;
    if (url.startsWith("/") && !url.startsWith("//")) navigate(url);
    else if (url.startsWith("https://")) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Box sx={{
      position: "relative", isolation: "isolate", overflow: "hidden", boxSizing: "border-box",
      display: "flex", flexDirection: "column", justifyContent: "flex-start", direction: "rtl", textAlign: "right",
      minHeight: teacher ? { xs: 190, md: 174 } : { xs: 230, md: 236 },
      px: teacher ? { xs: 2.2, md: 3.2 } : { xs: 2.4, md: 3.4 },
      pt: teacher ? { xs: 5.8, md: 5 } : 2.4, pb: teacher ? 2.2 : 5.8,
      color: c.foreground,
      background: teacher ? "linear-gradient(115deg,#234b6d 0%,#1b3f60 55%,#173652 100%)" :
        "linear-gradient(112deg,#f3f8fe 0%,#edf6ff 56%,#e6f1fc 100%)",
    }}>
      {studentMode && <Box aria-hidden sx={{ position: "absolute", pointerEvents: "none", left: -60, bottom: -135, width: 280, height: 280, borderRadius: "50%", background: "rgba(194,222,249,.19)", zIndex: -1 }} />}
      {image && <Box component="img" src={image} alt="" sx={{ pointerEvents: "none", zIndex: -1, position: "absolute", left: 0, top: 0,
        width: teacher ? "100%" : { xs: "45%", md: "36%" }, height: "100%", objectFit: "cover", opacity: teacher ? .12 : .16,
        maskImage: "linear-gradient(to right,#000,transparent)" }} />}
      <Stack spacing={teacher ? 0 : 1.1} direction="column" alignItems="flex-start" justifyContent="center" sx={{ width: "100%", minWidth: 0, position: "relative", gap: teacher ? 2 : 0, ...(teacher ? { display: { xs: "flex", md: "grid" }, gridTemplateColumns: "minmax(0, 5fr) minmax(0, 6fr)", alignItems: "center", columnGap: 3 } : {}) }}>
        <Box sx={{ width: "100%", minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={.8} sx={{ width: "fit-content", px: 1.1, py: .6, mb: 1.1, borderRadius: "99px",
          background: teacher ? "rgba(255,255,255,.11)" : "#dcecff", color: teacher ? c.accent : "#3276ad",
          border: teacher ? "1px solid rgba(255,255,255,.12)" : "1px solid #d1e5fa" }}>
          <Icon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 11, fontWeight: 850 }}>{LABELS[slide.type] || "إعلانات المدرسة"}</Typography>
        </Stack>
        <Typography component="h3" sx={{ fontSize: teacher ? { xs: 19, md: 23 } : { xs: 21, md: 26 }, fontWeight: 900,
          lineHeight: 1.42, maxWidth: "100%", overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{slide.title}</Typography>
        {slide.body && <Typography sx={{ fontSize: teacher ? 12 : 13.5, lineHeight: 1.7, color: c.secondary,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: teacher ? 1 : 2, overflow: "hidden" }}>{slide.body}</Typography>}
        </Box>
        {slide.type === "honor_roll" && <Box sx={{ display: "grid", width: "100%", gridTemplateColumns: teacher ? { xs: "repeat(2,minmax(0,1fr))", md: "1fr" } : { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1, minWidth: 0, ...(teacher ? { maxWidth: "100%" } : {}) }}> 
          {shownStudents.map((entry, i) => <Stack direction="row" alignItems="center" spacing={1} key={entry.studentId || `${entry.name}-${i}`} sx={{
            minWidth: 0, px: 1.3, py: teacher ? .8 : 1.1, borderRadius: "12px", border: teacher ? "1px solid rgba(255,255,255,.14)" : "1px solid #e2ecf7",
            background: teacher ? "rgba(255,255,255,.10)" : "#fff", boxShadow: studentMode ? "0 4px 14px rgba(38,86,128,.035)" : "none" }}>
            <Box sx={{ borderRadius: "50%", bgcolor: teacher ? "rgba(245,217,148,.15)" : "#fff4dd", p: .65, display: "grid", placeItems: "center", flexShrink: 0 }}><EmojiEventsRounded sx={{ color: teacher ? c.accent : "#c5953e", fontSize: 17 }} /></Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 850, fontSize: teacher ? 13 : 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</Typography>
              <Typography sx={{ color: c.secondary, fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[entry.className, entry.note].filter(Boolean).join(" · ")}</Typography>
            </Box>
          </Stack>)}
          {rest > 0 && <Typography sx={{ alignSelf: "center", color: c.secondary, fontSize: 11.5, px: 1, py: .6 }}>+ {rest} من الطلاب المتميزين</Typography>}
        </Box>}
        {teacher && slide.type === "program" && !slide.cta?.label && <Box sx={{ display: { xs: "none", md: "flex" }, minHeight: 90, alignItems: "center", justifyContent: "center", gap: 2, border: "1px solid rgba(245,217,148,.18)", borderRadius: 3, bgcolor: "rgba(255,255,255,.045)" }}><CampaignRounded sx={{ fontSize: 34, color: "#f5d994" }} /><Typography sx={{ color: "#d5e5f3", fontWeight: 700, fontSize: 13 }}>إعلان من المدرسة</Typography></Box>}
        {slide.type === "video" && video && (video.youtubeId ?
          <Box component="iframe" title={slide.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?mute=1&playsinline=1`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={{ width: "100%", maxWidth: teacher ? 260 : 360, height: teacher ? 135 : 165, border: 0, borderRadius: 2 }} /> :
          /\.(mp4|webm)(\?|$)/i.test(video.url || "") ?
            <Box component="video" src={announcementMediaUrl(video.url)} controls muted playsInline onPlay={() => onVideoPlayingChange?.(true)} onPause={() => onVideoPlayingChange?.(false)} onEnded={() => { onVideoPlayingChange?.(false); onVideoEnded?.(); }} sx={{ width: "100%", maxWidth: teacher ? 260 : 360, maxHeight: 165, borderRadius: 2 }} /> :
            <Button href={video.url} target="_blank" rel="noopener noreferrer">مشاهدة الفيديو</Button>)}
        {slide.type === "program" && slide.cta?.label && <Button onClick={openCTA} endIcon={<ArrowOutwardRounded sx={{ transform: "scaleX(-1)" }} />} sx={{
          bgcolor: teacher ? "#f5d994" : "#327db6", color: teacher ? "#153759" : "#fff", borderRadius: "11px", px: 2, py: .7,
          fontSize: 12, fontWeight: 900, textTransform: "none", "&:hover": { bgcolor: teacher ? "#ffe8ae" : "#256b9e" } }}>{slide.cta.label}</Button>}
      </Stack>
    </Box>
  );
}

export default function AnnouncementCarousel({ compact = false, variant, onHasAnnouncements, sx = {} }) {
  const mode = variant || (compact ? "teacher" : "student");
  const teacher = mode === "teacher";
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const touch = useRef(null);
  useEffect(() => {
    let active = true;
    fetchAnnouncementFeed().then(data => {
      if (!active) return;
      const slides = Array.isArray(data) ? data : [];
      setItems(slides);
      onHasAnnouncements?.(slides.length > 0);
    }).catch(() => { if (active) onHasAnnouncements?.(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const next = useCallback(() => { setPlaying(false); setIndex(i => (i + 1) % items.length); }, [items.length]);
  const prev = () => { setPlaying(false); setIndex(i => (i - 1 + items.length) % items.length); };
  useEffect(() => {
    if (items.length < 2 || hovered || playing || items[index]?.type === "video") return;
    const delay = Math.max(2, Number(items[index]?.durationSeconds) || 6) * 1000;
    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [items, index, hovered, playing, next]);
  if (loading || !items.length) return null;
  return <Box dir="rtl" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onTouchStart={e => { touch.current = e.touches[0]?.clientX; }}
    onTouchEnd={e => { if (touch.current == null) return; const delta = e.changedTouches[0]?.clientX - touch.current; if (Math.abs(delta) > 45 && items.length > 1) (delta > 0 ? next : prev)(); touch.current = null; }}
    sx={{ position: "relative", overflow: "hidden", borderRadius: teacher ? "20px" : "23px", border: teacher ? "1px solid rgba(245,217,148,.85)" : "1px solid #dce9f6", boxShadow: teacher ? "0 0 0 3px rgba(245,217,148,.07), inset 0 0 28px rgba(245,217,148,.035), 0 10px 25px rgba(7,22,39,.12)" : "0 9px 22px rgba(29,76,120,.065)", ...sx }}>
    <AnnouncementCard key={items[index].id} slide={items[index]} compact={compact} variant={mode} onVideoPlayingChange={setPlaying} onVideoEnded={next} />
    {items.length > 1 && <Stack direction="row" alignItems="center" justifyContent="center" spacing={.75} sx={{ position: "absolute", ...(teacher ? { top: 10, left: 18, right: "auto", bottom: "auto" } : { bottom: 4, left: 0, right: 0 }), zIndex: 2, direction: "rtl", bgcolor: teacher ? "rgba(11,35,57,.28)" : "transparent", borderRadius: 8, px: teacher ? .6 : 0 }}>
      <IconButton onClick={prev} aria-label="الإعلان السابق" size="small" sx={{ color: teacher ? "#fff" : "#397bb2", p: .5 }}><ArrowForwardIosRounded sx={{ fontSize: 16 }} /></IconButton>
      {items.map((item, i) => <Box key={item.id || i} component="button" type="button" aria-label={`الإعلان ${i + 1}`} onClick={() => { setPlaying(false); setIndex(i); }} sx={{ width: i === index ? 22 : 7, height: 7, border: 0, borderRadius: 9, bgcolor: i === index ? (teacher ? "#f5d994" : "#397bb2") : (teacher ? "#91a8bd" : "#aac8e2"), cursor: "pointer", transition: "width .2s" }} />)}
      <IconButton onClick={next} aria-label="الإعلان التالي" size="small" sx={{ color: teacher ? "#fff" : "#397bb2", p: .5 }}><ArrowBackIosNewRounded sx={{ fontSize: 16 }} /></IconButton>
    </Stack>}
  </Box>;
}
