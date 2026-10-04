import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { RefreshRounded, ShieldRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AppContainer from "@/components/Container/Container";
import { fetchMyDay } from "@/APIs/school/notifications";

const toDateInput = (date = new Date()) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

const MyCover = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(toDateInput);
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetchMyDay(date);
    if (response.status) {
      setDay(response.data);
    } else {
      setDay(null);
      toast.error(response.message);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const covers = useMemo(
    () => (day?.slots ?? []).filter((slot) => slot.kind === "cover"),
    [day]
  );

  return (
    <AppContainer>
      <Box dir="rtl" sx={{ width: "100%", pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2.2 }, mb: 1.25, borderRadius: "18px", border: "1px solid rgba(36,74,112,.08)", background: "linear-gradient(135deg, rgba(255,252,247,.98), rgba(251,240,216,.42))" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1.2}>
            <Box>
              <Typography component="h1" sx={{ color: "var(--color-navy-deep)", fontSize: { xs: 21, md: 25 }, fontWeight: 900 }}>حصص الاحتياط</Typography>
              <Typography sx={{ mt: .35, color: "var(--color-muted)", fontSize: 10 }}>الحصص التي كُلّفت بالإشراف عليها بدلًا من المعلم الغائب.</Typography>
            </Box>
            <Stack direction="row" gap={1}>
              <TextField type="date" size="small" label="التاريخ" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} />
              <Button variant="outlined" startIcon={<RefreshRounded />} onClick={load} disabled={loading}>تحديث</Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Paper elevation={0} sx={{ minHeight: 260, display: "grid", placeItems: "center", borderRadius: "18px", border: "1px solid rgba(36,74,112,.08)" }}>
            <CircularProgress />
          </Paper>
        ) : covers.length === 0 ? (
          <Paper elevation={0} sx={{ minHeight: 240, display: "grid", placeItems: "center", textAlign: "center", borderRadius: "18px", border: "1px solid rgba(36,74,112,.08)" }}>
            <Stack alignItems="center" spacing={1}>
              <ShieldRounded sx={{ fontSize: 46, color: "var(--color-gold-dark)" }} />
              <Typography sx={{ color: "var(--color-navy-deep)", fontWeight: 900 }}>لا توجد حصص احتياط مكلّف بها في هذا اليوم</Typography>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {covers.map((slot) => (
              <Paper key={`${slot.lectureId}-${slot.slot}`} elevation={0} sx={{ p: 1.6, borderRadius: "16px", border: "1px solid rgba(36,74,112,.1)", bgcolor: "#fff" }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.2}>
                  <Box>
                    <Typography sx={{ color: "var(--color-navy-deep)", fontSize: 15, fontWeight: 900 }}>الحصة {slot.slot} · {slot.className || "—"}</Typography>
                    <Typography sx={{ mt: .3, color: "var(--color-muted)", fontSize: 11 }}>{slot.subjectName || "—"}{slot.roomNumber ? ` · غرفة ${slot.roomNumber}` : ""}</Typography>
                    <Typography sx={{ mt: .25, color: "var(--color-muted)", fontSize: 10 }}>بدلًا من {slot.coveringFor || "—"}</Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/school/cover-register?lectureId=${slot.lectureId}&date=${date}`)}
                    sx={{ fontWeight: 900 }}
                  >
                    رصد الحضور والمتابعة
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </AppContainer>
  );
};

export default MyCover;
