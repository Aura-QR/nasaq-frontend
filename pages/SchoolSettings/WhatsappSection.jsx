import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CheckCircleRounded,
  LinkOffRounded,
  QrCode2Rounded,
  RefreshRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import {
  connectWhatsapp,
  disconnectWhatsapp,
  fetchWhatsappStatus,
} from "@/APIs/school/whatsapp";

/*
 * Connecting the school's own WhatsApp number.
 *
 * The school scans a code from its own WhatsApp, exactly as it would to use
 * WhatsApp Web — which is the whole reason this is a QR and not Meta's
 * official API: nothing to verify, nothing to learn, no cost. From then on
 * every password and login link a parent receives comes from the school's own
 * number instead of one shared by every school on the platform.
 */

const failed = (response) =>
  response?.status === false;

/** The pairing code lives under a minute; a school will not scan it that fast. */
const QR_REFRESH_MS = 40_000;
const POLL_MS = 3_000;

const WhatsappSection = () => {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pollRef = useRef(null);
  const refreshRef = useRef(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (refreshRef.current) clearInterval(refreshRef.current);
    pollRef.current = null;
    refreshRef.current = null;
  }, []);

  const load = useCallback(async () => {
    const response = await fetchWhatsappStatus();

    if (failed(response)) {
      setError(
        response?.message ||
          "تعذر قراءة حالة اتصال واتساب"
      );
      setStatus(null);
    } else {
      setError("");
      setStatus(response?.data || null);
    }

    setLoading(false);
    return response?.data || null;
  }, []);

  useEffect(() => {
    load();
    return stopTimers;
  }, [load, stopTimers]);

  const startPairing = useCallback(async () => {
    setBusy(true);

    const response = await connectWhatsapp();

    if (failed(response)) {
      toast.error(
        response?.message ||
          "تعذر بدء ربط واتساب"
      );
      setBusy(false);
      return;
    }

    const data = response?.data || null;
    setStatus(data);
    setQr(data?.qr || null);
    setBusy(false);

    if (data?.connected) {
      setQr(null);
      return;
    }

    stopTimers();

    // Watch for the scan, and keep the code alive until it happens.
    pollRef.current = setInterval(async () => {
      const current = await load();
      if (current?.connected) {
        stopTimers();
        setQr(null);
        toast.success(
          "تم ربط واتساب المدرسة بنجاح"
        );
      }
    }, POLL_MS);

    refreshRef.current = setInterval(async () => {
      const again = await connectWhatsapp();
      if (!failed(again) && again?.data?.qr) {
        setQr(again.data.qr);
      }
    }, QR_REFRESH_MS);
  }, [load, stopTimers]);

  const stopPairing = useCallback(() => {
    stopTimers();
    setQr(null);
  }, [stopTimers]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    const response = await disconnectWhatsapp();

    if (failed(response)) {
      toast.error(
        response?.message || "تعذر فصل واتساب"
      );
    } else {
      toast.success(
        "تم فصل واتساب عن المدرسة"
      );
      stopTimers();
      setQr(null);
      setStatus(response?.data || null);
    }

    setBusy(false);
  }, [stopTimers]);

  const connected = Boolean(
    status?.connected
  );

  return (
    <Box
      sx={{
        px: { xs: 1.4, md: 1.8 },
        py: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1.2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              color: "#1f8a54",
              backgroundColor: "#eafaf1",
            }}
          >
            <QrCode2Rounded />
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 14,
                color: "#122f4d",
              }}
            >
              واتساب المدرسة
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#6b7785",
              }}
            >
              الرقم الذي تصل منه بيانات
              الدخول لأولياء الأمور
              والمعلمين
            </Typography>
          </Box>
        </Stack>

        <Chip
          size="small"
          icon={
            connected ? (
              <CheckCircleRounded />
            ) : undefined
          }
          label={
            connected
              ? "متصل"
              : "غير متصل"
          }
          sx={{
            fontWeight: 800,
            color: connected
              ? "#1f8a54"
              : "#9a6a1e",
            backgroundColor: connected
              ? "#eafaf1"
              : "var(--color-gold-soft)",
          }}
        />
      </Stack>

      {loading ? (
        <Stack
          alignItems="center"
          sx={{ py: 3 }}
        >
          <CircularProgress size={24} />
        </Stack>
      ) : error ? (
        <Alert severity="warning">
          {error}
        </Alert>
      ) : (
        <>
          {connected ? (
            <Stack
              spacing={1.2}
              sx={{ mt: 1 }}
            >
              <Alert
                severity="success"
                icon={
                  <CheckCircleRounded />
                }
              >
                بيانات الدخول تُرسل الآن من
                رقم المدرسة
                {status?.number
                  ? `: ${status.number}`
                  : ""}
                .
              </Alert>

              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={
                    <LinkOffRounded />
                  }
                  disabled={busy}
                  onClick={disconnect}
                  sx={{ fontWeight: 800 }}
                >
                  فصل الرقم
                </Button>
              </Box>
            </Stack>
          ) : qr ? (
            <Stack
              spacing={1.2}
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  borderRadius: "16px",
                  border:
                    "1px solid rgba(36,74,112,0.12)",
                  backgroundColor: "#fff",
                }}
              >
                <Box
                  component="img"
                  src={qr}
                  alt="رمز ربط واتساب"
                  sx={{
                    width: 232,
                    height: 232,
                    display: "block",
                  }}
                />
              </Paper>

              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#4a5560",
                  textAlign: "center",
                  maxWidth: 420,
                  lineHeight: 1.9,
                }}
              >
                من هاتف المدرسة: افتح واتساب ←
                الإعدادات ← الأجهزة المرتبطة ←
                ربط جهاز، ثم امسح هذا الرمز.
                يتجدد الرمز تلقائيًا حتى تتم
                عملية الربط.
              </Typography>

              <Button
                onClick={stopPairing}
                sx={{ fontWeight: 800 }}
              >
                إلغاء
              </Button>
            </Stack>
          ) : (
            <Stack
              spacing={1.2}
              sx={{ mt: 1 }}
            >
              <Alert severity="info">
                لم يتم ربط رقم للمدرسة بعد،
                والرسائل تُرسل حاليًا من الرقم
                العام للمنصة. اربط رقم المدرسة
                ليصل ولي الأمر إشعار من رقم
                يعرفه.
              </Alert>

              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#6b7785",
                  lineHeight: 1.9,
                }}
              >
                يلزم رقم غير مُفعّل على واتساب
                على أي هاتف آخر.
              </Typography>

              <Box>
                <Button
                  variant="contained"
                  startIcon={
                    busy ? (
                      <CircularProgress
                        size={16}
                        color="inherit"
                      />
                    ) : (
                      <QrCode2Rounded />
                    )
                  }
                  disabled={busy}
                  onClick={startPairing}
                  sx={{
                    fontWeight: 900,
                    bgcolor: "#1f8a54",
                    "&:hover": {
                      bgcolor: "#197044",
                    },
                  }}
                >
                  ربط رقم واتساب المدرسة
                </Button>

                <Button
                  startIcon={
                    <RefreshRounded />
                  }
                  disabled={busy}
                  onClick={load}
                  sx={{
                    fontWeight: 800,
                    ml: 1,
                  }}
                >
                  تحديث
                </Button>
              </Box>
            </Stack>
          )}
        </>
      )}

      <Divider
        sx={{
          mt: 2,
          borderColor:
            "rgba(36,74,112,0.07)",
        }}
      />
    </Box>
  );
};

export default WhatsappSection;
