import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  FileDownloadOutlined,
  FilterAltOffRounded,
  PrintRounded,
} from "@mui/icons-material";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthUser } from "react-auth-kit";

import Container from "@/components/Container/Container";
import { fetchStudentStatistics } from "@/APIs/school/students";
import { getSchoolSessionInfo } from "@/utils/school/schoolSession";

const EMPTY_FILTERS = {
  stageId: "",
  gradeLevelId: "",
  classId: "",
  gender: "",
  nationality: "",
};

const GENDER_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "male", label: "بنون" },
  { value: "female", label: "بنات" },
];

const NATIONALITY_GROUPS = [
  { value: "", label: "الكل" },
  { value: "saudi", label: "سعودي" },
  { value: "non_saudi", label: "غير سعودي" },
  { value: "unspecified", label: "غير محدد" },
];

const COUNT_COLUMNS = [
  { key: "total", label: "الإجمالي" },
  { key: "male", label: "بنون" },
  { key: "female", label: "بنات" },
  { key: "saudi", label: "سعودي" },
  { key: "nonSaudi", label: "غير سعودي" },
  { key: "unspecifiedNationality", label: "غير محدد" },
];

const DETAIL_COLUMNS = [
  { key: "maleSaudi", label: "بنون سعوديون" },
  { key: "femaleSaudi", label: "بنات سعوديات" },
  { key: "maleNonSaudi", label: "بنون غير سعوديين" },
  { key: "femaleNonSaudi", label: "بنات غير سعوديات" },
];

const SUMMARY_CARDS = [
  { key: "total", label: "إجمالي الطلاب" },
  { key: "male", label: "البنون" },
  { key: "female", label: "البنات" },
  { key: "saudi", label: "السعوديون" },
  { key: "nonSaudi", label: "غير السعوديين" },
  { key: "unspecifiedNationality", label: "غير محدد الجنسية" },
];

const unwrap = (response) => response?.data?.total ? response.data : response;

const percent = (count, total) =>
  total ? `${((count / total) * 100).toFixed(1)}%` : "—";

const headCellSx = {
  fontWeight: 900,
  bgcolor: "#f1f5f9",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const cellSx = { textAlign: "center", whiteSpace: "nowrap" };

const totalRowSx = { "& td": { fontWeight: 900, bgcolor: "#f8fafc" } };

const StatsTable = ({ title, columns, rows, totalRow }) => (
  <Paper className="stats-section" variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
    <Typography sx={{ fontWeight: 900, px: 2, py: 1.2, bgcolor: "var(--color-navy, #1e3a5f)", color: "#fff" }}>
      {title}
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.label} sx={headCellSx}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={cellSx}>لا توجد بيانات</TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.label} sx={cellSx}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
          {totalRow && rows.length > 0 && (
            <TableRow sx={totalRowSx}>
              {columns.map((c, i) => (
                <TableCell key={c.label} sx={cellSx}>{i === 0 ? "الإجمالي" : c.renderTotal ? c.renderTotal(totalRow) : ""}</TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const StudentStatistics = () => {
  const getAuthUser = useAuthUser();
  const { schoolName } = getSchoolSessionInfo(getAuthUser());

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [baseline, setBaseline] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailed, setDetailed] = useState(false);

  // The unfiltered call feeds the filter lists, so they never shrink to the
  // current selection.
  useEffect(() => {
    let active = true;
    fetchStudentStatistics().then((response) => {
      if (!active) return;
      if (response?.status === false) {
        setError(response.message || "تعذر تحميل إحصائيات الطلاب");
        setLoading(false);
        return;
      }
      setBaseline(unwrap(response));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchStudentStatistics(filters).then((response) => {
      if (!active) return;
      if (response?.status === false) {
        setError(response.message || "تعذر تحميل إحصائيات الطلاب");
      } else {
        setError("");
        setData(unwrap(response));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [filters]);

  const stageOptions = baseline?.byStage ?? [];
  const gradeOptions = (baseline?.byGradeLevel ?? []).filter(
    (g) => !filters.stageId || g.stageId === filters.stageId
  );
  const classOptions = (baseline?.byClass ?? []).filter(
    (c) =>
      (!filters.stageId || c.stageId === filters.stageId) &&
      (!filters.gradeLevelId || c.gradeLevelId === filters.gradeLevelId)
  );
  const nationalityOptions = [
    ...NATIONALITY_GROUPS,
    ...(baseline?.byNationality ?? [])
      .filter((n) => n.code && !n.isSaudi)
      .map((n) => ({ value: n.code, label: n.label })),
  ];

  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "stageId") {
        next.gradeLevelId = "";
        next.classId = "";
      }
      if (key === "gradeLevelId") next.classId = "";
      return next;
    });
  };

  // Written on screen, in print and in the export, so a printed report always
  // says which students it counts.
  const filterSummary = useMemo(() => {
    const labelOf = (options, value, field = "name", key = "stageId") =>
      options.find((o) => o[key] === value)?.[field];
    const parts = [];
    if (filters.stageId) parts.push(`المرحلة: ${labelOf(baseline?.byStage ?? [], filters.stageId)}`);
    if (filters.gradeLevelId) parts.push(`الصف: ${labelOf(baseline?.byGradeLevel ?? [], filters.gradeLevelId, "name", "gradeLevelId")}`);
    if (filters.classId) parts.push(`الفصل: ${labelOf(baseline?.byClass ?? [], filters.classId, "name", "classId")}`);
    if (filters.gender) parts.push(`الجنس: ${GENDER_OPTIONS.find((o) => o.value === filters.gender)?.label}`);
    if (filters.nationality) parts.push(`الجنسية: ${nationalityOptions.find((o) => o.value === filters.nationality)?.label}`);
    return parts.length ? parts.join(" · ") : "جميع الطلاب";
  }, [filters, baseline]); // eslint-disable-line react-hooks/exhaustive-deps

  const countCols = [...COUNT_COLUMNS, ...(detailed ? DETAIL_COLUMNS : [])].map((c) => ({
    label: c.label,
    render: (row) => row[c.key] ?? 0,
    renderTotal: (t) => t[c.key] ?? 0,
  }));

  const total = data?.total;

  // The API lists classes by name; a report reads them stage by stage, grade by grade.
  const classRows = useMemo(() => {
    const gradeOrder = new Map((data?.byGradeLevel ?? []).map((g, i) => [g.gradeLevelId, i]));
    return [...(data?.byClass ?? [])].sort(
      (a, b) =>
        (gradeOrder.get(a.gradeLevelId) ?? 999) - (gradeOrder.get(b.gradeLevelId) ?? 999) ||
        a.name.localeCompare(b.name, "ar")
    );
  }, [data]);

  const sections = data
    ? [
        {
          title: "حسب المرحلة",
          columns: [
            { label: "المرحلة", render: (r) => r.name },
            { label: "عدد الفصول", render: (r) => r.classCount, renderTotal: () => data.byClass.length },
            ...countCols,
          ],
          rows: data.byStage,
        },
        {
          title: "حسب الصف",
          columns: [
            { label: "الصف", render: (r) => r.name },
            { label: "المرحلة", render: (r) => r.stageName ?? "—" },
            { label: "عدد الفصول", render: (r) => r.classCount, renderTotal: () => data.byClass.length },
            ...countCols,
          ],
          rows: data.byGradeLevel,
        },
        {
          title: "حسب الفصل",
          columns: [
            { label: "الفصل", render: (r) => r.name },
            { label: "الصف", render: (r) => r.gradeLevelName ?? "—" },
            { label: "المرحلة", render: (r) => r.stageName ?? "—" },
            ...countCols,
          ],
          rows: classRows,
        },
        {
          title: "حسب الجنسية",
          columns: [
            { label: "الجنسية", render: (r) => r.label },
            { label: "الإجمالي", render: (r) => r.total, renderTotal: (t) => t.total },
            { label: "بنون", render: (r) => r.male, renderTotal: (t) => t.male },
            { label: "بنات", render: (r) => r.female, renderTotal: (t) => t.female },
            { label: "النسبة", render: (r) => percent(r.total, total?.total), renderTotal: (t) => percent(t.total, t.total) },
          ],
          rows: data.byNationality,
        },
      ]
    : [];

  const exportCsv = () => {
    const lines = [
      ["إحصائيات الطلاب"],
      ["المدرسة", data.school?.name || schoolName],
      ["السنة الدراسية", data.academicYear?.name ?? ""],
      ["الفلاتر", filterSummary],
      [],
    ];
    for (const s of sections) {
      lines.push([s.title]);
      lines.push(s.columns.map((c) => c.label));
      s.rows.forEach((r) => lines.push(s.columns.map((c) => c.render(r))));
      lines.push(s.columns.map((c, i) => (i === 0 ? "الإجمالي" : c.renderTotal ? c.renderTotal(total) : "")));
      lines.push([]);
    }
    const csv = "﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `إحصائيات-الطلاب-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectSx = { minWidth: 160, flex: 1 };
  const reportSchoolName = data?.school?.name || schoolName;

  const reportHeading = (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 900 }}>إحصائيات الطلاب</Typography>
      <Typography sx={{ fontWeight: 800 }}>{reportSchoolName}</Typography>
      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
        السنة الدراسية: {data?.academicYear?.name ?? "—"}
      </Typography>
      <Typography sx={{ fontWeight: 800, mt: 0.5 }}>الفلاتر: {filterSummary}</Typography>
    </Box>
  );

  const reportBody = data ? (
    <>
      <Grid container spacing={1.5} mb={2}>
        {SUMMARY_CARDS.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.key}>
            <Paper className="stats-section" variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ fontWeight: 800, fontSize: 13 }}>{card.label}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 26 }}>{total?.[card.key] ?? 0}</Typography>
              {card.key !== "total" && (
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>{percent(total?.[card.key] ?? 0, total?.total)}</Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {sections.map((s) => (
        <StatsTable key={s.title} title={s.title} columns={s.columns} rows={s.rows} totalRow={total} />
      ))}
    </>
  ) : null;

  return (
    <Container>
      {/* The printed copy is a direct child of <body>, so it prints at full
          page width and flows over pages, free of the sidebar layout. */}
      <style>{`
        #student-stats-print-root { display: none; }
        @media print {
          body > *:not(#student-stats-print-root) { display: none !important; }
          #student-stats-print-root { display: block !important; direction: rtl; padding: 0; }
          #student-stats-print-root .stats-section { break-inside: avoid; box-shadow: none !important; }
          #student-stats-print-root .MuiGrid-item { flex-basis: 16.66% !important; max-width: 16.66% !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      {data && createPortal(
        <div id="student-stats-print-root">
          <Box mb={2}>{reportHeading}</Box>
          {reportBody}
        </div>,
        document.body
      )}

      <Box dir="rtl" sx={{ p: { xs: 1, md: 2 } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1} mb={2}>
          {reportHeading}
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PrintRounded />}
              disabled={!data || loading}
              onClick={() => window.print()}
              sx={{ fontWeight: 900, bgcolor: "var(--color-navy)" }}
            >
              طباعة التقرير
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              disabled={!data || loading}
              onClick={exportCsv}
              sx={{ fontWeight: 900 }}
            >
              تصدير Excel
            </Button>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={1.5} flexWrap="wrap">
            <TextField select size="small" label="المرحلة" value={filters.stageId} onChange={(e) => setFilter("stageId", e.target.value)} sx={selectSx}>
              <MenuItem value="">الكل</MenuItem>
              {stageOptions.map((s) => <MenuItem key={s.stageId} value={s.stageId}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="الصف" value={filters.gradeLevelId} onChange={(e) => setFilter("gradeLevelId", e.target.value)} sx={selectSx}>
              <MenuItem value="">الكل</MenuItem>
              {gradeOptions.map((g) => <MenuItem key={g.gradeLevelId} value={g.gradeLevelId}>{g.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="الفصل" value={filters.classId} onChange={(e) => setFilter("classId", e.target.value)} sx={selectSx}>
              <MenuItem value="">الكل</MenuItem>
              {classOptions.map((c) => <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="الجنس" value={filters.gender} onChange={(e) => setFilter("gender", e.target.value)} sx={selectSx}>
              {GENDER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="الجنسية" value={filters.nationality} onChange={(e) => setFilter("nationality", e.target.value)} sx={selectSx}>
              {nationalityOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5} flexWrap="wrap" gap={1}>
            <FormControlLabel
              control={<Switch checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />}
              label="تفصيل الجنس والجنسية"
            />
            <Button startIcon={<FilterAltOffRounded />} onClick={() => setFilters(EMPTY_FILTERS)} disabled={filterSummary === "جميع الطلاب"}>
              مسح الفلاتر
            </Button>
          </Stack>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && !data ? (
          <Stack alignItems="center" py={6}><CircularProgress /></Stack>
        ) : (
          <Box sx={{ opacity: loading ? 0.5 : 1, transition: "opacity .2s" }}>{reportBody}</Box>
        )}
      </Box>
    </Container>
  );
};

export default StudentStatistics;
