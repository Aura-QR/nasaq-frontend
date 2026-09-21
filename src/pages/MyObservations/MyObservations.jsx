import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { RefreshRounded, RateReviewRounded } from "@mui/icons-material";
import { TEACHER_UI } from "@/shared/ui/teacherUi";
import { toast } from "react-toastify";

import {
  explainObservation,
  fetchMyObservations,
} from "@/APIs/school/lessonObservations";

/*
 * ما كُتب عن حصص هذا المعلم، وردّه عليه.
 *
 * الملاحظة رواية شخص عن غيابه، كُتبت دونه. من غير هذه الشاشة يصله إشعار
 * يقول إن شيئًا سُجّل عليه ولا يملك موضعًا يقول فيه ما حدث.
 */

const MyObservations = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchMyObservations();

    if (!result.status) {
      setError(result.message);
      setRows([]);
    } else {
      setRows(result.data?.items ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (row) => {
    const reason = String(drafts[row.observationId] || "").trim();

    if (reason.length < 3) {
      toast.error("اكتب السبب");
      return;
    }

    setSending(row.observationId);
    const result = await explainObservation(row.observationId, reason);
    setSending("");

    if (!result.status) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    load();
  };

  return (
    <Box dir="rtl" sx={{ ...TEACHER_UI.page }}>
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            mb: 1.5,
            color: "#fff",
            background: "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,.10)",
                  border: "1px solid rgba(255,255,255,.16)",
                }}
              >
                <RateReviewRounded />
              </Box>
              <Box>
                <Typography sx={{ ...TEACHER_UI.heroTitle }}>
                  ملاحظات على حصصي
                </Typography>
                <Typography sx={{ ...TEACHER_UI.heroSubtitle, color: "rgba(255,255,255,.72)" }}>
                  راجع ملاحظات الإدارة على حصصك وأرسل ردك من نفس المكان
                </Typography>
              </Box>
            </Stack>

            <Button
              size="small"
              startIcon={<RefreshRounded />}
              onClick={load}
              sx={{
                color: "#fff",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: "10px",
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={2}>
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
              لا توجد ملاحظات تنتظر ردك.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => (
              <Paper
                key={row.observationId}
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
                    <Chip
                      size="small"
                      color={row.status === "late" ? "warning" : "error"}
                      label={
                        row.status === "late"
                          ? `تأخر ${row.lateMinutes ?? ""} دقيقة`.trim()
                          : "لم يحضر"
                      }
                      sx={{ fontWeight: 800 }}
                    />
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                      {row.className} · {row.subjectName}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {row.date} · الحصة {row.slot}
                    </Typography>
                  </Stack>

                  {row.note ? (
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                      {row.note}
                    </Typography>
                  ) : null}

                  <TextField
                    multiline
                    minRows={2}
                    size="small"
                    placeholder="اذكر ما حدث — يصل إلى إدارة المدرسة"
                    value={drafts[row.observationId] || ""}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [row.observationId]: event.target.value,
                      }))
                    }
                    helperText="يُرسل مرة واحدة ولا يمكن تعديله بعد ذلك."
                  />

                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => send(row)}
                      disabled={sending === row.observationId}
                      sx={{ borderRadius: "10px" }}
                    >
                      {sending === row.observationId ? "جارٍ الإرسال…" : "إرسال الرد"}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
        </Stack>
      </Box>
    </Box>
  );
};

export default MyObservations;
