import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  EventRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  MenuBookRounded,
  OpenInNewRounded,
  PersonRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { fetchStudentLessonHomework } from "@/APIs/student";

/*
 * واجبات الدروس.
 *
 * الواجب الذي يكتبه المعلم في تحضير الحصة (أو يولّده «نسق أسبوعي») كان يظهر
 * داخل صفحة الدرس فقط، وصفحة «واجباتي» تعرض الواجبات الإلكترونية وحدها،
 * فلا يجده الطالب حيث يبحث عنه. هذا القسم يعرضه هنا مع المادة وموعد التسليم.
 */

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  orange: "#e69a43",
  orangeLight: "#fff3e4",
  blue: "#4e8dcc",
  blueLight: "#edf6ff",
  red: "#d76760",
  redLight: "#fff0ef",
  gray: "#87939e",
  grayLight: "#f3f5f7",
};

/** اليوم بتوقيت المدرسة بصيغة YYYY-MM-DD. */
const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const addDays = (key, days) => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatDay = (key) => {
  if (!key) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${key}T00:00:00Z`));
  } catch {
    return key;
  }
};

const dueStatus = (dueAt, today) => {
  if (!dueAt) return { label: "بدون موعد", color: COLORS.gray, background: COLORS.grayLight };
  if (dueAt === today) return { label: "مطلوب اليوم", color: COLORS.red, background: COLORS.redLight };
  if (dueAt === addDays(today, 1)) return { label: "مطلوب غدًا", color: COLORS.orange, background: COLORS.orangeLight };
  if (dueAt > today) return { label: "قادم", color: COLORS.blue, background: COLORS.blueLight };
  return { label: "انتهى موعده", color: COLORS.gray, background: COLORS.grayLight };
};

function HomeworkCard({ item, today }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const status = dueStatus(item.dueAt, today);
  const long = (item.description || "").length > 180;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "15px",
        border: "1px solid rgba(18,47,77,.07)",
        backgroundColor: "#fff",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
          {item.subjectName && (
            <Chip
              size="small"
              icon={<MenuBookRounded sx={{ fontSize: 15 }} />}
              label={item.subjectName}
              sx={{ fontWeight: 800, color: COLORS.navy, backgroundColor: "#f2f6fa" }}
            />
          )}
          <Chip
            size="small"
            label={status.label}
            sx={{ fontWeight: 800, color: status.color, backgroundColor: status.background }}
          />
        </Stack>
        {item.dueAt && (
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: COLORS.gray }}>
            <EventRounded sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
              التسليم: {formatDay(item.dueAt)}
            </Typography>
          </Stack>
        )}
      </Stack>

      <Typography sx={{ mt: 1, fontSize: 15, fontWeight: 900, color: COLORS.deepNavy }}>
        {item.title}
      </Typography>

      {item.description && (
        <>
          <Collapse in={open || !long} collapsedSize={long ? 64 : undefined}>
            <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.9, color: "#4d5b68", whiteSpace: "pre-line" }}>
              {item.description}
            </Typography>
          </Collapse>
          {long && (
            <Button
              size="small"
              onClick={() => setOpen((v) => !v)}
              endIcon={open ? <ExpandLessRounded /> : <ExpandMoreRounded />}
              sx={{ mt: 0.25, px: 0, fontWeight: 800 }}
            >
              {open ? "عرض أقل" : "عرض المزيد"}
            </Button>
          )}
        </>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ color: COLORS.gray }}>
          {item.lessonTitle && (
            <Typography sx={{ fontSize: 12 }}>الدرس: {item.lessonTitle}</Typography>
          )}
          {item.teacherName && (
            <Stack direction="row" alignItems="center" gap={0.4}>
              <PersonRounded sx={{ fontSize: 15 }} />
              <Typography sx={{ fontSize: 12 }}>{item.teacherName}</Typography>
            </Stack>
          )}
        </Stack>
        {item.preparationId && (
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
            onClick={() => navigate(`/student-dashboard/preparations/${item.preparationId}`)}
            sx={{ borderRadius: "10px", fontWeight: 800 }}
          >
            فتح الدرس
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

export default function LessonHomeworkSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const today = todayKey();

  useEffect(() => {
    let mounted = true;
    fetchStudentLessonHomework()
      .then((res) => {
        if (!mounted) return;
        setItems(res?.status && Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // القادم أولًا بالأقرب موعدًا، ثم ما انتهى موعده بالأحدث.
  const { current, past } = useMemo(() => {
    const current = items
      .filter((h) => !h.dueAt || h.dueAt >= today)
      .sort((a, b) => String(a.dueAt || "9999").localeCompare(String(b.dueAt || "9999")));
    const past = items
      .filter((h) => h.dueAt && h.dueAt < today)
      .sort((a, b) => String(b.dueAt).localeCompare(String(a.dueAt)));
    return { current, past };
  }, [items, today]);

  if (!loading && !items.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="baseline" gap={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 900, color: COLORS.deepNavy }}>
          واجبات الدروس
        </Typography>
        {!loading && (
          <Typography sx={{ fontSize: 12, color: COLORS.gray }}>
            {current.length ? `${current.length} مطلوب` : "لا توجد واجبات مطلوبة حاليًا"}
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Stack gap={1}>
          <Skeleton variant="rounded" height={110} sx={{ borderRadius: "15px" }} />
        </Stack>
      ) : (
        <Stack gap={1}>
          {current.map((item) => (
            <HomeworkCard key={item._id} item={item} today={today} />
          ))}
          {past.length > 0 && (
            <>
              <Button
                size="small"
                onClick={() => setShowPast((v) => !v)}
                endIcon={showPast ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                sx={{ alignSelf: "flex-start", fontWeight: 800 }}
              >
                {showPast ? "إخفاء الواجبات السابقة" : `الواجبات السابقة (${past.length})`}
              </Button>
              <Collapse in={showPast} unmountOnExit>
                <Stack gap={1}>
                  {past.map((item) => (
                    <HomeworkCard key={item._id} item={item} today={today} />
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </Stack>
      )}

      <Typography sx={{ mt: 2, fontSize: 16, fontWeight: 900, color: COLORS.deepNavy }}>
        الواجبات الإلكترونية
      </Typography>
    </Box>
  );
}
