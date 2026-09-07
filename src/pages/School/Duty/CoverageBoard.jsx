import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  ErrorOutlineRounded,
  Groups2Rounded,
  HistoryRounded,
  PersonAddAlt1Rounded,
  RefreshRounded,
  ShieldRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import AppContainer from "@/components/Container/Container";

import {
  assignSubstitute,
  COVER_REASON_LABELS,
  DAY_NAMES,
  fetchCoverage,
  fetchDutySupervisors,
  removeSubstitute,
  setDutySupervisors,
  toDateInput,
} from "@/APIs/school/duty";
import { getSchoolTeachersList } from "@/APIs/school/teachers";

/**
 * لوحة الاحتياطي — مين غايب النهارده، وحصصه راحت لمين.
 *
 * الشغل اللي الشاشة دي بتشيله عن المدير إنها بتقول **مين فاضي** في كل خانة.
 * من غيرها لازم يفتح جدول كل معلم ويقارن بإيده.
 */
const CoverageBoard = () => {
  const [date, setDate] = useState(() => toDateInput());
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [supervisorDialog, setSupervisorDialog] = useState(false);
  const [supervisorIds, setSupervisorIds] = useState([]);
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyFrom, setHistoryFrom] = useState(() => {
    const value = new Date();
    value.setDate(value.getDate() - 6);
    return toDateInput(value);
  });
  const [historyTo, setHistoryTo] = useState(() => toDateInput());

  const normalizeSupervisorRows = useCallback((payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [payload];
  }, []);

  const getSupervisorRecord = useCallback(
    (payload) => normalizeSupervisorRows(payload).find(Boolean) ?? null,
    [normalizeSupervisorRows]
  );

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);

      const [response, supervisorsResponse] = await Promise.all([
        fetchCoverage(date),
        fetchDutySupervisors({ date }),
      ]);

      if (response.status) {
        const supervisorRecord = supervisorsResponse.status
          ? getSupervisorRecord(supervisorsResponse.data)
          : null;
        const coverageSupervisors = response.data?.supervisors ?? null;

        setBoard({
          ...response.data,
          supervisors: supervisorRecord
            ? {
                ...coverageSupervisors,
                ...supervisorRecord,
                teacherIds:
                  supervisorRecord?.teacherIds ??
                  coverageSupervisors?.teacherIds ??
                  [],
                teacherNames:
                  supervisorRecord?.teacherNames ??
                  coverageSupervisors?.teacherNames ??
                  [],
              }
            : coverageSupervisors,
        });
        setSupervisorIds(
          supervisorRecord?.teacherIds ??
            coverageSupervisors?.teacherIds ??
            []
        );
        setSupervisorNotes(
          String(
            supervisorRecord?.notes ??
              coverageSupervisors?.notes ??
              ""
          )
        );
      } else {
        setBoard(null);
        toast.error(response.message);
      }

      setLoading(false);
    },
    [date, getSupervisorRecord]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const response = await getSchoolTeachersList();
      if (response?.status) {
        const rows = Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? [];
        setTeachers(
          rows.map((teacher) => ({
            id: String(teacher.id || teacher._id || ""),
            name: String(teacher.fullName || teacher.name || "").trim(),
          }))
        );
      }
    })();
  }, []);

  // A fresh object literal every render would make the memo below recompute
  // regardless, so the fallback is memoised on the board itself.
  const stats = useMemo(
    () => board?.stats ?? { needCover: 0, covered: 0, uncovered: 0 },
    [board]
  );

  const coveredRatio = useMemo(() => {
    if (!stats.needCover) return 0;
    return Math.round((stats.covered / stats.needCover) * 100);
  }, [stats]);

  const handleAssign = async (teacherId) => {
    if (!target) return;

    setBusy(true);
    const response = await assignSubstitute({
      date,
      lectureId: target.lectureId,
      substituteTeacherId: teacherId,
      reason: target.reason,
    });
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setTarget(null);
      load({ silent: true });
    } else {
      // الباك بيقول السبب بالظبط — "مشغول في نفس الخانة" مثلًا. أوضح من أي
      // رسالة عامة نكتبها هنا.
      toast.error(response.message);
    }
  };

  const handleRemove = async (substitutionId) => {
    setBusy(true);
    const response = await removeSubstitute(substitutionId);
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      load({ silent: true });
    } else {
      toast.error(response.message);
    }
  };

  const handleSaveSupervisors = async () => {
    setBusy(true);
    const response = await setDutySupervisors({
      date,
      teacherIds: supervisorIds,
      notes: supervisorNotes,
    });
    setBusy(false);

    if (response.status) {
      toast.success(response.message);
      setSupervisorDialog(false);
      load({ silent: true });
    } else {
      toast.error(response.message);
    }
  };

  const loadSupervisorHistory = useCallback(async () => {
    if (!historyFrom || !historyTo) return;

    setHistoryLoading(true);
    const response = await fetchDutySupervisors({
      from: historyFrom,
      to: historyTo,
    });

    if (response.status) {
      setHistoryRows(normalizeSupervisorRows(response.data));
    } else {
      setHistoryRows([]);
      toast.error(response.message);
    }

    setHistoryLoading(false);
  }, [historyFrom, historyTo, normalizeSupervisorRows]);

  const openSupervisorHistory = async () => {
    setHistoryOpen(true);
    await loadSupervisorHistory();
  };

  return (
    <AppContainer>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
          pb: 4,
          color: "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 2.4 },
            py: 1.6,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow: "0 10px 24px rgba(18,47,77,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "21px", md: "25px" },
                    fontWeight: 800,
                  }}
                >
                  الاحتياطي والمناوبة
                </Typography>
                <Chip
                  size="small"
                  label={stats.needCover ?? 0}
                  sx={{
                    color: "var(--color-gold-dark)",
                    backgroundColor: "var(--color-gold-soft)",
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Typography
                sx={{
                  mt: 0.45,
                  color: "var(--color-muted)",
                  fontSize: "11px",
                }}
              >
                تابع الغياب، وزّع حصص الاحتياطي وحدد مناوبة اليوم من مكان واحد.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={1}
            >
              <TextField
                type="date"
                size="small"
                label="اليوم"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { sm: 170 } }}
              />
              <Tooltip title="تحديث">
                <span>
                  <IconButton
                    onClick={() => load()}
                    disabled={loading}
                    sx={{
                      width: 40,
                      height: 40,
                      border: "1px solid rgba(36,74,112,0.10)",
                      borderRadius: "11px",
                    }}
                  >
                    <RefreshRounded />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HistoryRounded />}
                onClick={openSupervisorHistory}
                sx={{ minHeight: 40, borderRadius: "11px", fontWeight: 800 }}
              >
                سجل المناوبات
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(36,74,112,0.08)",
              borderRadius: "18px",
              bgcolor: "var(--color-cream)",
            }}
          >
            <CircularProgress />
          </Paper>
        ) : !board ? null : (
          <>
            <SummaryRow
              board={board}
              stats={stats}
              coveredRatio={coveredRatio}
              onEditSupervisors={() => setSupervisorDialog(true)}
            />

            {!board.checkInInUse && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.4,
                  mb: 1.25,
                  border: "1px solid rgba(36,74,112,0.08)",
                  borderRadius: "14px",
                  bgcolor: "rgba(36,74,112,0.045)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ErrorOutlineRounded sx={{ color: "var(--color-navy-deep)" }} />
                <Typography sx={{ color: "var(--color-muted)", fontSize: "11px" }}>
                  محدش سجّل حضور لليوم ده لسه، فمفيش غياب يتحسب. الاستئذانات
                  المعتمدة بتظهر عادي.
                </Typography>
              </Paper>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                gap: 1.25,
              }}
            >
              <Section
                title="محتاجة بديل"
                count={board.uncovered?.length ?? 0}
                emptyText="مفيش حصة محتاجة بديل — كل حاجة متغطية."
              >
                {(board.uncovered ?? []).map((item) => (
                  <UncoveredCard
                    key={item.lectureId}
                    item={item}
                    onPick={() => setTarget(item)}
                  />
                ))}
              </Section>

              <Section
                title="اتغطّت"
                count={board.covered?.length ?? 0}
                emptyText="لسه مفيش تكليفات."
              >
                {(board.covered ?? []).map((item) => (
                  <CoveredCard
                    key={item.lectureId}
                    item={item}
                    busy={busy}
                    onRemove={() => handleRemove(item.substitutionId)}
                  />
                ))}
              </Section>
            </Box>
          </>
        )}

        <PickSubstituteDialog
          target={target}
          busy={busy}
          onClose={() => setTarget(null)}
          onPick={handleAssign}
        />

        <SupervisorsDialog
          open={supervisorDialog}
          busy={busy}
          teachers={teachers}
          value={supervisorIds}
          onChange={setSupervisorIds}
          notes={supervisorNotes}
          onNotesChange={setSupervisorNotes}
          onClose={() => setSupervisorDialog(false)}
          onSave={handleSaveSupervisors}
        />

        <SupervisorHistoryDialog
          open={historyOpen}
          loading={historyLoading}
          rows={historyRows}
          from={historyFrom}
          to={historyTo}
          onFromChange={setHistoryFrom}
          onToChange={setHistoryTo}
          onRefresh={loadSupervisorHistory}
          onClose={() => setHistoryOpen(false)}
        />
      </Box>
    </AppContainer>
  );
};

const SummaryRow = ({ board, stats, coveredRatio, onEditSupervisors }) => {
  const absentCount = (board.absentTeachers ?? []).length;
  const leaveCount = (board.onLeave ?? []).length;

  return (
    <Box
      sx={{
        mb: 1.25,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        gap: 1,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.4,
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          bgcolor: "var(--color-cream)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px", fontWeight: 700 }}>
              {DAY_NAMES[board.dayOfWeek] ?? board.dayOfWeek} · {board.date}
            </Typography>
            <Typography
              sx={{ mt: 0.25, color: "var(--color-navy-deep)", fontSize: "22px", fontWeight: 800 }}
            >
              {stats.covered} / {stats.needCover}
            </Typography>
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
              حصة متغطية
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              color: "var(--color-gold-dark)",
              bgcolor: "var(--color-gold-soft)",
              borderRadius: "12px",
            }}
          >
            <CalendarMonthRounded />
          </Box>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={coveredRatio}
          sx={{ mt: 1.1, height: 5, borderRadius: 4 }}
          color={stats.uncovered > 0 ? "warning" : "success"}
        />
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 1.4,
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          bgcolor: "var(--color-cream)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px", fontWeight: 700 }}>
              الغياب والاستئذان
            </Typography>
            <Typography sx={{ mt: 0.25, color: "var(--color-navy-deep)", fontSize: "22px", fontWeight: 800 }}>
              {absentCount} غياب · {leaveCount} استئذان
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40, height: 40, display: "grid", placeItems: "center",
              color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", borderRadius: "12px",
            }}
          >
            <Groups2Rounded />
          </Box>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1 }}>
          {(board.absentTeachers ?? []).map((teacher) => (
            <Chip key={teacher.teacherId} size="small" color="error" variant="outlined" label={teacher.name ?? "—"} />
          ))}
          {(board.onLeave ?? []).map((teacher) => (
            <Chip
              key={`leave-${teacher.teacherId}`}
              size="small"
              color="warning"
              variant="outlined"
              label={`${teacher.name}${teacher.fromSlot ? ` · من ${teacher.fromSlot}` : ""}`}
            />
          ))}
          {absentCount === 0 && leaveCount === 0 && (
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>لا يوجد غياب أو استئذان.</Typography>
          )}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 1.4,
          border: "1px solid rgba(36,74,112,0.08)",
          borderRadius: "18px",
          bgcolor: "var(--color-cream)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ color: "var(--color-muted)", fontSize: "10px", fontWeight: 700 }}>
              مناوبة اليوم
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 0.75 }}>
              {(board.supervisors?.teacherNames ?? []).length ? (
                board.supervisors.teacherNames.map((name, index) => (
                  <Chip key={`${name}-${index}`} size="small" label={name} sx={{ fontWeight: 800 }} />
                ))
              ) : (
                <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>مفيش مناوب متحدد</Typography>
              )}
            </Stack>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ShieldRounded />}
            onClick={onEditSupervisors}
            sx={{ borderRadius: "10px", fontWeight: 800, whiteSpace: "nowrap" }}
          >
            تحديد
          </Button>
        </Stack>
        {board.supervisors?.notes && (
          <Typography sx={{ mt: 0.8, color: "var(--color-muted)", fontSize: "9px" }}>
            {board.supervisors.notes}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

const Section = ({ title, count, emptyText, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.2, md: 1.6 },
      border: "1px solid rgba(36,74,112,0.08)",
      borderRadius: "18px",
      bgcolor: "var(--color-cream)",
      minWidth: 0,
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
      <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "15px", fontWeight: 800 }}>
        {title}
      </Typography>
      <Chip
        size="small"
        label={count}
        sx={{ color: "var(--color-gold-dark)", bgcolor: "var(--color-gold-soft)", fontWeight: 800 }}
      />
    </Stack>
    {count === 0 ? (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 150 }}>
        <Typography sx={{ color: "var(--color-muted)", fontSize: "11px", textAlign: "center" }}>
          {emptyText}
        </Typography>
      </Stack>
    ) : (
      <Stack spacing={0.85}>{children}</Stack>
    )}
  </Paper>
);

const LectureLine = ({ item }) => (
  <Box>
    <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "12px", fontWeight: 800 }}>
      الحصة {item.slot} · {item.className ?? "—"}
      {item.roomNumber ? ` · ${item.roomNumber}` : ""}
    </Typography>
    <Typography sx={{ color: "var(--color-muted)", fontSize: "10px" }}>
      {item.subjectName ?? "—"} · {item.absentTeacherName ?? "بدون معلم"}
      {" · "}
      {COVER_REASON_LABELS[item.reason] ?? item.reason}
      {item.leaveAt ? ` من ${item.leaveAt}` : ""}
    </Typography>
  </Box>
);

const UncoveredCard = ({ item, onPick }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.25,
      borderRadius: "14px",
      borderColor: "rgba(209,67,67,0.22)",
      bgcolor: "rgba(209,67,67,0.035)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <LectureLine item={item} />
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        label={`${item.suggestions?.length ?? 0} متاح`}
        color={item.suggestions?.length ? "success" : "default"}
        variant="outlined"
      />
      <Button
        variant="contained"
        size="small"
        startIcon={<PersonAddAlt1Rounded />}
        onClick={onPick}
        disabled={!item.suggestions?.length}
      >
        اختر بديل
      </Button>
    </Stack>
  </Paper>
);

const CoveredCard = ({ item, busy, onRemove }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.25,
      borderRadius: "14px",
      borderColor: "rgba(22,134,95,0.20)",
      bgcolor: "rgba(22,134,95,0.035)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <LectureLine item={item} />
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        color="success"
        icon={<CheckCircleRounded />}
        label={item.substituteTeacherName}
      />
      <Tooltip title="إلغاء التكليف">
        <span>
          <IconButton size="small" color="error" onClick={onRemove} disabled={busy}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  </Paper>
);

/**
 * المقترحين بييجوا مرتّبين من الباك — المتخصص في المادة الأول — فمش بنعيد
 * ترتيبهم هنا.
 */
const PickSubstituteDialog = ({ target, busy, onClose, onPick }) => (
  <Dialog
    open={Boolean(target)}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    dir="rtl"
    PaperProps={{ sx: { borderRadius: "18px" } }}
  >
    <DialogTitle>
      اختر بديل — الحصة {target?.slot} · {target?.className}
    </DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {target?.subjectName} · بدل {target?.absentTeacherName ?? "—"}
      </Typography>

      <Stack spacing={1}>
        {(target?.suggestions ?? []).map((suggestion) => (
          <Paper
            key={suggestion.teacherId}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "12px", fontWeight: 800 }}>
                {suggestion.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {suggestion.specialization || "بدون تخصص"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {suggestion.sameSubject && (
                <Chip size="small" color="success" label="نفس التخصص" />
              )}
              <Button
                size="small"
                variant="contained"
                disabled={busy}
                onClick={() => onPick(suggestion.teacherId)}
              >
                كلّفه
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>إغلاق</Button>
    </DialogActions>
  </Dialog>
);

const SupervisorsDialog = ({
  open,
  busy,
  teachers,
  value,
  onChange,
  notes,
  onNotesChange,
  onClose,
  onSave,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    dir="rtl"
    PaperProps={{ sx: { borderRadius: "18px" } }}
  >
    <DialogTitle>مناوبة اليوم</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        اختار مناوب أو اتنين. الحفظ بيستبدل مناوبة اليوم كلها.
      </Typography>
      <Stack spacing={2}>
        <TextField
          select
          fullWidth
          size="small"
          label="المناوبون"
          SelectProps={{
            multiple: true,
            value,
            onChange: (event) => onChange(event.target.value),
            renderValue: (selected) =>
              selected
                .map((id) => teachers.find((t) => t.id === id)?.name ?? id)
                .join("، "),
          }}
        >
          {teachers.map((teacher) => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          size="small"
          label="ملاحظات المناوبة (اختياري)"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          multiline
          minRows={2}
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>إلغاء</Button>
      <Button variant="contained" onClick={onSave} disabled={busy}>
        حفظ
      </Button>
    </DialogActions>
  </Dialog>
);

const getHistoryTeacherNames = (row) => {
  const values =
    row?.teacherNames ??
    row?.supervisors?.teacherNames ??
    row?.teachers ??
    [];

  if (!Array.isArray(values)) return [];

  return values
    .map((teacher) =>
      typeof teacher === "string"
        ? teacher
        : teacher?.name || teacher?.fullName || ""
    )
    .filter(Boolean);
};

const SupervisorHistoryDialog = ({
  open,
  loading,
  rows,
  from,
  to,
  onFromChange,
  onToChange,
  onRefresh,
  onClose,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    dir="rtl"
    PaperProps={{ sx: { borderRadius: "18px" } }}
  >
    <DialogTitle>سجل المناوبات</DialogTitle>
    <DialogContent dividers>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          type="date"
          size="small"
          label="من"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          type="date"
          size="small"
          label="إلى"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <Button
          variant="outlined"
          onClick={onRefresh}
          disabled={loading || !from || !to}
          startIcon={<RefreshRounded />}
          sx={{ whiteSpace: "nowrap" }}
        >
          تحديث
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          مفيش مناوبات في الفترة دي.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {rows.map((row, index) => {
            const teacherNames = getHistoryTeacherNames(row);
            const rowDate = row?.date ?? row?.day ?? "—";

            return (
              <Paper
                key={row?._id || `${rowDate}-${index}`}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                  {rowDate}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {teacherNames.length > 0 ? (
                    teacherNames.map((name, teacherIndex) => (
                      <Chip
                        key={`${name}-${teacherIndex}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={name}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      بدون مناوبين
                    </Typography>
                  )}
                </Stack>
                {row?.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                    {row.notes}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>إغلاق</Button>
    </DialogActions>
  </Dialog>
);

export default CoverageBoard;
