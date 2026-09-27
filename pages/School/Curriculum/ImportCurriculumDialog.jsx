import {
  CloudDownloadRounded,
  MenuBookRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  fetchCatalogSubjects,
  importSchoolCurriculum,
} from "@/APIs/school/curriculum";

/**
 * Importing a course from the platform catalogue into this school.
 *
 * The catalogue is the Saudi national curriculum — 162 courses, 8,331 lessons,
 * shared and read-only. Importing copies one course into the school's own
 * curriculum under the subject and grade chosen on the screen behind this
 * dialog. Two schools importing the same course each get their own lessons and
 * neither can see the other's.
 *
 * This is the difference between a deputy head typing 113 lessons and pressing
 * a button, so it is the first thing the screen should offer.
 */

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

/**
 * `name` alone does not identify a course.
 *
 * The catalogue holds 35 courses called العلوم and 24 called الرياضيات — the
 * ministry publishes one per grade and term. `variant` is the course's own
 * label, and it is the only thing separating two rows of the same subject.
 */
/**
 * Arabic the way two people would write the same subject.
 *
 * "الرياضيات" and "رياضيات" are the same subject; so are "علوم" and "العلوم".
 * Comparing raw strings would call every pair a mismatch and the warning
 * below would fire on every correct import, which is worse than no warning.
 */
const normalizeArabic = (value) =>
  String(value || "")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim()
    .split(/\s+/)
    // Every word, not just the first: "اللغة العربية" against "لغة عربية"
    // only matches once the second word loses its ال too.
    .map((word) => word.replace(/^ال/, ""))
    .join("");

/**
 * Is this course plainly about a different subject than the one it would land
 * in?
 *
 * Nothing on the server stops it: the import validates that the subject and
 * grade belong to the school, not that they suit the course. Importing 113
 * maths lessons into اجتماعيات is one click, and undoing it is deleting
 * twelve units by hand.
 */
const looksMismatched = (course, subjectName) => {
  const a = normalizeArabic(course?.name);
  const b = normalizeArabic(subjectName);
  if (!a || !b) return false;
  return !a.includes(b) && !b.includes(a);
};

const courseLabel = (course) => {
  const name = String(course?.name || "").trim();
  const variant = String(course?.variant || "").trim();
  if (!variant || variant === name) return name || "مقرر بدون اسم";
  return `${name} — ${variant}`;
};

const CourseRow = ({ course, selected, onSelect }) => {
  const id = normalizeId(course);
  const preview = Array.isArray(course?.unitPreview) ? course.unitPreview : [];
  const grade = String(course?.gradeName || "").trim();

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        p: 1.2,
        cursor: "pointer",
        borderRadius: "14px",
        border: "1px solid",
        borderColor: selected
          ? "var(--color-gold-dark)"
          : "rgba(36,74,112,.12)",
        bgcolor: selected ? "rgba(212,175,55,.07)" : "transparent",
        transition: "background-color .15s, border-color .15s",
        "&:hover": { bgcolor: "rgba(36,74,112,.04)" },
      }}
    >
      <Radio checked={selected} size="small" sx={{ p: 0.4, mt: 0.2 }} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{ fontWeight: 900, color: "var(--color-navy-deep)", fontSize: 13 }}
        >
          {courseLabel(course)}
        </Typography>

        <Stack direction="row" gap={0.6} flexWrap="wrap" sx={{ mt: 0.5 }}>
          <Chip
            size="small"
            label={`${course?.unitCount ?? 0} وحدة`}
            sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
          />
          <Chip
            size="small"
            label={`${course?.lessonCount ?? 0} درس`}
            sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
          />
          {/* Only when the source knows it. Blank for now on every row. */}
          {grade ? (
            <Chip
              size="small"
              label={grade}
              sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
            />
          ) : null}
        </Stack>

        {/*
         * The unit names are how a deputy head with the book open recognises
         * her course. Without them two rows of the same subject are
         * indistinguishable.
         */}
        {preview.length ? (
          <Typography
            sx={{
              fontSize: 10.5,
              color: "var(--color-muted)",
              mt: 0.6,
              lineHeight: 1.7,
            }}
          >
            {preview.slice(0, 4).join(" · ")}
            {preview.length > 4 ? " · …" : ""}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

const ImportCurriculumDialog = ({
  open,
  onClose,
  subject,
  grade,
  onImported,
}) => {
  const [term, setTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [importing, setImporting] = useState(false);

  const subjectId = normalizeId(subject);
  const gradeLevelId = normalizeId(grade);
  // Same order the screen behind uses: a school subject may carry either
  // `name` or `subjectName` depending on the endpoint it came from.
  const subjectName = String(subject?.name || subject?.subjectName || "").trim();
  const gradeName = String(grade?.name || grade?.title || "").trim();

  /*
   * One in-flight search at a time.
   *
   * Typing fires a request per keystroke after the debounce, and they do not
   * come back in order — a slow "ر" landing after "رياضيات" would replace the
   * results with the wrong ones. The counter makes a stale response a no-op.
   */
  const requestId = useRef(0);

  const search = useCallback(async (value) => {
    const mine = ++requestId.current;
    setLoading(true);
    setLoadError("");

    const response = await fetchCatalogSubjects({ q: value, limit: 50 });
    if (mine !== requestId.current) return;

    setLoading(false);
    if (response?.status === false) {
      setCourses([]);
      setLoadError(response?.message || "تعذر تحميل المنهج الوطني");
      return;
    }
    setCourses(Array.isArray(response?.data) ? response.data : []);
  }, []);

  // Reset on every open: a dialog that reopens holding the last search, and
  // the last selection, is how the wrong course gets imported.
  useEffect(() => {
    if (!open) return;
    setTerm("");
    setSelectedId("");
    setLoadError("");
    search("");
  }, [open, search]);

  useEffect(() => {
    if (!open) return undefined;
    const handle = setTimeout(() => search(term), 350);
    return () => clearTimeout(handle);
  }, [term, open, search]);

  const selected = useMemo(
    () => courses.find((course) => normalizeId(course) === selectedId) || null,
    [courses, selectedId]
  );

  const handleImport = async () => {
    if (!selectedId || !subjectId || !gradeLevelId) return;

    setImporting(true);
    const response = await importSchoolCurriculum({
      catalogSubjectId: selectedId,
      subjectId,
      gradeLevelId,
    });
    setImporting(false);

    if (response?.status === false) {
      toast.error(response?.message || "تعذر استيراد المنهج");
      return;
    }

    const units = Number(response?.data?.createdUnits ?? 0);
    const lessons = Number(response?.data?.createdLessons ?? 0);

    // Re-importing is safe and creates nothing new, so zero is a normal
    // answer, not a failure — say what happened instead of claiming success.
    toast.success(
      units || lessons
        ? `تم استيراد ${units} وحدة و${lessons} درسًا`
        : "المنهج مستورد بالفعل — لم تتم إضافة جديد"
    );

    onImported?.();
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, pb: 0.6 }}>
        استيراد منهج جاهز
        <Typography
          component="div"
          sx={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 700, mt: 0.3 }}
        >
          {subjectName && gradeName
            ? `سيُضاف إلى: ${subjectName} — ${gradeName}`
            : "اختر المادة والصف أولًا"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="ابحث باسم المادة أو الوحدة… مثال: رياضيات"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ fontSize: 18, color: "var(--color-muted)" }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.4 }}
        />

        {loadError ? (
          <Alert severity="error" sx={{ mb: 1.2, fontWeight: 700 }}>
            {loadError}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ minHeight: 200, display: "grid", placeItems: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : !courses.length ? (
          <Box
            sx={{
              minHeight: 200,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              border: "1px dashed rgba(36,74,112,.18)",
              borderRadius: "14px",
              px: 2,
            }}
          >
            <Box>
              <MenuBookRounded
                sx={{ fontSize: 34, color: "var(--color-gold-dark)", mb: 0.6 }}
              />
              <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                {term ? "لا نتائج لهذا البحث" : "المنهج الوطني غير متاح"}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "var(--color-muted)", mt: 0.5 }}>
                {term
                  ? "جرّب اسم المادة وحدها، مثل: علوم"
                  : "لم تتم تهيئة فهرس المناهج بعد — تواصل مع الدعم."}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Stack spacing={0.8} sx={{ maxHeight: 380, overflowY: "auto", pr: 0.4 }}>
            {courses.map((course) => (
              <CourseRow
                key={normalizeId(course)}
                course={course}
                selected={normalizeId(course) === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </Stack>
        )}

        {/*
         * A wrong pairing is one click and twelve units to undo, so say it
         * before the button rather than after.
         */}
        {selected && looksMismatched(selected, subjectName) ? (
          <Alert severity="warning" sx={{ mt: 1.2, fontWeight: 700, fontSize: 12 }}>
            المقرر المختار «{String(selected.name || "").trim()}» لا يبدو مطابقًا
            للمادة «{subjectName}». تأكد قبل الاستيراد.
          </Alert>
        ) : null}

        {/*
         * 23 groups of courses are indistinguishable here, and in most of them
         * the lessons are identical — the ministry publishes one course under
         * two ids. Either import gives the same result, so say so rather than
         * let it read as a bug.
         */}
        {courses.length > 1 ? (
          <Typography
            sx={{ fontSize: 10, color: "var(--color-muted)", mt: 1.2, lineHeight: 1.8 }}
          >
            قد تجد مقررين بنفس الاسم وعدد الدروس — الوزارة تنشر بعض المقررات
            برقمين، وكلاهما يعطي النتيجة نفسها.
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2.2, py: 1.4 }}>
        <Button onClick={onClose} disabled={importing} sx={{ fontWeight: 900 }}>
          إلغاء
        </Button>
        <Button
          variant="contained"
          startIcon={
            importing ? (
              <CircularProgress size={15} sx={{ color: "#fff" }} />
            ) : (
              <CloudDownloadRounded />
            )
          }
          onClick={handleImport}
          disabled={!selectedId || !subjectId || !gradeLevelId || importing}
          sx={{ fontWeight: 900, bgcolor: "var(--color-navy)" }}
        >
          {importing
            ? "جارٍ الاستيراد…"
            : selected
            ? `استيراد ${selected.lessonCount ?? 0} درسًا`
            : "استيراد"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportCurriculumDialog;
