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
  CheckCircleRounded,
  DeleteOutlineRounded,
  ErrorOutlineRounded,
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

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);

      const response = await fetchCoverage(date);

      if (response.status) {
        setBoard(response.data);
        setSupervisorIds(response.data?.supervisors?.teacherIds ?? []);
      } else {
        setBoard(null);
        toast.error(response.message);
      }

      setLoading(false);
    },
    [date]
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

  return (
    <AppContainer>
      <Box dir="rtl" sx={{ width: "100%", maxWidth: 1280, mx: "auto", pb: 4 }}>
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              الاحتياطي والمناوبة
            </Typography>
            <Typography variant="body2" color="text.secondary">
              مين غايب النهارده، وحصصه هتروح لمين
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              type="date"
              size="small"
              label="اليوم"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Tooltip title="تحديث">
              <span>
                <IconButton onClick={() => load()} disabled={loading}>
                  <RefreshRounded />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
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
                p: 2,
                mb: 2,
                borderRadius: 3,
                bgcolor: "#EEF3F9",
                display: "flex",
                gap: 1.5,
              }}
            >
              <ErrorOutlineRounded color="info" />
              <Typography variant="body2">
                محدش سجّل حضور لليوم ده لسه، فمفيش غياب يتحسب. الاستئذانات
                المعتمدة بتظهر عادي.
              </Typography>
            </Paper>
          )}

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
        onClose={() => setSupervisorDialog(false)}
        onSave={handleSaveSupervisors}
      />
    </Box>
    </AppContainer>
  );
};

const SummaryRow = ({ board, stats, coveredRatio, onEditSupervisors }) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    sx={{ mb: 2 }}
    alignItems="stretch"
  >
    <Paper
      elevation={0}
      sx={{ p: 2.5, borderRadius: 3, flex: 1, bgcolor: "#FFFCF7" }}
    >
      <Typography variant="body2" color="text.secondary">
        {DAY_NAMES[board.dayOfWeek] ?? board.dayOfWeek} · {board.date}
      </Typography>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
        {stats.covered} / {stats.needCover}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        حصة متغطية
      </Typography>
      <LinearProgress
        variant="determinate"
        value={coveredRatio}
        sx={{ height: 8, borderRadius: 4 }}
        color={stats.uncovered > 0 ? "warning" : "success"}
      />
    </Paper>

    <Paper
      elevation={0}
      sx={{ p: 2.5, borderRadius: 3, flex: 1, bgcolor: "#FFFCF7" }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        غايبين النهارده
      </Typography>
      {(board.absentTeachers ?? []).length === 0 ? (
        <Typography variant="body2">مفيش</Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {board.absentTeachers.map((teacher) => (
            <Chip
              key={teacher.teacherId}
              size="small"
              color="error"
              variant="outlined"
              label={teacher.name ?? "—"}
            />
          ))}
        </Stack>
      )}

      {(board.onLeave ?? []).length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            مستأذنين
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {board.onLeave.map((teacher) => (
              <Chip
                key={teacher.teacherId}
                size="small"
                color="warning"
                variant="outlined"
                label={`${teacher.name} · ${teacher.leaveAt}${
                  teacher.fromSlot ? ` (من الحصة ${teacher.fromSlot})` : ""
                }`}
              />
            ))}
          </Stack>
        </>
      )}
    </Paper>

    <Paper
      elevation={0}
      sx={{ p: 2.5, borderRadius: 3, flex: 1, bgcolor: "#FFFCF7" }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          مناوبة اليوم
        </Typography>
        <Button size="small" startIcon={<ShieldRounded />} onClick={onEditSupervisors}>
          تحديد
        </Button>
      </Stack>
      {!board.supervisors || board.supervisors.teacherNames?.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          مفيش مناوب متحدد
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {board.supervisors.teacherNames.map((name, index) => (
            <Chip key={`${name}-${index}`} size="small" color="primary" label={name} />
          ))}
        </Stack>
      )}
    </Paper>
  </Stack>
);

const Section = ({ title, count, emptyText, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Chip size="small" label={count} />
    </Stack>

    {count === 0 ? (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    ) : (
      <Stack spacing={1}>{children}</Stack>
    )}
  </Paper>
);

const LectureLine = ({ item }) => (
  <Box>
    <Typography variant="body1" fontWeight={600}>
      الحصة {item.slot} · {item.className ?? "—"}
      {item.roomNumber ? ` · ${item.roomNumber}` : ""}
    </Typography>
    <Typography variant="body2" color="text.secondary">
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
      p: 2,
      borderRadius: 2,
      borderColor: "#F0C0C0",
      bgcolor: "#FDF7F7",
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
      p: 2,
      borderRadius: 2,
      borderColor: "#CDE7D8",
      bgcolor: "#F6FBF8",
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
  <Dialog open={Boolean(target)} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
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
              <Typography variant="body1" fontWeight={600}>
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
  onClose,
  onSave,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
    <DialogTitle>مناوبة اليوم</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        اختار مناوب أو اتنين. الحفظ بيستبدل مناوبة اليوم كلها.
      </Typography>
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
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>إلغاء</Button>
      <Button variant="contained" onClick={onSave} disabled={busy}>
        حفظ
      </Button>
    </DialogActions>
  </Dialog>
);

export default CoverageBoard;
