import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowBackRounded,
  AttachFileRounded,
  CheckCircleRounded,
  EditNoteRounded,
  LinkRounded,
  PrintRounded,
  SchoolRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

const STATUS_META = {
  draft: { label: "مسودة", tone: "warning" },
  pending: { label: "بانتظار المراجعة", tone: "info" },
  approved: { label: "معتمد", tone: "success" },
  needs_revision: { label: "يحتاج تعديل", tone: "error" },
};

const DAY_LABELS = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

const RESOURCE_META = {
  enrichment: { key: "enrichments", label: "إثراءات المعلم", singular: "إثراء" },
  homework: { key: "homeworks", label: "واجبات", singular: "واجب" },
  quiz: { key: "exams", label: "اختبارات", singular: "اختبار" },
  activity: { key: "activities", label: "أنشطة", singular: "نشاط" },
};

const RESOURCE_GROUPS = Object.values(RESOURCE_META);

const objectOf = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const idOf = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const nameOf = (value, fallback = "") => {
  if (value && typeof value === "object") {
    return String(
      value.name ||
        value.title ||
        value.label ||
        value.subjectName ||
        value.lessonTitle ||
        value.fullName ||
        fallback
    ).trim();
  }
  return String(value || fallback).trim();
};

const firstText = (...values) =>
  values.map((value) => String(value ?? "").trim()).find(Boolean) || "";

const valueOrDash = (value) => String(value ?? "").trim() || "—";

const arrayOf = (...values) => {
  const found = values.find((value) => Array.isArray(value) && value.length);
  return Array.isArray(found) ? found : [];
};

const normalizeTextArray = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.text || item?.title || item?.name || item?.label || ""
    )
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const formatDateOnly = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const dateOnly = raw.slice(0, 10);
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateOnly(value);
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const attachmentLabel = (file, index) => {
  if (typeof file === "string") {
    const last = file.split("/").filter(Boolean).pop() || "";
    try {
      return decodeURIComponent(last) || `مرفق ${index + 1}`;
    } catch {
      return last || `مرفق ${index + 1}`;
    }
  }

  return String(
    file?.originalName ||
      file?.name ||
      file?.filename ||
      file?.path?.split?.("/")?.pop?.() ||
      `مرفق ${index + 1}`
  );
};

const normalizeResource = (item, index, fallbackType = "") => ({
  ...objectOf(item),
  id: idOf(item) || `${fallbackType || "resource"}-${index}`,
  resourceId: idOf(item?._id || item?.resourceId || item),
  title: firstText(
    item?.title,
    item?.name,
    item?.examTitle,
    item?.projectTitle,
    item?.lessonTitle,
    `عنصر ${index + 1}`
  ),
  description: firstText(item?.description, item?.body, item?.note),
  startDate: firstText(item?.startDate, item?.startAt, item?.from).slice(0, 10),
  endDate: firstText(item?.endDate, item?.dueAt, item?.to).slice(0, 10),
  totalGrade: item?.totalGrade ?? item?.grade ?? "",
  link: firstText(item?.link, item?.url),
});

const buildResourceGroups = (form = {}, record = {}) => {
  const groupedFromRecord = {
    enrichments: [],
    homeworks: [],
    exams: [],
    activities: [],
  };

  (Array.isArray(record?.resources) ? record.resources : []).forEach((resource, index) => {
    const type = String(resource?.type || "").trim().toLowerCase();
    const meta = RESOURCE_META[type];
    if (!meta) return;
    groupedFromRecord[meta.key].push(normalizeResource(resource, index, type));
  });

  return RESOURCE_GROUPS.map((group) => {
    const formItems = Array.isArray(form?.[group.key]) ? form[group.key] : [];
    const legacyRecordItems = Array.isArray(record?.[group.key]) ? record[group.key] : [];
    const source = formItems.length
      ? formItems
      : groupedFromRecord[group.key].length
        ? groupedFromRecord[group.key]
        : legacyRecordItems;

    return {
      ...group,
      items: source.map((item, index) => normalizeResource(item, index, group.key)),
    };
  }).filter((group) => group.items.length > 0);
};

const MetaItem = ({ label, value, accent = false }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      minHeight: 70,
      bgcolor: accent ? "rgba(200,146,36,.08)" : "#fbfcfe",
      border: accent
        ? "1px solid rgba(200,146,36,.18)"
        : "1px solid rgba(36,74,112,.09)",
      borderRadius: "14px",
    }}
  >
    <Typography sx={{ color: "var(--color-muted)", fontSize: 9.5, fontWeight: 800 }}>
      {label}
    </Typography>
    <Typography
      sx={{
        mt: 0.35,
        color: "var(--color-navy-deep)",
        fontSize: 12.5,
        fontWeight: 900,
        wordBreak: "break-word",
      }}
    >
      {valueOrDash(value)}
    </Typography>
  </Paper>
);

const Section = ({ title, subtitle, children }) => (
  <Box
    sx={{
      mt: 1.6,
      p: { xs: 1.2, md: 1.45 },
      bgcolor: "#fff",
      border: "1px solid rgba(36,74,112,.08)",
      borderRadius: "15px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mb={1}>
      <Box>
        <Typography
          sx={{
            color: "var(--color-navy-deep)",
            fontSize: 14.5,
            fontWeight: 900,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ mt: 0.15, color: "var(--color-muted)", fontSize: 9.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Stack>
    {children}
  </Box>
);

const TextBlock = ({ label, value }) => (
  <Box sx={{ mb: 0.8 }}>
    <Typography sx={{ mb: 0.4, color: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}>
      {label}
    </Typography>
    <Box
      sx={{
        p: 1.05,
        minHeight: 44,
        bgcolor: "#f8fafc",
        border: "1px solid rgba(36,74,112,.07)",
        borderRadius: "11px",
      }}
    >
      <Typography
        sx={{
          color: "var(--color-navy-deep)",
          fontSize: 11.8,
          lineHeight: 1.9,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {valueOrDash(value)}
      </Typography>
    </Box>
  </Box>
);

const PreparationDocumentView = ({
  form = {},
  subject = {},
  grade = {},
  lecture,
  units = [],
  lessons = [],
  libraryItems = [],
  existingFiles = [],
  preparationRecord,
  preparationStatus,
  reviewNote,
  canReview,
  reviewing,
  onApprove,
  onRequestRevision,
  onBack,
}) => {
  const record = objectOf(preparationRecord);
  const recordLecture = objectOf(record?.lecture || record?.lectureId);
  const resolvedLecture = Object.keys(objectOf(lecture)).length ? objectOf(lecture) : recordLecture;
  const offering = objectOf(
    resolvedLecture?.subjectOfferingId ||
      resolvedLecture?.subjectOffering ||
      record?.subjectOfferingId ||
      record?.subjectOffering
  );
  const subjectNode = objectOf(
    record?.subject ||
      record?.subjectId ||
      offering?.subjectId ||
      offering?.subject
  );
  const gradeNode = objectOf(
    record?.gradeLevelId ||
      record?.gradeLevel ||
      offering?.gradeLevelId ||
      offering?.gradeLevel
  );
  const classNode = [
    record?.classId,
    record?.class,
    resolvedLecture?.classId,
    resolvedLecture?.class,
  ]
    .map(objectOf)
    .find((value) => Object.keys(value).length) || {};
  const lessonNode = objectOf(record?.lessonId || record?.lesson);
  const unitNodeFromLesson = objectOf(lessonNode?.unitId || lessonNode?.unit);
  const recordUnit = objectOf(record?.unitId || record?.unit);

  const status = String(preparationStatus || record?.reviewStatus || record?.status || "draft")
    .trim()
    .toLowerCase();
  const normalizedStatus = STATUS_META[status] ? status : "draft";
  const statusMeta = STATUS_META[normalizedStatus];

  const selectedUnit =
    units.find((item) => idOf(item) === idOf(form?.unitId)) ||
    (Object.keys(recordUnit).length ? recordUnit : null) ||
    (Object.keys(unitNodeFromLesson).length ? unitNodeFromLesson : null);

  const selectedLesson =
    lessons.find((item) => idOf(item) === idOf(form?.lessonId)) ||
    (Object.keys(lessonNode).length ? lessonNode : null);

  const teacherName = firstText(
    record?.name,
    nameOf(record?.submittedBy),
    nameOf(record?.teacherId || record?.teacher),
    nameOf(resolvedLecture?.teacherId || resolvedLecture?.teacher)
  );

  const subjectName = firstText(
    subject?.name === "المادة" ? "" : subject?.name,
    nameOf(subjectNode),
    nameOf(offering?.subjectId || offering?.subject),
    resolvedLecture?.subjectName,
    record?.subjectName
  );

  const gradeName = firstText(
    grade?.name === "الصف الدراسي" ? "" : grade?.name,
    nameOf(gradeNode),
    nameOf(offering?.gradeLevelId || offering?.gradeLevel),
    record?.gradeName
  );

  const className = firstText(
    nameOf(classNode),
    classNode?.roomNumber ? `فصل ${classNode.roomNumber}` : "",
    record?.className,
    resolvedLecture?.className
  );

  const dayKey = firstText(record?.dayOfWeek, resolvedLecture?.dayOfWeek, resolvedLecture?.day)
    .toLowerCase();
  const dayLabel = DAY_LABELS[dayKey] || valueOrDash(firstText(record?.dayOfWeek, resolvedLecture?.dayOfWeek, resolvedLecture?.day));
  const slot = firstText(record?.slot, resolvedLecture?.slot, resolvedLecture?.period);
  const slotLabel = slot ? `الحصة ${slot}` : "—";

  const lessonTitle = firstText(
    form?.lessonTitle,
    record?.lessonTitle,
    nameOf(selectedLesson),
    lessonNode?.lessonTitle
  );
  const unitTitle = firstText(nameOf(selectedUnit), nameOf(recordUnit), nameOf(unitNodeFromLesson));

  const warmUp = firstText(form?.warmup, record?.warmUp, record?.warmup, record?.introduction);
  const vocabulary = firstText(form?.vocabulary, record?.vocabulary, record?.lessonVocabulary);
  const objectives = (() => {
    const formRows = normalizeTextArray(form?.objectives);
    return formRows.length ? formRows : normalizeTextArray(record?.objectives);
  })();

  const teachingStrategies = (() => {
    const fromForm = normalizeTextArray(form?.teachingStrategies);
    const fromRecord = normalizeTextArray(record?.teachingStrategies);
    const base = fromForm.length ? fromForm : fromRecord;
    const other = firstText(form?.otherTeachingStrategy, record?.strategiesOther, record?.otherTeachingStrategy);
    return Array.from(new Set([...base, ...(other ? [other] : [])]));
  })();

  const teachingAids = (() => {
    const fromForm = normalizeTextArray(form?.educationalAids);
    const fromRecord = normalizeTextArray(record?.teachingAids || record?.educationalAids);
    const base = fromForm.length ? fromForm : fromRecord;
    const other = firstText(form?.otherEducationalAid, record?.otherEducationalAid);
    return Array.from(new Set([...base, ...(other ? [other] : [])]));
  })();

  const thinkingSkills = firstText(form?.thinkingSkills, record?.thinkingSkills);
  const closure = firstText(form?.lessonClosing, record?.closure, record?.lessonClosing, record?.closing);
  const teacherInstructions = firstText(form?.teacherInstructions, record?.teacherInstructions);

  const recordDigital = Array.isArray(record?.digitalContentIds)
    ? record.digitalContentIds
    : Array.isArray(record?.digitalContents)
      ? record.digitalContents
      : [];
  const digitalMap = new Map();
  [...recordDigital, ...libraryItems].forEach((item) => {
    const id = idOf(item);
    if (id) digitalMap.set(id, item);
  });
  const selectedDigitalIds = arrayOf(form?.digitalContentIds, record?.digitalContentIds).map(idOf).filter(Boolean);
  const selectedDigital = selectedDigitalIds.length
    ? selectedDigitalIds.map((id) => digitalMap.get(id) || { _id: id, title: id })
    : recordDigital.filter((item) => item && typeof item === "object");

  const resourceGroups = buildResourceGroups(form, record);
  const files = existingFiles.length
    ? existingFiles
    : arrayOf(record?.files, record?.attachments, record?.filePaths);

  const effectiveReviewNote = firstText(reviewNote, record?.reviewNote);
  const reviewedBy = firstText(record?.reviewedByName, nameOf(record?.reviewedBy));

  return (
    <Box dir="rtl" sx={{ pb: 4 }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #preparation-print-sheet,
          #preparation-print-sheet * { visibility: visible !important; }
          #preparation-print-sheet {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .preparation-print-hide { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <Stack
        className="preparation-print-hide"
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1}
        mb={1.1}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={onBack}
          sx={{ fontWeight: 900, textTransform: "none" }}
        >
          عودة
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintRounded />}
          onClick={() => window.print()}
          sx={{ fontWeight: 900, textTransform: "none", bgcolor: "var(--color-navy)" }}
        >
          طباعة / حفظ PDF
        </Button>
      </Stack>

      {normalizedStatus === "approved" && (
        <Alert
          className="preparation-print-hide"
          severity="success"
          icon={<CheckCircleRounded />}
          sx={{ mb: 1.1, borderRadius: "14px", fontWeight: 800 }}
        >
          تم اعتماد هذا التحضير{reviewedBy ? ` بواسطة ${reviewedBy}` : ""}
          {record?.reviewedAt ? ` — ${formatDateTime(record.reviewedAt)}` : ""}.
        </Alert>
      )}

      {normalizedStatus === "needs_revision" && (
        <Alert
          className="preparation-print-hide"
          severity="warning"
          icon={<WarningAmberRounded />}
          sx={{ mb: 1.1, borderRadius: "14px", fontWeight: 800 }}
        >
          <strong>مطلوب تعديل التحضير.</strong>
          {effectiveReviewNote ? ` ملاحظة المراجع: ${effectiveReviewNote}` : " راجع التحضير وأعد إرساله للمراجعة."}
        </Alert>
      )}

      {canReview && (
        <Paper
          className="preparation-print-hide"
          elevation={0}
          sx={{
            mb: 1.1,
            p: 1.2,
            bgcolor: "var(--color-cream)",
            border: "1px solid rgba(36,74,112,.09)",
            borderRadius: "16px",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={1}
          >
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900 }}>
                مراجعة التحضير
              </Typography>
              <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: 10.5 }}>
                راجع التحضير كاملًا ثم اعتمده أو أعده للمعلم مع ملاحظة.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} gap={0.7}>
              <Button
                variant="contained"
                startIcon={<CheckCircleRounded />}
                disabled={reviewing}
                onClick={onApprove}
                sx={{ fontWeight: 900, textTransform: "none", bgcolor: "#238f55" }}
              >
                اعتماد التحضير
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditNoteRounded />}
                disabled={reviewing}
                onClick={onRequestRevision}
                sx={{
                  fontWeight: 900,
                  textTransform: "none",
                  color: "var(--color-gold-dark)",
                  borderColor: "rgba(211,164,79,.45)",
                }}
              >
                طلب تعديل
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Paper
        id="preparation-print-sheet"
        elevation={0}
        sx={{
          p: { xs: 1.4, md: 2.25 },
          bgcolor: "#f7f9fc",
          border: "1px solid rgba(36,74,112,.1)",
          borderRadius: "20px",
          boxShadow: "0 14px 34px rgba(18,47,77,.07)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.4, md: 1.8 },
            mb: 1.3,
            color: "#fff",
            borderRadius: "16px",
            background: "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={1}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,.12)",
                }}
              >
                <SchoolRounded />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: 19, md: 23 }, fontWeight: 900 }}>
                  تحضير درس
                </Typography>
                <Typography sx={{ mt: 0.15, color: "rgba(255,255,255,.76)", fontSize: 11 }}>
                  {valueOrDash(lessonTitle)}
                </Typography>
              </Box>
            </Stack>
            <Chip
              label={statusMeta.label}
              color={statusMeta.tone}
              size="small"
              sx={{
                fontWeight: 900,
                ...(normalizedStatus === "approved"
                  ? {
                      bgcolor: "#eaf7f1",
                      color: "#187347",
                      border: "1px solid rgba(24,115,71,.22)",
                      "& .MuiChip-label": { color: "#187347" },
                    }
                  : {}),
              }}
            />
          </Stack>
        </Paper>

        <Grid container spacing={1}>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="المعلم" value={teacherName} accent /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="المادة" value={subjectName} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="الصف" value={gradeName} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="الفصل" value={className} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="اليوم" value={dayLabel} /></Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="الحصة" value={slotLabel} /></Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetaItem label="تاريخ الدرس" value={formatDateOnly(record?.lessonDate || record?.weekOf)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}><MetaItem label="الوحدة" value={unitTitle} /></Grid>
        </Grid>

        <Section title="المعلومات الأساسية" subtitle="محتوى افتتاح الدرس والأهداف التي سيكتسبها الطالب">
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}><TextBlock label="التهيئة" value={warmUp} /></Grid>
            <Grid item xs={12} md={6}><TextBlock label="مفردات الدرس" value={vocabulary} /></Grid>
          </Grid>

          <Typography sx={{ mb: 0.55, color: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}>
            أهداف الدرس
          </Typography>
          {objectives.length ? (
            <Stack spacing={0.55}>
              {objectives.map((objective, index) => (
                <Stack
                  key={`${objective}-${index}`}
                  direction="row"
                  gap={0.8}
                  alignItems="flex-start"
                  sx={{
                    p: 0.85,
                    bgcolor: "#f8fafc",
                    border: "1px solid rgba(36,74,112,.07)",
                    borderRadius: "10px",
                  }}
                >
                  <Typography sx={{ color: "var(--color-gold-dark)", fontWeight: 900 }}>
                    {index + 1}.
                  </Typography>
                  <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 12, lineHeight: 1.8 }}>
                    {objective}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>—</Typography>
          )}
        </Section>

        <Section title="المحتوى الرقمي المرتبط بالدرس">
          {selectedDigital.length ? (
            <Grid container spacing={0.8}>
              {selectedDigital.map((item, index) => (
                <Grid item xs={12} md={6} key={idOf(item) || index}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1, bgcolor: "#fcfdff", borderColor: "rgba(36,74,112,.09)", borderRadius: "11px" }}
                  >
                    <Stack direction="row" gap={0.8} alignItems="center">
                      <LinkRounded sx={{ color: "var(--color-gold-dark)", fontSize: 18 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 11.5, fontWeight: 900 }}>
                          {nameOf(item, `محتوى ${index + 1}`)}
                        </Typography>
                        {item?.link ? (
                          <Typography
                            component="a"
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ color: "var(--color-navy)", fontSize: 9.5, overflowWrap: "anywhere", textDecoration: "none" }}
                          >
                            {item.link}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>—</Typography>
          )}
        </Section>

        <Section title="طرق تنفيذ الدرس">
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 0.55, color: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}>
                استراتيجيات التدريس
              </Typography>
              {teachingStrategies.length ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {teachingStrategies.map((item) => <Chip key={item} label={item} size="small" sx={{ fontWeight: 800 }} />)}
                </Stack>
              ) : <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>—</Typography>}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 0.55, color: "var(--color-muted)", fontSize: 10, fontWeight: 800 }}>
                الوسائل التعليمية
              </Typography>
              {teachingAids.length ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {teachingAids.map((item) => <Chip key={item} label={item} size="small" sx={{ fontWeight: 800 }} />)}
                </Stack>
              ) : <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>—</Typography>}
            </Grid>
          </Grid>
          <Grid container spacing={1} sx={{ mt: 0.2 }}>
            <Grid item xs={12} md={6}><TextBlock label="مهارات التفكير" value={thinkingSkills} /></Grid>
            <Grid item xs={12} md={6}><TextBlock label="إغلاق الدرس" value={closure} /></Grid>
          </Grid>
        </Section>

        <Section title="تكليفات الحصة" subtitle="الواجبات والأنشطة والإثراءات والاختبارات المرتبطة بالتحضير">
          {resourceGroups.length ? (
            <Grid container spacing={1}>
              {resourceGroups.map((group) => (
                <Grid item xs={12} md={6} key={group.key}>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: "#fbfcfe", borderRadius: "12px", border: "1px solid rgba(36,74,112,.08)" }}>
                    <Typography sx={{ mb: 0.65, color: "var(--color-navy-deep)", fontSize: 12, fontWeight: 900 }}>
                      {group.label}
                    </Typography>
                    <Stack spacing={0.55}>
                      {group.items.map((item, index) => (
                        <Box key={item.resourceId || item.id || `${group.key}-${index}`} sx={{ p: 0.8, bgcolor: "#fff", borderRadius: "10px" }}>
                          <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 11.5, fontWeight: 900 }}>
                            {item.title || `${group.singular} ${index + 1}`}
                          </Typography>
                          {item.description ? (
                            <Typography sx={{ mt: 0.3, color: "var(--color-muted)", fontSize: 10.5, whiteSpace: "pre-wrap" }}>
                              {item.description}
                            </Typography>
                          ) : null}
                          {(item.startDate || item.endDate || item.totalGrade !== "") && (
                            <Typography sx={{ mt: 0.35, color: "var(--color-muted)", fontSize: 9.5 }}>
                              {item.startDate ? `البداية: ${item.startDate}` : ""}
                              {item.startDate && item.endDate ? " — " : ""}
                              {item.endDate ? `النهاية: ${item.endDate}` : ""}
                              {(item.startDate || item.endDate) && item.totalGrade !== "" ? " — " : ""}
                              {item.totalGrade !== "" ? `الدرجة: ${item.totalGrade}` : ""}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>لا توجد تكليفات مرتبطة بالتحضير.</Typography>
          )}
        </Section>

        <Section title="تعليمات المعلم">
          <TextBlock label="التعليمات" value={teacherInstructions} />
        </Section>

        <Section title="المرفقات المساندة">
          {files.length ? (
            <Stack direction="row" flexWrap="wrap" gap={0.55}>
              {files.map((file, index) => (
                <Chip
                  key={`${attachmentLabel(file, index)}-${index}`}
                  size="small"
                  icon={<AttachFileRounded />}
                  label={attachmentLabel(file, index)}
                  sx={{ fontWeight: 800 }}
                />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: "var(--color-muted)", fontSize: 11 }}>لا توجد مرفقات مساندة.</Typography>
          )}
        </Section>

        {(normalizedStatus === "approved" || normalizedStatus === "needs_revision" || reviewedBy || record?.reviewedAt) && (
          <Section title="نتيجة المراجعة">
            <Grid container spacing={1}>
              <Grid item xs={12} sm={4}><MetaItem label="الحالة" value={statusMeta.label} /></Grid>
              <Grid item xs={12} sm={4}><MetaItem label="المراجع" value={reviewedBy} /></Grid>
              <Grid item xs={12} sm={4}><MetaItem label="تاريخ المراجعة" value={formatDateTime(record?.reviewedAt)} /></Grid>
              {effectiveReviewNote ? (
                <Grid item xs={12}><TextBlock label="ملاحظة المراجع" value={effectiveReviewNote} /></Grid>
              ) : null}
            </Grid>
          </Section>
        )}
      </Paper>
    </Box>
  );
};

export default PreparationDocumentView;
