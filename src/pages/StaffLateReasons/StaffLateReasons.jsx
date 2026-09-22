import { useCallback, useEffect, useMemo, useState } from "react";

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
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CancelRounded,
  CheckCircleRounded,
  RefreshRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import {
  fetchStaffDirectory,
  fetchStaffLateReasons,
  reviewStaffLateReason,
} from "@/APIs/school/staffAttendance";


const STATUSES = [
  { value: "pending", label: "بانتظار القرار", color: "warning" },
  { value: "missing", label: "بلا عذر", color: "error" },
  { value: "accepted", label: "مقبولة", color: "success" },
  { value: "rejected", label: "مرفوضة", color: "error" },
];

const statusMeta = (value) =>
  STATUSES.find((item) => item.value === value) ?? STATUSES[0];

const normalizeId = (value) => {
  if (value && typeof value === "object") return String(value._id || value.id || "").trim();
  return String(value || "").trim();
};

const extractStaff = (response) => {
  if (!response || response?.status === false) return [];
  let payload = response?.data ?? response;
  for (let index = 0; index < 4; index += 1) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    for (const key of [
      "items",
      "docs",
      "results",
      "staffMembers",
      "staff",
      "admins",
      "members",
      "users",
      "data",
    ]) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }
    if (payload?.data && typeof payload.data === "object") {
      payload = payload.data;
      continue;
    }
    break;
  }
  return [];
};

const staffOptionId = (item) =>
  normalizeId(
    item?.staffId ||
      item?.staff ||
      item?.adminId ||
      item?.admin ||
      item?.userId ||
      item?._id ||
      item?.id ||
      ""
  );

const staffName = (item) => {
  const nested =
    (item?.staffId && typeof item.staffId === "object" && item.staffId) ||
    (item?.staff && typeof item.staff === "object" && item.staff) ||
    (item?.adminId && typeof item.adminId === "object" && item.adminId) ||
    (item?.admin && typeof item.admin === "object" && item.admin) ||
    (item?.userId && typeof item.userId === "object" && item.userId) ||
    {};

  return (
    item?.staffName ||
    item?.name ||
    item?.fullName ||
    item?.username ||
    item?.email ||
    nested?.name ||
    nested?.fullName ||
    nested?.username ||
    nested?.email ||
    "إداري / مشرف"
  );
};

const StaffLateReasons = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};
  const currentUser = authState?.user || authState?.admin || authState || {};
  const currentUserId = normalizeId(
    currentUser?.userId || currentUser?._id || currentUser?.id || currentUser?.sub
  );

  const [status, setStatus] = useState("pending");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState([]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verdict, setVerdict] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStaffDirectory().then((response) => {
      if (!active) return;
      if (response?.status === false) {
        setStaff([]);
        toast.error(response?.message || "تعذر تحميل قائمة الإداريين والمشرفين");
        return;
      }
      setStaff(extractStaff(response));
    });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("تاريخ البداية يجب أن يكون قبل أو مساويًا لتاريخ النهاية");
      setRows([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError("");

    const result = await fetchStaffLateReasons({
      status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      staffId: staffId || undefined,
    });

    if (result?.status === false) {
      setError(result.message || "تعذر تحميل أعذار التأخير");
      setRows([]);
      setTotal(0);
    } else {
      const payload = result?.data ?? result;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      setRows(items);

      const responseTotal = Number(payload?.total);
      setTotal(Number.isFinite(responseTotal) && responseTotal >= 0 ? responseTotal : items.length);
    }

    setLoading(false);
  }, [status, dateFrom, dateTo, staffId]);

  useEffect(() => {
    load();
  }, [load]);


  const staffOptions = useMemo(
    () =>
      [...staff]
        .map((item) => ({ id: staffOptionId(item), name: staffName(item) }))
        .filter((item) => item.id)
        .sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [staff]
  );

  const confirmVerdict = async () => {
    if (!verdict) return;

    setSaving(true);
    const result = await reviewStaffLateReason(
      verdict.row.attendanceId,
      verdict.value,
      note
    );
    setSaving(false);

    if (result?.status === false) {
      toast.error(result.message);
      return;
    }

    toast.success(result?.message || "تم حفظ القرار");
    setVerdict(null);
    setNote("");
    load();
  };

  const rejecting = verdict?.value === "rejected";
  const showingMissing = status === "missing";

  return (
    <Container>
      <Stack spacing={2} sx={{ py: 2 }} dir="rtl">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ScheduleRounded sx={{ color: "var(--color-navy, #244A70)" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                أعذار تأخير الإداريين والمشرفين
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                مراجعة أسباب التأخير ومتابعة حالات التأخير التي لم يُكتب لها عذر بعد
              </Typography>
            </Box>
          </Stack>

          <Button
            size="small"
            startIcon={<RefreshRounded />}
            onClick={load}
            sx={{ borderRadius: "10px" }}
          >
            تحديث
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "14px" }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1}
            alignItems={{ lg: "center" }}
          >
            <TextField
              select
              size="small"
              label="الحالة"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              {STATUSES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="الإداري / المشرف"
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">الكل</MenuItem>
              {staffOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              size="small"
              label="من"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              label="إلى"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`${total} سجل`} sx={{ fontWeight: 800 }} />
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : rows.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 5, borderRadius: "14px", textAlign: "center" }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              {showingMissing
                ? "لا توجد حالات تأخير بلا عذر في هذه الفترة."
                : status === "pending"
                  ? "لا توجد أعذار تنتظر القرار."
                  : "لا توجد سجلات بهذه الحالة."}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => {
              const meta = statusMeta(
                row.lateReason ? row.lateReasonStatus : "missing"
              );

              return (
                <Paper
                  key={row.attendanceId}
                  variant="outlined"
                  sx={{ p: 1.6, borderRadius: "14px" }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                        {row.staffName || "إداري / مشرف"}
                      </Typography>
                      <Chip
                        size="small"
                        label={row.role === "SUPERVISOR" ? "مشرف" : "مدير / إداري"}
                      />
                      <Chip size="small" label={row.date} />
                      <Chip
                        size="small"
                        color="warning"
                        label={`تأخر ${Number(row.lateMinutes) || 0} دقيقة`}
                        sx={{ fontWeight: 800 }}
                      />
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip
                        size="small"
                        color={meta.color}
                        label={meta.label}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>

                    {row.lateReason ? (
                      <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                        {row.lateReason}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                        لم يذكر الموظف سببًا لهذا التأخير بعد.
                      </Typography>
                    )}

                    {row.lateReason && row.lateReasonStatus === "pending" && normalizeId(row.staffId) !== currentUserId ? (
                      <>
                        <Divider />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleRounded />}
                            onClick={() => {
                              setVerdict({ row, value: "accepted" });
                              setNote("");
                            }}
                            sx={{ borderRadius: "10px" }}
                          >
                            قبول العذر
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelRounded />}
                            onClick={() => {
                              setVerdict({ row, value: "rejected" });
                              setNote("");
                            }}
                            sx={{ borderRadius: "10px" }}
                          >
                            رفض
                          </Button>
                        </Stack>
                      </>
                    ) : row.lateReason && row.lateReasonStatus === "pending" ? (
                      <Alert severity="info" sx={{ fontSize: 12 }}>
                        لا يمكنك مراجعة عذر التأخير الخاص بك.
                      </Alert>
                    ) : row.lateReasonStatus ? (
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                        {row.lateReasonReviewedByName
                          ? `راجعه ${row.lateReasonReviewedByName}`
                          : "تمت المراجعة"}
                        {row.lateReasonReviewNote
                          ? ` — ${row.lateReasonReviewNote}`
                          : ""}
                      </Typography>
                    ) : (
                      <Alert severity="warning" sx={{ fontSize: 12 }}>
                        لا توجد أزرار قرار هنا لأن الموظف لم يكتب سببًا بعد.
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

      </Stack>

      <Dialog
        open={Boolean(verdict)}
        onClose={() => (saving ? null : setVerdict(null))}
        fullWidth
        maxWidth="xs"
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 16 }}>
          {rejecting ? "رفض عذر التأخير" : "قبول عذر التأخير"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {verdict?.row?.staffName} · {verdict?.row?.date} · تأخر{" "}
              {verdict?.row?.lateMinutes} دقيقة
            </Typography>

            <Alert severity="info" sx={{ fontSize: 12 }}>
              يصل القرار إلى الموظف بعد الحفظ، والرفض يتطلب توضيح السبب.
            </Alert>

            <TextField
              multiline
              minRows={3}
              size="small"
              label={rejecting ? "سبب الرفض (مطلوب)" : "ملاحظة (اختيارية)"}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              inputProps={{ maxLength: 500 }}
              error={rejecting && !note.trim()}
              helperText={rejecting && !note.trim() ? "اكتب سبب رفض العذر" : " "}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVerdict(null)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color={rejecting ? "error" : "success"}
            onClick={confirmVerdict}
            disabled={saving || (rejecting && !note.trim())}
            sx={{ borderRadius: "10px" }}
          >
            {saving ? "جارٍ الحفظ…" : rejecting ? "تأكيد الرفض" : "تأكيد القبول"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffLateReasons;
