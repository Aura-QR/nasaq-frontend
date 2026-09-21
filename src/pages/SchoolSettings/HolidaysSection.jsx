import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  DeleteOutlineRounded,
  EventBusyRounded,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import {
  fetchSchoolSettings,
  updateSchoolSettings,
} from "@/APIs/school/schoolSettings";

/*
 * الأيام التي لا يعبّر عنها جدول الأسبوع.
 *
 * جدول الأسبوع يجيب عن «هل الجمعة يوم عمل؟»، وهو السؤال الصحيح للجمعة
 * والخاطئ للعيد. من غير هذه الشاشة كانت إجازة منتصف الفصل تُحسب غيابًا على
 * كل معلم في المدرسة، وتقيس التقارير الشهرية الجميع على أيام لم يُطلب من
 * أحد الحضور فيها.
 *
 * القسم مستقل بحفظه: صفحة الإعدادات نموذج واحد كبير، وإقحام مصفوفة متغيّرة
 * الطول في حالته المتّسخة يجعل زر الحفظ يضيء لأن أحدهم فتح القائمة فحسب.
 */

const failed = (response) => response?.status === false;

/** الصف بلا مفتاح الواجهة: ما يُقارَن ويُرسَل، لا ما تُرسَم به القائمة. */
const withoutKey = (row) => ({
  name: row.name,
  startDate: row.startDate,
  endDate: row.endDate,
});

/** صف جديد فارغ. التاريخ يبدأ اليوم لأن الإجازة تُضاف عادة قريبًا من وقتها. */
const blankRow = () => {
  const today = new Date().toISOString().slice(0, 10);
  return { key: `new-${Math.random().toString(36).slice(2)}`, name: "", startDate: today, endDate: today };
};

const toDateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

const readHolidays = (settings) => {
  const rows = Array.isArray(settings?.holidays) ? settings.holidays : [];

  return rows.map((holiday, index) => ({
    key: `saved-${index}`,
    name: String(holiday?.name || ""),
    startDate: toDateOnly(holiday?.startDate),
    // نهاية ناقصة تعني يومًا واحدًا، وهو ما يقصده من يضيف «اليوم الوطني».
    endDate: toDateOnly(holiday?.endDate) || toDateOnly(holiday?.startDate),
  }));
};

/** عدد الأيام التي تغلقها الإجازة، شاملًا الطرفين. */
const dayCount = (holiday) => {
  const from = new Date(`${holiday.startDate}T00:00:00.000Z`);
  const to = new Date(
    `${holiday.endDate || holiday.startDate}T00:00:00.000Z`
  );

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;

  return Math.floor(Math.abs(to - from) / 86400000) + 1;
};

const HolidaysSection = ({ canEdit = true }) => {
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const response = await fetchSchoolSettings();

    setLoading(false);

    if (failed(response)) {
      toast.error(response?.message || "تعذر تحميل الإجازات");
      return;
    }

    const settings = response?.data ?? response;
    const holidays = readHolidays(settings);

    setRows(holidays);
    setSaved(JSON.stringify(holidays.map(withoutKey)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cleaned = useMemo(
    () =>
      rows
        .map((row) => ({
          name: String(row.name || "").trim(),
          startDate: row.startDate,
          endDate: row.endDate || row.startDate,
        }))
        .filter((row) => row.name && row.startDate),
    [rows]
  );

  const dirty = useMemo(
    () =>
      JSON.stringify(rows.map(withoutKey)) !== saved,
    [rows, saved]
  );

  const totalDays = useMemo(
    () => cleaned.reduce((sum, row) => sum + dayCount(row), 0),
    [cleaned]
  );

  // صف بتاريخ نهاية قبل بدايته خطأ مطبعي لا نطاق فارغ، والخادم يقوّمه عند
  // الحفظ — لكن قوله هنا أفضل من اكتشافه في تقرير بعد شهر.
  const reversed = useMemo(
    () => cleaned.filter((row) => row.endDate < row.startDate),
    [cleaned]
  );

  const incomplete = useMemo(
    () =>
      rows.filter(
        (row) => !String(row.name || "").trim() || !row.startDate
      ).length,
    [rows]
  );

  const update = (key, field, value) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
              // نهاية قبل البداية تُسحب معها: أحدهم يغيّر البداية إلى شهر
              // لاحق وينسى النهاية، فيصير النطاق مقلوبًا في صمت.
              ...(field === "startDate" && row.endDate < value
                ? { endDate: value }
                : {}),
            }
          : row
      )
    );

  const save = async () => {
    setSaving(true);

    const response = await updateSchoolSettings({ holidays: cleaned });

    setSaving(false);

    if (failed(response)) {
      toast.error(response?.message || "تعذر حفظ الإجازات");
      return;
    }

    toast.success("تم حفظ الإجازات");
    load();
  };

  return (
    <Box sx={{ px: { xs: 1.4, md: 1.8 }, py: 1.6 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.2 }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <EventBusyRounded sx={{ color: "#B78430" }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: "#122F4D" }}>
              إجازات المدرسة
            </Typography>
            <Typography sx={{ color: "#708198", fontSize: 10 }}>
              أيام لا يعبّر عنها جدول الأسبوع — العيد، إجازة منتصف الفصل،
              اليوم الوطني.
            </Typography>
          </Box>
        </Stack>

        {!loading && cleaned.length > 0 ? (
          <Chip
            size="small"
            label={`${cleaned.length} إجازة · ${totalDays} يوم`}
            sx={{
              color: "#B78430",
              backgroundColor: "#FBF0D8",
              fontWeight: 800,
            }}
          />
        ) : null}
      </Stack>

      <Alert severity="info" sx={{ borderRadius: "12px", fontSize: 11, mb: 1.2 }}>
        اليوم المعلن إجازة لا يُحسب غيابًا على أحد، ولا يُحتسب ضمن أيام
        الدوام في التقرير الشهري، ولا يُطلب فيه تسجيل حضور.
      </Alert>

      {loading ? (
        <Box sx={{ minHeight: 120, display: "grid", placeItems: "center" }}>
          <CircularProgress size={22} />
        </Box>
      ) : (
        <Stack spacing={1}>
          {rows.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                textAlign: "center",
                borderRadius: "12px",
                border: "1px dashed rgba(36,74,112,.18)",
                color: "#708198",
                fontSize: 12,
              }}
            >
              لا توجد إجازات معلنة. كل أيام الدوام في جدول الأسبوع تُحتسب أيام
              عمل.
            </Paper>
          ) : (
            rows.map((row) => (
              <Paper
                key={row.key}
                elevation={0}
                sx={{
                  p: 1.2,
                  borderRadius: "12px",
                  border: "1px solid rgba(36,74,112,.12)",
                  backgroundColor: "#fff",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  gap={1}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <TextField
                    label="اسم الإجازة"
                    value={row.name}
                    onChange={(event) =>
                      update(row.key, "name", event.target.value)
                    }
                    disabled={!canEdit}
                    size="small"
                    fullWidth
                    inputProps={{ maxLength: 120 }}
                    placeholder="إجازة منتصف الفصل"
                  />

                  <TextField
                    type="date"
                    label="من"
                    value={row.startDate}
                    onChange={(event) =>
                      update(row.key, "startDate", event.target.value)
                    }
                    disabled={!canEdit}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ minWidth: { md: 165 } }}
                    fullWidth
                  />

                  <TextField
                    type="date"
                    label="إلى"
                    value={row.endDate}
                    onChange={(event) =>
                      update(row.key, "endDate", event.target.value)
                    }
                    disabled={!canEdit}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ minWidth: { md: 165 } }}
                    fullWidth
                    helperText={
                      row.startDate && row.endDate
                        ? `${dayCount(row)} يوم`
                        : "اتركه مساويًا للبداية ليوم واحد"
                    }
                  />

                  <IconButton
                    onClick={() =>
                      setRows((current) =>
                        current.filter((item) => item.key !== row.key)
                      )
                    }
                    disabled={!canEdit}
                    sx={{ color: "#C94F4F", alignSelf: "center" }}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </Stack>
              </Paper>
            ))
          )}

          {reversed.length > 0 ? (
            <Alert severity="warning" sx={{ borderRadius: "12px", fontSize: 11 }}>
              {`${reversed.length} إجازة تاريخ نهايتها قبل بدايتها. سيتم تصحيح الترتيب عند الحفظ.`}
            </Alert>
          ) : null}

          {incomplete > 0 ? (
            <Alert severity="warning" sx={{ borderRadius: "12px", fontSize: 11 }}>
              {`${incomplete} صف بلا اسم أو بلا تاريخ بداية، ولن يُحفظ.`}
            </Alert>
          ) : null}

          <Stack direction="row" gap={1} sx={{ pt: 0.4 }}>
            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={() => setRows((current) => [...current, blankRow()])}
              disabled={!canEdit}
              sx={{ borderRadius: "11px", fontWeight: 800 }}
            >
              إضافة إجازة
            </Button>

            <Button
              variant="contained"
              onClick={save}
              disabled={!canEdit || saving || !dirty}
              startIcon={
                saving ? <CircularProgress size={14} color="inherit" /> : null
              }
              sx={{
                borderRadius: "11px",
                fontWeight: 900,
                color: "#122F4D",
                backgroundColor: "#F2D792",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#E8C96F", boxShadow: "none" },
              }}
            >
              حفظ الإجازات
            </Button>
          </Stack>
        </Stack>
      )}

      <Divider sx={{ mt: 1.8, borderColor: "rgba(36,74,112,0.07)" }} />
    </Box>
  );
};

export default HolidaysSection;
