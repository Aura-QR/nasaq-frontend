import { PersonOffRounded } from "@mui/icons-material";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";

import {
  endTeacherService,
  getSchoolTeachers,
  previewTeacherEndService,
} from "@/APIs/school/teachers";
import { DAY_NAMES } from "@/APIs/school/duty";

const extractTeachers = (result) => {
  const data = result?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const describeLecture = (lecture) =>
  [
    DAY_NAMES[lecture?.dayOfWeek] || lecture?.dayOfWeek,
    `الحصة ${lecture?.slot}`,
    lecture?.subjectName,
    lecture?.className,
  ]
    .filter(Boolean)
    .join(" — ");

/**
 * «إنهاء خدمة المعلم»: بدل ما الإدارة تعدّل حصص المعلم المغادر حصة حصة،
 * بتختار البديل مرة واحدة. الحصص اللي البديل مشغول فيها بتفضل من غير معلم،
 * والملخص بيعرضها قبل التأكيد.
 */
const EndTeacherServiceDialog = ({ open, teacher, onClose, onDone }) => {
  const [teachers, setTeachers] = useState([]);
  const [replacement, setReplacement] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const teacherId = teacher?.id;

  useEffect(() => {
    if (!open) return;
    setReplacement(null);
    setPreview(null);
    setError("");

    let mounted = true;
    getSchoolTeachers({ isActive: true }, { force: true }).then((result) => {
      if (mounted) setTeachers(extractTeachers(result));
    });
    return () => {
      mounted = false;
    };
  }, [open, teacherId]);

  useEffect(() => {
    if (!open || !teacherId) return;

    let mounted = true;
    setLoadingPreview(true);
    setError("");
    previewTeacherEndService(teacherId, replacement?._id || replacement?.id).then(
      (result) => {
        if (!mounted) return;
        setLoadingPreview(false);
        if (result?.status === false) {
          setPreview(null);
          setError(result?.message || "تعذر تحميل ملخص إنهاء الخدمة");
          return;
        }
        setPreview(result?.data || null);
      }
    );
    return () => {
      mounted = false;
    };
  }, [open, teacherId, replacement]);

  const options = useMemo(
    () =>
      teachers.filter(
        (item) => String(item?._id || item?.id) !== String(teacherId)
      ),
    [teachers, teacherId]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const result = await endTeacherService(
      teacherId,
      replacement?._id || replacement?.id
    );
    setSubmitting(false);

    if (result?.status === false) {
      setError(result?.message || "تعذر إنهاء خدمة المعلم");
      return;
    }
    onDone?.(result);
  };

  const conflicts = preview?.conflicts || [];

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}
      >
        <PersonOffRounded sx={{ color: "var(--color-danger)" }} />
        إنهاء خدمة المعلم
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography sx={{ fontSize: "13px", color: "var(--color-muted)" }}>
            ستُنقل حصص <b>{teacher?.name}</b> إلى المعلم البديل، ويُوقف حسابها
            فلا تتمكن من تسجيل الدخول. تبقى سجلاتها السابقة من حضور ومتابعة
            ودرجات محفوظة.
          </Typography>

          <Autocomplete
            options={options}
            value={replacement}
            onChange={(_, value) => setReplacement(value)}
            getOptionLabel={(option) => option?.name || option?.fullName || ""}
            isOptionEqualToValue={(option, value) =>
              String(option?._id || option?.id) ===
              String(value?._id || value?.id)
            }
            noOptionsText="لا يوجد معلمون"
            renderInput={(params) => (
              <TextField
                {...params}
                label="المعلم البديل"
                placeholder="اختر المعلم الذي سيتولى الحصص"
              />
            )}
          />

          {loadingPreview && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <CircularProgress size={22} />
            </Box>
          )}

          {!loadingPreview && preview && (
            <>
              {preview.lectureCount === 0 ? (
                <Alert severity="info">لا توجد حصص مسندة لهذا المعلم.</Alert>
              ) : replacement ? (
                <Alert severity={conflicts.length ? "warning" : "success"}>
                  ستُنقل {preview.toMove} من أصل {preview.lectureCount} حصة إلى{" "}
                  {preview.replacement?.name}.
                  {conflicts.length > 0 &&
                    ` وستبقى ${conflicts.length} حصة بدون معلم لأن البديل لديه حصة أخرى في الوقت نفسه.`}
                </Alert>
              ) : (
                <Alert severity="warning">
                  لم يُختر بديل: ستبقى الحصص ({preview.lectureCount}) في الجدول
                  بدون معلم، ويمكن إسنادها لاحقًا.
                </Alert>
              )}

              {conflicts.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid rgba(36,74,112,0.12)",
                    borderRadius: "10px",
                    p: 1.25,
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  <Typography sx={{ fontSize: "12px", fontWeight: 800, mb: 0.75 }}>
                    حصص ستبقى بدون معلم
                  </Typography>
                  {conflicts.map((conflict) => (
                    <Typography
                      key={conflict.id}
                      sx={{ fontSize: "12px", mb: 0.5 }}
                    >
                      • {describeLecture(conflict)}
                      <Box
                        component="span"
                        sx={{ color: "var(--color-muted)" }}
                      >
                        {" "}
                        (البديل لديه {conflict.busyWith?.subjectName || "حصة"} مع{" "}
                        {conflict.busyWith?.className || "فصل آخر"})
                      </Box>
                    </Typography>
                  ))}
                </Box>
              )}
            </>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting}>
          إلغاء
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting || loadingPreview || !preview}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          تأكيد إنهاء الخدمة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EndTeacherServiceDialog;
