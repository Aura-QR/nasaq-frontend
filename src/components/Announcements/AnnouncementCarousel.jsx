import { useEffect, useRef, useState } from "react";
import { Box, Chip, IconButton, Stack, Typography, Button, CircularProgress } from "@mui/material";
import { ArrowBackIosNewRounded, ArrowForwardIosRounded, CampaignRounded, EmojiEventsRounded, PlayCircleOutlineRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { announcementMediaUrl, fetchAnnouncementFeed } from "@/APIs/school/announcements";

const kindLabel = { honor_roll: "لوحة التميز", program: "إعلانات المدرسة", video: "شاهد وتعلّم" };
const isYoutube = (slide) => slide.video?.youtubeId;

export function AnnouncementCard({ slide, compact = false, onVideoEnded, onVideoPlayingChange }) {
  const navigate = useNavigate();
  const image = announcementMediaUrl(slide.imageUrl);
  const video = slide.video;
  const goTo = () => {
    const url = slide.cta?.url;
    if (!url) return;
    if (url.startsWith("/") && !url.startsWith("//")) navigate(url);
    else if (url.startsWith("https://")) window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Box sx={{ minHeight: compact ? 205 : 220, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden", p: { xs: 2.2, sm: compact ? 2.5 : 3 }, borderRadius: "inherit", background: slide.type === "honor_roll" ? "linear-gradient(125deg,#173d64,#285b84)" : "linear-gradient(125deg,#1b4168,#284f76)", color: "#fff" }}>
      {image && <Box component="img" src={image} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: slide.type === "program" ? 0.28 : 0.12, pointerEvents: "none" }} />}
      <Stack spacing={1.1} sx={{ position: "relative", zIndex: 1, minWidth: 0 }}>
        <Chip icon={slide.type === "honor_roll" ? <EmojiEventsRounded /> : slide.type === "video" ? <PlayCircleOutlineRounded /> : <CampaignRounded />} label={kindLabel[slide.type] || "إعلان"} size="small" sx={{ alignSelf: "flex-start", bgcolor: "#f4d993", color: "#193957", fontWeight: 800, "& .MuiChip-icon": { color: "inherit" } }} />
        <Typography component="h3" sx={{ fontSize: { xs: "17px", md: compact ? "19px" : "25px" }, fontWeight: 900, lineHeight: 1.45, overflowWrap: "anywhere" }}>{slide.title}</Typography>
        {slide.body && <Typography sx={{ fontSize: "13px", lineHeight: 1.7, color: "#e6ecf4", overflowWrap: "anywhere", whiteSpace: "pre-line" }}>{slide.body}</Typography>}
        {slide.type === "honor_roll" && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: compact ? "1fr" : "repeat(2,minmax(0,1fr))" }, gap: 0.6, maxHeight: compact ? 130 : 210, overflowY: "auto" }}>{(slide.students || []).map((student, i) => <Box key={student.studentId || `${student.name}-${i}`} sx={{ bgcolor: "rgba(255,255,255,.12)", borderRadius: 2, px: 1.25, py: 0.65 }}><Typography sx={{ fontSize: 12, fontWeight: 800 }}>🏅 {student.name} {student.className ? `· ${student.className}` : ""}</Typography>{student.note && <Typography sx={{ fontSize: 11, opacity: 0.85 }}>{student.note}</Typography>}</Box>)}</Box>}
        {slide.type === "video" && video && (isYoutube(slide) ? <Box component="iframe" title={slide.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?mute=1&playsinline=1`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={{ width: "100%", height: compact ? 130 : 240, border: 0, borderRadius: 2 }} /> : video.source === "upload" || /\.(mp4|webm)(\?|$)/i.test(video.url || "") ? <Box component="video" src={announcementMediaUrl(video.url)} controls muted playsInline onPlay={() => onVideoPlayingChange?.(true)} onPause={() => onVideoPlayingChange?.(false)} onEnded={() => { onVideoPlayingChange?.(false); onVideoEnded?.(); }} sx={{ width: "100%", maxHeight: compact ? 140 : 250, borderRadius: 2 }} /> : <Button href={video.url} target="_blank" rel="noopener noreferrer" variant="contained" sx={{ alignSelf: "flex-start" }}>مشاهدة الفيديو</Button>)}
        {slide.type === "program" && slide.cta?.label && <Button onClick={goTo} sx={{ alignSelf: "flex-start", bgcolor: "#f4d993", color: "#193957", fontWeight: 900, borderRadius: 2, "&:hover": { bgcolor: "#ffe8ae" } }}>{slide.cta.label}</Button>}
      </Stack>
    </Box>
  );
}

export default function AnnouncementCarousel({ compact = false, onHasAnnouncements, sx = {} }) {
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
  return <Box dir="rtl" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={e => { touch.current = e.touches[0]?.clientX; }} onTouchEnd={e => { if (touch.current == null) return; const delta = e.changedTouches[0]?.clientX - touch.current; if (Math.abs(delta) > 45 && items.length > 1) (delta > 0 ? next : prev)(); touch.current = null; }} sx={{ position: "relative", overflow: "hidden", borderRadius: compact ? "18px" : "24px", border: "1px solid rgba(211,164,79,.28)", boxShadow: "0 12px 30px rgba(18,47,77,.09)", ...sx }}>
    <AnnouncementCard key={items[index].id} slide={items[index]} compact={compact} onVideoPlayingChange={setPlaying} onVideoEnded={next} />
    {items.length > 1 && <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ position: "relative", bgcolor: "#183b5e", py: 0.7 }}>
      <IconButton onClick={prev} aria-label="الإعلان السابق" size="small" sx={{ color: "#fff" }}><ArrowForwardIosRounded fontSize="small" /></IconButton>
      {items.map((item, i) => <Box key={item.id || i} component="button" type="button" aria-label={`الإعلان ${i + 1}`} onClick={() => { setPlaying(false); setIndex(i); }} sx={{ width: i === index ? 23 : 7, height: 7, border: 0, borderRadius: 9, bgcolor: i === index ? "#f4d993" : "#8c9bab", cursor: "pointer", transition: "width .2s" }} />)}
      <IconButton onClick={next} aria-label="الإعلان التالي" size="small" sx={{ color: "#fff" }}><ArrowBackIosNewRounded fontSize="small" /></IconButton>
    </Stack>}
  </Box>;
}
