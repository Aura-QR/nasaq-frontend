import {
  ArrowBackRounded,
  AutoStoriesRounded,
  CheckCircleOutlineRounded,
  LinkRounded,
  MenuBookRounded,
} from "@mui/icons-material";
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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  fetchPreparationStudentView,
} from "@/APIs/school/preparation";
import {
  fetchSingleLibrary,
} from "@/APIs/school/library";
import {
  API_BASE_URL,
} from "@/APIs/Axios";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const getName = (value, fallback = "") =>
  String(
    value?.title ||
      value?.name ||
      fallback
  ).trim();

const resolveFileUrl = (item) => {
  const direct = item?.link || item?.url;
  if (direct) return direct;

  const path = item?.file?.path || item?.path;
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const configured = String(
    API_BASE_URL || ""
  ).replace(/\/+$/, "");
  const origin = configured.replace(/\/api\/?$/i, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
};

const TextSection = ({ title, value, icon }) => {
  if (!String(value || "").trim()) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        border: "1px solid rgba(36,74,112,.1)",
        borderRadius: "16px",
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.7} mb={0.8}>
        {icon}
        <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
          {title}
        </Typography>
      </Stack>
      <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.9, fontSize: 13 }}>
        {value}
      </Typography>
    </Paper>
  );
};

const PreparationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preparation, setPreparation] = useState(null);
  const [digitalItems, setDigitalItems] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const response = await fetchPreparationStudentView(id);
      if (!active) return;

      if (!response?.status) {
        setError(response?.message || "هذا التحضير غير متاح");
        setLoading(false);
        return;
      }

      const entity = response?.data || {};
      setPreparation(entity);

      const ids = (entity?.digitalContentIds || [])
        .map(normalizeId)
        .filter(Boolean);

      if (ids.length) {
        const rows = await Promise.all(
          ids.map(async (libraryId) => {
            const libraryResponse = await fetchSingleLibrary(libraryId);
            return libraryResponse?.status ? libraryResponse?.data : null;
          })
        );
        if (active) setDigitalItems(rows.filter(Boolean));
      } else {
        setDigitalItems([]);
      }

      if (active) setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !preparation) {
    return (
      <Box dir="rtl" sx={{ p: { xs: 1.5, md: 2 } }}>
        <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>
          رجوع
        </Button>
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          {error || "هذا التحضير غير متاح"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.2, md: 2 }, pb: 5 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.4, md: 2 },
          mb: 1.2,
          borderRadius: "18px",
          color: "#fff",
          background: "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 900 }}>
              {preparation.lessonTitle || "تحضير الدرس"}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,.75)" }}>
              محتوى الدرس المخصص للطالب
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRounded />}
            onClick={() => navigate(-1)}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,.35)", fontWeight: 900 }}
          >
            رجوع
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1}>
        <TextSection
          title="التهيئة"
          value={preparation.warmUp}
          icon={<AutoStoriesRounded fontSize="small" />}
        />
        <TextSection
          title="مفردات الدرس"
          value={preparation.vocabulary}
          icon={<MenuBookRounded fontSize="small" />}
        />

        {Array.isArray(preparation.objectives) && preparation.objectives.length > 0 && (
          <Paper elevation={0} sx={{ p: 1.4, border: "1px solid rgba(36,74,112,.1)", borderRadius: "16px" }}>
            <Stack direction="row" alignItems="center" gap={0.7} mb={0.8}>
              <CheckCircleOutlineRounded fontSize="small" />
              <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                أهداف الدرس
              </Typography>
            </Stack>
            <Stack spacing={0.55}>
              {preparation.objectives.map((objective, index) => (
                <Typography key={`${index}-${objective}`} sx={{ fontSize: 13, lineHeight: 1.8 }}>
                  • {objective}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}

        {digitalItems.length > 0 && (
          <Paper elevation={0} sx={{ p: 1.4, border: "1px solid rgba(36,74,112,.1)", borderRadius: "16px" }}>
            <Stack direction="row" alignItems="center" gap={0.7} mb={0.8}>
              <LinkRounded fontSize="small" />
              <Typography sx={{ fontWeight: 900, color: "var(--color-navy-deep)" }}>
                المحتوى الرقمي
              </Typography>
            </Stack>
            <Stack spacing={0.7}>
              {digitalItems.map((item) => {
                const url = resolveFileUrl(item);
                return (
                  <Paper key={normalizeId(item)} variant="outlined" sx={{ p: 1, borderRadius: "12px" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={0.8}>
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>
                          {getName(item, "محتوى رقمي")}
                        </Typography>
                        <Chip size="small" label={item?.kind === "file" ? "ملف" : "رابط"} sx={{ mt: 0.5 }} />
                      </Box>
                      {url && (
                        <Button component="a" href={url} target="_blank" rel="noreferrer" variant="outlined" size="small">
                          فتح المحتوى
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        )}

        <Divider />
        <TextSection title="مهارات التفكير" value={preparation.thinkingSkills} />
        <TextSection title="إغلاق الدرس" value={preparation.closure} />
        <TextSection title="تعليمات المعلم" value={preparation.teacherInstructions} />
      </Stack>
    </Box>
  );
};

export default PreparationView;
