import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Typography, Button } from "@mui/material";
import { ArrowBackIosNewRounded, ArrowForwardIosRounded, CampaignRounded, EmojiEventsRounded, PlayCircleOutlineRounded, ArrowOutwardRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { announcementMediaUrl, fetchAnnouncementFeed } from "@/APIs/school/announcements";

const kindLabel = { honor_roll: "لوحة التميز", program: "إعلانات المدرسة", video: "شاهد وتعلّم" };
const isYoutube = (slide) => slide.video?.youtubeId;

export function AnnouncementCard({ slide, compact = false, variant, onVideoEnded, onVideoPlayingChange }) {
  const navigate = useNavigate();
  const mode = variant || (compact ? "teacher" : "default");
  const isTeacher = mode === "teacher";
  const isStudent = mode === "student";
  const image = announcementMediaUrl(slide.imageUrl);
  const video = slide.video;
  const Icon = slide.type === "honor_roll" ? EmojiEventsRounded : slide.type === "video" ? PlayCircleOutlineRounded : CampaignRounded;
  const goTo = () => {
    const url = slide.cta?.url;
    if (!url) return;
    if (url.startsWith("/") && !url.startsWith("//")) navigate(url);
    else if (url.startsWith("https://")) window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Box sx={{
      minHeight: isTeacher ? 218 : isStudent ? { xs: 205, md: 226 } : 220,
      height: "100%", display: "flex", alignItems: "center", position: "relative",
      overflow: "hidden", isolation: "isolate", textAlign: "right", direction: "rtl",
      px: { xs: 2.3, md: isTeacher ? 2.5 : 4 }, py: { xs: 2.5, md: isTeacher ? 2.5 : 3 },
      borderRadius: "inherit", color: "#fff",
      background: isTeacher ? "linear-gradient(140deg,rgba(51,105,148,.60),rgba(17,48,80,.42))" :
        isStudent ? "linear-gradient(115deg,#214e79 0%,#173a60 68%,#102f50 100%)" :
        "linear-gradient(125deg,#214f79,#163a5f)",
    }}>
      {/* Decorative layer uses brand geometry, not extra imagery. */}
      <Box aria-hidden="true" sx={{ position: "absolute", zIndex: -1, inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 8% 85%,rgba(247,213,146,.13),transparent 36%)" }} />
      {image && <Box component="img" src={image} alt="" sx={{ position: "absolute", zIndex: -1, left: 0, top: 0,
        width: isTeacher ? "100%" : { xs: "100%", md: "48%" }, height: "100%", objectFit: "cover",
        opacity: isTeacher ? .17 : .68, maskImage: isTeacher ? "linear-gradient(90deg,transparent,#000)" : "linear-gradient(90deg,#000 20%,transparent 100%)", pointerEvents: "none" }} />}
      {!image && !isTeacher && <Box aria-hidden="true" sx={{ position: "absolute", zIndex: -1, left: { xs: -35, md: 45 }, top: "50%",
        transform: "translateY(-50%)", width: { xs: 155, md: 205 }, height: { xs: 155, md: 205 },
        display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)",
        boxShadow: "0 0 0 20px rgba(255,255,255,.025),0 0 0 42px rgba(255,255,255,.02)", opacity: .5 }}>
        <Icon sx={{ fontSize: { xs: 73, md: 96 }, color: "#f3d58e" }} />
      </Box>}
      <Stack spacing={isTeacher ? .9 : 1.3} sx={{ position: "relative", width: "100%", maxWidth: isTeacher ? "100%" : { xs: "100%", md: "69%" }, zIndex: 1, minWidth: 0, alignItems: "flex-start" }}>
        <Stack direction="row" alignItems="center" spacing={.8} sx={{ px: 1.1, py: .55, borderRadius: "99px", color: "#f9dc97", background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.15)" }}>
          <Icon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 11.5, fontWeight: 900 }}>{kindLabel[slide.type] || "إعلان المدرسة"}</Typography>
        </Stack>
        <Typography component="h3" sx={{ fontSize: isTeacher ? { xs: 19, md: 20 } : { xs: 21, md: 28 }, fontWeight: 900,
          letterSpacing: "-.025em", lineHeight: 1.5, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: isTeacher ? 2 : 3, overflow: "hidden" }}>{slide.title}</Typography>
        {slide.body && <Typography sx={{ fontSize: isTeacher ? 12.5 : 14, lineHeight: 1.85, color: "rgba(255,255,255,.82)",
          overflowWrap: "anywhere", whiteSpace: "pre-line", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{slide.body}</Typography>}
        {slide.type === "honor_roll" && <Box sx={{ display: "grid", width: "100%", gridTemplateColumns: isTeacher ? "1fr" : { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: .8, maxHeight: isTeacher ? 92 : 130, overflowY: "auto", pr: .3 }}>
          {(slide.students || []).map((student, i) => <Box key={student.studentId || `${student.name}-${i}`} sx={{ bgcolor: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 2, px: 1.15, py: .65 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>🏅 {student.name} {student.className ? `· ${student.className}` : ""}</Typography>
            {student.note && <Typography sx={{ fontSize: 11, opacity: .8 }}>{student.note}</Typography>}
          </Box>)}
        </Box>}
        {slide.type === "video" && video && (isYoutube(slide) ?
          <Box component="iframe" title={slide.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?mute=1&playsinline=1`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={{ width: "100%", maxWidth: isTeacher ? 285 : 390, height: isTeacher ? 125 : 180, border: 0, borderRadius: 2 }} /> :
          video.source === "upload" || /\.(mp4|webm)(\?|$)/i.test(video.url || "") ?
            <Box component="video" src={announcementMediaUrl(video.url)} controls muted playsInline onPlay={() => onVideoPlayingChange?.(true)} onPause={() => onVideoPlayingChange?.(false)} onEnded={() => { onVideoPlayingChange?.(false); onVideoEnded?.(); }} sx={{ width: "100%", maxWidth: isTeacher ? 285 : 390, maxHeight: isTeacher ? 130 : 190, borderRadius: 2 }} /> :
            <Button href={video.url} target="_blank" rel="noopener noreferrer" sx={{ color: "#f9dc97", fontWeight: 800 }}>مشاهدة الفيديو</Button>)}
        {slide.type === "program" && slide.cta?.label && <Button onClick={goTo} endIcon={<ArrowOutwardRounded sx={{ transform: "scaleX(-1)" }} />} sx={{ bgcolor: "#f5d994", color: "#153759", px: 2, py: .75, borderRadius: "11px", fontWeight: 900, fontSize: 12, textTransform: "none", "&:hover": { bgcolor: "#ffe7ae" } }}>{slide.cta.label}</Button>}
      </Stack>
    </Box>
  );
}

export default function AnnouncementCarousel({ compact = false, variant, onHasAnnouncements, sx = {} }) {
  const mode = variant || (compact ? "teacher" : "default");
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const touch = useRef(null);
  useEffect(() => { let active = true; fetchAnnouncementFeed().then(data => { if (!active) return; const slides = Array.isArray(data) ? data : []; setItems(slides); onHasAnnouncements?.(slides.length > 0); }).catch(() => { if (active) onHasAnnouncements?.(false); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const next = () => { setPlaying(false); setIndex(i => (i + 1) % items.length); };
  const prev = () => { setPlaying(false); setIndex(i => (i - 1 + items.length) % items.length); };
  useEffect(() => { if (items.length < 2 || hovered || playing || items[index]?.type === "video") return; const delay = Math.max(2, Number(items[index]?.durationSeconds) || 6) * 1000; const timer = setTimeout(next, delay); return () => clearTimeout(timer); }, [items, index, hovered, playing]);
  if (loading || !items.length) return null;
  return <Box dir="rtl" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={e => { touch.current = e.touches[0]?.clientX; }} onTouchEnd={e => { if (touch.current == null) return; const delta = e.changedTouches[0]?.clientX - touch.current; if (Math.abs(delta) > 45 && items.length > 1) (delta > 0 ? next : prev)(); touch.current = null; }} sx={{ position: "relative", overflow: "hidden", borderRadius: mode === "teacher" ? "19px" : "24px", border: mode === "teacher" ? "1px solid rgba(255,255,255,.19)" : "1px solid rgba(35,78,118,.10)", boxShadow: mode === "teacher" ? "0 9px 22px rgba(3,25,46,.08)" : "0 10px 28px rgba(18,47,77,.075)", ...sx }}>
    <AnnouncementCard key={items[index].id} slide={items[index]} compact={compact} variant={mode} onVideoPlayingChange={setPlaying} onVideoEnded={next} />
    {items.length > 1 && <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ position: "relative", bgcolor: mode === "teacher" ? "rgba(26,65,101,.8)" : "#173a5f", py: .55 }}>
      <IconButton onClick={prev} aria-label="الإعلان السابق" size="small" sx={{ color: "#fff" }}><ArrowForwardIosRounded fontSize="small" /></IconButton>
      {items.map((item, i) => <Box key={item.id || i} component="button" type="button" aria-label={`الإعلان ${i + 1}`} onClick={() => { setPlaying(false); setIndex(i); }} sx={{ width: i === index ? 23 : 7, height: 7, border: 0, borderRadius: 9, bgcolor: i === index ? "#f4d993" : "#8c9bab", cursor: "pointer", transition: "width .2s" }} />)}
      <IconButton onClick={next} aria-label="الإعلان التالي" size="small" sx={{ color: "#fff" }}><ArrowBackIosNewRounded fontSize="small" /></IconButton>
    </Stack>}
  </Box>;
}
