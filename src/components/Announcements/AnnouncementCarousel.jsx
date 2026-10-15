import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { ArrowBackIosNewRounded, ArrowForwardIosRounded, ArrowOutwardRounded, CampaignRounded, CloseRounded, EmojiEventsRounded, PlayCircleOutlineRounded, ZoomInRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { announcementMediaUrl, fetchAnnouncementFeed } from "@/APIs/school/announcements";

const LABELS = { honor_roll: "لوحة التميز", program: "إعلانات المدرسة", video: "فيديو توعوي" };
const CARD_COLORS = {
  teacher: {
    foreground: "#fff", secondary: "#d5e5f3", honor: "#f5d994", link: "#f5d994", focus: "#f5d994",
    background: "linear-gradient(115deg,#234b6d 0%,#1b3f60 55%,#173652 100%)",
    chip: "rgba(255,255,255,.11)", chipText: "#f5d994", chipBorder: "rgba(255,255,255,.12)",
    frame: "rgba(255,255,255,.06)", frameBorder: "rgba(245,217,148,.32)",
    ring: "#1b3f60", fill: "#24507a", initial: "#f5d994", glow: "rgba(245,217,148,.12)",
  },
  student: {
    foreground: "#123859", secondary: "#6686a3", honor: "#8f6a1f", link: "#2f75ad", focus: "#377bb5",
    background: "linear-gradient(112deg,#f3f8fe 0%,#edf6ff 56%,#e6f1fc 100%)",
    chip: "#dcecff", chipText: "#3276ad", chipBorder: "#d1e5fa",
    frame: "#fff", frameBorder: "#d6e5f4",
    ring: "#fff", fill: "#fff7e6", initial: "#b0832f", glow: "rgba(245,206,120,.2)",
  },
};
const GOLD = "linear-gradient(140deg,#fbe7b0 0%,#d4a24c 45%,#f5d994 70%,#b98633 100%)";
const oneLine = { maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const clamp = lines => ({ maxWidth: "100%", overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" });

/** A student's photo in a gold ring; their first letter when there is no photo or it fails to load. */
function Portrait({ entry, size, c }) {
  const [failed, setFailed] = useState(false);
  const photo = failed ? "" : announcementMediaUrl(entry.photoUrl);
  const circle = { display: "block", width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${c.ring}`, boxSizing: "border-box" };
  return <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <Box sx={{ width: "100%", height: "100%", borderRadius: "50%", p: "3px", boxSizing: "border-box", background: GOLD, boxShadow: "0 6px 18px rgba(185,134,51,.28)" }}>
      {photo ? <Box component="img" src={photo} alt={entry.name} loading="lazy" onError={() => setFailed(true)} sx={{ ...circle, objectFit: "cover" }} /> :
        <Box aria-hidden sx={{ ...circle, display: "grid", placeItems: "center", bgcolor: c.fill, color: c.initial, fontWeight: 900, fontSize: size * .4, lineHeight: 1 }}>{String(entry.name || "").trim().charAt(0) || "؟"}</Box>}
    </Box>
    <Box aria-hidden sx={{ position: "absolute", left: "50%", bottom: -7, transform: "translateX(-50%)", width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", background: GOLD, border: `2px solid ${c.ring}`, color: "#5b3d0c" }}><EmojiEventsRounded sx={{ fontSize: 13 }} /></Box>
  </Box>;
}

function Honoree({ entry, c, size, width }) {
  return <Stack alignItems="center" sx={{ width, minWidth: 0, textAlign: "center" }}>
    <Portrait key={entry.photoUrl || ""} entry={entry} size={size} c={c} />
    <Typography sx={{ mt: 1.6, fontWeight: 900, fontSize: 13, lineHeight: 1.45, color: c.foreground, ...clamp(2) }}>{entry.name}</Typography>
    {entry.note && <Typography sx={{ mt: .2, fontSize: 11, fontWeight: 800, color: c.honor, ...oneLine }}>{entry.note}</Typography>}
    {entry.className && <Typography sx={{ fontSize: 10.5, color: c.secondary, ...oneLine }}>{entry.className}</Typography>}
  </Stack>;
}

function HonorRoll({ slide, students, c, teacher, onPauseChange }) {
  const narrow = useMediaQuery(theme => theme.breakpoints.down("sm"), { noSsr: true });
  const [open, setOpen] = useState(false);
  const max = narrow ? 3 : 4;
  const shown = students.length > max ? students.slice(0, max - 1) : students;
  const rest = students.length - shown.length;
  const size = teacher ? 60 : 68;
  const width = { xs: 92, sm: teacher ? 100 : 108 };
  const toggle = value => { setOpen(value); onPauseChange?.(value); };
  return <>
    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: { xs: 1.5, sm: 2.2 }, minWidth: 0 }}>
      {shown.map((entry, i) => <Honoree key={entry.studentId || `${entry.name}-${i}`} entry={entry} c={c} size={size} width={width} />)}
      {rest > 0 && <Stack component="button" type="button" onClick={() => toggle(true)} alignItems="center" sx={{ width, p: 0, border: 0, bgcolor: "transparent", color: "inherit", font: "inherit", cursor: "pointer", borderRadius: 2, "&:focus-visible": { outline: `2px solid ${c.focus}`, outlineOffset: 4 } }}>
        <Box dir="ltr" sx={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", boxSizing: "border-box", border: `2px dashed ${c.frameBorder}`, bgcolor: c.frame, color: c.foreground, fontWeight: 900, fontSize: 18 }}>+{rest}</Box>
        <Typography sx={{ mt: 1.6, fontWeight: 800, fontSize: 12, color: c.link }}>عرض الكل</Typography>
      </Stack>}
    </Box>
    <Dialog open={open} onClose={() => toggle(false)} maxWidth="md" fullWidth dir="rtl" PaperProps={{ sx: { borderRadius: "20px" } }}>
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 3, py: 2.2, background: CARD_COLORS.teacher.background, color: "#fff" }}>
        <EmojiEventsRounded sx={{ color: "#f5d994" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 900, fontSize: 18 }}>{slide.title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#d5e5f3" }}>عدد الطلاب: {students.length}</Typography>
        </Box>
        <IconButton onClick={() => toggle(false)} aria-label="إغلاق" sx={{ color: "#fff" }}><CloseRounded /></IconButton>
      </Stack>
      <Box sx={{ p: { xs: 2, sm: 3 }, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(118px,1fr))", columnGap: 2, rowGap: 3.5, bgcolor: "#f7fafd" }}>
        {students.map((entry, i) => <Honoree key={entry.studentId || `${entry.name}-${i}`} entry={entry} c={CARD_COLORS.student} size={80} />)}
      </Box>
    </Dialog>
  </>;
}

/** The whole picture, never cropped: contained over a blurred copy of itself so the frame has no empty bars. */
function ImageFrame({ src, title, c, width, onOpen }) {
  return <Box component="button" type="button" onClick={onOpen} aria-label="عرض الإعلان كاملًا" sx={{
    position: "relative", display: "block", width, aspectRatio: "16 / 9", p: 0, overflow: "hidden",
    borderRadius: "16px", border: `1px solid ${c.frameBorder}`, bgcolor: c.frame, cursor: "zoom-in", font: "inherit",
    "&:hover .zoom-hint, &:focus-visible .zoom-hint": { opacity: 1 }, "&:focus-visible": { outline: `3px solid ${c.focus}`, outlineOffset: 2 } }}>
    <Box component="img" src={src} alt="" aria-hidden sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(22px) saturate(1.15)", transform: "scale(1.25)" }} />
    <Box component="img" src={src} alt={title} sx={{ position: "relative", display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
    <Stack className="zoom-hint" direction="row" alignItems="center" spacing={.5} sx={{ position: "absolute", bottom: 10, left: 10, px: 1, py: .4, borderRadius: 99, bgcolor: "rgba(9,25,41,.62)", color: "#fff", opacity: { xs: 1, md: .8 }, transition: "opacity .2s" }}>
      <ZoomInRounded sx={{ fontSize: 16 }} /><Typography sx={{ fontSize: 11, fontWeight: 800 }}>تكبير</Typography>
    </Stack>
  </Box>;
}

function VideoFrame({ slide, video, c, width, onPauseChange, onVideoEnded }) {
  const frame = { display: "block", width, aspectRatio: "16 / 9", boxSizing: "border-box", border: `1px solid ${c.frameBorder}`, borderRadius: "16px", bgcolor: "#0b1b2b", overflow: "hidden" };
  if (video.youtubeId) return <Box component="iframe" title={slide.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?mute=1&playsinline=1`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={frame} />;
  if (/\.(mp4|webm)(\?|$)/i.test(video.url || "")) return <Box component="video" src={announcementMediaUrl(video.url)} controls muted playsInline onPlay={() => onPauseChange?.(true)} onPause={() => onPauseChange?.(false)} onEnded={() => { onPauseChange?.(false); onVideoEnded?.(); }} sx={{ ...frame, objectFit: "contain" }} />;
  return <Box component="a" href={video.url} target="_blank" rel="noopener noreferrer" sx={{ ...frame, display: "grid", placeItems: "center", alignContent: "center", gap: 1, color: "#fff", textDecoration: "none" }}>
    <PlayCircleOutlineRounded sx={{ fontSize: 46, color: "#f5d994" }} />
    <Typography sx={{ fontWeight: 800, fontSize: 13 }}>مشاهدة الفيديو</Typography>
  </Box>;
}

function Lightbox({ open, onClose, src, slide, action }) {
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl" PaperProps={{ sx: { borderRadius: "18px" } }}>
    <Box sx={{ position: "relative", bgcolor: "#0f2235" }}>
      <Box component="img" src={src} alt={slide.title} sx={{ display: "block", width: "100%", maxHeight: "70vh", objectFit: "contain" }} />
      <IconButton onClick={onClose} aria-label="إغلاق" sx={{ position: "absolute", top: 10, left: 10, color: "#fff", bgcolor: "rgba(9,25,41,.55)", "&:hover": { bgcolor: "rgba(9,25,41,.78)" } }}><CloseRounded /></IconButton>
    </Box>
    <Box sx={{ px: { xs: 2.2, sm: 3 }, py: 2.4 }}>
      <Typography component="h2" sx={{ fontWeight: 900, fontSize: 20, color: "#123859", lineHeight: 1.5 }}>{slide.title}</Typography>
      {slide.body && <Typography sx={{ mt: 1, color: "#4f6f8c", lineHeight: 1.9, whiteSpace: "pre-line" }}>{slide.body}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  </Dialog>;
}

export function AnnouncementCard({ slide, compact = false, variant, onVideoEnded, onPauseChange }) {
  const navigate = useNavigate();
  const [zoomed, setZoomed] = useState(false);
  const mode = variant || (compact ? "teacher" : "student");
  const teacher = mode === "teacher";
  const c = CARD_COLORS[teacher ? "teacher" : "student"];
  const image = slide.type === "program" ? announcementMediaUrl(slide.imageUrl) : "";
  const video = slide.type === "video" ? slide.video : null;
  const students = slide.type === "honor_roll" ? slide.students || [] : [];
  const Icon = slide.type === "honor_roll" ? EmojiEventsRounded : slide.type === "video" ? PlayCircleOutlineRounded : CampaignRounded;
  const aside = image || video ? "media" : students.length ? "honor" : "seal";
  // A 16:9 frame, the shape of a designed banner or a YouTube clip; the text takes the rest of the row.
  const mediaWidth = { xs: "100%", md: teacher ? 288 : 340, lg: teacher ? 320 : 380 };
  const zoom = open => { setZoomed(open); onPauseChange?.(open); };
  const openCTA = () => {
    const url = slide.cta?.url;
    if (!url) return;
    if (url.startsWith("/") && !url.startsWith("//")) navigate(url);
    else if (url.startsWith("https://")) window.open(url, "_blank", "noopener,noreferrer");
  };
  const ctaButton = onDark => slide.type === "program" && slide.cta?.label ? <Button onClick={openCTA} endIcon={<ArrowOutwardRounded sx={{ transform: "scaleX(-1)" }} />} sx={{
    bgcolor: onDark ? "#f5d994" : "#327db6", color: onDark ? "#153759" : "#fff", borderRadius: "11px", px: 2, py: .7,
    fontSize: 12, fontWeight: 900, textTransform: "none", "&:hover": { bgcolor: onDark ? "#ffe8ae" : "#256b9e" } }}>{slide.cta.label}</Button> : null;

  return (
    <Box sx={{
      position: "relative", isolation: "isolate", overflow: "hidden", boxSizing: "border-box",
      display: "flex", flexDirection: "column", justifyContent: "center", direction: "rtl", textAlign: "right",
      minHeight: teacher ? { xs: 190, md: 174 } : { xs: 230, md: 236 },
      px: teacher ? { xs: 2.2, md: 3.2 } : { xs: 2.4, md: 3.4 },
      pt: teacher ? { xs: 5.8, md: 5 } : 2.4, pb: teacher ? 2.2 : 5.8,
      color: c.foreground, background: c.background,
    }}>
      {!teacher && <Box aria-hidden sx={{ position: "absolute", pointerEvents: "none", left: -60, bottom: -135, width: 280, height: 280, borderRadius: "50%", background: "rgba(194,222,249,.19)", zIndex: -1 }} />}
      {aside === "honor" && <Box aria-hidden sx={{ position: "absolute", pointerEvents: "none", inset: 0, zIndex: -1, background: { xs: `radial-gradient(ellipse at 50% 85%,${c.glow},transparent 65%)`, md: `radial-gradient(ellipse at 30% 50%,${c.glow},transparent 60%)` } }} />}
      <Box sx={{ display: "grid", alignItems: "center", gap: { xs: 2.2, md: 3.5 }, gridTemplateColumns: { xs: "minmax(0,1fr)", md: { media: "minmax(0,1fr) auto", honor: "minmax(0,4fr) minmax(0,7fr)", seal: "minmax(0,1fr) auto" }[aside] } }}>
        <Box sx={{ minWidth: 0, order: { xs: aside === "media" ? 2 : 1, md: 1 } }}>
          <Stack direction="row" alignItems="center" spacing={.8} sx={{ width: "fit-content", px: 1.1, py: .6, mb: 1.1, borderRadius: "99px", background: c.chip, color: c.chipText, border: `1px solid ${c.chipBorder}` }}>
            <Icon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 850 }}>{LABELS[slide.type] || "إعلانات المدرسة"}</Typography>
          </Stack>
          <Typography component="h3" sx={{ fontSize: teacher ? { xs: 19, md: 22 } : { xs: 21, md: 25 }, fontWeight: 900, lineHeight: 1.42, ...clamp(2) }}>{slide.title}</Typography>
          {slide.body && <Typography sx={{ mt: .5, fontSize: teacher ? 12.5 : 13.5, lineHeight: 1.75, color: c.secondary, ...clamp(teacher ? 2 : 3) }}>{slide.body}</Typography>}
          {ctaButton(teacher) && <Box sx={{ mt: 1.6 }}>{ctaButton(teacher)}</Box>}
        </Box>
        {aside === "media" && <Box sx={{ minWidth: 0, order: { xs: 1, md: 2 } }}>
          {image ? <ImageFrame src={image} title={slide.title} c={c} width={mediaWidth} onOpen={() => zoom(true)} /> :
            <VideoFrame slide={slide} video={video} c={c} width={mediaWidth} onPauseChange={onPauseChange} onVideoEnded={onVideoEnded} />}
        </Box>}
        {aside === "honor" && <Box sx={{ order: 2, minWidth: 0 }}><HonorRoll slide={slide} students={students} c={c} teacher={teacher} onPauseChange={onPauseChange} /></Box>}
        {aside === "seal" && <Box aria-hidden sx={{ order: 2, display: { xs: "none", md: "grid" }, placeItems: "center", width: teacher ? 92 : 104, height: teacher ? 92 : 104, borderRadius: "50%", bgcolor: c.frame, border: `1px solid ${c.frameBorder}`, color: teacher ? c.honor : c.chipText }}><Icon sx={{ fontSize: teacher ? 40 : 46 }} /></Box>}
      </Box>
      {image && <Lightbox open={zoomed} onClose={() => zoom(false)} src={image} slide={slide} action={ctaButton(false)} />}
    </Box>
  );
}

export default function AnnouncementCarousel({ compact = false, variant, onHasAnnouncements, sx = {} }) {
  const mode = variant || (compact ? "teacher" : "student");
  const teacher = mode === "teacher";
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  // A playing video or an open image/list holds the slide in place.
  const [paused, setPaused] = useState(false);
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
  const next = useCallback(() => { setPaused(false); setIndex(i => (i + 1) % items.length); }, [items.length]);
  const prev = () => { setPaused(false); setIndex(i => (i - 1 + items.length) % items.length); };
  useEffect(() => {
    if (items.length < 2 || hovered || paused || items[index]?.type === "video") return;
    const delay = Math.max(2, Number(items[index]?.durationSeconds) || 6) * 1000;
    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [items, index, hovered, paused, next]);
  if (loading || !items.length) return null;
  return <Box dir="rtl" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onTouchStart={e => { touch.current = e.touches[0]?.clientX; }}
    onTouchEnd={e => { if (touch.current == null) return; const delta = e.changedTouches[0]?.clientX - touch.current; if (Math.abs(delta) > 45 && items.length > 1) (delta > 0 ? next : prev)(); touch.current = null; }}
    sx={{ position: "relative", overflow: "hidden", borderRadius: teacher ? "20px" : "23px", border: teacher ? "1px solid rgba(245,217,148,.85)" : "1px solid #dce9f6", boxShadow: teacher ? "0 0 0 3px rgba(245,217,148,.07), inset 0 0 28px rgba(245,217,148,.035), 0 10px 25px rgba(7,22,39,.12)" : "0 9px 22px rgba(29,76,120,.065)", ...sx }}>
    <AnnouncementCard key={items[index].id} slide={items[index]} compact={compact} variant={mode} onPauseChange={setPaused} onVideoEnded={next} />
    {items.length > 1 && <Stack direction="row" alignItems="center" justifyContent="center" spacing={.75} sx={{ position: "absolute", ...(teacher ? { top: 10, left: 18, right: "auto", bottom: "auto" } : { bottom: 4, left: 0, right: 0 }), zIndex: 2, direction: "rtl", bgcolor: teacher ? "rgba(11,35,57,.28)" : "transparent", borderRadius: 8, px: teacher ? .6 : 0 }}>
      <IconButton onClick={prev} aria-label="الإعلان السابق" size="small" sx={{ color: teacher ? "#fff" : "#397bb2", p: .5 }}><ArrowForwardIosRounded sx={{ fontSize: 16 }} /></IconButton>
      {items.map((item, i) => <Box key={item.id || i} component="button" type="button" aria-label={`الإعلان ${i + 1}`} onClick={() => { setPaused(false); setIndex(i); }} sx={{ width: i === index ? 22 : 7, height: 7, border: 0, borderRadius: 9, bgcolor: i === index ? (teacher ? "#f5d994" : "#397bb2") : (teacher ? "#91a8bd" : "#aac8e2"), cursor: "pointer", transition: "width .2s" }} />)}
      <IconButton onClick={next} aria-label="الإعلان التالي" size="small" sx={{ color: teacher ? "#fff" : "#397bb2", p: .5 }}><ArrowBackIosNewRounded sx={{ fontSize: 16 }} /></IconButton>
    </Stack>}
  </Box>;
}
