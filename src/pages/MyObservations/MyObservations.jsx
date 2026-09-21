import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  ArrowBackRounded,
  RateReviewRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  explainObservation,
  fetchMyObservations,
} from "@/APIs/school/lessonObservations";
import NotificationBell from "@/components/Notifications/NotificationBell";
import nasaqLogo from "@/images/wadq-logo.png";
import { TEACHER_UI } from "@/shared/ui/teacherUi";

/*
 * ملاحظات الإدارة على حصص المعلم وردّه عليها.
 *
 * هذه صفحة من بوابة المعلم، لذلك لا تستخدم Container/Sidebar الخاص بالإدارة.
 * تحافظ على نفس نمط صفحات المعلم الحالية: صفحة مستقلة + Hero + رجوع للوحة التحكم.
 */

const MyObservations = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const result = await fetchMyObservations();

    if (!result.status) {
      setError(result.message);
      setRows([]);
    } else {
      setRows(result.data?.items ?? []);
    }

    setLoading(false);
    setRefreshing(false);
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
    load({ silent: true });
  };

  return (
    <Box dir="rtl" sx={{ ...TEACHER_UI.page }}>
      <Box sx={{ ...TEACHER_UI.container }}>
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            mb: 1.5,
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 230,
              height: 230,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
              left: -75,
              top: -115,
            }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                component="img"
                src={nasaqLogo}
                alt="نسق"
                sx={{
                  ...TEACHER_UI.heroLogo,
                  objectFit: "contain",
                  bgcolor: "#fff",
                  p: 0.45,
                }}
              />

              <Box>
                <Chip
                  label="بوابة المعلم"
                  size="small"
                  sx={{
                    height: 23,
                    mb: 0.45,
                    color: "#ffdf8c",
                    bgcolor: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,223,140,.25)",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                />

                <Typography sx={{ ...TEACHER_UI.heroTitle }}>
                  ملاحظات على حصصي
                </Typography>
                <Typography
                  sx={{
                    ...TEACHER_UI.heroSubtitle,
                    color: "rgba(255,255,255,.72)",
                  }}
                >
                  راجع ملاحظات الإدارة على حصصك وأرسل ردك من نفس المكان
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                startIcon={<ArrowBackRounded />}
                onClick={() => navigate("/teacher/dashboard")}
                sx={{
                  ...TEACHER_UI.button,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.25)",
                }}
              >
                لوحة التحكم
              </Button>

              <NotificationBell
                sx={{
                  width: 40,
                  height: 40,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,.07)" },
                }}
              />

              <Tooltip title="تحديث الملاحظات">
                <span>
                  <IconButton
                    onClick={() => load({ silent: true })}
                    disabled={refreshing}
                    sx={{
                      width: 40,
                      height: 40,
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,.25)",
                      borderRadius: 2,
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <RefreshRounded />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {error ? (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
              border: "1px solid #e1e7ec",
              borderRadius: 2.5,
            }}
          >
            <CircularProgress size={28} />
          </Paper>
        ) : rows.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              ...TEACHER_UI.section,
              ...TEACHER_UI.emptyState,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              border: "1px solid #e1e7ec",
              bgcolor: "#fff",
            }}
          >
            <Stack alignItems="center" spacing={0.8}>
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2.2,
                  color: "#244a70",
                  bgcolor: "#eef3f7",
                }}
              >
                <RateReviewRounded />
              </Box>
              <Typography
                sx={{
                  color: "#122f4d",
                  fontSize: 15,
                  fontWeight: 900,
                }}
              >
                لا توجد ملاحظات تنتظر ردك
              </Typography>
              <Typography sx={{ color: "#8996a5", fontSize: 12 }}>
                ستظهر هنا أي ملاحظة جديدة تسجلها الإدارة على إحدى حصصك.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => (
              <Paper
                key={row.observationId}
                elevation={0}
                sx={{
                  ...TEACHER_UI.section,
                  border: "1px solid #e1e7ec",
                  bgcolor: "#fff",
                }}
              >
                <Stack spacing={1.2}>
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

                    <Typography
                      sx={{
                        color: "#122f4d",
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      {row.className} · {row.subjectName}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Typography sx={{ fontSize: 12, color: "#8996a5" }}>
                      {row.date} · الحصة {row.slot}
                    </Typography>
                  </Stack>

                  {row.note ? (
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: "#f7f9fb",
                        border: "1px solid #edf0f3",
                      }}
                    >
                      <Typography sx={{ fontSize: 13, color: "#667482" }}>
                        {row.note}
                      </Typography>
                    </Box>
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#fff",
                      },
                    }}
                  />

                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => send(row)}
                      disabled={sending === row.observationId}
                      sx={{
                        ...TEACHER_UI.button,
                        bgcolor: "#244a70",
                        "&:hover": { bgcolor: "#173f65" },
                      }}
                    >
                      {sending === row.observationId
                        ? "جارٍ الإرسال…"
                        : "إرسال الرد"}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default MyObservations;
